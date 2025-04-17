/**
 * Firestore Base Repository
 *
 * Implements a generic repository pattern for Firestore with caching,
 * soft-delete support, transactions, and optimistic locking.
 * 
 * Fully TypeScript-compliant implementation with proper generic typing
 */

import { Injectable, Logger } from "@nestjs/common";

import {
  Firestore,
  CollectionReference,
  DocumentReference,
  DocumentData,
  Query,
  WriteBatch,
  Transaction,
  QueryDocumentSnapshot,
  DocumentSnapshot,
  FieldValue,
  WithFieldValue,
} from "@google-cloud/firestore";

// Configuration service
import {
  // Types
  FirestoreQueryOptions,
  FirestoreAdvancedFilter,
  CreateDocumentOptions,
  FindByIdOptions,
  FindOptions,
  UpdateDocumentOptions,
  DeleteDocumentOptions,
  BatchDeleteOptions,
  RepositoryOptions,

  // Stats utilities
  createRepositoryStats,
  incrementReads,
  incrementWrites,
  incrementCacheHits,
  incrementCacheMisses,
  recordError,
  // Import RepositoryStats interface from repository-stats
  RepositoryStats,

  // Cache utilities
  RepositoryCache,
  DEFAULT_CACHE_OPTIONS,

  // Converter utilities
  createEntityConverter,
  sanitizeEntityForStorage,
  applyServerTimestamps,
  applyClientTimestamps,

  // Transaction utilities
  executeTransaction,
  executeBatch,
  executeMultiBatch,

  // Validation utilities
  validateRequiredFields,
  validateEntityId,
  isEntityDeleted,
  validateEntityNotDeleted,
  validateBatchItems,
} from "./base";
import { FirestoreConfigService } from "../../config/firestore.config";

// GCP type definitions
import {
  FirestoreEntity,
  TenantEntity,
  TypedCollectionReference,
  TypedDocumentReference,
  QueryOptions,
  QueryFilter,
  QueryFilterOperator,
  PaginatedResult,
  TransactionContext,
  FirestoreDataConverter,
} from "../../types/google-cloud.types";

// Repository utilities
import { Repository, BaseEntity } from './base/repository-types';

/**
 * Base Firestore repository implementation
 * Generic repository pattern for Firestore documents
 * TypeScript-compliant with proper interface implementation
 */
@Injectable()
export abstract class FirestoreBaseRepository<T extends BaseEntity, K extends string = string> implements Repository<T, K> {
  protected readonly logger: Logger;
  protected readonly statsTracker: RepositoryStats;
  protected readonly converter: FirestoreDataConverter<T>;
  protected readonly cache: RepositoryCache<T>;
  protected readonly serverTimestamp: FieldValue;

  // Repository options
  protected readonly useSoftDeletes: boolean;
  protected readonly useVersioning: boolean;
  protected readonly requiredFields: string[];

  /**
   * Constructor for the FirestoreBaseRepository
   */
  constructor(
    protected readonly firestoreConfigService: FirestoreConfigService,
    protected readonly collectionName: string,
    options?: Partial<RepositoryOptions>,
  ) {
    this.logger = new Logger(this.constructor.name);
    this.statsTracker = createRepositoryStats();

    // Set options with defaults
    const defaultOptions: RepositoryOptions = {
      collectionName: this.collectionName,
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: false,
      cacheTTLMs: 60000, // 1 minute cache TTL
    };

    const mergedOptions = { ...defaultOptions, ...options };

    this.useSoftDeletes = mergedOptions.useSoftDeletes ?? true;
    this.useVersioning = mergedOptions.useVersioning ?? true;
    this.requiredFields = mergedOptions.requiredFields ?? [];

    // Initialize cache if enabled
    this.cache = new RepositoryCache<T>({
      enabled: mergedOptions.enableCache ?? false,
      ttlMs: mergedOptions.cacheTTLMs ?? 60000,
      maxItems: 100,
      logger: this.logger,
    });

    // Create entity converter
    this.converter = createEntityConverter<T>() as FirestoreDataConverter<T>;

    // Get Firestore server timestamp
    this.serverTimestamp = FieldValue.serverTimestamp();

    this.logger.log(
      `Repository initialized for collection: ${this.collectionName}`,
    );
  }

  /**
   * Get Firestore instance
   */
  protected get firestore(): Firestore {
    return this.firestoreConfigService.getFirestore();
  }

