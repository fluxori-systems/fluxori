# Fluxori GCP Implementation Guide

This guide provides detailed steps and code examples for implementing the migration from MongoDB to Firestore and Azure Blob Storage to Google Cloud Storage.

## Database Migration Implementation

### Step 1: Install Required Dependencies

```bash
# Add Firestore dependencies
npm install --save @google-cloud/firestore
```

### Step 2: Create Firestore Config Service

Create a configuration service for Firestore at `/backend/src/config/firestore.config.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Firestore } from '@google-cloud/firestore';

/**
 * Firestore Configuration Service
 * 
 * This service provides configuration and connection to Google Cloud Firestore.
 */
@Injectable()
export class FirestoreConfigService {
  private firestore: Firestore;
  
  constructor(private configService: ConfigService) {
    this.firestore = new Firestore({
      projectId: this.configService.get<string>('GCP_PROJECT_ID'),
      databaseId: this.configService.get<string>('FIRESTORE_DATABASE_ID', 'fluxori-db'),
    });
  }
  
  /**
   * Get the Firestore client instance
   */
  getFirestore(): Firestore {
    return this.firestore;
  }
  
  /**
   * Get a Firestore collection with the correct prefix
   * @param collectionName Base collection name
   * @returns Firestore collection reference
   */
  getCollection(collectionName: string) {
    const prefix = this.configService.get<string>('FIRESTORE_COLLECTION_PREFIX', '');
    const fullCollectionName = prefix ? `${prefix}_${collectionName}` : collectionName;
    
    return this.firestore.collection(fullCollectionName);
  }
  
  /**
   * Create a document reference
   * @param collectionName Collection name
   * @param documentId Document ID
   * @returns Firestore document reference
   */
  getDocument(collectionName: string, documentId: string) {
    return this.getCollection(collectionName).doc(documentId);
  }
}
```

### Step 3: Create Base Repository Implementation

