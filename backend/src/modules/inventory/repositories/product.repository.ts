import { Injectable, Logger } from '@nestjs/common';

import {
  FirestoreBaseRepository,
  FirestoreAdvancedFilter,
} from '../../../common/repositories';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { ProductStatus } from '../interfaces/types';
import { Product } from '../models/product.schema';

/**
 * Repository for Product entities
 */
@Injectable()
export class ProductRepository extends FirestoreBaseRepository<Product> {
  protected readonly logger = new Logger(ProductRepository.name);

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'products', {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 5 * 60 * 1000, // 5 minutes
      requiredFields: ['organizationId', 'sku', 'name', 'status'],
    });
  }

  /**
   * Find products by organization ID
   * @param organizationId Organization ID
   * @returns Array of products
   */
  async findByOrganization(organizationId: string): Promise<Product[]> {
    return this.find({
      advancedFilters: [
        { field: 'organizationId', operator: '==', value: organizationId },
      ],
    });
  }

  /**
   * Find products by SKU
   * @param organizationId Organization ID
   * @param sku Product SKU
   * @returns Product or null if not found
   */
  async findBySku(
    organizationId: string,
    sku: string,
  ): Promise<Product | null> {
    const results = await this.find({
      advancedFilters: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'sku', operator: '==', value: sku },
      ],
    });

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find products by barcode
   * @param organizationId Organization ID
   * @param barcode Product barcode
   * @returns Product or null if not found
   */
  async findByBarcode(
    organizationId: string,
    barcode: string,
  ): Promise<Product | null> {
    const results = await this.find({
      advancedFilters: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'barcode', operator: '==', value: barcode },
      ],
    });

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find products by status
   * @param organizationId Organization ID
   * @param status Product status
   * @returns Array of products
   */
  async findByStatus(
    organizationId: string,
    status: ProductStatus,
  ): Promise<Product[]> {
    return this.find({
      advancedFilters: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'status', operator: '==', value: status },
      ],
    });
  }

  /**
   * Find products by category
   * @param organizationId Organization ID
   * @param categoryId Category ID
   * @returns Array of products
   */
  async findByCategory(
    organizationId: string,
    categoryId: string,
  ): Promise<Product[]> {
    // Fetch all products for the organization
    const products = await this.findByOrganization(organizationId);

    // Filter products that have the category ID in their categoryIds array
    return products.filter(
      (product) =>
        product.categoryIds && product.categoryIds.includes(categoryId),
    );
  }

  /**
   * Find products by brand
   * @param organizationId Organization ID
   * @param brandId Brand ID
   * @returns Array of products
   */
  async findByBrand(
    organizationId: string,
    brandId: string,
  ): Promise<Product[]> {
    return this.find({
      advancedFilters: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'brandId', operator: '==', value: brandId },
      ],
    });
  }

  /**
   * Find products with low stock
   * @param organizationId Organization ID
   * @returns Array of products with low stock
   */
  async findLowStock(organizationId: string): Promise<Product[]> {
    // Get all products for the organization
    const products = await this.findByOrganization(organizationId);

    // Filter products with low stock
    return products.filter((product) => {
      // Check if product has a threshold defined
      if (product.stockLevelThreshold) {
        return product.availableQuantity <= product.stockLevelThreshold.low;
      }

      // Default low stock level if no threshold is defined
      return product.availableQuantity <= 5;
    });
  }

  /**
   * Update product stock quantities
   * @param id Product ID
   * @param stockQuantity Total stock quantity
   * @param reservedQuantity Reserved quantity
   * @returns Updated product
   */
  async updateStock(
    id: string,
    stockQuantity: number,
    reservedQuantity: number,
  ): Promise<Product | null> {
    // Calculate available quantity
    const availableQuantity = Math.max(0, stockQuantity - reservedQuantity);

    return this.update(id, {
      stockQuantity,
      reservedQuantity,
      availableQuantity,
    });
  }

  /**
   * Search products by text
   * @param organizationId Organization ID
   * @param searchText Search text
   * @returns Array of matching products
   */
  async searchProducts(
    organizationId: string,
    searchText: string,
  ): Promise<Product[]> {
    // Get all products for the organization
    const products = await this.findByOrganization(organizationId);

    // Normalize search text
    const normalizedSearch = searchText.toLowerCase().trim();

    // Filter products based on search text
    return products.filter((product) => {
      const name = product.name.toLowerCase();
      const sku = product.sku.toLowerCase();
      const description = product.description?.toLowerCase() || '';

      return (
        name.includes(normalizedSearch) ||
        sku.includes(normalizedSearch) ||
        description.includes(normalizedSearch)
      );
    });
  }

  /**
   * Find products with advanced filtering
   * @param params Query parameters
   * @returns Array of filtered products
   */
  async findWithFilters(params: {
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
    // Create advanced filters
    const advancedFilters: FirestoreAdvancedFilter<Product>[] = [
      { field: 'organizationId', operator: '==', value: params.organizationId },
    ];

    // Add optional filters
    if (params.status) {
      advancedFilters.push({
        field: 'status',
        operator: '==',
        value: params.status,
      });
    }

    if (params.brandId) {
      advancedFilters.push({
        field: 'brandId',
        operator: '==',
        value: params.brandId,
      });
    }

    if (params.hasVariants !== undefined) {
      advancedFilters.push({
        field: 'hasVariants',
        operator: '==',
        value: params.hasVariants,
      });
    }

    // First pass with basic filters
    let products = await this.find({
      advancedFilters,
      queryOptions: {
        orderBy: 'name',
        limit: params.limit,
        offset: params.offset,
      },
    });

    // Some filters need post-processing
    if (params.categoryId) {
      products = products.filter(
        (product) =>
          product.categoryIds &&
          params.categoryId &&
          product.categoryIds.includes(params.categoryId),
      );
    }

    if (params.priceMin !== undefined) {
      products = products.filter(
        (product) =>
          product.pricing &&
          product.pricing.basePrice >= (params.priceMin || 0),
      );
    }

    if (params.priceMax !== undefined) {
      products = products.filter(
        (product) =>
          product.pricing &&
          product.pricing.basePrice <= (params.priceMax || Number.MAX_VALUE),
      );
    }

    if (params.stockMin !== undefined) {
      products = products.filter(
        (product) => (product.availableQuantity || 0) >= (params.stockMin || 0),
      );
    }

    if (params.stockMax !== undefined) {
      products = products.filter(
        (product) =>
          (product.availableQuantity || 0) <=
          (params.stockMax || Number.MAX_VALUE),
      );
    }

    if (params.tags && params.tags.length > 0) {
      const tagsToCheck = params.tags;
      products = products.filter((product) => {
        if (!product.tags) return false;
        const productTags = product.tags;
        return tagsToCheck.some((tag) => productTags.includes(tag));
      });
    }

    if (params.searchText) {
      const normalizedSearch = params.searchText.toLowerCase().trim();
      products = products.filter((product) => {
        const name = product.name.toLowerCase();
        const sku = product.sku.toLowerCase();
        const description = product.description?.toLowerCase() || '';

        return (
          name.includes(normalizedSearch) ||
          sku.includes(normalizedSearch) ||
          description.includes(normalizedSearch)
        );
      });
    }

    return products;
  }
}
