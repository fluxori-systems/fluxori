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
import { PimIntegrationService } from "../services/pim-integration.service";
import { FirebaseAuthGuard } from "@common/guards";
import { GetUser } from "@common/decorators";
import {
  PimKeywordResearchRequest,
  KeywordProductMapping,
} from "../interfaces/types";

/**
 * Controller for PIM integration with credit system
 * Handles keyword-product mappings and research operations
 */
@Controller("credit-system/pim-integration")
@UseGuards(FirebaseAuthGuard)
export class PimIntegrationController {
  private readonly logger = new Logger(PimIntegrationController.name);

  constructor(private readonly pimIntegrationService: PimIntegrationService) {}

  /**
   * Create or update a keyword-product mapping
   */
  @Post("mappings")
  async createOrUpdateMapping(
    @GetUser() user: { uid: string; organizationId: string },
    @Body()
    data: {
      productId: string;
      sku: string;
      keywords?: string[];
      autoKeywordEnabled?: boolean;
    },
  ): Promise<KeywordProductMapping> {
    try {
      return await this.pimIntegrationService.createOrUpdateMapping(
        user.organizationId,
        user.uid,
        data.productId,
        data.sku,
        data.keywords || [],
        data.autoKeywordEnabled || false,
      );
    } catch (error) {
      this.logger.error(
        `Error creating/updating mapping: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get keyword-product mappings for organization
   */
  @Get("mappings")
  async getMappings(
    @GetUser() user: { uid: string; organizationId: string },
    @Query("productId") productId?: string,
  ): Promise<KeywordProductMapping[]> {
    try {
      if (productId) {
        return await this.pimIntegrationService.findMappingsByProduct(
          user.organizationId,
          productId,
        );
      } else {
        return await this.pimIntegrationService.findMappingsByOrganization(
          user.organizationId,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error getting mappings: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get keyword-product mapping by ID
   */
  @Get("mappings/:id")
  async getMappingById(
    @GetUser() user: { uid: string; organizationId: string },
    @Param("id") id: string,
  ): Promise<KeywordProductMapping> {
    try {
      return await this.pimIntegrationService.getMappingById(id);
    } catch (error) {
      this.logger.error(
        `Error getting mapping by ID: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Perform keyword research for products
   */
  @Post("research")
  async performProductKeywordResearch(
    @GetUser() user: { uid: string; organizationId: string },
    @Body()
    request: Omit<PimKeywordResearchRequest, "organizationId" | "userId">,
  ): Promise<any> {
    try {
      const fullRequest: PimKeywordResearchRequest = {
        ...request,
        organizationId: user.organizationId,
        userId: user.uid,
      };

      return await this.pimIntegrationService.performProductKeywordResearch(
        user.organizationId,
        user.uid,
        fullRequest,
      );
    } catch (error) {
      this.logger.error(
        `Error performing product keyword research: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Run auto-optimization for products
   */
  @Post("optimize")
  async runAutoOptimization(
    @GetUser() user: { uid: string; organizationId: string },
  ): Promise<any> {
    try {
      return await this.pimIntegrationService.runAutoOptimization(
        user.organizationId,
        user.uid,
      );
    } catch (error) {
      this.logger.error(
        `Error running auto-optimization: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Set auto keyword optimization for a product
   */
  @Put("mappings/:id/auto-keyword")
  async setAutoKeywordEnabled(
    @GetUser() user: { uid: string; organizationId: string },
    @Param("id") id: string,
    @Body() data: { enabled: boolean },
  ): Promise<{ success: boolean }> {
    try {
      await this.pimIntegrationService.getMappingById(id); // Verify mapping exists

      // Get repository from service using type assertion
      const service = this.pimIntegrationService as any;
      const repository = service.keywordProductMappingRepository;
      await repository.setAutoKeywordEnabled(id, data.enabled);

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error setting auto-keyword: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Add a keyword to blacklist
   */
  @Put("mappings/:id/blacklist")
  async blacklistKeyword(
    @GetUser() user: { uid: string; organizationId: string },
    @Param("id") id: string,
    @Body() data: { keyword: string },
  ): Promise<{ success: boolean }> {
    try {
      await this.pimIntegrationService.getMappingById(id); // Verify mapping exists

      // Get repository from service using type assertion
      const service = this.pimIntegrationService as any;
      const repository = service.keywordProductMappingRepository;
      await repository.blacklistKeyword(id, data.keyword);

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error blacklisting keyword: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Remove a keyword from blacklist
   */
  @Delete("mappings/:id/blacklist/:keyword")
  async removeFromBlacklist(
    @GetUser() user: { uid: string; organizationId: string },
    @Param("id") id: string,
    @Param("keyword") keyword: string,
  ): Promise<{ success: boolean }> {
    try {
      await this.pimIntegrationService.getMappingById(id); // Verify mapping exists

      // Get repository from service using type assertion
      const service = this.pimIntegrationService as any;
      const repository = service.keywordProductMappingRepository;
      await repository.removeFromBlacklist(id, keyword);

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error removing from blacklist: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
