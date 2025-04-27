/**
 * Repository Base Utilities Public API
 *
 * This file defines the internal public interface of the Repository base utilities.
 * These utilities should generally not be used directly by application code, but
 * rather through the main repository implementations.
 */

// Re-export repository types (only the subset needed by internals)
export type {
  Repository,
  RepositoryOptions,
  QueryFilter,
  QueryOptions,
  SortDirection,
  EntityReference,
  EntityWithId,
  BaseEntity,

  // Also export all the Firestore specific types
  FirestoreQueryOptions,
  FirestoreAdvancedFilter,
  CreateDocumentOptions,
  FindByIdOptions,
  FindOptions,
  UpdateDocumentOptions,
  DeleteDocumentOptions,
  BatchDeleteOptions,
} from "./repository-types";

// Re-export cache utilities
export {
  RepositoryCache,
  DEFAULT_CACHE_OPTIONS,
  CacheOptions,
} from "./repository-cache";

// Re-export converter utilities
export {
  RepositoryConverter,
  createEntityConverter,
  sanitizeEntityForStorage,
  applyServerTimestamps,
  applyClientTimestamps,
} from "./repository-converter";

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
} from "./repository-stats";

// Re-export transaction utilities
export {
  RepositoryTransaction,
  TransactionOperation,
  executeTransaction,
  executeBatch,
  executeMultiBatch,
  DEFAULT_TRANSACTION_OPTIONS,
} from "./repository-transactions";

// Re-export validation utilities
export {
  RepositoryValidationError,
  validateEntity,
  validateRequiredFields,
  validateEntityId,
  isEntityDeleted,
  validateEntityNotDeleted,
  validateBatchItems,
} from "./repository-validation";
