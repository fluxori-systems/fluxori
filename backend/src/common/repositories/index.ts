/**
 * Repository Module Public API
 * 
 * This file defines the public interface of the Repository module, exporting only what should be
 * accessible to other modules. This ensures proper encapsulation and prevents direct access to
 * internal components.
 */

// Export main repository implementations
export { 
  FirestoreBaseRepository,
  TenantAwareRepository as TenantRepository
} from './firestore-base.repository';

// Export repository interfaces
export type {
  Repository,
  RepositoryOptions,
  QueryFilter,
  QueryOptions,
  SortDirection,
  EntityReference,
  EntityWithId,
  FirestoreQueryOptions,
  FirestoreAdvancedFilter,
  CreateDocumentOptions,
  FindByIdOptions,
  FindOptions,
  UpdateDocumentOptions,
  DeleteDocumentOptions,
  BatchDeleteOptions,
  PaginationResult
} from './types';

// Export validation utilities
export {
  RepositoryValidationError,
  validateEntity,
  validateRequiredFields,
  validateEntityId,
  isEntityDeleted,
  validateBatchItems
} from './utils/validation';

// Export cache utilities
export {
  RepositoryCache,
  CacheOptions
} from './utils/cache';

// Export stats utilities
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
  calculateCacheHitRatio
} from './utils/stats';

// Export transaction utilities 
export {
  RepositoryTransaction,
  TransactionOperation,
  executeTransaction,
  executeBatch
} from './utils/transactions';

// Export converter utilities
export {
  RepositoryConverter,
  EntityConverter
} from './utils/converters';

// Helper Functions
export {
  // Query Filters
  equalTo,
  greaterThan,
  lessThan,
  
  // Pagination
  paginatedQuery,
  
  // Common Filters
  organizationFilters,
  deletedStateFilters,
  
  // Options
  STANDARD_REPOSITORY_OPTIONS,
  createRepositoryOptions
} from './utils/helpers';