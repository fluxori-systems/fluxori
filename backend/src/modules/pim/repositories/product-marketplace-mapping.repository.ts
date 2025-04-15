/**
 * Product Marketplace Mapping Repository
 * 
 * This repository manages the mappings between PIM products and marketplace listings,
 * allowing for synchronization between product data and marketplace platforms.
 */

import { Injectable } from '@nestjs/common';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { FirestoreService } from '../../../config/firestore.config';
import { ProductMarketplaceMapping } from '../models/marketplace-mapping.model';

/**
 * Repository for product marketplace mappings
 */
@Injectable()
export class ProductMarketplaceMappingRepository extends FirestoreBaseRepository<ProductMarketplaceMapping> {
  /**
   * Collection name in Firestore
   */
  protected collectionName = 'product-marketplace-mappings';

  constructor(protected readonly firestoreService: FirestoreService) {
    super(firestoreService);
  }

  /**
   * Find all mappings for a specific product
   * 
   * @param productId - The product ID
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns Array of marketplace mappings for the product
   */
  async findByProductId(productId: string, tenantId: string): Promise<ProductMarketplaceMapping[]> {
    return this.find({
      tenantId,
      filters: [{ field: 'productId', operator: '==', value: productId }]
    });
  }

  /**
   * Find all mappings for a specific marketplace
   * 
   * @param marketplaceId - The marketplace ID (e.g., 'takealot', 'amazon')
   * @param tenantId - Tenant ID for multi-tenancy
   * @param options - Optional query parameters for pagination
   * @returns Array of marketplace mappings for the marketplace
   */
  async findByMarketplaceId(
    marketplaceId: string, 
    tenantId: string,
    options: { page?: number; pageSize?: number; } = {}
  ): Promise<ProductMarketplaceMapping[]> {
    const { page = 0, pageSize = 100 } = options;
    
    return this.find({
      tenantId,
      filters: [{ field: 'marketplaceId', operator: '==', value: marketplaceId }],
      limit: pageSize,
      offset: page * pageSize
    });
  }

  /**
   * Find mapping by product ID and marketplace ID
   * 
   * @param productId - The product ID
   * @param marketplaceId - The marketplace ID
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns The mapping if found, null otherwise
   */
  async findByProductAndMarketplace(
    productId: string,
    marketplaceId: string,
    tenantId: string
  ): Promise<ProductMarketplaceMapping | null> {
    const mappings = await this.find({
      tenantId,
      filters: [
        { field: 'productId', operator: '==', value: productId },
        { field: 'marketplaceId', operator: '==', value: marketplaceId }
      ],
      limit: 1
    });
    
    return mappings.length > 0 ? mappings[0] : null;
  }

  /**
   * Find mapping by external marketplace ID
   * 
   * @param marketplaceId - The marketplace ID
   * @param externalId - The external ID in the marketplace
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns The mapping if found, null otherwise
   */
  async findByExternalId(
    marketplaceId: string,
    externalId: string,
    tenantId: string
  ): Promise<ProductMarketplaceMapping | null> {
    const mappings = await this.find({
      tenantId,
      filters: [
        { field: 'marketplaceId', operator: '==', value: marketplaceId },
        { field: 'externalId', operator: '==', value: externalId }
      ],
      limit: 1
    });
    
    return mappings.length > 0 ? mappings[0] : null;
  }

  /**
   * Find mapping by external marketplace SKU
   * 
   * @param marketplaceId - The marketplace ID
   * @param externalSku - The external SKU in the marketplace
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns The mapping if found, null otherwise
   */
  async findByExternalSku(
    marketplaceId: string,
    externalSku: string,
    tenantId: string
  ): Promise<ProductMarketplaceMapping | null> {
    const mappings = await this.find({
      tenantId,
      filters: [
        { field: 'marketplaceId', operator: '==', value: marketplaceId },
        { field: 'externalSku', operator: '==', value: externalSku }
      ],
      limit: 1
    });
    
    return mappings.length > 0 ? mappings[0] : null;
  }

  /**
   * Find all mappings with a specific sync status
   * 
   * @param status - The sync status to query for
   * @param marketplaceId - Optional marketplace ID to filter by
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns Array of mappings with the specified status
   */
  async findByStatus(
    status: 'active' | 'inactive' | 'pending' | 'error',
    marketplaceId: string | null,
    tenantId: string
  ): Promise<ProductMarketplaceMapping[]> {
    const filters = [{ field: 'status', operator: '==', value: status }];
    
    if (marketplaceId) {
      filters.push({ field: 'marketplaceId', operator: '==', value: marketplaceId });
    }
    
    return this.find({
      tenantId,
      filters
    });
  }

  /**
   * Find mappings that need to be synced (based on lastSyncedAt being older than the threshold)
   * 
   * @param thresholdHours - Hours threshold to consider a mapping as needing sync
   * @param marketplaceId - Optional marketplace ID to filter by
   * @param tenantId - Tenant ID for multi-tenancy
   * @param limit - Maximum number of mappings to return
   * @returns Array of mappings that need to be synced
   */
  async findNeedingSync(
    thresholdHours: number,
    marketplaceId: string | null,
    tenantId: string,
    limit = 100
  ): Promise<ProductMarketplaceMapping[]> {
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - thresholdHours);
    
    const filters = [
      { 
        field: 'lastSyncedAt', 
        operator: '<', 
        value: thresholdDate 
      },
      {
        field: 'status',
        operator: 'in',
        value: ['active', 'pending']
      }
    ];
    
    if (marketplaceId) {
      filters.push({ field: 'marketplaceId', operator: '==', value: marketplaceId });
    }
    
    return this.find({
      tenantId,
      filters,
      orderBy: [{ field: 'lastSyncedAt', direction: 'asc' }],
      limit
    });
  }

  /**
   * Updates the status of a mapping and sets the lastSyncedAt timestamp
   * 
   * @param id - The mapping ID
   * @param status - The new status
   * @param tenantId - Tenant ID for multi-tenancy
   * @param errorMessage - Optional error message for failed syncs
   * @returns The updated mapping
   */
  async updateSyncStatus(
    id: string,
    status: 'active' | 'inactive' | 'pending' | 'error',
    tenantId: string,
    errorMessage?: string
  ): Promise<ProductMarketplaceMapping> {
    const update: Partial<ProductMarketplaceMapping> = {
      status,
      lastSyncedAt: new Date()
    };
    
    if (errorMessage && status === 'error') {
      update.lastSyncError = errorMessage;
    } else if (status !== 'error') {
      update.lastSyncError = null;
    }
    
    return this.update(id, update, tenantId);
  }
}