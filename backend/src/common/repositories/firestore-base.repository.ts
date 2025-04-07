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
  FieldValue
} from '@google-cloud/firestore';

import { FirestoreConfigService } from '../../config/firestore.config';
import { 
  FirestoreEntity,
  TypedCollectionReference,
  TypedDocumentReference,
  TypedDocumentSnapshot,
  FirestoreBatchWriteResult
} from '../../types/google-cloud.types';

// Import modular components
import {
  RepositoryCache,
  RepositoryValidation,
  RepositoryTransactions,
  RepositoryMonitor,
  FirestoreConverter,
  FirestoreQueryOptions,
  FirestoreAdvancedFilter,
  RepositoryStats,
  CreateDocumentOptions,
  FindByIdOptions,
  UpdateDocumentOptions,
  DeleteDocumentOptions,
  RestoreDocumentOptions,
  TTLCleanupOptions,
  BatchDeleteOptions,
  FieldTransformOptions,
  CountDocumentsOptions,
  TransactionExecutionOptions,
  PaginationResult
} from './base';

/**
 * Base Repository for Firestore
 * 
 * This class provides common CRUD operations for Firestore collections
 * using a modular approach with specialized components for different concerns.
 * 
 * @template T The entity type that extends FirestoreEntity
 */
@Injectable()
export abstract class FirestoreBaseRepository<T extends FirestoreEntity> {
  // Logger for this repository
  protected readonly logger: Logger;
  
  // Required abstract property - must be set in derived classes
  protected abstract readonly collectionName: string;
  
  // Firestore collection reference with proper typing
  protected _collection!: TypedCollectionReference<T>;
  protected get collection(): TypedCollectionReference<T> {
    return this._collection;
  }
  
  // Converter for type-safe conversions between app models and Firestore
  protected readonly converter: FirestoreConverter<T>;
  
  // Configuration properties
  protected readonly defaultTTLField: string = 'ttl';
  protected readonly defaultTTLDays: number = 30;
  protected readonly useSoftDeletes: boolean = true;
  protected readonly useVersioning: boolean = true;
  protected readonly useMetadata: boolean = true;
  protected readonly maxRetries: number = 5;
  protected readonly defaultTimeout: number = 60000;
  protected readonly requiredFields: Array<keyof T> = [];
  protected readonly cacheTTLMs: number = 0;
  
  // Component instances for different concerns
  private readonly cache: RepositoryCache<T>;
  private readonly validation: RepositoryValidation;
  private readonly transactions: RepositoryTransactions;
  private readonly monitor: RepositoryMonitor;
  
  /**
   * Create a new repository instance
   * @param firestoreConfigService Firestore configuration service
   * @param options Repository configuration options
   */
  constructor(
    protected readonly firestoreConfigService: FirestoreConfigService,
    options?: {
      useSoftDeletes?: boolean;
      useVersioning?: boolean;
      useMetadata?: boolean;
      defaultTTLDays?: number;
      defaultTTLField?: string;
      enableCache?: boolean;
      cacheTTLMs?: number;
      maxCacheItems?: number;
      requiredFields?: Array<keyof T>;
    }
  ) {
    // Set up logger
    this.logger = new Logger(this.constructor.name);
    
    // Apply configuration options
    if (options) {
      if (options.useSoftDeletes !== undefined) this.useSoftDeletes = options.useSoftDeletes;
      if (options.useVersioning !== undefined) this.useVersioning = options.useVersioning;
      if (options.useMetadata !== undefined) this.useMetadata = options.useMetadata;
      if (options.defaultTTLDays) this.defaultTTLDays = options.defaultTTLDays;
      if (options.defaultTTLField) this.defaultTTLField = options.defaultTTLField;
      if (options.cacheTTLMs !== undefined) this.cacheTTLMs = options.cacheTTLMs;
      if (options.requiredFields) this.requiredFields = options.requiredFields;
    }
    
    // Get the firestore instance
    const firestore = firestoreConfigService.getFirestore();
    
    // Create a default converter
    this.converter = new FirestoreConverter<T>();
    
    // We need to defer collection initialization until after the constructor
    // Initialize collection in the onModuleInit lifecycle hook instead
    
    // Initialize components without collectionName access
    // This avoids the TS2715 abstract property access in constructor error
    this.validation = new RepositoryValidation(
      '', // Will be set in initializeRepository
      this.requiredFields as string[],
      this.logger
    );
    
    this.cache = new RepositoryCache<T>(
      '', // Will be set in initializeRepository
      {
        enabled: options?.enableCache || options?.cacheTTLMs ? true : false,
        ttlMs: options?.cacheTTLMs || this.cacheTTLMs,
        maxItems: options?.maxCacheItems || 1000,
        logger: this.logger
      }
    );
    
    this.transactions = new RepositoryTransactions(
      firestore,
      '', // Will be set in initializeRepository
      this.logger
    );
    
    this.monitor = new RepositoryMonitor(''); // Will be set in initializeRepository
  }
  
