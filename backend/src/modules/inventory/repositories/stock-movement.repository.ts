import { Injectable, Logger } from '@nestjs/common';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { StockMovement } from '../models/stock-movement.schema';
import { StockMovementType, StockMovementReason } from '../interfaces/types';

/**
 * Repository for Stock Movement entities
 */
@Injectable()
export class StockMovementRepository extends FirestoreBaseRepository<StockMovement> {
  // Collection name in Firestore
  protected readonly collectionName = 'stock_movements';
  
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, {
      useSoftDeletes: false, // Don't allow soft deletes for audit trail
      useVersioning: true,
      enableCache: false, // No caching for audit records
      requiredFields: ['organizationId', 'productId', 'warehouseId', 'movementType', 'quantity'],
    });
  }
  
  /**
   * Find movements by organization ID
   * @param organizationId Organization ID
   * @param limit Maximum number to return
   * @returns Array of stock movements
   */
  async findByOrganization(
    organizationId: string,
    limit: number = 100
  ): Promise<StockMovement[]> {
    return this.findAll(
      { organizationId },
      {
        orderBy: 'createdAt',
        direction: 'desc',
        limit
      }
    );
  }
  
  /**
   * Find movements by product ID
   * @param productId Product ID
   * @param limit Maximum number to return
   * @returns Array of stock movements
   */
  async findByProduct(
    productId: string,
    limit: number = 100
  ): Promise<StockMovement[]> {
    return this.findAll(
      { productId },
      {
        orderBy: 'createdAt',
        direction: 'desc',
        limit
      }
    );
  }
  
  /**
   * Find movements by warehouse ID
   * @param warehouseId Warehouse ID
   * @param limit Maximum number to return
   * @returns Array of stock movements
   */
  async findByWarehouse(
    warehouseId: string,
    limit: number = 100
  ): Promise<StockMovement[]> {
    return this.findAll(
      { warehouseId },
      {
        orderBy: 'createdAt',
        direction: 'desc',
        limit
      }
    );
  }
  
  /**
   * Find movements by movement type
   * @param organizationId Organization ID
   * @param movementType Movement type
   * @param limit Maximum number to return
   * @returns Array of stock movements
   */
  async findByMovementType(
    organizationId: string,
    movementType: StockMovementType,
    limit: number = 100
  ): Promise<StockMovement[]> {
    return this.findAll(
      { 
        organizationId,
        movementType
      },
      {
        orderBy: 'createdAt',
        direction: 'desc',
        limit
      }
    );
  }
  
  /**
   * Find movements by reference ID
   * @param referenceId Reference ID
   * @returns Array of stock movements
   */
  async findByReferenceId(referenceId: string): Promise<StockMovement[]> {
    return this.findAll(
      { referenceId },
      {
        orderBy: 'createdAt',
        direction: 'desc'
      }
    );
  }
  
  /**
   * Find movements with advanced filtering
   * @param params Query parameters
   * @returns Array of filtered stock movements
   */
  async findWithFilters(params: {
    organizationId: string;
    productId?: string;
    warehouseId?: string;
    movementType?: StockMovementType;
    movementReason?: StockMovementReason;
    userId?: string;
    fromDate?: Date;
    toDate?: Date;
    referenceNumber?: string;
    referenceType?: string;
    limit?: number;
    offset?: number;
  }): Promise<StockMovement[]> {
    // Build the filter
    const filter: Partial<StockMovement> = {
      organizationId: params.organizationId
    };
    
    if (params.productId) filter.productId = params.productId;
    if (params.warehouseId) filter.warehouseId = params.warehouseId;
    if (params.movementType) filter.movementType = params.movementType;
    if (params.movementReason) filter.movementReason = params.movementReason;
    if (params.userId) filter.userId = params.userId;
    if (params.referenceNumber) filter.referenceNumber = params.referenceNumber;
    if (params.referenceType) filter.referenceType = params.referenceType;
    
    // Define query options
    const options = {
      orderBy: 'createdAt' as keyof StockMovement,
      direction: 'desc' as 'asc' | 'desc',
      limit: params.limit
    };
    
    // Execute the query
    let movements = await this.findAll(filter, options);
    
    // Apply date filtering
    if (params.fromDate) {
      const fromDate = new Date(params.fromDate);
      movements = movements.filter(movement => {
        const createdAt = movement.createdAt instanceof Date 
          ? movement.createdAt 
          : new Date(movement.createdAt as any);
        return createdAt >= fromDate;
      });
    }
    
    if (params.toDate) {
      const toDate = new Date(params.toDate);
      movements = movements.filter(movement => {
        const createdAt = movement.createdAt instanceof Date 
          ? movement.createdAt 
          : new Date(movement.createdAt as any);
        return createdAt <= toDate;
      });
    }
    
    // Apply offset if provided
    if (params.offset) {
      movements = movements.slice(params.offset);
    }
    
    return movements;
  }
  
  /**
   * Create a stock movement record
   * @param movementData Movement data
   * @returns Created stock movement
   */
  async recordMovement(
    movementData: Omit<StockMovement, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StockMovement> {
    return this.create(movementData);
  }
}