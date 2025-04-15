import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';

import { BundleService } from '../services/bundle.service';
import { ProductService } from '../services/product.service';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { LoggingInterceptor } from '../../../common/observability/interceptors/logging.interceptor';
import { TracingInterceptor } from '../../../common/observability/interceptors/tracing.interceptor';

/**
 * DTO for creating a product bundle
 */
class CreateBundleDto {
  /**
   * Name of the bundle
   */
  name: string;

  /**
   * Description of the bundle
   */
  description?: string;

  /**
   * SKU for the bundle
   */
  sku: string;

  /**
   * Components of the bundle
   */
  components: Array<{
    /**
     * Product ID of the component
     */
    productId: string;

    /**
     * SKU of the component
     */
    sku?: string;

    /**
     * Quantity of the component in the bundle
     */
    quantity: number;

    /**
     * Whether the component is required
     */
    isRequired?: boolean;
  }>;

  /**
   * Pricing strategy for the bundle
   */
  pricingStrategy: 'FIXED_PRICE' | 'DISCOUNT_PERCENTAGE' | 'COMPONENT_SUM' | 'CUSTOM_FORMULA';

  /**
   * Price or discount value (depends on strategy)
   * For FIXED_PRICE: the actual price
   * For DISCOUNT_PERCENTAGE: the discount percentage (0-100)
   * For COMPONENT_SUM: ignored
   * For CUSTOM_FORMULA: custom formula expression
   */
  pricingValue?: number | string;

  /**
   * Category ID for the bundle
   */
  categoryId?: string;

  /**
   * Images for the bundle
   */
  images?: string[];

  /**
   * Additional attributes for the bundle
   */
  attributes?: Record<string, any>;

  /**
   * Whether the bundle is active
   */
  isActive?: boolean;
}

/**
 * DTO for updating a product bundle
 */
class UpdateBundleDto {
  /**
   * Name of the bundle
   */
  name?: string;

  /**
   * Description of the bundle
   */
  description?: string;

  /**
   * SKU for the bundle
   */
  sku?: string;

  /**
   * Components of the bundle
   */
  components?: Array<{
    /**
     * Product ID of the component
     */
    productId: string;

    /**
     * SKU of the component
     */
    sku?: string;

    /**
     * Quantity of the component in the bundle
     */
    quantity: number;

    /**
     * Whether the component is required
     */
    isRequired?: boolean;
  }>;

  /**
   * Pricing strategy for the bundle
   */
  pricingStrategy?: 'FIXED_PRICE' | 'DISCOUNT_PERCENTAGE' | 'COMPONENT_SUM' | 'CUSTOM_FORMULA';

  /**
   * Price or discount value (depends on strategy)
   */
  pricingValue?: number | string;

  /**
   * Category ID for the bundle
   */
  categoryId?: string;

  /**
   * Images for the bundle
   */
  images?: string[];

  /**
   * Additional attributes for the bundle
   */
  attributes?: Record<string, any>;

  /**
   * Whether the bundle is active
   */
  isActive?: boolean;
}

/**
 * DTO for adding a component to a bundle
 */
class AddComponentDto {
  /**
   * Product ID of the component
   */
  productId: string;

  /**
   * SKU of the component
   */
  sku?: string;

  /**
   * Quantity of the component in the bundle
   */
  quantity: number;

  /**
   * Whether the component is required
   */
  isRequired?: boolean;
}

/**
 * DTO for updating a bundle component
 */
class UpdateComponentDto {
  /**
   * Product ID of the component
   */
  productId: string;

  /**
   * SKU of the component
   */
  sku?: string;

  /**
   * Quantity of the component in the bundle
   */
  quantity?: number;

  /**
   * Whether the component is required
   */
  isRequired?: boolean;
}

/**
 * Controller for product bundle operations
 * Provides endpoints for managing product bundles
 */
@ApiTags('pim-bundles')
@Controller('pim/bundles')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
@UseInterceptors(LoggingInterceptor, TracingInterceptor)
export class BundleController {
  constructor(
    private readonly bundleService: BundleService,
    private readonly productService: ProductService,
  ) {}

