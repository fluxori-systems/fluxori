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
import { ImageAnalysisService, ImageAttributeDetectionOptions } from '../services/image-analysis.service';
import { PimStorageService } from '../services/pim-storage.service';
import { NetworkAwareStorageService } from '../services/network-aware-storage.service';
import { CompressionQuality, ProductImage } from '../models/image.model';
import { ImageUploadOptions } from '../interfaces/image-upload-options.interface';

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
   * @param file File to upload
   * @param options Upload options
   * @param user Authenticated user
   */
  @Post('upload')
  async uploadImageWithAnalysis(
    @Body() data: {
      file: any;
      options: ImageUploadOptions & {
        analyzeImage?: boolean;
        generateAltText?: boolean;
        detectAttributes?: boolean;
        checkMarketplaceCompliance?: boolean;
        targetMarketplace?: string;
        productContext?: {
          name: string;
          category?: string;
          description?: string;
          attributes?: Record<string, any>;
        };
      };
    },
    @GetUser() user: User,
  ): Promise<ProductImage> {
    try {
      const { file, options } = data;
      const organizationId = user.organizationId;
      
      // Determine network-aware compression options
      const networkQuality = this.networkAwareStorageService.getNetworkQuality();
      const adaptiveCompression = options.compressionQuality === CompressionQuality.ADAPTIVE;
      
      let effectiveCompressionQuality = options.compressionQuality || CompressionQuality.MEDIUM;
      
      // Override compression based on network conditions if adaptive
      if (adaptiveCompression) {
        if (networkQuality.quality === 'low') {
          effectiveCompressionQuality = CompressionQuality.LOW;
        } else if (networkQuality.quality === 'medium') {
          effectiveCompressionQuality = CompressionQuality.MEDIUM;
        } else {
          effectiveCompressionQuality = CompressionQuality.HIGH;
        }
      }
      
      // Upload image with effective compression
      const uploadedImage = await this.pimStorageService.uploadProductImage(
        file,
        {
          ...options,
          compressionQuality: effectiveCompressionQuality,
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
        
        if (optimizationResult.success) {
          // Return the enhanced image with AI-generated metadata
          return optimizationResult.updatedImage;
        }
      }
      
      // Return the original image if no analysis was performed or analysis failed
      return uploadedImage;
    } catch (error) {
      throw new HttpException(
        `Failed to upload and analyze image: ${error.message}`,
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
      productContext: {
        name: string;
        category?: string;
        description?: string;
        attributes?: Record<string, any>;
      };
    },
    @GetUser() user: User,
  ) {
    try {
      const organizationId = user.organizationId;
      
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
      const analysisResult = await this.imageAnalysisService.analyzeProductImage(
        image.publicUrl,
        options.productContext,
        organizationId,
        user.uid,
        analysisOptions
      );
      
      return analysisResult;
    } catch (error) {
      throw new HttpException(
        `Failed to analyze image: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Generate SEO-friendly alt text for an image
   * 
   * @param imageId Image ID
   * @param productContext Product context for relevant alt text
   * @param user Authenticated user
   */
  @Post('generate-alt-text/:imageId')
  async generateAltText(
    @Param('imageId') imageId: string,
    @Body() data: {
      productContext: {
        name: string;
        category?: string;
        description?: string;
      };
    },
    @GetUser() user: User,
  ) {
    try {
      const organizationId = user.organizationId;
      
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
        };
      }
      
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to generate alt text: ${error.message}`,
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
   */
  @Get('marketplace-compliance/:imageId')
  async checkMarketplaceCompliance(
    @Param('imageId') imageId: string,
    @Query('marketplace') marketplace: string,
    @GetUser() user: User,
  ) {
    try {
      const organizationId = user.organizationId;
      
      // Get image by ID
      const image = await this.pimStorageService.getProductImage(imageId, organizationId);
      
      if (!image) {
        throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
      }
      
      // Check marketplace compliance
      return await this.imageAnalysisService.checkMarketplaceCompliance(
        image.publicUrl,
        marketplace || 'takealot', // Default to Takealot for South African market
        organizationId,
        user.uid
      );
    } catch (error) {
      throw new HttpException(
        `Failed to check marketplace compliance: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Assess image quality for e-commerce
   * 
   * @param imageId Image ID
   * @param user Authenticated user
   */
  @Get('quality-assessment/:imageId')
  async assessImageQuality(
    @Param('imageId') imageId: string,
    @GetUser() user: User,
  ) {
    try {
      const organizationId = user.organizationId;
      
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
      throw new HttpException(
        `Failed to assess image quality: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Select main product image from a set of product images
   * 
   * @param productId Product ID
   * @param productContext Product context for relevant selection
   * @param user Authenticated user
   */
  @Post('select-main-image/:productId')
  async selectMainProductImage(
    @Param('productId') productId: string,
    @Body() data: {
      productContext: {
        name: string;
        category?: string;
      };
    },
    @GetUser() user: User,
  ) {
    try {
      const organizationId = user.organizationId;
      
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
      
      if (result.success && result.mainImageIndex >= 0) {
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
      throw new HttpException(
        `Failed to select main product image: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Get adaptive compression settings based on network conditions
   */
  @Get('adaptive-compression-settings')
  async getAdaptiveCompressionSettings() {
    const networkQuality = this.networkAwareStorageService.getNetworkQuality();
    
    let recommendedSettings = {
      compressionQuality: CompressionQuality.MEDIUM,
      generateThumbnails: true,
      optimizeForLowBandwidth: false,
      networkQuality,
    };
    
    // Adjust settings based on network conditions
    if (networkQuality.quality === 'low') {
      recommendedSettings = {
        ...recommendedSettings,
        compressionQuality: CompressionQuality.LOW,
        optimizeForLowBandwidth: true,
      };
    } else if (networkQuality.quality === 'medium') {
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