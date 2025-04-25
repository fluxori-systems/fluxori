/**
 * Base Connector Interface
 *
 * Interface for all connector implementations
 */

import {
  ConnectorCredentials,
  ConnectionStatus,
  NetworkStatus,
  OperationResult,
  PaginatedResponse,
} from './types';

export interface IConnector {
  readonly connectorId: string;
  readonly connectorName: string;

  isInitialized: boolean;
  connectionStatus: ConnectionStatus;
  networkStatus: NetworkStatus;

  initialize(credentials: ConnectorCredentials): Promise<void>;
  testConnection(): Promise<ConnectionStatus>;

  // Other common connector methods
  getHealthStatus(): Promise<ConnectionStatus>;
  getRateLimitStatus(): Promise<{
    remaining: number;
    reset: Date;
    limit: number;
  }>;
  close(): Promise<void>;
  checkNetworkStatus(): Promise<NetworkStatus>;
  refreshConnection(): Promise<ConnectionStatus>;
}

/**
 * Error handling connector interface
 */
export interface IErrorHandlingConnector {
  clearErrorHistory(): void;
}

/**
 * Marketplace connector interface
 */
export interface IMarketplaceConnector<TProduct, TOrder, TAcknowledgment>
  extends IConnector {
  // Products
  getProducts(options?: any): Promise<PaginatedResponse<TProduct>>;
  getProductById(productId: string): Promise<OperationResult<TProduct>>;
  getProductBySku?(sku: string): Promise<OperationResult<TProduct>>;

  // Orders
  getOrders(options?: any): Promise<PaginatedResponse<TOrder>>;
  getOrderById(orderId: string): Promise<OperationResult<TOrder>>;
  getRecentOrders?(
    sinceDate: Date,
    options?: any,
  ): Promise<PaginatedResponse<TOrder>>;
  acknowledgeOrder(orderId: string): Promise<OperationResult<TAcknowledgment>>;

  // Stock and pricing
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
