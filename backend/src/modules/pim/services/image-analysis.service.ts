import { Injectable, Logger, Optional } from '@nestjs/common';
import { AgentService } from '../../agent-framework';
import { CreditSystemService } from '../../credit-system';
import { FeatureFlagService } from '../../feature-flags';
import { CreditUsageType } from '../../credit-system/interfaces/types';
import { ModelRegistryRepository } from '../../agent-framework/repositories/model-registry.repository';
import { TokenEstimator } from '../../agent-framework/utils/token-estimator';
import { ConfigService } from '@nestjs/config';
import { LoadSheddingResilienceService } from './load-shedding-resilience.service';
import { StorageInterface } from '../../common/storage/storage.interface';
import { NetworkAwareStorageService } from './network-aware-storage.service';
import { ProductImage } from '../models/image.model';

/**
 * Interface for image analysis result
 */
export interface ImageAnalysisResult {
  /**
   * Success status of analysis
   */
  success: boolean;
  
  /**
   * Alternative text for the image
   */
  altText?: string;
  
  /**
   * Tags/keywords for the image
   */
  tags?: string[];
  
  /**
   * Color analysis
   */
  colors?: {
    /**
     * Dominant colors in the image with percentage
     */
    dominant: Array<{ color: string; hex: string; percentage: number }>;
    
    /**
     * Background color
     */
    background?: string;
    
    /**
     * Foreground color
     */
    foreground?: string;
  };
  
  /**
   * Content classification
   */
  classification?: {
    /**
     * General classification of image content
     */
    general: string;
    
    /**
     * Confidence score (0-100)
     */
    confidence: number;
    
    /**
     * Categories for the image
     */
    categories: Array<{ name: string; confidence: number }>;
  };
  
  /**
   * Detected attributes
   */
  attributes?: Record<string, string | number | boolean>;
  
  /**
   * Image quality assessment
   */
  quality?: {
    /**
     * Overall score (0-100)
     */
    score: number;
    
    /**
     * Sharpness score (0-100)
     */
    sharpness: number;
    
    /**
     * Brightness score (0-100)
     */
    brightness: number;
    
    /**
     * Contrast score (0-100)
     */
    contrast: number;
    
    /**
     * Noise level (0-100)
     */
    noise: number;
    
    /**
     * Resolution assessment
     */
    resolution: 'low' | 'medium' | 'high';
  };
  
  /**
   * Marketplace compliance issues
   */
  marketplaceCompliance?: {
    /**
     * Whether image complies with marketplace requirements
     */
    compliant: boolean;
    
    /**
     * Specific marketplace (Takealot, etc.)
     */
    marketplace?: string;
    
    /**
     * Issues with compliance
     */
    issues?: string[];
    
    /**
     * Improvement suggestions
     */
    suggestions?: string[];
  };
  
  /**
   * Token usage statistics
   */
  tokenUsage?: {
    /**
     * Input tokens used
     */
    input: number;
    
    /**
     * Output tokens used
     */
    output: number;
    
    /**
     * Total tokens used
     */
    total: number;
  };
}

/**
 * Options for image attribute detection
 */
export interface ImageAttributeDetectionOptions {
  /**
   * Specific attributes to detect
   */
  attributes?: string[];
  
  /**
   * Whether to include color analysis
   */
  includeColorAnalysis?: boolean;
  
  /**
   * Whether to check marketplace compliance
   */
  checkMarketplaceCompliance?: boolean;
  
  /**
   * Target marketplace for compliance check
   */
  targetMarketplace?: string;
  
  /**
   * Whether to include image quality assessment
   */
  includeQualityAssessment?: boolean;
  
  /**
   * Whether to generate alt text
   */
  generateAltText?: boolean;
  
  /**
   * Model to use for analysis
   */
  modelId?: string;
}

/**
 * Service for analyzing product images using AI
 * Optimized for South African market with load shedding resilience
 */
@Injectable()
export class ImageAnalysisService {
  private readonly logger = new Logger(ImageAnalysisService.name);
  private readonly defaultImageModelId: string;
  
