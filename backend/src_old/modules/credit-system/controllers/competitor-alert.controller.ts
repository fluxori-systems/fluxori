import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { CompetitorAlertService } from "../services/competitor-alert.service";
import { CreditSystemService } from "../services/credit-system.service";
import { SAMarketOptimizationsService } from "../services/sa-market-optimizations.service";
import { FirebaseAuthGuard } from "@common/guards";
import { GetUser } from "@common/decorators";
import {
  CompetitorWatch,
  CompetitorAlert,
  CompetitorAlertType,
  CreditUsageType,
  CreditCheckResponse,
} from "../interfaces/types";

/**
 * Controller for competitor alerts and watch operations
 * Includes South African market specific endpoints
 */
@Controller("credit-system/competitor-alerts")
@UseGuards(FirebaseAuthGuard)
export class CompetitorAlertController {
  private readonly logger = new Logger(CompetitorAlertController.name);

  constructor(
    private readonly competitorAlertService: CompetitorAlertService,
    private readonly creditSystemService: CreditSystemService,
    private readonly saMarketOptimizationsService: SAMarketOptimizationsService,
  ) {}

  /**
   * Get all competitor watches for the authenticated user's organization
   */
  @Get("watches")
  async getWatches(
    @GetUser() user: { uid: string; organizationId: string },
    @Query("userId") userId?: string,
  ): Promise<CompetitorWatch[]> {
    try {
      if (userId) {
        return await this.competitorAlertService.getWatchesByUser(
          user.organizationId,
          userId,
        );
      } else {
        return await this.competitorAlertService.getWatchesByOrganization(
          user.organizationId,
        );
      }
    } catch (error) {
      this.logger.error("Error getting competitor watches", error);
      throw error;
    }
  }

  /**
   * Get all alerts for the authenticated user's organization
   * Filters by userId, status, or importance if provided
   */
  @Get("alerts")
  async getAlerts(
    @GetUser() user: { uid: string; organizationId: string },
    @Query("userId") userId?: string,
    @Query("status") status?: "new" | "viewed" | "dismissed",
    @Query("importance") importance?: "critical" | "high" | "medium" | "low",
  ): Promise<CompetitorAlert[]> {
    try {
      // Get alerts specifically for a user if requested
      if (userId) {
        return await this.competitorAlertService.getAlertsByUser(
          user.organizationId,
          userId,
        );
      }

      // Get alerts by status if requested
      if (status) {
        return await this.competitorAlertService.getAlertsByStatus(
          user.organizationId,
          status,
        );
      }

      // Get alerts by importance if requested
      if (importance) {
        return await this.competitorAlertService.getAlertsByImportance(
          user.organizationId,
          importance,
        );
      }

      // Otherwise get all alerts for the organization
      return await this.competitorAlertService.getAlertsByOrganization(
        user.organizationId,
      );
    } catch (error) {
      this.logger.error("Error getting competitor alerts", error);
      throw error;
    }
  }

  /**
   * Get all new alerts for the authenticated user's organization
   */
  @Get("alerts/new")
  async getNewAlerts(
    @GetUser() user: { uid: string; organizationId: string },
  ): Promise<CompetitorAlert[]> {
    try {
      return await this.competitorAlertService.getNewAlerts(
        user.organizationId,
      );
    } catch (error) {
      this.logger.error("Error getting new alerts", error);
      throw error;
    }
  }

  /**
   * Get credit cost estimate for creating a competitor watch
   */
  @Post("watches/estimate")
  async estimateWatchCredits(
    @GetUser() user: { uid: string; organizationId: string },
    @Body()
    requestData: {
      alertTypes: CompetitorAlertType[];
      frequency: string;
      marketplaces: string[];
    },
  ): Promise<{ creditCost: number }> {
    try {
      const cost = this.competitorAlertService.estimateWatchCreditCost(
        requestData.alertTypes,
        requestData.frequency,
        requestData.marketplaces,
      );

      return { creditCost: cost };
    } catch (error) {
      this.logger.error("Error estimating competitor watch credits", error);
      throw error;
    }
  }

