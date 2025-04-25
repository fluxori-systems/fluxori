import { Injectable, Logger } from '@nestjs/common';

import { v4 as uuidv4 } from 'uuid';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import {
  PriceHistoryRecord,
  DateRange,
  PriceSourceType,
} from '../models/competitor-price.model';

/**
 * Repository for price history
 * Handles persistence of price history data
 */
@Injectable()
export class PriceHistoryRepository extends FirestoreBaseRepository<PriceHistoryRecord> {
  private readonly logger = new Logger(PriceHistoryRepository.name);

  constructor() {
    super('price-history', {
      enableDataValidation: true,
      enableQueryCache: true,
      cacheExpirationMinutes: 60, // Price history can be cached longer
      enableTransactionality: false, // Historical data is append-only
    });
  }

  /**
   * Create a new price history record
   * @param data Price history data
   */
  async create(
    data: Omit<PriceHistoryRecord, 'id' | 'createdAt'>,
  ): Promise<PriceHistoryRecord> {
    try {
      const now = new Date();

      const newRecord: PriceHistoryRecord = {
        ...data,
        id: uuidv4(),
        createdAt: now,
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
      const whereConditions: any[] = [
        { field: 'productId', operator: '==', value: productId },
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'recordedAt', operator: '>=', value: dateRange.startDate },
        { field: 'recordedAt', operator: '<=', value: dateRange.endDate },
      ];

      // Add optional filters
      if (options?.competitorId) {
        whereConditions.push({
          field: 'competitorId',
          operator: '==',
          value: options.competitorId,
        });
      }

      if (options?.marketplaceId) {
        whereConditions.push({
          field: 'marketplaceId',
          operator: '==',
          value: options.marketplaceId,
        });
      }

      if (options?.recordType) {
        whereConditions.push({
          field: 'recordType',
          operator: '==',
          value: options.recordType,
        });
      }

      const query = {
        where: whereConditions,
        orderBy: [{ field: 'recordedAt', direction: 'asc' }],
        limit: options?.limit || 1000,
      };

      return this.query(query);
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
      const whereConditions: any[] = [
        { field: 'productId', operator: 'in', value: productIds },
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'recordedAt', operator: '>=', value: dateRange.startDate },
        { field: 'recordedAt', operator: '<=', value: dateRange.endDate },
      ];

      // Add optional filters
      if (options?.marketplaceId) {
        whereConditions.push({
          field: 'marketplaceId',
          operator: '==',
          value: options.marketplaceId,
        });
      }

      if (options?.recordType) {
        whereConditions.push({
          field: 'recordType',
          operator: '==',
          value: options.recordType,
        });
      }

      const query = {
        where: whereConditions,
        orderBy: [{ field: 'recordedAt', direction: 'asc' }],
        limit: options?.limit || productIds.length * 100, // 100 records per product
      };

      const results = await this.query(query);

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
      const whereConditions: any[] = [
        { field: 'productId', operator: '==', value: productId },
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'recordedAt', operator: '>=', value: dateRange.startDate },
        { field: 'recordedAt', operator: '<=', value: dateRange.endDate },
      ];

      if (options?.marketplaceId) {
        whereConditions.push({
          field: 'marketplaceId',
          operator: '==',
          value: options.marketplaceId,
        });
      }

      const query = {
        where: whereConditions,
        orderBy: [{ field: 'recordedAt', direction: 'asc' }],
        limit: 5000, // Generous limit for history records
      };

      const records = await this.query(query);

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

        if (record.recordType === 'OUR_PRICE') {
          dayData.ourPrice = record.price;
        } else if (
          record.competitorId &&
          options?.includeCompetitors !== false
        ) {
          dayData.competitors.set(record.competitorId, record.price);
        }
      });

      // Convert map to arrays for response
      const dates: string[] = [];
      const ourPrices: number[] = [];
      const competitorPrices: Record<string, number[]> = {};

      // Get list of all competitor IDs
      const allCompetitorIds = new Set<string>();

      dayMap.forEach((dayData) => {
        dayData.competitors.forEach((_, competitorId) => {
          allCompetitorIds.add(competitorId);
        });
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
          ourPrices.push(dayData.ourPrice ?? null);

          // Add competitor prices for this day
          allCompetitorIds.forEach((competitorId) => {
            competitorPrices[competitorId].push(
              dayData.competitors.has(competitorId)
                ? dayData.competitors.get(competitorId)
                : null,
            );
          });
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

      const record: Omit<PriceHistoryRecord, 'id' | 'createdAt'> = {
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
          ? 'VERIFIED'
          : 'UNVERIFIED',
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
    verificationStatus: 'VERIFIED' | 'PENDING' | 'FAILED' | 'UNVERIFIED';
    stockStatus?: string;
  }): Promise<PriceHistoryRecord> {
    try {
      const now = new Date();

      const record: Omit<PriceHistoryRecord, 'id' | 'createdAt'> = {
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
      const whereConditions: any[] = [
        { field: 'productId', operator: '==', value: productId },
        { field: 'organizationId', operator: '==', value: organizationId },
      ];

      if (options?.recordType) {
        whereConditions.push({
          field: 'recordType',
          operator: '==',
          value: options.recordType,
        });
      }

      if (options?.competitorId) {
        whereConditions.push({
          field: 'competitorId',
          operator: '==',
          value: options.competitorId,
        });
      }

      if (options?.marketplaceId) {
        whereConditions.push({
          field: 'marketplaceId',
          operator: '==',
          value: options.marketplaceId,
        });
      }

      const query = {
        where: whereConditions,
        orderBy: [{ field: 'recordedAt', direction: 'desc' }],
        limit: 1,
      };

      const results = await this.query(query);

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