  /**
   * Create a new product bundle
   */
  @Post()
  @ApiOperation({ summary: 'Create a new product bundle' })
  @ApiResponse({ status: 201, description: 'Bundle created successfully' })
  async createBundle(
    @Body() dto: CreateBundleDto,
    @GetUser() user: any,
  ): Promise<any> {
    try {
      // Validate components
      if (!dto.components || dto.components.length === 0) {
        throw new BadRequestException('Bundle must have at least one component');
      }
      
      // Validate pricing strategy
      const validStrategies = ['FIXED_PRICE', 'DISCOUNT_PERCENTAGE', 'COMPONENT_SUM', 'CUSTOM_FORMULA'];
      if (!validStrategies.includes(dto.pricingStrategy)) {
        throw new BadRequestException(`Invalid pricing strategy. Must be one of: ${validStrategies.join(', ')}`);
      }
      
      // Validate each component exists
      for (const component of dto.components) {
        const product = await this.productService.findById(component.productId, user.organizationId);
        if (!product) {
          throw new BadRequestException(`Component product not found: ${component.productId}`);
        }
      }
      
      // Create bundle
      const bundle = await this.bundleService.createBundle(dto, user.organizationId);
      
      return bundle;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create bundle: ${error.message}`);
    }
  }

  /**
   * Get a product bundle by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a product bundle by ID' })
  @ApiResponse({ status: 200, description: 'Bundle details' })
  async getBundle(
    @Param('id') id: string,
    @GetUser() user: any,
  ): Promise<any> {
    try {
      const bundle = await this.bundleService.getBundleById(id, user.organizationId);
      if (!bundle) {
        throw new NotFoundException(`Bundle not found with ID: ${id}`);
      }
      
      return bundle;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to get bundle: ${error.message}`);
    }
  }

  /**
   * Get all product bundles
   */
  @Get()
  @ApiOperation({ summary: 'Get all product bundles' })
  @ApiResponse({ status: 200, description: 'List of bundles' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async getAllBundles(
    @GetUser() user: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('isActive') isActive?: boolean,
  ): Promise<any> {
    try {
      const bundles = await this.bundleService.getAllBundles(
        user.organizationId,
        { limit, offset, isActive: isActive !== undefined ? isActive : true },
      );
      
      return bundles;
    } catch (error) {
      throw new BadRequestException(`Failed to get bundles: ${error.message}`);
    }
  }

  /**
   * Update a product bundle
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a product bundle' })
  @ApiResponse({ status: 200, description: 'Bundle updated successfully' })
  async updateBundle(
    @Param('id') id: string,
    @Body() dto: UpdateBundleDto,
    @GetUser() user: any,
  ): Promise<any> {
    try {
      // Check bundle exists
      const bundle = await this.bundleService.getBundleById(id, user.organizationId);
      if (!bundle) {
        throw new NotFoundException(`Bundle not found with ID: ${id}`);
      }
      
      // Validate components if provided
      if (dto.components) {
        if (dto.components.length === 0) {
          throw new BadRequestException('Bundle must have at least one component');
        }
        
        // Validate each component exists
        for (const component of dto.components) {
          const product = await this.productService.findById(component.productId, user.organizationId);
          if (!product) {
            throw new BadRequestException(`Component product not found: ${component.productId}`);
          }
        }
      }
      
      // Validate pricing strategy if provided
      if (dto.pricingStrategy) {
        const validStrategies = ['FIXED_PRICE', 'DISCOUNT_PERCENTAGE', 'COMPONENT_SUM', 'CUSTOM_FORMULA'];
        if (!validStrategies.includes(dto.pricingStrategy)) {
          throw new BadRequestException(`Invalid pricing strategy. Must be one of: ${validStrategies.join(', ')}`);
        }
      }
      
      // Update bundle
      const updatedBundle = await this.bundleService.updateBundle(id, dto, user.organizationId);
      
      return updatedBundle;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update bundle: ${error.message}`);
    }
  }

  /**
   * Delete a product bundle
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product bundle' })
  @ApiResponse({ status: 200, description: 'Bundle deleted successfully' })
  async deleteBundle(
    @Param('id') id: string,
    @GetUser() user: any,
  ): Promise<any> {
    try {
      // Check bundle exists
      const bundle = await this.bundleService.getBundleById(id, user.organizationId);
      if (!bundle) {
        throw new NotFoundException(`Bundle not found with ID: ${id}`);
      }
      
      // Delete bundle
      await this.bundleService.deleteBundle(id, user.organizationId);
      
      return { success: true, message: 'Bundle deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete bundle: ${error.message}`);
    }
  }

  /**
   * Add a component to a bundle
   */
  @Post(':id/components')
  @ApiOperation({ summary: 'Add a component to a bundle' })
  @ApiResponse({ status: 201, description: 'Component added successfully' })
  async addComponent(
    @Param('id') id: string,
    @Body() dto: AddComponentDto,
    @GetUser() user: any,
  ): Promise<any> {
    try {
      // Check bundle exists
      const bundle = await this.bundleService.getBundleById(id, user.organizationId);
      if (!bundle) {
        throw new NotFoundException(`Bundle not found with ID: ${id}`);
      }
      
      // Check component product exists
      const product = await this.productService.findById(dto.productId, user.organizationId);
      if (!product) {
        throw new BadRequestException(`Component product not found: ${dto.productId}`);
      }
      
      // Add component
      const updatedBundle = await this.bundleService.addComponent(id, dto, user.organizationId);
      
      return updatedBundle;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to add component: ${error.message}`);
    }
  }

  /**
   * Update a bundle component
   */
  @Put(':id/components/:productId')
  @ApiOperation({ summary: 'Update a bundle component' })
  @ApiResponse({ status: 200, description: 'Component updated successfully' })
  async updateComponent(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateComponentDto,
    @GetUser() user: any,
  ): Promise<any> {
    try {
      // Check bundle exists
      const bundle = await this.bundleService.getBundleById(id, user.organizationId);
      if (!bundle) {
        throw new NotFoundException(`Bundle not found with ID: ${id}`);
      }
      
      // Check component exists in bundle
      const componentExists = bundle.components?.some(c => c.productId === productId);
      if (!componentExists) {
        throw new NotFoundException(`Component with product ID ${productId} not found in bundle`);
      }
      
      // Update component
      const updatedBundle = await this.bundleService.updateComponent(
        id,
        productId,
        dto,
        user.organizationId,
      );
      
      return updatedBundle;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update component: ${error.message}`);
    }
  }

  /**
   * Remove a component from a bundle
   */
  @Delete(':id/components/:productId')
  @ApiOperation({ summary: 'Remove a component from a bundle' })
  @ApiResponse({ status: 200, description: 'Component removed successfully' })
  async removeComponent(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @GetUser() user: any,
  ): Promise<any> {
    try {
      // Check bundle exists
      const bundle = await this.bundleService.getBundleById(id, user.organizationId);
      if (!bundle) {
        throw new NotFoundException(`Bundle not found with ID: ${id}`);
      }
      
      // Check component exists in bundle
      const componentExists = bundle.components?.some(c => c.productId === productId);
      if (!componentExists) {
        throw new NotFoundException(`Component with product ID ${productId} not found in bundle`);
      }
      
      // Remove component
      const updatedBundle = await this.bundleService.removeComponent(id, productId, user.organizationId);
      
      return updatedBundle;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to remove component: ${error.message}`);
    }
  }

  /**
   * Calculate bundle price
   */
  @Get(':id/price')
  @ApiOperation({ summary: 'Calculate the current price of a bundle' })
  @ApiResponse({ status: 200, description: 'Bundle price' })
  async calculateBundlePrice(
    @Param('id') id: string,
    @GetUser() user: any,
  ): Promise<any> {
    try {
      // Check bundle exists
      const bundle = await this.bundleService.getBundleById(id, user.organizationId);
      if (!bundle) {
        throw new NotFoundException(`Bundle not found with ID: ${id}`);
      }
      
      // Calculate price
      const price = await this.bundleService.calculateBundlePrice(id, user.organizationId);
      
      return {
        bundleId: id,
        price: price.final,
        componentTotal: price.componentTotal,
        discount: price.discount,
        pricingStrategy: bundle.pricingStrategy,
        pricingValue: bundle.pricingValue,
        calculationDetails: price.calculationDetails,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to calculate bundle price: ${error.message}`);
    }
  }
}