/**
 * Image Analysis Service
 *
 * AI-powered image analysis service for the PIM module with
 * South African market optimization for low-bandwidth scenarios.
 *
 * Complete TypeScript-compliant implementation with proper interfaces and typing.
 */
import { Injectable, Logger, Optional } from "@nestjs/common";
import { AgentService } from "@modules/agent-framework";
import { CreditSystemService } from "@modules/credit-system";
import {
  FeatureFlagService,
  FlagEvaluationOptions,
} from "@modules/feature-flags";
import { ConfigService } from "@nestjs/config";
import { LoadSheddingResilienceService } from "./load-shedding-resilience.service";
import { StorageService } from "@common/storage";
import { NetworkAwareStorageService } from "./network-aware-storage.service";
import { ProductImage } from "../models/image.model";
import { NetworkQualityInfo } from "../interfaces/types";

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
   * Objects detected in the image
   */
  objects?: Array<{
    /**
     * Name of the object
     */
    name: string;

    /**
     * Confidence score (0-1)
     */
    confidence: number;

    /**
     * Bounding box coordinates
     */
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;

  /**
   * Image quality assessment
   */
  quality?: {
    /**
     * Overall score (0-100)
     */
    overallScore: number;

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
     * Noise level (0-100, lower is better)
     */
    noise: number;
  };

  /**
   * Whether the image is compliant with marketplace requirements
   */
  marketplaceCompliance?: {
    /**
     * Whether the image is compliant
     */
    compliant: boolean;

    /**
     * Issues with compliance
     */
    issues?: string[];

    /**
     * Marketplace-specific compliance details
     */
    marketplaceDetails?: Record<
      string,
      {
        compliant: boolean;
        issues?: string[];
      }
    >;
  };

  /**
   * Attributes extracted from the image
   */
  attributes?: Record<string, any>;

  /**
   * Error message if analysis failed
   */
  error?: string;

  /**
   * Token usage for AI operations
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
   * Whether to generate alternative text
   */
  generateAltText?: boolean;

  /**
   * Whether to include color analysis
   */
  includeColorAnalysis?: boolean;

  /**
   * Whether to detect objects in the image
   */
  detectObjects?: boolean;

  /**
   * Whether to extract product attributes
   */
  extractAttributes?: boolean;

  /**
   * Whether to check marketplace compliance
   */
  checkMarketplaceCompliance?: boolean;

  /**
   * Target marketplace to check compliance for
   */
  targetMarketplace?: string;

  /**
   * Whether to include quality assessment
   */
  includeQualityAssessment?: boolean;

  /**
   * Language for text generation
   */
  language?: string;

  /**
   * Network quality information for adaptive processing
   */
  networkQuality?: NetworkQualityInfo;

  /**
   * Attribute list to explicitly detect
   */
  attributes?: string[];
}

/**
 * Image optimization result
 */
export interface ImageOptimizationResult {
  /**
   * Whether optimization was successful
   */
  success: boolean;

  /**
   * Updated image with optimized metadata
   */
  updatedImage?: ProductImage;

  /**
   * Error message if optimization failed
   */
  error?: string;

  /**
   * Token usage for AI operations
   */
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
}

/**
 * Product context for image analysis
 */
export interface ProductContext {
  /**
   * Product name
   */
  name: string;

  /**
   * Product category
   */
  category?: string;

  /**
   * Product description
   */
  description?: string;

  /**
   * Product attributes
   */
  attributes?: Record<string, any>;
}

/**
 * AI-powered image analysis service
 */
@Injectable()
export class ImageAnalysisService {
  private readonly logger = new Logger(ImageAnalysisService.name);
  private readonly defaultModelId: string;

  constructor(
    private readonly agentService: AgentService,
    private readonly creditSystemService: CreditSystemService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly configService: ConfigService,
    private readonly networkAwareStorageService: NetworkAwareStorageService,
    @Optional()
    private readonly loadSheddingService?: LoadSheddingResilienceService,
  ) {
    this.defaultModelId =
      this.configService.get<string>("DEFAULT_VISION_MODEL_ID") ||
      "gpt-4-vision";
  }

