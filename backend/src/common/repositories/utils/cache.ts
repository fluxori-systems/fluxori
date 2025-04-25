/**
 * Repository cache implementation for Firestore repositories
 * Provides in-memory caching for repository operations
 */

import { Logger } from '@nestjs/common';

import { FirestoreEntity } from '../../../types/google-cloud.types';
import { RepoCacheEntry } from '../types';

/**
 * Cache options interface
 */
export interface CacheOptions {
  enabled: boolean;
  ttlMs: number;
  maxItems: number;
  logger?: any;
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  enabled: true,
  ttlMs: 300000, // 5 minutes
  maxItems: 1000, // Maximum items to store in cache
  logger: undefined,
};

/**
 * Repository cache implementation with TTL and eviction
 */
export class RepositoryCache<T extends FirestoreEntity> {
  private cache: Map<string, RepoCacheEntry<T>> = new Map();
  private options: CacheOptions;
  private logger: Logger;
  private lastCleanup: number = Date.now();
  private readonly CLEANUP_INTERVAL_MS = 60000; // 1 minute

  constructor(cacheOptions?: Partial<CacheOptions>) {
    this.options = { ...DEFAULT_CACHE_OPTIONS, ...cacheOptions };

    this.logger = this.options.logger || new Logger('RepositoryCache');

    // Periodically clean expired entries
    if (this.options.enabled) {
      setInterval(() => this.cleanupExpiredEntries(), this.CLEANUP_INTERVAL_MS);
    }
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | undefined {
    if (!this.options.enabled) return undefined;

    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if entry has expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }

    // Update last accessed time and return value
    entry.lastAccessed = Date.now();
    return entry.data;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T): void {
    if (!this.options.enabled) return;

    // Evict items if we've reached capacity
    if (this.cache.size >= this.options.maxItems) {
      this.evictLeastRecentlyUsed();
    }

    // Calculate expiration time
    const expires = Date.now() + this.options.ttlMs;

    // Create cache entry
    const entry: RepoCacheEntry<T> = {
      data: value,
      expires,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);

    // Run cleanup if it's been a while
    if (Date.now() - this.lastCleanup > this.CLEANUP_INTERVAL_MS) {
      this.cleanupExpiredEntries();
    }
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    if (!this.options.enabled) return false;

    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if entry has expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a value from the cache
   */
  delete(key: string): boolean {
    if (!this.options.enabled) return false;
    return this.cache.delete(key);
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    if (!this.options.enabled) return;
    this.cache.clear();
  }

  /**
   * Get the current size of the cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Evict least recently used items from the cache
   * @private
   */
  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) return;

    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    // Find the least recently used entry
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    });

    // Delete the oldest entry
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean up expired entries
   * @private
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    this.lastCleanup = now;

    let expiredCount = 0;

    // Remove expired entries
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now > entry.expires) {
        this.cache.delete(key);
        expiredCount++;
      }
    });

    if (expiredCount > 0) {
      this.logger.debug(
        `Removed ${expiredCount} expired cache entries. Cache size: ${this.cache.size}`,
      );
    }
  }
}
