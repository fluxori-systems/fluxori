/**
 * Repository type definitions for Firestore repositories
 * These types define the interfaces for repository operations
 */

import { 
  DocumentData, 
  DocumentSnapshot,
  FieldValue,
  Transaction,
  QueryDocumentSnapshot
} from '@google-cloud/firestore';

import { 
  FirestoreEntity, 
  Timestamp, 
  QueryFilterOperator,
  QueryOptions as GlobalQueryOptions,
  TransactionContext
} from '../../../types/google-cloud.types';

// Repository statistics interface is now defined in repository-stats.ts
// to avoid circular dependencies
import { RepositoryStats } from './repository-stats';

/**
 * Base repository interface that defines common operations
 */
export interface Repository<T> {
  findById(id: string, options?: any): Promise<T | null>;
  find(options?: any): Promise<T[]>;
  create(data: Partial<T>, options?: any): Promise<T>;
  update(id: string, data: Partial<T>, options?: any): Promise<T>;
  delete(id: string, options?: any): Promise<void>;
  count(options?: any): Promise<number>;
}

/**
 * Standard query filter definition
 */
export interface QueryFilter<T> {
  field: keyof T | string;
  operator: QueryFilterOperator;
  value: any;
}

/**
 * Standard query options
 */
export interface QueryOptions<T = any> {
  limit?: number;
  offset?: number;
  orderBy?: keyof T | string;
  direction?: SortDirection;
}

/**
 * Sort direction for queries
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Entity reference type for relationships
 */
export interface EntityReference {
  id: string;
  collection: string;
}

/**
 * Base entity with ID field
 */
export interface EntityWithId {
  id: string;
}

/**
 * Firestore query options for filtering and pagination
 */
export interface FirestoreQueryOptions<T> {
  orderBy?: keyof T | string;
  direction?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  select?: Array<keyof T | string>;
  startAfter?: any;
  endBefore?: any;
  cache?: boolean;
}

/**
 * Firestore advanced filter for complex queries
 */
export interface FirestoreAdvancedFilter<T> {
  field: keyof T | string;
  operator: QueryFilterOperator;
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
  transaction?: Transaction;
}

/**
 * Options for finding a document by ID
 */
export interface FindByIdOptions {
  bypassCache?: boolean;
  includeDeleted?: boolean;
  throwIfNotFound?: boolean;
  includeMetadata?: boolean;
  transaction?: Transaction;
}

/**
 * Options for finding multiple documents
 */
export interface FindOptions<T> {
  filter?: Partial<T>;
  advancedFilters?: FirestoreAdvancedFilter<T>[];
  queryOptions?: FirestoreQueryOptions<T>;
  includeDeleted?: boolean;
  useCache?: boolean;
  transaction?: Transaction;
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
  transaction?: Transaction;
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
  transaction?: Transaction;
}

/**
 * Options for restoring a soft-deleted document
 */
export interface RestoreDocumentOptions {
  clearCache?: boolean;
  returnDocument?: boolean;
  updateVersion?: boolean;
  additionalUpdates?: Record<string, any>;
  transaction?: Transaction;
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
  transaction?: Transaction;
}

/**
 * Options for counting documents
 */
export interface CountDocumentsOptions<T> {
  filter?: Partial<T>;
  advancedFilters?: FirestoreAdvancedFilter<T>[];
  includeDeleted?: boolean;
  maxCount?: number;
  transaction?: Transaction;
}

/**
 * Result of a paginated query
 */
export interface PaginationResult<T> {
  data: T[];
  lastDoc: DocumentSnapshot<T> | null;
  hasMore: boolean;
  total?: number;
  cursor?: string;
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

/**
 * Repository configuration options
 */
export interface RepositoryOptions {
  collectionName: string;
  useSoftDeletes?: boolean;
  useVersioning?: boolean;
  enableCache?: boolean;
  cacheTTLMs?: number;
  requiredFields?: string[];
}

/**
 * Interface for data converters
 */
export interface EntityConverter<T extends FirestoreEntity> {
  toFirestore(entity: T): DocumentData;
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): T;
}