  /**
   * Create a competitor watch
   */
  @Post("watches")
  async createWatch(
    @GetUser() user: { uid: string; organizationId: string },
    @Body()
    watchData: Omit<
      CompetitorWatch,
      "id" | "createdAt" | "lastCheckedAt" | "nextCheckAt"
    >,
  ): Promise<CompetitorWatch> {
    try {
      // Estimate the credit cost
      const creditCost = this.competitorAlertService.estimateWatchCreditCost(
        watchData.alertTypes,
        watchData.frequency,
        watchData.marketplaces,
      );

      // Reserve credits for the operation
      const creditCheck = await this.creditSystemService.checkCredits({
        organizationId: user.organizationId,
        userId: user.uid,
        expectedInputTokens: 0,
        expectedOutputTokens: 0,
        modelId: "competitor-alert-system",
        usageType: CreditUsageType.COMPETITOR_ALERT_SETUP,
        operationId: uuidv4(), // Generate unique operation ID for the reservation
        metadata: {
          alertTypes: watchData.alertTypes,
          frequency: watchData.frequency,
          marketplaces: watchData.marketplaces,
        },
      });

      // If credit reservation failed, throw an error
      if (!creditCheck.hasCredits) {
        throw new Error(
          `Insufficient credits. Available: ${creditCheck.availableCredits}, Required: ${creditCost}`,
        );
      }

      // Create the watch with the credit cost
      return await this.competitorAlertService.createWatch({
        ...watchData,
        organizationId: user.organizationId,
        userId: user.uid,
        creditCost,
        creditReservationId: creditCheck.reservationId,
      });
    } catch (error) {
      this.logger.error("Error creating competitor watch", error);
      throw error;
    }
  }

  /**
   * Update a competitor watch
   */
  @Put("watches/:id")
  async updateWatch(
    @GetUser() user: { uid: string; organizationId: string },
    @Param("id") id: string,
    @Body() updateData: Partial<CompetitorWatch>,
  ): Promise<CompetitorWatch> {
    try {
      return await this.competitorAlertService.updateWatch(id, updateData);
    } catch (error) {
      this.logger.error(`Error updating competitor watch ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete a competitor watch
   */
  @Delete("watches/:id")
  async deleteWatch(
    @GetUser() user: { uid: string; organizationId: string },
    @Param("id") id: string,
  ): Promise<{ success: boolean }> {
    try {
      await this.competitorAlertService.deleteWatch(id);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting competitor watch ${id}`, error);
      throw error;
    }
  }

