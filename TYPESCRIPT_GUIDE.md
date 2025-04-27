# Fluxori TypeScript Guide

## Current Status (April 23, 2025)

- **Frontend:** 0 TypeScript errors (completely resolved)
- **Backend:** 727 TypeScript errors

### TypeScript Error Breakdown

#### Error Types (Top 5)

1. **Property Access (TS2339)**: 182 errors

   - "Property 'X' does not exist on type 'Y'"
   - Most commonly missing properties on service interfaces

2. **Namespace as Type (TS2709)**: 62 errors

   - "Cannot use namespace 'X' as a type"
   - NestJS related interface types (ExecutionContext, ArgumentsHost, etc.)

3. **Type Compatibility (TS2559)**: 48 errors

   - "Type has no properties in common with type 'X'"
   - Often when passing strings where objects are expected

4. **Argument Type (TS2345)**: 30 errors

   - "Argument of type 'X' is not assignable to parameter of type 'Y'"
   - Type compatibility issues in function arguments

5. **Type Assignment (TS2322)**: 25 errors
   - "Type 'X' is not assignable to type 'Y'"
   - General type assignment errors

#### Files with Errors (Backend, most→least)

```text
18 src/modules/pim/services/product-variant.service.ts
17 src/modules/pim/repositories/b2b-contract.repository.ts
16 src/modules/pim/services/product-ai.service.ts
15 src/modules/pim/services/marketplace-sync.service.ts
15 src/modules/pim/index.ts
13 src/modules/pim/services/image-analysis.service.ts
13 src/modules/pim/repositories/customer-group.repository.ts
13 src/modules/pim/repositories/approval-workflow.repository.ts
12 src/modules/pim/services/takealot-connector.service.ts
12 src/modules/pim/repositories/product-marketplace-mapping.repository.ts
12 src/modules/pim/repositories/competitor-price.repository.ts
12 src/modules/pim/controllers/import-export.controller.ts
11 src/modules/pim/services/b2b/b2b-service.ts
10 src/modules/pim/services/import-export.service.ts
10 src/modules/pim/services/enhanced-regional/regional-configuration.service.ts
10 src/modules/pim/services/compliance/compliance-framework.service.ts
10 src/modules/pim/repositories/price-history.repository.ts
10 src/modules/pim/repositories/compliance-check.repository.ts
9 src/modules/security/security.module.ts
9 src/modules/pim/services/enhanced-regional/regional-product-enhancer.service.ts
9 src/modules/pim/repositories/regional-configuration.repository.ts
9 src/modules/pim/repositories/product-attribute.repository.ts
9 src/modules/pim/repositories/customer-tier.repository.ts
9 src/modules/pim/repositories/compliance-requirement.repository.ts
9 src/modules/pim/pim.module.ts
8 src/modules/pim/services/pim-storage.service.ts
8 src/modules/pim/repositories/product-variant.repository.ts
8 src/modules/pim/repositories/price-monitoring-config.repository.ts
8 src/modules/pim/repositories/compliance-rule.repository.ts
8 src/common/observability/observability.module.ts
7 src/modules/pim/repositories/price-alert.repository.ts
6 src/modules/pim/services/report-exporter.service.ts
6 src/modules/pim/services/dynamic-pricing.service.ts
6 src/modules/pim/services/cross-border-trade.service.ts
6 src/modules/pim/services/bulk-operations/attribute-template-bulk-operations.service.ts
6 src/modules/pim/repositories/bundle.repository.ts
6 src/modules/pim/controllers/tax-rate.controller.ts
6 src/modules/pim/controllers/product.controller.ts
6 src/modules/pim/controllers/product-review.controller.ts
6 src/modules/pim/controllers/marketplace-connector.controller.ts
6 src/modules/pim/controllers/b2b.controller.ts
5 src/modules/pim/services/validation.service.ts
5 src/modules/auth/services/auth.service.ts
5 src/common/interceptors/service-auth.interceptor.ts
4 src/modules/security/guards/rate-limit.guard.ts
4 src/modules/pim/services/bulk-operations/category-bulk-operations.service.ts
4 src/modules/pim/services/african-tax-framework.service.ts
4 src/modules/pim/controllers/validation.controller.ts
4 src/modules/pim/controllers/mobile-first.controller.ts
4 src/modules/pim/controllers/cross-border-trade.controller.ts
4 src/modules/credit-system/controllers/keyword-analytics.controller.ts
4 src/modules/credit-system/controllers/credit-system.controller.ts
4 src/main.ts
4 src/common/observability/services/enhanced-logger.service.ts
3 src/modules/users/repositories/user.repository.ts
3 src/modules/storage/controllers/storage.controller.ts
3 src/modules/storage/controllers/pim-storage.controller.ts
3 src/modules/security/interceptors/security.interceptor.ts
3 src/modules/pim/services/regional-warehouse.service.ts
3 src/modules/pim/controllers/report-export.controller.ts
3 src/modules/pim/controllers/regional-warehouse.controller.ts
3 src/modules/pim/controllers/regional-product.controller.ts
3 src/modules/pim/controllers/data-protection.controller.ts
3 src/modules/pim/controllers/compliance-framework.controller.ts
3 src/modules/pim/controllers/competitive-price-monitoring.controller.ts
3 src/modules/pim/controllers/category.controller.ts
3 src/modules/pim/controllers/category-classification.controller.ts
3 src/modules/pim/controllers/african-tax-framework.controller.ts
3 src/modules/marketplaces/controllers/marketplace.controller.ts
3 src/modules/inventory/services/warehouse.service.ts
3 src/modules/inventory/services/inventory.service.ts
3 src/modules/inventory/controllers/inventory.controller.ts
3 src/modules/feature-flags/services/feature-flag.service.ts
3 src/modules/feature-flags/controllers/feature-flag.controller.ts
3 src/modules/credit-system/services/pim-integration.service.ts
3 src/modules/ai-insights/services/credit-system.service.ts
3 src/modules/ai-insights/controllers/insight.controller.ts
3 src/modules/ai-insights/controllers/ai-model-config.controller.ts
3 src/modules/agent-framework/controllers/agent.controller.ts
3 src/common/observability/interceptors/tracing.interceptor.ts
3 src/common/filters/global-exception.filter.ts
2 src/modules/security/controllers/security.controller.ts
2 src/modules/security/controllers/security-audit.controller.ts
2 src/modules/security/controllers/credential.controller.ts
2 src/modules/rag-retrieval/services/embedding.service.ts
2 src/modules/rag-retrieval/services/document.service.ts
2 src/modules/rag-retrieval/repositories/embedding-provider.repository.ts
2 src/modules/rag-retrieval/repositories/document.repository.ts
2 src/modules/rag-retrieval/controllers/embedding-provider.controller.ts
2 src/modules/rag-retrieval/controllers/document.controller.ts
2 src/modules/pim/services/tax-rate.service.ts
2 src/modules/pim/services/product.service.ts
2 src/modules/pim/services/multi-currency.service.ts
2 src/modules/pim/services/marketplace-validation.service.ts
2 src/modules/pim/services/load-shedding.service.ts
2 src/modules/pim/services/category.service.ts
2 src/modules/pim/services/bundle.service.ts
2 src/modules/pim/services/bulk-operations/product-bulk-operations.service.ts
2 src/modules/pim/services/attribute-template.service.ts
2 src/modules/pim/repositories/tax-rate.repository.ts
2 src/modules/pim/repositories/product-review.repository.ts
2 src/modules/pim/repositories/pricing-rule.repository.ts
2 src/modules/pim/controllers/product-variant.controller.ts
2 src/modules/pim/controllers/pricing-rule.controller.ts
2 src/modules/pim/controllers/multi-currency.controller.ts
2 src/modules/pim/controllers/bundle.controller.ts
2 src/modules/pim/controllers/attribute-template.controller.ts
2 src/modules/pim/controllers/advanced-image.controller.ts
2 src/modules/marketplaces/repositories/marketplace-credentials.repository.ts
2 src/modules/inventory/repositories/warehouse.repository.ts
2 src/modules/inventory/repositories/stock-movement.repository.ts
2 src/modules/inventory/repositories/stock-level.repository.ts
2 src/modules/inventory/repositories/product.repository.ts
2 src/modules/feature-flags/repositories/feature-flag.repository.ts
2 src/modules/feature-flags/repositories/feature-flag-audit-log.repository.ts
2 src/modules/credit-system/services/marketplace-strategy.service.ts
2 src/modules/credit-system/controllers/keyword-research.controller.ts
2 src/modules/connectors/services/connector-factory.service.ts
2 src/modules/connectors/repositories/connector-credentials.repository.ts
2 src/modules/buybox/repositories/repricing-rule.repository.ts
2 src/modules/buybox/repositories/buybox-status.repository.ts
2 src/modules/buybox/repositories/buybox-history.repository.ts
2 src/modules/buybox/controllers/repricing.controller.ts
2 src/modules/buybox/controllers/buybox.controller.ts
2 src/modules/auth/services/firebase-auth.service.ts
2 src/modules/auth/guards/firebase-auth.guard.ts
2 src/modules/auth/controllers/auth.controller.ts
2 src/modules/ai-insights/services/insight.service.ts
2 src/modules/ai-insights/services/ai-model-config.service.ts
2 src/modules/ai-insights/repositories/insight.repository.ts
2 src/modules/ai-insights/controllers/insight-generation.controller.ts
2 src/common/repositories/utils/validation.ts
2 src/common/repositories/base/repository-validation.ts
2 src/common/observability/interceptors/metrics.interceptor.ts
2 src/common/observability/interceptors/logging.interceptor.ts
2 src/common/guards/firebase-auth.guard.ts
1 src/modules/security/services/vpc-service-controls.service.ts
1 src/modules/security/services/security.service.ts
1 src/modules/security/services/security-metrics.service.ts
1 src/modules/security/services/security-audit.service.ts
1 src/modules/security/services/file-scanner.service.ts
1 src/modules/security/services/dlp.service.ts
1 src/modules/security/services/credential-manager.service.ts
1 src/modules/security/services/cloud-armor.service.ts
1 src/modules/security/health/security-health.indicator.ts
1 src/modules/rag-retrieval/services/document-chunking.service.ts
1 src/modules/pim/services/product-review.service.ts
1 src/modules/pim/services/mobile-first-detection.service.ts
1 src/modules/pim/services/data-protection/data-protection.service.ts
1 src/modules/pim/services/bulk-operations/bulk-operations.service.ts
1 src/modules/pim/repositories/product.repository.ts
1 src/modules/pim/repositories/category.repository.ts
1 src/modules/pim/repositories/attribute-template.repository.ts
1 src/modules/pim/controllers/catalog-optimization.controller.ts
1 src/modules/order-ingestion/mappers/order-mapper.registry.ts
1 src/modules/marketplaces/services/marketplace-sync.service.ts
1 src/modules/marketplaces/services/marketplace-adapter.factory.ts
1 src/modules/marketplaces/interfaces/dependencies.ts
1 src/modules/marketplaces/adapters/base-marketplace-adapter.ts
1 src/modules/feature-flags/services/feature-flag-cache.service.ts
1 src/modules/credit-system/utils/feature-flags.manager.ts
1 src/modules/credit-system/utils/agent-framework-adapter.ts
1 src/modules/credit-system/services/token-tracking.service.ts
1 src/modules/credit-system/services/sa-market-optimizations.service.ts
1 src/modules/credit-system/services/keyword-research.service.ts
1 src/modules/credit-system/services/keyword-analytics.service.ts
1 src/modules/credit-system/services/credit-system.service.ts
1 src/modules/credit-system/services/competitor-alert.service.ts
1 src/modules/credit-system/repositories/keyword-research-result.repository.ts
1 src/modules/credit-system/repositories/keyword-research-request.repository.ts
1 src/modules/credit-system/repositories/keyword-research-pricing.repository.ts
1 src/modules/credit-system/repositories/keyword-cache.repository.ts
1 src/modules/credit-system/repositories/keyword-analytics.repository.ts
1 src/modules/credit-system/repositories/credit-usage-log.repository.ts
1 src/modules/credit-system/repositories/credit-transaction.repository.ts
1 src/modules/credit-system/repositories/credit-reservation.repository.ts
1 src/modules/credit-system/repositories/credit-pricing-tier.repository.ts
1 src/modules/credit-system/repositories/credit-allocation.repository.ts
1 src/modules/credit-system/controllers/pim-integration.controller.ts
1 src/modules/credit-system/controllers/marketplace-strategy.controller.ts
1 src/modules/credit-system/controllers/competitor-alert.controller.ts
1 src/modules/connectors/utils/network-aware-client.ts
1 src/modules/connectors/services/webhook-handler.service.ts
1 src/modules/connectors/controllers/xero.controller.ts
1 src/modules/connectors/controllers/connector.controller.ts
1 src/modules/connectors/adapters/xero/xero-connector.ts
1 src/modules/connectors/adapters/woocommerce-connector.ts
1 src/modules/connectors/adapters/wantitall-connector.ts
1 src/modules/connectors/adapters/takealot-connector.ts
1 src/modules/connectors/adapters/superbalist-connector.ts
1 src/modules/connectors/adapters/shopify/shopify-connector.ts
1 src/modules/connectors/adapters/makro-connector.ts
1 src/modules/connectors/adapters/bob-shop-connector.ts
1 src/modules/connectors/adapters/base-connector.ts
1 src/modules/connectors/adapters/amazon-sp/amazon-sp-connector.ts
1 src/modules/buybox/services/repricing-scheduler.service.ts
1 src/modules/buybox/services/repricing-engine.service.ts
1 src/modules/buybox/services/buybox-monitoring.service.ts
1 src/modules/auth/decorators/public.decorator.ts
1 src/modules/ai-insights/services/insight-generation.service.ts
1 src/modules/ai-insights/repositories/ai-model-config.repository.ts
1 src/modules/agent-framework/utils/token-estimator.ts
1 src/modules/agent-framework/services/model-adapter.factory.ts
1 src/modules/agent-framework/services/agent.service.ts
1 src/modules/agent-framework/repositories/model-registry.repository.ts
1 src/modules/agent-framework/repositories/agent-conversation.repository.ts
1 src/modules/agent-framework/repositories/agent-config.repository.ts
1 src/modules/agent-framework/adapters/vertex-ai.adapter.ts
1 src/health/health.controller.ts
1 src/health/firestore-health.indicator.ts
1 src/config/firestore.config.ts
1 src/common/utils/service-auth.ts
1 src/common/utils/network-status.service.ts
1 src/common/utils/logger.ts
1 src/common/storage/google-cloud-storage.service.ts
1 src/common/repositories/utils/transactions.ts
1 src/common/repositories/utils/cache.ts
1 src/common/repositories/base/repository-transactions.ts
```

