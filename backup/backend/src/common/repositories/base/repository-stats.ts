/**
 * Repository statistics for tracking repository operations
 * This file provides statistics tracking for repository performance monitoring
 */

// Define RepositoryStats interface directly here instead of importing
// to avoid circular dependency
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
 * Create a new stats tracker for repository operations
 */
export function createRepositoryStats(): RepositoryStats {
  return {
    reads: 0,
    writes: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
  };
}

/**
 * Increment read count
 */
export function incrementReads(
  stats: RepositoryStats,
  count: number = 1,
): void {
  stats.reads += count;
}

/**
 * Increment write count
 */
export function incrementWrites(
  stats: RepositoryStats,
  count: number = 1,
): void {
  stats.writes += count;
}

/**
 * Increment cache hit count
 */
export function incrementCacheHits(
  stats: RepositoryStats,
  count: number = 1,
): void {
  stats.cacheHits += count;
}

/**
 * Increment cache miss count
 */
export function incrementCacheMisses(
  stats: RepositoryStats,
  count: number = 1,
): void {
  stats.cacheMisses += count;
}

/**
 * Record an error in the stats
 */
export function recordError(stats: RepositoryStats, error: Error): void {
  stats.errors += 1;
  stats.lastError = error;
  stats.lastErrorTime = new Date();
}

/**
 * Get a snapshot of current statistics
 */
export function getStatsSnapshot(
  stats: RepositoryStats,
): Readonly<RepositoryStats> {
  return { ...stats };
}

/**
 * Reset statistics (for testing purposes)
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

/**
 * Calculate cache hit ratio
 */
export function calculateCacheHitRatio(stats: RepositoryStats): number {
  const totalCacheOperations = stats.cacheHits + stats.cacheMisses;
  if (totalCacheOperations === 0) {
    return 0;
  }
  return stats.cacheHits / totalCacheOperations;
}