  constructor(
    @Optional() private readonly agentService: AgentService,
    @Optional() private readonly creditSystemService: CreditSystemService,
    @Optional() private readonly featureFlagService: FeatureFlagService,
    @Optional() private readonly modelRegistryRepository: ModelRegistryRepository,
    @Optional() private readonly tokenEstimator: TokenEstimator,
    private readonly configService: ConfigService,
    private readonly loadSheddingService: LoadSheddingResilienceService,
    private readonly networkAwareStorageService: NetworkAwareStorageService,
  ) {
    this.defaultImageModelId = this.configService.get<string>('DEFAULT_VISION_MODEL_ID') || 'gpt-4o';
  }
  
  /**
   * Analyze a product image to detect attributes, generate tags, and assess quality
   * @param imageUrl URL of the image to analyze
   * @param productContext Product context to improve analysis relevance
   * @param organizationId Organization ID for credit tracking
   * @param userId User ID for credit tracking
   * @param options Analysis options
   */
  async analyzeProductImage(
    imageUrl: string,
    productContext: {
      name: string;
      category?: string;
      description?: string;
      attributes?: Record<string, any>;
    },
    organizationId: string,
    userId: string,
    options: ImageAttributeDetectionOptions = {}
  ): Promise<ImageAnalysisResult> {
    try {
      // Check if feature is enabled
      if (this.featureFlagService) {
        const featureEnabled = await this.featureFlagService.isEnabled(
          'pim.ai.image-analysis',
          organizationId
        );
        
        if (!featureEnabled) {
          this.logger.warn('Image analysis feature is disabled');
          return { success: false };
        }
      }
      
      // Check if we're in severe load shedding
      if (this.loadSheddingService) {
        const loadSheddingStatus = await this.loadSheddingService.getCurrentStatus();
        
        // Skip image analysis during severe load shedding (stage 4+)
        if (loadSheddingStatus && loadSheddingStatus.currentStage >= 4) {
          this.logger.warn('Skipping image analysis due to severe load shedding');
          return { 
            success: false,
            marketplaceCompliance: {
              compliant: false,
              issues: ['Analysis skipped due to severe load shedding']
            }
          };
        }
      }
      
      // Check if agent service is available
      if (!this.agentService) {
        this.logger.error('Agent service not available for image analysis');
        return { success: false };
      }
      
      // Get model to use for analysis
      const modelId = options.modelId || this.defaultImageModelId;
      
      // Get model information
      let model;
      if (this.modelRegistryRepository) {
        model = await this.modelRegistryRepository.findById(modelId);
        if (!model) {
          this.logger.warn(`Model ${modelId} not found in registry, using default settings`);
          model = { id: modelId, provider: 'unknown', capabilities: ['vision'] };
        }
        
        // Check if model supports image analysis
        if (!model.capabilities?.includes('vision')) {
          this.logger.error(`Model ${modelId} does not support vision capabilities`);
          return { success: false };
        }
      }
      
      // Estimate token usage - for vision models this is approximate
      let estimatedInputTokens = 300; // Base prompt size
      let estimatedOutputTokens = 800; // Base response size
      
      // Additional tokens for options
      if (options.includeColorAnalysis) estimatedOutputTokens += 200;
      if (options.checkMarketplaceCompliance) estimatedOutputTokens += 300;
      if (options.includeQualityAssessment) estimatedOutputTokens += 250;
      if (options.generateAltText) estimatedOutputTokens += 150;
      
      // Check credit availability if credit system is available
      let creditCheck;
      if (this.creditSystemService) {
        creditCheck = await this.creditSystemService.checkCredits({
          organizationId,
          userId,
          expectedInputTokens: estimatedInputTokens,
          expectedOutputTokens: estimatedOutputTokens,
          modelId: model?.id || modelId,
          usageType: CreditUsageType.IMAGE_ANALYSIS,
          operationId: `image-analysis-${Date.now()}`,
        });
        
        if (!creditCheck.hasCredits) {
          this.logger.warn('Insufficient credits for image analysis');
          return { success: false };
        }
      }
      
      // Construct system prompt based on options
      const systemPrompt = this.constructImageAnalysisPrompt(productContext, options);
      
      // Create a conversation with AI with the system prompt
      const conversation = await this.agentService.createConversation({
        organizationId,
        userId,
        modelId: model?.id || modelId,
        systemPrompt,
      });
      
      // Send the image URL as a message with image content type
      const startTime = Date.now();
      const response = await this.agentService.sendMessage(
        conversation.id,
        this.constructImageMessage(imageUrl, productContext)
      );
      const processingTime = Date.now() - startTime;
      
      // Parse the response
      let result: any;
      try {
        result = JSON.parse(response.content);
      } catch (e) {
        this.logger.error(`Failed to parse image analysis result: ${e.message}`);
        result = {};
      }
      
      // Record credit usage if credit system is available
      if (this.creditSystemService && creditCheck) {
        await this.creditSystemService.recordUsage({
          organizationId,
          userId,
          reservationId: creditCheck.reservationId,
          actualInputTokens: response.usage?.promptTokens || estimatedInputTokens,
          actualOutputTokens: response.usage?.completionTokens || estimatedOutputTokens,
          modelId: model?.id || modelId,
          modelProvider: model?.provider || 'unknown',
          processingTimeMs: processingTime,
          success: true,
        });
      }
      
      // Construct and return the result
      return {
        success: true,
        altText: result.altText,
        tags: result.tags,
        colors: result.colors,
        classification: result.classification,
        attributes: result.attributes,
        quality: result.quality,
        marketplaceCompliance: result.marketplaceCompliance,
        tokenUsage: response.usage ? {
          input: response.usage.promptTokens,
          output: response.usage.completionTokens,
          total: response.usage.totalTokens,
        } : undefined,
      };
    } catch (error) {
      this.logger.error(`Error analyzing product image: ${error.message}`, error.stack);
      return { success: false };
    }
  }
  
