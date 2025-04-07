import { Injectable, Logger } from '@nestjs/common';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { BuyBoxStatus } from '../models/buybox-status.schema';
import { BuyBoxStatus as BuyBoxStatusEnum } from '../interfaces/types';

/**
 * Repository for BuyBox Status entities
 */
@Injectable()
export class BuyBoxStatusRepository extends FirestoreBaseRepository<BuyBoxStatus> {
  // Collection name in Firestore
  protected readonly collectionName = 'buybox_statuses';
  
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 5 * 60 * 1000, // 5 minutes
      requiredFields: ['organizationId', 'productId', 'marketplaceId', 'status'],
    });
  }
  
  /**
   * Find statuses by organization ID
   * @param organizationId Organization ID
   * @returns Array of BuyBox statuses
   */
  async findByOrganization(organizationId: string): Promise<BuyBoxStatus[]> {
    return this.findAll({ organizationId });
  }
  
  /**
   * Find statuses by product ID
   * @param productId Product ID
   * @returns Array of BuyBox statuses
   */
  async findByProduct(productId: string): Promise<BuyBoxStatus[]> {
    return this.findAll({ productId });
  }
  
  /**
   * Find status by product and marketplace
   * @param productId Product ID
   * @param marketplaceId Marketplace ID
   * @returns BuyBox status or null if not found
   */
  async findByProductAndMarketplace(
    productId: string,
    marketplaceId: string
  ): Promise<BuyBoxStatus | null> {
    const results = await this.findAll({ 
      productId,
      marketplaceId
    });
    
    return results.length > 0 ? results[0] : null;
  }
  
  /**
   * Find statuses by organization and status
   * @param organizationId Organization ID
   * @param status BuyBox status
   * @returns Array of BuyBox statuses
   */
  async findByStatus(
    organizationId: string,
    status: BuyBoxStatusEnum
  ): Promise<BuyBoxStatus[]> {
    return this.findAll({ 
      organizationId,
      status 
    });
  }
  
  /**
   * Find statuses that need to be monitored
   * @param organizationId Organization ID
   * @returns Array of BuyBox statuses
   */
  async findMonitored(organizationId: string): Promise<BuyBoxStatus[]> {
    return this.findAll({ 
      organizationId,
      isMonitored: true 
    });
  }
  
  /**
   * Find statuses with advanced filtering
   * @param params Query parameters
   * @returns Array of BuyBox statuses
   */
  async findWithFilters(params: {
    organizationId?: string;
    productId?: string;
    marketplaceId?: string;
    status?: BuyBoxStatusEnum;
    isMonitored?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<BuyBoxStatus[]> {
    // Start with basic filter object
    const filter: Partial<BuyBoxStatus> = {};
    
    // Add equality filters
    if (params.organizationId) filter.organizationId = params.organizationId;
    if (params.productId) filter.productId = params.productId;
    if (params.marketplaceId) filter.marketplaceId = params.marketplaceId;
    if (params.status) filter.status = params.status;
    if (params.isMonitored !== undefined) filter.isMonitored = params.isMonitored;
    
    // Basic query options
    const options = {
      orderBy: 'lastChecked' as keyof BuyBoxStatus,
      direction: 'desc' as 'asc' | 'desc',
      limit: params.limit,
      offset: params.offset
    };
    
    // Execute the query
    return this.findAll(filter, options);
  }
  
  /**
   * Update BuyBox status
   * @param status BuyBox status to update
   * @returns Updated BuyBox status
   */
  async updateStatus(status: BuyBoxStatus): Promise<BuyBoxStatus | null> {
    // Ensure required fields
    if (!status.id) {
      throw new Error('Status ID is required for update');
    }
    
    // Set last checked timestamp
    status.lastChecked = new Date();
    
    return this.update(status.id, status);
  }
  
  /**
   * Count statuses by BuyBox status for an organization
   * @param organizationId Organization ID
   * @returns Count by status
   */
  async countByStatus(
    organizationId: string
  ): Promise<Record<BuyBoxStatusEnum, number>> {
    const statuses = await this.findByOrganization(organizationId);
    
    // Initialize counts
    const counts: Record<string, number> = {};
    Object.values(BuyBoxStatusEnum).forEach(status => {
      counts[status] = 0;
    });
    
    // Count by status
    statuses.forEach(status => {
      counts[status.status] = (counts[status.status] || 0) + 1;
    });
    
    return counts as Record<BuyBoxStatusEnum, number>;
  }
}