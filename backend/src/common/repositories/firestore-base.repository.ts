/**
 * Firestore Base Repository
 *
 * Implements a generic repository pattern for Firestore with caching,
 * soft-delete support, transactions, and optimistic locking.
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
} from "../../types/google-cloud.types";

// Repository utilities

/**
 * Base Firestore repository implementation
 * Generic repository pattern for Firestore documents
 */
@Injectable()
export abstract class FirestoreBaseRepository<T extends FirestoreEntity> {
  protected readonly logger: Logger;
  protected readonly statsTracker: RepositoryStats;
  protected readonly converter;
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
    this.converter = createEntityConverter<T>();

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
    return this.firestore.collection(
      this.collectionName,
    ) as TypedCollectionReference<T>;
  }

  /**
   * Get document reference by ID
   */
  protected getDocRef(id: string): TypedDocumentReference<T> {
    return this.collection.doc(id) as TypedDocumentReference<T>;
  }

  /**
   * Find an entity by its ID
   * @param id Document ID to find
   * @param options Find options
   * @returns The entity or null if not found
   */
  async findById(id: string, options: FindByIdOptions = {}): Promise<T | null> {
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
      let query = this.collection.withConverter(this.converter);

      // Apply filter if provided
      if (options.filter) {
        for (const [field, value] of Object.entries(options.filter)) {
          if (value !== undefined) {
            query = query.where(field, "==", value) as any;
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
          ) as any;
        }
      }

      // Skip soft-deleted documents by default
      if (this.useSoftDeletes && !options.includeDeleted) {
        query = query.where("isDeleted", "==", false) as any;
      }

      // Apply query options
      if (options.queryOptions) {
        // Apply ordering
        if (options.queryOptions.orderBy) {
          query = query.orderBy(
            String(options.queryOptions.orderBy),
            options.queryOptions.direction || "asc",
          ) as any;
        }

        // Apply limit
        if (options.queryOptions.limit) {
          query = query.limit(options.queryOptions.limit) as any;
        }

        // Apply offset by implementing a cursor-based approach
        if (options.queryOptions.offset && options.queryOptions.offset > 0) {
          query = query.limit(
            (options.queryOptions.limit || 100) + options.queryOptions.offset,
          ) as any;
        }

        // Apply cursor-based pagination
        if (options.queryOptions.startAfter) {
          query = query.startAfter(options.queryOptions.startAfter) as any;
        }

        if (options.queryOptions.endBefore) {
          query = query.endBefore(options.queryOptions.endBefore) as any;
        }

        // Apply field selection
        if (
          options.queryOptions.select &&
          options.queryOptions.select.length > 0
        ) {
          query = query.select(
            ...options.queryOptions.select.map(String),
          ) as any;
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
      let query = this.collection;

      // Apply filter if provided
      if (options.filter) {
        for (const [field, value] of Object.entries(options.filter)) {
          if (value !== undefined) {
            query = query.where(field, "==", value) as any;
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
          ) as any;
        }
      }

      // Skip soft-deleted documents by default
      if (this.useSoftDeletes && !options.includeDeleted) {
        query = query.where("isDeleted", "==", false) as any;
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
      const docId = options.useCustomId || this.collection.doc().id;

      // Create the document reference
      const docRef = this.getDocRef(docId);

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
    id: string,
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
  async delete(id: string, options: DeleteDocumentOptions = {}): Promise<void> {
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
    txFn: (context: TransactionContext) => Promise<R>,
    options: {} = {},
  ): Promise<R> {
    try {
      return await executeTransaction(
        this.firestore,
        async (txContext) => {
          // Execute the function with the transaction context
          return await txFn(txContext);
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
    return this.runTransaction(async (context) => {
      return fn(context.transaction);
    });
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
