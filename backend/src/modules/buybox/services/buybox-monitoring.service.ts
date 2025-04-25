import { Injectable, Logger } from '@nestjs/common';

import {
  BuyBoxStatus as BuyBoxStatusEnum,
  MarketPosition,
  PriceSourceType,
} from '../interfaces/types';
import { BuyBoxStatus } from '../models/buybox-status.schema';
import { BuyBoxHistoryRepository } from '../repositories/buybox-history.repository';
import { BuyBoxStatusRepository } from '../repositories/buybox-status.repository';

/**
 * Data for retrieving current BuyBox status
 */
export interface BuyBoxListing {
  price: number;
  shipping: number;
  isInBuyBox: boolean;
  url?: string;
}

/**
 * Competitor price information
 */
export interface CompetitorListing {
  competitorId: string;
  competitorName: string;
  price: number;
  shipping: number;
  currency: string;
  isInBuyBox: boolean;
  url?: string;
}

/**
 * Service for BuyBox monitoring operations
 */
@Injectable()
export class BuyBoxMonitoringService {
  private readonly logger = new Logger(BuyBoxMonitoringService.name);

  constructor(
    private readonly buyBoxStatusRepository: BuyBoxStatusRepository,
    private readonly buyBoxHistoryRepository: BuyBoxHistoryRepository,
  ) {}

  /**
   * Update BuyBox status for a product
   * @param organizationId Organization ID
   * @param productId Product ID
   * @param productSku Product SKU
   * @param productName Product name
   * @param marketplaceId Marketplace ID
   * @param marketplaceName Marketplace name
   * @param myListing Current listing data
   * @param competitorListings Competitor listings
   * @returns Updated BuyBox status
   */
  async updateBuyBoxStatus(
    organizationId: string,
    productId: string,
    productSku: string,
    productName: string,
    marketplaceId: string,
    marketplaceName: string,
    myListing: BuyBoxListing,
    competitorListings: CompetitorListing[],
  ): Promise<BuyBoxStatus> {
    this.logger.log(
      `Updating BuyBox status for product ${productId} on ${marketplaceName}`,
    );

    // Get current status if it exists
    let status = await this.buyBoxStatusRepository.findByProductAndMarketplace(
      productId,
      marketplaceId,
    );

    // Calculate market position
    const marketPosition = this.calculateMarketPosition(
      myListing,
      competitorListings,
    );

    // Determine BuyBox status
    const buyBoxStatus = this.determineBuyBoxStatus(
      myListing,
      competitorListings,
    );

    // Format competitor data
    const competitors = competitorListings.map((listing) => ({
      competitorId: listing.competitorId,
      competitorName: listing.competitorName,
      price: listing.price,
      shipping: listing.shipping,
      totalPrice: listing.price + listing.shipping,
      currency: listing.currency,
      lastUpdated: new Date(),
      sourceType: PriceSourceType.MARKETPLACE,
      sourceUrl: listing.url,
      isBuyBoxWinner: listing.isInBuyBox,
    }));

    // Find BuyBox winner
    const buyBoxWinner = competitorListings.find(
      (listing) => listing.isInBuyBox,
    );

    // Prepare BuyBox status data
    const statusData: Partial<BuyBoxStatus> = {
      organizationId,
      productId,
      productSku,
      productName,
      marketplaceId,
      marketplaceName,
      status: buyBoxStatus,
      currentPrice: myListing.price,
      currentShipping: myListing.shipping,
      currency:
        competitorListings.length > 0 ? competitorListings[0].currency : 'USD',
      listingUrl: myListing.url,
      lastUpdated: new Date(),
      lastChecked: new Date(),
      competitors,
      marketPosition,
      isMonitored: true,
      monitoringInterval: 60, // Default 60 minutes
      sourceType: PriceSourceType.MARKETPLACE,
    };

    // Add BuyBox winner if available
    if (buyBoxWinner) {
      statusData.buyBoxWinner = {
        competitorId: buyBoxWinner.competitorId,
        competitorName: buyBoxWinner.competitorName,
        price: buyBoxWinner.price,
        shipping: buyBoxWinner.shipping,
        totalPrice: buyBoxWinner.price + buyBoxWinner.shipping,
      };
    }

    // Create or update status
    if (status) {
      // Update existing status
      status = (await this.buyBoxStatusRepository.update(
        status.id,
        statusData,
      )) as BuyBoxStatus;
    } else {
      // Create new status
      status = await this.buyBoxStatusRepository.create(
        statusData as any as BuyBoxStatus,
      );
    }

    // Record history
    await this.buyBoxHistoryRepository.createFromStatus(status);

    return status;
  }

