import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../../types/google-cloud.types';
import { 
  ImageAnalysisResult, 
  ImageAnalysisService, 
  ImageAttributeDetectionOptions, 
  ProductContext 
} from '../services/image-analysis.service';
import { PimStorageService } from '../services/pim-storage.service';
import { NetworkAwareStorageService } from '../services/network-aware-storage.service';
import { CompressionQuality, ProductImage } from '../models/image.model';
import { ImageUploadOptions } from '../interfaces/image-upload-options.interface';
import { NetworkQualityInfo } from '../interfaces/types';
import { NetworkStatus } from '../../../common/utils/network-status.service';

/**
 * Advanced Image Controller
 * Provides endpoints for AI-powered image analysis and advanced image operations
 * Optimized for South African market with network-aware and load shedding resilient processing
 */
@Controller('pim/advanced-image')
@UseGuards(FirebaseAuthGuard)
export class AdvancedImageController {
  constructor(
    private readonly imageAnalysisService: ImageAnalysisService,
    private readonly pimStorageService: PimStorageService,
    private readonly networkAwareStorageService: NetworkAwareStorageService,
  ) {}

  /**
   * Upload an image with AI-powered metadata generation
   * 
   * @param data Upload data including file and options
   * @param user Authenticated user
   * @returns Product image with AI-enhanced metadata
   */
  @Post('upload')
  async uploadImageWithAnalysis(
    @Body() data: {
      file: Buffer;
      options: ImageUploadOptions & {
        analyzeImage?: boolean;
        generateAltText?: boolean;
        detectAttributes?: boolean;
        checkMarketplaceCompliance?: boolean;
        targetMarketplace?: string;
        productContext?: ProductContext;
      };
    },
    @GetUser() user: User,
  ): Promise<ProductImage> {
    try {
      const { file, options } = data;
      const organizationId = user.organizationId || '';
      
      // Determine network-aware compression options
      const networkQualityInfo = this.networkAwareStorageService.getNetworkQuality();
      const adaptiveCompression = options.compressionQuality === CompressionQuality.ADAPTIVE;
      
      // Convert NetworkQualityInfo to NetworkStatus
      const networkQuality: NetworkStatus = {
        connectionType: networkQualityInfo.connectionType || 'unknown',
        downloadSpeed: networkQualityInfo.downlink,
        uploadSpeed: undefined,
        latency: networkQualityInfo.rtt,
        isStable: true, // Default to true
        isSufficientBandwidth: networkQualityInfo.quality !== 'low',
        lastUpdated: new Date()
      };
      
      let effectiveCompressionQuality = options.compressionQuality || CompressionQuality.MEDIUM;
      
      // Override compression based on network conditions if adaptive
      if (adaptiveCompression) {
        if (networkQualityInfo.quality === 'low') {
          effectiveCompressionQuality = CompressionQuality.LOW;
        } else if (networkQualityInfo.quality === 'medium') {
          effectiveCompressionQuality = CompressionQuality.MEDIUM;
        } else {
          effectiveCompressionQuality = CompressionQuality.HIGH;
        }
      }
      
      // Upload image with effective compression
      const uploadedImage = await this.pimStorageService.uploadProductImage(
        file,
        {
          productId: options.productId,
          fileName: options.fileName || `product_${options.productId}_${Date.now()}.jpg`,
          contentType: options.contentType || 'image/jpeg',
          imageType: options.imageType,
          position: options.position,
          isMain: options.isMain,
          altText: options.altText,
          compressionQuality: effectiveCompressionQuality,
          resizeOption: options.resizeOption,
          generateThumbnails: options.generateThumbnails,
          optimizeForLowBandwidth: options.optimizeForLowBandwidth,
          metadata: options.metadata,
          organizationId: organizationId,
          networkQuality: networkQuality,
        }
      );
      
      // Check if AI analysis is requested
      if (options.analyzeImage && options.productContext) {
        // Perform AI analysis
        const analysisOptions: ImageAttributeDetectionOptions = {
          generateAltText: options.generateAltText !== false,
          includeColorAnalysis: true,
          checkMarketplaceCompliance: options.checkMarketplaceCompliance,
          targetMarketplace: options.targetMarketplace,
          includeQualityAssessment: true,
        };
        
        // Optimize image metadata based on analysis
        const optimizationResult = await this.imageAnalysisService.optimizeImageMetadata(
          uploadedImage,
          options.productContext,
          organizationId,
          user.uid
        );
        
        if (optimizationResult.success && optimizationResult.updatedImage) {
          // Return the enhanced image with AI-generated metadata
          return optimizationResult.updatedImage;
        }
      }
      
      // Return the original image if no analysis was performed or analysis failed
      return uploadedImage;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to upload and analyze image: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Analyze an existing product image
   * 
   * @param imageId Image ID to analyze
   * @param options Analysis options
   * @param user Authenticated user
   * @returns Image analysis result
   */
  @Post('analyze/:imageId')
  async analyzeExistingImage(
    @Param('imageId') imageId: string,
    @Body() options: {
      generateAltText?: boolean;
      detectAttributes?: string[];
      checkMarketplaceCompliance?: boolean;
      targetMarketplace?: string;
      includeColorAnalysis?: boolean;
      includeQualityAssessment?: boolean;
      productContext: ProductContext;
    },
    @GetUser() user: User,
  ): Promise<ImageAnalysisResult> {
    try {
      const organizationId = user.organizationId || '';
      
      // Get image by ID
      const image = await this.pimStorageService.getProductImage(imageId, organizationId);
      
      if (!image) {
        throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
      }
      
      // Create analysis options
      const analysisOptions: ImageAttributeDetectionOptions = {
        generateAltText: options.generateAltText !== false,
        attributes: options.detectAttributes,
        checkMarketplaceCompliance: options.checkMarketplaceCompliance,
        targetMarketplace: options.targetMarketplace,
        includeColorAnalysis: options.includeColorAnalysis !== false,
        includeQualityAssessment: options.includeQualityAssessment !== false,
      };
      
      // Analyze image
      return await this.imageAnalysisService.analyzeImage(
        image.publicUrl,
        options.productContext,
        organizationId,
        user.uid,
        analysisOptions
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to analyze image: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Generate SEO-friendly alt text for an image
   * 
   * @param imageId Image ID
   * @param data Request data containing product context
   * @param user Authenticated user
   * @returns Generated alt text result
   */
  @Post('generate-alt-text/:imageId')
  async generateAltText(
    @Param('imageId') imageId: string,
    @Body() data: {
      productContext: ProductContext;
    },
    @GetUser() user: User,
  ): Promise<{ 
    altText: string; 
    success: boolean; 
    error?: string; 
    image?: ProductImage;
    tokenUsage?: { 
      input: number; 
      output: number; 
      total: number;
    };
  }> {
    try {
      const organizationId = user.organizationId || '';
      
      // Get image by ID
      const image = await this.pimStorageService.getProductImage(imageId, organizationId);
      
      if (!image) {
        throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
      }
      
      // Generate alt text
      const result = await this.imageAnalysisService.generateAltText(
        image.publicUrl,
        data.productContext,
        organizationId,
        user.uid
      );
      
      if (result.success && result.altText) {
        // Update image with new alt text
        const updatedImage = await this.pimStorageService.updateProductImage(
          imageId,
          { altText: result.altText },
          organizationId
        );
        
        return {
          altText: result.altText,
          success: true,
          image: updatedImage,
          tokenUsage: result.tokenUsage,
        };
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to generate alt text: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Check if an image complies with marketplace requirements
   * 
   * @param imageId Image ID
   * @param marketplace Marketplace to check compliance for
   * @param user Authenticated user
   * @returns Marketplace compliance result
   */
  @Get('marketplace-compliance/:imageId')
  async checkMarketplaceCompliance(
    @Param('imageId') imageId: string,
    @Query('marketplace') marketplace: string,
    @GetUser() user: User,
  ): Promise<{ 
    compliant: boolean; 
    issues?: string[]; 
    success: boolean; 
    error?: string; 
    tokenUsage?: { 
      input: number; 
      output: number; 
      total: number; 
    };
  }> {
    try {
      const organizationId = user.organizationId || '';
      
      // Get image by ID
      const image = await this.pimStorageService.getProductImage(imageId, organizationId);
      
      if (!image) {
        throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
      }
      
      // Check marketplace compliance - using analyzeImage with specific options
      const analysisResult = await this.imageAnalysisService.analyzeImage(
        image.publicUrl,
        { name: 'Product' }, // Minimal context
        organizationId,
        user.uid,
        {
          checkMarketplaceCompliance: true,
          targetMarketplace: marketplace || 'takealot', // Default to Takealot for South African market
        }
      );
      
      return {
        compliant: analysisResult.marketplaceCompliance?.compliant || false,
        issues: analysisResult.marketplaceCompliance?.issues,
        success: analysisResult.success,
        error: analysisResult.error,
        tokenUsage: analysisResult.tokenUsage
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to check marketplace compliance: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Assess image quality for e-commerce
   * 
   * @param imageId Image ID
   * @param user Authenticated user
   * @returns Image quality assessment result
   */
  @Get('quality-assessment/:imageId')
  async assessImageQuality(
    @Param('imageId') imageId: string,
    @GetUser() user: User,
  ): Promise<{ 
    quality: any; 
    success: boolean; 
    error?: string; 
    tokenUsage?: { 
      input: number; 
      output: number; 
      total: number; 
    };
  }> {
    try {
      const organizationId = user.organizationId || '';
      
      // Get image by ID
      const image = await this.pimStorageService.getProductImage(imageId, organizationId);
      
      if (!image) {
        throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
      }
      
      // Assess image quality
      return await this.imageAnalysisService.assessImageQuality(
        image.publicUrl,
        organizationId,
        user.uid
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to assess image quality: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Select main product image from a set of product images
   * 
   * @param productId Product ID
   * @param data Request data containing product context
   * @param user Authenticated user
   * @returns Main image selection result
   */
  @Post('select-main-image/:productId')
  async selectMainProductImage(
    @Param('productId') productId: string,
    @Body() data: {
      productContext: ProductContext;
    },
    @GetUser() user: User,
  ): Promise<{
    success: boolean;
    mainImageIndex?: number;
    mainImage?: ProductImage;
    error?: string;
  }> {
    try {
      const organizationId = user.organizationId || '';
      
      // Get all product images
      const images = await this.pimStorageService.getProductImages(productId, organizationId);
      
      if (!images || images.length === 0) {
        throw new HttpException('No images found for this product', HttpStatus.NOT_FOUND);
      }
      
      // Identify main image
      const result = await this.imageAnalysisService.identifyMainProductImage(
        images,
        data.productContext,
        organizationId,
        user.uid
      );
      
      if (result.success && result.mainImageIndex !== undefined && result.mainImageIndex >= 0) {
        // Get the selected image
        const mainImage = images[result.mainImageIndex];
        
        // Update all images to ensure only one is marked as main
        await Promise.all(
          images.map((image, index) => 
            this.pimStorageService.updateProductImage(
              image.id,
              { isMain: index === result.mainImageIndex },
              organizationId
            )
          )
        );
        
        return {
          ...result,
          mainImage,
        };
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to select main product image: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Get adaptive compression settings based on network conditions
   * 
   * @returns Recommended compression settings based on current network quality
   */
  @Get('adaptive-compression-settings')
  async getAdaptiveCompressionSettings(): Promise<{
    compressionQuality: CompressionQuality;
    generateThumbnails: boolean;
    optimizeForLowBandwidth: boolean;
    networkQuality: NetworkQualityInfo;
  }> {
    const networkQualityInfo = this.networkAwareStorageService.getNetworkQuality();
    
    let recommendedSettings = {
      compressionQuality: CompressionQuality.MEDIUM,
      generateThumbnails: true,
      optimizeForLowBandwidth: false,
      networkQuality: networkQualityInfo,
    };
    
    // Adjust settings based on network conditions
    if (networkQualityInfo.quality === 'low') {
      recommendedSettings = {
        ...recommendedSettings,
        compressionQuality: CompressionQuality.LOW,
        optimizeForLowBandwidth: true,
      };
    } else if (networkQualityInfo.quality === 'medium') {
      recommendedSettings = {
        ...recommendedSettings,
        compressionQuality: CompressionQuality.MEDIUM,
        optimizeForLowBandwidth: true,
      };
    } else {
      recommendedSettings = {
        ...recommendedSettings,
        compressionQuality: CompressionQuality.HIGH,
        optimizeForLowBandwidth: false,
      };
    }
    
    return recommendedSettings;
  }
}