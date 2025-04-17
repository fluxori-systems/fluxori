/**
 * B2B Price List Model
 * 
 * Defines specialized pricing structures for B2B customers.
 * A core component of the Advanced B2B Support feature.
 */

/**
 * Price list type defines the application scope of the price list
 */
export enum PriceListType {
  /**
   * Standard price list applicable to all customers
   */
  STANDARD = 'STANDARD',
  
  /**
   * Special pricing for specific customer tiers
   */
  TIER_SPECIFIC = 'TIER_SPECIFIC',
  
  /**
   * Special pricing for specific customer groups
   */
  GROUP_SPECIFIC = 'GROUP_SPECIFIC',
  
  /**
   * Special pricing for individually selected customers
   */
  CUSTOMER_SPECIFIC = 'CUSTOMER_SPECIFIC',
  
  /**
   * Promotional price list with time-limited special pricing
   */
  PROMOTIONAL = 'PROMOTIONAL',
  
  /**
   * Contract-specific pricing (linked to a specific contract)
   */
  CONTRACT = 'CONTRACT'
}

/**
 * Price entry for a single product within a price list
 */
export interface PriceListEntry {
  /**
   * Product ID for this price entry
   */
  productId: string;
  
  /**
   * SKU for this price entry
   */
  sku: string;
  
  /**
   * Fixed price for this product
   */
  price: number;
  
  /**
   * Alternative discount percentage (instead of fixed price)
   */
  discountPercentage?: number;
  
  /**
   * Minimum quantity for this price to apply (for volume pricing)
   */
  minQuantity?: number;
  
  /**
   * Maximum quantity for this price to apply (for volume pricing)
   */
  maxQuantity?: number;
  
  /**
   * Whether this entry is currently active
   */
  isActive: boolean;
  
  /**
   * Region-specific prices and discounts
   */
  regionalPrices?: Record<string, {
    price?: number;
    discountPercentage?: number;
    isActive: boolean;
  }>;
}

/**
 * Volume pricing tier for graduated pricing
 */
export interface VolumePricingTier {
  /**
   * Minimum quantity for this pricing tier
   */
  minQuantity: number;
  
  /**
   * Maximum quantity for this pricing tier (optional)
   */
  maxQuantity?: number;
  
  /**
   * Fixed price for this tier
   */
  price?: number;
  
  /**
   * Alternative discount percentage for this tier
   */
  discountPercentage?: number;
}

/**
 * Product volume pricing configuration
 */
export interface ProductVolumePrice {
  /**
   * Product ID for this volume pricing configuration
   */
  productId: string;
  
  /**
   * SKU for this volume pricing configuration
   */
  sku: string;
  
  /**
   * Whether this volume pricing configuration is active
   */
  isActive: boolean;
  
  /**
   * Array of volume pricing tiers
   */
  tiers: VolumePricingTier[];
  
  /**
   * Region-specific volume pricing configurations
   */
  regionalTiers?: Record<string, VolumePricingTier[]>;
}

/**
 * B2B Price List model
 * Extends the BaseEntity interface to ensure TypeScript compatibility
 */
import { BaseEntity } from '../../../../common/repositories/base/repository-types';

export interface B2BPriceList extends BaseEntity {
  /**
   * Organization that owns this price list
   */
  organizationId: string;
  
  /**
   * Display name for the price list
   */
  name: string;
  
  /**
   * Detailed description of the price list
   */
  description?: string;
  
  /**
   * Type of price list (standard, tier-specific, etc.)
   */
  type: PriceListType;
  
  /**
   * Customer tier IDs this price list applies to (if tier-specific)
   */
  customerTierIds?: string[];
  
  /**
   * Customer group IDs this price list applies to (if group-specific)
   */
  customerGroupIds?: string[];
  
  /**
   * Individual customer IDs this price list applies to (if customer-specific)
   */
  customerIds?: string[];
  
  /**
   * Contract ID this price list is linked to (if contract type)
   */
  contractId?: string;
  
  /**
   * Date from which this price list is valid
   */
  startDate?: Date;
  
  /**
   * Date until which this price list is valid
   */
  endDate?: Date;
  
  /**
   * Priority of this price list (higher number = higher priority)
   */
  priority: number;
  
  /**
   * Whether the price list is currently active
   */
  isActive: boolean;
  
  /**
   * Currency code for the prices in this list
   */
  currencyCode: string;
  
  /**
   * Minimum order value required to use this price list
   */
  minOrderValue?: number;
  
  /**
   * Array of price entries for individual products
   */
  prices: PriceListEntry[];
  
  /**
   * Volume pricing configurations for products
   */
  volumePrices?: ProductVolumePrice[];
  
  /**
   * Whether volume pricing is enabled for this price list
   */
  enableVolumePricing: boolean;
  
  /**
   * Whether regional pricing is enabled for this price list
   */
  enableRegionalPricing: boolean;
  
  /**
   * Additional custom fields specific to this price list
   */
  customFields?: Record<string, any>;
}