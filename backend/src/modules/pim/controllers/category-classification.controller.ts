import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Get,
  Param,
  Query,
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
import { FirebaseAuthGuard } from '../../auth';
import { CategoryService } from '../services/category.service';
import { ProductAiService } from '../services/product-ai.service';
import { ProductService } from '../services/product.service';
import { ProductAttribute } from '../interfaces/types';

/**
 * DTO for product classification
 */
class ClassifyProductDto {
  /**
   * Product ID to classify (optional)
   * If provided, product data will be fetched automatically
   */
  productId?: string;

  /**
   * Product data for classification
   * Only required if no productId is provided
   */
  productData?: {
    name: string;
    description: string;
    attributes?: ProductAttribute[];
    features?: string[];
  };
}

/**
 * DTO for applying classification results
 */
class ApplyClassificationDto {
  /**
   * Product ID to update
   */
  productId!: string;

  /**
   * Category ID to assign
   */
  categoryId!: string;

  /**
   * Attributes to apply (optional)
   */
  attributes?: Record<string, any>;
}

/**
 * DTO for bulk classification
 */
class BulkClassifyProductsDto {
  /**
   * List of product IDs to classify
   */
  productIds!: string[];
}

/**
 * Controller for AI-powered category classification
 * Optimized for South African marketplace categories
 */
@ApiTags('pim-category-classification')
@Controller('pim/category-classification')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
@UseInterceptors(LoggingInterceptor, TracingInterceptor)
export class CategoryClassificationController {
  constructor(
    private readonly productAiService: ProductAiService,
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
  ) {}

  /**
   * Classify a product into categories using AI
   */
  @Post('classify')
  @ApiOperation({ summary: 'Classify a product into categories using AI' })
  @ApiResponse({ status: 201, description: 'Product classification results' })
  async classifyProduct(
    @Body() dto: ClassifyProductDto,
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
          description: product.description || '',
          attributes: product.attributes || [],
          features: [],
        };
      } else if (dto.productData) {
        // Use provided product data
        productData = dto.productData;
      } else {
        throw new BadRequestException(
          'Either productId or productData must be provided',
        );
      }

      // Classify product
      const classificationResult = await this.productAiService.classifyProduct(
        productData,
        user.organizationId,
        user.uid,
      );

      // If product ID is provided, enhance results with available categories
      if (dto.productId && classificationResult.success) {
        let aiCategories: { path: string; confidence: number }[] = [];
        if (Array.isArray(classificationResult.categories)) {
          if (
            classificationResult.categories.length > 0 &&
            typeof classificationResult.categories[0] === 'string'
          ) {
            aiCategories = (classificationResult.categories as string[]).map((cat) => ({ path: cat, confidence: 1 }));
          } else {
            aiCategories = (classificationResult.categories as unknown[]).filter(
              (cat): cat is { path: string; confidence: number } =>
                typeof cat === 'object' &&
                cat !== null &&
                'path' in cat &&
                'confidence' in cat
            );
          }
        }
        const enhancedCategories = await this.enhanceWithCategoryIds(
          aiCategories,
          user.organizationId,
        );

        return {
          ...classificationResult,
          categories: enhancedCategories,
        };
      }

      return classificationResult;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to classify product: ${error.message}`,
      );
    }
  }

  /**
   * Apply classification results to a product
   */
  @Post('apply-classification')
  @ApiOperation({ summary: 'Apply classification results to a product' })
  @ApiResponse({
    status: 200,
    description: 'Classification applied successfully',
  })
  async applyClassification(
    @Body() dto: ApplyClassificationDto,
    @GetUser() user: any,
  ): Promise<any> {
    try {
      // Verify product exists
      const product = await this.productService.findById(
        dto.productId,
        user.organizationId,
      );
      if (!product) {
        throw new BadRequestException(
          `Product not found with ID: ${dto.productId}`,
        );
      }

      // Verify category exists
      const category = await this.categoryService.getCategoryById(
        dto.categoryId,
        user.organizationId,
      );
      if (!category) {
        throw new BadRequestException(
          `Category not found with ID: ${dto.categoryId}`,
        );
      }

      // Update product with category
      const updates: any = { categoryId: dto.categoryId };

      // Add attributes if provided
      if (dto.attributes) {
        updates.attributes = dto.attributes;
      }

      // Update product
      const updatedProduct = await this.productService.update(
        dto.productId,
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
        `Failed to apply classification: ${error.message}`,
      );
    }
  }

  /**
   * Bulk classify products
   */
  @Post('bulk-classify')
  @ApiOperation({ summary: 'Bulk classify products' })
  @ApiResponse({
    status: 202,
    description: 'Bulk classification job submitted',
  })
  async bulkClassifyProducts(
    @Body() dto: BulkClassifyProductsDto,
    @GetUser() user: any,
  ): Promise<any> {
    try {
      if (!dto.productIds || dto.productIds.length === 0) {
        throw new BadRequestException('Product IDs are required');
      }

      if (dto.productIds.length > 50) {
        throw new BadRequestException(
          'Maximum 50 products can be classified in a single batch',
        );
      }

      // Create a job ID
      const jobId = `bulk-classify-${Date.now()}`;

      // Start async processing (in a real impl, this would be a background job)
      // For now, we'll just return a job ID
      return {
        success: true,
        jobId,
        message: `Started classification of ${dto.productIds.length} products`,
        status: 'PROCESSING',
        estimatedCompletionTime: new Date(
          Date.now() + 60000 * Math.ceil(dto.productIds.length / 5),
        ),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to start bulk classification: ${error.message}`,
      );
    }
  }

  /**
   * Get bulk classification job status
   */
  @Get('bulk-job/:jobId')
  @ApiOperation({ summary: 'Get bulk classification job status' })
  @ApiResponse({ status: 200, description: 'Job status' })
  async getBulkJobStatus(
    @Param('jobId') jobId: string,
    @GetUser() user: any,
  ): Promise<any> {
    // This is a placeholder implementation
    // In a real system, this would fetch the job status from a database or queue
    return {
      jobId,
      status: 'PROCESSING',
      progress: {
        total: 10,
        completed: 5,
        pending: 5,
      },
      message: 'Processing products...',
    };
  }

  /**
   * Helper to match AI-suggested category paths to actual category IDs
   */
  private async enhanceWithCategoryIds(
    categories: Array<{ path: string; confidence: number }>,
    organizationId: string,
  ): Promise<
    Array<{
      path: string;
      confidence: number;
      categoryId?: string;
      exists: boolean;
    }>
  > {
    // Get all available categories
    const { items: allCategories } = await this.categoryService.findCategories({
      organizationId,
    });

    // Map of category path -> category ID
    const categoryPathMap = new Map<string, string>();

    // Build path map
    for (const category of allCategories) {
      const path = this.buildCategoryPath(category, allCategories);
      categoryPathMap.set(path.toLowerCase(), category.id);
    }

    // Match category paths to IDs
    return categories.map((category) => {
      const normalizedPath = category.path.toLowerCase();
      const categoryId = categoryPathMap.get(normalizedPath);

      return {
        ...category,
        categoryId,
        exists: !!categoryId,
      };
    });
  }

  /**
   * Build a full category path for a category
   */
  private buildCategoryPath(category: any, allCategories: any[]): string {
    const pathParts = [category.name];

    let currentCategory = category;
    while (currentCategory.parentId) {
      const parent = allCategories.find(
        (c) => c.id === currentCategory.parentId,
      );
      if (!parent) break;

      pathParts.unshift(parent.name);
      currentCategory = parent;
    }

    return pathParts.join(' > ');
  }
}
