# PIM Module Architecture

## Module Boundaries

The PIM module has been designed with clear boundaries and interfaces:

```
+--------------------------------------------------------------+
|                        PIM Module                            |
|                                                              |
|  +----------------+            +----------------------+      |
|  | Models         |            | Controllers          |      |
|  |----------------|            |----------------------|      |
|  | Product        |            | ProductController    |      |
|  | Category       |<---------->| CategoryController   |      |
|  | AttributeTemp. |            | AttributeController  |      |
|  | Variant        |            | ValidationController |      |
|  | Marketplace    |            | B2BController        |      |
|  | B2B            |            +----------------------+      |
|  +----------------+                      ^                   |
|          ^                               |                   |
|          |                               |                   |
|          v                               v                   |
|  +----------------+            +----------------------+      |
|  | Repositories   |            | Services             |      |
|  |----------------|            |----------------------|      |
|  | ProductRepo    |<---------->| ProductService       |      |
|  | CategoryRepo   |            | CategoryService      |      |
|  | AttributeRepo  |            | AttributeService     |      |
|  | VariantRepo    |            | MarketplaceSyncSvc   |      |
|  | MarketplaceRepo|            | B2BService           |      |
|  | B2BCustomerRepo|            | ComplianceService    |      |
|  | CustomerTierRep|            | RegionalConfigSvc    |      |
|  | PriceListRepo  |            +----------------------+      |
|  | ContractRepo   |                      ^                   |
|  | PurchaseOrderR.|                      |                   |
|  +----------------+                      |                   |
|                                          |                   |
+--------------------------------------------------------------+
                                           |
        +--------------------+-------------+-------------+------------+
        |                    |             |             |            |
        v                    v             v             v            v
+----------------+  +----------------+ +--------+ +------------+ +--------+
| Connectors     |  | Auth           | | Credit | | Storage    | | Feature|
| Module         |  | Module         | | System | | Module     | | Flags  |
+----------------+  +----------------+ +--------+ +------------+ +--------+
```

## Data Flow

The data flow for the PIM module follows a layered approach:

1. **Client Request**: Incoming requests through controller endpoints
2. **Service Layer**: Application of business logic and validation
3. **Repository Layer**: Data access with caching and persistence
4. **Storage Layer**: Firestore database

## Key Interface Points

The PIM module provides the following key interface points:

### Exported from PIM Module

```typescript
// Product data types
export { Product, ProductStatus, ProductType } from "./models/product.model";

// B2B data types
export {
  B2BCustomer,
  CustomerTier,
  CustomerGroup,
  B2BPriceList,
  CustomerContract,
  PurchaseOrder,
} from "./models/b2b";

// Services for other modules to consume
export { ProductService, CategoryService } from "./services";

// Synchronization capabilities
export { MarketplaceSyncService } from "./services";

// B2B Services
export { B2BService } from "./services/b2b/b2b-service";
```

### Consumed by PIM Module

```typescript
// From Connectors Module
import { IMarketplaceConnector } from "../connectors/interfaces/connector.interface";
import { ConnectorFactoryService } from "../connectors/services/connector-factory.service";

// From Auth Module
import { FirebaseAuthGuard } from "../auth/guards/firebase-auth.guard";
import { GetUser } from "../auth/decorators/get-user.decorator";

// From Credit System Module
import { CreditSystemService } from "../credit-system/services/credit-system.service";

// From Feature Flags Module
import { FeatureFlagService } from "../feature-flags/services/feature-flag.service";
```

## Module Registration

The PIM module is registered in the application using dynamic module pattern:

```typescript
@Module({})
export class PimModule {
  static register(options?: Partial<PimModuleOptions>): DynamicModule {
    const controllers = [
      ProductController,
      CategoryController,
      AttributeTemplateController,
      ProductVariantController,
      TaxRateController,
      ValidationController,
      MarketplaceConnectorController,
      ImportExportController,
    ];

    // Conditionally include B2B controller based on feature flag
    if (options?.enableAdvancedB2BSupport) {
      controllers.push(B2BController);
    }

    return {
      module: PimModule,
      imports: [
        ConnectorsModule, // Required for marketplace connectors
        CreditSystemModule, // For AI-powered features
        FeatureFlagsModule, // For feature toggling
        StorageModule, // For product images
      ],
      controllers,
      providers: [
        // Core providers
        ProductService,
        CategoryService,
        AttributeTemplateService,
        // ...other providers

        // Conditionally include B2B service
        ...(options?.enableAdvancedB2BSupport
          ? [
              B2BService,
              B2BCustomerRepository,
              CustomerTierRepository,
              CustomerGroupRepository,
              B2BPriceListRepository,
              B2BContractRepository,
              PurchaseOrderRepository,
              ApprovalWorkflowRepository,
            ]
          : []),
      ],
      exports: [
        ProductService,
        CategoryService,
        // ...other exports

        // Conditionally export B2B service
        ...(options?.enableAdvancedB2BSupport ? [B2BService] : []),
      ],
    };
  }
}
```

