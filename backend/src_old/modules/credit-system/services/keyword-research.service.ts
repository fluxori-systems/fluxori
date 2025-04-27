import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

import {
  KeywordResearchRequestRepository,
  KeywordResearchResultRepository,
  KeywordResearchPricingRepository,
  KeywordCacheRepository,
} from "../repositories";

import { CreditSystemService } from "./credit-system.service";

import {
  CreditUsageType,
  KeywordResearchRequest,
  KeywordResearchResult,
  KeywordResearchRequestDto,
  KeywordResearchCreditEstimateDto,
  KeywordResearchQueueStatus,
} from "../interfaces/types";

/**
 * Integration status with marketplace scraper
 */
interface ScraperIntegrationStatus {
  isConnected: boolean;
  lastConnected?: Date;
  availableMarketplaces: string[];
  queueStatus: {
    activeTasks: number;
    pendingTasks: number;
    processingCapacity: number;
  };
}

/**
 * Service for keyword research credit system operations
 */
@Injectable()
export class KeywordResearchService implements OnModuleInit {
  private readonly logger = new Logger(KeywordResearchService.name);

  // Cache refreshing properties
  private isRefreshingCache = false;
  private lastCacheCleanup: Date | null = null;

  // Scraper connection status
  private scraperConnectionStatus: ScraperIntegrationStatus = {
    isConnected: false,
    availableMarketplaces: [],
    queueStatus: {
      activeTasks: 0,
      pendingTasks: 0,
      processingCapacity: 5,
    },
  };

  // Runtime analytics
  private averageProcessingTimes: Record<string, number[]> = {};
  private cacheHitCount = 0;
  private cacheMissCount = 0;

  constructor(
    private readonly creditSystemService: CreditSystemService,
    private readonly requestRepository: KeywordResearchRequestRepository,
    private readonly resultRepository: KeywordResearchResultRepository,
    private readonly pricingRepository: KeywordResearchPricingRepository,
    private readonly cacheRepository: KeywordCacheRepository,
  ) {}

  /**
   * Initialize service
   */
  async onModuleInit() {
    this.logger.log("Initializing Keyword Research Service");

    // Initialize pricing if needed
    await this.ensurePricingTierExists();

    // Set up periodic cache maintenance
    setInterval(() => this.performCacheMaintenance(), 15 * 60 * 1000); // Every 15 minutes

    // Set up periodic scraper status check
    setInterval(() => this.updateScraperStatus(), 5 * 60 * 1000); // Every 5 minutes

    // Set up initial scraper status check
    setTimeout(() => this.updateScraperStatus(), 5000); // After 5 seconds

    this.logger.log("Keyword Research Service initialized");
  }

  /**
   * Ensure that a default pricing tier exists
   */
  private async ensurePricingTierExists() {
    try {
      const activeTier = await this.pricingRepository.findActivePricingTier();

      if (!activeTier) {
        this.logger.log("No active pricing tier found, creating default tier");
        await this.pricingRepository.createDefaultPricingTier();
      }
    } catch (error) {
      this.logger.error(
        `Error ensuring pricing tier exists: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Perform cache maintenance (cleanup expired entries, refresh popular keywords)
   */
  private async performCacheMaintenance() {
    if (this.isRefreshingCache) {
      return; // Already running
    }

    this.isRefreshingCache = true;

    try {
      // Clean up expired cache entries
      const now = new Date();

      // Only run cleanup once per hour
      if (
        !this.lastCacheCleanup ||
        now.getTime() - this.lastCacheCleanup.getTime() > 60 * 60 * 1000
      ) {
        const deletedCount = await this.cacheRepository.cleanupExpiredEntries();

        if (deletedCount > 0) {
          this.logger.log(`Cleaned up ${deletedCount} expired cache entries`);
        }

        this.lastCacheCleanup = now;
      }

      // Find keywords that should be refreshed proactively
      const keywordsToRefresh =
        await this.cacheRepository.findKeywordsToRefresh(5);

      if (keywordsToRefresh.length > 0) {
        this.logger.log(
          `Found ${keywordsToRefresh.length} popular keywords to refresh`,
        );

        // Queue these keywords for refresh in the background
        // In a real implementation, this would call the scraper to refresh these keywords
        // but with a special "system" user and no credit charges
      }
    } catch (error) {
      this.logger.error(
        `Error in cache maintenance: ${error.message}`,
        error.stack,
      );
    } finally {
      this.isRefreshingCache = false;
    }
  }

  /**
   * Update scraper connection status
   */
  private async updateScraperStatus() {
    try {
      // In a real implementation, this would make an API call to the scraper
      // to check its status and available marketplaces
      // For now, we'll simulate a successful connection

      this.scraperConnectionStatus = {
        isConnected: true,
        lastConnected: new Date(),
        availableMarketplaces: [
          "takealot",
          "loot",
          "makro",
          "buck_cheap",
          "bob_shop",
          "amazon",
        ],
        queueStatus: {
          activeTasks: Math.floor(Math.random() * 5),
          pendingTasks: Math.floor(Math.random() * 10),
          processingCapacity: 5,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error updating scraper status: ${error.message}`,
        error.stack,
      );

      // Mark as disconnected if error occurs
      this.scraperConnectionStatus.isConnected = false;
    }
  }