## TypeScript Resolution Strategy

For early-stage development without live customers, we recommend the following aggressive approach:

1. **Complete Frontend Restructuring (DONE)**

   - ✅ All frontend TypeScript errors have been resolved
   - ✅ Migrated from recharts to Chart.js with proper TypeScript support
   - ✅ Implemented proper interface definitions for all components

2. **Backend Error Prioritization**

   - **Focus Areas (by error frequency):**
     1. Fix logger interface issues (IEnhancedLoggerService)
     2. Resolve repository pattern type incompatibilities
     3. Create proper NestJS type definitions
     4. Address property access errors in services
     5. Fix type compatibility in function arguments

3. **Rebuild Strategy for Top Error Files:**
   - **Approach:** Rebuild problematic files with proper TypeScript interfaces
   - **Priority Order:**
     1. Core interfaces in observability module (highest error count)
     2. Repository base classes and interfaces
     3. PIM module services with high error counts
     4. NestJS type definitions and decorators

## NestJS TypeScript Configuration

The backend requires special TypeScript configuration due to NestJS decorators:

```json
{
  "compilerOptions": {
    "module": "CommonJS",
    "target": "ES2022",
    "moduleResolution": "Node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

## Module Dependency Management

When rebuilding files, carefully analyze module dependencies:

1. **Use Module Dependency Diagrams**

   - Refer to existing module dependency graphs in the project root
   - Understand module boundaries before making changes

2. **Follow Architecture Decision Records (ADRs)**

   - Check `/docs/adr/` directory for existing architecture decisions
   - Maintain consistent patterns established in ADRs

3. **Dependency Inversion Principle**
   - When rebuilding, use interfaces to decouple implementations
   - Put interfaces in shared locations to avoid circular dependencies

## Common Error Patterns and Solutions

### 1. Logger Interface Issues

```typescript
// Problem:
service.log("Message"); // Error: Property 'log' does not exist on type...

