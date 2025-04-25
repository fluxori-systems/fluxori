import { Test, TestingModule } from '@nestjs/testing';

import { ProductStatus, ProductType } from '../interfaces/types';
import {
  CreateProductVariantDto,
  ProductVariant,
} from '../models/product-variant.model';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { ProductRepository } from '../repositories/product.repository';
import { LoadSheddingResilienceService } from '../services/load-shedding-resilience.service';
import { MarketContextService } from '../services/market-context.service';
import { NetworkAwareStorageService } from '../services/network-aware-storage.service';
import { ProductVariantService } from '../services/product-variant.service';

describe('ProductVariantService', () => {
  let service: ProductVariantService;
  let productVariantRepository: jest.Mocked<ProductVariantRepository>;
  let productRepository: jest.Mocked<ProductRepository>;
  let marketContextService: jest.Mocked<MarketContextService>;
  let networkAwareStorageService: jest.Mocked<NetworkAwareStorageService>;
  let loadSheddingResilienceService: jest.Mocked<LoadSheddingResilienceService>;

  const mockProductVariantRepository = () => ({
    findById: jest.fn(),
    findByParentId: jest.fn(),
    findBySku: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updatePosition: jest.fn(),
    delete: jest.fn(),
    deleteByParentId: jest.fn(),
  });

  const mockProductRepository = () => ({
    findById: jest.fn(),
    update: jest.fn(),
  });

  const mockMarketContextService = () => ({
    getMarketContext: jest.fn(),
  });

  const mockNetworkAwareStorageService = () => ({
    getNetworkQuality: jest.fn(),
    optimizeImageUrl: jest.fn(),
  });

  const mockLoadSheddingResilienceService = () => ({
    executeWithResilience: jest.fn((callback) => callback()),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductVariantService,
        {
          provide: ProductVariantRepository,
          useFactory: mockProductVariantRepository,
        },
        { provide: ProductRepository, useFactory: mockProductRepository },
        { provide: MarketContextService, useFactory: mockMarketContextService },
        {
          provide: NetworkAwareStorageService,
          useFactory: mockNetworkAwareStorageService,
        },
        {
          provide: LoadSheddingResilienceService,
          useFactory: mockLoadSheddingResilienceService,
        },
        {
          provide: 'PIM_MODULE_OPTIONS',
          useValue: {
            enableSouthAfricanOptimizations: true,
            enableLoadSheddingResilience: true,
          },
        },
      ],
    }).compile();

    service = module.get<ProductVariantService>(ProductVariantService);
    productVariantRepository = module.get(
      ProductVariantRepository,
    ) as jest.Mocked<ProductVariantRepository>;
    productRepository = module.get(
      ProductRepository,
    ) as jest.Mocked<ProductRepository>;
    marketContextService = module.get(
      MarketContextService,
    ) as jest.Mocked<MarketContextService>;
    networkAwareStorageService = module.get(
      NetworkAwareStorageService,
    ) as jest.Mocked<NetworkAwareStorageService>;
    loadSheddingResilienceService = module.get(
      LoadSheddingResilienceService,
    ) as jest.Mocked<LoadSheddingResilienceService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a variant successfully', async () => {
      const tenantId = 'tenant-123';
      const dto: CreateProductVariantDto = {
        parentId: 'product-123',
        sku: 'PRODUCT-RED-L',
        name: 'Product - Red - Large',
        attributes: [
          { code: 'color', label: 'Color', type: 'string', value: 'Red' },
          { code: 'size', label: 'Size', type: 'string', value: 'Large' },
        ],
        pricing: {
          basePrice: 100,
          vatIncluded: true,
          currency: 'ZAR',
        },
      };

      const mockParentProduct = {
        id: 'product-123',
        name: 'Product',
        sku: 'PRODUCT',
        status: ProductStatus.ACTIVE,
        type: ProductType.SIMPLE,
        description: 'Test product',
        attributes: [],
        categories: [],
        pricing: {
          basePrice: 100,
          vatIncluded: true,
          currency: 'ZAR',
        },
      };

      const mockCreatedVariant = {
        id: 'variant-123',
        ...dto,
      } as ProductVariant;

      productRepository.findById.mockResolvedValue(mockParentProduct);
      productVariantRepository.create.mockResolvedValue(mockCreatedVariant);
      marketContextService.getMarketContext.mockResolvedValue({
        region: 'south-africa',
        country: 'ZA',
        vatRate: 0.15,
        features: {
          loadSheddingResilience: true,
          networkAwareComponents: true,
        },
        defaultCurrency: 'ZAR',
      });

      const result = await service.create(tenantId, dto);

      expect(productRepository.findById).toHaveBeenCalledWith(
        'product-123',
        tenantId,
      );
      expect(productVariantRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedVariant);
    });
  });

  describe('findByParentId', () => {
    it('should return variants for a parent product', async () => {
      const tenantId = 'tenant-123';
      const parentId = 'product-123';
      const mockVariants = [
        { id: 'variant-1', parentId, name: 'Variant 1' },
        { id: 'variant-2', parentId, name: 'Variant 2' },
      ] as ProductVariant[];

      productVariantRepository.findByParentId.mockResolvedValue(mockVariants);

      const result = await service.findByParentId(parentId, tenantId);

      expect(productVariantRepository.findByParentId).toHaveBeenCalledWith(
        parentId,
        tenantId,
      );
      expect(result).toEqual(mockVariants);
    });
  });

  describe('getVariantGroup', () => {
    it('should return a variant group', async () => {
      const tenantId = 'tenant-123';
      const productId = 'product-123';

      const mockProduct = {
        id: productId,
        attributes: [
          { code: 'color', label: 'Color', usedForVariants: true },
          { code: 'size', label: 'Size', usedForVariants: true },
        ],
      };

      const mockVariants = [
        { id: 'variant-1', parentId: productId, name: 'Variant 1' },
        { id: 'variant-2', parentId: productId, name: 'Variant 2' },
      ] as ProductVariant[];

      productRepository.findById.mockResolvedValue(mockProduct);
      productVariantRepository.findByParentId.mockResolvedValue(mockVariants);

      const result = await service.getVariantGroup(productId, tenantId);

      expect(productRepository.findById).toHaveBeenCalledWith(
        productId,
        tenantId,
      );
      expect(productVariantRepository.findByParentId).toHaveBeenCalledWith(
        productId,
        tenantId,
      );
      expect(result).toEqual({
        productId,
        variantAttributes: ['color', 'size'],
        variants: mockVariants,
        displayMode: 'dropdown',
      });
    });
  });

  describe('generateVariants', () => {
    it('should generate variants based on attributes', async () => {
      const tenantId = 'tenant-123';
      const productId = 'product-123';
      const attributeCodes = ['color', 'size'];

      const mockProduct = {
        id: productId,
        name: 'Test Product',
        sku: 'TEST',
        attributes: [
          {
            code: 'color',
            label: 'Color',
            type: 'string',
            value: 'Black',
            validation: {
              options: ['Black', 'White', 'Red'],
            },
          },
          {
            code: 'size',
            label: 'Size',
            type: 'string',
            value: 'Medium',
            validation: {
              options: ['Small', 'Medium', 'Large'],
            },
          },
        ],
        pricing: {
          basePrice: 100,
          vatIncluded: true,
          currency: 'ZAR',
        },
      };

      productRepository.findById.mockResolvedValue(mockProduct);
      productVariantRepository.create.mockImplementation((dto) =>
        Promise.resolve({
          id: `variant-${Math.random()}`,
          ...dto,
        } as ProductVariant),
      );

      const result = await service.generateVariants(
        productId,
        tenantId,
        attributeCodes,
      );

      expect(productRepository.findById).toHaveBeenCalledWith(
        productId,
        tenantId,
      );
      expect(productVariantRepository.create).toHaveBeenCalledTimes(9); // 3 colors × 3 sizes
      expect(productRepository.update).toHaveBeenCalledWith(
        productId,
        expect.objectContaining({
          attributes: expect.arrayContaining([
            expect.objectContaining({ code: 'color', usedForVariants: true }),
            expect.objectContaining({ code: 'size', usedForVariants: true }),
          ]),
        }),
        tenantId,
      );

      expect(result.success).toBe(true);
      expect(result.data.variants.length).toBe(9);
    });
  });
});
