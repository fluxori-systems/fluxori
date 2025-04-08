/**
 * Repository module exports
 */

// Core repositories
export { 
  UnifiedFirestoreRepository,
  UnifiedTenantRepository
} from './unified-firestore.repository';

// Types
export {
  PaginatedQueryOptions,
  PaginatedResult,
  TransactionContext,
  FirestoreDocument
} from './unified-firestore.repository';

// Legacy exports (for backwards compatibility)
export {
  UnifiedFirestoreRepository as FirestoreBaseRepository
} from './unified-firestore.repository';

// Base components
export * from './base/repository-types';