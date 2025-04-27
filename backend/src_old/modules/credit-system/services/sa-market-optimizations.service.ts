import { Injectable, Logger } from "@nestjs/common";
import {
  FeatureFlagsManager,
  SARegionalFeatureFlags,
} from "../utils/feature-flags.manager";
import {
  CompetitorWatchRepository,
  CompetitorAlertRepository,
} from "../repositories/competitor-alert.repository";
import {
  KeywordResearchResult,
  CompetitorWatch,
  CompetitorAlert,
  CompetitorAlertType,
} from "../interfaces/types";

/**
 * Service for South African market-specific optimizations and features
 * Implements specialized functions for the South African e-commerce market
 */
@Injectable()
export class SAMarketOptimizationsService {
  private readonly logger = new Logger(SAMarketOptimizationsService.name);

  // Current load shedding stage (1-6) - would be updated from a real API
  private currentLoadSheddingStage: number = 0;

  // Flag to indicate if load shedding is currently active
  private isLoadSheddingActive: boolean = false;

  // Timestamp of last load shedding check
  private lastLoadSheddingCheck: Date = new Date();

  // Current load shedding schedule - would be populated from a real API
  private loadSheddingSchedule: Array<{
    stage: number;
    startTime: Date;
    endTime: Date;
    areas: string[];
  }> = [];

  constructor(
    private readonly featureFlagsManager: FeatureFlagsManager,
    private readonly competitorWatchRepository: CompetitorWatchRepository,
    private readonly competitorAlertRepository: CompetitorAlertRepository,
  ) {
    // Initialize with mock data for demonstration
    this.initializeLoadSheddingData();

    // Set up regular polling to update load shedding data
    setInterval(() => this.updateLoadSheddingData(), 15 * 60 * 1000); // every 15 minutes
  }