## API Surface

The API surface is exposed through controllers:

```
# Product Operations
GET    /pim/products - List products
POST   /pim/products - Create product
GET    /pim/products/:id - Get product
PUT    /pim/products/:id - Update product
DELETE /pim/products/:id - Delete product

# Category Operations
GET    /pim/categories/tree - Get category tree
POST   /pim/categories - Create category
GET    /pim/categories/:id - Get category
PUT    /pim/categories/:id - Update category

# Attribute Operations
GET    /pim/attribute-templates - List templates
POST   /pim/attribute-templates - Create template
GET    /pim/attribute-templates/:id - Get template
PUT    /pim/attribute-templates/:id - Update template

# Variant Operations
GET    /pim/products/:id/variants - List product variants
POST   /pim/products/:id/variants - Create product variant
GET    /pim/products/:id/variants/:variantId - Get variant
PUT    /pim/products/:id/variants/:variantId - Update variant
DELETE /pim/products/:id/variants/:variantId - Delete variant

# Marketplace Operations
POST   /pim/products/:id/sync-to-marketplace/:marketplaceId - Sync product
POST   /pim/products/:id/sync-prices-to-marketplace/:marketplaceId - Sync prices
POST   /pim/products/:id/sync-stock-to-marketplace/:marketplaceId - Sync stock
GET    /pim/products/:id/validate-for-marketplace/:marketplaceId - Validate product

# Import/Export Operations
POST   /pim/import - Import products
GET    /pim/export - Export products
POST   /pim/export/template - Generate export template

# Tax Rate Operations
GET    /pim/tax-rates - List tax rates
POST   /pim/tax-rates - Create tax rate
GET    /pim/tax-rates/:id - Get tax rate
PUT    /pim/tax-rates/:id - Update tax rate
DELETE /pim/tax-rates/:id - Delete tax rate

# Validation Operations
POST   /pim/validate/product - Validate product
POST   /pim/validate/marketplace/:marketplaceId - Validate for marketplace

# Storage Operations (Network-aware with South African optimizations)
POST   /pim/storage/product-image/signed-upload-url - Generate upload URL for product image
GET    /pim/storage/product/:productId/images - List all images for a product
DELETE /pim/storage/product/:productId/images/:imageId - Delete a product image

# B2B Operations
GET    /pim/b2b/customers - List B2B customers
POST   /pim/b2b/customers - Create B2B customer
GET    /pim/b2b/customers/:id - Get B2B customer
PUT    /pim/b2b/customers/:id - Update B2B customer
DELETE /pim/b2b/customers/:id - Delete B2B customer

GET    /pim/b2b/customer-tiers - List customer tiers
POST   /pim/b2b/customer-tiers - Create customer tier
GET    /pim/b2b/customer-tiers/:id - Get customer tier
PUT    /pim/b2b/customer-tiers/:id - Update customer tier
DELETE /pim/b2b/customer-tiers/:id - Delete customer tier

GET    /pim/b2b/customer-groups - List customer groups
POST   /pim/b2b/customer-groups - Create customer group
GET    /pim/b2b/customer-groups/:id - Get customer group
PUT    /pim/b2b/customer-groups/:id - Update customer group
DELETE /pim/b2b/customer-groups/:id - Delete customer group

GET    /pim/b2b/price-lists - List price lists
POST   /pim/b2b/price-lists - Create price list
GET    /pim/b2b/price-lists/:id - Get price list
PUT    /pim/b2b/price-lists/:id - Update price list
DELETE /pim/b2b/price-lists/:id - Delete price list

GET    /pim/b2b/contracts - List contracts
POST   /pim/b2b/contracts - Create contract
GET    /pim/b2b/contracts/:id - Get contract
PUT    /pim/b2b/contracts/:id - Update contract
DELETE /pim/b2b/contracts/:id - Delete contract

GET    /pim/b2b/purchase-orders - List purchase orders
POST   /pim/b2b/purchase-orders - Create purchase order
GET    /pim/b2b/purchase-orders/:id - Get purchase order
PUT    /pim/b2b/purchase-orders/:id - Update purchase order
POST   /pim/b2b/purchase-orders/:id/approve - Approve purchase order
POST   /pim/b2b/purchase-orders/:id/reject - Reject purchase order
```
