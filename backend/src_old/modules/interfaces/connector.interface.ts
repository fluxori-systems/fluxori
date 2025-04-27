/**
 * Base Connector Interface
 *
 * Interface for all connector implementations that provides a consistent
 * way to interact with external APIs, with special support for South African
 * network conditions like load shedding and mobile network optimizations.
 */

import {
  ConnectorCredentials,
  ConnectionStatus,
  NetworkStatus,
  OperationResult,
  PaginationOptions,
  PaginatedResponse,
} from "./connector.types";

/**
 * Base connector interface that all API connectors must implement
 */
export interface IConnector {
  /** Unique identifier for this connector type */
  readonly connectorId: string;

  /** Human-readable name for this connector */
  readonly connectorName: string;

  /** Whether the connector has been initialized */
  isInitialized: boolean;

  /** Current connection status */
  connectionStatus: ConnectionStatus;

  /** Current network status with SA-specific information */
  networkStatus: NetworkStatus;

  /**
   * Initialize the connector with credentials
   * @param credentials API credentials
   */
  initialize(credentials: ConnectorCredentials): Promise<void>;

  /**
   * Test connection to the API
   */
  testConnection(): Promise<ConnectionStatus>;

  /**
   * Get detailed health status information
   */
  getHealthStatus(): Promise<ConnectionStatus>;

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): Promise<{
    remaining: number;
    reset: Date;
    limit: number;
  }>;

  /**
   * Close the connection and clean up resources
   */
  close(): Promise<void>;

  /**
   * Check current network status with SA-specific information
   */
  checkNetworkStatus(): Promise<NetworkStatus>;

  /**
   * Refresh connection (renew tokens, etc.)
   */
  refreshConnection(): Promise<ConnectionStatus>;
}

/**
 * Interface for connectors with error handling capabilities
 */
export interface IErrorHandlingConnector {
  /**
   * Clear error history
   */
  clearErrorHistory(): void;
}

/**
 * Generic marketplace connector interface for e-commerce platforms
 */
export interface IMarketplaceConnector<TProduct, TOrder, TAcknowledgment>
  extends IConnector {
  /**
   * Get products with pagination
   * @param options Pagination options
   */
  getProducts(
    options?: PaginationOptions,
  ): Promise<PaginatedResponse<TProduct>>;

  /**
   * Get a product by ID
   * @param productId Product ID
   */
  getProductById(productId: string): Promise<OperationResult<TProduct>>;

  /**
   * Get a product by SKU (optional)
   * @param sku Product SKU
   */
  getProductBySku?(sku: string): Promise<OperationResult<TProduct>>;

  /**
   * Get orders with pagination
   * @param options Pagination options
   */
  getOrders(options?: PaginationOptions): Promise<PaginatedResponse<TOrder>>;

  /**
   * Get an order by ID
   * @param orderId Order ID
   */
  getOrderById(orderId: string): Promise<OperationResult<TOrder>>;

  /**
   * Get recent orders since a date (optional)
   * @param sinceDate Date to fetch orders from
   * @param options Pagination options
   */
  getRecentOrders?(
    sinceDate: Date,
    options?: PaginationOptions,
  ): Promise<PaginatedResponse<TOrder>>;

  /**
   * Acknowledge receipt of an order
   * @param orderId Order ID
   */
  acknowledgeOrder(orderId: string): Promise<OperationResult<TAcknowledgment>>;

  /**
   * Update stock levels for products
   * @param updates Stock updates
   */
  updateStock(
    updates: Array<{
      sku: string;
      stockLevel: number;
      locationId?: string;
    }>,
  ): Promise<
    OperationResult<{
      successful: string[];
      failed: Array<{ sku: string; reason: string }>;
    }>
  >;

  /**
   * Update prices for products
   * @param updates Price updates
   */
  updatePrices(
    updates: Array<{
      sku: string;
      price: number;
      compareAtPrice?: number;
      currency?: string;
    }>,
  ): Promise<
    OperationResult<{
      successful: string[];
      failed: Array<{ sku: string; reason: string }>;
    }>
  >;
}
