import { 
  Query, 
  DocumentData, 
  DocumentSnapshot,
  FieldValue,
  Transaction
} from '@google-cloud/firestore';
import { FirestoreEntity, Timestamp } from '../../../types/google-cloud.types';

/**
 * Interface for repository statistics
 */
export interface RepositoryStats {
  reads: number;
  writes: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  lastError?: Error;
  lastErrorTime?: Date;
}

/**
 * Firestore query options for filtering and pagination
 */
export interface FirestoreQueryOptions<T> {
  orderBy?: keyof T;
  direction?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  select?: Array<keyof T>;
  startAfter?: any;
  endBefore?: any;
}

/**
 * Firestore advanced filter for complex queries
 */
export interface FirestoreAdvancedFilter<T> {
  field: keyof T;
  operator: '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in';
  value: any;
}

/**
 * Options for document creation
 */
export interface CreateDocumentOptions {
  useCustomId?: string;
  validateFields?: boolean;
  addToCache?: boolean;
  useServerTimestamp?: boolean;
  initialVersion?: number;
  ttl?: number;
  customMetadata?: Record<string, any>;
}

/**
 * Options for finding a document by ID
 */
export interface FindByIdOptions {
  bypassCache?: boolean;
  includeDeleted?: boolean;
  throwIfNotFound?: boolean;
  includeMetadata?: boolean;
}

/**
 * Options for updating a document
 */
export interface UpdateDocumentOptions {
  bypassSoftDeleteCheck?: boolean;
  validateFields?: boolean;
  invalidateCache?: boolean;
  lastUpdated?: Date | string;
  incrementVersion?: boolean;
  sanitizeData?: boolean;
}

/**
 * Options for deleting a document
 */
export interface DeleteDocumentOptions {
  softDelete?: boolean;
  force?: boolean;
  clearCache?: boolean;
  snapshotBeforeDelete?: boolean;
  deleteSubcollections?: boolean;
}

/**
 * Options for restoring a soft-deleted document
 */
export interface RestoreDocumentOptions {
  clearCache?: boolean;
  returnDocument?: boolean;
  updateVersion?: boolean;
  additionalUpdates?: Record<string, any>;
}

/**
 * Options for cleaning up expired documents
 */
export interface TTLCleanupOptions {
  ttlField?: string;
  batchSize?: number;
  useSoftDelete?: boolean;
  limit?: number;
  dryRun?: boolean;
}

/**
 * Options for batch deletion operations
 */
export interface BatchDeleteOptions {
  softDelete?: boolean;
  batchSize?: number;
}

/**
 * Options for field transform operations
 */
export interface FieldTransformOptions {
  validateId?: boolean;
  skipUpdatedAt?: boolean;
  optimisticConcurrency?: {
    lastUpdated: Date;
  };
}

/**
 * Options for counting documents
 */
export interface CountDocumentsOptions<T> {
  filter?: Partial<T>;
  advancedFilters?: FirestoreAdvancedFilter<T>[];
  includeDeleted?: boolean;
  maxCount?: number;
}

/**
 * Options for transaction execution
 */
export interface TransactionExecutionOptions {
  maxAttempts?: number;
  readOnly?: boolean;
  retryDelayMs?: number;
  timeoutMs?: number;
}

/**
 * Result of a paginated query
 */
export interface PaginationResult<T> {
  data: T[];
  lastDoc: DocumentSnapshot<T> | null;
  hasMore: boolean;
  total?: number;
}

/**
 * Cache configuration options
 */
export interface RepositoryCacheOptions {
  enabled: boolean;
  ttlMs: number;
  maxItems: number;
  logger?: any;
}

/**
 * Cache entry with expiration and access tracking
 */
export interface RepoCacheEntry<T> {
  data: T;
  expires: number;
  lastAccessed: number;
}