// Solution:
// Create a comprehensive interface that matches the implementation
export interface IEnhancedLoggerService {
  /**
   * Write a 'log' level log with optional context
   */
  log(
    message: string | Record<string, any>,
    context?: string | LogContext,
  ): void;

  /**
   * Write an 'error' level log with optional stack trace and context
   */
  error(
    message: string | Error | Record<string, any>,
    trace?: string,
    context?: string | LogContext,
  ): void;

  /**
   * Write a 'warn' level log with optional context
   */
  warn(
    message: string | Record<string, any>,
    context?: string | LogContext,
  ): void;

  /**
   * Write a 'debug' level log with optional context
   */
  debug(
    message: string | Record<string, any>,
    context?: string | LogContext,
  ): void;

  /**
   * Write a 'verbose' level log with optional context
   */
  verbose(
    message: string | Record<string, any>,
    context?: string | LogContext,
  ): void;

  // Additional methods
  setTraceContext(traceId: string, context: TraceContext): void;
  getTraceContext(traceId: string): TraceContext | undefined;
  clearTraceContext(traceId: string): void;
  setGlobalContext(context: Record<string, any>): void;
  createStructuredLog(
    level: LogLevel,
    message: string | Record<string, any>,
    context?: string | LogContext,
    trace?: string,
  ): StructuredLogEntry;
}
```

### 2. Repository Pattern Problems

```typescript
// Problem:
repository.findById("id"); // Error: Type 'string' has no properties in common with type 'FindByIdOptions'
private logger: Logger; // Error: Cannot use namespace 'Logger' as a type

