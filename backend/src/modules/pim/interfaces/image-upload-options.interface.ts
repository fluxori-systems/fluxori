import { CompressionQuality, ResizeOption } from '../models/image.model';
import { NetworkQualityInfo } from './types';
import { NetworkStatus } from '../../../common/utils/network-status.service';

/**
 * Interface for image upload options in the PIM module
 * Optimized for South African market with network quality awareness
 */
export interface ImageUploadOptions {
  /**
   * ID of the product this image belongs to
   */
  productId: string;
  
  /**
   * Filename for the uploaded image
   */
  fileName?: string;
  
  /**
   * Content type of the image (e.g., image/jpeg)
   */
  contentType?: string;
  
  /**
   * Type of product image (main, gallery, variant)
   */
  imageType?: string;
  
  /**
   * Whether this is the main product image
   */
  isMain?: boolean;
  
  /**
   * Alt text for the image
   */
  altText?: string;
  
  /**
   * Position/order of the image in the product gallery
   */
  position?: number;
  
  /**
   * Compression quality to apply
   */
  compressionQuality?: CompressionQuality;
  
  /**
   * Whether to generate thumbnails automatically
   */
  generateThumbnails?: boolean;
  
  /**
   * Resize option to apply
   */
  resizeOption?: ResizeOption;
  
  /**
   * Width in pixels if using custom resize option
   */
  customWidth?: number;
  
  /**
   * Height in pixels if using custom resize option
   */
  customHeight?: number;
  
  /**
   * Whether this image should be optimized for low-bandwidth conditions
   */
  optimizeForLowBandwidth?: boolean;
  
  /**
   * South African market optimization: Whether to enable load shedding resilience
   * This will retry uploads during connection interruptions
   */
  enableLoadSheddingResilience?: boolean;
  
  /**
   * Network quality information for adaptive processing
   * Used for South African network-aware optimizations
   */
  networkQuality?: NetworkQualityInfo | NetworkStatus;
  
  /**
   * Additional metadata to store with the image
   */
  metadata?: Record<string, string>;
  
  /**
   * Organization ID
   */
  organizationId?: string;
}