  /**
   * Get BuyBox status for a product
   * @param productId Product ID
   * @param marketplaceId Marketplace ID
   * @returns BuyBox status
   */
  async getBuyBoxStatus(
    productId: string,
    marketplaceId: string,
  ): Promise<BuyBoxStatus | null> {
    return this.buyBoxStatusRepository.findByProductAndMarketplace(
      productId,
      marketplaceId,
    );
  }

  /**
   * Get BuyBox statuses for an organization
   * @param organizationId Organization ID
   * @param filters Optional filters
   * @returns Array of BuyBox statuses
   */
  async getBuyBoxStatuses(
    organizationId: string,
    filters?: {
      productId?: string;
      marketplaceId?: string;
      status?: BuyBoxStatusEnum;
      isMonitored?: boolean;
    },
  ): Promise<BuyBoxStatus[]> {
    return this.buyBoxStatusRepository.findWithFilters({
      organizationId,
      ...filters,
    });
  }

  /**
   * Get BuyBox history for a product
   * @param productId Product ID
   * @param marketplaceId Marketplace ID
   * @param limit Maximum items to return
   * @returns BuyBox history
   */
  async getBuyBoxHistory(
    productId: string,
    marketplaceId: string,
    limit: number = 100,
  ): Promise<any[]> {
    return this.buyBoxHistoryRepository.findByProductAndMarketplace(
      productId,
      marketplaceId,
      limit,
    );
  }

  /**
   * Calculate market position based on price data
   * @param myListing Current listing
   * @param competitorListings Competitor listings
   * @returns Market position data
   */
  private calculateMarketPosition(
    myListing: BuyBoxListing,
    competitorListings: CompetitorListing[],
  ): MarketPosition {
    // Calculate total price for all listings
    const myTotalPrice = myListing.price + myListing.shipping;

    const allPrices = competitorListings.map(
      (listing) => listing.price + listing.shipping,
    );

    // Add my price to the array
    allPrices.push(myTotalPrice);

    // Sort prices from lowest to highest
    allPrices.sort((a, b) => a - b);

    // Find my rank (0-indexed)
    const rank = allPrices.indexOf(myTotalPrice) + 1;

    // Calculate price difference from cheapest
    const cheapestPrice = allPrices[0];
    const priceDifference = myTotalPrice - cheapestPrice;
    const priceDifferencePercentage =
      cheapestPrice > 0 ? (priceDifference / cheapestPrice) * 100 : 0;

    return {
      rank,
      totalCompetitors: competitorListings.length,
      priceDifference,
      priceDifferencePercentage,
      isCheapest: rank === 1,
      isExcludingShipping: false,
    };
  }

  /**
   * Determine BuyBox status
   * @param myListing Current listing
   * @param competitorListings Competitor listings
   * @returns BuyBox status
   */
  private determineBuyBoxStatus(
    myListing: BuyBoxListing,
    competitorListings: CompetitorListing[],
  ): BuyBoxStatusEnum {
    // If I'm in the BuyBox, I won
    if (myListing.isInBuyBox) {
      return BuyBoxStatusEnum.WON;
    }

    // If there are no competitors, not applicable
    if (competitorListings.length === 0) {
      return BuyBoxStatusEnum.NOT_APPLICABLE;
    }

    // Check if any competitor has the BuyBox
    const buyBoxWinner = competitorListings.find(
      (listing) => listing.isInBuyBox,
    );

    if (!buyBoxWinner) {
      return BuyBoxStatusEnum.UNKNOWN;
    }

    // If a competitor has the BuyBox, I lost
    return BuyBoxStatusEnum.LOST;
  }
}
