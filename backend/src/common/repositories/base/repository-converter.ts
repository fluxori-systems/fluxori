/**
 * Data converter utilities for Firestore entities
 * Provides conversion between Firestore document data and entity objects
 */

import {
  DocumentData,
  FieldValue,
  Timestamp,
  QueryDocumentSnapshot,
  WithFieldValue,
  PartialWithFieldValue,
  SetOptions,
  FirestoreDataConverter,
} from '@google-cloud/firestore';

import {
  FirestoreEntity,
  isFirestoreTimestamp,
} from '../../../types/google-cloud.types';
import { toJSDate } from '../../utils/date.util';

// Use the Firestore SDK's FirestoreDataConverter<T> type directly for compatibility
export type EntityConverter<T> = FirestoreDataConverter<T>;

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
>(): FirestoreDataConverter<T> {
  return {
    toFirestore(
      modelObject: WithFieldValue<T> | PartialWithFieldValue<T>,
      options?: SetOptions,
    ): DocumentData {
      const documentData: DocumentData = { ...modelObject };
      // Modernized: Prefer strict FirestoreEntity usage. Use generics only for utility flexibility, but document that concrete interfaces are expected for all real entities.
      for (const [key, value] of Object.entries(
        modelObject as FirestoreEntity,
      )) {
        if (value instanceof Date) {
          documentData[key] = Timestamp.fromDate(value);
        }
      }
      return documentData;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): T {
      const documentData = snapshot.data();
      const entity = {
        ...documentData,
        id: snapshot.id,
      } as T;
      // Modernized: Prefer strict FirestoreEntity usage. Use generics only for utility flexibility, but document that concrete interfaces are expected for all real entities.
      for (const [key, value] of Object.entries(entity as FirestoreEntity)) {
        if (isFirestoreTimestamp(value)) {
          (entity as Record<string, unknown>)[key] = (
            toJSDate(value)
          );
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
