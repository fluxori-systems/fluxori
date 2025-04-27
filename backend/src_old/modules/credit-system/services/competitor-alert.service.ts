import { Injectable, Logger } from "@nestjs/common";
import {
  CompetitorWatchRepository,
  CompetitorAlertRepository,
} from "../repositories/competitor-alert.repository";
import { CreditSystemService } from "./credit-system.service";
import {
  CompetitorWatch,
  CompetitorAlert,
  CompetitorAlertType,
  CreditUsageType,
  KeywordResearchResult,
  KeywordRankingData,
} from "../interfaces/types";

@Injectable()
export class CompetitorAlertService {
  private readonly logger = new Logger(CompetitorAlertService.name);

  constructor(
    private readonly competitorWatchRepository: CompetitorWatchRepository,
    private readonly competitorAlertRepository: CompetitorAlertRepository,
    private readonly creditSystemService: CreditSystemService,
  ) {}

  /**
   * Creates a new competitor watch configuration
   */
  async createWatch(
    watchData: Omit<
      CompetitorWatch,
      "id" | "createdAt" | "lastCheckedAt" | "nextCheckAt"
    > & { creditReservationId?: string },
  ): Promise<CompetitorWatch> {
    const { creditReservationId, ...data } = watchData;

    // Credit check is required to create a competitor watch
    if (!creditReservationId) {
      throw new Error(
        "Credit reservation is required to create a competitor watch",
      );
    }

    // Calculate the next check time based on frequency
    const now = new Date();
    const nextCheckAt = this.calculateNextCheckTime(now, data.frequency);

    // Create the watch entry
    const newWatch = await this.competitorWatchRepository.create({
      ...data,
      lastCheckedAt: now,
      nextCheckAt,
      createdAt: now,
    });

    // If successful, record the credit usage
    await this.creditSystemService.recordUsage({
      organizationId: data.organizationId,
      userId: data.userId,
      inputTokens: 0,
      outputTokens: 0,
      modelId: "competitor-alert-system",
      modelProvider: "fluxori",
      usageType: CreditUsageType.COMPETITOR_ALERT_SETUP,
      success: true,
      reservationId: creditReservationId,
      metadata: {
        alertTypes: data.alertTypes,
        frequency: data.frequency,
        marketplaces: data.marketplaces,
      },
    });

    return newWatch;
  }

  /**
   * Updates an existing competitor watch
   */
  async updateWatch(
    id: string,
    updateData: Partial<CompetitorWatch>,
  ): Promise<CompetitorWatch> {
    // Don't allow updating critical fields directly
    const {
      lastCheckedAt,
      nextCheckAt,
      createdAt,
      creditCost,
      organizationId,
      userId,
      ...safeUpdateData
    } = updateData;

    // Update the watch
    await this.competitorWatchRepository.update(id, safeUpdateData);

    // Return the updated watch
    const result = await this.competitorWatchRepository.findById(id);
    if (!result) {
      throw new Error(`Watch with ID ${id} not found after update`);
    }
    return result;
  }

  /**
   * Deletes a competitor watch
   */
  async deleteWatch(id: string): Promise<void> {
    await this.competitorWatchRepository.delete(id);
  }

  /**
   * Gets all competitor watches for an organization
   */
  async getWatchesByOrganization(
    organizationId: string,
  ): Promise<CompetitorWatch[]> {
    return await this.competitorWatchRepository.findByOrganization(
      organizationId,
    );
  }

  /**
   * Gets all competitor watches for a user
   */
  async getWatchesByUser(
    organizationId: string,
    userId: string,
  ): Promise<CompetitorWatch[]> {
    return await this.competitorWatchRepository.findByUser(
      organizationId,
      userId,
    );
  }

  /**
   * Gets a specific competitor watch by ID
   */
  async getWatchById(id: string): Promise<CompetitorWatch | undefined> {
    const result = await this.competitorWatchRepository.findById(id);
    // Convert null to undefined for consistent return types
    return result === null ? undefined : result;
  }

