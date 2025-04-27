import { Injectable, Logger } from "@nestjs/common";
import {
  BulkOperationsService,
  BulkOperationOptions,
  BulkOperationStats,
} from "./bulk-operations.service";
import { ProductService } from "../product.service";
import { Product, UpdateProductDto } from "../../models/product.model";
import { OperationResult, ProductStatus } from "../../interfaces/types";

/**
 * Product bulk operation types
 */
export enum ProductBulkOperationType {
  UPDATE = "update",
  DELETE = "delete",
  UPDATE_STATUS = "update_status",
  UPDATE_PRICES = "update_prices",
  UPDATE_INVENTORY = "update_inventory",
  UPDATE_CATEGORIES = "update_categories",
  DUPLICATE = "duplicate",
  IMPORT = "import",
  EXPORT = "export",
  MARKETPLACE_SYNC = "marketplace_sync",
}

/**
 * Product bulk update operation
 */
export interface ProductBulkUpdateOperation {
  id: string;
  updates: UpdateProductDto;
}

/**
 * Product bulk status update operation
 */
export interface ProductBulkStatusOperation {
  id: string;
  newStatus: ProductStatus;
}

/**
 * Product bulk price update operation
 */
export interface ProductBulkPriceOperation {
  id: string;
  newPrice: number;
  newCompareAtPrice?: number;
  vatIncluded?: boolean;
}

/**
 * Product bulk category update operation
 */
export interface ProductBulkCategoryOperation {
  id: string;
  categoryIds: string[];
  replaceExisting: boolean;
}

/**
 * Product bulk inventory update operation
 */
export interface ProductBulkInventoryOperation {
  id: string;
  quantity: number;
  warehouseId?: string;
}

/**
 * Product bulk duplication operation
 */
export interface ProductBulkDuplicateOperation {
  id: string;
  newSku?: string;
  quantity?: number;
  priceAdjustment?: number;
  priceAdjustmentType?: "percentage" | "fixed";
  includeImages?: boolean;
  includeVariants?: boolean;
}

/**
 * ProductBulkOperationsService
 *
 * Service for optimized bulk operations on products with South African market optimizations
 */
@Injectable()
export class ProductBulkOperationsService {
  private readonly logger = new Logger(ProductBulkOperationsService.name);

  constructor(
    private readonly bulkOperationsService: BulkOperationsService,
    private readonly productService: ProductService,
  ) {}

  /**
   * Execute bulk product updates
   *
   * @param operations Array of update operations
   * @param options Bulk operation options
   * @returns Results of all operations with statistics
   */
  async bulkUpdateProducts(
    operations: ProductBulkUpdateOperation[],
    options: Partial<BulkOperationOptions> = {},
  ): Promise<{
    results: Array<OperationResult<Product>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Starting bulk product update for ${operations.length} products`,
    );

    return this.bulkOperationsService.executeBulk<
      ProductBulkUpdateOperation,
      Product
    >(
      operations,
      async (operation) => {
        return await this.productService.updateProduct(
          operation.id,
          operation.updates,
        );
      },
      options,
    );
  }

  /**
   * Execute bulk product deletions
   *
   * @param organizationId Organization ID
   * @param productIds Array of product IDs to delete
   * @param options Bulk operation options
   * @returns Results of all operations with statistics
   */
  async bulkDeleteProducts(
    organizationId: string,
    productIds: string[],
    options: Partial<BulkOperationOptions> = {},
  ): Promise<{ results: Array<OperationResult>; stats: BulkOperationStats }> {
    this.logger.log(
      `Starting bulk product deletion for ${productIds.length} products`,
    );

    const operations = productIds.map((id) => ({ id, organizationId }));

    return this.bulkOperationsService.executeBulk<
      { id: string; organizationId: string },
      { id: string }
    >(
      operations,
      async (operation) => {
        await this.productService.deleteProduct(operation.id);
        return { id: operation.id };
      },
      options,
    );
  }

  /**
   * Execute bulk product status updates
   *
   * @param organizationId Organization ID
   * @param operations Array of status update operations
   * @param options Bulk operation options
   * @returns Results of all operations with statistics
   */
  async bulkUpdateProductStatus(
    organizationId: string,
    operations: ProductBulkStatusOperation[],
    options: Partial<BulkOperationOptions> = {},
  ): Promise<{
    results: Array<OperationResult<Product>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Starting bulk product status update for ${operations.length} products`,
    );

