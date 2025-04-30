/**
 * Common types for the connector module
 *
 * This file defines the shared types and interfaces used throughout the connector module.
 * These types establish a consistent structure for working with marketplaces and APIs.
 */

/**
 * API credential types
 */
export enum CredentialType {
  API_KEY = 'apiKey',
  OAUTH2 = 'oauth2',
  JWT = 'jwt',
  BASIC_AUTH = 'basicAuth',
  CUSTOM = 'custom',
}

/**
 * Credentials for API connectors
 */
export interface ConnectorCredentials {
  /** Organization ID that owns these credentials */
  organizationId: string;

  /** Type of credentials */
  type: CredentialType;

  /** API Key (for API_KEY auth type) */
  apiKey?: string;

  /** API Secret (for API_KEY auth type) */
  apiSecret?: string;

  /** OAuth access token */
  accessToken?: string;

  /** OAuth refresh token */
  refreshToken?: string;

  /** OAuth token expiry date */
  tokenExpiresAt?: Date;

  /** Username (for BASIC_AUTH) */
  username?: string;

  /** Password (for BASIC_AUTH) */
  password?: string;

  /** API endpoint URL */
  endpoint?: string;

  /** Account or seller ID */
  accountId?: string;

  /** Store name or ID */
  storeIdentifier?: string;

  /** Additional custom properties */
  [key: string]: any;
}

/**
 * Status of connection to API
 */
export interface ConnectionStatus {
  /** Whether the connection is established */
  connected: boolean;

  /** Status message */
  message?: string;

  /** Connection quality (based on latency, success rate, etc.) */
  quality?: ConnectionQuality;

  /** Timestamp of last connection check */
  lastChecked?: Date;

  /** Detailed connection information */
  details?: {
    /** Account information */
    accountInfo?: Record<string, any>;

    /** Rate limit information */
    rateLimits?: {
      remaining: number;
      limit: number;
      reset: Date;
    };

    /** API version information */
    apiVersion?: string;

    /** Error details if connection failed */
    error?: {
      code: string;
      message: string;
      details?: any;
    };

    /** Additional provider-specific details */
    [key: string]: any;
  };
}

/**
 * Connection quality assessment based on latency, packet loss,
 * success rate, and other network metrics
 */
export enum ConnectionQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown',
}

/**
 * Network status information specific to South African conditions
 */
export interface NetworkStatus {
  /** Current connection quality */
  quality: ConnectionQuality;

  /** Type of connection detected */
  connectionType?: 'fiber' | '4g' | '3g' | '2g' | 'unknown';

  /** Provider detection (for SA-specific optimizations) */
  provider?:
    | 'Vodacom'
    | 'MTN'
    | 'CellC'
    | 'Telkom'
    | 'Rain'
    | 'other'
    | 'unknown';

  /** Whether load shedding (power outage) might be affecting service */
  possibleLoadShedding?: boolean;

  /** Average latency in milliseconds */
  averageLatencyMs?: number;

  /** Packet loss percentage (0-100) */
  packetLoss?: number;

  /** Success rate for recent requests (0-100) */
  successRate?: number;

  /** Network cost classification */
  costCategory?: 'low' | 'medium' | 'high' | 'unknown';

  /** Downlink speed estimate in Mbps */
  downlinkSpeed?: number;

  /** Additional metrics and information */
  [key: string]: any;
}

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;

  /** Initial delay between retries in ms */
  initialDelayMs: number;

  /** Maximum delay between retries in ms */
  maxDelayMs: number;

  /** Backoff factor for exponential backoff (typically 2) */
  backoffFactor: number;

  /** Error codes that should trigger a retry */
  retryableStatusCodes: number[];

  /** Custom logic to determine if an error is retryable */
  isRetryable?: (error: any) => boolean;

  /** Network-aware adjustments for South African conditions */
  networkAwareMode?: boolean;

  /** Allow requests to continue during load shedding periods */
  continueOnLoadShedding?: boolean;

  /** Log detailed retry information */
  verboseLogging?: boolean;
}

/**
 * Default configuration optimized for South African network conditions
 */
