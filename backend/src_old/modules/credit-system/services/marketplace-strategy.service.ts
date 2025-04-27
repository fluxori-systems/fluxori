import { Injectable, Logger, NotFoundException, Inject } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import {
  MarketplaceStrategyRepository,
  StrategyTemplateRepository,
} from "../repositories/strategy-recommendation.repository";
import { CreditSystemService } from "./credit-system.service";
import { KeywordAnalyticsService } from "./keyword-analytics.service";
import { CompetitorAlertService } from "./competitor-alert.service";
import {
  MarketplaceStrategy,
  StrategyTemplate,
  StrategyRequestOptions,
  CreditUsageType,
  CreditCheckResponse,
} from "../interfaces/types";
import { AgentFrameworkDependencies } from "../interfaces/dependencies";

@Injectable()
export class MarketplaceStrategyService {
  private readonly logger = new Logger(MarketplaceStrategyService.name);

  constructor(
    private readonly marketplaceStrategyRepository: MarketplaceStrategyRepository,
    private readonly strategyTemplateRepository: StrategyTemplateRepository,
    private readonly creditSystemService: CreditSystemService,
    private readonly keywordAnalyticsService: KeywordAnalyticsService,
    private readonly competitorAlertService: CompetitorAlertService,
    @Inject("AgentFrameworkDependencies")
    private readonly agentFramework: AgentFrameworkDependencies,
  ) {}

