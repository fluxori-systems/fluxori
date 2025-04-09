/**
 * Product Repository
 *
 * This repository handles all product data operations.
 */

import { TenantFirestoreService } from '../lib/firebase/firestore.service';
import { 
  Product, 
  ProductCategory, 
  ProductBrand, 
  ProductStatus 
} from '../types/product/product.types';
import { QueryOptions } from '../types/core/entity.types';

/**
 * Repository for Product entities
 */
export class ProductRepository extends TenantFirestoreService<Product> {
  /**
   * Create ProductRepository instance
   */
  constructor() {
    super('products');
  }

  /**
   * Get product by SKU for an organization
   * @param organizationId Organization ID
   * @param sku Product SKU
   * @returns Product entity or null
   */
  async getBySkuForOrganization(organizationId: string, sku: string): Promise<Product | null> {
    try {
      const products = await this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'sku', operator: '==', value: sku }]
      );

      return products.length > 0 ? products[0] : null;
    } catch (error) {
      console.error(`Error getting product by SKU ${sku}:`, error);
      throw error;
    }
  }

  /**
   * Get products by category for an organization
   * @param organizationId Organization ID
   * @param categoryId Category ID
   * @param options Query options
   * @returns Array of product entities
   */
  async getProductsByCategoryForOrganization(
    organizationId: string,
    categoryId: string,
    options?: QueryOptions
  ): Promise<Product[]> {
    try {
      return this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'categoryIds', operator: 'array-contains', value: categoryId }],
        options
      );
    } catch (error) {
      console.error(`Error getting products by category:`, error);
      throw error;
    }
  }

  /**
   * Get products by brand for an organization
   * @param organizationId Organization ID
   * @param brandId Brand ID
   * @param options Query options
   * @returns Array of product entities
   */
  async getProductsByBrandForOrganization(
    organizationId: string,
    brandId: string,
    options?: QueryOptions
  ): Promise<Product[]> {
    try {
      return this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'brandId', operator: '==', value: brandId }],
        options
      );
    } catch (error) {
      console.error(`Error getting products by brand:`, error);
      throw error;
    }
  }

  /**
   * Get products by status for an organization
   * @param organizationId Organization ID
   * @param status Product status
   * @param options Query options
   * @returns Array of product entities
   */
  async getProductsByStatusForOrganization(
    organizationId: string,
    status: ProductStatus,
    options?: QueryOptions
  ): Promise<Product[]> {
    try {
      return this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'status', operator: '==', value: status }],
        options
      );
    } catch (error) {
      console.error(`Error getting products by status:`, error);
      throw error;
    }
  }

  /**
   * Get low stock products for an organization
   * @param organizationId Organization ID
   * @param options Query options
   * @returns Array of product entities
   */
  async getLowStockProductsForOrganization(
    organizationId: string,
    options?: QueryOptions
  ): Promise<Product[]> {
    try {
      // First get products and then filter in-memory for low stock
      // Firestore doesn't support queries that compare fields against each other
      const products = await this.getAllForOrganization(organizationId, options);
      
      return products.filter(product => {
        // Check if product has stock threshold defined
        if (product.stockLevelThreshold && product.stockLevelThreshold.low) {
          return product.availableQuantity <= product.stockLevelThreshold.low;
        }
        
        // Default threshold if none defined
        return product.availableQuantity <= 5;
      });
    } catch (error) {
      console.error(`Error getting low stock products:`, error);
      throw error;
    }
  }
}

/**
 * Repository for ProductCategory entities
 */
export class ProductCategoryRepository extends TenantFirestoreService<ProductCategory> {
  /**
   * Create ProductCategoryRepository instance
   */
  constructor() {
    super('product_categories');
  }

  /**
   * Get category by slug for an organization
   * @param organizationId Organization ID
   * @param slug Category slug
   * @returns ProductCategory entity or null
   */
  async getBySlugForOrganization(organizationId: string, slug: string): Promise<ProductCategory | null> {
    try {
      const categories = await this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'slug', operator: '==', value: slug }]
      );

      return categories.length > 0 ? categories[0] : null;
    } catch (error) {
      console.error(`Error getting category by slug ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Get top-level categories for an organization
   * @param organizationId Organization ID
   * @returns Array of top-level category entities
   */
  async getTopLevelCategoriesForOrganization(organizationId: string): Promise<ProductCategory[]> {
    try {
      return this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'parentId', operator: '==', value: null }]
      );
    } catch (error) {
      console.error(`Error getting top-level categories:`, error);
      throw error;
    }
  }

  /**
   * Get child categories for an organization
   * @param organizationId Organization ID
   * @param parentId Parent category ID
   * @returns Array of child category entities
   */
  async getChildCategoriesForOrganization(
    organizationId: string,
    parentId: string
  ): Promise<ProductCategory[]> {
    try {
      return this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'parentId', operator: '==', value: parentId }]
      );
    } catch (error) {
      console.error(`Error getting child categories:`, error);
      throw error;
    }
  }
}

/**
 * Repository for ProductBrand entities
 */
export class ProductBrandRepository extends TenantFirestoreService<ProductBrand> {
  /**
   * Create ProductBrandRepository instance
   */
  constructor() {
    super('product_brands');
  }

  /**
   * Get brand by slug for an organization
   * @param organizationId Organization ID
   * @param slug Brand slug
   * @returns ProductBrand entity or null
   */
  async getBySlugForOrganization(organizationId: string, slug: string): Promise<ProductBrand | null> {
    try {
      const brands = await this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'slug', operator: '==', value: slug }]
      );

      return brands.length > 0 ? brands[0] : null;
    } catch (error) {
      console.error(`Error getting brand by slug ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Get active brands for an organization
   * @param organizationId Organization ID
   * @returns Array of active brand entities
   */
  async getActiveBrandsForOrganization(organizationId: string): Promise<ProductBrand[]> {
    try {
      return this.findWithFiltersForOrganization(
        organizationId,
        [{ field: 'isActive', operator: '==', value: true }]
      );
    } catch (error) {
      console.error(`Error getting active brands:`, error);
      throw error;
    }
  }
}