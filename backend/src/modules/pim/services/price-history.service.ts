import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PriceHistoryRepository } from '../repositories/price-history.repository';
import { PriceHistoryRecord } from '../models/price-history.model';
import { DateRange } from '../models/date-range.model';
import { mapRawPriceHistoryRecord, mapRawPriceHistoryRecords, mapGroupedRawPriceHistoryRecords } from './adapters/price-history.adapter';

/**
 * Service for managing product price history.
 * Encapsulates business logic, validation, and orchestration for price history operations.
 */
/**
 * Input type for recording a competitor price
 */
export interface CompetitorPriceInput {
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
  sourceType: import('../models/competitor-price.model').PriceSourceType;
  verificationStatus: import('../models/competitor-price.model').PriceVerificationStatus;
  stockStatus?: string;
}

@Injectable()
export class PriceHistoryService {
  private readonly logger = new Logger(PriceHistoryService.name);

  constructor(private readonly priceHistoryRepository: PriceHistoryRepository) {}

  /**
   * Record a competitor price in the price history
   * @param competitorPrice Competitor price data
   */

  async recordCompetitorPrice(competitorPrice: CompetitorPriceInput): Promise<PriceHistoryRecord> {
    // Input validation
    if (
      !competitorPrice.productId ||
      !competitorPrice.organizationId ||
      !competitorPrice.competitorId ||
      !competitorPrice.competitorName ||
      !competitorPrice.marketplaceId ||
      !competitorPrice.marketplaceName ||
      competitorPrice.price === undefined ||
      competitorPrice.shipping === undefined ||
      !competitorPrice.currency ||
      competitorPrice.hasBuyBox === undefined ||
      competitorPrice.sourceType === undefined ||
      competitorPrice.verificationStatus === undefined
    ) {
      throw new Error('Missing required field in competitorPrice');
    }
    const raw = await this.priceHistoryRepository.recordCompetitorPrice(competitorPrice);
    return mapRawPriceHistoryRecord(raw);
  }

  /**
   * Record our own price in the price history
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param price Price
   * @param shipping Shipping
   * @param currency Currency
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
      sourceType?: import('../models/competitor-price.model').PriceSourceType;
    },
  ): Promise<PriceHistoryRecord> {
    const raw = await this.priceHistoryRepository.recordOurPrice(
      productId,
      organizationId,
      price,
      shipping,
      currency,
      options,
    );
    return mapRawPriceHistoryRecord(raw);
  }

  /**
   * Create a new price history record
   * @param data Price history data (excluding id and createdAt)
   */
  async createPriceHistory(
    data: Omit<PriceHistoryRecord, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version' | 'deletedAt'>
  ): Promise<PriceHistoryRecord> {
    this.logger.log('Creating price history record');
    const raw = await this.priceHistoryRepository.create(data);
    return mapRawPriceHistoryRecord(raw);
  }

  /**
   * Get price history records for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param { start, end } Date range to query
   * @param options Query options
   */
  async getPriceHistory(
    productId: string,
    organizationId: string,
    { start, end }: DateRange,
    options?: {
      marketplaceId?: string;
      recordType?: 'OUR_PRICE' | 'COMPETITOR_PRICE';
      limit?: number;
    },
  ): Promise<PriceHistoryRecord[]> {
    const raws = await this.priceHistoryRepository.findByProductId(productId, organizationId, { start, end }, options);
    return mapRawPriceHistoryRecords(raws);
  }

  /**
   * Get price history for multiple products
   * @param productIds Array of product IDs
   * @param organizationId Organization ID
   * @param { start, end } Date range to query
   * @param options Query options
   */
  async getPriceHistoryForProducts(
    productIds: string[],
    organizationId: string,
    { start, end }: DateRange,
    options?: {
      marketplaceId?: string;
      recordType?: 'OUR_PRICE' | 'COMPETITOR_PRICE';
      limit?: number;
    },
  ): Promise<Record<string, PriceHistoryRecord[]>> {
    const grouped = await this.priceHistoryRepository.findByProductIds(productIds, organizationId, { start, end }, options);
    return mapGroupedRawPriceHistoryRecords(grouped);
  }

  /**
   * Get aggregated price history by day
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param { start, end } Date range
   * @param options Query options
   */
  async getAggregatedPriceHistory(
    productId: string,
    organizationId: string,
    { start, end }: DateRange,
    options?: {
      marketplaceId?: string;
      includeCompetitors?: boolean;
    },
  ): Promise<{
    dates: string[];
    ourPrices: number[];
    competitorPrices: Record<string, number[]>;
  }> {
    return this.priceHistoryRepository.getAggregatedPriceHistory(productId, organizationId, { start, end }, options);
  }

  /**
   * Calculate price statistics for a given period
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param { start, end } Date range
   * @param options Additional query options
   */
  async calculatePriceStatistics(
    productId: string,
    organizationId: string,
    { start, end }: DateRange,
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
    return this.priceHistoryRepository.calculatePriceStatistics(productId, organizationId, { start, end }, options);
  }
}
