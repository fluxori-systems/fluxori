/**
 * Type definitions for Google Cloud services
 *
 * This file defines interfaces and types for Google Cloud services
 * used throughout the application.
 */

import {
  Firestore,
  CollectionReference,
  DocumentReference,
  DocumentData,
  Query,
  QueryDocumentSnapshot,
  DocumentSnapshot,
  WriteBatch,
  Timestamp as FirestoreTimestamp,
  OrderByDirection,
  FieldValue,
  Transaction,
  CollectionGroup,
} from "@google-cloud/firestore";
import { Severity } from "@google-cloud/logging";
import { Storage } from "@google-cloud/storage";

// Re-export Firestore Timestamp for consistency
export { FirestoreTimestamp as Timestamp };

/**
 * Base entity interface for Firestore documents
 */
export interface FirestoreEntity {
  id: string;
  createdAt: Date | FirestoreTimestamp;
  updatedAt: Date | FirestoreTimestamp;
  isDeleted?: boolean;
  deletedAt?: Date | FirestoreTimestamp | null;
  version?: number;
  [key: string]: any;
}

/**
 * Tenant-aware entity interface
 */
export interface TenantEntity extends FirestoreEntity {
  organizationId: string;
  tenantId?: string;
}

/**
 * Type for typed collection references
 */
export type TypedCollectionReference<T> = CollectionReference<T>;

/**
 * Type for typed collection group
 */
export type TypedCollectionGroup<T> = CollectionGroup<T>;

/**
 * Type for typed document references
 */
export type TypedDocumentReference<T> = DocumentReference<T>;

/**
 * Type for typed document snapshots
 */
export type TypedDocumentSnapshot<T> = DocumentSnapshot<T>;

/**
 * Type for typed query document snapshots
 */
export type TypedQueryDocumentSnapshot<T> = QueryDocumentSnapshot<T>;

/**
 * Interface for Firestore data converters
 */
export interface FirestoreDataConverter<T> {
  toFirestore(modelObject: T | Partial<T>): DocumentData;
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): T;
}

/**
 * Result interface for batch write operations
 */
export interface FirestoreBatchWriteResult {
  status: "success" | "partial" | "error";
  successCount: number;
  errorCount: number;
  writtenCount?: number;
  errors?: Array<{
    index: number;
    id?: string;
    error: Error;
  }>;
}

/**
 * Query filter operator types
 */
export type QueryFilterOperator =
  | "=="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<="
  | "array-contains"
  | "array-contains-any"
  | "in"
  | "not-in";

/**
 * Query filter definition
 */
export interface QueryFilter {
  field: string;
  operator: QueryFilterOperator;
  value: any;
}

/**
 * Query order direction
 */
export type QueryOrderDirection = OrderByDirection;

/**
 * Query order definition
 */
export interface QueryOrder {
  field: string;
  direction?: QueryOrderDirection;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  startAt?: any;
  startAfter?: any;
  endAt?: any;
  endBefore?: any;
  page?: number;
  pageSize?: number;
}

/**
 * Query options for Firestore queries
 */
export interface QueryOptions {
  filters?: QueryFilter[];
  orderBy?: QueryOrder[];
  pagination?: PaginationOptions;
  includeDeleted?: boolean;
  organizationId?: string;
  tenantId?: string;
  select?: string[];
  cache?: boolean;
  [key: string]: any; // Allow additional query parameters
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
 * Transaction context for repository operations
 */
export interface TransactionContext {
  transaction: Transaction;
  options?: TransactionExecutionOptions;
}

/**
 * Logging severity types mapped from Google Cloud
 */
export type LogSeverity = keyof typeof Severity;

/**
 * Storage interface for cloud storage operations
 */
export interface StorageOptions {
  projectId?: string;
  keyFilename?: string;
}

/**
 * Return type for file upload operations
 */
export interface FileUploadResult {
  path: string;
  url?: string;
  size: number;
  contentType: string;
  metadata?: Record<string, any>;
}

/**
 * Configuration for Cloud Scheduler
 */
export interface CloudSchedulerConfig {
  projectId: string;
  location: string;
  timeZone?: string;
}

/**
 * Job definition for scheduled tasks
 */
export interface ScheduledJob {
  name: string;
  schedule: string; // cron expression
  httpTarget: {
    uri: string;
    httpMethod: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    body?: string;
  };
  retryConfig?: {
    retryCount?: number;
    maxRetryDuration?: string;
    minBackoffDuration?: string;
    maxBackoffDuration?: string;
    maxDoublings?: number;
  };
}

/**
 * Paginated result interface
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  cursor?: string;
}

/**
 * Document type with typed data
 */
export interface FirestoreDocument<T = any> {
  id: string;
  ref: DocumentReference<T>;
  data: T;
  exists: boolean;
  createTime?: FirestoreTimestamp;
  updateTime?: FirestoreTimestamp;
  readTime?: FirestoreTimestamp;
}

// Type guard to check if an object is a Firebase Timestamp
export function isFirestoreTimestamp(obj: any): obj is FirestoreTimestamp {
  return (
    obj &&
    typeof obj === "object" &&
    "seconds" in obj &&
    "nanoseconds" in obj &&
    typeof obj.seconds === "number" &&
    typeof obj.nanoseconds === "number"
  );
}

/**
 * User interface representing Firebase authenticated user
 */
export interface User {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  organizationId?: string;
  role?: string;
  customClaims?: Record<string, any>;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  disabled?: boolean;
}
