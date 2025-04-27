/**
 * Superbalist Marketplace Connector
 *
 * This connector integrates with the Superbalist API to provide
 * marketplace functionality for the Fluxori platform, focusing on
 * South African fashion and lifestyle products.
 */

import { Injectable, Logger } from '@nestjs/common';

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
  ConnectorErrorType,
} from '../interfaces/types';
import { NetworkAwareClient } from '../utils/network-aware-client';

/**
 * Superbalist API Connector
 *
 * Implementation of marketplace connector interface for Superbalist API
 * with South African market optimizations
 */
@Injectable()
export class SuperbalistConnector extends BaseMarketplaceConnector {
  readonly connectorId: string = 'superbalist';
  readonly connectorName: string = 'Superbalist Marketplace API';

  private apiClient!: NetworkAwareClient;
  private baseUrl: string = 'https://api.superbalist.com/v1';
  private apiKey!: string;
  private apiSecret!: string;
  private organizationId!: string;

  constructor() {
    super('SuperbalistConnector');
  }

  /**
   * Internal initialization implementation for Superbalist API
   * @param credentials API credentials
   */
  protected async initializeInternal(
    credentials: ConnectorCredentials,
  ): Promise<void> {
    if (!credentials.apiKey || !credentials.apiSecret) {
      throw new Error('Superbalist API requires both apiKey and apiSecret');
    }

    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
    this.organizationId = credentials.organizationId || '';

    // Initialize network-aware client with South African optimizations
    this.apiClient = new NetworkAwareClient(this.baseUrl, {
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'X-Api-Secret': this.apiSecret,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Configure South African specific optimizations
    this.apiClient.enableLoadSheddingResilience = true;
    this.apiClient.enableLowBandwidthMode = true;
    this.apiClient.enableRegionalCaching = true;

    this.logger.log('Superbalist connector initialized');
  }

  /**
   * Internal connection test implementation
   * Tests connectivity to Superbalist API with network quality assessment
   */
  protected async testConnectionInternal(): Promise<ConnectionStatus> {
    try {
      // Test network quality first - important for South African conditions
      const networkStatus = await this.checkNetworkStatus();

      // Make a lightweight API call to verify credentials
      const response = await this.apiClient.get('/auth/verify', {
        timeout: 5000, // Short timeout for quick health check
      });

      if (response.status === 200) {
        return {
          connected: true,
          quality: networkStatus.quality,
          message: 'Connection to Superbalist API successful',
          lastChecked: new Date(),
          details: {
            apiVersion: response.data?.version || 'unknown',
            environment: response.data?.environment || 'production',
          },
        };
      } else {
        return {
          connected: false,
          quality: ConnectionQuality.POOR,
          message: `Failed to connect: ${response.status} ${response.statusText}`,
          lastChecked: new Date(),
        };
      }
    } catch (error) {
      this.logger.error(
        `Superbalist connection test failed: ${error.message}`,
        error.stack,
      );

      return {
        connected: false,
        quality: ConnectionQuality.POOR,
        message: `Connection error: ${error.message}`,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Get rate limit status from Superbalist API
   * Monitors API quota to prevent throttling
   */
  async getRateLimitStatus(): Promise<{
    remaining: number;
    reset: Date;
    limit: number;
  }> {
    try {
      const response = await this.apiClient.get('/rate_limit');

      return {
        remaining: response.data?.remaining || 0,
        limit: response.data?.limit || 1000,
        reset: new Date(response.data?.reset_at || Date.now() + 3600000),
      };
    } catch (error) {
      this.logger.warn(`Failed to get rate limit status: ${error.message}`);

      // Return conservative fallback values
      return {
        remaining: 50, // Conservative assumption
        limit: 1000,
        reset: new Date(Date.now() + 3600000), // 1 hour from now
      };
    }
  }

  // Base implementation of required methods from BaseMarketplaceConnector

  /**
   * Get a product by its Superbalist ID
   */
  protected async getProductByIdInternal(
    productId: string,
  ): Promise<OperationResult<MarketplaceProduct>> {
    try {
      const response = await this.apiClient.get(`/products/${productId}`);

      if (response.status === 200 && response.data) {
        return this.createSuccessResult(
          this.mapSuperbalistProduct(response.data),
        );
      } else {
        return this.createErrorResult(
          'PRODUCT_NOT_FOUND',
          `Product with ID ${productId} not found on Superbalist`,
        );
      }
    } catch (error) {
      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        return this.createErrorResult(
          'RATE_LIMIT_EXCEEDED',
          'Superbalist API rate limit exceeded, please try again later',
          { retryAfter: error.response.headers['retry-after'] || '60' },
        );
      }

      return this.createErrorResult(
        'API_ERROR',
        `Failed to fetch product from Superbalist: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Get a product by its SKU
   */
  protected async getProductBySkuInternal(
    sku: string,
  ): Promise<OperationResult<MarketplaceProduct>> {
    try {
      const response = await this.apiClient.get('/products', {
        params: { sku },
      });

      if (response.status === 200 && response.data?.data?.length > 0) {
        return this.createSuccessResult(
          this.mapSuperbalistProduct(response.data.data[0]),
        );
      } else {
        return this.createErrorResult(
          'PRODUCT_NOT_FOUND',
          `Product with SKU ${sku} not found on Superbalist`,
        );
      }
    } catch (error) {
      return this.createErrorResult(
        'API_ERROR',
        `Failed to fetch product by SKU from Superbalist: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Get multiple products by their SKUs
   */
  protected async getProductsBySkusInternal(
    skus: string[],
  ): Promise<OperationResult<MarketplaceProduct[]>> {
    try {
      // Superbalist API has a limit on query parameter length
      // For many SKUs, we need to make multiple requests
      const batchSize = 20;
      const results: MarketplaceProduct[] = [];

      for (let i = 0; i < skus.length; i += batchSize) {
        const skuBatch = skus.slice(i, i + batchSize);

        const response = await this.apiClient.get('/products', {
          params: { skus: skuBatch.join(',') },
        });

        if (response.status === 200 && Array.isArray(response.data?.data)) {
          const mappedProducts = response.data.data.map((product: any) =>
            this.mapSuperbalistProduct(product),
          );
          results.push(...mappedProducts);
        }
      }

      // Check which SKUs were not found
      const foundSkus = results.map((p) => p.sku);
      const missingSkus = skus.filter((sku) => !foundSkus.includes(sku));

      if (missingSkus.length > 0) {
        return this.createPartialResult(
          results,
          'SOME_PRODUCTS_NOT_FOUND',
          `${missingSkus.length} products not found on Superbalist`,
          { missingSkus },
        );
      }

      return this.createSuccessResult(results);
    } catch (error) {
      return this.createErrorResult(
        'API_ERROR',
        `Failed to fetch products by SKUs from Superbalist: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Get products with pagination
   */
  protected async getProductsInternal(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<MarketplaceProduct>> {
    try {
      const response = await this.apiClient.get('/products', {
        params: {
          page: (options.page || 0) + 1, // Superbalist uses 1-based pagination
          limit: options.pageSize || 20,
          sort_by: options.sortBy || 'created_at',
          sort_direction: options.sortDirection || 'desc',
        },
      });

      if (response.status === 200 && response.data) {
        const products = Array.isArray(response.data.data)
          ? response.data.data.map((product: any) =>
              this.mapSuperbalistProduct(product),
            )
          : [];

        return {
          data: products,
          pagination: {
            page: options.page || 0,
            pageSize: options.pageSize || 20,
            totalItems: response.data.meta?.total || products.length,
            totalPages: response.data.meta?.last_page || 1,
            hasNextPage:
              (response.data.meta?.current_page || 1) <
              (response.data.meta?.last_page || 1),
          },
        };
      } else {
        return {
          data: [],
          pagination: {
            page: options.page || 0,
            pageSize: options.pageSize || 20,
            hasNextPage: false,
          },
        };
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch products from Superbalist: ${error.message}`,
        error.stack,
      );

      // Return empty response on error
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
   * Get an order by its ID
   */
  protected async getOrderByIdInternal(
    id: string,
  ): Promise<OperationResult<MarketplaceOrder>> {
    try {
      const response = await this.apiClient.get(`/orders/${id}`);

      if (response.status === 200 && response.data) {
        return this.createSuccessResult(
          this.mapSuperbalistOrder(response.data),
        );
      } else {
        return this.createErrorResult(
          'ORDER_NOT_FOUND',
          `Order with ID ${id} not found on Superbalist`,
        );
      }
    } catch (error) {
      return this.createErrorResult(
        'API_ERROR',
        `Failed to fetch order from Superbalist: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Get recent orders from a specific date
   */
  protected async getRecentOrdersInternal(
    sinceDate: Date,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<MarketplaceOrder>> {
    try {
      const response = await this.apiClient.get('/orders', {
        params: {
          page: (options.page || 0) + 1, // Superbalist uses 1-based pagination
          limit: options.pageSize || 20,
          sort_by: options.sortBy || 'created_at',
          sort_direction: options.sortDirection || 'desc',
          created_after: sinceDate.toISOString(),
        },
      });

      if (response.status === 200 && response.data) {
        const orders = Array.isArray(response.data.data)
          ? response.data.data.map((order: any) =>
              this.mapSuperbalistOrder(order),
            )
          : [];

        return {
          data: orders,
          pagination: {
            page: options.page || 0,
            pageSize: options.pageSize || 20,
            totalItems: response.data.meta?.total || orders.length,
            totalPages: response.data.meta?.last_page || 1,
            hasNextPage:
              (response.data.meta?.current_page || 1) <
              (response.data.meta?.last_page || 1),
          },
        };
      } else {
        return {
          data: [],
          pagination: {
            page: options.page || 0,
            pageSize: options.pageSize || 20,
            hasNextPage: false,
          },
        };
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch recent orders from Superbalist: ${error.message}`,
        error.stack,
      );

      // Return empty response on error
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
   * Get all orders with pagination
   */
  protected async getOrdersInternal(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<MarketplaceOrder>> {
    try {
      const response = await this.apiClient.get('/orders', {
        params: {
          page: (options.page || 0) + 1, // Superbalist uses 1-based pagination
          limit: options.pageSize || 20,
          sort_by: options.sortBy || 'created_at',
          sort_direction: options.sortDirection || 'desc',
        },
      });

      if (response.status === 200 && response.data) {
        const orders = Array.isArray(response.data.data)
          ? response.data.data.map((order: any) =>
              this.mapSuperbalistOrder(order),
            )
          : [];

        return {
          data: orders,
          pagination: {
            page: options.page || 0,
            pageSize: options.pageSize || 20,
            totalItems: response.data.meta?.total || orders.length,
            totalPages: response.data.meta?.last_page || 1,
            hasNextPage:
              (response.data.meta?.current_page || 1) <
              (response.data.meta?.last_page || 1),
          },
        };
      } else {
        return {
          data: [],
          pagination: {
            page: options.page || 0,
            pageSize: options.pageSize || 20,
            hasNextPage: false,
          },
        };
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch orders from Superbalist: ${error.message}`,
        error.stack,
      );

      // Return empty response on error
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
   * Acknowledge receipt of an order
   */
  protected async acknowledgeOrderInternal(
    orderId: string,
  ): Promise<OperationResult<OrderAcknowledgment>> {
    try {
      const response = await this.apiClient.post(
        `/orders/${orderId}/acknowledge`,
      );

      if (response.status === 200) {
        return this.createSuccessResult({
          orderId,
          success: true,
          timestamp: new Date(),
          marketplaceReference:
            response.data?.reference || `SPBL-ACK-${orderId}`,
        });
      } else {
        return this.createErrorResult(
          'ACKNOWLEDGMENT_FAILED',
          `Failed to acknowledge order ${orderId} on Superbalist: ${response.statusText}`,
        );
      }
    } catch (error) {
      return this.createErrorResult(
        'API_ERROR',
        `Failed to acknowledge order on Superbalist: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Update stock levels for one or more products
   */
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
    try {
      // Prepare the update request - Superbalist API accepts batch updates
      const updateData = updates.map((item) => ({
        sku: item.sku,
        stock: item.stockLevel,
        warehouse_id: item.locationId || 'default',
      }));

      const response = await this.apiClient.post('/products/stock', {
        updates: updateData,
      });

      if (response.status === 200 && response.data) {
        // Parse response to determine which updates succeeded
        const successful: string[] = [];
        const failed: Array<{ sku: string; reason: string }> = [];

        // Check each update status in the response
        if (Array.isArray(response.data.results)) {
          response.data.results.forEach((result: any) => {
            if (result.success) {
              successful.push(result.sku);
            } else {
              failed.push({
                sku: result.sku,
                reason: result.message || 'Unknown error',
              });
            }
          });
        }

        return this.createSuccessResult({
          successful,
          failed,
        });
      } else {
        return this.createErrorResult(
          'STOCK_UPDATE_FAILED',
          'Failed to update stock levels on Superbalist',
          response,
        );
      }
    } catch (error) {
      // If the error contains details about which updates failed
      if (
        error.response?.data?.failed &&
        Array.isArray(error.response.data.failed)
      ) {
        const failedSkus = error.response.data.failed.map((f: any) => ({
          sku: f.sku,
          reason: f.message || 'Update failed',
        }));

        const allSkus = updates.map((u) => u.sku);
        const successfulSkus = allSkus.filter(
          (sku) => !failedSkus.some((f: { sku: string }) => f.sku === sku),
        );

        return this.createPartialResult(
          { successful: successfulSkus, failed: failedSkus },
          'PARTIAL_UPDATE',
          `Some stock updates failed: ${error.message}`,
          error,
        );
      }

      return this.createErrorResult(
        'API_ERROR',
        `Failed to update stock levels on Superbalist: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Update prices for one or more products
   */
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
    try {
      // Prepare the update request
      const updateData = updates.map((item) => ({
        sku: item.sku,
        price: item.price,
        compare_at_price: item.compareAtPrice,
        currency: item.currency || 'ZAR', // Default to South African Rand
      }));

      const response = await this.apiClient.post('/products/prices', {
        updates: updateData,
      });

      if (response.status === 200 && response.data) {
        // Parse response to determine which updates succeeded
        const successful: string[] = [];
        const failed: Array<{ sku: string; reason: string }> = [];

        // Check each update status in the response
        if (Array.isArray(response.data.results)) {
          response.data.results.forEach((result: any) => {
            if (result.success) {
              successful.push(result.sku);
            } else {
              failed.push({
                sku: result.sku,
                reason: result.message || 'Unknown error',
              });
            }
          });
        }

        return this.createSuccessResult({
          successful,
          failed,
        });
      } else {
        return this.createErrorResult(
          'PRICE_UPDATE_FAILED',
          'Failed to update prices on Superbalist',
          response,
        );
      }
    } catch (error) {
      // If the error contains details about which updates failed
      if (
        error.response?.data?.failed &&
        Array.isArray(error.response.data.failed)
      ) {
        const failedSkus = error.response.data.failed.map((f: any) => ({
          sku: f.sku,
          reason: f.message || 'Update failed',
        }));

        const allSkus = updates.map((u) => u.sku);
        const successfulSkus = allSkus.filter(
          (sku) => !failedSkus.some((f: { sku: string }) => f.sku === sku),
        );

        return this.createPartialResult(
          { successful: successfulSkus, failed: failedSkus },
          'PARTIAL_UPDATE',
          `Some price updates failed: ${error.message}`,
          error,
        );
      }

      return this.createErrorResult(
        'API_ERROR',
        `Failed to update prices on Superbalist: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Create a partial result when some operations succeeded and some failed
   */
  private createPartialResult<T>(
    data: T,
    code: string,
    message: string,
    details?: any,
  ): OperationResult<T> {
    return {
      success: true, // Still marked as success but with partial results
      data,
      error: {
        code,
        message,
        details,
      },
    };
  }

  /**
   * Handle API errors with additional network context
   */
  private handleError(error: any, context: string): OperationResult<any> {
    // Add network awareness to error handling
    const errorType = this.determineErrorType(error);

    let errorMessage = `Error in ${context}: ${error.message}`;
    const errorDetails = {
      originalError: error,
      context,
    };

    // Check for South African network conditions like load shedding
    if (error.isLoadShedding) {
      errorMessage = `Operation failed due to possible load shedding: ${error.message}`;
      return this.createErrorResult(
        'LOAD_SHEDDING_ERROR',
        errorMessage,
        errorDetails,
      );
    }

    // Handle different types of errors with appropriate error codes
    return this.createErrorResult(
      this.getErrorCodeForType(errorType),
      errorMessage,
      errorDetails,
    );
  }

  /**
   * Map an error to a connector error type
   */
  private determineErrorType(error: any): ConnectorErrorType {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return ConnectorErrorType.TIMEOUT;
    }

    if (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND'
    ) {
      return ConnectorErrorType.NETWORK;
    }

    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        return ConnectorErrorType.AUTHENTICATION;
      }
      if (status === 404) {
        return ConnectorErrorType.NOT_FOUND;
      }
      if (status === 422) {
        return ConnectorErrorType.VALIDATION;
      }
      if (status === 429) {
        return ConnectorErrorType.RATE_LIMIT;
      }
      if (status >= 500) {
        return ConnectorErrorType.SERVER_ERROR;
      }
    }

    return ConnectorErrorType.UNKNOWN;
  }

  /**
   * Map ConnectorErrorType to an API-specific error code
   */
  private getErrorCodeForType(type: ConnectorErrorType): string {
    switch (type) {
      case ConnectorErrorType.AUTHENTICATION:
        return 'AUTH_ERROR';
      case ConnectorErrorType.AUTHORIZATION:
        return 'PERMISSION_DENIED';
      case ConnectorErrorType.RATE_LIMIT:
        return 'RATE_LIMIT_EXCEEDED';
      case ConnectorErrorType.SERVER_ERROR:
        return 'SERVER_ERROR';
      case ConnectorErrorType.NETWORK:
        return 'NETWORK_ERROR';
      case ConnectorErrorType.TIMEOUT:
        return 'TIMEOUT_ERROR';
      case ConnectorErrorType.VALIDATION:
        return 'VALIDATION_ERROR';
      case ConnectorErrorType.NOT_FOUND:
        return 'NOT_FOUND';
      case ConnectorErrorType.UNSUPPORTED:
        return 'UNSUPPORTED_OPERATION';
      case ConnectorErrorType.LOAD_SHEDDING:
        return 'LOAD_SHEDDING_ERROR';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  /**
   * Map Superbalist product data to standardized MarketplaceProduct format
   */
  private mapSuperbalistProduct(superbalistProduct: any): MarketplaceProduct {
    return {
      id: superbalistProduct.id.toString(),
      sku: superbalistProduct.sku,
      name: superbalistProduct.name,
      description: superbalistProduct.description || '',
      price: parseFloat(superbalistProduct.price),
      compareAtPrice: superbalistProduct.compare_at_price
        ? parseFloat(superbalistProduct.compare_at_price)
        : undefined,
      currency: superbalistProduct.currency || 'ZAR',
      stockLevel: superbalistProduct.stock || 0,
      status: this.mapProductStatus(superbalistProduct.status),
      images: Array.isArray(superbalistProduct.images)
        ? superbalistProduct.images.map((img: any) => img.url)
        : [],
      categories: Array.isArray(superbalistProduct.categories)
        ? superbalistProduct.categories.map((cat: any) => cat.name)
        : [],
      attributes: superbalistProduct.attributes || {},
      marketplaceUrl: superbalistProduct.url,
      createdAt: new Date(superbalistProduct.created_at),
      updatedAt: new Date(superbalistProduct.updated_at),
    };
  }

  /**
   * Map Superbalist order data to standardized MarketplaceOrder format
   */
  private mapSuperbalistOrder(superbalistOrder: any): MarketplaceOrder {
    return {
      id: superbalistOrder.id.toString(),
      marketplaceOrderId:
        superbalistOrder.reference || superbalistOrder.id.toString(),
      status: this.mapOrderStatus(superbalistOrder.status),
      createdAt: new Date(superbalistOrder.created_at),
      updatedAt: new Date(superbalistOrder.updated_at),
      totalPrice: parseFloat(superbalistOrder.total),
      subtotalPrice: parseFloat(superbalistOrder.subtotal),
      totalShipping: parseFloat(superbalistOrder.shipping_cost),
      totalTax: parseFloat(superbalistOrder.tax_amount),
      currency: superbalistOrder.currency || 'ZAR',
      customerName:
        `${superbalistOrder.customer?.first_name || ''} ${superbalistOrder.customer?.last_name || ''}`.trim(),
      customerEmail: superbalistOrder.customer?.email,
      items: Array.isArray(superbalistOrder.items)
        ? superbalistOrder.items.map((item: any) => ({
            id: item.id.toString(),
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price),
            totalPrice: parseFloat(item.total),
          }))
        : [],
      shippingAddress: superbalistOrder.shipping_address
        ? {
            name: `${superbalistOrder.shipping_address.first_name || ''} ${superbalistOrder.shipping_address.last_name || ''}`.trim(),
            address1: superbalistOrder.shipping_address.address1,
            address2: superbalistOrder.shipping_address.address2,
            city: superbalistOrder.shipping_address.city,
            province: superbalistOrder.shipping_address.province,
            zip: superbalistOrder.shipping_address.postal_code,
            country: superbalistOrder.shipping_address.country_code || 'ZA',
            phone: superbalistOrder.shipping_address.phone,
          }
        : undefined,
      billingAddress: superbalistOrder.billing_address
        ? {
            name: `${superbalistOrder.billing_address.first_name || ''} ${superbalistOrder.billing_address.last_name || ''}`.trim(),
            address1: superbalistOrder.billing_address.address1,
            address2: superbalistOrder.billing_address.address2,
            city: superbalistOrder.billing_address.city,
            province: superbalistOrder.billing_address.province,
            zip: superbalistOrder.billing_address.postal_code,
            country: superbalistOrder.billing_address.country_code || 'ZA',
            phone: superbalistOrder.billing_address.phone,
          }
        : undefined,
      // Extra superbalist-specific fields
      fulfillmentStatus: superbalistOrder.fulfillment_status,
      financialStatus: superbalistOrder.payment_status,
      fulfillments: Array.isArray(superbalistOrder.fulfillments)
        ? superbalistOrder.fulfillments.map((f: any) => ({
            id: f.id.toString(),
            status: f.status,
            trackingNumber: f.tracking_number,
            trackingUrl: f.tracking_url,
            createdAt: new Date(f.created_at),
          }))
        : [],
    };
  }

  /**
   * Map Superbalist product status to standardized format
   */
  private mapProductStatus(
    status: string,
  ): 'active' | 'inactive' | 'pending' | 'rejected' {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'published':
        return 'active';
      case 'inactive':
      case 'unpublished':
        return 'inactive';
      case 'draft':
      case 'pending':
        return 'pending';
      case 'deleted':
      case 'archived':
      case 'rejected':
        return 'rejected';
      default:
        return 'inactive';
    }
  }

  /**
   * Map Superbalist order status to standardized format
   */
  private mapOrderStatus(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'pending';
      case 'processing':
        return 'processing';
      case 'shipped':
      case 'in_transit':
        return 'shipped';
      case 'delivered':
        return 'delivered';
      case 'cancelled':
        return 'cancelled';
      case 'refunded':
        return 'refunded';
      default:
        return status || 'pending';
    }
  }
}