  /**
   * Estimate credit cost for keyword research request
   * @param estimateDto Estimation parameters
   * @returns Estimated credit cost and cache information
   */
  async estimateCreditCost(
    estimateDto: KeywordResearchCreditEstimateDto,
  ): Promise<{
    totalCost: number;
    keywordCount: number;
    cacheInfo: {
      cachedKeywords: string[];
      freshKeywords: string[];
      cacheDiscount: number;
    };
    marketplaceInfo: Record<
      string,
      {
        basePrice: number;
        multiplier: number;
      }
    >;
    bulkDiscount: number;
    additionalFeatures: Record<string, number>;
  }> {
    try {
      const { keywords, marketplaces, includeSEOMetrics, maxPagesToScan } =
        estimateDto;

      // Check cache status for all keywords
      const cachedKeywords: string[] = [];
      const freshKeywords: string[] = [];

      // For each marketplace, check if keywords are in cache
      for (const marketplace of marketplaces) {
        const cacheStatus = await this.resultRepository.checkCacheStatusBulk(
          keywords,
          marketplace,
        );

        // Mark keywords as cached if they are cached in any marketplace
        for (const [keyword, isCached] of cacheStatus.entries()) {
          if (isCached && !cachedKeywords.includes(keyword)) {
            cachedKeywords.push(keyword);
          } else if (
            !isCached &&
            !freshKeywords.includes(keyword) &&
            !cachedKeywords.includes(keyword)
          ) {
            freshKeywords.push(keyword);
          }
        }
      }

      // Get active pricing tier
      const pricingTier =
        (await this.pricingRepository.findActivePricingTier()) ||
        (await this.pricingRepository.createDefaultPricingTier());

      // Calculate base price for each marketplace
      const marketplaceInfo: Record<
        string,
        { basePrice: number; multiplier: number }
      > = {};

      for (const marketplace of marketplaces) {
        const multiplier =
          pricingTier.marketplaceMultiplier[marketplace.toLowerCase()] || 1.0;
        marketplaceInfo[marketplace] = {
          basePrice: pricingTier.basePrice,
          multiplier,
        };
      }

      // Calculate cache discount
      const cacheDiscount =
        cachedKeywords.length > 0 ? pricingTier.cacheDiscount : 0;

      // Calculate bulk discount
      let bulkDiscount = 0;
      for (const threshold of pricingTier.bulkDiscountThresholds) {
        if (
          keywords.length >= threshold.count &&
          threshold.discountPercent > bulkDiscount
        ) {
          bulkDiscount = threshold.discountPercent;
        }
      }

      // Calculate additional feature costs
      const additionalFeatures: Record<string, number> = {};

      if (includeSEOMetrics) {
        additionalFeatures.seoMetrics =
          pricingTier.additionalFeatures.seoMetricsPrice * keywords.length;
      }

      const defaultPages = 2;
      if (maxPagesToScan && maxPagesToScan > defaultPages) {
        const extraPages = maxPagesToScan - defaultPages;
        additionalFeatures.deepScan =
          pricingTier.additionalFeatures.deepScanByPage *
          extraPages *
          keywords.length;
      }

      // Calculate total cost
      const cachePercentage =
        keywords.length > 0 ? cachedKeywords.length / keywords.length : 0;

      const totalCost = await this.pricingRepository.calculatePrice(
        keywords.length,
        marketplaces,
        includeSEOMetrics || false,
        maxPagesToScan || 2,
        cachePercentage,
      );

      return {
        totalCost,
        keywordCount: keywords.length,
        cacheInfo: {
          cachedKeywords,
          freshKeywords,
          cacheDiscount: cacheDiscount * 100, // Convert to percentage
        },
        marketplaceInfo,
        bulkDiscount: bulkDiscount * 100, // Convert to percentage
        additionalFeatures,
      };
    } catch (error) {
      this.logger.error(
        `Error estimating credit cost: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to estimate credit cost: ${error.message}`);
    }
  }

