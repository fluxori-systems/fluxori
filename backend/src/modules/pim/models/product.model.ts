/**
 * Product Model
 *
 * Core model for products in the PIM module
 */

import { TenantEntity } from '../../../types/google-cloud.types';
import {
  ProductStatus,
  ProductType,
  PriceInfo,
  ProductAttribute,
  MarketplaceMapping,
  CategoryReference,
  ComplianceInfo,
} from '../interfaces/types';

/**
 * Product entity
 */
export interface Product extends TenantEntity {
  /**
   * Stock Keeping Unit - unique product identifier
   */
  sku: string;

  /**
   * Product name
   */
  name: string;

  /**
   * Product description
   */
  description: string;

  /**
   * Short description for listings
   */
  shortDescription?: string;

  /**
   * Product status
   */
  status: ProductStatus;

  /**
   * Product type
   */
  type: ProductType;

  /**
   * Array of category references
   */
  categories: CategoryReference[];

  /**
   * Product pricing information
   */
  pricing: PriceInfo;

  /**
   * Weight in kilograms
   */
  weight?: number;

  /**
   * Dimensions in cm [length, width, height]
   */
  dimensions?: [number, number, number];

  /**
   * Main product images
   */
  images?: {
    /**
     * Main product image URL
     */
    main?: string;

    /**
     * Additional gallery images
     */
    gallery?: string[];

    /**
     * Image metadata (keyed by image URL)
     */
    metadata?: Record<
      string,
      {
        alt?: string;
        title?: string;
        sortOrder?: number;
      }
    >;
  };

  /**
   * Product attributes (custom fields)
   */
  attributes: ProductAttribute[];

  /**
   * If product is a variant, reference to parent product ID
   */
  parentId?: string;

  /**
   * For bundle products, list of component products
   */
  bundleComponents?: Array<{
    productId: string;
    sku: string;
    quantity: number;
    isRequired: boolean;
  }>;

  /**
   * Reference to bundle ID if this product represents a bundle
   */
  bundleId?: string;

  /**
   * SEO information
   */
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    urlKey?: string;
  };

  /**
   * Marketplace mappings
   */
  marketplaceMappings?: MarketplaceMapping[];

  /**
   * Stock information
   */
  stock?: {
    /**
     * Whether the product is in stock
     */
    inStock: boolean;

    /**
     * Available quantity
     */
    quantity: number;

    /**
     * Warehouse stock levels (for multi-warehouse)
     */
    warehouseStock?: Record<string, number>;

    /**
     * Low stock threshold
     */
    lowStockThreshold?: number;

    /**
     * Whether to manage stock
     */
    manageStock: boolean;
  };

  /**
   * Regional compliance information
   */
  compliance?: ComplianceInfo;

  /**
   * Region-specific data
   */
  regional?: {
    /**
     * South Africa specific data
     */
    southAfrica?: {
      /**
       * Whether product is ICASA approved
       */
      icasaApproved?: boolean;

      /**
       * Whether product has SABS approval
       */
      sabsApproved?: boolean;

      /**
       * Whether product has NRCS approval
       */
      nrcsApproved?: boolean;

      /**
       * Whether product is subject to load shedding restrictions
       */
      loadSheddingCritical?: boolean;
    };

    /**
     * Europe specific data
     */
    europe?: {
      /**
       * Whether product has CE marking
       */
      ceMarking?: boolean;

      /**
       * Whether product complies with GDPR
       */
      gdprCompliant?: boolean;
    };
  };

  /**
   * Tags for grouping and filtering
   */
  tags?: string[];

  /**
   * Last sync timestamp
   */
  lastSyncedAt?: Date;

  /**
   * Date when product was published
   */
  publishedAt?: Date;

  /**
   * URL to product on frontend
   */
  url?: string;

  /**
   * Whether product is featured
   */
  featured?: boolean;

  /**
   * Date when product becomes available
   */
  availableFrom?: Date;

  /**
   * Date when product is no longer available
   */
  availableTo?: Date;
}

/**
 * Product creation DTO
 */
export type CreateProductDto = Omit<
  Product,
  'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt' | 'version'
>;

/**
 * Product update DTO
 */
export type UpdateProductDto = Partial<CreateProductDto>;

/**
 * Re-export product status enum for convenience
 */
export { ProductStatus } from '../interfaces/types';

/**
 * Re-export product type enum for convenience
 */
export { ProductType } from '../interfaces/types';