  /**
   * Initialize repository components after construction
   * This should be called in the onModuleInit lifecycle hook of derived classes
   */
  protected initializeRepository(): void {
    // Now we can safely access the abstract collectionName
    const collectionName = this.collectionName;
    
    // Update components with the collection name
    (this.validation as any).collectionName = collectionName;
    (this.cache as any).collectionName = collectionName;
    (this.transactions as any).collectionName = collectionName;
    (this.monitor as any).collectionName = collectionName;
    
    // Initialize collection
    this._collection = this.getTypedCollectionWithConverter();
    
    this.logger.log(`Repository initialized for collection: ${collectionName}`);
  }
  
  /**
   * Get repository statistics for monitoring
   * @returns Repository statistics
   */
  getStats(): RepositoryStats {
    return this.monitor.getStats();
  }
  
  /**
   * Reset repository statistics
   */
  resetStats(): void {
    this.monitor.resetStats();
    this.cache.resetStats();
  }
  
  /**
   * Clear the repository cache
   * @returns Number of entries cleared
   */
  clearCache(): number {
    return this.cache.clear();
  }
  
  /**
   * Get the collection reference with proper typing
   */
  protected getCollectionRef(): TypedCollectionReference<T> {
    return this.firestoreConfigService.getCollection<T>(this.collectionName);
  }
  
  /**
   * Get a typed collection reference with converter
   */
  protected getTypedCollectionWithConverter(): TypedCollectionReference<T> {
    return this.getCollectionRef();
  }
  
  /**
   * Get a document reference by ID with proper typing
   * @param id Document ID
   */
  protected getDocRef(id: string): DocumentReference<T> {
    // Validate ID before creating document reference
    this.validation.validateDocumentId(id);
    return this.firestoreConfigService.getDocument<T>(this.collectionName, id);
  }
  
  /**
   * Get a typed document reference with converter
   * @param id Document ID
   */
  protected getTypedDocRef(id: string): DocumentReference<T> {
    return this.getDocRef(id);
  }
  
  /**
   * Create a new document with improved metadata and caching support
   * @param data Document data
   * @param options Additional creation options
   * @returns Created document with ID
   * @throws Error if data is invalid or creation fails
   */
  async create(
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
    options: CreateDocumentOptions = {}
  ): Promise<T> {
    try {
      // Validate data before saving
      this.validation.validateData(data);
      
      // Validate required fields if requested
      if (options.validateFields) {
        this.validation.validateRequiredFields({...data});
      }
      
      // Generate or use custom document ID
      let docRef;
      if (options.useCustomId) {
        // Validate custom ID
        this.validation.validateDocumentId(options.useCustomId);
        
        // Check if document already exists
        const existingDoc = await this.exists(options.useCustomId);
        if (existingDoc) {
          throw new Error(`Document with ID ${options.useCustomId} already exists in collection "${this.collectionName}"`);
        }
        
        docRef = this.getTypedCollectionWithConverter().doc(options.useCustomId);
      } else {
        // Auto-generate ID
        docRef = this.getTypedCollectionWithConverter().doc();
      }
      
      const id = docRef.id;
      
      // Prepare base document data
      const documentData: Record<string, any> = {
        ...data,
        id,
      };
      
      // Add timestamps (server or client)
      if (options.useServerTimestamp) {
        documentData.createdAt = FieldValue.serverTimestamp();
        documentData.updatedAt = FieldValue.serverTimestamp();
      } else {
        documentData.createdAt = new Date();
        documentData.updatedAt = new Date();
      }
      
      // Add versioning if enabled
      if (this.useVersioning) {
        documentData.version = options.initialVersion !== undefined ? options.initialVersion : 1;
      }
      
      // Add TTL if specified
      if (options.ttl) {
        const ttlDate = new Date();
        ttlDate.setDate(ttlDate.getDate() + options.ttl);
        documentData[this.defaultTTLField] = ttlDate;
      }
      
      // Add custom metadata if provided
      if (options.customMetadata) {
        // Ensure we don't override core fields
        const safeMetadata = {...options.customMetadata};
        delete safeMetadata.id;
        delete safeMetadata.createdAt;
        delete safeMetadata.updatedAt;
        delete safeMetadata.version;
        
        Object.assign(documentData, safeMetadata);
      }
      
      // Set the document in Firestore
      await docRef.set(documentData as T);
      
      // Track write operation
      this.monitor.trackWrite();
      
      // Get the document to ensure we have all fields properly converted
      const docSnapshot = await docRef.get();
      const createdDoc = docSnapshot.data() as T;
      
      // Add to cache if enabled and requested
      if (options.addToCache) {
        this.cache.set(id, createdDoc);
      }
      
      return createdDoc;
    } catch (error) {
      // Add context to error for better debugging
      const enhancedError = new Error(
        `Failed to create document in collection "${this.collectionName}": ${error instanceof Error ? error.message : String(error)}`
      );
      if (error instanceof Error) {
        enhancedError.stack = error.stack;
      }
      this.logger.error(`Create document error: ${enhancedError.message}`, enhancedError.stack);
      this.monitor.trackError(enhancedError);
      throw enhancedError;
    }
  }
  
