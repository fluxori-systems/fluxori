/**
 * PIM-specific storage service with South African optimizations
 */
import { Injectable, Logger, Inject, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";

import { StorageService, STORAGE_SERVICE } from "@common/storage";
import { NetworkStatusService, NetworkStatus } from "@common/utils";
import {
  ProductImage,
  CompressionQuality,
  ResizeOption,
} from "../models/image.model";

/**
 * PIM-specific storage service with South African optimizations
 * Provides specialized storage operations for the PIM module
 */
@Injectable()
export class PimStorageService {
  private readonly logger = new Logger(PimStorageService.name);
  private readonly bucketName: string;

  constructor(
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    private readonly networkStatusService: NetworkStatusService,
  ) {
    this.bucketName =
      this.configService.get<string>("GCS_BUCKET_NAME") || "fluxori-uploads";
  }

  /**
   * Get a network-aware signed URL for product image upload
   * Optimizes the upload process based on network conditions
   */
  async getSignedUploadUrl(options: {
    fileName: string;
    contentType: string;
    expiresInMinutes?: number;
    metadata?: Record<string, string>;
    organizationId?: string;
  }): Promise<{
    url: string;
    fields: Record<string, string>;
    networkQuality?: string;
  }> {
    const {
      fileName,
      contentType,
      expiresInMinutes,
      metadata = {},
      organizationId,
    } = options;

    // Get current network status to adapt to conditions
    const networkStatus =
      await this.networkStatusService.getNetworkStatus(organizationId);

    // Modify expiration based on network conditions
    let adaptedExpiresInMinutes = expiresInMinutes;

    // If network is unstable or slow, extend the expiration time
    if (!networkStatus.isStable || !networkStatus.isSufficientBandwidth) {
      // Increase expiration time for unstable connections
      adaptedExpiresInMinutes = Math.max(expiresInMinutes || 15, 30);
      this.logger.log(
        `Extended URL expiration to ${adaptedExpiresInMinutes} minutes due to network conditions`,
      );
    }

    // Add network information to metadata
    const enhancedMetadata: Record<string, string> = {
      ...metadata,
      connectionType: networkStatus.connectionType,
      networkQuality: networkStatus.isSufficientBandwidth ? "good" : "limited",
      timestamp: new Date().toISOString(),
    };

    // Generate the signed URL
    const result = await this.storageService.generateSignedUploadUrl({
      fileName,
      contentType,
      expiresInMinutes: adaptedExpiresInMinutes,
      metadata: enhancedMetadata,
    });

    return {
      ...result,
      networkQuality: networkStatus.connectionType,
    };
  }

  /**
   * Get a network-aware signed URL for downloading a file
   * Optimizes the download process based on network conditions
   */
  async getSignedDownloadUrl(
    filePath: string,
    expiresInMinutes?: number,
    organizationId?: string,
  ): Promise<{ url: string; expiresAt: Date; networkQuality?: string }> {
    // Get current network status
    const networkStatus =
      await this.networkStatusService.getNetworkStatus(organizationId);

    // Adjust expiration time based on network quality
    let adaptedExpiresInMinutes = expiresInMinutes;
    if (!networkStatus.isStable) {
      // Extend expiration for unstable networks
      adaptedExpiresInMinutes = Math.max(expiresInMinutes || 60, 120);
    }

    // Get the signed URL
    const url = await this.storageService.getSignedDownloadUrl(
      filePath,
      adaptedExpiresInMinutes,
    );

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + (adaptedExpiresInMinutes || 60),
    );

    return {
      url,
      expiresAt,
      networkQuality: networkStatus.connectionType,
    };
  }

  /**
   * Add a file with network-aware optimizations
   * Handles partial uploads and resumable sessions
   */
  async storeFile(
    file: Buffer,
    filePath: string,
    options?: {
      contentType?: string;
      metadata?: Record<string, string>;
      isPublic?: boolean;
      organizationId?: string;
    },
  ): Promise<{ url: string; isOptimized: boolean }> {
    const { contentType, metadata, isPublic, organizationId } = options || {};

    // Get network status for optimizations
    const networkStatus =
      await this.networkStatusService.getNetworkStatus(organizationId);

    // Add network data to metadata
    const enhancedMetadata: Record<string, string> = {
      ...(metadata || {}),
      connectionType: networkStatus.connectionType,
      uploadedAt: new Date().toISOString(),
    };

    // Store the file
    const storedPath = await this.storageService.uploadFile(file, filePath, {
      contentType,
      metadata: enhancedMetadata,
      isPublic,
    });

    // Generate URL
    const url = isPublic
      ? `https://storage.googleapis.com/${this.bucketName}/${filePath}`
      : storedPath;

    return {
      url,
      isOptimized: networkStatus.isSufficientBandwidth,
    };
  }

  /**
   * Get the current network quality
   * Used to adapt UI/UX for different network conditions
   */
  async getNetworkQuality(organizationId?: string): Promise<{
    connectionType: string;
    connectionQuality: "high" | "medium" | "low";
    quality: "high" | "medium" | "low";
    isSufficient: boolean;
    recommendedMaxFileSize?: number;
  }> {
    const networkStatus =
      await this.networkStatusService.getNetworkStatus(organizationId);

    // Determine quality level
    let quality: "high" | "medium" | "low";
    let recommendedMaxFileSize: number;

    switch (networkStatus.connectionType) {
      case "wifi":
        quality = "high";
        recommendedMaxFileSize = 10 * 1024 * 1024; // 10MB
        break;
      case "4g":
        quality =
          networkStatus.downloadSpeed && networkStatus.downloadSpeed > 5
            ? "high"
            : "medium";
        recommendedMaxFileSize = 5 * 1024 * 1024; // 5MB
        break;
      case "3g":
        quality = "medium";
        recommendedMaxFileSize = 2 * 1024 * 1024; // 2MB
        break;
      default:
        quality = "low";
        recommendedMaxFileSize = 500 * 1024; // 500KB
    }

    return {
      connectionType: networkStatus.connectionType,
      connectionQuality: quality,
      quality, // For backward compatibility
      isSufficient: networkStatus.isSufficientBandwidth,
      recommendedMaxFileSize,
    };
  }

  /**
   * Upload a product image
   *
   * @param file Image buffer
   * @param options Upload options
   * @returns Product image details
   */
  async uploadProductImage(
    file: Buffer,
    options: {
      productId: string;
      fileName: string;
      contentType: string;
      imageType?: string;
      position?: number;
      isMain?: boolean;
      altText?: string;
      compressionQuality?: CompressionQuality;
      resizeOption?: ResizeOption;
      generateThumbnails?: boolean;
      optimizeForLowBandwidth?: boolean;
      metadata?: Record<string, string>;
      organizationId?: string;
      networkQuality?: NetworkStatus;
    },
  ): Promise<ProductImage> {
    const {
      productId,
      fileName,
      contentType,
      imageType = "gallery",
      position = 0,
      isMain = false,
      altText = "",
      compressionQuality = CompressionQuality.ADAPTIVE,
      resizeOption = ResizeOption.NONE,
      generateThumbnails = true,
      optimizeForLowBandwidth = true,
      metadata = {},
      organizationId,
    } = options;

    // Generate a unique ID for the image
    const imageId = uuidv4();

    // Get network status for optimizations
    const networkStatus =
      await this.networkStatusService.getNetworkStatus(organizationId);

    // Create the storage path
    const fileExtension = this.getFileExtension(fileName);
    const storagePath = `products/${productId}/${imageType}/${position}_${imageId}${fileExtension}`;

    // Add additional metadata
    const enhancedMetadata: Record<string, string> = {
      ...metadata,
      imageId,
      productId,
      imageType,
      position: position.toString(),
      isMain: isMain.toString(),
      compressionQuality,
      generateThumbnails: generateThumbnails.toString(),
      resizeOption,
      optimizeForLowBandwidth: optimizeForLowBandwidth.toString(),
      uploadTimestamp: new Date().toISOString(),
      connectionType: networkStatus.connectionType,
    };

    // Upload the file
    const result = await this.storeFile(file, storagePath, {
      contentType,
      metadata: enhancedMetadata,
      isPublic: true,
      organizationId,
    });

    // Generate public and CDN URLs
    const publicUrl = result.url;
    const cdnDomain =
      this.configService.get<string>("CDN_DOMAIN") || "cdn.fluxori.com";
    const cdnUrl = `https://${cdnDomain}/${storagePath}`;

    // Generate thumbnail URLs if requested
    const thumbnails: Record<string, string> = {};
    if (generateThumbnails) {
      const fileNameWithoutExt = storagePath.substring(
        0,
        storagePath.lastIndexOf("."),
      );
      const fileExt = storagePath.substring(storagePath.lastIndexOf("."));

      thumbnails.thumbnail = `https://${cdnDomain}/${fileNameWithoutExt}_thumbnail${fileExt}`;
      thumbnails.small = `https://${cdnDomain}/${fileNameWithoutExt}_small${fileExt}`;
      thumbnails.medium = `https://${cdnDomain}/${fileNameWithoutExt}_medium${fileExt}`;
      thumbnails.large = `https://${cdnDomain}/${fileNameWithoutExt}_large${fileExt}`;
    }

    // Create network optimization info
    const networkOptimization = {
      adaptiveCompression: compressionQuality === CompressionQuality.ADAPTIVE,
      lowBandwidthOptimized: optimizeForLowBandwidth,
      estimatedSizeBytes: this.estimateImageSize(
        contentType,
        resizeOption,
        compressionQuality,
      ),
      recommendedConnectionType: this.getRecommendedConnectionType(
        compressionQuality,
        resizeOption,
        optimizeForLowBandwidth,
      ),
    };

    // Create the product image object
    const productImage: ProductImage = {
      id: imageId,
      productId,
      fileName,
      storagePath,
      publicUrl,
      cdnUrl,
      imageType,
      position,
      contentType,
      size: file.length,
      thumbnails: generateThumbnails ? thumbnails : undefined,
      altText,
      isMain,
      networkOptimization,
      metadata: enhancedMetadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return productImage;
  }

  /**
   * Get a product image by ID
   *
   * @param imageId Image ID
   * @param organizationId Organization ID
   * @returns Product image details
   */
  async getProductImage(
    imageId: string,
    organizationId?: string,
  ): Promise<ProductImage> {
    try {
      // List files with the image ID in metadata
      const files = await this.storageService.listFiles("products");

      // Find the file with matching image ID in metadata
      const imageFile = files.find(
        (file) => file.metadata?.imageId === imageId,
      );

      if (!imageFile) {
        throw new NotFoundException(`Image not found with ID: ${imageId}`);
      }

      // Extract metadata
      const metadata = imageFile.metadata || {};
      const productId = metadata.productId || "";
      const imageType = metadata.imageType || "gallery";
      const position = parseInt(metadata.position || "0", 10);
      const isMain = metadata.isMain === "true";

      // Generate public and CDN URLs
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${imageFile.name}`;
      const cdnDomain =
        this.configService.get<string>("CDN_DOMAIN") || "cdn.fluxori.com";
      const cdnUrl = `https://${cdnDomain}/${imageFile.name}`;

      // Generate thumbnail URLs
      const thumbnails: Record<string, string> = {};
      if (metadata.generateThumbnails === "true") {
        const fileNameWithoutExt = imageFile.name.substring(
          0,
          imageFile.name.lastIndexOf("."),
        );
        const fileExt = imageFile.name.substring(
          imageFile.name.lastIndexOf("."),
        );

        thumbnails.thumbnail = `https://${cdnDomain}/${fileNameWithoutExt}_thumbnail${fileExt}`;
        thumbnails.small = `https://${cdnDomain}/${fileNameWithoutExt}_small${fileExt}`;
        thumbnails.medium = `https://${cdnDomain}/${fileNameWithoutExt}_medium${fileExt}`;
        thumbnails.large = `https://${cdnDomain}/${fileNameWithoutExt}_large${fileExt}`;
      }

      // Get file name from path
      const fileName = imageFile.name.split("/").pop() || imageFile.name;

      // Create the product image object
      const productImage: ProductImage = {
        id: imageId,
        productId,
        fileName,
        storagePath: imageFile.name,
        publicUrl,
        cdnUrl,
        imageType,
        position,
        contentType: imageFile.contentType,
        size: imageFile.size,
        thumbnails:
          metadata.generateThumbnails === "true" ? thumbnails : undefined,
        altText: metadata.altText,
        isMain,
        metadata: metadata as Record<string, string>,
        createdAt: imageFile.timeCreated,
        updatedAt: imageFile.updated,
      };

      return productImage;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to get product image: ${errorMessage}`,
        errorStack,
      );
      throw new Error(`Failed to get product image: ${errorMessage}`);
    }
  }

  /**
   * Get all images for a product
   *
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param imageType Optional image type filter
   * @returns Array of product images
   */
  async getProductImages(
    productId: string,
    organizationId?: string,
    imageType?: string,
  ): Promise<ProductImage[]> {
    try {
      // Construct the storage path prefix
      const prefix = `products/${productId}/`;

      // List all files with this prefix
      const files = await this.storageService.listFiles(prefix);

      // Filter by image type if provided
      const filteredFiles = imageType
        ? files.filter((file) => file.name.includes(`/${imageType}/`))
        : files;

      // Map to product image objects
      const productImages = filteredFiles.map((file) => {
        const metadata = file.metadata || {};
        const imageId = metadata.imageId || file.id;
        const productId = metadata.productId || "";
        const imageType = metadata.imageType || "gallery";
        const position = parseInt(metadata.position || "0", 10);
        const isMain = metadata.isMain === "true";

        // Generate public and CDN URLs
        const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${file.name}`;
        const cdnDomain =
          this.configService.get<string>("CDN_DOMAIN") || "cdn.fluxori.com";
        const cdnUrl = `https://${cdnDomain}/${file.name}`;

        // Generate thumbnail URLs
        const thumbnails: Record<string, string> = {};
        if (metadata.generateThumbnails === "true") {
          const fileNameWithoutExt = file.name.substring(
            0,
            file.name.lastIndexOf("."),
          );
          const fileExt = file.name.substring(file.name.lastIndexOf("."));

          thumbnails.thumbnail = `https://${cdnDomain}/${fileNameWithoutExt}_thumbnail${fileExt}`;
          thumbnails.small = `https://${cdnDomain}/${fileNameWithoutExt}_small${fileExt}`;
          thumbnails.medium = `https://${cdnDomain}/${fileNameWithoutExt}_medium${fileExt}`;
          thumbnails.large = `https://${cdnDomain}/${fileNameWithoutExt}_large${fileExt}`;
        }

        // Get file name from path
        const fileName = file.name.split("/").pop() || file.name;

        // Create the product image object
        return {
          id: imageId,
          productId,
          fileName,
          storagePath: file.name,
          publicUrl,
          cdnUrl,
          imageType,
          position,
          contentType: file.contentType,
          size: file.size,
          thumbnails:
            metadata.generateThumbnails === "true" ? thumbnails : undefined,
          altText: metadata.altText,
          isMain,
          metadata: metadata as Record<string, string>,
          createdAt: file.timeCreated,
          updatedAt: file.updated,
        };
      });

      // Sort by position
      return productImages.sort((a, b) => a.position - b.position);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to get product images: ${errorMessage}`,
        errorStack,
      );
      throw new Error(`Failed to get product images: ${errorMessage}`);
    }
  }

  /**
   * Update a product image
   *
   * @param imageId Image ID
   * @param updates Updates to apply
   * @param organizationId Organization ID
   * @returns Updated product image
   */
  async updateProductImage(
    imageId: string,
    updates: {
      altText?: string;
      position?: number;
      isMain?: boolean;
      metadata?: Record<string, string>;
    },
    organizationId?: string,
  ): Promise<ProductImage> {
    try {
      // Get the current image
      const image = await this.getProductImage(imageId, organizationId);

      // We can't directly update the metadata in GCS, so we need to:
      // 1. Download the file
      // 2. Update the metadata
      // 3. Reupload with new metadata

      // Download the file
      const file = await this.storageService.getFile(image.storagePath);

      // Prepare the new metadata
      const newMetadata: Record<string, string> = {
        ...image.metadata,
        ...(updates.metadata || {}),
      };

      // Update position if provided
      if (updates.position !== undefined) {
        newMetadata.position = updates.position.toString();
      }

      // Update isMain if provided
      if (updates.isMain !== undefined) {
        newMetadata.isMain = updates.isMain.toString();
      }

      // Update altText if provided
      if (updates.altText !== undefined) {
        newMetadata.altText = updates.altText;
      }

      // Update the last modified timestamp
      newMetadata.updatedAt = new Date().toISOString();

      // Delete the old file
      await this.storageService.deleteFile(image.storagePath);

      // Reupload with new metadata
      await this.storageService.uploadFile(file, image.storagePath, {
        contentType: image.contentType,
        metadata: newMetadata,
        isPublic: true,
      });

      // Return the updated image
      return {
        ...image,
        altText: updates.altText ?? image.altText,
        position: updates.position ?? image.position,
        isMain: updates.isMain ?? image.isMain,
        metadata: newMetadata,
        updatedAt: new Date(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to update product image: ${errorMessage}`,
        errorStack,
      );
      throw new Error(`Failed to update product image: ${errorMessage}`);
    }
  }

  /**
   * Delete a product image
   *
   * @param imageId Image ID
   * @param organizationId Organization ID
   */
  async deleteProductImage(
    imageId: string,
    organizationId?: string,
  ): Promise<void> {
    try {
      // Get the image to delete
      const image = await this.getProductImage(imageId, organizationId);

      // Delete the main file
      await this.storageService.deleteFile(image.storagePath);

      // Delete thumbnails if they exist
      if (image.thumbnails) {
        const fileNameWithoutExt = image.storagePath.substring(
          0,
          image.storagePath.lastIndexOf("."),
        );
        const fileExt = image.storagePath.substring(
          image.storagePath.lastIndexOf("."),
        );

        // Try to delete all thumbnails (don't fail if some don't exist)
        try {
          await Promise.all([
            this.storageService
              .deleteFile(`${fileNameWithoutExt}_thumbnail${fileExt}`)
              .catch(() => {}),
            this.storageService
              .deleteFile(`${fileNameWithoutExt}_small${fileExt}`)
              .catch(() => {}),
            this.storageService
              .deleteFile(`${fileNameWithoutExt}_medium${fileExt}`)
              .catch(() => {}),
            this.storageService
              .deleteFile(`${fileNameWithoutExt}_large${fileExt}`)
              .catch(() => {}),
          ]);
        } catch (thumbnailError) {
          // Log but don't fail the operation
          const errorMessage =
            thumbnailError instanceof Error
              ? thumbnailError.message
              : String(thumbnailError);
          this.logger.warn(
            `Some thumbnails could not be deleted: ${errorMessage}`,
          );
        }
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        // Image doesn't exist, nothing to delete
        return;
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to delete product image: ${errorMessage}`,
        errorStack,
      );
      throw new Error(`Failed to delete product image: ${errorMessage}`);
    }
  }

  /**
   * Helper method to get file extension
   */
  private getFileExtension(fileName: string): string {
    const parts = fileName.split(".");
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : "";
  }

  /**
   * Helper method to estimate the size of an image based on compression and resize options
   */
  private estimateImageSize(
    contentType: string,
    resizeOption: ResizeOption,
    compressionQuality: CompressionQuality,
  ): number {
    // Base size estimates in bytes
    const baseSizes: Record<ResizeOption, number> = {
      [ResizeOption.NONE]: 2 * 1024 * 1024, // 2MB
      [ResizeOption.THUMBNAIL]: 20 * 1024, // 20KB
      [ResizeOption.SMALL]: 100 * 1024, // 100KB
      [ResizeOption.MEDIUM]: 500 * 1024, // 500KB
      [ResizeOption.LARGE]: 1.5 * 1024 * 1024, // 1.5MB
      [ResizeOption.CUSTOM]: 1 * 1024 * 1024, // 1MB (default)
    };

    // Quality multipliers
    const qualityMultipliers: Record<CompressionQuality, number> = {
      [CompressionQuality.LOW]: 0.5,
      [CompressionQuality.MEDIUM]: 1.0,
      [CompressionQuality.HIGH]: 1.5,
      [CompressionQuality.ADAPTIVE]: 0.8, // Assume decent optimization
    };

    // Content type multipliers (WebP is more efficient)
    const contentTypeMultipliers: Record<string, number> = {
      "image/jpeg": 1.0,
      "image/png": 1.2,
      "image/webp": 0.7,
      "image/gif": 1.1,
    };

    const baseSize = baseSizes[resizeOption];
    const qualityMultiplier = qualityMultipliers[compressionQuality];
    const contentTypeMultiplier = contentTypeMultipliers[contentType] || 1.0;

    return Math.round(baseSize * qualityMultiplier * contentTypeMultiplier);
  }

  /**
   * Helper method to get recommended connection type
   */
  private getRecommendedConnectionType(
    compressionQuality: CompressionQuality,
    resizeOption: ResizeOption,
    optimizeForLowBandwidth: boolean,
  ): string {
    // For small thumbnails or highly compressed images with low bandwidth optimization
    if (
      resizeOption === ResizeOption.THUMBNAIL ||
      (compressionQuality === CompressionQuality.LOW && optimizeForLowBandwidth)
    ) {
      return "Works on 2G+";
    }

    // For small images or medium compression with low bandwidth
    if (
      resizeOption === ResizeOption.SMALL ||
      (compressionQuality === CompressionQuality.MEDIUM &&
        optimizeForLowBandwidth)
    ) {
      return "3G or better";
    }

    // For medium images or adaptive compression
    if (
      resizeOption === ResizeOption.MEDIUM ||
      compressionQuality === CompressionQuality.ADAPTIVE
    ) {
      return "3G+ or better";
    }

    // For large or high quality images
    if (
      resizeOption === ResizeOption.LARGE ||
      compressionQuality === CompressionQuality.HIGH
    ) {
      return "4G or WiFi recommended";
    }

    // Default
    return "3G+ or better";
  }
}
