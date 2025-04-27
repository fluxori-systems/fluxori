# PIM Module API Reference

This document provides a comprehensive reference for the Product Information Management (PIM) module's API within the Fluxori platform. The PIM module serves as the central hub for all product data, enabling management and synchronization across multiple sales channels with specific optimizations for South African e-commerce businesses.

## Overview

The PIM API provides endpoints for:

- Product CRUD operations
- Category management
- Attribute template management
- Variant management
- Media management
- Marketplace integration
- AI-enhanced product features
- Performance optimization for large catalogs
- South African specific features (VAT, load shedding support, etc.)

## Core APIs

### Product API

#### Base Endpoint: `/pim/products`

| Method   | Endpoint                                         | Description                                        |
| -------- | ------------------------------------------------ | -------------------------------------------------- |
| `POST`   | `/`                                              | Create a new product                               |
| `GET`    | `/:id`                                           | Get product by ID                                  |
| `GET`    | `/by-sku/:sku`                                   | Get product by SKU                                 |
| `PUT`    | `/:id`                                           | Update product                                     |
| `DELETE` | `/:id`                                           | Delete product                                     |
| `POST`   | `/search`                                        | Search products with filters and pagination        |
| `POST`   | `/with-variants`                                 | Create a product with variants                     |
| `POST`   | `/update-stock`                                  | Update stock levels for multiple products          |
| `POST`   | `/update-prices`                                 | Update prices for multiple products                |
| `GET`    | `/:id/variants`                                  | Get product variants                               |
| `GET`    | `/:id/marketplace-mappings`                      | Get product marketplace mappings                   |
| `POST`   | `/:id/sync-to-marketplace/:marketplaceId`        | Sync product to marketplace                        |
| `POST`   | `/:id/sync-prices-to-marketplace/:marketplaceId` | Sync product prices to marketplace                 |
| `POST`   | `/:id/sync-stock-to-marketplace/:marketplaceId`  | Sync product stock to marketplace                  |
| `GET`    | `/:id/validate-for-marketplace/:marketplaceId`   | Validate product for marketplace                   |
| `POST`   | `/import-from-marketplace/:marketplaceId`        | Import products from marketplace                   |
| `POST`   | `/search/resilient`                              | Search products with network-aware optimizations   |
| `POST`   | `/bulk-update`                                   | Bulk update products with network-aware batching   |
| `POST`   | `/optimize-performance`                          | Optimize catalog performance for large inventories |
| `GET`    | `/catalog-metrics`                               | Get catalog performance metrics                    |
| `GET`    | `/network-status`                                | Get load shedding and network status               |

#### Product Variant Endpoints

| Method   | Endpoint                   | Description                                           |
| -------- | -------------------------- | ----------------------------------------------------- |
| `POST`   | `/:id/variants`            | Create a product variant                              |
| `PUT`    | `/:id/variants/:variantId` | Update a product variant                              |
| `DELETE` | `/:id/variants/:variantId` | Delete a product variant                              |
| `POST`   | `/:id/variants/bulk`       | Bulk create or update product variants                |
| `POST`   | `/:id/variants/generate`   | Generate product variants from attribute combinations |

#### Product Media Endpoints

| Method   | Endpoint              | Description                 |
| -------- | --------------------- | --------------------------- |
| `POST`   | `/:id/media`          | Upload product media item   |
| `GET`    | `/:id/media`          | Get product media items     |
| `DELETE` | `/:id/media/:mediaId` | Delete product media item   |
| `PUT`    | `/:id/media/:mediaId` | Update product media item   |
| `PUT`    | `/:id/media/reorder`  | Reorder product media items |
| `PUT`    | `/:id/media/main`     | Set product main image      |

#### Batch Operations

| Method | Endpoint                   | Description                         |
| ------ | -------------------------- | ----------------------------------- |
| `POST` | `/batch-update`            | Batch update products               |
| `POST` | `/batch-delete`            | Batch delete products               |
| `POST` | `/batch-update-status`     | Batch update product status         |
| `POST` | `/batch-assign-categories` | Batch assign categories to products |
| `POST` | `/batch-apply-attributes`  | Batch apply attribute values        |

#### Import/Export

| Method | Endpoint  | Description                   |
| ------ | --------- | ----------------------------- |
| `POST` | `/import` | Import products from CSV/JSON |
| `POST` | `/export` | Export products to CSV/JSON   |

### Product AI API

#### Base Endpoint: `/pim/ai`