  /**
   * Get collection reference
   */
  protected get collection(): TypedCollectionReference<T> {
    return this.firestore.collection(this.collectionName).withConverter(
      this.converter
    ) as TypedCollectionReference<T>;
  }

  /**
   * Get document reference by ID
   */
  protected getDocRef(id: K): TypedDocumentReference<T> {
    return this.collection.doc(id as string) as TypedDocumentReference<T>;
  }

  /**
   * Find an entity by its ID
   * @param id Document ID to find
   * @param options Find options
   * @returns The entity or null if not found
   */
  async findById(id: K, options: FindByIdOptions = {}): Promise<T | null> {
    try {
      // Validate ID
      validateEntityId(id);

      // Check cache first if enabled
      if (!options.bypassCache && this.cache.has(id)) {
        const cachedEntity = this.cache.get(id);
        if (cachedEntity) {
          incrementCacheHits(this.statsTracker);

          // Skip soft-deleted documents unless explicitly included
          if (!options.includeDeleted && isEntityDeleted(cachedEntity)) {
            return null;
          }

          return cachedEntity;
        }
      }

      incrementCacheMisses(this.statsTracker);

      // Get document, either from transaction or directly
      let docSnapshot: DocumentSnapshot<DocumentData>;

      if (options.transaction) {
        docSnapshot = (await options.transaction.get(
          this.getDocRef(id).withConverter(this.converter),
        )) as DocumentSnapshot<DocumentData>;
      } else {
        docSnapshot = (await this.getDocRef(id)
          .withConverter(this.converter)
          .get()) as DocumentSnapshot<DocumentData>;
        incrementReads(this.statsTracker);
      }

      // Return null if document doesn't exist
      if (!docSnapshot.exists) {
        if (options.throwIfNotFound) {
          throw new Error(
            `Document with id ${id} not found in ${this.collectionName}`,
          );
        }
        return null;
      }

      // Get document data
      const entity = docSnapshot.data() as T;

      // Skip soft-deleted documents unless explicitly included
      if (!options.includeDeleted && isEntityDeleted(entity)) {
        return null;
      }

      // Add to cache
      this.cache.set(id, entity);

      return entity;
    } catch (error) {
      recordError(this.statsTracker, error as Error);
      this.logger.error(
        `Error finding document by ID ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Find entities based on query options
   * @param options Query options
   * @returns Array of matching entities
   */
  async find(options: FindOptions<T> = {}): Promise<T[]> {
    try {
      // Start with properly typed collection query
      let query: Query<T> = this.collection;

      // Apply filter if provided
      if (options.filter) {
        for (const [field, value] of Object.entries(options.filter)) {
          if (value !== undefined) {
            query = query.where(field, "==", value) as Query<T>;
          }
        }
      }

      // Apply advanced filters if provided
      if (options.advancedFilters && options.advancedFilters.length > 0) {
        for (const filter of options.advancedFilters) {
          query = query.where(
            String(filter.field),
            filter.operator,
            filter.value,
          ) as Query<T>;
        }
      }

      // Skip soft-deleted documents by default
      if (this.useSoftDeletes && !options.includeDeleted) {
        query = query.where("isDeleted", "==", false) as Query<T>;
      }

      // Apply query options
      if (options.queryOptions) {
        // Apply ordering
        if (options.queryOptions.orderBy) {
          query = query.orderBy(
            String(options.queryOptions.orderBy),
            options.queryOptions.direction || "asc",
          ) as Query<T>;
        }

        // Apply limit
        if (options.queryOptions.limit) {
          query = query.limit(options.queryOptions.limit) as Query<T>;
        }

        // Apply offset by implementing a cursor-based approach
        if (options.queryOptions.offset && options.queryOptions.offset > 0) {
          query = query.limit(
            (options.queryOptions.limit || 100) + options.queryOptions.offset,
          ) as Query<T>;
        }

        // Apply cursor-based pagination
        if (options.queryOptions.startAfter) {
          query = query.startAfter(options.queryOptions.startAfter) as Query<T>;
        }

        if (options.queryOptions.endBefore) {
          query = query.endBefore(options.queryOptions.endBefore) as Query<T>;
        }

        // Apply field selection
        if (
          options.queryOptions.select &&
          options.queryOptions.select.length > 0
        ) {
          query = query.select(
            ...options.queryOptions.select.map(String),
          ) as Query<T>;
        }
      }

      // Execute the query with transaction if provided
      let querySnapshot;
      if (options.transaction) {
        querySnapshot = await options.transaction.get(query);
      } else {
        querySnapshot = await query.get();
        incrementReads(this.statsTracker);
      }

      // Extract documents
      let results = querySnapshot.docs.map((doc) => doc.data() as T);

      // Apply offset (since Firestore doesn't support native offset)
      if (options.queryOptions?.offset && options.queryOptions.offset > 0) {
        results = results.slice(options.queryOptions.offset);

        // Re-apply limit after offset
        if (options.queryOptions.limit) {
          results = results.slice(0, options.queryOptions.limit);
        }
      }

      // Add to cache if enabled and not too many results
      if (options.useCache !== false && results.length <= 100) {
        for (const entity of results) {
          this.cache.set(entity.id, entity);
        }
      }

      return results;
    } catch (error) {
      recordError(this.statsTracker, error as Error);
      this.logger.error(
        `Error finding documents: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Get all entities
   * @param options Find options
   * @returns Promise with array of all entities
   */
  async findAll(options: FindOptions<T> = {}): Promise<T[]> {
    // Simple wrapper around find to maintain backwards compatibility
    return this.find(options);
  }

  /**
   * Count entities based on query options
   * @param options Count options
   * @returns The count of matching entities
   */
  async count(options: FindOptions<T> = {}): Promise<number> {
    try {
      // Start with properly typed collection query
      let query: CollectionReference<T> | Query<T> = this.collection;

      // Apply filter if provided
      if (options.filter) {
        for (const [field, value] of Object.entries(options.filter)) {
          if (value !== undefined) {
            query = query.where(field, "==", value) as Query<T>;
          }
        }
      }

      // Apply advanced filters if provided
      if (options.advancedFilters && options.advancedFilters.length > 0) {
        for (const filter of options.advancedFilters) {
          query = query.where(
            String(filter.field),
            filter.operator,
            filter.value,
          ) as Query<T>;
        }
      }

      // Skip soft-deleted documents by default
      if (this.useSoftDeletes && !options.includeDeleted) {
        query = query.where("isDeleted", "==", false) as Query<T>;
      }

      // Execute count query
      let count: number;

      // Use transaction if provided
      if (options.transaction) {
        const snapshot = await options.transaction.get(query);
        count = snapshot.size;
      } else {
        // If Firestore count() API is available, use it
        if (typeof query.count === "function") {
          const countSnapshot = await query.count().get();
          count = countSnapshot.data().count;
        } else {
          // Fallback to getting all docs and counting them
          const snapshot = await query.get();
          count = snapshot.size;
        }
        incrementReads(this.statsTracker);
      }

      return count;
    } catch (error) {
      recordError(this.statsTracker, error as Error);
      this.logger.error(
        `Error counting documents: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Create a new entity
   * @param data The entity data to create
   * @param options Creation options
   * @returns The created entity
   */
  async create(
    data: Omit<T, "id" | "createdAt" | "updatedAt">,
    options: CreateDocumentOptions = {},
  ): Promise<T> {
    try {
      // Validate required fields
      if (this.requiredFields.length > 0) {
        validateRequiredFields(data as Partial<T>, this.requiredFields);
      }

      // Generate ID if not provided
      const docId = options.useCustomId || this.collection.doc().id as K;

      // Create the document reference
      // TypeScript is overly strict with string vs K compatibility - safe to cast since K extends string
      const docRef = this.getDocRef(docId as unknown as K);

      // Prepare entity data
      let entityData: Record<string, any> = { ...data };

      // Add timestamps and metadata
      if (options.useServerTimestamp) {
        entityData = applyServerTimestamps(
          entityData,
          this.serverTimestamp,
          true, // is new entity
        );
      } else {
        entityData = applyClientTimestamps(
          entityData,
          true, // is new entity
        );
      }

      // Add soft-delete flag
      entityData.isDeleted = false;

      // Add version if needed
      if (this.useVersioning) {
        entityData.version = options.initialVersion || 1;
      }

      // Execute create operation
      if (options.transaction) {
        options.transaction.set(docRef, entityData as WithFieldValue<T>);
      } else {
        await docRef.set(entityData as WithFieldValue<T>);
        incrementWrites(this.statsTracker);
      }

      // Build the complete entity with ID
      const createdEntity = {
        id: docId,
        ...entityData,
      } as T;

      // Add to cache if enabled
      if (options.addToCache !== false) {
        this.cache.set(docId, createdEntity);
      }

      return createdEntity;
    } catch (error) {
      recordError(this.statsTracker, error as Error);
      this.logger.error(
        `Error creating document: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Update an existing entity
   * @param id Document ID to update
   * @param data Data to update
   * @param options Update options
   * @returns The updated entity
   */
  async update(
    id: K,
    data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>,
    options: UpdateDocumentOptions = {},
  ): Promise<T> {
    try {
      // Validate ID
      validateEntityId(id);

      // Get existing document to check for soft-deletion and versioning
      const docRef = this.getDocRef(id);

      // If using transaction, do all operations in transaction
      if (options.transaction) {
        const docSnapshot = await options.transaction.get(docRef);

        if (!docSnapshot.exists) {
          throw new Error(
            `Document with id ${id} not found in ${this.collectionName}`,
          );
        }

        const existingDoc = docSnapshot.data() as T;

        // Check if document is soft-deleted
        if (!options.bypassSoftDeleteCheck && existingDoc.isDeleted) {
          throw new Error(`Cannot update soft-deleted document with id ${id}`);
        }

        // Prepare update data
        let updateData: Record<string, any> = { ...data };

        // Update timestamp and version if needed
        updateData.updatedAt = this.serverTimestamp;

        if (this.useVersioning && options.incrementVersion !== false) {
          updateData.version = (existingDoc.version || 0) + 1;
        }

        // Clean up data before sending to Firestore
        if (options.sanitizeData !== false) {
          updateData = sanitizeEntityForStorage(updateData as T);
        }

        // Perform update in transaction
        options.transaction.update(docRef, updateData as DocumentData);

        // For transactions, we can't return updated doc immediately
        return { ...existingDoc, ...updateData, id } as T;
      } else {
        // Not in transaction, fetch document first
        const existingDoc = await this.findById(id, {
          bypassCache: true,
          includeDeleted: options.bypassSoftDeleteCheck,
        });

        if (!existingDoc) {
          throw new Error(
            `Document with id ${id} not found in ${this.collectionName}`,
          );
        }

        // Check if document is soft-deleted
        if (!options.bypassSoftDeleteCheck && existingDoc.isDeleted) {
          throw new Error(`Cannot update soft-deleted document with id ${id}`);
        }

        // Prepare update data
        let updateData: Record<string, any> = { ...data };

        // Update timestamp
        updateData.updatedAt = new Date();

        // Update version if needed
        if (this.useVersioning && options.incrementVersion !== false) {
          updateData.version = (existingDoc.version || 0) + 1;
        }

        // Clean up data before sending to Firestore
        if (options.sanitizeData !== false) {
          updateData = sanitizeEntityForStorage(updateData as T);
        }

        // Perform update
        await docRef.update(updateData as DocumentData);
        incrementWrites(this.statsTracker);

        // Invalidate cache if enabled
        if (options.invalidateCache !== false) {
          this.cache.delete(id);
        }

        // Get updated document
        const updatedDoc = await this.findById(id, { bypassCache: true });
        if (!updatedDoc) {
          throw new Error(`Failed to retrieve updated document with id ${id}`);
        }

        return updatedDoc;
      }
    } catch (error) {
      recordError(this.statsTracker, error as Error);
      this.logger.error(
        `Error updating document with id ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Delete an entity by ID (soft or hard delete)
   * @param id Document ID to delete
   * @param options Delete options
   */
  async delete(id: K, options: DeleteDocumentOptions = {}): Promise<void> {
    try {
      // Validate ID
      validateEntityId(id);

      const docRef = this.getDocRef(id);

      // Determine if we do soft or hard delete
      const softDelete =
        this.useSoftDeletes && options.softDelete !== false && !options.force;

      if (options.transaction) {
        if (softDelete) {
          // Soft delete - update the document
          options.transaction.update(docRef, {
            isDeleted: true,
            deletedAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          // Hard delete - remove the document
          options.transaction.delete(docRef);
        }
      } else {
        if (softDelete) {
          // Soft delete - update the document
          await docRef.update({
            isDeleted: true,
            deletedAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          // Hard delete - remove the document
          await docRef.delete();
        }
        incrementWrites(this.statsTracker);
      }

      // Clear from cache if enabled
      if (options.clearCache !== false) {
        this.cache.delete(id);
      }
    } catch (error) {
      recordError(this.statsTracker, error as Error);
      this.logger.error(
        `Error deleting document with id ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Create multiple entities in batch
   * @param items Array of entities to create
   * @param options Batch options
   * @returns Result of the batch operation
   */
  async createBatch(
    items: Array<Omit<T, "id" | "createdAt" | "updatedAt">>,
    options: CreateDocumentOptions = {},
  ): Promise<T[]> {
    try {
      // Validate items
      validateBatchItems(items);

      const now = new Date();
      const batchSize = 500; // Firestore batch size limit
      const batches: ((batch: WriteBatch) => void)[] = [];
      const createdEntities: T[] = [];

      // Split into batches if needed
      for (let i = 0; i < items.length; i += batchSize) {
        const batchItems = items.slice(i, i + batchSize);

        batches.push((batch: WriteBatch) => {
          for (const item of batchItems) {
            // Validate required fields
            if (this.requiredFields.length > 0) {
              validateRequiredFields(item as Partial<T>, this.requiredFields);
            }

            // Generate doc reference
            const docRef = this.collection.doc();

            // Prepare entity data
            let entityData: Record<string, any> = { ...item };

            // Add timestamps and metadata
            if (options.useServerTimestamp) {
              entityData = applyServerTimestamps(
                entityData,
                this.serverTimestamp,
                true, // is new entity
              );
            } else {
              entityData = {
                ...entityData,
                createdAt: now,
                updatedAt: now,
              };
            }

            // Add soft-delete flag
            entityData.isDeleted = false;

            // Add version if needed
            if (this.useVersioning) {
              entityData.version = options.initialVersion || 1;
            }

            // Add to batch
            batch.set(docRef, entityData as WithFieldValue<T>);

            // Add to created entities
            createdEntities.push({
              id: docRef.id,
              ...entityData,
            } as T);
          }
        });
      }

      // Execute all batches
      const result = await executeMultiBatch(this.firestore, batches);

      // Track stats
      incrementWrites(this.statsTracker, result.writtenCount || 0);

      // Cache entities if successful
      if (options.addToCache !== false && result.status !== "error") {
        for (const entity of createdEntities) {
          this.cache.set(entity.id, entity);
        }
      }

      // If any errors, throw the first one
      if (result.errors && result.errors.length > 0) {
        throw result.errors[0].error;
      }

      return createdEntities;
    } catch (error) {
      recordError(this.statsTracker, error as Error);
      this.logger.error(
        `Error creating batch: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Execute a function within a transaction
   * @param txFn Function to execute in transaction
   * @param options Transaction options
   * @returns Result of the transaction
   */
  async runTransaction<R>(
    txFn: (transaction: Transaction) => Promise<R>,
    options: {} = {},
  ): Promise<R> {
    try {
      return await executeTransaction(
        this.firestore,
        async (txContext: TransactionContext) => {
          // Execute the function with the transaction
          return await txFn(txContext.transaction);
        },
        options,
      );
    } catch (error) {
      recordError(this.statsTracker, error as Error);
      this.logger.error(
        `Error executing transaction: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Backwards compatibility method for withTransaction
   * @deprecated Use runTransaction instead
   */
  async withTransaction<R>(
    fn: (transaction: Transaction) => Promise<R>,
  ): Promise<R> {
    return this.runTransaction(fn);
  }

  /**
   * Find with pagination
   * @param queryOptions Query options
   * @returns Paginated result
   */
  async paginate(queryOptions: QueryOptions = {}): Promise<PaginatedResult<T>> {
    try {
      // Extract pagination options
      const page = queryOptions.pagination?.page || 1;
      const pageSize = queryOptions.pagination?.pageSize || 10;

      // Calculate offset
      const offset = (page - 1) * pageSize;

      // Convert filters to advanced filters
      const advancedFilters: FirestoreAdvancedFilter<T>[] = [];

      if (queryOptions.filters) {
        for (const filter of queryOptions.filters) {
          advancedFilters.push({
            field: filter.field,
            operator: filter.operator,
            value: filter.value,
          });
        }
      }

      // Get total count
      const totalPromise = this.count({
        advancedFilters,
        includeDeleted: queryOptions.includeDeleted,
      });

      // Get items for this page
      const itemsPromise = this.find({
        advancedFilters,
        queryOptions: {
          limit: pageSize,
          offset,
          orderBy: queryOptions.orderBy?.[0]?.field as keyof T | string,
          direction: queryOptions.orderBy?.[0]?.direction as
            | "asc"
            | "desc"
            | undefined,
        },
        includeDeleted: queryOptions.includeDeleted,
      });

      // Wait for both operations
      const [total, items] = await Promise.all([totalPromise, itemsPromise]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / pageSize);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };
    } catch (error) {
      recordError(this.statsTracker, error as Error);
      this.logger.error(
        `Error paginating documents: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Get statistics for this repository
   */
  getStats(): RepositoryStats {
    return { ...this.statsTracker };
  }

  /**
   * Find multiple entities by their IDs
   * @param ids Array of document IDs to find
   * @param options Find options
   * @returns Array of found entities (may be fewer than requested if some don't exist)
   */
  async findByIds(ids: K[], options: FindByIdOptions = {}): Promise<T[]> {
    try {
      // Validate IDs
      if (!Array.isArray(ids) || ids.length === 0) {
        return [];
      }

      // Deduplicate IDs
      const uniqueIds = [...new Set(ids)];

      // If using transactions, get all docs in transaction
      if (options.transaction) {
        const promises = uniqueIds.map(id => 
          this.findById(id, options)
        );
        const results = await Promise.all(promises);
        // Type assertion is needed here because TypeScript doesn't recognize 
        // the non-null filter properly with Promise.all results
        return results.filter(Boolean) as T[];
      }

      // Otherwise use batch get for efficiency when possible
      if (typeof this.firestore.getAll === 'function') {
        const docRefs = uniqueIds.map(id => 
          this.getDocRef(id).withConverter(this.converter)
        );
        
        const snapshots = await this.firestore.getAll(...docRefs);
        incrementReads(this.statsTracker, snapshots.length);
        
        const entities: T[] = [];
        
        for (const snapshot of snapshots) {
          if (snapshot.exists) {
            const entity = snapshot.data() as T;
            
            // Skip soft-deleted documents unless explicitly included
            if (!options.includeDeleted && isEntityDeleted(entity)) {
              continue;
            }
            
            entities.push(entity);
            
            // Add to cache if enabled
            if (!options.bypassCache) {
              this.cache.set(entity.id, entity);
            }
          }
        }
        
        return entities;
      } else {
        // Fallback to individual gets with Promise.all for parallelism
        const promises = uniqueIds.map(id => 
          this.findById(id, options)
        );
        const results = await Promise.all(promises);
        // Type assertion is needed here because TypeScript doesn't recognize 
        // the non-null filter properly with Promise.all results
        return results.filter(Boolean) as T[];
      }
    } catch (error) {
      recordError(this.statsTracker, error as Error);
      this.logger.error(
        `Error finding documents by IDs: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Find entities by field value
   * @param field Field to query
   * @param value Value to match
   * @param options Find options
   * @returns Array of matching entities
   */
  async findBy(field: keyof T | string, value: any, options: FindOptions<T> = {}): Promise<T[]> {
    try {
      // Create advanced filter
      const advancedFilter: FirestoreAdvancedFilter<T> = {
        field,
        operator: "==",
        value,
      };

      // Use find with the filter
      return this.find({
        ...options,
        advancedFilters: [
          ...(options.advancedFilters || []),
          advancedFilter,
        ],
      });
    } catch (error) {
      recordError(this.statsTracker, error as Error);
      this.logger.error(
        `Error finding documents by field ${String(field)}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Find a single entity by field value
   * @param field Field to query
   * @param value Value to match
   * @param options Find options
   * @returns First matching entity or null
   */
  async findOneBy(field: keyof T | string, value: any, options: FindOptions<T> = {}): Promise<T | null> {
    try {
      // Use findBy with limit 1
      const results = await this.findBy(field, value, {
        ...options,
        queryOptions: {
          ...options.queryOptions,
          limit: 1,
        },
      });

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      recordError(this.statsTracker, error as Error);
      this.logger.error(
        `Error finding one document by field ${String(field)}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Check if a document with the given ID exists
   * @param id Document ID to check
   * @returns True if the document exists
   */
  async exists(id: K): Promise<boolean> {
    try {
      // Validate ID
      validateEntityId(id as string);

      // Check cache first if enabled
      if (this.cache.has(id as string)) {
        incrementCacheHits(this.statsTracker);
        return true;
      }

      incrementCacheMisses(this.statsTracker);

      // Get document reference
      const docRef = this.getDocRef(id as unknown as K);
      
      // Get only the document metadata (more efficient than getting full doc)
      const docSnapshot = await docRef.get();
      incrementReads(this.statsTracker);

      return docSnapshot.exists;
    } catch (error) {
      recordError(this.statsTracker, error as Error);
      this.logger.error(
        `Error checking if document with id ${String(id)} exists: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Create multiple entities
   * @param items Array of entities to create
   * @param options Creation options
   * @returns Array of created entities
   */
  async createMany(
    items: Array<Omit<T, "id" | "createdAt" | "updatedAt">>,
    options: CreateDocumentOptions = {},
  ): Promise<T[]> {
    // Alias to createBatch for compatibility with Repository interface
    return this.createBatch(items, options);
  }

  /**
   * Update multiple entities
   * @param items Array of entities with update data
   * @param options Update options
   * @returns Array of updated entities
   */
  async updateMany(
    items: Array<{ id: K; data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">> }>,
    options: UpdateDocumentOptions = {},
  ): Promise<T[]> {
    try {
      // Validate items
      if (!Array.isArray(items) || items.length === 0) {
        return [];
      }

      const batchSize = 500; // Firestore batch size limit
      const batches: ((batch: WriteBatch) => void)[] = [];
      const updatedEntities: T[] = [];
      const now = new Date();

      // If using transaction, perform all updates in the transaction
      if (options.transaction) {
        const transaction = options.transaction;
        
        // Process each item in the transaction
        for (const item of items) {
          const { id, data } = item;
          validateEntityId(id as string);
          
          const docRef = this.getDocRef(id as unknown as K);
          const docSnapshot = await transaction.get(docRef);
          
          if (!docSnapshot.exists) {
            throw new Error(`Document with id ${String(id)} not found in ${this.collectionName}`);
          }
          
          const existingDoc = docSnapshot.data() as T;
          
          // Check if document is soft-deleted
          if (!options.bypassSoftDeleteCheck && existingDoc.isDeleted) {
            throw new Error(`Cannot update soft-deleted document with id ${String(id)}`);
          }
          
          // Prepare update data
          let updateData: Record<string, any> = { ...data };
          
          // Update timestamp
          updateData.updatedAt = this.serverTimestamp;
          
          // Update version if needed
          if (this.useVersioning && options.incrementVersion !== false) {
            updateData.version = (existingDoc.version || 0) + 1;
          }
          
          // Clean up data before sending to Firestore
          if (options.sanitizeData !== false) {
            updateData = sanitizeEntityForStorage(updateData as T);
          }
          
          // Perform update in transaction
          transaction.update(docRef, updateData as DocumentData);
          
          // For transactions, merge existing with updates for return
          updatedEntities.push({ ...existingDoc, ...updateData, id } as T);
        }
        
        return updatedEntities;
      }

      // Split into batches if needed
      for (let i = 0; i < items.length; i += batchSize) {
        const batchItems = items.slice(i, i + batchSize);
        
        batches.push(async (batch: WriteBatch) => {
          for (const item of batchItems) {
            const { id, data } = item;
            validateEntityId(id as string);
            
            // Get existing document
            const existingDoc = await this.findById(id as unknown as K, {
              bypassCache: true,
              includeDeleted: options.bypassSoftDeleteCheck,
            });
            
            if (!existingDoc) {
              throw new Error(`Document with id ${String(id)} not found in ${this.collectionName}`);
            }
            
            // Check if document is soft-deleted
            if (!options.bypassSoftDeleteCheck && existingDoc.isDeleted) {
              throw new Error(`Cannot update soft-deleted document with id ${String(id)}`);
            }
            
            const docRef = this.getDocRef(id as unknown as K);
            
            // Prepare update data
            let updateData: Record<string, any> = { ...data };
            
            // Update timestamp
            updateData.updatedAt = new Date();
            
            // Update version if needed
            if (this.useVersioning && options.incrementVersion !== false) {
              updateData.version = (existingDoc.version || 0) + 1;
            }
            
            // Clean up data before sending to Firestore
            if (options.sanitizeData !== false) {
              updateData = sanitizeEntityForStorage(updateData as T);
            }
            
            // Add to batch
            batch.update(docRef, updateData as DocumentData);
            
            // Add to updated entities (for return value)
            updatedEntities.push({ ...existingDoc, ...updateData } as T);
          }
        });
      }

      // Execute all batches
      const result = await executeMultiBatch(this.firestore, batches);
      
      // Track stats
      incrementWrites(this.statsTracker, result.writtenCount || 0);
      
      // Invalidate cache for all items
      if (options.invalidateCache !== false) {
        for (const item of items) {
          this.cache.delete(item.id as string);
        }
      }
      
      // If any errors, throw the first one
      if (result.errors && result.errors.length > 0) {
        throw result.errors[0].error;
      }
      
      // Get all updated entities
      if (result.status === "success" && options.invalidateCache !== false) {
        // Fetch fresh copies from the database
        return this.findByIds(items.map(item => item.id), { bypassCache: true });
      }
      
      return updatedEntities;
    } catch (error) {
      recordError(this.statsTracker, error as Error);
      this.logger.error(
        `Error updating multiple documents: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Delete multiple entities by their IDs
   * @param ids Array of document IDs to delete
   * @param options Delete options
   */
  async deleteMany(ids: K[], options: BatchDeleteOptions = {}): Promise<void> {
    try {
      // Validate IDs
      if (!Array.isArray(ids) || ids.length === 0) {
        return;
      }

      // Deduplicate IDs
      const uniqueIds = [...new Set(ids)];
      
      const batchSize = options.batchSize || 500; // Firestore batch size limit
      const batches: ((batch: WriteBatch) => void)[] = [];
      
      // Determine if we do soft or hard delete
      const softDelete = this.useSoftDeletes && options.softDelete !== false;
      
      // If using transaction, delete all in transaction
      if (options.transaction) {
        for (const id of uniqueIds) {
          const docRef = this.getDocRef(id as unknown as K);
          
          if (softDelete) {
            // Soft delete - update the document
            options.transaction.update(docRef, {
              isDeleted: true,
              deletedAt: this.serverTimestamp,
              updatedAt: this.serverTimestamp,
            });
          } else {
            // Hard delete - remove the document
            options.transaction.delete(docRef);
          }
        }
      } else {
        // Split into batches if needed
        for (let i = 0; i < uniqueIds.length; i += batchSize) {
          const batchIds = uniqueIds.slice(i, i + batchSize);
          
          batches.push((batch: WriteBatch) => {
            for (const id of batchIds) {
              const docRef = this.getDocRef(id as unknown as K);
              
              if (softDelete) {
                // Soft delete - update the document
                batch.update(docRef, {
                  isDeleted: true,
                  deletedAt: new Date(),
                  updatedAt: new Date(),
                });
              } else {
                // Hard delete - remove the document
                batch.delete(docRef);
              }
            }
          });
        }
        
        // Execute all batches
        const result = await executeMultiBatch(this.firestore, batches);
        
        // Track stats
        incrementWrites(this.statsTracker, result.writtenCount || 0);
        
        // If any errors, throw the first one
        if (result.errors && result.errors.length > 0) {
          throw result.errors[0].error;
        }
      }
      
      // Clear from cache
      uniqueIds.forEach(id => this.cache.delete(id as string));
    } catch (error) {
      recordError(this.statsTracker, error as Error);
      this.logger.error(
        `Error deleting multiple documents: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}

/**
 * Tenant-aware repository implementation that adds organization filtering
 */
@Injectable()
export abstract class TenantAwareRepository<
  T extends TenantEntity,
> extends FirestoreBaseRepository<T> {
  /**
   * Find all entities for a specific organization
   */
  async findByOrganization(
    organizationId: string,
    options: FindOptions<T> = {},
  ): Promise<T[]> {
    // Create new filter with organization
    const filter = {
      ...options.filter,
      organizationId,
    } as Partial<T>;

    return this.find({
      ...options,
      filter,
    });
  }

  /**
   * Count entities for a specific organization
   */
  async countByOrganization(
    organizationId: string,
    options: FindOptions<T> = {},
  ): Promise<number> {
    // Create new filter with organization
    const filter = {
      ...options.filter,
      organizationId,
    } as Partial<T>;

    return this.count({
      ...options,
      filter,
    });
  }

  /**
   * Paginate entities for a specific organization
   */
  async paginateByOrganization(
    organizationId: string,
    queryOptions: QueryOptions = {},
  ): Promise<PaginatedResult<T>> {
    // Add organization filter
    const filters = [
      ...(queryOptions.filters || []),
      {
        field: "organizationId",
        operator: "==" as QueryFilterOperator,
        value: organizationId,
      },
    ];

    return this.paginate({
      ...queryOptions,
      filters,
    });
  }
}
