/**
 * Competitive Price Monitoring Service
 *
 * Service for monitoring and analyzing competitor prices
 * with special optimizations for South African e-commerce market
 */
import { Injectable, Logger, Inject, Optional } from "@nestjs/common";
import {
  CompetitorPrice,
  PriceSourceType,
  PriceVerificationStatus,
  CompetitorStockStatus,
  MarketPosition,
  PriceHistoryRecord,
  PriceMonitoringConfig,
  PriceAlert,
  CompetitorPriceReport,
  DateRange,
} from "../models/competitor-price.model";
import { CompetitorPriceRepository } from "../repositories/competitor-price.repository";
import { PriceHistoryRepository } from "../repositories/price-history.repository";
import { PriceMonitoringConfigRepository } from "../repositories/price-monitoring-config.repository";
import { PriceAlertRepository } from "../repositories/price-alert.repository";
import { LoadSheddingResilienceService } from "./load-shedding-resilience.service";
import { MarketContextService } from "./market-context.service";
import { ProductService } from "./product.service";
import {
  AgentService,
  ModelAdapterFactory,
  ModelComplexity,
  CompletionRequest,
} from "@modules/agent-framework";
import { FeatureFlagService } from "@modules/feature-flags";

/**
 * AI price analysis result interface
 */
export interface PriceAnalysisResult {
  /**
   * Text analysis of pricing situation
   */
  analysis: string;

  /**
   * List of pricing recommendations
   */
  recommendations: string[];

  /**
   * Market insights based on competitor behavior
   */
  marketInsights: string;
}

/**
 * Competitive Price Monitoring Service
 * Manages operations for monitoring and analyzing competitor prices
 */
@Injectable()
export class CompetitivePriceMonitoringService {
  private readonly logger = new Logger(CompetitivePriceMonitoringService.name);

  /**
   * Whether AI functionality is enabled
   */
  private readonly aiEnabled: boolean;

  constructor(
    private readonly competitorPriceRepository: CompetitorPriceRepository,
    private readonly priceHistoryRepository: PriceHistoryRepository,
    private readonly priceMonitoringConfigRepository: PriceMonitoringConfigRepository,
    private readonly priceAlertRepository: PriceAlertRepository,
    private readonly loadSheddingService: LoadSheddingResilienceService,
    private readonly marketContextService: MarketContextService,
    private readonly productService: ProductService,
    private readonly agentService?: AgentService,
    private readonly modelAdapterFactory?: ModelAdapterFactory,
    private readonly featureFlagService?: FeatureFlagService,
  ) {
    this.aiEnabled = !!(this.agentService && this.modelAdapterFactory);

    if (this.aiEnabled) {
      this.logger.log("AI price analysis features enabled");
    } else {
      this.logger.log("AI price analysis features disabled");
    }
  }