  /**
   * Find document by ID with validation and error handling
   * @param id Document ID
   * @param options Additional query options
   * @returns Document or null if not found
   * @throws Enhanced error with context information
   */
  async findById(
    id: string, 
    options: FindByIdOptions = {}
  ): Promise<T | null> {
    try {
      // Check cache first if enabled and not bypassed
      if (!options.bypassCache) {
        const cachedDoc = this.cache.get(id);
        
        if (cachedDoc) {
          // Track cache hit
          this.monitor.trackCacheHit();
          
          // Check for soft deleted unless explicitly included
          if (cachedDoc.isDeleted && !options.includeDeleted) {
            return null;
          }
          
          return cachedDoc;
        }
      }
      
      // Cache miss - need to query Firestore
      this.monitor.trackCacheMiss();
      
      // Track read operation
      this.monitor.trackRead();
      
      // Will validate the ID before getting document
      const docRef = this.getDocRef(id);
      const docSnapshot = await docRef.get();
      
      if (!docSnapshot.exists) {
        if (options.throwIfNotFound) {
          throw new Error(`Document with ID "${id}" not found in collection "${this.collectionName}"`);
        }
        return null;
      }
      
      // Get converted data
      const data = docSnapshot.data();
      
      if (!data) {
        return null;
      }
      
      // Check for soft deleted documents unless explicitly included
      if (data.isDeleted && !options.includeDeleted) {
        if (options.throwIfNotFound) {
          throw new Error(`Document with ID "${id}" exists but is soft-deleted in collection "${this.collectionName}"`);
        }
        return null;
      }
      
      // Store in cache
      this.cache.set(id, data);
      
      return data;
    } catch (error) {
      // Add context to error for better debugging
      if (error instanceof Error && error.message.includes('not found')) {
        // This is already our custom error for document not found
        throw error;
      }
      
      const enhancedError = new Error(
        `Error fetching document ${id} from collection "${this.collectionName}": ${error instanceof Error ? error.message : String(error)}`
      );
      if (error instanceof Error) {
        enhancedError.stack = error.stack;
      }
      this.logger.error(`Find document error: ${enhancedError.message}`, enhancedError.stack);
      this.monitor.trackError(enhancedError);
      throw enhancedError;
    }
  }
  
  /**
   * Find all documents matching a filter
   * @param filter Simple equality filter object
   * @param options Query options
   * @returns Array of documents
   */
  async findAll(filter: Partial<T> = {}, options: FirestoreQueryOptions<T> = {}): Promise<T[]> {
    try {
      // Start with a typed collection reference
      const collectionRef = this.getCollectionRef();
      
      // Build the query with explicit types
      type QueryT = typeof collectionRef extends { where: any } ? ReturnType<typeof collectionRef.where> : never;
      let query: QueryT = collectionRef as unknown as QueryT;
      
      // Apply filters with explicit type casting
      Object.entries(filter).forEach(([key, value]) => {
        query = (query as any).where(key, '==', value);
      });
      
      // Apply ordering
      if (options.orderBy) {
        query = (query as any).orderBy(options.orderBy as string, options.direction || 'asc');
      }
      
      // Apply pagination options
      if (options.offset) {
        query = (query as any).offset(options.offset);
      }
      
      if (options.startAfter) {
        query = (query as any).startAfter(options.startAfter);
      }
      
      if (options.endBefore) {
        query = (query as any).endBefore(options.endBefore);
      }
      
      // Apply field selection
      if (options.select && options.select.length > 0) {
        query = (query as any).select(...options.select as string[]);
      }
      
      // Apply limit
      if (options.limit) {
        query = (query as any).limit(options.limit);
      }
      
      // Track read operation
      this.monitor.trackRead();
      
      // Execute the query with explicit typing for returned data
      const snapshot = await (query as any).get();
      
      // Convert snapshot data to properly typed entities
      return snapshot.docs.map((doc: any) => doc.data() as T);
    } catch (error) {
      const enhancedError = new Error(
        `Error finding documents in collection "${this.collectionName}": ${error instanceof Error ? error.message : String(error)}`
      );
      if (error instanceof Error) {
        enhancedError.stack = error.stack;
      }
      this.logger.error(`Find all documents error: ${enhancedError.message}`, enhancedError.stack);
      this.monitor.trackError(enhancedError);
      throw enhancedError;
    }
  }
  
