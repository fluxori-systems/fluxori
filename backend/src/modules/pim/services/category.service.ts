import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from '../repositories/category.repository';
import { Category, CategoryNode, CreateCategoryDto, UpdateCategoryDto, CategoryStatus } from '../models/category.model';
import { CategoryFilter } from '../interfaces/category-filter.interface';
import { OperationResult } from '../interfaces/types';
import { QueryOptions } from '../../../types/google-cloud.types';

/**
 * Category Service
 * 
 * Core service for managing product categories in the PIM module
 */
@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    private readonly categoryRepository: CategoryRepository
  ) {}

  /**
   * Create a new category
   * 
   * @param createCategoryDto Category creation DTO
   * @returns Created category
   */
  async createCategory(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      this.logger.log(`Creating category ${createCategoryDto.name}`);
      
      // Set default values if not provided
      if (createCategoryDto.status === undefined) {
        createCategoryDto.status = CategoryStatus.ACTIVE;
      }
      
      if (createCategoryDto.position === undefined) {
        // Get highest position value in same parent and increment
        const siblings = await this.getChildCategories(
          createCategoryDto.organizationId,
          createCategoryDto.parentId || null
        );
        
        const maxPosition = siblings.reduce(
          (max, category) => Math.max(max, category.position || 0),
          0
        );
        
        createCategoryDto.position = maxPosition + 1;
      }
      
      if (createCategoryDto.includeInMenu === undefined) {
        createCategoryDto.includeInMenu = true;
      }
      
      // If parent ID is provided, calculate level and path
      let level = 0;
      let path: string[] = [];
      
      if (createCategoryDto.parentId) {
        const parent = await this.categoryRepository.findById(createCategoryDto.parentId);
        
        if (!parent) {
          throw new NotFoundException(`Parent category with ID ${createCategoryDto.parentId} not found`);
        }
        
        level = (parent.level || 0) + 1;
        path = [...(parent.path || []), parent.id];
      }
      
      // Create the category with calculated fields
      const categoryToCreate = {
        ...createCategoryDto,
        level,
        path,
        childCount: 0,
        productCount: 0
      };
      
      const category = await this.categoryRepository.create(categoryToCreate);
      
      // Update parent's child count if needed
      if (category.parentId) {
        await this.incrementParentChildCount(category.parentId);
      }
      
      this.logger.log(`Category created with ID ${category.id}`);
      
      return category;
    } catch (error) {
      this.logger.error(`Error creating category: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an existing category
   * 
   * @param id Category ID
   * @param updateCategoryDto Category update DTO
   * @returns Updated category
   */
  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    try {
      this.logger.log(`Updating category with ID ${id}`);
      
      // Get current category
      const currentCategory = await this.categoryRepository.findById(id);
      
      if (!currentCategory) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      
      // If parent ID is changing, recalculate level and path
      if (updateCategoryDto.parentId !== undefined && 
          updateCategoryDto.parentId !== currentCategory.parentId) {
        
        // Check for circular reference
        if (updateCategoryDto.parentId === id) {
          throw new Error('Category cannot be its own parent');
        }
        
        // Check if new parent exists
        let level = 0;
        let path: string[] = [];
        
        if (updateCategoryDto.parentId) {
          const parent = await this.categoryRepository.findById(updateCategoryDto.parentId);
          
          if (!parent) {
            throw new NotFoundException(`Parent category with ID ${updateCategoryDto.parentId} not found`);
          }
          
          // Check if new parent is a descendant of this category (circular reference)
          if (parent.path && parent.path.includes(id)) {
            throw new Error('Cannot move category to one of its descendants');
          }
          
          level = (parent.level || 0) + 1;
          path = [...(parent.path || []), parent.id];
        }
        
        // Update level and path
        updateCategoryDto.level = level;
        
        // Intentionally can't destructively update path in this function
        // Needs recursive update of all children in a transaction
        // For simplicity, we've omitted full path updates in this implementation
        
        // Update old parent's child count
        if (currentCategory.parentId) {
          await this.decrementParentChildCount(currentCategory.parentId);
        }
        
        // Update new parent's child count
        if (updateCategoryDto.parentId) {
          await this.incrementParentChildCount(updateCategoryDto.parentId);
        }
      }
      
      // Update the category
      const category = await this.categoryRepository.update(id, updateCategoryDto);
      
      this.logger.log(`Category updated with ID ${id}`);
      
      return category;
    } catch (error) {
      this.logger.error(`Error updating category: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a category by ID
   * 
   * @param id Category ID
   * @param organizationId Organization ID
   * @returns Category or null if not found
   */
  async getCategoryById(id: string, organizationId: string): Promise<Category | null> {
    try {
      this.logger.log(`Getting category with ID ${id}`);
      
      // Get the category
      const category = await this.categoryRepository.findById(id);
      
      // Check if category exists and belongs to the organization
      if (!category || category.organizationId !== organizationId) {
        return null;
      }
      
      return category;
    } catch (error) {
      this.logger.error(`Error getting category: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a category
   * 
   * @param id Category ID
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      this.logger.log(`Deleting category with ID ${id}`);
      
      // Get the category to check if it has children
      const category = await this.categoryRepository.findById(id);
      
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      
      if (category.childCount && category.childCount > 0) {
        throw new Error('Cannot delete category with children. Delete children first or move them to another category.');
      }
      
      // Delete the category
      await this.categoryRepository.delete(id);
      
      // Update parent's child count if needed
      if (category.parentId) {
        await this.decrementParentChildCount(category.parentId);
      }
      
      this.logger.log(`Category deleted with ID ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting category: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find categories by filter criteria
   * 
   * @param filter Category filter criteria
   * @returns Filtered categories with pagination metadata
   */
  async findCategories(filter: CategoryFilter): Promise<{ items: Category[], total: number, page: number, limit: number }> {
    try {
      this.logger.log(`Finding categories with filter: ${JSON.stringify(filter)}`);
      
      // Set default pagination values if not provided
      const page = filter.page || 1;
      const limit = filter.limit || 20;
      
      // Find categories
      const categories = await this.categoryRepository.findByFilter(filter);
      
      // Get total count (in a real implementation, this would be a separate efficient count query)
      // For demonstration, we'll use the results length
      const total = categories.length;
      
      return {
        items: categories,
        total,
        page,
        limit
      };
    } catch (error) {
      this.logger.error(`Error finding categories: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get the category tree for an organization
   * 
   * @param organizationId Organization ID
   * @param rootOnly Whether to only return root categories (no children)
   * @param maxDepth Maximum depth of children to include
   * @returns Category tree
   */
  async getCategoryTree(
    organizationId: string,
    rootOnly: boolean = false,
    maxDepth: number = 10
  ): Promise<CategoryNode[]> {
    try {
      this.logger.log(`Getting category tree for organization ${organizationId}`);
      
      return await this.categoryRepository.getCategoryTree(
        organizationId,
        rootOnly,
        maxDepth
      );
    } catch (error) {
      this.logger.error(`Error getting category tree: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get root categories for an organization
   * 
   * @param organizationId Organization ID
   * @returns Root categories
   */
  async getRootCategories(organizationId: string): Promise<Category[]> {
    try {
      this.logger.log(`Getting root categories for organization ${organizationId}`);
      
      return await this.categoryRepository.findRootCategories(organizationId);
    } catch (error) {
      this.logger.error(`Error getting root categories: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get child categories for a parent category
   * 
   * @param organizationId Organization ID
   * @param parentId Parent category ID
   * @returns Child categories
   */
  async getChildCategories(organizationId: string, parentId: string | null): Promise<Category[]> {
    try {
      this.logger.log(`Getting child categories for parent ${parentId}`);
      
      if (parentId === null) {
        return await this.categoryRepository.findRootCategories(organizationId);
      } else {
        return await this.categoryRepository.findChildCategories(organizationId, parentId);
      }
    } catch (error) {
      this.logger.error(`Error getting child categories: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get categories by marketplace
   * 
   * @param organizationId Organization ID
   * @param marketplaceId Marketplace ID
   * @returns Categories with mappings to the marketplace
   */
  async getCategoriesByMarketplace(organizationId: string, marketplaceId: string): Promise<Category[]> {
    try {
      this.logger.log(`Getting categories for marketplace ${marketplaceId}`);
      
      return await this.categoryRepository.findByMarketplace(organizationId, marketplaceId);
    } catch (error) {
      this.logger.error(`Error getting categories by marketplace: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get category path (for breadcrumbs)
   * 
   * @param organizationId Organization ID
   * @param categoryId Category ID
   * @returns Categories in the path
   */
  async getCategoryPath(organizationId: string, categoryId: string): Promise<Category[]> {
    try {
      this.logger.log(`Getting category path for category ${categoryId}`);
      
      // Get the category to get its path
      const category = await this.categoryRepository.findById(categoryId);
      
      if (!category || category.organizationId !== organizationId) {
        throw new NotFoundException(`Category with ID ${categoryId} not found`);
      }
      
      // If no path, return just this category
      if (!category.path || category.path.length === 0) {
        return [category];
      }
      
      // Get all categories in the path
      const pathCategories = await this.categoryRepository.findByPath(
        organizationId,
        category.path
      );
      
      // Sort categories by path order
      const sortedPathCategories = [];
      
      for (const pathId of category.path) {
        const pathCategory = pathCategories.find(c => c.id === pathId);
        if (pathCategory) {
          sortedPathCategories.push(pathCategory);
        }
      }
      
      // Add current category at the end
      sortedPathCategories.push(category);
      
      return sortedPathCategories;
    } catch (error) {
      this.logger.error(`Error getting category path: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Bulk update categories
   * 
   * @param operations Array of update operations
   * @returns Operation results
   */
  async bulkUpdateCategories(operations: Array<{ id: string, updates: UpdateCategoryDto }>): Promise<Array<OperationResult<Category>>> {
    try {
      this.logger.log(`Bulk updating ${operations.length} categories`);
      
      // Process operations in parallel for better performance
      const operationPromises = operations.map(async ({ id, updates }) => {
        try {
          const category = await this.updateCategory(id, updates);
          return {
            success: true,
            data: category
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
   * Bulk delete categories
   * 
   * @param organizationId Organization ID
   * @param categoryIds Array of category IDs to delete
   * @returns Operation results
   */
  async bulkDeleteCategories(organizationId: string, categoryIds: string[]): Promise<Array<OperationResult>> {
    try {
      this.logger.log(`Bulk deleting ${categoryIds.length} categories`);
      
      // Process deletions in parallel for better performance
      const deletePromises = categoryIds.map(async (id) => {
        try {
          // Verify the category belongs to the organization and has no children
          const category = await this.getCategoryById(id, organizationId);
          
          if (!category) {
            return {
              success: false,
              error: `Category with ID ${id} not found or does not belong to this organization`,
              errorCode: 'NOT_FOUND'
            };
          }
          
          if (category.childCount && category.childCount > 0) {
            return {
              success: false,
              error: `Category with ID ${id} has children and cannot be deleted`,
              errorCode: 'HAS_CHILDREN'
            };
          }
          
          await this.deleteCategory(id);
          
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

  /**
   * Reorder categories within a parent
   * 
   * @param organizationId Organization ID
   * @param parentId Parent category ID
   * @param categoryOrder Array of category IDs in the desired order
   * @returns Updated categories
   */
  async reorderCategories(
    organizationId: string,
    parentId: string | null,
    categoryOrder: string[]
  ): Promise<Category[]> {
    try {
      this.logger.log(`Reordering categories for parent ${parentId}`);
      
      // Get all children of the parent
      const children = await this.getChildCategories(organizationId, parentId);
      
      // Validate all categories in order are children of the parent
      const childIds = children.map(child => child.id);
      
      for (const id of categoryOrder) {
        if (!childIds.includes(id)) {
          throw new Error(`Category with ID ${id} is not a child of parent ${parentId}`);
        }
      }
      
      // Create update operations for each category
      const updateOperations = categoryOrder.map((id, index) => ({
        id,
        updates: {
          position: index + 1,
          organizationId
        }
      }));
      
      // Update all categories
      const results = await this.bulkUpdateCategories(updateOperations);
      
      // Get updated categories
      const updatedCategories = await this.getChildCategories(organizationId, parentId);
      
      return updatedCategories;
    } catch (error) {
      this.logger.error(`Error reordering categories: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Increment a parent category's child count
   * 
   * @param parentId Parent category ID
   */
  private async incrementParentChildCount(parentId: string): Promise<void> {
    const parent = await this.categoryRepository.findById(parentId);
    
    if (parent) {
      const childCount = (parent.childCount || 0) + 1;
      await this.categoryRepository.update(parentId, { childCount });
    }
  }

  /**
   * Decrement a parent category's child count
   * 
   * @param parentId Parent category ID
   */
  private async decrementParentChildCount(parentId: string): Promise<void> {
    const parent = await this.categoryRepository.findById(parentId);
    
    if (parent && parent.childCount && parent.childCount > 0) {
      const childCount = parent.childCount - 1;
      await this.categoryRepository.update(parentId, { childCount });
    }
  }
}