import { CompressionQuality, ResizeOption } from '../models/image.model';

/**
 * Interface for image upload options in the PIM module
 */
export interface ImageUploadOptions {
  /**
   * ID of the product this image belongs to
   */
  productId: string;
  
  /**
   * Type of product image (main, gallery, variant)
   */
  imageType?: string;
  
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
   */
  networkQuality?: {
    connectionType?: string;
    connectionQuality?: string;
    quality?: string;
    loadSheddingStage?: number;
  };
  
  /**
   * Additional metadata to store with the image
   */
  metadata?: Record<string, string>;
}