  /**
   * Initialize load shedding data with mock values
   * In a real implementation, this would fetch from an external API
   */
  private initializeLoadSheddingData(): void {
    // Set a random load shedding stage for testing (0 = no load shedding)
    this.currentLoadSheddingStage = Math.floor(Math.random() * 7);
    this.isLoadSheddingActive = this.currentLoadSheddingStage > 0;
    this.lastLoadSheddingCheck = new Date();

    // Create a mock schedule spanning the next 24 hours
    const now = new Date();
    this.loadSheddingSchedule = [];

    if (this.isLoadSheddingActive) {
      // Create mock schedule entries
      for (let i = 0; i < 4; i++) {
        const startTime = new Date(now.getTime() + i * 6 * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

        this.loadSheddingSchedule.push({
          stage: this.currentLoadSheddingStage,
          startTime,
          endTime,
          areas: ["Johannesburg", "Pretoria", "Cape Town", "Durban"].slice(
            0,
            Math.floor(Math.random() * 4) + 1,
          ),
        });
      }

      this.logger.log(
        `Initialized load shedding data: Stage ${this.currentLoadSheddingStage}`,
      );
    } else {
      this.logger.log(
        "Initialized load shedding data: No load shedding currently active",
      );
    }
  }

  /**
   * Update load shedding data from external source
   * In a real implementation, this would fetch from an external API
   */
  private async updateLoadSheddingData(): Promise<void> {
    try {
      // Simulate API call to get latest load shedding stage
      await new Promise((resolve) => setTimeout(resolve, 500));

      // For demonstration, randomly update the stage
      const newStage = Math.floor(Math.random() * 7);

      // If stage changed, log it and update the schedule
      if (newStage !== this.currentLoadSheddingStage) {
        this.logger.log(
          `Load shedding stage changed from ${this.currentLoadSheddingStage} to ${newStage}`,
        );
        this.currentLoadSheddingStage = newStage;
        this.isLoadSheddingActive = newStage > 0;
        this.initializeLoadSheddingData(); // Regenerate schedule
      }

      this.lastLoadSheddingCheck = new Date();
    } catch (error) {
      this.logger.error(`Error updating load shedding data: ${error.message}`);
    }
  }

  /**
   * Get current load shedding information
   */
  async getLoadSheddingInfo(): Promise<{
    stage: number;
    isActive: boolean;
    lastChecked: Date;
    schedule: Array<{
      stage: number;
      startTime: Date;
      endTime: Date;
      areas: string[];
    }>;
  }> {
    // Check if feature is enabled
    const isEnabled =
      await this.featureFlagsManager.isLoadSheddingAlertsEnabled();

    if (!isEnabled) {
      return {
        stage: 0,
        isActive: false,
        lastChecked: this.lastLoadSheddingCheck,
        schedule: [],
      };
    }

    return {
      stage: this.currentLoadSheddingStage,
      isActive: this.isLoadSheddingActive,
      lastChecked: this.lastLoadSheddingCheck,
      schedule: this.loadSheddingSchedule,
    };
  }

  /**
   * Analyzes the impact of load shedding on marketplace performance for a given product or keyword
   */
  async analyzeLoadSheddingImpact(
    organizationId: string,
    productId?: string,
    keyword?: string,
    marketplace?: string,
  ): Promise<{
    impactScore: number;
    searchVolumeChange: number;
    salesVolumeChange: number;
    priceElasticity: number;
    competitorBehavior: string;
    recommendations: string[];
  }> {
    try {
      // Check if both load shedding tracking and alerts are enabled
      const trackingEnabled =
        await this.featureFlagsManager.isLoadSheddingTrackingEnabled({
          organizationId,
        });

      const alertsEnabled =
        await this.featureFlagsManager.isLoadSheddingAlertsEnabled({
          organizationId,
        });

      if (!trackingEnabled || !alertsEnabled) {
        throw new Error(
          "Load shedding features are not fully enabled for this organization",
        );
      }

      // In a real implementation, we would analyze historical data during load shedding periods
      // For now, we'll generate synthetic analysis with reasonable values for South African market

      // Impact score between -100 (very negative) and +100 (very positive)
      const impactScore = -50 + Math.random() * 100; // between -50 and +50

      // Search volume change during load shedding periods (percentage)
      const searchVolumeChange = -30 + Math.random() * 60; // between -30% and +30%

      // Sales volume change during load shedding periods (percentage)
      const salesVolumeChange = -40 + Math.random() * 80; // between -40% and +40%

      // Price elasticity during load shedding (higher means more price sensitive)
      const priceElasticity = 1 + Math.random() * 3; // between 1 and 4

      // Competitor behavior summary
      const competitorBehaviors = [
        "Most competitors maintain pricing during load shedding",
        "Top competitors increase prices during load shedding periods",
        "Several competitors offer load shedding promotions",
        "Competitors emphasize delivery reliability during outages",
        "Reduced competitor stock availability during extended outages",
      ];

      const competitorBehavior =
        competitorBehaviors[
          Math.floor(Math.random() * competitorBehaviors.length)
        ];

      // Generate recommendations based on the impact
      const recommendations = [];

      if (impactScore < -20) {
        // Negative impact
        recommendations.push(
          "Highlight load shedding compatibility in product titles",
        );
        recommendations.push(
          "Create bundle offers with backup power solutions",
        );
        recommendations.push(
          "Temporarily adjust pricing during high stage load shedding",
        );
        recommendations.push(
          "Emphasize delivery reliability during outage periods",
        );
      } else if (impactScore > 20) {
        // Positive impact
        recommendations.push(
          "Increase promotion visibility during load shedding periods",
        );
        recommendations.push("Create load shedding specific landing pages");
        recommendations.push(
          "Optimize for 'load shedding compatible' search term",
        );
        recommendations.push(
          "Feature product in load shedding solution categories",
        );
      } else {
        // Neutral impact
        recommendations.push(
          "Add load shedding compatibility information to description",
        );
        recommendations.push(
          "Monitor competitor pricing during outage periods",
        );
        recommendations.push(
          "Test promotions during scheduled load shedding times",
        );
        recommendations.push(
          "Include power consumption details in specifications",
        );
      }

      return {
        impactScore,
        searchVolumeChange,
        salesVolumeChange,
        priceElasticity,
        competitorBehavior,
        recommendations,
      };
    } catch (error) {
      this.logger.error(
        `Error analyzing load shedding impact: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Process competitor alerts specifically for load shedding conditions
   * Identifies opportunities and threats during load shedding periods
   */
  async processLoadSheddingAlerts(
    organizationId: string,
    watches?: CompetitorWatch[],
  ): Promise<number> {
    try {
      // Check if load shedding alerts are enabled
      const alertsEnabled =
        await this.featureFlagsManager.isLoadSheddingAlertsEnabled({
          organizationId,
        });

      if (!alertsEnabled || !this.isLoadSheddingActive) {
        return 0; // No processing if disabled or no load shedding active
      }

      // Get watches if not provided
      let watchesToProcess = watches;
      if (!watchesToProcess) {
        watchesToProcess =
          await this.competitorWatchRepository.findByOrganization(
            organizationId,
          );
      }

      // Filter watches that have SA market options enabled
      const saWatches = watchesToProcess.filter(
        (watch) =>
          watch.metadata?.saMarketOptions?.trackLoadSheddingImpact === true,
      );

      if (saWatches.length === 0) {
        return 0;
      }

      let alertsCreated = 0;

      // Process each watch for load shedding specific alerts
      for (const watch of saWatches) {
        // In a real implementation, we would check recent marketplace data during load shedding
        // For now, we'll create synthetic alerts when load shedding is active

        const shouldCreateAlert = Math.random() > 0.5; // 50% chance

        if (shouldCreateAlert) {
          // Determine alert type
          const alertTypes = [
            CompetitorAlertType.PRICE_CHANGE,
            CompetitorAlertType.STOCK_STATUS_CHANGE,
          ];

          const alertType =
            alertTypes[Math.floor(Math.random() * alertTypes.length)];

          // Create appropriate alert based on type
          if (alertType === CompetitorAlertType.PRICE_CHANGE) {
            await this.createLoadSheddingPriceAlert(watch);
          } else {
            await this.createLoadSheddingStockAlert(watch);
          }

          alertsCreated++;
        }
      }

      return alertsCreated;
    } catch (error) {
      this.logger.error(
        `Error processing load shedding alerts: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Create a price change alert during load shedding
   */
  private async createLoadSheddingPriceAlert(
    watch: CompetitorWatch,
  ): Promise<void> {
    try {
      // Create a mock alert for price increases during load shedding
      const oldPrice = 1000 + Math.random() * 2000;
      const priceIncrease = 50 + Math.random() * 200; // R50-250 increase
      const newPrice = oldPrice + priceIncrease;
      const percentChange = (priceIncrease / oldPrice) * 100;

      const alert: Omit<CompetitorAlert, "id"> = {
        organizationId: watch.organizationId,
        userId: watch.userId,
        watchId: watch.id,
        alertType: CompetitorAlertType.PRICE_CHANGE,
        productId: watch.productId,
        competitorId: `comp-${Math.floor(Math.random() * 1000)}`,
        competitorName: `Competitor ${Math.floor(Math.random() * 10)}`,
        keyword: watch.keyword,
        marketplace: watch.marketplaces[0],
        triggeredAt: new Date(),
        status: "new",
        importance: percentChange > 15 ? "high" : "medium",
        data: {
          oldValue: oldPrice,
          newValue: newPrice,
          changePercent: percentChange,
          changeAmount: priceIncrease,
          additionalInfo: {
            isPriceIncrease: true,
            loadSheddingStage: this.currentLoadSheddingStage,
            isLoadSheddingRelated: true,
            productTitle: "Sample product during load shedding",
            message: `Price increased during Stage ${this.currentLoadSheddingStage} load shedding`,
          },
        },
        notificationStatus: {
          sent: false,
          channels: [],
        },
        metadata: {
          loadSheddingRelated: true,
          stage: this.currentLoadSheddingStage,
        },
      };

      await this.competitorAlertRepository.create(alert);
    } catch (error) {
      this.logger.error(
        `Error creating load shedding price alert: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Create a stock status change alert during load shedding
   */
  private async createLoadSheddingStockAlert(
    watch: CompetitorWatch,
  ): Promise<void> {
    try {
      // Create a mock alert for stock changes during load shedding
      const alert: Omit<CompetitorAlert, "id"> = {
        organizationId: watch.organizationId,
        userId: watch.userId,
        watchId: watch.id,
        alertType: CompetitorAlertType.STOCK_STATUS_CHANGE,
        productId: watch.productId,
        competitorId: `comp-${Math.floor(Math.random() * 1000)}`,
        competitorName: `Competitor ${Math.floor(Math.random() * 10)}`,
        keyword: watch.keyword,
        marketplace: watch.marketplaces[0],
        triggeredAt: new Date(),
        status: "new",
        importance: "high",
        data: {
          oldValue: true, // Was in stock
          newValue: false, // Now out of stock
          additionalInfo: {
            loadSheddingStage: this.currentLoadSheddingStage,
            isLoadSheddingRelated: true,
            productTitle: "Sample product during load shedding",
            message: `Stock depleted during Stage ${this.currentLoadSheddingStage} load shedding`,
            opportunity: "Out of stock competitors create sales opportunity",
          },
        },
        notificationStatus: {
          sent: false,
          channels: [],
        },
        metadata: {
          loadSheddingRelated: true,
          stage: this.currentLoadSheddingStage,
        },
      };

      await this.competitorAlertRepository.create(alert);
    } catch (error) {
      this.logger.error(
        `Error creating load shedding stock alert: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Process a keyword research result during load shedding periods
   * Enhances the result with load shedding specific insights
   */
  async enhanceWithLoadSheddingInsights(
    organizationId: string,
    result: KeywordResearchResult,
  ): Promise<KeywordResearchResult> {
    try {
      // Check if load shedding tracking and alerts are enabled
      const trackingEnabled =
        await this.featureFlagsManager.isLoadSheddingTrackingEnabled({
          organizationId,
        });

      const alertsEnabled =
        await this.featureFlagsManager.isLoadSheddingAlertsEnabled({
          organizationId,
        });

      if (!trackingEnabled || !alertsEnabled || !this.isLoadSheddingActive) {
        return result; // Return unmodified if features disabled or no load shedding
      }

      // Make a copy to avoid modifying the original
      const enhancedResult = { ...result };

      // Add load shedding insights to metadata
      if (!enhancedResult.metadata) {
        enhancedResult.metadata = {};
      }

      enhancedResult.metadata.loadSheddingInsights = {
        currentStage: this.currentLoadSheddingStage,
        analysisTimestamp: new Date().toISOString(),
        searchVolumeImpact: -20 + Math.random() * 40, // -20% to +20%
        relatedSearchTerms: [
          `${result.keyword} during load shedding`,
          `${result.keyword} power consumption`,
          `energy efficient ${result.keyword}`,
          `${result.keyword} for load shedding`,
          `backup power for ${result.keyword}`,
        ],
        recommendedActions: [
          `Highlight Stage ${this.currentLoadSheddingStage} compatibility in product title`,
          "Add power consumption specifications prominently",
          "Use 'load shedding ready' in product descriptions",
          "Emphasize battery life or backup options",
        ],
      };

      return enhancedResult;
    } catch (error) {
      this.logger.error(
        `Error enhancing with load shedding insights: ${error.message}`,
      );
      // Return original result on error
      return result;
    }
  }
}
