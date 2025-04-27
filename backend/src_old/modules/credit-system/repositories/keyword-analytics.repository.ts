import { Injectable } from "@nestjs/common";
import { FirestoreBaseRepository } from "@common/repositories";
import { FirestoreConfigService } from "../../../config/firestore.config";
import { KeywordAnalyticsResult } from "../interfaces/types";

/**
 * Repository for keyword analytics results
 */
@Injectable()
export class KeywordAnalyticsRepository extends FirestoreBaseRepository<KeywordAnalyticsResult> {
  protected readonly collectionName = "keyword_analytics_results";

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, "keyword_analytics_results", {
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 30 * 60 * 1000, // 30 minutes
      requiredFields: ["organizationId", "userId", "keyword", "marketplace"],
    });
  }

  /**
   * Find analytics by organization ID
   * @param organizationId Organization ID
   * @param limit Maximum number of results to return
   * @returns Array of keyword analytics results
   */
  async findByOrganization(
    organizationId: string,
    limit: number = 100,
  ): Promise<KeywordAnalyticsResult[]> {
    return this.find({
      filter: { organizationId } as Partial<KeywordAnalyticsResult>,
      queryOptions: {
        orderBy: "generatedAt",
        direction: "desc",
        limit,
      },
    });
  }

  /**
   * Find analytics by keyword and marketplace
   * @param organizationId Organization ID
   * @param keyword Keyword
   * @param marketplace Marketplace
   * @returns Keyword analytics result or null if not found
   */
  async findByKeywordAndMarketplace(
    organizationId: string,
    keyword: string,
    marketplace: string,
  ): Promise<KeywordAnalyticsResult | null> {
    const results = await this.find({
      filter: {
        organizationId,
        keyword,
        marketplace,
      } as Partial<KeywordAnalyticsResult>,
      queryOptions: {
        orderBy: "generatedAt",
        direction: "desc",
        limit: 1,
      },
    });

    // Return first result or null
    if (results.length > 0) {
      const result = results[0];

      // Check if result is still valid
      const now = new Date();
      const expiresAt =
        result.expiresAt instanceof Date
          ? result.expiresAt
          : new Date(result.expiresAt);

      if (expiresAt > now) {
        return result;
      }
    }

    return null;
  }

  /**
   * Get analytics by request ID
   * @param requestId Research request ID
   * @returns Array of keyword analytics results
   */
  async findByRequestId(requestId: string): Promise<KeywordAnalyticsResult[]> {
    return this.find({
      filter: { requestId } as Partial<KeywordAnalyticsResult>,
    });
  }

  /**
   * Get analytics for multiple keywords (batch query)
   * @param organizationId Organization ID
   * @param keywords Array of keywords
   * @param marketplace Marketplace
   * @returns Map of keyword to analytics result
   */
  async findByKeywords(
    organizationId: string,
    keywords: string[],
    marketplace: string,
  ): Promise<Map<string, KeywordAnalyticsResult | null>> {
    const results = new Map<string, KeywordAnalyticsResult | null>();

    // Initialize all keywords to null
    keywords.forEach((keyword) => results.set(keyword, null));

    // In a real implementation, we would use a batched query
    // For now, we'll do individual queries for each keyword
    for (const keyword of keywords) {
      const result = await this.findByKeywordAndMarketplace(
        organizationId,
        keyword,
        marketplace,
      );

      if (result) {
        results.set(keyword, result);
      }
    }

    return results;
  }

  /**
   * Find popular keywords based on search volume
   * @param marketplace Marketplace
   * @param limit Maximum number of results to return
   * @returns Array of keyword analytics results
   */
  async findPopularKeywords(
    marketplace: string,
    limit: number = 10,
  ): Promise<KeywordAnalyticsResult[]> {
    // In a real implementation, we would use a combined query and sorting
    // For now, get all and sort by search volume
    const results = await this.find({
      filter: { marketplace } as Partial<KeywordAnalyticsResult>,
      queryOptions: {
        limit: 100, // Get more to sort
      },
    });

    // Sort by search volume (highest first)
    results.sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0));

    // Return top results
    return results.slice(0, limit);
  }

  /**
   * Find trending keywords (growing search volume)
   * @param marketplace Marketplace
   * @param limit Maximum number of results to return
   * @returns Array of keyword analytics results
   */
  async findTrendingKeywords(
    marketplace: string,
    limit: number = 10,
  ): Promise<KeywordAnalyticsResult[]> {
    // In a real implementation, we would use a combined query and sorting
    // For now, get all and sort by trend prediction
    const results = await this.find({
      filter: { marketplace } as Partial<KeywordAnalyticsResult>,
      queryOptions: {
        limit: 100, // Get more to sort
      },
    });

    // Sort by predicted growth (highest first)
    results.sort((a, b) => {
      const growthA = a.trendPrediction?.predictedGrowth || 0;
      const growthB = b.trendPrediction?.predictedGrowth || 0;
      return growthB - growthA;
    });

    // Return top results
    return results.slice(0, limit);
  }

  /**
   * Find seasonal keywords for the upcoming month
   * @param marketplace Marketplace
   * @param limit Maximum number of results to return
   * @returns Array of keyword analytics results
   */
  async findSeasonalKeywords(
    marketplace: string,
    limit: number = 10,
  ): Promise<KeywordAnalyticsResult[]> {
    // Get current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const nextMonth = (currentMonth + 1) % 12;
    const nextMonthName = new Date(
      now.getFullYear(),
      nextMonth,
      1,
    ).toLocaleString("en-US", { month: "long" });

    // In a real implementation, we would query against seasonality data
    // For now, get all and filter for seasonal peaks
    const results = await this.find({
      filter: { marketplace } as Partial<KeywordAnalyticsResult>,
      queryOptions: {
        limit: 100, // Get more to filter
      },
    });

    // Filter for keywords with peak in next month
    const seasonal = results.filter((result) => {
      if (!result.seasonalityData) return false;
      return result.seasonalityData.peakMonths.some(
        (month) => month.toLowerCase() === nextMonthName.toLowerCase(),
      );
    });

    // Sort by seasonal peak score (highest first)
    seasonal.sort((a, b) => {
      const scoreA = a.seasonalityData?.peakScore || 0;
      const scoreB = b.seasonalityData?.peakScore || 0;
      return scoreB - scoreA;
    });

    // Return top results
    return seasonal.slice(0, limit);
  }
}
