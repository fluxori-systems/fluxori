import {
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
  OrderFilterOptions
} from './types';

/**
 * Interface defining common functionality for all marketplace adapters.
 * All marketplace-specific adapters must implement this interface.
 */
export interface IMarketplaceAdapter {
  /**
   * The unique identifier for the marketplace (e.g., 'amazon', 'takealot', 'shopify')
   */
  readonly marketplaceId: string;
  
  /**
   * Human-readable name of the marketplace
   */
  readonly marketplaceName: string;

  /**
   * Initialize the adapter with marketplace credentials
   * @param credentials - Credentials required for authentication with the marketplace
   */
  initialize(credentials: MarketplaceCredentials): Promise<void>;

  /**
   * Test the connection to the marketplace API
   * @returns Connection status object with information about the connection
   */
  testConnection(): Promise<ConnectionStatus>;

  /**
   * Get the current API rate limit status
   * @returns Rate limit information
   */
  getRateLimitStatus(): Promise<{
    remaining: number;
    reset: Date;
    limit: number;
  }>;

  /**
   * Fetch a product by its SKU
   * @param sku - The SKU of the product
   * @returns Operation result containing the product if found
   */
  getProductBySku(sku: string): Promise<OperationResult<MarketplaceProduct>>;

  /**
   * Fetch a product by marketplace-specific ID
   * @param id - The marketplace-specific ID of the product
   * @returns Operation result containing the product if found
   */
  getProductById(id: string): Promise<OperationResult<MarketplaceProduct>>;

  /**
   * Fetch multiple products by their SKUs
   * @param skus - Array of SKUs to fetch
   * @returns Operation result containing an array of found products
   */
  getProductsBySkus(skus: string[]): Promise<OperationResult<MarketplaceProduct[]>>;

  /**
   * Fetch products with pagination and filtering
   * @param page - Page number (0-based)
   * @param pageSize - Number of items per page
   * @param filters - Optional filter options to apply
   * @returns Paginated response of products with token-based pagination support
   */
  getProducts(
    page: number,
    pageSize: number,
    filters?: ProductFilterOptions
  ): Promise<PaginatedResponse<MarketplaceProduct>>;

  /**
   * Update stock levels for one or more products
   * @param updates - Array of stock update payloads
   * @returns Operation result with success status and details
   */
  updateStock(updates: StockUpdatePayload[]): Promise<OperationResult<{
    successful: string[];
    failed: Array<{ sku: string, reason: string }>;
  }>>;

  /**
   * Update prices for one or more products
   * @param updates - Array of price update payloads
   * @returns Operation result with success status and details
   */
  updatePrices(updates: PriceUpdatePayload[]): Promise<OperationResult<{
    successful: string[];
    failed: Array<{ sku: string, reason: string }>;
  }>>;

  /**
   * Update status (active/inactive) for one or more products
   * @param updates - Array of status update payloads
   * @returns Operation result with success status and details
   */
  updateStatus(updates: StatusUpdatePayload[]): Promise<OperationResult<{
    successful: string[];
    failed: Array<{ sku: string, reason: string }>;
  }>>;

  /**
   * Fetch orders with filtering and pagination
   * @param page - Page number (0-based)
   * @param pageSize - Number of items per page
   * @param filters - Optional filter options to apply
   * @returns Paginated response of orders with token-based pagination support
   */
  getOrders(
    page: number,
    pageSize: number,
    filters?: OrderFilterOptions
  ): Promise<PaginatedResponse<MarketplaceOrder>>;
  
  /**
   * Fetch recent orders (legacy method, uses getOrders internally)
   * @param sinceDate - Fetch orders created after this date
   * @param page - Page number (0-based)
   * @param pageSize - Number of items per page
   * @returns Paginated response of orders
   */
  getRecentOrders(
    sinceDate: Date,
    page: number,
    pageSize: number
  ): Promise<PaginatedResponse<MarketplaceOrder>>;

  /**
   * Fetch an order by its marketplace-specific ID
   * @param id - The marketplace-specific order ID
   * @returns Operation result containing the order if found
   */
  getOrderById(id: string): Promise<OperationResult<MarketplaceOrder>>;

  /**
   * Acknowledge receipt of an order
   * @param orderId - The marketplace-specific order ID
   * @returns Operation result with acknowledgment details
   */
  acknowledgeOrder(orderId: string): Promise<OperationResult<OrderAcknowledgment>>;

  /**
   * Update order status
   * @param orderId - The marketplace-specific order ID
   * @param status - The new status
   * @param trackingInfo - Optional tracking information for shipping updates
   * @returns Operation result with success status
   */
  updateOrderStatus(
    orderId: string,
    status: string,
    trackingInfo?: {
      carrier: string;
      trackingNumber: string;
      shippedDate?: Date;
    }
  ): Promise<OperationResult<{ orderId: string }>>;

  /**
   * Get marketplace-specific categories
   * @param parentId - Optional parent category ID for hierarchical retrieval
   * @returns Operation result containing array of categories
   */
  getCategories(parentId?: string): Promise<OperationResult<MarketplaceCategory[]>>;

  /**
   * Get marketplace-specific attributes for a category
   * @param categoryId - The category ID
   * @returns Operation result containing category attributes
   */
  getCategoryAttributes(categoryId: string): Promise<OperationResult<Array<{
    id: string;
    name: string;
    required: boolean;
    type: string;
    values?: string[];
  }>>>;

  /**
   * Get marketplace health status
   * @returns Connection status with marketplace service health information
   */
  getMarketplaceHealth(): Promise<ConnectionStatus>;

  /**
   * Close the adapter and clean up any resources
   * @returns Promise that resolves when cleanup is complete
   */
  close(): Promise<void>;
}