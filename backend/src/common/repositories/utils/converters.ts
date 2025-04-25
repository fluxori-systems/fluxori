/**
 * Data converter utilities for Firestore entities
 * Provides conversion between Firestore document data and entity objects
 */

import {
  DocumentData,
  FieldValue,
  Timestamp,
  QueryDocumentSnapshot,
} from '@google-cloud/firestore';

import {
  FirestoreEntity,
  isFirestoreTimestamp,
} from '../../../types/google-cloud.types';

// Import the EntityConverter type
import type { EntityConverter } from '../types';
// Re-export the EntityConverter type
export type { EntityConverter };

/**
 * Repository converter interface
 */
export interface RepositoryConverter<T> {
  toFirestore(entity: T): DocumentData;
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): T;
}

/**
 * Create a converter for a Firestore entity
 * This handles converting between our entity model and Firestore's data model
 */
export function createEntityConverter<
  T extends FirestoreEntity,
>(): EntityConverter<T> {
  return {
    /**
     * Convert entity to Firestore data
     */
    toFirestore(entity: T): DocumentData {
      const documentData: DocumentData = { ...entity };

      // Convert dates to Firestore Timestamps
      for (const [key, value] of Object.entries(
        entity as Record<string, any>,
      )) {
        if (value instanceof Date) {
          documentData[key] = Timestamp.fromDate(value);
        }
      }

      return documentData;
    },

    /**
     * Convert Firestore document to entity
     */
    fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): T {
      const documentData = snapshot.data();
      const entity = {
        ...documentData,
        id: snapshot.id,
      } as T;

      // Convert Firestore Timestamps to JavaScript Dates
      for (const [key, value] of Object.entries(
        entity as Record<string, any>,
      )) {
        if (isFirestoreTimestamp(value)) {
          (entity as Record<string, any>)[key] = value.toDate();
        }
      }

      return entity;
    },
  };
}

/**
 * Sanitize entity for storage
 * Removes any fields that should not be stored in Firestore
 */
export function sanitizeEntityForStorage<T extends FirestoreEntity>(
  entity: T,
): DocumentData {
  // Create a copy of the entity to avoid modifying the original
  const sanitized = { ...entity };

  // List of fields to exclude from storage
  const excludedFields = ['_id', '_ref', '_path', '_metadata'];

  // Remove excluded fields
  for (const field of excludedFields) {
    if (field in sanitized) {
      delete sanitized[field];
    }
  }

  return sanitized;
}

/**
 * Apply server timestamps to entity
 */
export function applyServerTimestamps<T extends FirestoreEntity>(
  entity: Partial<T>,
  serverTimestampField: FieldValue,
  isNewEntity: boolean = false,
): Partial<T> {
  const result = { ...entity } as any;

  // Apply timestamp to updateAt always, and createdAt for new entities
  result.updatedAt = serverTimestampField;

  if (isNewEntity) {
    result.createdAt = serverTimestampField;
  }

  return result as Partial<T>;
}

/**
 * Apply client-side timestamps to entity
 */
export function applyClientTimestamps<T extends FirestoreEntity>(
  entity: Partial<T>,
  isNewEntity: boolean = false,
): Partial<T> {
  const now = new Date();
  const result = { ...entity } as any;

  // Apply timestamp to updateAt always, and createdAt for new entities
  result.updatedAt = now;

  if (isNewEntity) {
    result.createdAt = now;
  }

  return result as Partial<T>;
}
