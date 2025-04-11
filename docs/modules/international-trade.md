# International Trade Module

## Overview

The International Trade module provides functionality for managing international shipments, customs compliance, trade restrictions, and regulatory requirements for cross-border commerce. It helps businesses navigate the complexities of international shipping and trade compliance.

## Module Boundaries

### Exports

The module exposes the following components to the rest of the application:

- **Public APIs**: 
  - `InternationalTradeModule`: The main module for international trade functionality
  - Enums for shipment status tracking: `ShippingMethod`, `ShipmentStatus`, `CustomsStatus`, `ComplianceStatus`, `IncoTerm`
  - Core data interfaces: `IInternationalShipment`, `IHSCode`, `ITradeRestriction`, `IComplianceRequirement`
  - DTOs for API operations: `CreateShipmentDto`, `UpdateShipmentDto`, `QueryShipmentsDto`, `ShipmentResponse`

### Dependencies

This module has dependencies on:

- **Required Modules**:
  - None currently

- **Optional Modules**:
  - `InventoryModule`: For product information
  - `NotificationsModule`: For alerting about shipment status changes

## Architecture

```
international-trade/
├── controllers/             # HTTP endpoints (to be implemented)
├── interfaces/              # TypeScript interfaces
│   ├── dependencies.ts      # Module dependencies
│   └── types.ts             # Type definitions
├── models/                  # Data models (to be implemented)
├── repositories/            # Data access (to be implemented)
├── services/                # Business logic (to be implemented)
├── international-trade.module.ts # Module definition
└── index.ts                 # Public API exports
```

## Integration Points

Other modules should interact with this module through its public API:

### How to Import

```typescript
// Import the entire module
import { InternationalTradeModule } from 'src/modules/international-trade';

// Import specific types
import { 
  ShippingMethod,
  ShipmentStatus,
  IInternationalShipment
} from 'src/modules/international-trade';
```

### Usage Examples

#### Creating a New International Shipment

```typescript
import { Injectable } from '@nestjs/common';
import {
  CreateShipmentDto,
  ShippingMethod,
  IncoTerm,
  ShipmentResponse
} from 'src/modules/international-trade';

@Injectable()
export class ShipmentService {
  // Inject necessary repositories when implemented
  
  async createShipment(shipmentData: CreateShipmentDto): Promise<ShipmentResponse> {
    // Implementation for creating a shipment
    // This will be enhanced when the module is fully implemented
    
    const newShipment = {
      id: 'generated-id',
      ...shipmentData,
      status: ShipmentStatus.DRAFT,
      customsStatus: CustomsStatus.NOT_STARTED,
      complianceStatus: ComplianceStatus.UNKNOWN,
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // When implemented, save to repository
    
    return newShipment;
  }
}
```

#### Checking Trade Compliance

```typescript
import { Injectable } from '@nestjs/common';
import {
  IComplianceRequirement,
  IHSCode
} from 'src/modules/international-trade';

@Injectable()
export class ComplianceService {
  // Inject necessary repositories when implemented
  
  async checkProductCompliance(
    productId: string,
    hsCode: string,
    originCountry: string,
    destinationCountry: string
  ): Promise<{
    isCompliant: boolean;
    requirements: IComplianceRequirement[];
    restrictions: ITradeRestriction[];
  }> {
    // This will be implemented when repositories and services are added
    
    // Example implementation logic:
    // 1. Get HS code details
    // 2. Check for trade restrictions between countries
    // 3. Get compliance requirements for the destination country
    // 4. Determine if the product meets all requirements
    
    return {
      isCompliant: true,
      requirements: [],
      restrictions: []
    };
  }
}
```

## Data Flow

The typical data flow through the International Trade module:

1. A shipment is created with product, origin, and destination details
2. Compliance requirements are checked for the products and countries
3. Shipment moves through various statuses (draft, booked, in transit, etc.)
4. Customs documentation is generated and tracked
5. Duties and taxes are calculated and recorded
6. Shipment is completed with all final costs and documentation

## Configuration

Currently, the International Trade module does not have specific configuration options as it's in development phase.

## Testing

When fully implemented, testing the International Trade module would include:

```typescript
describe('InternationalTradeService', () => {
  let service: InternationalTradeService;
  let shipmentRepository: MockShipmentRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InternationalTradeService,
        {
          provide: ShipmentRepository,
          useClass: MockShipmentRepository
        }
      ],
    }).compile();

    service = module.get<InternationalTradeService>(InternationalTradeService);
    shipmentRepository = module.get(ShipmentRepository);
  });

  it('should create a shipment in draft status', async () => {
    const createDto: CreateShipmentDto = {
      // Test data
    };
    
    const result = await service.createShipment(createDto);
    
    expect(result.status).toBe(ShipmentStatus.DRAFT);
    expect(shipmentRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      // Expected repository call
    }));
  });
});
```