| Method | Endpoint              | Description                                 |
| ------ | --------------------- | ------------------------------------------- |
| `POST` | `/descriptions`       | Generate AI-enhanced product description    |
| `POST` | `/attributes/extract` | Extract product attributes from description |
| `POST` | `/images/analyze`     | Analyze product images                      |
| `POST` | `/variants/generate`  | Generate product variants                   |

### Category API

#### Base Endpoint: `/pim/categories`

| Method   | Endpoint        | Description                 |
| -------- | --------------- | --------------------------- |
| `POST`   | `/`             | Create a new category       |
| `GET`    | `/:id`          | Get category by ID          |
| `GET`    | `/`             | Get all categories          |
| `PUT`    | `/:id`          | Update category             |
| `DELETE` | `/:id`          | Delete category             |
| `GET`    | `/tree`         | Get category tree structure |
| `PUT`    | `/reorder`      | Reorder categories          |
| `GET`    | `/:id/products` | Get products in category    |

### Attribute Template API

#### Base Endpoint: `/pim/attribute-templates`

| Method   | Endpoint                   | Description                         |
| -------- | -------------------------- | ----------------------------------- |
| `POST`   | `/`                        | Create a new attribute template     |
| `GET`    | `/:id`                     | Get attribute template by ID        |
| `GET`    | `/`                        | Get all attribute templates         |
| `PUT`    | `/:id`                     | Update attribute template           |
| `DELETE` | `/:id`                     | Delete attribute template           |
| `GET`    | `/variant`                 | Get variant attribute templates     |
| `GET`    | `/by-category/:categoryId` | Get attribute templates by category |

### Marketplace Field API

#### Base Endpoint: `/pim/marketplace-fields`

| Method   | Endpoint                         | Description                         |
| -------- | -------------------------------- | ----------------------------------- |
| `POST`   | `/`                              | Create a new marketplace field      |
| `GET`    | `/:id`                           | Get marketplace field by ID         |
| `GET`    | `/`                              | Get all marketplace fields          |
| `PUT`    | `/:id`                           | Update marketplace field            |
| `DELETE` | `/:id`                           | Delete marketplace field            |
| `GET`    | `/by-marketplace/:marketplaceId` | Get fields for specific marketplace |

### Marketplace Validation API

#### Base Endpoint: `/pim/marketplace-validations`

| Method   | Endpoint                         | Description                                   |
| -------- | -------------------------------- | --------------------------------------------- |
| `POST`   | `/`                              | Create a new marketplace validation rule      |
| `GET`    | `/:id`                           | Get marketplace validation rule by ID         |
| `GET`    | `/`                              | Get all marketplace validation rules          |
| `PUT`    | `/:id`                           | Update marketplace validation rule            |
| `DELETE` | `/:id`                           | Delete marketplace validation rule            |
| `GET`    | `/by-marketplace/:marketplaceId` | Get validation rules for specific marketplace |
| `POST`   | `/validate`                      | Validate product against marketplace rules    |

## Data Models

### Product