  /**
   * Request keyword research
   * @param requestDto Keyword research request parameters
   * @returns Created keyword research request
   */
  async requestKeywordResearch(
    requestDto: KeywordResearchRequestDto,
  ): Promise<KeywordResearchRequest> {
    try {
      this.logger.log(
        `Received keyword research request from organization ${requestDto.organizationId} ` +
          `for ${requestDto.keywords.length} keywords across ${requestDto.marketplaces.length} marketplaces`,
      );

      // If not connected to scraper, throw error
      if (!this.scraperConnectionStatus.isConnected) {
        throw new Error(
          "Marketplace scraper service is not available. Please try again later.",
        );
      }

      // Check if requested marketplaces are available
      const unavailableMarketplaces = requestDto.marketplaces.filter(
        (marketplace) =>
          !this.scraperConnectionStatus.availableMarketplaces.includes(
            marketplace,
          ),
      );

      if (unavailableMarketplaces.length > 0) {
        throw new Error(
          `The following marketplaces are not available: ${unavailableMarketplaces.join(", ")}`,
        );
      }

      // Estimate credit cost
      const estimateResult = await this.estimateCreditCost({
        keywords: requestDto.keywords,
        marketplaces: requestDto.marketplaces,
        categoryFilters: requestDto.categoryFilters,
        maxPagesToScan: requestDto.maxPagesToScan,
        includeSEOMetrics: requestDto.includeSEOMetrics,
      });

      const creditCost = estimateResult.totalCost;

      // Generate operation ID for credit reservation
      const operationId = uuidv4();

      // Check if organization has enough credits
      const creditCheck = await this.creditSystemService.checkCredits({
        organizationId: requestDto.organizationId,
        userId: requestDto.userId,
        expectedInputTokens: 0,
        expectedOutputTokens: 0,
        modelId: "keyword-research",
        usageType: CreditUsageType.KEYWORD_RESEARCH,
        operationId,
        metadata: {
          keywords: requestDto.keywords,
          marketplaces: requestDto.marketplaces,
          estimatedCost: creditCost,
        },
      });

      if (!creditCheck.hasCredits) {
        throw new Error(
          `Insufficient credits. Required: ${creditCost}, Available: ${creditCheck.availableCredits}`,
        );
      }

      const reservationId = creditCheck.reservationId;

      // Determine priority based on customer type, market segment, or custom setting
      const priority = requestDto.priority || 5; // Default to medium priority

      // Create the request
      const keywordRequest = await this.requestRepository.create({
        organizationId: requestDto.organizationId,
        userId: requestDto.userId,
        keywords: requestDto.keywords,
        marketplaces: requestDto.marketplaces,
        status: "pending",
        priority,
        requestedAt: new Date(),
        creditCost,
        reservationId,
        categoryFilters: requestDto.categoryFilters,
        maxPagesToScan: requestDto.maxPagesToScan,
        includeSEOMetrics: requestDto.includeSEOMetrics || false,
        notificationEnabled: requestDto.notificationEnabled || false,
        cacheStatus:
          estimateResult.cacheInfo.cachedKeywords.length > 0
            ? estimateResult.cacheInfo.freshKeywords.length > 0
              ? "partial_cache"
              : "full_cache"
            : "not_cached",
        discountPercent:
          estimateResult.cacheInfo.cachedKeywords.length > 0
            ? estimateResult.cacheInfo.cacheDiscount / 100
            : undefined,
        metadata: requestDto.metadata,
      });

      // Submit the request to the scraper
      // Note: In a real implementation, this would call an API or use a message queue
      this.submitToScraper(keywordRequest);

      return keywordRequest;
    } catch (error) {
      this.logger.error(
        `Error requesting keyword research: ${error.message}`,
        error.stack,
      );

      // If there was a reservation, release it
      if (error.reservationId) {
        await this.creditSystemService.releaseReservation(error.reservationId);
      }

      throw new Error(`Failed to request keyword research: ${error.message}`);
    }
  }