  /**
   * Gets all alerts for an organization
   */
  async getAlertsByOrganization(
    organizationId: string,
  ): Promise<CompetitorAlert[]> {
    return await this.competitorAlertRepository.findByOrganization(
      organizationId,
    );
  }

  /**
   * Gets all alerts for a user
   */
  async getAlertsByUser(
    organizationId: string,
    userId: string,
  ): Promise<CompetitorAlert[]> {
    return await this.competitorAlertRepository.findByUser(
      organizationId,
      userId,
    );
  }

  /**
   * Gets alerts by status for an organization
   */
  async getAlertsByStatus(
    organizationId: string,
    status: "new" | "viewed" | "dismissed",
  ): Promise<CompetitorAlert[]> {
    return await this.competitorAlertRepository.findByStatus(
      organizationId,
      status,
    );
  }

  /**
   * Gets alerts by importance for an organization
   */
  async getAlertsByImportance(
    organizationId: string,
    importance: "critical" | "high" | "medium" | "low",
  ): Promise<CompetitorAlert[]> {
    return await this.competitorAlertRepository.findByImportance(
      organizationId,
      importance,
    );
  }

  /**
   * Gets all new alerts for an organization
   */
  async getNewAlerts(organizationId: string): Promise<CompetitorAlert[]> {
    return await this.competitorAlertRepository.findNewAlerts(organizationId);
  }

  /**
   * Marks an alert as viewed
   */
  async markAlertViewed(id: string): Promise<void> {
    await this.competitorAlertRepository.updateStatus(id, "viewed");
  }

  /**
   * Dismisses an alert
   */
  async dismissAlert(id: string): Promise<void> {
    await this.competitorAlertRepository.updateStatus(id, "dismissed");
  }

  /**
   * Estimates credit cost for creating a competitor watch
   */
  estimateWatchCreditCost(
    alertTypes: CompetitorAlertType[],
    frequency: string,
    marketplaces: string[],
  ): number {
    // Base cost depending on frequency
    let baseCost = 0;
    switch (frequency) {
      case "hourly":
        baseCost = 25;
        break;
      case "daily":
        baseCost = 10;
        break;
      case "weekly":
        baseCost = 5;
        break;
      default:
        baseCost = 10;
    }

    // Add cost for each alert type
    const alertTypeCost = alertTypes.length * 2;

    // Add cost for each marketplace
    const marketplaceCost = marketplaces.length * 3;

    return baseCost + alertTypeCost + marketplaceCost;
  }

  /**
   * Processes a keyword research result to check for alerts
   */
  async processKeywordResult(
    result: KeywordResearchResult,
    previousResult?: KeywordResearchResult,
  ): Promise<void> {
    // Find all watches for this keyword and marketplace
    const watches = await this.competitorWatchRepository.findByKeyword(
      result.organizationId,
      result.keyword,
    );

    // Filter watches for the specific marketplace
    const relevantWatches = watches.filter(
      (watch) =>
        watch.marketplaces.includes(result.marketplace) && watch.isActive,
    );

    if (relevantWatches.length === 0) {
      return; // No watches to process
    }

    // Process each watch
    for (const watch of relevantWatches) {
      await this.processWatchForKeywordResult(watch, result, previousResult);
    }
  }

  /**
   * Process a specific watch against a keyword result
   */
  private async processWatchForKeywordResult(
    watch: CompetitorWatch,
    result: KeywordResearchResult,
    previousResult?: KeywordResearchResult,
  ): Promise<void> {
    if (!previousResult) {
      // Can't detect changes without previous data
      return;
    }

    const now = new Date();

    // Check for alerts based on configured alert types
    for (const alertType of watch.alertTypes) {
      switch (alertType) {
        case CompetitorAlertType.RANKING_CHANGE:
          await this.checkRankingChanges(watch, result, previousResult);
          break;
        case CompetitorAlertType.PRICE_CHANGE:
          await this.checkPriceChanges(watch, result, previousResult);
          break;
        case CompetitorAlertType.NEW_COMPETITOR:
          await this.checkNewCompetitors(watch, result, previousResult);
          break;
        case CompetitorAlertType.STOCK_STATUS_CHANGE:
          await this.checkStockStatusChanges(watch, result, previousResult);
          break;
        case CompetitorAlertType.REVIEW_CHANGE:
          await this.checkReviewChanges(watch, result, previousResult);
          break;
      }
    }

    // Update the watch's last check time and calculate next check time
    const nextCheckAt = this.calculateNextCheckTime(now, watch.frequency);
    await this.competitorWatchRepository.updateNextCheckAt(
      watch.id,
      now,
      nextCheckAt,
    );
  }

