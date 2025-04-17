/**
 * Repository Types Fix Script
 * 
 * This script fixes TypeScript type issues in the repository pattern implementation.
 * It updates interfaces to provide proper typing for repositories.
 */

import * as fs from 'fs';
import * as path from 'path';

// Paths to files we need to update
const REPO_BASE_PATH = path.join(process.cwd(), 'backend/src/common/repositories');
const REPO_TYPES_PATH = path.join(REPO_BASE_PATH, 'base/repository-types.ts');
const FIRESTORE_BASE_REPO_PATH = path.join(REPO_BASE_PATH, 'firestore-base.repository.ts');
const GOOGLE_CLOUD_TYPES_PATH = path.join(process.cwd(), 'backend/src/types/google-cloud.types.ts');

// Function to update repository types with proper type parameters
function updateRepositoryTypes() {
  console.log('Updating repository types...');
  
  // Read the current file content
  const content = fs.readFileSync(REPO_TYPES_PATH, 'utf8');
  
  // Replace the Repository interface with a properly typed version
  const updatedContent = content.replace(
    /export interface Repository<T>[\s\S]*?count\(options\?: any\): Promise<number>;[\s\S]*?}/,
    `export interface BaseEntity {
  id: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  organizationId?: string;
  deleted?: boolean;
  version?: number;
}

/**
 * Base repository interface that defines common operations
 */
export interface Repository<T extends BaseEntity, K = string> {
  // Core CRUD operations
  findById(id: K, options?: FindByIdOptions): Promise<T | null>;
  findAll(options?: FindOptions<T>): Promise<T[]>;
  find(options?: FindOptions<T>): Promise<T[]>;
  create(data: Omit<T, 'id'>, options?: CreateDocumentOptions): Promise<T>;
  update(id: K, data: Partial<T>, options?: UpdateDocumentOptions): Promise<T>;
  delete(id: K, options?: DeleteDocumentOptions): Promise<void>;
  
  // Additional common operations
  findByIds(ids: K[], options?: FindByIdOptions): Promise<T[]>;
  findBy(field: keyof T | string, value: any, options?: FindOptions<T>): Promise<T[]>;
  findOneBy(field: keyof T | string, value: any, options?: FindOptions<T>): Promise<T | null>;
  count(options?: CountDocumentsOptions<T>): Promise<number>;
  exists(id: K): Promise<boolean>;
  
  // Bulk operations
  createMany(items: Array<Omit<T, 'id'>>, options?: CreateDocumentOptions): Promise<T[]>;
  updateMany(items: Array<{ id: K; data: Partial<T> }>, options?: UpdateDocumentOptions): Promise<T[]>;
  deleteMany(ids: K[], options?: BatchDeleteOptions): Promise<void>;
  
  // Transaction operations
  runTransaction<R>(callback: (transaction: Transaction) => Promise<R>): Promise<R>;
}`
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(REPO_TYPES_PATH, updatedContent);
  console.log('Repository types updated successfully.');
}

// Function to update the Firestore base repository implementation
function updateFirestoreBaseRepository() {
  console.log('Updating Firestore base repository...');
  
  // Read the current file
  const content = fs.readFileSync(FIRESTORE_BASE_REPO_PATH, 'utf8');
  
  // Update the class definition with proper generic parameters
  const updatedContent = content.replace(
    /export class FirestoreBaseRepository<T>/g,
    'export class FirestoreBaseRepository<T extends BaseEntity, K = string> implements Repository<T, K>'
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(FIRESTORE_BASE_REPO_PATH, updatedContent);
  console.log('Firestore base repository updated successfully.');
}

// Function to ensure Google Cloud types are properly defined
function updateGoogleCloudTypes() {
  console.log('Updating Google Cloud types...');
  
  // Check if the file exists
  if (!fs.existsSync(GOOGLE_CLOUD_TYPES_PATH)) {
    console.log('Google Cloud types file not found. Creating it...');
    
    const content = `/**
 * Google Cloud types for Firestore and other GCP services
 */

import { Timestamp as FirestoreTimestamp } from '@google-cloud/firestore';

// Re-export Firestore timestamp
export type Timestamp = FirestoreTimestamp;

// Firestore entity base definition
export interface FirestoreEntity {
  id: string;
  [key: string]: any;
}

// Query filter operators
export type QueryFilterOperator = 
  | '==' 
  | '!=' 
  | '<' 
  | '<=' 
  | '>' 
  | '>=' 
  | 'array-contains' 
  | 'array-contains-any' 
  | 'in' 
  | 'not-in';

// Transaction context
export interface TransactionContext {
  isInTransaction: boolean;
  transaction?: any;
}

// Query options
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string | string[];
  orderDirection?: 'asc' | 'desc' | Array<'asc' | 'desc'>;
  filters?: any[];
}

// Storage service options
export interface StorageOptions {
  bucketName?: string;
  projectId?: string;
  keyFilename?: string;
}

// Other GCP service options as needed
`;
    
    // Create the directory if it doesn't exist
    const dir = path.dirname(GOOGLE_CLOUD_TYPES_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write the content to the file
    fs.writeFileSync(GOOGLE_CLOUD_TYPES_PATH, content);
    console.log('Google Cloud types file created successfully.');
  } else {
    console.log('Google Cloud types file already exists. Skipping creation.');
  }
}

// Main function to run all updates
function main() {
  console.log('Starting repository types fix script...');
  
  // Run updates
  updateRepositoryTypes();
  updateFirestoreBaseRepository();
  updateGoogleCloudTypes();
  
  console.log('Repository types fix script completed successfully.');
}

// Execute the script
main();