  /**
   * Update a document
   * @param id Document ID
   * @param data Updated data
   * @param options Update options (optimistic concurrency, etc.)
   * @returns Updated document
   * @throws Error if data is invalid or optimistic concurrency check fails
   */
  async update(
    id: string, 
    data: Partial<Omit<T, 'id' | 'createdAt'>>,
    options: UpdateDocumentOptions = {}
  ): Promise<T | null> {
    try {
      // Validate data before updating
      this.validation.validateData(data);
      
      // Validate required fields if requested
      if (options.validateFields) {
        this.validation.validateRequiredFields({...data});
      }
      
      // Invalidate cache if requested
      if (options.invalidateCache) {
        this.cache.delete(id);
      }
      
      // Use typed doc reference with converter
      const docRef = this.getTypedDocRef(id);
      const docSnapshot = await docRef.get();
      
      if (!docSnapshot.exists) {
        return null;
      }
      
      // Get current document data
      const currentDoc = docSnapshot.data() as T;
      
      // Check if document is soft-deleted unless bypass is specified
      if (currentDoc.isDeleted && !options.bypassSoftDeleteCheck) {
        throw new Error(`Cannot update soft-deleted document ${id} in collection "${this.collectionName}"`);
      }
      
      // Clean up data if requested
      let cleanData = {...data};
      if (options.sanitizeData) {
        // Remove any undefined values
        cleanData = Object.entries(cleanData)
          .filter(([_, value]) => value !== undefined)
          .reduce((obj, [key, value]) => ({...obj, [key]: value}), {});
      }
      
      // Prepare update data
      const updateData: Record<string, any> = {
        ...cleanData,
        updatedAt: new Date(),
      };
      
      // Increment version if requested and versioning is enabled
      if (options.incrementVersion && this.useVersioning) {
        const currentVersion = typeof currentDoc.version === 'number' ? currentDoc.version : 0;
        updateData.version = currentVersion + 1;
      }
      
      // Track write operation
      this.monitor.trackWrite();
      
      // No need for type casting with the converter
      await docRef.update(updateData);
      
      // Invalidate cache after successful update
      this.cache.delete(id);
      
      // Get the updated document
      const updatedSnapshot = await docRef.get();
      // Converter will handle the conversion
      return updatedSnapshot.data() as T;
    } catch (error) {
      // Check for concurrency conflicts
      if (this.transactions.isConcurrencyConflictError(error)) {
        this.logger.warn(`Concurrency conflict detected on document ${id} in ${this.collectionName}: ${error}`);
        // Rethrow with clearer message
        throw new Error(`Concurrency conflict: The document was modified by another process. Please retry with latest data.`);
      }
      
      // Add context to error for better debugging
      const enhancedError = new Error(
        `Failed to update document ${id} in collection "${this.collectionName}": ${error instanceof Error ? error.message : String(error)}`
      );
      if (error instanceof Error) {
        enhancedError.stack = error.stack;
      }
      this.logger.error(`Update document error: ${enhancedError.message}`, enhancedError.stack);
      this.monitor.trackError(enhancedError);
      throw enhancedError;
    }
  }
  