  /**
   * Get queue status for an organization
   * @param organizationId Organization ID
   * @param requestId Optional specific request ID to check position for
   * @returns Queue status
   */
  async getQueueStatus(
    organizationId: string,
    requestId?: string,
  ): Promise<KeywordResearchQueueStatus> {
    try {
      // Get all pending requests (system-wide)
      const allPendingRequests =
        await this.requestRepository.findNextToProcess(100);

      // Get all processing requests (system-wide)
      const allProcessingRequests = await this.requestRepository.find({
        filter: { status: "processing" } as Partial<KeywordResearchRequest>,
      });

      // Calculate position for specific request if provided
      let queuePosition: number | undefined;

      if (requestId) {
        const position =
          await this.requestRepository.getQueuePosition(requestId);
        queuePosition = position !== null ? position : undefined;
      }

      // Calculate average processing time
      let averageProcessingTime = 120; // Default 2 minutes

      // In a real implementation, this would be calculated from historical data
      const processingTimes = Object.values(this.averageProcessingTimes).flat();

      if (processingTimes.length > 0) {
        averageProcessingTime =
          processingTimes.reduce((sum, time) => sum + time, 0) /
          processingTimes.length;
      }

      // Calculate estimated completion time
      const pendingCount = allPendingRequests.length;
      const processingCount = allProcessingRequests.length;
      const processingCapacity =
        this.scraperConnectionStatus.queueStatus.processingCapacity;

      // Calculate how many batches would be needed
      const remainingBatches = Math.ceil(pendingCount / processingCapacity);

      // Estimate completion time
      const estimatedCompletionTime = remainingBatches * averageProcessingTime;

      // Get cache hit rate
      const totalRequests = this.cacheHitCount + this.cacheMissCount;
      const cachedKeywordsCount =
        totalRequests > 0
          ? Math.floor((this.cacheHitCount / totalRequests) * pendingCount)
          : 0;

      return {
        totalPendingRequests: pendingCount,
        totalProcessingRequests: processingCount,
        estimatedCompletionTime,
        queuePosition,
        averageProcessingTime,
        cachedKeywordsCount,
      };
    } catch (error) {
      this.logger.error(
        `Error getting queue status: ${error.message}`,
        error.stack,
      );

      // Return default values if error
      return {
        totalPendingRequests: 0,
        totalProcessingRequests: 0,
        estimatedCompletionTime: 0,
        averageProcessingTime: 0,
        cachedKeywordsCount: 0,
      };
    }
  }

  /**
   * Get results for a specific request
   * @param requestId Request ID
   * @returns Array of keyword research results
   */
  async getResults(requestId: string): Promise<KeywordResearchResult[]> {
    try {
      // Get request
      const request = await this.requestRepository.findById(requestId);

      if (!request) {
        throw new Error(`Request not found: ${requestId}`);
      }

      // Get results
      return this.resultRepository.findByRequestId(requestId);
    } catch (error) {
      this.logger.error(`Error getting results: ${error.message}`, error.stack);
      throw new Error(
        `Failed to get keyword research results: ${error.message}`,
      );
    }
  }