  /**
   * Analyze multiple product images for a product
   * @param images Array of image URLs to analyze
   * @param productContext Product context for analysis
   * @param organizationId Organization ID for credit tracking
   * @param userId User ID for credit tracking
   * @param options Analysis options
   */
  async analyzeMultipleProductImages(
    images: string[],
    productContext: {
      name: string;
      category?: string;
      description?: string;
      attributes?: Record<string, any>;
    },
    organizationId: string,
    userId: string,
    options: ImageAttributeDetectionOptions = {}
  ): Promise<Array<ImageAnalysisResult>> {
    try {
      // Use load shedding resilience for batch processing
      return await this.loadSheddingService.executeBatchWithResilience(
        images,
        async (imageUrl) => {
          return this.analyzeProductImage(
            imageUrl,
            productContext,
            organizationId,
            userId,
            options
          );
        },
        {
          batchSize: 3, // Process 3 images at a time
          pauseAfterBatch: 1000, // Wait 1 second between batches
          retryCount: 2, // Retry failed analyses twice
          retryDelay: 5000, // Wait 5 seconds before retrying
        }
      );
    } catch (error) {
      this.logger.error(`Error batch analyzing product images: ${error.message}`, error.stack);
      return images.map(() => ({ success: false }));
    }
  }
  
  /**
   * Check if an image complies with marketplace requirements
   * @param imageUrl URL of the image to check
   * @param marketplace Marketplace to check compliance for (e.g., "takealot")
   * @param organizationId Organization ID for credit tracking
   * @param userId User ID for credit tracking
   */
  async checkMarketplaceCompliance(
    imageUrl: string,
    marketplace: string,
    organizationId: string,
    userId: string
  ): Promise<{
    compliant: boolean;
    issues: string[];
    suggestions: string[];
    success: boolean;
    tokenUsage?: { input: number; output: number; total: number };
  }> {
    try {
      // Use basic analysis with marketplace compliance option
      const result = await this.analyzeProductImage(
        imageUrl,
        { name: 'Product' }, // Minimal context
        organizationId,
        userId,
        {
          checkMarketplaceCompliance: true,
          targetMarketplace: marketplace,
          includeQualityAssessment: true,
          generateAltText: false,
          includeColorAnalysis: false,
        }
      );
      
      if (!result.success) {
        return {
          compliant: false,
          issues: ['Analysis failed'],
          suggestions: [],
          success: false,
        };
      }
      
      return {
        compliant: result.marketplaceCompliance?.compliant ?? false,
        issues: result.marketplaceCompliance?.issues ?? [],
        suggestions: result.marketplaceCompliance?.suggestions ?? [],
        success: true,
        tokenUsage: result.tokenUsage,
      };
    } catch (error) {
      this.logger.error(`Error checking marketplace compliance: ${error.message}`, error.stack);
      return {
        compliant: false,
        issues: ['Error analyzing image'],
        suggestions: [],
        success: false,
      };
    }
  }
  
