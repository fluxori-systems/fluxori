/**
 * Inventory Repository
 *
 * This repository handles all inventory data operations.
 */

import { TenantFirestoreService } from '../lib/firebase/firestore.service';
import { QueryOptions } from '../types/core/entity.types';
import { 
  StockLevel, 
  StockMovement, 
  Warehouse, 
  InventoryCount,
  StockStatus,
  WarehouseType
} from '../types/inventory/inventory.types';

/**
 * Repository for StockLevel entities
 */
export class StockLevelRepository extends TenantFirestoreService<StockLevel> {
  /**
   * Create StockLevelRepository instance
   */
  constructor() {
    super('stock_levels');
  }

  /**
   * Get stock level by product for an organization
   * @param organizationId Organization ID
   * @param productId Product ID
   * @returns StockLevel entity or null
   */
  async getByProductForOrganization(organizationId: string, productId: string): Promise<StockLevel[]> {
    try {
      return this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'productId', operator: '==', value: productId }]
      );
    } catch (error) {
      console.error(`Error getting stock levels for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get stock levels by warehouse for an organization
   * @param organizationId Organization ID
   * @param warehouseId Warehouse ID
   * @param options Query options
   * @returns Array of StockLevel entities
   */
  async getByWarehouseForOrganization(
    organizationId: string,
    warehouseId: string,
    options?: QueryOptions
  ): Promise<StockLevel[]> {
    try {
      return this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'warehouseId', operator: '==', value: warehouseId }],
        options
      );
    } catch (error) {
      console.error(`Error getting stock levels for warehouse ${warehouseId}:`, error);
      throw error;
    }
  }

  /**
   * Get stock levels by status for an organization
   * @param organizationId Organization ID
   * @param status Stock status
   * @param options Query options
   * @returns Array of StockLevel entities
   */
  async getByStatusForOrganization(
    organizationId: string,
    status: StockStatus,
    options?: QueryOptions
  ): Promise<StockLevel[]> {
    try {
      return this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'status', operator: '==', value: status }],
        options
      );
    } catch (error) {
      console.error(`Error getting stock levels by status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Get low stock levels for an organization
   * @param organizationId Organization ID
   * @param options Query options
   * @returns Array of StockLevel entities
   */
  async getLowStockForOrganization(
    organizationId: string,
    options?: QueryOptions
  ): Promise<StockLevel[]> {
    try {
      // Use the defined enum value for low stock
      return this.getByStatusForOrganization(
        organizationId,
        StockStatus.LOW_STOCK,
        options
      );
    } catch (error) {
      console.error(`Error getting low stock levels:`, error);
      throw error;
    }
  }

  /**
   * Get out of stock levels for an organization
   * @param organizationId Organization ID
   * @param options Query options
   * @returns Array of StockLevel entities
   */
  async getOutOfStockForOrganization(
    organizationId: string,
    options?: QueryOptions
  ): Promise<StockLevel[]> {
    try {
      return this.getByStatusForOrganization(
        organizationId,
        StockStatus.OUT_OF_STOCK,
        options
      );
    } catch (error) {
      console.error(`Error getting out of stock levels:`, error);
      throw error;
    }
  }
}

/**
 * Repository for StockMovement entities
 */
export class StockMovementRepository extends TenantFirestoreService<StockMovement> {
  /**
   * Create StockMovementRepository instance
   */
  constructor() {
    super('stock_movements');
  }

  /**
   * Get stock movements by product for an organization
   * @param organizationId Organization ID
   * @param productId Product ID
   * @param options Query options
   * @returns Array of StockMovement entities
   */
  async getByProductForOrganization(
    organizationId: string,
    productId: string,
    options?: QueryOptions
  ): Promise<StockMovement[]> {
    try {
      return this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'productId', operator: '==', value: productId }],
        { ...options, sortBy: 'date', sortDirection: 'desc' }
      );
    } catch (error) {
      console.error(`Error getting stock movements for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get stock movements by warehouse for an organization
   * @param organizationId Organization ID
   * @param warehouseId Warehouse ID
   * @param options Query options
   * @returns Array of StockMovement entities
   */
  async getByWarehouseForOrganization(
    organizationId: string,
    warehouseId: string,
    options?: QueryOptions
  ): Promise<StockMovement[]> {
    try {
      return this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'warehouseId', operator: '==', value: warehouseId }],
        { ...options, sortBy: 'date', sortDirection: 'desc' }
      );
    } catch (error) {
      console.error(`Error getting stock movements for warehouse ${warehouseId}:`, error);
      throw error;
    }
  }

  /**
   * Get stock movements by date range for an organization
   * @param organizationId Organization ID
   * @param startDate Start date
   * @param endDate End date
   * @param options Query options
   * @returns Array of StockMovement entities
   */
  async getByDateRangeForOrganization(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    options?: QueryOptions
  ): Promise<StockMovement[]> {
    try {
      return this.findWithFiltersForOrganization(
        organizationId,
        [
          { field: 'date', operator: '>=', value: startDate },
          { field: 'date', operator: '<=', value: endDate },
        ],
        { ...options, sortBy: 'date', sortDirection: 'desc' }
      );
    } catch (error) {
      console.error(`Error getting stock movements by date range:`, error);
      throw error;
    }
  }
}

/**
 * Repository for Warehouse entities
 */
export class WarehouseRepository extends TenantFirestoreService<Warehouse> {
  /**
   * Create WarehouseRepository instance
   */
  constructor() {
    super('warehouses');
  }

  /**
   * Get warehouse by code for an organization
   * @param organizationId Organization ID
   * @param code Warehouse code
   * @returns Warehouse entity or null
   */
  async getByCodeForOrganization(organizationId: string, code: string): Promise<Warehouse | null> {
    try {
      const warehouses = await this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'code', operator: '==', value: code }]
      );

      return warehouses.length > 0 ? warehouses[0] : null;
    } catch (error) {
      console.error(`Error getting warehouse by code ${code}:`, error);
      throw error;
    }
  }

  /**
   * Get default warehouse for an organization
   * @param organizationId Organization ID
   * @returns Default warehouse entity or null
   */
  async getDefaultForOrganization(organizationId: string): Promise<Warehouse | null> {
    try {
      const warehouses = await this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'isDefault', operator: '==', value: true }]
      );

      return warehouses.length > 0 ? warehouses[0] : null;
    } catch (error) {
      console.error(`Error getting default warehouse:`, error);
      throw error;
    }
  }

  /**
   * Get warehouses by type for an organization
   * @param organizationId Organization ID
   * @param type Warehouse type
   * @returns Array of Warehouse entities
   */
  async getByTypeForOrganization(
    organizationId: string,
    type: WarehouseType
  ): Promise<Warehouse[]> {
    try {
      return this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'type', operator: '==', value: type }]
      );
    } catch (error) {
      console.error(`Error getting warehouses by type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get active warehouses for an organization
   * @param organizationId Organization ID
   * @returns Array of active Warehouse entities
   */
  async getActiveForOrganization(organizationId: string): Promise<Warehouse[]> {
    try {
      return this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'isActive', operator: '==', value: true }]
      );
    } catch (error) {
      console.error(`Error getting active warehouses:`, error);
      throw error;
    }
  }
}