  /**
   * Get recent requests for an organization
   * @param organizationId Organization ID
   * @param limit Maximum number of requests to return
   * @returns Array of keyword research requests
   */
  async getRecentRequests(
    organizationId: string,
    limit: number = 10,
  ): Promise<KeywordResearchRequest[]> {
    try {
      // Get completed requests
      const completedRequests =
        await this.requestRepository.findCompletedByOrganization(
          organizationId,
          limit,
        );

      // Get pending and processing requests
      const pendingRequests =
        await this.requestRepository.findPendingByOrganization(organizationId);

      const processingRequests =
        await this.requestRepository.findProcessingByOrganization(
          organizationId,
        );

      // Combine and sort by requestedAt (newest first)
      const allRequests = [
        ...completedRequests,
        ...pendingRequests,
        ...processingRequests,
      ].sort((a, b) => {
        const dateA = new Date(a.requestedAt).getTime();
        const dateB = new Date(b.requestedAt).getTime();
        return dateB - dateA;
      });

      // Return limited number
      return allRequests.slice(0, limit);
    } catch (error) {
      this.logger.error(
        `Error getting recent requests: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Failed to get recent keyword research requests: ${error.message}`,
      );
    }
  }

  /**
   * Submit request to scraper
   * @param request Keyword research request
   */
  private async submitToScraper(request: KeywordResearchRequest) {
    // In a real implementation, this would call the scraper API
    // For now, we'll simulate processing

    // Update request status to processing after a delay
    setTimeout(
      async () => {
        try {
          await this.requestRepository.updateStatus(request.id, "processing");

          // Simulate processing time
          const processingTimePerKeyword = 20; // seconds per keyword
          const processingTime = Math.max(
            30, // Minimum 30 seconds
            request.keywords.length * processingTimePerKeyword,
          );

          // Check if we have cache hits for any keywords
          let cachedResults = 0;

          // Process each keyword and marketplace combination
          for (const keyword of request.keywords) {
            for (const marketplace of request.marketplaces) {
              // Check cache first
              const cached = await this.resultRepository.findInCache(
                keyword,
                marketplace,
              );

              if (cached) {
                // Cache hit - use cached result
                this.cacheHitCount++;

                // Record a new result that references the cached data
                await this.resultRepository.create({
                  requestId: request.id,
                  organizationId: request.organizationId,
                  keyword,
                  marketplace,
                  rankingData: cached.rankingData,
                  relatedKeywords: cached.relatedKeywords,
                  searchVolume: cached.searchVolume,
                  competitionLevel: cached.competitionLevel,
                  opportunityScore: cached.opportunityScore,
                  cachedUntil: cached.cachedUntil,
                  lastUpdated: new Date(),
                  processingTimeMs: 0, // Instant from cache
                  resultSource: "cached",
                  metadata: {
                    originalResultId: cached.id,
                    cached: true,
                  },
                });

                // Update cache hit count
                await this.cacheRepository.recordHit(cached.id);

                cachedResults++;
              } else {
                this.cacheMissCount++;

                // No cache hit - would call scraper API in real implementation
                // For now, simulate a result after a delay
              }
            }
          }

          // Track cache hit rate for reporting
          const cacheHitRate =
            request.keywords.length > 0 && request.marketplaces.length > 0
              ? cachedResults /
                (request.keywords.length * request.marketplaces.length)
              : 0;

          // If all results were cached, complete immediately
          if (cacheHitRate === 1) {
            await this.completeRequest(request, 0);
            return;
          }

          // Simulate scraper processing
          setTimeout(
            () => this.completeRequest(request, processingTime * 1000),
            processingTime * 1000,
          );
        } catch (error) {
          this.logger.error(
            `Error updating request status: ${error.message}`,
            error.stack,
          );

          // Mark as failed
          this.failRequest(
            request,
            `Error processing request: ${error.message}`,
          );
        }
      },
      Math.floor(Math.random() * 3000) + 1000,
    ); // 1-4 second delay to simulate queue processing
  }

