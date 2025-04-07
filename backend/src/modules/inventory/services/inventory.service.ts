import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';
import { StockLevelRepository } from '../repositories/stock-level.repository';
import { StockMovementRepository } from '../repositories/stock-movement.repository';
import { WarehouseRepository } from '../repositories/warehouse.repository';
import { Product } from '../models/product.schema';
import { StockLevel } from '../models/stock-level.schema';
import { StockMovement } from '../models/stock-movement.schema';
import { Warehouse } from '../models/warehouse.schema';
import {
  ProductStatus,
  StockMovementType,
  StockMovementReason,
  ProductVariant,
  ProductPricing,
  ProductSupplier
} from '../interfaces/types';

/**
 * DTO for creating a new product
 */
export interface CreateProductDto {
  organizationId: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  brandId?: string;
  brandName?: string;
  categoryIds?: string[];
  categoryNames?: string[];
  status?: ProductStatus;
  mainImageUrl?: string;
  additionalImageUrls?: string[];
  pricing: ProductPricing;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  stockLevelThreshold?: {
    low: number;
    critical: number;
    safetyStock: number;
    targetStock: number;
    maxStock: number;
  };
  defaultWarehouseId?: string;
  suppliers?: ProductSupplier[];
  leadTimeInDays?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  attributes?: Record<string, string | number | boolean>;
  tags?: string[];
  metadata?: Record<string, any>;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  externalIds?: Record<string, string>;
}

/**
 * DTO for updating a product
 */
export interface UpdateProductDto {
  name?: string;
  description?: string;
  brandId?: string;
  brandName?: string;
  categoryIds?: string[];
  categoryNames?: string[];
  status?: ProductStatus;
  mainImageUrl?: string;
  additionalImageUrls?: string[];
  pricing?: Partial<ProductPricing>;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  stockLevelThreshold?: {
    low: number;
    critical: number;
    safetyStock: number;
    targetStock: number;
    maxStock: number;
  };
  defaultWarehouseId?: string;
  suppliers?: ProductSupplier[];
  leadTimeInDays?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  attributes?: Record<string, string | number | boolean>;
  tags?: string[];
  metadata?: Record<string, any>;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  externalIds?: Record<string, string>;
}

/**
 * DTO for updating product stock
 */
export interface UpdateStockDto {
  warehouseId: string;
  quantity: number;
  type: StockMovementType;
  reason: StockMovementReason;
  referenceNumber?: string;
  referenceId?: string;
  notes?: string;
  userId: string;
  userName: string;
  locationId?: string;
  locationName?: string;
  batchNumber?: string;
  serialNumbers?: string[];
}

/**
 * Service for inventory operations
 */
