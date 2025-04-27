import { Injectable } from "@nestjs/common";
import { FirestoreBaseRepository } from "@common/repositories";
import { FirestoreConfigService } from "../../../config/firestore.config";
import { KeywordResearchResult } from "../interfaces/types";

/**
 * Repository for keyword research results
 */
@Injectable()
export class KeywordResearchResultRepository extends FirestoreBaseRepository<KeywordResearchResult> {
  protected readonly collectionName = "keyword_research_results";

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, "keyword_research_results", {
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 15 * 60 * 1000, // 15 minutes
      requiredFields: [
        "requestId",
        "organizationId",
        "keyword",
        "marketplace",
        "rankingData",
      ],
    });
  }

  /**
   * Find results by organization ID
   * @param organizationId Organization ID
   * @param limit Maximum number of results to return
   * @returns Array of keyword research results
   */
  async findByOrganization(
    organizationId: string,
    limit: number = 100,
  ): Promise<KeywordResearchResult[]> {
    return this.find({
      filter: { organizationId } as Partial<KeywordResearchResult>,
      queryOptions: {
        orderBy: "lastUpdated",
        direction: "desc",
        limit,
      },
    });
  }

  /**
   * Find results by request ID
   * @param requestId Research request ID
   * @returns Array of keyword research results
   */
  async findByRequestId(requestId: string): Promise<KeywordResearchResult[]> {
    return this.find({
      filter: { requestId } as Partial<KeywordResearchResult>,
      queryOptions: {
        orderBy: "lastUpdated",
        direction: "desc",
      },
    });
  }

  /**
   * Find cached results for keyword and marketplace
   * @param keyword Keyword
   * @param marketplace Marketplace
   * @returns Research result or null if not found in cache
   */
  async findInCache(
    keyword: string,
    marketplace: string,
  ): Promise<KeywordResearchResult | null> {
    const results = await this.find({
      filter: {
        keyword,
        marketplace,
      } as Partial<KeywordResearchResult>,
      queryOptions: {
        orderBy: "lastUpdated",
        direction: "desc",
        limit: 1,
      },
    });

    // Return first result or null
    if (results.length > 0) {
      const result = results[0];

      // Check if result is still within cache period
      if (result.cachedUntil && new Date() < new Date(result.cachedUntil)) {
        return result;
      }
    }

    return null;
  }

  /**
   * Find research results by keyword and marketplace
   * @param keyword Keyword
   * @param marketplace Marketplace
   * @returns Array of keyword research results
   */
  async findByKeywordAndMarketplace(
    keyword: string,
    marketplace: string,
  ): Promise<KeywordResearchResult[]> {
    return this.find({
      advancedFilters: [
        { field: "keyword", operator: "==", value: keyword },
        { field: "marketplace", operator: "==", value: marketplace },
      ],
      queryOptions: {
        orderBy: "lastUpdated",
        direction: "desc",
      },
    });
  }

  /**
   * Find recent results by keyword (across all marketplaces)
   * @param keyword Keyword
   * @param limit Maximum number of results to return
   * @returns Array of keyword research results
   */
  async findByKeyword(
    keyword: string,
    limit: number = 5,
  ): Promise<KeywordResearchResult[]> {
    return this.find({
      filter: { keyword } as Partial<KeywordResearchResult>,
      queryOptions: {
        orderBy: "lastUpdated",
        direction: "desc",
        limit,
      },
    });
  }

  /**
   * Check cache status for multiple keywords and marketplace
   * @param keywords Array of keywords
   * @param marketplace Marketplace
   * @returns Map of keyword to cache status (true if in cache, false if not)
   */
  async checkCacheStatusBulk(
    keywords: string[],
    marketplace: string,
  ): Promise<Map<string, boolean>> {
    const cacheStatus = new Map<string, boolean>();

    // Set all to false initially
    keywords.forEach((keyword) => cacheStatus.set(keyword, false));

    // This would be better with a "where in" query, but keeping it simple
    // In a real implementation, we would optimize this for bulk checks
    for (const keyword of keywords) {
      const cached = await this.findInCache(keyword, marketplace);
      if (cached) {
        cacheStatus.set(keyword, true);
      }
    }

    return cacheStatus;
  }

  /**
   * Get all results for a specific marketplace
   * @param marketplace Marketplace
   * @param limit Maximum number of results to return
   * @returns Array of keyword research results
   */
  async findByMarketplace(
    marketplace: string,
    limit: number = 100,
  ): Promise<KeywordResearchResult[]> {
    return this.find({
      filter: { marketplace } as Partial<KeywordResearchResult>,
      queryOptions: {
        orderBy: "lastUpdated",
        direction: "desc",
        limit,
      },
    });
  }

  /**
   * Get trending keywords based on search volume
   * @param marketplace Marketplace
   * @param limit Maximum number of results to return
   * @returns Array of keyword research results
   */
  async findTrendingKeywords(
    marketplace: string,
    limit: number = 10,
  ): Promise<KeywordResearchResult[]> {
    // In a real implementation, we would optimize this with proper indices
    // For now, simulating a simple "search volume" based sort
    return this.find({
      filter: {
        marketplace,
        searchVolume: { $exists: true } as any,
      } as Partial<KeywordResearchResult>,
      queryOptions: {
        orderBy: "searchVolume",
        direction: "desc",
        limit,
      },
    });
  }

  /**
   * Get best opportunity keywords
   * @param marketplace Marketplace
   * @param limit Maximum number of results to return
   * @returns Array of keyword research results
   */
  async findBestOpportunities(
    marketplace: string,
    limit: number = 10,
  ): Promise<KeywordResearchResult[]> {
    return this.find({
      filter: {
        marketplace,
        opportunityScore: { $exists: true } as any,
      } as Partial<KeywordResearchResult>,
      queryOptions: {
        orderBy: "opportunityScore",
        direction: "desc",
        limit,
      },
    });
  }
}
