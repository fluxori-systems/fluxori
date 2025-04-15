/**
 * Represents a file in storage with metadata
 */
export interface StorageFile {
  id: string;
  name: string;
  contentType: string;
  size: number;
  timeCreated: Date;
  updated: Date;
  metadata: Record<string, string | number | boolean | null>;
}

/**
 * Interface for storage service providers
 */
export interface StorageService {
  /**
   * Upload a file to storage
   * @param file The file buffer to upload
   * @param filePath The path to save the file at
   * @param options Additional options for upload
   */
  uploadFile(
    file: Buffer,
    filePath: string,
    options?: {
      contentType?: string;
      metadata?: Record<string, string>;
      isPublic?: boolean;
    },
  ): Promise<string>;

  /**
   * Generate a signed URL for file upload
   * @param options Options for generating the signed URL
   */
  generateSignedUploadUrl(options: {
    fileName: string;
    contentType: string;
    expiresInMinutes?: number;
    metadata?: Record<string, string>;
  }): Promise<{ url: string; fields: Record<string, string> }>;

  /**
   * Get a signed URL to download a file
   * @param filePath The path of the file to download
   * @param expiresInMinutes The number of minutes until the URL expires
   */
  getSignedDownloadUrl(
    filePath: string,
    expiresInMinutes?: number,
  ): Promise<string>;

  /**
   * Delete a file from storage
   * @param filePath The path of the file to delete
   */
  deleteFile(filePath: string): Promise<void>;

  /**
   * List files in a directory with detailed metadata
   * @param directory The directory to list files from (prefix)
   * @param options Options for listing files
   * @returns Array of StorageFile objects with metadata
   */
  listFiles(
    directory: string,
    options?: {
      limit?: number;
      prefix?: string;
    },
  ): Promise<StorageFile[]>;

  /**
   * Get a file from storage
   * @param filePath The path of the file to get
   */
  getFile(filePath: string): Promise<Buffer>;
}

/**
 * Token for storage service provider
 *
 * Use this token for dependency injection of StorageService
 * instead of using the interface directly, which causes TypeScript errors.
 */
export const STORAGE_SERVICE = Symbol("STORAGE_SERVICE");