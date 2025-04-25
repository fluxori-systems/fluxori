import { Injectable, Logger } from '@nestjs/common';

import {
  FirestoreBaseRepository,
  FirestoreAdvancedFilter,
} from '../../../common/repositories';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { StockMovementType, StockMovementReason } from '../interfaces/types';
import { StockMovement } from '../models/stock-movement.schema';

/**
 * Repository for Stock Movement entities
 */
@Injectable()
export class StockMovementRepository extends FirestoreBaseRepository<StockMovement> {
  protected readonly logger = new Logger(StockMovementRepository.name);

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'stock_movements', {
      useSoftDeletes: false, // Don't allow soft deletes for audit trail
      useVersioning: true,
      enableCache: false, // No caching for audit records
      requiredFields: [
        'organizationId',
        'productId',
        'warehouseId',
        'movementType',
        'quantity',
      ],
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
    limit: number = 100,
  ): Promise<StockMovement[]> {
    return this.find({
      advancedFilters: [
        { field: 'organizationId', operator: '==', value: organizationId },
      ],
      queryOptions: {
        orderBy: 'createdAt',
        direction: 'desc',
        limit,
      },
    });
  }

  /**
   * Find movements by product ID
   * @param productId Product ID
   * @param limit Maximum number to return
   * @returns Array of stock movements
   */
  async findByProduct(
    productId: string,
    limit: number = 100,
  ): Promise<StockMovement[]> {
    return this.find({
      advancedFilters: [
        { field: 'productId', operator: '==', value: productId },
      ],
      queryOptions: {
        orderBy: 'createdAt',
        direction: 'desc',
        limit,
      },
    });
  }

  /**
   * Find movements by warehouse ID
   * @param warehouseId Warehouse ID
   * @param limit Maximum number to return
   * @returns Array of stock movements
   */
  async findByWarehouse(
    warehouseId: string,
    limit: number = 100,
  ): Promise<StockMovement[]> {
    return this.find({
      advancedFilters: [
        { field: 'warehouseId', operator: '==', value: warehouseId },
      ],
      queryOptions: {
        orderBy: 'createdAt',
        direction: 'desc',
        limit,
      },
    });
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
    limit: number = 100,
  ): Promise<StockMovement[]> {
    return this.find({
      advancedFilters: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'movementType', operator: '==', value: movementType },
      ],
      queryOptions: {
        orderBy: 'createdAt',
        direction: 'desc',
        limit,
      },
    });
  }

  /**
   * Find movements by reference ID
   * @param referenceId Reference ID
   * @returns Array of stock movements
   */
  async findByReferenceId(referenceId: string): Promise<StockMovement[]> {
    return this.find({
      advancedFilters: [
        { field: 'referenceId', operator: '==', value: referenceId },
      ],
      queryOptions: {
        orderBy: 'createdAt',
        direction: 'desc',
      },
    });
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
    // Build the advanced filters
    const advancedFilters: FirestoreAdvancedFilter<StockMovement>[] = [
      { field: 'organizationId', operator: '==', value: params.organizationId },
    ];

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

    if (params.movementType) {
      advancedFilters.push({
        field: 'movementType',
        operator: '==',
        value: params.movementType,
      });
    }

    if (params.movementReason) {
      advancedFilters.push({
        field: 'movementReason',
        operator: '==',
        value: params.movementReason,
      });
    }

    if (params.userId) {
      advancedFilters.push({
        field: 'userId',
        operator: '==',
        value: params.userId,
      });
    }

    if (params.referenceNumber) {
      advancedFilters.push({
        field: 'referenceNumber',
        operator: '==',
        value: params.referenceNumber,
      });
    }

    if (params.referenceType) {
      advancedFilters.push({
        field: 'referenceType',
        operator: '==',
        value: params.referenceType,
      });
    }

    // Define query options
    const queryOptions = {
      orderBy: 'createdAt',
      direction: 'desc' as 'asc' | 'desc',
      limit: params.limit,
      offset: params.offset,
    };

    // Execute the query
    let movements = await this.find({
      advancedFilters,
      queryOptions,
    });

    // Apply date filtering
    if (params.fromDate) {
      const fromDate = new Date(params.fromDate);
      movements = movements.filter((movement) => {
        const createdAt =
          movement.createdAt instanceof Date
            ? movement.createdAt
            : new Date(movement.createdAt as any);
        return createdAt >= fromDate;
      });
    }

    if (params.toDate) {
      const toDate = new Date(params.toDate);
      movements = movements.filter((movement) => {
        const createdAt =
          movement.createdAt instanceof Date
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
    movementData: Omit<StockMovement, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<StockMovement> {
    return this.create(movementData);
  }
}
