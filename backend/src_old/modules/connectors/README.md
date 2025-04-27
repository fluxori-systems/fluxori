# Fluxori Connector System

This module provides the connector architecture for integrating with external systems, including marketplaces, inventory systems, and financial platforms.

## Module Structure

- **adapters**: Implementation of various connector adapters
- **controllers**: HTTP controllers for connector-related endpoints
- **interfaces**: Connector interfaces and types
- **repositories**: Storage for connector credentials
- **services**: Shared services like the connector factory

## Available Connectors

### Marketplace Connectors

- **WooCommerce**: Integration with WooCommerce API for e-commerce
- **Takealot**: Integration with Takealot marketplace (South Africa)
- **Shopify**: Integration with Shopify platform
- **Amazon SP**: Integration with Amazon Selling Partner API

### Financial Connectors

- **Xero**: Integration with Xero accounting software

## Usage

Connectors are managed by the `ConnectorFactoryService`. This service handles:

1. Connector registration
2. Credential management
3. Connector lifecycle management (initialization, health checks, etc.)

Example usage in a service:

```typescript
@Injectable()
export class SomeService {
  constructor(private readonly connectorFactory: ConnectorFactoryService) {}

  async fetchProducts(organizationId: string) {
    // Get a marketplace connector
    const woocommerce = await this.connectorFactory.getMarketplaceConnector(
      "woocommerce",
      organizationId,
    );

    // Get products with pagination
    return woocommerce.getProducts({ page: 0, pageSize: 20 });
  }
}
```

## Interface Compliance Notes

All connectors must implement the appropriate interfaces:

- **IConnector**: Base interface for all connectors
- **IMarketplaceConnector**: For marketplace connectors (WooCommerce, Shopify, etc.)
- **IFinancialConnector**: For financial connectors (Xero, etc.)

Important: Be careful with type imports to ensure interface compliance. The module uses two similar but distinct pagination types:

1. `connector.types.ts` uses uppercase sort direction: `'ASC' | 'DESC'`
2. `types.ts` uses lowercase sort direction: `'asc' | 'desc'`

Financial connectors should use the types from `connector.types.ts` for proper interface compliance.

## South African Optimizations

All connectors include specific optimizations for South African market conditions:

1. Network-aware behavior for unstable connections
2. Load shedding detection (power outage periods)
3. Optimized retry strategies for intermittent connectivity
4. Circuit breaker patterns to prevent cascading failures
5. ZAR currency handling
6. Support for South African address formats
7. Low bandwidth modes for limited connectivity

## Module Boundaries

This module follows the boundaries defined in ADR-001 and ADR-002:

- All external access must be through the public API (index.ts)
- Repositories are only accessed by services in the same module
- Direct access to database services is prohibited
- Cross-module access should go through service-to-service communication

## WooCommerce Connector

The WooCommerce connector provides integration with WooCommerce-based stores for South African e-commerce operations.

### API Endpoints Documentation

#### Authentication & Authorization

- **OAuth 1.0a Authentication**: WooCommerce uses OAuth 1.0a for API authentication
  - Consumer Key and Consumer Secret required
  - HTTPS recommended but HTTP supported with OAuth signatures
  - HMAC-SHA256 signature method implemented

#### Products

| Endpoint                        | Method | Description           | Parameters                     | Response               |
| ------------------------------- | ------ | --------------------- | ------------------------------ | ---------------------- |
| `/wp-json/wc/v3/products`       | GET    | List all products     | pagination, filtering, sorting | Array of products      |
| `/wp-json/wc/v3/products/[id]`  | GET    | Get a product by ID   | product_id                     | Product object         |
| `/wp-json/wc/v3/products`       | POST   | Create a product      | Product data                   | Created product        |
| `/wp-json/wc/v3/products/[id]`  | PUT    | Update a product      | product_id, product data       | Updated product        |
| `/wp-json/wc/v3/products/[id]`  | DELETE | Delete a product      | product_id                     | Deleted product status |
| `/wp-json/wc/v3/products/batch` | POST   | Batch update products | create, update, delete arrays  | Batch operation result |

#### Product Variations

| Endpoint                                        | Method | Description             | Parameters                     | Response            |
| ----------------------------------------------- | ------ | ----------------------- | ------------------------------ | ------------------- |
| `/wp-json/wc/v3/products/[id]/variations`       | GET    | List product variations | product_id, pagination         | Array of variations |
| `/wp-json/wc/v3/products/[id]/variations/[id]`  | GET    | Get a variation         | product_id, variation_id       | Variation object    |
| `/wp-json/wc/v3/products/[id]/variations`       | POST   | Create a variation      | product_id, variation data     | Created variation   |
| `/wp-json/wc/v3/products/[id]/variations/[id]`  | PUT    | Update a variation      | product_id, variation_id, data | Updated variation   |
| `/wp-json/wc/v3/products/[id]/variations/[id]`  | DELETE | Delete a variation      | product_id, variation_id       | Deleted status      |
| `/wp-json/wc/v3/products/[id]/variations/batch` | POST   | Batch update variations | product_id, batch operations   | Batch result        |