  /**
   * Mark request as completed and process results
   * @param request Keyword research request
   * @param processingTimeMs Processing time in milliseconds
   */
  private async completeRequest(
    request: KeywordResearchRequest,
    processingTimeMs: number,
  ) {
    try {
      // Simulate results for keywords that weren't cached
      // In a real implementation, these would come from the scraper
      const existingResults = await this.resultRepository.findByRequestId(
        request.id,
      );
      const processedKeywords = new Set(
        existingResults.map((r) => `${r.keyword}:${r.marketplace}`),
      );

      for (const keyword of request.keywords) {
        for (const marketplace of request.marketplaces) {
          const key = `${keyword}:${marketplace}`;

          // Skip already processed keywords (cached ones)
          if (processedKeywords.has(key)) {
            continue;
          }

          // Create simulated result
          const simulatedResult = this.createSimulatedResult(
            request.id,
            request.organizationId,
            keyword,
            marketplace,
            processingTimeMs /
              (request.keywords.length * request.marketplaces.length),
          );

          const newResult = await this.resultRepository.create(simulatedResult);

          // Add to cache
          await this.cacheRepository.createOrUpdateCache(
            keyword,
            marketplace,
            newResult.id,
            simulatedResult.searchVolume,
          );
        }
      }

      // Record credit usage
      await this.creditSystemService.recordUsage({
        organizationId: request.organizationId,
        userId: request.userId,
        usageType: CreditUsageType.KEYWORD_RESEARCH,
        modelId: "keyword-research",
        modelProvider: "fluxori",
        inputTokens: 0,
        outputTokens: 0,
        processingTime: processingTimeMs,
        operationId: request.reservationId?.split("_")[0], // Extract operation ID from reservation
        reservationId: request.reservationId,
        resourceId: request.id,
        resourceType: "keyword_research_request",
        success: true,
        metadata: {
          keywords: request.keywords,
          marketplaces: request.marketplaces,
          creditCost: request.creditCost,
          cacheHitRate:
            existingResults.length /
            (request.keywords.length * request.marketplaces.length),
        },
      });

      // Update average processing time
      const avgTimeKey = request.keywords.length.toString();
      if (!this.averageProcessingTimes[avgTimeKey]) {
        this.averageProcessingTimes[avgTimeKey] = [];
      }

      // Convert to seconds for storage
      this.averageProcessingTimes[avgTimeKey].push(processingTimeMs / 1000);

      // Keep only last 10 entries
      if (this.averageProcessingTimes[avgTimeKey].length > 10) {
        this.averageProcessingTimes[avgTimeKey].shift();
      }

      // Update request status
      await this.requestRepository.updateStatus(request.id, "completed");

      // Send notification if enabled
      if (request.notificationEnabled) {
        this.sendNotification(request);
      }

      this.logger.log(
        `Completed keyword research request ${request.id} in ${processingTimeMs / 1000} seconds`,
      );
    } catch (error) {
      this.logger.error(
        `Error completing request: ${error.message}`,
        error.stack,
      );

      // Mark as failed
      this.failRequest(request, `Error completing request: ${error.message}`);
    }
  }

  /**
   * Mark request as failed
   * @param request Keyword research request
   * @param errorMessage Error message
   */
  private async failRequest(
    request: KeywordResearchRequest,
    errorMessage: string,
  ) {
    try {
      // Release credit reservation if there is one
      if (request.reservationId) {
        await this.creditSystemService.releaseReservation(
          request.reservationId,
        );
      }

      // Update request status
      await this.requestRepository.updateStatus(request.id, "failed", {
        errorMessage,
      });

      this.logger.error(
        `Failed keyword research request ${request.id}: ${errorMessage}`,
      );
    } catch (error) {
      this.logger.error(`Error failing request: ${error.message}`, error.stack);
    }
  }