Create a base repository for Firestore at `/backend/src/common/repositories/firestore-base.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { FirestoreConfigService } from '../../config/firestore.config';
import { Firestore, CollectionReference, DocumentReference, DocumentData, Query } from '@google-cloud/firestore';

/**
 * Base Repository for Firestore
 * 
 * This class provides common CRUD operations for Firestore collections.
 */
@Injectable()
export abstract class FirestoreBaseRepository<T extends { id?: string }> {
  protected readonly firestore: Firestore;
  protected abstract readonly collectionName: string;
  
  constructor(private firestoreConfigService: FirestoreConfigService) {
    this.firestore = firestoreConfigService.getFirestore();
  }
  
  /**
   * Get the collection reference
   */
  protected getCollectionRef(): CollectionReference {
    return this.firestoreConfigService.getCollection(this.collectionName);
  }
  
  /**
   * Get a document reference by ID
   * @param id Document ID
   */
  protected getDocRef(id: string): DocumentReference {
    return this.firestoreConfigService.getDocument(this.collectionName, id);
  }
  
  /**
   * Create a new document
   * @param data Document data
   * @returns Created document with ID
   */
  async create(data: Omit<T, 'id'>): Promise<T> {
    const docRef = this.getCollectionRef().doc();
    const id = docRef.id;
    
    // Add creation timestamp and ID
    const documentData = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await docRef.set(documentData);
    
    return documentData as T;
  }
  
  /**
   * Find document by ID
   * @param id Document ID
   * @returns Document or null if not found
   */
  async findById(id: string): Promise<T | null> {
    const docSnapshot = await this.getDocRef(id).get();
    
    if (!docSnapshot.exists) {
      return null;
    }
    
    return { id: docSnapshot.id, ...docSnapshot.data() } as T;
  }
  
  /**
   * Find all documents matching a filter
   * @param filter Filter object
   * @param options Query options
   * @returns Array of documents
   */
  async findAll(filter: Partial<T> = {}, options: { limit?: number, orderBy?: string, direction?: 'asc' | 'desc' } = {}): Promise<T[]> {
    let query: Query<DocumentData> = this.getCollectionRef();
    
    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      query = query.where(key, '==', value);
    });
    
    // Apply ordering
    if (options.orderBy) {
      query = query.orderBy(options.orderBy, options.direction || 'asc');
    }
    
    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }
  
  /**
   * Find one document matching a filter
   * @param filter Filter object
   * @returns Document or null if not found
   */
  async findOne(filter: Partial<T>): Promise<T | null> {
    const results = await this.findAll(filter, { limit: 1 });
    
    if (results.length === 0) {
      return null;
    }
    
    return results[0];
  }
  
  /**
   * Find documents with a custom query
   * @param queryFn Function to build the query
   * @returns Array of matching documents
   */
  async findWithQuery(queryFn: (collection: CollectionReference) => Query<DocumentData>): Promise<T[]> {
    const query = queryFn(this.getCollectionRef());
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }
  
  /**
   * Update a document
   * @param id Document ID
   * @param data Updated data
   * @returns Updated document
   */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    const docRef = this.getDocRef(id);
    const docSnapshot = await docRef.get();
    
    if (!docSnapshot.exists) {
      return null;
    }
    
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    
    await docRef.update(updateData);
    
    // Get the updated document
    const updatedSnapshot = await docRef.get();
    return { id, ...updatedSnapshot.data() } as T;
  }
  
  /**
   * Delete a document
   * @param id Document ID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const docRef = this.getDocRef(id);
    const docSnapshot = await docRef.get();
    
    if (!docSnapshot.exists) {
      return false;
    }
    
    await docRef.delete();
    return true;
  }
  
  /**
   * Count documents matching a filter
   * @param filter Filter object
   * @returns Count of matching documents
   */
  async count(filter: Partial<T> = {}): Promise<number> {
    let query: Query<DocumentData> = this.getCollectionRef();
    
    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      query = query.where(key, '==', value);
    });
    
    const snapshot = await query.count().get();
    return snapshot.data().count;
  }
  
  /**
   * Transaction support for Firestore
   * @param updateFunction Function to run within the transaction
   * @returns Result of the transaction function
   */
  async withTransaction<R>(updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<R>): Promise<R> {
    return this.firestore.runTransaction(updateFunction);
  }
  
  /**
   * Batch operations for Firestore
   * @param batchFunction Function that uses the batch
   */
  async withBatch(batchFunction: (batch: FirebaseFirestore.WriteBatch) => void): Promise<void> {
    const batch = this.firestore.batch();
    batchFunction(batch);
    await batch.commit();
  }
}
```

### Step 4: Update App Module

Update `/backend/src/app.module.ts` to register the Firestore configuration:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FirestoreConfigService } from './config/firestore.config';

// ... other imports

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      envFilePath: ['.env'],
    }),
    
    // ... other modules
  ],
  providers: [
    // ... other providers
    FirestoreConfigService,
  ],
  exports: [
    FirestoreConfigService,
  ],
})
export class AppModule {}
```

### Step 5: Example Repository Migration

Here's how to migrate the Product repository from MongoDB to Firestore:

#### Before (MongoDB):

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(product: Partial<Product>): Promise<Product> {
    const newProduct = new this.productModel(product);
    return newProduct.save();
  }

  async findById(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
  }

  async findAll(filter: any = {}): Promise<Product[]> {
    return this.productModel.find(filter).exec();
  }

  async update(id: string, product: Partial<Product>): Promise<Product | null> {
    return this.productModel.findByIdAndUpdate(id, product, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    return !!result;
  }
}
```

#### After (Firestore):

