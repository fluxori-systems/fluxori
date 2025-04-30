/**
 * PIM Module Types
 *
 * Core types for the Product Information Management module
 * that are shared across different components.
 */

/**
 * Market context for region-specific functionality
 */
export interface MarketContext {
  /**
   * The geographic region (e.g., 'south-africa', 'africa', 'europe')
   */
  region: string;

  /**
   * ISO country code
   */
  country: string;

  /**
   * VAT rate in decimal form (e.g., 0.15 for 15%)
   */
  vatRate: number;

  /**
   * Market-specific feature flags
   */
  features: {
    /**
     * Whether load shedding resilience is enabled
     */
    loadSheddingResilience: boolean;

    /**
     * Whether network-aware components are enabled
     */
    networkAwareComponents: boolean;

    /**
     * Whether multi-warehouse support is enabled
     */
    multiWarehouseSupport?: boolean;

    /**
     * Whether European VAT compliance is enabled
     */
    euVatCompliance?: boolean;

    /**
     * Whether to enable marketplace integrations
     */
    marketplaceIntegration?: boolean;
  };

  /**
   * Default currency code for this market
   */
  defaultCurrency: string;

  /**
   * Market-specific configuration
   */
  config?: Record<string, any>;
}

/**
 * Product status enum
 */
export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

/**
 * Product type enum
 */
export enum ProductType {
  SIMPLE = 'simple',
  VARIANT = 'variant',
  BUNDLE = 'bundle',
  VIRTUAL = 'virtual',
}

/**
 * Product image size enum
 */
export enum ImageSize {
  THUMBNAIL = 'thumbnail',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ORIGINAL = 'original',
}

/**
 * Price information
 */
export interface PriceInfo {
  /**
   * Shipping cost for the product (if applicable)
   */
  shipping?: number;
  /**
   * Base price amount (without tax)
   */
  basePrice: number;

  /**
   * Whether this price includes VAT
   */
  vatIncluded: boolean;

  /**
   * Currency code (e.g., 'ZAR', 'USD', 'EUR')
   */
  currency: string;

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

  /**
   * Cost price (for internal calculations)
   */
  costPrice?: number;

  /**
   * Recommended retail price (MSRP)
   */
  rrp?: number;

  /**
   * Region-specific prices
   */
  regionalPrices?: {
    [region: string]: {
      basePrice: number;
      currency: string;
      vatIncluded: boolean;
    };
  };
}

/**
 * Product attribute (field) definition
 */
import { FirestoreEntityWithMetadata } from '../../../common/repositories/base/repository-types';

export interface ProductAttribute extends FirestoreEntityWithMetadata {
  /** Unique identifier */
  id: string;
  /** Soft delete flag */
  isDeleted: boolean;
  /** Version for optimistic locking */
  version: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Deletion timestamp (optional) */
  deletedAt?: Date | undefined;
  /**
   * Attribute code/name
   */
  code: string;

  /**
   * Display label
   */
  label: string;

  /**
   * Attribute type (text, number, boolean, date, etc.)
   */
  type: string;

  /**
   * Attribute value
   */
  /**
   * Attribute value - strictly typed union for common types
   */
  value: string | number | boolean | Date | string[] | number[] | boolean[] | null;
  // TODO: If more complex types are needed, extend this union or use generics.

  /**
   * Whether this attribute is required
   */
  required?: boolean;

  /**
   * Whether this attribute is visible on the frontend
   */
  visible?: boolean;

  /**
   * Whether this attribute can be used for filtering
   */
  filterable?: boolean;

  /**
   * Whether this attribute is used for variants
   */
  usedForVariants?: boolean;

  /**
   * Validation rules
   */
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    options?: string[];
  };

  /**
   * Unit of measurement (if applicable)
   */
  unit?: string;

  /**
   * Region-specific attribute settings
   */
  regional?: {
    [region: string]: {
      label?: string;
      visible?: boolean;
      required?: boolean;
    };
  };
}

/**
 * Product marketplace mapping
 */
export interface MarketplaceMapping {
  /**
   * ID of the marketplace
   */
  marketplaceId: string;

  /**
   * Marketplace-specific product ID
   */
  externalId?: string;

  /**
   * Marketplace-specific SKU
   */
  externalSku?: string;

  /**
   * Mapping status
   */
  status: 'active' | 'inactive' | 'pending' | 'error';

