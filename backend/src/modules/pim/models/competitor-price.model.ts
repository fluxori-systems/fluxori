/**
 * Price source enum
 * Defines where a price was retrieved from
 */
export enum PriceSourceType {
  /**
   * Directly from marketplace API
   */
  MARKETPLACE_API = 'MARKETPLACE_API',

  /**
   * From web scraping
   */
  WEB_SCRAPER = 'WEB_SCRAPER',

  /**
   * Manually entered
   */
  MANUAL = 'MANUAL',

  /**
   * From third-party data provider
   */
  DATA_PROVIDER = 'DATA_PROVIDER',

  /**
   * From price comparison API
   */
  PRICE_COMPARISON_API = 'PRICE_COMPARISON_API',
}

/**
 * Price verification status enum
 * Defines the verification status of a price
 */
export enum PriceVerificationStatus {
  /**
   * Price has been verified
   */
  VERIFIED = 'VERIFIED',

  /**
   * Price is pending verification
   */
  PENDING = 'PENDING',

  /**
   * Price verification failed
   */
  FAILED = 'FAILED',

  /**
   * Price is unverified
   */
  UNVERIFIED = 'UNVERIFIED',
}

/**
 * Date range type for price history queries
 */
export interface DateRange {
  start: Date;
  end: Date;
}


/**
 * Stock status enum
 * Defines the stock status for a competitor's product
 */
export enum CompetitorStockStatus {
  /**
   * In stock
   */
  IN_STOCK = 'IN_STOCK',

  /**
   * Out of stock
   */
  OUT_OF_STOCK = 'OUT_OF_STOCK',

  /**
   * Low stock
   */
  LOW_STOCK = 'LOW_STOCK',

  /**
   * Back ordered
   */
  BACK_ORDERED = 'BACK_ORDERED',

  /**
   * Pre-order
   */
  PRE_ORDER = 'PRE_ORDER',

  /**
   * Unknown stock status
   */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Market position data
 * Describes the position of a product relative to competitors
 */
export interface MarketPosition {
  /**
   * Rank among competitors (1 = cheapest)
   */
  rank: number;

  /**
   * Total number of competitors
   */
  totalCompetitors: number;

  /**
   * Price difference from lowest competitor (absolute value)
   */
  priceDifference: number;

  /**
   * Price difference percentage
   */
  priceDifferencePercentage: number;

  /**
   * Whether this is the cheapest option
   */
  isCheapest: boolean;

  /**
   * Whether analysis excludes shipping
   */
  isExcludingShipping: boolean;
}

import { FirestoreEntityWithMetadata } from '../../../common/repositories/base/repository-types';

/**
 * Competitor price model
 * Represents a price for a product from a competitor
 */
export interface CompetitorPrice extends FirestoreEntityWithMetadata {
  /**
   * Record ID
   */
  id: string;

  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Tenant ID (optional)
   */
  tenantId?: string;

  /**
   * When this record was created
   */
  createdAt: Date;

  /**
   * When this record was updated
   */
  updatedAt: Date;

  /**
   * Soft delete flag
   */
  isDeleted: boolean;

  /**
   * Soft delete timestamp (nullable)
   */
  deletedAt?: Date | null;

  /**
   * Version for optimistic locking
   */
  version: number;

  /**
   * Product ID in our system
   */
  productId: string;

  /**
   * Variant ID in our system (if applicable)
   */
  variantId?: string;

  /**
   * Product SKU
   */
  productSku: string;

  /**
   * Competitor ID or identifier
   */
  competitorId: string;

  /**
   * Competitor name
   */
  competitorName: string;

  /**
   * Marketplace ID
   */
  marketplaceId: string;

  /**
   * Marketplace name
   */
  marketplaceName: string;

  /**
   * Product price
   */
  price: number;

  /**
   * Shipping cost
   */
  shipping: number;

  /**
   * Total price (price + shipping)
   */
  totalPrice: number;

  /**
   * Currency code
   */
  currency: string;

  /**
   * When the price was last updated
   */
  lastUpdated: Date;

  /**
   * Source URL where the price was found
   */
  sourceUrl?: string;

  /**
   * Type of price source
   */
  sourceType: PriceSourceType;

  /**
   * Verification status
   */
  verificationStatus: PriceVerificationStatus;

  /**
   * Whether this competitor has the BuyBox
   */
  hasBuyBox: boolean;

  /**
   * Stock status
   */
  stockStatus: CompetitorStockStatus;

  /**
   * Estimated delivery time (in days)
   */
  estimatedDeliveryDays?: number;

  /**
   * Additional competitor data. Use a strict union for allowed types.
   */
  metadata?: import('./custom-fields.model').CustomFields;
}

/**
 * Price history record
 * Represents a historical price point for a product
 */
export interface PriceHistoryRecord extends FirestoreEntityWithMetadata {
  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Product ID
   */
  productId: string;

  /**
   * Variant ID (if applicable)
   */
  variantId?: string;

  /**
   * Competitor ID (if applicable)
   */
  competitorId?: string;

  /**
   * Competitor name (if applicable)
   */
  competitorName?: string;

  /**
   * Marketplace ID (if applicable)
   */
  marketplaceId?: string;

  /**
   * Marketplace name (if applicable)
   */
  marketplaceName?: string;