  /**
   * Analyze an image to extract attributes, alt text, and other metadata
   *
   * @param imageUrl URL of the image to analyze
   * @param productContext Context information about the product
   * @param organizationId Organization ID for credit tracking
   * @param userId User ID for credit tracking
   * @param options Analysis options
   * @returns Analysis result
   */
  async analyzeImage(
    imageUrl: string,
    productContext: ProductContext,
    organizationId: string,
    userId: string,
    options: ImageAttributeDetectionOptions = {},
  ): Promise<ImageAnalysisResult> {
    try {
      // Check if feature is enabled
      const featureEnabled = await this.featureFlagService.isEnabled(
        "pim.ai.image-analysis",
        { userId, organizationId },
      );

      if (!featureEnabled) {
        this.logger.warn("Image analysis feature is disabled");
        return {
          success: false,
          error: "Image analysis feature is disabled",
        };
      }

      // Check network quality for adaptive processing
      const networkQuality = options.networkQuality;

      // Determine if we should use a lightweight model based on network conditions
      const useLightweightModel =
        networkQuality &&
        ((networkQuality.downlink && networkQuality.downlink < 1.5) ||
          networkQuality.effectiveType === "2g" ||
          networkQuality.effectiveType === "slow-2g");

      // Select model based on network conditions
      const modelId = useLightweightModel
        ? this.configService.get<string>("LIGHTWEIGHT_VISION_MODEL_ID") ||
          "gpt-4-vision"
        : this.defaultModelId;

      // Prepare prompt with context and quality adaptations
      const prompt = this.prepareImageAnalysisPrompt(
        productContext,
        options,
        networkQuality,
      );

      // Execute with load shedding resilience if available
      if (this.loadSheddingService) {
        return await this.loadSheddingService.executeWithResilience(() =>
          this.executeImageAnalysis(
            imageUrl,
            prompt,
            modelId,
            organizationId,
            userId,
          ),
        );
      }

      // Standard execution
      return await this.executeImageAnalysis(
        imageUrl,
        prompt,
        modelId,
        organizationId,
        userId,
      );
    } catch (error) {
      this.logger.error(`Error analyzing image: ${error.message}`, error.stack);
      return {
        success: false,
        error: `Error analyzing image: ${error.message}`,
      };
    }
  }