  /**
   * Generate SEO-friendly alt text for a product image
   * @param imageUrl URL of the image
   * @param productContext Product context for relevant alt text
   * @param organizationId Organization ID for credit tracking 
   * @param userId User ID for credit tracking
   */
  async generateAltText(
    imageUrl: string,
    productContext: {
      name: string;
      category?: string;
      description?: string;
    },
    organizationId: string,
    userId: string
  ): Promise<{
    altText: string;
    success: boolean;
    tokenUsage?: { input: number; output: number; total: number };
  }> {
    try {
      // Use basic analysis with alt text generation option
      const result = await this.analyzeProductImage(
        imageUrl,
        productContext,
        organizationId,
        userId,
        {
          generateAltText: true,
          includeColorAnalysis: false,
          includeQualityAssessment: false,
          checkMarketplaceCompliance: false,
        }
      );
      
      if (!result.success) {
        return {
          altText: '',
          success: false,
        };
      }
      
      return {
        altText: result.altText || '',
        success: true,
        tokenUsage: result.tokenUsage,
      };
    } catch (error) {
      this.logger.error(`Error generating alt text: ${error.message}`, error.stack);
      return {
        altText: '',
        success: false,
      };
    }
  }
  
  /**
   * Assess and score image quality for e-commerce use
   * @param imageUrl URL of the image to assess
   * @param organizationId Organization ID for credit tracking
   * @param userId User ID for credit tracking
   */
  async assessImageQuality(
    imageUrl: string,
    organizationId: string,
    userId: string
  ): Promise<{
    qualityScore: number;
    sharpness: number;
    brightness: number;
    contrast: number;
    noise: number;
    resolution: 'low' | 'medium' | 'high';
    issues: string[];
    suggestions: string[];
    success: boolean;
    tokenUsage?: { input: number; output: number; total: number };
  }> {
    try {
      // Use basic analysis with quality assessment option
      const result = await this.analyzeProductImage(
        imageUrl,
        { name: 'Product' }, // Minimal context
        organizationId,
        userId,
        {
          includeQualityAssessment: true,
          generateAltText: false,
          includeColorAnalysis: false,
          checkMarketplaceCompliance: false,
        }
      );
      
      if (!result.success || !result.quality) {
        return {
          qualityScore: 0,
          sharpness: 0,
          brightness: 0,
          contrast: 0,
          noise: 0,
          resolution: 'low',
          issues: ['Analysis failed'],
          suggestions: [],
          success: false,
        };
      }
      
      return {
        qualityScore: result.quality.score,
        sharpness: result.quality.sharpness,
        brightness: result.quality.brightness,
        contrast: result.quality.contrast,
        noise: result.quality.noise,
        resolution: result.quality.resolution,
        issues: result.marketplaceCompliance?.issues ?? [],
        suggestions: result.marketplaceCompliance?.suggestions ?? [],
        success: true,
        tokenUsage: result.tokenUsage,
      };
    } catch (error) {
      this.logger.error(`Error assessing image quality: ${error.message}`, error.stack);
      return {
        qualityScore: 0,
        sharpness: 0,
        brightness: 0,
        contrast: 0,
        noise: 0,
        resolution: 'low',
        issues: ['Error analyzing image'],
        suggestions: [],
        success: false,
      };
    }
  }
  
