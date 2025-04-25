/**
 * WooCommerce Connector
 *
 * This connector integrates with the WooCommerce REST API to provide
 * marketplace functionality for the Fluxori platform.
 * Optimized for South African e-commerce operations.
 */

import * as crypto from 'crypto';
import * as querystring from 'querystring';

import { Injectable, Logger } from '@nestjs/common';

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

import { BaseMarketplaceConnector } from './base-marketplace-connector';
import {
  ConnectorCredentials,
  ConnectionStatus,
  ConnectionQuality,
  MarketplaceProduct,
  MarketplaceOrder,
  OrderAcknowledgment,
  PaginationOptions,
  PaginatedResponse,
  OperationResult,
  CredentialType,
} from '../interfaces/types';

/**
 * Interface for WooCommerce REST API client configuration
 */
interface WooCommerceConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
  version: string;
  verifySsl: boolean;
  timeout: number;
  encoding: string;
  queryStringAuth: boolean;
  port?: number;
}

/**
 * WooCommerce API Connector
 *
 * This class implements the marketplace connector interface for WooCommerce REST API
 * with specific optimizations for South African e-commerce operations.
 */
@Injectable()
export class WooCommerceConnector extends BaseMarketplaceConnector {
  readonly connectorId: string = 'woocommerce';
  readonly connectorName: string = 'WooCommerce REST API';

  private client: AxiosInstance;
  private config: WooCommerceConfig;
  private rateLimitRemaining: number = 1000;
  private rateLimitTotal: number = 1000;
  private rateLimitReset: Date = new Date();

  constructor() {
    super('WooCommerceConnector');
  }

