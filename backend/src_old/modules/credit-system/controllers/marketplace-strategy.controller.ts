import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from "@nestjs/common";
import { MarketplaceStrategyService } from "../services/marketplace-strategy.service";
import { FirebaseAuthGuard } from "@common/guards";
import { GetUser } from "@common/decorators";
import {
  MarketplaceStrategy,
  StrategyTemplate,
  StrategyRequestOptions,
} from "../interfaces/types";

/**
 * Controller for marketplace strategy operations in the credit system
 * Handles generation of marketplace strategies and recommendations
 */
@Controller("credit-system/marketplace-strategy")
@UseGuards(FirebaseAuthGuard)
export class MarketplaceStrategyController {
  private readonly logger = new Logger(MarketplaceStrategyController.name);

  constructor(
    private readonly marketplaceStrategyService: MarketplaceStrategyService,
  ) {}

  /**
   * Generate a new marketplace strategy
   */
  @Post()
  async generateStrategy(
    @GetUser() user: { uid: string; organizationId: string },
    @Body() options: StrategyRequestOptions,
  ): Promise<MarketplaceStrategy> {
    try {
      return await this.marketplaceStrategyService.generateStrategy(
        user.organizationId,
        user.uid,
        options,
      );
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
  @Get(":id")
  async getStrategyById(
    @GetUser() user: { uid: string; organizationId: string },
    @Param("id") id: string,
  ): Promise<MarketplaceStrategy> {
    try {
      return await this.marketplaceStrategyService.getStrategyById(id);
    } catch (error) {
      this.logger.error(
        `Error getting strategy by ID: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get strategies by marketplace
   */
  @Get("marketplace/:marketplace")
  async getStrategiesByMarketplace(
    @GetUser() user: { uid: string; organizationId: string },
    @Param("marketplace") marketplace: string,
  ): Promise<MarketplaceStrategy[]> {
    try {
      return await this.marketplaceStrategyService.getStrategiesByMarketplace(
        user.organizationId,
        marketplace,
      );
    } catch (error) {
      this.logger.error(
        `Error getting strategies by marketplace: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get strategies by product
   */
  @Get("product/:productId")
  async getStrategiesByProduct(
    @GetUser() user: { uid: string; organizationId: string },
    @Param("productId") productId: string,
  ): Promise<MarketplaceStrategy[]> {
    try {
      return await this.marketplaceStrategyService.getStrategiesByProduct(
        user.organizationId,
        productId,
      );
    } catch (error) {
      this.logger.error(
        `Error getting strategies by product: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get strategy templates
   */
  @Get("templates")
  async getStrategyTemplates(
    @GetUser() user: { uid: string; organizationId: string },
    @Query("marketplace") marketplace?: string,
  ): Promise<StrategyTemplate[]> {
    try {
      return await this.marketplaceStrategyService.getStrategyTemplates(
        marketplace,
      );
    } catch (error) {
      this.logger.error(
        `Error getting strategy templates: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get credit estimate for strategy generation
   */
  @Post("estimate")
  async getCreditEstimate(
    @GetUser() user: { uid: string; organizationId: string },
    @Body() options: StrategyRequestOptions,
  ): Promise<{
    creditCost: number;
    hasCredits: boolean;
    availableCredits: number;
  }> {
    try {
      const { creditCost, creditCheck } =
        await this.marketplaceStrategyService.getCreditEstimate(
          user.organizationId,
          user.uid,
          options,
        );

      return {
        creditCost,
        hasCredits: creditCheck.hasCredits,
        availableCredits: creditCheck.availableCredits,
      };
    } catch (error) {
      this.logger.error(
        `Error getting credit estimate: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
