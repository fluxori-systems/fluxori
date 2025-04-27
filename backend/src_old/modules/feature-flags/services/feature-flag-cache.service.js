"use strict";
var __esDecorate =
  (this && this.__esDecorate) ||
  function (
    ctor,
    descriptorIn,
    decorators,
    contextIn,
    initializers,
    extraInitializers,
  ) {
    function accept(f) {
      if (f !== void 0 && typeof f !== "function")
        throw new TypeError("Function expected");
      return f;
    }
    var kind = contextIn.kind,
      key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target =
      !descriptorIn && ctor
        ? contextIn["static"]
          ? ctor
          : ctor.prototype
        : null;
    var descriptor =
      descriptorIn ||
      (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _,
      done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
      var context = {};
      for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
      for (var p in contextIn.access) context.access[p] = contextIn.access[p];
      context.addInitializer = function (f) {
        if (done)
          throw new TypeError(
            "Cannot add initializers after decoration has completed",
          );
        extraInitializers.push(accept(f || null));
      };
      var result = (0, decorators[i])(
        kind === "accessor"
          ? { get: descriptor.get, set: descriptor.set }
          : descriptor[key],
        context,
      );
      if (kind === "accessor") {
        if (result === void 0) continue;
        if (result === null || typeof result !== "object")
          throw new TypeError("Object expected");
        if ((_ = accept(result.get))) descriptor.get = _;
        if ((_ = accept(result.set))) descriptor.set = _;
        if ((_ = accept(result.init))) initializers.unshift(_);
      } else if ((_ = accept(result))) {
        if (kind === "field") initializers.unshift(_);
        else descriptor[key] = _;
      }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
  };
var __runInitializers =
  (this && this.__runInitializers) ||
  function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
      value = useValue
        ? initializers[i].call(thisArg, value)
        : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
  };
var __setFunctionName =
  (this && this.__setFunctionName) ||
  function (f, name, prefix) {
    if (typeof name === "symbol")
      name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", {
      configurable: true,
      value: prefix ? "".concat(prefix, " ", name) : name,
    });
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagCacheService = void 0;
var common_1 = require("@nestjs/common");
/**
 * Service for caching feature flag evaluation results to minimize database reads
 */
