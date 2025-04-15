/**
 * Product entity interfaces
 */
import { TenantEntity } from '../core/entity.types';

/**
 * Product status enum
 */
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
}

/**
 * Product type enum
 */
export enum ProductType {
  PHYSICAL = 'physical',
  DIGITAL = 'digital',
  SERVICE = 'service',
  BUNDLE = 'bundle',
  SUBSCRIPTION = 'subscription',
}

/**
 * Product pricing interface
 */
export interface ProductPricing {
  basePrice: number;
  salePrice?: number;
  msrp?: number;
  costPrice?: number;
  wholesalePrice?: number;
  currency: string;
  taxRate?: number;
  taxCode?: string;
  margin?: number;
  markup?: number;
  priceUpdateDate?: Date | string;
}

/**
 * Product dimensions interface
 */
export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  weight: number;
  unit: string;
  weightUnit: string;
}

/**
 * Product variant interface
 */
export interface ProductVariant {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  attributes: Record<string, string | number>;
  price: number;
  cost?: number;
  weight?: number;
  weightUnit?: string;
  dimensions?: ProductDimensions;
  imageUrl?: string;
  stockLevel?: {
    available: number;
    reserved: number;
    onOrder: number;
  };
  isDefault: boolean;
  status: ProductStatus;
}

/**
 * Product supplier interface
 */
export interface ProductSupplier {
  id: string;
  name: string;
  sku: string;
  cost: number;
  currency: string;
  leadTimeInDays?: number;
  minimumOrderQuantity?: number;
  isDefault: boolean;
  lastPurchaseDate?: Date | string;
  lastPurchasePrice?: number;
}

/**
 * Stock level threshold interface
 */
export interface StockLevelThreshold {
  low: number;
  critical: number;
  safetyStock: number;
  targetStock: number;
  maxStock: number;
}

/**
 * Product entity interface
 */
export interface Product extends TenantEntity {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  type: ProductType;
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
  
  // Physical attributes
  dimensions?: ProductDimensions;
  
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

/**
 * Product category interface
 */
export interface ProductCategory extends TenantEntity {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  level: number;
  isActive: boolean;
  path: string[];
  productCount?: number;
  attributes?: {
    name: string;
    type: string;
    required: boolean;
    options?: string[];
  }[];
  metadata?: Record<string, any>;
}

/**
 * Product brand interface
 */
export interface ProductBrand extends TenantEntity {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  isActive: boolean;
  productCount?: number;
  metadata?: Record<string, any>;
}

/**
 * Create product DTO
 */
export interface CreateProductDto {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  type: ProductType;
  brandId?: string;
  categoryIds?: string[];
  status: ProductStatus;
  pricing: ProductPricing;
  dimensions?: ProductDimensions;
  hasVariants: boolean;
  variants?: Omit<ProductVariant, 'id'>[];
  stockLevelThreshold?: StockLevelThreshold;
  stockQuantity?: number;
  defaultWarehouseId?: string;
  attributes?: Record<string, string | number | boolean>;
  tags?: string[];
}

/**
 * Update product DTO
 */
export interface UpdateProductDto {
  sku?: string;
  barcode?: string;
  name?: string;
  description?: string;
  type?: ProductType;
  status?: ProductStatus;
  brandId?: string;
  categoryIds?: string[];
  pricing?: Partial<ProductPricing>;
  dimensions?: Partial<ProductDimensions>;
  hasVariants?: boolean;
  stockLevelThreshold?: Partial<StockLevelThreshold>;
  stockQuantity?: number;
  defaultWarehouseId?: string;
  attributes?: Record<string, string | number | boolean>;
  tags?: string[];
  mainImageUrl?: string;
}