# ADR 0005: WooCommerce Connector Integration Plan

## Status

Proposed

## Context

Fluxori platform needs a comprehensive integration with WooCommerce to serve South African e-commerce sellers. This ADR outlines the detailed integration plan for implementing the WooCommerce connector following our established connector architecture patterns.

## Decision

We will implement a full-featured WooCommerce connector using WooCommerce REST API v3. The implementation will follow our existing marketplace connector architecture with South African optimizations for network resilience and performance.

## Detailed Implementation Plan

### 1. Connector Architecture

#### 1.1 Module Structure

```
backend/src/modules/connectors/
├── adapters/
│   ├── base-connector.ts               # Base connector with shared functionality
│   ├── base-marketplace-connector.ts   # Base marketplace connector with e-commerce specifics
│   ├── woocommerce-connector.ts        # WooCommerce-specific implementation
├── interfaces/
│   ├── connector.interface.ts          # Base connector interfaces
│   ├── types.ts                        # Shared type definitions
├── utils/
│   ├── network-aware-client.ts         # Network optimization utilities
```

#### 1.2 Authentication Approach

WooCommerce uses OAuth 1.0a "one-legged" authentication. Our implementation will:

1. Support both authentication methods:
   - HTTP Basic Auth (for HTTPS connections)
   - OAuth 1.0a with HMAC-SHA256 signatures (for HTTP connections)
2. Securely store Consumer Key and Consumer Secret in GCP Secret Manager
3. Use `oauth-1.0a` library for signature generation
4. Implement signature validation with proper HMAC-SHA256 hashing

#### 1.3 Error Management Strategy

The connector will implement tiered error handling:

1. API-level errors (400, 401, 403, 404, 500, etc.)
2. Network-level errors (timeout, connection reset, DNS failures)
3. South African-specific errors (load shedding detection, intermittent connectivity)

Error handling will include:

- Exponential backoff retry mechanism
- Circuit breaker pattern to prevent cascading failures
- Error categorization and reporting
- South African load shedding detection and handling

#### 1.4 Data Mapping Strategy

A comprehensive mapping layer will be implemented to convert between WooCommerce's data model and our internal data model:

1. WooCommerce Product → MarketplaceProduct
2. WooCommerce Order → MarketplaceOrder
3. WooCommerce Customer → Customer
4. WooCommerce Variation → ProductVariation

Maps will handle all data type conversions, including:

- String price values to floating-point numbers
- ISO date strings to Date objects
- Nested objects and arrays

#### 1.5 South African Network Optimizations

Specific optimizations for South African network conditions:

1. Adaptive timeout configuration based on network quality
2. Connection quality monitoring and fallback strategies
3. Local caching with TTL for frequently accessed data
4. Compression of request/response data
5. Load shedding detection and scheduled operations
6. Batch operations where possible to reduce API calls

#### 1.6 Multi-Tenant Strategy

To support multiple WordPress-based sites:

1. Store per-tenant configuration in Firestore
2. Namespace credentials by organization ID and store URL
3. Implement connection pools with tenant isolation
4. Separate rate limiting per tenant
5. Monitor health status per tenant

### 2. Core Functionality Implementation

#### 2.1 Product and Variation Management

##### Key Endpoints:

- List Products: GET `/wp-json/wc/v3/products`
- Get Product: GET `/wp-json/wc/v3/products/[id]`
- Create Product: POST `/wp-json/wc/v3/products`
- Update Product: PUT `/wp-json/wc/v3/products/[id]`
- List Variations: GET `/wp-json/wc/v3/products/[id]/variations`
- Get Variation: GET `/wp-json/wc/v3/products/[id]/variations/[id]`
- Update Variation: PUT `/wp-json/wc/v3/products/[id]/variations/[id]`

##### Implementation Approach:

1. Create robust type definitions for all product-related endpoints
2. Implement bidirectional mapping between WooCommerce and internal models
3. Support batch operations for product and stock updates
4. Handle product images, attributes, and variations
5. Implement stock level synchronization
6. Support SKU-based lookup and management

#### 2.2 Order Processing and Fulfillment

##### Key Endpoints:

- List Orders: GET `/wp-json/wc/v3/orders`
- Get Order: GET `/wp-json/wc/v3/orders/[id]`
- Update Order: PUT `/wp-json/wc/v3/orders/[id]`
- Order Notes: POST `/wp-json/wc/v3/orders/[id]/notes`
- Order Refunds: POST `/wp-json/wc/v3/orders/[id]/refunds`

##### Implementation Approach:

1. Implement order synchronization with pagination
2. Support filtering by date, status, and customer
3. Design fulfillment status mapping and updates
4. Enable order acknowledgment through status updates
5. Support partial fulfillment scenarios
6. Implement order note functionality
7. Handle South African shipping providers

#### 2.3 Customer Data Access

##### Key Endpoints:

- List Customers: GET `/wp-json/wc/v3/customers`
- Get Customer: GET `/wp-json/wc/v3/customers/[id]`
- Create Customer: POST `/wp-json/wc/v3/customers`
- Update Customer: PUT `/wp-json/wc/v3/customers/[id]`

##### Implementation Approach:

1. Implement customer data retrieval with privacy protections
2. Support South African address format and postal codes
3. Map customer data to internal customer model
4. Enable filtering and searching for customers
5. Implement proper data protections for PII

#### 2.4 Webhook Configuration

##### Key Endpoints:

- List Webhooks: GET `/wp-json/wc/v3/webhooks`
- Create Webhook: POST `/wp-json/wc/v3/webhooks`
- Update Webhook: PUT `/wp-json/wc/v3/webhooks/[id]`
- Delete Webhook: DELETE `/wp-json/wc/v3/webhooks/[id]`

##### Implementation Approach:

1. Create and register webhooks for key events
   - Order creation and updates
   - Product stock changes
   - Price updates
2. Implement webhook verification security
3. Design reliable webhook receiver with idempotency
4. Set up retry logic for webhook delivery failures
5. Implement webhook payload validation

#### 2.5 Tax Rate Management

##### Key Endpoints:

- List Tax Rates: GET `/wp-json/wc/v3/taxes`
- Create Tax Rate: POST `/wp-json/wc/v3/taxes`
- Update Tax Rate: PUT `/wp-json/wc/v3/taxes/[id]`

##### Implementation Approach:

1. Configure South African VAT rate (15%)
2. Support tax classes for different product types
3. Implement tax rate validation
4. Handle tax exemptions where applicable
5. Support custom tax rates for specific regions

### 3. Data Flow Diagrams

#### 3.1 Inventory Synchronization Flow

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────┐     ┌───────────────┐
│             │     │                  │     │               │     │               │
│  Inventory  │     │  WooCommerce     │     │  Stock Level  │     │  WooCommerce  │
│   Service   │────▶│    Connector     │────▶│   Mapping     │────▶│     API       │
│             │     │                  │     │               │     │               │
└─────────────┘     └──────────────────┘     └───────────────┘     └───────────────┘
        │                    ▲                                             │
        │                    │                                             │
        │                    │                                             │
        │                    │                                             ▼
┌─────────────┐     ┌──────────────────┐                          ┌───────────────┐
│             │     │                  │                          │               │
│  Warehouse  │     │   Response       │                          │  WooCommerce  │
│  Database   │◀────│   Handling       │◀─────────────────────────│     Store     │
│             │     │                  │                          │               │
└─────────────┘     └──────────────────┘                          └───────────────┘
```

#### 3.2 Order Processing Flow

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────┐     ┌───────────────┐
│             │     │                  │     │               │     │               │
│  Webhook    │     │  WooCommerce     │     │  Order        │     │  WooCommerce  │
│  Receiver   │────▶│    Connector     │────▶│   Mapping     │────▶│     API       │
│             │     │                  │     │               │     │               │
└─────────────┘     └──────────────────┘     └───────────────┘     └───────────────┘
        ▲                    │                                             │
        │                    │                                             │
        │                    │                                             │
        │                    ▼                                             ▼
┌─────────────┐     ┌──────────────────┐                          ┌───────────────┐
│             │     │                  │                          │               │
│  WooCommerce│     │   Order          │                          │  Fluxori      │
│  Store      │     │   Service        │                          │  Order DB     │
│             │     │                  │                          │               │
└─────────────┘     └──────────────────┘                          └───────────────┘
                             │
                             │
                             ▼
                    ┌──────────────────┐
                    │                  │
                    │   Fulfillment    │
                    │   Service        │
                    │                  │
                    └──────────────────┘
```