  /**
   * Check for ranking changes
   */
  private async checkRankingChanges(
    watch: CompetitorWatch,
    currentResult: KeywordResearchResult,
    previousResult: KeywordResearchResult,
  ): Promise<void> {
    const threshold = watch.thresholds.rankingChangePositions || 3; // Default threshold is 3 positions
    const trackedCompetitors = watch.competitorIds || [];

    // Create a map of product IDs to their positions from the previous result
    const previousPositions = new Map<string, number>();
    previousResult.rankingData.forEach((item) => {
      previousPositions.set(item.productId, item.position);
    });

    // Check each product in the current result
    for (const currentItem of currentResult.rankingData) {
      // If we're tracking specific competitors, skip others
      if (
        trackedCompetitors.length > 0 &&
        !trackedCompetitors.includes(currentItem.productId)
      ) {
        continue;
      }

      const previousPosition = previousPositions.get(currentItem.productId);
      if (previousPosition !== undefined) {
        const positionChange = previousPosition - currentItem.position;

        // Check if position change exceeds threshold (positive or negative)
        if (Math.abs(positionChange) >= threshold) {
          // Create an alert
          await this.createRankingChangeAlert(
            watch,
            currentResult.marketplace,
            currentItem,
            previousPosition,
            currentItem.position,
            positionChange,
          );
        }
      }
    }
  }

  /**
   * Check for price changes
   */
  private async checkPriceChanges(
    watch: CompetitorWatch,
    currentResult: KeywordResearchResult,
    previousResult: KeywordResearchResult,
  ): Promise<void> {
    const threshold = watch.thresholds.priceChangePercent || 5; // Default 5% price change threshold
    const trackedCompetitors = watch.competitorIds || [];

    // Create a map of product IDs to their prices from the previous result
    const previousPrices = new Map<string, number>();
    previousResult.rankingData.forEach((item) => {
      previousPrices.set(item.productId, item.price);
    });

    // Check each product in the current result
    for (const currentItem of currentResult.rankingData) {
      // If we're tracking specific competitors, skip others
      if (
        trackedCompetitors.length > 0 &&
        !trackedCompetitors.includes(currentItem.productId)
      ) {
        continue;
      }

      const previousPrice = previousPrices.get(currentItem.productId);
      if (previousPrice !== undefined && previousPrice > 0) {
        const priceChange =
          ((currentItem.price - previousPrice) / previousPrice) * 100;

        // Check if price change exceeds threshold (positive or negative)
        if (Math.abs(priceChange) >= threshold) {
          // Create an alert
          await this.createPriceChangeAlert(
            watch,
            currentResult.marketplace,
            currentItem,
            previousPrice,
            currentItem.price,
            priceChange,
          );
        }
      }
    }
  }

  /**
   * Check for new competitors
   */
  private async checkNewCompetitors(
    watch: CompetitorWatch,
    currentResult: KeywordResearchResult,
    previousResult: KeywordResearchResult,
  ): Promise<void> {
    // Get all product IDs from the previous result
    const previousProductIds = new Set(
      previousResult.rankingData.map((item) => item.productId),
    );

    // Check for new products in the current result (in top 10)
    const newTopCompetitors = currentResult.rankingData.filter(
      (item) => item.position <= 10 && !previousProductIds.has(item.productId),
    );

    // Create alerts for new competitors
    for (const newCompetitor of newTopCompetitors) {
      await this.createNewCompetitorAlert(
        watch,
        currentResult.marketplace,
        currentResult.keyword,
        newCompetitor,
      );
    }
  }

