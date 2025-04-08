import { Injectable, Logger } from '@nestjs/common';
import { 
  Firestore, 
  CollectionReference, 
  DocumentReference, 
  DocumentData, 
  Query,
  WriteBatch,
  Transaction,
  Timestamp,
  FieldValue,
  WithFieldValue
} from '@google-cloud/firestore';

import { FirestoreConfigService } from '../../config/firestore.config';
import { 
  FirestoreEntity,
  TenantEntity,
  TypedCollectionReference,
  TypedDocumentReference,
  TypedDocumentSnapshot,
  FirestoreBatchWriteResult,
  QueryOptions,
  QueryFilter,
  QueryOrder
} from '../../types/google-cloud.types';

/**
 * Base repository interface types
 */
export interface PaginatedQueryOptions extends QueryOptions {
  pagination: {
    page: number;
    limit: number;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export type FirestoreDocument = Record<string, any>;

export interface TransactionContext<T extends FirestoreEntity> {
  get(id: string): Promise<T | null>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Base Firestore repository implementation
 */
@Injectable()
export abstract class UnifiedFirestoreRepository<T extends FirestoreEntity> {
  protected readonly logger: Logger;
  
  constructor(
    protected readonly firestoreConfigService: FirestoreConfigService,
    protected readonly collectionName: string,
    protected readonly options?: {
      useSoftDeletes?: boolean;
      useVersioning?: boolean;
      enableCache?: boolean;
      cacheTTLMs?: number;
      requiredFields?: Array<keyof T>;
    }
  ) {
    this.logger = new Logger(this.constructor.name);
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
      this.collectionName
    ) as TypedCollectionReference<T>;
  }

  /**
   * Get document reference by ID
   */
  protected getDocRef(id: string): TypedDocumentReference<T> {
    return this.collection.doc(id) as TypedDocumentReference<T>;
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      const docRef = this.getDocRef(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return null;
      }
      
      return this.mapDocumentToEntity(doc);
    } catch (error) {
      this.logger.error(`Error finding document by ID: ${id}`, error?.stack);
      throw error;
    }
  }

  /**
   * Find all entities
   */
  async findAll(options?: QueryOptions): Promise<T[]> {
    try {
      let query = this.collection;
      
      // Apply query options if provided
      if (options) {
        query = this.applyQueryOptions(query, options) as TypedCollectionReference<T>;
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => this.mapDocumentToEntity(doc));
    } catch (error) {
      this.logger.error('Error finding all documents', error?.stack);
      throw error;
    }
  }

  /**
   * Find entities with query options
   */
  async find(options: QueryOptions): Promise<T[]> {
    try {
      const query = this.applyQueryOptions(this.collection, options);
      const snapshot = await query.get();
      return snapshot.docs.map(doc => this.mapDocumentToEntity(doc));
    } catch (error) {
      this.logger.error('Error finding documents with query', error?.stack);
      throw error;
    }
  }

  /**
   * Find entities with pagination
   */
  async findPaginated(options: PaginatedQueryOptions): Promise<PaginatedResult<T>> {
    try {
      const { pagination } = options;
      const { page, limit } = pagination;
      
      // Get total count for pagination metadata
      const totalCount = await this.count(options);
      
      // Calculate offset based on page and limit
      const offset = (page - 1) * limit;
      const paginatedOptions: QueryOptions = {
        ...options,
        pagination: {
          limit,
          offset
        }
      };
      
      // Get paginated results
      const results = await this.find(paginatedOptions);
      
      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        data: results,
        meta: {
          total: totalCount,
          page,
          limit,
          pages: totalPages
        }
      };
    } catch (error) {
      this.logger.error('Error finding paginated documents', error?.stack);
      throw error;
    }
  }

  /**
   * Create new entity
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      const docRef = this.collection.doc();
      const now = Timestamp.now();
      
      const docData = {
        ...data,
        createdAt: now,
        updatedAt: now
      };
      
      await docRef.set(docData as WithFieldValue<T>);
      
      return {
        id: docRef.id,
        ...docData
      } as T;
    } catch (error) {
      this.logger.error('Error creating document', error?.stack);
      throw error;
    }
  }

  /**
   * Update existing entity
   */
  async update(
    id: string, 
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<T> {
    try {
      const docRef = this.getDocRef(id);
      const now = Timestamp.now();
      
      const updateData = {
        ...data,
        updatedAt: now
      };
      
      await docRef.update(updateData as any);
      
      // Fetch the updated document
      const updatedDoc = await docRef.get();
      return this.mapDocumentToEntity(updatedDoc);
    } catch (error) {
      this.logger.error(`Error updating document: ${id}`, error?.stack);
      throw error;
    }
  }

  /**
   * Delete entity
   */
  async delete(id: string): Promise<boolean> {
    try {
      const docRef = this.getDocRef(id);
      await docRef.delete();
      return true;
    } catch (error) {
      this.logger.error(`Error deleting document: ${id}`, error?.stack);
      throw error;
    }
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const docRef = this.getDocRef(id);
      const doc = await docRef.get();
      return doc.exists;
    } catch (error) {
      this.logger.error(`Error checking document existence: ${id}`, error?.stack);
      throw error;
    }
  }

