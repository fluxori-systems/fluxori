import { Injectable, Logger } from '@nestjs/common';
import { QueryFilterOperator } from '../../../types/google-cloud.types';

import { v4 as uuidv4 } from 'uuid';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import {
  CompetitorPrice,
  MarketPosition,
  PriceSourceType,
  PriceVerificationStatus,
} from '../models/competitor-price.model';

import { FirestoreConfigService } from '../../../config/firestore.config';

/**
 * Repository for competitor prices
 * Handles persistence of competitor price data
 */
@Injectable()
export class CompetitorPriceRepository extends FirestoreBaseRepository<CompetitorPrice> {
  protected readonly logger = new Logger(CompetitorPriceRepository.name);

  constructor(protected readonly firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'competitor-prices', {
      // No extra options for now
    });
  }

  /**
   * Create a new competitor price record
   * @param data Competitor price data
   */
  async create(
    data: Omit<CompetitorPrice, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version' | 'deletedAt'>,
  ): Promise<CompetitorPrice> {
    try {
      const now = new Date();

      const newRecord: CompetitorPrice = {
        ...data,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
        version: 1,
        deletedAt: null,
      };

      return super.create(newRecord);
    } catch (error) {
      this.logger.error(
        `Error creating competitor price record: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update a competitor price record
   * @param id Record ID
   * @param data Updated data
   */
  async update(
    id: string,
    data: Partial<CompetitorPrice>,
  ): Promise<CompetitorPrice> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      return super.update(id, updateData);
    } catch (error) {
      this.logger.error(
        `Error updating competitor price: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find competitor prices for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param options Query options
   */
  async findByProductId(
    productId: string,
    organizationId: string,
    options?: {
      marketplaceId?: string;
      includeOutOfStock?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<CompetitorPrice[]> {
    try {
      const whereConditions: import('../../../common/repositories/base/repository-types').FirestoreAdvancedFilter<CompetitorPrice>[] = [
        { field: 'productId', operator: '==' as QueryFilterOperator, value: productId },
        { field: 'organizationId', operator: '==' as QueryFilterOperator, value: organizationId },
      ];

      // Add marketplace filter if specified
      if (options?.marketplaceId) {
        whereConditions.push({
          field: 'marketplaceId',
          operator: '==' as QueryFilterOperator,
          value: options.marketplaceId,
        });
      }

      // Exclude out of stock items if requested
      if (!options?.includeOutOfStock) {
        whereConditions.push({
          field: 'stockStatus',
          operator: '==' as QueryFilterOperator,
          value: 'IN_STOCK',
        });
      }

      const queryOptions = {
        advancedFilters: whereConditions,
        limit: options?.limit || 100,
        offset: options?.offset || 0,
        orderBy: [{ field: 'totalPrice', direction: 'asc' as const }],
      };

      return this.find(queryOptions);
    } catch (error) {
      this.logger.error(
        `Error finding competitor prices: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find all competitor prices for multiple products
   * @param productIds Array of product IDs
   * @param organizationId Organization ID
   * @param marketplaceId Optional marketplace ID filter
   */
  async findByProductIds(
    productIds: string[],
    organizationId: string,
    marketplaceId?: string,
  ): Promise<Record<string, CompetitorPrice[]>> {
    try {
      const whereConditions: import('../../../common/repositories/base/repository-types').FirestoreAdvancedFilter<CompetitorPrice>[] = [
        { field: 'productId', operator: 'in' as QueryFilterOperator, value: productIds },
        { field: 'organizationId', operator: '==' as QueryFilterOperator, value: organizationId },
      ];

      // Add marketplace filter if specified
      if (marketplaceId) {
        whereConditions.push({
          field: 'marketplaceId',
          operator: '==' as QueryFilterOperator,
          value: marketplaceId,
        });
      }

      const queryOptions = {
        advancedFilters: whereConditions,
        limit: productIds.length * 20,
        orderBy: [{ field: 'totalPrice', direction: 'asc' as const }],
      };

      const prices = await this.find(queryOptions);

      // Group by product ID
      const result: Record<string, CompetitorPrice[]> = {};

      // Initialize with empty arrays for all product IDs
      productIds.forEach((id: string) => {
        result[id] = [];
      });

      // Group prices by product ID
      prices.forEach((price: CompetitorPrice) => {
        const productId = price.productId;

        if (result[productId]) {
          result[productId].push(price);
        }
      });

      // Sort each group by total price
      Object.keys(result).forEach((productId: string) => {
        result[productId].sort((a, b) => a.totalPrice - b.totalPrice);
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Error finding competitor prices by product IDs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find competitor prices by competitor
   * @param competitorId Competitor ID
   * @param organizationId Organization ID
   * @param limit Maximum records to return
   */
  async findByCompetitorId(
    competitorId: string,
    organizationId: string,
    limit: number = 100,
  ): Promise<CompetitorPrice[]> {
    try {
      const queryOptions = {
        advancedFilters: [
          { field: 'competitorId', operator: '==' as QueryFilterOperator, value: competitorId },
          { field: 'organizationId', operator: '==' as QueryFilterOperator, value: organizationId },
        ],
        limit,
        orderBy: [{ field: 'lastUpdated', direction: 'desc' as const }],
      };

      return this.find(queryOptions);
    } catch (error) {
      this.logger.error(
        `Error finding prices by competitor: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find competitor prices by marketplace
   * @param marketplaceId Marketplace ID
   * @param organizationId Organization ID
   * @param limit Maximum records to return
   */
  async findByMarketplaceId(
    marketplaceId: string,
    organizationId: string,
    limit: number = 100,
  ): Promise<CompetitorPrice[]> {
    try {
      const queryOptions = {
        advancedFilters: [
          { field: 'marketplaceId', operator: '==' as QueryFilterOperator, value: marketplaceId },
          { field: 'organizationId', operator: '==' as QueryFilterOperator, value: organizationId },
        ],
        limit,
        orderBy: [{ field: 'lastUpdated', direction: 'desc' as const }],
      };

      return this.find(queryOptions);
    } catch (error) {
      this.logger.error(
        `Error finding prices by marketplace: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find recently updated competitor prices
   * @param organizationId Organization ID
   * @param minutesAgo How many minutes back to check
   * @param limit Maximum records to return
   */
  async findRecentlyUpdated(
    organizationId: string,
    minutesAgo: number = 60,
    limit: number = 100,
  ): Promise<CompetitorPrice[]> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - minutesAgo);

      const queryOptions = {
        advancedFilters: [
          { field: 'organizationId', operator: '==' as QueryFilterOperator, value: organizationId },
          { field: 'lastUpdated', operator: '>=' as QueryFilterOperator, value: cutoffTime },
        ],
        limit,
        orderBy: [{ field: 'lastUpdated', direction: 'desc' as const }],
      };

      return this.find(queryOptions);
    } catch (error) {
      this.logger.error(
        `Error finding recently updated prices: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find competitor prices that need verification
   * @param organizationId Organization ID
   * @param limit Maximum records to return
   */
  async findPendingVerification(
    organizationId: string,
    limit: number = 50,
  ): Promise<CompetitorPrice[]> {
    try {
      const queryOptions = {
        advancedFilters: [
          { field: 'organizationId', operator: '==' as QueryFilterOperator, value: organizationId },
          { field: 'verificationStatus', operator: '==' as QueryFilterOperator, value: PriceVerificationStatus.PENDING },
        ],
        limit,
        orderBy: [{ field: 'lastUpdated', direction: 'asc' as const }],
      };

      return this.find(queryOptions);
    } catch (error) {
      this.logger.error(
        `Error finding prices pending verification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculate market position for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param ourPrice Our current price
   * @param ourShipping Our current shipping
   * @param marketplaceId Optional marketplace ID filter
   */
  async calculateMarketPosition(
    productId: string,
    organizationId: string,
    ourPrice: number,
    ourShipping: number,
    marketplaceId?: string,
  ): Promise<MarketPosition> {
    try {
      // Get all competitor prices for this product
      const competitors = await this.findByProductId(
        productId,
        organizationId,
        { marketplaceId, includeOutOfStock: false },
      );

      // Our total price
      const ourTotalPrice = ourPrice + ourShipping;

      // Combine our price with competitors for ranking
      const allPrices = [
        {
          id: 'our-price',
          totalPrice: ourTotalPrice,
          price: ourPrice,
          shipping: ourShipping,
        },
        ...competitors.map((c: CompetitorPrice) => ({
          id: c.id,
          totalPrice: c.totalPrice,
          price: c.price,
          shipping: c.shipping,
        })),
      ];

      // Sort by total price
      allPrices.sort((a, b) => a.totalPrice - b.totalPrice);

      // Find our rank
      const ourRank = allPrices.findIndex((p) => p.id === 'our-price') + 1;

      // Calculate price difference from cheapest (if we're not the cheapest)
      let priceDifference = 0;
      let priceDifferencePercentage = 0;

      if (ourRank > 1) {
        const cheapestPrice = allPrices[0].totalPrice;
        priceDifference = ourTotalPrice - cheapestPrice;
        priceDifferencePercentage = (priceDifference / cheapestPrice) * 100;
      }

      return {
        rank: ourRank,
        totalCompetitors: competitors.length,
        priceDifference,
        priceDifferencePercentage,
        isCheapest: ourRank === 1,
        isExcludingShipping: false,
      };
    } catch (error) {
      this.logger.error(
        `Error calculating market position: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get price with BuyBox for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param marketplaceId Marketplace ID
   */
  async findBuyBoxPrice(
    productId: string,
    organizationId: string,
    marketplaceId: string,
  ): Promise<CompetitorPrice | null> {
    try {
      const queryOptions = {
        advancedFilters: [
          { field: 'productId', operator: '==' as QueryFilterOperator, value: productId },
          { field: 'organizationId', operator: '==' as QueryFilterOperator, value: organizationId },
          { field: 'marketplaceId', operator: '==' as QueryFilterOperator, value: marketplaceId },
          { field: 'hasBuyBox', operator: '==' as QueryFilterOperator, value: true },
        ],
        limit: 1,
      };

      const results = await this.find(queryOptions);

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      this.logger.error(
        `Error finding BuyBox price: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find competitor prices that need updating
   * @param organizationId Organization ID
   * @param thresholdMinutes Minutes threshold for considering a price outdated
   * @param limit Maximum records to return
   */
  async findPricesNeedingUpdate(
    organizationId: string,
    thresholdMinutes: number = 120,
    limit: number = 50,
  ): Promise<CompetitorPrice[]> {
    try {
      const thresholdDate = new Date();
      thresholdDate.setMinutes(thresholdDate.getMinutes() - thresholdMinutes);

      const queryOptions = {
        advancedFilters: [
          { field: 'organizationId', operator: '==' as QueryFilterOperator, value: organizationId },
          { field: 'lastUpdated', operator: '<=' as QueryFilterOperator, value: thresholdDate },
        ],
        limit,
        orderBy: [{ field: 'lastUpdated', direction: 'asc' as const }],
      };

      return this.find(queryOptions);
    } catch (error) {
      this.logger.error(
        `Error finding prices needing update: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
