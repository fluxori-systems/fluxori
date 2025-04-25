import { Test, TestingModule } from '@nestjs/testing';

import { FirestoreConfigService } from '../../../config/firestore.config';
import { ProductAttribute } from '../interfaces/types';
import {
  AttributeTemplate,
  AttributeScope,
} from '../models/attribute-template.model';
import { AttributeTemplateRepository } from '../repositories/attribute-template.repository';
import { AttributeTemplateService } from '../services/attribute-template.service';

// Type-safe mocks
type MockType<T> = {
  [P in keyof T]?: jest.Mock<unknown>;
};

jest.mock('../../../config/firestore.config');
jest.mock('../repositories/attribute-template.repository');

describe('AttributeTemplateService', () => {
  let service: AttributeTemplateService;
  let attributeTemplateRepository: AttributeTemplateRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttributeTemplateService,
        AttributeTemplateRepository,
        FirestoreConfigService,
      ],
    }).compile();

    service = module.get<AttributeTemplateService>(AttributeTemplateService);
    attributeTemplateRepository = module.get<AttributeTemplateRepository>(
      AttributeTemplateRepository,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAttributeTemplate', () => {
    it('should create a global attribute template', async () => {
      // Mock data
      const attributes: ProductAttribute[] = [
        {
          code: 'color',
          label: 'Color',
          type: 'select',
          value: null,
          required: true,
          visible: true,
          filterable: true,
          validation: {
            options: ['Red', 'Green', 'Blue', 'Black', 'White'],
          },
        },
        {
          code: 'size',
          label: 'Size',
          type: 'select',
          value: null,
          required: true,
          visible: true,
          filterable: true,
          validation: {
            options: ['S', 'M', 'L', 'XL', 'XXL'],
          },
        },
      ];

      const createTemplateDto = {
        organizationId: 'org-123',
        name: 'Clothing Attributes',
        description: 'Common attributes for clothing products',
        attributes,
        scope: AttributeScope.GLOBAL,
        isActive: true,
        applyToAllProducts: false,
        categoryIds: ['cat-123', 'cat-456'],
      };

      const template: AttributeTemplate = {
        id: 'template-123',
        ...createTemplateDto,
        position: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock repository methods
      jest
        .spyOn(attributeTemplateRepository, 'findByOrganization')
        .mockResolvedValue([]);

      jest
        .spyOn(attributeTemplateRepository, 'create')
        .mockResolvedValue(template);

      // Execute
      const result = await service.createAttributeTemplate(createTemplateDto);

      // Assert
      expect(result).toEqual(template);
      expect(attributeTemplateRepository.create).toHaveBeenCalledWith({
        ...createTemplateDto,
        position: 1,
      });
    });

    it('should validate regional templates have a region specified', async () => {
      // Mock data
      const createTemplateDto = {
        organizationId: 'org-123',
        name: 'South African Attributes',
        description: 'Attributes for South African market',
        attributes: [],
        scope: AttributeScope.REGIONAL,
        isActive: true,
        applyToAllProducts: false,
        // Missing region field
      };

      // Mock repository method
      jest
        .spyOn(attributeTemplateRepository, 'findByOrganization')
        .mockResolvedValue([]);

      // Execute and assert
      await expect(
        service.createAttributeTemplate(createTemplateDto),
      ).rejects.toThrow(
        'Region must be provided for regional attribute templates',
      );
    });
  });

  describe('getAttributeTemplatesByCategory', () => {
    it('should return attribute templates for a category', async () => {
      // Mock data
      const templates: AttributeTemplate[] = [
        {
          id: 'template-123',
          organizationId: 'org-123',
          name: 'Clothing Attributes',
          description: 'Common attributes for clothing products',
          attributes: [],
          scope: AttributeScope.GLOBAL,
          isActive: true,
          applyToAllProducts: false,
          categoryIds: ['cat-123', 'cat-456'],
          position: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock repository method
      jest
        .spyOn(attributeTemplateRepository, 'findByCategory')
        .mockResolvedValue(templates);

      // Execute
      const result = await service.getAttributeTemplatesByCategory(
        'org-123',
        'cat-123',
      );

      // Assert
      expect(result).toEqual(templates);
      expect(attributeTemplateRepository.findByCategory).toHaveBeenCalledWith(
        'org-123',
        'cat-123',
      );
    });
  });

  describe('getAttributeTemplateById', () => {
    it('should return a template when it exists and belongs to the organization', async () => {
      // Mock data
      const template: AttributeTemplate = {
        id: 'template-123',
        organizationId: 'org-123',
        name: 'Clothing Attributes',
        description: 'Common attributes for clothing products',
        attributes: [],
        scope: AttributeScope.GLOBAL,
        isActive: true,
        applyToAllProducts: false,
        categoryIds: ['cat-123', 'cat-456'],
        position: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock repository method
      jest
        .spyOn(attributeTemplateRepository, 'findById')
        .mockResolvedValue(template);

      // Execute
      const result = await service.getAttributeTemplateById(
        'template-123',
        'org-123',
      );

      // Assert
      expect(result).toEqual(template);
      expect(attributeTemplateRepository.findById).toHaveBeenCalledWith(
        'template-123',
      );
    });

    it('should return null when template belongs to a different organization', async () => {
      // Mock data
      const template: AttributeTemplate = {
        id: 'template-123',
        organizationId: 'other-org',
        name: 'Clothing Attributes',
        description: 'Common attributes for clothing products',
        attributes: [],
        scope: AttributeScope.GLOBAL,
        isActive: true,
        applyToAllProducts: false,
        categoryIds: ['cat-123', 'cat-456'],
        position: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock repository method
      jest
        .spyOn(attributeTemplateRepository, 'findById')
        .mockResolvedValue(template);

      // Execute
      const result = await service.getAttributeTemplateById(
        'template-123',
        'org-123',
      );

      // Assert
      expect(result).toBeNull();
      expect(attributeTemplateRepository.findById).toHaveBeenCalledWith(
        'template-123',
      );
    });
  });

  describe('getApplicableAttributeTemplates', () => {
    it('should return applicable attribute templates for a product', async () => {
      // Mock data
      const globalTemplates: AttributeTemplate[] = [
        {
          id: 'global-template',
          organizationId: 'org-123',
          name: 'Global Attributes',
          description: 'Global attributes for all products',
          attributes: [],
          scope: AttributeScope.GLOBAL,
          isActive: true,
          applyToAllProducts: true,
          position: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const categoryTemplates: AttributeTemplate[] = [
        {
          id: 'category-template',
          organizationId: 'org-123',
          name: 'Category Attributes',
          description: 'Attributes for specific categories',
          attributes: [],
          scope: AttributeScope.GLOBAL,
          isActive: true,
          applyToAllProducts: false,
          categoryIds: ['cat-123'],
          position: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const regionalTemplates: AttributeTemplate[] = [
        {
          id: 'regional-template',
          organizationId: 'org-123',
          name: 'South African Attributes',
          description: 'Attributes for South African market',
          attributes: [],
          scope: AttributeScope.REGIONAL,
          region: 'south-africa',
          isActive: true,
          applyToAllProducts: false,
          position: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const marketplaceTemplates: AttributeTemplate[] = [
        {
          id: 'marketplace-template',
          organizationId: 'org-123',
          name: 'Takealot Attributes',
          description: 'Attributes for Takealot marketplace',
          attributes: [],
          scope: AttributeScope.MARKETPLACE,
          marketplaceId: 'takealot',
          isActive: true,
          applyToAllProducts: false,
          position: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock repository methods
      jest
        .spyOn(attributeTemplateRepository, 'findGlobalApplicable')
        .mockResolvedValue(globalTemplates);

      jest
        .spyOn(attributeTemplateRepository, 'findByCategory')
        .mockResolvedValueOnce(categoryTemplates);

      jest
        .spyOn(attributeTemplateRepository, 'findByRegion')
        .mockResolvedValue(regionalTemplates);

      jest
        .spyOn(attributeTemplateRepository, 'findByMarketplace')
        .mockResolvedValue(marketplaceTemplates);

      // Execute
      const result = await service.getApplicableAttributeTemplates(
        'org-123',
        ['cat-123'],
        'south-africa',
        ['takealot'],
      );

      // Assert
      expect(result).toHaveLength(4);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'global-template' }),
          expect.objectContaining({ id: 'category-template' }),
          expect.objectContaining({ id: 'regional-template' }),
          expect.objectContaining({ id: 'marketplace-template' }),
        ]),
      );
      expect(
        attributeTemplateRepository.findGlobalApplicable,
      ).toHaveBeenCalledWith('org-123');
      expect(attributeTemplateRepository.findByCategory).toHaveBeenCalledWith(
        'org-123',
        'cat-123',
      );
      expect(attributeTemplateRepository.findByRegion).toHaveBeenCalledWith(
        'org-123',
        'south-africa',
      );
      expect(
        attributeTemplateRepository.findByMarketplace,
      ).toHaveBeenCalledWith('org-123', 'takealot');
    });
  });
});
