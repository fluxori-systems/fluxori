import { Injectable, Logger } from '@nestjs/common';
import { AgentService } from '../../agent-framework';
import { CreditSystemService } from '../../credit-system';
import { FeatureFlagService } from '../../feature-flags';
import { CreditUsageType } from '../../credit-system/interfaces/types';
import { ConfigService } from '@nestjs/config';
import { ModelRegistryRepository } from '../../agent-framework/repositories/model-registry.repository';
import { TokenEstimator } from '../../agent-framework/utils/token-estimator';

/**
 * Service for AI-powered product operations
 * Optimized for South African market with credit system integration
 */
@Injectable()
export class ProductAiService {
  private readonly logger = new Logger(ProductAiService.name);
  private readonly defaultModelId: string;

  constructor(
    private readonly agentService: AgentService,
    private readonly creditSystemService: CreditSystemService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly modelRegistryRepository: ModelRegistryRepository,
    private readonly configService: ConfigService,
    private readonly tokenEstimator: TokenEstimator,
  ) {
    this.defaultModelId = this.configService.get<string>('DEFAULT_AI_MODEL_ID') || 'gpt-4o';
  }

  /**
   * Generate a product description based on attributes and context
   * @param productData Basic product data used for generation
   * @param organizationId Organization ID for credit tracking
   * @param userId User ID for credit tracking
   * @param options Generation options
   */
  async generateProductDescription(
    productData: {
      name: string;
      category: string;
      attributes: Record<string, any>;
      features?: string[];
      keywords?: string[];
      targetAudience?: string;
      tone?: string;
    },
    organizationId: string,
    userId: string,
    options?: {
      length?: 'short' | 'medium' | 'long';
      seoOptimized?: boolean;
      marketplaceOptimized?: boolean;
      targetMarketplace?: string;
      language?: string;
    },
  ): Promise<{ 
    description: string; 
    seoMetadata?: { title: string; description: string; keywords: string[] };
    success: boolean;
    tokenUsage?: { input: number; output: number; total: number };
  }> {
    try {
      // Default options
      const length = options?.length || 'medium';
      const seoOptimized = options?.seoOptimized !== undefined ? options.seoOptimized : true;
      const marketplaceOptimized = options?.marketplaceOptimized !== undefined ? options.marketplaceOptimized : false;
      const targetMarketplace = options?.targetMarketplace || '';
      const language = options?.language || 'en';

      // Check if feature is enabled
      const featureEnabled = await this.featureFlagService.isEnabled(
        'pim.ai.product-description-generation',
        organizationId,
      );

      if (!featureEnabled) {
        this.logger.warn('Product description generation feature is disabled');
        return {
          description: '',
          success: false,
        };
      }

      // Construct the agent prompt
      const systemPrompt = this.constructProductDescriptionPrompt(
        productData, 
        { length, seoOptimized, marketplaceOptimized, targetMarketplace, language }
      );

      // Get available model
      const model = await this.modelRegistryRepository.findById(this.defaultModelId);
      if (!model) {
        throw new Error(`Model ${this.defaultModelId} not found in registry`);
      }

      // Estimate token usage
      const estimatedInputTokens = this.tokenEstimator.estimateTokens(
        systemPrompt + JSON.stringify(productData),
      );
      
      const estimatedOutputTokens = this.getEstimatedOutputTokens(length);

      // Check credit availability
      const creditCheck = await this.creditSystemService.checkCredits({
        organizationId,
        userId,
        expectedInputTokens: estimatedInputTokens,
        expectedOutputTokens: estimatedOutputTokens,
        modelId: model.id,
        usageType: CreditUsageType.CONTENT_GENERATION,
        operationId: `product-description-${Date.now()}`,
      });

      if (!creditCheck.hasCredits) {
        this.logger.warn('Insufficient credits for product description generation');
        return {
          description: '',
          success: false,
        };
      }

      // Create conversation with AI
      const conversation = await this.agentService.createConversation({
        organizationId,
        userId,
        modelId: model.id,
        systemPrompt,
      });

      // Format product data for the prompt
      const userMessage = JSON.stringify(productData, null, 2);

      // Send message to the agent
      const startTime = Date.now();
      const response = await this.agentService.sendMessage(
        conversation.id,
        userMessage,
      );
      const processingTime = Date.now() - startTime;

      // Format and extract the response
      let result: any;
      try {
        result = JSON.parse(response.content);
      } catch (e) {
        // If not valid JSON, just use the text
        result = { description: response.content };
      }

      // Record credit usage
      await this.creditSystemService.recordUsage({
        organizationId,
        userId,
        reservationId: creditCheck.reservationId,
        actualInputTokens: response.usage.promptTokens,
        actualOutputTokens: response.usage.completionTokens,
        modelId: model.id,
        modelProvider: model.provider,
        processingTimeMs: processingTime,
        success: true,
      });

      return {
        description: result.description || '',
        seoMetadata: result.seoMetadata,
        success: true,
        tokenUsage: {
          input: response.usage.promptTokens,
          output: response.usage.completionTokens,
          total: response.usage.totalTokens,
        },
      };
    } catch (error) {
      this.logger.error(`Error generating product description: ${error.message}`, error.stack);
      return {
        description: '',
        success: false,
      };
    }
  }