export const DEFAULT_SA_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  networkAwareMode: true,
  continueOnLoadShedding: true,
  verboseLogging: false,
};

/**
 * Possible error types that can occur in connectors
 */
export enum ConnectorErrorType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rateLimit',
  SERVER_ERROR = 'serverError',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  VALIDATION = 'validation',
  NOT_FOUND = 'notFound',
  UNSUPPORTED = 'unsupported',
  INTERNAL = 'internal',
  LOAD_SHEDDING = 'loadShedding',
  UNKNOWN = 'unknown',
}

/**
 * Enhanced error with connector-specific information
 */
export interface ConnectorError extends Error {
  /** Type of connector error */
  type: ConnectorErrorType;

  /** HTTP status code if available */
  statusCode?: number;

  /** Whether this error is considered retryable */
  retryable: boolean;

  /** Original error object if this wraps another error */
  originalError?: Error | string | null; // Explicit, no unknown

  /** Additional error details (structured, not any) */
  details?: Record<string, unknown>;

  /** Timestamp when the error occurred */
  timestamp: Date;
}

// If more specific error types are needed, use discriminated unions or extend ConnectorError as appropriate.

/**
 * Generic result type for all operations
 */
export interface OperationResult<T> {
  /** Whether the operation succeeded */
  success: boolean;

  /** Result data (if operation succeeded) */
  data?: T;

  /** Error information (if operation failed) */
  error?: {
    /** Error code */
    code: string;

    /** Error message */
    message: string;

    /** Detailed error information */
    details?: any;
  };
}

/**
 * Pagination options for list operations
 */
export interface PaginationOptions {
  /** Page number (0-based) */
  page?: number;

  /** Items per page */
  pageSize?: number;

  /** Sort field */
  sortBy?: string;

  /** Sort direction */
  sortDirection?: 'asc' | 'desc';

  /** Continuation token for cursor-based pagination */
  nextPageToken?: string;

  /** Optional filtering criteria */
  filter?: Record<string, any>;
}

/**
 * Paginated response with data and pagination information
 */
export interface PaginatedResponse<T> {
  /** Response data */
  data: T[];

  /** Pagination metadata */
  pagination: {
    /** Current page (0-based) */
    page: number;

    /** Items per page */
    pageSize: number;

    /** Total items (if available) */
    totalItems?: number;

    /** Total pages (if available) */
    totalPages?: number;

    /** Whether there is a next page */
    hasNextPage: boolean;

    /** Next page token for cursor-based pagination */
    nextPageToken?: string;
  };
}

/**
 * Circuit breaker status for fault tolerance
 */
export enum CircuitStatus {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Failing, rejecting requests
  HALF_OPEN = 'halfOpen', // Testing recovery
}

/**
 * Circuit breaker configuration options
 */
export interface CircuitBreakerConfig {
  /** Threshold of failures to open circuit */
  failureThreshold: number;

  /** Window of time to count failures (ms) */
  failureWindowMs: number;

  /** Time circuit stays open before trying half-open (ms) */
  resetTimeoutMs: number;

  /** Success threshold in half-open state to close circuit */
  halfOpenSuccessThreshold: number;
}

/**
 * Default circuit breaker config for South African network conditions
 */
export const DEFAULT_SA_CIRCUIT_BREAKER: CircuitBreakerConfig = {
  failureThreshold: 5,
  failureWindowMs: 30000,
  resetTimeoutMs: 60000,
  halfOpenSuccessThreshold: 2,
};

/**
 * Marketplace product interface
 * Common fields across different marketplaces
 */
export interface MarketplaceProduct {
  /** Marketplace-specific ID */
  id: string;

  /** SKU of the product */
  sku: string;

  /** Product name */
  name: string;

  /** Product description */
  description?: string;

  /** Price in marketplace's currency */
  price: number;

  /** Compare-at or list price */
  compareAtPrice?: number;

  /** Currency code */
  currency: string;

  /** Available stock */
  stockLevel: number;

  /** Product status */
  status: 'active' | 'inactive' | 'pending' | 'rejected';

  /** Category identifiers */
  categories?: string[];

