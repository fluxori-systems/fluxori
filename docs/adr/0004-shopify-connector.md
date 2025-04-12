# ADR-0004: Amazon Selling Partner API Connector

* Status: Proposed
* Deciders: Engineering Team
* Date: 2025-04-11

## Context and Problem Statement

The Fluxori platform needs to integrate with the Amazon Selling Partner API to support South African sellers selling on Amazon. This integration is critical for inventory management, order processing, and product listing features.

The Amazon Selling Partner API has unique challenges:
- Extremely restrictive rate limits (as low as 0.0083 requests/second for some endpoints)
- Document-based operations for bulk processes (two-step process: create document, use document ID)
- OAuth 2.0 authentication with JWT for authorization
- Regional endpoints based on marketplace
- Complex error handling requirements

How should we design and integrate the Amazon Selling Partner API connector within our existing connector architecture while addressing these unique challenges?

## Decision Drivers

* Need for efficient handling of Amazon's severe rate limits
* Support for South African network conditions (intermittent connectivity, load shedding)
* Consistency with existing connector architecture
* Support for document-based operations not present in other connectors
* Support for token caching and refresh
* Need for queue-based processing for operations with severe rate limits

## Considered Options

1. Extend the existing `BaseMarketplaceConnector` for Amazon SP API
2. Create a specialized connector with custom queue-based processing
3. Use a third-party library for Amazon SP API integration
4. Implement a proxy layer for SP API that manages tokens and rate limiting

## Decision Outcome

Chosen option: Option 2 - Create a specialized connector with queue-based processing that extends the `BaseMarketplaceConnector`. This option will:

- Reuse the existing connector architecture for consistency and reduced development time
- Add specialized queue processing for Amazon's restrictive rate limits
- Implement token caching and refresh mechanisms
- Support document-based operations (feeds, reports)
- Implement custom rate limiting for different API sections
- Provide circuit breaker functionality for South African network conditions

### Positive Consequences

- Full compatibility with our connector interface and factory service
- Efficient handling of Amazon's rate limits
- Support for Amazon's document-based operations
- Automatic token refresh and caching
- South African network optimizations
- Consistent monitoring and error handling

### Negative Consequences

- Increased complexity due to queue-based processing
- Need for additional storage for document management
- Asynchronous nature of many operations may require webhooks or polling

## Architecture Components

```
┌─────────────────────────────────────┐
│           AmazonSPConnector         │
│                                     │
│  ┌────────────┐    ┌────────────┐   │
│  │ TokenCache │    │RateTracker │   │
│  └────────────┘    └────────────┘   │
│                                     │
│  ┌────────────┐    ┌────────────┐   │
│  │OperationQ  │    │DocumentMgr │   │
│  └────────────┘    └────────────┘   │
│                                     │
│  ┌────────────────────────────────┐ │
│  │       NetworkAwareClient       │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Core Components:

1. **TokenCache**: Manages access token lifetimes and refresh operations
2. **RateTracker**: Tracks rate limits for different API sections
3. **OperationQueue**: Manages queued operations for rate-limited endpoints
4. **DocumentManager**: Handles document creation, upload, and retrieval
5. **NetworkAwareClient**: Optimized HTTP client for South African conditions
6. **RegionalEndpointManager**: Routes requests to correct regional endpoints

## Code Structure

```typescript
// Main connector class
export class AmazonSPConnector extends BaseMarketplaceConnector {
  // Token and auth management
  private tokenCache: AmazonTokenCache;
  
  // Rate limit tracking
  private rateTracker: AmazonRateTracker;
  
  // Operation queues
  private orderQueue: OperationQueue;
  private inventoryQueue: OperationQueue;
  private feedsQueue: OperationQueue;
  
  // Document management
  private documentManager: DocumentManager;
  
