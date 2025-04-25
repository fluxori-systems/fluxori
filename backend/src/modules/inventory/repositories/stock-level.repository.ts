import { Injectable, Logger } from '@nestjs/common';

import {
  FirestoreBaseRepository,
  FirestoreAdvancedFilter,
} from '../../../common/repositories';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { StockLevel } from '../models/stock-level.schema';

/**
 * Repository for Stock Level entities
 */
@Injectable()
export class StockLevelRepository extends FirestoreBaseRepository<StockLevel> {
  protected readonly logger = new Logger(StockLevelRepository.name);

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'stock_levels', {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 3 * 60 * 1000, // 3 minutes
      requiredFields: [
        'organizationId',
        'productId',
        'warehouseId',
        'quantity',
      ],
    });
  }

  /**
   * Find stock levels by organization ID
   * @param organizationId Organization ID
   * @returns Array of stock levels
   */
  async findByOrganization(organizationId: string): Promise<StockLevel[]> {
    return this.find({
      advancedFilters: [
        { field: 'organizationId', operator: '==', value: organizationId },
      ],
    });
  }

  /**
   * Find stock levels by product ID
   * @param productId Product ID
   * @returns Array of stock levels
   */
  async findByProduct(productId: string): Promise<StockLevel[]> {
    return this.find({
      advancedFilters: [
        { field: 'productId', operator: '==', value: productId },
      ],
    });
  }

  /**
   * Find stock levels by warehouse ID
   * @param warehouseId Warehouse ID
   * @returns Array of stock levels
   */
  async findByWarehouse(warehouseId: string): Promise<StockLevel[]> {
    return this.find({
      advancedFilters: [
        { field: 'warehouseId', operator: '==', value: warehouseId },
      ],
    });
  }

  /**
   * Find stock level by product and warehouse
   * @param productId Product ID
   * @param warehouseId Warehouse ID
   * @returns Stock level or null if not found
   */
  async findByProductAndWarehouse(
    productId: string,
    warehouseId: string,
  ): Promise<StockLevel | null> {
    const results = await this.find({
      advancedFilters: [
        { field: 'productId', operator: '==', value: productId },
        { field: 'warehouseId', operator: '==', value: warehouseId },
      ],
    });

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find stock levels by location
   * @param warehouseId Warehouse ID
   * @param locationId Location ID
   * @returns Array of stock levels
   */
  async findByLocation(
    warehouseId: string,
    locationId: string,
  ): Promise<StockLevel[]> {
    return this.find({
      advancedFilters: [
        { field: 'warehouseId', operator: '==', value: warehouseId },
        { field: 'locationId', operator: '==', value: locationId },
      ],
    });
  }

  /**
   * Find stock levels with low stock
   * @param organizationId Organization ID
   * @returns Array of stock levels with low stock
   */
  async findLowStock(organizationId: string): Promise<StockLevel[]> {
    const allStockLevels = await this.findByOrganization(organizationId);

    return allStockLevels.filter(
      (stockLevel) => stockLevel.availableQuantity <= stockLevel.reorderPoint,
    );
  }

  /**
   * Update stock level
   * @param id Stock level ID
   * @param quantity New quantity
   * @param reservedQuantity New reserved quantity
   * @returns Updated stock level
   */
  async updateStockQuantity(
    id: string,
    quantity: number,
    reservedQuantity: number,
  ): Promise<StockLevel | null> {
    // Calculate available quantity
    const availableQuantity = Math.max(0, quantity - reservedQuantity);

    // Update stock level
    return this.update(id, {
      quantity,
      reservedQuantity,
      availableQuantity,
      lastStockUpdateDate: new Date(),
    });
  }

  /**
   * Calculate total stock for a product across all warehouses
   * @param productId Product ID
   * @returns Total stock information
   */
  async calculateTotalStock(productId: string): Promise<{
    totalQuantity: number;
    totalReserved: number;
    totalAvailable: number;
  }> {
    const stockLevels = await this.findByProduct(productId);

    return stockLevels.reduce(
      (totals, stockLevel) => {
        totals.totalQuantity += stockLevel.quantity;
        totals.totalReserved += stockLevel.reservedQuantity;
        totals.totalAvailable += stockLevel.availableQuantity;
        return totals;
      },
      { totalQuantity: 0, totalReserved: 0, totalAvailable: 0 },
    );
  }

  /**
   * Find stock levels with advanced filtering
   * @param params Query parameters
   * @returns Array of filtered stock levels
   */
  async findWithFilters(params: {
    organizationId: string;
    productId?: string;
    warehouseId?: string;
    locationId?: string;
    status?: string;
    minQuantity?: number;
    maxQuantity?: number;
    lowStock?: boolean;
    lastUpdatedAfter?: Date;
    lastUpdatedBefore?: Date;
    limit?: number;
    offset?: number;
  }): Promise<StockLevel[]> {
    // Create advanced filters
    const advancedFilters: FirestoreAdvancedFilter<StockLevel>[] = [
      { field: 'organizationId', operator: '==', value: params.organizationId },
    ];

    // Add optional filters
    if (params.productId) {
      advancedFilters.push({
        field: 'productId',
        operator: '==',
        value: params.productId,
      });
    }

    if (params.warehouseId) {
      advancedFilters.push({
        field: 'warehouseId',
        operator: '==',
        value: params.warehouseId,
      });
    }

    if (params.locationId) {
      advancedFilters.push({
        field: 'locationId',
        operator: '==',
        value: params.locationId,
      });
    }

    if (params.status) {
      advancedFilters.push({
        field: 'status',
        operator: '==',
        value: params.status,
      });
    }

    // Fetch stock levels with basic filters
    let stockLevels = await this.find({
      advancedFilters,
      queryOptions: {
        limit: params.limit,
        offset: params.offset,
      },
    });

    // Apply additional filters
    if (params.minQuantity !== undefined) {
      stockLevels = stockLevels.filter(
        (stockLevel) => stockLevel.quantity >= (params.minQuantity || 0),
      );
    }

    if (params.maxQuantity !== undefined) {
      stockLevels = stockLevels.filter(
        (stockLevel) =>
          stockLevel.quantity <= (params.maxQuantity || Number.MAX_VALUE),
      );
    }

    if (params.lowStock) {
      stockLevels = stockLevels.filter(
        (stockLevel) => stockLevel.availableQuantity <= stockLevel.reorderPoint,
      );
    }

    if (params.lastUpdatedAfter) {
      const afterDate = new Date(params.lastUpdatedAfter);
      stockLevels = stockLevels.filter((stockLevel) => {
        const updateDate =
          stockLevel.lastStockUpdateDate instanceof Date
            ? stockLevel.lastStockUpdateDate
            : new Date(stockLevel.lastStockUpdateDate as any);
        return updateDate >= afterDate;
      });
    }

    if (params.lastUpdatedBefore) {
      const beforeDate = new Date(params.lastUpdatedBefore);
      stockLevels = stockLevels.filter((stockLevel) => {
        const updateDate =
          stockLevel.lastStockUpdateDate instanceof Date
            ? stockLevel.lastStockUpdateDate
            : new Date(stockLevel.lastStockUpdateDate as any);
        return updateDate <= beforeDate;
      });
    }

    // Apply pagination
    if (params.offset !== undefined || params.limit !== undefined) {
      const start = params.offset || 0;
      const end = params.limit ? start + params.limit : undefined;
      stockLevels = stockLevels.slice(start, end);
    }

    return stockLevels;
  }
}
