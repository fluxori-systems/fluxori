# Product Information Management (PIM) Module

## Overview

The Product Information Management (PIM) module provides a centralized system for managing product data across multiple sales channels, with an architecture designed for global market expansion. The implementation follows a phased approach outlined in ADR-006, initially focusing on South African market optimizations, with planned extensions to broader African markets and Europe.

The PIM module serves as the single source of truth for all product information, enabling seamless synchronization with various marketplace connectors while maintaining data consistency and integrity across all regions and channels.

## Key Features

### Core Functionality (Market-Agnostic)

- **Centralized Product Management**: Single source of truth for all product information
- **Multi-Marketplace Support**: Framework for integration with global marketplaces
- **Rich Media Management**: Support for product images and media assets
- **Variant Management**: Flexible product variant creation and management
- **Batch Operations**: Efficient multi-product editing capabilities
- **AI-Enhanced Features**: Framework for intelligent product enhancements including product image analysis, description generation, and price optimization
- **Internationalization**: Multi-language and multi-currency support
- **Competitive Price Monitoring**: Track competitor prices with market position analysis and recommendations

### South African Market Optimizations (Phase 1)

- **VAT Handling**: Proper 15% VAT calculation with future rate change support
- **Load Shedding Resilience**: Graceful degradation during power outages
- **Network-Aware Components**: UI adapts to variable connection quality
- **Takealot Integration**: Specialized features for South Africa's leading marketplace
- **Compliance Features**: South African regulatory compliance fields (ICASA, SABS, NRCS)

### African Market Extensions (Phase 2)

- **Regional Warehouse Support**: Multi-warehouse inventory across African regions
- **Pan-African Marketplace Integration**: Connectors for Jumia, Kilimall, etc.
- **Cross-Border Trade**: Support for pan-African commerce
- **Regional Payment Methods**: Support for diverse African payment systems

### European Market Extensions (Phase 3)

- **EU VAT Compliance**: Complex European tax handling
- **European Marketplace Connectors**: Amazon EU, Zalando, etc.
- **EU Regulatory Compliance**: CE marking, GDPR product information
- **European B2B Support**: Features for European business customers

## Architecture

The PIM module follows the established Fluxori architecture patterns:

- **Repository Pattern**: Data access through type-safe repository classes
- **Module Boundary Enforcement**: Clear public APIs through index.ts exports
- **Service-Controller Structure**: Business logic in services, API endpoints in controllers
- **Market Extension Architecture**: Core market-agnostic components with market-specific extensions

### Implementation Approach

![PIM Module Architecture](../diagrams/pim-module-architecture.svg)

The implementation follows a market-agnostic core with market-specific extensions pattern:

1. **Core Layer**: Market-agnostic functionality usable across all regions
2. **Market Extension Layer**: Region-specific implementations of core interfaces
3. **Feature Flag Integration**: Toggle features based on market context
4. **Progressive Enhancement**: Base functionality works everywhere, enhanced features activate when infrastructure permits

### Module Dependencies

The PIM module has the following dependencies:

- **Connectors Module**: For marketplace integration
- **Feature Flags Module**: For controlling feature access by market
- **Auth Module**: For user authentication and authorization
- **Credit System Module**: For managing AI feature usage
- **Agent Framework Module**: For AI-enhanced features
- **Storage Module**: For media asset management

## Current Implementation Status

The PIM module is currently in Phase 1 (South African Market) implementation. See [PIM Implementation Status](./pim-implementation-status.md) for detailed tracking of feature implementation.

### Completed Components

- **South African VAT Handling**: Support for current and future rate changes (15%, 15.5%, 16%)
- **Core Module Structure**: Comprehensive module architecture with proper boundary enforcement
- **Data Models**: Complete schema definitions for products, categories, and attribute templates
- **Repository Layer**: Robust implementation following ADR-002 patterns with optimized queries
- **Product CRUD Operations**: Complete implementation with filtering, categorization, and marketplace integration
- **Category Management**: Full hierarchical structure with tree operations and marketplace mapping
- **Attribute Templates**: Flexible template system with regional and marketplace variations
- **Network-Aware Components**: Adaptive storage service with variable compression based on network quality
- **Load Shedding Resilience**: Queueing system for operations during power outages with automatic recovery
- **Market Context Service**: Region-specific functionality detection and configuration
- **Competitive Price Monitoring**: Complete implementation with competitor tracking, market position analysis, price history, alerts, and AI-driven recommendations
- **Product Bundling**: Bundle creation, management, pricing strategies, and component management
- **Dynamic Pricing Rules**: Comprehensive pricing rules system with operations, constraints, and scheduling