/**
 * Repository for InventoryCount entities
 */
export class InventoryCountRepository extends TenantFirestoreService<InventoryCount> {
  /**
   * Create InventoryCountRepository instance
   */
  constructor() {
    super('inventory_counts');
  }

  /**
   * Get active inventory counts for an organization
   * @param organizationId Organization ID
   * @returns Array of active InventoryCount entities
   */
  async getActiveForOrganization(organizationId: string): Promise<InventoryCount[]> {
    try {
      return this.findWithFiltersForOrganization(
        organizationId,
        [
          { 
            field: 'status', 
            operator: 'in', 
            value: ['draft', 'in_progress'] 
          }
        ],
        { sortBy: 'startDate', sortDirection: 'desc' }
      );
    } catch (error) {
      console.error(`Error getting active inventory counts:`, error);
      throw error;
    }
  }

  /**
   * Get inventory counts by warehouse for an organization
   * @param organizationId Organization ID
   * @param warehouseId Warehouse ID
   * @param options Query options
   * @returns Array of InventoryCount entities
   */
  async getByWarehouseForOrganization(
    organizationId: string,
    warehouseId: string,
    options?: QueryOptions
  ): Promise<InventoryCount[]> {
    try {
      return this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'warehouseId', operator: '==', value: warehouseId }],
        { ...options, sortBy: 'startDate', sortDirection: 'desc' }
      );
    } catch (error) {
      console.error(`Error getting inventory counts for warehouse ${warehouseId}:`, error);
      throw error;
    }
  }
}