  /**
   * Optimize product image metadata by analyzing the image
   * @param productImage Product image to optimize
   * @param productContext Product context for relevant metadata
   * @param organizationId Organization ID for credit tracking
   * @param userId User ID for credit tracking
   */
  async optimizeImageMetadata(
    productImage: ProductImage,
    productContext: {
      name: string;
      category?: string;
      description?: string;
      attributes?: Record<string, any>;
    },
    organizationId: string,
    userId: string
  ): Promise<{
    updatedImage: ProductImage;
    success: boolean;
    tokenUsage?: { input: number; output: number; total: number };
  }> {
    try {
      // Skip if image already has alt text and metadata
      if (productImage.altText && productImage.metadata && Object.keys(productImage.metadata).length > 3) {
        this.logger.log('Image already has alt text and metadata, skipping optimization');
        return {
          updatedImage: productImage,
          success: true,
        };
      }
      
      // Use network-aware image URL
      const imageUrl = this.getImageUrl(productImage);
      
      // Analyze the image with comprehensive options
      const result = await this.analyzeProductImage(
        imageUrl,
        productContext,
        organizationId,
        userId,
        {
          generateAltText: !productImage.altText, // Only if missing
          includeColorAnalysis: true,
          attributes: ['material', 'pattern', 'style', 'shape', 'color'], // Common product attributes
        }
      );
      
      if (!result.success) {
        return {
          updatedImage: productImage,
          success: false,
        };
      }
      
      // Update image with analysis results
      const updatedImage = { ...productImage };
      
      // Add alt text if generated
      if (result.altText && !productImage.altText) {
        updatedImage.altText = result.altText;
      }
      
      // Add or update metadata
      updatedImage.metadata = {
        ...updatedImage.metadata,
        ...(result.attributes || {}),
      };
      
      // Add tags as metadata
      if (result.tags && result.tags.length) {
        updatedImage.metadata.tags = result.tags.join(',');
      }
      
      // Add dominant color information
      if (result.colors?.dominant && result.colors.dominant.length) {
        updatedImage.metadata.dominantColor = result.colors.dominant[0].hex;
        updatedImage.metadata.colorPalette = result.colors.dominant
          .slice(0, 3)
          .map(c => c.hex)
          .join(',');
      }
      
      // Add classification information
      if (result.classification?.general) {
        updatedImage.metadata.classification = result.classification.general;
      }
      
      return {
        updatedImage,
        success: true,
        tokenUsage: result.tokenUsage,
      };
    } catch (error) {
      this.logger.error(`Error optimizing image metadata: ${error.message}`, error.stack);
      return {
        updatedImage: productImage,
        success: false,
      };
    }
  }
  
  /**
   * Identify the main product image from a set of images
   * @param images Array of product images
   * @param productContext Product context
   * @param organizationId Organization ID for credit tracking
   * @param userId User ID for credit tracking
   */
  async identifyMainProductImage(
    images: ProductImage[],
    productContext: {
      name: string;
      category?: string;
    },
    organizationId: string,
    userId: string
  ): Promise<{
    mainImageIndex: number;
    reasons: string[];
    success: boolean;
    tokenUsage?: { input: number; output: number; total: number };
  }> {
    try {
      // Check if we have images
      if (!images.length) {
        return {
          mainImageIndex: -1,
          reasons: ['No images provided'],
          success: false,
        };
      }
      
      // If only one image, it's the main one
      if (images.length === 1) {
        return {
          mainImageIndex: 0,
          reasons: ['Only one image available'],
          success: true,
        };
      }
      
      // If there's already an image marked as main, use it
      const existingMainIndex = images.findIndex(img => img.isMain);
      if (existingMainIndex !== -1) {
        return {
          mainImageIndex: existingMainIndex,
          reasons: ['Image already marked as main'],
          success: true,
        };
      }
      
      // Check feature flag if available
      if (this.featureFlagService) {
        const featureEnabled = await this.featureFlagService.isEnabled(
          'pim.ai.main-image-selection',
          organizationId
        );
        
        if (!featureEnabled) {
          // Default to first image if feature disabled
          return {
            mainImageIndex: 0,
            reasons: ['Automated selection disabled, using first image'],
            success: true,
          };
        }
      }
      
      // Check if agent service is available
      if (!this.agentService) {
        // Default to first image if agent not available
        return {
          mainImageIndex: 0,
          reasons: ['AI service unavailable, using first image'],
          success: true,
        };
      }
      
      // Get network-aware URLs for all images
      const imageUrls = images.map(img => this.getImageUrl(img));
      
      // Get model to use
      const modelId = this.defaultImageModelId;
      
      // Construct the prompt
      const systemPrompt = this.constructMainImageSelectionPrompt(productContext);
      
      // Create a conversation with AI
      const conversation = await this.agentService.createConversation({
        organizationId,
        userId,
        modelId,
        systemPrompt,
      });
      
      // Send the message with all image URLs
      const startTime = Date.now();
      const response = await this.agentService.sendMessage(
        conversation.id,
        this.constructMultiImageMessage(imageUrls, productContext)
      );
      const processingTime = Date.now() - startTime;
      
      // Parse the response
      let result: any;
      try {
        result = JSON.parse(response.content);
      } catch (e) {
        this.logger.error(`Failed to parse main image selection result: ${e.message}`);
        // Default to first image on error
        return {
          mainImageIndex: 0,
          reasons: ['Error parsing analysis, using first image'],
          success: false,
        };
      }
      
      // Record credit usage if credit system is available
      if (this.creditSystemService) {
        await this.creditSystemService.recordUsage({
          organizationId,
          userId,
          reservationId: '', // No reservation for this operation
          actualInputTokens: response.usage?.promptTokens || 500,
          actualOutputTokens: response.usage?.completionTokens || 300,
          modelId,
          modelProvider: 'unknown',
          processingTimeMs: processingTime,
          success: true,
        });
      }
      
      // Determine main image index
      let mainImageIndex = 0; // Default to first image
      
      if (typeof result.selectedIndex === 'number' && 
          result.selectedIndex >= 0 && 
          result.selectedIndex < images.length) {
        mainImageIndex = result.selectedIndex;
      }
      
      return {
        mainImageIndex,
        reasons: result.reasons || ['No specific reasons provided'],
        success: true,
        tokenUsage: response.usage ? {
          input: response.usage.promptTokens,
          output: response.usage.completionTokens,
          total: response.usage.totalTokens,
        } : undefined,
      };
    } catch (error) {
      this.logger.error(`Error identifying main product image: ${error.message}`, error.stack);
      return {
        mainImageIndex: 0, // Default to first image on error
        reasons: ['Error during analysis, using first image as default'],
        success: false,
      };
    }
  }
  
