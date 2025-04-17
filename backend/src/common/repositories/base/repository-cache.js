"use strict";
/**
 * Repository cache implementation for Firestore repositories
 * Provides in-memory caching for repository operations
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
exports.RepositoryCache = exports.DEFAULT_CACHE_OPTIONS = void 0;
var common_1 = require("@nestjs/common");
/**
 * Default cache configuration
 */
exports.DEFAULT_CACHE_OPTIONS = {
    enabled: true,
    ttlMs: 300000, // 5 minutes
    maxItems: 1000, // Maximum items to store in cache
    logger: undefined,
};
/**
 * Repository cache implementation with TTL and eviction
 */
var RepositoryCache = /** @class */ (function () {
    function RepositoryCache(cacheOptions) {
        var _this = this;
        this.cache = new Map();
        this.lastCleanup = Date.now();
        this.CLEANUP_INTERVAL_MS = 60000; // 1 minute
        this.options = __assign(__assign({}, exports.DEFAULT_CACHE_OPTIONS), cacheOptions);
        this.logger = this.options.logger || new common_1.Logger("RepositoryCache");
        // Periodically clean expired entries
        if (this.options.enabled) {
            setInterval(function () { return _this.cleanupExpiredEntries(); }, this.CLEANUP_INTERVAL_MS);
        }
    }
    /**
     * Get a value from the cache
     */
    RepositoryCache.prototype.get = function (key) {
        if (!this.options.enabled)
            return undefined;
        var entry = this.cache.get(key);
        if (!entry)
            return undefined;
        // Check if entry has expired
        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return undefined;
        }
        // Update last accessed time and return value
        entry.lastAccessed = Date.now();
        return entry.data;
    };
    /**
     * Set a value in the cache
     */
    RepositoryCache.prototype.set = function (key, value) {
        if (!this.options.enabled)
            return;
        // Evict items if we've reached capacity
        if (this.cache.size >= this.options.maxItems) {
            this.evictLeastRecentlyUsed();
        }
        // Calculate expiration time
        var expires = Date.now() + this.options.ttlMs;
        // Create cache entry
        var entry = {
            data: value,
            expires: expires,
            lastAccessed: Date.now(),
        };
        this.cache.set(key, entry);
        // Run cleanup if it's been a while
        if (Date.now() - this.lastCleanup > this.CLEANUP_INTERVAL_MS) {
            this.cleanupExpiredEntries();
        }
    };
    /**
     * Check if key exists in cache
     */
    RepositoryCache.prototype.has = function (key) {
        if (!this.options.enabled)
            return false;
        var entry = this.cache.get(key);
        if (!entry)
            return false;
        // Check if entry has expired
        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return false;
        }
        return true;
    };
    /**
     * Delete a value from the cache
     */
    RepositoryCache.prototype.delete = function (key) {
        if (!this.options.enabled)
            return false;
        return this.cache.delete(key);
    };
    /**
     * Invalidate a value from the cache (alias for delete)
     */
    RepositoryCache.prototype.invalidate = function (key) {
        return this.delete(key);
    };
    /**
     * Clear the entire cache
     */
    RepositoryCache.prototype.clear = function () {
        if (!this.options.enabled)
            return;
        this.cache.clear();
    };
    /**
     * Get the current size of the cache
     */
    RepositoryCache.prototype.size = function () {
        return this.cache.size;
    };
    /**
     * Evict least recently used items from the cache
     * @private
     */
    RepositoryCache.prototype.evictLeastRecentlyUsed = function () {
        if (this.cache.size === 0)
            return;
        var oldestKey = null;
        var oldestTime = Infinity;
        // Find the least recently used entry
        Array.from(this.cache.entries()).forEach(function (_a) {
            var key = _a[0], entry = _a[1];
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        });
        // Delete the oldest entry
        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    };
    /**
     * Clean up expired entries
     * @private
     */
    RepositoryCache.prototype.cleanupExpiredEntries = function () {
        var _this = this;
        var now = Date.now();
        this.lastCleanup = now;
        var expiredCount = 0;
        // Remove expired entries
        Array.from(this.cache.entries()).forEach(function (_a) {
            var key = _a[0], entry = _a[1];
            if (now > entry.expires) {
                _this.cache.delete(key);
                expiredCount++;
            }
        });
        if (expiredCount > 0) {
            this.logger.debug("Removed ".concat(expiredCount, " expired cache entries. Cache size: ").concat(this.cache.size));
        }
    };
    return RepositoryCache;
}());
exports.RepositoryCache = RepositoryCache;