### In-Progress Components

- **Testing Coverage**: Unit tests for core components
- **Documentation**: API reference and integration guides
- **Product Variants**: Implementation in progress for variant management
- **Marketplace Connectors**: Framework defined for marketplace integration
- **AI-Powered Features**: Product description generation, image analysis, categorization, and competitive price optimization

## Components

### API Layer

- **ProductController**: Core product CRUD operations
- **CategoryController**: Category management
- **AttributeTemplateController**: Product attribute management
- **ProductVariantController**: Variant management
- **MediaController**: Product media management
- **ImportExportController**: Import/export functionality
- **MarketplaceIntegrationController**: Marketplace synchronization
- **CompetitivePriceMonitoringController**: Competitor price monitoring, market position analysis, and price recommendations
- **BundleController**: Product bundling management
- **PricingRuleController**: Dynamic pricing rules
- **AdvancedImageController**: AI-powered image analysis, marketplace compliance checking, and quality assessment

### Service Layer

- **ProductService**: Core product business logic
- **CategoryService**: Category hierarchy management
- **AttributeTemplateService**: Attribute template management
- **ProductVariantService**: Variant management logic
- **MediaService**: Media asset management
- **ImportExportService**: Import/export orchestration
- **MarketplaceIntegrationService**: Marketplace synchronization logic
- **CompetitivePriceMonitoringService**: Competitive price monitoring, market position analysis, price history tracking, alerts, and AI-driven recommendations
- **BundleService**: Bundle management and pricing
- **DynamicPricingService**: Pricing rule execution and scheduling
- **ImageAnalysisService**: AI-powered image analysis, quality assessment, marketplace compliance checking, and metadata enhancement

### Market-Specific Services

- **SouthAfricanVatService**: South African VAT calculations
- **LoadSheddingResilienceService**: Power outage resilience for South Africa
- **NetworkAwareStorageService**: Bandwidth-adaptive storage for variable connectivity
- **TakealotIntegrationService**: South African marketplace specifics

### Repository Layer

- **ProductRepository**: Product data access
- **CategoryRepository**: Category data access
- **AttributeTemplateRepository**: Attribute template data access
- **ProductVariantRepository**: Variant data access
- **ProductMediaRepository**: Media asset data access
- **MarketplaceIntegrationRepository**: Marketplace mapping data
- **CompetitorPriceRepository**: Competitor price data access and market position calculation
- **PriceHistoryRepository**: Historical price tracking data
- **PriceMonitoringConfigRepository**: Price monitoring configuration data
- **PriceAlertRepository**: Price alert data
- **BundleRepository**: Product bundle data
- **PricingRuleRepository**: Dynamic pricing rule data

## Integration with Other Modules

### Marketplace Integration

The PIM module integrates with marketplace connectors through the Connectors module's public API:

```typescript
// Example of marketplace integration (design pattern, not actual implementation)
import { ConnectorFactoryService } from "../connectors";

@Injectable()
export class MarketplaceIntegrationService {
  constructor(private connectorFactory: ConnectorFactoryService) {}

  async syncProductToMarketplace(
    productId: string,
    marketplaceId: string,
  ): Promise<SyncResult> {
    const connector = this.connectorFactory.getConnector(marketplaceId);
    const product = await this.productService.getProduct(productId);

    // Transform product for specific marketplace
    const marketplaceProduct = this.transformForMarketplace(
      product,
      marketplaceId,
    );

    // Sync to marketplace
    return connector.syncProduct(marketplaceProduct);
  }
}
```

### Inventory Integration

The PIM module integrates with the Inventory module for stock management:

```typescript
// Example of inventory integration (design pattern, not actual implementation)
import { InventoryService } from "../inventory";

@Injectable()
export class ProductInventoryService {
  constructor(private inventoryService: InventoryService) {}

  async getProductStockLevels(
    organizationId: string,
    productId: string,
  ): Promise<StockLevelSummary> {
    return this.inventoryService.getProductStockLevels(
      organizationId,
      productId,
    );
  }
}
```

## Market Expansion Design

The PIM module is designed for seamless market expansion following these patterns:

### Market Context Provider

```typescript
// Example of market context provider (design pattern, not actual implementation)
@Injectable()
export class MarketContextService {
  constructor(private featureFlagService: FeatureFlagService) {}

  getMarketContext(organizationId: string): MarketContext {
    // Determine market context from organization settings
    return {
      region: "south-africa", // Initially south-africa, will expand to other regions
      country: "za",
      vatRate: 15,
      features: {
        loadSheddingResilience: true,
        networkAwareComponents: true,
      },
    };
  }

  isFeatureAvailable(feature: string, context: MarketContext): boolean {
    return this.featureFlagService.isEnabled(
      `pim.${context.region}.${feature}`,
    );
  }
}
```

### Service Factory Pattern

```typescript
// Example of market-specific service factory (design pattern, not actual implementation)
@Injectable()
export class VatServiceFactory {
  constructor(
    private southAfricanVatService: SouthAfricanVatService,
    private europeanVatService: EuropeanVatService,
    private marketContextService: MarketContextService,
  ) {}

  getVatService(organizationId: string): VatService {
    const context = this.marketContextService.getMarketContext(organizationId);

    switch (context.region) {
      case "south-africa":
        return this.southAfricanVatService;
      case "europe":
        return this.europeanVatService;
      default:
        return this.southAfricanVatService; // Default implementation
    }
  }
}
```

## South African Market Optimizations

The implementation includes comprehensive South African market optimizations:

### Load Shedding Resilience (Implemented)

- Operation queueing during power outages with priority-based processing
- Data caching for critical operations with configurable TTL
- Background sync when power returns with automatic recovery
- Progressive degradation during unstable power
- Configurable retry policies for failed operations
- Webhook notification system for operation completion

### Network-Aware Components (Implemented)

- Bandwidth detection and adaptive response
- Progressive loading for media with quality scaling
- Compressed data transfers with variable compression ratios
- Offline-first operations for critical functionality
- Connection quality classification (high, medium, low)
- Estimated bandwidth-based optimizations
- Client-side network quality reporting

### South African VAT Handling (Implemented)

- 15% VAT calculation with proper rules
- Support for future rate changes (15.5% from May 2025, 16% from April 2026)
- VAT-inclusive and exclusive pricing with automatic conversion
- Proper rounding and calculation rules following South African tax regulations
- Historical VAT rate tracking for past transactions

## API Reference

The following API endpoints are available in the system:

### Product API

| Endpoint                                       | Method | Description                      | Status      |
| ---------------------------------------------- | ------ | -------------------------------- | ----------- |
| `/pim/products`                                | GET    | Get product list with pagination | Implemented |
| `/pim/products/{id}`                           | GET    | Get product by ID                | Implemented |
| `/pim/products`                                | POST   | Create a new product             | Implemented |
| `/pim/products/{id}`                           | PUT    | Update a product                 | Implemented |
| `/pim/products/{id}`                           | DELETE | Delete a product                 | Implemented |
| `/pim/products/featured`                       | GET    | Get featured products            | Implemented |
| `/pim/products/recent`                         | GET    | Get recently updated products    | Implemented |
| `/pim/products/by-category/{categoryId}`       | GET    | Get products by category         | Implemented |
| `/pim/products/by-marketplace/{marketplaceId}` | GET    | Get products by marketplace      | Implemented |
| `/pim/products/by-skus`                        | POST   | Get products by SKUs             | Implemented |
| `/pim/products/bulk-update`                    | POST   | Batch update products            | Implemented |
| `/pim/products/bulk-delete`                    | POST   | Batch delete products            | Implemented |

