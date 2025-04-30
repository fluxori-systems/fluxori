import { Injectable, Logger } from '@nestjs/common';

import { v4 as uuidv4 } from 'uuid';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import {
  PriceHistoryRecord,
  DateRange,
  PriceSourceType,
  PriceVerificationStatus,
} from '../models/competitor-price.model';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { FirestoreAdvancedFilter, FindOptions } from '../../../common/repositories/base/repository-types';

/**
 * Repository for price history
 * Handles persistence of price history data
 */
@Injectable()
export class PriceHistoryRepository extends FirestoreBaseRepository<PriceHistoryRecord> {
  protected readonly logger = new Logger(PriceHistoryRepository.name);

  constructor(
    firestoreConfigService: FirestoreConfigService,
  ) {
    super(firestoreConfigService, 'price-history', {
      useSoftDeletes: true,
      useVersioning: true,
      // useCache is not a valid option in the current repository pattern
      // cacheExpirationMinutes is not a valid option in the current repository pattern
    });
  }

  /**
   * Create a new price history record
   * @param data Price history data
   */
  async create(
    data: Omit<PriceHistoryRecord, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version' | 'deletedAt'>,
  ): Promise<PriceHistoryRecord> {
    try {
      const now = new Date();

      // Generate a new id but don't include it in the data object
      // The base repository will handle id generation
      const newId = uuidv4();
      
      const newRecord: Omit<PriceHistoryRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        ...data,
        isDeleted: false,
        version: 1,
        deletedAt: null,
      };

      return super.create(newRecord);
    } catch (error) {
      this.logger.error(
        `Error creating price history record: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find price history for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param dateRange Date range to query
   * @param options Query options
   */
  async findByProductId(
    productId: string,
    organizationId: string,
    dateRange: DateRange,
    options?: {
      competitorId?: string;
      marketplaceId?: string;
      recordType?: 'OUR_PRICE' | 'COMPETITOR_PRICE';
      limit?: number;
    },
  ): Promise<PriceHistoryRecord[]> {
    try {
      const advancedFilters: FirestoreAdvancedFilter<PriceHistoryRecord>[] = [
        {
          field: 'productId',
          operator: '==',
          value: productId,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>,
        {
          field: 'organizationId',
          operator: '==',
          value: organizationId,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>,
        {
          field: 'recordedAt',
          operator: '>=',
          value: dateRange.start,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>,
        {
          field: 'recordedAt',
          operator: '<=',
          value: dateRange.end,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>,
      ];

      // Add optional filters
      if (options?.competitorId) {
        advancedFilters.push({
          field: 'competitorId',
          operator: '==',
          value: options.competitorId,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>);
      }

      if (options?.marketplaceId) {
        advancedFilters.push({
          field: 'marketplaceId',
          operator: '==',
          value: options.marketplaceId,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>);
      }

      if (options?.recordType) {
        advancedFilters.push({
          field: 'recordType',
          operator: '==',
          value: options.recordType,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>);
      }

      const findOptions: FindOptions<PriceHistoryRecord> = {
        advancedFilters,
        orderBy: [{ field: 'recordedAt', direction: 'asc' }],
        limit: options?.limit || 1000,
        includeDeleted: false,
      };

      return this.find(findOptions);
    } catch (error) {
      this.logger.error(
        `Error finding price history: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get price history for multiple products
   * @param productIds Array of product IDs
   * @param organizationId Organization ID
   * @param dateRange Date range to query
   * @param options Query options
   */
  async findByProductIds(
    productIds: string[],
    organizationId: string,
    dateRange: DateRange,
    options?: {
      marketplaceId?: string;
      recordType?: 'OUR_PRICE' | 'COMPETITOR_PRICE';
      limit?: number;
    },
  ): Promise<Record<string, PriceHistoryRecord[]>> {
    try {
      const advancedFilters: FirestoreAdvancedFilter<PriceHistoryRecord>[] = [
        {
          field: 'productId',
          operator: 'in',
          value: productIds,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>,
        {
          field: 'organizationId',
          operator: '==',
          value: organizationId,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>,
        {
          field: 'recordedAt',
          operator: '>=',
          value: dateRange.start,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>,
        {
          field: 'recordedAt',
          operator: '<=',
          value: dateRange.end,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>,
      ];

      // Add optional filters
      if (options?.marketplaceId) {
        advancedFilters.push({
          field: 'marketplaceId',
          operator: '==',
          value: options.marketplaceId,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>);
      }

      if (options?.recordType) {
        advancedFilters.push({
          field: 'recordType',
          operator: '==',
          value: options.recordType,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>);
      }

      const findOptions: FindOptions<PriceHistoryRecord> = {
        advancedFilters,
        orderBy: [{ field: 'recordedAt', direction: 'asc' }],
        limit: options?.limit || productIds.length * 100, // 100 records per product
        includeDeleted: false,
      };

      const results = await this.find(findOptions);

      // Group by product ID
      const groupedResults: Record<string, PriceHistoryRecord[]> = {};

      // Initialize with empty arrays
      productIds.forEach((id) => {
        groupedResults[id] = [];
      });

      // Group results by product ID
      results.forEach((record) => {
        const productId = record.productId;

        if (groupedResults[productId]) {
          groupedResults[productId].push(record);
        }
      });

      return groupedResults;
    } catch (error) {
      this.logger.error(
        `Error finding price history for multiple products: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get aggregated price history by day
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param dateRange Date range
   * @param options Query options
   */
  async getAggregatedPriceHistory(
    productId: string,
    organizationId: string,
    dateRange: DateRange,
    options?: {
      marketplaceId?: string;
      includeCompetitors?: boolean;
    },
  ): Promise<{
    dates: string[];
    ourPrices: number[];
    competitorPrices: Record<string, number[]>;
  }> {
    try {
      // Get all price history records
      const advancedFilters: FirestoreAdvancedFilter<PriceHistoryRecord>[] = [
        {
          field: 'productId',
          operator: '==',
          value: productId,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>,
        {
          field: 'organizationId',
          operator: '==',
          value: organizationId,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>,
        {
          field: 'recordedAt',
          operator: '>=',
          value: dateRange.start,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>,
        {
          field: 'recordedAt',
          operator: '<=',
          value: dateRange.end,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>,
      ];

      if (options?.marketplaceId) {
        advancedFilters.push({
          field: 'marketplaceId',
          operator: '==',
          value: options.marketplaceId,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>);
      }

      const findOptions: FindOptions<PriceHistoryRecord> = {
        advancedFilters,
        orderBy: [{ field: 'recordedAt', direction: 'asc' }],
        limit: 5000, // Generous limit for history records
        includeDeleted: false,
      };

      const records = await this.find(findOptions);

      // Group records by day
      const dayMap = new Map<
        string,
        {
          ourPrice?: number;
          competitors: Map<string, number>;
        }
      >();

      records.forEach((record) => {
        const day = record.recordedAt.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!dayMap.has(day)) {
          dayMap.set(day, {
            competitors: new Map(),
          });
        }

        const dayData = dayMap.get(day);
        
        if (dayData) {
          if (record.recordType === 'OUR_PRICE') {
            dayData.ourPrice = record.price;
          } else if (
            record.competitorId &&
            options?.includeCompetitors !== false
          ) {
            dayData.competitors.set(record.competitorId, record.price);
          }
        }
      });

      // Convert map to arrays for response
      const dates: string[] = [];
      const ourPrices: number[] = [];
      const competitorPrices: Record<string, number[]> = {};

      // Get list of all competitor IDs
      const allCompetitorIds = new Set<string>();

      dayMap.forEach((dayData) => {
        if (dayData && dayData.competitors) {
          dayData.competitors.forEach((_, competitorId) => {
            allCompetitorIds.add(competitorId);
          });
        }
      });

      // Initialize competitor price arrays
      allCompetitorIds.forEach((competitorId) => {
        competitorPrices[competitorId] = [];
      });

      // Fill arrays from day map
      Array.from(dayMap.entries())
        .sort(([dayA], [dayB]) => dayA.localeCompare(dayB))
        .forEach(([day, dayData]) => {
          dates.push(day);
          ourPrices.push(dayData?.ourPrice ?? 0);

          // Add competitor prices for this day
          if (dayData && dayData.competitors) {
            allCompetitorIds.forEach((competitorId) => {
              competitorPrices[competitorId].push(
                dayData.competitors.has(competitorId)
                  ? dayData.competitors.get(competitorId) ?? 0
                  : 0,
              );
            });
          } else {
            // If dayData or competitors is undefined, add 0 for all competitors
            allCompetitorIds.forEach((competitorId) => {
              competitorPrices[competitorId].push(0);
            });
          }
        });

      return {
        dates,
        ourPrices,
        competitorPrices,
      };
    } catch (error) {
      this.logger.error(
        `Error getting aggregated price history: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Record price history for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param price Product price
   * @param shipping Shipping cost
   * @param currency Currency code
   * @param options Additional record options
   */
  async recordOurPrice(
    productId: string,
    organizationId: string,
    price: number,
    shipping: number,
    currency: string,
    options?: {
      variantId?: string;
      marketplaceId?: string;
      marketplaceName?: string;
      hasBuyBox?: boolean;
      sourceType?: PriceSourceType;
    },
  ): Promise<PriceHistoryRecord> {
    try {
      const now = new Date();

      const record: Omit<PriceHistoryRecord, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version' | 'deletedAt'> = {
        organizationId,
        productId,
        variantId: options?.variantId,
        marketplaceId: options?.marketplaceId,
        marketplaceName: options?.marketplaceName,
        price,
        shipping,
        totalPrice: price + shipping,
        currency,
        recordedAt: now,
        sourceType: options?.sourceType || PriceSourceType.MANUAL,
        hasBuyBox: options?.hasBuyBox,
        recordType: 'OUR_PRICE',
        verificationStatus: PriceSourceType.MARKETPLACE_API
          ? PriceVerificationStatus.VERIFIED
          : PriceVerificationStatus.UNVERIFIED,
      };

      return this.create(record);
    } catch (error) {
      this.logger.error(
        `Error recording our price: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Record competitor price in history
   * @param competitorPrice Competitor price data
   */
  async recordCompetitorPrice(competitorPrice: {
    productId: string;
    organizationId: string;
    variantId?: string;
    competitorId: string;
    competitorName: string;
    marketplaceId: string;
    marketplaceName: string;
    price: number;
    shipping: number;
    currency: string;
    hasBuyBox: boolean;
    sourceType: PriceSourceType;
    verificationStatus: PriceVerificationStatus.VERIFIED | PriceVerificationStatus.PENDING | PriceVerificationStatus.FAILED | PriceVerificationStatus.UNVERIFIED;
    stockStatus?: string;
  }): Promise<PriceHistoryRecord> {
    try {
      const now = new Date();

      const record: Omit<PriceHistoryRecord, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version' | 'deletedAt'> = {
        organizationId: competitorPrice.organizationId,
        productId: competitorPrice.productId,
        variantId: competitorPrice.variantId,
        competitorId: competitorPrice.competitorId,
        competitorName: competitorPrice.competitorName,
        marketplaceId: competitorPrice.marketplaceId,
        marketplaceName: competitorPrice.marketplaceName,
        price: competitorPrice.price,
        shipping: competitorPrice.shipping,
        totalPrice: competitorPrice.price + competitorPrice.shipping,
        currency: competitorPrice.currency,
        recordedAt: now,
        sourceType: competitorPrice.sourceType,
        hasBuyBox: competitorPrice.hasBuyBox,
        recordType: 'COMPETITOR_PRICE',
        verificationStatus: competitorPrice.verificationStatus,
        stockStatus: competitorPrice.stockStatus as any,
      };

      return this.create(record);
    } catch (error) {
      this.logger.error(
        `Error recording competitor price: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find latest price record for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param options Additional query options
   */
  async findLatestPrice(
    productId: string,
    organizationId: string,
    options?: {
      recordType?: 'OUR_PRICE' | 'COMPETITOR_PRICE';
      competitorId?: string;
      marketplaceId?: string;
    },
  ): Promise<PriceHistoryRecord | null> {
    try {
      const advancedFilters: FirestoreAdvancedFilter<PriceHistoryRecord>[] = [
        {
          field: 'productId',
          operator: '==',
          value: productId,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>,
        {
          field: 'organizationId',
          operator: '==',
          value: organizationId,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>,
      ];

      if (options?.recordType) {
        advancedFilters.push({
          field: 'recordType',
          operator: '==',
          value: options.recordType,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>);
      }

      if (options?.competitorId) {
        advancedFilters.push({
          field: 'competitorId',
          operator: '==',
          value: options.competitorId,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>);
      }

      if (options?.marketplaceId) {
        advancedFilters.push({
          field: 'marketplaceId',
          operator: '==',
          value: options.marketplaceId,
        } as FirestoreAdvancedFilter<PriceHistoryRecord>);
      }

      const findOptions: FindOptions<PriceHistoryRecord> = {
        advancedFilters,
        orderBy: [{ field: 'recordedAt', direction: 'desc' }],
        limit: 1,
        includeDeleted: false,
      };

      const results = await this.find(findOptions);

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      this.logger.error(
        `Error finding latest price: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculate price statistics for a given period
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param dateRange Date range
   * @param options Additional query options
   */
  async calculatePriceStatistics(
    productId: string,
    organizationId: string,
    dateRange: DateRange,
    options?: {
      competitorId?: string;
      marketplaceId?: string;
      recordType?: 'OUR_PRICE' | 'COMPETITOR_PRICE';
    },
  ): Promise<{
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    priceChange: number;
    priceChangePercentage: number;
    volatility: number;
  }> {
    try {
      const records = await this.findByProductId(
        productId,
        organizationId,
        dateRange,
        {
          competitorId: options?.competitorId,
          marketplaceId: options?.marketplaceId,
          recordType: options?.recordType,
          limit: 1000,
        },
      );

      if (records.length === 0) {
        return {
          avgPrice: 0,
          minPrice: 0,
          maxPrice: 0,
          priceChange: 0,
          priceChangePercentage: 0,
          volatility: 0,
        };
      }

      // Extract prices for calculation
      const prices = records.map((r) => r.price);

      // Calculate statistics
      const avgPrice =
        prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Price change (first to last)
      const firstPrice = records[0].price;
      const lastPrice = records[records.length - 1].price;
      const priceChange = lastPrice - firstPrice;
      const priceChangePercentage = (priceChange / firstPrice) * 100;

      // Volatility (standard deviation of price changes)
      const priceChanges = [];
      for (let i = 1; i < records.length; i++) {
        const change = records[i].price - records[i - 1].price;
        priceChanges.push(change);
      }

      // Calculate standard deviation if we have price changes
      let volatility = 0;
      if (priceChanges.length > 0) {
        const meanChange =
          priceChanges.reduce((sum, change) => sum + change, 0) /
          priceChanges.length;
        const squaredDiffs = priceChanges.map((change) =>
          Math.pow(change - meanChange, 2),
        );
        const variance =
          squaredDiffs.reduce((sum, diff) => sum + diff, 0) /
          priceChanges.length;
        volatility = Math.sqrt(variance);
      }

      return {
        avgPrice,
        minPrice,
        maxPrice,
        priceChange,
        priceChangePercentage,
        volatility,
      };
    } catch (error) {
      this.logger.error(
        `Error calculating price statistics: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
