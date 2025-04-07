/**
 * Repository Cache
 * 
 * Provides in-memory caching capabilities for Firestore repositories
 */

import { Logger } from '@nestjs/common';
import { FirestoreEntity } from '../../../types/google-cloud.types';
import { RepoCacheEntry } from './repository-types';

/**
 * Repository cache for improved read performance
 */
export class RepositoryCache<T extends FirestoreEntity> {
  private cache: Map<string, RepoCacheEntry<T>> | null = null;
  private readonly logger: Logger;
  private readonly collectionName: string;
  private readonly maxCacheItems: number;
  private readonly cacheTTLMs: number;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // Cache statistics
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private cleanups = 0;
  
  /**
   * Create a new cache instance
   * @param collectionName Collection name for logging
   * @param options Cache configuration options
   */
  constructor(
    collectionName: string,
    options: {
      enabled?: boolean;
      maxItems?: number;
      ttlMs?: number;
      logger?: Logger;
    } = {}
  ) {
    this.collectionName = collectionName;
    this.logger = options.logger || new Logger('RepositoryCache');
    this.maxCacheItems = options.maxItems || 1000;
    this.cacheTTLMs = options.ttlMs || 0;
    
    // Initialize cache if enabled
    if (options.enabled && this.cacheTTLMs > 0) {
      this.cache = new Map();
      
      // Set up automatic cleanup every 5 minutes
      this.cleanupInterval = setInterval(() => this.cleanupExpiredCache(), 5 * 60 * 1000);
      this.logger.debug(`Cache initialized for ${collectionName} with TTL: ${this.cacheTTLMs}ms`);
    }
  }
  
  /**
   * Check if the cache is enabled
   */
  isEnabled(): boolean {
    return this.cache !== null;
  }
  
  /**
   * Get an item from cache
   * @param id Document ID
   * @returns Cached item or null if not found or expired
   */
  get(id: string): T | null {
    if (!this.cache) return null;
    
    const cacheKey = `${this.collectionName}:${id}`;
    const cached = this.cache.get(cacheKey);
    
    // Return from cache if valid and not expired
    if (cached && cached.expires > Date.now()) {
      this.hits++;
      this.logger.debug(`Cache hit for document ${id} in ${this.collectionName}`);
      
      // Update last accessed time for LRU tracking
      cached.lastAccessed = Date.now();
      this.cache.set(cacheKey, cached);
      
      return cached.data;
    }
    
    // Cache miss or expired
    if (cached) {
      // Remove expired item
      this.cache.delete(cacheKey);
    }
    
    this.misses++;
    return null;
  }
  
  /**
   * Store an item in cache
   * @param id Document ID
   * @param data Document data
   * @returns True if item was cached
   */
  set(id: string, data: T): boolean {
    if (!this.cache || this.cacheTTLMs <= 0) return false;
    
    const cacheKey = `${this.collectionName}:${id}`;
    
    // Implement cache eviction if we've reached max capacity
    if (this.cache.size >= this.maxCacheItems) {
      this.evictLeastRecentlyUsed();
    }
    
    this.cache.set(cacheKey, {
      data,
      expires: Date.now() + this.cacheTTLMs,
      lastAccessed: Date.now()
    });
    
    return true;
  }
  
  /**
   * Remove an item from cache
   * @param id Document ID
   * @returns True if item was removed
   */
  delete(id: string): boolean {
    if (!this.cache) return false;
    
    const cacheKey = `${this.collectionName}:${id}`;
    return this.cache.delete(cacheKey);
  }
  
  /**
   * Clean up expired cache entries
   * @returns Number of entries removed
   */
  cleanupExpiredCache(): number {
    if (!this.cache) return 0;
    
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires <= now) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.cleanups++;
      this.logger.debug(`Removed ${removedCount} expired items from cache for ${this.collectionName}`);
    }
    
    return removedCount;
  }
  
  /**
   * Evict least recently used cache entries
   * @param count Number of entries to evict (default: 1/10 of max)
   * @returns Number of entries evicted
   */
  private evictLeastRecentlyUsed(count?: number): number {
    if (!this.cache) return 0;
    
    // Default to evicting 10% of max cache size
    const toEvict = count || Math.max(1, Math.floor(this.maxCacheItems / 10));
    
    // Sort entries by lastAccessed timestamp (oldest first)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
      .slice(0, toEvict);
    
    // Remove the selected entries
    for (const [key] of entries) {
      this.cache.delete(key);
    }
    
    this.evictions += entries.length;
    this.logger.debug(`Evicted ${entries.length} items from cache for ${this.collectionName}`);
    return entries.length;
  }
  
  /**
   * Delete multiple items from cache
   * @param ids Array of document IDs to delete
   * @returns Number of entries deleted
   */
  deleteBatch(ids: string[]): number {
    if (!this.cache) return 0;
    
    let deletedCount = 0;
    for (const id of ids) {
      const cacheKey = `${this.collectionName}:${id}`;
      if (this.cache.delete(cacheKey)) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  }
  
  /**
   * Clear all cache entries
   * @returns Number of entries cleared
   */
  clear(): number {
    if (!this.cache) return 0;
    
    const size = this.cache.size;
    this.cache.clear();
    return size;
  }
  
  /**
   * Get cache statistics
   */
  getStats(): {
    enabled: boolean;
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
    cleanups: number;
    ttlMs: number;
  } {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests === 0 ? 0 : this.hits / totalRequests;
    
    return {
      enabled: this.isEnabled(),
      size: this.cache?.size || 0,
      maxSize: this.maxCacheItems,
      hits: this.hits,
      misses: this.misses,
      hitRate,
      evictions: this.evictions,
      cleanups: this.cleanups,
      ttlMs: this.cacheTTLMs
    };
  }
  
  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.cleanups = 0;
  }
  
  /**
   * Clean up resources when the cache is no longer needed
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.cache) {
      this.cache.clear();
      this.cache = null;
    }
  }
}