  /**
   * Check for stock status changes
   */
  private async checkStockStatusChanges(
    watch: CompetitorWatch,
    currentResult: KeywordResearchResult,
    previousResult: KeywordResearchResult,
  ): Promise<void> {
    const trackedCompetitors = watch.competitorIds || [];

    // Create a map of product IDs to their stock status from the previous result
    const previousStockStatus = new Map<string, boolean>();
    previousResult.rankingData.forEach((item) => {
      if (item.inStock !== undefined) {
        previousStockStatus.set(item.productId, item.inStock);
      }
    });

    // Check each product in the current result
    for (const currentItem of currentResult.rankingData) {
      // If we're tracking specific competitors, skip others
      if (
        trackedCompetitors.length > 0 &&
        !trackedCompetitors.includes(currentItem.productId)
      ) {
        continue;
      }

      // Skip if current stock status is undefined
      if (currentItem.inStock === undefined) {
        continue;
      }

      const previousStatus = previousStockStatus.get(currentItem.productId);
      if (
        previousStatus !== undefined &&
        previousStatus !== currentItem.inStock
      ) {
        // Create an alert for stock status change
        await this.createStockStatusChangeAlert(
          watch,
          currentResult.marketplace,
          currentItem,
          previousStatus,
          currentItem.inStock,
        );
      }
    }
  }

  /**
   * Check for review changes
   */
  private async checkReviewChanges(
    watch: CompetitorWatch,
    currentResult: KeywordResearchResult,
    previousResult: KeywordResearchResult,
  ): Promise<void> {
    const reviewCountThreshold = watch.thresholds.reviewCountChange || 10;
    const ratingThreshold = watch.thresholds.ratingChangeAmount || 0.3;
    const trackedCompetitors = watch.competitorIds || [];

    // Create maps for previous review data
    const previousReviewCounts = new Map<string, number>();
    const previousRatings = new Map<string, number>();

    previousResult.rankingData.forEach((item) => {
      if (item.reviewCount !== undefined) {
        previousReviewCounts.set(item.productId, item.reviewCount);
      }
      if (item.rating !== undefined) {
        previousRatings.set(item.productId, item.rating);
      }
    });

    // Check each product in the current result
    for (const currentItem of currentResult.rankingData) {
      // If we're tracking specific competitors, skip others
      if (
        trackedCompetitors.length > 0 &&
        !trackedCompetitors.includes(currentItem.productId)
      ) {
        continue;
      }

      // Check review count changes
      if (currentItem.reviewCount !== undefined) {
        const previousCount = previousReviewCounts.get(currentItem.productId);
        if (previousCount !== undefined) {
          const countChange = currentItem.reviewCount - previousCount;
          if (Math.abs(countChange) >= reviewCountThreshold) {
            await this.createReviewCountChangeAlert(
              watch,
              currentResult.marketplace,
              currentItem,
              previousCount,
              currentItem.reviewCount,
              countChange,
            );
          }
        }
      }

      // Check rating changes
      if (currentItem.rating !== undefined) {
        const previousRating = previousRatings.get(currentItem.productId);
        if (previousRating !== undefined) {
          const ratingChange = currentItem.rating - previousRating;
          if (Math.abs(ratingChange) >= ratingThreshold) {
            await this.createRatingChangeAlert(
              watch,
              currentResult.marketplace,
              currentItem,
              previousRating,
              currentItem.rating,
              ratingChange,
            );
          }
        }
      }
    }
  }

