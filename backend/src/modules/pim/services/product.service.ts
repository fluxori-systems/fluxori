import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';
import { Product, CreateProductDto, UpdateProductDto } from '../models/product.model';
import { ProductFilter } from '../interfaces/product-filter.interface';
import { OperationResult, ProductStatus, ProductType } from '../interfaces/types';
import { QueryOptions } from '../../../types/google-cloud.types';

/**
 * Product Service
 * 
 * Core service for managing products in the PIM module
 */
@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly productRepository: ProductRepository
  ) {}

  /**
   * Create a new product
   * 
   * @param createProductDto Product creation DTO
   * @returns Created product
   */
  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    try {
      this.logger.log(`Creating product with SKU ${createProductDto.sku}`);
      
      // Set default values if not provided
      if (!createProductDto.status) {
        createProductDto.status = ProductStatus.DRAFT;
      }
      
      // Create the product
      const product = await this.productRepository.create(createProductDto);
      
      this.logger.log(`Product created with ID ${product.id}`);
      
      return product;
    } catch (error) {
      this.logger.error(`Error creating product: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an existing product
   * 
   * @param id Product ID
   * @param updateProductDto Product update DTO
   * @returns Updated product
   */
  async updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    try {
      this.logger.log(`Updating product with ID ${id}`);
      
      // Update the product
      const product = await this.productRepository.update(id, updateProductDto);
      
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      
      this.logger.log(`Product updated with ID ${id}`);
      
      return product;
    } catch (error) {
      this.logger.error(`Error updating product: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a product by ID
   * 
   * @param id Product ID
   * @param organizationId Organization ID
   * @returns Product or null if not found
   */
  async getProductById(id: string, organizationId: string): Promise<Product | null> {
    try {
      this.logger.log(`Getting product with ID ${id}`);
      
      // Get the product
      const product = await this.productRepository.findById(id);
      
      // Check if product exists and belongs to the organization
      if (!product || product.organizationId !== organizationId) {
        return null;
      }
      
      return product;
    } catch (error) {
      this.logger.error(`Error getting product: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a product
   * 
   * @param id Product ID
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      this.logger.log(`Deleting product with ID ${id}`);
      
      // Delete the product
      await this.productRepository.delete(id);
      
      this.logger.log(`Product deleted with ID ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting product: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find product by bundle ID
   * 
   * @param bundleId Bundle ID
   * @param organizationId Organization ID
   * @returns Product associated with the bundle, or null if not found
   */
  async findByBundleId(bundleId: string, organizationId: string): Promise<Product | null> {
    try {
      this.logger.log(`Finding product for bundle ID ${bundleId}`);
      
      // Query products with the given bundle ID
      const products = await this.productRepository.query({
        where: [
          { field: 'bundleId', operator: '==', value: bundleId },
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'type', operator: '==', value: ProductType.BUNDLE },
        ],
        limit: 1,
      });
      
      if (products.length === 0) {
        return null;
      }
      
      return products[0];
    } catch (error) {
      this.logger.error(`Error finding product by bundle ID: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Find products that are part of bundles
   * 
   * @param productId Product ID
   * @param organizationId Organization ID
   * @returns List of products that contain the given product as a component
   */
  async findBundlesContainingProduct(productId: string, organizationId: string): Promise<Product[]> {
    try {
      this.logger.log(`Finding bundles containing product ID ${productId}`);
      
      // This is a simplified implementation
      // In a real system, you might need a more efficient query or index
      // Here we're querying all bundle products and filtering in memory
      const bundleProducts = await this.productRepository.query({
        where: [
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'type', operator: '==', value: ProductType.BUNDLE },
        ],
      });
      
      // Filter bundles that contain the product
      const containingBundles = bundleProducts.filter(product => 
        product.bundleComponents?.some(component => component.productId === productId)
      );
      
      return containingBundles;
    } catch (error) {
      this.logger.error(`Error finding bundles containing product: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Create a new product
   * Use this method for direct creation (bypassing DTO validation)
   * 
   * @param product Product object to create
   * @param organizationId Organization ID
   * @returns Created product
   */
  async create(product: Product, organizationId: string): Promise<Product> {
    try {
      this.logger.log(`Creating product directly with SKU ${product.sku}`);
      
      // Ensure organization ID is set
      product.organizationId = organizationId;
      
      // Set default status if not provided
      if (!product.status) {
        product.status = ProductStatus.DRAFT;
      }
      
      // Create the product
      const createdProduct = await this.productRepository.create(product);
      
      this.logger.log(`Product created with ID ${createdProduct.id}`);
      
      return createdProduct;
    } catch (error) {
      this.logger.error(`Error creating product directly: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Update a product
   * Use this method for direct updates (bypassing DTO validation)
   * 
   * @param id Product ID
   * @param updates Partial product object with updates
   * @param organizationId Organization ID
   * @returns Updated product
   */
  async update(id: string, updates: Partial<Product>, organizationId: string): Promise<Product> {
    try {
      this.logger.log(`Updating product directly with ID ${id}`);
      
      // Get the existing product
      const existingProduct = await this.getProductById(id, organizationId);
      if (!existingProduct) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      
      // Update the product
      const updatedProduct = await this.productRepository.update(id, updates);
      
      this.logger.log(`Product updated with ID ${id}`);
      
      return updatedProduct;
    } catch (error) {
      this.logger.error(`Error updating product directly: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Delete a product
   * 
   * @param id Product ID
   * @param organizationId Organization ID
   */
  async delete(id: string, organizationId: string): Promise<void> {
    try {
      this.logger.log(`Deleting product with ID ${id}`);
      
      // Check if product exists and belongs to the organization
      const product = await this.getProductById(id, organizationId);
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      
      // Delete the product
      await this.productRepository.delete(id);
      
      this.logger.log(`Product deleted with ID ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting product: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Find a product by ID
   * 
   * @param id Product ID
   * @param organizationId Organization ID
   * @returns Product or null if not found
   */
  async findById(id: string, organizationId: string): Promise<Product | null> {
    return this.getProductById(id, organizationId);
  }

  /**
   * Find products by filter criteria
   * 
   * @param filter Product filter criteria
   * @returns Filtered products with pagination metadata
   */
  async findProducts(filter: ProductFilter): Promise<{ items: Product[], total: number, page: number, limit: number }> {
    try {
      this.logger.log(`Finding products with filter: ${JSON.stringify(filter)}`);
      
      // Set default pagination values if not provided
      const page = filter.page || 1;
      const limit = filter.limit || 20;
      
      // Find products
      const products = await this.productRepository.findByFilter(filter);
      
      // Get total count (in a real implementation, this would be a separate efficient count query)
      // For demonstration, we'll use the results length
      const total = products.length;
      
      return {
        items: products,
        total,
        page,
        limit
      };
    } catch (error) {
      this.logger.error(`Error finding products: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get featured products
   * 
   * @param organizationId Organization ID
   * @param limit Maximum number of products to return
   * @returns Featured products
   */
  async getFeaturedProducts(organizationId: string, limit: number = 10): Promise<Product[]> {
    try {
      this.logger.log(`Getting featured products for organization ${organizationId}`);
      
      const products = await this.productRepository.findFeatured(organizationId, limit);
      
      return products;
    } catch (error) {
      this.logger.error(`Error getting featured products: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get recently updated products
   * 
   * @param organizationId Organization ID
   * @param limit Maximum number of products to return
   * @returns Recently updated products
   */
  async getRecentlyUpdatedProducts(organizationId: string, limit: number = 10): Promise<Product[]> {
    try {
      this.logger.log(`Getting recently updated products for organization ${organizationId}`);
      
      const products = await this.productRepository.findRecentlyUpdated(organizationId, limit);
      
      return products;
    } catch (error) {
      this.logger.error(`Error getting recently updated products: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get products by category
   * 
   * @param organizationId Organization ID
   * @param categoryId Category ID
   * @param includeSubcategories Whether to include products from subcategories
   * @param options Query options
   * @returns Products in the category
   */
  async getProductsByCategory(
    organizationId: string,
    categoryId: string,
    includeSubcategories: boolean = false,
    options: QueryOptions = {}
  ): Promise<Product[]> {
    try {
      this.logger.log(`Getting products for category ${categoryId} (includeSubcategories: ${includeSubcategories})`);
      
      const products = await this.productRepository.findByCategory(
        organizationId,
        categoryId,
        includeSubcategories,
        options
      );
      
      return products;
    } catch (error) {
      this.logger.error(`Error getting products by category: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get products by marketplace
   * 
   * @param organizationId Organization ID
   * @param marketplaceId Marketplace ID
   * @param options Query options
   * @returns Products in the marketplace
   */
  async getProductsByMarketplace(
    organizationId: string,
    marketplaceId: string,
    options: QueryOptions = {}
  ): Promise<Product[]> {
    try {
      this.logger.log(`Getting products for marketplace ${marketplaceId}`);
      
      const products = await this.productRepository.findByMarketplace(
        organizationId,
        marketplaceId,
        options
      );
      
      return products;
    } catch (error) {
      this.logger.error(`Error getting products by marketplace: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get products by SKUs
   * 
   * @param organizationId Organization ID
   * @param skus Array of SKUs
   * @returns Products matching the SKUs
   */
  async getProductsBySkus(organizationId: string, skus: string[]): Promise<Product[]> {
    try {
      this.logger.log(`Getting products for SKUs: ${skus.join(', ')}`);
      
      const products = await this.productRepository.findBySkus(organizationId, skus);
      
      return products;
    } catch (error) {
      this.logger.error(`Error getting products by SKUs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Bulk update products
   * 
   * @param operations Array of update operations
   * @returns Operation results
   */
  async bulkUpdateProducts(operations: Array<{ id: string, updates: UpdateProductDto }>): Promise<Array<OperationResult<Product>>> {
    try {
      this.logger.log(`Bulk updating ${operations.length} products`);
      
      const results: Array<OperationResult<Product>> = [];
      
      // Process operations in parallel for better performance
      const operationPromises = operations.map(async ({ id, updates }) => {
        try {
          const product = await this.updateProduct(id, updates);
          return {
            success: true,
            data: product
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            errorCode: error.status || 'UNKNOWN_ERROR'
          };
        }
      });
      
      const operationResults = await Promise.all(operationPromises);
      
      return operationResults;
    } catch (error) {
      this.logger.error(`Error in bulk update: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Bulk delete products
   * 
   * @param organizationId Organization ID
   * @param productIds Array of product IDs to delete
   * @returns Operation results
   */
  async bulkDeleteProducts(organizationId: string, productIds: string[]): Promise<Array<OperationResult>> {
    try {
      this.logger.log(`Bulk deleting ${productIds.length} products`);
      
      const results: Array<OperationResult> = [];
      
      // Process deletions in parallel for better performance
      const deletePromises = productIds.map(async (id) => {
        try {
          // Verify the product belongs to the organization
          const product = await this.getProductById(id, organizationId);
          
          if (!product) {
            return {
              success: false,
              error: `Product with ID ${id} not found or does not belong to this organization`,
              errorCode: 'NOT_FOUND'
            };
          }
          
          await this.deleteProduct(id);
          
          return {
            success: true,
            data: { id }
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            errorCode: error.status || 'UNKNOWN_ERROR'
          };
        }
      });
      
      const deleteResults = await Promise.all(deletePromises);
      
      return deleteResults;
    } catch (error) {
      this.logger.error(`Error in bulk delete: ${error.message}`, error.stack);
      throw error;
    }
  }
}