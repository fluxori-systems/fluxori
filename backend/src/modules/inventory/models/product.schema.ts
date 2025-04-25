/**
 * Product Schema
 */
import { FirestoreEntity } from '../../../types/google-cloud.types';
import {
  ProductStatus,
  ProductVariant,
  ProductPricing,
  ProductSupplier,
  StockLevelThreshold,
} from '../interfaces/types';

/**
 * Product entity for Firestore
 */
export interface Product extends FirestoreEntity {
  organizationId: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  brandId?: string;
  brandName?: string;
  categoryIds?: string[];
  categoryNames?: string[];
  status: ProductStatus;

  // Media
  mainImageUrl?: string;
  additionalImageUrls?: string[];

  // Pricing
  pricing: ProductPricing;

  // Variants
  hasVariants: boolean;
  variants?: ProductVariant[];

  // Inventory
  stockLevelThreshold?: StockLevelThreshold;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  defaultWarehouseId?: string;

  // Supply chain
  suppliers?: ProductSupplier[];
  leadTimeInDays?: number;
  reorderPoint?: number;
  reorderQuantity?: number;

  // Attributes and metadata
  attributes?: Record<string, string | number | boolean>;
  tags?: string[];
  metadata?: Record<string, any>;

  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];

  // External IDs
  externalIds?: Record<string, string>;
}