  /**
   * Create a ranking change alert
   */
  private async createRankingChangeAlert(
    watch: CompetitorWatch,
    marketplace: string,
    product: KeywordRankingData,
    oldPosition: number,
    newPosition: number,
    positionChange: number,
  ): Promise<void> {
    const isImprovement = positionChange > 0;

    const alert: Omit<CompetitorAlert, "id"> = {
      organizationId: watch.organizationId,
      userId: watch.userId,
      watchId: watch.id,
      alertType: CompetitorAlertType.RANKING_CHANGE,
      productId: product.productId,
      competitorId: product.productId,
      competitorName: product.brand || product.productTitle.split(" ")[0],
      keyword: watch.keyword,
      marketplace: marketplace,
      triggeredAt: new Date(),
      status: "new",
      importance: this.calculateImportance(positionChange, oldPosition),
      data: {
        oldValue: oldPosition,
        newValue: newPosition,
        changeAmount: positionChange,
        additionalInfo: {
          isImprovement,
          productTitle: product.productTitle,
          productUrl: product.productUrl,
          imageUrl: product.imageUrl,
        },
      },
      notificationStatus: {
        sent: false,
        channels: [],
      },
    };

    await this.competitorAlertRepository.create(alert);

    // Record credit usage for notification
    await this.creditSystemService.recordUsage({
      organizationId: watch.organizationId,
      userId: watch.userId,
      usageType: CreditUsageType.COMPETITOR_ALERT_NOTIFICATION,
      modelId: "competitor-alert-system",
      modelProvider: "fluxori",
      inputTokens: 0,
      outputTokens: 0,
      success: true,
      metadata: {
        alertType: CompetitorAlertType.RANKING_CHANGE,
        marketplace,
        keyword: watch.keyword,
      },
    });
  }

  /**
   * Create a price change alert
   */
  private async createPriceChangeAlert(
    watch: CompetitorWatch,
    marketplace: string,
    product: KeywordRankingData,
    oldPrice: number,
    newPrice: number,
    percentChange: number,
  ): Promise<void> {
    const isPriceDecrease = percentChange < 0;

    const alert: Omit<CompetitorAlert, "id"> = {
      organizationId: watch.organizationId,
      userId: watch.userId,
      watchId: watch.id,
      alertType: CompetitorAlertType.PRICE_CHANGE,
      productId: product.productId,
      competitorId: product.productId,
      competitorName: product.brand || product.productTitle.split(" ")[0],
      keyword: watch.keyword,
      marketplace: marketplace,
      triggeredAt: new Date(),
      status: "new",
      importance: this.calculatePriceChangeImportance(percentChange),
      data: {
        oldValue: oldPrice,
        newValue: newPrice,
        changePercent: percentChange,
        changeAmount: newPrice - oldPrice,
        additionalInfo: {
          isPriceDecrease,
          currency: product.currency,
          productTitle: product.productTitle,
          productUrl: product.productUrl,
          position: product.position,
          imageUrl: product.imageUrl,
        },
      },
      notificationStatus: {
        sent: false,
        channels: [],
      },
    };

    await this.competitorAlertRepository.create(alert);

    // Record credit usage for notification
    await this.creditSystemService.recordUsage({
      organizationId: watch.organizationId,
      userId: watch.userId,
      usageType: CreditUsageType.COMPETITOR_ALERT_NOTIFICATION,
      modelId: "competitor-alert-system",
      modelProvider: "fluxori",
      inputTokens: 0,
      outputTokens: 0,
      success: true,
      metadata: {
        alertType: CompetitorAlertType.PRICE_CHANGE,
        marketplace,
        keyword: watch.keyword,
      },
    });
  }