var FeatureFlagCacheService = (function () {
  var _classDecorators = [(0, common_1.Injectable)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var FeatureFlagCacheService = (_classThis = /** @class */ (function () {
    function FeatureFlagCacheService_1() {
      this.logger = new common_1.Logger(FeatureFlagCacheService.name);
      // Flag definitions cache
      this.flagCache = new Map();
      // Evaluation results cache with context hash
      this.evaluationCache = new Map();
      // Cache TTL in milliseconds (default: 60 seconds)
      this.cacheTTLMs = 60000;
    }
    FeatureFlagCacheService_1.prototype.onModuleInit = function () {
      var _this = this;
      this.logger.log("FeatureFlagCacheService initialized");
      // Set up periodic cleanup of expired cache entries
      setInterval(function () {
        _this.cleanupExpiredCache();
      }, this.cacheTTLMs / 2);
    };
    /**
     * Set the cache TTL
     */
    FeatureFlagCacheService_1.prototype.setCacheTTL = function (ttlMs) {
      this.cacheTTLMs = ttlMs;
    };
    /**
     * Set a flag in the cache
     */
    FeatureFlagCacheService_1.prototype.setFlag = function (flag) {
      this.flagCache.set(flag.key, flag);
      // Invalidate evaluation cache for this flag
      this.invalidateEvaluationCache(flag.key);
    };
    /**
     * Get a flag from the cache
     */
    FeatureFlagCacheService_1.prototype.getFlag = function (key) {
      return this.flagCache.get(key);
    };
    /**
     * Remove a flag from the cache
     */
    FeatureFlagCacheService_1.prototype.removeFlag = function (key) {
      this.flagCache.delete(key);
      // Invalidate evaluation cache for this flag
      this.invalidateEvaluationCache(key);
    };
    /**
     * Cache an evaluation result
     */
    FeatureFlagCacheService_1.prototype.setEvaluation = function (
      flagKey,
      context,
      result,
    ) {
      var cacheKey = this.createCacheKey(flagKey, context);
      this.evaluationCache.set(cacheKey, {
        result: result,
        timestamp: Date.now(),
      });
    };
    /**
     * Get a cached evaluation result
     */
    FeatureFlagCacheService_1.prototype.getEvaluation = function (
      flagKey,
      context,
    ) {
      var cacheKey = this.createCacheKey(flagKey, context);
      var cached = this.evaluationCache.get(cacheKey);
      if (!cached) return undefined;
      // Check if the cached result is still valid
      if (Date.now() - cached.timestamp > this.cacheTTLMs) {
        this.evaluationCache.delete(cacheKey);
        return undefined;
      }
      return cached.result;
    };
    /**
     * Check if all flags in the cache
     */
    FeatureFlagCacheService_1.prototype.areAllFlagsCached = function (keys) {
      var _this = this;
      return keys.every(function (key) {
        return _this.flagCache.has(key);
      });
    };
    /**
     * Get multiple flags from the cache
     */
    FeatureFlagCacheService_1.prototype.getFlags = function (keys) {
      var _this = this;
      return keys
        .filter(function (key) {
          return _this.flagCache.has(key);
        })
        .map(function (key) {
          return _this.flagCache.get(key);
        })
        .filter(function (flag) {
          return flag !== undefined;
        });
    };
    /**
     * Update the cache with multiple flags
     */
    FeatureFlagCacheService_1.prototype.updateCache = function (flags) {
      var _this = this;
      flags.forEach(function (flag) {
        _this.flagCache.set(flag.key, flag);
        _this.invalidateEvaluationCache(flag.key);
      });
    };
    /**
     * Clear the entire cache
     */
    FeatureFlagCacheService_1.prototype.clearCache = function () {
      this.flagCache.clear();
      this.evaluationCache.clear();
      this.logger.log("Feature flag cache cleared");
    };
    /**
     * Clean up expired cache entries
     */
    FeatureFlagCacheService_1.prototype.cleanupExpiredCache = function () {
      var _this = this;
      var now = Date.now();
      var expiredCount = { flags: 0, evaluations: 0 };
      // Clean up evaluation cache
      Array.from(this.evaluationCache.entries()).forEach(function (_a) {
        var key = _a[0],
          value = _a[1];
        if (now - value.timestamp > _this.cacheTTLMs) {
          _this.evaluationCache.delete(key);
          expiredCount.evaluations++;
        }
      });
      if (expiredCount.flags > 0 || expiredCount.evaluations > 0) {
        this.logger.debug(
          "Cleaned up ".concat(
            expiredCount.evaluations,
            " expired evaluation cache entries",
          ),
        );
      }
    };
    /**
     * Invalidate all evaluation cache entries for a specific flag
     */
    FeatureFlagCacheService_1.prototype.invalidateEvaluationCache = function (
      flagKey,
    ) {
      var _this = this;
      var keysToRemove = [];
      Array.from(this.evaluationCache.keys()).forEach(function (key) {
        if (key.startsWith("".concat(flagKey, ":"))) {
          keysToRemove.push(key);
        }
      });
      keysToRemove.forEach(function (key) {
        _this.evaluationCache.delete(key);
      });
      if (keysToRemove.length > 0) {
        this.logger.debug(
          "Invalidated "
            .concat(keysToRemove.length, " evaluation cache entries for flag ")
            .concat(flagKey),
        );
      }
    };
    /**
     * Create a cache key from flag key and context
     */
    FeatureFlagCacheService_1.prototype.createCacheKey = function (
      flagKey,
      context,
    ) {
      // Create a stable, deterministic hash of the context
      var contextString = JSON.stringify({
        userId: context.userId || "",
        userEmail: context.userEmail || "",
        userRole: context.userRole || "",
        organizationId: context.organizationId || "",
        organizationType: context.organizationType || "",
        environment: context.environment || "",
      });
      return "".concat(flagKey, ":").concat(this.hashString(contextString));
    };
    /**
     * Simple hash function for context strings
     */
    FeatureFlagCacheService_1.prototype.hashString = function (str) {
      var hash = 0;
      for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash.toString(16); // Convert to hex
    };
    return FeatureFlagCacheService_1;
  })());
  __setFunctionName(_classThis, "FeatureFlagCacheService");
  (function () {
    var _metadata =
      typeof Symbol === "function" && Symbol.metadata
        ? Object.create(null)
        : void 0;
    __esDecorate(
      null,
      (_classDescriptor = { value: _classThis }),
      _classDecorators,
      { kind: "class", name: _classThis.name, metadata: _metadata },
      null,
      _classExtraInitializers,
    );
    FeatureFlagCacheService = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (FeatureFlagCacheService = _classThis);
})();
exports.FeatureFlagCacheService = FeatureFlagCacheService;
