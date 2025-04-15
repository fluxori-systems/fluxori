/**
 * Product Repository
 * 
 * Repository pattern implementation for Product entities
 */

import { Injectable } from '@nestjs/common';
import { TenantAwareRepository } from '../../../common/repositories/firestore-base.repository';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { Product } from '../models/product.model';
import { ProductFilter } from '../interfaces/product-filter.interface';
import { QueryOptions, QueryFilterOperator } from '../../../types/google-cloud.types';

/**
 * Product Repository
 * 
 * Handles data access operations for products in the PIM module
 */
@Injectable()
export class ProductRepository extends TenantAwareRepository<Product> {
  /**
   * Constructor
   * 
   * @param firestoreConfigService Firestore configuration service
   */
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'products', {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 60000, // 1 minute cache TTL
      requiredFields: ['name', 'sku', 'organizationId']
    });
  }

  /**
   * Find products by filter
   * 
   * @param filter Product filter criteria
   * @returns Array of matching products
   */
  async findByFilter(filter: ProductFilter): Promise<Product[]> {
    // Build advanced filters from product filter
    const advancedFilters = [];
    
    // Add organization ID filter
    advancedFilters.push({
      field: 'organizationId',
      operator: '==' as QueryFilterOperator,
      value: filter.organizationId
    });
    
    // Add status filter if provided
    if (filter.status) {
      if (Array.isArray(filter.status)) {
        advancedFilters.push({
          field: 'status',
          operator: 'in',
          value: filter.status
        });
      } else {
        advancedFilters.push({
          field: 'status',
          operator: '==',
          value: filter.status
        });
      }
    }
    
    // Add category filter if provided
    if (filter.categoryIds && filter.categoryIds.length > 0) {
      // Since we can't filter on array containsAny directly,
      // we can use "array-contains" for single category or do multiple queries for multiple categories
      if (filter.categoryIds.length === 1) {
        advancedFilters.push({
          field: 'categories.id',
          operator: 'array-contains',
          value: filter.categoryIds[0]
        });
      } else {
        // For multiple categories, we'll add after initial query
        // This is a limitation we'll work around in the code below
      }
    }
    
    // Add SKU pattern filter if provided
    if (filter.skuPattern) {
      advancedFilters.push({
        field: 'sku',
        operator: '>=',
        value: filter.skuPattern
      });
      
      // Add upper bound for range query
      const upperBound = filter.skuPattern.slice(0, -1) + 
                        String.fromCharCode(filter.skuPattern.charCodeAt(filter.skuPattern.length - 1) + 1);
      advancedFilters.push({
        field: 'sku',
        operator: '<',
        value: upperBound
      });
    }
    
    // Add price range filter if provided
    if (filter.priceRange) {
      if (filter.priceRange.min !== undefined) {
        advancedFilters.push({
          field: 'pricing.basePrice',
          operator: '>=',
          value: filter.priceRange.min
        });
      }
      
      if (filter.priceRange.max !== undefined) {
        advancedFilters.push({
          field: 'pricing.basePrice',
          operator: '<=',
          value: filter.priceRange.max
        });
      }
    }
    
    // Add date filters if provided
    if (filter.createdAt) {
      if (filter.createdAt.from) {
        advancedFilters.push({
          field: 'createdAt',
          operator: '>=',
          value: filter.createdAt.from
        });
      }
      
      if (filter.createdAt.to) {
        advancedFilters.push({
          field: 'createdAt',
          operator: '<=',
          value: filter.createdAt.to
        });
      }
    }
    
    if (filter.updatedAt) {
      if (filter.updatedAt.from) {
        advancedFilters.push({
          field: 'updatedAt',
          operator: '>=',
          value: filter.updatedAt.from
        });
      }
      
      if (filter.updatedAt.to) {
        advancedFilters.push({
          field: 'updatedAt',
          operator: '<=',
          value: filter.updatedAt.to
        });
      }
    }
    
    // Add South African specific filters if applicable
    if (filter.vatIncluded !== undefined) {
      advancedFilters.push({
        field: 'pricing.vatIncluded',
        operator: '==',
        value: filter.vatIncluded
      });
    }
    
    if (filter.complianceStatus) {
      if (filter.complianceStatus.icasa !== undefined) {
        advancedFilters.push({
          field: 'regional.southAfrica.icasaApproved',
          operator: '==',
          value: filter.complianceStatus.icasa
        });
      }
      
      if (filter.complianceStatus.sabs !== undefined) {
        advancedFilters.push({
          field: 'regional.southAfrica.sabsApproved',
          operator: '==',
          value: filter.complianceStatus.sabs
        });
      }
      
      if (filter.complianceStatus.nrcs !== undefined) {
        advancedFilters.push({
          field: 'regional.southAfrica.nrcsApproved',
          operator: '==',
          value: filter.complianceStatus.nrcs
        });
      }
    }
    
    // TODO: Handle attribute filtering (more complex, might require post-filtering)
    
    // Build properly structured query options for paginate method
    const queryOptions: QueryOptions = {
      filters: advancedFilters.map(filter => ({
        field: filter.field,
        operator: filter.operator as QueryFilterOperator,
        value: filter.value
      })),
      pagination: {
        page: filter.page || 1,
        pageSize: filter.limit || 20
      },
      orderBy: [
        {
          field: filter.sortBy || 'createdAt',
          direction: filter.sortDirection || 'desc'
        }
      ]
    };
    
    let products = await this.paginate(queryOptions).then(result => result.items);
    
    // Handle text search (simple implementation - more complex implementation would use full-text search)
    if (filter.query) {
      const lowercaseQuery = filter.query.toLowerCase();
      products = products.filter(product => 
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.sku.toLowerCase().includes(lowercaseQuery) ||
        (product.description && product.description.toLowerCase().includes(lowercaseQuery))
      );
    }
    
    // Handle multiple category filter (simple implementation - more complex implementation would use specialized queries)
    if (filter.categoryIds && filter.categoryIds.length > 1) {
      products = products.filter(product => 
        product.categories?.some(category => 
          filter.categoryIds?.includes(category.id)
        )
      );
    }
    
    // Handle marketplace filter
    if (filter.marketplaceIds && filter.marketplaceIds.length > 0) {
      products = products.filter(product => 
        product.marketplaceMappings?.some(mapping => 
          filter.marketplaceIds?.includes(mapping.marketplaceId)
        )
      );
    }
    
    return products;
  }

  /**
   * Find products by SKUs
   * 
   * @param organizationId The organization ID
   * @param skus Array of SKUs to find
   * @returns Array of matching products
   */
  async findBySkus(organizationId: string, skus: string[]): Promise<Product[]> {
    if (!skus || skus.length === 0) {
      return [];
    }
    
    // Firestore "in" operator can only handle up to 10 values
    // For more than 10 SKUs, we need to split into multiple queries
    const chunkSize = 10;
    const chunks = [];
    
    for (let i = 0; i < skus.length; i += chunkSize) {
      chunks.push(skus.slice(i, i + chunkSize));
    }
    
    // Execute queries in parallel
    const results = await Promise.all(
      chunks.map(skuChunk => 
        this.find({
          advancedFilters: [
            {
              field: 'organizationId',
              operator: '==',
              value: organizationId
            },
            {
              field: 'sku',
              operator: 'in',
              value: skuChunk
            }
          ]
        })
      )
    );
    
    // Flatten results
    return results.flat();
  }
  
  /**
   * Find products by category
   * 
   * @param organizationId The organization ID
   * @param categoryId The category ID
   * @param includeSubcategories Whether to include products from subcategories
   * @param options Query options for pagination, sorting, etc.
   * @returns Array of matching products
   */
  async findByCategory(
    organizationId: string,
    categoryId: string,
    includeSubcategories: boolean = false,
    options: QueryOptions = {}
  ): Promise<Product[]> {
    // Prepare advanced filters with proper types
    const advancedFilters = [
      {
        field: 'organizationId',
        operator: '==' as QueryFilterOperator,
        value: organizationId
      },
      {
        field: 'categories.id',
        operator: 'array-contains' as QueryFilterOperator,
        value: categoryId
      }
    ];

    // Calculate offset for pagination
    const page = options.pagination?.page || 1;
    const pageSize = options.pagination?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    // Build proper queryOptions structure
    return this.find({
      advancedFilters,
      queryOptions: {
        orderBy: options.orderBy?.[0]?.field,
        direction: options.orderBy?.[0]?.direction,
        limit: pageSize,
        offset
      }
    });
  }
  
  /**
   * Find products by marketplace
   * 
   * @param organizationId The organization ID
   * @param marketplaceId The marketplace ID
   * @param options Query options for pagination, sorting, etc.
   * @returns Array of matching products
   */
  async findByMarketplace(
    organizationId: string,
    marketplaceId: string,
    options: QueryOptions = {}
  ): Promise<Product[]> {
    // For simplicity, we'll fetch all products and filter
    // In a production environment, we would use a more efficient query design
    
    // Calculate pagination parameters
    const page = options.pagination?.page || 1;
    const pageSize = options.pagination?.pageSize || 20;
    const fetchLimit = pageSize * 5; // Fetch more to filter
    const offset = (page - 1) * pageSize;
    
    // Get base query options properly structured
    const products = await this.findByOrganization(organizationId, {
      queryOptions: {
        orderBy: options.orderBy?.[0]?.field,
        direction: options.orderBy?.[0]?.direction,
        limit: fetchLimit,
        offset: offset
      }
    });
    
    // Filter by marketplace
    const filteredProducts = products.filter(product => 
      product.marketplaceMappings?.some(mapping => 
        mapping.marketplaceId === marketplaceId
      )
    );
    
    // Apply pagination manually
    const start = 0; // We've already applied offset in the query
    const end = pageSize;
    
    return filteredProducts.slice(start, end);
  }
  
  /**
   * Find featured products
   * 
   * @param organizationId The organization ID
   * @param limit Maximum number of products to return
   * @returns Array of featured products
   */
  async findFeatured(organizationId: string, limit: number = 10): Promise<Product[]> {
    return this.find({
      advancedFilters: [
        {
          field: 'organizationId',
          operator: '==',
          value: organizationId
        },
        {
          field: 'featured',
          operator: '==',
          value: true
        },
        {
          field: 'status',
          operator: '==',
          value: 'active'
        }
      ],
      queryOptions: {
        limit
      }
    });
  }
  
  /**
   * Find recently updated products
   * 
   * @param organizationId The organization ID
   * @param limit Maximum number of products to return
   * @returns Array of recently updated products
   */
  async findRecentlyUpdated(organizationId: string, limit: number = 10): Promise<Product[]> {
    return this.find({
      advancedFilters: [
        {
          field: 'organizationId',
          operator: '==',
          value: organizationId
        }
      ],
      queryOptions: {
        orderBy: 'updatedAt',
        direction: 'desc',
        limit
      }
    });
  }
}