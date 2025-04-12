# ADR-0004: Xero API Connector

## Status

Implemented

## Date

2025-04-12

## Context

The Fluxori platform required integration with a robust accounting system to support e-commerce sellers in South Africa. After evaluating several options, Xero was selected as the preferred accounting solution due to its widespread adoption in the South African market, comprehensive API capabilities, and strong support for local tax regulations.

The following contextual factors influenced this decision:

1. **South African Accounting Requirements:** 
   - Need for compliance with South African VAT regulations (currently 15%, with planned increases)
   - Support for local tax reporting requirements, including VAT 201 returns
   - Ability to handle ZAR currency and local payment methods
   - Fiscal year customization compatible with South African standards

2. **Technical Challenges:** 
   - OAuth 2.0 with PKCE authentication flow requiring secure credential storage
   - Strict API rate limits (daily and per-minute quotas)
   - Need for comprehensive error handling and retries
   - Unreliable network conditions in South Africa, including frequent "load shedding" (power outages)
   - High latency when accessing international APIs from South Africa

3. **Business Requirements:**
   - Seamless synchronization of e-commerce orders, invoices, and payments
   - Real-time financial data access for reporting and decision-making
   - Multi-organization support for agencies managing multiple clients
   - Contact management for customers and suppliers
   - Bank transaction reconciliation

4. **Integration Requirements:**
   - Compatibility with existing Fluxori platform architecture
   - Adherence to established module boundary patterns
   - Support for the platform's observability and security standards

## Decision

We implemented a comprehensive Xero API Connector with a modular architecture optimized for South African e-commerce businesses. The connector follows our established BaseConnector pattern while incorporating specialized components for financial operations and South African requirements.

### Core Architecture

1. **Modular Design:**
   - `XeroConnector` extends `BaseConnector` as the primary integration point
   - Domain-specific services for accounting, banking, contacts, reporting, and tax operations
   - Specialized South African components for VAT and banking
   - OAuth service for authentication and token management

2. **Service Organization:**
   ```
   XeroConnector
   ├── XeroApiClientService - Base HTTP client with interceptors
   ├── XeroOAuthService - OAuth authentication and token management
   ├── XeroAccountingService - Invoice operations, accounting functions
   ├── XeroBankService - Bank transactions, reconciliation
   ├── XeroTaxService - Tax calculation, South African VAT
   ├── XeroReportingService - Financial reporting, VAT 201
   └── XeroWebhookService - Real-time event processing
   ```

3. **Security Implementation:**
   - OAuth 2.0 with PKCE flow for secure authentication
   - Secure credential storage in GCP Secret Manager
   - Token refresh with automatic rotation
   - Integration with platform's credential management system
   - Request signing and validation
   - Tenant isolation for multi-organization support

4. **Resilience Strategies:**

   a. **Multi-tier Caching:**
   - Entity-level caching with relationship awareness
   - Intelligent TTLs based on entity update frequency
   - Memory cache with Redis fallback
   - Proactive cache warming for critical data
   - Circuit breaker for cache failures

   b. **Rate Limiting:**
   - Token bucket algorithm with daily and per-minute buckets
   - Priority-based queuing (High/Medium/Low)
   - Adaptive throttling based on remaining quota
   - Rate limit awareness across platform instances

   c. **Circuit Breaker Pattern:**
   - Health monitoring with automatic circuit opening
   - Gradual recovery with half-open state
   - Fallback to cached data when circuit is open
   - Configurable thresholds based on error types

   d. **Network Resilience:**
   - Exponential backoff with jitter for retries
   - Request batching to minimize API calls
   - Idempotent operations for safe retries
   - Background operations during poor connectivity

### South African Optimizations

1. **VAT Implementation:**
   - Standard 15% VAT rate with support for future changes
   - Support for zero-rated supplies (0% VAT for exports)
   - Support for exempt supplies
   - VAT-inclusive and VAT-exclusive pricing options
   - SARS-compliant tax invoice generation
   - VAT 201 report generation

2. **Network Resilience for Load Shedding:**
   - Load shedding detection (`isPotentialLoadSheddingPeriod()` function)
   - Proactive cache warming before expected outages
   - Offline operation modes for critical functions
   - Queuing mechanism for operations during outages
   - Bulk synchronization after connectivity is restored

3. **South African Banking:**
   - Support for major South African banks
   - Bank statement imports in local formats
   - ZAR currency handling as default
   - Support for South African payment methods

4. **Performance Optimizations:**
   - Regional caching to reduce international latency
   - Batch operations to minimize API calls
   - Background processing for non-critical operations
   - Data compression to reduce bandwidth usage

### API Structure

The connector provides a RESTful API with the following key endpoints:

1. **Core Endpoints:**
   - OAuth authorization and callback management
   - Organization and settings management
   - Contact management (CRUD operations)
   - Invoice management (CRUD operations)
   - Payment operations
   - Tax rate management
   - Bank transaction management

2. **South African Specific Endpoints:**
   - `/south-african/tax-invoice/:organizationId` - Create SA-compliant tax invoices
   - `/south-african/ensure-vat-rates/:organizationId` - Ensure correct VAT rates exist
   - `/south-african/vat-report/:organizationId` - Generate VAT 201 reports
   - `/south-african/bank-import/:organizationId` - Import SA bank transactions

## Module Dependencies

The Xero API Connector follows our established module boundary enforcement pattern with clear dependency rules.

### Current Module Structure

The connector is positioned within the platform as follows:

```
connectors
└── adapters
    ├── base-connector.ts
    ├── base-marketplace-connector.ts
    ├── takealot-connector.ts
    ├── woocommerce-connector.ts
    └── xero
        ├── xero-connector.ts
        ├── services
        │   ├── xero-accounting.service.ts
        │   ├── xero-api-client.service.ts
        │   ├── xero-bank.service.ts
        │   ├── xero-oauth.service.ts
        │   ├── xero-reporting.service.ts
        │   ├── xero-tax.service.ts
        │   └── xero-webhook.service.ts
        ├── interfaces
        │   ├── xero-api-responses.ts
        │   └── xero-types.ts
        └── utils
            ├── xero-error-handler.ts
            ├── xero-rate-limiter.ts
            └── xero-cache.ts
```

The connector has dependencies on the following modules:

- `common/observability` - For logging, metrics, and tracing
- `common/auth` - For authentication guards
- `credit-system` - For tracking API usage credits
- `security` - For secure credential management

### Boundary Rules

The connector enforces the following boundary rules:

```javascript
{
  name: "xero-public-api-rule",
  severity: "error",
  comment: "External modules must only access Xero through its public controller",
  from: {
    pathNot: [
      "^src/modules/connectors/.*"
    ]
  },
  to: {
    path: "^src/modules/connectors/adapters/xero/(?!.*controller\\.ts)",
    pathNot: [
      "^src/modules/connectors/adapters/xero/xero-connector.ts$"
    ]
  }
}
```

## Consequences

The implementation of the Xero API Connector has resulted in the following consequences:

### Positive

1. **Enhanced Financial Integration:**
   - Complete end-to-end financial management within Fluxori
   - Real-time financial data for reporting and decision-making
   - Automated invoice generation from marketplace orders
   - Streamlined financial reconciliation

2. **South African Market Optimization:**
   - Full compliance with local tax regulations
   - Support for local accounting practices
   - Resilience against local network conditions
   - Reduced latency through intelligent caching

3. **Technical Advancements:**
   - Robust caching architecture applicable to other integrations
   - Rate limiting framework reusable across external APIs
   - Circuit breaker pattern enhancing platform stability
   - Advanced error handling and recovery strategies

4. **Business Impact:**
   - Reduced manual accounting work for sellers
   - Improved financial accuracy and compliance
   - Better cash flow visibility for businesses
   - Enhanced reporting capabilities

### Challenges and Limitations

1. **API Rate Limits:**
   - Xero's strict rate limits (1,000 calls/day for standard, 5,000/day for premium)
   - Per-minute burst limits (60 calls/minute) requiring careful throttling
   - Resource-intensive operations consuming large portions of quota

2. **OAuth Complexity:**
   - 30-minute token expiry requiring frequent refreshes
   - Limited refresh token lifespan (60 days) requiring periodic reauthorization
   - State management across authentication flows

3. **South African Specific Issues:**
   - Need to adapt to changing VAT rates in coming years
   - Load shedding unpredictability affecting synchronization
   - Currency fluctuation impacts on reporting accuracy

4. **Maintenance Considerations:**
   - Need to monitor Xero API changes and deprecations
   - Cache invalidation complexity with interrelated entities
   - Potential credential rotation requirements

### Future Enhancement Possibilities

1. **Enhanced Webhook Support:**
   - Real-time updates for all financial entities
   - Reduced need for polling-based synchronization
   - Event-driven architecture for financial processes

2. **AI-Assisted Reconciliation:**
   - Machine learning for transaction matching
   - Automated categorization of expenses
   - Anomaly detection in financial data

3. **Expanded South African Features:**
   - Integration with additional local payment gateways
   - Support for specialized industry accounting requirements
   - Additional local tax reporting formats

4. **Optimization Opportunities:**
   - Further batch processing improvements
   - Enhanced predictive caching strategies
   - More granular rate limit management

## Compliance Validation

Compliance with the Xero API Connector architecture is validated through:

1. **Static Analysis:**
   - ESLint rules enforcing module boundaries
   - Dependency-cruiser configurations validating import patterns
   - TypeScript strict mode ensuring type safety

2. **Runtime Validation:**
   - Health checks monitoring connector status
   - Metrics tracking API usage and performance
   - Circuit breaker statistics

3. **CI/CD Checks:**
   - Integration tests for key financial workflows
   - Connection validation for authentication paths
   - Rate limit simulation tests

4. **Code Review Guidelines:**
   - Focus on South African compliance requirements
   - Performance impact assessment for all changes
   - Security review for credential management

## Implementation Details

The Xero API Connector was implemented in phases to incrementally deliver value:

1. **Phase 1: Foundation**
   - OAuth implementation and secure credential storage
   - Base API client with error handling
   - Core entity models and type definitions
   - South African tax configuration

2. **Phase 2: Core Financial Operations**
   - Contact management
   - Invoice creation and management
   - Tax calculation with SA VAT support
   - Basic reporting

3. **Phase 3: Advanced Features**
   - Bank transactions and reconciliation
   - Payment processing
   - Advanced caching and resilience
   - South African optimizations

4. **Phase 4: E-commerce Integration**
   - Order-to-invoice mapping
   - Product catalog synchronization
   - Marketplace integration
   - Real-time webhooks

The implementation included comprehensive testing with a focus on:
- Unit tests for core logic and business rules
- Integration tests for API interactions
- Performance testing under South African network conditions
- Load testing for rate limit handling
- Security testing for credential management

Key technical innovations included:
- Advanced caching strategy with relationship awareness
- Load shedding detection and adaptation
- TokenBucket implementation for rate limiting
- Circuit breaker pattern for fault tolerance