```typescript
interface Product {
  id: string;
  organizationId: string;
  sku: string; // Primary product identifier for external systems
  barcode?: string; // EAN, UPC, ISBN or other standard barcode
  name: string;
  description?: string;
  shortDescription?: string;
  type: ProductType; // 'simple', 'variant', 'configurable', 'digital', etc.
  status: ProductStatus; // 'active', 'draft', 'archived', etc.

  // Category info
  categoryIds: string[];
  categoryNames?: string[];

  // Brand info
  brandId?: string;
  brandName?: string;

  // Media
  mainImageUrl?: string;
  additionalImageUrls?: string[];
  videoUrls?: string[];
  digitalAssetIds?: string[];

  // Pricing
  pricing: ProductPricing;

  // Variants
  hasVariants: boolean;
  variantIds?: string[]; // IDs of related product variants

  // Variant-specific data
  isVariant: boolean;
  parentProductId?: string;
  attributeSetId?: string;

  // Stock and inventory
  stockQuantity: number; // Total stock across all warehouses
  reservedQuantity: number; // Stock reserved for orders
  availableQuantity: number; // stock - reserved
  lowStockThreshold?: number;

  // Logistics information
  weight?: number;
  weightUnit?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  shippingClass?: string;

  // Supply chain
  leadTimeInDays?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  supplierIds?: string[];
  defaultSupplierId?: string;

  // Attributes and specifications
  attributes: ProductAttributeValue[];

  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  slug?: string;

  // South African specific
  saCompliance?: SouthAfricanCompliance;

  // Marketplace sync status
  syncStatus?: ProductSyncStatus[];

  // External IDs - for marketplace and connector IDs
  externalIds?: Record<string, string>;

  // Additional metadata
  metadata?: Record<string, any>;
  tags?: string[];

  // Multi-warehouse support
  defaultWarehouseId?: string;
  warehouseStock?: Record<
    string,
    {
      available: number;
      reserved: number;
      onOrder?: number;
    }
  >;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### ProductPricing

```typescript
interface ProductPricing {
  basePrice: number;
  currency: string; // Currency code (e.g., 'ZAR', 'USD')
  salePrice?: number;
  costPrice?: number;
  msrp?: number; // Manufacturer's suggested retail price
  vatIncluded: boolean; // Whether VAT is included in the price
  vatRate?: number; // VAT rate (e.g., 0.15 for South African 15% VAT)
  wholesalePrice?: number;
  minimumAdvertisedPrice?: number;
  priceEffectiveDate?: {
    start?: Date;
    end?: Date;
  };
}
```

### ProductAttributeValue

```typescript
interface ProductAttributeValue {
  attributeId: string;
  attributeName: string;
  value: string | number | boolean | string[];
  unit?: string;
  isVariantAttribute?: boolean;
  isFilterable?: boolean;
  isSearchable?: boolean;
  isRequired?: boolean;
  sortOrder?: number;
}
```

### SouthAfricanCompliance

```typescript
interface SouthAfricanCompliance {
  icasaApproved?: boolean; // ICASA approval for electronic/communication devices
  sansCompliant?: boolean; // South African National Standards compliance
  nrcsApproved?: boolean; // National Regulator for Compulsory Specifications
  itarControlled?: boolean; // International Traffic in Arms Regulations
  sahpraRegistered?: boolean; // South African Health Products Regulatory Authority
  containsRestrictedSubstances?: boolean;
  taxCategory?: string;
  importPermitRequired?: boolean;
  exportPermitRequired?: boolean;
  localContentPercentage?: number;
  beeSupplier?: boolean; // Black Economic Empowerment supplier status
  beeLevel?: number; // BEE level (1-8)
}
```

### ProductVariant

```typescript
interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode?: string;
  name: string;
  status: ProductStatus;
  attributes: ProductAttributeValue[];
  pricing: ProductPricing;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  mainImageUrl?: string;
  additionalImageUrls?: string[];
  weight?: number;
  weightUnit?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  externalIds?: Record<string, string>;
  warehouseStock?: Record<
    string,
    {
      available: number;
      reserved: number;
    }
  >;
  createdAt: Date;
  updatedAt: Date;
}
```

### ProductSearchOptions

```typescript
interface ProductSearchOptions {
  search?: string; // Free text search
  filters?: {
    categoryIds?: string[];
    status?: ProductStatus[];
    priceRange?: {
      min?: number;
      max?: number;
      currency?: string;
    };
    stockRange?: {
      min?: number;
      max?: number;
    };
    attributes?: Array<{
      attributeId: string;
      values: (string | number | boolean)[];
      operator?: "and" | "or";
    }>;
    hasVariants?: boolean;
    isVariant?: boolean;
    tags?: string[];
    createdDateRange?: {
      start?: Date;
      end?: Date;
    };
    updatedDateRange?: {
      start?: Date;
      end?: Date;
    };
  };
  pagination?: {
    page?: number;
    limit?: number;
  };
  sort?: {
    field: string;
    direction: "asc" | "desc";
  }[];
  includeVariants?: boolean;
  includeImages?: boolean;
  includeCategoryInfo?: boolean;
}
```

### BulkOperationResult

```typescript
interface BulkOperationResult {
  successCount: number;
  failureCount: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
  warnings?: Array<{
    id: string;
    warning: string;
  }>;
  operationId?: string; // For tracking async operations
}
```

## Network Resilience Features

The PIM module includes several features specifically designed for South African network conditions:

### Load Shedding Detection

Endpoints are provided to detect load shedding and adjust application behavior accordingly:

```typescript
interface LoadSheddingStatus {
  isActive: boolean;
  stage: number;
  nextScheduledOutage?: Date;
  estimatedResolutionTime?: Date;
  regionId?: string;
  regionName?: string;
}
```

### Network-Aware API Calls

Search and batch operations support network awareness:

```typescript
interface NetworkAwareOptions {
  adaptToNetworkQuality?: boolean; // Adjust result size based on network quality
  cacheResults?: boolean; // Cache results for offline access
  cacheTtlSeconds?: number; // How long to cache results
  minimalFields?: boolean; // Return only essential fields for better performance
  progressiveLoading?: boolean; // Load critical data first, then supplementary
}
```

### Performance Optimization

For large catalogs and challenging network conditions:

```typescript
interface PerformanceOptimizationOptions {
  prefetchHighTrafficCategories?: boolean; // Preload commonly accessed categories
  precomputeFilters?: boolean; // Precompute common filter combinations
  optimizeCaching?: boolean; // Optimize cache strategy
  createIndexes?: boolean; // Create recommended database indexes
}
```

## AI Features API

### Product Description Generation

```typescript
// Request
interface GenerateDescriptionRequest {
  productInfo: {
    name: string;
    category: string;
    basicDescription?: string;
    keyFeatures?: string[];
    specifications?: Record<string, string>;
    targetAudience?: string;
    tone?: "professional" | "casual" | "technical" | "enthusiastic";
    length?: "short" | "medium" | "long";
  };
  options?: {
    includeBulletPoints?: boolean;
    includeKeywords?: string[];
    focusOnBenefits?: boolean;
    seoOptimized?: boolean;
    maxLength?: number;
  };
}

