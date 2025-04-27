/**
 * Types for the Inventory module
 */
import { FirestoreEntity } from "../../../types/google-cloud.types";

/**
 * Product status enum
 */
export enum ProductStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DRAFT = "draft",
  ARCHIVED = "archived",
  OUT_OF_STOCK = "out_of_stock",
  DISCONTINUED = "discontinued",
}

/**
 * Stock level threshold type
 */
export interface StockLevelThreshold {
  low: number;
  critical: number;
  safetyStock: number;
  targetStock: number;
  maxStock: number;
}

/**
 * Product variant type
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
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
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
 * Product pricing type
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
  priceUpdateDate?: Date;
}

/**
 * Product supplier type
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
  lastPurchaseDate?: Date;
  lastPurchasePrice?: number;
}

/**
 * Stock movement type enum
 */
export enum StockMovementType {
  STOCK_RECEIPT = "stock_receipt",
  SALE = "sale",
  RETURN = "return",
  ADJUSTMENT = "adjustment",
  TRANSFER = "transfer",
  STOCK_TAKE = "stock_take",
}

/**
 * Stock movement reason enum
 */
export enum StockMovementReason {
  PURCHASE_ORDER = "purchase_order",
  CUSTOMER_ORDER = "customer_order",
  CUSTOMER_RETURN = "customer_return",
  DAMAGED = "damaged",
  LOST = "lost",
  FOUND = "found",
  INTERNAL_TRANSFER = "internal_transfer",
  INVENTORY_COUNT = "inventory_count",
  VENDOR_RETURN = "vendor_return",
  WRITE_OFF = "write_off",
  CORRECTION = "correction",
  OTHER = "other",
  SYSTEM_UPDATE = "system_update",
}

/**
 * Warehouse type enum
 */
export enum WarehouseType {
  OWNED = "owned",
  THIRD_PARTY = "third_party",
  FULFILLMENT_CENTER = "fulfillment_center",
  STORE = "store",
  DROPSHIP = "dropship",
}

/**
 * Warehouse location schema
 */
export interface WarehouseLocation {
  zone?: string;
  aisle?: string;
  bay?: string;
  shelf?: string;
  bin?: string;
  position?: string;
  description?: string;
  isPickLocation?: boolean;
  isReceivingLocation?: boolean;
  isShippingLocation?: boolean;
}
