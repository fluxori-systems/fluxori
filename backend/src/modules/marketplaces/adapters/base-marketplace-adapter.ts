import { Logger } from '@nestjs/common';

import {
  IMarketplaceAdapter,
  MarketplaceCredentials,
  ConnectionStatus,
  MarketplaceProduct,
  StockUpdatePayload,
  PriceUpdatePayload,
  StatusUpdatePayload,
  MarketplaceOrder,
  OrderAcknowledgment,
  MarketplaceCategory,
  PaginatedResponse,
  OperationResult,
  ProductFilterOptions,
  OrderFilterOptions,
} from '../interfaces';

/**
 * Abstract base class for marketplace adapters implementing common functionality
 * and providing default implementations where possible.
 */
export abstract class BaseMarketplaceAdapter implements IMarketplaceAdapter {
  protected logger: Logger;
  protected credentials: MarketplaceCredentials;
  protected isInitialized = false;

  /**
   * The unique identifier for the marketplace
   */
  abstract readonly marketplaceId: string;

  /**
   * Human-readable name of the marketplace
   */
  abstract readonly marketplaceName: string;

  constructor(loggerName: string) {
    this.logger = new Logger(loggerName);
  }

  /**
   * Initialize the adapter with marketplace credentials
   * @param credentials - Credentials required for authentication with the marketplace
   */
  async initialize(credentials: MarketplaceCredentials): Promise<void> {
    this.logger.log(`Initializing ${this.marketplaceName} adapter`);

    if (!credentials) {
      throw new Error(`${this.marketplaceName} credentials are required`);
    }

    if (!credentials.organizationId) {
      throw new Error(
        `Organization ID is required for ${this.marketplaceName} adapter`,
      );
    }

    this.credentials = credentials;

    try {
      await this.initializeInternal(credentials);
      this.isInitialized = true;
      this.logger.log(
        `${this.marketplaceName} adapter initialized successfully`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize ${this.marketplaceName} adapter: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Failed to initialize ${this.marketplaceName} adapter: ${error.message}`,
      );
    }
  }

  /**
   * Internal initialization method to be implemented by each adapter
   * @param credentials - Marketplace credentials
   */
  protected abstract initializeInternal(
    credentials: MarketplaceCredentials,
  ): Promise<void>;

  /**
   * Test the connection to the marketplace API
   * @returns Connection status object with information about the connection
   */
  async testConnection(): Promise<ConnectionStatus> {
    this.checkInitialized();

    try {
      return await this.testConnectionInternal();
    } catch (error) {
      this.logger.error(
        `Connection test to ${this.marketplaceName} failed: ${error.message}`,
        error.stack,
      );

      return {
        connected: false,
        message: `Connection test failed: ${error.message}`,
      };
    }
  }

  /**
   * Internal connection test implementation for each marketplace
   */
  protected abstract testConnectionInternal(): Promise<ConnectionStatus>;

  /**
   * Get the current API rate limit status
   * @returns Rate limit information
   */
  abstract getRateLimitStatus(): Promise<{
    remaining: number;
    reset: Date;
    limit: number;
  }>;

  /**
   * Fetch a product by its SKU
   * @param sku - The SKU of the product
   * @returns Operation result containing the product if found
   */
  abstract getProductBySku(
    sku: string,
  ): Promise<OperationResult<MarketplaceProduct>>;

  /**
   * Fetch a product by marketplace-specific ID
   * @param id - The marketplace-specific ID of the product
   * @returns Operation result containing the product if found
   */
  abstract getProductById(
    id: string,
  ): Promise<OperationResult<MarketplaceProduct>>;

  /**
   * Fetch multiple products by their SKUs
   * @param skus - Array of SKUs to fetch
   * @returns Operation result containing an array of found products
   */
  abstract getProductsBySkus(
    skus: string[],
  ): Promise<OperationResult<MarketplaceProduct[]>>;

  /**
   * Fetch products with pagination and filtering
   * @param page - Page number (0-based)
   * @param pageSize - Number of items per page
   * @param filters - Optional filter options to apply
   * @returns Paginated response of products with token-based pagination support
   */
  abstract getProducts(
    page: number,
    pageSize: number,
    filters?: ProductFilterOptions,
  ): Promise<PaginatedResponse<MarketplaceProduct>>;

  /**
   * Update stock levels for one or more products
   * @param updates - Array of stock update payloads
   * @returns Operation result with success status and details
   */
  abstract updateStock(updates: StockUpdatePayload[]): Promise<
    OperationResult<{
      successful: string[];
      failed: Array<{ sku: string; reason: string }>;
    }>
  >;

  /**
   * Update prices for one or more products
   * @param updates - Array of price update payloads
   * @returns Operation result with success status and details
   */
  abstract updatePrices(updates: PriceUpdatePayload[]): Promise<
    OperationResult<{
      successful: string[];
      failed: Array<{ sku: string; reason: string }>;
    }>
  >;

  /**
   * Update status (active/inactive) for one or more products
   * @param updates - Array of status update payloads
   * @returns Operation result with success status and details
   */
  abstract updateStatus(updates: StatusUpdatePayload[]): Promise<
    OperationResult<{
      successful: string[];
      failed: Array<{ sku: string; reason: string }>;
    }>
  >;

  /**
   * Fetch orders with filtering and pagination
   * @param page - Page number (0-based)
   * @param pageSize - Number of items per page
   * @param filters - Optional filter options to apply
   * @returns Paginated response of orders with token-based pagination support
   */
  abstract getOrders(
    page: number,
    pageSize: number,
    filters?: OrderFilterOptions,
  ): Promise<PaginatedResponse<MarketplaceOrder>>;

  /**
   * Fetch recent orders (legacy method, uses getOrders internally by default)
   * @param sinceDate - Fetch orders created after this date
   * @param page - Page number (0-based)
   * @param pageSize - Number of items per page
   * @returns Paginated response of orders
   */
  async getRecentOrders(
    sinceDate: Date,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResponse<MarketplaceOrder>> {
    this.checkInitialized();

    return this.getOrders(page, pageSize, {
      createdFrom: sinceDate,
    });
  }

  /**
   * Fetch an order by its marketplace-specific ID
   * @param id - The marketplace-specific order ID
   * @returns Operation result containing the order if found
   */
  abstract getOrderById(id: string): Promise<OperationResult<MarketplaceOrder>>;

  /**
   * Acknowledge receipt of an order
   * @param orderId - The marketplace-specific order ID
   * @returns Operation result with acknowledgment details
   */
  abstract acknowledgeOrder(
    orderId: string,
  ): Promise<OperationResult<OrderAcknowledgment>>;

  /**
   * Update order status
   * @param orderId - The marketplace-specific order ID
   * @param status - The new status
   * @param trackingInfo - Optional tracking information for shipping updates
   * @returns Operation result with success status
   */
  abstract updateOrderStatus(
    orderId: string,
    status: string,
    trackingInfo?: {
      carrier: string;
      trackingNumber: string;
      shippedDate?: Date;
    },
  ): Promise<OperationResult<{ orderId: string }>>;

  /**
   * Get marketplace-specific categories
   * @param parentId - Optional parent category ID for hierarchical retrieval
   * @returns Operation result containing array of categories
   */
  abstract getCategories(
    parentId?: string,
  ): Promise<OperationResult<MarketplaceCategory[]>>;

  /**
   * Get marketplace-specific attributes for a category
   * @param categoryId - The category ID
   * @returns Operation result containing category attributes
   */
  abstract getCategoryAttributes(categoryId: string): Promise<
    OperationResult<
      Array<{
        id: string;
        name: string;
        required: boolean;
        type: string;
        values?: string[];
      }>
    >
  >;

  /**
   * Get marketplace health status
   * @returns Connection status with marketplace service health information
   */
  async getMarketplaceHealth(): Promise<ConnectionStatus> {
    try {
      this.checkInitialized();
      const rateLimits = await this.getRateLimitStatus();

      return {
        connected: true,
        message: `${this.marketplaceName} services operational`,
        details: {
          rateLimits,
        },
      };
    } catch (error) {
      this.logger.error(
        `${this.marketplaceName} health check failed: ${error.message}`,
        error.stack,
      );

      return {
        connected: false,
        message: `${this.marketplaceName} services unavailable: ${error.message}`,
      };
    }
  }

  /**
   * Close the adapter and clean up any resources
   * @returns Promise that resolves when cleanup is complete
   */
  async close(): Promise<void> {
    this.logger.log(`Closing ${this.marketplaceName} adapter`);
    this.isInitialized = false;

    try {
      await this.closeInternal();
      this.logger.log(`${this.marketplaceName} adapter closed successfully`);
    } catch (error) {
      this.logger.error(
        `Error closing ${this.marketplaceName} adapter: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Internal close method to be implemented by each adapter if needed
   */
  protected async closeInternal(): Promise<void> {
    // Default implementation does nothing, override in subclasses if needed
  }

  /**
   * Helper method to ensure the adapter is initialized before use
   */
  protected checkInitialized(): void {
    if (!this.isInitialized) {
      throw new Error(
        `${this.marketplaceName} adapter is not initialized. Call initialize() first.`,
      );
    }
  }

  /**
   * Helper method to create a successful operation result
   */
  protected createSuccessResult<T>(data: T): OperationResult<T> {
    return {
      success: true,
      data,
    };
  }

  /**
   * Helper method to create a failed operation result
   */
  protected createErrorResult<T>(
    code: string,
    message: string,
    details?: any,
  ): OperationResult<T> {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
    };
  }

  /**
   * Helper method to handle and log errors
   */
  protected handleError<T>(operation: string, error: any): OperationResult<T> {
    const errorMessage = error.message || String(error);
    const errorCode = error.code || 'UNKNOWN_ERROR';

    this.logger.error(
      `${operation} failed for ${this.marketplaceName}: ${errorMessage}`,
      error.stack,
    );

    return this.createErrorResult(
      errorCode,
      `${operation} failed: ${errorMessage}`,
      error.details || error,
    );
  }
}