  /**
   * Construct the system prompt for image analysis
   * @param productContext Product context for analysis
   * @param options Analysis options
   */
  private constructImageAnalysisPrompt(
    productContext: {
      name: string;
      category?: string;
      description?: string;
      attributes?: Record<string, any>;
    },
    options: ImageAttributeDetectionOptions
  ): string {
    let prompt = `You are an expert e-commerce product image analyzer with specialization in South African retail markets.
Your task is to analyze product images and extract useful information from them.

PRODUCT CONTEXT:
- Product name: ${productContext.name}${productContext.category ? `\n- Product category: ${productContext.category}` : ''}${productContext.description ? `\n- Product description: ${productContext.description}` : ''}

INSTRUCTIONS:
- Analyze the product image provided carefully
- Provide detailed analysis based on what is visible in the image
- Be specific and factual, only describe what you can actually see`;

    // Add options-specific instructions
    if (options.generateAltText) {
      prompt += `
- Generate an SEO-friendly alt text for the image (descriptive but concise, max 100 characters)
- Make sure alt text is descriptive and focused on the product's key features`;
    }

    if (options.includeColorAnalysis) {
      prompt += `
- Analyze the dominant colors present in the image
- Identify the background and foreground colors if possible
- Report colors with their descriptive names and hex codes
- Calculate approximate percentage for dominant colors`;
    }

    if (options.attributes && options.attributes.length) {
      prompt += `
- Detect the following specific attributes in the image: ${options.attributes.join(', ')}
- Only include attributes you can confidently identify from the image`;
    }

    if (options.includeQualityAssessment) {
      prompt += `
- Assess the image quality for e-commerce use
- Score sharpness, brightness, contrast, and noise levels
- Identify any quality issues that might affect sales conversion
- Suggest improvements for better product presentation`;
    }

    if (options.checkMarketplaceCompliance) {
      prompt += `
- Evaluate if the image meets ${options.targetMarketplace || 'e-commerce marketplace'} requirements`;
      
      // Add marketplace-specific guidelines
      if (options.targetMarketplace?.toLowerCase() === 'takealot') {
        prompt += `
- Check against Takealot's image guidelines:
  - Must have white/plain background
  - Product should fill at least 85% of the frame
  - Image must be at least 1000x1000 pixels
  - No watermarks, logos, or text overlays
  - No promotional elements or badges
  - Must show the actual product (not illustrations unless it's art)`;
      }
    }

    // Output format instructions
    prompt += `
OUTPUT FORMAT:
Provide your analysis as JSON with the following structure:
{
  ${options.generateAltText ? `"altText": "Descriptive alt text for the image",` : ''}
  "tags": ["tag1", "tag2", "tag3"],
  ${options.includeColorAnalysis ? `"colors": {
    "dominant": [
      {"color": "color name", "hex": "#hexcode", "percentage": 45},
      {"color": "color name", "hex": "#hexcode", "percentage": 30}
    ],
    "background": "color name",
    "foreground": "color name"
  },` : ''}
  "classification": {
    "general": "general description of what's in the image",
    "confidence": 95,
    "categories": [
      {"name": "category1", "confidence": 90},
      {"name": "category2", "confidence": 75}
    ]
  },
  ${options.attributes && options.attributes.length ? `"attributes": {
    ${options.attributes.map(attr => `"${attr}": "value"`).join(',\n    ')}
  },` : ''}
  ${options.includeQualityAssessment ? `"quality": {
    "score": 85,
    "sharpness": 90,
    "brightness": 80,
    "contrast": 85,
    "noise": 5,
    "resolution": "high"
  },` : ''}
  ${options.checkMarketplaceCompliance ? `"marketplaceCompliance": {
    "compliant": true/false,
    "marketplace": "${options.targetMarketplace || 'general e-commerce'}",
    "issues": ["issue1", "issue2"],
    "suggestions": ["suggestion1", "suggestion2"]
  }` : ''}
}`;

    return prompt;
  }
  