  // Specialized clients for API sections
  private catalogClient: AmazonApiClient;
  private orderClient: AmazonApiClient;
  private inventoryClient: AmazonApiClient;
  private feedsClient: AmazonApiClient;
  private reportsClient: AmazonApiClient;
}
```

## Rate Limiting Strategy

The Amazon SP API has extremely stringent rate limits that vary widely by endpoint:
- Some endpoints allow as little as 0.0083 requests per second (1 request every 2 minutes)
- Other endpoints allow 0.5 requests per second

We'll implement a rate limiting strategy with:

1. **Categorized queue-based processing**:
   - Separate queues for different API sections (orders, inventory, feeds, etc.)
   - Rate-limited processing based on endpoint specifics
   - Batch operations where possible

2. **Token bucket algorithm**:
   - Track available tokens (requests) for each API section
   - Refill tokens based on time and rate limits
   - Schedule operations when tokens are available

3. **Prioritization**:
   - Critical operations (order processing) get higher priority
   - Optional operations (reports, metrics) get lower priority
   - Ability to expedite specific operations

## Document-Based Operations

For feeds and reports processing, we'll implement a document manager:

```typescript
export class DocumentManager {
  // Create a document for upload
  async createDocument(contentType: string): Promise<string>;
  
  // Upload content to a document
  async uploadDocumentContent(documentId: string, content: any): Promise<void>;
  
  // Retrieve document content
  async getDocumentContent(documentId: string): Promise<any>;
  
  // Clean up documents
  async deleteDocument(documentId: string): Promise<void>;
}
```

## Token Handling Strategy

Amazon SP API requires:
1. LWA (Login with Amazon) authentication
2. JWT-based request signing

Our solution will:
- Cache tokens to minimize authentication overhead
- Auto-refresh tokens before expiration
- Support both seller and app-based authentication
- Handle regional differences in token requirements

## Dependencies

```
┌─────────────────────────┐         ┌────────────────────┐
│  AmazonSPConnector      │         │  TokenManager      │
└───────────┬─────────────┘         └─────────┬──────────┘
            │                                  │
            │                                  │
            │                                  │
            │                                  │
            ▼                                  ▼
┌─────────────────────────┐         ┌────────────────────┐
│  BaseMarketplace        │         │  SecretManager     │
│  Connector              │         │                    │
└───────────┬─────────────┘         └────────────────────┘
            │
            │
            │
            ▼
┌─────────────────────────┐
│  NetworkAwareClient     │
└─────────────────────────┘
```

## Technical Interfaces

```typescript
interface IAmazonToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  created_at: number;
}

interface IAmazonDocumentMetadata {
  documentId: string;
  url: string;
  contentType: string;
  expiresAt: Date;
}

interface IAmazonFeedResult {
  feedId: string;
  feedType: string;
  status: string;
  processingStatus: string;
  resultDocumentId?: string;
}

interface IAmazonReportResult {
  reportId: string;
  reportType: string;
  processingStatus: string;
  documentId?: string;
}
```

## Alternative Solutions Considered

### Option 1: Extend BaseMarketplaceConnector without Queue Processing

Would be simpler but wouldn't handle Amazon's rate limits effectively. Every API call would need to implement delays, leading to poor user experience.

### Option 3: Use Third-Party Library

Would reduce development time but might lack South African optimizations and would require adapting to our connector architecture.

### Option 4: Proxy Layer

Would centralize rate limiting but add complexity and another failure point.

## Compliance with Technical Standards

The implementation will:
- Use TypeScript interfaces for all Amazon API structures
- Implement proper error handling with retry mechanisms
- Follow our module structure for connectors
- Support monitoring and metrics
- Comply with South African data protection requirements

## Implementation Plan

Implementation will be phased:

1. Core Authentication and Rate Limiting (~2 weeks)
2. Orders API Integration (~1 week)
3. Inventory API Integration (~1 week)
4. Catalog API Integration (~1 week)
5. Feeds API Integration (~2 weeks)
6. Reports API Integration (~1 week)
7. Testing and Refinement (~2 weeks)

Total estimated time: ~10 weeks

## Future Considerations

- Support for additional Amazon marketplaces
- Webhook integration for order notifications
- Integration with Amazon FBA APIs
- Support for Amazon Business B2B features
- Enhanced reporting capabilities