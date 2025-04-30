import { Test, TestingModule } from '@nestjs/testing';

import { FirestoreConfigService } from '../../../config/firestore.config';
import {
  Category,
  CategoryStatus,
  CategoryNode,
} from '../models/category.model';
import { CategoryRepository } from '../repositories/category.repository';
import { CategoryService } from '../services/category.service';

// Type-safe mocks
type MockType<T> = {
  [P in keyof T]?: jest.Mock<unknown>;
};

jest.mock('../../../config/firestore.config');
jest.mock('../repositories/category.repository');

describe('CategoryService', () => {
  let service: CategoryService;
  let categoryRepository: CategoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryService, CategoryRepository, FirestoreConfigService],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    categoryRepository = module.get<CategoryRepository>(CategoryRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCategory', () => {
    it('should create a root category', async () => {
      // Mock data
      const createCategoryDto = {
        organizationId: 'org-123',
        name: 'Test Category',
        description: 'This is a test category',
        status: CategoryStatus.ACTIVE,
        parentId: null,
        position: 1,
        includeInMenu: true,
      };

      const category: Category = {
        id: 'cat-123',
        ...createCategoryDto,
        level: 0,
        path: [],
        childCount: 0,
        productCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        version: 1,
      };

      // Mock repository methods
      jest.spyOn(categoryRepository, 'create').mockResolvedValue(category);

      jest
        .spyOn(categoryRepository, 'findChildCategories')
        .mockResolvedValue([]);

      // Execute
      const result = await service.createCategory(createCategoryDto);

      // Assert
      expect(result).toEqual(category);
      expect(categoryRepository.create).toHaveBeenCalledWith({
        ...createCategoryDto,
        level: 0,
        path: [],
        childCount: 0,
        productCount: 0,
      });
    });

    it('should create a child category', async () => {
      // Mock data
      const parentCategory: Category = {
        id: 'parent-123',
        organizationId: 'org-123',
        name: 'Parent Category',
        description: 'This is a parent category',
        status: CategoryStatus.ACTIVE,
        parentId: null,
        level: 0,
        path: [],
        position: 1,
        includeInMenu: true,
        childCount: 0,
        productCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        version: 1,
      };

      const createCategoryDto = {
        organizationId: 'org-123',
        name: 'Child Category',
        description: 'This is a child category',
        status: CategoryStatus.ACTIVE,
        parentId: 'parent-123',
        position: 1,
        includeInMenu: true,
      };

      const category: Category = {
        id: 'cat-123',
        ...createCategoryDto,
        level: 1,
        path: ['parent-123'],
        childCount: 0,
        productCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        version: 1,
      };

      // Mock repository methods
      jest
        .spyOn(categoryRepository, 'findById')
        .mockResolvedValue(parentCategory);

      jest.spyOn(categoryRepository, 'create').mockResolvedValue(category);

      jest.spyOn(categoryRepository, 'update').mockResolvedValue({
        ...parentCategory,
        childCount: 1,
      });

      jest
        .spyOn(categoryRepository, 'findChildCategories')
        .mockResolvedValue([]);

      // Execute
      const result = await service.createCategory(createCategoryDto);

      // Assert
      expect(result).toEqual(category);
      expect(categoryRepository.findById).toHaveBeenCalledWith('parent-123');
      expect(categoryRepository.create).toHaveBeenCalledWith({
        ...createCategoryDto,
        level: 1,
        path: ['parent-123'],
        childCount: 0,
        productCount: 0,
      });
      expect(categoryRepository.update).toHaveBeenCalledWith('parent-123', {
        childCount: 1,
      });
    });
  });

  describe('getCategoryById', () => {
    it('should return a category when it exists and belongs to the organization', async () => {
      // Mock data
      const category: Category = {
        id: 'cat-123',
        organizationId: 'org-123',
        name: 'Test Category',
        description: 'This is a test category',
        status: CategoryStatus.ACTIVE,
        parentId: null,
        level: 0,
        path: [],
        position: 1,
        includeInMenu: true,
        childCount: 0,
        productCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        version: 1,
      };

      // Mock repository method
      jest.spyOn(categoryRepository, 'findById').mockResolvedValue(category);

      // Execute
      const result = await service.getCategoryById('cat-123', 'org-123');

      // Assert
      expect(result).toEqual(category);
      expect(categoryRepository.findById).toHaveBeenCalledWith('cat-123');
    });

    it('should return null when category does not exist', async () => {
      // Mock repository method
      jest.spyOn(categoryRepository, 'findById').mockResolvedValue(null);

      // Execute
      const result = await service.getCategoryById('cat-123', 'org-123');

      // Assert
      expect(result).toBeNull();
      expect(categoryRepository.findById).toHaveBeenCalledWith('cat-123');
    });

    it('should return null when category exists but belongs to a different organization', async () => {
      // Mock data
      const category: Category = {
        id: 'cat-123',
        organizationId: 'other-org',
        name: 'Test Category',
        description: 'This is a test category',
        status: CategoryStatus.ACTIVE,
        parentId: null,
        level: 0,
        path: [],
        position: 1,
        includeInMenu: true,
        childCount: 0,
        productCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        version: 1,
      };

      // Mock repository method
      jest.spyOn(categoryRepository, 'findById').mockResolvedValue(category);

      // Execute
      const result = await service.getCategoryById('cat-123', 'org-123');

      // Assert
      expect(result).toBeNull();
      expect(categoryRepository.findById).toHaveBeenCalledWith('cat-123');
    });
  });

  describe('getCategoryTree', () => {
    it('should return the category tree', async () => {
      // Mock data
      const categoryTree: CategoryNode[] = [
        {
          id: 'cat-1',
          organizationId: 'org-123',
          name: 'Category 1',
          description: 'This is category 1',
          status: CategoryStatus.ACTIVE,
          parentId: null,
          level: 0,
          path: [],
          position: 1,
          includeInMenu: true,
          childCount: 2,
          productCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          children: [
            {
              id: 'cat-1-1',
              organizationId: 'org-123',
              name: 'Category 1.1',
              description: 'This is category 1.1',
              status: CategoryStatus.ACTIVE,
              parentId: 'cat-1',
              level: 1,
              path: ['cat-1'],
              position: 1,
              includeInMenu: true,
              childCount: 0,
              productCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              children: [],
              isDeleted: false,
              version: 1,
            },
            {
              id: 'cat-1-2',
              organizationId: 'org-123',
              name: 'Category 1.2',
              description: 'This is category 1.2',
              status: CategoryStatus.ACTIVE,
              parentId: 'cat-1',
              level: 1,
              path: ['cat-1'],
              position: 2,
              includeInMenu: true,
              childCount: 0,
              productCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              children: [],
              isDeleted: false,
              version: 1,
            },
          ],
          isDeleted: false,
          version: 1,
        },

        {
          id: 'cat-2',
          organizationId: 'org-123',
          name: 'Category 2',
          description: 'This is category 2',
          status: CategoryStatus.ACTIVE,
          parentId: null,
          level: 0,
          path: [],
          position: 2,
          includeInMenu: true,
          childCount: 0,
          productCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          children: [],
          isDeleted: false,
          version: 1,
        },
      ];

      // Mock repository method
      jest
        .spyOn(categoryRepository, 'getCategoryTree')
        .mockResolvedValue(categoryTree);

      // Execute
      const result = await service.getCategoryTree('org-123', false, 10);

      // Assert
      expect(result).toEqual(categoryTree);
      expect(categoryRepository.getCategoryTree).toHaveBeenCalledWith(
        'org-123',
        false,
        10,
      );
    });
  });
});