### Advanced Image API

| Endpoint                                              | Method | Description                   | Status      |
| ----------------------------------------------------- | ------ | ----------------------------- | ----------- |
| `/pim/advanced-image/upload`                          | POST   | Upload image with AI analysis | Implemented |
| `/pim/advanced-image/analyze/:imageId`                | POST   | Analyze existing image        | Implemented |
| `/pim/advanced-image/generate-alt-text/:imageId`      | POST   | Generate SEO alt text         | Implemented |
| `/pim/advanced-image/marketplace-compliance/:imageId` | GET    | Check marketplace compliance  | Implemented |
| `/pim/advanced-image/quality-assessment/:imageId`     | GET    | Assess image quality          | Implemented |
| `/pim/advanced-image/select-main-image/:productId`    | POST   | Select main product image     | Implemented |
| `/pim/advanced-image/adaptive-compression-settings`   | GET    | Get network-aware settings    | Implemented |
| `/pim/products/{id}/variants`                         | GET    | Get product variants          | Planned     |

### Category API

| Endpoint                                         | Method | Description                   | Status      |
| ------------------------------------------------ | ------ | ----------------------------- | ----------- |
| `/pim/categories`                                | GET    | Get category list             | Implemented |
| `/pim/categories/{id}`                           | GET    | Get category by ID            | Implemented |
| `/pim/categories`                                | POST   | Create a new category         | Implemented |
| `/pim/categories/{id}`                           | PUT    | Update a category             | Implemented |
| `/pim/categories/{id}`                           | DELETE | Delete a category             | Implemented |
| `/pim/categories/tree`                           | GET    | Get category tree             | Implemented |
| `/pim/categories/roots`                          | GET    | Get root categories           | Implemented |
| `/pim/categories/children/{parentId}`            | GET    | Get child categories          | Implemented |
| `/pim/categories/by-marketplace/{marketplaceId}` | GET    | Get categories by marketplace | Implemented |
| `/pim/categories/{id}/path`                      | GET    | Get category path             | Implemented |
| `/pim/categories/bulk-update`                    | POST   | Bulk update categories        | Implemented |
| `/pim/categories/bulk-delete`                    | POST   | Bulk delete categories        | Implemented |
| `/pim/categories/reorder`                        | POST   | Reorder categories            | Implemented |

### Attribute Template API

| Endpoint                                                  | Method | Description                            | Status      |
| --------------------------------------------------------- | ------ | -------------------------------------- | ----------- |
| `/pim/attribute-templates`                                | GET    | Get attribute template list            | Implemented |
| `/pim/attribute-templates/{id}`                           | GET    | Get attribute template by ID           | Implemented |
| `/pim/attribute-templates`                                | POST   | Create a new attribute template        | Implemented |
| `/pim/attribute-templates/{id}`                           | PUT    | Update an attribute template           | Implemented |
| `/pim/attribute-templates/{id}`                           | DELETE | Delete an attribute template           | Implemented |
| `/pim/attribute-templates/by-category/{categoryId}`       | GET    | Get templates by category              | Implemented |
| `/pim/attribute-templates/global`                         | GET    | Get global templates                   | Implemented |
| `/pim/attribute-templates/by-region/{region}`             | GET    | Get templates by region                | Implemented |
| `/pim/attribute-templates/by-marketplace/{marketplaceId}` | GET    | Get templates by marketplace           | Implemented |
| `/pim/attribute-templates/by-scope/{scope}`               | GET    | Get templates by scope                 | Implemented |
| `/pim/attribute-templates/applicable`                     | GET    | Get applicable templates for a product | Implemented |
| `/pim/attribute-templates/bulk-update`                    | POST   | Bulk update templates                  | Implemented |
| `/pim/attribute-templates/bulk-delete`                    | POST   | Bulk delete templates                  | Implemented |

### Competitive Price Monitoring API

