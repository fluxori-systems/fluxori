/**
 * Repository Exports
 * 
 * This file provides a central export point for all repository-related types and interfaces.
 * Use this file for importing repository types in repository implementations to ensure
 * consistent typing and prevent import path issues.
 */

// Export all types from repository-types
export {
  // Base entity types
  FirestoreEntityWithMetadata,
  BaseEntity,
  EntityWithId,
  
  // Repository interface
  Repository,
  
  // Options interfaces
  FindOptions,
  FindByIdOptions,
  CreateDocumentOptions,
  UpdateDocumentOptions,
  DeleteDocumentOptions,
  BatchDeleteOptions,
  RestoreDocumentOptions,
  TTLCleanupOptions,
  CountDocumentsOptions,
  FieldTransformOptions,
  
  // Query interfaces
  QueryFilter,
  QueryOptions,
  SortDirection,
  FirestoreQueryOptions,
  FirestoreAdvancedFilter,
  
  // Result interfaces
  PaginationResult,
  EntityReference,
  
  // Configuration interfaces
  RepositoryOptions,
  RepositoryCacheOptions,
  RepoCacheEntry,
  
  // Converter interface
  EntityConverter,
} from './repository-types';

// Re-export cache utilities
export {
  RepositoryCache,
  DEFAULT_CACHE_OPTIONS,
  CacheOptions,
} from './repository-cache';

// Re-export converter utilities
export {
  RepositoryConverter,
  createEntityConverter,
  sanitizeEntityForStorage,
  applyServerTimestamps,
  applyClientTimestamps,
} from './repository-converter';

// Re-export stats utilities
export {
  RepositoryStats,
  createRepositoryStats,
  incrementReads,
  incrementWrites,
  incrementCacheHits,
  incrementCacheMisses,
  recordError,
  getStatsSnapshot,
  resetStats,
  calculateCacheHitRatio,
} from './repository-stats';

// Re-export transaction utilities
export {
  RepositoryTransaction,
  TransactionOperation,
  executeTransaction,
  executeBatch,
  executeMultiBatch,
  DEFAULT_TRANSACTION_OPTIONS,
} from './repository-transactions';

// Re-export validation utilities
export {
  RepositoryValidationError,
  validateEntity,
  validateRequiredFields,
  validateEntityId,
  isEntityDeleted,
  validateEntityNotDeleted,
  validateBatchItems,
} from './repository-validation';

/**
 * Repository Implementation Guide
 * 
 * When implementing a new repository:
 * 
 * 1. Import types from this file:
 *    ```typescript
 *    import {
 *      FirestoreEntityWithMetadata,
 *      FindOptions,
 *      CreateDocumentOptions,
 *      UpdateDocumentOptions,
 *      DeleteDocumentOptions,
 *      FindByIdOptions,
 *      FirestoreAdvancedFilter
 *    } from '../../../common/repositories/base/repository-exports';
 *    import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
 *    ```
 * 
 * 2. Create a record interface that extends both your domain model and FirestoreEntityWithMetadata:
 *    ```typescript
 *    export interface MyEntityRecord extends MyEntity, FirestoreEntityWithMetadata {
 *      tenantId: string;
 *    }
 *    ```
 * 
 * 3. Use the record interface as the generic type parameter for your repository:
 *    ```typescript
 *    @Injectable()
 *    export class MyEntityRepository extends FirestoreBaseRepository<MyEntityRecord> {
 *      // ...
 *    }
 *    ```
 * 
 * 4. Type your method parameters and return types using the record interface:
 *    ```typescript
 *    async findById(
 *      id: string,
 *      tenantIdOrOptions?: string | FindByIdOptions,
 *      optionsParam?: FindByIdOptions
 *    ): Promise<MyEntityRecord | null> {
 *      // ...
 *    }
 *    ```
 * 
 * 5. Use explicit type annotations for filter callbacks:
 *    ```typescript
 *    options.advancedFilters.filter((f: FirestoreAdvancedFilter<MyEntityRecord>) => 
 *      f.field !== 'tenantId' && f.field !== 'isDeleted'
 *    )
 *    ```
 */