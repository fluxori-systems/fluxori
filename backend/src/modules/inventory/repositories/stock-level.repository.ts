import { Injectable, Logger } from '@nestjs/common';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { StockLevel } from '../models/stock-level.schema';

/**
 * Repository for Stock Level entities
 */
@Injectable()
export class StockLevelRepository extends FirestoreBaseRepository<StockLevel> {
  // Collection name in Firestore
  protected readonly collectionName = 'stock_levels';
  
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 3 * 60 * 1000, // 3 minutes
      requiredFields: ['organizationId', 'productId', 'warehouseId', 'quantity'],
    });
  }
  
  /**
   * Find stock levels by organization ID
   * @param organizationId Organization ID
   * @returns Array of stock levels
   */
  async findByOrganization(organizationId: string): Promise<StockLevel[]> {
    return this.findAll({ organizationId });
  }
  
  /**
   * Find stock levels by product ID
   * @param productId Product ID
   * @returns Array of stock levels
   */
  async findByProduct(productId: string): Promise<StockLevel[]> {
    return this.findAll({ productId });
  }
  
  /**
   * Find stock levels by warehouse ID
   * @param warehouseId Warehouse ID
   * @returns Array of stock levels
   */
  async findByWarehouse(warehouseId: string): Promise<StockLevel[]> {
    return this.findAll({ warehouseId });
  }
  
  /**
   * Find stock level by product and warehouse
   * @param productId Product ID
   * @param warehouseId Warehouse ID
   * @returns Stock level or null if not found
   */
  async findByProductAndWarehouse(
    productId: string,
    warehouseId: string
  ): Promise<StockLevel | null> {
    const results = await this.findAll({ 
      productId, 
      warehouseId 
    });
    
    return results.length > 0 ? results[0] : null;
  }
  
  /**
   * Find stock levels by location
   * @param warehouseId Warehouse ID
   * @param locationId Location ID
   * @returns Array of stock levels
   */
  async findByLocation(warehouseId: string, locationId: string): Promise<StockLevel[]> {
    return this.findAll({ 
      warehouseId, 
      locationId 
    });
  }
  
  /**
   * Find stock levels with low stock
   * @param organizationId Organization ID
   * @returns Array of stock levels with low stock
   */
  async findLowStock(organizationId: string): Promise<StockLevel[]> {
    const allStockLevels = await this.findByOrganization(organizationId);
    
    return allStockLevels.filter(stockLevel => 
      stockLevel.availableQuantity <= stockLevel.reorderPoint
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
    reservedQuantity: number
  ): Promise<StockLevel | null> {
    // Calculate available quantity
    const availableQuantity = Math.max(0, quantity - reservedQuantity);
    
    // Update stock level
    return this.update(id, {
      quantity,
      reservedQuantity,
      availableQuantity,
      lastStockUpdateDate: new Date()
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
      { totalQuantity: 0, totalReserved: 0, totalAvailable: 0 }
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
    // Build the filter
    const filter: Partial<StockLevel> = {
      organizationId: params.organizationId
    };
    
    if (params.productId) filter.productId = params.productId;
    if (params.warehouseId) filter.warehouseId = params.warehouseId;
    if (params.locationId) filter.locationId = params.locationId;
    if (params.status) filter.status = params.status as any;
    
    // Fetch stock levels with basic filters
    let stockLevels = await this.findAll(filter);
    
    // Apply additional filters
    if (params.minQuantity !== undefined) {
      stockLevels = stockLevels.filter(
        stockLevel => stockLevel.quantity >= (params.minQuantity || 0)
      );
    }
    
    if (params.maxQuantity !== undefined) {
      stockLevels = stockLevels.filter(
        stockLevel => stockLevel.quantity <= (params.maxQuantity || Number.MAX_VALUE)
      );
    }
    
    if (params.lowStock) {
      stockLevels = stockLevels.filter(
        stockLevel => stockLevel.availableQuantity <= stockLevel.reorderPoint
      );
    }
    
    if (params.lastUpdatedAfter) {
      const afterDate = new Date(params.lastUpdatedAfter);
      stockLevels = stockLevels.filter(stockLevel => {
        const updateDate = stockLevel.lastStockUpdateDate instanceof Date 
          ? stockLevel.lastStockUpdateDate 
          : new Date(stockLevel.lastStockUpdateDate as any);
        return updateDate >= afterDate;
      });
    }
    
    if (params.lastUpdatedBefore) {
      const beforeDate = new Date(params.lastUpdatedBefore);
      stockLevels = stockLevels.filter(stockLevel => {
        const updateDate = stockLevel.lastStockUpdateDate instanceof Date 
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