// Solution:
// 1. Create proper repository interface with generics
export interface Repository<T extends BaseEntity, K = string> {
  findById(id: K, options?: FindByIdOptions): Promise<T | null>;
  findAll(options?: FindOptions<T>): Promise<T[]>;
  find(options?: FindOptions<T>): Promise<T[]>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, options?: CreateDocumentOptions): Promise<T>;
  update(id: K, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>, options?: UpdateDocumentOptions): Promise<T>;
  delete(id: K, options?: DeleteDocumentOptions): Promise<void>;
}

// 2. Fix Set iteration issues in repositories
// Problem:
const uniqueIds = [...new Set(ids)]; // Error: Type 'Set<K>' can only be iterated through when...

// Solution:
const uniqueIds = Array.from(new Set(ids)); // Use Array.from instead of spread operator

// 3. Update constructor to use proper logger service
constructor(
  protected readonly firestoreConfigService: FirestoreConfigService,
  protected readonly collectionName: string,
  loggerService?: IEnhancedLoggerService, // Add optional logger parameter
  options?: Partial<RepositoryOptions>,
) {
  // Use injected logger or create a default one from LoggerFactory
  this.logger = loggerService || require('../utils/logger').LoggerFactory.getLogger(this.constructor.name);
}
```

### 3. NestJS Interface Types

```typescript
// Problem:
export class MyGuard implements CanActivate { // Error: Cannot use namespace 'CanActivate' as a type

// Solution:
// Create proper NestJS type declarations in src/types/nestjs-types/
declare module '@nestjs/common' {
  export interface CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
  }

