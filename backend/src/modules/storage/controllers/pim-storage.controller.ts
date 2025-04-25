/**
 * PIM Storage Controller
 *
 * Provides RESTful endpoints for PIM-specific storage operations
 * Optimized for South African market conditions with network-aware adaptations
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  UseInterceptors,
  NotFoundException,
  Query,
  Delete,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';

import { v4 as uuidv4 } from 'uuid';

import { LoggingInterceptor } from '../../../common/observability/interceptors/logging.interceptor';
import { TracingInterceptor } from '../../../common/observability/interceptors/tracing.interceptor';
import {
  StorageService,
  STORAGE_SERVICE,
} from '../../../common/storage/storage.interface';
import { User } from '../../../types/google-cloud.types';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import {
  ProductImageSignedUrlRequestDto,
  CompressionQuality,
  ResizeOption,
} from '../dto/signed-url-request.dto';
import { ProductImageSignedUrlResponseDto } from '../dto/signed-url-response.dto';

@ApiTags('pim-storage')
@Controller('pim/storage')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
@UseInterceptors(LoggingInterceptor, TracingInterceptor)
export class PimStorageController {
  private readonly logger = new Logger(PimStorageController.name);
  private readonly bucketName: string;
  private readonly cdnDomain: string;

  constructor(
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {
    this.bucketName =
      this.configService.get<string>('GCS_BUCKET_NAME') || 'fluxori-uploads';
    this.cdnDomain =
      this.configService.get<string>('CDN_DOMAIN') || 'cdn.fluxori.com';
  }

  /**
   * Generate a signed URL for uploading a product image directly to storage
   * Optimized for South African market with network-aware parameters
   */
  @Post('product-image/signed-upload-url')
  @ApiOperation({
    summary: 'Generate a signed URL for direct product image upload',
  })
  @ApiResponse({
    status: 201,
    description: 'Signed URL created',
    type: ProductImageSignedUrlResponseDto,
  })
  async generateProductImageSignedUploadUrl(
    @Body() dto: ProductImageSignedUrlRequestDto,
    @GetUser() user: User,
    @Req() req: any,
  ): Promise<ProductImageSignedUrlResponseDto> {
    // Validate file size if provided
    const maxSizeBytes =
      this.configService.get<number>('MAX_FILE_SIZE_BYTES') ||
      100 * 1024 * 1024; // 100MB default
    if (dto.fileSize && dto.fileSize > maxSizeBytes) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSizeBytes / (1024 * 1024)}MB`,
      );
    }

    // Check if it's a valid image type
    const validImageTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!validImageTypes.includes(dto.contentType)) {
      throw new BadRequestException(
        `Invalid image type: ${dto.contentType}. Allowed types: ${validImageTypes.join(', ')}`,
      );
    }

    // Set default values
    const imageType = dto.imageType || 'gallery';
    const position = dto.position || 0;
    const compressionQuality =
      dto.compressionQuality || CompressionQuality.ADAPTIVE;
    const generateThumbnails =
      dto.generateThumbnails !== undefined ? dto.generateThumbnails : true;
    const resizeOption = dto.resizeOption || ResizeOption.NONE;
    const optimizeForLowBandwidth =
      dto.optimizeForLowBandwidth !== undefined
        ? dto.optimizeForLowBandwidth
        : true;

    // Get connection quality from request headers if available
    // This allows client-side optimizations based on network conditions
    const connectionQuality = req.headers['x-connection-quality'] || 'unknown';
    const connectionType = req.headers['x-connection-type'] || 'unknown';
    const loadSheddingStage = req.headers['x-load-shedding-stage'] || '0';

    // Generate a unique upload ID
    const uploadId = uuidv4();

    // Adjust file path based on product ID and image type
    const fileName = `products/${dto.productId}/${imageType}/${position}_${uploadId}${this.getFileExtension(dto.fileName)}`;

    // Add all the metadata
    const metadata: Record<string, string> = {
      ...dto.metadata,
      uploadId,
      productId: dto.productId,
      imageType,
      position: position.toString(),
      compressionQuality,
      generateThumbnails: generateThumbnails.toString(),
      resizeOption,
      optimizeForLowBandwidth: optimizeForLowBandwidth.toString(),
      uploadedBy: user.uid,
      organizationId: user.organizationId || 'unknown',
      connectionQuality: connectionQuality as string,
      connectionType: connectionType as string,
      userRegion: req.headers['x-user-region'] || 'unknown',
      loadSheddingStage: loadSheddingStage as string,
    };

    try {
      // Call the storage service to generate the signed URL
      const result = await this.storageService.generateSignedUploadUrl({
        fileName,
        contentType: dto.contentType,
        expiresInMinutes: dto.expiresInMinutes,
        metadata,
      });

      // Calculate when the URL expires
      const expiresAt = new Date();
      expiresAt.setMinutes(
        expiresAt.getMinutes() + (dto.expiresInMinutes || 15),
      );

      // Generate the base public URL
      const basePublicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;

      // Generate the CDN URL
      const cdnUrl = `https://${this.cdnDomain}/${fileName}`;

      // Generate thumbnail URLs if requested
      const thumbnailUrls: Record<string, string> = {};
      if (generateThumbnails) {
        const fileNameWithoutExt = fileName.substring(
          0,
          fileName.lastIndexOf('.'),
        );
        const fileExt = fileName.substring(fileName.lastIndexOf('.'));

        thumbnailUrls.thumbnail = `https://${this.cdnDomain}/${fileNameWithoutExt}_thumbnail${fileExt}`;
        thumbnailUrls.small = `https://${this.cdnDomain}/${fileNameWithoutExt}_small${fileExt}`;
        thumbnailUrls.medium = `https://${this.cdnDomain}/${fileNameWithoutExt}_medium${fileExt}`;
        thumbnailUrls.large = `https://${this.cdnDomain}/${fileNameWithoutExt}_large${fileExt}`;
      }

      // Generate network optimization info
      const networkOptimization = {
        adaptiveCompression: compressionQuality === CompressionQuality.ADAPTIVE,
        lowBandwidthOptimized: optimizeForLowBandwidth,
        estimatedSizeBytes: this.estimateImageSize(
          dto.contentType,
          resizeOption,
          compressionQuality,
        ),
        recommendedConnectionType: this.getRecommendedConnectionType(
          compressionQuality,
          resizeOption,
          optimizeForLowBandwidth,
        ),
      };

      // Generate a webhook URL for notification when processing is complete
      const apiDomain =
        this.configService.get<string>('API_DOMAIN') || 'api.fluxori.com';
      const processingWebhookUrl = `https://${apiDomain}/webhooks/image-processed/${uploadId}`;

      // Return the enhanced response
      return {
        ...result,
        uploadId,
        publicUrl: basePublicUrl,
        cdnUrl,
        thumbnailUrls,
        expiresAt,
        networkOptimization,
        processingWebhookUrl,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to generate signed URL: ${error.message}`,
      );
    }
  }

  /**
   * Get all images for a product
   */
  @Get('product/:productId/images')
  @ApiOperation({ summary: 'List all images for a product' })
  @ApiResponse({ status: 200, description: 'List of product images' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by image type (main, gallery, variant)',
  })
  async getProductImages(
    @Param('productId') productId: string,
    @GetUser() user: User,
    @Query('type') type?: string,
  ): Promise<any[]> {
    try {
      // Construct the prefix for the GCS query
      const prefix = `products/${productId}/`;

      // Get all objects with this prefix
      const files = await this.storageService.listFiles(prefix);

      // Filter by type if provided
      const filteredFiles = type
        ? files.filter((file) => file.name.includes(`/${type}/`))
        : files;

      // Transform to a more friendly format
      const images = filteredFiles.map((file) => {
        const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${file.name}`;
        const cdnUrl = `https://${this.cdnDomain}/${file.name}`;

        // Extract metadata
        const metadata = file.metadata || {};

        // Parse position
        let position = 0;
        try {
          position = parseInt(String(metadata.position || '0'), 10);
        } catch (e) {
          // Default to 0 if parsing fails
        }

        return {
          id: metadata.uploadId || file.id,
          name: file.name.split('/').pop(),
          publicUrl,
          cdnUrl,
          contentType: file.contentType,
          size: file.size,
          metadata,
          imageType: metadata.imageType || 'unknown',
          position,
          uploadedAt: file.timeCreated,
          thumbnails: this.generateThumbnailUrls(file.name, this.cdnDomain),
        };
      });

      // Sort by position
      return images.sort((a, b) => a.position - b.position);
    } catch (error) {
      this.logger.error(
        `Failed to get product images: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to get product images: ${error.message}`,
      );
    }
  }

  /**
   * Delete a product image
   */
  @Delete('product/:productId/images/:imageId')
  @ApiOperation({ summary: 'Delete a product image' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  async deleteProductImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @GetUser() user: User,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // First, find the file by metadata.uploadId
      const prefix = `products/${productId}/`;
      const files = await this.storageService.listFiles(prefix);

      const file = files.find((f) => f.metadata?.uploadId === imageId);

      if (!file) {
        throw new NotFoundException(`Image not found with ID: ${imageId}`);
      }

      // Delete the main file
      await this.storageService.deleteFile(file.name);

      // Also delete thumbnails if they exist
      const fileNameWithoutExt = file.name.substring(
        0,
        file.name.lastIndexOf('.'),
      );
      const fileExt = file.name.substring(file.name.lastIndexOf('.'));

      try {
        // Try to delete thumbnails (but don't fail if they don't exist)
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
        this.logger.warn(
          `Some thumbnails could not be deleted: ${thumbnailError.message}`,
        );
      }

      return { success: true, message: 'Image deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete product image: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete product image: ${error.message}`,
      );
    }
  }

  /**
   * Helper method to get file extension
   */
  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
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
      'image/jpeg': 1.0,
      'image/png': 1.2,
      'image/webp': 0.7,
      'image/gif': 1.1,
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
      return 'Works on 2G+';
    }

    // For small images or medium compression with low bandwidth
    if (
      resizeOption === ResizeOption.SMALL ||
      (compressionQuality === CompressionQuality.MEDIUM &&
        optimizeForLowBandwidth)
    ) {
      return '3G or better';
    }

    // For medium images or adaptive compression
    if (
      resizeOption === ResizeOption.MEDIUM ||
      compressionQuality === CompressionQuality.ADAPTIVE
    ) {
      return '3G+ or better';
    }

    // For large or high quality images
    if (
      resizeOption === ResizeOption.LARGE ||
      compressionQuality === CompressionQuality.HIGH
    ) {
      return '4G or WiFi recommended';
    }

    // Default
    return '3G+ or better';
  }

  /**
   * Helper method to generate thumbnail URLs for a file
   */
  private generateThumbnailUrls(
    fileName: string,
    cdnDomain: string,
  ): Record<string, string> {
    const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const fileExt = fileName.substring(fileName.lastIndexOf('.'));

    return {
      thumbnail: `https://${cdnDomain}/${fileNameWithoutExt}_thumbnail${fileExt}`,
      small: `https://${cdnDomain}/${fileNameWithoutExt}_small${fileExt}`,
      medium: `https://${cdnDomain}/${fileNameWithoutExt}_medium${fileExt}`,
      large: `https://${cdnDomain}/${fileNameWithoutExt}_large${fileExt}`,
    };
  }
}
