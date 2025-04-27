import { Injectable, Logger } from "@nestjs/common";
import {
  BulkOperationsService,
  BulkOperationOptions,
  BulkOperationStats,
} from "./bulk-operations.service";
import { CategoryService } from "../category.service";
import { Category } from "../../models/category.model";
import { OperationResult } from "../../interfaces/types";

/**
 * Category bulk operation types
 */
export enum CategoryBulkOperationType {
  UPDATE = "update",
  DELETE = "delete",
  MOVE = "move",
  REORDER = "reorder",
  UPDATE_MARKETPLACE_MAPPING = "update_marketplace_mapping",
}

/**
 * Category bulk update operation
 */
export interface CategoryBulkUpdateOperation {
  id: string;
  updates: Partial<Category>;
}

/**
 * Category bulk move operation
 */
export interface CategoryBulkMoveOperation {
  id: string;
  newParentId: string | null;
}

/**
 * Category bulk marketplace mapping operation
 */
export interface CategoryBulkMarketplaceMappingOperation {
  id: string;
  marketplaceId: string;
  marketplaceCategoryId: string;
}

/**
 * CategoryBulkOperationsService
 *
 * Service for optimized bulk operations on categories with South African market optimizations
 */
@Injectable()
export class CategoryBulkOperationsService {
  private readonly logger = new Logger(CategoryBulkOperationsService.name);

  constructor(
    private readonly bulkOperationsService: BulkOperationsService,
    private readonly categoryService: CategoryService,
  ) {}

  /**
   * Execute bulk category updates
   *
   * @param operations Array of update operations
   * @param options Bulk operation options
   * @returns Results of all operations with statistics
   */
  async bulkUpdateCategories(
    operations: CategoryBulkUpdateOperation[],
    options: Partial<BulkOperationOptions> = {},
  ): Promise<{
    results: Array<OperationResult<Category>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Starting bulk category update for ${operations.length} categories`,
    );

    return this.bulkOperationsService.executeBulk<
      CategoryBulkUpdateOperation,
      Category
    >(
      operations,
      async (operation) => {
        return await this.categoryService.updateCategory(
          operation.id,
          operation.updates,
        );
      },
      options,
    );
  }

  /**
   * Execute bulk category deletions
   *
   * @param organizationId Organization ID
   * @param categoryIds Array of category IDs to delete
   * @param options Bulk operation options
   * @returns Results of all operations with statistics
   */
  async bulkDeleteCategories(
    organizationId: string,
    categoryIds: string[],
    options: Partial<BulkOperationOptions> = {},
  ): Promise<{ results: Array<OperationResult>; stats: BulkOperationStats }> {
    this.logger.log(
      `Starting bulk category deletion for ${categoryIds.length} categories`,
    );

    const operations = categoryIds.map((id) => ({ id, organizationId }));

    return this.bulkOperationsService.executeBulk<
      { id: string; organizationId: string },
      { id: string }
    >(
      operations,
      async (operation) => {
        await this.categoryService.deleteCategory(
          operation.id,
          operation.organizationId,
        );
        return { id: operation.id };
      },
      options,
    );
  }

  /**
   * Execute bulk category moves (change parent)
   *
   * @param organizationId Organization ID
   * @param operations Array of move operations
   * @param options Bulk operation options
   * @returns Results of all operations with statistics
   */
  async bulkMoveCategories(
    organizationId: string,
    operations: CategoryBulkMoveOperation[],
    options: Partial<BulkOperationOptions> = {},
  ): Promise<{
    results: Array<OperationResult<Category>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Starting bulk category move for ${operations.length} categories`,
    );

    return this.bulkOperationsService.executeBulk<
      CategoryBulkMoveOperation,
      Category
    >(
      operations,
      async (operation) => {
        // Get the current category
        const category = await this.categoryService.getCategoryById(
          operation.id,
          organizationId,
        );

        if (!category) {
          throw new Error(`Category with ID ${operation.id} not found`);
        }

        // Update the parentId
        const updates: Partial<Category> = {
          parentId: operation.newParentId,
        };

        return await this.categoryService.updateCategory(operation.id, updates);
      },
      options,
    );
  }

  /**
   * Execute bulk category marketplace mapping updates
   *
   * @param organizationId Organization ID
   * @param operations Array of marketplace mapping operations
   * @param options Bulk operation options
   * @returns Results of all operations with statistics
   */
  async bulkUpdateCategoryMarketplaceMappings(
    organizationId: string,
    operations: CategoryBulkMarketplaceMappingOperation[],
    options: Partial<BulkOperationOptions> = {},
  ): Promise<{
    results: Array<OperationResult<Category>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Starting bulk category marketplace mapping update for ${operations.length} categories`,
    );

    return this.bulkOperationsService.executeBulk<
      CategoryBulkMarketplaceMappingOperation,
      Category
    >(
      operations,
      async (operation) => {
        // Get the current category
        const category = await this.categoryService.getCategoryById(
          operation.id,
          organizationId,
        );

        if (!category) {
          throw new Error(`Category with ID ${operation.id} not found`);
        }

        // Initialize marketplace mappings if they don't exist
        const marketplaceMappings = category.marketplaceMappings || [];

        // Find existing mapping for this marketplace or create a new one
        const existingMappingIndex = marketplaceMappings.findIndex(
          (mapping) => mapping.marketplaceId === operation.marketplaceId,
        );

        if (existingMappingIndex >= 0) {
          // Update existing mapping
          marketplaceMappings[existingMappingIndex].marketplaceCategoryId =
            operation.marketplaceCategoryId;
        } else {
          // Add new mapping
          marketplaceMappings.push({
            marketplaceId: operation.marketplaceId,
            marketplaceCategoryId: operation.marketplaceCategoryId,
          });
        }

        // Update the category with the new mappings
        const updates: Partial<Category> = {
          marketplaceMappings,
        };

        return await this.categoryService.updateCategory(operation.id, updates);
      },
      options,
    );
  }
}