  /** Image URLs */
  images?: string[];

  /** Product attributes (varies by marketplace) */
  attributes?: Record<string, any>;

  /** Product variants (if applicable) */
  variants?: Omit<MarketplaceProduct, 'variants'>[];

  /** URL to product on marketplace */
  marketplaceUrl?: string;

  /** Creation date */
  createdAt: Date;

  /** Last update date */
  updatedAt: Date;

  /** Additional marketplace-specific fields */
  [key: string]: any;
}

/**
 * Marketplace order interface
 * Common fields across different marketplaces
 */
export interface MarketplaceOrder {
  /** Internal ID */
  id: string;

  /** Marketplace-specific order ID */
  marketplaceOrderId: string;

  /** Order number (if different from IDs) */
  orderNumber?: string;

  /** Customer identifier */
  customerId?: string;

  /** Customer name */
  customerName?: string;

  /** Customer email */
  customerEmail?: string;

  /** Order status */
  status: string;

  /** Payment status */
  financialStatus?: string;

  /** Shipping status */
  fulfillmentStatus?: string;

  /** Order creation date */
  createdAt: Date;

  /** Last update date */
  updatedAt: Date;

  /** Currency code */
  currency: string;

  /** Total price including taxes and shipping */
  totalPrice: number;

  /** Subtotal (before tax/shipping) */
  subtotalPrice: number;

  /** Total tax amount */
  totalTax?: number;

  /** Total shipping cost */
  totalShipping?: number;

  /** Total discount amount */
  totalDiscount?: number;

  /** Order items */
  items: MarketplaceOrderItem[];

  /** Shipping address */
  shippingAddress?: Address;

  /** Billing address */
  billingAddress?: Address;

  /** Additional marketplace-specific fields */
  [key: string]: any;
}

/**
 * Order item in a marketplace order
 */
export interface MarketplaceOrderItem {
  /** Item ID */
  id: string;

  /** Product SKU */
  sku: string;

  /** Product name */
  name: string;

  /** Quantity ordered */
  quantity: number;

  /** Unit price */
  price: number;

  /** Total price (price * quantity) */
  totalPrice: number;

  /** Tax amount */
  tax?: number;

  /** Image URL */
  image?: string;

  /** Variant ID if applicable */
  variantId?: string;

  /** Custom properties */
  properties?: Record<string, any>;

  /** Additional marketplace-specific fields */
  [key: string]: any;
}

/**
 * Address for shipping or billing
 */
export interface Address {
  /** Full name */
  name?: string;

  /** First name */
  firstName?: string;

  /** Last name */
  lastName?: string;

  /** Company name */
  company?: string;

  /** Address line 1 */
  address1: string;

  /** Address line 2 */
  address2?: string;

  /** City */
  city: string;

  /** State/Province */
  province?: string;

  /** Postal code */
  zip: string;

  /** Country */
  country: string;

  /** Phone number */
  phone?: string;

  /** Email address */
  email?: string;

  /** Additional address fields */
  [key: string]: any;
}

/**
 * Response when acknowledging order receipt
 */
export interface OrderAcknowledgment {
  /** Order ID */
  orderId: string;

  /** Whether acknowledgment succeeded */
  success: boolean;

  /** Reference ID from marketplace */
  marketplaceReference?: string;

  /** Timestamp of acknowledgment */
  timestamp: Date;

  /** Acknowledgment message */
  message?: string;
}

/**
 * Marketplace category interface
 * Common fields across different marketplaces
 */
export interface MarketplaceCategory {
  /** Category ID */
  id: string;

  /** Category name */
  name: string;

  /** Category path or breadcrumb */
  path?: string[];

  /** Parent category ID */
  parentId?: string;

  /** Category level in hierarchy (0 = root) */
  level: number;

  /** Whether category is active */
  isActive: boolean;

  /** Category image URL */
  imageUrl?: string;

  /** Category attributes or requirements */
  attributes?: {
    name: string;
    type: string;
    required: boolean;
    options?: string[];
  }[];

  /** Additional marketplace-specific fields */
  [key: string]: any;
}