// Response
interface GenerateDescriptionResponse {
  description: string;
  bulletPoints?: string[];
  seoTitle?: string;
  seoDescription?: string;
  tokenUsage: {
    total: number;
    description: number;
    bulletPoints?: number;
    seo?: number;
  };
}
```

### Attribute Extraction

```typescript
// Request
interface ExtractAttributesRequest {
  productInfo: {
    name: string;
    description: string;
    category: string;
    specifications?: Record<string, string>;
  };
}

// Response
interface ExtractAttributesResponse {
  attributes: ProductAttributeValue[];
  confidence: number;
  suggestedCategories?: string[];
  tokenUsage: {
    total: number;
  };
}
```

### Image Analysis

```typescript
// Request
interface AnalyzeImagesRequest {
  imageUrls: string[];
}

// Response
interface AnalyzeImagesResponse {
  analysis: Array<{
    imageUrl: string;
    detectedObjects: string[];
    suggestedAttributes: ProductAttributeValue[];
    dominantColors: string[];
    qualityAssessment: {
      score: number;
      issues?: string[];
    };
    containsText: boolean;
    detectedText?: string;
  }>;
  tokenUsage: {
    total: number;
  };
}
```

### Variant Generation

```typescript
// Request
interface GenerateVariantsRequest {
  productInfo: {
    name: string;
    description: string;
    category: string;
    attributes: Record<string, string[]>;
  };
}

// Response
interface GenerateVariantsResponse {
  recommendedVariants: Array<{
    attributeCombination: Record<string, string>;
    suggestedSku?: string;
    suggestedName?: string;
  }>;
  recommendedAttributes?: Array<{
    attributeName: string;
    suggestedValues: string[];
  }>;
  tokenUsage: {
    total: number;
  };
}
```

## Client Usage Examples

### Creating a Product

```typescript
import { ProductApi } from "@/api/pim";

// Create a new product
const newProduct = await ProductApi.createProduct({
  name: "Samsung Galaxy S22",
  sku: "SGS22-BLK-128",
  type: "simple",
  status: "active",
  categoryIds: ["smartphones"],
  pricing: {
    basePrice: 14999.99,
    currency: "ZAR",
    vatIncluded: true,
    vatRate: 0.15,
  },
  stockQuantity: 100,
  reservedQuantity: 0,
  availableQuantity: 100,
  attributes: [
    {
      attributeId: "color",
      attributeName: "Color",
      value: "Black",
      isVariantAttribute: true,
    },
    {
      attributeId: "storage",
      attributeName: "Storage",
      value: "128GB",
      isVariantAttribute: true,
    },
  ],
});
```

### Searching Products

```typescript
import { ProductApi } from "@/api/pim";

// Search for products
const searchResults = await ProductApi.searchProducts({
  search: "samsung",
  filters: {
    categoryIds: ["smartphones"],
    priceRange: {
      min: 10000,
      max: 20000,
      currency: "ZAR",
    },
    attributes: [
      {
        attributeId: "brand",
        values: ["Samsung"],
      },
    ],
  },
  pagination: {
    page: 1,
    limit: 20,
  },
  sort: [
    {
      field: "pricing.basePrice",
      direction: "asc",
    },
  ],
});
```

### Using AI Features

```typescript
import { ProductAiApi } from "@/api/pim";

// Generate product description
const descriptionResult = await ProductAiApi.generateProductDescription({
  productInfo: {
    name: "Samsung Galaxy S22",
    category: "Smartphones",
    keyFeatures: [
      "6.1-inch Dynamic AMOLED display",
      "Triple camera system",
      "128GB storage",
      "8GB RAM",
    ],
    tone: "enthusiastic",
  },
  options: {
    includeBulletPoints: true,
    seoOptimized: true,
  },
});
```

### Syncing with Marketplaces

```typescript
import { ProductApi } from "@/api/pim";

