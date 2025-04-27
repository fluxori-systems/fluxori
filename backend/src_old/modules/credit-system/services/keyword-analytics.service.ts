import { Injectable, Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

import { CreditSystemService } from "./credit-system.service";
import { KeywordResearchService } from "./keyword-research.service";
import {
  KeywordAnalyticsRepository,
  KeywordResearchResultRepository,
  KeywordResearchRequestRepository,
} from "../repositories";

import {
  CreditUsageType,
  KeywordAnalyticsResult,
  KeywordResearchResult,
  AnalyticsRequestOptions,
} from "../interfaces/types";

/**
 * Service for keyword analytics
 * This extends the basic keyword research with advanced analytics features
 */
@Injectable()
export class KeywordAnalyticsService {
  private readonly logger = new Logger(KeywordAnalyticsService.name);

  // Regular expressions for South African e-commerce
  private readonly saPatterns = {
    electronics:
      /(?:phone|tv|laptop|computer|tablet|camera|headphone|bluetooth|wireless|gaming|console)/i,
    fashion:
      /(?:clothing|dress|shirt|pants|shoes|jacket|bag|sunglasses|watch|jewelry)/i,
    homeAndGarden:
      /(?:furniture|garden|kitchen|dining|bedroom|bathroom|lighting|decor|tools)/i,
    health:
      /(?:vitamin|supplement|fitness|protein|beauty|skincare|makeup|healthcare)/i,
    seasonal:
      /(?:christmas|easter|halloween|holiday|summer|winter|back to school|black friday)/i,
  };

  // South African seasonal calendar
  private readonly saSeasons = {
    summer: ["December", "January", "February"],
    autumn: ["March", "April", "May"],
    winter: ["June", "July", "August"],
    spring: ["September", "October", "November"],
  };

  constructor(
    private readonly analyticsRepository: KeywordAnalyticsRepository,
    private readonly researchResultRepository: KeywordResearchResultRepository,
    private readonly researchRequestRepository: KeywordResearchRequestRepository,
    private readonly creditService: CreditSystemService,
    private readonly keywordResearchService: KeywordResearchService,
  ) {}

  /**
   * Generate advanced analytics for a keyword
   * @param organizationId Organization ID
   * @param userId User ID
   * @param keyword Keyword to analyze
   * @param marketplace Marketplace
   * @param options Analytics options
   * @returns Generated analytics result
   */
  async generateAnalytics(
    organizationId: string,
    userId: string,
    keyword: string,
    marketplace: string,
    options: AnalyticsRequestOptions,
  ): Promise<KeywordAnalyticsResult> {
    try {
      this.logger.log(
        `Generating analytics for keyword "${keyword}" in marketplace "${marketplace}"`,
      );

      // Check if analytics already exist and are still valid
      const existingAnalytics =
        await this.analyticsRepository.findByKeywordAndMarketplace(
          organizationId,
          keyword,
          marketplace,
        );

      if (existingAnalytics) {
        this.logger.log(
          `Found existing analytics for ${keyword} in ${marketplace}`,
        );
        return existingAnalytics;
      }

      // Generate operation ID for credit reservation
      const operationId = uuidv4();

      // Calculate cost based on options
      const creditCost = this.calculateAnalyticsCost(options);

      // Check if user has enough credits
      const creditCheck = await this.creditService.checkCredits({
        organizationId,
        userId,
        expectedInputTokens: 0,
        expectedOutputTokens: 0,
        modelId: "keyword-analytics",
        usageType: CreditUsageType.ADVANCED_ANALYTICS,
        operationId,
        metadata: {
          keyword,
          marketplace,
          options,
        },
      });

      if (!creditCheck.hasCredits) {
        throw new Error(
          `Insufficient credits for advanced analytics. Required: ${creditCost}, Available: ${creditCheck.availableCredits}`,
        );
      }

      // Get reservation ID
      const reservationId = creditCheck.reservationId;

      // Get existing research results for this keyword
      const researchResults =
        await this.researchResultRepository.findByKeywordAndMarketplace(
          keyword,
          marketplace,
        );

      if (!researchResults || researchResults.length === 0) {
        // No research results available, need to run keyword research first
        this.logger.log(
          `No research results found for ${keyword}, running research first`,
        );

        // Create keyword research request
        const researchRequest =
          await this.keywordResearchService.requestKeywordResearch({
            organizationId,
            userId,
            keywords: [keyword],
            marketplaces: [marketplace],
            priority: 10, // High priority for analytics-driven research
            includeSEOMetrics: true,
            notificationEnabled: false,
            metadata: {
              analyticsRequest: true,
              analyticsReservationId: reservationId,
            },
          });

        // Wait for research to complete
        await this.waitForResearchCompletion(researchRequest.id);

        // Get research results again
        const updatedResults =
          await this.researchResultRepository.findByKeywordAndMarketplace(
            keyword,
            marketplace,
          );

        if (!updatedResults || updatedResults.length === 0) {
          throw new Error(
            "Failed to get keyword research results after request completion",
          );
        }
      }

      // Now generate the advanced analytics
      const analytics = await this.processAnalytics(
        organizationId,
        userId,
        keyword,
        marketplace,
        options,
      );

      // Record credit usage
      await this.creditService.recordUsage({
        organizationId,
        userId,
        usageType: CreditUsageType.ADVANCED_ANALYTICS,
        modelId: "keyword-analytics",
        modelProvider: "fluxori",
        inputTokens: 0,
        outputTokens: 0,
        operationId: operationId,
        reservationId,
        resourceId: analytics.id,
        resourceType: "keyword_analytics",
        success: true,
        metadata: {
          keyword,
          marketplace,
          options,
        },
      });

      return analytics;
    } catch (error) {
      this.logger.error(
        `Error generating analytics: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to generate analytics: ${error.message}`);
    }
  }

  /**
   * Calculate the cost for advanced analytics based on options
   * @param options Analytics options
   * @returns Credit cost
   */
  private calculateAnalyticsCost(options: AnalyticsRequestOptions): number {
    // Base cost for analytics
    let cost = 15;

    // Additional costs based on selected options
    if (options.includeMarketShare) cost += 5;
    if (options.includeSeasonality) cost += 5;
    if (options.includeCompetitionAnalysis) cost += 10;
    if (options.includeTrendPrediction) cost += 15;
    if (options.includeGrowthOpportunities) cost += 10;

    return cost;
  }

  /**
   * Process analytics from research data
   * @param organizationId Organization ID
   * @param userId User ID
   * @param keyword Keyword
   * @param marketplace Marketplace
   * @param options Analytics options
   * @returns Generated analytics
   */
  private async processAnalytics(
    organizationId: string,
    userId: string,
    keyword: string,
    marketplace: string,
    options: AnalyticsRequestOptions,
  ): Promise<KeywordAnalyticsResult> {
    this.logger.log(`Processing analytics for ${keyword} in ${marketplace}`);

    try {
      // Get research results
      const researchResults =
        await this.researchResultRepository.findByKeywordAndMarketplace(
          keyword,
          marketplace,
        );

      if (!researchResults || researchResults.length === 0) {
        throw new Error(
          `Research results not found for ${keyword} in ${marketplace}`,
        );
      }

      // Use the most recent result
      const latestResult = researchResults[0];

      // Generate analytics components based on options
      const searchVolume =
        latestResult.searchVolume || this.estimateSearchVolume(keyword);
      const searchVolumeHistory = this.generateSearchVolumeHistory(
        searchVolume,
        keyword,
      );

      // Create analytics entity
      const analytics: Partial<KeywordAnalyticsResult> = {
        organizationId,
        userId,
        requestId: latestResult.requestId,
        keyword,
        marketplace,
        searchVolume,
        searchVolumeHistory,
        generatedAt: new Date(),
        // Set expiration to 30 days from now
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      // Add optional components based on request options
      if (options.includeSeasonality) {
        analytics.seasonalityData = this.analyzeSeasonality(
          keyword,
          searchVolumeHistory,
        );
      }

      if (options.includeMarketShare) {
        analytics.marketShareData = this.analyzeMarketShare(latestResult);
      }

      if (options.includeTrendPrediction) {
        analytics.trendPrediction = this.generateTrendPrediction(
          searchVolumeHistory,
          keyword,
        );
      }

      if (options.includeCompetitionAnalysis) {
        analytics.competitionAnalysis = this.analyzeCompetition(latestResult);
      }

      // Save analytics to repository
      return this.analyticsRepository.create(
        analytics as KeywordAnalyticsResult,
      );
    } catch (error) {
      this.logger.error(
        `Error processing analytics: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to process analytics: ${error.message}`);
    }
  }

  /**
   * Wait for a keyword research request to complete
   * @param requestId Request ID
   * @param maxWaitTimeMs Maximum wait time in milliseconds
   * @returns True if request completed successfully
   */
  private async waitForResearchCompletion(
    requestId: string,
    maxWaitTimeMs: number = 60000,
  ): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 1000; // 1 second

    while (Date.now() - startTime < maxWaitTimeMs) {
      // Get request status
      const request = await this.researchRequestRepository.findById(requestId);

      if (!request) {
        throw new Error(`Research request ${requestId} not found`);
      }

      if (request.status === "completed") {
        return true;
      }

      if (request.status === "failed") {
        throw new Error(
          `Research request ${requestId} failed: ${request.errorMessage}`,
        );
      }

      // Wait for the next check
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    throw new Error(
      `Research request ${requestId} did not complete within timeout`,
    );
  }

  /**
   * Estimate search volume for a keyword
   * @param keyword Keyword
   * @returns Estimated search volume
   */
  private estimateSearchVolume(keyword: string): number {
    // Simplified estimation based on keyword characteristics
    // In a real implementation, we would use historical data and machine learning

    // Base volume by word count (shorter = higher volume)
    const wordCount = keyword.split(" ").length;
    let volume = 10000 / Math.max(1, wordCount);

    // Adjust by keyword category
    if (this.saPatterns.electronics.test(keyword)) volume *= 1.5;
    if (this.saPatterns.fashion.test(keyword)) volume *= 1.2;
    if (this.saPatterns.seasonal.test(keyword)) volume *= 0.8;

    // Random variation (±20%)
    const variation = 0.8 + Math.random() * 0.4;
    volume *= variation;

    return Math.round(volume);
  }

  /**
   * Generate search volume history for a keyword
   * @param currentVolume Current search volume
   * @param keyword Keyword
   * @returns Search volume history
   */
  private generateSearchVolumeHistory(
    currentVolume: number,
    keyword: string,
  ): { period: string; volume: number }[] {
    const history = [];
    const months = 12;

    // Generate month labels (past 12 months)
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = month.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      });

      // Calculate volume with seasonal variations
      let volume = currentVolume;

      // Apply seasonal factors
      const monthIndex = month.getMonth();
      const isSummer = this.saSeasons.summer.includes(
        month.toLocaleString("en-US", { month: "long" }),
      );
      const isWinter = this.saSeasons.winter.includes(
        month.toLocaleString("en-US", { month: "long" }),
      );

      // Apply seasonal adjustments
      if (this.saPatterns.seasonal.test(keyword)) {
        // Strong seasonal patterns
        if (/christmas|holiday/i.test(keyword) && monthIndex === 10)
          volume *= 2.5; // November
        if (/summer/i.test(keyword) && isSummer) volume *= 1.8;
        if (/winter/i.test(keyword) && isWinter) volume *= 1.8;
        if (/back to school/i.test(keyword) && monthIndex === 0) volume *= 2.0; // January
      } else {
        // General South African e-commerce seasonality
        if (monthIndex === 10) volume *= 1.3; // Black Friday (November)
        if (monthIndex === 11) volume *= 1.25; // December holiday
        if (monthIndex === 0) volume *= 1.15; // January back to school
      }

      // Trend component (slight growth over time)
      const trendFactor = 1 + (i / months) * 0.1; // 10% growth over 12 months
      volume = volume / trendFactor;

      // Random noise (±10%)
      const noise = 0.9 + Math.random() * 0.2;
      volume *= noise;

      history.push({
        period: monthName,
        volume: Math.round(volume),
      });
    }

    return history;
  }

  /**
   * Analyze seasonality for a keyword
   * @param keyword Keyword
   * @param volumeHistory Search volume history
   * @returns Seasonality data
   */
  private analyzeSeasonality(
    keyword: string,
    volumeHistory: { period: string; volume: number }[],
  ): KeywordAnalyticsResult["seasonalityData"] {
    // Calculate quarterly trends
    const quarterlyTrends: Record<string, number> = {
      Q1: 0, // Jan-Mar
      Q2: 0, // Apr-Jun
      Q3: 0, // Jul-Sep
      Q4: 0, // Oct-Dec
    };

    // Calculate monthly trends
    const monthlyTrends: Record<string, number> = {};
    const monthVolumes: Record<string, number[]> = {};

    // Extract month names and volumes
    for (const entry of volumeHistory) {
      const [monthName, year] = entry.period.split(" ");

      if (!monthVolumes[monthName]) {
        monthVolumes[monthName] = [];
      }

      monthVolumes[monthName].push(entry.volume);

      // Add to quarterly data
      if (["January", "February", "March"].includes(monthName)) {
        quarterlyTrends["Q1"] += entry.volume;
      } else if (["April", "May", "June"].includes(monthName)) {
        quarterlyTrends["Q2"] += entry.volume;
      } else if (["July", "August", "September"].includes(monthName)) {
        quarterlyTrends["Q3"] += entry.volume;
      } else {
        quarterlyTrends["Q4"] += entry.volume;
      }
    }

    // Calculate average monthly volumes
    for (const [month, volumes] of Object.entries(monthVolumes)) {
      if (volumes.length > 0) {
        const sum = volumes.reduce((total, v) => total + v, 0);
        monthlyTrends[month] = Math.round(sum / volumes.length);
      }
    }

    // Find peak months (top 3)
    const sortedMonths = Object.entries(monthlyTrends)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([month]) => month);

    // Calculate peak score (0-100)
    const volumes = Object.values(monthlyTrends);
    const avg = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const max = Math.max(...volumes);
    const peakScore = Math.min(100, Math.round(((max - avg) / avg) * 100));

    // Get seasonal keywords based on the keyword and peak months
    const seasonalKeywords = this.getSeasonalKeywords(keyword, sortedMonths);

    return {
      quarterlyTrends,
      monthlyTrends,
      seasonalKeywords,
      peakMonths: sortedMonths,
      peakScore,
    };
  }

  /**
   * Get seasonal keyword variations
   * @param keyword Base keyword
   * @param peakMonths Peak months
   * @returns Array of seasonal keyword variations
   */
  private getSeasonalKeywords(keyword: string, peakMonths: string[]): string[] {
    const seasonalKeywords = [];

    // Get season for the peak months
    const seasons = new Set<string>();
    for (const month of peakMonths) {
      for (const [season, months] of Object.entries(this.saSeasons)) {
        if (months.includes(month)) {
          seasons.add(season);
        }
      }
    }

    // Add seasonal variations
    for (const season of seasons) {
      seasonalKeywords.push(`${season} ${keyword}`);
    }

    // Add holiday variations if applicable
    if (peakMonths.includes("November") || peakMonths.includes("December")) {
      seasonalKeywords.push(`Christmas ${keyword}`);
      seasonalKeywords.push(`holiday ${keyword}`);
      seasonalKeywords.push(`gift ${keyword}`);
    }

    if (peakMonths.includes("January")) {
      seasonalKeywords.push(`back to school ${keyword}`);
    }

    // Add South African specific holidays if applicable
    if (peakMonths.includes("March") || peakMonths.includes("April")) {
      seasonalKeywords.push(`Easter ${keyword}`);
    }

    if (peakMonths.includes("June")) {
      seasonalKeywords.push(`Youth Day ${keyword}`);
    }

    if (peakMonths.includes("August")) {
      seasonalKeywords.push(`Women's Day ${keyword}`);
    }

    if (peakMonths.includes("September")) {
      seasonalKeywords.push(`Heritage Day ${keyword}`);
      seasonalKeywords.push(`Braai Day ${keyword}`);
    }

    return seasonalKeywords;
  }

  /**
   * Analyze market share data from research results
   * @param researchResults Keyword research results
   * @returns Market share data
   */
  private analyzeMarketShare(
    researchResults: KeywordResearchResult,
  ): KeywordAnalyticsResult["marketShareData"] {
    const rankingData = researchResults.rankingData || [];

    // Extract all brands
    const brands = new Map<
      string,
      {
        productCount: number;
        positions: number[];
        prices: number[];
      }
    >();

    // Track price distribution
    const prices: number[] = [];

    // Process ranking data
    for (const item of rankingData) {
      if (!item.brand) continue;

      // Process price
      if (item.price > 0) {
        prices.push(item.price);
      }

      // Process brand
      if (!brands.has(item.brand)) {
        brands.set(item.brand, {
          productCount: 0,
          positions: [],
          prices: [],
        });
      }

      const brandData = brands.get(item.brand)!;
      brandData.productCount++;

      if (item.position > 0) {
        // Skip sponsored items with position 0
        brandData.positions.push(item.position);
      }

      if (item.price > 0) {
        brandData.prices.push(item.price);
      }
    }

    // Calculate dominant brands
    const dominantBrands = Array.from(brands.entries())
      .map(([brandName, data]) => {
        // Calculate average ranking position
        const avgRanking =
          data.positions.length > 0
            ? data.positions.reduce((sum, pos) => sum + pos, 0) /
              data.positions.length
            : 999; // Large number for brands without valid positions

        // Calculate market share percentage
        const marketSharePercent =
          (data.productCount / rankingData.length) * 100;

        return {
          brandName,
          productCount: data.productCount,
          averageRanking: Math.round(avgRanking * 100) / 100,
          marketSharePercent: Math.round(marketSharePercent * 100) / 100,
        };
      })
      .sort((a, b) => b.marketSharePercent - a.marketSharePercent)
      .slice(0, 5); // Top 5 brands

    // Calculate price distribution
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const minPrice = sortedPrices.length > 0 ? sortedPrices[0] : 0;
    const maxPrice =
      sortedPrices.length > 0 ? sortedPrices[sortedPrices.length - 1] : 0;
    const totalPrices = sortedPrices.length;

    // Calculate average and median
    const averagePrice =
      totalPrices > 0
        ? sortedPrices.reduce((sum, p) => sum + p, 0) / totalPrices
        : 0;

    const medianPrice =
      totalPrices > 0 ? sortedPrices[Math.floor(totalPrices / 2)] : 0;

    // Create price ranges
    const priceRanges: { range: string; count: number; percentage: number }[] =
      [];

    if (totalPrices > 0) {
      // Define price range boundaries based on data
      const range = maxPrice - minPrice;
      const step = Math.max(1, Math.ceil(range / 5)); // Create 5 ranges

      for (let i = 0; i < 5; i++) {
        const rangeStart = minPrice + i * step;
        const rangeEnd = i < 4 ? rangeStart + step : maxPrice;
        const rangeText = `${rangeStart.toFixed(0)} - ${rangeEnd.toFixed(0)}`;

        // Count items in this range
        const count = sortedPrices.filter(
          (p) => p >= rangeStart && p <= rangeEnd,
        ).length;
        const percentage = (count / totalPrices) * 100;

        priceRanges.push({
          range: rangeText,
          count,
          percentage: Math.round(percentage * 100) / 100,
        });
      }
    }

    return {
      totalProductCount: rankingData.length,
      dominantBrands,
      priceDistribution: {
        minPrice,
        maxPrice,
        averagePrice: Math.round(averagePrice * 100) / 100,
        medianPrice,
        priceRanges,
      },
    };
  }

  /**
   * Generate trend prediction for a keyword
   * @param volumeHistory Search volume history
   * @param keyword Keyword
   * @returns Trend prediction data
   */
  private generateTrendPrediction(
    volumeHistory: { period: string; volume: number }[],
    keyword: string,
  ): KeywordAnalyticsResult["trendPrediction"] {
    // Extract volumes for trend analysis
    const volumes = volumeHistory.map((item) => item.volume);

    // Simple trend calculation (linear regression)
    const n = volumes.length;
    const indices = Array.from({ length: n }, (_, i) => i);

    // Calculate means
    const meanX = indices.reduce((sum, x) => sum + x, 0) / n;
    const meanY = volumes.reduce((sum, y) => sum + y, 0) / n;

    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (indices[i] - meanX) * (volumes[i] - meanY);
      denominator += Math.pow(indices[i] - meanX, 2);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;

    // Calculate fitted values and prediction for next months
    const fittedValues = indices.map((i) => intercept + slope * i);
    const predictedValues = [];

    for (let i = 1; i <= 3; i++) {
      predictedValues.push(
        Math.max(0, Math.round(intercept + slope * (n - 1 + i))),
      );
    }

    // Calculate R-squared for confidence
    let SSR = 0;
    let SST = 0;

    for (let i = 0; i < n; i++) {
      SSR += Math.pow(fittedValues[i] - meanY, 2);
      SST += Math.pow(volumes[i] - meanY, 2);
    }

    const rSquared = SST !== 0 ? SSR / SST : 0;

    // Calculate growth percentage
    const lastPeriodVolume = volumes[n - 1];
    const predictedGrowth =
      lastPeriodVolume > 0
        ? ((predictedValues[2] - lastPeriodVolume) / lastPeriodVolume) * 100
        : 0;

    // Get next three months
    const today = new Date();
    const nextMonths = [];

    for (let i = 1; i <= 3; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthName = month.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      });

      nextMonths.push({
        month: monthName,
        predictedVolume: predictedValues[i - 1],
        predictedRankingDifficulty: this.calculateRankingDifficulty(
          predictedValues[i - 1],
          keyword,
        ),
      });
    }

    // Determine trend direction
    let trendDirection: "rising" | "falling" | "stable" = "stable";
    if (predictedGrowth > 10) {
      trendDirection = "rising";
    } else if (predictedGrowth < -10) {
      trendDirection = "falling";
    }

    return {
      predictedVolume: predictedValues,
      predictedGrowth: Math.round(predictedGrowth * 100) / 100,
      confidence: Math.round(rSquared * 100),
      nextThreeMonths: nextMonths,
      trendDirection,
    };
  }

  /**
   * Calculate ranking difficulty score
   * @param predictedVolume Predicted search volume
   * @param keyword Keyword
   * @returns Ranking difficulty score (0-10)
   */
  private calculateRankingDifficulty(
    predictedVolume: number,
    keyword: string,
  ): number {
    // Base difficulty on search volume (higher volume = harder to rank)
    let difficulty = Math.min(10, Math.log10(predictedVolume) * 2);

    // Adjust for keyword competitiveness
    const wordCount = keyword.split(" ").length;
    if (wordCount <= 1) difficulty += 2; // Single-word keywords are more competitive
    if (wordCount >= 4) difficulty -= 1; // Long-tail keywords are less competitive

    // Adjust for category
    if (this.saPatterns.electronics.test(keyword)) difficulty += 1;
    if (this.saPatterns.fashion.test(keyword)) difficulty += 0.5;

    // Ensure range 1-10
    return Math.max(1, Math.min(10, Math.round(difficulty)));
  }

  /**
   * Analyze competition for a keyword
   * @param researchResults Keyword research results
   * @returns Competition analysis data
   */
  private analyzeCompetition(
    researchResults: KeywordResearchResult,
  ): KeywordAnalyticsResult["competitionAnalysis"] {
    const rankingData = researchResults.rankingData || [];

    // Extract brand data
    const brands = new Map<
      string,
      {
        productCount: number;
        positions: number[];
        prices: number[];
        ratings: number[];
      }
    >();

    // Process ranking data
    for (const item of rankingData) {
      if (!item.brand) continue;

      // Process brand
      if (!brands.has(item.brand)) {
        brands.set(item.brand, {
          productCount: 0,
          positions: [],
          prices: [],
          ratings: [],
        });
      }

      const brandData = brands.get(item.brand)!;
      brandData.productCount++;

      if (item.position > 0) {
        // Skip sponsored items with position 0
        brandData.positions.push(item.position);
      }

      if (item.price > 0) {
        brandData.prices.push(item.price);
      }

      if (item.rating && item.rating > 0) {
        brandData.ratings.push(item.rating);
      }
    }

    // Calculate top competitors
    const topCompetitors = Array.from(brands.entries())
      .map(([brandName, data]) => {
        // Calculate average ranking position
        const avgRanking =
          data.positions.length > 0
            ? data.positions.reduce((sum, pos) => sum + pos, 0) /
              data.positions.length
            : 999; // Large number for brands without valid positions

        // Calculate average price
        const avgPrice =
          data.prices.length > 0
            ? data.prices.reduce((sum, price) => sum + price, 0) /
              data.prices.length
            : 0;

        // Calculate dominance score
        // Formula: (productCount * 10) / (avgRanking + 1)
        // Higher product count and lower (better) ranking = higher dominance
        const dominance = (data.productCount * 10) / (avgRanking + 1);

        return {
          brandName,
          productCount: data.productCount,
          averageRanking: Math.round(avgRanking * 100) / 100,
          averagePrice: Math.round(avgPrice * 100) / 100,
          dominance: Math.round(dominance * 100) / 100,
        };
      })
      .sort((a, b) => b.dominance - a.dominance)
      .slice(0, 5); // Top 5 competitors

    // Calculate competition metrics
    const totalCompetitorProducts = rankingData.length;

    // Calculate saturation level (0-100)
    // Based on top competitor dominance
    let saturationLevel = 0;
    if (topCompetitors.length > 0) {
      const topDominanceSum = topCompetitors.reduce(
        (sum, comp) => sum + comp.dominance,
        0,
      );
      saturationLevel = Math.min(
        100,
        Math.round((topDominanceSum / topCompetitors.length) * 10),
      );
    }

    // Calculate difficulty (0-100)
    // Based on number of products, top competitor dominance, and saturation
    const difficulty = Math.min(
      100,
      Math.round(
        totalCompetitorProducts * 0.2 +
          saturationLevel * 0.5 +
          (topCompetitors.length > 0 ? topCompetitors[0].dominance * 2 : 0),
      ),
    );

    // Determine entry barrier
    let entryBarrier: "low" | "medium" | "high" = "medium";
    if (difficulty < 40) {
      entryBarrier = "low";
    } else if (difficulty > 70) {
      entryBarrier = "high";
    }

    // Calculate opportunity score (0-100)
    // Inverse of difficulty with some adjustments
    const opportunityScore = Math.max(0, 100 - difficulty);

    return {
      difficulty,
      topCompetitors,
      saturationLevel,
      entryBarrier,
      opportunityScore,
    };
  }

  /**
   * Get analytics for multiple keywords (batch request)
   * @param organizationId Organization ID
   * @param userId User ID
   * @param keywords Array of keywords
   * @param marketplace Marketplace
   * @param options Analytics options
   * @returns Map of keyword to analytics result
   */
  async getAnalyticsForKeywords(
    organizationId: string,
    userId: string,
    keywords: string[],
    marketplace: string,
    options: AnalyticsRequestOptions,
  ): Promise<Map<string, KeywordAnalyticsResult>> {
    const results = new Map<string, KeywordAnalyticsResult>();

    // Check existing analytics
    const existingAnalytics = await this.analyticsRepository.findByKeywords(
      organizationId,
      keywords,
      marketplace,
    );

    // For each keyword without existing analytics, generate new ones
    const keywordsToGenerate = [];

    for (const keyword of keywords) {
      const existingResult = existingAnalytics.get(keyword);

      if (existingResult) {
        results.set(keyword, existingResult);
      } else {
        keywordsToGenerate.push(keyword);
      }
    }

    // Generate analytics for remaining keywords
    if (keywordsToGenerate.length > 0) {
      // Calculate total cost for all keywords
      const totalCost =
        this.calculateAnalyticsCost(options) * keywordsToGenerate.length;

      // Generate operation ID for credit reservation
      const operationId = uuidv4();

      // Check if user has enough credits for all
      const creditCheck = await this.creditService.checkCredits({
        organizationId,
        userId,
        expectedInputTokens: 0,
        expectedOutputTokens: 0,
        modelId: "keyword-analytics-batch",
        usageType: CreditUsageType.ADVANCED_ANALYTICS,
        operationId,
        metadata: {
          keywords: keywordsToGenerate,
          marketplace,
          options,
        },
      });

      if (!creditCheck.hasCredits) {
        throw new Error(
          `Insufficient credits for batch analytics. Required: ${totalCost}, Available: ${creditCheck.availableCredits}`,
        );
      }

      // Generate analytics for each keyword
      for (const keyword of keywordsToGenerate) {
        try {
          const analytics = await this.generateAnalytics(
            organizationId,
            userId,
            keyword,
            marketplace,
            options,
          );

          results.set(keyword, analytics);
        } catch (error) {
          this.logger.error(
            `Error generating analytics for ${keyword}: ${error.message}`,
          );
          // Continue with other keywords even if one fails
        }
      }
    }

    return results;
  }

  /**
   * Get popular keywords based on analytics
   * @param marketplace Marketplace
   * @param limit Maximum number of keywords to return
   * @returns Array of analytics results for popular keywords
   */
  async getPopularKeywords(
    marketplace: string,
    limit: number = 10,
  ): Promise<KeywordAnalyticsResult[]> {
    return this.analyticsRepository.findPopularKeywords(marketplace, limit);
  }

  /**
   * Get trending keywords based on analytics
   * @param marketplace Marketplace
   * @param limit Maximum number of keywords to return
   * @returns Array of analytics results for trending keywords
   */
  async getTrendingKeywords(
    marketplace: string,
    limit: number = 10,
  ): Promise<KeywordAnalyticsResult[]> {
    return this.analyticsRepository.findTrendingKeywords(marketplace, limit);
  }

  /**
   * Get seasonal keywords for upcoming months
   * @param marketplace Marketplace
   * @param limit Maximum number of keywords to return
   * @returns Array of analytics results for seasonal keywords
   */
  async getSeasonalKeywordsForUpcomingMonth(
    marketplace: string,
    limit: number = 10,
  ): Promise<KeywordAnalyticsResult[]> {
    return this.analyticsRepository.findSeasonalKeywords(marketplace, limit);
  }
}
