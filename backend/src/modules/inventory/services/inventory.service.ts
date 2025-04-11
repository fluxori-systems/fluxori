import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { IProduct, IProductService } from "../../../shared/interfaces/product.interface";

import {
  ProductStatus,
  StockMovementType,
  StockMovementReason,
  ProductVariant,
  ProductPricing,
  ProductSupplier,
} from "../interfaces/types";
import { Product } from "../models/product.schema";
import { StockLevel } from "../models/stock-level.schema";
import { StockMovement } from "../models/stock-movement.schema";
import { Warehouse } from "../models/warehouse.schema";
import { ProductRepository } from "../repositories/product.repository";
import { StockLevelRepository } from "../repositories/stock-level.repository";
import { StockMovementRepository } from "../repositories/stock-movement.repository";
import { WarehouseRepository } from "../repositories/warehouse.repository";

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
 * Implements the IProductService interface for cross-module compatibility
 */
@Injectable()
export class InventoryService implements IProductService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly stockLevelRepository: StockLevelRepository,
    private readonly stockMovementRepository: StockMovementRepository,
    private readonly warehouseRepository: WarehouseRepository,
  ) {}

  // This function is kept for backwards compatibility
  // but delegates to createProductInternal to avoid duplication
  /**
   * Create a new product (internal version for API use)
   * @param createProductDto Product creation data
   * @returns Created product
   */
  async createProductInternal(createProductDto: CreateProductDto): Promise<Product> {
    this.logger.log(
      `Creating new product: ${createProductDto.name} (${createProductDto.sku})`,
    );

    // Check if product with SKU already exists
    const existingProduct = await this.productRepository.findBySku(
      createProductDto.organizationId,
      createProductDto.sku,
    );

    if (existingProduct) {
      throw new ConflictException(
        `Product with SKU ${createProductDto.sku} already exists`,
      );
    }

    // Set defaults
    const data: CreateProductDto = {
      ...createProductDto,
      status: createProductDto.status || ProductStatus.ACTIVE,
      hasVariants: createProductDto.hasVariants || false,
      stockQuantity: 0,
      reservedQuantity: 0,
      availableQuantity: 0,
    } as any;

    // Create the product
    const product = await this.productRepository.create(data as Product);

    // If default warehouse is specified, create a stock level entry
    if (createProductDto.defaultWarehouseId) {
      const warehouse = await this.warehouseRepository.findById(
        createProductDto.defaultWarehouseId,
      );

      if (warehouse) {
        await this.createStockLevel(
          createProductDto.organizationId,
          product.id,
          product.sku,
          warehouse.id,
          warehouse.name,
          0, // Initial quantity
          0, // Reserved quantity
        );
      }
    }

    return product;
  }

  /**
   * Get product by ID
   * @param id Product ID
   * @returns Product or null if not found
   * 
   * Implementation of IProductService.getProductById
   */
  async getProductById(id: string): Promise<IProduct | null> {
    try {
      const product = await this.productRepository.findById(id);
      
      if (!product) {
        return null;
      }
      
      return this.mapProductToInterface(product);
    } catch (error) {
      this.logger.error(`Error fetching product by ID ${id}: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Get product by ID (internal version that throws exceptions)
   * @param id Product ID
   * @returns Full Product model
   * @internal
   */
  private async getProductByIdInternal(id: string): Promise<Product> {
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
   * @returns Product or null if not found
   * 
   * Implementation of IProductService.getProductBySku
   */
  async getProductBySku(organizationId: string, sku: string): Promise<IProduct | null> {
    try {
      const product = await this.productRepository.findBySku(organizationId, sku);
      
      if (!product) {
        return null;
      }
      
      return this.mapProductToInterface(product);
    } catch (error) {
      this.logger.error(`Error fetching product by SKU ${sku}: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Get product by SKU (internal version that throws exceptions)
   * @param organizationId Organization ID
   * @param sku Product SKU
   * @returns Full Product model
   * @internal
   */
  private async getProductBySkuInternal(organizationId: string, sku: string): Promise<Product> {
    const product = await this.productRepository.findBySku(organizationId, sku);

    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }

    return product;
  }
  
  /**
   * Maps a Product model to the IProduct interface
   * @param product The internal Product model
   * @returns An IProduct compatible object
   * @private
   */
  private mapProductToInterface(product: Product): IProduct {
    // Convert Timestamp objects to Date objects if needed
    let createdAt: Date | undefined = undefined;
    let updatedAt: Date | undefined = undefined;
    
    if (product.createdAt) {
      if (typeof product.createdAt === 'object' && 'toDate' in product.createdAt) {
        createdAt = product.createdAt.toDate();
      } else if (product.createdAt instanceof Date) {
        createdAt = product.createdAt;
      }
    }
    
    if (product.updatedAt) {
      if (typeof product.updatedAt === 'object' && 'toDate' in product.updatedAt) {
        updatedAt = product.updatedAt.toDate();
      } else if (product.updatedAt instanceof Date) {
        updatedAt = product.updatedAt;
      }
    }
    
    return {
      id: product.id,
      organizationId: product.organizationId,
      sku: product.sku,
      name: product.name,
      description: product.description,
      pricing: {
        basePrice: product.pricing?.basePrice || 0,
        salePrice: product.pricing?.salePrice,
        currency: product.pricing?.currency || 'USD',
      },
      stockQuantity: product.stockQuantity,
      status: product.status,
      createdAt: createdAt,
      updatedAt: updatedAt,
      mainImageUrl: product.mainImageUrl,
      additionalImageUrls: product.additionalImageUrls,
      externalIds: product.externalIds,
      metadata: product.metadata
    };
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
    offset?: number,
  ): Promise<Product[]> {
    const products =
      await this.productRepository.findByOrganization(organizationId);

    // Apply pagination
    if (offset !== undefined || limit !== undefined) {
      const start = offset || 0;
      const end = limit ? start + limit : undefined;
      return products.slice(start, end);
    }

    return products;
  }

  /**
   * Update a product - internal implementation
   * @param id Product ID
   * @param updateProductDto Update data
   * @returns Updated product
   */
  private async updateProductInternal(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    this.logger.log(`Updating product with ID: ${id}`);

    const updated = await this.productRepository.update(
      id,
      updateProductDto as any,
    );

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

    // Check if product exists
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Delete the product
    await this.productRepository.delete(id);

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
  async searchProducts(
    organizationId: string,
    searchText: string,
  ): Promise<Product[]> {
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
    reservedQuantity: number,
  ): Promise<StockLevel> {
    // Calculate available quantity
    const availableQuantity = Math.max(0, quantity - reservedQuantity);

    const stockLevelData: Omit<StockLevel, "id" | "createdAt" | "updatedAt"> = {
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
      currency: "USD",
      status: quantity > 0 ? "in_stock" : "out_of_stock",
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
    warehouseId: string,
  ): Promise<StockLevel> {
    const stockLevel =
      await this.stockLevelRepository.findByProductAndWarehouse(
        productId,
        warehouseId,
      );

    if (!stockLevel) {
      throw new NotFoundException(
        `Stock level for product ${productId} in warehouse ${warehouseId} not found`,
      );
    }

    return stockLevel;
  }

  /**
   * Create a new product from a simplified product data object
   * Implementation of IProductService.createProduct
   * 
   * @param productData Partial product data
   * @returns Created product 
   */
  async createProduct(productData: Partial<IProduct> | CreateProductDto): Promise<IProduct> {
    try {
      // Check if this is a CreateProductDto or IProduct
      if ('hasVariants' in productData || 'mainImageUrl' in productData) {
        // This is a CreateProductDto, use internal implementation
        const product = await this.createProductInternal(productData as CreateProductDto);
        return this.mapProductToInterface(product);
      }
      
      // This is an IProduct
      if (!('pricing' in productData) || typeof productData.pricing !== 'object') {
        // Add default pricing
        productData.pricing = {
          basePrice: 0,
          currency: 'USD'
        };
      }
      
      // Convert interface product to DTO
      const createDto: CreateProductDto = {
        organizationId: productData.organizationId!,
        sku: productData.sku!,
        name: productData.name!,
        description: productData.description,
        pricing: {
          basePrice: productData.pricing?.basePrice || 0,
          salePrice: productData.pricing?.salePrice,
          currency: productData.pricing?.currency || 'USD',
        },
        status: productData.status as ProductStatus,
      };

      // Call the internal method
      const product = await this.createProductInternal(createDto);
      return this.mapProductToInterface(product);
    } catch (error) {
      this.logger.error(`Error creating product from interface: ${error.message}`);
      throw error;
    }
  }
  
  // We've renamed the original method to createProductInternal,
  // so this duplicate implementation was removed to avoid redundancy
  
  /**
   * Update an existing product
   * Implementation of IProductService.updateProduct
   * 
   * @param id Product ID
   * @param productData Partial product data for update
   * @returns Updated product
   */
  async updateProduct(id: string, productData: Partial<IProduct> | UpdateProductDto): Promise<IProduct> {
    try {
      // Check if this is a UpdateProductDto or IProduct
      if ('hasVariants' in productData || 'mainImageUrl' in productData || 'pricing' in productData) {
        // This is a UpdateProductDto, use internal implementation
        const product = await this.updateProductInternal(id, productData as UpdateProductDto);
        return this.mapProductToInterface(product);
      }
      
      // This is an IProduct, convert to DTO
      const updateDto: UpdateProductDto = {};
      
      if (productData.name) updateDto.name = productData.name;
      if (productData.description) updateDto.description = productData.description;
      if (productData.status) updateDto.status = productData.status as ProductStatus;
      if (productData.pricing) {
        updateDto.pricing = {
          basePrice: productData.pricing.basePrice || 0,
          salePrice: productData.pricing.salePrice,
          currency: productData.pricing.currency || 'USD',
        };
      }
      
      // Call the internal method
      const product = await this.updateProductInternal(id, updateDto);
      return this.mapProductToInterface(product);
    } catch (error) {
      this.logger.error(`Error updating product from interface: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update stock quantity for a product
   * Implementation of IProductService.updateStock
   * 
   * @param productId Product ID
   * @param quantity New quantity
   * @returns Updated product
   */
  async updateStock(productId: string, quantity: number): Promise<IProduct>;
  
  /**
   * Update product stock with detailed stock movement data
   * @param productId Product ID
   * @param updateStockDto Stock update data
   * @returns Updated product
   */
  async updateStock(
    productId: string,
    updateStockDto: UpdateStockDto | number,
  ): Promise<Product | IProduct> {
    // Handle simple quantity update from interface
    if (typeof updateStockDto === 'number') {
      try {
        // Get the product first
        const product = await this.getProductByIdInternal(productId);
        
        // Find default warehouse or first available warehouse
        const stockLevels = await this.stockLevelRepository.findByProduct(productId);
        let defaultWarehouseId: string;
        let defaultWarehouseName: string;
        
        if (stockLevels.length > 0) {
          // Use the first warehouse that has stock
          defaultWarehouseId = stockLevels[0].warehouseId;
          defaultWarehouseName = stockLevels[0].warehouseName;
        } else {
          // No warehouses with stock found, get all warehouses and use the first one
          const warehouses = await this.warehouseRepository.findByOrganization(product.organizationId);
          
          if (warehouses.length === 0) {
            throw new NotFoundException('No warehouses available for stock update');
          }
          
          defaultWarehouseId = warehouses[0].id;
          defaultWarehouseName = warehouses[0].name;
        }
        
        // Create stock update DTO
        const stockUpdateDto: UpdateStockDto = {
          warehouseId: defaultWarehouseId,
          quantity: updateStockDto,
          type: StockMovementType.ADJUSTMENT,
          reason: StockMovementReason.SYSTEM_UPDATE,
          userId: 'system',
          userName: 'System',
          notes: 'Updated via product service interface'
        };
        
        // Call the internal implementation
        const updatedProduct = await this.updateStockInternal(productId, stockUpdateDto);
        return this.mapProductToInterface(updatedProduct);
      } catch (error) {
        this.logger.error(`Error updating stock from interface: ${error.message}`);
        throw error;
      }
    }
    
    // Default path for complex stock update (original implementation)
    return this.updateStockInternal(productId, updateStockDto);
  }
  
  /**
   * Internal method to update stock with full DTO
   */
  async updateStockInternal(
    productId: string,
    updateStockDto: UpdateStockDto,
  ): Promise<Product> {
    this.logger.log(
      `Updating stock for product ${productId} in warehouse ${updateStockDto.warehouseId}`,
    );

    // Get the product
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Get the warehouse
    const warehouse = await this.warehouseRepository.findById(
      updateStockDto.warehouseId,
    );

    if (!warehouse) {
      throw new NotFoundException(
        `Warehouse with ID ${updateStockDto.warehouseId} not found`,
      );
    }

    // Get the current stock level or create a new one
    let stockLevel = await this.stockLevelRepository.findByProductAndWarehouse(
      productId,
      updateStockDto.warehouseId,
    );

    if (!stockLevel) {
      stockLevel = await this.createStockLevel(
        product.organizationId,
        productId,
        product.sku,
        updateStockDto.warehouseId,
        warehouse.name,
        0,
        0,
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
      newReservedQuantity,
    );

    // Record the stock movement
    const movementData: Omit<StockMovement, "id" | "createdAt" | "updatedAt"> =
      {
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
        referenceType: updateStockDto.referenceId ? "order" : undefined,
        referenceId: updateStockDto.referenceId,
        userId: updateStockDto.userId,
        userName: updateStockDto.userName,
        notes: updateStockDto.notes,
        batchNumber: updateStockDto.batchNumber,
        serialNumbers: updateStockDto.serialNumbers,
      };

    await this.stockMovementRepository.recordMovement(movementData);

    // Update product stock totals
    const totalStock =
      await this.stockLevelRepository.calculateTotalStock(productId);

    // Update the product
    const updatedProduct = await this.productRepository.updateStock(
      productId,
      totalStock.totalQuantity,
      totalStock.totalReserved,
    );

    if (!updatedProduct) {
      throw new NotFoundException(
        `Product with ID ${productId} not found or could not be updated`,
      );
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
    limit: number = 100,
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
    lastUpdatedAfter?: Date | any; // Allow for Timestamp objects from Firestore
    lastUpdatedBefore?: Date | any; // Allow for Timestamp objects from Firestore
    limit?: number;
    offset?: number;
  }): Promise<StockLevel[]> {
    // Convert any Timestamp objects to Date objects
    const convertedParams = { ...params };
    
    // Type-safe conversion of Firestore Timestamp objects to standard JS Date objects
    if (params.lastUpdatedAfter) {
      if (typeof params.lastUpdatedAfter === 'object' && 'toDate' in params.lastUpdatedAfter) {
        convertedParams.lastUpdatedAfter = params.lastUpdatedAfter.toDate();
      } else if (params.lastUpdatedAfter instanceof Date) {
        convertedParams.lastUpdatedAfter = params.lastUpdatedAfter;
      } else {
        convertedParams.lastUpdatedAfter = undefined;
      }
    }
    
    if (params.lastUpdatedBefore) {
      if (typeof params.lastUpdatedBefore === 'object' && 'toDate' in params.lastUpdatedBefore) {
        convertedParams.lastUpdatedBefore = params.lastUpdatedBefore.toDate();
      } else if (params.lastUpdatedBefore instanceof Date) {
        convertedParams.lastUpdatedBefore = params.lastUpdatedBefore;
      } else {
        convertedParams.lastUpdatedBefore = undefined;
      }
    }
    
    return this.stockLevelRepository.findWithFilters(convertedParams);
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
    fromDate?: Date | any; // Allow for Timestamp objects from Firestore
    toDate?: Date | any; // Allow for Timestamp objects from Firestore
    referenceNumber?: string;
    referenceType?: string;
    limit?: number;
    offset?: number;
  }): Promise<StockMovement[]> {
    // Convert any Timestamp objects to Date objects
    const convertedParams = { ...params };
    
    // Type-safe conversion of Firestore Timestamp objects to standard JS Date objects
    if (params.fromDate) {
      if (typeof params.fromDate === 'object' && 'toDate' in params.fromDate) {
        convertedParams.fromDate = params.fromDate.toDate();
      } else if (params.fromDate instanceof Date) {
        convertedParams.fromDate = params.fromDate;
      } else {
        convertedParams.fromDate = undefined;
      }
    }
    
    if (params.toDate) {
      if (typeof params.toDate === 'object' && 'toDate' in params.toDate) {
        convertedParams.toDate = params.toDate.toDate();
      } else if (params.toDate instanceof Date) {
        convertedParams.toDate = params.toDate;
      } else {
        convertedParams.toDate = undefined;
      }
    }
    
    return this.stockMovementRepository.findWithFilters(convertedParams);
  }
}
