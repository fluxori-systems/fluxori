# Fluxori API Reference

This document provides a comprehensive reference for the Fluxori REST API. The API allows you to integrate Fluxori's powerful e-commerce operations capabilities with your existing systems.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [API Conventions](#api-conventions)
4. [Rate Limits](#rate-limits)
5. [Endpoints](#endpoints)
   - [Inventory](#inventory)
   - [Orders](#orders)
   - [Marketplaces](#marketplaces)
   - [File Storage](#file-storage)
   - [AI Insights](#ai-insights)
6. [Webhooks](#webhooks)
7. [Error Handling](#error-handling)
8. [SDKs](#sdks)

## Getting Started

### Base URL

All API requests should be made to the following base URL:

```
https://api.fluxori.com/v1/
```

For testing and development, use the sandbox environment:

```
https://api.sandbox.fluxori.com/v1/
```

### Requirements

To use the Fluxori API, you need:

1. A Fluxori account with API access enabled
2. An API key with appropriate permissions
3. HTTPS support for all requests

## Authentication

### API Keys

All API requests must include an API key for authentication. You can generate API keys in the Fluxori dashboard under **Settings → Integrations → API**.

Include your API key in the `Authorization` header of all requests:

```
Authorization: Bearer your-api-key
```

### Permissions

API keys can be scoped with specific permissions:

- `read:inventory` - View inventory data
- `write:inventory` - Modify inventory data
- `read:orders` - View order data
- `write:orders` - Create and modify orders
- `read:customers` - View customer data
- `write:customers` - Create and modify customers
- `read:insights` - Access AI insights
- `admin` - Full administrative access

When creating an API key, select only the permissions needed for your integration.

## API Conventions

### Request Format

The API accepts requests with JSON bodies. Set the following header on all requests:

```
Content-Type: application/json
```

### Response Format

All responses are returned in JSON format. Each response includes:

- HTTP status code
- Response body with requested data
- Optional error details if something went wrong

Successful responses have a 2xx status code and return the requested data directly.

### Pagination

List endpoints support pagination using the following parameters:

- `page` - Page number (starting from 1)
- `limit` - Number of items per page (default 50, max 100)

Example request:

```
GET /inventory/products?page=2&limit=25
```

Paginated responses include metadata about the total count and pagination:

```json
{
  "data": [...],
  "meta": {
    "totalCount": 320,
    "page": 2,
    "limit": 25,
    "pageCount": 13
  }
}
```

### Filtering

Many endpoints support filtering results using query parameters:

```
GET /inventory/products?status=active&minStock=10
```

### Sorting

Sort results using the `sort` parameter:

```
GET /inventory/products?sort=name
GET /inventory/products?sort=-createdAt
```

Use a minus sign (`-`) prefix to sort in descending order.

## Rate Limits

To ensure fair usage, API requests are subject to rate limiting:

- Standard tier: 60 requests per minute
- Premium tier: 300 requests per minute
- Enterprise tier: Custom limits

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1620000000
```

If you exceed the rate limit, you'll receive a `429 Too Many Requests` response.

## Endpoints

### Inventory

#### List Products

```
GET /inventory/products
```

Query parameters:

- `status` (string): Filter by status (`active`, `archived`, `draft`)
- `category` (string): Filter by category ID
- `search` (string): Search by name, SKU, or barcode
- `minStock` (number): Filter by minimum stock level
- `maxStock` (number): Filter by maximum stock level
- `updatedAfter` (string): ISO date for filtering by last updated date

Example response:

```json
{
  "data": [
    {
      "id": "prod_123456789",
      "name": "Premium Leather Wallet",
      "sku": "PLW-001",
      "barcode": "6001234567890",
      "status": "active",
      "description": "Genuine leather wallet with 6 card slots",
      "price": {
        "cost": 150.00,
        "retail": 299.99,
        "currency": "ZAR"
      },
      "attributes": {
        "color": "Brown",
        "material": "Leather"
      },
      "dimensions": {
        "weight": 0.2,
        "width": 10,
        "height": 8,
        "length": 1,
        "unit": "cm"
      },
      "stockLevels": [
        {
          "warehouseId": "wh_12345",
          "available": 120,
          "allocated": 5,
          "backorder": 0
        }
      ],
      "images": [
        "https://storage.fluxori.com/images/products/plw-001-main.jpg"
      ],
      "createdAt": "2023-01-15T08:30:00Z",
      "updatedAt": "2023-01-15T08:30:00Z"
    }
  ],
  "meta": {
    "totalCount": 241,
    "page": 1,
    "limit": 50,
    "pageCount": 5
  }
}
```

#### Get Product

```
GET /inventory/products/{productId}
```

Path parameters:

- `productId` (string): The unique product ID

Example response: Same as single product object from list

#### Create Product

```
POST /inventory/products
```

Request body:

```json
{
  "name": "Premium Leather Wallet",
  "sku": "PLW-001",
  "barcode": "6001234567890",
  "status": "active",
  "description": "Genuine leather wallet with 6 card slots",
  "price": {
    "cost": 150.00,
    "retail": 299.99,
    "currency": "ZAR"
  },
  "attributes": {
    "color": "Brown",
    "material": "Leather"
  },
  "dimensions": {
    "weight": 0.2,
    "width": 10,
    "height": 8,
    "length": 1,
    "unit": "cm"
  },
  "categoryId": "cat_12345",
  "images": [
    "https://storage.fluxori.com/images/products/plw-001-main.jpg"
  ]
}
```

#### Update Product

```
PATCH /inventory/products/{productId}
```

Path parameters:

- `productId` (string): The unique product ID

Request body: Same as create product, with only the fields to update

#### Delete Product

```
DELETE /inventory/products/{productId}
```

Path parameters:

- `productId` (string): The unique product ID

#### Adjust Stock

```
POST /inventory/stock/adjust
```

Request body:

```json
{
  "productId": "prod_123456789",
  "warehouseId": "wh_12345",
  "adjustment": 10,
  "reason": "Stock count correction",
  "reference": "SC-2023-04-15"
}
```

### Orders

#### List Orders

```
GET /orders
```

Query parameters:

- `status` (string): Filter by status
- `source` (string): Filter by source (e.g., `takealot`, `manual`)
- `fromDate` (string): Filter by creation date (ISO format)
- `toDate` (string): Filter by creation date (ISO format)
- `customerEmail` (string): Filter by customer email

Example response:

```json
{
  "data": [
    {
      "id": "ord_123456789",
      "externalId": "TAK-12345",
      "source": "takealot",
      "status": "PROCESSING",
      "fulfillmentStatus": "UNFULFILLED",
      "paymentStatus": "PAID",
      "customer": {
        "id": "cus_12345",
        "email": "customer@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+27123456789"
      },
      "shippingAddress": {
        "address1": "123 Main Street",
        "city": "Johannesburg",
        "state": "Gauteng",
        "postalCode": "2000",
        "country": "ZA"
      },
      "lineItems": [
        {
          "productId": "prod_123456789",
          "sku": "PLW-001",
          "name": "Premium Leather Wallet",
          "quantity": 1,
          "price": 299.99,
          "currency": "ZAR"
        }
      ],
      "totals": {
        "subtotal": 299.99,
        "shipping": 50.00,
        "tax": 52.50,
        "discount": 0.00,
        "total": 402.49
      },
      "createdAt": "2023-04-15T14:22:00Z",
      "updatedAt": "2023-04-15T14:22:00Z"
    }
  ],
  "meta": {
    "totalCount": 156,
    "page": 1,
    "limit": 50,
    "pageCount": 4
  }
}
```

#### Get Order

```
GET /orders/{orderId}
```

Path parameters:

- `orderId` (string): The unique order ID

Example response: Same as single order object from list

#### Create Order

```
POST /orders
```

Request body:

```json
{
  "source": "manual",
  "customer": {
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+27123456789"
  },
  "shippingAddress": {
    "address1": "123 Main Street",
    "city": "Johannesburg",
    "state": "Gauteng",
    "postalCode": "2000",
    "country": "ZA"
  },
  "lineItems": [
    {
      "productId": "prod_123456789",
      "quantity": 1
    }
  ],
  "shippingMethod": "standard",
  "paymentMethod": "credit_card",
  "paymentDetails": {
    "reference": "PAY-12345"
  }
}
```

#### Update Order Status

```
PATCH /orders/{orderId}/status
```

Path parameters:

- `orderId` (string): The unique order ID

Request body:

```json
{
  "status": "PROCESSING",
  "reason": "Payment confirmed"
}
```

#### Create Fulfillment

```
POST /orders/{orderId}/fulfillments
```

Path parameters:

- `orderId` (string): The unique order ID

Request body:

```json
{
  "warehouseId": "wh_12345",
  "lineItems": [
    {
      "productId": "prod_123456789",
      "quantity": 1
    }
  ],
  "trackingNumber": "TRK12345678",
  "shippingCarrier": "The Courier Guy"
}
```

### Marketplaces

#### List Marketplace Connections

```
GET /marketplaces/connections
```

Example response:

```json
{
  "data": [
    {
      "id": "con_12345",
      "marketplace": "takealot",
      "status": "active",
      "accountName": "MyStore",
      "lastSyncTime": "2023-04-15T08:00:00Z",
      "createdAt": "2023-01-10T08:30:00Z"
    }
  ]
}
```

#### Get Channel Listings

```
GET /marketplaces/listings
```

Query parameters:

- `marketplace` (string): Filter by marketplace
- `productId` (string): Filter by product ID
- `status` (string): Filter by status

Example response:

```json
{
  "data": [
    {
      "id": "lst_12345",
      "marketplaceId": "con_12345",
      "marketplace": "takealot",
      "externalId": "TAK-PROD-12345",
      "productId": "prod_123456789",
      "status": "active",
      "title": "Premium Leather Wallet - Brown",
      "price": 299.99,
      "currency": "ZAR",
      "url": "https://www.takealot.com/product/12345",
      "lastSyncTime": "2023-04-15T08:00:00Z",
      "createdAt": "2023-01-15T10:30:00Z",
      "updatedAt": "2023-04-15T08:00:00Z"
    }
  ],
  "meta": {
    "totalCount": 156,
    "page": 1,
    "limit": 50,
    "pageCount": 4
  }
}
```

### File Storage

#### Get Signed Upload URL

```
POST /files/signed-url
```

Request body:

```json
{
  "fileName": "product-image.jpg",
  "contentType": "image/jpeg",
  "sizeBytes": 102400,
  "folder": "products",
  "metadata": {
    "productId": "prod_123456789"
  }
}
```

Example response:

```json
{
  "url": "https://storage.googleapis.com/fluxori-storage...",
  "fileId": "file_12345",
  "fields": {
    "key": "products/file_12345-product-image.jpg",
    "policy": "eyJleHBpcmF0aW9uIjoiMjAyMy0wNC0xNVQxNTowMDowMFoiLCJjb...",
    "x-goog-algorithm": "GOOG4-RSA-SHA256",
    "x-goog-credential": "example-credential",
    "x-goog-date": "20230415T140000Z",
    "x-goog-signature": "example-signature"
  }
}
```

#### List Files

```
GET /files
```

Query parameters:

- `entityType` (string): Filter by entity type
- `entityId` (string): Filter by entity ID

Example response:

```json
{
  "data": [
    {
      "id": "file_12345",
      "fileName": "product-image.jpg",
      "contentType": "image/jpeg",
      "sizeBytes": 102400,
      "bucketPath": "products/file_12345-product-image.jpg",
      "url": "https://storage.fluxori.com/products/file_12345-product-image.jpg",
      "metadata": {
        "productId": "prod_123456789"
      },
      "isPublic": true,
      "createdAt": "2023-04-15T14:00:00Z"
    }
  ],
  "meta": {
    "totalCount": 24,
    "page": 1,
    "limit": 50,
    "pageCount": 1
  }
}
```

#### Delete File

```
DELETE /files/{fileId}
```

Path parameters:

- `fileId` (string): The unique file ID

### AI Insights

#### Generate Product Analysis

```
POST /ai-insights/products/analyze
```

Request body:

```json
{
  "productIds": ["prod_123456789", "prod_987654321"],
  "timeRange": "last_90_days",
  "analysisType": "performance"
}
```

Example response:

```json
{
  "id": "ins_12345",
  "status": "PROCESSING",
  "estimatedCompletionTime": "2023-04-15T14:05:00Z"
}
```

#### Get Analysis Result

```
GET /ai-insights/{insightId}
```

Path parameters:

- `insightId` (string): The insight ID returned from the generate endpoint

Example response:

```json
{
  "id": "ins_12345",
  "status": "COMPLETED",
  "type": "product_performance",
  "input": {
    "productIds": ["prod_123456789", "prod_987654321"],
    "timeRange": "last_90_days"
  },
  "result": {
    "summary": "Product PLW-001 shows strong performance with consistent sales...",
    "recommendations": [
      "Consider increasing stock levels for PLW-001 before holiday season",
      "Product XYZ-002 is showing declining sales, consider promotional pricing"
    ],
    "metrics": {
      "prod_123456789": {
        "salesTrend": "INCREASING",
        "conversion": 4.2,
        "averageOrderValue": 320.50
      },
      "prod_987654321": {
        "salesTrend": "DECREASING",
        "conversion": 1.8,
        "averageOrderValue": 180.25
      }
    }
  },
  "createdAt": "2023-04-15T14:00:00Z",
  "completedAt": "2023-04-15T14:03:22Z"
}
```

## Webhooks

### Configuring Webhooks

Set up webhooks to receive real-time notifications when events occur in your Fluxori account. Configure webhooks in the dashboard under **Settings → Integrations → Webhooks**.

### Event Types

Fluxori supports the following event types:

- `order.created`
- `order.updated`
- `order.paid`
- `order.fulfilled`
- `order.cancelled`
- `product.created`
- `product.updated`
- `product.deleted`
- `inventory.updated`
- `marketplace.sync.completed`

### Webhook Format

Webhooks are sent as HTTP POST requests with a JSON body:

```json
{
  "event": "order.created",
  "timestamp": "2023-04-15T14:22:00Z",
  "data": {
    "id": "ord_123456789",
    "source": "takealot",
    "status": "NEW",
    "customer": {
      "email": "customer@example.com"
    }
  }
}
```

### Verifying Webhooks

Webhooks include a signature header to verify authenticity:

```
X-Fluxori-Signature: t=1681567320,v1=5257a869e7ecebb07efe5b2c34...
```

To verify the signature:

1. Extract the timestamp (`t`) and signature (`v1`) from the header
2. Compute the HMAC-SHA256 of the timestamp + '.' + request body using your webhook secret
3. Compare the computed signature with the one in the header

## Error Handling

### Error Responses

Error responses follow this format:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "details": [
      {
        "field": "price",
        "message": "Price must be greater than 0"
      }
    ]
  }
}
```

### Common Error Codes

- `authentication_error` - Invalid API key
- `authorization_error` - Insufficient permissions
- `validation_error` - Invalid request data
- `not_found` - Resource not found
- `rate_limit_exceeded` - Too many requests
- `server_error` - Internal server error

## SDKs

Fluxori provides official SDKs for popular programming languages:

- [JavaScript/Node.js](https://github.com/fluxori/fluxori-node)
- [PHP](https://github.com/fluxori/fluxori-php)
- [Python](https://github.com/fluxori/fluxori-python)
- [Java](https://github.com/fluxori/fluxori-java)
- [Go](https://github.com/fluxori/fluxori-go)

Each SDK follows the same patterns as the REST API but provides language-specific conveniences.

Example (Node.js):

```javascript
const Fluxori = require('fluxori');
const client = new Fluxori('your-api-key');

// Get products
const products = await client.inventory.products.list({
  status: 'active',
  limit: 20
});

// Create an order
const order = await client.orders.create({
  customer: {
    email: 'customer@example.com'
  },
  // ... other order details
});
```

---

For additional help and resources:

- [API Changelog](./changelog.md)
- [Tutorials](./tutorials.md)
- [Sample Applications](./samples.md)
- [Support](mailto:api-support@fluxori.com)