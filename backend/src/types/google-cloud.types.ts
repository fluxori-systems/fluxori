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
  Timestamp as FirestoreTimestamp
} from '@google-cloud/firestore';

import { Storage } from '@google-cloud/storage';
import { Severity } from '@google-cloud/logging';

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
 * Type for typed collection references
 */
export type TypedCollectionReference<T> = CollectionReference<T>;

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
  toFirestore(modelObject: T): DocumentData;
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): T;
}

/**
 * Result interface for batch write operations
 */
export interface FirestoreBatchWriteResult {
  status: 'success' | 'partial' | 'error';
  successCount: number;
  errorCount: number;
  errors?: Array<{
    index: number;
    id?: string;
    error: Error;
  }>;
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
    httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
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

// Type guard to check if an object is a Firebase Timestamp
export function isFirestoreTimestamp(obj: any): obj is FirestoreTimestamp {
  return obj && 
         typeof obj === 'object' && 
         'seconds' in obj && 
         'nanoseconds' in obj &&
         typeof obj.seconds === 'number' &&
         typeof obj.nanoseconds === 'number';
}