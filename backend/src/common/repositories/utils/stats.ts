/**
 * Repository statistics tracking
 * Provides utilities for tracking and reporting repository operations
 */

/**
 * Repository statistics interface
 */
export interface RepositoryStats {
  reads: number;
  writes: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  lastError?: Error;
  lastErrorTime?: Date;
}

/**
 * Create a new repository stats object
 */
export function createRepositoryStats(): RepositoryStats {
  return {
    reads: 0,
    writes: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0
  };
}

/**
 * Increment read count
 */
export function incrementReads(stats: RepositoryStats, count: number = 1): void {
  stats.reads += count;
}

/**
 * Increment write count
 */
export function incrementWrites(stats: RepositoryStats, count: number = 1): void {
  stats.writes += count;
}

/**
 * Increment cache hit count
 */
export function incrementCacheHits(stats: RepositoryStats, count: number = 1): void {
  stats.cacheHits += count;
}

/**
 * Increment cache miss count
 */
export function incrementCacheMisses(stats: RepositoryStats, count: number = 1): void {
  stats.cacheMisses += count;
}

/**
 * Record an error
 */
export function recordError(stats: RepositoryStats, error: Error): void {
  stats.errors += 1;
  stats.lastError = error;
  stats.lastErrorTime = new Date();
}

/**
 * Calculate cache hit ratio
 */
export function calculateCacheHitRatio(stats: RepositoryStats): number {
  const total = stats.cacheHits + stats.cacheMisses;
  if (total === 0) return 0;
  return stats.cacheHits / total;
}

/**
 * Get a snapshot of the current stats
 */
export function getStatsSnapshot(stats: RepositoryStats): RepositoryStats {
  return { ...stats };
}

/**
 * Reset statistics to zero
 */
export function resetStats(stats: RepositoryStats): void {
  stats.reads = 0;
  stats.writes = 0;
  stats.cacheHits = 0;
  stats.cacheMisses = 0;
  stats.errors = 0;
  delete stats.lastError;
  delete stats.lastErrorTime;
}