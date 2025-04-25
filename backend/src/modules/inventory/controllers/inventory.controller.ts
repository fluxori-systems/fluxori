import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';

import {
  FirebaseAuthGuard,
  GetUser,
  DecodedFirebaseToken,
  AuthUtils,
} from 'src/common/auth';

import {
  ProductStatus,
  StockMovementType,
  StockMovementReason,
} from '../interfaces/types';
import { Product } from '../models/product.schema';
import { StockLevel } from '../models/stock-level.schema';
import { StockMovement } from '../models/stock-movement.schema';
import {
  InventoryService,
  CreateProductDto,
  UpdateProductDto,
  UpdateStockDto,
} from '../services/inventory.service';

/**
 * Controller for inventory operations
 */
@Controller('api/inventory')
@UseGuards(FirebaseAuthGuard)
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Create a new product
   * @param createProductDto Product creation data
   * @param user Authenticated user
   * @returns Created product
   */
  @Post('products')
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: DecodedFirebaseToken,
  ): Promise<Product> {
    this.logger.debug(
      `Creating product for organization: ${createProductDto.organizationId}`,
    );

    // Ensure the user is in the correct organization
    if (!AuthUtils.isInOrganization(user, createProductDto.organizationId)) {
      throw new BadRequestException(
        'You can only create products for your organization',
      );
    }

    const product = await this.inventoryService.createProduct(createProductDto);
    return product as unknown as Product;
  }

  /**
   * Get product by ID
   * @param id Product ID
   * @returns Product
   */
  @Get('products/:id')
  async getProductById(@Param('id') id: string): Promise<Product> {
    const product = await this.inventoryService.getProductById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product as Product;
  }

  /**
   * Get product by SKU
   * @param organizationId Organization ID
   * @param sku Product SKU
   * @returns Product
   */
  @Get('products/sku/:organizationId/:sku')
  async getProductBySku(
    @Param('organizationId') organizationId: string,
    @Param('sku') sku: string,
  ): Promise<Product> {
    const product = await this.inventoryService.getProductBySku(
      organizationId,
      sku,
    );
    if (!product) {
      throw new NotFoundException(
        `Product with SKU ${sku} not found in organization ${organizationId}`,
      );
    }

    // Ensure we have all required Product fields
    return {
      ...product,
      hasVariants: (product as any).hasVariants ?? false,
      reservedQuantity: (product as any).reservedQuantity ?? 0,
      availableQuantity: (product as any).availableQuantity ?? 0,
    } as Product;
  }

  /**
   * Get products for an organization
   * @param organizationId Organization ID
   * @param limit Maximum number to return
   * @param offset Pagination offset
   * @returns Array of products
   */
  @Get('products/organization/:organizationId')
  async getProducts(
    @Param('organizationId') organizationId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<Product[]> {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const offsetNum = offset ? parseInt(offset, 10) : undefined;

    return this.inventoryService.getProducts(
      organizationId,
      limitNum,
      offsetNum,
    );
  }

  /**
   * Update a product
   * @param id Product ID
   * @param updateProductDto Update data
   * @returns Updated product
   */
  @Put('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.inventoryService.updateProduct(
      id,
      updateProductDto,
    );

    // Ensure we have all required Product fields
    return {
      ...product,
      hasVariants: (product as any).hasVariants ?? false,
      reservedQuantity: (product as any).reservedQuantity ?? 0,
      availableQuantity: (product as any).availableQuantity ?? 0,
    } as Product;
  }

  /**
   * Delete a product
   * @param id Product ID
   * @returns Success indicator
   */
  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.inventoryService.deleteProduct(id);
    return { success };
  }

  /**
   * Search products
   * @param organizationId Organization ID
   * @param searchText Search text
   * @returns Array of matching products
   */
  @Get('products/search/:organizationId')
  async searchProducts(
    @Param('organizationId') organizationId: string,
    @Query('q') searchText: string,
  ): Promise<Product[]> {
    if (!searchText) {
      throw new BadRequestException('Search text is required');
    }

    return this.inventoryService.searchProducts(organizationId, searchText);
  }

  /**
   * Find products with advanced filtering
   * @param organizationId Organization ID
   * @param status Product status
   * @param categoryId Category ID
   * @param brandId Brand ID
   * @param priceMin Minimum price
   * @param priceMax Maximum price
   * @param stockMin Minimum stock
   * @param stockMax Maximum stock
   * @param hasVariants Has variants flag
   * @param tags Product tags
   * @param searchText Search text
   * @param limit Maximum number to return
   * @param offset Pagination offset
   * @returns Array of filtered products
   */
  @Get('products/filter/:organizationId')
  async findProductsWithFilters(
    @Param('organizationId') organizationId: string,
    @Query('status') status?: ProductStatus,
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('stockMin') stockMin?: string,
    @Query('stockMax') stockMax?: string,
    @Query('hasVariants') hasVariants?: string,
    @Query('tags') tags?: string,
    @Query('searchText') searchText?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<Product[]> {
    // Parse numeric parameters
    const priceMinNum = priceMin ? parseFloat(priceMin) : undefined;
    const priceMaxNum = priceMax ? parseFloat(priceMax) : undefined;
    const stockMinNum = stockMin ? parseInt(stockMin, 10) : undefined;
    const stockMaxNum = stockMax ? parseInt(stockMax, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const offsetNum = offset ? parseInt(offset, 10) : undefined;

    // Parse boolean parameters
    const hasVariantsVal =
      hasVariants !== undefined
        ? hasVariants.toLowerCase() === 'true'
        : undefined;

    // Parse tags
    const tagsArray = tags
      ? tags.split(',').map((tag) => tag.trim())
      : undefined;

    return this.inventoryService.findProductsWithFilters({
      organizationId,
      status,
      categoryId,
      brandId,
      priceMin: priceMinNum,
      priceMax: priceMaxNum,
      stockMin: stockMinNum,
      stockMax: stockMaxNum,
      hasVariants: hasVariantsVal,
      tags: tagsArray,
      searchText,
      limit: limitNum,
      offset: offsetNum,
    });
  }

  /**
   * Get products with low stock
   * @param organizationId Organization ID
   * @returns Array of products with low stock
   */
  @Get('products/low-stock/:organizationId')
  async getLowStockProducts(
    @Param('organizationId') organizationId: string,
  ): Promise<Product[]> {
    return this.inventoryService.getLowStockProducts(organizationId);
  }

  /**
   * Get stock levels for a product
   * @param productId Product ID
   * @returns Array of stock levels
   */
  @Get('stock/:productId')
  async getProductStock(
    @Param('productId') productId: string,
  ): Promise<StockLevel[]> {
    return this.inventoryService.getProductStockLevels(productId);
  }

  /**
   * Get stock level for a product in a specific warehouse
   * @param productId Product ID
   * @param warehouseId Warehouse ID
   * @returns Stock level
   */
  @Get('stock/:productId/warehouse/:warehouseId')
  async getProductStockInWarehouse(
    @Param('productId') productId: string,
    @Param('warehouseId') warehouseId: string,
  ): Promise<StockLevel> {
    return this.inventoryService.getProductStockInWarehouse(
      productId,
      warehouseId,
    );
  }

  /**
   * Update product stock
   * @param productId Product ID
   * @param updateStockDto Stock update data
   * @returns Updated product
   */
  @Post('stock/:productId')
  async updateStock(
    @Param('productId') productId: string,
    @Body() updateStockDto: UpdateStockDto,
  ): Promise<Product> {
    // Call the internal method directly to avoid the overloaded interface method
    const result = await this.inventoryService.updateStockInternal(
      productId,
      updateStockDto,
    );
    return result;
  }

  /**
   * Get stock movements for a product
   * @param productId Product ID
   * @param limit Maximum number to return
   * @returns Array of stock movements
   */
  @Get('movements/:productId')
  async getProductStockMovements(
    @Param('productId') productId: string,
    @Query('limit') limit?: string,
  ): Promise<StockMovement[]> {
    const limitNum = limit ? parseInt(limit, 10) : 100;

    return this.inventoryService.getProductStockMovements(productId, limitNum);
  }

  /**
   * Find stock levels with advanced filtering
   * @param organizationId Organization ID
   * @param productId Product ID
   * @param warehouseId Warehouse ID
   * @param locationId Location ID
   * @param status Stock status
   * @param minQuantity Minimum quantity
   * @param maxQuantity Maximum quantity
   * @param lowStock Low stock flag
   * @param lastUpdatedAfter Last updated after date
   * @param lastUpdatedBefore Last updated before date
   * @param limit Maximum number to return
   * @param offset Pagination offset
   * @returns Array of filtered stock levels
   */
  @Get('stock/filter/:organizationId')
  async findStockLevelsWithFilters(
    @Param('organizationId') organizationId: string,
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('locationId') locationId?: string,
    @Query('status') status?: string,
    @Query('minQuantity') minQuantity?: string,
    @Query('maxQuantity') maxQuantity?: string,
    @Query('lowStock') lowStock?: string,
    @Query('lastUpdatedAfter') lastUpdatedAfter?: string,
    @Query('lastUpdatedBefore') lastUpdatedBefore?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<StockLevel[]> {
    // Parse numeric parameters
    const minQuantityNum = minQuantity ? parseInt(minQuantity, 10) : undefined;
    const maxQuantityNum = maxQuantity ? parseInt(maxQuantity, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const offsetNum = offset ? parseInt(offset, 10) : undefined;

    // Parse boolean parameters
    const lowStockVal =
      lowStock !== undefined ? lowStock.toLowerCase() === 'true' : undefined;

    // Parse date parameters
    const lastUpdatedAfterDate = lastUpdatedAfter
      ? new Date(lastUpdatedAfter)
      : undefined;
    const lastUpdatedBeforeDate = lastUpdatedBefore
      ? new Date(lastUpdatedBefore)
      : undefined;

    return this.inventoryService.findStockLevelsWithFilters({
      organizationId,
      productId,
      warehouseId,
      locationId,
      status,
      minQuantity: minQuantityNum,
      maxQuantity: maxQuantityNum,
      lowStock: lowStockVal,
      lastUpdatedAfter: lastUpdatedAfterDate,
      lastUpdatedBefore: lastUpdatedBeforeDate,
      limit: limitNum,
      offset: offsetNum,
    });
  }

  /**
   * Find stock movements with advanced filtering
   * @param organizationId Organization ID
   * @param productId Product ID
   * @param warehouseId Warehouse ID
   * @param movementType Movement type
   * @param movementReason Movement reason
   * @param userId User ID
   * @param fromDate From date
   * @param toDate To date
   * @param referenceNumber Reference number
   * @param referenceType Reference type
   * @param limit Maximum number to return
   * @param offset Pagination offset
   * @returns Array of filtered stock movements
   */
  @Get('movements/filter/:organizationId')
  async findStockMovementsWithFilters(
    @Param('organizationId') organizationId: string,
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('movementType') movementType?: StockMovementType,
    @Query('movementReason') movementReason?: StockMovementReason,
    @Query('userId') userId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('referenceNumber') referenceNumber?: string,
    @Query('referenceType') referenceType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<StockMovement[]> {
    // Parse numeric parameters
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const offsetNum = offset ? parseInt(offset, 10) : undefined;

    // Parse date parameters
    const fromDateObj = fromDate ? new Date(fromDate) : undefined;
    const toDateObj = toDate ? new Date(toDate) : undefined;

    return this.inventoryService.findStockMovementsWithFilters({
      organizationId,
      productId,
      warehouseId,
      movementType,
      movementReason,
      userId,
      fromDate: fromDateObj,
      toDate: toDateObj,
      referenceNumber,
      referenceType,
      limit: limitNum,
      offset: offsetNum,
    });
  }
}
