/**
 * Repository statistics for tracking repository operations
 */
export interface RepositoryStats {
  reads: number;
  writes: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  lastError?: any;
  lastErrorTime?: Date;
}

/**
 * Create a new stats tracker for repository operations
 */
export function createRepositoryStats(): RepositoryStats {
  return { reads: 0, writes: 0, cacheHits: 0, cacheMisses: 0, errors: 0 };
}

export function incrementReads(stats: RepositoryStats, count = 1): void {
  stats.reads += count;
}

export function incrementWrites(stats: RepositoryStats, count = 1): void {
  stats.writes += count;
}

export function incrementCacheHits(stats: RepositoryStats, count = 1): void {
  stats.cacheHits += count;
}

export function incrementCacheMisses(stats: RepositoryStats, count = 1): void {
  stats.cacheMisses += count;
}

export function recordError(stats: RepositoryStats, error: any): void {
  stats.errors += 1;
  stats.lastError = error;
  stats.lastErrorTime = new Date();
}

export function getStatsSnapshot(stats: RepositoryStats): RepositoryStats {
  return { ...stats };
}

export function resetStats(stats: RepositoryStats): void {
  stats.reads = 0;
  stats.writes = 0;
  stats.cacheHits = 0;
  stats.cacheMisses = 0;
  stats.errors = 0;
  delete stats.lastError;
  delete stats.lastErrorTime;
}

export function calculateCacheHitRatio(stats: RepositoryStats): number {
  const total = stats.cacheHits + stats.cacheMisses;
  return total === 0 ? 0 : stats.cacheHits / total;
}
