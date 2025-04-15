# PIM Marketplace API Reference

This document provides the API reference for the PIM Marketplace integration endpoints, including support for all South African marketplaces.

## Base URL

All API endpoints are relative to: `/pim/marketplace`

## Authentication

All endpoints require authentication using Firebase authentication. Include the Firebase ID token in the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
```

## Endpoints

### Marketplace Mappings

#### Get Mappings by Product

```
GET /mappings/product/:productId
```

Retrieves all marketplace mappings for a specific product.

**Path Parameters:**
- `productId` (string, required): The ID of the product

**Response:**
```json
[
  {
    "id": "mapping-id",
    "productId": "product-id",
    "marketplaceId": "takealot",
    "marketplaceProductId": "TAKEALOT-123",
    "status": "active",
    "variantId": "variant-id",
    "createdAt": "2025-04-14T10:00:00Z",
    "updatedAt": "2025-04-14T10:00:00Z",
    "lastSyncedAt": "2025-04-14T10:00:00Z",
    "marketplaceData": {
      // Marketplace-specific data
    }
  }
]
```

#### Get Mappings by Marketplace

```
GET /mappings/marketplace/:marketplaceId?page=0&pageSize=20
```

Retrieves product mappings for a specific marketplace with pagination.

**Path Parameters:**
- `marketplaceId` (string, required): The marketplace ID (e.g., `takealot`, `bidorbuy`, `makro`)

**Query Parameters:**
- `page` (number, optional): Page number (0-based, defaults to 0)
- `pageSize` (number, optional): Number of items per page (defaults to 20)

**Response:**
```json
[
  {
    "id": "mapping-id",
    "productId": "product-id",
    "marketplaceId": "bidorbuy",
    "marketplaceProductId": "BOB-123",
    "status": "active",
    "variantId": null,
    "createdAt": "2025-04-14T10:00:00Z",
    "updatedAt": "2025-04-14T10:00:00Z",
    "lastSyncedAt": "2025-04-14T10:00:00Z",
    "marketplaceData": {
      // Marketplace-specific data
    }
  }
]
```

#### Get Mapping by ID

```
GET /mappings/:mappingId
```

Retrieves a specific marketplace mapping.

**Path Parameters:**
- `mappingId` (string, required): The mapping ID

**Response:**
```json
{
  "id": "mapping-id",
  "productId": "product-id",
  "marketplaceId": "makro",
  "marketplaceProductId": "MAKRO-123",
  "status": "active",
  "variantId": null,
  "createdAt": "2025-04-14T10:00:00Z",
  "updatedAt": "2025-04-14T10:00:00Z",
  "lastSyncedAt": "2025-04-14T10:00:00Z",
  "marketplaceData": {
    // Marketplace-specific data
  }
}
```

#### Create Mapping

```
POST /mappings
```

Creates a new marketplace mapping.

**Request Body:**
```json
{
  "productId": "product-id",
  "marketplaceId": "takealot",
  "marketplaceProductId": "TAKEALOT-123",
  "variantId": "variant-id", // Optional
  "marketplaceData": {
    // Marketplace-specific data
  }
}
```

**Response:**
```json
{
  "id": "mapping-id",
  "productId": "product-id",
  "marketplaceId": "takealot",
  "marketplaceProductId": "TAKEALOT-123",
  "status": "active",
  "variantId": "variant-id",
  "createdAt": "2025-04-14T10:00:00Z",
  "updatedAt": "2025-04-14T10:00:00Z",
  "lastSyncedAt": null,
  "marketplaceData": {
    // Marketplace-specific data
  }
}
```

#### Update Mapping

```
PUT /mappings/:mappingId
```

Updates an existing marketplace mapping.

**Path Parameters:**
- `mappingId` (string, required): The mapping ID

**Request Body:**
```json
{
  "marketplaceProductId": "TAKEALOT-124",
  "status": "inactive",
  "marketplaceData": {
    // Updated marketplace-specific data
  }
}
```

**Response:**
```json
{
  "id": "mapping-id",
  "productId": "product-id",
  "marketplaceId": "takealot",
  "marketplaceProductId": "TAKEALOT-124",
  "status": "inactive",
  "variantId": "variant-id",
  "createdAt": "2025-04-14T10:00:00Z",
  "updatedAt": "2025-04-14T10:30:00Z",
  "lastSyncedAt": "2025-04-14T10:00:00Z",
  "marketplaceData": {
    // Updated marketplace-specific data
  }
}
```

#### Delete Mapping

```
DELETE /mappings/:mappingId
```

Deletes a marketplace mapping.

**Path Parameters:**
- `mappingId` (string, required): The mapping ID

**Response:**
```json
{
  "id": "mapping-id"
}
```

### Marketplace Synchronization

#### Sync Product to Marketplace

```
POST /sync/:marketplaceId
```

Synchronizes a product to a specific marketplace.

**Path Parameters:**
- `marketplaceId` (string, required): The marketplace ID (e.g., `takealot`, `bidorbuy`, `makro`)

**Request Body:**
```json
{
  "productId": "product-id",
  "variantIds": ["variant-id-1", "variant-id-2"], // Optional
  "force": false // Optional, defaults to false
}
```

**Response:**
```json
{
  "success": true,
  "productId": "product-id",
  "marketplaceId": "bidorbuy",
  "message": "Product successfully synchronized to Bidorbuy",
  "createdMappings": ["mapping-id-1"],
  "updatedMappings": ["mapping-id-2"],
  "errors": []
}
```

#### Validate Product for Marketplace

```
POST /validate/:marketplaceId
```

Validates a product for a specific marketplace.

**Path Parameters:**
- `marketplaceId` (string, required): The marketplace ID (e.g., `takealot`, `bidorbuy`, `makro`)

**Request Body:**
```json
{
  "productId": "product-id",
  "includeVariants": true // Optional, defaults to false
}
```

**Response:**
```json
{
  "valid": true,
  "productId": "product-id",
  "marketplaceId": "makro",
  "issues": [],
  "warnings": [],
  "validationDetails": {
    "categories": {
      "valid": true,
      "issues": []
    },
    "images": {
      "valid": true,
      "issues": []
    },
    "attributes": {
      "valid": true,
      "issues": []
    },
    "pricing": {
      "valid": true,
      "issues": []
    }
  }
}
```

#### Get Products Needing Sync

```
GET /needs-sync/:marketplaceId?thresholdHours=24&limit=100
```

Retrieves a list of product IDs that need to be synchronized to a marketplace.

**Path Parameters:**
- `marketplaceId` (string, required): The marketplace ID (e.g., `takealot`, `bidorbuy`, `makro`)

**Query Parameters:**
- `thresholdHours` (number, optional): The number of hours threshold (defaults to 24)
- `limit` (number, optional): The maximum number of products to return (defaults to 100)

**Response:**
```json
[
  "product-id-1",
  "product-id-2",
  "product-id-3"
]
```

#### Sync Stock for Product

```
POST /sync-stock/:productId
```

Synchronizes stock levels for a product to all connected marketplaces.

**Path Parameters:**
- `productId` (string, required): The product ID

**Request Body:**
```json
{
  "stockLevel": 50
}
```

**Response:**
```json
[
  {
    "success": true,
    "productId": "product-id",
    "marketplaceId": "takealot",
    "message": "Stock level updated to 50",
    "errors": []
  },
  {
    "success": true,
    "productId": "product-id",
    "marketplaceId": "bidorbuy",
    "message": "Stock level updated to 50",
    "errors": []
  }
]
```

#### Sync Price for Product

```
POST /sync-price/:productId
```

Synchronizes price for a product to all connected marketplaces.

**Path Parameters:**
- `productId` (string, required): The product ID

**Request Body:**
```json
{
  "price": 99.99
}
```

**Response:**
```json
[
  {
    "success": true,
    "productId": "product-id",
    "marketplaceId": "takealot",
    "message": "Price updated to 99.99",
    "errors": []
  },
  {
    "success": true,
    "productId": "product-id",
    "marketplaceId": "makro",
    "message": "Price updated to 99.99",
    "errors": []
  }
]
```

#### Get Marketplace Stats

```
GET /stats?marketplaceId=takealot
```

Retrieves marketplace statistics.

**Query Parameters:**
- `marketplaceId` (string, optional): Filter by marketplace ID

**Response:**
```json
{
  "totalMappings": 150,
  "activeCount": 120,
  "inactiveCount": 20,
  "pendingCount": 5,
  "errorCount": 5,
  "marketplaces": ["takealot", "bidorbuy", "makro"]
}
```

## Marketplace-Specific Endpoints

### Bidorbuy-Specific Endpoints

#### Create Auction

```
POST /bidorbuy/auction
```

Creates a new auction for a product on Bidorbuy.

**Request Body:**
```json
{
  "productId": "product-id",
  "startPrice": 50.00,
  "reservePrice": 75.00,
  "duration": 7,
  "startTime": "2025-04-15T12:00:00Z"
}
```

**Response:**
```json
{
  "auctionId": "auction-id",
  "productId": "product-id",
  "status": "scheduled",
  "startTime": "2025-04-15T12:00:00Z",
  "endTime": "2025-04-22T12:00:00Z",
  "startPrice": 50.00,
  "reservePrice": 75.00,
  "currentBid": null,
  "bidCount": 0
}
```

#### Get Auction Status

```
GET /bidorbuy/auction/:auctionId
```

Retrieves the status of an auction.

**Path Parameters:**
- `auctionId` (string, required): The auction ID

**Response:**
```json
{
  "auctionId": "auction-id",
  "productId": "product-id",
  "status": "active",
  "startTime": "2025-04-15T12:00:00Z",
  "endTime": "2025-04-22T12:00:00Z",
  "startPrice": 50.00,
  "reservePrice": 75.00,
  "currentBid": 80.00,
  "bidCount": 5,
  "timeRemaining": 259200, // seconds
  "highestBidder": "bidder-username"
}
```

### Makro-Specific Endpoints

#### Check Store Pickup Eligibility

```
GET /makro/store-pickup/:productId
```

Checks if a product is eligible for store pickup at Makro stores.

**Path Parameters:**
- `productId` (string, required): The product ID

**Response:**
```json
{
  "eligible": true,
  "availableStores": [
    {
      "storeId": "JHB-001",
      "storeName": "Makro Woodmead",
      "region": "Gauteng",
      "stockLevel": 15
    },
    {
      "storeId": "CPT-002",
      "storeName": "Makro Cape Gate",
      "region": "Western Cape",
      "stockLevel": 8
    }
  ]
}
```

#### Add to Promotion

```
POST /makro/promotion
```

Adds a product to a Makro promotion.

**Request Body:**
```json
{
  "productId": "product-id",
  "promotionId": "promotion-id",
  "discountType": "percentage",
  "discountValue": 15,
  "startDate": "2025-04-20T00:00:00Z",
  "endDate": "2025-04-30T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "productId": "product-id",
  "promotionId": "promotion-id",
  "discountType": "percentage",
  "discountValue": 15,
  "startDate": "2025-04-20T00:00:00Z",
  "endDate": "2025-04-30T23:59:59Z",
  "status": "scheduled"
}
```

## Error Handling

All errors follow a standard format:

```json
{
  "statusCode": 400,
  "message": "Detailed error message",
  "error": "Error type"
}
```

Common errors:

- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Not authorized to access the resource
- `404 Not Found`: Resource not found
- `409 Conflict`: Conflict with existing resource
- `500 Internal Server Error`: Server-side error