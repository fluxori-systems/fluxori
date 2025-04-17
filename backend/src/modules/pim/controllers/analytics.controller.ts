import {
  Controller,
  Get,
  UseGuards,
  UseInterceptors,
  Query,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';

import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { LoggingInterceptor } from '../../../common/observability/interceptors/logging.interceptor';
import { TracingInterceptor } from '../../../common/observability/interceptors/tracing.interceptor';
import { LoadSheddingResilienceService } from '../services/load-shedding-resilience.service';
import { NetworkAwareStorageService } from '../services/network-aware-storage.service';
import { Product } from '../models/product.model';
import { Category } from '../models/category.model';

/**
 * Controller for PIM analytics
 * Optimized for South African market with load shedding resilience
 */
@ApiTags('pim-analytics')
@Controller('pim/analytics')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
@UseInterceptors(LoggingInterceptor, TracingInterceptor)
export class AnalyticsController {
  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly loadSheddingService: LoadSheddingResilienceService,
    private readonly networkAwareStorageService: NetworkAwareStorageService,
  ) {}

  /**
   * Get catalog completeness metrics
   */
  @Get('catalog-completeness')
  @ApiOperation({ summary: 'Get catalog completeness metrics' })
  @ApiResponse({ status: 200, description: 'Catalog completeness metrics' })
  @ApiQuery({ name: 'includeProducts', required: false, type: Boolean })
  async getCatalogCompleteness(
    @GetUser() user: any,
    @Query('includeProducts') includeProducts?: boolean,
  ): Promise<any> {
    try {
      // Get network and power conditions
      const networkQuality = await this.networkAwareStorageService.getNetworkQuality();
      const loadSheddingStatus = await this.loadSheddingService.getCurrentStatus();
      
      // Determine if we should return detailed or lightweight results
      const isLightweightMode = networkQuality.quality === 'low' || 
                               (loadSheddingStatus.currentStage || loadSheddingStatus.stage) > 2;
      
      // Get products (apply limits based on network conditions)
      const productsResult = await this.productService.findProducts({
        organizationId: user.organizationId,
        limit: isLightweightMode ? 100 : 1000,
      });
      
      const products = productsResult.items;
      
      // Basic metrics
      const totalProducts = products.length;
      let productsWithDescription = 0;
      let productsWithImages = 0;
      let productsWithCategory = 0;
      let productsWithAttributes = 0;
      let productsWithPrice = 0;
      
      // Calculate metrics
      for (const product of products) {
        if (product.description && product.description.length > 10) productsWithDescription++;
        if (product.images && product.images.main) productsWithImages++;
        if (product.categories && product.categories.length > 0) productsWithCategory++;
        if (product.attributes && product.attributes.length > 0) productsWithAttributes++;
        if (product.pricing && product.pricing.basePrice > 0) productsWithPrice++;
      }
      
      // Calculate scores
      const descriptionScore = totalProducts > 0 ? (productsWithDescription / totalProducts) * 100 : 0;
      const imageScore = totalProducts > 0 ? (productsWithImages / totalProducts) * 100 : 0;
      const categoryScore = totalProducts > 0 ? (productsWithCategory / totalProducts) * 100 : 0;
      const attributeScore = totalProducts > 0 ? (productsWithAttributes / totalProducts) * 100 : 0;
      const priceScore = totalProducts > 0 ? (productsWithPrice / totalProducts) * 100 : 0;
      
      // Overall score
      const overallScore = (descriptionScore + imageScore + categoryScore + attributeScore + priceScore) / 5;
      
      // Construct response
      const result: any = {
        metrics: {
          overallCompleteness: Math.round(overallScore * 10) / 10,
          totalProducts,
          breakdown: {
            description: {
              count: productsWithDescription,
              percentage: Math.round(descriptionScore * 10) / 10,
            },
            images: {
              count: productsWithImages,
              percentage: Math.round(imageScore * 10) / 10,
            },
            category: {
              count: productsWithCategory,
              percentage: Math.round(categoryScore * 10) / 10,
            },
            attributes: {
              count: productsWithAttributes,
              percentage: Math.round(attributeScore * 10) / 10,
            },
            price: {
              count: productsWithPrice,
              percentage: Math.round(priceScore * 10) / 10,
            },
          },
        },
        optimizationRecommendations: this.getOptimizationRecommendations({
          descriptionScore,
          imageScore,
          categoryScore,
          attributeScore,
          priceScore,
        }),
        networkAwareness: {
          mode: isLightweightMode ? 'lightweight' : 'full',
          networkQuality: networkQuality.quality,
          loadSheddingStage: loadSheddingStatus.currentStage,
        },
      };
      
      // Include incomplete products if requested and not in lightweight mode
      if (includeProducts && !isLightweightMode) {
        const incompleteProducts = products
          .filter((p: Product) => {
            const hasDescription = p.description && p.description.length > 10;
            const hasImages = p.images && p.images.main;
            const hasCategory = p.categories && p.categories.length > 0;
            const hasAttributes = p.attributes && p.attributes.length > 0;
            const hasPrice = p.pricing && p.pricing.basePrice > 0;
            
            return !(hasDescription && hasImages && hasCategory && hasAttributes && hasPrice);
          })
          .map((p: Product) => ({
            id: p.id,
            name: p.name,
            missing: [
              ...(!p.description || p.description.length <= 10 ? ['description'] : []),
              ...(!p.images || !p.images.main ? ['images'] : []),
              ...(!p.categories || p.categories.length === 0 ? ['category'] : []),
              ...(!p.attributes || p.attributes.length === 0 ? ['attributes'] : []),
              ...(!p.pricing || p.pricing.basePrice <= 0 ? ['price'] : []),
            ],
          }));
        
        result.incompleteProducts = incompleteProducts.slice(0, 100); // Limit to 100 items
      }
      
      return result;
    } catch (error) {
      throw new BadRequestException(`Failed to get catalog completeness: ${error.message}`);
    }
  }

  /**
   * Get category distribution report
   */
  @Get('category-distribution')
  @ApiOperation({ summary: 'Get category distribution report' })
  @ApiResponse({ status: 200, description: 'Category distribution report' })
  async getCategoryDistribution(
    @GetUser() user: any,
  ): Promise<any> {
    try {
      // Get network and power conditions
      const networkQuality = await this.networkAwareStorageService.getNetworkQuality();
      const loadSheddingStatus = await this.loadSheddingService.getCurrentStatus();
      
      // Determine if we should return detailed or lightweight results
      const isLightweightMode = networkQuality.quality === 'low' || 
                               (loadSheddingStatus.currentStage || loadSheddingStatus.stage) > 2;
      
      // Get all categories
      const categoriesResult = await this.categoryService.findCategories({
        organizationId: user.organizationId,
        includeChildren: !isLightweightMode,
      });
      const categories = categoriesResult.items;
      
      // Get all products (with category info)
      const productsResult = await this.productService.findProducts({
        organizationId: user.organizationId,
      });
      const products = productsResult.items;
      
      // Count products per category
      const categoryCounts = new Map<string, number>();
      
      for (const product of products) {
        if (product.categories && product.categories.length > 0) {
          // Count primary category (first in the list)
          const primaryCategoryId = product.categories[0].categoryId;
          const count = categoryCounts.get(primaryCategoryId) || 0;
          categoryCounts.set(primaryCategoryId, count + 1);
        }
      }
      
      // Map categories with counts
      const categoryDistribution = categories.map(category => ({
        id: category.id,
        name: category.name,
        parentId: category.parentId,
        level: category.level || 0,
        productCount: categoryCounts.get(category.id) || 0,
        percentage: categoryCounts.has(category.id) 
          ? (categoryCounts.get(category.id)! / products.length) * 100 
          : 0,
      }));
      
      // Calculate uncategorized products
      const categorizedProductsCount = Array.from(categoryCounts.values()).reduce((sum, count) => sum + count, 0);
      const uncategorizedCount = products.length - categorizedProductsCount;
      
      // Sort categories by product count (descending)
      categoryDistribution.sort((a, b) => b.productCount - a.productCount);
      
      return {
        distribution: categoryDistribution,
        summary: {
          totalProducts: products.length,
          categorizedProducts: categorizedProductsCount,
          uncategorizedProducts: uncategorizedCount,
          uncategorizedPercentage: (uncategorizedCount / products.length) * 100,
          topCategories: categoryDistribution.slice(0, 5),
        },
        networkAwareness: {
          mode: isLightweightMode ? 'lightweight' : 'full',
          networkQuality: networkQuality.quality,
          loadSheddingStage: loadSheddingStatus.currentStage,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get category distribution: ${error.message}`);
    }
  }

  /**
   * Get attribute usage analysis
   */
  @Get('attribute-usage')
  @ApiOperation({ summary: 'Get attribute usage analysis' })
  @ApiResponse({ status: 200, description: 'Attribute usage analysis' })
  async getAttributeUsage(
    @GetUser() user: any,
  ): Promise<any> {
    try {
      // Get network and power conditions
      const networkQuality = await this.networkAwareStorageService.getNetworkQuality();
      const loadSheddingStatus = await this.loadSheddingService.getCurrentStatus();
      
      // Determine if we should return detailed or lightweight results
      const isLightweightMode = networkQuality.quality === 'low' || 
                               (loadSheddingStatus.currentStage || loadSheddingStatus.stage) > 2;
      
      // Get products (apply limits based on network conditions)
      const productsResult = await this.productService.findProducts({
        organizationId: user.organizationId,
        limit: isLightweightMode ? 100 : 1000,
      });
      const products = productsResult.items;
      
      // Get categories for context
      const categoriesResult = await this.categoryService.findCategories({
        organizationId: user.organizationId,
      });
      const categories = categoriesResult.items;
      
      const categoryMap = new Map(categories.map(c => [c.id, c]));
      
      // Count attribute usage across all products
      const attributeCounts = new Map<string, { count: number; categoryIds: Set<string> }>();
      
      for (const product of products) {
        if (product.attributes && product.attributes.length > 0) {
          for (const attr of product.attributes) {
            const attrName = attr.code;
            const current = attributeCounts.get(attrName) || { count: 0, categoryIds: new Set() };
            current.count++;
            if (product.categories && product.categories.length > 0) {
              current.categoryIds.add(product.categories[0].id);
            }
            attributeCounts.set(attrName, current);
          }
        }
      }
      
      // Format results
      const attributeUsage = Array.from(attributeCounts.entries()).map(([name, data]) => ({
        name,
        usageCount: data.count,
        usagePercentage: (data.count / products.length) * 100,
        categoryCount: data.categoryIds.size,
        categories: Array.from(data.categoryIds).map(id => ({
          id,
          name: categoryMap.get(id)?.name || 'Unknown',
        })),
      }));
      
      // Sort by usage count (descending)
      attributeUsage.sort((a, b) => b.usageCount - a.usageCount);
      
      return {
        attributeUsage: isLightweightMode ? attributeUsage.slice(0, 20) : attributeUsage,
        summary: {
          totalProducts: products.length,
          totalAttributes: attributeUsage.length,
          topAttributes: attributeUsage.slice(0, 5),
          unusedAttributes: [], // Would require template attributes to determine
        },
        networkAwareness: {
          mode: isLightweightMode ? 'lightweight' : 'full',
          networkQuality: networkQuality.quality,
          loadSheddingStage: loadSheddingStatus.currentStage,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get attribute usage: ${error.message}`);
    }
  }

  /**
   * Get marketplace readiness report for a specific product
   */
  @Get('marketplace-readiness/:productId')
  @ApiOperation({ summary: 'Get marketplace readiness report for a product' })
  @ApiResponse({ status: 200, description: 'Marketplace readiness report' })
  @ApiQuery({ name: 'marketplace', required: false, description: 'Target marketplace (default: takealot)' })
  async getMarketplaceReadiness(
    @Param('productId') productId: string,
    @Query('marketplace') marketplace: string = 'takealot',
    @GetUser() user: any,
  ): Promise<any> {
    try {
      // Get product
      const product = await this.productService.findById(productId, user.organizationId);
      if (!product) {
        throw new BadRequestException(`Product not found with ID: ${productId}`);
      }
      
      // Basic readiness checks (example for Takealot)
      const checks = [];
      let readinessScore = 0;
      let possibleScore = 0;
      
      if (marketplace.toLowerCase() === 'takealot') {
        // Name check
        possibleScore += 10;
        const nameCheck = {
          name: 'Product Name',
          description: 'Product name should be 5-150 characters',
          passed: product.name && product.name.length >= 5 && product.name.length <= 150,
          value: product.name,
          recommendation: product.name 
            ? (product.name.length < 5 
                ? 'Name is too short, should be at least 5 characters' 
                : (product.name.length > 150 
                    ? 'Name is too long, should be maximum 150 characters' 
                    : 'Good'))
            : 'Missing product name',
        };
        checks.push(nameCheck);
        if (nameCheck.passed) readinessScore += 10;
        
        // Description check
        possibleScore += 20;
        const descriptionCheck = {
          name: 'Product Description',
          description: 'Product should have a detailed description of at least 100 characters',
          passed: product.description && product.description.length >= 100,
          value: product.description ? `${product.description.substring(0, 50)}...` : null,
          recommendation: product.description 
            ? (product.description.length < 100 
                ? 'Description is too short, should be at least 100 characters' 
                : 'Good')
            : 'Missing product description',
        };
        checks.push(descriptionCheck);
        if (descriptionCheck.passed) readinessScore += 20;
        
        // Image check
        possibleScore += 15;
        const imageCheck = {
          name: 'Product Images',
          description: 'Product should have at least one image',
          passed: product.images && product.images.main,
          value: product.images ? (product.images.main ? 1 : 0) : 0,
          recommendation: product.images && product.images.main 
            ? 'Good' 
            : 'Missing product images',
        };
        checks.push(imageCheck);
        if (imageCheck.passed) readinessScore += 15;
        
        // Price check
        possibleScore += 15;
        const priceCheck = {
          name: 'Product Price',
          description: 'Product should have a price greater than zero',
          passed: product.pricing && product.pricing.basePrice > 0,
          value: product.pricing ? product.pricing.basePrice : 0,
          recommendation: product.pricing && product.pricing.basePrice > 0 
            ? 'Good' 
            : 'Missing or invalid product price',
        };
        checks.push(priceCheck);
        if (priceCheck.passed) readinessScore += 15;
        
        // Category check
        possibleScore += 15;
        const categoryCheck = {
          name: 'Product Category',
          description: 'Product should be assigned to a category',
          passed: product.categories && product.categories.length > 0,
          value: product.categories && product.categories.length > 0 ? product.categories[0].id : null,
          recommendation: product.categories && product.categories.length > 0
            ? 'Good' 
            : 'Product is not assigned to a category',
        };
        checks.push(categoryCheck);
        if (categoryCheck.passed) readinessScore += 15;
        
        // Attributes check
        possibleScore += 15;
        const attributesCheck = {
          name: 'Product Attributes',
          description: 'Product should have basic attributes',
          passed: product.attributes && product.attributes.length >= 3,
          value: product.attributes ? product.attributes.length : 0,
          recommendation: product.attributes 
            ? (product.attributes.length < 3 
                ? 'Too few attributes, should have at least 3 key attributes' 
                : 'Good')
            : 'Missing product attributes',
        };
        checks.push(attributesCheck);
        if (attributesCheck.passed) readinessScore += 15;
      }
      
      // Calculate overall score
      const overallScore = possibleScore > 0 ? (readinessScore / possibleScore) * 100 : 0;
      
      return {
        productId,
        marketplace,
        overallReadiness: {
          score: Math.round(overallScore * 10) / 10,
          status: overallScore >= 90 
            ? 'READY' 
            : (overallScore >= 70 
                ? 'PARTIALLY_READY' 
                : 'NOT_READY'),
        },
        checks,
        summary: {
          passedChecks: checks.filter(c => c.passed).length,
          totalChecks: checks.length,
          criticalIssues: checks.filter(c => !c.passed && ['Product Name', 'Product Price'].includes(c.name)).length,
          majorIssues: checks.filter(c => !c.passed && !['Product Name', 'Product Price'].includes(c.name)).length,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get marketplace readiness: ${error.message}`);
    }
  }

  /**
   * Get optimization recommendations based on completeness scores
   */
  private getOptimizationRecommendations(scores: {
    descriptionScore: number;
    imageScore: number;
    categoryScore: number;
    attributeScore: number;
    priceScore: number;
  }): Array<{ priority: 'high' | 'medium' | 'low'; area: string; recommendation: string }> {
    const recommendations: Array<{ priority: 'high' | 'medium' | 'low'; area: string; recommendation: string }> = [];
    
    // Description recommendations
    if (scores.descriptionScore < 50) {
      recommendations.push({
        priority: 'high',
        area: 'Product Descriptions',
        recommendation: 'Most products are missing descriptions. Use AI-powered description generation to quickly add quality content.',
      });
    } else if (scores.descriptionScore < 80) {
      recommendations.push({
        priority: 'medium',
        area: 'Product Descriptions',
        recommendation: 'Some products need descriptions. Focus on high-value products first.',
      });
    }
    
    // Image recommendations
    if (scores.imageScore < 50) {
      recommendations.push({
        priority: 'high',
        area: 'Product Images',
        recommendation: 'Most products are missing images. Add at least one image per product, prioritizing bestsellers.',
      });
    } else if (scores.imageScore < 80) {
      recommendations.push({
        priority: 'medium',
        area: 'Product Images',
        recommendation: 'Some products need images. Ensure all visible products have quality images.',
      });
    }
    
    // Category recommendations
    if (scores.categoryScore < 70) {
      recommendations.push({
        priority: 'high',
        area: 'Product Categories',
        recommendation: 'Many products are uncategorized. Use AI classification to assign categories quickly.',
      });
    } else if (scores.categoryScore < 90) {
      recommendations.push({
        priority: 'medium',
        area: 'Product Categories',
        recommendation: 'Some products need categorization. Review and assign appropriate categories.',
      });
    }
    
    // Attribute recommendations
    if (scores.attributeScore < 60) {
      recommendations.push({
        priority: 'high',
        area: 'Product Attributes',
        recommendation: 'Many products have insufficient attributes. Add key attributes to improve search visibility.',
      });
    } else if (scores.attributeScore < 85) {
      recommendations.push({
        priority: 'medium',
        area: 'Product Attributes',
        recommendation: 'Some products need more detailed attributes. Use attribute extraction to improve data quality.',
      });
    }
    
    // Price recommendations
    if (scores.priceScore < 90) {
      recommendations.push({
        priority: 'high',
        area: 'Product Pricing',
        recommendation: 'Some products are missing prices. Add pricing information to enable sales.',
      });
    }
    
    // Sort by priority
    return recommendations.sort((a, b) => {
      const priorityMap = { high: 0, medium: 1, low: 2 };
      return priorityMap[a.priority] - priorityMap[b.priority];
    });
  }
}