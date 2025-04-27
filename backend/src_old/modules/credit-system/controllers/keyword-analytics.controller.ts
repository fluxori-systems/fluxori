import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  NotFoundException,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { KeywordAnalyticsService } from "../services/keyword-analytics.service";
import { FirebaseAuthGuard } from "@common/guards";
import { GetUser } from "@common/decorators";
import {
  AnalyticsRequestOptions,
  KeywordAnalyticsResult,
} from "../interfaces/types";

/**
 * Controller for keyword analytics operations in the credit system
 */
@Controller("credit-system/analytics")
@UseGuards(FirebaseAuthGuard)
export class KeywordAnalyticsController {
  private readonly logger = new Logger(KeywordAnalyticsController.name);

  constructor(private readonly analyticsService: KeywordAnalyticsService) {}

  /**
   * Estimate credit cost for analytics request
   */
  @Get("estimate")
  async estimateCredits(
    @GetUser() user: { uid: string; organizationId: string },
    @Query("keyword") keyword: string,
    @Query("marketplace") marketplace: string,
    @Query("includeMarketShare") includeMarketShareStr?: string,
    @Query("includeSeasonality") includeSeasonalityStr?: string,
    @Query("includeCompetitionAnalysis") includeCompetitionAnalysisStr?: string,
    @Query("includeTrendPrediction") includeTrendPredictionStr?: string,
    @Query("includeGrowthOpportunities") includeGrowthOpportunitiesStr?: string,
  ): Promise<{ creditCost: number; hasCredits: boolean }> {
    try {
      // Parse boolean values from string query parameters
      const includeMarketShare = includeMarketShareStr === "true";
      const includeSeasonality = includeSeasonalityStr === "true";
      const includeCompetitionAnalysis =
        includeCompetitionAnalysisStr === "true";
      const includeTrendPrediction = includeTrendPredictionStr === "true";
      const includeGrowthOpportunities =
        includeGrowthOpportunitiesStr === "true";

      const options: AnalyticsRequestOptions = {
        includeMarketShare,
        includeSeasonality,
        includeCompetitionAnalysis,
        includeTrendPrediction,
        includeGrowthOpportunities,
      };

      // Get analytics service as any type to access private method
      const service = this.analyticsService as any;
      const creditCost = service.calculateAnalyticsCost(options);

      return {
        creditCost,
        hasCredits: true, // Simplified - in reality would check credit balance
      };
    } catch (error) {
      this.logger.error(`Error estimating credit cost: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate analytics for a keyword
   */
  @Post()
  async generateAnalytics(
    @GetUser() user: { uid: string; organizationId: string },
    @Body()
    request: {
      keyword: string;
      marketplace: string;
      options: AnalyticsRequestOptions;
    },
  ): Promise<KeywordAnalyticsResult> {
    try {
      return await this.analyticsService.generateAnalytics(
        user.organizationId,
        user.uid,
        request.keyword,
        request.marketplace,
        request.options,
      );
    } catch (error) {
      this.logger.error(`Error generating analytics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get analytics by ID
   */
  @Get(":id")
  async getAnalyticsById(
    @GetUser() user: { uid: string; organizationId: string },
    @Param("id") id: string,
  ): Promise<KeywordAnalyticsResult> {
    try {
      // Get service as any to access repository
      const service = this.analyticsService as any;
      const result = await service.analyticsRepository.findById(id);

      if (!result || result.organizationId !== user.organizationId) {
        throw new NotFoundException(`Analytics with ID ${id} not found`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error getting analytics by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate analytics for multiple keywords
   */
  @Post("batch")
  async generateBatchAnalytics(
    @GetUser() user: { uid: string; organizationId: string },
    @Body()
    request: {
      keywords: string[];
      marketplace: string;
      options: AnalyticsRequestOptions;
    },
  ): Promise<{ results: KeywordAnalyticsResult[] }> {
    try {
      const resultsMap = await this.analyticsService.getAnalyticsForKeywords(
        user.organizationId,
        user.uid,
        request.keywords,
        request.marketplace,
        request.options,
      );

      // Convert map to array
      const results: KeywordAnalyticsResult[] = [];
      resultsMap.forEach((value) => {
        if (value !== null) {
          results.push(value);
        }
      });

      return { results };
    } catch (error) {
      this.logger.error(`Error generating batch analytics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get popular keywords
   */
  @Get("popular")
  async getPopularKeywords(
    @GetUser() user: { uid: string; organizationId: string },
    @Query("marketplace") marketplace: string,
    @Query("limit") limit?: string,
  ): Promise<KeywordAnalyticsResult[]> {
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : 10;
      return await this.analyticsService.getPopularKeywords(
        marketplace,
        parsedLimit,
      );
    } catch (error) {
      this.logger.error(`Error getting popular keywords: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get trending keywords
   */
  @Get("trending")
  async getTrendingKeywords(
    @GetUser() user: { uid: string; organizationId: string },
    @Query("marketplace") marketplace: string,
    @Query("limit") limit?: string,
  ): Promise<KeywordAnalyticsResult[]> {
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : 10;
      return await this.analyticsService.getTrendingKeywords(
        marketplace,
        parsedLimit,
      );
    } catch (error) {
      this.logger.error(`Error getting trending keywords: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get seasonal keywords for upcoming month
   */
  @Get("seasonal")
  async getSeasonalKeywords(
    @GetUser() user: { uid: string; organizationId: string },
    @Query("marketplace") marketplace: string,
    @Query("limit") limit?: string,
  ): Promise<KeywordAnalyticsResult[]> {
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : 10;
      return await this.analyticsService.getSeasonalKeywordsForUpcomingMonth(
        marketplace,
        parsedLimit,
      );
    } catch (error) {
      this.logger.error(`Error getting seasonal keywords: ${error.message}`);
      throw error;
    }
  }
}
