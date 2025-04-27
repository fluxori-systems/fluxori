# Fluxori Connector Adapters

This directory contains all the connector adapters for the Fluxori platform. These connectors allow the platform to integrate with various e-commerce marketplaces, accounting systems, and other external services.

## Base Connectors

- **BaseConnector**: Implements common functionality for all connectors, including error handling, retry logic, and circuit breaker patterns.
- **BaseMarketplaceConnector**: Extends BaseConnector with marketplace-specific operations.

## Marketplace Connectors

### WooCommerce Connector

The WooCommerce connector provides integration with the WooCommerce REST API. It includes specific optimizations for South African e-commerce operations:

- South African shipping rates (with Cape Town same-day delivery detection)
- Lead time tracking for product delivery
- Low bandwidth mode for limited connectivity environments
- Cache-control headers for better performance with unstable connections
- Load shedding detection and handling

Features:

- Product management (fetching, updating stock levels, pricing)
- Order management (fetching, acknowledging)
- South African-specific optimizations

### Amazon SP (Selling Partner) Connector

Integration with Amazon's Selling Partner API.

### Shopify Connector

Integration with Shopify's Admin API.

### Takealot Connector

Integration with Takealot marketplace (South Africa-specific).

## Financial Connectors

### Xero Connector (Temporarily disabled)

Integration with Xero accounting system.

## Usage

Connectors are instantiated and managed by the `ConnectorFactoryService`. The factory is responsible for:

1. Creating connector instances
2. Managing credentials
3. Caching initialized connectors
4. Registering connector types

Example usage:

```typescript
// From a service that needs to use a connector
@Injectable()
export class SomeService {
  constructor(private readonly connectorFactory: ConnectorFactoryService) {}

  async someMethod(organizationId: string) {
    // Get a marketplace connector
    const woocommerce = await this.connectorFactory.getMarketplaceConnector(
      "woocommerce",
      organizationId,
    );

    // Use the connector
    const products = await woocommerce.getProducts({ page: 0, pageSize: 20 });

    return products;
  }
}
```

## South African Optimizations

All connectors include specific optimizations for South African market conditions:

1. Network-aware behavior for unstable connections
2. Load shedding detection (power outage periods)
3. Optimized retry strategies for intermittent connectivity
4. Circuit breaker patterns to prevent cascading failures
5. ZAR currency handling
6. Support for South African address formats
7. Low bandwidth modes for limited connectivity
