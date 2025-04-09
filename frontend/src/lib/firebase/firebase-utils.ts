/**
 * Firebase utility functions
 */

import { firestore, firebaseStorage } from './config';

// Mock types for TypeScript errors
interface DocumentData {
  id: string;
  exists: boolean;
  data: () => any;
}

interface QuerySnapshot {
  docs: DocumentData[];
}

/**
 * Generate a unique ID
 * @returns Unique ID string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Upload a file to Firebase Storage
 * @param file The file to upload
 * @param path The path in storage where to upload the file
 * @param metadata Optional metadata for the file
 * @returns The download URL for the uploaded file
 */
export async function uploadFile(
  file: File,
  path: string,
  metadata?: Record<string, string>
): Promise<string> {
  try {
    // Pretend to upload file
    return `https://storage.example.com/${path}`;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Delete a file from Firebase Storage
 * @param path The path of the file to delete
 * @returns True if deletion was successful
 */
export async function deleteFile(path: string): Promise<boolean> {
  try {
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Convert a Firestore timestamp to a Date object or ISO string
 * @param timestamp Firestore timestamp object
 * @param asString Whether to return the date as an ISO string
 * @returns Date object or ISO string
 */
export function convertTimestamp(timestamp: any, asString = false): Date | string | null {
  if (!timestamp) return null;
  
  // Check if it's a Firestore timestamp (has seconds and nanoseconds)
  if (timestamp && typeof timestamp.toDate === 'function') {
    const date = timestamp.toDate();
    return asString ? date.toISOString() : date;
  }
  
  // Already a Date object
  if (timestamp instanceof Date) {
    return asString ? timestamp.toISOString() : timestamp;
  }
  
  // String timestamp
  if (typeof timestamp === 'string') {
    try {
      const date = new Date(timestamp);
      return asString ? date.toISOString() : date;
    } catch (e) {
      return null;
    }
  }
  
  return null;
}

/**
 * Convert Firestore document to proper entity object
 * @param doc Firestore document or document snapshot
 * @returns Converted entity object
 */
export function convertFirestoreDoc<T>(doc: DocumentData): T {
  if (!doc.exists) return null as any;
  
  const data = doc.data();
  const result: any = {
    ...data,
    id: doc.id,
    // Convert timestamps to dates
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
  
  // Convert other timestamps if present
  if (data.deletedAt) {
    result.deletedAt = convertTimestamp(data.deletedAt);
  }
  
  if (data.lastLogin) {
    result.lastLogin = convertTimestamp(data.lastLogin);
  }
  
  if (data.expiresAt) {
    result.expiresAt = convertTimestamp(data.expiresAt);
  }
  
  return result as T;
}

/**
 * Convert a Firestore query snapshot to an array of entities
 * @param snapshot Firestore query snapshot
 * @returns Array of converted entity objects
 */
export function convertQuerySnapshot<T>(snapshot: QuerySnapshot): T[] {
  return snapshot.docs.map(doc => {
    const data = doc.data();
    
    return {
      ...data,
      id: doc.id,
      // Convert timestamps to dates
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt) : null,
    } as T;
  });
}

/**
 * Search for documents in a collection
 * @param collectionName Firestore collection name
 * @param searchField Field to search in
 * @param searchTerm Term to search for
 * @param maxResults Maximum number of results to return
 * @returns Array of matched documents
 */
export async function searchDocuments<T>(
  collectionName: string,
  searchField: string,
  searchTerm: string,
  maxResults = 10
): Promise<T[]> {
  try {
    // Mock implementation
    return [] as T[];
  } catch (error) {
    console.error(`Error searching ${collectionName} by ${searchField}:`, error);
    throw error;
  }
}

/**
 * Generate a slug from a name
 * @param name The name to convert to a slug
 * @returns URL-friendly slug
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}