    return this.bulkOperationsService.executeBulk<
      ProductBulkStatusOperation,
      Product
    >(
      operations,
      async (operation) => {
        const updateDto: UpdateProductDto = {
          organizationId,
          status: operation.newStatus,
        };

        return await this.productService.updateProduct(operation.id, updateDto);
      },
      options,
    );
  }

  /**
   * Execute bulk product price updates
   *
   * @param organizationId Organization ID
   * @param operations Array of price update operations
   * @param options Bulk operation options
   * @returns Results of all operations with statistics
   */
  async bulkUpdateProductPrices(
    organizationId: string,
    operations: ProductBulkPriceOperation[],
    options: Partial<BulkOperationOptions> = {},
  ): Promise<{
    results: Array<OperationResult<Product>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Starting bulk product price update for ${operations.length} products`,
    );

    return this.bulkOperationsService.executeBulk<
      ProductBulkPriceOperation,
      Product
    >(
      operations,
      async (operation) => {
        const updateDto: UpdateProductDto = {
          organizationId,
          price: operation.newPrice,
        };

        if (operation.newCompareAtPrice !== undefined) {
          updateDto.compareAtPrice = operation.newCompareAtPrice;
        }

        if (operation.vatIncluded !== undefined) {
          updateDto.vatIncluded = operation.vatIncluded;
        }

        return await this.productService.updateProduct(operation.id, updateDto);
      },
      options,
    );
  }

  /**
   * Execute bulk product category updates
   *
   * @param organizationId Organization ID
   * @param operations Array of category update operations
   * @param options Bulk operation options
   * @returns Results of all operations with statistics
   */
  async bulkUpdateProductCategories(
    organizationId: string,
    operations: ProductBulkCategoryOperation[],
    options: Partial<BulkOperationOptions> = {},
  ): Promise<{
    results: Array<OperationResult<Product>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Starting bulk product category update for ${operations.length} products`,
    );

    return this.bulkOperationsService.executeBulk<
      ProductBulkCategoryOperation,
      Product
    >(
      operations,
      async (operation) => {
        // First fetch the current product to get existing categories if needed
        const product = await this.productService.getProductById(
          operation.id,
          organizationId,
        );

        if (!product) {
          throw new Error(`Product with ID ${operation.id} not found`);
        }

        let categoryIds = operation.categoryIds;

        // If not replacing, merge with existing categories
        if (!operation.replaceExisting && product.categoryIds) {
          // Merge and deduplicate
          categoryIds = [
            ...new Set([...product.categoryIds, ...operation.categoryIds]),
          ];
        }

        const updateDto: UpdateProductDto = {
          organizationId,
          categoryIds,
        };

        return await this.productService.updateProduct(operation.id, updateDto);
      },
      options,
    );
  }

  /**
   * Execute bulk product inventory updates
   *
   * @param organizationId Organization ID
   * @param operations Array of inventory update operations
   * @param options Bulk operation options
   * @returns Results of all operations with statistics
   */
  async bulkUpdateProductInventory(
    organizationId: string,
    operations: ProductBulkInventoryOperation[],
    options: Partial<BulkOperationOptions> = {},
  ): Promise<{
    results: Array<OperationResult<Product>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Starting bulk product inventory update for ${operations.length} products`,
    );

    return this.bulkOperationsService.executeBulk<
      ProductBulkInventoryOperation,
      Product
    >(
      operations,
      async (operation) => {
        const updateDto: UpdateProductDto = {
          organizationId,
          inventoryQuantity: operation.quantity,
        };

        // If warehouse ID is provided, this would need integration with a multi-warehouse system
        // For simplicity, this example doesn't implement warehouse-specific inventory updates

        return await this.productService.updateProduct(operation.id, updateDto);
      },
      options,
    );
  }

  /**
   * Execute bulk product duplication
   *
   * @param organizationId Organization ID
   * @param operations Array of duplication operations
   * @param options Bulk operation options
   * @returns Results of all operations with statistics
   */
  async bulkDuplicateProducts(
    organizationId: string,
    operations: ProductBulkDuplicateOperation[],
    options: Partial<BulkOperationOptions> = {},
  ): Promise<{
    results: Array<OperationResult<Product>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Starting bulk product duplication for ${operations.length} products`,
    );

    return this.bulkOperationsService.executeBulk<
      ProductBulkDuplicateOperation,
      Product
    >(
      operations,
      async (operation) => {
        // Fetch the source product
        const sourceProduct = await this.productService.getProductById(
          operation.id,
          organizationId,
        );

        if (!sourceProduct) {
          throw new Error(`Product with ID ${operation.id} not found`);
        }

        // Create a new product based on the source product
        const newProduct = { ...sourceProduct };

        // Remove ID to create a new one
        delete newProduct.id;

        // Update SKU if provided, otherwise generate a unique one
        if (operation.newSku) {
          newProduct.sku = operation.newSku;
        } else {
          newProduct.sku = `${sourceProduct.sku}-COPY-${Date.now().toString().substr(-6)}`;
        }

        // Update inventory quantity if provided
        if (operation.quantity !== undefined) {
          newProduct.inventoryQuantity = operation.quantity;
        }

        // Apply price adjustment if needed
        if (operation.priceAdjustment && sourceProduct.price) {
          if (operation.priceAdjustmentType === "percentage") {
            const multiplier = 1 + operation.priceAdjustment / 100;
            newProduct.price = sourceProduct.price * multiplier;
          } else {
            newProduct.price = sourceProduct.price + operation.priceAdjustment;
          }
        }

        // Handle images
        if (operation.includeImages === false) {
          newProduct.images = [];
        }

        // Handle variants (simplified, would be more complex in real implementation)
        if (operation.includeVariants === false) {
          newProduct.variants = [];
        }

        // Create the duplicated product
        return await this.productService.create(newProduct, organizationId);
      },
      options,
    );
  }
}
