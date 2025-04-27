import {
  Body,
  Controller,
  Post,
  Query,
  UseGuards,
  Logger,
} from "@nestjs/common";
import { FirebaseAuthGuard } from "@common/guards";
import { GetUser } from "@common/decorators";
import { User } from "../../../types/google-cloud.types";
import { Product } from "../models/product.model";
import { Category } from "../models/category.model";
import { OperationResult } from "../interfaces/types";
import {
  ProductBulkOperationsService,
  ProductBulkUpdateOperation,
  ProductBulkStatusOperation,
  ProductBulkPriceOperation,
  ProductBulkCategoryOperation,
  ProductBulkInventoryOperation,
  ProductBulkDuplicateOperation,
} from "../services/bulk-operations/product-bulk-operations.service";
import {
  CategoryBulkOperationsService,
  CategoryBulkUpdateOperation,
  CategoryBulkMoveOperation,
  CategoryBulkMarketplaceMappingOperation,
} from "../services/bulk-operations/category-bulk-operations.service";
import {
  BulkOperationOptions,
  BulkOperationStats,
} from "../services/bulk-operations/bulk-operations.service";
import { FeatureFlagService } from "@modules/feature-flags";

/**
 * BulkOperationsController
 *
 * Controller for bulk operations in the PIM module
 */
@Controller("pim/bulk-operations")
@UseGuards(FirebaseAuthGuard)
export class BulkOperationsController {
  private readonly logger = new Logger(BulkOperationsController.name);