  /**
   * Delete a document with enhanced options
   * @param id Document ID
   * @param options Additional delete options
   * @returns True if deleted, false if not found
   * @throws Error if deletion fails or document is already soft-deleted
   */
  async delete(
    id: string, 
    options: DeleteDocumentOptions = {}
  ): Promise<boolean | T> {
    try {
      // Validate the ID
      this.validation.validateDocumentId(id);
      
      // Use typed doc reference with converter
      const docRef = this.getTypedDocRef(id);
      const docSnapshot = await docRef.get();
      
      // Keep snapshot if requested
      const snapshotData = options.snapshotBeforeDelete ? docSnapshot.data() : null;
      
      // If document doesn't exist, return early
      if (!docSnapshot.exists) {
        return false;
      }
      
      // Clear from cache if requested
      if (options.clearCache) {
        this.cache.delete(id);
      }
      
      // Get current data to check for soft deletion
      const currentData = docSnapshot.data();
      
      if (!currentData) {
        return false;
      }
      
      // Check if already soft-deleted
      if (currentData.isDeleted && !options.force) {
        throw new Error(`Document ${id} in collection "${this.collectionName}" is already soft-deleted`);
      }
      
      // Check if soft delete is requested and repository supports it
      const useSoftDelete = options.softDelete !== undefined ? options.softDelete : this.useSoftDeletes;
      
      // Track write operation
      this.monitor.trackWrite();
      
      if (useSoftDelete) {
        // Mark as deleted instead of actually deleting
        await docRef.update({
          deletedAt: new Date(),
          updatedAt: new Date(),
          isDeleted: true,
          // Increment version if versioning is enabled
          ...(this.useVersioning && typeof currentData.version === 'number' 
              ? { version: currentData.version + 1 } 
              : {})
        });
      } else {
        // Hard delete
        await docRef.delete();
      }
      
      // Return snapshot if requested, otherwise true
      return options.snapshotBeforeDelete ? snapshotData as T : true;
    } catch (error) {
      // Add context to error for better debugging
      const enhancedError = new Error(
        `Error deleting document ${id} from collection "${this.collectionName}": ${error instanceof Error ? error.message : String(error)}`
      );
      if (error instanceof Error) {
        enhancedError.stack = error.stack;
      }
      this.logger.error(`Delete document error: ${enhancedError.message}`, enhancedError.stack);
      this.monitor.trackError(enhancedError);
      throw enhancedError;
    }
  }
  
  /**
   * Check if a document exists with proper error handling
   * @param id Document ID
   * @param options Additional query options
   * @returns True if exists, false if not
   * @throws Error if ID is invalid
   */
  async exists(
    id: string,
    options: {
      validateId?: boolean;     // Whether to validate the document ID
      includeDeleted?: boolean; // Whether to include soft-deleted documents
    } = {}
  ): Promise<boolean> {
    try {
      // Validate ID if requested
      if (options.validateId) {
        this.validation.validateDocumentId(id);
      }
      
      // Check cache first if cache is enabled
      const cachedDoc = this.cache.get(id);
      if (cachedDoc) {
        // If cache hit, check for soft deleted unless explicitly included
        this.monitor.trackCacheHit();
        if (!options.includeDeleted && cachedDoc.isDeleted) {
          return false;
        }
        return true;
      }
      
      // Cache miss or disabled, check database
      this.monitor.trackCacheMiss();
      this.monitor.trackRead();
      
      const docRef = this.getDocRef(id);
      const docSnapshot = await docRef.get();
      
      // Basic existence check
      if (!docSnapshot.exists) {
        return false;
      }
      
      // Check for soft-deleted documents if not including them
      if (!options.includeDeleted) {
        const data = docSnapshot.data();
        if (data && data.isDeleted === true) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      // Add context to error for better debugging
      if (error instanceof Error && error.message.includes('Document ID')) {
        // This is already our validation error, so rethrow it
        throw error;
      }
      
      const enhancedError = new Error(
        `Error checking if document ${id} exists in collection "${this.collectionName}": ${error instanceof Error ? error.message : String(error)}`
      );
      if (error instanceof Error) {
        enhancedError.stack = error.stack;
      }
      this.logger.error(`Exists check error: ${enhancedError.message}`, enhancedError.stack);
      this.monitor.trackError(enhancedError);
      throw enhancedError;
    }
  }
  
  /**
   * Transaction support for Firestore with improved error handling and retry logic
   * @param updateFunction Function to run within the transaction
   * @param options Transaction options including maxAttempts, readOnly, retry delay, and timeout
   * @returns Result of the transaction function
   * @throws Enhanced error with context or timeout error
   */
  async withTransaction<R>(
    updateFunction: (transaction: Transaction) => Promise<R>,
    options?: TransactionExecutionOptions
  ): Promise<R> {
    return this.transactions.withTransaction(updateFunction, options);
  }
  
  /**
   * Batch operations for Firestore with improved error handling
   * @param batchFunction Function that uses the batch
   * @returns Batch write result with success/failure information
   */
  async withBatch(batchFunction: (batch: WriteBatch) => void): Promise<FirestoreBatchWriteResult> {
    return this.transactions.withBatch(batchFunction);
  }
}