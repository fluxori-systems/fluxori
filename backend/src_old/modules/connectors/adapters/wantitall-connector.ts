/**
 * Wantitall Marketplace Connector
 *
 * This connector integrates with the Wantitall API to provide
 * marketplace functionality for the Fluxori platform, focusing on
 * South African imports and international product sourcing.
 */

import { Injectable, Logger } from "@nestjs/common";
import { BaseMarketplaceConnector } from "./base-marketplace-connector";
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
} from "../interfaces/types";
import { NetworkAwareClient } from "../utils/network-aware-client";

/**
 * Wantitall API Connector
 *
 * Implementation of marketplace connector interface for Wantitall API
 * with South African market optimizations
 */
@Injectable()
export class WantitallConnector extends BaseMarketplaceConnector {
  readonly connectorId: string = "wantitall";
  readonly connectorName: string = "Wantitall Marketplace API";

  private apiClient: NetworkAwareClient;
  private baseUrl: string = "https://api.wantitall.co.za/v2";
  private apiKey: string;
  private sellerId: string;
  private organizationId: string;

  constructor() {
    super("WantitallConnector");
  }

  /**
   * Internal initialization implementation for Wantitall API
   * @param credentials API credentials
   */
  protected async initializeInternal(
    credentials: ConnectorCredentials,
  ): Promise<void> {
    if (!credentials.apiKey || !credentials.sellerId) {
      throw new Error("Wantitall API requires both apiKey and sellerId");
    }

    this.apiKey = credentials.apiKey;
    this.sellerId = credentials.sellerId;
    this.organizationId = credentials.organizationId || "";

    // Initialize network-aware client with South African optimizations
    this.apiClient = new NetworkAwareClient(this.baseUrl, {
      timeout: 30000,
      headers: {
        "X-API-Key": this.apiKey,
        "X-Seller-ID": this.sellerId,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    // Configure South African specific optimizations
    this.apiClient.enableLoadSheddingResilience = true;
    this.apiClient.enableLowBandwidthMode = true;
    this.apiClient.enableRegionalCaching = true;

    this.logger.log("Wantitall connector initialized");
  }

  /**
   * Internal connection test implementation
   * Tests connectivity to Wantitall API with network quality assessment
   */
  protected async testConnectionInternal(): Promise<ConnectionStatus> {
    try {
      // Test network quality first - important for South African conditions
      const networkStatus = await this.checkNetworkStatus();

      // Make a lightweight API call to verify credentials
      const response = await this.apiClient.get("/seller/status", {
        timeout: 5000, // Short timeout for quick health check
      });

      if (response.status === 200) {
        return {
          connected: true,
          quality: networkStatus.quality,
          message: "Connection to Wantitall API successful",
          lastChecked: new Date(),
          details: {
            accountStatus: response.data?.status || "active",
            environment: response.data?.environment || "production",
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
        `Wantitall connection test failed: ${error.message}`,
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
   * Get rate limit status from Wantitall API
   * Monitors API quota to prevent throttling
   */
  async getRateLimitStatus(): Promise<{
    remaining: number;
    reset: Date;
    limit: number;
  }> {
    try {
      const response = await this.apiClient.get("/ratelimit");

      return {
        remaining: response.data?.remaining || 0,
        limit: response.data?.limit || 1000,
        reset: new Date(response.data?.reset_timestamp || Date.now() + 3600000),
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
   * Get a product by its Wantitall ID
   */
  protected async getProductByIdInternal(
    productId: string,
  ): Promise<OperationResult<MarketplaceProduct>> {
    try {
      const response = await this.apiClient.get(`/products/${productId}`);

      if (response.status === 200 && response.data) {
        return this.createSuccessResult(
          this.mapWantitallProduct(response.data),
        );
      } else {
        return this.createErrorResult(
          "PRODUCT_NOT_FOUND",
          `Product with ID ${productId} not found on Wantitall`,
        );
      }
    } catch (error) {
      return this.handleError(error, `getProductById(${productId})`);
    }
  }

  /**
   * Get a product by its SKU
   */
  protected async getProductBySkuInternal(
    sku: string,
  ): Promise<OperationResult<MarketplaceProduct>> {
    try {
      const response = await this.apiClient.get("/products", {
        params: { sku },
      });

      if (response.status === 200 && response.data?.items?.length > 0) {
        return this.createSuccessResult(
          this.mapWantitallProduct(response.data.items[0]),
        );
      } else {
        return this.createErrorResult(
          "PRODUCT_NOT_FOUND",
          `Product with SKU ${sku} not found on Wantitall`,
        );
      }
    } catch (error) {
      return this.handleError(error, `getProductBySku(${sku})`);
    }
  }

  /**
   * Get multiple products by their SKUs
   */
  protected async getProductsBySkusInternal(
    skus: string[],
  ): Promise<OperationResult<MarketplaceProduct[]>> {
    try {
      const response = await this.apiClient.post("/products/batch", {
        skus: skus,
      });

      if (response.status === 200 && response.data) {
        const products = Array.isArray(response.data.items)
          ? response.data.items.map((item: any) =>
              this.mapWantitallProduct(item),
            )
          : [];

        // Check which SKUs were not found
        const foundSkus = products.map((p: { sku: string }) => p.sku);
        const missingSkus = skus.filter((sku) => !foundSkus.includes(sku));

        if (missingSkus.length > 0) {
          return this.createPartialResult(
            products,
            "SOME_PRODUCTS_NOT_FOUND",
            `${missingSkus.length} products not found on Wantitall`,
            { missingSkus },
          );
        }

        return this.createSuccessResult(products);
      } else {
        return this.createErrorResult(
          "BATCH_FETCH_FAILED",
          "Failed to fetch products by SKUs from Wantitall",
        );
      }
    } catch (error) {
      return this.handleError(error, `getProductsBySkus(${skus.length} SKUs)`);
    }
  }

  /**
   * Get products with pagination
   */
  protected async getProductsInternal(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<MarketplaceProduct>> {
    try {
      const response = await this.apiClient.get("/products", {
        params: {
          page: options.page || 0,
          limit: options.pageSize || 20,
          sort_by: options.sortBy || "created_at",
          sort_dir: options.sortDirection || "desc",
        },
      });

      if (response.status === 200 && response.data) {
        const products = Array.isArray(response.data.items)
          ? response.data.items.map((item: any) =>
              this.mapWantitallProduct(item),
            )
          : [];

        return {
          data: products,
          pagination: {
            page: options.page || 0,
            pageSize: options.pageSize || 20,
            totalItems: response.data.total_items || products.length,
            totalPages: Math.ceil(
              (response.data.total_items || products.length) /
                (options.pageSize || 20),
            ),
            hasNextPage:
              ((options.page || 0) + 1) * (options.pageSize || 20) <
              (response.data.total_items || products.length),
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
        `Failed to fetch products from Wantitall: ${error.message}`,
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
        return this.createSuccessResult(this.mapWantitallOrder(response.data));
      } else {
        return this.createErrorResult(
          "ORDER_NOT_FOUND",
          `Order with ID ${id} not found on Wantitall`,
        );
      }
    } catch (error) {
      return this.handleError(error, `getOrderById(${id})`);
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
      const response = await this.apiClient.get("/orders", {
        params: {
          page: options.page || 0,
          limit: options.pageSize || 20,
          sort_by: options.sortBy || "created_at",
          sort_dir: options.sortDirection || "desc",
          created_after: sinceDate.toISOString(),
        },
      });

      if (response.status === 200 && response.data) {
        const orders = Array.isArray(response.data.items)
          ? response.data.items.map((item: any) => this.mapWantitallOrder(item))
          : [];

        return {
          data: orders,
          pagination: {
            page: options.page || 0,
            pageSize: options.pageSize || 20,
            totalItems: response.data.total_items || orders.length,
            totalPages: Math.ceil(
              (response.data.total_items || orders.length) /
                (options.pageSize || 20),
            ),
            hasNextPage:
              ((options.page || 0) + 1) * (options.pageSize || 20) <
              (response.data.total_items || orders.length),
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
        `Failed to fetch recent orders from Wantitall: ${error.message}`,
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
      const response = await this.apiClient.get("/orders", {
        params: {
          page: options.page || 0,
          limit: options.pageSize || 20,
          sort_by: options.sortBy || "created_at",
          sort_dir: options.sortDirection || "desc",
        },
      });

      if (response.status === 200 && response.data) {
        const orders = Array.isArray(response.data.items)
          ? response.data.items.map((item: any) => this.mapWantitallOrder(item))
          : [];

        return {
          data: orders,
          pagination: {
            page: options.page || 0,
            pageSize: options.pageSize || 20,
            totalItems: response.data.total_items || orders.length,
            totalPages: Math.ceil(
              (response.data.total_items || orders.length) /
                (options.pageSize || 20),
            ),
            hasNextPage:
              ((options.page || 0) + 1) * (options.pageSize || 20) <
              (response.data.total_items || orders.length),
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
        `Failed to fetch orders from Wantitall: ${error.message}`,
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
            response.data?.reference || `WIA-ACK-${orderId}`,
        });
      } else {
        return this.createErrorResult(
          "ACKNOWLEDGMENT_FAILED",
          `Failed to acknowledge order ${orderId} on Wantitall: ${response.statusText}`,
        );
      }
    } catch (error) {
      return this.handleError(error, `acknowledgeOrder(${orderId})`);
    }
  }

  /**
   * Update stock levels for one or more products
   * Implements specific Wantitall API requirements for stock updates
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
      // Prepare the update request - Wantitall API uses a specific format
      const updateData = {
        inventory_updates: updates.map((item) => ({
          sku: item.sku,
          quantity: item.stockLevel,
          warehouse: item.locationId || "default",
          update_type: "absolute", // Using absolute values instead of increments
        })),
      };

      const response = await this.apiClient.post(
        "/inventory/update",
        updateData,
      );

      if (response.status === 200 && response.data) {
        // Parse response to determine which updates succeeded
        const successful: string[] = [];
        const failed: Array<{ sku: string; reason: string }> = [];

        // Process results from the response
        if (Array.isArray(response.data.results)) {
          response.data.results.forEach((result: any) => {
            if (result.success) {
              successful.push(result.sku);
            } else {
              failed.push({
                sku: result.sku,
                reason: result.error || "Unknown error",
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
          "STOCK_UPDATE_FAILED",
          "Failed to update stock levels on Wantitall",
          response,
        );
      }
    } catch (error) {
      // Check for partial success information in error response
      if (
        error.response?.data?.results &&
        Array.isArray(error.response.data.results)
      ) {
        const results = error.response.data.results;
        const successful = results
          .filter((r: any) => r.success)
          .map((r: any) => r.sku);
        const failed = results
          .filter((r: any) => !r.success)
          .map((r: any) => ({
            sku: r.sku,
            reason: r.error || "Update failed",
          }));

        return this.createPartialResult(
          { successful, failed },
          "PARTIAL_UPDATE",
          `Some stock updates failed: ${error.message}`,
          error,
        );
      }

      return this.handleError(error, `updateStock(${updates.length} items)`);
    }
  }

  /**
   * Update prices for one or more products
   * Implements specific Wantitall API requirements for price updates
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
      // Prepare the update request - Wantitall API uses a specific format
      const updateData = {
        price_updates: updates.map((item) => ({
          sku: item.sku,
          price: item.price,
          msrp: item.compareAtPrice, // MSRP is Wantitall's equivalent of compareAtPrice
          currency_code: item.currency || "ZAR", // Default to South African Rand
        })),
      };

      const response = await this.apiClient.post("/pricing/update", updateData);

      if (response.status === 200 && response.data) {
        // Parse response to determine which updates succeeded
        const successful: string[] = [];
        const failed: Array<{ sku: string; reason: string }> = [];

        // Process results from the response
        if (Array.isArray(response.data.results)) {
          response.data.results.forEach((result: any) => {
            if (result.success) {
              successful.push(result.sku);
            } else {
              failed.push({
                sku: result.sku,
                reason: result.error || "Unknown error",
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
          "PRICE_UPDATE_FAILED",
          "Failed to update prices on Wantitall",
          response,
        );
      }
    } catch (error) {
      // Check for partial success information in error response
      if (
        error.response?.data?.results &&
        Array.isArray(error.response.data.results)
      ) {
        const results = error.response.data.results;
        const successful = results
          .filter((r: any) => r.success)
          .map((r: any) => r.sku);
        const failed = results
          .filter((r: any) => !r.success)
          .map((r: any) => ({
            sku: r.sku,
            reason: r.error || "Update failed",
          }));

        return this.createPartialResult(
          { successful, failed },
          "PARTIAL_UPDATE",
          `Some price updates failed: ${error.message}`,
          error,
        );
      }

      return this.handleError(error, `updatePrices(${updates.length} items)`);
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
        "LOAD_SHEDDING_ERROR",
        errorMessage,
        errorDetails,
      );
    }

    // Handle rate limiting specifically
    if (error.response?.status === 429) {
      return this.createErrorResult(
        "RATE_LIMIT_EXCEEDED",
        `Wantitall API rate limit exceeded: ${error.message}`,
        {
          retryAfter: error.response.headers["retry-after"] || "60",
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
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return ConnectorErrorType.TIMEOUT;
    }

    if (
      error.code === "ECONNRESET" ||
      error.code === "ETIMEDOUT" ||
      error.code === "ENOTFOUND"
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
        return "AUTH_ERROR";
      case ConnectorErrorType.AUTHORIZATION:
        return "PERMISSION_DENIED";
      case ConnectorErrorType.RATE_LIMIT:
        return "RATE_LIMIT_EXCEEDED";
      case ConnectorErrorType.SERVER_ERROR:
        return "SERVER_ERROR";
      case ConnectorErrorType.NETWORK:
        return "NETWORK_ERROR";
      case ConnectorErrorType.TIMEOUT:
        return "TIMEOUT_ERROR";
      case ConnectorErrorType.VALIDATION:
        return "VALIDATION_ERROR";
      case ConnectorErrorType.NOT_FOUND:
        return "NOT_FOUND";
      case ConnectorErrorType.UNSUPPORTED:
        return "UNSUPPORTED_OPERATION";
      case ConnectorErrorType.LOAD_SHEDDING:
        return "LOAD_SHEDDING_ERROR";
      default:
        return "UNKNOWN_ERROR";
    }
  }

  /**
   * Map Wantitall product data to standardized MarketplaceProduct format
   */
  private mapWantitallProduct(wantitallProduct: any): MarketplaceProduct {
    return {
      id: wantitallProduct.id.toString(),
      sku: wantitallProduct.sku,
      name: wantitallProduct.title || wantitallProduct.name,
      description: wantitallProduct.description || "",
      price: parseFloat(wantitallProduct.price),
      compareAtPrice: wantitallProduct.msrp
        ? parseFloat(wantitallProduct.msrp)
        : undefined,
      currency: wantitallProduct.currency_code || "ZAR",
      stockLevel: wantitallProduct.quantity || 0,
      status: this.mapProductStatus(wantitallProduct.status),
      images: Array.isArray(wantitallProduct.images)
        ? wantitallProduct.images.map((img: any) => img.url || img)
        : [],
      categories: Array.isArray(wantitallProduct.categories)
        ? wantitallProduct.categories.map((cat: any) => cat.name || cat)
        : [],
      attributes: wantitallProduct.attributes || {},
      marketplaceUrl: wantitallProduct.url || wantitallProduct.product_url,
      createdAt: new Date(
        wantitallProduct.created_at ||
          wantitallProduct.date_created ||
          Date.now(),
      ),
      updatedAt: new Date(
        wantitallProduct.updated_at ||
          wantitallProduct.date_modified ||
          Date.now(),
      ),
    };
  }

  /**
   * Map Wantitall order data to standardized MarketplaceOrder format
   */
  private mapWantitallOrder(wantitallOrder: any): MarketplaceOrder {
    // Handling both possible field naming conventions
    const shippingAddress =
      wantitallOrder.shipping_address || wantitallOrder.shipping;
    const billingAddress =
      wantitallOrder.billing_address || wantitallOrder.billing;
    const orderItems = wantitallOrder.items || wantitallOrder.line_items || [];

    return {
      id: wantitallOrder.id.toString(),
      marketplaceOrderId:
        wantitallOrder.reference ||
        wantitallOrder.order_number ||
        wantitallOrder.id.toString(),
      status: this.mapOrderStatus(wantitallOrder.status),
      createdAt: new Date(
        wantitallOrder.created_at || wantitallOrder.date_created || Date.now(),
      ),
      updatedAt: new Date(
        wantitallOrder.updated_at || wantitallOrder.date_modified || Date.now(),
      ),
      totalPrice: parseFloat(
        wantitallOrder.total || wantitallOrder.total_price || 0,
      ),
      subtotalPrice: parseFloat(
        wantitallOrder.subtotal || wantitallOrder.subtotal_price || 0,
      ),
      totalShipping: parseFloat(
        wantitallOrder.shipping_cost || wantitallOrder.shipping_price || 0,
      ),
      totalTax: parseFloat(
        wantitallOrder.tax_amount || wantitallOrder.tax || 0,
      ),
      currency:
        wantitallOrder.currency || wantitallOrder.currency_code || "ZAR",
      customerName:
        wantitallOrder.customer_name ||
        `${wantitallOrder.customer?.name || ""} ${wantitallOrder.customer?.surname || ""}`.trim(),
      customerEmail:
        wantitallOrder.customer_email || wantitallOrder.customer?.email,
      items: Array.isArray(orderItems)
        ? orderItems.map((item: any) => ({
            id: item.id.toString(),
            sku: item.sku,
            name: item.name || item.title,
            quantity: item.quantity,
            price: parseFloat(item.price || item.unit_price),
            totalPrice:
              parseFloat(item.total || item.quantity * item.price) || 0,
          }))
        : [],
      shippingAddress: shippingAddress
        ? {
            name:
              shippingAddress.name ||
              `${shippingAddress.first_name || ""} ${shippingAddress.last_name || ""}`.trim(),
            address1:
              shippingAddress.address1 || shippingAddress.address_line_1,
            address2:
              shippingAddress.address2 || shippingAddress.address_line_2,
            city: shippingAddress.city,
            province: shippingAddress.province || shippingAddress.state,
            zip: shippingAddress.postal_code || shippingAddress.zip,
            country: shippingAddress.country_code || "ZA",
            phone: shippingAddress.phone,
          }
        : undefined,
      billingAddress: billingAddress
        ? {
            name:
              billingAddress.name ||
              `${billingAddress.first_name || ""} ${billingAddress.last_name || ""}`.trim(),
            address1: billingAddress.address1 || billingAddress.address_line_1,
            address2: billingAddress.address2 || billingAddress.address_line_2,
            city: billingAddress.city,
            province: billingAddress.province || billingAddress.state,
            zip: billingAddress.postal_code || billingAddress.zip,
            country: billingAddress.country_code || "ZA",
            phone: billingAddress.phone,
          }
        : undefined,
      // Additional fields specific to Wantitall
      financialStatus: wantitallOrder.payment_status,
      fulfillmentStatus: wantitallOrder.fulfillment_status,
    };
  }

  /**
   * Map Wantitall product status to standardized format
   */
  private mapProductStatus(
    status: string,
  ): "active" | "inactive" | "pending" | "rejected" {
    switch (status?.toLowerCase()) {
      case "active":
      case "published":
      case "available":
        return "active";
      case "inactive":
      case "unpublished":
      case "unavailable":
        return "inactive";
      case "draft":
      case "pending":
        return "pending";
      case "deleted":
      case "archived":
      case "removed":
        return "rejected";
      default:
        return "inactive";
    }
  }

  /**
   * Map Wantitall order status to standardized format
   */
  private mapOrderStatus(status: string): string {
    switch (status?.toLowerCase()) {
      case "pending":
      case "awaiting_payment":
        return "pending";
      case "processing":
      case "in_process":
        return "processing";
      case "shipped":
      case "in_transit":
      case "dispatched":
        return "shipped";
      case "delivered":
      case "complete":
      case "completed":
        return "delivered";
      case "cancelled":
      case "canceled":
        return "cancelled";
      case "refunded":
      case "refund":
        return "refunded";
      case "on_hold":
        return "on_hold";
      default:
        return status || "pending";
    }
  }
}