@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly stockLevelRepository: StockLevelRepository,
    private readonly stockMovementRepository: StockMovementRepository,
    private readonly warehouseRepository: WarehouseRepository
  ) {}
  
  /**
   * Create a new product
   * @param createProductDto Product creation data
   * @returns Created product
   */
  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    this.logger.log(`Creating new product: ${createProductDto.name} (${createProductDto.sku})`);
    
    // Check if product with SKU already exists
    const existingProduct = await this.productRepository.findBySku(
      createProductDto.organizationId,
      createProductDto.sku
    );
    
    if (existingProduct) {
      throw new ConflictException(`Product with SKU ${createProductDto.sku} already exists`);
    }
    
    // Set defaults
    const data: CreateProductDto = {
      ...createProductDto,
      status: createProductDto.status || ProductStatus.ACTIVE,
      hasVariants: createProductDto.hasVariants || false,
      stockQuantity: 0,
      reservedQuantity: 0,
      availableQuantity: 0
    } as any;
    
    // Create the product
    const product = await this.productRepository.create(data as Product);
    
    // If default warehouse is specified, create a stock level entry
    if (createProductDto.defaultWarehouseId) {
      const warehouse = await this.warehouseRepository.findById(createProductDto.defaultWarehouseId);
      
      if (warehouse) {
        await this.createStockLevel(
          createProductDto.organizationId,
          product.id,
          product.sku,
          warehouse.id,
          warehouse.name,
          0, // Initial quantity
          0  // Reserved quantity
        );
      }
    }
    
    return product;
  }
  
  /**
   * Get product by ID
   * @param id Product ID
   * @returns Product
   */
  async getProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    
    return product;
  }
  
  /**
   * Get product by SKU
   * @param organizationId Organization ID
   * @param sku Product SKU
   * @returns Product
   */
  async getProductBySku(organizationId: string, sku: string): Promise<Product> {
    const product = await this.productRepository.findBySku(organizationId, sku);
    
    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }
    
    return product;
  }
  
  /**
   * Get products for an organization
   * @param organizationId Organization ID
   * @param limit Maximum number to return
   * @param offset Pagination offset
   * @returns Array of products
   */
  async getProducts(
    organizationId: string,
    limit?: number,
    offset?: number
  ): Promise<Product[]> {
    const products = await this.productRepository.findByOrganization(organizationId);
    
    // Apply pagination
    if (offset !== undefined || limit !== undefined) {
      const start = offset || 0;
      const end = limit ? start + limit : undefined;
      return products.slice(start, end);
    }
    
    return products;
  }
  
  /**
   * Update a product
   * @param id Product ID
   * @param updateProductDto Update data
   * @returns Updated product
   */
  async updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    this.logger.log(`Updating product with ID: ${id}`);
    
    const updated = await this.productRepository.update(id, updateProductDto as any);
    
    if (!updated) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    
    return updated;
  }
  
  /**
   * Delete a product
   * @param id Product ID
   * @returns Success indicator
   */
  async deleteProduct(id: string): Promise<boolean> {
    this.logger.log(`Deleting product with ID: ${id}`);
    
    const result = await this.productRepository.delete(id);
    
    if (!result) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    
    // Delete associated stock levels
    const stockLevels = await this.stockLevelRepository.findByProduct(id);
    
    for (const stockLevel of stockLevels) {
      await this.stockLevelRepository.delete(stockLevel.id);
    }
    
    return true;
  }
  
  /**
   * Search products
   * @param organizationId Organization ID
   * @param searchText Search text
   * @returns Array of matching products
   */
  async searchProducts(organizationId: string, searchText: string): Promise<Product[]> {
    return this.productRepository.searchProducts(organizationId, searchText);
  }
  
  /**
   * Find products with advanced filtering
   * @param params Query parameters
   * @returns Array of filtered products
   */
  async findProductsWithFilters(params: {
    organizationId: string;
    status?: ProductStatus;
    categoryId?: string;
    brandId?: string;
    priceMin?: number;
    priceMax?: number;
    stockMin?: number;
    stockMax?: number;
    hasVariants?: boolean;
    tags?: string[];
    searchText?: string;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    return this.productRepository.findWithFilters(params);
  }
  
  /**
   * Get products with low stock
   * @param organizationId Organization ID
   * @returns Array of products with low stock
   */
  async getLowStockProducts(organizationId: string): Promise<Product[]> {
    return this.productRepository.findLowStock(organizationId);
  }
  
  /**
   * Create a stock level entry
   * @param organizationId Organization ID
   * @param productId Product ID
   * @param productSku Product SKU
   * @param warehouseId Warehouse ID
   * @param warehouseName Warehouse name
   * @param quantity Initial quantity
   * @param reservedQuantity Initial reserved quantity
   * @returns Created stock level
   */
  private async createStockLevel(
    organizationId: string,
    productId: string,
    productSku: string,
    warehouseId: string,
    warehouseName: string,
    quantity: number,
    reservedQuantity: number
  ): Promise<StockLevel> {
    // Calculate available quantity
    const availableQuantity = Math.max(0, quantity - reservedQuantity);
    
    const stockLevelData: Omit<StockLevel, 'id' | 'createdAt' | 'updatedAt'> = {
      organizationId,
      productId,
      productSku,
      warehouseId,
      warehouseName,
      quantity,
      reservedQuantity,
      availableQuantity,
      onOrderQuantity: 0,
      minStockLevel: 0,
      maxStockLevel: 1000,
      reorderPoint: 5,
      reorderQuantity: 10,
      lastStockUpdateDate: new Date(),
      costValue: 0,
      retailValue: 0,
      currency: 'USD',
      status: quantity > 0 ? 'in_stock' : 'out_of_stock'
    };
    
    return this.stockLevelRepository.create(stockLevelData);
  }
  
  /**
   * Get stock levels for a product
   * @param productId Product ID
   * @returns Array of stock levels
   */
  async getProductStockLevels(productId: string): Promise<StockLevel[]> {
    return this.stockLevelRepository.findByProduct(productId);
  }
  
  /**
   * Get stock level for a product in a specific warehouse
   * @param productId Product ID
   * @param warehouseId Warehouse ID
   * @returns Stock level
   */
  async getProductStockInWarehouse(
    productId: string,
    warehouseId: string
  ): Promise<StockLevel> {
    const stockLevel = await this.stockLevelRepository.findByProductAndWarehouse(
      productId,
      warehouseId
    );
    
    if (!stockLevel) {
      throw new NotFoundException(
        `Stock level for product ${productId} in warehouse ${warehouseId} not found`
      );
    }
    
    return stockLevel;
  }
  
  /**
   * Update product stock
   * @param productId Product ID
   * @param updateStockDto Stock update data
   * @returns Updated product
   */
  async updateStock(productId: string, updateStockDto: UpdateStockDto): Promise<Product> {
    this.logger.log(`Updating stock for product ${productId} in warehouse ${updateStockDto.warehouseId}`);
    
    // Get the product
    const product = await this.productRepository.findById(productId);
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    
    // Get the warehouse
    const warehouse = await this.warehouseRepository.findById(updateStockDto.warehouseId);
    
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${updateStockDto.warehouseId} not found`);
    }
    
    // Get the current stock level or create a new one
    let stockLevel = await this.stockLevelRepository.findByProductAndWarehouse(
      productId,
      updateStockDto.warehouseId
    );
    
    if (!stockLevel) {
      stockLevel = await this.createStockLevel(
        product.organizationId,
        productId,
        product.sku,
        updateStockDto.warehouseId,
        warehouse.name,
        0,
        0
      );
    }
    
    // Calculate new quantities based on movement type
    let newQuantity = stockLevel.quantity;
    let newReservedQuantity = stockLevel.reservedQuantity;
    
    switch (updateStockDto.type) {
      case StockMovementType.STOCK_RECEIPT:
        newQuantity += updateStockDto.quantity;
        break;
        
      case StockMovementType.SALE:
        newQuantity -= updateStockDto.quantity;
        newReservedQuantity -= updateStockDto.quantity;
        break;
        
      case StockMovementType.RETURN:
        newQuantity += updateStockDto.quantity;
        break;
        
      case StockMovementType.ADJUSTMENT:
        newQuantity = updateStockDto.quantity; // Direct set
        break;
        
      case StockMovementType.TRANSFER:
        newQuantity -= updateStockDto.quantity;
        break;
        
      case StockMovementType.STOCK_TAKE:
        newQuantity = updateStockDto.quantity; // Direct set
        break;
    }
    
    // Ensure quantities are not negative
    newQuantity = Math.max(0, newQuantity);
    newReservedQuantity = Math.max(0, newReservedQuantity);
    newReservedQuantity = Math.min(newReservedQuantity, newQuantity);
    
    // Update the stock level
    await this.stockLevelRepository.updateStockQuantity(
      stockLevel.id,
      newQuantity,
      newReservedQuantity
    );
    
    // Record the stock movement
    const movementData: Omit<StockMovement, 'id' | 'createdAt' | 'updatedAt'> = {
      organizationId: product.organizationId,
      productId,
      productSku: product.sku,
      productName: product.name,
      movementType: updateStockDto.type,
      movementReason: updateStockDto.reason,
      quantity: updateStockDto.quantity,
      previousQuantity: stockLevel.quantity,
      newQuantity,
      warehouseId: updateStockDto.warehouseId,
      warehouseName: warehouse.name,
      locationId: updateStockDto.locationId,
      locationName: updateStockDto.locationName,
      referenceNumber: updateStockDto.referenceNumber,
      referenceType: updateStockDto.referenceId ? 'order' : undefined,
      referenceId: updateStockDto.referenceId,
      userId: updateStockDto.userId,
      userName: updateStockDto.userName,
      notes: updateStockDto.notes,
      batchNumber: updateStockDto.batchNumber,
      serialNumbers: updateStockDto.serialNumbers
    };
    
    await this.stockMovementRepository.recordMovement(movementData);
    
    // Update product stock totals
    const totalStock = await this.stockLevelRepository.calculateTotalStock(productId);
    
    // Update the product
    const updatedProduct = await this.productRepository.updateStock(
      productId,
      totalStock.totalQuantity,
      totalStock.totalReserved
    );
    
    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${productId} not found or could not be updated`);
    }
    
    return updatedProduct;
  }
  
  /**
   * Get stock movements for a product
   * @param productId Product ID
   * @param limit Maximum number to return
   * @returns Array of stock movements
   */
  async getProductStockMovements(
    productId: string,
    limit: number = 100
  ): Promise<StockMovement[]> {
    return this.stockMovementRepository.findByProduct(productId, limit);
  }
  
  /**
   * Find stock levels with advanced filtering
   * @param params Query parameters
   * @returns Array of filtered stock levels
   */
  async findStockLevelsWithFilters(params: {
    organizationId: string;
    productId?: string;
    warehouseId?: string;
    locationId?: string;
    status?: string;
    minQuantity?: number;
    maxQuantity?: number;
    lowStock?: boolean;
    lastUpdatedAfter?: Date;
    lastUpdatedBefore?: Date;
    limit?: number;
    offset?: number;
  }): Promise<StockLevel[]> {
    return this.stockLevelRepository.findWithFilters(params);
  }
  
  /**
   * Find stock movements with advanced filtering
   * @param params Query parameters
   * @returns Array of filtered stock movements
   */
  async findStockMovementsWithFilters(params: {
    organizationId: string;
    productId?: string;
    warehouseId?: string;
    movementType?: StockMovementType;
    movementReason?: StockMovementReason;
    userId?: string;
    fromDate?: Date;
    toDate?: Date;
    referenceNumber?: string;
    referenceType?: string;
    limit?: number;
    offset?: number;
  }): Promise<StockMovement[]> {
    return this.stockMovementRepository.findWithFilters(params);
  }
}