### 4. TypeScript Interfaces

#### 4.1 WooCommerce Product Interface

```typescript
export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_modified: string;
  type: "simple" | "grouped" | "external" | "variable";
  status: "draft" | "pending" | "private" | "publish";
  featured: boolean;
  catalog_visibility: "visible" | "catalog" | "search" | "hidden";
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_to: string | null;
  price_html: string;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  downloads: WooCommerceDownload[];
  download_limit: number;
  download_expiry: number;
  external_url: string;
  button_text: string;
  tax_status: "taxable" | "shipping" | "none";
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: "instock" | "outofstock" | "onbackorder";
  backorders: "no" | "notify" | "yes";
  backorders_allowed: boolean;
  backordered: boolean;
  sold_individually: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  related_ids: number[];
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  purchase_note: string;
  categories: WooCommerceCategory[];
  tags: WooCommerceTag[];
  images: WooCommerceImage[];
  attributes: WooCommerceAttribute[];
  default_attributes: WooCommerceDefaultAttribute[];
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  meta_data: WooCommerceMetaData[];
}
```

#### 4.2 WooCommerce Order Interface

```typescript
export interface WooCommerceOrder {
  id: number;
  parent_id: number;
  number: string;
  order_key: string;
  created_via: string;
  version: string;
  status: string;
  currency: string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  prices_include_tax: boolean;
  customer_id: number;
  customer_ip_address: string;
  customer_user_agent: string;
  customer_note: string;
  billing: WooCommerceOrderAddress;
  shipping: WooCommerceOrderAddress;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  date_paid: string | null;
  date_paid_gmt: string | null;
  date_completed: string | null;
  date_completed_gmt: string | null;
  cart_hash: string;
  meta_data: WooCommerceMetaData[];
  line_items: WooCommerceOrderLineItem[];
  tax_lines: WooCommerceOrderTaxLine[];
  shipping_lines: WooCommerceOrderShippingLine[];
  fee_lines: WooCommerceOrderFeeLine[];
  coupon_lines: WooCommerceOrderCouponLine[];
  refunds: WooCommerceOrderRefund[];
}
```

### 5. Integration with Existing Systems

#### 5.1 Leveraging Base Connector Architecture

The WooCommerce connector will extend our existing BaseMarketplaceConnector class with these additional features:

1. OAuth 1.0a authentication implementation
2. WooCommerce-specific error handling
3. Data mapping for WooCommerce models
4. WordPress-specific API quirks handling

#### 5.2 Integration Points

##### Inventory System Integration

```typescript
public async syncInventory(products: ProductInventory[]): Promise<SyncResult> {
  // Map internal inventory model to WooCommerce stock updates
  const stockUpdates = products.map(product => ({
    sku: product.sku,
    stockLevel: product.availableQuantity
  }));

  // Use connector's updateStock method
  return this.woocommerceConnector.updateStock(stockUpdates);
}
```

##### Order Management Integration

```typescript
// Order webhook receiver
@Post('/webhooks/woocommerce/orders')
async receiveOrderWebhook(
  @Body() payload: WooCommerceWebhookPayload,
  @Headers('x-wc-webhook-signature') signature: string
): Promise<void> {
  // Verify webhook signature
  this.woocommerceConnector.verifyWebhookSignature(payload, signature);

  // Process order
  if (payload.topic === 'order.created') {
    const order = mapWooCommerceOrder(payload.data);
    await this.orderService.processNewOrder(order);
  }
}
```

##### Multi-Warehouse Integration

```typescript
// Handle multi-warehouse stock updates
async updateWarehouseStock(warehouseId: string, updates: StockUpdate[]): Promise<void> {
  // Map warehouse to WooCommerce-compatible location if supported
  // or aggregate stock across warehouses
  const mappedUpdates = updates.map(update => ({
    sku: update.sku,
    stockLevel: update.quantity,
    // locationId is ignored by WooCommerce but tracked internally
    locationId: warehouseId
  }));

  await this.woocommerceConnector.updateStock(mappedUpdates);
}
```

