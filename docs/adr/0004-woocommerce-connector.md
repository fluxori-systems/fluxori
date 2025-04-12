# ADR 0004: WooCommerce API Connector Implementation

## Status
Accepted

## Context
We need to implement a comprehensive connector for WooCommerce to integrate with South African e-commerce stores using the WooCommerce platform. This connector will enable Fluxori to provide inventory management, order processing, and product synchronization for WooCommerce stores.

## Decision
We will implement a WooCommerce connector following our marketplace connector architecture. The connector will utilize the WooCommerce REST API v3 and implement OAuth 1.0a authentication for secure API access.

### Key API Endpoints and Implementation Areas

#### Authentication & Authorization
- We will implement OAuth 1.0a "one-legged" authentication
- Support both HTTP Basic Auth (for HTTPS) and OAuth signature methods
- Store consumer keys securely using Secret Manager

#### Products & Variations
- Implement comprehensive product CRUD operations
- Support product variations and attributes
- Enable bulk operations for efficient updates
- Handle image management and rich product data

#### Inventory Management
- Real-time stock level synchronization
- Stock movement tracking
- Support for South African warehouse locations

#### Orders
- Order creation, retrieval, and updates
- Support for order notes and metadata
- Implement order status management workflows
- Support for partial fulfillment and cancellations

#### Tax & Shipping
- Configure South African VAT rates (15%)
- Regional shipping zones for South African provinces
- Support for custom shipping methods common in South Africa

#### Webhooks
- Implement webhook registration for real-time updates
- Configure essential event subscriptions:
  - Order creation/updates
  - Product changes
  - Inventory changes

### South African Optimizations
- Implement network resilience for unstable connections
- Support ZAR currency and South African tax regulations
- Optimize request patterns for high-latency networks
- Implement adaptive timeout and retry mechanisms
- Regional caching strategy for improved performance

## Technical Implementation Details
1. Create `WooCommerceConnector` class extending `BaseMarketplaceConnector`
2. Implement OAuth 1.0a authentication with HMAC-SHA256 signatures
3. Create mapping functions for WooCommerce data models to our internal models
4. Implement retry mechanisms with exponential backoff
5. Add South African regional optimizations
6. Include comprehensive error handling and logging
7. Implement connection health monitoring

## Consequences
- We'll gain the ability to integrate with WooCommerce stores in South Africa
- Required implementation effort is moderate (~3-4 developer weeks)
- Will need to maintain compatibility with WooCommerce version changes
- May encounter rate limiting for stores with large catalogs
- Webhook reliability depends on store accessibility

## References
- [WooCommerce REST API Documentation](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [OAuth 1.0a Specification](https://oauth.net/core/1.0a/)
- [South African E-commerce Market Report](https://www.statista.com/outlook/dmo/ecommerce/south-africa)