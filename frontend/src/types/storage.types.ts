/**
 * Storage API Types
 * 
 * Types related to file storage and management
 */

/**
 * Parameters for requesting a signed URL for file uploads
 */
export interface SignedUrlParams {
  fileName: string;
  contentType: string;
  entityId?: string;
  entityType?: string;
}

/**
 * Response containing signed URL information
 */
export interface SignedUrlResponse {
  url: string;
  fileId: string;
  fields?: Record<string, string>;
  expiresAt?: string;
}

/**
 * Parameters for listing files
 */
export interface FileListParams {
  entityId?: string;
  entityType?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Metadata for a stored file
 */
export interface FileMetadata {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  path: string;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
  entityId?: string;
  entityType?: string;
  thumbnailUrl?: string;
  url?: string;
}

/**
 * Generic response for file operations
 */
export interface FileOperationResponse {
  success: boolean;
  message: string;
  fileId?: string;
}

/**
 * Parameters for download URL requests
 */
export interface DownloadUrlParams {
  fileId: string;
  expiresInMinutes?: number;
}

/**
 * Response with download URL for a file
 */
export interface DownloadUrlResponse {
  url: string;
  fileName: string;
  contentType?: string;
  expiresAt?: string;
}

/**
 * Parameters for attaching a file to an entity
 */
export interface AttachFileParams {
  fileId: string;
  entityType: string;
  entityId: string;
}