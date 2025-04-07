import { 
  QueryDocumentSnapshot, 
  DocumentData 
} from '@google-cloud/firestore';
import { 
  FirestoreEntity, 
  FirestoreDataConverter, 
  isFirestoreTimestamp 
} from '../../../types/google-cloud.types';

/**
 * Firestore Converter
 * 
 * Handles type-safe conversions between application models and Firestore data
 */
export class FirestoreConverter<T extends FirestoreEntity> implements FirestoreDataConverter<T> {
  /**
   * Convert model object to Firestore data
   * @param modelObject Application model object
   * @returns DocumentData for Firestore
   */
  toFirestore(modelObject: T): DocumentData {
    // Create a shallow copy to avoid modifying the original
    const data = { ...modelObject };
    
    // Remove undefined values that Firestore doesn't support
    Object.keys(data).forEach(key => {
      if (data[key] === undefined) {
        delete data[key];
      }
    });
    
    return data;
  }
  
  /**
   * Convert Firestore document to model object
   * @param snapshot Document snapshot from Firestore
   * @returns Typed model object
   */
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): T {
    const data = snapshot.data();
    
    // Create typed object with document ID
    const result = {
      ...data,
      id: snapshot.id,
    } as T;
    
    // Convert Firestore Timestamps to JavaScript Dates
    this.convertTimestamps(result);
    
    return result;
  }
  
  /**
   * Recursively convert Firestore Timestamps to JavaScript Dates
   * @param obj Object to convert timestamps in
   */
  private convertTimestamps(obj: Record<string, any>): void {
    if (!obj || typeof obj !== 'object') {
      return;
    }
    
    for (const key in obj) {
      const value = obj[key];
      
      // Convert Timestamp directly
      if (isFirestoreTimestamp(value)) {
        obj[key] = value.toDate();
      } 
      // Handle nested objects and arrays recursively
      else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          // Handle array of objects
          for (let i = 0; i < value.length; i++) {
            const item = value[i];
            if (typeof item === 'object' && item !== null) {
              if (isFirestoreTimestamp(item)) {
                value[i] = item.toDate();
              } else {
                this.convertTimestamps(item);
              }
            }
          }
        } else {
          // Handle nested object
          this.convertTimestamps(value);
        }
      }
    }
  }
}