  /**
   * Product price
   */
  price: number;

  /**
   * Shipping cost
   */
  shipping: number;

  /**
   * Total price (price + shipping)
   */
  totalPrice: number;

  /**
   * Currency code
   */
  currency: string;

  /**
   * Date and time of the price record
   */
  recordedAt: Date;

  /**
   * Source of the price data
   */
  sourceType: PriceSourceType;

  /**
   * Whether this price had the BuyBox
   */
  hasBuyBox?: boolean;

  /**
   * Type of price record
   */
  recordType: 'OUR_PRICE' | 'COMPETITOR_PRICE';

  /**
   * Market position at this time
   */
  marketPosition?: MarketPosition;

  /**
   * Verification status
   */
  verificationStatus: PriceVerificationStatus;

  /**
   * Stock status at the time
   */
  stockStatus?: CompetitorStockStatus;
}

/**
 * Price monitoring configuration for a product
 */
export interface PriceMonitoringConfig extends FirestoreEntityWithMetadata {
  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Product ID
   */
  productId: string;

  /**
   * Variant ID (if applicable)
   */
  variantId?: string;

  /**
   * Whether price monitoring is enabled
   */
  isEnabled: boolean;

  /**
   * Monitoring interval in minutes
   */
  monitoringIntervalMinutes: number;

  /**
   * Marketplaces to monitor
   */
  monitoredMarketplaces: string[];

  /**
   * Competitors to specifically monitor
   */
  monitoredCompetitors?: string[];

  /**
   * Notification threshold for price changes (percentage)
   */
  notificationThresholdPercentage?: number;

  /**
   * Notification threshold for price changes (absolute amount)
   */
  notificationThresholdAmount?: number;

  /**
   * Whether to automatically adjust prices based on monitoring
   */
  enableAutomaticPriceAdjustment: boolean;

  /**
   * Minimum price allowed for automatic adjustments
   */
  minimumPrice?: number;

  /**
   * Maximum price allowed for automatic adjustments
   */
  maximumPrice?: number;

  /**
   * Minimum margin percentage required
   */
  minimumMarginPercentage?: number;

  /**
   * Price strategy for automatic adjustments
   */
  priceStrategy?: {
    /**
     * Strategy type
     */
    type:
      | 'MATCH'
      | 'BEAT_BY_PERCENTAGE'
      | 'BEAT_BY_AMOUNT'
      | 'MAINTAIN_POSITION';

    /**
     * Strategy value
     */
    value: number;

    /**
     * Target position to maintain (for MAINTAIN_POSITION)
     */
    targetPosition?: number;
  };

  /**
   * Who created this configuration
   */
  createdBy?: string;

  /**
   * Who last updated this configuration
   */
  updatedBy?: string;
}

/**
 * Price alert type
 * Represents an alert for price monitoring
 */
export interface PriceAlert extends FirestoreEntityWithMetadata {
  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Product ID
   */
  productId: string;

  /**
   * Variant ID (if applicable)
   */
  variantId?: string;

  /**
   * Alert type
   */
  alertType:
    | 'COMPETITOR_PRICE_DECREASE'
    | 'COMPETITOR_PRICE_INCREASE'
    | 'BUYBOX_LOST'
    | 'STOCK_STATUS_CHANGE'
    | 'NEW_COMPETITOR'
    | 'PRICE_ADJUSTMENT_RECOMMENDED';

  /**
   * Alert severity
   */
  severity: 'LOW' | 'MEDIUM' | 'HIGH';

  /**
   * Alert message
   */
  message: string;

  /**
   * Alert details
   */
  details: import('./custom-fields.model').CustomFields;

  /**
   * Whether the alert has been read
   */
  isRead: boolean;

  /**
   * Whether the alert has been resolved
   */
  isResolved: boolean;

  /**
   * When the alert was read
   */
  readAt?: Date;

  /**
   * When the alert was resolved
   */
  resolvedAt?: Date;
}

/**
 * Competitor price report
 * Summary of price data for a product
 */
export interface CompetitorPriceReport {
  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Product ID
   */
  productId: string;

  /**
   * Product SKU
   */
  productSku: string;

  /**
   * Product name
   */
  productName: string;

  /**
   * Our current price
   */
  ourPrice: number;

  /**
   * Our current shipping cost
   */
  ourShipping: number;

  /**
   * Our total price
   */
  ourTotalPrice: number;

  /**
   * Currency code
   */
  currency: string;

  /**
   * Whether we have the BuyBox
   */
  hasBuyBox: boolean;

  /**
   * Current market position
   */
  marketPosition: MarketPosition;

  /**
   * Competitor prices (sorted by total price ascending)
   */
  competitorPrices: CompetitorPrice[];

  /**
   * Price history over time for our product and competitors
   */
  priceHistory?: {
    dates: string[];
    ourPrices: number[];
    competitorPrices: Record<string, number[]>;
  };

  /**
   * Price recommendations based on analysis
   */
  priceRecommendations?: {
    recommendedPrice: number;
    strategy: string;
    potentialMarketPosition: MarketPosition;
    reasonForRecommendation: string;
  };

  /**
   * Alert count by type
   */
  activeAlertCount: number;

  /**
   * Report generation time
   */
  generatedAt: Date;
}
