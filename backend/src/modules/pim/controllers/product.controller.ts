import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';

import { User } from '../../../types/google-cloud.types';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { ProductFilter } from '../interfaces/product-filter.interface';
import { OperationResult } from '../interfaces/types';
import {
  Product,
  CreateProductDto,
  UpdateProductDto,
} from '../models/product.model';
import { ProductService } from '../services/product.service';

/**
 * Product Controller
 *
 * Controller for managing products in the PIM module
 */
@Controller('pim/products')
@UseGuards(FirebaseAuthGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * Get a product by ID
   *
   * @param id Product ID
   * @param user Authenticated user
   * @returns Product
   */
  @Get(':id')
  async getProductById(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<Product> {
    const organizationId = user.organizationId;
    const product = await this.productService.getProductById(
      id,
      organizationId,
    );

    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    return product;
  }

  /**
   * Find products by filter criteria
   *
   * @param filter Product filter criteria
   * @param user Authenticated user
   * @returns Filtered products
   */
  @Get()
  async findProducts(
    @Query() filterParams: any,
    @GetUser() user: User,
  ): Promise<{ items: Product[]; total: number; page: number; limit: number }> {
    const organizationId = user.organizationId;

    // Parse and validate filter parameters
    const filter: ProductFilter = {
      organizationId,
      ...filterParams,
    };

    // Parse numeric values
    if (filterParams.page) filter.page = parseInt(filterParams.page);
    if (filterParams.limit) filter.limit = parseInt(filterParams.limit);

    // Parse arrays
    if (
      filterParams.categoryIds &&
      typeof filterParams.categoryIds === 'string'
    ) {
      filter.categoryIds = filterParams.categoryIds.split(',');
    }

    if (
      filterParams.marketplaceIds &&
      typeof filterParams.marketplaceIds === 'string'
    ) {
      filter.marketplaceIds = filterParams.marketplaceIds.split(',');
    }

    // Parse price range
    if (filterParams.minPrice || filterParams.maxPrice) {
      filter.priceRange = {};
      if (filterParams.minPrice)
        filter.priceRange.min = parseFloat(filterParams.minPrice);
      if (filterParams.maxPrice)
        filter.priceRange.max = parseFloat(filterParams.maxPrice);
    }

    // Parse dates
    if (filterParams.createdFrom || filterParams.createdTo) {
      filter.createdAt = {};
      if (filterParams.createdFrom)
        filter.createdAt.from = new Date(filterParams.createdFrom);
      if (filterParams.createdTo)
        filter.createdAt.to = new Date(filterParams.createdTo);
    }

    if (filterParams.updatedFrom || filterParams.updatedTo) {
      filter.updatedAt = {};
      if (filterParams.updatedFrom)
        filter.updatedAt.from = new Date(filterParams.updatedFrom);
      if (filterParams.updatedTo)
        filter.updatedAt.to = new Date(filterParams.updatedTo);
    }

    // Parse South African compliance filters
    if (
      filterParams.icasa !== undefined ||
      filterParams.sabs !== undefined ||
      filterParams.nrcs !== undefined
    ) {
      filter.complianceStatus = {};
      if (filterParams.icasa !== undefined)
        filter.complianceStatus.icasa = filterParams.icasa === 'true';
      if (filterParams.sabs !== undefined)
        filter.complianceStatus.sabs = filterParams.sabs === 'true';
      if (filterParams.nrcs !== undefined)
        filter.complianceStatus.nrcs = filterParams.nrcs === 'true';
    }

    // If VAT included filter is provided
    if (filterParams.vatIncluded !== undefined) {
      filter.vatIncluded = filterParams.vatIncluded === 'true';
    }

    return await this.productService.findProducts(filter);
  }

  /**
   * Create a new product
   *
   * @param createProductDto Product creation DTO
   * @param user Authenticated user
   * @returns Created product
   */
  @Post()
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: User,
  ): Promise<Product> {
    // Ensure organizationId is set
    createProductDto.organizationId = user.organizationId;

    return await this.productService.createProduct(createProductDto);
  }

  /**
   * Update an existing product
   *
   * @param id Product ID
   * @param updateProductDto Product update DTO
   * @param user Authenticated user
   * @returns Updated product
   */
  @Put(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: User,
  ): Promise<Product> {
    const organizationId = user.organizationId;

    // Ensure user can only update their organization's products
    updateProductDto.organizationId = organizationId;

    const product = await this.productService.getProductById(
      id,
      organizationId,
    );
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    return await this.productService.updateProduct(id, updateProductDto);
  }

  /**
   * Delete a product
   *
   * @param id Product ID
   * @param user Authenticated user
   */
  @Delete(':id')
  async deleteProduct(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    const organizationId = user.organizationId;

    const product = await this.productService.getProductById(
      id,
      organizationId,
    );
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    await this.productService.deleteProduct(id);
  }

  /**
   * Get featured products
   *
   * @param limit Maximum number of products to return
   * @param user Authenticated user
   * @returns Featured products
   */
  @Get('featured')
  async getFeaturedProducts(
    @Query('limit') limit: number = 10,
    @GetUser() user: User,
  ): Promise<Product[]> {
    const organizationId = user.organizationId;
    return await this.productService.getFeaturedProducts(organizationId, limit);
  }

  /**
   * Get recently updated products
   *
   * @param limit Maximum number of products to return
   * @param user Authenticated user
   * @returns Recently updated products
   */
  @Get('recent')
  async getRecentlyUpdatedProducts(
    @Query('limit') limit: number = 10,
    @GetUser() user: User,
  ): Promise<Product[]> {
    const organizationId = user.organizationId;
    return await this.productService.getRecentlyUpdatedProducts(
      organizationId,
      limit,
    );
  }

  /**
   * Get products by category
   *
   * @param categoryId Category ID
   * @param includeSubcategories Whether to include products from subcategories
   * @param page Page number
   * @param limit Products per page
   * @param user Authenticated user
   * @returns Products in the category
   */
  @Get('by-category/:categoryId')
  async getProductsByCategory(
    @Param('categoryId') categoryId: string,
    @Query('includeSubcategories') includeSubcategories: boolean = false,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @GetUser() user: User,
  ): Promise<Product[]> {
    const organizationId = user.organizationId;
    return await this.productService.getProductsByCategory(
      organizationId,
      categoryId,
      includeSubcategories,
      { pagination: { page, pageSize: limit } },
    );
  }

  /**
   * Get products by marketplace
   *
   * @param marketplaceId Marketplace ID
   * @param page Page number
   * @param limit Products per page
   * @param user Authenticated user
   * @returns Products in the marketplace
   */
  @Get('by-marketplace/:marketplaceId')
  async getProductsByMarketplace(
    @Param('marketplaceId') marketplaceId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @GetUser() user: User,
  ): Promise<Product[]> {
    const organizationId = user.organizationId;
    return await this.productService.getProductsByMarketplace(
      organizationId,
      marketplaceId,
      { pagination: { page, pageSize: limit } },
    );
  }

  /**
   * Get products by SKUs
   *
   * @param skus Array of SKUs
   * @param user Authenticated user
   * @returns Products matching the SKUs
   */
  @Post('by-skus')
  async getProductsBySkus(
    @Body() body: { skus: string[] },
    @GetUser() user: User,
  ): Promise<Product[]> {
    const organizationId = user.organizationId;
    return await this.productService.getProductsBySkus(
      organizationId,
      body.skus,
    );
  }

  /**
   * Bulk update products
   *
   * @param operations Array of update operations
   * @param user Authenticated user
   * @returns Operation results
   */
  @Post('bulk-update')
  async bulkUpdateProducts(
    @Body() operations: Array<{ id: string; updates: UpdateProductDto }>,
    @GetUser() user: User,
  ): Promise<Array<OperationResult<Product>>> {
    const organizationId = user.organizationId;

    // Enforce organization ID for security
    operations = operations.map((op) => ({
      ...op,
      updates: {
        ...op.updates,
        organizationId,
      },
    }));

    return await this.productService.bulkUpdateProducts(operations);
  }

  /**
   * Bulk delete products
   *
   * @param productIds Array of product IDs to delete
   * @param user Authenticated user
   * @returns Operation results
   */
  @Post('bulk-delete')
  async bulkDeleteProducts(
    @Body() body: { productIds: string[] },
    @GetUser() user: User,
  ): Promise<Array<OperationResult>> {
    const organizationId = user.organizationId;
    return await this.productService.bulkDeleteProducts(
      organizationId,
      body.productIds,
    );
  }
}