  /**
   * Create a new competitor alert
   */
  private async createNewCompetitorAlert(
    watch: CompetitorWatch,
    marketplace: string,
    keyword: string,
    product: KeywordRankingData,
  ): Promise<void> {
    const alert: Omit<CompetitorAlert, "id"> = {
      organizationId: watch.organizationId,
      userId: watch.userId,
      watchId: watch.id,
      alertType: CompetitorAlertType.NEW_COMPETITOR,
      productId: watch.productId,
      competitorId: product.productId,
      competitorName: product.brand || product.productTitle.split(" ")[0],
      keyword: keyword,
      marketplace: marketplace,
      triggeredAt: new Date(),
      status: "new",
      importance: this.calculateNewCompetitorImportance(product.position),
      data: {
        oldValue: null,
        newValue: product.position,
        additionalInfo: {
          productTitle: product.productTitle,
          productUrl: product.productUrl,
          price: product.price,
          currency: product.currency,
          position: product.position,
          rating: product.rating,
          reviewCount: product.reviewCount,
          imageUrl: product.imageUrl,
          inStock: product.inStock,
        },
      },
      notificationStatus: {
        sent: false,
        channels: [],
      },
    };

    await this.competitorAlertRepository.create(alert);

    // Record credit usage for notification
    await this.creditSystemService.recordUsage({
      organizationId: watch.organizationId,
      userId: watch.userId,
      usageType: CreditUsageType.COMPETITOR_ALERT_NOTIFICATION,
      modelId: "competitor-alert-system",
      modelProvider: "fluxori",
      inputTokens: 0,
      outputTokens: 0,
      success: true,
      metadata: {
        alertType: CompetitorAlertType.NEW_COMPETITOR,
        marketplace,
        keyword: watch.keyword,
      },
    });
  }

  /**
   * Create a stock status change alert
   */
  private async createStockStatusChangeAlert(
    watch: CompetitorWatch,
    marketplace: string,
    product: KeywordRankingData,
    oldStatus: boolean,
    newStatus: boolean,
  ): Promise<void> {
    const alert: Omit<CompetitorAlert, "id"> = {
      organizationId: watch.organizationId,
      userId: watch.userId,
      watchId: watch.id,
      alertType: CompetitorAlertType.STOCK_STATUS_CHANGE,
      productId: product.productId,
      competitorId: product.productId,
      competitorName: product.brand || product.productTitle.split(" ")[0],
      keyword: watch.keyword,
      marketplace: marketplace,
      triggeredAt: new Date(),
      status: "new",
      // Stock going out of stock is high importance, coming back in stock is medium
      importance: newStatus ? "medium" : "high",
      data: {
        oldValue: oldStatus,
        newValue: newStatus,
        additionalInfo: {
          productTitle: product.productTitle,
          productUrl: product.productUrl,
          price: product.price,
          currency: product.currency,
          position: product.position,
          imageUrl: product.imageUrl,
        },
      },
      notificationStatus: {
        sent: false,
        channels: [],
      },
    };

    await this.competitorAlertRepository.create(alert);

    // Record credit usage for notification
    await this.creditSystemService.recordUsage({
      organizationId: watch.organizationId,
      userId: watch.userId,
      usageType: CreditUsageType.COMPETITOR_ALERT_NOTIFICATION,
      modelId: "competitor-alert-system",
      modelProvider: "fluxori",
      inputTokens: 0,
      outputTokens: 0,
      success: true,
      metadata: {
        alertType: CompetitorAlertType.STOCK_STATUS_CHANGE,
        marketplace,
        keyword: watch.keyword,
      },
    });
  }

  /**
   * Create a review count change alert
   */
  private async createReviewCountChangeAlert(
    watch: CompetitorWatch,
    marketplace: string,
    product: KeywordRankingData,
    oldCount: number,
    newCount: number,
    countChange: number,
  ): Promise<void> {
    const alert: Omit<CompetitorAlert, "id"> = {
      organizationId: watch.organizationId,
      userId: watch.userId,
      watchId: watch.id,
      alertType: CompetitorAlertType.REVIEW_CHANGE,
      productId: product.productId,
      competitorId: product.productId,
      competitorName: product.brand || product.productTitle.split(" ")[0],
      keyword: watch.keyword,
      marketplace: marketplace,
      triggeredAt: new Date(),
      status: "new",
      // Only high importance if ranking in top 5 and significant increase
      importance: product.position <= 5 && countChange > 20 ? "high" : "medium",
      data: {
        oldValue: oldCount,
        newValue: newCount,
        changeAmount: countChange,
        changePercent: (countChange / oldCount) * 100,
        additionalInfo: {
          productTitle: product.productTitle,
          productUrl: product.productUrl,
          position: product.position,
          rating: product.rating,
          imageUrl: product.imageUrl,
        },
      },
      notificationStatus: {
        sent: false,
        channels: [],
      },
    };

    await this.competitorAlertRepository.create(alert);

    // Record credit usage for notification
    await this.creditSystemService.recordUsage({
      organizationId: watch.organizationId,
      userId: watch.userId,
      usageType: CreditUsageType.COMPETITOR_ALERT_NOTIFICATION,
      modelId: "competitor-alert-system",
      modelProvider: "fluxori",
      inputTokens: 0,
      outputTokens: 0,
      success: true,
      metadata: {
        alertType: CompetitorAlertType.REVIEW_CHANGE,
        marketplace,
        keyword: watch.keyword,
      },
    });
  }

