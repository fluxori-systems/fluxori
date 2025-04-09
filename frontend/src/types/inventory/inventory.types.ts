/**
 * Inventory entity interfaces
 */
import { TenantEntity, UserAttributedEntity } from '../core/entity.types';

/**
 * Warehouse type enum
 */
export enum WarehouseType {
  OWNED = 'owned',
  THIRD_PARTY = 'third_party',
  FULFILLMENT_CENTER = 'fulfillment_center',
  STORE = 'store',
  DROPSHIP = 'dropship',
}

/**
 * Stock status enum
 */
export enum StockStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  OVERSTOCK = 'overstock',
}

/**
 * Stock movement type enum
 */
export enum StockMovementType {
  STOCK_RECEIPT = 'stock_receipt',
  SALE = 'sale',
  RETURN = 'return',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
  STOCK_TAKE = 'stock_take',
}

/**
 * Stock movement reason enum
 */
export enum StockMovementReason {
  PURCHASE_ORDER = 'purchase_order',
  CUSTOMER_ORDER = 'customer_order',
  CUSTOMER_RETURN = 'customer_return',
  DAMAGED = 'damaged',
  LOST = 'lost',
  FOUND = 'found',
  INTERNAL_TRANSFER = 'internal_transfer',
  INVENTORY_COUNT = 'inventory_count',
  VENDOR_RETURN = 'vendor_return',
  WRITE_OFF = 'write_off',
  CORRECTION = 'correction',
  OTHER = 'other',
}

/**
 * Warehouse location interface
 */
export interface WarehouseLocation {
  id: string;
  name: string;
  code: string;
  warehouseId: string;
  zone?: string;
  aisle?: string;
  bay?: string;
  shelf?: string;
  bin?: string;
  position?: string;
  description?: string;
  isPickLocation: boolean;
  isReceivingLocation: boolean;
  isShippingLocation: boolean;
  isActive: boolean;
  capacity?: number;
  capacityUnit?: string;
  currentUtilization?: number;
  metadata?: Record<string, any>;
}

/**
 * Warehouse interface
 */
export interface Warehouse extends TenantEntity {
  name: string;
  code: string;
  type: WarehouseType;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  
  // Contact information
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  
  // Address
  address: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  
  // Geolocation
  geoLocation?: {
    latitude: number;
    longitude: number;
  };
  
  // Operational details
  operatingHours?: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
  
  // Capacity
  totalCapacity?: number;
  capacityUnit?: string;
  currentUtilization?: number;
  
  // Integration details
  externalId?: string;
  externalSystem?: string;
  
  // Metadata
  notes?: string;
  metadata?: Record<string, any>;
}

/**
 * Stock level interface
 */
export interface StockLevel extends TenantEntity {
  productId: string;
  productSku: string;
  warehouseId: string;
  warehouseName: string;
  locationId?: string;
  locationName?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  onOrderQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastStockUpdateDate: Date | string;
  lastCountDate?: Date | string;
  lastReceivedDate?: Date | string;
  costValue: number;
  retailValue: number;
  currency: string;
  status: StockStatus;
  batchNumber?: string;
  expiryDate?: Date | string;
  serialNumbers?: string[];
  notes?: string;
  metadata?: Record<string, any>;
}

/**
 * Stock movement interface
 */
export interface StockMovement extends UserAttributedEntity {
  productId: string;
  productSku: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  fromLocationId?: string;
  fromLocationName?: string;
  toLocationId?: string;
  toLocationName?: string;
  quantity: number;
  type: StockMovementType;
  reason: StockMovementReason;
  referenceNumber?: string;
  referenceType?: string;
  date: Date | string;
  costValue?: number;
  retailValue?: number;
  currency: string;
  notes?: string;
  batchNumber?: string;
  expiryDate?: Date | string;
  serialNumbers?: string[];
  metadata?: Record<string, any>;
}

/**
 * Inventory count interface
 */
export interface InventoryCount extends UserAttributedEntity {
  name: string;
  description?: string;
  warehouseId: string;
  warehouseName: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  startDate: Date | string;
  endDate?: Date | string;
  completedById?: string;
  completedByName?: string;
  completedDate?: Date | string;
  totalItems: number;
  countedItems: number;
  discrepancies: number;
  notes?: string;
  metadata?: Record<string, any>;
}

/**
 * Inventory count line interface
 */
export interface InventoryCountLine extends TenantEntity {
  inventoryCountId: string;
  productId: string;
  productSku: string;
  productName: string;
  expectedQuantity: number;
  actualQuantity: number;
  discrepancy: number;
  notes?: string;
  status: 'pending' | 'counted' | 'verified' | 'adjusted';
  locationId?: string;
  locationName?: string;
  countedById?: string;
  countedByName?: string;
  countedDate?: Date | string;
}

/**
 * Create warehouse DTO
 */
export interface CreateWarehouseDto {
  name: string;
  code: string;
  type: WarehouseType;
  description?: string;
  isDefault?: boolean;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  geoLocation?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Create stock movement DTO
 */
export interface CreateStockMovementDto {
  productId: string;
  warehouseId: string;
  fromLocationId?: string;
  toLocationId?: string;
  quantity: number;
  type: StockMovementType;
  reason: StockMovementReason;
  referenceNumber?: string;
  referenceType?: string;
  date?: Date | string;
  notes?: string;
  batchNumber?: string;
  expiryDate?: Date | string;
  serialNumbers?: string[];
}