  export interface ExecutionContext {
    getArgs(): any[];
    getArgByIndex(index: number): any;
    switchToRpc(): RpcArgumentsHost;
    switchToHttp(): HttpArgumentsHost;
    switchToWs(): WsArgumentsHost;
    getClass<T = any>(): Type<T>;
    getHandler(): Function;
    getType(): string;
  }

  export interface Observable<T> {
    subscribe(observer?: any): any;
    pipe(...operators: any[]): Observable<any>;
  }
}

// Main types.d.ts file references all the type files:
/// <reference path="./nestjs-types/index.d.ts" />
/// <reference path="./nestjs-types/class-decorators.d.ts" />
/// <reference path="./nestjs-types/method-decorators.d.ts" />
/// <reference path="./nestjs-types/parameter-decorators.d.ts" />
```

### 4. Property Access and Repository Method Errors in PIM Module

```typescript
// Problem 1: Repository methods with incorrect parameter types
// Error: Type 'string' has no properties in common with type 'FindByIdOptions'
return this.productVariantRepository.findById(variantId, tenantId);

// Solution 1: Use proper option objects
return this.productVariantRepository.findById(variantId, {
  tenantId,
  includeDeleted: false
});

// Problem 2: Missing method on service
// Error: Property 'optimizeImageUrl' does not exist on type 'NetworkAwareStorageService'
await this.networkAwareStorageService.optimizeImageUrl(url, networkInfo);

