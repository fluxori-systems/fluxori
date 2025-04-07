/**
 * Repository Statistics
 * 
 * Provides monitoring capabilities for Firestore repositories
 */

import { RepositoryStats } from './repository-types';

/**
 * Repository statistics for performance monitoring
 */
export class RepositoryMonitor {
  private stats = {
    totalReads: 0,
    totalWrites: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    lastError: null as Error | null,
    startTime: Date.now()
  };
  
  /**
   * Create a new repository monitor
   * @param collectionName Collection name for reporting
   */
  constructor(private readonly collectionName: string) {}
  
  /**
   * Get repository statistics for monitoring
   * @returns Repository statistics object
   */
  getStats(): RepositoryStats {
    const totalCacheAttempts = this.stats.cacheHits + this.stats.cacheMisses;
    const cacheHitRate = totalCacheAttempts > 0 
      ? Math.round((this.stats.cacheHits / totalCacheAttempts) * 100) / 100
      : 0;
    
    const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
    
    return {
      reads: this.stats.totalReads,
      writes: this.stats.totalWrites,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      errors: this.stats.errors,
      lastError: this.stats.lastError || undefined,
      lastErrorTime: this.stats.lastError ? new Date() : undefined
    };
  }
  
  /**
   * Reset repository statistics
   */
  resetStats(): void {
    this.stats = {
      totalReads: 0,
      totalWrites: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      lastError: null,
      startTime: Date.now()
    };
  }
  
  /**
   * Track a read operation
   */
  trackRead(): void {
    this.stats.totalReads++;
  }
  
  /**
   * Track a write operation
   */
  trackWrite(): void {
    this.stats.totalWrites++;
  }
  
  /**
   * Track a cache hit
   */
  trackCacheHit(): void {
    this.stats.cacheHits++;
  }
  
  /**
   * Track a cache miss
   */
  trackCacheMiss(): void {
    this.stats.cacheMisses++;
  }
  
  /**
   * Track an error
   * @param error The error that occurred
   */
  trackError(error: Error): void {
    this.stats.errors++;
    this.stats.lastError = error;
  }
}