  constructor(
    private readonly productBulkService: ProductBulkOperationsService,
    private readonly categoryBulkService: CategoryBulkOperationsService,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  /**
   * Get bulk operation options based on feature flags and query parameters
   *
   * @param user Authenticated user
   * @param queryParams Query parameters for bulk options
   * @returns Bulk operation options
   */
  private async getBulkOptions(
    user: User,
    queryParams: any,
  ): Promise<BulkOperationOptions> {
    const options: Partial<BulkOperationOptions> = {};

    // Parse options from query parameters
    if (queryParams.maxConcurrency) {
      options.maxConcurrency = parseInt(queryParams.maxConcurrency);
    }

    if (queryParams.chunkSize) {
      options.chunkSize = parseInt(queryParams.chunkSize);
    }

    if (queryParams.operationTimeout) {
      options.operationTimeout = parseInt(queryParams.operationTimeout);
    }

    if (queryParams.continueOnError !== undefined) {
      options.continueOnError = queryParams.continueOnError === "true";
    }

    if (queryParams.enableRetry !== undefined) {
      options.enableRetry = queryParams.enableRetry === "true";
    }

    if (queryParams.maxRetries) {
      options.maxRetries = parseInt(queryParams.maxRetries);
    }

    if (queryParams.retryDelay) {
      options.retryDelay = parseInt(queryParams.retryDelay);
    }

    // Check feature flags for South African optimizations
    const enableLoadSheddingResilience =
      await this.featureFlagService.isEnabled(
        "pim.south-africa.load-shedding-resilience",
        user.organizationId,
      );

    if (enableLoadSheddingResilience) {
      options.loadSheddingResilience = true;
    }

    const lowBandwidthMode = await this.featureFlagService.isEnabled(
      "pim.south-africa.low-bandwidth-mode",
      user.organizationId,
    );

    if (lowBandwidthMode) {
      options.lowBandwidthMode = true;
      // For low bandwidth mode, reduce concurrency and chunk size
      options.maxConcurrency = Math.min(options.maxConcurrency || 5, 3);
      options.chunkSize = Math.min(options.chunkSize || 20, 10);
    }

    return options as BulkOperationOptions;
  }

  /**
   * Bulk update products
   *
   * @param operations Array of update operations
   * @param queryParams Query parameters for bulk options
   * @param user Authenticated user
   * @returns Operation results with statistics
   */
  @Post("products/update")
  async bulkUpdateProducts(
    @Body() operations: ProductBulkUpdateOperation[],
    @Query() queryParams: any,
    @GetUser() user: User,
  ): Promise<{
    results: Array<OperationResult<Product>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(`Bulk update request for ${operations.length} products`);

    // Ensure organizationId is set for all operations
    operations = operations.map((op) => ({
      ...op,
      updates: {
        ...op.updates,
        organizationId: user.organizationId,
      },
    }));

    const options = await this.getBulkOptions(user, queryParams);

    return await this.productBulkService.bulkUpdateProducts(
      operations,
      options,
    );
  }

  /**
   * Bulk delete products
   *
   * @param body Product IDs to delete
   * @param queryParams Query parameters for bulk options
   * @param user Authenticated user
   * @returns Operation results with statistics
   */
  @Post("products/delete")
  async bulkDeleteProducts(
    @Body() body: { productIds: string[] },
    @Query() queryParams: any,
    @GetUser() user: User,
  ): Promise<{ results: Array<OperationResult>; stats: BulkOperationStats }> {
    this.logger.log(
      `Bulk delete request for ${body.productIds.length} products`,
    );

    const options = await this.getBulkOptions(user, queryParams);

    return await this.productBulkService.bulkDeleteProducts(
      user.organizationId,
      body.productIds,
      options,
    );
  }

  /**
   * Bulk update product status
   *
   * @param operations Status update operations
   * @param queryParams Query parameters for bulk options
   * @param user Authenticated user
   * @returns Operation results with statistics
   */
  @Post("products/update-status")
  async bulkUpdateProductStatus(
    @Body() operations: ProductBulkStatusOperation[],
    @Query() queryParams: any,
    @GetUser() user: User,
  ): Promise<{
    results: Array<OperationResult<Product>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Bulk status update request for ${operations.length} products`,
    );

    const options = await this.getBulkOptions(user, queryParams);

    return await this.productBulkService.bulkUpdateProductStatus(
      user.organizationId,
      operations,
      options,
    );
  }

  /**
   * Bulk update product prices
   *
   * @param operations Price update operations
   * @param queryParams Query parameters for bulk options
   * @param user Authenticated user
   * @returns Operation results with statistics
   */
  @Post("products/update-prices")
  async bulkUpdateProductPrices(
    @Body() operations: ProductBulkPriceOperation[],
    @Query() queryParams: any,
    @GetUser() user: User,
  ): Promise<{
    results: Array<OperationResult<Product>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Bulk price update request for ${operations.length} products`,
    );

    const options = await this.getBulkOptions(user, queryParams);

    return await this.productBulkService.bulkUpdateProductPrices(
      user.organizationId,
      operations,
      options,
    );
  }

  /**
   * Bulk update product categories
   *
   * @param operations Category update operations
   * @param queryParams Query parameters for bulk options
   * @param user Authenticated user
   * @returns Operation results with statistics
   */
  @Post("products/update-categories")
  async bulkUpdateProductCategories(
    @Body() operations: ProductBulkCategoryOperation[],
    @Query() queryParams: any,
    @GetUser() user: User,
  ): Promise<{
    results: Array<OperationResult<Product>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Bulk category update request for ${operations.length} products`,
    );

    const options = await this.getBulkOptions(user, queryParams);

    return await this.productBulkService.bulkUpdateProductCategories(
      user.organizationId,
      operations,
      options,
    );
  }

  /**
   * Bulk update product inventory
   *
   * @param operations Inventory update operations
   * @param queryParams Query parameters for bulk options
   * @param user Authenticated user
   * @returns Operation results with statistics
   */
  @Post("products/update-inventory")
  async bulkUpdateProductInventory(
    @Body() operations: ProductBulkInventoryOperation[],
    @Query() queryParams: any,
    @GetUser() user: User,
  ): Promise<{
    results: Array<OperationResult<Product>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Bulk inventory update request for ${operations.length} products`,
    );

    const options = await this.getBulkOptions(user, queryParams);

