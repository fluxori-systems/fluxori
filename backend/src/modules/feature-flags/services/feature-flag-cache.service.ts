import { Injectable, Logger, OnModuleInit } from "@nestjs/common";

import {
  FeatureFlag,
  FlagEvaluationContext,
  FlagEvaluationResult,
} from "../interfaces/types";

/**
 * Service for caching feature flag evaluation results to minimize database reads
 */
@Injectable()
export class FeatureFlagCacheService implements OnModuleInit {
  private readonly logger = new Logger(FeatureFlagCacheService.name);

  // Flag definitions cache
  private flagCache: Map<string, FeatureFlag> = new Map();

  // Evaluation results cache with context hash
  private evaluationCache: Map<
    string,
    {
      result: FlagEvaluationResult;
      timestamp: number;
    }
  > = new Map();

  // Cache TTL in milliseconds (default: 60 seconds)
  private cacheTTLMs = 60000;

  constructor() {}

  onModuleInit() {
    this.logger.log("FeatureFlagCacheService initialized");

    // Set up periodic cleanup of expired cache entries
    setInterval(() => {
      this.cleanupExpiredCache();
    }, this.cacheTTLMs / 2);
  }

  /**
   * Set the cache TTL
   */
  setCacheTTL(ttlMs: number): void {
    this.cacheTTLMs = ttlMs;
  }

  /**
   * Set a flag in the cache
   */
  setFlag(flag: FeatureFlag): void {
    this.flagCache.set(flag.key, flag);

    // Invalidate evaluation cache for this flag
    this.invalidateEvaluationCache(flag.key);
  }

  /**
   * Get a flag from the cache
   */
  getFlag(key: string): FeatureFlag | undefined {
    return this.flagCache.get(key);
  }

  /**
   * Remove a flag from the cache
   */
  removeFlag(key: string): void {
    this.flagCache.delete(key);

    // Invalidate evaluation cache for this flag
    this.invalidateEvaluationCache(key);
  }

  /**
   * Cache an evaluation result
   */
  setEvaluation(
    flagKey: string,
    context: FlagEvaluationContext,
    result: FlagEvaluationResult,
  ): void {
    const cacheKey = this.createCacheKey(flagKey, context);
    this.evaluationCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Get a cached evaluation result
   */
  getEvaluation(
    flagKey: string,
    context: FlagEvaluationContext,
  ): FlagEvaluationResult | undefined {
    const cacheKey = this.createCacheKey(flagKey, context);
    const cached = this.evaluationCache.get(cacheKey);

    if (!cached) return undefined;

    // Check if the cached result is still valid
    if (Date.now() - cached.timestamp > this.cacheTTLMs) {
      this.evaluationCache.delete(cacheKey);
      return undefined;
    }

    return cached.result;
  }

  /**
   * Check if all flags in the cache
   */
  areAllFlagsCached(keys: string[]): boolean {
    return keys.every((key) => this.flagCache.has(key));
  }

  /**
   * Get multiple flags from the cache
   */
  getFlags(keys: string[]): FeatureFlag[] {
    return keys
      .filter((key) => this.flagCache.has(key))
      .map((key) => this.flagCache.get(key)!)
      .filter((flag): flag is FeatureFlag => flag !== undefined);
  }

  /**
   * Update the cache with multiple flags
   */
  updateCache(flags: FeatureFlag[]): void {
    flags.forEach((flag) => {
      this.flagCache.set(flag.key, flag);
      this.invalidateEvaluationCache(flag.key);
    });
  }

  /**
   * Clear the entire cache
   */
  clearCache(): void {
    this.flagCache.clear();
    this.evaluationCache.clear();
    this.logger.log("Feature flag cache cleared");
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    const expiredCount = { flags: 0, evaluations: 0 };

    // Clean up evaluation cache
    Array.from(this.evaluationCache.entries()).forEach(([key, value]) => {
      if (now - value.timestamp > this.cacheTTLMs) {
        this.evaluationCache.delete(key);
        expiredCount.evaluations++;
      }
    });

    if (expiredCount.flags > 0 || expiredCount.evaluations > 0) {
      this.logger.debug(
        `Cleaned up ${expiredCount.evaluations} expired evaluation cache entries`,
      );
    }
  }

  /**
   * Invalidate all evaluation cache entries for a specific flag
   */
  private invalidateEvaluationCache(flagKey: string): void {
    const keysToRemove: string[] = [];

    Array.from(this.evaluationCache.keys()).forEach((key) => {
      if (key.startsWith(`${flagKey}:`)) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach((key) => {
      this.evaluationCache.delete(key);
    });

    if (keysToRemove.length > 0) {
      this.logger.debug(
        `Invalidated ${keysToRemove.length} evaluation cache entries for flag ${flagKey}`,
      );
    }
  }

  /**
   * Create a cache key from flag key and context
   */
  private createCacheKey(
    flagKey: string,
    context: FlagEvaluationContext,
  ): string {
    // Create a stable, deterministic hash of the context
    const contextString = JSON.stringify({
      userId: context.userId || "",
      userEmail: context.userEmail || "",
      userRole: context.userRole || "",
      organizationId: context.organizationId || "",
      organizationType: context.organizationType || "",
      environment: context.environment || "",
    });

    return `${flagKey}:${this.hashString(contextString)}`;
  }

  /**
   * Simple hash function for context strings
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16); // Convert to hex
  }
}
