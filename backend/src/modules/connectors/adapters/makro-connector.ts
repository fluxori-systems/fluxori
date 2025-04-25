/**
 * Makro Marketplace Connector
 *
 * This connector integrates with the Makro Seller API to provide
 * marketplace functionality for the Fluxori platform.
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
  MarketplaceCategory,
  ConnectorErrorType,
} from '../interfaces/types';
import { NetworkAwareClient } from '../utils/network-aware-client';

/**
 * Makro API Connector
 *
 * This class implements the marketplace connector interface for Makro Seller API
 */
@Injectable()
export class MakroConnector extends BaseMarketplaceConnector {
  readonly connectorId: string = 'makro';
  readonly connectorName: string = 'Makro Seller API';

  private apiClient: NetworkAwareClient;
  private baseUrl: string = 'https://seller-api.makro.co.za/v1';
  private apiKey: string;
  private sellerId: string;
  private organizationId: string;

  constructor() {
    super('MakroConnector');
  }

  /**
   * Internal initialization implementation
   */
  protected async initializeInternal(
    credentials: ConnectorCredentials,
  ): Promise<void> {
    if (!credentials.apiKey || !credentials.sellerId) {
      throw new Error('Makro API requires both apiKey and sellerId');
    }

    this.apiKey = credentials.apiKey;
    this.sellerId = credentials.sellerId;
    this.organizationId = credentials.organizationId || '';

    // Initialize network-aware client with South African optimizations
    this.apiClient = new NetworkAwareClient(this.baseUrl, {
      timeout: 30000,
      headers: {
        'X-API-Key': this.apiKey,
        'X-Seller-ID': this.sellerId,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Configure South African specific optimizations
    this.apiClient.enableLoadSheddingResilience = true;
    this.apiClient.enableLowBandwidthMode = true;
    this.apiClient.enableRegionalCaching = true;

    this.logger.log('Makro connector initialized');
  }

  /**
   * Internal connection test implementation
   */
  protected async testConnectionInternal(): Promise<ConnectionStatus> {
    try {
      // Test network quality first - important for South African conditions
      const networkStatus = await this.checkNetworkStatus();

      // For now, return a mock successful response
      // In a real implementation, this would make an API call to verify credentials
      return {
        connected: true,
        quality: networkStatus.quality,
        message: 'Connection to Makro API successful',
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Makro connection test failed: ${error.message}`,
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
   * Get rate limit status
   */
  async getRateLimitStatus(): Promise<{
    remaining: number;
    reset: Date;
    limit: number;
  }> {
    // For now, return mock rate limit data
    // In a real implementation, this would make an API call to get rate limit status
    return {
      remaining: 800,
      limit: 800,
      reset: new Date(Date.now() + 3600000), // 1 hour from now
    };
  }

  // Base implementation of required methods from BaseMarketplaceConnector

  protected async getProductByIdInternal(
    productId: string,
  ): Promise<OperationResult<MarketplaceProduct>> {
    try {
      // For now, return mock product data
      // In a real implementation, this would make an API call to fetch the product
      return this.createSuccessResult({
        id: productId,
        sku: `MAKRO-${productId}`,
        name: 'Makro Product',
        description: 'This is a placeholder for the Makro API integration',
        price: 199.99,
        currency: 'ZAR',
        stockLevel: 75,
        status: 'active' as 'active' | 'inactive' | 'pending' | 'rejected',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      return this.handleError(error, `getProductById(${productId})`);
    }
  }

  protected async getProductBySkuInternal(
    sku: string,
  ): Promise<OperationResult<MarketplaceProduct>> {
    try {
      // For now, return mock product data
      // In a real implementation, this would make an API call to fetch the product
      return this.createSuccessResult({
        id: `ID-${sku}`,
        sku: sku,
        name: 'Makro Product',
        description: 'This is a placeholder for the Makro API integration',
        price: 199.99,
        currency: 'ZAR',
        stockLevel: 75,
        status: 'active' as 'active' | 'inactive' | 'pending' | 'rejected',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      return this.handleError(error, `getProductBySku(${sku})`);
    }
  }

  protected async getProductsBySkusInternal(
    skus: string[],
  ): Promise<OperationResult<MarketplaceProduct[]>> {
    try {
      // For now, return mock product data
      // In a real implementation, this would make an API call to fetch the products
      const products = skus.map((sku) => ({
        id: `ID-${sku}`,
        sku: sku,
        name: 'Makro Product',
        description: 'This is a placeholder for the Makro API integration',
        price: 199.99,
        currency: 'ZAR',
        stockLevel: 75,
        status: 'active' as 'active' | 'inactive' | 'pending' | 'rejected',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      return this.createSuccessResult(products);
    } catch (error) {
      return this.handleError(error, `getProductsBySkus(${skus.length} SKUs)`);
    }
  }

  protected async getProductsInternal(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<MarketplaceProduct>> {
    try {
      // For now, return mock product data
      // In a real implementation, this would make an API call to fetch the products
      const demoProducts = Array(options.pageSize || 10)
        .fill(0)
        .map((_, i) => ({
          id: `ID-${i + (options.page || 0) * (options.pageSize || 10)}`,
          sku: `MAKRO-${i + (options.page || 0) * (options.pageSize || 10)}`,
          name: `Makro Product ${i}`,
          description: 'This is a placeholder for the Makro API integration',
          price: 199.99,
          currency: 'ZAR',
          stockLevel: 75,
          status: 'active' as 'active' | 'inactive' | 'pending' | 'rejected',
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

      return {
        data: demoProducts,
        pagination: {
          page: options.page || 0,
          pageSize: options.pageSize || 10,
          totalItems: 250,
          totalPages: 25,
          hasNextPage: (options.page || 0) < 24,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch products from Makro: ${error.message}`,
        error.stack,
      );

      // Return empty response on error
      return {
        data: [],
        pagination: {
          page: options.page || 0,
          pageSize: options.pageSize || 10,
          hasNextPage: false,
        },
      };
    }
  }

  protected async getOrderByIdInternal(
    id: string,
  ): Promise<OperationResult<MarketplaceOrder>> {
    try {
      // For now, return mock order data
      // In a real implementation, this would make an API call to fetch the order
      return this.createSuccessResult({
        id: id,
        marketplaceOrderId: `MAKRO-${id}`,
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date(),
        totalPrice: 399.99,
        subtotalPrice: 379.99,
        currency: 'ZAR',
        customerName: 'Thomas Johnson',
        customerEmail: 'thomas.johnson@example.com',
        items: [
          {
            id: '1',
            sku: 'MAKRO-1',
            name: 'Demo Makro Product',
            quantity: 2,
            price: 199.99,
            totalPrice: 399.98,
          },
        ],
        shippingAddress: {
          name: 'Thomas Johnson',
          address1: '789 Main Road',
          city: 'Pretoria',
          zip: '0001',
          country: 'ZA',
          province: 'Gauteng',
        },
      });
    } catch (error) {
      return this.handleError(error, `getOrderById(${id})`);
    }
  }

  protected async getRecentOrdersInternal(
    sinceDate: Date,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<MarketplaceOrder>> {
    try {
      // For now, return mock order data
      // In a real implementation, this would make an API call to fetch the orders
      const demoOrders = Array(options.pageSize || 10)
        .fill(0)
        .map((_, i) => ({
          id: `${i + (options.page || 0) * (options.pageSize || 10)}`,
          marketplaceOrderId: `MAKRO-${i + (options.page || 0) * (options.pageSize || 10)}`,
          status: 'processing',
          createdAt: new Date(
            Math.max(sinceDate.getTime(), Date.now() - i * 86400000),
          ), // Each order 1 day apart, but not before sinceDate
          updatedAt: new Date(
            Math.max(sinceDate.getTime(), Date.now() - i * 86400000 + 3600000),
          ), // Updated 1 hour after creation
          totalPrice: 399.99,
          subtotalPrice: 379.99,
          currency: 'ZAR',
          customerName: 'Thomas Johnson',
          customerEmail: 'thomas.johnson@example.com',
          items: [
            {
              id: '1',
              sku: 'MAKRO-1',
              name: 'Demo Makro Product',
              quantity: 2,
              price: 199.99,
              totalPrice: 399.98,
            },
          ],
          shippingAddress: {
            name: 'Thomas Johnson',
            address1: '789 Main Road',
            city: 'Pretoria',
            zip: '0001',
            country: 'ZA',
            province: 'Gauteng',
          },
        }));

      return {
        data: demoOrders,
        pagination: {
          page: options.page || 0,
          pageSize: options.pageSize || 10,
          totalItems: 150,
          totalPages: 15,
          hasNextPage: (options.page || 0) < 14,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch recent orders from Makro: ${error.message}`,
        error.stack,
      );

      // Return empty response on error
      return {
        data: [],
        pagination: {
          page: options.page || 0,
          pageSize: options.pageSize || 10,
          hasNextPage: false,
        },
      };
    }
  }

  protected async getOrdersInternal(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<MarketplaceOrder>> {
    try {
      // For now, return mock order data
      // In a real implementation, this would make an API call to fetch the orders
      const demoOrders = Array(options.pageSize || 10)
        .fill(0)
        .map((_, i) => ({
          id: `${i + (options.page || 0) * (options.pageSize || 10)}`,
          marketplaceOrderId: `MAKRO-${i + (options.page || 0) * (options.pageSize || 10)}`,
          status: 'processing',
          createdAt: new Date(Date.now() - i * 86400000), // Each order 1 day apart
          updatedAt: new Date(Date.now() - i * 86400000 + 3600000), // Updated 1 hour after creation
          totalPrice: 399.99,
          subtotalPrice: 379.99,
          currency: 'ZAR',
          customerName: 'Thomas Johnson',
          customerEmail: 'thomas.johnson@example.com',
          items: [
            {
              id: '1',
              sku: 'MAKRO-1',
              name: 'Demo Makro Product',
              quantity: 2,
              price: 199.99,
              totalPrice: 399.98,
            },
          ],
          shippingAddress: {
            name: 'Thomas Johnson',
            address1: '789 Main Road',
            city: 'Pretoria',
            zip: '0001',
            country: 'ZA',
            province: 'Gauteng',
          },
        }));

      return {
        data: demoOrders,
        pagination: {
          page: options.page || 0,
          pageSize: options.pageSize || 10,
          totalItems: 150,
          totalPages: 15,
          hasNextPage: (options.page || 0) < 14,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch orders from Makro: ${error.message}`,
        error.stack,
      );

      // Return empty response on error
      return {
        data: [],
        pagination: {
          page: options.page || 0,
          pageSize: options.pageSize || 10,
          hasNextPage: false,
        },
      };
    }
  }

  protected async acknowledgeOrderInternal(
    orderId: string,
  ): Promise<OperationResult<OrderAcknowledgment>> {
    try {
      // For now, return mock acknowledgment data
      // In a real implementation, this would make an API call to acknowledge the order
      return this.createSuccessResult({
        orderId: orderId,
        success: true,
        timestamp: new Date(),
        marketplaceReference: `MAKRO-ACK-${orderId}`,
      });
    } catch (error) {
      return this.handleError(error, `acknowledgeOrder(${orderId})`);
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
    try {
      // For now, return mock success data
      // In a real implementation, this would make an API call to update stock levels
      return this.createSuccessResult({
        successful: updates.map((update) => update.sku),
        failed: [],
      });
    } catch (error) {
      return this.handleError(error, `updateStock(${updates.length} items)`);
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
    try {
      // For now, return mock success data
      // In a real implementation, this would make an API call to update prices
      return this.createSuccessResult({
        successful: updates.map((update) => update.sku),
        failed: [],
      });
    } catch (error) {
      return this.handleError(error, `updatePrices(${updates.length} items)`);
    }
  }

  // Makro-specific methods

  /**
   * Add product to promotion
   */
  async addToPromotion(
    productSku: string,
    promotionData: {
      promotionId: string;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      startDate: Date;
      endDate: Date;
    },
  ): Promise<OperationResult<{ productSku: string; promotionId: string }>> {
    this.checkInitialized();
    this.checkCircuitBreaker();

    try {
      // For now, return mock success data
      // In a real implementation, this would make an API call to add the product to promotion
      return this.createSuccessResult({
        productSku,
        promotionId: promotionData.promotionId,
      });
    } catch (error) {
      return this.handleError(error, `addToPromotion(${productSku})`);
    }
  }

  /**
   * Check if product is eligible for Makro store pickup
   */
  async checkStorePickupEligibility(
    productSku: string,
    storeId?: string,
  ): Promise<
    OperationResult<{
      eligible: boolean;
      availableStores: Array<{
        storeId: string;
        storeName: string;
        region: string;
        stockLevel: number;
      }>;
    }>
  > {
    this.checkInitialized();
    this.checkCircuitBreaker();

    try {
      // For now, return mock eligibility data
      // In a real implementation, this would make an API call to check eligibility
      return this.createSuccessResult({
        eligible: true,
        availableStores: [
          {
            storeId: 'JHB-001',
            storeName: 'Makro Woodmead',
            region: 'Gauteng',
            stockLevel: 15,
          },
          {
            storeId: 'CPT-002',
            storeName: 'Makro Cape Gate',
            region: 'Western Cape',
            stockLevel: 8,
          },
          {
            storeId: 'DBN-001',
            storeName: 'Makro Springfield',
            region: 'KwaZulu-Natal',
            stockLevel: 10,
          },
        ],
      });
    } catch (error) {
      return this.handleError(
        error,
        `checkStorePickupEligibility(${productSku})`,
      );
    }
  }

  /**
   * Get a list of Makro store locations
   */
  async getStoreLocations(): Promise<
    OperationResult<
      Array<{
        storeId: string;
        name: string;
        region: string;
        address: string;
        city: string;
        province: string;
        postalCode: string;
        latitude: number;
        longitude: number;
        openingHours: string;
      }>
    >
  > {
    this.checkInitialized();
    this.checkCircuitBreaker();

    try {
      // For now, return mock store location data
      // In a real implementation, this would make an API call to fetch store locations
      return this.createSuccessResult([
        {
          storeId: 'JHB-001',
          name: 'Makro Woodmead',
          region: 'Gauteng',
          address: '140 Western Service Road',
          city: 'Woodmead',
          province: 'Gauteng',
          postalCode: '2191',
          latitude: -26.0304,
          longitude: 28.0568,
          openingHours: 'Mon-Fri: 9am-6pm, Sat: 9am-5pm, Sun: 9am-3pm',
        },
        {
          storeId: 'CPT-002',
          name: 'Makro Cape Gate',
          region: 'Western Cape',
          address: 'Corner Okavango & Catharina St',
          city: 'Brackenfell',
          province: 'Western Cape',
          postalCode: '7560',
          latitude: -33.8692,
          longitude: 18.7041,
          openingHours: 'Mon-Fri: 9am-6pm, Sat: 9am-5pm, Sun: 9am-3pm',
        },
        {
          storeId: 'DBN-001',
          name: 'Makro Springfield',
          region: 'KwaZulu-Natal',
          address: '1 Umgeni Road',
          city: 'Springfield',
          province: 'KwaZulu-Natal',
          postalCode: '4091',
          latitude: -29.8217,
          longitude: 31.0252,
          openingHours: 'Mon-Fri: 9am-6pm, Sat: 9am-5pm, Sun: 9am-3pm',
        },
      ]);
    } catch (error) {
      return this.handleError(error, 'getStoreLocations()');
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

    // Handle rate limiting specifically
    if (error.response?.status === 429) {
      return this.createErrorResult(
        'RATE_LIMIT_EXCEEDED',
        `Makro API rate limit exceeded: ${error.message}`,
        {
          retryAfter: error.response.headers['retry-after'] || '60',
          ...errorDetails,
        },
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
}