| Endpoint                                                          | Method | Description                         | Status      |
| ----------------------------------------------------------------- | ------ | ----------------------------------- | ----------- |
| `/pim/competitive-price-monitoring/competitor-prices`             | POST   | Record competitor price             | Implemented |
| `/pim/competitive-price-monitoring/our-prices`                    | POST   | Record our price                    | Implemented |
| `/pim/competitive-price-monitoring/competitor-prices/{productId}` | GET    | Get competitor prices for a product | Implemented |
| `/pim/competitive-price-monitoring/market-position/{productId}`   | GET    | Get market position analysis        | Implemented |
| `/pim/competitive-price-monitoring/price-history/{productId}`     | GET    | Get price history                   | Implemented |
| `/pim/competitive-price-monitoring/config/{productId}`            | PUT    | Configure price monitoring          | Implemented |
| `/pim/competitive-price-monitoring/config/{productId}`            | GET    | Get price monitoring config         | Implemented |
| `/pim/competitive-price-monitoring/alerts/{productId}`            | GET    | Get price alerts                    | Implemented |
| `/pim/competitive-price-monitoring/alerts/{alertId}/read`         | PUT    | Mark alert as read                  | Implemented |
| `/pim/competitive-price-monitoring/alerts/{alertId}/resolve`      | PUT    | Mark alert as resolved              | Implemented |
| `/pim/competitive-price-monitoring/report/{productId}`            | GET    | Generate comprehensive price report | Implemented |
| `/pim/competitive-price-monitoring/batch-monitoring`              | POST   | Run batch monitoring                | Implemented |
| `/pim/competitive-price-monitoring/verify-prices`                 | POST   | Verify competitor prices            | Implemented |
| `/pim/competitive-price-monitoring/ai-analysis/{productId}`       | GET    | Generate AI-powered price analysis  | Implemented |
| `/pim/competitive-price-monitoring/auto-adjust/{productId}`       | POST   | Automatically adjust price          | Implemented |

## Testing Strategy

The PIM module includes comprehensive testing:

1. **Unit Tests**: For repositories, services, and controllers
2. **Integration Tests**: For cross-module functionality
3. **Market-Specific Tests**: For each target market's features
4. **Network Condition Tests**: For network-aware components
5. **Load Shedding Tests**: For South African resilience features

### Example Test Pattern

```typescript
// Example unit test for South African VAT (not actual implementation)
describe("SouthAfricanVatService", () => {
  it("should calculate VAT at 15% correctly", () => {
    const service = new SouthAfricanVatService();
    const result = service.calculateVat(100, new Date("2024-01-01"));
    expect(result.vatAmount).toBe(15);
    expect(result.priceIncludingVat).toBe(115);
  });

  it("should handle future VAT rate changes", () => {
    const service = new SouthAfricanVatService();
    const result = service.calculateVat(100, new Date("2025-06-01"));
    expect(result.vatAmount).toBe(15.5); // 15.5% after May 1, 2025
    expect(result.priceIncludingVat).toBe(115.5);
  });
});

// Example test for network-aware components
describe("NetworkAwareImageUploader", () => {
  it("should reduce quality for poor connections", () => {
    const uploader = new NetworkAwareImageUploader();
    const options = uploader.getOptionsForNetworkCondition({
      connectionType: "cellular",
      bandwidth: "low",
    });
    expect(options.compressionQuality).toBe("high"); // High compression = low quality
    expect(options.generateThumbnails).toBe(false);
  });
});
```

## Implementation Timeline

The implementation follows the timeline defined in ADR-006:

### Phase 1: South African Market (Months 1-3)

- Core product management
- South African optimizations
- Takealot integration
- Basic import/export

### Phase 2: African Expansion (Months 4-6)

- Regional warehouse support
- Multiple African marketplace connectors
- Cross-border trade features
- Multi-currency pricing

### Phase 3: European Market (Months 7-9)

- EU compliance features
- European marketplace integrations
- Advanced global analytics
- Cross-market inventory management

## Related Documentation

- [PIM Implementation Status](./pim-implementation-status.md)
- [PIM Module Implementation ADR](../adr/0006-pim-module-implementation.md)
- [Module Boundary Enforcement](../adr/ADR-001-module-boundary-enforcement.md)
- [Repository Pattern Implementation](../adr/ADR-002-repository-pattern-implementation.md)