  /**
   * Internal initialization implementation
   */
  protected async initializeInternal(
    credentials: ConnectorCredentials,
  ): Promise<void> {
    if (credentials.type !== CredentialType.API_KEY) {
      throw new Error('WooCommerce connector requires API_KEY credentials');
    }

    if (!credentials.endpoint) {
      throw new Error('WooCommerce connector requires endpoint URL');
    }

    if (!credentials.apiKey || !credentials.apiSecret) {
      throw new Error(
        'WooCommerce connector requires consumerKey and consumerSecret',
      );
    }

    // Configure WooCommerce client
    this.config = {
      url: credentials.endpoint,
      consumerKey: credentials.apiKey,
      consumerSecret: credentials.apiSecret,
      version: credentials.apiVersion || 'wc/v3',
      verifySsl: credentials.verifySsl !== false,
      timeout: credentials.timeout || 10000,
      encoding: credentials.encoding || 'utf8',
      queryStringAuth: credentials.queryStringAuth !== false,
      port: credentials.port,
    };

    // Create Axios instance with default config
    this.client = axios.create({
      baseURL: this.getBaseUrl(),
      timeout: this.config.timeout,
      headers: {
        'User-Agent': 'Fluxori WooCommerce Connector/1.0',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add request interceptor to handle authentication and rate limits
    this.client.interceptors.request.use((config) => {
      // Add authentication
      if (this.config.queryStringAuth) {
        config.params = {
          ...config.params,
          consumer_key: this.config.consumerKey,
          consumer_secret: this.config.consumerSecret,
        };
      } else {
        config.auth = {
          username: this.config.consumerKey,
          password: this.config.consumerSecret,
        };
      }

      // Additional South African specific optimizations
      // Add cache-control headers for better performance with unstable connections
      config.headers['Cache-Control'] = 'public, max-age=60';

      return config;
    });

    // Add response interceptor to handle rate limits
    this.client.interceptors.response.use((response) => {
      // Parse rate limit headers if available
      if (response.headers['x-ratelimit-remaining']) {
        this.rateLimitRemaining = parseInt(
          response.headers['x-ratelimit-remaining'],
          10,
        );
      }

      if (response.headers['x-ratelimit-limit']) {
        this.rateLimitTotal = parseInt(
          response.headers['x-ratelimit-limit'],
          10,
        );
      }

      if (response.headers['x-ratelimit-reset']) {
        const resetTime = parseInt(response.headers['x-ratelimit-reset'], 10);
        this.rateLimitReset = new Date(resetTime * 1000);
      }

      return response;
    });

    this.logger.log('WooCommerce connector initialized successfully');
  }

  /**
   * Build base URL for API requests
   */
  private getBaseUrl(): string {
    let url = this.config.url;

    // Ensure URL ends with slash
    if (!url.endsWith('/')) {
      url += '/';
    }

    // Add wp-json/ if not present
    if (!url.includes('wp-json/')) {
      url += 'wp-json/';
    }

    // Add API version
    return url + this.config.version;
  }

  /**
   * Generate OAuth signature for OAuth requests
   */
  private getOAuthSignature(
    method: string,
    endpoint: string,
    params: Record<string, any>,
  ): string {
    // Convert params to string
    const queryString = querystring.stringify(params);

    // Build signature base string
    const baseUrl = this.getBaseUrl() + endpoint;
    const base = `${method.toUpperCase()}&${encodeURIComponent(baseUrl)}&${encodeURIComponent(queryString)}`;

    // Create HMAC-SHA1 signature
    const key = encodeURIComponent(this.config.consumerSecret);
    const hash = crypto.createHmac('sha1', key).update(base).digest('base64');

    return hash;
  }

  /**
   * Make API request with appropriate authentication
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: Record<string, any>,
    params?: Record<string, any>,
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      method,
      url: endpoint,
      data,
      params,
    };

    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.message;

        throw new Error(`WooCommerce API error (${status}): ${message}`);
      }

      throw error;
    }
  }

  /**
   * Internal connection test implementation
   */
  protected async testConnectionInternal(): Promise<ConnectionStatus> {
    try {
      // Test connection by fetching store information
      const result = await this.request<any>('get', 'system_status');

      // Update connection status
      const status: ConnectionStatus = {
        connected: true,
        quality: ConnectionQuality.GOOD,
        message: 'Connection to WooCommerce API successful',
        lastChecked: new Date(),
        details: {
          apiVersion: result.environment?.version || 'Unknown',
        },
      };

      // Check connection quality
      if (this.rateLimitRemaining < this.rateLimitTotal * 0.2) {
        status.quality = ConnectionQuality.FAIR;
        status.message = 'WooCommerce API connection rate-limited';
      }

      return status;
    } catch (error) {
      return {
        connected: false,
        quality: ConnectionQuality.CRITICAL,
        message: `Failed to connect to WooCommerce API: ${error.message}`,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(): Promise<{
    remaining: number;
    reset: Date;
    limit: number;
  }> {
    return {
      remaining: this.rateLimitRemaining,
      limit: this.rateLimitTotal,
      reset: this.rateLimitReset,
    };
  }

  /**
   * Convert WooCommerce product to marketplace product format
   */
  private convertToMarketplaceProduct(product: any): MarketplaceProduct {
    // Get status
    let status: 'active' | 'inactive' | 'pending' | 'rejected' = 'inactive';
    if (product.status === 'publish') status = 'active' as const;
    else if (product.status === 'draft') status = 'pending' as const;

    // Format images
    const images = product.images?.map((img: any) => img.src) || [];

    // Format categories
    const categories = product.categories?.map((cat: any) => cat.name) || [];

    // Format main product
    return {
      id: product.id.toString(),
      sku: product.sku || `woo-${product.id}`,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price || 0),
      compareAtPrice: product.regular_price
        ? parseFloat(product.regular_price)
        : undefined,
      currency: 'ZAR', // Default to ZAR for South African merchants
      stockLevel:
        product.stock_quantity !== null
          ? product.stock_quantity
          : product.in_stock
            ? 999
            : 0,
      status: status,
      categories,
      images,
      marketplaceUrl: product.permalink,
      createdAt: new Date(product.date_created || Date.now()),
      updatedAt: new Date(product.date_modified || Date.now()),
      // Additional WooCommerce specific fields
      stockStatus: product.stock_status,
      manageStock: product.manage_stock,
      virtual: product.virtual,
      downloadable: product.downloadable,
      taxClass: product.tax_class,
      weight: product.weight,
      dimensions: product.dimensions,
    };
  }

  /**
   * Convert WooCommerce order to marketplace order format
   */
  private convertToMarketplaceOrder(order: any): MarketplaceOrder {
    // Format line items
    const items =
      order.line_items?.map((item: any) => ({
        id: item.id.toString(),
        sku: item.sku || `unknown-${item.product_id}`,
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        totalPrice: parseFloat(item.total),
        tax: parseFloat(item.total_tax || 0),
        productId: item.product_id.toString(),
        variantId: item.variation_id ? item.variation_id.toString() : undefined,
      })) || [];

    // Format shipping address
    const shippingAddress = order.shipping
      ? {
          firstName: order.shipping.first_name,
          lastName: order.shipping.last_name,
          company: order.shipping.company,
          address1: order.shipping.address_1,
          address2: order.shipping.address_2,
          city: order.shipping.city,
          province: order.shipping.state,
          zip: order.shipping.postcode,
          country: order.shipping.country,
          phone: order.billing?.phone, // Often shipping doesn't include phone
        }
      : undefined;

    // Format billing address
    const billingAddress = order.billing
      ? {
          firstName: order.billing.first_name,
          lastName: order.billing.last_name,
          company: order.billing.company,
          address1: order.billing.address_1,
          address2: order.billing.address_2,
          city: order.billing.city,
          province: order.billing.state,
          zip: order.billing.postcode,
          country: order.billing.country,
          phone: order.billing.phone,
          email: order.billing.email,
        }
      : undefined;

    // Format main order
    return {
      id: order.id.toString(),
      marketplaceOrderId: order.number || order.id.toString(),
      orderNumber: order.number,
      customerId: order.customer_id ? order.customer_id.toString() : undefined,
      customerName:
        `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
      customerEmail: order.billing?.email,
      status: order.status,
      financialStatus: order.payment_method_title || order.status,
      fulfillmentStatus:
        order.status === 'completed' ? 'fulfilled' : 'unfulfilled',
      createdAt: new Date(order.date_created || Date.now()),
      updatedAt: new Date(order.date_modified || Date.now()),
      currency: order.currency || 'ZAR',
      totalPrice: parseFloat(order.total),
      subtotalPrice: parseFloat(order.subtotal),
      totalTax: parseFloat(order.total_tax || 0),
      totalShipping: parseFloat(order.shipping_total || 0),
      totalDiscount: parseFloat(order.discount_total || 0),
      items,
      shippingAddress,
      billingAddress,
      // Additional WooCommerce specific fields
      paymentMethod: order.payment_method,
      paymentMethodTitle: order.payment_method_title,
      transactionId: order.transaction_id,
      dateCompleted: order.date_completed
        ? new Date(order.date_completed)
        : undefined,
      datePaid: order.date_paid ? new Date(order.date_paid) : undefined,
    };
  }

  // Implementation of required methods from BaseMarketplaceConnector

  protected async getProductByIdInternal(
    productId: string,
  ): Promise<OperationResult<MarketplaceProduct>> {
    try {
      const product = await this.request<any>('get', `products/${productId}`);
      return this.createSuccessResult(
        this.convertToMarketplaceProduct(product),
      );
    } catch (error) {
      // Check if product not found
      if (error.message?.includes('404')) {
        return this.createErrorResult(
          'PRODUCT_NOT_FOUND',
          `Product with ID ${productId} not found`,
          error,
        );
      }

      return this.createErrorResult(
        'PRODUCT_FETCH_ERROR',
        `Failed to fetch product with ID ${productId}: ${error.message}`,
        error,
      );
    }
  }

  protected async getProductBySkuInternal(
    sku: string,
  ): Promise<OperationResult<MarketplaceProduct>> {
    try {
      // WooCommerce doesn't have a direct SKU lookup, use filter
      const response = await this.request<any[]>('get', 'products', undefined, {
        sku: sku,
      });

      if (response && response.length > 0) {
        return this.createSuccessResult(
          this.convertToMarketplaceProduct(response[0]),
        );
      }

      return this.createErrorResult(
        'PRODUCT_NOT_FOUND',
        `Product with SKU ${sku} not found`,
      );
    } catch (error) {
      return this.createErrorResult(
        'PRODUCT_FETCH_ERROR',
        `Failed to fetch product with SKU ${sku}: ${error.message}`,
        error,
      );
    }
  }

  protected async getProductsBySkusInternal(
    skus: string[],
  ): Promise<OperationResult<MarketplaceProduct[]>> {
    // WooCommerce doesn't support querying multiple SKUs at once
    // We need to make multiple requests and combine results
    try {
      const products: MarketplaceProduct[] = [];
      const failed: { sku: string; reason: string }[] = [];

      // Process in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < skus.length; i += batchSize) {
        const batch = skus.slice(i, i + batchSize);
        const batchPromises = batch.map((sku) =>
          this.getProductBySkuInternal(sku),
        );
        const results = await Promise.all(batchPromises);

        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          if (result.success && result.data) {
            products.push(result.data);
          } else if (result.error) {
            failed.push({
              sku: batch[j],
              reason: result.error.message,
            });
          }
        }
      }

      if (products.length === 0 && failed.length > 0) {
        return this.createErrorResult(
          'PRODUCTS_FETCH_ERROR',
          `Failed to fetch any products by SKUs`,
          { failed },
        );
      }

      return this.createSuccessResult(products);
    } catch (error) {
      return this.createErrorResult(
        'PRODUCTS_FETCH_ERROR',
        `Failed to fetch products by SKUs: ${error.message}`,
        error,
      );
    }
  }

  protected async getProductsInternal(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<MarketplaceProduct>> {
    try {
      // Map our pagination options to WooCommerce format
      const params = {
        page: (options.page || 0) + 1, // WooCommerce uses 1-based pagination
        per_page: options.pageSize || 20,
        order: options.sortDirection === 'asc' ? 'asc' : 'desc',
        orderby: this.mapSortField(options.sortBy),
      };

      // Add filter conditions if provided
      if (options.filter) {
        Object.assign(params, this.mapFilters(options.filter));
      }

      // Get products from API
      const response = await this.request<any[]>(
        'get',
        'products',
        undefined,
        params,
      );

      // Extract total pages and items from headers
      const totalItems =
        parseInt(this.client.defaults.headers['X-WP-Total'] as string, 10) || 0;
      const totalPages =
        parseInt(
          this.client.defaults.headers['X-WP-TotalPages'] as string,
          10,
        ) || 1;

      // Convert to marketplace format
      const products = response.map((product) =>
        this.convertToMarketplaceProduct(product),
      );

      return {
        data: products,
        pagination: {
          page: options.page || 0,
          pageSize: options.pageSize || 20,
          totalItems,
          totalPages,
          hasNextPage: (options.page || 0) + 1 < totalPages,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error fetching products: ${error.message}`,
        error.stack,
      );

      // Return empty paginated response on error
      return {
        data: [],
        pagination: {
          page: options.page || 0,
          pageSize: options.pageSize || 20,
          hasNextPage: false,
        },
      };
    }
  }

  /**
   * Map sort field names to WooCommerce field names
   */
  private mapSortField(field?: string): string {
    if (!field) return 'date';

    // Map our field names to WooCommerce field names
    const fieldMap: Record<string, string> = {
      createdAt: 'date',
      updatedAt: 'modified',
      name: 'title',
      price: 'price',
      sku: 'sku',
      stockLevel: 'stock',
    };

    return fieldMap[field] || 'date';
  }

  /**
   * Map filter conditions to WooCommerce parameters
   */
  private mapFilters(filters: Record<string, any>): Record<string, any> {
    const params: Record<string, any> = {};

    // Map our filter keys to WooCommerce parameters
    if (filters.category) {
      params.category = filters.category;
    }

    if (filters.status) {
      // Map our status values to WooCommerce status values
      const statusMap: Record<string, string> = {
        active: 'publish',
        inactive: 'draft',
        pending: 'pending',
      };
      params.status = statusMap[filters.status] || filters.status;
    }

    if (filters.inStock === true) {
      params.stock_status = 'instock';
    } else if (filters.inStock === false) {
      params.stock_status = 'outofstock';
    }

    // Support for text search
    if (filters.search) {
      params.search = filters.search;
    }

    return params;
  }

  protected async getOrderByIdInternal(
    id: string,
  ): Promise<OperationResult<MarketplaceOrder>> {
    try {
      const order = await this.request<any>('get', `orders/${id}`);
      return this.createSuccessResult(this.convertToMarketplaceOrder(order));
    } catch (error) {
      // Check if order not found
      if (error.message?.includes('404')) {
        return this.createErrorResult(
          'ORDER_NOT_FOUND',
          `Order with ID ${id} not found`,
          error,
        );
      }

      return this.createErrorResult(
        'ORDER_FETCH_ERROR',
        `Failed to fetch order with ID ${id}: ${error.message}`,
        error,
      );
    }
  }

  protected async getRecentOrdersInternal(
    sinceDate: Date,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<MarketplaceOrder>> {
    try {
      // Map our pagination options to WooCommerce format
      const params = {
        page: (options.page || 0) + 1, // WooCommerce uses 1-based pagination
        per_page: options.pageSize || 20,
        order: options.sortDirection === 'asc' ? 'asc' : 'desc',
        orderby: 'date',
        after: sinceDate.toISOString(),
      };

      // Add filter conditions if provided
      if (options.filter) {
        Object.assign(params, this.mapOrderFilters(options.filter));
      }

      // Get orders from API
      const response = await this.request<any[]>(
        'get',
        'orders',
        undefined,
        params,
      );

      // Extract total pages and items from headers
      const totalItems =
        parseInt(this.client.defaults.headers['X-WP-Total'] as string, 10) || 0;
      const totalPages =
        parseInt(
          this.client.defaults.headers['X-WP-TotalPages'] as string,
          10,
        ) || 1;

      // Convert to marketplace format
      const orders = response.map((order) =>
        this.convertToMarketplaceOrder(order),
      );

      return {
        data: orders,
        pagination: {
          page: options.page || 0,
          pageSize: options.pageSize || 20,
          totalItems,
          totalPages,
          hasNextPage: (options.page || 0) + 1 < totalPages,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error fetching recent orders: ${error.message}`,
        error.stack,
      );

      // Return empty paginated response on error
      return {
        data: [],
        pagination: {
          page: options.page || 0,
          pageSize: options.pageSize || 20,
          hasNextPage: false,
        },
      };
    }
  }

  /**
   * Map order filter conditions to WooCommerce parameters
   */
  private mapOrderFilters(filters: Record<string, any>): Record<string, any> {
    const params: Record<string, any> = {};

    // Map our filter keys to WooCommerce parameters
    if (filters.status) {
      params.status = filters.status;
    }

    if (filters.customer) {
      params.customer = filters.customer;
    }

    // Support for product filtering
    if (filters.product) {
      params.product = filters.product;
    }

    return params;
  }

  protected async getOrdersInternal(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<MarketplaceOrder>> {
    try {
      // Map our pagination options to WooCommerce format
      const params = {
        page: (options.page || 0) + 1, // WooCommerce uses 1-based pagination
        per_page: options.pageSize || 20,
        order: options.sortDirection === 'asc' ? 'asc' : 'desc',
        orderby: 'date',
      };

      // Add filter conditions if provided
      if (options.filter) {
        Object.assign(params, this.mapOrderFilters(options.filter));
      }

      // Get orders from API
      const response = await this.request<any[]>(
        'get',
        'orders',
        undefined,
        params,
      );

      // Extract total pages and items from headers
      const totalItems =
        parseInt(this.client.defaults.headers['X-WP-Total'] as string, 10) || 0;
      const totalPages =
        parseInt(
          this.client.defaults.headers['X-WP-TotalPages'] as string,
          10,
        ) || 1;

      // Convert to marketplace format
      const orders = response.map((order) =>
        this.convertToMarketplaceOrder(order),
      );

      return {
        data: orders,
        pagination: {
          page: options.page || 0,
          pageSize: options.pageSize || 20,
          totalItems,
          totalPages,
          hasNextPage: (options.page || 0) + 1 < totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching orders: ${error.message}`, error.stack);

      // Return empty paginated response on error
      return {
        data: [],
        pagination: {
          page: options.page || 0,
          pageSize: options.pageSize || 20,
          hasNextPage: false,
        },
      };
    }
  }

  protected async acknowledgeOrderInternal(
    orderId: string,
  ): Promise<OperationResult<OrderAcknowledgment>> {
    try {
      // Update order status to processing if it's not already processed
      const order = await this.request<any>('get', `orders/${orderId}`);

      if (order.status === 'pending') {
        await this.request<any>('put', `orders/${orderId}`, {
          status: 'processing',
        });
      }

      return this.createSuccessResult({
        orderId: orderId,
        success: true,
        timestamp: new Date(),
        marketplaceReference: order.number || orderId,
        message: 'Order acknowledged successfully',
      });
    } catch (error) {
      return this.createErrorResult(
        'ORDER_ACKNOWLEDGMENT_ERROR',
        `Failed to acknowledge order ${orderId}: ${error.message}`,
        error,
      );
    }
  }

  protected async updateStockInternal(
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
  > {
    const successful: string[] = [];
    const failed: Array<{ sku: string; reason: string }> = [];

    try {
      // Process stock updates in batches
      const batchSize = 10;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);

        // Get product IDs by SKU
        const productPromises = batch.map((update) =>
          this.getProductBySkuInternal(update.sku),
        );
        const productResults = await Promise.all(productPromises);

        // Prepare update operations
        const updatePromises = productResults.map((result, index) => {
          const update = batch[index];

          if (!result.success || !result.data) {
            failed.push({
              sku: update.sku,
              reason: result.error?.message || 'Product not found',
            });
            return Promise.resolve();
          }

          const productId = result.data.id;
          return this.request<any>('put', `products/${productId}`, {
            stock_quantity: update.stockLevel,
            manage_stock: true,
          })
            .then(() => {
              successful.push(update.sku);
            })
            .catch((error) => {
              failed.push({
                sku: update.sku,
                reason: error.message,
              });
            });
        });

        await Promise.all(updatePromises);
      }

      return this.createSuccessResult({
        successful,
        failed,
      });
    } catch (error) {
      // Add any remaining updates to failed
      const remainingSkus = updates
        .map((u) => u.sku)
        .filter(
          (sku) =>
            !successful.includes(sku) && !failed.some((f) => f.sku === sku),
        );

      for (const sku of remainingSkus) {
        failed.push({
          sku,
          reason: error.message,
        });
      }

      return this.createSuccessResult({
        successful,
        failed,
      });
    }
  }

  protected async updatePricesInternal(
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
  > {
    const successful: string[] = [];
    const failed: Array<{ sku: string; reason: string }> = [];

    try {
      // Process price updates in batches
      const batchSize = 10;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);

        // Get product IDs by SKU
        const productPromises = batch.map((update) =>
          this.getProductBySkuInternal(update.sku),
        );
        const productResults = await Promise.all(productPromises);

        // Prepare update operations
        const updatePromises = productResults.map((result, index) => {
          const update = batch[index];

          if (!result.success || !result.data) {
            failed.push({
              sku: update.sku,
              reason: result.error?.message || 'Product not found',
            });
            return Promise.resolve();
          }

          const productId = result.data.id;
          const updateData: Record<string, any> = {
            price: update.price.toString(),
          };

          if (update.compareAtPrice) {
            updateData.regular_price = update.compareAtPrice.toString();
            updateData.sale_price = update.price.toString();
          } else {
            updateData.regular_price = update.price.toString();
            updateData.sale_price = '';
          }

          return this.request<any>('put', `products/${productId}`, updateData)
            .then(() => {
              successful.push(update.sku);
            })
            .catch((error) => {
              failed.push({
                sku: update.sku,
                reason: error.message,
              });
            });
        });

        await Promise.all(updatePromises);
      }

      return this.createSuccessResult({
        successful,
        failed,
      });
    } catch (error) {
      // Add any remaining updates to failed
      const remainingSkus = updates
        .map((u) => u.sku)
        .filter(
          (sku) =>
            !successful.includes(sku) && !failed.some((f) => f.sku === sku),
        );

      for (const sku of remainingSkus) {
        failed.push({
          sku,
          reason: error.message,
        });
      }

      return this.createSuccessResult({
        successful,
        failed,
      });
    }
  }

  // South African specific optimizations

  /**
   * Get lead time for product delivery in South Africa
   */
  async getLeadTime(
    productId: string,
  ): Promise<OperationResult<{ leadTimeDays: number }>> {
    try {
      const product = await this.request<any>('get', `products/${productId}`);

      // Check for lead time in product meta data
      let leadTimeDays = 3; // Default value

      if (product.meta_data) {
        const leadTimeMeta = product.meta_data.find(
          (meta: any) =>
            meta.key === '_sa_lead_time' || meta.key === 'sa_lead_time',
        );

        if (leadTimeMeta && leadTimeMeta.value) {
          leadTimeDays = parseInt(leadTimeMeta.value, 10);
        }
      }

      return this.createSuccessResult({
        leadTimeDays,
      });
    } catch (error) {
      return this.createErrorResult(
        'LEAD_TIME_FETCH_ERROR',
        `Failed to fetch lead time for product ${productId}: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Update lead time for product delivery
   */
  async updateLeadTime(
    productId: string,
    leadTimeDays: number,
  ): Promise<OperationResult<{ updated: boolean }>> {
    try {
      // Update lead time in product meta data
      await this.request<any>('put', `products/${productId}`, {
        meta_data: [
          {
            key: '_sa_lead_time',
            value: leadTimeDays.toString(),
          },
        ],
      });

      return this.createSuccessResult({
        updated: true,
      });
    } catch (error) {
      return this.createErrorResult(
        'LEAD_TIME_UPDATE_ERROR',
        `Failed to update lead time for product ${productId}: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Get South African shipping rates
   */
  async getSouthAfricanShippingRates(): Promise<
    OperationResult<
      Array<{
        name: string;
        price: number;
        estimatedDays: number;
      }>
    >
  > {
    try {
      // Fetch shipping methods from WooCommerce
      const shippingZones = await this.request<any[]>('get', 'shipping/zones');

      // Find South Africa zone
      const saZone = shippingZones.find(
        (zone) =>
          zone.name.includes('South Africa') ||
          zone.name.includes('SA') ||
          zone.name.includes('ZA'),
      );

      if (!saZone) {
        // Return default rates if no South Africa zone is found
        return this.createSuccessResult([
          {
            name: 'Standard Delivery',
            price: 65,
            estimatedDays: 5,
          },
          {
            name: 'Express Delivery',
            price: 120,
            estimatedDays: 2,
          },
          {
            name: 'Same Day Delivery (Cape Town only)',
            price: 200,
            estimatedDays: 0,
          },
        ]);
      }

      // Get shipping methods for the zone
      const methods = await this.request<any[]>(
        'get',
        `shipping/zones/${saZone.id}/methods`,
      );

      // Map to our format with estimated delivery days
      const rates = methods.map((method) => {
        // Extract delivery days from method title if available
        let estimatedDays = 5; // Default
        const dayMatch = method.title.match(/(\d+)[-\s]?day/i);
        if (dayMatch) {
          estimatedDays = parseInt(dayMatch[1], 10);
        } else if (method.title.toLowerCase().includes('express')) {
          estimatedDays = 2;
        } else if (method.title.toLowerCase().includes('same day')) {
          estimatedDays = 0;
        }

        return {
          name: method.title,
          price: parseFloat(method.settings.cost?.value || 0),
          estimatedDays,
        };
      });

      return this.createSuccessResult(rates);
    } catch (error) {
      // Return default rates on error
      this.logger.warn(
        `Error fetching shipping rates: ${error.message}. Using defaults.`,
      );

      return this.createSuccessResult([
        {
          name: 'Standard Delivery',
          price: 65,
          estimatedDays: 5,
        },
        {
          name: 'Express Delivery',
          price: 120,
          estimatedDays: 2,
        },
        {
          name: 'Same Day Delivery (Cape Town only)',
          price: 200,
          estimatedDays: 0,
        },
      ]);
    }
  }

  /**
   * Get low bandwidth product data (minimal fields)
   * South Africa optimization for low bandwidth environments
   */
  async getLowBandwidthProducts(
    options?: PaginationOptions,
  ): Promise<PaginatedResponse<MarketplaceProduct>> {
    // Similar to getProductsInternal but requests fewer fields
    try {
      // Map our pagination options to WooCommerce format with fields limitation
      const params = {
        page: (options?.page || 0) + 1,
        per_page: options?.pageSize || 20,
        order: options?.sortDirection === 'asc' ? 'asc' : 'desc',
        orderby: this.mapSortField(options?.sortBy),
        _fields:
          'id,name,sku,price,stock_quantity,status,date_created,date_modified',
      };

      // Get products from API with limited fields
      const response = await this.request<any[]>(
        'get',
        'products',
        undefined,
        params,
      );

      // Extract total pages and items from headers
      const totalItems =
        parseInt(this.client.defaults.headers['X-WP-Total'] as string, 10) || 0;
      const totalPages =
        parseInt(
          this.client.defaults.headers['X-WP-TotalPages'] as string,
          10,
        ) || 1;

      // Convert to marketplace format with minimal fields
      const products = response.map((product) => ({
        id: product.id.toString(),
        sku: product.sku || `woo-${product.id}`,
        name: product.name,
        price: parseFloat(product.price || 0),
        currency: 'ZAR',
        stockLevel:
          product.stock_quantity !== null ? product.stock_quantity : 0,
        status:
          product.status === 'publish'
            ? ('active' as const)
            : ('inactive' as const),
        createdAt: new Date(product.date_created || Date.now()),
        updatedAt: new Date(product.date_modified || Date.now()),
      }));

      return {
        data: products,
        pagination: {
          page: options?.page || 0,
          pageSize: options?.pageSize || 20,
          totalItems,
          totalPages,
          hasNextPage: (options?.page || 0) + 1 < totalPages,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error fetching low bandwidth products: ${error.message}`,
        error.stack,
      );

      // Return empty paginated response on error
      return {
        data: [],
        pagination: {
          page: options?.page || 0,
          pageSize: options?.pageSize || 20,
          hasNextPage: false,
        },
      };
    }
  }
}