  /**
   * Create a rating change alert
   */
  private async createRatingChangeAlert(
    watch: CompetitorWatch,
    marketplace: string,
    product: KeywordRankingData,
    oldRating: number,
    newRating: number,
    ratingChange: number,
  ): Promise<void> {
    const alert: Omit<CompetitorAlert, "id"> = {
      organizationId: watch.organizationId,
      userId: watch.userId,
      watchId: watch.id,
      alertType: CompetitorAlertType.REVIEW_CHANGE,
      productId: product.productId,
      competitorId: product.productId,
      competitorName: product.brand || product.productTitle.split(" ")[0],
      keyword: watch.keyword,
      marketplace: marketplace,
      triggeredAt: new Date(),
      status: "new",
      // High importance if significant rating drop on top competitor
      importance:
        product.position <= 3 && ratingChange < -0.5 ? "high" : "medium",
      data: {
        oldValue: oldRating,
        newValue: newRating,
        changeAmount: ratingChange,
        additionalInfo: {
          productTitle: product.productTitle,
          productUrl: product.productUrl,
          position: product.position,
          reviewCount: product.reviewCount,
          imageUrl: product.imageUrl,
        },
      },
      notificationStatus: {
        sent: false,
        channels: [],
      },
    };

    await this.competitorAlertRepository.create(alert);

    // Record credit usage for notification
    await this.creditSystemService.recordUsage({
      organizationId: watch.organizationId,
      userId: watch.userId,
      usageType: CreditUsageType.COMPETITOR_ALERT_NOTIFICATION,
      modelId: "competitor-alert-system",
      modelProvider: "fluxori",
      inputTokens: 0,
      outputTokens: 0,
      success: true,
      metadata: {
        alertType: CompetitorAlertType.REVIEW_CHANGE,
        marketplace,
        keyword: watch.keyword,
      },
    });
  }

  /**
   * Process all due competitor watches
   */
  async processDueWatches(): Promise<number> {
    try {
      // Find all active watches that are due for checking
      const dueWatches =
        await this.competitorWatchRepository.findActiveWatches();
      this.logger.log(`Found ${dueWatches.length} watches due for processing`);

      // No watches to process
      if (dueWatches.length === 0) {
        return 0;
      }

      let processedCount = 0;

      // TODO: Implement the actual processing of watches, which would need to
      // fetch latest keyword research results for the watch's keywords and marketplaces
      // and compare with previous results.
      // This would typically be implemented as a scheduled task.

      return processedCount;
    } catch (error) {
      this.logger.error("Error processing due watches", error);
      throw error;
    }
  }

