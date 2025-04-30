import { Test, TestingModule } from '@nestjs/testing';

import { FirestoreConfigService } from '../../../config/firestore.config';
import { ProductType } from '../interfaces/types';
import { Product, ProductStatus } from '../models/product.model';
import { ProductRepository } from '../repositories/product.repository';
import { ProductService } from '../services/product.service';

// Type-safe mocks
type MockType<T> = {
  [P in keyof T]?: jest.Mock<unknown>;
};

jest.mock('../../../config/firestore.config');
jest.mock('../repositories/product.repository');

describe('ProductService', () => {
  let service: ProductService;
  let productRepository: ProductRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductService, ProductRepository, FirestoreConfigService],
    }).compile();

    service = module.get<ProductService>(ProductService);
    productRepository = module.get<ProductRepository>(ProductRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProduct', () => {
    it('should create a product', async () => {
      // Mock data
      const createProductDto = {
        organizationId: 'org-123',
        sku: 'TEST-PROD-001',
        name: 'Test Product',
        description: 'This is a test product',
        status: ProductStatus.DRAFT,
        type: ProductType.SIMPLE,
        categories: [],
        pricing: {
          basePrice: 100,
          vatIncluded: true,
          currency: 'ZAR',
        },
        attributes: [],
      };

      const product: Product = {
        id: 'prod-123',
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        version: 1,
      };

      // Mock repository method
      jest.spyOn(productRepository, 'create').mockResolvedValue(product);

      // Execute
      const result = await service.createProduct(createProductDto);

      // Assert
      expect(result).toEqual(product);
      expect(productRepository.create).toHaveBeenCalledWith(createProductDto);
    });
  });

  describe('getProductById', () => {
    it('should return a product when it exists and belongs to the organization', async () => {
      // Mock data
      const product: Product = {
        id: 'prod-123',
        organizationId: 'org-123',
        sku: 'TEST-PROD-001',
        name: 'Test Product',
        description: 'This is a test product',
        status: ProductStatus.ACTIVE,
        type: ProductType.SIMPLE,
        categories: [],
        pricing: {
          basePrice: 100,
          vatIncluded: true,
          currency: 'ZAR',
        },
        attributes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        version: 1,
      };

      // Mock repository method
      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);

      // Execute
      const result = await service.getProductById('prod-123', 'org-123');

      // Assert
      expect(result).toEqual(product);
      expect(productRepository.findById).toHaveBeenCalledWith('prod-123');
    });

    it('should return null when product does not exist', async () => {
      // Mock repository method
      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);

      // Execute
      const result = await service.getProductById('prod-123', 'org-123');

      // Assert
      expect(result).toBeNull();
      expect(productRepository.findById).toHaveBeenCalledWith('prod-123');
    });

    it('should return null when product exists but belongs to a different organization', async () => {
      // Mock data
      const product: Product = {
        id: 'prod-123',
        organizationId: 'other-org',
        sku: 'TEST-PROD-001',
        name: 'Test Product',
        description: 'This is a test product',
        status: ProductStatus.ACTIVE,
        type: ProductType.SIMPLE,
        categories: [],
        pricing: {
          basePrice: 100,
          vatIncluded: true,
          currency: 'ZAR',
        },
        attributes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        version: 1,
      };

      // Mock repository method
      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);

      // Execute
      const result = await service.getProductById('prod-123', 'org-123');

      // Assert
      expect(result).toBeNull();
      expect(productRepository.findById).toHaveBeenCalledWith('prod-123');
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      // Mock data
      const updateProductDto = {
        name: 'Updated Product',
        description: 'This is an updated test product',
      };

      const updatedProduct: Product = {
        id: 'prod-123',
        organizationId: 'org-123',
        sku: 'TEST-PROD-001',
        name: 'Updated Product',
        description: 'This is an updated test product',
        status: ProductStatus.ACTIVE,
        type: ProductType.SIMPLE,
        categories: [],
        pricing: {
          basePrice: 100,
          vatIncluded: true,
          currency: 'ZAR',
        },
        attributes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        version: 1,
      };

      // Mock repository method
      jest.spyOn(productRepository, 'update').mockResolvedValue(updatedProduct);

      // Execute
      const result = await service.updateProduct('prod-123', updateProductDto);

      // Assert
      expect(result).toEqual(updatedProduct);
      expect(productRepository.update).toHaveBeenCalledWith(
        'prod-123',
        updateProductDto,
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      // Mock repository method
      jest.spyOn(productRepository, 'delete').mockResolvedValue(undefined);

      // Execute
      await service.deleteProduct('prod-123');

      // Assert
      expect(productRepository.delete).toHaveBeenCalledWith('prod-123');
    });
  });
});