  /**
   * Mark an alert as viewed
   */
  @Put("alerts/:id/view")
  async markAlertViewed(
    @GetUser() user: { uid: string; organizationId: string },
    @Param("id") id: string,
  ): Promise<{ success: boolean }> {
    try {
      await this.competitorAlertService.markAlertViewed(id);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error marking alert ${id} as viewed`, error);
      throw error;
    }
  }

  /**
   * Dismiss an alert
   */
  @Put("alerts/:id/dismiss")
  async dismissAlert(
    @GetUser() user: { uid: string; organizationId: string },
    @Param("id") id: string,
  ): Promise<{ success: boolean }> {
    try {
      await this.competitorAlertService.dismissAlert(id);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error dismissing alert ${id}`, error);
      throw error;
    }
  }

  /**
   * Get current load shedding information
   * South African market specific endpoint
   */
  @Get("sa-market/load-shedding")
  async getLoadSheddingInfo(
    @GetUser() user: { uid: string; organizationId: string },
  ): Promise<any> {
    try {
      return await this.saMarketOptimizationsService.getLoadSheddingInfo();
    } catch (error) {
      this.logger.error("Error getting load shedding info", error);
      throw error;
    }
  }

  /**
   * Analyze load shedding impact on a product or keyword
   * South African market specific endpoint
   */
  @Get("sa-market/load-shedding-impact")
  async analyzeLoadSheddingImpact(
    @GetUser() user: { uid: string; organizationId: string },
    @Query("productId") productId?: string,
    @Query("keyword") keyword?: string,
    @Query("marketplace") marketplace?: string,
  ): Promise<any> {
    try {
      // Check if the user has sufficient credits for this operation
      const creditCheck = await this.creditSystemService.checkCredits({
        organizationId: user.organizationId,
        userId: user.uid,
        expectedInputTokens: 0,
        expectedOutputTokens: 0,
        modelId: "sa-market-analysis",
        usageType: CreditUsageType.MARKET_ANALYSIS,
        operationId: uuidv4(), // Generate unique operation ID for the reservation
        metadata: {
          analysisType: "load-shedding-impact",
          productId,
          keyword,
          marketplace,
        },
      });

      // If insufficient credits, throw an error
      if (!creditCheck.hasCredits) {
        throw new Error(
          `Insufficient credits. Available: ${creditCheck.availableCredits}, Required: 5`,
        );
      }

      // Perform the analysis
      const result =
        await this.saMarketOptimizationsService.analyzeLoadSheddingImpact(
          user.organizationId,
          productId,
          keyword,
          marketplace,
        );

      // Record the credit usage instead of confirming the reservation
      if (creditCheck.reservationId) {
        await this.creditSystemService.recordUsage({
          organizationId: user.organizationId,
          userId: user.uid,
          inputTokens: 0,
          outputTokens: 0,
          modelId: "sa-market-analysis",
          modelProvider: "fluxori",
          usageType: CreditUsageType.MARKET_ANALYSIS,
          success: true,
          reservationId: creditCheck.reservationId,
          metadata: {
            analysisType: "load-shedding-impact",
            productId,
            keyword,
            marketplace,
          },
        });
      }

      return result;
    } catch (error) {
      this.logger.error("Error analyzing load shedding impact", error);
      throw error;
    }
  }

  /**
   * Process load shedding specific alerts
   * South African market specific endpoint
   */
  @Post("sa-market/load-shedding-alerts")
  async processLoadSheddingAlerts(
    @GetUser() user: { uid: string; organizationId: string },
    @Body() body: { watchIds?: string[] },
  ): Promise<{ alertsCreated: number }> {
    try {
      // Check if the user has sufficient credits for this operation
      const creditCheck = await this.creditSystemService.checkCredits({
        organizationId: user.organizationId,
        userId: user.uid,
        expectedInputTokens: 0,
        expectedOutputTokens: 0,
        modelId: "sa-market-analysis",
        usageType: CreditUsageType.COMPETITOR_ALERT_PROCESSING,
        operationId: uuidv4(), // Generate unique operation ID for the reservation
        metadata: {
          alertType: "load-shedding",
          watchCount: body.watchIds?.length || 0,
        },
      });

      // If insufficient credits, throw an error
      if (!creditCheck.hasCredits) {
        throw new Error(
          `Insufficient credits. Available: ${creditCheck.availableCredits}, Required: 10`,
        );
      }

      // Get watches if watchIds were provided
      let watches: CompetitorWatch[] = [];
      if (body.watchIds && body.watchIds.length > 0) {
        const watchResults = await Promise.all(
          body.watchIds.map((id) =>
            this.competitorAlertService.getWatchById(id),
          ),
        );

        // Filter out any undefined watches (in case of invalid IDs)
        watches = watchResults.filter(
          (watch): watch is CompetitorWatch => !!watch,
        );
      }

      // Process load shedding alerts
      const alertsCreated =
        await this.saMarketOptimizationsService.processLoadSheddingAlerts(
          user.organizationId,
          watches,
        );

      // Record the credit usage instead of confirming the reservation
      if (creditCheck.reservationId) {
        await this.creditSystemService.recordUsage({
          organizationId: user.organizationId,
          userId: user.uid,
          inputTokens: 0,
          outputTokens: 0,
          modelId: "sa-market-analysis",
          modelProvider: "fluxori",
          usageType: CreditUsageType.COMPETITOR_ALERT_PROCESSING,
          success: true,
          reservationId: creditCheck.reservationId,
          metadata: {
            alertType: "load-shedding",
            watchCount: body.watchIds?.length || 0,
          },
        });
      }

      return { alertsCreated };
    } catch (error) {
      this.logger.error("Error processing load shedding alerts", error);
      throw error;
    }
  }
}