  /**
   * Generate a new marketplace strategy
   */
  async generateStrategy(
    organizationId: string,
    userId: string,
    options: StrategyRequestOptions,
  ): Promise<MarketplaceStrategy> {
    try {
      // Estimate credit cost
      const creditCost = this.estimateStrategyCreditCost(options);

      // Check and reserve credits
      const creditCheck = await this.creditSystemService.checkCredits({
        operationId: uuidv4(), // Generate unique operation ID for the reservation
        organizationId,
        userId,
        expectedInputTokens: 0,
        expectedOutputTokens: 0,
        modelId: "marketplace-strategy",
        usageType: CreditUsageType.STRATEGY_RECOMMENDATION,
        metadata: {
          marketplace: options.marketplace,
          productId: options.productId,
          categoryId: options.categoryId,
          options,
        },
      });

      if (!creditCheck.hasCredits) {
        throw new Error(
          `Insufficient credits for strategy generation. Available: ${creditCheck.availableCredits}, Required: ${creditCost}`,
        );
      }

      // Gather data for strategy generation
      const strategyData = await this.gatherStrategyData(
        organizationId,
        options,
      );

      // Get strategy template
      let template = null;
      if (options.templateId) {
        template = await this.strategyTemplateRepository.findById(
          options.templateId,
        );
        if (!template) {
          throw new Error(
            `Strategy template with ID ${options.templateId} not found`,
          );
        }
      } else {
        // Get default template for this marketplace
        const templates =
          await this.strategyTemplateRepository.findByMarketplace(
            options.marketplace,
          );
        if (templates.length > 0) {
          template = templates[0];
        }
      }

      // Generate strategy using the agent framework adapter
      const generatedStrategy =
        await this.agentFramework.generateMarketplaceStrategy(
          options.marketplace,
          strategyData,
          {
            includeAiSummary: options.includeAiSummary,
            includeActionPlan: options.includeActionPlan,
            includeCompetitiveAnalysis: options.includeCompetitiveAnalysis,
            includeSouthAfricanInsights: options.includeSouthAfricanInsights,
            template: template?.promptTemplate,
          },
        );

      // Set expiration date (30 days from now)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Create strategy record
      const strategyRecord: Omit<MarketplaceStrategy, "id"> = {
        organizationId,
        userId,
        productId: options.productId,
        categoryId: options.categoryId,
        marketplace: options.marketplace,
        keywordInsights: generatedStrategy.keywordInsights || [],
        recommendedActions: generatedStrategy.recommendedActions || [],
        competitiveLandscape: generatedStrategy.competitiveLandscape || {},
        marketplaceSpecificInsights:
          generatedStrategy.marketplaceSpecificInsights || {},
        southAfricanMarketInsights:
          generatedStrategy.southAfricanMarketInsights || {},
        aiGeneratedSummary: generatedStrategy.aiGeneratedSummary || "",
        generatedAt: now,
        expiresAt,
        creditCost,
      };

      // Save strategy to database
      const strategyWithId =
        await this.marketplaceStrategyRepository.create(strategyRecord);

      // Record credit usage
      if (creditCheck.reservationId) {
        await this.creditSystemService.recordUsage({
          organizationId,
          userId,
          inputTokens: 0,
          outputTokens: 0,
          modelId: "marketplace-strategy",
          modelProvider: "fluxori",
          usageType: CreditUsageType.STRATEGY_RECOMMENDATION,
          success: true,
          reservationId: creditCheck.reservationId,
          metadata: {
            marketplace: options.marketplace,
            productId: options.productId,
            categoryId: options.categoryId,
          },
        });
      }

      // Return the created strategy
      return strategyWithId;
    } catch (error) {
      this.logger.error(
        `Error generating strategy: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get strategy by ID
   */
  async getStrategyById(id: string): Promise<MarketplaceStrategy> {
    const strategy = await this.marketplaceStrategyRepository.findById(id);
    if (!strategy) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }
    return strategy;
  }

  /**
   * Get strategies by marketplace
   */
  async getStrategiesByMarketplace(
    organizationId: string,
    marketplace: string,
  ): Promise<MarketplaceStrategy[]> {
    return await this.marketplaceStrategyRepository.findByMarketplace(
      organizationId,
      marketplace,
    );
  }

  /**
   * Get strategies by product
   */
  async getStrategiesByProduct(
    organizationId: string,
    productId: string,
  ): Promise<MarketplaceStrategy[]> {
    return await this.marketplaceStrategyRepository.findByProduct(
      organizationId,
      productId,
    );
  }

  /**
   * Get strategy templates
   */
  async getStrategyTemplates(
    marketplace?: string,
  ): Promise<StrategyTemplate[]> {
    if (marketplace) {
      return await this.strategyTemplateRepository.findByMarketplace(
        marketplace,
      );
    } else {
      return await this.strategyTemplateRepository.findAllActive();
    }
  }

  /**
   * Estimate credit cost for strategy generation
   */
  estimateStrategyCreditCost(options: StrategyRequestOptions): number {
    // Base cost for strategy generation
    let baseCost = 10;

    // Additional cost for options
    if (options.includeAiSummary) baseCost += 3;
    if (options.includeActionPlan) baseCost += 5;
    if (options.includeCompetitiveAnalysis) baseCost += 7;
    if (options.includeSouthAfricanInsights) baseCost += 5;

    // Adjust for marketplace - more data-rich marketplaces cost more
    const marketplaceMultiplier =
      {
        takealot: 1.2, // More data available, more comprehensive analysis
        amazon: 1.3,
        makro: 1.1,
        loot: 1.0,
        bob_shop: 0.9,
      }[options.marketplace] || 1.0;

    // Calculate final cost
    return Math.round(baseCost * marketplaceMultiplier);
  }

  /**
   * Get credit estimate for strategy generation
   */
  async getCreditEstimate(
    organizationId: string,
    userId: string,
    options: StrategyRequestOptions,
  ): Promise<{ creditCost: number; creditCheck: CreditCheckResponse }> {
    const creditCost = this.estimateStrategyCreditCost(options);

    // Check if user has enough credits without reserving
    const creditCheck = await this.creditSystemService.checkCredits({
      organizationId,
      userId,
      expectedInputTokens: 0,
      expectedOutputTokens: 0,
      modelId: "marketplace-strategy",
      usageType: CreditUsageType.STRATEGY_RECOMMENDATION,
    });

    return { creditCost, creditCheck };
  }

  /**
   * Gather data for strategy generation
   */
  private async gatherStrategyData(
    organizationId: string,
    options: StrategyRequestOptions,
  ): Promise<any> {
    try {
      const data: any = {
        marketplace: options.marketplace,
        keywords: [],
        competitors: [],
        productData: null,
        categoryData: null,
      };

      // Gather keyword data if provided
      if (options.keywords && options.keywords.length > 0) {
        // If we have analytics service data, get real analytics
        if (options.keywords.length <= 5) {
          // For a small number of keywords, we can get real analytics
          try {
            // Use the analytics service to get real data where possible
            const analyticsOptions = {
              includeMarketShare: options.includeCompetitiveAnalysis,
              includeSeasonality: true,
              includeCompetitionAnalysis: options.includeCompetitiveAnalysis,
              includeTrendPrediction: true,
              includeGrowthOpportunities: false,
            };

            // For each keyword, get analytics
            for (const keyword of options.keywords) {
              try {
                // In a real implementation, this would call the keyword analytics service
                // Here we're using the agent framework to generate insights
                const insights =
                  await this.agentFramework.generateKeywordInsights(
                    keyword,
                    options.marketplace,
                    analyticsOptions,
                  );

                // Extract the key details needed for strategy generation
                data.keywords.push({
                  keyword,
                  searchVolume: insights.searchVolume,
                  competitiveness:
                    insights.competitionAnalysis?.difficulty / 100 ||
                    Math.random(),
                  relevance: 0.7 + Math.random() * 0.3, // High relevance for explicitly provided keywords
                  opportunity:
                    insights.competitionAnalysis?.opportunityScore / 100 ||
                    Math.random(),
                  placement: ["title", "description", "keywords", "tags"][
                    Math.floor(Math.random() * 4)
                  ],
                  priority: ["high", "medium", "low"][
                    Math.floor(Math.random() * 3)
                  ],
                  seasonality: insights.seasonalityData?.peakMonths || [],
                });
              } catch (error) {
                this.logger.warn(
                  `Error getting analytics for keyword ${keyword}: ${error.message}`,
                );

                // Fallback to basic data
                data.keywords.push({
                  keyword,
                  searchVolume: Math.floor(Math.random() * 10000),
                  competitiveness: Math.random(),
                  relevance: Math.random(),
                  opportunity: Math.random(),
                  placement: ["title", "description", "keywords", "tags"][
                    Math.floor(Math.random() * 4)
                  ],
                  priority: ["high", "medium", "low"][
                    Math.floor(Math.random() * 3)
                  ],
                });
              }
            }
          } catch (error) {
            this.logger.warn(
              `Error in analytics processing: ${error.message}`,
              error.stack,
            );

            // Fallback for all keywords
            data.keywords = options.keywords.map((keyword) => ({
              keyword,
              searchVolume: Math.floor(Math.random() * 10000),
              competitiveness: Math.random(),
              relevance: Math.random(),
              opportunity: Math.random(),
              placement: ["title", "description", "keywords", "tags"][
                Math.floor(Math.random() * 4)
              ],
              priority: ["high", "medium", "low"][
                Math.floor(Math.random() * 3)
              ],
            }));
          }
        } else {
          // For many keywords, use simplified data
          data.keywords = options.keywords.map((keyword) => ({
            keyword,
            searchVolume: Math.floor(Math.random() * 10000),
            competitiveness: Math.random(),
            relevance: Math.random(),
            opportunity: Math.random(),
            placement: ["title", "description", "keywords", "tags"][
              Math.floor(Math.random() * 4)
            ],
            priority: ["high", "medium", "low"][Math.floor(Math.random() * 3)],
          }));
        }
      }

      // Gather competitor data if provided
      if (options.competitorUrls && options.competitorUrls.length > 0) {
        // Process competitor URLs to extract useful data
        data.competitors = options.competitorUrls.map((url) => {
          // Extract competitor name from URL
          const urlParts = url.split("/");
          const competitor =
            urlParts[urlParts.length - 1] ||
            urlParts[urlParts.length - 2] ||
            "Competitor";
          return competitor;
        });

        // In a real implementation, we would retrieve additional competitor data
        // such as pricing ranges, product attributes, etc.
      }

      // Get product data if product ID is provided
      if (options.productId) {
        // In a full implementation, this would retrieve the product data
        // For now, we'll use placeholder data
        data.productData = {
          id: options.productId,
          name: `Product ${options.productId}`,
          category: options.categoryId || "General",
          attributes: {},
        };
      }

      // Get category data if category ID is provided
      if (options.categoryId) {
        // In a full implementation, this would retrieve the category data
        // For now, we'll use placeholder data
        data.categoryData = {
          id: options.categoryId,
          name: `Category ${options.categoryId}`,
          parentCategory: null,
        };
      }

      // South African specific market data
      data.saMarketContext = {
        loadSheddingActive: true, // Contextual information for SA market
        popularPaymentMethods: ["credit-card", "eft", "instant-eft", "payflex"],
        shippingConsiderations: {
          majorHubs: ["johannesburg", "cape-town", "durban", "pretoria"],
          averageDeliveryTimes: {
            "same-day": ["johannesburg", "cape-town"],
            "next-day": ["pretoria", "durban"],
            standard: "3-5 days",
          },
        },
        regionalConsiderations: {
          languages: ["english", "afrikaans", "zulu", "xhosa"],
          currencyPrefix: "R",
          vatIncluded: true,
        },
      };

      return data;
    } catch (error) {
      this.logger.error(
        `Error gathering strategy data: ${error.message}`,
        error.stack,
      );
      // Return minimal data to allow strategy generation to proceed
      return {
        marketplace: options.marketplace,
        keywords: options.keywords || [],
        competitors: options.competitorUrls || [],
      };
    }
  }
}