  /**
   * Send notification for completed research
   * @param request Completed request
   */
  private async sendNotification(request: KeywordResearchRequest) {
    try {
      // In a real implementation, this would send email or in-app notification
      this.logger.log(
        `Sending notification for completed research ${request.id}`,
      );

      // Mark notification as sent
      await this.requestRepository.update(request.id, {
        notificationSent: true,
      });
    } catch (error) {
      this.logger.error(
        `Error sending notification for request ${request.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Create simulated result (for testing only)
   * @param requestId Request ID
   * @param organizationId Organization ID
   * @param keyword Keyword
   * @param marketplace Marketplace
   * @param processingTimeMs Processing time in milliseconds
   * @returns Simulated keyword research result
   */
  private createSimulatedResult(
    requestId: string,
    organizationId: string,
    keyword: string,
    marketplace: string,
    processingTimeMs: number,
  ): KeywordResearchResult {
    // Create a realistic looking simulated result
    // In a real implementation, this would come from the scraper

    // Generate 10-30 ranking items
    const totalItems = Math.floor(Math.random() * 20) + 10;
    const rankingData = [];

    for (let i = 0; i < totalItems; i++) {
      const position = i + 1;
      const productId = `P${Math.floor(Math.random() * 1000000)}`;
      const isSponsored = Math.random() < 0.2; // 20% chance of sponsored

      rankingData.push({
        position: isSponsored ? 0 : position, // Sponsored items at position 0
        productId,
        productTitle: `${isSponsored ? "[Ad] " : ""}${keyword} Product ${position}`,
        productUrl: `https://${marketplace.toLowerCase()}.com/product/${productId}`,
        price: Math.floor(Math.random() * 1000) + 100, // 100-1100 price
        currency: "ZAR",
        rating: Math.floor(Math.random() * 50) / 10 + 1, // 1.0-6.0 rating
        reviewCount: Math.floor(Math.random() * 1000),
        brand: `Brand ${Math.floor(Math.random() * 20)}`,
        imageUrl: `https://${marketplace.toLowerCase()}.com/images/${productId}.jpg`,
        inStock: Math.random() < 0.9, // 90% chance in stock
        sponsored: isSponsored,
        badges:
          Math.random() < 0.3 ? ["Best Seller", "Free Shipping"] : undefined,
        opportunityScore: Math.floor(Math.random() * 100),
      });
    }

    // If sponsored items exist, sort them to the top
    rankingData.sort((a, b) => {
      if (a.sponsored && !b.sponsored) return -1;
      if (!a.sponsored && b.sponsored) return 1;
      return a.position - b.position;
    });

    // Create expiration date (7 days from now)
    const now = new Date();
    const cachedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Create related keywords
    const relatedKeywords = [];
    const keywordWords = keyword.split(" ");

    if (keywordWords.length > 1) {
      relatedKeywords.push(keywordWords.slice(1).join(" "));
      relatedKeywords.push(keywordWords.slice(0, -1).join(" "));
    }

    relatedKeywords.push(`${keyword} online`);
    relatedKeywords.push(`best ${keyword}`);
    relatedKeywords.push(`${keyword} for sale`);

    // Create search volume (100-10000)
    const searchVolume = Math.floor(Math.random() * 9900) + 100;

    // Determine competition level
    let competitionLevel: "low" | "medium" | "high";
    if (searchVolume < 1000) {
      competitionLevel = "low";
    } else if (searchVolume < 5000) {
      competitionLevel = "medium";
    } else {
      competitionLevel = "high";
    }

    // Calculate opportunity score (0-100)
    const opportunityScore = Math.floor(
      (searchVolume / 100) * (Math.random() * 0.5 + 0.5), // Higher for higher volume
    );

    return {
      id: "", // Will be set by repository
      requestId,
      organizationId,
      keyword,
      marketplace,
      rankingData,
      relatedKeywords,
      searchVolume,
      competitionLevel,
      opportunityScore,
      cachedUntil,
      lastUpdated: now,
      createdAt: now,
      updatedAt: now,
      processingTimeMs,
      resultSource: "fresh",
      metadata: {
        totalResults: totalItems,
        sponsoredResults: rankingData.filter((item) => item.sponsored).length,
      },
    };
  }

  /**
   * Get cache statistics for reporting
   * @returns Cache statistics
   */
  async getCacheStats() {
    try {
      return this.cacheRepository.getCacheStats();
    } catch (error) {
      this.logger.error(
        `Error getting cache stats: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to get cache statistics: ${error.message}`);
    }
  }

  /**
   * Get service status
   * @returns Service status information
   */
  getServiceStatus() {
    return {
      isOperational: true,
      scraperStatus: this.scraperConnectionStatus,
      cacheStats: {
        hitCount: this.cacheHitCount,
        missCount: this.cacheMissCount,
        hitRate:
          this.cacheHitCount + this.cacheMissCount > 0
            ? this.cacheHitCount / (this.cacheHitCount + this.cacheMissCount)
            : 0,
      },
      averageProcessingTimes: Object.entries(this.averageProcessingTimes).map(
        ([keywordCount, times]) => ({
          keywordCount,
          averageTimeSeconds:
            times.reduce((sum, time) => sum + time, 0) / times.length,
          sampleCount: times.length,
        }),
      ),
    };
  }
}