  /**
   * Generate SEO optimization suggestions for a product
   * @param product Product data to optimize
   * @param organizationId Organization ID for credit tracking
   * @param userId User ID for credit tracking
   */
  async generateSeoSuggestions(
    product: {
      id: string;
      name: string;
      description: string;
      category: string;
      attributes: Record<string, any>;
    },
    organizationId: string,
    userId: string,
  ): Promise<{
    title: string;
    metaDescription: string;
    keywords: string[];
    contentSuggestions: string[];
    success: boolean;
    tokenUsage?: { input: number; output: number; total: number };
  }> {
    try {
      // Check feature flag
      const featureEnabled = await this.featureFlagService.isEnabled(
        'pim.ai.seo-optimization',
        organizationId,
      );

      if (!featureEnabled) {
        this.logger.warn('SEO optimization feature is disabled');
        return {
          title: '',
          metaDescription: '',
          keywords: [],
          contentSuggestions: [],
          success: false,
        };
      }

      // Get system prompt for SEO optimization
      const systemPrompt = this.constructSeoOptimizationPrompt();
      
      // Get model
      const model = await this.modelRegistryRepository.findById(this.defaultModelId);
      if (!model) {
        throw new Error(`Model ${this.defaultModelId} not found in registry`);
      }

      // Estimate token usage
      const estimatedInputTokens = this.tokenEstimator.estimateTokens(
        systemPrompt + JSON.stringify(product),
      );
      
      const estimatedOutputTokens = 1000; // Reasonable estimate for SEO suggestions

      // Check credit availability
      const creditCheck = await this.creditSystemService.checkCredits({
        organizationId,
        userId,
        expectedInputTokens: estimatedInputTokens,
        expectedOutputTokens: estimatedOutputTokens,
        modelId: model.id,
        usageType: CreditUsageType.SEO_OPTIMIZATION,
        operationId: `seo-optimization-${product.id}`,
      });

      if (!creditCheck.hasCredits) {
        this.logger.warn('Insufficient credits for SEO optimization');
        return {
          title: '',
          metaDescription: '',
          keywords: [],
          contentSuggestions: [],
          success: false,
        };
      }

      // Create conversation
      const conversation = await this.agentService.createConversation({
        organizationId,
        userId,
        modelId: model.id,
        systemPrompt,
      });

      // Format product data
      const userMessage = JSON.stringify(product, null, 2);
      
      // Send message
      const startTime = Date.now();
      const response = await this.agentService.sendMessage(
        conversation.id, 
        userMessage,
      );
      const processingTime = Date.now() - startTime;

      // Parse response
      let result: any;
      try {
        result = JSON.parse(response.content);
      } catch (e) {
        this.logger.error(`Failed to parse SEO suggestions: ${e.message}`);
        result = {
          title: '',
          metaDescription: '',
          keywords: [],
          contentSuggestions: [],
        };
      }

      // Record credit usage
      await this.creditSystemService.recordUsage({
        organizationId,
        userId,
        reservationId: creditCheck.reservationId,
        actualInputTokens: response.usage.promptTokens,
        actualOutputTokens: response.usage.completionTokens,
        modelId: model.id,
        modelProvider: model.provider,
        processingTimeMs: processingTime,
        success: true,
      });

      return {
        title: result.title || '',
        metaDescription: result.metaDescription || '',
        keywords: result.keywords || [],
        contentSuggestions: result.contentSuggestions || [],
        success: true,
        tokenUsage: {
          input: response.usage.promptTokens,
          output: response.usage.completionTokens,
          total: response.usage.totalTokens,
        },
      };
    } catch (error) {
      this.logger.error(`Error generating SEO suggestions: ${error.message}`, error.stack);
      return {
        title: '',
        metaDescription: '',
        keywords: [],
        contentSuggestions: [],
        success: false,
      };
    }
  }