  /**
   * Last sync timestamp
   */
  lastSynced?: Date;

  /**
   * Last sync error message
   */
  lastSyncError?: string;

  /**
   * Field mapping for marketplace-specific fields
   */
  fieldMapping?: Record<string, string>;

  /**
   * Marketplace-specific configuration
   */
  /**
   * Marketplace-specific configuration. Use 'unknown' for safe extensibility, validate at runtime.
   */
  marketplaceConfig?: Record<string, unknown>;
}

/**
 * Network quality information
 * Used for determining optimal data delivery strategy for South African networks
 */
export interface NetworkQualityInfo {
  /**
   * Type of connection (e.g., wifi, cellular, ethernet)
   */
  connectionType?: string;

  /**
   * Connection quality (high, medium, low)
   */
  connectionQuality?: 'high' | 'medium' | 'low';

  /**
   * Quality alias for connectionQuality (for backward compatibility)
   */
  quality?: 'high' | 'medium' | 'low';

  /**
   * Effective connection type (4g, 3g, 2g, slow-2g)
   */
  effectiveType?: string;

  /**
   * Downlink in Mbps
   */
  downlink?: number;

  /**
   * Round trip time in ms
   */
  rtt?: number;

  /**
   * Whether data saver is enabled
   */
  saveData?: boolean;

  /**
   * Estimated bandwidth in Kbps
   */
  estimatedBandwidth?: number;

  /**
   * Latency in milliseconds
   */
  latency?: number;

  /**
   * Load shedding stage (South Africa specific)
   */
  loadSheddingStage?: number;
}

/**
 * Load shedding status information (South Africa specific)
 */
export interface LoadSheddingInfo {
  /**
   * Current load shedding stage (0-8)
   */
  stage: number;

  /**
   * Alias for stage property for backward compatibility
   */
  currentStage?: number;

  /**
   * Whether load shedding is currently active
   */
  active: boolean;

  /**
   * Next scheduled start time for load shedding
   */
  nextStartTime?: Date;

  /**
   * Next scheduled end time for load shedding
   */
  nextEndTime?: Date;

  /**
   * Area code for load shedding schedule
   */
  areaCode?: string;

  /**
   * Area name
   */
  areaName?: string;
}

/**
 * Regional compliance information
 */
export interface ComplianceInfo {
  /**
   * South African compliance
   */
  southAfrica?: {
    /**
     * ICASA approval (for electronics)
     */
    icasa?: boolean;

    /**
     * SABS approval
     */
    sabs?: boolean;

    /**
     * NRCS approval
     */
    nrcs?: boolean;

    /**
     * Import permit required/available
     */
    importPermit?: boolean;
  };

  /**
   * European compliance
   */
  europe?: {
    /**
     * CE marking
     */
    ceMark?: boolean;

    /**
     * GDPR compliant
     */
    gdprCompliant?: boolean;

    /**
     * WEEE compliance
     */
    weeeCompliant?: boolean;
  };
}

/**
 * Warehouse details
 */
export interface WarehouseInfo {
  /**
   * Warehouse ID
   */
  warehouseId: string;

  /**
   * Warehouse name
   */
  name: string;

  /**
   * Region
   */
  region: string;

  /**
   * Country
   */
  country: string;

  /**
   * City
   */
  city: string;
}

/**
 * Stock information
 */
export interface StockInfo {
  /**
   * Quantity in stock
   */
  quantity: number;

  /**
   * Warehouse information, if applicable
   */
  warehouse?: WarehouseInfo;

  /**
   * Whether item is in stock
   */
  inStock: boolean;

  /**
   * Date of last stock update
   */
  lastUpdated: Date;
}

/**
 * Category reference in a product
 */
export interface CategoryReference {
  /**
   * Category ID
   */
  id: string;

  /**
   * Category name
   */
  name: string;

  /**
   * Whether this is the primary category
   */
  isPrimary: boolean;

  /**
   * Position in category
   */
  position?: number;
}

/**
 * Operation result for PIM operations
 */
export interface OperationResult<T = any> {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * Result data (if successful)
   */
  data?: T;

  /**
   * Error message (if failed)
   */
  error?: string;

  /**
   * Error code (if failed)
   */
  errorCode?: string;

  /**
   * Additional metadata about the operation
   */
  metadata?: Record<string, any>;
}