// Solution 2: Add the missing method to the service
async optimizeImageUrl(
  imageUrl: string,
  networkInfo?: NetworkQualityInfo
): Promise<string> {
  // Implementation...
}

// Problem 3: Incorrect Logger typing
// Error: Cannot use namespace 'Logger' as a type
private readonly logger = new Logger(ServiceName);

// Solution 3: Use enhanced logger with dependency injection
import { IEnhancedLoggerService } from '../interfaces/observability.interfaces';

private readonly logger: IEnhancedLoggerService;

constructor(
  // other parameters...
  @Inject('LOGGER_SERVICE') loggerService?: IEnhancedLoggerService
) {
  this.logger = loggerService || LoggerFactory.getLogger(ServiceName);
}
```

## Validation Tools

```bash
# Frontend
cd frontend && npm run typecheck

# Backend
cd backend && npm run typecheck         # TypeScript check
cd backend && npm run typecheck:nestjs  # NestJS-specific check
```

## Progress Made

1. ✅ **Fixed Logger Interface Issues**

   - Created a comprehensive interface for the `IEnhancedLoggerService` with full method signatures
   - Properly implemented in the enhanced-logger.service.ts with correct type declarations
   - Fixed LogLevel type issues by creating local type declarations instead of importing
   - Made createStructuredLog method properly accessible from the interface

2. ✅ **Created NestJS Type Definitions**

   - Created comprehensive type definitions in src/types/nestjs-types/ folder:
     - index.d.ts: Base NestJS types (LoggerService, CanActivate, ExecutionContext, etc.)
     - class-decorators.d.ts: Injectable, Controller, Module, etc.
     - method-decorators.d.ts: Get, Post, Put, etc.
     - parameter-decorators.d.ts: Body, Param, Query, etc.
   - Added proper interfaces for ExecutionContext, LoggerService, etc.
   - Resolved "Cannot use namespace as type" errors (TS2709) through proper interface definitions

3. ✅ **Rebuilt Metrics Service**
   - Fixed typing issues in metrics.service.ts
   - Resolved issues with downlevelIteration for Map iteration by using Array.from() with forEach
   - Properly implemented IMetricsService interface with all required methods
   - Refactored decorator usage to avoid TS1206 errors
   - Fixed error handling to properly check for Error instances

## Next Steps

1. ✅ **Improved Repository Pattern TypeScript Support**

   - Fixed FirestoreBaseRepository to properly handle IEnhancedLoggerService
   - Updated repository-cache.ts to use proper logger interfaces
   - Fixed Set iteration issues in repositories using Array.from
   - Modified constructor signatures to accept proper logger services
   - Enhanced repository-types.ts with stronger typing

2. **Continue Repository Pattern Improvements**

   - Finish firestore-base.repository.ts TypeScript fixes
   - Address decorator-related TypeScript issues in repositories
   - Ensure consistent type usage across all repositories

3. ✅ **Fixed PIM Module Issues**
   - Updated the product-variant.service.ts with proper types
   - Added missing optimizeImageUrl method to NetworkAwareStorageService
   - Properly typed repository method calls with appropriate option objects
   - Fixed Logger interface usage in PIM services
   - Added proper constructor injection for PIM services

## Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [NestJS TypeScript Tips](https://docs.nestjs.com/recipes/sql-typeorm)
- [TypeScript 5.8 Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