// Sync product to marketplace
const syncResult = await ProductApi.syncProductToMarketplace(
  "product-123",
  "takealot-1",
);

// Validate product for marketplace
const validationResult = await ProductApi.validateProductForMarketplace(
  "product-123",
  "takealot-1",
);
```

## Error Handling

All API endpoints return standard error responses with HTTP status codes and structured error messages:

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  details?: any;
}
```

Common error codes:

| Status Code | Description                                                                        |
| ----------- | ---------------------------------------------------------------------------------- |
| 400         | Bad Request - Invalid input data                                                   |
| 401         | Unauthorized - Authentication required                                             |
| 403         | Forbidden - Insufficient permissions                                               |
| 404         | Not Found - Resource not found                                                     |
| 409         | Conflict - Resource already exists or conflict state                               |
| 422         | Unprocessable Entity - Validation failed                                           |
| 429         | Too Many Requests - Rate limit exceeded                                            |
| 500         | Internal Server Error - Server-side error                                          |
| 503         | Service Unavailable - Service temporarily unavailable (e.g., during load shedding) |

## Pagination

List endpoints support standard pagination parameters:

```typescript
interface PaginationParams {
  page?: number; // Page number (1-based)
  limit?: number; // Items per page
}

interface PaginatedResponse<T> {
  data: T[];
  metadata: {
    total: number; // Total number of items
    page: number; // Current page
    limit: number; // Items per page
    pages: number; // Total number of pages
  };
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- Standard limit: 100 requests per minute per user
- Bulk operations: 20 requests per minute
- AI operations: 50 requests per hour

When rate limited, the API will return a 429 status code with headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1619789222
```

## Webhooks

The PIM module provides webhooks for real-time notifications:

| Event                       | Description                           |
| --------------------------- | ------------------------------------- |
| `product.created`           | Product created                       |
| `product.updated`           | Product updated                       |
| `product.deleted`           | Product deleted                       |
| `product.sync.started`      | Product sync to marketplace started   |
| `product.sync.completed`    | Product sync to marketplace completed |
| `product.sync.failed`       | Product sync to marketplace failed    |
| `product.inventory.updated` | Product inventory updated             |
| `product.price.updated`     | Product price updated                 |

Webhook payload example:

```json
{
  "event": "product.updated",
  "timestamp": "2023-04-25T10:15:30Z",
  "data": {
    "productId": "prod-123",
    "sku": "SGS22-BLK-128",
    "changes": ["pricing", "stockQuantity"],
    "organizationId": "org-456"
  }
}
```

## South African Optimizations

The PIM API includes specific optimizations for South African e-commerce:

1. **Load Shedding Resilience**:

   - Queue operations during power outages
   - Low-bandwidth mode
   - Offline data capabilities

2. **Network Optimization**:

   - Progressive loading
   - Minimal data transfer
   - Adaptive batch sizes

3. **VAT Handling**:

   - 15% VAT calculation
   - VAT-inclusive pricing
   - VAT registration verification

4. **Marketplace Integration**:

   - Takealot-specific fields
   - South African shipping provider integration
   - SA compliance requirements

5. **Multi-warehouse Support**:
   - Regional warehouse management
   - Optimal fulfillment center selection
   - Cross-warehouse inventory visibility

## Security

All API endpoints require authentication using the Firebase Authentication system. API calls must include a bearer token:

```
Authorization: Bearer <firebase-token>
```

Access is controlled based on organization membership and role-based permissions.

## Performance Considerations

For large catalogs and challenging network conditions:

1. Use the `/search/resilient` endpoint for network-aware product searches
2. Implement progressive loading with the `progressiveLoading` option
3. Use batch operations for multiple updates
4. Implement caching strategies for offline access
5. Monitor load shedding status and adjust application behavior
6. Use the optimized endpoints for South African network conditions

## Appendix: Available Webhooks

### Subscription Endpoint

To subscribe to webhooks, use:

```
POST /pim/webhooks/subscribe
```

With payload:

```json
{
  "url": "https://yourdomain.com/webhooks/pim",
  "events": ["product.created", "product.updated"],
  "secret": "your-webhook-secret"
}
```

### Verification

Webhooks include a signature header for verification:

```
X-PIM-Signature: sha256=<HMAC signature>
```

Verify using your webhook secret:

```javascript
const crypto = require("crypto");
const isValid = (payload, secret, signature) => {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(JSON.stringify(payload)).digest("hex");
  return `sha256=${digest}` === signature;
};
```
