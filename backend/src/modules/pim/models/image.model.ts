/**
 * Enum for image compression quality
 */
export enum CompressionQuality {
  LOW = 'low', // High compression, low quality (smallest file size)
  MEDIUM = 'medium', // Medium compression and quality (balanced)
  HIGH = 'high', // Low compression, high quality (larger file size)
  ADAPTIVE = 'adaptive', // Adapts based on network conditions
}

/**
 * Enum for image resize options
 */
export enum ResizeOption {
  NONE = 'none', // No resizing
  THUMBNAIL = 'thumbnail', // Small thumbnail (150x150)
  SMALL = 'small', // Small image (300x300)
  MEDIUM = 'medium', // Medium image (600x600)
  LARGE = 'large', // Large image (1200x1200)
  CUSTOM = 'custom', // Custom dimensions
}

import { FirestoreEntityWithMetadata } from '../../../common/repositories/base/repository-types';

/**
 * Product image entity
 */
export interface ProductImage extends FirestoreEntityWithMetadata {
  /** Unique identifier */
  id: string;
  /** Soft delete flag */
  isDeleted: boolean;
  /** Version for optimistic locking */
  version: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Deletion timestamp (optional) */
  deletedAt?: Date | undefined;


  /**
   * ID of the product this image belongs to
   */
  productId: string;

  /**
   * Original filename
   */
  fileName: string;

  /**
   * Storage path in the bucket
   */
  storagePath: string;

  /**
   * CDN URL for the image
   */
  cdnUrl: string;

  /**
   * Public URL
   */
  publicUrl: string;

  /**
   * Type of image (main, gallery, variant)
   */
  imageType: string;

  /**
   * Display order position
   */
  position: number;

  /**
   * Content type (MIME type)
   */
  contentType: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * Width in pixels
   */
  width?: number;

  /**
   * Height in pixels
   */
  height?: number;

  /**
   * Thumbnail URLs for different sizes
   */
  thumbnails?: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };

  /**
   * Alt text for SEO
   */
  altText?: string;

  /**
   * Whether this is the main product image
   */
  isMain: boolean;

  /**
   * Network optimization information
   */
  networkOptimization?: {
    adaptiveCompression: boolean;
    lowBandwidthOptimized: boolean;
    estimatedSizeBytes?: number;
    recommendedConnectionType?: string;
  };

  /**
   * Additional metadata
   */
  metadata?: Record<string, string>;





  /**
   * Optional tags for the image
   */
  tags?: string[];

  /** Organization ID */
  organizationId: string;

  /** Tenant ID (optional) */
  tenantId?: string;
}
