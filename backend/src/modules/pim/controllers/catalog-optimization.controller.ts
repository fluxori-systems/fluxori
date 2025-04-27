import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  Param,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { LoggingInterceptor } from '../../../common/observability/interceptors/logging.interceptor';
import { TracingInterceptor } from '../../../common/observability/interceptors/tracing.interceptor';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { ProductAiService } from '../services/product-ai.service';
import { ProductService } from '../services/product.service';

/**
 * DTO for generating product descriptions
 */
class GenerateProductDescriptionDto {
  /**
   * Product ID to generate description for
   * If provided, product data will be fetched automatically
   */
  productId?: string;

  /**
   * Product data for description generation
   * Only required if no productId is provided
   */
  productData?: {
    name: string;
    category: string;
    attributes: Record<string, any>;
    features?: string[];
    keywords?: string[];
    targetAudience?: string;
    tone?: string;
  };

  /**
   * Description length preference
   * @default "medium"
   */
  length?: 'short' | 'medium' | 'long' = 'medium';

  /**
   * Whether to optimize for SEO
   * @default true
   */
  seoOptimized?: boolean = true;

  /**
   * Whether to optimize for a specific marketplace
   * @default false
   */
  marketplaceOptimized?: boolean = false;

  /**
   * Target marketplace for optimization
   * @example "takealot"
   */
  targetMarketplace?: string;

  /**
   * Language for the description
   * @default "en"
   */
  language?: string = 'en';
}

/**
 * DTO for SEO optimization
 */
class SeoOptimizationDto {
  /**
   * Product ID to optimize
   */
  productId!: string;
}

/**
 * DTO for attribute extraction
 */
class AttributeExtractionDto {
  /**
   * Unstructured product text to extract attributes from
   */
  productText!: string;

  /**
   * Product category for context (optional)
   */
  category?: string;
}

/**
 * Controller for catalog optimization operations
 * Provides AI-powered catalog enhancement features
 */
@ApiTags('pim-catalog-optimization')
@Controller('pim/catalog-optimization')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
@UseInterceptors(LoggingInterceptor, TracingInterceptor)
export class CatalogOptimizationController {
  constructor(
    private readonly productAiService: ProductAiService,
    private readonly productService: ProductService,
  ) {}

  /**
   * Generate a product description using AI
   * Optimized for South African market with credit system integration
   */
  @Post('description')
  @ApiOperation({ summary: 'Generate AI-powered product description' })
  @ApiResponse({
    status: 201,
    description: 'Product description generated successfully',
  })
  async generateProductDescription(
    @Body() dto: GenerateProductDescriptionDto,
    @GetUser() user: any,
  ): Promise<any> {
    try {
      let productData: any;

      // If productId is provided, fetch product data
      if (dto.productId) {
        const product = await this.productService.findById(
          dto.productId,
          user.organizationId,
        );
        if (!product) {
          throw new BadRequestException(
            `Product not found with ID: ${dto.productId}`,
          );
        }

        // Format product data for AI service
        productData = {
          name: product.name,
          category: product.category?.name || '',
          attributes: product.attributes || {},
          features: product.features || [],
          keywords: product.keywords || [],
          targetAudience: product.targetAudience || '',
          tone: product.tone || 'professional',
        };
      } else if (dto.productData) {
        // Use provided product data
        productData = dto.productData;
      } else {
        throw new BadRequestException(
          'Either productId or productData must be provided',
        );
      }

      // Generate description
      const result = await this.productAiService.generateProductDescription(
        productData,
        user.organizationId,
        user.uid,
        {
          length: dto.length,
          seoOptimized: dto.seoOptimized,
          marketplaceOptimized: dto.marketplaceOptimized,
          targetMarketplace: dto.targetMarketplace,
          language: dto.language,
        },
      );

      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to generate product description: ${error.message}`,
      );
    }
  }

  /**
   * Generate SEO optimization suggestions for a product
   */
  @Post('seo-optimization')
  @ApiOperation({ summary: 'Generate SEO optimization suggestions' })
  @ApiResponse({
    status: 201,
    description: 'SEO suggestions generated successfully',
  })
  async generateSeoSuggestions(
    @Body() dto: SeoOptimizationDto,
    @GetUser() user: any,
  ): Promise<any> {
    try {
      // Fetch product
      const product = await this.productService.findById(
        dto.productId,
        user.organizationId,
      );
      if (!product) {
        throw new BadRequestException(
          `Product not found with ID: ${dto.productId}`,
        );
      }

      // Format product data
      const productData = {
        id: product.id,
        name: product.name,
        description: product.description || '',
        category: product.category?.name || '',
        attributes: product.attributes || {},
      };

      // Generate SEO suggestions
      const result = await this.productAiService.generateSeoSuggestions(
        productData,
        user.organizationId,
        user.uid,
      );

      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to generate SEO suggestions: ${error.message}`,
      );
    }
  }

  /**
   * Extract product attributes from unstructured text
   */
  @Post('extract-attributes')
  @ApiOperation({
    summary: 'Extract product attributes from unstructured text',
  })
  @ApiResponse({
    status: 201,
    description: 'Attributes extracted successfully',
  })
  async extractAttributes(
    @Body() dto: AttributeExtractionDto,
    @GetUser() user: any,
  ): Promise<any> {
    try {
      if (!dto.productText || dto.productText.trim().length === 0) {
        throw new BadRequestException('Product text is required');
      }

      // Extract attributes
      const result = await this.productAiService.extractProductAttributes(
        dto.productText,
        user.organizationId,
        user.uid,
      );

      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to extract attributes: ${error.message}`,
      );
    }
  }

  /**
   * Apply generated description to a product
   */
  @Post('apply-description/:productId')
  @ApiOperation({ summary: 'Apply generated description to a product' })
  @ApiResponse({ status: 200, description: 'Description applied successfully' })
  async applyDescription(
    @Param('productId') productId: string,
    @Body() body: { description: string; seoMetadata?: any },
    @GetUser() user: any,
  ): Promise<any> {
    try {
      // Fetch product
      const product = await this.productService.findById(
        productId,
        user.organizationId,
      );
      if (!product) {
        throw new BadRequestException(
          `Product not found with ID: ${productId}`,
        );
      }

      // Update product with new description
      const updates: any = { description: body.description };

      // Add SEO metadata if provided
      if (body.seoMetadata) {
        if (body.seoMetadata.title) {
          updates.seoTitle = body.seoMetadata.title;
        }
        if (body.seoMetadata.description) {
          updates.seoDescription = body.seoMetadata.description;
        }
        if (
          body.seoMetadata.keywords &&
          Array.isArray(body.seoMetadata.keywords)
        ) {
          updates.keywords = body.seoMetadata.keywords;
        }
      }

      // Update product
      const updatedProduct = await this.productService.update(
        productId,
        updates,
        user.organizationId,
      );

      return {
        success: true,
        product: updatedProduct,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to apply description: ${error.message}`,
      );
    }
  }
}
