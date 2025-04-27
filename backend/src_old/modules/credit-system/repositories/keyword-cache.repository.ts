import { Injectable } from "@nestjs/common";
import { FirestoreBaseRepository } from "@common/repositories";
import { FirestoreConfigService } from "../../../config/firestore.config";
import { FirestoreEntity } from "../../../types/google-cloud.types";

/**
 * Keyword cache entity stored in Firestore
 */
interface KeywordCache extends FirestoreEntity {
  keyword: string;
  marketplace: string;
  resultId: string;
  createdAt: Date;
  expiresAt: Date;
  refreshedAt?: Date;
  hitCount: number;
  cacheType: "hot" | "warm" | "cold"; // Cache temperature classification
  lastHitAt?: Date;
  searchVolume?: number;
  metadata?: Record<string, any>;
}

/**
 * Repository for keyword cache tracking
 */
@Injectable()
export class KeywordCacheRepository extends FirestoreBaseRepository<KeywordCache> {
  protected readonly collectionName = "keyword_cache";

  // Cache durations in milliseconds
  private readonly HOT_CACHE_TTL = 2 * 24 * 60 * 60 * 1000; // 2 days
  private readonly WARM_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly COLD_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

  // Hit thresholds for cache temperature
  private readonly HOT_CACHE_THRESHOLD = 10; // 10+ hits = hot cache
  private readonly WARM_CACHE_THRESHOLD = 3; // 3+ hits = warm cache

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, "keyword_cache", {
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 5 * 60 * 1000, // 5 minutes
      requiredFields: [
        "keyword",
        "marketplace",
        "resultId",
        "createdAt",
        "expiresAt",
        "hitCount",
        "cacheType",
      ],
    });
  }

  /**
   * Find keyword in cache
   * @param keyword Keyword
   * @param marketplace Marketplace
   * @returns Cache entry or null if not found or expired
   */
  async findInCache(
    keyword: string,
    marketplace: string,
  ): Promise<KeywordCache | null> {
    const now = new Date();

    const results = await this.find({
      filter: {
        keyword,
        marketplace,
      } as Partial<KeywordCache>,
      queryOptions: {
        orderBy: "createdAt",
        direction: "desc",
        limit: 1,
      },
    });

    // Return if found and not expired
    if (results.length > 0) {
      const cacheEntry = results[0];

      // Check if not expired
      const expiresAt =
        cacheEntry.expiresAt instanceof Date
          ? cacheEntry.expiresAt
          : new Date(cacheEntry.expiresAt);

      if (expiresAt > now) {
        return cacheEntry;
      }
    }

    return null;
  }

  /**
   * Create new cache entry or update existing
   * @param keyword Keyword
   * @param marketplace Marketplace
   * @param resultId Result ID
   * @param searchVolume Optional search volume for hit tracking
   * @returns Created or updated cache entry
   */
  async createOrUpdateCache(
    keyword: string,
    marketplace: string,
    resultId: string,
    searchVolume?: number,
  ): Promise<KeywordCache> {
    // Check if entry exists
    const existing = await this.findInCache(keyword, marketplace);

    if (existing) {
      // Update hit count
      const hitCount = existing.hitCount + 1;

      // Determine new cache type based on hit count
      let cacheType = existing.cacheType;
      if (hitCount >= this.HOT_CACHE_THRESHOLD) {
        cacheType = "hot";
      } else if (hitCount >= this.WARM_CACHE_THRESHOLD) {
        cacheType = "warm";
      }

      // Update expiration based on cache type
      const now = new Date();
      let ttl: number;

      switch (cacheType) {
        case "hot":
          ttl = this.HOT_CACHE_TTL;
          break;
        case "warm":
          ttl = this.WARM_CACHE_TTL;
          break;
        default:
          ttl = this.COLD_CACHE_TTL;
      }

      const expiresAt = new Date(now.getTime() + ttl);

      // Update cache entry
      return this.update(existing.id, {
        resultId, // Update to latest result ID
        hitCount,
        cacheType,
        refreshedAt: now,
        lastHitAt: now,
        expiresAt,
        searchVolume: searchVolume || existing.searchVolume,
      });
    } else {
      // Create new cache entry
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.COLD_CACHE_TTL);

      return this.create({
        keyword,
        marketplace,
        resultId,
        createdAt: now,
        expiresAt,
        hitCount: 1,
        cacheType: "cold", // Start as cold cache
        lastHitAt: now,
        searchVolume,
      });
    }
  }

  /**
   * Record cache hit
   * @param cacheId Cache entry ID
   * @returns Updated cache entry
   */
  async recordHit(cacheId: string): Promise<KeywordCache> {
    const cacheEntry = await this.findById(cacheId);

    if (!cacheEntry) {
      throw new Error(`Cache entry not found: ${cacheId}`);
    }

    // Update hit count
    const hitCount = cacheEntry.hitCount + 1;

    // Determine new cache type based on hit count
    let cacheType = cacheEntry.cacheType;
    if (hitCount >= this.HOT_CACHE_THRESHOLD) {
      cacheType = "hot";
    } else if (hitCount >= this.WARM_CACHE_THRESHOLD) {
      cacheType = "warm";
    }

    // Update expiration based on cache type
    const now = new Date();
    let ttl: number;

    switch (cacheType) {
      case "hot":
        ttl = this.HOT_CACHE_TTL;
        break;
      case "warm":
        ttl = this.WARM_CACHE_TTL;
        break;
      default:
        ttl = this.COLD_CACHE_TTL;
    }

    const expiresAt = new Date(now.getTime() + ttl);

    // Update cache entry
    return this.update(cacheId, {
      hitCount,
      cacheType,
      lastHitAt: now,
      expiresAt,
    });
  }

  /**
   * Find keywords to preemptively refresh
   * @param limit Maximum number of entries to return
   * @returns Array of cache entries to refresh
   */
  async findKeywordsToRefresh(limit: number = 10): Promise<KeywordCache[]> {
    const now = new Date();

    // Find hot and warm cache entries nearing expiration
    // Refresh when 75% of the way to expiration
    const results = await this.find({
      filter: {
        cacheType: { $in: ["hot", "warm"] } as any,
      } as Partial<KeywordCache>,
    });

    // Filter those nearing expiration
    const nearingExpiration = results.filter((entry) => {
      const expiresAt =
        entry.expiresAt instanceof Date
          ? entry.expiresAt
          : new Date(entry.expiresAt);

      const createdAt =
        entry.createdAt instanceof Date
          ? entry.createdAt
          : new Date(entry.createdAt);

      const totalTTL = expiresAt.getTime() - createdAt.getTime();
      const elapsed = now.getTime() - createdAt.getTime();
      const percentElapsed = elapsed / totalTTL;

      // Refresh if more than 75% of TTL has elapsed
      return percentElapsed > 0.75 && expiresAt > now;
    });

    // Sort by hit count (most popular first)
    nearingExpiration.sort((a, b) => b.hitCount - a.hitCount);

    return nearingExpiration.slice(0, limit);
  }

  /**
   * Find popular keywords based on hit count
   * @param marketplace Marketplace
   * @param limit Maximum number of entries to return
   * @returns Array of popular keyword cache entries
   */
  async findPopularKeywords(
    marketplace: string,
    limit: number = 20,
  ): Promise<KeywordCache[]> {
    const results = await this.find({
      filter: {
        marketplace,
        cacheType: { $in: ["hot", "warm"] } as any,
      } as Partial<KeywordCache>,
      queryOptions: {
        orderBy: "hitCount",
        direction: "desc",
        limit,
      },
    });

    return results;
  }

  /**
   * Cleanup expired cache entries
   * @returns Number of deleted entries
   */
  async cleanupExpiredEntries(): Promise<number> {
    const now = new Date();

    // Find expired entries
    const results = await this.find({
      filter: {
        expiresAt: { $lt: now } as any,
      } as Partial<KeywordCache>,
    });

    // Delete expired entries
    let deletedCount = 0;
    for (const entry of results) {
      await this.delete(entry.id);
      deletedCount++;
    }

    return deletedCount;
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    hotEntries: number;
    warmEntries: number;
    coldEntries: number;
    hitRate: number;
    averageHitCount: number;
    popularKeywords: {
      keyword: string;
      marketplace: string;
      hitCount: number;
    }[];
  }> {
    // Get all cache entries
    const entries = await this.find({});

    // Calculate stats
    const hotEntries = entries.filter(
      (entry) => entry.cacheType === "hot",
    ).length;
    const warmEntries = entries.filter(
      (entry) => entry.cacheType === "warm",
    ).length;
    const coldEntries = entries.filter(
      (entry) => entry.cacheType === "cold",
    ).length;

    // Calculate hit metrics
    const totalHits = entries.reduce((sum, entry) => sum + entry.hitCount, 0);
    const averageHitCount = entries.length > 0 ? totalHits / entries.length : 0;

    // Estimate cache hit rate (based on hit count vs entry count)
    const hitRate =
      entries.length > 0 ? (totalHits - entries.length) / totalHits : 0;

    // Get popular keywords
    const sortedByHits = [...entries].sort((a, b) => b.hitCount - a.hitCount);
    const popularKeywords = sortedByHits.slice(0, 10).map((entry) => ({
      keyword: entry.keyword,
      marketplace: entry.marketplace,
      hitCount: entry.hitCount,
    }));

    return {
      totalEntries: entries.length,
      hotEntries,
      warmEntries,
      coldEntries,
      hitRate,
      averageHitCount,
      popularKeywords,
    };
  }
}