#### 5.3 Credential Management

WooCommerce API credentials will be securely stored and managed:

1. Credentials stored in GCP Secret Manager
2. Access controlled via IAM policies
3. Credentials namespaced by organization and store URL
4. Runtime credential access via CredentialManager service
5. No credentials in code, config files, or logs

#### 5.4 Observability Integration

The connector will integrate with our observability framework:

1. Custom metrics for API calls, errors, and latency
2. Logs with proper redaction of sensitive data
3. Distributed tracing for request flows
4. Health checks for connector status
5. Alerts for rate limit approaching, errors, and network issues

### 6. Testing and Validation Strategy

#### 6.1 Unit Testing

1. Test all mapping functions between WooCommerce and internal models
2. Test OAuth signature generation
3. Test error handling and retry logic
4. Test network optimizations
5. Mock WooCommerce API responses for predictable tests

#### 6.2 Integration Testing

1. Test with WooCommerce API sandbox environment
2. Validate all core operations (CRUD for products, orders, etc.)
3. Test error conditions and rate limit handling
4. Test webhook registration and processing
5. End-to-end flow testing for inventory and order synchronization

#### 6.3 South African Network Testing

1. Simulate variable network conditions
2. Test with artificial latency and packet loss
3. Simulate load shedding scenarios
4. Validate network optimization features
5. Test failover and recovery mechanisms

### 7. Implementation Phases

#### Phase 1: Core Authentication and Product Operations

- OAuth 1.0a authentication implementation
- Basic error handling and retries
- Product retrieval and mapping
- Inventory management (stock updates)
- Unit tests for core functionality

#### Phase 2: Order Management

- Order retrieval and mapping
- Order status updates
- Order fulfillment operations
- Order webhook registration and handling
- Integration tests for order flows

#### Phase 3: Advanced Features

- Customer management
- Webhook configuration
- Tax rate management
- Shipping configuration
- Performance optimization

#### Phase 4: South African Optimizations

- Network resilience features
- Load shedding detection
- Low-bandwidth mode
- Regional caching strategy
- South African tax compliance

## South African Market Considerations

### Network Resilience

The WooCommerce connector will implement specific features for South African network conditions:

1. **Load Shedding Detection and Handling**

   - Pattern recognition for power outage schedules
   - Automatic re-scheduling of non-critical operations
   - Graceful degradation during power outages

2. **Adaptive Timeout Configuration**

   - Dynamic timeout values based on network quality
   - Longer initial timeouts for high-latency conditions
   - Per-operation timeout customization

3. **Bandwidth Optimization**

   - Compression for request/response data
   - Minimization of payload sizes
   - Selective field retrieval to reduce data transfer

4. **Operation Batching**
   - Combining multiple operations where API supports
   - Local queuing and batch submission
   - Priority-based operation scheduling

### South African VAT Compliance

The connector will support South African tax requirements:

1. Standard VAT rate configuration (15%)
2. Tax class support for different product types
3. Tax-exempt product handling
4. Proper tax calculation and reporting

### Multi-Warehouse Support

To accommodate distributed South African operations:

1. Aggregate stock across multiple warehouses
2. Location-specific stock allocation
3. Regional fulfillment optimization
4. Province-based shipping configuration

## Constraints and Limitations

1. WooCommerce API variation between versions

   - Solution: Version detection and adaptation

2. Limited batch operation support

   - Solution: Client-side batching with sequential processing

3. WordPress performance under load

   - Solution: Request rate limiting and scheduling

4. Network reliability in South Africa

   - Solution: Comprehensive retry and fallback mechanisms

5. OAuth 1.0a complexity
   - Solution: Encapsulated authentication with robust testing

## References

- [WooCommerce REST API Documentation](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [OAuth 1.0a Specification](https://oauth.net/core/1.0a/)
- [WordPress REST API Authentication](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/)
- [South African VAT Regulations](https://www.sars.gov.za/types-of-tax/value-added-tax/)
