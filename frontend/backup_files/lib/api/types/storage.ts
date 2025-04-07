import { BaseEntity } from './common';

/**
 * File metadata
 */
export interface FileMetadata extends BaseEntity {
  fileName: string;
  contentType: string;
  size: number;
  path: string;
  entityType?: string;
  entityId?: string;
  isPublic: boolean;
  uploadedBy: string;
}

/**
 * Request to generate a signed upload URL
 */
export interface SignedUrlRequest {
  fileName: string;
  contentType: string;
  entityType?: string;
  entityId?: string;
}

/**
 * Response with a signed upload URL
 */
export interface SignedUrlResponse {
  url: string;
  fileId: string;
  fields?: Record<string, string>;
}

/**
 * Request to get a download URL
 */
export interface DownloadUrlRequest {
  fileId: string;
  expiresInMinutes?: number;
}

/**
 * Response with a download URL
 */
export interface DownloadUrlResponse {
  url: string;
  fileName: string;
  contentType?: string;
}

/**
 * Parameters for listing files
 */
export interface FileListParams {
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Request to attach a file to an entity
 */
export interface AttachFileRequest {
  fileId: string;
  entityType: string;
  entityId: string;
}

/**
 * Response for file operations
 */
export interface FileOperationResponse {
  success: boolean;
  message: string;
  fileId?: string;
}