  /**
   * Classify a product into categories based on its details
   * @param productData Product data for classification
   * @param organizationId Organization ID for credit tracking
   * @param userId User ID for credit tracking
   */
  async classifyProduct(
    productData: {
      name: string;
      description: string;
      attributes?: Record<string, any>;
      features?: string[];
    },
    organizationId: string,
    userId: string,
  ): Promise<{
    categories: Array<{ path: string; confidence: number }>;
    attributeSuggestions?: Record<string, any>;
    success: boolean;
    tokenUsage?: { input: number; output: number; total: number };
  }> {
    try {
      // Check feature flag
      const featureEnabled = await this.featureFlagService.isEnabled(
        'pim.ai.product-classification',
        organizationId,
      );

      if (!featureEnabled) {
        this.logger.warn('Product classification feature is disabled');
        return {
          categories: [],
          success: false,
        };
      }

      // Get system prompt
      const systemPrompt = this.constructProductClassificationPrompt();
      
      // Get model
      const model = await this.modelRegistryRepository.findById(this.defaultModelId);
      if (!model) {
        throw new Error(`Model ${this.defaultModelId} not found in registry`);
      }

      // Estimate token usage
      const estimatedInputTokens = this.tokenEstimator.estimateTokens(
        systemPrompt + JSON.stringify(productData),
      );
      
      const estimatedOutputTokens = 800; // Reasonable estimate for classification results

      // Check credit availability
      const creditCheck = await this.creditSystemService.checkCredits({
        organizationId,
        userId,
        expectedInputTokens: estimatedInputTokens,
        expectedOutputTokens: estimatedOutputTokens,
        modelId: model.id,
        usageType: CreditUsageType.CLASSIFICATION,
        operationId: `product-classification-${Date.now()}`,
      });

      if (!creditCheck.hasCredits) {
        this.logger.warn('Insufficient credits for product classification');
        return {
          categories: [],
          success: false,
        };
      }

      // Create conversation
      const conversation = await this.agentService.createConversation({
        organizationId,
        userId,
        modelId: model.id,
        systemPrompt,
      });

      // Format product data
      const userMessage = JSON.stringify(productData, null, 2);
      
      // Send message
      const startTime = Date.now();
      const response = await this.agentService.sendMessage(
        conversation.id, 
        userMessage,
      );
      const processingTime = Date.now() - startTime;

      // Parse response
      let result: any;
      try {
        result = JSON.parse(response.content);
      } catch (e) {
        this.logger.error(`Failed to parse classification results: ${e.message}`);
        result = {
          categories: [],
          attributeSuggestions: {},
        };
      }

      // Record credit usage
      await this.creditSystemService.recordUsage({
        organizationId,
        userId,
        reservationId: creditCheck.reservationId,
        actualInputTokens: response.usage.promptTokens,
        actualOutputTokens: response.usage.completionTokens,
        modelId: model.id,
        modelProvider: model.provider,
        processingTimeMs: processingTime,
        success: true,
      });

      return {
        categories: result.categories || [],
        attributeSuggestions: result.attributeSuggestions || {},
        success: true,
        tokenUsage: {
          input: response.usage.promptTokens,
          output: response.usage.completionTokens,
          total: response.usage.totalTokens,
        },
      };
    } catch (error) {
      this.logger.error(`Error classifying product: ${error.message}`, error.stack);
      return {
        categories: [],
        success: false,
      };
    }
  }