```typescript
import { Injectable } from '@nestjs/common';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { Product, ProductStatus } from '../models/product.model';

@Injectable()
export class ProductRepository extends FirestoreBaseRepository<Product> {
  protected readonly collectionName = 'products';

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService);
  }

  /**
   * Find products by organization ID
   * @param organizationId Organization ID
   * @returns Array of products
   */
  async findByOrganization(organizationId: string): Promise<Product[]> {
    return this.findAll({ organizationId });
  }

  /**
   * Find active products by organization ID
   * @param organizationId Organization ID
   * @returns Array of active products
   */
  async findActiveByOrganization(organizationId: string): Promise<Product[]> {
    return this.findAll({ 
      organizationId, 
      status: ProductStatus.ACTIVE 
    });
  }

  /**
   * Find product by SKU for an organization
   * @param sku Product SKU
   * @param organizationId Organization ID
   * @returns Product or null if not found
   */
  async findBySku(sku: string, organizationId: string): Promise<Product | null> {
    return this.findOne({ sku, organizationId });
  }

  /**
   * Find products by category
   * @param category Product category
   * @param organizationId Organization ID
   * @returns Array of products
   */
  async findByCategory(category: string, organizationId: string): Promise<Product[]> {
    return this.findAll({ category, organizationId });
  }
}
```

### Step 6: Model Conversion

Convert MongoDB schemas to Firestore models:

#### Before (MongoDB Schema):

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

/**
 * Product status in the system
 */
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
}

/**
 * Product schema definition
 */
@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Product {
  @Prop({ required: true, unique: true })
  sku: string;

  @Prop({ required: true, index: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  cost: number;

  @Prop({ default: 0 })
  weight: number;

  @Prop({ type: Object })
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };

  @Prop({ default: ProductStatus.ACTIVE, enum: ProductStatus })
  status: ProductStatus;

  @Prop()
  category?: string;

  @Prop()
  brand?: string;

  @Prop({ default: 0 })
  reorderPoint: number;

  @Prop({ default: 0 })
  reorderQuantity: number;

  @Prop([String])
  images?: string[];

  @Prop()
  barcode?: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: [String] })
  tags?: string[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
```

#### After (Firestore Model):

```typescript
/**
 * Product status in the system
 */
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
}

/**
 * Product dimensions type
 */
export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
}

/**
 * Product model for Firestore
 */
export interface Product {
  id?: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  weight: number;
  dimensions?: ProductDimensions;
  status: ProductStatus;
  category?: string;
  brand?: string;
  reorderPoint: number;
  reorderQuantity: number;
  images?: string[];
  barcode?: string;
  organizationId: string;
  metadata?: Record<string, any>;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
```

## Storage Migration Implementation

### Step 1: Install Required Dependencies

```bash
# Add Cloud Storage dependencies
npm install --save @google-cloud/storage
```

### Step 2: Create Storage Interface

Create a storage interface at `/backend/src/common/storage/storage.interface.ts`:

```typescript
/**
 * Storage Service Interface
 * 
 * Defines the interface for storage services (Azure Blob Storage or Google Cloud Storage)
 */
export interface StorageService {
  /**
   * Upload a file to storage
   * @param path Path within the container/bucket
   * @param content File content
   * @param contentType Content type of the file
   * @param containerName Container/bucket name (optional)
   * @returns URL of the uploaded file
   */
  uploadFile(
    path: string,
    content: Buffer | string,
    contentType?: string,
    containerName?: string
  ): Promise<string>;
  
  /**
   * Download a file from storage
   * @param path Path within the container/bucket
   * @param containerName Container/bucket name (optional)
   * @returns File content as Buffer
   */
  downloadFile(
    path: string,
    containerName?: string
  ): Promise<Buffer>;
  
  /**
   * Generate a signed URL for temporary access
   * @param path Path within the container/bucket
   * @param expiryMinutes Expiration time in minutes
   * @param containerName Container/bucket name (optional)
   * @returns Signed URL
   */
  generateSignedUrl(
    path: string,
    expiryMinutes?: number,
    containerName?: string
  ): Promise<string>;
  
  /**
   * Delete a file from storage
   * @param path Path within the container/bucket
   * @param containerName Container/bucket name (optional)
   */
  deleteFile(
    path: string,
    containerName?: string
  ): Promise<void>;
  
  /**
   * List files in storage
   * @param prefix Optional prefix to filter files
   * @param containerName Container/bucket name (optional)
   * @returns Array of file paths
   */
  listFiles(
    prefix?: string,
    containerName?: string
  ): Promise<string[]>;
}
```

### Step 3: Implement Google Cloud Storage Service

Create a Google Cloud Storage implementation at `/backend/src/common/storage/google-cloud-storage.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage, Bucket } from '@google-cloud/storage';
import { StorageService } from './storage.interface';
import { LoggerFactory } from '../utils/logger';