  /**
   * Execute image analysis with AI model
   *
   * @param imageUrl URL of the image
   * @param prompt Analysis prompt
   * @param modelId AI model ID
   * @param organizationId Organization ID
   * @param userId User ID
   * @returns Analysis result
   */
  private async executeImageAnalysis(
    imageUrl: string,
    prompt: string,
    modelId: string,
    organizationId: string,
    userId: string,
  ): Promise<ImageAnalysisResult> {
    // Reserve credits for the operation
    const reserveResult = await this.creditSystemService.reserveTokens({
      organizationId,
      feature: "ai.image-analysis",
      estimatedTokens: 1000,
      userId,
    });

    if (!reserveResult.success) {
      return {
        success: false,
        error:
          reserveResult.error || "Failed to reserve credits for image analysis",
      };
    }

    try {
      // Call AI model for image analysis
      const result = await this.agentService.processImage(imageUrl, {
        prompt,
        modelId,
        responseFormat: { type: "json_object" },
        temperature: 0.2,
      });

      if (!result || !result.content) {
        throw new Error("No result returned from AI model");
      }

      // Parse the result
      const analysisResult = this.parseAnalysisResult(result.content);

      // Calculate actual token usage
      const tokenUsage = {
        input: result.usage?.promptTokens || prompt.length / 4 + 1000, // 1000 tokens for image
        output:
          result.usage?.completionTokens ||
          JSON.stringify(analysisResult).length / 4,
        total:
          result.usage?.totalTokens ||
          prompt.length / 4 + JSON.stringify(analysisResult).length / 4 + 1000,
      };

      // Update token usage in result
      analysisResult.tokenUsage = tokenUsage;

      // Commit token usage
      await this.creditSystemService.commitReservedTokens({
        reservationId: reserveResult.reservationId,
        actualTokens: tokenUsage.total,
      });

      return { ...analysisResult, success: true };
    } catch (error) {
      // Release the reserved credits
      await this.creditSystemService.releaseReservedTokens({
        reservationId: reserveResult.reservationId,
      });

      this.logger.error(
        `Error in AI image analysis: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: `AI analysis failed: ${error.message}`,
      };
    }
  }

  /**
   * Prepare prompt for image analysis based on context and options
   *
   * @param productContext Product context
   * @param options Analysis options
   * @param networkQuality Network quality info for adaptive processing
   * @returns Formatted prompt
   */
  private prepareImageAnalysisPrompt(
    productContext: ProductContext,
    options: ImageAttributeDetectionOptions,
    networkQuality?: NetworkQualityInfo,
  ): string {
    // Adapt detail level based on network quality
    const detailLevel =
      networkQuality && networkQuality.downlink
        ? networkQuality.downlink < 1
          ? "basic"
          : networkQuality.downlink < 3
            ? "standard"
            : "detailed"
        : "standard";

    // Base task definition
    let prompt = `Analyze this product image considering the following context:

Product Name: ${productContext.name}
${productContext.category ? `Category: ${productContext.category}` : ""}
${productContext.description ? `Description: ${productContext.description}` : ""}
`;

    // Add attributes if available
    if (
      productContext.attributes &&
      Object.keys(productContext.attributes).length > 0
    ) {
      prompt += "\nProduct Attributes:\n";
      Object.entries(productContext.attributes).forEach(([key, value]) => {
        prompt += `- ${key}: ${value}\n`;
      });
    }

    // Build tasks based on options
    const tasks = [];

    if (options.generateAltText !== false) {
      tasks.push(
        `Generate a ${detailLevel === "detailed" ? "comprehensive" : "concise"} alt text description for the image that would be useful for SEO and accessibility.`,
      );
    }

    if (options.includeColorAnalysis) {
      tasks.push(
        `Identify the dominant colors in the image with their approximate hex codes and percentages. ${detailLevel === "detailed" ? "Also determine background and foreground colors." : ""}`,
      );
    }

    if (options.detectObjects) {
      tasks.push(
        `Detect main objects in the image${detailLevel === "detailed" ? " with their approximate positions and confidence scores" : ""}.`,
      );
    }

    if (options.extractAttributes) {
      tasks.push(
        `Extract visual product attributes from the image that might not be in the provided attributes (e.g., color, pattern, style, materials, shape).`,
      );
    }

    if (options.includeQualityAssessment) {
      tasks.push(
        `Assess the image quality in terms of sharpness, brightness, contrast, and noise. Provide scores from 0-100.`,
      );
    }

    if (options.checkMarketplaceCompliance && options.targetMarketplace) {
      tasks.push(
        `Evaluate if this image is compliant with ${options.targetMarketplace} marketplace requirements for product listings. Identify any issues that should be fixed.`,
      );
    }

    // Add tasks to prompt
    prompt += "\n\nTasks:\n";
    tasks.forEach((task, index) => {
      prompt += `${index + 1}. ${task}\n`;
    });

    // Add response format instruction
    prompt += `\nRespond in JSON format with the following structure (include only the requested elements):
{
  "altText": "string, descriptive alt text for the image",
  "tags": ["array of keywords relevant to the image"],
  ${
    options.includeColorAnalysis
      ? `"colors": {
    "dominant": [{"color": "color name", "hex": "#hexcode", "percentage": number}],
    "background": "background color name and hex",
    "foreground": "foreground color name and hex"
  },`
      : ""
  }
  ${options.detectObjects ? `"objects": [{"name": "object name", "confidence": number, "boundingBox": {"x": number, "y": number, "width": number, "height": number}}],` : ""}
  ${options.includeQualityAssessment ? `"quality": {"overallScore": number, "sharpness": number, "brightness": number, "contrast": number, "noise": number},` : ""}
  ${options.checkMarketplaceCompliance ? `"marketplaceCompliance": {"compliant": boolean, "issues": ["array of issues if any"]},` : ""}
  ${options.extractAttributes ? `"attributes": {"attribute name": "attribute value"},` : ""}
}

The level of detail should be ${detailLevel} based on the user's network conditions.`;

    if (options.language && options.language !== "en") {
      prompt += `\n\nRespond in ${options.language} language.`;
    }

    return prompt;
  }

  /**
   * Parse AI model response to structured analysis result
   *
   * @param content AI model response content
   * @returns Structured analysis result
   */
  private parseAnalysisResult(content: string | any): ImageAnalysisResult {
    try {
      // If content is already an object, use it directly
      if (typeof content === "object") {
        return content as ImageAnalysisResult;
      }

      // Otherwise parse JSON
      return JSON.parse(content) as ImageAnalysisResult;
    } catch (error) {
      this.logger.error(
        `Error parsing analysis result: ${error.message}`,
        error.stack,
      );

      // Attempt to extract structured data from unstructured response
      const altTextMatch = content.match(/altText["']?:\s*["']([^"']+)["']/);
      const result: ImageAnalysisResult = {
        success: true,
      };

      if (altTextMatch && altTextMatch[1]) {
        result.altText = altTextMatch[1];
      }

      return result;
    }
  }

  /**
   * Optimize product image metadata based on AI analysis
   *
   * @param image Product image to optimize
   * @param productContext Product context for analysis
   * @param organizationId Organization ID for credit tracking
   * @param userId User ID for credit tracking
   * @param options Analysis options
   * @returns Optimization result with updated image
   */
  async optimizeImageMetadata(
    image: ProductImage,
    productContext: ProductContext,
    organizationId: string,
    userId: string,
    options: ImageAttributeDetectionOptions = {},
  ): Promise<ImageOptimizationResult> {
    try {
      if (!image || !image.publicUrl) {
        return {
          success: false,
          error: "Invalid image provided",
        };
      }

      // Analyze the image
      const analysisResult = await this.analyzeImage(
        image.publicUrl,
        productContext,
        organizationId,
        userId,
        options,
      );

      if (!analysisResult.success) {
        return {
          success: false,
          error: analysisResult.error || "Image analysis failed",
          tokenUsage: analysisResult.tokenUsage,
        };
      }

      // Create updated image with enhanced metadata
      const updatedImage: ProductImage = {
        ...image,
        altText: analysisResult.altText || image.altText,
        metadata: {
          ...image.metadata,
          ...analysisResult.attributes,
          colors: analysisResult.colors?.dominant
            ?.map((c) => c.color)
            .join(", "),
          qualityScore: analysisResult.quality?.overallScore?.toString(),
        },
      };

      // Apply optimizations based on analysis
      if (
        analysisResult.marketplaceCompliance &&
        !analysisResult.marketplaceCompliance.compliant
      ) {
        updatedImage.metadata = {
          ...updatedImage.metadata,
          marketplaceIssues:
            analysisResult.marketplaceCompliance.issues?.join(", "),
          needsOptimization: "true",
        };
      }

      return {
        success: true,
        updatedImage,
        tokenUsage: analysisResult.tokenUsage,
      };
    } catch (error) {
      this.logger.error(
        `Error optimizing image metadata: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: `Optimization failed: ${error.message}`,
      };
    }
  }

  /**
   * Generate alt text for a product image
   *
   * @param imageUrl URL of the image
   * @param productContext Product context for better alt text generation
   * @param organizationId Organization ID for credit tracking
   * @param userId User ID for credit tracking
   * @param language Target language for alt text
   * @returns Generated alt text
   */
  async generateAltText(
    imageUrl: string,
    productContext: ProductContext,
    organizationId: string,
    userId: string,
    language: string = "en",
  ): Promise<{
    altText: string;
    success: boolean;
    error?: string;
    tokenUsage?: { input: number; output: number; total: number };
  }> {
    try {
      const analysisResult = await this.analyzeImage(
        imageUrl,
        productContext,
        organizationId,
        userId,
        {
          generateAltText: true,
          language,
        },
      );

      if (!analysisResult.success || !analysisResult.altText) {
        return {
          altText: "",
          success: false,
          error: analysisResult.error || "Failed to generate alt text",
          tokenUsage: analysisResult.tokenUsage,
        };
      }

      return {
        altText: analysisResult.altText,
        success: true,
        tokenUsage: analysisResult.tokenUsage,
      };
    } catch (error) {
      this.logger.error(
        `Error generating alt text: ${error.message}`,
        error.stack,
      );
      return {
        altText: "",
        success: false,
        error: `Alt text generation failed: ${error.message}`,
      };
    }
  }

  /**
   * Check if an image meets marketplace compliance requirements
   *
   * @param imageUrl URL of the image
   * @param productContext Product context for compliance checking
   * @param marketplace Target marketplace to check compliance for
   * @param organizationId Organization ID for credit tracking
   * @param userId User ID for credit tracking
   * @returns Compliance check result
   */
  async checkMarketplaceCompliance(
    imageUrl: string,
    productContext: ProductContext,
    marketplace: string,
    organizationId: string,
    userId: string,
  ): Promise<{
    compliant: boolean;
    issues?: string[];
    success: boolean;
    error?: string;
    tokenUsage?: { input: number; output: number; total: number };
  }> {
    try {
      const analysisResult = await this.analyzeImage(
        imageUrl,
        productContext,
        organizationId,
        userId,
        {
          checkMarketplaceCompliance: true,
          targetMarketplace: marketplace,
        },
      );

      if (!analysisResult.success) {
        return {
          compliant: false,
          success: false,
          error:
            analysisResult.error || "Failed to check marketplace compliance",
          tokenUsage: analysisResult.tokenUsage,
        };
      }

      if (!analysisResult.marketplaceCompliance) {
        return {
          compliant: true, // Assume compliant if not explicitly checked
          success: true,
          tokenUsage: analysisResult.tokenUsage,
        };
      }

      return {
        compliant: analysisResult.marketplaceCompliance.compliant,
        issues: analysisResult.marketplaceCompliance.issues,
        success: true,
        tokenUsage: analysisResult.tokenUsage,
      };
    } catch (error) {
      this.logger.error(
        `Error checking marketplace compliance: ${error.message}`,
        error.stack,
      );
      return {
        compliant: false,
        success: false,
        error: `Compliance check failed: ${error.message}`,
      };
    }
  }

  /**
   * Assess image quality (sharpness, brightness, etc.)
   *
   * @param imageUrl URL of the image
   * @param organizationId Organization ID for credit tracking
   * @param userId User ID for credit tracking
   * @returns Quality assessment result
   */
  async assessImageQuality(
    imageUrl: string,
    organizationId: string,
    userId: string,
  ): Promise<{
    quality: any;
    success: boolean;
    error?: string;
    tokenUsage?: { input: number; output: number; total: number };
  }> {
    try {
      const analysisResult = await this.analyzeImage(
        imageUrl,
        { name: "Product" }, // Minimal context for quality assessment
        organizationId,
        userId,
        {
          includeQualityAssessment: true,
        },
      );

      if (!analysisResult.success) {
        return {
          quality: null,
          success: false,
          error: analysisResult.error || "Failed to assess image quality",
          tokenUsage: analysisResult.tokenUsage,
        };
      }

      return {
        quality: analysisResult.quality || { overallScore: 0 },
        success: true,
        tokenUsage: analysisResult.tokenUsage,
      };
    } catch (error) {
      this.logger.error(
        `Error assessing image quality: ${error.message}`,
        error.stack,
      );
      return {
        quality: null,
        success: false,
        error: `Quality assessment failed: ${error.message}`,
      };
    }
  }

  /**
   * Identify the best image to use as main product image from a set of images
   *
   * @param images Array of product images to choose from
   * @param productContext Product context information to make relevant selection
   * @param organizationId Organization ID for credit tracking
   * @param userId User ID for credit tracking
   * @returns Result with the index of the main image
   */
  async identifyMainProductImage(
    images: ProductImage[],
    productContext: ProductContext,
    organizationId: string,
    userId: string,
  ): Promise<{
    success: boolean;
    mainImageIndex?: number;
    reason?: string;
    error?: string;
    tokenUsage?: { input: number; output: number; total: number };
  }> {
    try {
      // Check if feature is enabled
      const featureEnabled = await this.featureFlagService.isEnabled(
        "pim.ai.main-image-selection",
        { userId, organizationId },
      );

      if (!featureEnabled) {
        this.logger.warn("Main image selection feature is disabled");
        // Return first image as main if feature is disabled
        return {
          success: true,
          mainImageIndex: 0,
          reason: "Feature disabled, returned first image as main",
        };
      }

      // If there's only one image, return it as main
      if (images.length === 1) {
        return {
          success: true,
          mainImageIndex: 0,
          reason: "Only one image available",
        };
      }

      // Reserve credits for the operation
      const reserveResult = await this.creditSystemService.reserveTokens({
        organizationId,
        feature: "ai.image-analysis",
        estimatedTokens: 1500, // Estimate, will be adjusted later
        userId,
      });

      if (!reserveResult.success) {
        return {
          success: false,
          error:
            reserveResult.error ||
            "Failed to reserve credits for image analysis",
        };
      }

      try {
        // Prepare the prompt for main image selection
        const prompt = this.prepareMainImageSelectionPrompt(
          images,
          productContext,
        );

        // Call AI model to analyze images
        const imageUrls = images.map((img) => img.publicUrl);

        // Execute with load shedding resilience if available
        let result;
        if (this.loadSheddingService) {
          result = await this.loadSheddingService.executeWithResilience(
            async () =>
              this.agentService.processImage(imageUrls[0], {
                prompt,
                modelId: this.defaultModelId,
                responseFormat: { type: "json_object" },
                temperature: 0.1,
              }),
          );
        } else {
          // Process the first image only - using common main image selection
          result = await this.agentService.processImage(imageUrls[0], {
            prompt,
            modelId: this.defaultModelId,
            responseFormat: { type: "json_object" },
            temperature: 0.1,
          });
        }

        if (!result || !result.content) {
          throw new Error("No result returned from AI model");
        }

        // Parse the result
        const content =
          typeof result.content === "string"
            ? JSON.parse(result.content)
            : result.content;

        // Calculate token usage
        const tokenUsage = {
          input:
            result.usage?.promptTokens ||
            prompt.length / 4 + imageUrls.length * 1000,
          output:
            result.usage?.completionTokens ||
            JSON.stringify(content).length / 4,
          total:
            result.usage?.totalTokens ||
            prompt.length / 4 +
              JSON.stringify(content).length / 4 +
              imageUrls.length * 1000,
        };

        // Commit token usage
        await this.creditSystemService.commitReservedTokens({
          reservationId: reserveResult.reservationId,
          actualTokens: tokenUsage.total,
        });

        // Extract main image index
        const mainImageIndex =
          typeof content.mainImageIndex === "number"
            ? content.mainImageIndex
            : typeof content.bestImageIndex === "number"
              ? content.bestImageIndex
              : 0;

        if (
          mainImageIndex === undefined ||
          mainImageIndex < 0 ||
          mainImageIndex >= images.length
        ) {
          return {
            success: false,
            error: "Invalid main image index returned by AI model",
            tokenUsage,
          };
        }

        return {
          success: true,
          mainImageIndex,
          reason: content.reason || content.rationale,
          tokenUsage,
        };
      } catch (error) {
        // Release the reserved credits
        await this.creditSystemService.releaseReservedTokens({
          reservationId: reserveResult.reservationId,
        });

        throw error;
      }
    } catch (error) {
      this.logger.error(
        `Error identifying main product image: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: `Main image selection failed: ${error.message}`,
      };
    }
  }

  /**
   * Prepare prompt for main image selection
   *
   * @param images Product images to analyze
   * @param productContext Product context information
   * @returns Formatted prompt
   */
  private prepareMainImageSelectionPrompt(
    images: ProductImage[],
    productContext: ProductContext,
  ): string {
    // Prepare product information
    const productInfo = `
Product Name: ${productContext.name}
${productContext.category ? `Category: ${productContext.category}` : ""}
${productContext.description ? `Description: ${productContext.description}` : ""}
`;

    // Prepare image information
    const imageInfo = images
      .map((image, index) => {
        return `Image ${index}: ${image.fileName}${image.altText ? ` - ${image.altText}` : ""}`;
      })
      .join("\n");

    // Create prompt
    const prompt = `You are tasked with selecting the best main product image from a set of ${images.length} product images.

PRODUCT INFORMATION:
${productInfo}

IMAGE INFORMATION:
${imageInfo}

Please analyze all images and select the most suitable main product image based on the following criteria:
1. Image quality (sharpness, lighting, composition)
2. Shows the product clearly and completely
3. Represents the product accurately based on the product description
4. Has a clean, professional appearance
5. Would be most appealing to customers
6. Works well as a thumbnail

Reply in the following JSON format only:
{
  "mainImageIndex": <number - the index (0-based) of the best image>,
  "rationale": "<string - brief explanation of why this image was selected>"
}`;

    return prompt;
  }
}
