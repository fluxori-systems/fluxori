/**
 * Base Marketplace Connector
 * 
 * This class extends the BaseConnector with marketplace-specific operations
 * for products, inventory, pricing, and orders. It provides common
 * implementation patterns across different marketplaces while allowing for
 * marketplace-specific customization.
 */

import {
  IMarketplaceConnector
} from '../interfaces/connector.interface';

import {
  ConnectorCredentials,
  OperationResult,
  MarketplaceProduct,
  MarketplaceOrder,
  OrderAcknowledgment,
  PaginationOptions,
  PaginatedResponse
} from '../interfaces/types';

import { BaseConnector } from './base-connector';

/**
 * Abstract base class for marketplace connectors
 */
export abstract class BaseMarketplaceConnector extends BaseConnector
  implements IMarketplaceConnector<MarketplaceProduct, MarketplaceOrder, OrderAcknowledgment> {
  
  /**
   * Fetch a product by its ID
   * @param productId The product ID
   * @returns Operation result containing the product if found
   */
  async getProductById(productId: string): Promise<OperationResult<MarketplaceProduct>> {
    this.checkInitialized();
    this.checkCircuitBreaker();

    try {
      return await this.executeWithRetry(
        () => this.getProductByIdInternal(productId),
        `getProductById(${productId})`
      );
    } catch (error) {
      return this.createErrorResult(
        error.code || 'PRODUCT_FETCH_ERROR',
        `Failed to fetch product with ID ${productId}: ${error.message}`,
        error.details || error
      );
    }
  }
  
  /**
   * Internal implementation for fetching a product by ID
   */
  protected abstract getProductByIdInternal(productId: string): Promise<OperationResult<MarketplaceProduct>>;
  
  /**
   * Fetch orders with pagination
   * @param options Pagination options
   * @returns Paginated response of orders
   */
  async getOrders(options?: PaginationOptions): Promise<PaginatedResponse<MarketplaceOrder>> {
    this.checkInitialized();
    this.checkCircuitBreaker();

    const defaultOptions: PaginationOptions = {
      page: 0,
      pageSize: 20,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      return await this.executeWithRetry(
        () => this.getOrdersInternal(mergedOptions),
        `getOrders(page ${mergedOptions.page}, size ${mergedOptions.pageSize})`
      );
    } catch (error) {
      // Return an empty paginated response on error
      return {
        data: [],
        pagination: {
          page: mergedOptions.page || 0,
          pageSize: mergedOptions.pageSize || 20,
          hasNextPage: false
        }
      };
    }
  }
  
  /**
   * Internal implementation for fetching orders with pagination
   */
  protected abstract getOrdersInternal(options: PaginationOptions): Promise<PaginatedResponse<MarketplaceOrder>>;

  /**
   * Fetch a product by its SKU
   * @param sku The SKU of the product
   * @returns Operation result containing the product if found
   */
  async getProductBySku(sku: string): Promise<OperationResult<MarketplaceProduct>> {
    this.checkInitialized();
    this.checkCircuitBreaker();

    try {
      return await this.executeWithRetry(
        () => this.getProductBySkuInternal(sku),
        `getProductBySku(${sku})`
      );
    } catch (error) {
      return this.createErrorResult(
        error.code || 'PRODUCT_FETCH_ERROR',
        `Failed to fetch product with SKU ${sku}: ${error.message}`,
        error.details || error
      );
    }
  }

  /**
   * Fetch multiple products by their SKUs
   * @param skus Array of SKUs to fetch
   * @returns Operation result containing an array of found products
   */
  async getProductsBySkus(skus: string[]): Promise<OperationResult<MarketplaceProduct[]>> {
    this.checkInitialized();
    this.checkCircuitBreaker();

    if (!skus || skus.length === 0) {
      return this.createErrorResult(
        'INVALID_PARAMETERS',
        'No SKUs provided for getProductsBySkus'
      );
    }

    try {
      return await this.executeWithRetry(
        () => this.getProductsBySkusInternal(skus),
        `getProductsBySkus(${skus.length} SKUs)`
      );
    } catch (error) {
      return this.createErrorResult(
        error.code || 'PRODUCTS_FETCH_ERROR',
        `Failed to fetch products by SKUs: ${error.message}`,
        error.details || error
      );
    }
  }

  /**
   * Fetch products with pagination
   * @param options Pagination options
   * @returns Paginated response of products
   */
  async getProducts(options?: PaginationOptions): Promise<PaginatedResponse<MarketplaceProduct>> {
    this.checkInitialized();
    this.checkCircuitBreaker();

    const defaultOptions: PaginationOptions = {
      page: 0,
      pageSize: 20,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      return await this.executeWithRetry(
        () => this.getProductsInternal(mergedOptions),
        `getProducts(page ${mergedOptions.page}, size ${mergedOptions.pageSize})`
      );
    } catch (error) {
      // Return an empty paginated response on error
      return {
        data: [],
        pagination: {
          page: mergedOptions.page || 0,
          pageSize: mergedOptions.pageSize || 20,
          hasNextPage: false
        }
      };
    }
  }

  /**
   * Fetch an order by its ID
   * @param id The order ID specific to the marketplace
   * @returns Operation result containing the order if found
   */
  async getOrderById(id: string): Promise<OperationResult<MarketplaceOrder>> {
    this.checkInitialized();
    this.checkCircuitBreaker();

    try {
      return await this.executeWithRetry(
        () => this.getOrderByIdInternal(id),
        `getOrderById(${id})`
      );
    } catch (error) {
      return this.createErrorResult(
        error.code || 'ORDER_FETCH_ERROR',
        `Failed to fetch order with ID ${id}: ${error.message}`,
        error.details || error
      );
    }
  }

  /**
   * Fetch recent orders
   * @param sinceDate Fetch orders created after this date
   * @param options Pagination options
   * @returns Paginated response of orders
   */
  async getRecentOrders(
    sinceDate: Date,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<MarketplaceOrder>> {
    this.checkInitialized();
    this.checkCircuitBreaker();

    const defaultOptions: PaginationOptions = {
      page: 0,
      pageSize: 20,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      return await this.executeWithRetry(
        () => this.getRecentOrdersInternal(sinceDate, mergedOptions),
        `getRecentOrders(since ${sinceDate.toISOString()})`
      );
    } catch (error) {
      // Return an empty paginated response on error
      return {
        data: [],
        pagination: {
          page: mergedOptions.page || 0,
          pageSize: mergedOptions.pageSize || 20,
          hasNextPage: false
        }
      };
    }
  }

  /**
   * Acknowledge receipt of an order
   * @param orderId The order ID specific to the marketplace
   * @returns Operation result with acknowledgment details
   */
  async acknowledgeOrder(orderId: string): Promise<OperationResult<OrderAcknowledgment>> {
    this.checkInitialized();
    this.checkCircuitBreaker();

    try {
      return await this.executeWithRetry(
        () => this.acknowledgeOrderInternal(orderId),
        `acknowledgeOrder(${orderId})`
      );
    } catch (error) {
      return this.createErrorResult(
        error.code || 'ORDER_ACKNOWLEDGMENT_ERROR',
        `Failed to acknowledge order ${orderId}: ${error.message}`,
        error.details || error
      );
    }
  }

  /**
   * Update stock levels for one or more products
   * @param updates Array of stock update payloads
   * @returns Operation result with success status and details
   */
  async updateStock(updates: Array<{
    sku: string;
    stockLevel: number;
    locationId?: string;
  }>): Promise<OperationResult<{
    successful: string[];
    failed: Array<{ sku: string; reason: string }>;
  }>> {
    this.checkInitialized();
    this.checkCircuitBreaker();

    if (!updates || updates.length === 0) {
      return this.createErrorResult(
        'INVALID_PARAMETERS',
        'No stock updates provided'
      );
    }

    try {
      return await this.executeWithRetry(
        () => this.updateStockInternal(updates),
        `updateStock(${updates.length} products)`
      );
    } catch (error) {
      return this.createErrorResult(
        error.code || 'STOCK_UPDATE_ERROR',
        `Failed to update stock levels: ${error.message}`,
        error.details || error
      );
    }
  }

  /**
   * Update prices for one or more products
   * @param updates Array of price update payloads
   * @returns Operation result with success status and details
   */
  async updatePrices(updates: Array<{
    sku: string;
    price: number;
    compareAtPrice?: number;
    currency?: string;
  }>): Promise<OperationResult<{
    successful: string[];
    failed: Array<{ sku: string; reason: string }>;
  }>> {
    this.checkInitialized();
    this.checkCircuitBreaker();

    if (!updates || updates.length === 0) {
      return this.createErrorResult(
        'INVALID_PARAMETERS',
        'No price updates provided'
      );
    }

    try {
      return await this.executeWithRetry(
        () => this.updatePricesInternal(updates),
        `updatePrices(${updates.length} products)`
      );
    } catch (error) {
      return this.createErrorResult(
        error.code || 'PRICE_UPDATE_ERROR',
        `Failed to update prices: ${error.message}`,
        error.details || error
      );
    }
  }

  // Abstract methods that must be implemented by specific marketplace adapters

  /**
   * Internal implementation for fetching a product by SKU
   */
  protected abstract getProductBySkuInternal(sku: string): Promise<OperationResult<MarketplaceProduct>>;

  /**
   * Internal implementation for fetching products by SKUs
   */
  protected abstract getProductsBySkusInternal(skus: string[]): Promise<OperationResult<MarketplaceProduct[]>>;

  /**
   * Internal implementation for fetching products with pagination
   */
  protected abstract getProductsInternal(options: PaginationOptions): Promise<PaginatedResponse<MarketplaceProduct>>;

  /**
   * Internal implementation for fetching an order by ID
   */
  protected abstract getOrderByIdInternal(id: string): Promise<OperationResult<MarketplaceOrder>>;

  /**
   * Internal implementation for fetching recent orders
   */
  protected abstract getRecentOrdersInternal(
    sinceDate: Date,
    options: PaginationOptions
  ): Promise<PaginatedResponse<MarketplaceOrder>>;

  /**
   * Internal implementation for acknowledging an order
   */
  protected abstract acknowledgeOrderInternal(orderId: string): Promise<OperationResult<OrderAcknowledgment>>;

  /**
   * Internal implementation for updating stock levels
   */
  protected abstract updateStockInternal(updates: Array<{
    sku: string;
    stockLevel: number;
    locationId?: string;
  }>): Promise<OperationResult<{
    successful: string[];
    failed: Array<{ sku: string; reason: string }>;
  }>>;

  /**
   * Internal implementation for updating prices
   */
  protected abstract updatePricesInternal(updates: Array<{
    sku: string;
    price: number;
    compareAtPrice?: number;
    currency?: string;
  }>): Promise<OperationResult<{
    successful: string[];
    failed: Array<{ sku: string; reason: string }>;
  }>>;
}