/**
 * Google Cloud Storage Service
 * 
 * This service provides functionality to interact with Google Cloud Storage.
 */
@Injectable()
export class GoogleCloudStorageService implements StorageService {
  private storage: Storage;
  private defaultBucket: string;
  private readonly logger = LoggerFactory.getLogger('GoogleCloudStorageService');
  
  constructor(private configService: ConfigService) {
    // Initialize Google Cloud Storage client
    this.storage = new Storage({
      projectId: this.configService.get<string>('GCP_PROJECT_ID'),
    });
    
    this.defaultBucket = this.configService.get<string>('GCP_STORAGE_BUCKET');
  }
  
  /**
   * Get a bucket instance
   * @param bucketName Bucket name (uses default if not specified)
   * @returns Bucket instance
   */
  private getBucket(bucketName?: string): Bucket {
    return this.storage.bucket(bucketName || this.defaultBucket);
  }
  
  /**
   * Upload a file to Cloud Storage
   * @param path File path within the bucket
   * @param content File content (Buffer or string)
   * @param contentType Content type of the file
   * @param bucketName Bucket name (uses default if not specified)
   * @returns Public URL of the uploaded file
   */
  async uploadFile(
    path: string,
    content: Buffer | string,
    contentType?: string,
    bucketName?: string
  ): Promise<string> {
    const bucket = this.getBucket(bucketName);
    const file = bucket.file(path);
    
    const options: any = {};
    if (contentType) {
      options.contentType = contentType;
    }
    
    try {
      await file.save(content, options);
      
      // Generate a public URL for the file
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;
      
      this.logger.debug(`File uploaded successfully to ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Error uploading file to ${path}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Download a file from Cloud Storage
   * @param path File path within the bucket
   * @param bucketName Bucket name (uses default if not specified)
   * @returns File content as Buffer
   */
  async downloadFile(path: string, bucketName?: string): Promise<Buffer> {
    const bucket = this.getBucket(bucketName);
    const file = bucket.file(path);
    
    try {
      const [fileContent] = await file.download();
      return fileContent;
    } catch (error) {
      this.logger.error(`Error downloading file ${path}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate a signed URL for temporary access to a file
   * @param path File path within the bucket
   * @param expiryMinutes Expiration time in minutes
   * @param bucketName Bucket name (uses default if not specified)
   * @returns Signed URL
   */
  async generateSignedUrl(
    path: string,
    expiryMinutes: number = 60,
    bucketName?: string
  ): Promise<string> {
    const bucket = this.getBucket(bucketName);
    const file = bucket.file(path);
    
    const options = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + (expiryMinutes * 60 * 1000)
    };
    
    try {
      const [url] = await file.getSignedUrl(options);
      return url;
    } catch (error) {
      this.logger.error(`Error generating signed URL for ${path}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete a file from Cloud Storage
   * @param path File path within the bucket
   * @param bucketName Bucket name (uses default if not specified)
   */
  async deleteFile(path: string, bucketName?: string): Promise<void> {
    const bucket = this.getBucket(bucketName);
    const file = bucket.file(path);
    
    try {
      await file.delete();
      this.logger.debug(`File ${path} deleted successfully`);
    } catch (error) {
      this.logger.error(`Error deleting file ${path}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * List files in a bucket with an optional prefix
   * @param prefix Optional prefix to filter files
   * @param bucketName Bucket name (uses default if not specified)
   * @returns Array of file paths
   */
  async listFiles(prefix?: string, bucketName?: string): Promise<string[]> {
    const bucket = this.getBucket(bucketName);
    
    const options: any = {};
    if (prefix) {
      options.prefix = prefix;
    }
    
    try {
      const [files] = await bucket.getFiles(options);
      return files.map(file => file.name);
    } catch (error) {
      this.logger.error(`Error listing files with prefix ${prefix}: ${error.message}`);
      throw error;
    }
  }
}
```

### Step 4: Update App Module

Update `/backend/src/app.module.ts` to use the new storage service:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FirestoreConfigService } from './config/firestore.config';
import { GoogleCloudStorageService } from './common/storage/google-cloud-storage.service';
import { StorageService } from './common/storage/storage.interface';

// ... other imports

@Module({
  imports: [
    // ... other imports
  ],
  providers: [
    // ... other providers
    FirestoreConfigService,
    {
      provide: StorageService,
      useClass: GoogleCloudStorageService,
    },
  ],
  exports: [
    FirestoreConfigService,
    StorageService,
  ],
})
export class AppModule {}
```

### Step 5: Example Usage in a Service

Here's an example of how to use the storage service in a product service:

```typescript
import { Injectable } from '@nestjs/common';
import { StorageService } from '../../common/storage/storage.interface';
import { ProductRepository } from '../repositories/product.repository';
import { Product } from '../models/product.model';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly storageService: StorageService,
  ) {}

  async createProduct(productData: Partial<Product>, productImage?: Buffer): Promise<Product> {
    // Create the product in the database
    const product = await this.productRepository.create(productData);

    // If an image was provided, upload it to storage
    if (productImage) {
      const imagePath = `products/${product.id}/${Date.now()}.jpg`;
      const imageUrl = await this.storageService.uploadFile(
        imagePath, 
        productImage, 
        'image/jpeg'
      );
      
      // Update the product with the image URL
      if (!product.images) {
        product.images = [];
      }
      
      product.images.push(imageUrl);
      await this.productRepository.update(product.id, { images: product.images });
    }

    return product;
  }

  async getProductImageSignedUrl(productId: string, imageIndex: number = 0): Promise<string | null> {
    const product = await this.productRepository.findById(productId);
    
    if (!product || !product.images || product.images.length <= imageIndex) {
      return null;
    }
    
    // Extract the path from the URL
    const imageUrl = product.images[imageIndex];
    const urlParts = imageUrl.split('/');
    const bucketName = urlParts[2].split('.')[0]; // Extract bucket name from storage.googleapis.com
    const path = urlParts.slice(3).join('/'); // Extract path after bucket name
    
    // Generate a signed URL for the image
    return this.storageService.generateSignedUrl(path, 60, bucketName);
  }
}
```

## Data Migration Scripts

### MongoDB to Firestore Migration Script

Create a migration script at `/scripts/migrate-db/mongo-to-firestore.js`:

```javascript
const { MongoClient } = require('mongodb');
const { Firestore } = require('@google-cloud/firestore');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB connection settings
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = 'fluxori';

// Firestore settings
const PROJECT_ID = process.env.GCP_PROJECT_ID;
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'fluxori-db';

// Collection to migrate
const collections = [
  'users',
  'organizations',
  'products',
  'warehouses',
  'stockLevels',
  'orders',
  'marketplaceCredentials',
  'buyboxStatuses',
  'buyboxHistories',
  'repricingRules',
  'insights',
  'aiModelConfigs',
  'notifications',
  'notificationSettings',
  'internationalShipments',
  'hsCodes',
  'tradeRestrictions',
  'complianceRequirements',
  'documents',
  'embeddingProviders',
];

async function migrateCollection(mongoDb, firestore, collectionName) {
  console.log(`Migrating collection: ${collectionName}`);
  
  // Get MongoDB collection
  const mongoCollection = mongoDb.collection(collectionName);
  
  // Get all documents
  const documents = await mongoCollection.find({}).toArray();
  console.log(`Found ${documents.length} documents in ${collectionName}`);
  
  // Get Firestore collection
  const firestoreCollection = firestore.collection(collectionName);
  
  // Process documents in batches of 500
  const batchSize = 500;
  const batches = Math.ceil(documents.length / batchSize);
  
  for (let i = 0; i < batches; i++) {
    console.log(`Processing batch ${i+1}/${batches} for ${collectionName}`);
    const batch = firestore.batch();
    
    const start = i * batchSize;
    const end = Math.min(start + batchSize, documents.length);
    
    for (let j = start; j < end; j++) {
      const doc = documents[j];
      
      // Convert MongoDB _id to Firestore id
      const id = doc._id.toString();
      delete doc._id;
      
      // Convert MongoDB specific fields if needed
      if (doc.__v !== undefined) {
        delete doc.__v;
      }
      
      // Convert MongoDB ObjectId references to strings
      for (const key in doc) {
        if (doc[key] && typeof doc[key] === 'object' && doc[key]._bsontype === 'ObjectID') {
          doc[key] = doc[key].toString();
        }
      }
      
      // Add document to batch
      const docRef = firestoreCollection.doc(id);
      batch.set(docRef, {
        ...doc,
        id, // Add the id field
      });
    }
    
    // Commit the batch
    await batch.commit();
    console.log(`Committed batch ${i+1}/${batches} for ${collectionName}`);
  }
  
  console.log(`Migration complete for collection: ${collectionName}`);
}

async function migrateData() {
  console.log('Starting migration from MongoDB to Firestore');
  
  // Connect to MongoDB
  const mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  console.log('Connected to MongoDB');
  
  const mongoDb = mongoClient.db(MONGODB_DB_NAME);
  
  // Initialize Firestore
  const firestore = new Firestore({
    projectId: PROJECT_ID,
    databaseId: FIRESTORE_DATABASE_ID,
  });
  console.log('Connected to Firestore');
  
  // Migrate each collection
  for (const collection of collections) {
    await migrateCollection(mongoDb, firestore, collection);
  }
  
  // Close MongoDB connection
  await mongoClient.close();
  console.log('Migration completed successfully');
}

// Run migration
migrateData().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
```

### Azure Blob Storage to Google Cloud Storage Migration Script

Create a migration script at `/scripts/migrate-storage/azure-to-gcs.js`:

```javascript
const { BlobServiceClient } = require('@azure/storage-blob');
const { Storage } = require('@google-cloud/storage');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Load environment variables
dotenv.config();

// Azure Blob Storage settings
const AZURE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING;
const AZURE_CONTAINERS = ['files', 'documents', 'backups']; // Containers to migrate

// Google Cloud Storage settings
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const GCS_BUCKETS = {
  'files': `${GCP_PROJECT_ID}-files`,
  'documents': `${GCP_PROJECT_ID}-documents`,
  'backups': `${GCP_PROJECT_ID}-backups`,
};

// Temporary directory for downloads
const TEMP_DIR = path.join(os.tmpdir(), 'fluxori-migration');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

async function migrateContainer(container, azureClient, gcsClient) {
  console.log(`Migrating container: ${container}`);
  
  // Get Azure container client
  const containerClient = azureClient.getContainerClient(container);
  
  // Get GCS bucket
  const bucketName = GCS_BUCKETS[container];
  const bucket = gcsClient.bucket(bucketName);
  
  // Create bucket if it doesn't exist
  try {
    await bucket.create();
    console.log(`Created GCS bucket: ${bucketName}`);
  } catch (error) {
    // Ignore error if bucket already exists
    if (error.code !== 409) {
      throw error;
    }
  }
  
  // List all blobs in container
  const blobsIterator = containerClient.listBlobsFlat();
  let blobItem;
  
  let count = 0;
  
  // Iterate through all blobs
  for await (blobItem of blobsIterator) {
    count++;
    console.log(`Migrating blob ${count}: ${blobItem.name}`);
    
    // Download blob to temp file
    const blobClient = containerClient.getBlobClient(blobItem.name);
    const tempFilePath = path.join(TEMP_DIR, path.basename(blobItem.name));
    
    // Create directory structure if needed
    const tempDirPath = path.dirname(tempFilePath);
    if (!fs.existsSync(tempDirPath)) {
      fs.mkdirSync(tempDirPath, { recursive: true });
    }
    
    // Download the blob
    await blobClient.downloadToFile(tempFilePath);
    
    // Upload to GCS
    try {
      await bucket.upload(tempFilePath, {
        destination: blobItem.name,
        metadata: {
          contentType: blobItem.properties.contentType,
        },
      });
      
      console.log(`Uploaded ${blobItem.name} to GCS bucket ${bucketName}`);
    } catch (error) {
      console.error(`Error uploading ${blobItem.name} to GCS:`, error);
    }
    
    // Delete temp file
    fs.unlinkSync(tempFilePath);
  }
  
  console.log(`Migrated ${count} blobs from ${container} to ${bucketName}`);
}

async function migrateStorage() {
  console.log('Starting migration from Azure Blob Storage to Google Cloud Storage');
  
  // Initialize Azure Blob Storage client
  const azureClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
  console.log('Connected to Azure Blob Storage');
  
  // Initialize Google Cloud Storage client
  const gcsClient = new Storage({
    projectId: GCP_PROJECT_ID,
  });
  console.log('Connected to Google Cloud Storage');
  
  // Migrate each container
  for (const container of AZURE_CONTAINERS) {
    await migrateContainer(container, azureClient, gcsClient);
  }
  
  console.log('Storage migration completed successfully');
}

// Run migration
migrateStorage().catch(error => {
  console.error('Storage migration failed:', error);
  process.exit(1);
});
```

## Environment Variables

Create a GCP environment variables template:

```properties
# Application Settings
NODE_ENV=production
PORT=3001
API_PREFIX=api
HOST=0.0.0.0
CORS_ORIGIN=*
SWAGGER_ENABLED=true

# GCP Project Settings
GCP_PROJECT_ID=fluxori-prod
GCP_REGION=africa-south1
GCP_LOCATION=africa-south1

# Firestore Database Settings
FIRESTORE_DATABASE_ID=fluxori-db
FIRESTORE_COLLECTION_PREFIX=

# Cloud Storage Settings
GCP_STORAGE_BUCKET=fluxori-prod-files
GCP_STORAGE_BUCKET_DOCUMENTS=fluxori-prod-documents

# Auth Settings
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRATION=86400

# Vertex AI Settings
GCP_VECTOR_SEARCH_INDEX_ENDPOINT=vector-search-endpoint
GCP_VECTOR_SEARCH_INDEX_ID=vector-search-index
GCP_VECTOR_SEARCH_DEPLOYED_INDEX_ID=deployed-vector-search-index
GCP_EMBEDDING_MODEL_NAME=textembedding-gecko@003
GCP_GENAI_REGION=europe-west4

# Credit System
CREDIT_FEATURESTORE_ID=fluxori-prod-credit-featurestore
CREDIT_ENTITY_TYPE=user_credits
ENABLE_CREDIT_TRACKING=true

# Logging
LOG_LEVEL=info

# Monitoring
ENABLE_MONITORING=true
```

## Testing the Migration

1. **Unit Tests**: Create tests for the new Firestore repositories
2. **Integration Tests**: Test the interaction between services and Firestore
3. **End-to-End Tests**: Test the entire application with the GCP infrastructure

### Example Test for Firestore Repository

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProductRepository } from './product.repository';
import { FirestoreConfigService } from '../../config/firestore.config';
import { ConfigService } from '@nestjs/config';
import { Product, ProductStatus } from '../models/product.model';

describe('ProductRepository', () => {
  let repository: ProductRepository;
  let firestoreConfigService: FirestoreConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductRepository,
        {
          provide: FirestoreConfigService,
          useValue: {
            getCollection: jest.fn(),
            getDocument: jest.fn(),
            getFirestore: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<ProductRepository>(ProductRepository);
    firestoreConfigService = module.get<FirestoreConfigService>(FirestoreConfigService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  // Add more tests here
});
```

## Conclusion

This implementation guide provides a comprehensive approach to migrating the Fluxori platform from MongoDB and Azure Blob Storage to Google Cloud Platform services. By following the steps outlined in this guide, you can successfully implement the migration and take advantage of GCP's features optimized for South African users.

The migration approach preserves the existing application architecture while replacing the underlying infrastructure with GCP services. This minimizes the risk of migration and ensures a smooth transition for users.