import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { User } from '../../../types/google-cloud.types';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { CategoryFilter } from '../interfaces/category-filter.interface';
import { OperationResult } from '../interfaces/types';
import {
  Category,
  CategoryNode,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../models/category.model';
import { CategoryService } from '../services/category.service';

/**
 * Category Controller
 *
 * Controller for managing product categories in the PIM module
 */
@Controller('pim/categories')
@UseGuards(FirebaseAuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Get a category by ID
   *
   * @param id Category ID
   * @param user Authenticated user
   * @returns Category
   */
  @Get(':id')
  async getCategoryById(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<Category> {
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new HttpException(
        'Missing organizationId for user',
        HttpStatus.BAD_REQUEST,
      );
    }
    const category = await this.categoryService.getCategoryById(
      id,
      organizationId,
    );

    if (!category) {
      throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    }

    return category;
  }

  /**
   * Find categories by filter criteria
   *
   * @param filter Category filter criteria
   * @param user Authenticated user
   * @returns Filtered categories
   */
  @Get()
  async findCategories(
    @Query() filterParams: any,
    @GetUser() user: User,
  ): Promise<{
    items: Category[];
    total: number;
    page: number;
    limit: number;
  }> {
    const organizationId = user.organizationId;

    // Parse and validate filter parameters
    const filter: CategoryFilter = {
      organizationId,
      ...filterParams,
    };

    // Parse numeric values
    if (filterParams.page) filter.page = parseInt(filterParams.page);
    if (filterParams.limit) filter.limit = parseInt(filterParams.limit);
    if (filterParams.maxDepth)
      filter.maxDepth = parseInt(filterParams.maxDepth);

    // Parse arrays
    if (
      filterParams.marketplaceIds &&
      typeof filterParams.marketplaceIds === 'string'
    ) {
      filter.marketplaceIds = filterParams.marketplaceIds.split(',');
    }

    // Parse booleans
    if (filterParams.includeChildren !== undefined) {
      filter.includeChildren = filterParams.includeChildren === 'true';
    }

    if (filterParams.hasTakealotMapping !== undefined) {
      filter.hasTakealotMapping = filterParams.hasTakealotMapping === 'true';
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

    return await this.categoryService.findCategories(filter);
  }

  /**
   * Create a new category
   *
   * @param createCategoryDto Category creation DTO
   * @param user Authenticated user
   * @returns Created category
   */
  @Post()
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @GetUser() user: User,
  ): Promise<Category> {
    // Ensure organizationId is set
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new HttpException('Missing organizationId for user', HttpStatus.BAD_REQUEST);
    }
    createCategoryDto.organizationId = organizationId;

    return await this.categoryService.createCategory(createCategoryDto);
  }

  /**
   * Update an existing category
   *
   * @param id Category ID
   * @param updateCategoryDto Category update DTO
   * @param user Authenticated user
   * @returns Updated category
   */
  @Put(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @GetUser() user: User,
  ): Promise<Category> {
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new HttpException(
        'Missing organizationId for user',
        HttpStatus.BAD_REQUEST,
      );
    }
    // Ensure user can only update their organization's categories
    updateCategoryDto.organizationId = organizationId;

    const category = await this.categoryService.getCategoryById(
      id,
      organizationId,
    );
    if (!category) {
      throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    }

    return await this.categoryService.updateCategory(id, updateCategoryDto);
  }

  /**
   * Delete a category
   *
   * @param id Category ID
   * @param user Authenticated user
   */
  @Delete(':id')
  async deleteCategory(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new HttpException(
        'Missing organizationId for user',
        HttpStatus.BAD_REQUEST,
      );
    }
    const category = await this.categoryService.getCategoryById(
      id,
      organizationId,
    );
    if (!category) {
      throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    }

    await this.categoryService.deleteCategory(id);
  }

  /**
   * Get category tree
   *
   * @param rootOnly Whether to only return root categories (no children)
   * @param maxDepth Maximum depth of children to include
   * @param user Authenticated user
   * @returns Category tree
   */
  @Get('tree')
  async getCategoryTree(
    @Query('rootOnly') rootOnly: boolean = false,
    @Query('maxDepth') maxDepth: number = 10,
    @GetUser() user: User,
  ): Promise<CategoryNode[]> {
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new HttpException(
        'Missing organizationId for user',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.categoryService.getCategoryTree(
      organizationId,
      rootOnly,
      maxDepth,
    );
  }

  /**
   * Get root categories
   *
   * @param user Authenticated user
   * @returns Root categories
   */
  @Get('roots')
  async getRootCategories(@GetUser() user: User): Promise<Category[]> {
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new HttpException(
        'Missing organizationId for user',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.categoryService.getRootCategories(organizationId);
  }

  /**
   * Get child categories for a parent category
   *
   * @param parentId Parent category ID
   * @param user Authenticated user
   * @returns Child categories
   */
  @Get('children/:parentId')
  async getChildCategories(
    @Param('parentId') parentId: string,
    @GetUser() user: User,
  ): Promise<Category[]> {
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new HttpException(
        'Missing organizationId for user',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.categoryService.getChildCategories(
      organizationId,
      parentId,
    );
  }

  /**
   * Get categories by marketplace
   *
   * @param marketplaceId Marketplace ID
   * @param user Authenticated user
   * @returns Categories with mappings to the marketplace
   */
  @Get('by-marketplace/:marketplaceId')
  async getCategoriesByMarketplace(
    @Param('marketplaceId') marketplaceId: string,
    @GetUser() user: User,
  ): Promise<Category[]> {
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new HttpException(
        'Missing organizationId for user',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.categoryService.getCategoriesByMarketplace(
      organizationId,
      marketplaceId,
    );
  }

  /**
   * Get category path (for breadcrumbs)
   *
   * @param id Category ID
   * @param user Authenticated user
   * @returns Categories in the path
   */
  @Get(':id/path')
  async getCategoryPath(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<Category[]> {
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new HttpException(
        'Missing organizationId for user',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.categoryService.getCategoryPath(organizationId, id);
  }

  /**
   * Bulk update categories
   *
   * @param operations Array of update operations
   * @param user Authenticated user
   * @returns Operation results
   */
  @Post('bulk-update')
  async bulkUpdateCategories(
    @Body() operations: Array<{ id: string; updates: UpdateCategoryDto }>,
    @GetUser() user: User,
  ): Promise<Array<OperationResult<Category>>> {
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new HttpException(
        'Missing organizationId for user',
        HttpStatus.BAD_REQUEST,
      );
    }
    // Enforce organization ID for security
    operations = operations.map((op) => ({
      ...op,
      updates: {
        ...op.updates,
        organizationId,
      },
    }));

    return await this.categoryService.bulkUpdateCategories(operations);
  }

  /**
   * Bulk delete categories
   *
   * @param categoryIds Array of category IDs to delete
   * @param user Authenticated user
   * @returns Operation results
   */
  @Post('bulk-delete')
  async bulkDeleteCategories(
    @Body() body: { categoryIds: string[] },
    @GetUser() user: User,
  ): Promise<Array<OperationResult>> {
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new HttpException(
        'Missing organizationId for user',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.categoryService.bulkDeleteCategories(
      organizationId,
      body.categoryIds,
    );
  }

  /**
   * Reorder categories within a parent
   *
   * @param parentId Parent category ID
   * @param categoryOrder Array of category IDs in the desired order
   * @param user Authenticated user
   * @returns Updated categories
   */
  @Post('reorder')
  async reorderCategories(
    @Body() body: { parentId: string | null; categoryOrder: string[] },
    @GetUser() user: User,
  ): Promise<Category[]> {
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new HttpException(
        'Missing organizationId for user',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.categoryService.reorderCategories(
      organizationId,
      body.parentId,
      body.categoryOrder,
    );
  }
}