  /**
   * Count entities
   */
  async count(options?: QueryOptions): Promise<number> {
    try {
      let query = this.collection;
      
      // Apply filters if provided but skip pagination
      if (options?.filters) {
        const { filters } = options;
        query = this.applyFilters(query, filters) as TypedCollectionReference<T>;
      }
      
      const snapshot = await query.count().get();
      return snapshot.data().count;
    } catch (error) {
      this.logger.error('Error counting documents', error?.stack);
      throw error;
    }
  }

  /**
   * Create multiple entities in batch
   */
  async createBatch(
    items: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<FirestoreBatchWriteResult> {
    try {
      const batch = this.firestore.batch();
      const now = Timestamp.now();
      const ids: string[] = [];
      
      // Add each item to the batch
      for (const item of items) {
        const docRef = this.collection.doc();
        ids.push(docRef.id);
        
        const docData = {
          ...item,
          createdAt: now,
          updatedAt: now
        };
        
        batch.create(docRef, docData as WithFieldValue<T>);
      }
      
      // Commit the batch
      await batch.commit();
      
      return {
        status: 'success',
        writtenCount: items.length,
        errorCount: 0
      };
    } catch (error) {
      this.logger.error('Error creating batch', error?.stack);
      return {
        status: 'error',
        writtenCount: 0,
        errorCount: items.length,
        errors: [error]
      };
    }
  }

  /**
   * Update multiple entities in batch
   */
  async updateBatch(
    items: Array<{
      id: string;
      data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
    }>
  ): Promise<FirestoreBatchWriteResult> {
    try {
      const batch = this.firestore.batch();
      const now = Timestamp.now();
      const errors: Error[] = [];
      let errorCount = 0;
      
      // Add each update to the batch
      for (const item of items) {
        try {
          const docRef = this.getDocRef(item.id);
          
          const updateData = {
            ...item.data,
            updatedAt: now
          };
          
          batch.update(docRef, updateData as any);
        } catch (error) {
          errors.push(error);
          errorCount++;
        }
      }
      
      // Commit the batch if there are updates
      if (items.length > errorCount) {
        await batch.commit();
      }
      
      return {
        status: errorCount === 0 ? 'success' : 'error',
        writtenCount: items.length - errorCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      this.logger.error('Error updating batch', error?.stack);
      return {
        status: 'error',
        writtenCount: 0,
        errorCount: items.length,
        errors: [error]
      };
    }
  }

  /**
   * Delete multiple entities in batch
   */
  async deleteBatch(ids: string[]): Promise<FirestoreBatchWriteResult> {
    try {
      const batch = this.firestore.batch();
      const errors: Error[] = [];
      let errorCount = 0;
      
      // Add each delete to the batch
      for (const id of ids) {
        try {
          const docRef = this.getDocRef(id);
          batch.delete(docRef);
        } catch (error) {
          errors.push(error);
          errorCount++;
        }
      }
      
      // Commit the batch if there are deletes
      if (ids.length > errorCount) {
        await batch.commit();
      }
      
      return {
        status: errorCount === 0 ? 'success' : 'error',
        writtenCount: ids.length - errorCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      this.logger.error('Error deleting batch', error?.stack);
      return {
        status: 'error',
        writtenCount: 0,
        errorCount: ids.length,
        errors: [error]
      };
    }
  }

  /**
   * Run operations in transaction
   */
  async runTransaction<R>(
    transactionFn: (context: TransactionContext<T>) => Promise<R>
  ): Promise<R> {
    this.logger.debug(`Starting transaction for collection: ${this.collectionName}`);

    try {
      return await this.firestore.runTransaction(async (transaction: Transaction) => {
        // Create context with entity-specific operations
        const context: TransactionContext<T> = {
          get: (id: string) => this.getInTransaction(transaction, id),
          create: (data) => this.createInTransaction(transaction, data),
          update: (id, data) => this.updateInTransaction(transaction, id, data),
          delete: (id) => this.deleteInTransaction(transaction, id)
        };

        // Execute the transaction function with the context
        return await transactionFn(context);
      });
    } catch (error) {
      this.logger.error(`Transaction failed for collection ${this.collectionName}`, error?.stack);
      throw error;
    }
  }

  /**
   * For backwards compatibility - alias for runTransaction
   */
  async withTransaction<R>(
    transactionFn: (context: TransactionContext<T>) => Promise<R>
  ): Promise<R> {
    return this.runTransaction(transactionFn);
  }

  /**
   * Apply query options to a query
   */
  protected applyQueryOptions(
    query: TypedCollectionReference<T> | Query<T>,
    options: QueryOptions
  ): Query<T> {
    let result = query;
    
    // Apply filters
    if (options.filters) {
      result = this.applyFilters(result, options.filters);
    }
    
    // Apply order
    if (options.orders) {
      result = this.applyOrders(result, options.orders);
    }
    
    // Apply pagination
    if (options.pagination) {
      const { limit, offset, startAfter } = options.pagination;
      
      if (limit) {
        result = result.limit(limit);
      }
      
      if (offset) {
        result = result.offset(offset);
      }
      
      if (startAfter) {
        const docRef = this.getDocRef(startAfter);
        result = result.startAfter(docRef);
      }
    }
    
    return result;
  }

  /**
   * Apply filters to a query
   */
  protected applyFilters(
    query: TypedCollectionReference<T> | Query<T>,
    filters: QueryFilter[]
  ): Query<T> {
    let result = query;
    
    for (const filter of filters) {
      const { field, operator, value } = filter;
      result = result.where(field, operator, value);
    }
    
    return result;
  }

  /**
   * Apply ordering to a query
   */
  protected applyOrders(
    query: TypedCollectionReference<T> | Query<T>,
    orders: QueryOrder[]
  ): Query<T> {
    let result = query;
    
    for (const order of orders) {
      const { field, direction } = order;
      result = result.orderBy(field, direction);
    }
    
    return result;
  }

  /**
   * Map Firestore document to entity
   */
  protected mapDocumentToEntity(doc: TypedDocumentSnapshot<T>): T {
    if (!doc.exists) {
      throw new Error(`Document does not exist: ${doc.id}`);
    }
    
    const data = doc.data();
    
    return {
      id: doc.id,
      ...data
    } as T;
  }

  // Transaction implementation methods

  /**
   * Get entity in transaction
   */
  private async getInTransaction(
    transaction: Transaction,
    id: string
  ): Promise<T | null> {
    const docRef = this.getDocRef(id);
    const doc = await transaction.get(docRef);

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data()
    } as T;
  }

  /**
   * Create entity in transaction
   */
  private async createInTransaction(
    transaction: Transaction,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const docRef = this.collection.doc();
    const now = Timestamp.now();

    const docData = {
      ...data,
      createdAt: now,
      updatedAt: now
    };

    transaction.create(docRef, docData as WithFieldValue<T>);
    return docRef.id;
  }

  /**
   * Update entity in transaction
   */
  private async updateInTransaction(
    transaction: Transaction,
    id: string,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const docRef = this.getDocRef(id);
    
    const docData = {
      ...data,
      updatedAt: Timestamp.now()
    };

    transaction.update(docRef, docData as any);
  }

  /**
   * Delete entity in transaction
   */
  private async deleteInTransaction(
    transaction: Transaction,
    id: string
  ): Promise<void> {
    const docRef = this.getDocRef(id);
    transaction.delete(docRef);
  }
}

/**
 * Tenant-aware repository implementation that extends the unified base
 */
@Injectable()
export abstract class UnifiedTenantRepository<T extends TenantEntity> extends UnifiedFirestoreRepository<T> {
  /**
   * Find entities by organization ID
   */
  async findByOrganizationId(
    organizationId: string, 
    options?: QueryOptions
  ): Promise<T[]> {
    try {
      const filter: QueryFilter = {
        field: 'organizationId',
        operator: '==',
        value: organizationId
      };
      
      const queryOptions: QueryOptions = {
        ...options,
        filters: [
          ...(options?.filters || []),
          filter
        ]
      };
      
      return this.find(queryOptions);
    } catch (error) {
      this.logger.error(`Error finding documents by organizationId: ${organizationId}`, error?.stack);
      throw error;
    }
  }

  /**
   * Count entities by organization ID
   */
  async countByOrganizationId(
    organizationId: string, 
    options?: QueryOptions
  ): Promise<number> {
    try {
      const filter: QueryFilter = {
        field: 'organizationId',
        operator: '==',
        value: organizationId
      };
      
      const queryOptions: QueryOptions = {
        ...options,
        filters: [
          ...(options?.filters || []),
          filter
        ]
      };
      
      return this.count(queryOptions);
    } catch (error) {
      this.logger.error(`Error counting documents by organizationId: ${organizationId}`, error?.stack);
      throw error;
    }
  }
}