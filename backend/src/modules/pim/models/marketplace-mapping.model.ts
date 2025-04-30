/**
 * Product Marketplace Mapping Model
 *
 * This model represents the mapping between products in the PIM module
 * and their corresponding listings on various marketplaces.
 */

import { FirestoreEntityWithMetadata } from '../../../common/repositories/base/repository-types';

/**
 * Product marketplace mapping entity
 */
export interface ProductMarketplaceMapping extends FirestoreEntityWithMetadata {
  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Tenant ID (optional)
   */
  tenantId?: string;

  /**
   * Product ID in the PIM system
   */
  productId: string;

  /**
   * Product variant ID (if applicable)
   */
  variantId?: string;

  /**
   * Marketplace identifier (e.g., 'takealot', 'amazon')
   */
  marketplaceId: string;

  /**
   * External ID of the product in the marketplace
   */
  externalId?: string;

  /**
   * External SKU in the marketplace
   */
  externalSku?: string;

  /**
   * URL to the product on the marketplace
   */
  marketplaceUrl?: string;

  /**
   * Mapping status
   */
  status: 'active' | 'inactive' | 'pending' | 'error';

  /**
   * Last sync timestamp
   */
  lastSyncedAt?: Date;

  /**
   * Last sync error message (if any)
   */
  lastSyncError?: string | null;

  /**
   * Field mapping for marketplace-specific fields
   */
  fieldMapping?: Record<string, string>;

  /**
   * Marketplace-specific metadata
   */
  marketplaceMetadata?: Record<string, any>;

  /**
   * Attributes that are overridden for this marketplace
   */
  attributeOverrides?: Record<string, any>;

  /**
   * Category mapping for this marketplace
   */
  categoryMapping?: {
    /**
     * PIM category ID
     */
    pimCategoryId: string;

    /**
     * Marketplace category ID
     */
    marketplaceCategoryId: string;

    /**
     * Marketplace category name
     */
    marketplaceCategoryName?: string;
  };

  /**
   * Price and inventory override for this marketplace
   */
  priceAndInventory?: {
    /**
     * Whether to override the price
     */
    overridePrice: boolean;

    /**
     * Overridden price amount
     */
    price?: number;

    /**
     * Overridden sale price amount
     */
    salePrice?: number;

    /**
     * Whether to override the inventory
     */
    overrideInventory: boolean;

    /**
     * Overridden inventory level
     */
    stockLevel?: number;
  };

  /**
   * South African specific fields
   */
  southAfrica?: {
    /**
     * Whether the listing is enabled for South Africa
     */
    enabled: boolean;

    /**
     * Takealot SHOP specific fields
     */
    takealot?: {
      /**
       * Takealot Offer ID
       */
      offerId?: string;

      /**
       * Takealot SHOP SKU
       */
      shopSku?: string;

      /**
       * Takealot Lead Time
       */
      leadTimeInDays?: number;

      /**
       * RRP (Recommended Retail Price)
       */
      rrp?: number;
    };
  };
}

/**
 * Data transfer object for creating a product marketplace mapping
 */
export type CreateProductMarketplaceMappingDto = Omit<
  ProductMarketplaceMapping,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * Data transfer object for updating a product marketplace mapping
 */
export type UpdateProductMarketplaceMappingDto =
  Partial<CreateProductMarketplaceMappingDto>;

/**
 * Result of a marketplace sync operation
 */
export interface MarketplaceSyncResult {
  /**
   * Whether the sync operation was successful
   */
  success: boolean;

  /**
   * Product ID in the PIM system
   */
  productId: string;

  /**
   * Marketplace identifier
   */
  marketplaceId: string;

  /**
   * Timestamp of the sync operation
   */
  timestamp: Date;

  /**
   * External ID in the marketplace (if applicable)
   */
  externalId?: string;

  /**
   * New status after sync
   */
  status: 'active' | 'inactive' | 'pending' | 'error';

  /**
   * Error message (if sync failed)
   */
  errorMessage?: string;

  /**
   * Additional metadata about the sync operation
   */
  metadata?: import('./custom-fields.model').CustomFields;
}
