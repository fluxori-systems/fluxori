/**
 * Regional Product Controller
 *
 * Controller for managing region-specific product data
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FirebaseAuthGuard } from "@common/guards";
import { GetUser } from "@common/decorators";
import {
  RegionalProductEnhancerService,
  RegionalProductAttributes,
  RegionalValidationResult,
  RegionalPrice,
} from "../services/enhanced-regional/regional-product-enhancer.service";

/**
 * DTO for updating regional product data
 */
class UpdateRegionalProductDataDto
  implements Partial<RegionalProductAttributes>
{
  name?: string;
  description?: string;
  searchKeywords?: string[];
  price?: {
    basePrice: number;
    currencyCode: string;
    includesVat: boolean;
    specialPrice?: number;
    specialPriceFromDate?: Date;
    specialPriceToDate?: Date;
  };
  status?: "active" | "inactive" | "pending";
  visibility?: "visible" | "hidden" | "search_only" | "catalog_only";
  urlKey?: string;
  customAttributes?: Record<string, any>;
  marketplaceAttributes?: Record<string, any>;
  taxClass?: string;
  shippingClass?: string;
}

/**
 * DTO for bulk updating regional product data
 */
class BulkUpdateRegionalDataDto {
  productIds: string[];
  regionId: string;
  data: Partial<RegionalProductAttributes>;
}

/**
 * Controller for regional product APIs
 */
@Controller("pim/regional-products")
@UseGuards(FirebaseAuthGuard)
export class RegionalProductController {
  private readonly logger = new Logger(RegionalProductController.name);

  constructor(
    private readonly regionalProductService: RegionalProductEnhancerService,
  ) {
    this.logger.log("Regional Product Controller initialized");
  }

  /**
   * Get all regional data for a product
   */
  @Get(":productId/regions")
  async getProductRegionalData(
    @Param("productId") productId: string,
    @GetUser() user: any,
  ) {
    try {
      return this.regionalProductService.getProductRegionalData(
        productId,
        user.tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Error fetching product regional data: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to fetch product regional data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get regional data for a product in a specific region
   */
  @Get(":productId/regions/:regionId")
  async getProductRegionalDataForRegion(
    @Param("productId") productId: string,
    @Param("regionId") regionId: string,
    @GetUser() user: any,
  ) {
    try {
      return this.regionalProductService.getProductRegionalDataForRegion(
        productId,
        regionId,
        user.tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Error fetching product regional data: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to fetch product regional data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update regional data for a product
   */
  @Put(":productId/regions/:regionId")
  async updateProductRegionalData(
    @Param("productId") productId: string,
    @Param("regionId") regionId: string,
    @Body() updateData: UpdateRegionalProductDataDto,
    @GetUser() user: any,
  ) {
    try {
      return this.regionalProductService.updateProductRegionalData(
        productId,
        regionId,
        updateData,
        user.tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Error updating product regional data: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to update product regional data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Validate product for a specific region
   */
  @Get(":productId/regions/:regionId/validate")
  async validateProductForRegion(
    @Param("productId") productId: string,
    @Param("regionId") regionId: string,
    @GetUser() user: any,
  ) {
    try {
      return this.regionalProductService.validateProductForRegion(
        productId,
        regionId,
        user.tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Error validating product for region: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to validate product for region: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Calculate regional prices for a product
   */
  @Get(":productId/prices")
  async calculateRegionalPrices(
    @Param("productId") productId: string,
    @GetUser() user: any,
  ) {
    try {
      return this.regionalProductService.calculateRegionalPrices(
        productId,
        user.tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Error calculating regional prices: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to calculate regional prices: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Auto-generate regional data for a product
   */
  @Post(":productId/generate-regional-data")
  async generateRegionalData(
    @Param("productId") productId: string,
    @Query("regions") regionIds?: string,
    @GetUser() user: any,
  ) {
    try {
      // Parse region IDs if provided
      const parsedRegionIds = regionIds ? regionIds.split(",") : undefined;

      return this.regionalProductService.generateRegionalData(
        productId,
        parsedRegionIds,
        user.tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Error generating regional data: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to generate regional data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Bulk update regional data for multiple products
   */
  @Post("bulk-update")
  async bulkUpdateRegionalData(
    @Body() updateData: BulkUpdateRegionalDataDto,
    @GetUser() user: any,
  ) {
    try {
      return this.regionalProductService.bulkUpdateRegionalData(
        updateData.productIds,
        updateData.regionId,
        updateData.data,
        user.tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Error bulk updating regional data: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to bulk update regional data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