  /**
   * Extract product attributes from unstructured text
   * @param productText Unstructured product text (description, features, etc.)
   * @param organizationId Organization ID for credit tracking
   * @param userId User ID for credit tracking
   */
  async extractProductAttributes(
    productText: string,
    organizationId: string,
    userId: string,
  ): Promise<{
    extractedAttributes: Record<string, any>;
    features: string[];
    specifications: Record<string, string | number>;
    success: boolean;
    tokenUsage?: { input: number; output: number; total: number };
  }> {
    try {
      // Check feature flag
      const featureEnabled = await this.featureFlagService.isEnabled(
        'pim.ai.attribute-extraction',
        organizationId,
      );

      if (!featureEnabled) {
        this.logger.warn('Attribute extraction feature is disabled');
        return {
          extractedAttributes: {},
          features: [],
          specifications: {},
          success: false,
        };
      }

      // Get system prompt
      const systemPrompt = this.constructAttributeExtractionPrompt();
      
      // Get model
      const model = await this.modelRegistryRepository.findById(this.defaultModelId);
      if (!model) {
        throw new Error(`Model ${this.defaultModelId} not found in registry`);
      }

      // Estimate token usage
      const estimatedInputTokens = this.tokenEstimator.estimateTokens(
        systemPrompt + productText,
      );
      
      const estimatedOutputTokens = Math.min(1500, productText.length); // Conservative estimate

      // Check credit availability
      const creditCheck = await this.creditSystemService.checkCredits({
        organizationId,
        userId,
        expectedInputTokens: estimatedInputTokens,
        expectedOutputTokens: estimatedOutputTokens,
        modelId: model.id,
        usageType: CreditUsageType.ATTRIBUTE_EXTRACTION,
        operationId: `attribute-extraction-${Date.now()}`,
      });

      if (!creditCheck.hasCredits) {
        this.logger.warn('Insufficient credits for attribute extraction');
        return {
          extractedAttributes: {},
          features: [],
          specifications: {},
          success: false,
        };
      }

      // Create conversation
      const conversation = await this.agentService.createConversation({
        organizationId,
        userId,
        modelId: model.id,
        systemPrompt,
      });

      // Send message
      const startTime = Date.now();
      const response = await this.agentService.sendMessage(
        conversation.id, 
        productText,
      );
      const processingTime = Date.now() - startTime;

      // Parse response
      let result: any;
      try {
        result = JSON.parse(response.content);
      } catch (e) {
        this.logger.error(`Failed to parse extracted attributes: ${e.message}`);
        result = {
          extractedAttributes: {},
          features: [],
          specifications: {},
        };
      }

      // Record credit usage
      await this.creditSystemService.recordUsage({
        organizationId,
        userId,
        reservationId: creditCheck.reservationId,
        actualInputTokens: response.usage.promptTokens,
        actualOutputTokens: response.usage.completionTokens,
        modelId: model.id,
        modelProvider: model.provider,
        processingTimeMs: processingTime,
        success: true,
      });

      return {
        extractedAttributes: result.extractedAttributes || {},
        features: result.features || [],
        specifications: result.specifications || {},
        success: true,
        tokenUsage: {
          input: response.usage.promptTokens,
          output: response.usage.completionTokens,
          total: response.usage.totalTokens,
        },
      };
    } catch (error) {
      this.logger.error(`Error extracting attributes: ${error.message}`, error.stack);
      return {
        extractedAttributes: {},
        features: [],
        specifications: {},
        success: false,
      };
    }
  }

  /**
   * Create system prompt for product description generation
   * @param productData Basic product data
   * @param options Generation options
   */
  private constructProductDescriptionPrompt(
    productData: any,
    options: {
      length: 'short' | 'medium' | 'long';
      seoOptimized: boolean;
      marketplaceOptimized: boolean;
      targetMarketplace: string;
      language: string;
    },
  ): string {
    // Base prompt
    let prompt = `You are an expert e-commerce product description writer with deep knowledge of South African market trends.
Your task is to create compelling product descriptions that are optimized for sales conversion.

INSTRUCTIONS:
- Create a ${options.length} product description for the provided product details
- Focus on benefits, not just features
- Use engaging language appropriate for e-commerce`;

    // Add SEO optimization instructions if needed
    if (options.seoOptimized) {
      prompt += `
- Optimize the description for SEO using relevant keywords
- Include appropriate keywords naturally within the text`;
    }

    // Add marketplace-specific instructions if needed
    if (options.marketplaceOptimized && options.targetMarketplace) {
      prompt += `
- Optimize specifically for ${options.targetMarketplace} marketplace
- Follow ${options.targetMarketplace}'s best practices for product content`;
      
      // Add specific marketplace guidelines
      if (options.targetMarketplace.toLowerCase() === 'takealot') {
        prompt += `
- Follow Takealot's content guidelines (clear, factual, benefit-focused)
- Avoid promotional language banned by Takealot ("best", "cheapest", etc.)
- Ensure compliance with South African consumer protection regulations`;
      }
    }

    // South African market specifics
    prompt += `
- Incorporate South African market awareness and local context where relevant
- Use language and terminology familiar to South African consumers
- Mention any South Africa-specific certifications or standards if applicable`;

    // Output format instructions
    prompt += `
OUTPUT FORMAT:
Provide your response in JSON format with these fields:
- description: The main product description text
${options.seoOptimized ? '- seoMetadata: { title, description, keywords }' : ''}

Example response structure:
{
  "description": "Your well-crafted product description here...",
  ${options.seoOptimized ? `"seoMetadata": {
    "title": "SEO-optimized product title",
    "description": "Meta description for search engines",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }` : ''}
}`;

    return prompt;
  }