#### Orders

| Endpoint                      | Method | Description         | Parameters                    | Response               |
| ----------------------------- | ------ | ------------------- | ----------------------------- | ---------------------- |
| `/wp-json/wc/v3/orders`       | GET    | List all orders     | pagination, filtering         | Array of orders        |
| `/wp-json/wc/v3/orders/[id]`  | GET    | Get an order by ID  | order_id                      | Order object           |
| `/wp-json/wc/v3/orders`       | POST   | Create an order     | Order data                    | Created order          |
| `/wp-json/wc/v3/orders/[id]`  | PUT    | Update an order     | order_id, order data          | Updated order          |
| `/wp-json/wc/v3/orders/[id]`  | DELETE | Delete an order     | order_id                      | Deleted order status   |
| `/wp-json/wc/v3/orders/batch` | POST   | Batch update orders | create, update, delete arrays | Batch operation result |

#### Order Notes

| Endpoint                                | Method | Description          | Parameters          | Response            |
| --------------------------------------- | ------ | -------------------- | ------------------- | ------------------- |
| `/wp-json/wc/v3/orders/[id]/notes`      | GET    | List order notes     | order_id            | Array of notes      |
| `/wp-json/wc/v3/orders/[id]/notes/[id]` | GET    | Get an order note    | order_id, note_id   | Note object         |
| `/wp-json/wc/v3/orders/[id]/notes`      | POST   | Create an order note | order_id, note data | Created note        |
| `/wp-json/wc/v3/orders/[id]/notes/[id]` | DELETE | Delete an order note | order_id, note_id   | Deleted note status |

#### Order Refunds

| Endpoint                                  | Method | Description        | Parameters            | Response         |
| ----------------------------------------- | ------ | ------------------ | --------------------- | ---------------- |
| `/wp-json/wc/v3/orders/[id]/refunds`      | GET    | List order refunds | order_id              | Array of refunds |
| `/wp-json/wc/v3/orders/[id]/refunds/[id]` | GET    | Get a refund       | order_id, refund_id   | Refund object    |
| `/wp-json/wc/v3/orders/[id]/refunds`      | POST   | Create a refund    | order_id, refund data | Created refund   |
| `/wp-json/wc/v3/orders/[id]/refunds/[id]` | DELETE | Delete a refund    | order_id, refund_id   | Deleted status   |

#### Customers

| Endpoint                         | Method | Description            | Parameters                    | Response           |
| -------------------------------- | ------ | ---------------------- | ----------------------------- | ------------------ |
| `/wp-json/wc/v3/customers`       | GET    | List all customers     | pagination, filtering         | Array of customers |
| `/wp-json/wc/v3/customers/[id]`  | GET    | Get a customer         | customer_id                   | Customer object    |
| `/wp-json/wc/v3/customers`       | POST   | Create a customer      | Customer data                 | Created customer   |
| `/wp-json/wc/v3/customers/[id]`  | PUT    | Update a customer      | customer_id, customer data    | Updated customer   |
| `/wp-json/wc/v3/customers/[id]`  | DELETE | Delete a customer      | customer_id                   | Deleted status     |
| `/wp-json/wc/v3/customers/batch` | POST   | Batch update customers | create, update, delete arrays | Batch result       |

#### Webhooks

| Endpoint                        | Method | Description           | Parameters                    | Response          |
| ------------------------------- | ------ | --------------------- | ----------------------------- | ----------------- |
| `/wp-json/wc/v3/webhooks`       | GET    | List all webhooks     | pagination                    | Array of webhooks |
| `/wp-json/wc/v3/webhooks/[id]`  | GET    | Get a webhook         | webhook_id                    | Webhook object    |
| `/wp-json/wc/v3/webhooks`       | POST   | Create a webhook      | Webhook data                  | Created webhook   |
| `/wp-json/wc/v3/webhooks/[id]`  | PUT    | Update a webhook      | webhook_id, webhook data      | Updated webhook   |
| `/wp-json/wc/v3/webhooks/[id]`  | DELETE | Delete a webhook      | webhook_id                    | Deleted status    |
| `/wp-json/wc/v3/webhooks/batch` | POST   | Batch update webhooks | create, update, delete arrays | Batch result      |

#### Coupons

| Endpoint                       | Method | Description          | Parameters                    | Response         |
| ------------------------------ | ------ | -------------------- | ----------------------------- | ---------------- |
| `/wp-json/wc/v3/coupons`       | GET    | List all coupons     | pagination, filtering         | Array of coupons |
| `/wp-json/wc/v3/coupons/[id]`  | GET    | Get a coupon         | coupon_id                     | Coupon object    |
| `/wp-json/wc/v3/coupons`       | POST   | Create a coupon      | Coupon data                   | Created coupon   |
| `/wp-json/wc/v3/coupons/[id]`  | PUT    | Update a coupon      | coupon_id, coupon data        | Updated coupon   |
| `/wp-json/wc/v3/coupons/[id]`  | DELETE | Delete a coupon      | coupon_id                     | Deleted status   |
| `/wp-json/wc/v3/coupons/batch` | POST   | Batch update coupons | create, update, delete arrays | Batch result     |