    return await this.productBulkService.bulkUpdateProductInventory(
      user.organizationId,
      operations,
      options,
    );
  }

  /**
   * Bulk duplicate products
   *
   * @param operations Duplication operations
   * @param queryParams Query parameters for bulk options
   * @param user Authenticated user
   * @returns Operation results with statistics
   */
  @Post("products/duplicate")
  async bulkDuplicateProducts(
    @Body() operations: ProductBulkDuplicateOperation[],
    @Query() queryParams: any,
    @GetUser() user: User,
  ): Promise<{
    results: Array<OperationResult<Product>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Bulk duplication request for ${operations.length} products`,
    );

    const options = await this.getBulkOptions(user, queryParams);

    return await this.productBulkService.bulkDuplicateProducts(
      user.organizationId,
      operations,
      options,
    );
  }

  /**
   * Bulk update categories
   *
   * @param operations Category update operations
   * @param queryParams Query parameters for bulk options
   * @param user Authenticated user
   * @returns Operation results with statistics
   */
  @Post("categories/update")
  async bulkUpdateCategories(
    @Body() operations: CategoryBulkUpdateOperation[],
    @Query() queryParams: any,
    @GetUser() user: User,
  ): Promise<{
    results: Array<OperationResult<Category>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(`Bulk update request for ${operations.length} categories`);

    // Ensure organizationId is set for all operations
    operations = operations.map((op) => ({
      ...op,
      updates: {
        ...op.updates,
        organizationId: user.organizationId,
      },
    }));

    const options = await this.getBulkOptions(user, queryParams);

    return await this.categoryBulkService.bulkUpdateCategories(
      operations,
      options,
    );
  }

  /**
   * Bulk delete categories
   *
   * @param body Category IDs to delete
   * @param queryParams Query parameters for bulk options
   * @param user Authenticated user
   * @returns Operation results with statistics
   */
  @Post("categories/delete")
  async bulkDeleteCategories(
    @Body() body: { categoryIds: string[] },
    @Query() queryParams: any,
    @GetUser() user: User,
  ): Promise<{ results: Array<OperationResult>; stats: BulkOperationStats }> {
    this.logger.log(
      `Bulk delete request for ${body.categoryIds.length} categories`,
    );

    const options = await this.getBulkOptions(user, queryParams);

    return await this.categoryBulkService.bulkDeleteCategories(
      user.organizationId,
      body.categoryIds,
      options,
    );
  }

  /**
   * Bulk move categories
   *
   * @param operations Category move operations
   * @param queryParams Query parameters for bulk options
   * @param user Authenticated user
   * @returns Operation results with statistics
   */
  @Post("categories/move")
  async bulkMoveCategories(
    @Body() operations: CategoryBulkMoveOperation[],
    @Query() queryParams: any,
    @GetUser() user: User,
  ): Promise<{
    results: Array<OperationResult<Category>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(`Bulk move request for ${operations.length} categories`);

    const options = await this.getBulkOptions(user, queryParams);

    return await this.categoryBulkService.bulkMoveCategories(
      user.organizationId,
      operations,
      options,
    );
  }

  /**
   * Bulk update category marketplace mappings
   *
   * @param operations Marketplace mapping operations
   * @param queryParams Query parameters for bulk options
   * @param user Authenticated user
   * @returns Operation results with statistics
   */
  @Post("categories/update-marketplace-mappings")
  async bulkUpdateCategoryMarketplaceMappings(
    @Body() operations: CategoryBulkMarketplaceMappingOperation[],
    @Query() queryParams: any,
    @GetUser() user: User,
  ): Promise<{
    results: Array<OperationResult<Category>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Bulk marketplace mapping update request for ${operations.length} categories`,
    );

    const options = await this.getBulkOptions(user, queryParams);

    return await this.categoryBulkService.bulkUpdateCategoryMarketplaceMappings(
      user.organizationId,
      operations,
      options,
    );
  }
}