  /**
   * Record a new competitor price
   * @param data Competitor price data
   * @param organizationId Organization ID
   * @param userId User ID
   * @returns Recorded competitor price
   */
  async recordCompetitorPrice(
    data: Omit<
      CompetitorPrice,
      "id" | "createdAt" | "updatedAt" | "organizationId"
    >,
    organizationId: string,
    userId?: string,
  ): Promise<CompetitorPrice> {
    try {
      this.logger.log(
        `Recording competitor price for product ${data.productId}`,
      );

      // Verify product exists
      const product = await this.productService.findById(
        data.productId,
        organizationId,
      );
      if (!product) {
        throw new Error(`Product with ID ${data.productId} not found`);
      }

      // Check if there's an existing record for this competitor
      const existingPrices =
        await this.competitorPriceRepository.findByProductId(
          data.productId,
          organizationId,
          {
            marketplaceId: data.marketplaceId,
          },
        );

      const existingPrice = existingPrices.find(
        (p) =>
          p.competitorId === data.competitorId &&
          p.marketplaceId === data.marketplaceId,
      );

      // Update existing record if found
      if (existingPrice) {
        // Calculate if price has changed significantly
        const priceChange = data.price - existingPrice.price;
        const priceChangePercentage = (priceChange / existingPrice.price) * 100;
        const significantChange = Math.abs(priceChangePercentage) > 1; // 1% change threshold

        // Update price record
        const updatedPrice = await this.competitorPriceRepository.update(
          existingPrice.id || "",
          {
            price: data.price,
            shipping: data.shipping,
            totalPrice: data.price + data.shipping,
            lastUpdated: new Date(),
            sourceUrl: data.sourceUrl,
            sourceType: data.sourceType,
            verificationStatus:
              data.verificationStatus || PriceVerificationStatus.PENDING,
            hasBuyBox: data.hasBuyBox || false,
            stockStatus: data.stockStatus || CompetitorStockStatus.UNKNOWN,
            estimatedDeliveryDays: data.estimatedDeliveryDays,
            metadata: data.metadata,
          },
        );

        // Record in price history
        await this.priceHistoryRepository.recordCompetitorPrice({
          productId: data.productId,
          organizationId,
          variantId: data.variantId,
          competitorId: data.competitorId,
          competitorName: data.competitorName,
          marketplaceId: data.marketplaceId,
          marketplaceName: data.marketplaceName,
          price: data.price,
          shipping: data.shipping,
          currency: data.currency,
          hasBuyBox: data.hasBuyBox || false,
          sourceType: data.sourceType,
          verificationStatus:
            data.verificationStatus || PriceVerificationStatus.PENDING,
          stockStatus: data.stockStatus || CompetitorStockStatus.UNKNOWN,
        });

        // Generate alerts if price changed significantly
        if (significantChange) {
          const isDecrease = priceChange < 0;

          // Create alert
          await this.createPriceChangeAlert(
            data.productId,
            organizationId,
            data.competitorId,
            data.competitorName,
            existingPrice.price,
            data.price,
            isDecrease,
          );

          // Generate price adjustment recommendation if needed
          await this.checkAndRecommendPriceAdjustment(
            data.productId,
            organizationId,
          );
        }

        // Check for BuyBox status change
        if (data.hasBuyBox !== existingPrice.hasBuyBox && data.hasBuyBox) {
          // Create BuyBox lost alert if competitor gained BuyBox
          await this.createBuyBoxLostAlert(
            data.productId,
            organizationId,
            data.competitorId,
            data.competitorName,
            data.price,
            product.price,
          );
        }

        return updatedPrice;
      } else {
        // Create new price record
        const newPrice = await this.competitorPriceRepository.create({
          ...data,
          organizationId,
          totalPrice: data.price + data.shipping,
          lastUpdated: new Date(),
          verificationStatus:
            data.verificationStatus || PriceVerificationStatus.PENDING,
          hasBuyBox: data.hasBuyBox || false,
          stockStatus: data.stockStatus || CompetitorStockStatus.UNKNOWN,
        });

        // Record in price history
        await this.priceHistoryRepository.recordCompetitorPrice({
          productId: data.productId,
          organizationId,
          variantId: data.variantId,
          competitorId: data.competitorId,
          competitorName: data.competitorName,
          marketplaceId: data.marketplaceId,
          marketplaceName: data.marketplaceName,
          price: data.price,
          shipping: data.shipping,
          currency: data.currency,
          hasBuyBox: data.hasBuyBox || false,
          sourceType: data.sourceType,
          verificationStatus:
            data.verificationStatus || PriceVerificationStatus.PENDING,
          stockStatus: data.stockStatus || CompetitorStockStatus.UNKNOWN,
        });

        // Create new competitor alert
        await this.createNewCompetitorAlert(
          data.productId,
          organizationId,
          data.competitorId,
          data.competitorName,
          data.price,
          product.price,
          data.marketplaceName,
        );

        // Check if price adjustment is needed
        await this.checkAndRecommendPriceAdjustment(
          data.productId,
          organizationId,
        );

        return newPrice;
      }
    } catch (error) {
      this.logger.error(
        `Error recording competitor price: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Record our product price in history
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param price Product price
   * @param shipping Shipping cost
   * @param currency Currency code
   * @param options Additional options
   * @returns Recorded price history entry
   */
  async recordOurPrice(
    productId: string,
    organizationId: string,
    price: number,
    shipping: number,
    currency: string,
    options?: {
      variantId?: string;
      marketplaceId?: string;
      marketplaceName?: string;
      hasBuyBox?: boolean;
      sourceType?: PriceSourceType;
    },
  ): Promise<PriceHistoryRecord> {
    try {
      this.logger.log(`Recording our price for product ${productId}`);

      // Verify product exists
      const product = await this.productService.findById(
        productId,
        organizationId,
      );
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      // Record in price history
      const historyRecord = await this.priceHistoryRepository.recordOurPrice(
        productId,
        organizationId,
        price,
        shipping,
        currency,
        options,
      );

      // Calculate market position
      const marketPosition =
        await this.competitorPriceRepository.calculateMarketPosition(
          productId,
          organizationId,
          price,
          shipping,
          options?.marketplaceId,
        );

      // Check if we've lost BuyBox position
      if (marketPosition.rank > 1 && options?.hasBuyBox === false) {
        // Get competitor with lowest price
        const competitors =
          await this.competitorPriceRepository.findByProductId(
            productId,
            organizationId,
            { marketplaceId: options?.marketplaceId },
          );

        if (competitors.length > 0) {
          const lowestCompetitor = competitors[0];

          // Create BuyBox lost alert
          await this.createBuyBoxLostAlert(
            productId,
            organizationId,
            lowestCompetitor.competitorId,
            lowestCompetitor.competitorName,
            lowestCompetitor.price,
            price,
          );
        }
      }

      return historyRecord;
    } catch (error) {
      this.logger.error(
        `Error recording our price: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get competitor prices for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param options Query options
   * @returns List of competitor prices
   */
  async getCompetitorPrices(
    productId: string,
    organizationId: string,
    options?: {
      marketplaceId?: string;
      includeOutOfStock?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<CompetitorPrice[]> {
    try {
      // Verify product exists
      const product = await this.productService.findById(
        productId,
        organizationId,
      );
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      return this.competitorPriceRepository.findByProductId(
        productId,
        organizationId,
        options,
      );
    } catch (error) {
      this.logger.error(
        `Error getting competitor prices: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get current market position for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param marketplaceId Optional marketplace ID
   * @returns Market position information
   */
  async getMarketPosition(
    productId: string,
    organizationId: string,
    marketplaceId?: string,
  ): Promise<MarketPosition> {
    try {
      // Get product
      const product = await this.productService.findById(
        productId,
        organizationId,
      );
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      // Assume shipping is 0 if not available
      const shipping = product.shipping || 0;

      return this.competitorPriceRepository.calculateMarketPosition(
        productId,
        organizationId,
        product.price,
        shipping,
        marketplaceId,
      );
    } catch (error) {
      this.logger.error(
        `Error getting market position: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get price history for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param days Number of days of history to retrieve
   * @param options Query options
   * @returns Price history data
   */
  async getPriceHistory(
    productId: string,
    organizationId: string,
    days: number = 30,
    options?: {
      marketplaceId?: string;
      includeCompetitors?: boolean;
    },
  ): Promise<{
    dates: string[];
    ourPrices: number[];
    competitorPrices: Record<string, number[]>;
  }> {
    try {
      // Verify product exists
      const product = await this.productService.findById(
        productId,
        organizationId,
      );
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const dateRange: DateRange = {
        startDate,
        endDate,
      };

      return this.priceHistoryRepository.getAggregatedPriceHistory(
        productId,
        organizationId,
        dateRange,
        options,
      );
    } catch (error) {
      this.logger.error(
        `Error getting price history: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Configure price monitoring for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param config Configuration data
   * @param userId User ID
   * @returns Updated price monitoring configuration
   */
  async configurePriceMonitoring(
    productId: string,
    organizationId: string,
    config: Partial<PriceMonitoringConfig>,
    userId: string,
  ): Promise<PriceMonitoringConfig> {
    try {
      this.logger.log(`Configuring price monitoring for product ${productId}`);

      // Verify product exists
      const product = await this.productService.findById(
        productId,
        organizationId,
      );
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      // Check if configuration already exists
      const existingConfig =
        await this.priceMonitoringConfigRepository.findByProductId(
          productId,
          organizationId,
        );

      if (existingConfig) {
        // Update existing configuration
        return this.priceMonitoringConfigRepository.update(
          existingConfig.id || "",
          {
            ...config,
            updatedBy: userId,
          },
        );
      } else {
        // Create new configuration
        // Default configuration values
        const defaultConfig: Omit<
          PriceMonitoringConfig,
          "id" | "createdAt" | "updatedAt"
        > = {
          organizationId,
          productId,
          variantId: config.variantId,
          isEnabled: config.isEnabled !== undefined ? config.isEnabled : true,
          monitoringIntervalMinutes: config.monitoringIntervalMinutes || 60,
          monitoredMarketplaces: config.monitoredMarketplaces || [],
          monitoredCompetitors: config.monitoredCompetitors || [],
          notificationThresholdPercentage:
            config.notificationThresholdPercentage || 5,
          notificationThresholdAmount: config.notificationThresholdAmount,
          enableAutomaticPriceAdjustment:
            config.enableAutomaticPriceAdjustment !== undefined
              ? config.enableAutomaticPriceAdjustment
              : false,
          minimumPrice: config.minimumPrice,
          maximumPrice: config.maximumPrice,
          minimumMarginPercentage: config.minimumMarginPercentage,
          priceStrategy: config.priceStrategy || {
            type: "BEAT_BY_PERCENTAGE",
            value: 2, // Default to beat by 2%
          },
          createdBy: userId,
          updatedBy: userId,
        };

        return this.priceMonitoringConfigRepository.create(defaultConfig);
      }
    } catch (error) {
      this.logger.error(
        `Error configuring price monitoring: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get price monitoring configuration for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   * @returns Price monitoring configuration
   */
  async getPriceMonitoringConfig(
    productId: string,
    organizationId: string,
  ): Promise<PriceMonitoringConfig | null> {
    try {
      return this.priceMonitoringConfigRepository.findByProductId(
        productId,
        organizationId,
      );
    } catch (error) {
      this.logger.error(
        `Error getting price monitoring config: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get price alerts for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param options Query options
   * @returns List of price alerts
   */
  async getPriceAlerts(
    productId: string,
    organizationId: string,
    options?: {
      includeResolved?: boolean;
      alertType?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<PriceAlert[]> {
    try {
      return this.priceAlertRepository.findByProductId(
        productId,
        organizationId,
        options,
      );
    } catch (error) {
      this.logger.error(
        `Error getting price alerts: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Mark price alert as read
   * @param alertId Alert ID
   * @param organizationId Organization ID
   * @param userId User ID
   * @returns Updated alert
   */
  async markAlertAsRead(
    alertId: string,
    organizationId: string,
    userId: string,
  ): Promise<PriceAlert> {
    try {
      const alert = await this.priceAlertRepository.findById(alertId);

      if (!alert) {
        throw new Error(`Alert with ID ${alertId} not found`);
      }

      if (alert.organizationId !== organizationId) {
        throw new Error(
          `Alert with ID ${alertId} does not belong to this organization`,
        );
      }

      return this.priceAlertRepository.markAsRead(alertId, userId);
    } catch (error) {
      this.logger.error(
        `Error marking alert as read: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Mark price alert as resolved
   * @param alertId Alert ID
   * @param organizationId Organization ID
   * @param userId User ID
   * @returns Updated alert
   */
  async markAlertAsResolved(
    alertId: string,
    organizationId: string,
    userId: string,
  ): Promise<PriceAlert> {
    try {
      const alert = await this.priceAlertRepository.findById(alertId);

      if (!alert) {
        throw new Error(`Alert with ID ${alertId} not found`);
      }

      if (alert.organizationId !== organizationId) {
        throw new Error(
          `Alert with ID ${alertId} does not belong to this organization`,
        );
      }

      return this.priceAlertRepository.markAsResolved(alertId, userId);
    } catch (error) {
      this.logger.error(
        `Error marking alert as resolved: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Generate a competitive price report for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param options Report options
   * @returns Comprehensive price report
   */
  async generatePriceReport(
    productId: string,
    organizationId: string,
    options?: {
      marketplaceId?: string;
      includeHistory?: boolean;
      daysOfHistory?: number;
      includeRecommendations?: boolean;
    },
  ): Promise<CompetitorPriceReport> {
    try {
      this.logger.log(`Generating price report for product ${productId}`);

      // Get product
      const product = await this.productService.findById(
        productId,
        organizationId,
      );
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      // Get competitor prices
      const competitorPrices =
        await this.competitorPriceRepository.findByProductId(
          productId,
          organizationId,
          {
            marketplaceId: options?.marketplaceId,
            includeOutOfStock: true,
            limit: 100,
          },
        );

      // Get market position
      const marketPosition = await this.getMarketPosition(
        productId,
        organizationId,
        options?.marketplaceId,
      );

      // Determine BuyBox winner
      const buyBoxHolder = competitorPrices.find((p) => p.hasBuyBox);
      const hasBuyBox = !buyBoxHolder || marketPosition.rank === 1;

      // Get active alert count
      const alerts = await this.priceAlertRepository.findByProductId(
        productId,
        organizationId,
        { includeResolved: false },
      );

      // Include price history if requested
      let priceHistory;
      if (options?.includeHistory) {
        priceHistory = await this.getPriceHistory(
          productId,
          organizationId,
          options.daysOfHistory || 30,
          { marketplaceId: options?.marketplaceId },
        );
      }

      // Include price recommendations if requested
      let priceRecommendations;
      if (options?.includeRecommendations) {
        const recommendation = await this.calculatePriceRecommendation(
          productId,
          organizationId,
          options?.marketplaceId,
        );

        if (recommendation) {
          priceRecommendations = recommendation;
        }
      }

      // Shipping defaults to 0 if not available
      const ourShipping = product.shipping || 0;

      return {
        organizationId,
        productId,
        productSku: product.sku || "",
        productName: product.name,
        ourPrice: product.price,
        ourShipping,
        ourTotalPrice: product.price + ourShipping,
        currency: product.currency || "ZAR", // Default to ZAR for South African market
        hasBuyBox,
        marketPosition,
        competitorPrices,
        priceHistory,
        priceRecommendations,
        activeAlertCount: alerts.length,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error generating price report: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Calculate price recommendations for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param marketplaceId Optional marketplace ID
   * @returns Price recommendation or null if no recommendation
   */
  private async calculatePriceRecommendation(
    productId: string,
    organizationId: string,
    marketplaceId?: string,
  ): Promise<{
    recommendedPrice: number;
    strategy: string;
    potentialMarketPosition: MarketPosition;
    reasonForRecommendation: string;
  } | null> {
    try {
      // Get product
      const product = await this.productService.findById(
        productId,
        organizationId,
      );
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      // Get price monitoring config
      const config = await this.priceMonitoringConfigRepository.findByProductId(
        productId,
        organizationId,
      );

      // Get competitor prices
      const competitorPrices =
        await this.competitorPriceRepository.findByProductId(
          productId,
          organizationId,
          {
            marketplaceId,
            includeOutOfStock: false,
          },
        );

      if (competitorPrices.length === 0) {
        return null; // No competitors to compare against
      }

      // Get current market position
      const currentPosition = await this.getMarketPosition(
        productId,
        organizationId,
        marketplaceId,
      );

      // Default pricing strategy if no config
      const strategy = config?.priceStrategy?.type || "BEAT_BY_PERCENTAGE";
      const strategyValue = config?.priceStrategy?.value || 2; // 2% default

      let recommendedPrice = product.price;
      let reasonForRecommendation = "No price adjustment recommended";

      if (currentPosition.rank === 1) {
        // We're already the cheapest
        if (currentPosition.priceDifferencePercentage > 10) {
          // We're more than 10% cheaper than the next competitor
          // Recommend increasing our price to maximize margin while staying competitive
          const nextCompetitorPrice =
            competitorPrices.length > 0
              ? competitorPrices[0].totalPrice
              : product.price;

          const increasedPrice = nextCompetitorPrice * 0.98; // 2% cheaper than next competitor

          if (increasedPrice > product.price) {
            recommendedPrice = increasedPrice;
            reasonForRecommendation =
              "Increase price to maximize margin while staying competitive";
          }
        }
      } else {
        // We're not the cheapest
        switch (strategy) {
          case "MATCH": {
            // Match the lowest competitor price
            recommendedPrice = competitorPrices[0].totalPrice;
            reasonForRecommendation = `Match the lowest competitor price (${competitorPrices[0].competitorName})`;
            break;
          }
          case "BEAT_BY_PERCENTAGE": {
            // Beat the lowest competitor by percentage
            const lowestPrice = competitorPrices[0].totalPrice;
            const discountAmount = (lowestPrice * strategyValue) / 100;
            recommendedPrice = lowestPrice - discountAmount;
            reasonForRecommendation = `Beat the lowest competitor (${competitorPrices[0].competitorName}) by ${strategyValue}%`;
            break;
          }
          case "BEAT_BY_AMOUNT": {
            // Beat the lowest competitor by amount
            recommendedPrice = competitorPrices[0].totalPrice - strategyValue;
            reasonForRecommendation = `Beat the lowest competitor (${competitorPrices[0].competitorName}) by ${strategyValue} units`;
            break;
          }
          case "MAINTAIN_POSITION": {
            // Maintain a specific position in the market
            const targetPosition = config?.priceStrategy?.targetPosition || 2;

            if (targetPosition < competitorPrices.length + 1) {
              const targetIndex = targetPosition - 1;

              if (targetPosition === 1) {
                // To be first, beat the current lowest by a small amount
                recommendedPrice = competitorPrices[0].totalPrice * 0.99;
                reasonForRecommendation =
                  "Price to obtain the lowest price position";
              } else if (targetIndex < competitorPrices.length) {
                // Position between two competitors
                const lowerPrice = competitorPrices[targetIndex - 1].totalPrice;
                const higherPrice = competitorPrices[targetIndex].totalPrice;

                // Position in the middle
                recommendedPrice = lowerPrice + (higherPrice - lowerPrice) / 2;
                reasonForRecommendation = `Price to maintain position ${targetPosition} in the market`;
              }
            }
            break;
          }
        }
      }

      // Apply minimum/maximum constraints
      if (config?.minimumPrice && recommendedPrice < config.minimumPrice) {
        recommendedPrice = config.minimumPrice;
        reasonForRecommendation += " (limited by minimum price)";
      }

      if (config?.maximumPrice && recommendedPrice > config.maximumPrice) {
        recommendedPrice = config.maximumPrice;
        reasonForRecommendation += " (limited by maximum price)";
      }

      // Apply minimum margin if cost is available
      if (config?.minimumMarginPercentage && product.cost) {
        const minMarginPrice =
          product.cost * (1 + config.minimumMarginPercentage / 100);

        if (recommendedPrice < minMarginPrice) {
          recommendedPrice = minMarginPrice;
          reasonForRecommendation += " (limited by minimum margin)";
        }
      }

      // Round to 2 decimal places
      recommendedPrice = Math.round(recommendedPrice * 100) / 100;

      // Calculate potential market position with new price
      const shipping = product.shipping || 0;
      const potentialPosition = await this.simulateMarketPosition(
        productId,
        organizationId,
        recommendedPrice,
        shipping,
        marketplaceId,
      );

      // Only return recommendation if it's different from current price
      if (Math.abs(recommendedPrice - product.price) < 0.01) {
        return null;
      }

      return {
        recommendedPrice,
        strategy,
        potentialMarketPosition: potentialPosition,
        reasonForRecommendation,
      };
    } catch (error) {
      this.logger.error(
        `Error calculating price recommendation: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Simulate market position with a hypothetical price
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param price Simulated price
   * @param shipping Simulated shipping
   * @param marketplaceId Optional marketplace ID
   * @returns Simulated market position
   */
  private async simulateMarketPosition(
    productId: string,
    organizationId: string,
    price: number,
    shipping: number,
    marketplaceId?: string,
  ): Promise<MarketPosition> {
    try {
      return this.competitorPriceRepository.calculateMarketPosition(
        productId,
        organizationId,
        price,
        shipping,
        marketplaceId,
      );
    } catch (error) {
      this.logger.error(
        `Error simulating market position: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Create a price change alert
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param competitorId Competitor ID
   * @param competitorName Competitor name
   * @param oldPrice Old price
   * @param newPrice New price
   * @param isDecrease Whether price decreased
   * @returns Created alert or null if error
   */
  private async createPriceChangeAlert(
    productId: string,
    organizationId: string,
    competitorId: string,
    competitorName: string,
    oldPrice: number,
    newPrice: number,
    isDecrease: boolean,
  ): Promise<PriceAlert | null> {
    try {
      const product = await this.productService.findById(
        productId,
        organizationId,
      );
      if (!product) {
        return null;
      }

      const priceChange = newPrice - oldPrice;
      const priceChangePercentage = (priceChange / oldPrice) * 100;

      const alertType = isDecrease
        ? "COMPETITOR_PRICE_DECREASE"
        : "COMPETITOR_PRICE_INCREASE";

      // Determine severity based on percentage change
      let severity: "LOW" | "MEDIUM" | "HIGH" = "LOW";
      if (Math.abs(priceChangePercentage) > 10) {
        severity = "HIGH";
      } else if (Math.abs(priceChangePercentage) > 5) {
        severity = "MEDIUM";
      }

      // Create message
      const message = isDecrease
        ? `${competitorName} decreased their price for "${product.name}" by ${Math.abs(priceChangePercentage).toFixed(1)}% (from ${oldPrice.toFixed(2)} to ${newPrice.toFixed(2)})`
        : `${competitorName} increased their price for "${product.name}" by ${priceChangePercentage.toFixed(1)}% (from ${oldPrice.toFixed(2)} to ${newPrice.toFixed(2)})`;

      const alert: Omit<PriceAlert, "id" | "createdAt"> = {
        organizationId,
        productId,
        alertType,
        severity,
        message,
        details: {
          competitorId,
          competitorName,
          oldPrice,
          newPrice,
          priceChange,
          priceChangePercentage,
          productName: product.name,
          productSku: product.sku,
        },
        isRead: false,
        isResolved: false,
      };

      return this.priceAlertRepository.create(alert);
    } catch (error) {
      this.logger.error(
        `Error creating price change alert: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Create a BuyBox lost alert
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param competitorId Competitor ID
   * @param competitorName Competitor name
   * @param competitorPrice Competitor price
   * @param ourPrice Our price
   * @returns Created alert or null if error
   */
  private async createBuyBoxLostAlert(
    productId: string,
    organizationId: string,
    competitorId: string,
    competitorName: string,
    competitorPrice: number,
    ourPrice: number,
  ): Promise<PriceAlert | null> {
    try {
      const product = await this.productService.findById(
        productId,
        organizationId,
      );
      if (!product) {
        return null;
      }

      const priceDifference = ourPrice - competitorPrice;
      const priceDifferencePercentage =
        (priceDifference / competitorPrice) * 100;

      // Create message
      const message = `You've lost the BuyBox for "${product.name}" to ${competitorName}. Their price (${competitorPrice.toFixed(2)}) is ${priceDifferencePercentage.toFixed(1)}% lower than yours (${ourPrice.toFixed(2)}).`;

      const alert: Omit<PriceAlert, "id" | "createdAt"> = {
        organizationId,
        productId,
        alertType: "BUYBOX_LOST",
        severity: "HIGH",
        message,
        details: {
          competitorId,
          competitorName,
          competitorPrice,
          ourPrice,
          priceDifference,
          priceDifferencePercentage,
          productName: product.name,
          productSku: product.sku,
        },
        isRead: false,
        isResolved: false,
      };

      return this.priceAlertRepository.create(alert);
    } catch (error) {
      this.logger.error(
        `Error creating BuyBox lost alert: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Create a new competitor alert
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param competitorId Competitor ID
   * @param competitorName Competitor name
   * @param competitorPrice Competitor price
   * @param ourPrice Our price
   * @param marketplaceName Marketplace name
   * @returns Created alert or null if error
   */
  private async createNewCompetitorAlert(
    productId: string,
    organizationId: string,
    competitorId: string,
    competitorName: string,
    competitorPrice: number,
    ourPrice: number,
    marketplaceName: string,
  ): Promise<PriceAlert | null> {
    try {
      const product = await this.productService.findById(
        productId,
        organizationId,
      );
      if (!product) {
        return null;
      }

      const priceDifference = ourPrice - competitorPrice;
      const priceDifferencePercentage =
        (priceDifference / competitorPrice) * 100;

      // Determine severity based on price comparison
      let severity: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";
      if (competitorPrice < ourPrice) {
        severity = "HIGH"; // Competitor is undercutting us
      }

      // Create message
      const message = `New competitor ${competitorName} detected for "${product.name}" on ${marketplaceName}. Their price is ${competitorPrice.toFixed(2)}, which is ${priceDifferencePercentage > 0 ? "higher" : "lower"} than yours by ${Math.abs(priceDifferencePercentage).toFixed(1)}%.`;

      const alert: Omit<PriceAlert, "id" | "createdAt"> = {
        organizationId,
        productId,
        alertType: "NEW_COMPETITOR",
        severity,
        message,
        details: {
          competitorId,
          competitorName,
          competitorPrice,
          ourPrice,
          priceDifference,
          priceDifferencePercentage,
          productName: product.name,
          productSku: product.sku,
          marketplaceName,
        },
        isRead: false,
        isResolved: false,
      };

      return this.priceAlertRepository.create(alert);
    } catch (error) {
      this.logger.error(
        `Error creating new competitor alert: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Create a price adjustment recommendation alert
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param recommendedPrice Recommended price
   * @param currentPrice Current price
   * @param reason Reason for recommendation
   * @returns Created alert or null if error
   */
  private async createPriceAdjustmentAlert(
    productId: string,
    organizationId: string,
    recommendedPrice: number,
    currentPrice: number,
    reason: string,
  ): Promise<PriceAlert | null> {
    try {
      const product = await this.productService.findById(
        productId,
        organizationId,
      );
      if (!product) {
        return null;
      }

      const priceChange = recommendedPrice - currentPrice;
      const priceChangePercentage = (priceChange / currentPrice) * 100;

      // Determine severity based on percentage change
      let severity: "LOW" | "MEDIUM" | "HIGH" = "LOW";
      if (Math.abs(priceChangePercentage) > 10) {
        severity = "HIGH";
      } else if (Math.abs(priceChangePercentage) > 5) {
        severity = "MEDIUM";
      }

      // Create message
      const message = `Price adjustment recommended for "${product.name}". ${reason}. Suggested price: ${recommendedPrice.toFixed(2)} (${priceChange > 0 ? "+" : ""}${priceChangePercentage.toFixed(1)}%).`;

      const alert: Omit<PriceAlert, "id" | "createdAt"> = {
        organizationId,
        productId,
        alertType: "PRICE_ADJUSTMENT_RECOMMENDED",
        severity,
        message,
        details: {
          recommendedPrice,
          currentPrice,
          priceChange,
          priceChangePercentage,
          reason,
          productName: product.name,
          productSku: product.sku,
        },
        isRead: false,
        isResolved: false,
      };

      return this.priceAlertRepository.create(alert);
    } catch (error) {
      this.logger.error(
        `Error creating price adjustment alert: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Check if a price adjustment is recommended and create alert if needed
   * @param productId Product ID
   * @param organizationId Organization ID
   */
  private async checkAndRecommendPriceAdjustment(
    productId: string,
    organizationId: string,
  ): Promise<void> {
    try {
      // Get product
      const product = await this.productService.findById(
        productId,
        organizationId,
      );
      if (!product) {
        return;
      }

      // Calculate recommendation
      const recommendation = await this.calculatePriceRecommendation(
        productId,
        organizationId,
      );

      if (recommendation) {
        // Check if price change is significant (more than 1%)
        const priceChange = recommendation.recommendedPrice - product.price;
        const priceChangePercentage = (priceChange / product.price) * 100;

        if (Math.abs(priceChangePercentage) > 1) {
          // Create alert
          await this.createPriceAdjustmentAlert(
            productId,
            organizationId,
            recommendation.recommendedPrice,
            product.price,
            recommendation.reasonForRecommendation,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error checking for price adjustment: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Automatically adjust price based on monitoring configuration
   * @param productId Product ID
   * @param organizationId Organization ID
   * @returns Adjustment result
   */
  async automaticallyAdjustPrice(
    productId: string,
    organizationId: string,
  ): Promise<{
    adjusted: boolean;
    oldPrice?: number;
    newPrice?: number;
    reason?: string;
  }> {
    try {
      this.logger.log(
        `Checking for automatic price adjustment for product ${productId}`,
      );

      // Get product
      const product = await this.productService.findById(
        productId,
        organizationId,
      );
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      // Get monitoring configuration
      const config = await this.priceMonitoringConfigRepository.findByProductId(
        productId,
        organizationId,
      );

      // Check if automatic adjustments are enabled
      if (
        !config ||
        !config.isEnabled ||
        !config.enableAutomaticPriceAdjustment
      ) {
        return { adjusted: false };
      }

      // Calculate recommendation
      const recommendation = await this.calculatePriceRecommendation(
        productId,
        organizationId,
      );

      if (!recommendation) {
        return { adjusted: false };
      }

      // Check if price change is significant (more than 1%)
      const priceChange = recommendation.recommendedPrice - product.price;
      const priceChangePercentage = (priceChange / product.price) * 100;

      if (Math.abs(priceChangePercentage) <= 1) {
        return { adjusted: false };
      }

      // Update product price
      await this.productService.update(
        productId,
        { price: recommendation.recommendedPrice },
        organizationId,
      );

      // Record price in history
      await this.recordOurPrice(
        productId,
        organizationId,
        recommendation.recommendedPrice,
        product.shipping || 0,
        product.currency || "ZAR",
      );

      // Create resolved price adjustment alert
      const alert = await this.createPriceAdjustmentAlert(
        productId,
        organizationId,
        recommendation.recommendedPrice,
        product.price,
        `${recommendation.reasonForRecommendation} (Automatically applied)`,
      );

      if (alert && alert.id) {
        // Mark as resolved since it was automatically applied
        await this.priceAlertRepository.markAsResolved(alert.id, "system");
      }

      return {
        adjusted: true,
        oldPrice: product.price,
        newPrice: recommendation.recommendedPrice,
        reason: recommendation.reasonForRecommendation,
      };
    } catch (error) {
      this.logger.error(
        `Error automatically adjusting price: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { adjusted: false };
    }
  }

  /**
   * Run monitoring for all enabled products
   * @param organizationId Organization ID
   * @param options Monitoring options
   * @returns Monitoring results
   */
  async runBatchMonitoring(
    organizationId: string,
    options?: {
      limit?: number;
      autoAdjustPrices?: boolean;
    },
  ): Promise<{
    processingTime: number;
    productsChecked: number;
    pricesUpdated: number;
    skippedDueToLoadShedding: boolean;
  }> {
    try {
      this.logger.log(
        `Running batch monitoring for organization ${organizationId}`,
      );

      const startTime = Date.now();

      // Check load shedding status
      const loadSheddingStatus =
        await this.loadSheddingService.getCurrentStatus();

      // Skip during severe load shedding
      if (loadSheddingStatus.currentStage > 4) {
        this.logger.warn(
          "Skipping batch monitoring due to severe load shedding",
        );

        return {
          processingTime: 0,
          productsChecked: 0,
          pricesUpdated: 0,
          skippedDueToLoadShedding: true,
        };
      }

      // Get enabled configurations
      const configs = await this.priceMonitoringConfigRepository.findEnabled(
        organizationId,
        options?.limit || 50,
      );

      // Process with load shedding resilience
      const result = await this.loadSheddingService.executeBatchWithResilience(
        configs,
        async (config) => {
          // If auto-adjust is enabled, run it
          if (
            options?.autoAdjustPrices &&
            config.enableAutomaticPriceAdjustment
          ) {
            return this.automaticallyAdjustPrice(
              config.productId,
              organizationId,
            );
          }
          return { adjusted: false };
        },
        {
          batchSize: 10,
          pauseAfterBatch: 2000,
          retryCount: 2,
          retryDelay: 5000,
        },
      );

      const processingTime = Date.now() - startTime;
      const productsChecked = result.processed;
      const pricesUpdated = result.results.filter(
        (r) => r.success && r.result?.adjusted,
      ).length;

      return {
        processingTime,
        productsChecked,
        pricesUpdated,
        skippedDueToLoadShedding: false,
      };
    } catch (error) {
      this.logger.error(
        `Error running batch monitoring: ${error instanceof Error ? error.message : String(error)}`,
      );

      return {
        processingTime: 0,
        productsChecked: 0,
        pricesUpdated: 0,
        skippedDueToLoadShedding: false,
      };
    }
  }

  /**
   * Verify competitor prices from external source
   * @param competitorPriceIds Array of competitor price IDs to verify
   * @param organizationId Organization ID
   * @param verificationSource Source of verification
   * @returns Verification results
   */
  async verifyCompetitorPrices(
    competitorPriceIds: string[],
    organizationId: string,
    verificationSource: PriceSourceType,
  ): Promise<{
    verified: number;
    failed: number;
    skipped: number;
  }> {
    try {
      this.logger.log(
        `Verifying ${competitorPriceIds.length} competitor prices`,
      );

      // Process with load shedding resilience
      const result = await this.loadSheddingService.executeBatchWithResilience(
        competitorPriceIds,
        async (priceId) => {
          const price = await this.competitorPriceRepository.findById(priceId);

          if (!price || price.organizationId !== organizationId) {
            return { status: "skipped" as const };
          }

          // In a real implementation, you would call an external service
          // For now, simulate with random verification success
          const isVerified = Math.random() > 0.2; // 80% success rate

          if (isVerified) {
            await this.competitorPriceRepository.update(priceId, {
              verificationStatus: PriceVerificationStatus.VERIFIED,
              lastUpdated: new Date(),
              sourceType: verificationSource,
            });

            return { status: "verified" as const };
          } else {
            await this.competitorPriceRepository.update(priceId, {
              verificationStatus: PriceVerificationStatus.FAILED,
              lastUpdated: new Date(),
            });

            return { status: "failed" as const };
          }
        },
        {
          batchSize: 10,
          pauseAfterBatch: 1000,
          retryCount: 2,
          retryDelay: 5000,
        },
      );

      const verified = result.results.filter(
        (r) => r.success && r.result?.status === "verified",
      ).length;
      const failed = result.results.filter(
        (r) => r.success && r.result?.status === "failed",
      ).length;
      const skipped = result.results.filter(
        (r) => r.success && r.result?.status === "skipped",
      ).length;

      return {
        verified,
        failed,
        skipped,
      };
    } catch (error) {
      this.logger.error(
        `Error verifying competitor prices: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Generate price analysis with AI
   * @param productId Product ID
   * @param organizationId Organization ID
   * @returns AI-generated price analysis or null if unavailable
   */
  async generateAiPriceAnalysis(
    productId: string,
    organizationId: string,
  ): Promise<PriceAnalysisResult | null> {
    try {
      // Check if AI is enabled
      if (!this.aiEnabled || !this.agentService || !this.modelAdapterFactory) {
        this.logger.warn("AI analysis is not available");
        return null;
      }

      // Get product
      const product = await this.productService.findById(
        productId,
        organizationId,
      );
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      // Get price report
      const report = await this.generatePriceReport(productId, organizationId, {
        includeHistory: true,
        daysOfHistory: 30,
        includeRecommendations: true,
      });

      // Get load shedding status
      const loadSheddingStatus =
        await this.loadSheddingService.getCurrentStatus();

      // Skip during severe load shedding
      if (loadSheddingStatus.stage > 3) {
        this.logger.warn("Skipping AI analysis due to load shedding");
        return null;
      }

      // Prepare data for AI
      const competitorInfo = report.competitorPrices.map((cp) => ({
        name: cp.competitorName,
        price: cp.price,
        shipping: cp.shipping,
        totalPrice: cp.totalPrice,
        hasBuyBox: cp.hasBuyBox,
        stockStatus: cp.stockStatus,
      }));

      const priceHistory = report.priceHistory
        ? {
            dates: report.priceHistory.dates.slice(-10), // Last 10 days
            ourPrices: report.priceHistory.ourPrices.slice(-10),
            competitorPrices: Object.entries(
              report.priceHistory.competitorPrices,
            ).reduce<Record<string, number[]>>((acc, [key, values]) => {
              acc[key] = values.slice(-10);
              return acc;
            }, {}),
          }
        : null;

      // Create prompt for AI
      const prompt = `
        Analyze the competitive pricing data for product "${product.name}" with SKU "${product.sku}".
        
        Product Information:
        - Current Price: ${product.price}
        - Shipping: ${product.shipping || 0}
        - Total Price: ${product.price + (product.shipping || 0)}
        - Market Position Rank: ${report.marketPosition.rank} of ${report.marketPosition.totalCompetitors + 1}
        - Has BuyBox: ${report.hasBuyBox ? "Yes" : "No"}
        
        Competitor Information:
        ${JSON.stringify(competitorInfo, null, 2)}
        
        ${
          priceHistory
            ? `Price History (Last 10 Days):
        ${JSON.stringify(priceHistory, null, 2)}`
            : ""
        }
        
        ${
          report.priceRecommendations
            ? `Price Recommendation:
        ${JSON.stringify(report.priceRecommendations, null, 2)}`
            : ""
        }
        
        Active Alerts: ${report.activeAlertCount}
        
        Please provide:
        1. A concise analysis of the pricing situation
        2. 3-5 actionable pricing recommendations
        3. Market insights based on competitor behavior
        
        Return your analysis in the following JSON format:
        {
          "analysis": "Brief analysis text",
          "recommendations": ["Recommendation 1", "Recommendation 2", ...],
          "marketInsights": "Market insights text"
        }
        
        Keep your analysis concise and focused on actionable insights for the South African e-commerce market.
      `;

      // Get the best model for text analysis
      const model = await this.agentService.getBestModelForTask(
        organizationId,
        ModelComplexity.STANDARD,
        undefined,
        ["text-generation"],
      );

      if (!model) {
        this.logger.error("No suitable model found for price analysis");
        return null;
      }

      // Create the completion request
      const completionRequest: CompletionRequest = {
        prompt,
        options: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      };

      // Get the model adapter and generate the completion
      const adapter = this.modelAdapterFactory.getAdapter(model);
      const response = await adapter.generateCompletion(
        model,
        completionRequest,
      );

      // Parse the JSON response
      try {
        const parsedResponse = JSON.parse(
          response.content,
        ) as PriceAnalysisResult;

        // Validate the response shape
        if (
          !parsedResponse.analysis ||
          !Array.isArray(parsedResponse.recommendations) ||
          !parsedResponse.marketInsights
        ) {
          this.logger.error("Invalid AI response format");
          return null;
        }

        return parsedResponse;
      } catch (parseError) {
        this.logger.error(
          `Error parsing AI response: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        );
        return null;
      }
    } catch (error) {
      this.logger.error(
        `Error generating AI price analysis: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}
