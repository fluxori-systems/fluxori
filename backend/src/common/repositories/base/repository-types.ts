/**
 * Repository type definitions for Firestore repositories
 * Complete TypeScript-compliant implementation with proper generic typing
 */

import {
  DocumentData,
  DocumentSnapshot,
  FieldValue,
  Transaction,
  QueryDocumentSnapshot,
  WriteBatch,
} from '@google-cloud/firestore';

import { RepositoryStats } from './repository-stats';
import {
  FirestoreEntity,
  Timestamp,
  QueryFilterOperator,
  TransactionContext,
} from '../../../types/google-cloud.types';

/**
 * Base entity interface all models should implement, aligned with FirestoreEntity
 */
export interface FirestoreEntityWithMetadata {
  id: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  isDeleted: boolean;
  deletedAt?: Date | Timestamp | null;
  version: number;
}

// Deprecated: Use FirestoreEntityWithMetadata for new code
export interface BaseEntity {
  id: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  isDeleted?: boolean;
  deletedAt?: Date | Timestamp | null;
  version?: number;
}

/**
 * Base repository interface that defines common operations
 */
export interface Repository<T extends FirestoreEntityWithMetadata, K = string> {
  // Core CRUD operations
  findById(id: K, options?: FindByIdOptions): Promise<T | null>;
  findAll(options?: FindOptions<T>): Promise<T[]>;
  find(options?: FindOptions<T>): Promise<T[]>;
  create(
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
    options?: CreateDocumentOptions,
  ): Promise<T>;
  update(
    id: K,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>,
    options?: UpdateDocumentOptions,
  ): Promise<T>;
  delete(id: K, options?: DeleteDocumentOptions): Promise<void>;

  // Additional common operations
  findByIds(ids: K[], options?: FindByIdOptions): Promise<T[]>;
  findBy(
    field: keyof T | string,
    value: any,
    options?: FindOptions<T>,
  ): Promise<T[]>;
  findOneBy(
    field: keyof T | string,
    value: any,
    options?: FindOptions<T>,
  ): Promise<T | null>;
  count(options?: CountDocumentsOptions<T>): Promise<number>;
  exists(id: K): Promise<boolean>;

  // Bulk operations
  createMany(
    items: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>,
    options?: CreateDocumentOptions,
  ): Promise<T[]>;
  updateMany(
    items: Array<{
      id: K;
      data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
    }>,
    options?: UpdateDocumentOptions,
  ): Promise<T[]>;
  deleteMany(ids: K[], options?: BatchDeleteOptions): Promise<void>;

  // Transaction operations
  runTransaction<R>(
    callback: (transaction: Transaction) => Promise<R>,
  ): Promise<R>;
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
  batchWrite?: boolean;
  batch?: WriteBatch;
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
  consistentRead?: boolean;
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
  limit?: number;
  offset?: number;
  orderBy?: { field: keyof T | string; direction: 'asc' | 'desc' }[];
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
  batchWrite?: boolean;
  batch?: WriteBatch;
  expectedVersion?: number;
  updateTimestamp?: boolean;
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
  batchWrite?: boolean;
  batch?: WriteBatch;
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
  transaction?: Transaction;
  deleteSubcollections?: boolean;
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
  autoTimestamps?: boolean;
  validateOnWrite?: boolean;
}

/**
 * Interface for data converters
 */
export interface EntityConverter<T extends BaseEntity> {
  toFirestore(entity: T): DocumentData;
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): T;
}

/**
 * Interface for entity with ID
 */
export interface EntityWithId {
  id: string;
}
