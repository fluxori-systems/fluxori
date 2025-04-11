import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { Storage, GetSignedUrlConfig } from "@google-cloud/storage";

import { StorageService } from "./storage.interface";

/**
 * Google Cloud Storage implementation of StorageService
 */
@Injectable()
export class GoogleCloudStorageService implements StorageService {
  private readonly logger = new Logger(GoogleCloudStorageService.name);
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly defaultExpirationMinutes = 60; // 1 hour default

  constructor(private readonly configService: ConfigService) {
    // Initialize GCS with application default credentials
    // or explicit credentials if provided
    this.storage = new Storage({
      projectId: this.configService.get<string>("GCP_PROJECT_ID"),
      keyFilename: this.configService.get<string>("GCP_KEY_FILE"),
    });

    this.bucketName =
      this.configService.get<string>("GCS_BUCKET_NAME") || "fluxori-uploads";
  }

  /**
   * Upload a file to Google Cloud Storage
   */
  async uploadFile(
    file: Buffer,
    filePath: string,
    options?: {
      contentType?: string;
      metadata?: Record<string, string>;
      isPublic?: boolean;
    },
  ): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const blob = bucket.file(filePath);

      // Upload the file
      await blob.save(file, {
        contentType: options?.contentType,
        metadata: {
          metadata: options?.metadata,
        },
        public: options?.isPublic,
      });

      // Return the public URL if the file is public, otherwise
      // just return the path in the bucket
      if (options?.isPublic) {
        return `https://storage.googleapis.com/${this.bucketName}/${filePath}`;
      }

      return filePath;
    } catch (error) {
      this.logger.error(
        `Error uploading file to GCS: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate a signed URL for uploading a file directly to GCS
   */
  async generateSignedUploadUrl(options: {
    fileName: string;
    contentType: string;
    expiresInMinutes?: number;
    metadata?: Record<string, string>;
  }): Promise<{ url: string; fields: Record<string, string> }> {
    try {
      const { fileName, contentType, expiresInMinutes, metadata } = options;

      if (!fileName) {
        throw new Error("File name is undefined or empty");
      }

      // Create a policy for the signed URL
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      // Calculate expiration time
      const expiration = new Date();
      expiration.setMinutes(
        expiration.getMinutes() +
          (expiresInMinutes || this.defaultExpirationMinutes),
      );

      // Create signed URL with V4 signature
      const [url] = await file.getSignedUrl({
        version: "v4",
        action: "write",
        expires: expiration,
        contentType,
        extensionHeaders: {
          "x-goog-meta-uploadedBy": metadata?.uploadedBy || "anonymous",
          "x-goog-meta-organizationId": metadata?.organizationId || "unknown",
          ...Object.entries(metadata || {}).reduce(
            (acc, [key, value]) => {
              acc[`x-goog-meta-${key}`] = value;
              return acc;
            },
            {} as Record<string, string>,
          ),
        },
      });

      // Return the signed URL and any extra fields needed for the upload
      return {
        url,
        fields: {
          "Content-Type": contentType,
          ...(metadata || {}),
        },
      };
    } catch (error) {
      this.logger.error(
        `Error generating signed URL: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get a signed URL for downloading a file
   */
  async getSignedDownloadUrl(
    filePath: string,
    expiresInMinutes = this.defaultExpirationMinutes,
  ): Promise<string> {
    try {
      if (!filePath) {
        throw new Error("File path is undefined or empty");
      }

      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filePath);

      // Check if the file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error(`File ${filePath} does not exist`);
      }

      // Create expiration date
      const expiration = new Date();
      expiration.setMinutes(expiration.getMinutes() + expiresInMinutes);

      // Generate signed URL
      const [url] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: expiration,
      });

      return url;
    } catch (error) {
      this.logger.error(
        `Error getting signed download URL: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      if (!filePath) {
        this.logger.warn("File path is undefined or empty, skipping deletion");
        return;
      }

      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filePath);

      // Check if the file exists
      const [exists] = await file.exists();
      if (!exists) {
        this.logger.warn(`File ${filePath} does not exist, skipping deletion`);
        return;
      }

      // Delete the file
      await file.delete();
      this.logger.log(`File ${filePath} deleted successfully`);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(
    directory: string,
    options?: {
      limit?: number;
      prefix?: string;
    },
  ): Promise<string[]> {
    try {
      const bucket = this.storage.bucket(this.bucketName);

      // Prepare options
      const prefix = options?.prefix
        ? `${directory}/${options.prefix}`
        : directory;

      // Get files
      const [files] = await bucket.getFiles({
        prefix,
        maxResults: options?.limit,
      });

      // Return file names
      return files.map((file) => file.name);
    } catch (error) {
      this.logger.error(`Error listing files: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a file from storage
   */
  async getFile(filePath: string): Promise<Buffer> {
    try {
      if (!filePath) {
        throw new Error("File path is undefined or empty");
      }

      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filePath);

      // Check if the file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error(`File ${filePath} does not exist`);
      }

      // Download the file
      const [buffer] = await file.download();
      return buffer;
    } catch (error) {
      this.logger.error(`Error getting file: ${error.message}`, error.stack);
      throw error;
    }
  }
}
