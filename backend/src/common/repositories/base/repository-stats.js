"use strict";
/**
 * Repository statistics for tracking repository operations
 * This file provides statistics tracking for repository performance monitoring
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRepositoryStats = createRepositoryStats;
exports.incrementReads = incrementReads;
exports.incrementWrites = incrementWrites;
exports.incrementCacheHits = incrementCacheHits;
exports.incrementCacheMisses = incrementCacheMisses;
exports.recordError = recordError;
exports.getStatsSnapshot = getStatsSnapshot;
exports.resetStats = resetStats;
exports.calculateCacheHitRatio = calculateCacheHitRatio;
/**
 * Create a new stats tracker for repository operations
 */
function createRepositoryStats() {
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
function incrementReads(stats, count) {
    if (count === void 0) { count = 1; }
    stats.reads += count;
}
/**
 * Increment write count
 */
function incrementWrites(stats, count) {
    if (count === void 0) { count = 1; }
    stats.writes += count;
}
/**
 * Increment cache hit count
 */
function incrementCacheHits(stats, count) {
    if (count === void 0) { count = 1; }
    stats.cacheHits += count;
}
/**
 * Increment cache miss count
 */
function incrementCacheMisses(stats, count) {
    if (count === void 0) { count = 1; }
    stats.cacheMisses += count;
}
/**
 * Record an error in the stats
 */
function recordError(stats, error) {
    stats.errors += 1;
    stats.lastError = error;
    stats.lastErrorTime = new Date();
}
/**
 * Get a snapshot of current statistics
 */
function getStatsSnapshot(stats) {
    return __assign({}, stats);
}
/**
 * Reset statistics (for testing purposes)
 */
function resetStats(stats) {
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
function calculateCacheHitRatio(stats) {
    var totalCacheOperations = stats.cacheHits + stats.cacheMisses;
    if (totalCacheOperations === 0) {
        return 0;
    }
    return stats.cacheHits / totalCacheOperations;
}
