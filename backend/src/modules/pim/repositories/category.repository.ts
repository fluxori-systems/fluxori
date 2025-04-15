/**
 * Category Repository
 * 
 * Repository pattern implementation for Category entities
 */

import { Injectable } from '@nestjs/common';
import { TenantAwareRepository } from '../../../common/repositories/firestore-base.repository';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { Category, CategoryNode } from '../models/category.model';
import { CategoryFilter } from '../interfaces/category-filter.interface';
import { QueryOptions } from '../../../types/google-cloud.types';

/**
 * Category Repository
 * 
 * Handles data access operations for categories in the PIM module
 */
@Injectable()
export class CategoryRepository extends TenantAwareRepository<Category> {
  /**
   * Constructor
   * 
   * @param firestoreConfigService Firestore configuration service
   */
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'categories', {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 120000, // 2 minute cache TTL (categories change less frequently)
      requiredFields: ['name', 'status', 'organizationId']
    });
  }

  /**
   * Find categories by filter
   * 
   * @param filter Category filter criteria
   * @returns Array of matching categories
   */
  async findByFilter(filter: CategoryFilter): Promise<Category[]> {
    // Build advanced filters from category filter
    const advancedFilters = [];
    
    // Add organization ID filter
    advancedFilters.push({
      field: 'organizationId',
      operator: '==',
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
    
    // Add parent ID filter if provided
    if (filter.parentId !== undefined) {
      advancedFilters.push({
        field: 'parentId',
        operator: '==',
        value: filter.parentId
      });
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
    
    // Add marketplace filter if provided
    if (filter.marketplaceIds && filter.marketplaceIds.length > 0) {
      // For simplicity, we'll need to post-filter these
      // In a real implementation, we would have a more efficient query design
    }
    
    // Add Takealot mapping filter if provided (South Africa specific)
    if (filter.hasTakealotMapping !== undefined) {
      // Similarly, we'll need to post-filter these
    }
    
    // Build query options
    const queryOptions: QueryOptions = {
      pagination: {
        page: filter.page || 1,
        pageSize: filter.limit || 20
      },
      orderBy: [
        {
          field: filter.sortBy || 'position',
          direction: filter.sortDirection || 'asc'
        }
      ]
    };
    
    let categories = await this.paginate(queryOptions).then(result => result.items);
    
    // Handle text search (simple implementation)
    if (filter.query) {
      const lowercaseQuery = filter.query.toLowerCase();
      categories = categories.filter(category => 
        category.name.toLowerCase().includes(lowercaseQuery) ||
        (category.description && category.description.toLowerCase().includes(lowercaseQuery))
      );
    }
    
    // Handle marketplace filter
    if (filter.marketplaceIds && filter.marketplaceIds.length > 0) {
      categories = categories.filter(category => 
        category.marketplaceMappings?.some(mapping => 
          filter.marketplaceIds?.includes(mapping.marketplaceId)
        )
      );
    }
    
    // Handle Takealot mapping filter
    if (filter.hasTakealotMapping !== undefined) {
      categories = categories.filter(category => {
        const hasTakealot = category.marketplaceMappings?.some(
          mapping => mapping.marketplaceId === 'takealot'
        ) ?? false;
        
        return filter.hasTakealotMapping === hasTakealot;
      });
    }
    
    return categories;
  }

  /**
   * Get the category tree for an organization
   * 
   * @param organizationId The organization ID
   * @param rootOnly Whether to only return root categories (no children)
   * @param maxDepth Maximum depth of children to include
   * @returns Tree structure of categories
   */
  async getCategoryTree(
    organizationId: string,
    rootOnly: boolean = false,
    maxDepth: number = 10
  ): Promise<CategoryNode[]> {
    // Get all categories for the organization
    const allCategories = await this.findByOrganization(organizationId);
    
    // If only root categories are requested, filter them
    if (rootOnly) {
      return allCategories
        .filter(category => category.parentId === null)
        .map(category => ({ ...category, children: [] }));
    }
    
    // Build the tree structure
    return this.buildCategoryTree(allCategories, null, maxDepth);
  }
  
  /**
   * Find root categories for an organization
   * 
   * @param organizationId The organization ID
   * @returns Array of root categories
   */
  async findRootCategories(organizationId: string): Promise<Category[]> {
    return this.find({
      advancedFilters: [
        {
          field: 'organizationId',
          operator: '==',
          value: organizationId
        },
        {
          field: 'parentId',
          operator: '==',
          value: null
        }
      ],
      queryOptions: {
        orderBy: 'position',
        direction: 'asc'
      }
    });
  }
  
  /**
   * Find child categories for a parent category
   * 
   * @param organizationId The organization ID
   * @param parentId The parent category ID
   * @returns Array of child categories
   */
  async findChildCategories(organizationId: string, parentId: string): Promise<Category[]> {
    return this.find({
      advancedFilters: [
        {
          field: 'organizationId',
          operator: '==',
          value: organizationId
        },
        {
          field: 'parentId',
          operator: '==',
          value: parentId
        }
      ],
      queryOptions: {
        orderBy: 'position',
        direction: 'asc'
      }
    });
  }
  
  /**
   * Find categories by marketplace
   * 
   * @param organizationId The organization ID
   * @param marketplaceId The marketplace ID
   * @returns Array of categories with mappings to the specified marketplace
   */
  async findByMarketplace(organizationId: string, marketplaceId: string): Promise<Category[]> {
    // For simplicity, we'll fetch all categories and filter
    // In a production environment, we would use a more efficient query design
    const categories = await this.findByOrganization(organizationId);
    
    // Filter by marketplace
    return categories.filter(category => 
      category.marketplaceMappings?.some(mapping => 
        mapping.marketplaceId === marketplaceId
      )
    );
  }
  
  /**
   * Find categories by path (for breadcrumbs)
   * 
   * @param organizationId The organization ID
   * @param categoryIds Array of category IDs forming a path
   * @returns Array of categories in the path
   */
  async findByPath(organizationId: string, categoryIds: string[]): Promise<Category[]> {
    if (!categoryIds || categoryIds.length === 0) {
      return [];
    }
    
    return this.find({
      advancedFilters: [
        {
          field: 'organizationId',
          operator: '==',
          value: organizationId
        },
        {
          field: 'id',
          operator: 'in',
          value: categoryIds.slice(0, 10) // Firestore "in" operator limited to 10 values
        }
      ]
    });
  }
  
  /**
   * Utility method to build a category tree from flat categories
   * 
   * @param categories Array of all categories
   * @param parentId Parent ID to filter by (null for root)
   * @param maxDepth Maximum depth of recursion
   * @param currentDepth Current depth in the recursion
   * @returns Tree structure of categories
   */
  private buildCategoryTree(
    categories: Category[],
    parentId: string | null,
    maxDepth: number,
    currentDepth: number = 0
  ): CategoryNode[] {
    if (currentDepth >= maxDepth) {
      return [];
    }
    
    // Filter categories that match the parent ID
    const filteredCategories = categories.filter(
      category => category.parentId === parentId
    );
    
    // Convert to tree nodes and add children recursively
    return filteredCategories.map(category => {
      const node: CategoryNode = {
        ...category,
        children: this.buildCategoryTree(
          categories,
          category.id,
          maxDepth,
          currentDepth + 1
        )
      };
      
      return node;
    });
  }
}