  /**
   * Send notifications for new alerts
   */
  async sendNotifications(organizationId: string): Promise<number> {
    try {
      // Find all new alerts that need notifications
      const newAlerts =
        await this.competitorAlertRepository.findNewAlerts(organizationId);
      this.logger.log(
        `Found ${newAlerts.length} new alerts to send notifications for`,
      );

      // No alerts to process
      if (newAlerts.length === 0) {
        return 0;
      }

      let sentCount = 0;

      // Process each alert
      for (const alert of newAlerts) {
        try {
          // Find the watch to get notification channels
          const watch = await this.competitorWatchRepository.findById(
            alert.watchId,
          );
          if (!watch) {
            this.logger.warn(`Watch not found for alert ${alert.id}`);
            continue;
          }

          // Skip if watch is no longer active
          if (!watch.isActive) {
            continue;
          }

          // TODO: Implement actual notification sending via the configured channels
          // This would typically integrate with a notification service

          // For now, we just mark it as sent
          await this.competitorAlertRepository.markAsSent(
            alert.id,
            watch.notificationChannels,
          );
          sentCount++;
        } catch (err) {
          this.logger.error(
            `Error sending notification for alert ${alert.id}`,
            err,
          );
        }
      }

      return sentCount;
    } catch (error) {
      this.logger.error("Error sending notifications", error);
      throw error;
    }
  }

  /**
   * Calculate the next check time based on frequency
   */
  private calculateNextCheckTime(fromDate: Date, frequency: string): Date {
    const nextCheck = new Date(fromDate);

    switch (frequency) {
      case "hourly":
        nextCheck.setHours(nextCheck.getHours() + 1);
        break;
      case "daily":
        nextCheck.setDate(nextCheck.getDate() + 1);
        break;
      case "weekly":
        nextCheck.setDate(nextCheck.getDate() + 7);
        break;
      default:
        // Default to daily
        nextCheck.setDate(nextCheck.getDate() + 1);
    }

    return nextCheck;
  }

  /**
   * Calculate the importance of a ranking change alert
   */
  private calculateImportance(
    positionChange: number,
    oldPosition: number,
  ): "critical" | "high" | "medium" | "low" {
    // Losing position (negative change) is more important
    if (positionChange < 0) {
      const absChange = Math.abs(positionChange);
      // Critical: Lost 3+ positions from top 3
      if (oldPosition <= 3 && absChange >= 3) {
        return "critical";
      }
      // High: Lost 5+ positions from top 5, or lost 3+ from top 10
      if (
        (oldPosition <= 5 && absChange >= 5) ||
        (oldPosition <= 10 && absChange >= 3)
      ) {
        return "high";
      }
      // Medium: Lost 3+ positions from anywhere
      if (absChange >= 3) {
        return "medium";
      }
      // Low: Small position losses
      return "low";
    } else {
      // Gaining position (positive change)
      // High: Gained 3+ positions into top 3
      if (oldPosition - positionChange <= 3 && positionChange >= 3) {
        return "high";
      }
      // Medium: Gained 5+ positions into top 10
      if (oldPosition - positionChange <= 10 && positionChange >= 5) {
        return "medium";
      }
      // Low: Any other position gains
      return "low";
    }
  }

  /**
   * Calculate the importance of a price change alert
   */
  private calculatePriceChangeImportance(
    percentChange: number,
  ): "critical" | "high" | "medium" | "low" {
    const absChange = Math.abs(percentChange);

    // Price decrease (negative change)
    if (percentChange < 0) {
      // Critical: Major price drop (over 25%)
      if (absChange >= 25) {
        return "critical";
      }
      // High: Significant price drop (15-25%)
      if (absChange >= 15) {
        return "high";
      }
      // Medium: Moderate price drop (10-15%)
      if (absChange >= 10) {
        return "medium";
      }
      // Low: Minor price drop
      return "low";
    } else {
      // Price increase (positive change)
      // High: Major price increase (over 20%)
      if (absChange >= 20) {
        return "high";
      }
      // Medium: Significant price increase (10-20%)
      if (absChange >= 10) {
        return "medium";
      }
      // Low: Minor price increase
      return "low";
    }
  }

  /**
   * Calculate the importance of a new competitor alert
   */
  private calculateNewCompetitorImportance(
    position: number,
  ): "critical" | "high" | "medium" | "low" {
    // Critical: New competitor in top 3
    if (position <= 3) {
      return "critical";
    }
    // High: New competitor in top 5
    if (position <= 5) {
      return "high";
    }
    // Medium: New competitor in top 10
    if (position <= 10) {
      return "medium";
    }
    // Low: New competitor outside top 10
    return "low";
  }
}