  /**
   * Construct the system prompt for main image selection
   * @param productContext Product context for relevant selection
   */
  private constructMainImageSelectionPrompt(
    productContext: {
      name: string;
      category?: string;
    }
  ): string {
    return `You are an expert in e-commerce product photography and image selection.
Your task is to analyze multiple product images and select the most suitable main product image for an e-commerce listing.

PRODUCT CONTEXT:
- Product name: ${productContext.name}${productContext.category ? `\n- Product category: ${productContext.category}` : ''}

INSTRUCTIONS:
- Analyze all provided product images
- Select the image that would work best as the main product image for an e-commerce listing
- The main image should clearly show the product, have good quality, and be visually appealing
- Consider South African e-commerce best practices for ${productContext.category || 'product'} listings
- Consider these factors in order of importance:
  1. Product visibility (product should be clearly visible)
  2. Image quality (sharp, well-lit, good contrast)
  3. Product completeness (shows the whole product)
  4. Background (clean background preferred)
  5. Composition (product well-framed)
  6. Marketing appeal (attractive to potential buyers)

OUTPUT FORMAT:
Provide your analysis as JSON with the following structure:
{
  "selectedIndex": 0, // Index of the selected image (0 for first image, 1 for second, etc.)
  "reasons": [
    "Reason 1 for selecting this image",
    "Reason 2 for selecting this image",
    "Reason 3 for selecting this image"
  ]
}`;
  }
  
  /**
   * Construct image message for single image analysis
   * @param imageUrl URL of the image to analyze
   * @param productContext Product context for the message
   */
  private constructImageMessage(
    imageUrl: string,
    productContext: {
      name: string;
      category?: string;
      description?: string;
      attributes?: Record<string, any>;
    }
  ): string {
    const contextStr = `Analyzing image for product: ${productContext.name}
${productContext.category ? `Category: ${productContext.category}` : ''}
${productContext.description ? `Description: ${productContext.description}` : ''}`;
    
    // Return with image URL for agent service to process
    return contextStr + '\n\nIMAGE: ' + imageUrl;
  }
  
  /**
   * Construct message for multiple image analysis
   * @param imageUrls URLs of images to analyze
   * @param productContext Product context for the message
   */
  private constructMultiImageMessage(
    imageUrls: string[],
    productContext: {
      name: string;
      category?: string;
    }
  ): string {
    const contextStr = `Analyzing ${imageUrls.length} images for product: ${productContext.name}
${productContext.category ? `Category: ${productContext.category}` : ''}

Please select the best image to use as the main product image.`;
    
    // Add all image URLs
    let message = contextStr + '\n\n';
    
    imageUrls.forEach((url, index) => {
      message += `IMAGE ${index + 1}: ${url}\n`;
    });
    
    return message;
  }
  
  /**
   * Get the appropriate URL for an image based on network conditions
   * @param image Product image
   */
  private getImageUrl(image: ProductImage): string {
    // If network is poor, prefer thumbnail
    if (image.thumbnails?.medium && this.networkAwareStorageService) {
      const networkQuality = this.networkAwareStorageService.getNetworkQuality();
      
      if (networkQuality.quality === 'low') {
        return image.thumbnails.small || image.thumbnails.medium || image.publicUrl;
      } else if (networkQuality.quality === 'medium') {
        return image.thumbnails.medium || image.publicUrl;
      }
    }
    
    // Default to public URL
    return image.publicUrl;
  }
}