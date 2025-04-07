import { Injectable, Logger } from '@nestjs/common';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { BuyBoxHistory } from '../models/buybox-history.schema';
import { BuyBoxStatus as BuyBoxStatusEnum } from '../interfaces/types';

/**
 * Repository for BuyBox History entities
 */
@Injectable()
export class BuyBoxHistoryRepository extends FirestoreBaseRepository<BuyBoxHistory> {
  // Collection name in Firestore
  protected readonly collectionName = 'buybox_history';
  
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: false, // No caching for history items
      requiredFields: ['organizationId', 'productId', 'marketplaceId', 'timestamp'],
    });
  }
  
  /**
   * Find history by organization ID
   * @param organizationId Organization ID
   * @param limit Maximum number to return
   * @returns Array of BuyBox history items
   */
  async findByOrganization(
    organizationId: string,
    limit: number = 100
  ): Promise<BuyBoxHistory[]> {
    return this.findAll(
      { organizationId },
      {
        orderBy: 'timestamp',
        direction: 'desc',
        limit
      }
    );
  }
  
  /**
   * Find history by product ID
   * @param productId Product ID
   * @param limit Maximum number to return
   * @returns Array of BuyBox history items
   */
  async findByProduct(
    productId: string,
    limit: number = 100
  ): Promise<BuyBoxHistory[]> {
    return this.findAll(
      { productId },
      {
        orderBy: 'timestamp',
        direction: 'desc',
        limit
      }
    );
  }
  
  /**
   * Find history by product and marketplace
   * @param productId Product ID
   * @param marketplaceId Marketplace ID
   * @param limit Maximum number to return
   * @returns Array of BuyBox history items
   */
  async findByProductAndMarketplace(
    productId: string,
    marketplaceId: string,
    limit: number = 100
  ): Promise<BuyBoxHistory[]> {
    return this.findAll(
      { 
        productId,
        marketplaceId
      },
      {
        orderBy: 'timestamp',
        direction: 'desc',
        limit
      }
    );
  }
  
  /**
   * Find history with advanced filtering
   * @param params Query parameters
   * @returns Array of BuyBox history items
   */
  async findWithFilters(params: {
    organizationId?: string;
    productId?: string;
    marketplaceId?: string;
    status?: BuyBoxStatusEnum;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<BuyBoxHistory[]> {
    // Start with basic filter object
    const filter: Partial<BuyBoxHistory> = {};
    
    // Add equality filters
    if (params.organizationId) filter.organizationId = params.organizationId;
    if (params.productId) filter.productId = params.productId;
    if (params.marketplaceId) filter.marketplaceId = params.marketplaceId;
    if (params.status) filter.status = params.status;
    
    // Basic query options
    const options = {
      orderBy: 'timestamp' as keyof BuyBoxHistory,
      direction: 'desc' as 'asc' | 'desc',
      limit: params.limit,
      offset: params.offset
    };
    
    // Execute the query
    let histories = await this.findAll(filter, options);
    
    // Apply date filtering
    if (params.fromDate) {
      const fromDate = new Date(params.fromDate);
      histories = histories.filter(history => {
        const timestamp = history.timestamp instanceof Date 
          ? history.timestamp 
          : new Date(history.timestamp as any);
        return timestamp >= fromDate;
      });
    }
    
    if (params.toDate) {
      const toDate = new Date(params.toDate);
      histories = histories.filter(history => {
        const timestamp = history.timestamp instanceof Date 
          ? history.timestamp 
          : new Date(history.timestamp as any);
        return timestamp <= toDate;
      });
    }
    
    return histories;
  }
  
  /**
   * Create history entry from BuyBox status
   * @param status BuyBox status to record
   * @returns Created history item
   */
  async createFromStatus(status: any): Promise<BuyBoxHistory> {
    const historyData: Omit<BuyBoxHistory, 'id' | 'createdAt' | 'updatedAt'> = {
      organizationId: status.organizationId,
      productId: status.productId,
      productSku: status.productSku,
      productName: status.productName,
      marketplaceId: status.marketplaceId,
      marketplaceName: status.marketplaceName,
      status: status.status,
      timestamp: new Date(),
      price: status.currentPrice,
      shipping: status.currentShipping,
      currency: status.currency,
      competitors: status.competitors || [],
      buyBoxWinner: status.buyBoxWinner,
      metadata: status.metadata || {}
    };
    
    return this.create(historyData);
  }
  
  /**
   * Delete history older than a certain date
   * @param organizationId Organization ID
   * @param olderThan Date to delete before
   * @returns Count of deleted items
   */
  async deleteOlderThan(
    organizationId: string,
    olderThan: Date
  ): Promise<number> {
    // Find all history items for this organization
    const histories = await this.findByOrganization(organizationId, 1000);
    
    // Filter for items older than the given date
    const toDelete = histories.filter(history => {
      const timestamp = history.timestamp instanceof Date 
        ? history.timestamp 
        : new Date(history.timestamp as any);
      return timestamp < olderThan;
    });
    
    // Delete the items
    let deletedCount = 0;
    for (const history of toDelete) {
      await this.delete(history.id);
      deletedCount++;
    }
    
    return deletedCount;
  }
}