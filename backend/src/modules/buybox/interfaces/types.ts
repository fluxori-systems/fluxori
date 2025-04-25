/**
 * Types for the BuyBox module
 */
import { FirestoreEntity } from '../../../types/google-cloud.types';

/**
 * BuyBox price source type
 */
export enum PriceSourceType {
  MARKETPLACE = 'marketplace',
  MANUAL = 'manual',
  API = 'api',
  SCRAPER = 'scraper',
}

/**
 * BuyBox status
 */
export enum BuyBoxStatus {
  WON = 'won',
  LOST = 'lost',
  TIED = 'tied',
  UNKNOWN = 'unknown',
  NOT_APPLICABLE = 'not_applicable',
}

/**
 * Competitor price type
 */
export interface CompetitorPrice {
  competitorId: string;
  competitorName: string;
  price: number;
  shipping: number;
  totalPrice: number;
  currency: string;
  lastUpdated: Date;
  sourceType: PriceSourceType;
  sourceUrl?: string;
  isBuyBoxWinner: boolean;
  metadata?: Record<string, any>;
}

/**
 * Pricing rule operation type
 */
export enum PricingRuleOperation {
  MATCH = 'match',
  BEAT_BY = 'beat_by',
  MATCH_SHIPPING = 'match_shipping',
  FIXED_PRICE = 'fixed_price',
  PERCENTAGE_MARGIN = 'percentage_margin',
  PERCENTAGE_DISCOUNT = 'percentage_discount',
  FLOOR_CEILING = 'floor_ceiling',
}

/**
 * Pricing rule execution status
 */
export enum PricingRuleExecutionStatus {
  PENDING = 'pending',
  EXECUTED = 'executed',
  SKIPPED = 'skipped',
  FAILED = 'failed',
}

/**
 * Price adjustment action
 */
export interface PriceAdjustment {
  oldPrice: number;
  newPrice: number;
  oldShipping?: number;
  newShipping?: number;
  appliedRule: string;
  appliedAt: Date;
  reason: string;
  marketplace: string;
  status: PricingRuleExecutionStatus;
  error?: string;
}

/**
 * Market position data
 */
export interface MarketPosition {
  rank: number;
  totalCompetitors: number;
  priceDifference: number;
  priceDifferencePercentage: number;
  isCheapest: boolean;
  isExcludingShipping: boolean;
}

/**
 * BuyBox monitoring threshold
 */
export interface BuyBoxThreshold {
  buyBoxLost: {
    enabled: boolean;
    timeWindow: number; // minutes
    occurrences: number;
  };
  priceDrop: {
    enabled: boolean;
    percentage: number;
  };
  newCompetitor: {
    enabled: boolean;
  };
}
