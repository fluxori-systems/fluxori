# Order Ingestion Module

## Overview

The Order Ingestion module provides a standardized system for processing orders from multiple marketplaces. It converts orders from various marketplace formats into a unified internal format, making it easier to handle orders consistently regardless of their source.

## Module Boundaries

### Exports

The module exposes the following components to the rest of the application:

- **Public APIs**: 
  - `OrderIngestionModule`: The main module for order ingestion functionality
  - `OrderMapperRegistry`: Registry for marketplace-specific order mappers
  - `IOrderMapper`: Interface for implementing marketplace-specific order mappers
  - `IOrderMapperRegistry`: Interface defining the order mapper registry
  - Order-related types and interfaces

### Dependencies

This module has dependencies on:

- **Required Modules**:
  - `MarketplacesModule`: For marketplace information and connections

- **Optional Modules**:
  - None currently

## Architecture

```
order-ingestion/
├── controllers/             # HTTP endpoints (to be implemented)
├── dto/                     # Data transfer objects (to be implemented)
├── interfaces/              # TypeScript interfaces
│   ├── order-mapper.interface.ts # Order mapper interface definitions
│   └── types.ts             # Common types
├── mappers/                 # Order mappers
│   └── order-mapper.registry.ts # Registry for marketplace mappers
├── models/                  # Data models (to be implemented)
├── repositories/            # Data access (to be implemented)
├── services/                # Business logic (to be implemented)
├── order-ingestion.module.ts # Module definition
└── index.ts                 # Public API exports
```

## Integration Points

Other modules should interact with this module through its public API:

### How to Import

```typescript
// Import the entire module
import { OrderIngestionModule } from 'src/modules/order-ingestion';

// Import specific components
import { 
  OrderMapperRegistry,
  IOrderMapper 
} from 'src/modules/order-ingestion';
```

### Usage Examples

#### Registering a Custom Order Mapper

```typescript
import { Injectable } from '@nestjs/common';
import { 
  IOrderMapper, 
  OrderMapperRegistry,
  MarketplaceOrder,
  Order
} from 'src/modules/order-ingestion';

@Injectable()
export class AmazonOrderMapper implements IOrderMapper {
  constructor(private orderMapperRegistry: OrderMapperRegistry) {
    // Register this mapper with the registry
    this.orderMapperRegistry.registerMapper('amazon', this);
  }

  mapToFluxoriOrder(marketplaceOrder: MarketplaceOrder, organizationId: string): Order {
    // Implementation for Amazon order mapping
    return {
      // Map from Amazon format to internal format
    };
  }

  mapToMarketplaceOrder(order: Order): MarketplaceOrder {
    // Implementation for mapping back to Amazon format
    return {
      // Map from internal format to Amazon format
    };
  }
}
```

#### Using the Order Mapper Registry

```typescript
import { Injectable } from '@nestjs/common';
import { 
  OrderMapperRegistry,
  Order,
  MarketplaceOrder
} from 'src/modules/order-ingestion';

@Injectable()
export class OrderImportService {
  constructor(private orderMapperRegistry: OrderMapperRegistry) {}

  async processMarketplaceOrder(
    marketplaceId: string,
    rawOrder: MarketplaceOrder,
    organizationId: string
  ): Promise<Order> {
    try {
      // Get the appropriate mapper for the marketplace
      const mapper = this.orderMapperRegistry.getMapper(marketplaceId);
      
      // Convert to internal format
      const fluxoriOrder = mapper.mapToFluxoriOrder(rawOrder, organizationId);
      
      // Process the order further...
      
      return fluxoriOrder;
    } catch (error) {
      // Handle errors (e.g., no mapper found)
      throw error;
    }
  }
}
```

## Data Flow

The typical data flow through the Order Ingestion module:

1. Marketplace data is received (e.g., via webhook or API sync)
2. The appropriate order mapper is selected from the registry
3. The mapper converts the marketplace order to the internal format
4. The order is processed by the application
5. Status updates may be mapped back to marketplace format for syncing

## Configuration

Currently, the Order Ingestion module does not have specific configuration options.

## Testing

To test the Order Ingestion module and custom order mappers:

```typescript
describe('OrderMapperRegistry', () => {
  let registry: OrderMapperRegistry;
  let mockMapper: IOrderMapper;

  beforeEach(() => {
    registry = new OrderMapperRegistry();
    mockMapper = {
      mapToFluxoriOrder: jest.fn(),
      mapToMarketplaceOrder: jest.fn()
    };
  });

  it('should register and retrieve a mapper', () => {
    // Register a mapper
    registry.registerMapper('test-marketplace', mockMapper);
    
    // Get the mapper
    const retrievedMapper = registry.getMapper('test-marketplace');
    
    // Should be the same instance
    expect(retrievedMapper).toBe(mockMapper);
  });

  it('should check if a mapper exists', () => {
    registry.registerMapper('test-marketplace', mockMapper);
    
    expect(registry.hasMapper('test-marketplace')).toBe(true);
    expect(registry.hasMapper('non-existent')).toBe(false);
  });

  it('should throw error when getting non-existent mapper', () => {
    expect(() => registry.getMapper('non-existent')).toThrow();
  });
});
```