#### Tax Rates

| Endpoint                     | Method | Description            | Parameters                    | Response           |
| ---------------------------- | ------ | ---------------------- | ----------------------------- | ------------------ |
| `/wp-json/wc/v3/taxes`       | GET    | List all tax rates     | pagination                    | Array of tax rates |
| `/wp-json/wc/v3/taxes/[id]`  | GET    | Get a tax rate         | tax_id                        | Tax rate object    |
| `/wp-json/wc/v3/taxes`       | POST   | Create a tax rate      | Tax rate data                 | Created tax rate   |
| `/wp-json/wc/v3/taxes/[id]`  | PUT    | Update a tax rate      | tax_id, tax rate data         | Updated tax rate   |
| `/wp-json/wc/v3/taxes/[id]`  | DELETE | Delete a tax rate      | tax_id                        | Deleted status     |
| `/wp-json/wc/v3/taxes/batch` | POST   | Batch update tax rates | create, update, delete arrays | Batch result       |

#### Shipping Zones

| Endpoint                             | Method | Description             | Parameters         | Response       |
| ------------------------------------ | ------ | ----------------------- | ------------------ | -------------- |
| `/wp-json/wc/v3/shipping/zones`      | GET    | List all shipping zones | none               | Array of zones |
| `/wp-json/wc/v3/shipping/zones/[id]` | GET    | Get a shipping zone     | zone_id            | Shipping zone  |
| `/wp-json/wc/v3/shipping/zones`      | POST   | Create a shipping zone  | Zone data          | Created zone   |
| `/wp-json/wc/v3/shipping/zones/[id]` | PUT    | Update a shipping zone  | zone_id, zone data | Updated zone   |
| `/wp-json/wc/v3/shipping/zones/[id]` | DELETE | Delete a shipping zone  | zone_id            | Deleted status |

#### Shipping Zone Locations

| Endpoint                                       | Method | Description           | Parameters         | Response           |
| ---------------------------------------------- | ------ | --------------------- | ------------------ | ------------------ |
| `/wp-json/wc/v3/shipping/zones/[id]/locations` | GET    | List zone locations   | zone_id            | Array of locations |
| `/wp-json/wc/v3/shipping/zones/[id]/locations` | PUT    | Update zone locations | zone_id, locations | Updated locations  |

#### Shipping Zone Methods

| Endpoint                                          | Method | Description              | Parameters               | Response         |
| ------------------------------------------------- | ------ | ------------------------ | ------------------------ | ---------------- |
| `/wp-json/wc/v3/shipping/zones/[id]/methods`      | GET    | List shipping methods    | zone_id                  | Array of methods |
| `/wp-json/wc/v3/shipping/zones/[id]/methods`      | POST   | Add shipping method      | zone_id, method data     | Added method     |
| `/wp-json/wc/v3/shipping/zones/[id]/methods/[id]` | GET    | Get a shipping method    | zone_id, method_id       | Method object    |
| `/wp-json/wc/v3/shipping/zones/[id]/methods/[id]` | PUT    | Update a shipping method | zone_id, method_id, data | Updated method   |
| `/wp-json/wc/v3/shipping/zones/[id]/methods/[id]` | DELETE | Delete a shipping method | zone_id, method_id       | Deleted status   |

#### System Status

| Endpoint                                  | Method | Description       | Parameters | Response       |
| ----------------------------------------- | ------ | ----------------- | ---------- | -------------- |
| `/wp-json/wc/v3/system_status`            | GET    | Get system status | none       | System status  |
| `/wp-json/wc/v3/system_status/tools`      | GET    | Get system tools  | none       | Array of tools |
| `/wp-json/wc/v3/system_status/tools/[id]` | GET    | Get system tool   | tool_id    | Tool object    |
| `/wp-json/wc/v3/system_status/tools/[id]` | PUT    | Run system tool   | tool_id    | Tool result    |

### South African Market Specifics

- Currency: ZAR (South African Rand)
- VAT Rate: 15% (standard)
- Regional Shipping Zones:
  - Gauteng/Johannesburg (primary e-commerce hub)
  - Western Cape/Cape Town
  - KwaZulu-Natal/Durban
  - Eastern Cape
  - Other provinces

### Implementation Notes

- Rate limits depend on server configuration, no standard headers
- Pagination uses 'page' and 'per_page' parameters
- Authentication using oauth_consumer_key and oauth_signature
- Error responses use standard HTTP status codes with JSON error details
- Network optimizations required for South African connection quality

## Limitations

- WooCommerce API varies slightly based on WordPress and WooCommerce versions
- No batch operations for some endpoints
- Some operations require multiple API calls
- Authentication complexity across HTTP vs HTTPS
