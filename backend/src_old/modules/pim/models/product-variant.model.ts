/**
 * Product Variant Model
 *
 * Model for product variants in the PIM module
 */

import { TenantEntity } from "../../../types/google-cloud.types";
import { Product } from "./product.model";
import { ProductAttribute } from "../interfaces/types";

/**
 * Product variant entity
 *
 * A product variant is a specific version of a product with unique attributes
 * (e.g., different color, size, etc.)
 */
export interface ProductVariant extends TenantEntity {
  /**
   * Reference to the parent product ID
   */
  parentId: string;

  /**
   * Variant-specific SKU
   */
  sku: string;

  /**
   * Variant name (usually parent name + attribute values)
   */
  name: string;

  /**
   * Variant-specific attributes that differ from parent
   */
  attributes: ProductAttribute[];

  /**
   * Variant-specific pricing (overrides parent pricing if present)
   */
  pricing?: {
    /**
     * Base price amount (without tax)
     */
    basePrice?: number;

    /**
     * Whether this price includes VAT
     */
    vatIncluded?: boolean;

    /**
     * Currency code (e.g., 'ZAR', 'USD', 'EUR')
     */
    currency?: string;

    /**
     * Special or sale price, if applicable
     */
    specialPrice?: number;

    /**
     * Start date for special price
     */
    specialPriceFromDate?: Date;

    /**
     * End date for special price
     */
    specialPriceToDate?: Date;
  };

  /**
   * Variant-specific images
   */
  images?: {
    /**
     * Main variant image
     */
    main?: string;

    /**
     * Additional gallery images
     */
    gallery?: string[];
  };

  /**
   * Variant-specific stock information
   */
  stock?: {
    /**
     * Whether the variant is in stock
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
  };

  /**
   * Whether this variant is the default option
   */
  isDefault?: boolean;

  /**
   * Position for sorting when displaying variants
   */
  position?: number;

  /**
   * Variant-specific dimensions in cm [length, width, height]
   */
  dimensions?: [number, number, number];

  /**
   * Variant-specific weight in kilograms
   */
  weight?: number;

  /**
   * Marketplace mappings for this variant
   */
  marketplaceMappings?: {
    /**
     * Marketplace ID
     */
    marketplaceId: string;

    /**
     * External variant ID in the marketplace
     */
    externalId: string;

    /**
     * External variant SKU
     */
    externalSku?: string;

    /**
     * Last sync timestamp
     */
    lastSynced?: Date;

    /**
     * Sync status
     */
    status: "active" | "inactive" | "pending" | "error";
  }[];

  /**
   * Region-specific variant data
   */
  regional?: {
    /**
     * South Africa specific data
     */
    southAfrica?: {
      /**
       * South African barcode
       */
      saBarcode?: string;
    };

    /**
     * Europe specific data
     */
    europe?: {
      /**
       * European barcode (EAN)
       */
      eanCode?: string;
    };
  };

  /**
   * URL key/slug for this variant
   */
  urlKey?: string;
}

/**
 * Variant group - a collection of variants for a parent product
 */
export interface VariantGroup {
  /**
   * Parent product ID
   */
  productId: string;

  /**
   * Variant attributes - which attributes create the variants
   */
  variantAttributes: string[];

  /**
   * List of variants in this group
   */
  variants: ProductVariant[];

  /**
   * Display mode for variant selection
   */
  displayMode?: "dropdown" | "swatch" | "buttons" | "grid";
}

/**
 * Product variant creation DTO
 */
export type CreateProductVariantDto = Omit<
  ProductVariant,
  "id" | "createdAt" | "updatedAt" | "isDeleted" | "deletedAt" | "version"
>;

/**
 * Product variant update DTO
 */
export type UpdateProductVariantDto = Partial<CreateProductVariantDto>;