  /**
   * Create system prompt for SEO optimization
   */
  private constructSeoOptimizationPrompt(): string {
    return `You are an SEO expert specializing in e-commerce product listings with deep knowledge of South African market trends.
Your task is to analyze product information and provide SEO optimization suggestions.

INSTRUCTIONS:
- Analyze the product details provided
- Generate an SEO-optimized product title
- Create a compelling meta description that encourages clicks (max 160 characters)
- Identify relevant keywords for this product that would perform well in South African search engines
- Provide specific content improvement suggestions to boost SEO performance
- Consider South African search patterns and terminology
- Include relevant South African marketplace considerations (Takealot, Bid or Buy, etc.)

OUTPUT FORMAT:
Provide your response in JSON format with these fields:
{
  "title": "SEO-optimized product title (60-70 characters)",
  "metaDescription": "Compelling meta description under 160 characters",
  "keywords": ["keyword1", "keyword2", "keyword3", ...],
  "contentSuggestions": [
    "Specific suggestion to improve SEO performance",
    "Another specific suggestion",
    ...
  ]
}`;
  }

  /**
   * Create system prompt for product classification
   */
  private constructProductClassificationPrompt(): string {
    return `You are an expert in product categorization for e-commerce platforms with specific expertise in South African market taxonomies.
Your task is to analyze product information and suggest appropriate category classifications.

INSTRUCTIONS:
- Analyze the provided product details
- Determine the most appropriate product categories
- Provide confidence scores for each suggested category (0-100)
- Suggest additional product attributes that would be relevant for this product type
- Consider South African e-commerce category standards (especially Takealot's taxonomy)
- Provide hierarchical category paths (e.g., Electronics > Audio > Headphones > Wireless Headphones)

OUTPUT FORMAT:
Provide your response in JSON format with these fields:
{
  "categories": [
    {
      "path": "Main Category > Subcategory > Sub-subcategory",
      "confidence": 95
    },
    {
      "path": "Alternative Category > Subcategory",
      "confidence": 80
    },
    ...
  ],
  "attributeSuggestions": {
    "attributeName1": "suggested value",
    "attributeName2": ["option1", "option2", "option3"],
    ...
  }
}`;
  }

  /**
   * Create system prompt for attribute extraction
   */
  private constructAttributeExtractionPrompt(): string {
    return `You are an expert in product data analysis for e-commerce platforms.
Your task is to extract structured product attributes from unstructured product text.

INSTRUCTIONS:
- Analyze the provided product text
- Extract key product attributes and their values
- Identify distinct product features
- Extract technical specifications in a structured format
- Organize the information in a clean, consistent structure
- Convert measurements to standard formats
- Prioritize accuracy over completeness

OUTPUT FORMAT:
Provide your response in JSON format with these fields:
{
  "extractedAttributes": {
    "color": "value",
    "size": "value",
    "material": "value",
    ...
  },
  "features": [
    "Feature 1",
    "Feature 2",
    ...
  ],
  "specifications": {
    "weight": "150g",
    "dimensions": "10 x 5 x 2 cm",
    ...
  }
}`;
  }

  /**
   * Get estimated output tokens based on description length
   * @param length Description length option
   */
  private getEstimatedOutputTokens(length: 'short' | 'medium' | 'long'): number {
    switch (length) {
      case 'short':
        return 300;
      case 'medium':
        return 600;
      case 'long':
        return 1200;
      default:
        return 600;
    }
  }
}