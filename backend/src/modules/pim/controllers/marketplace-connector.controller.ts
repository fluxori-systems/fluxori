/**
 * Marketplace Connector Controller
 *
 * This controller provides endpoints for managing marketplace integrations
 * specifically for the PIM module, with a focus on the Takealot marketplace.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  ValidationPipe,
  ParseBoolPipe,
  Logger,
} from '@nestjs/common';

import { FirebaseAuthGuard } from '../../../common/guards/firebase-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import {
  ProductMarketplaceMapping,
  CreateProductMarketplaceMappingDto,
  UpdateProductMarketplaceMappingDto,
  MarketplaceSyncResult,
} from '../models/marketplace-mapping.model';
import { Product } from '../models/product.model';
import { ProductMarketplaceMappingRepository } from '../repositories/product-marketplace-mapping.repository';
import { MarketplaceSyncService } from '../services/marketplace-sync.service';
import {
  MarketplaceValidationService,
  MarketplaceValidationResult,
} from '../services/marketplace-validation.service';
import { ProductVariantService } from '../services/product-variant.service';
import { ProductService } from '../services/product.service';

/**
 * DTO for syncing a product to a marketplace
 */
class SyncProductDto {
  /**
   * Product ID to sync
   */
  productId: string;

  /**
   * Optional variant IDs to sync
   */
  variantIds?: string[];

  /**
   * Whether to force synchronization even if recently synced
   */
  force?: boolean;
}

/**
 * DTO for validating a product for a marketplace
 */
class ValidateProductDto {
  /**
   * Product ID to validate
   */
  productId: string;

  /**
   * Whether to include validation for variants
   */
  includeVariants?: boolean;
}

/**
 * Controller for marketplace connectors
 */
@Controller('pim/marketplace')
@UseGuards(FirebaseAuthGuard)
export class MarketplaceConnectorController {
  private readonly logger = new Logger(MarketplaceConnectorController.name);

  constructor(
    private readonly syncService: MarketplaceSyncService,
    private readonly validationService: MarketplaceValidationService,
    private readonly productService: ProductService,
    private readonly variantService: ProductVariantService,
    private readonly mappingRepository: ProductMarketplaceMappingRepository,
  ) {}

  /**
   * Get all marketplace mappings for a product
   *
   * @param productId - Product ID
   * @param user - Authenticated user
   * @returns Marketplace mappings
   */
  @Get('mappings/product/:productId')
  async getMappingsByProduct(
    @Param('productId') productId: string,
    @GetUser() user: any,
  ): Promise<ProductMarketplaceMapping[]> {
    return this.mappingRepository.findByProductId(productId, user.tenantId);
  }

  /**
   * Get all mappings for a specific marketplace
   *
   * @param marketplaceId - Marketplace ID
   * @param page - Page number (0-based)
   * @param pageSize - Items per page
   * @param user - Authenticated user
   * @returns Marketplace mappings
   */
  @Get('mappings/marketplace/:marketplaceId')
  async getMappingsByMarketplace(
    @Param('marketplaceId') marketplaceId: string,
    @Query('page') page = '0',
    @Query('pageSize') pageSize = '20',
    @GetUser() user: any,
  ): Promise<ProductMarketplaceMapping[]> {
    return this.mappingRepository.findByMarketplaceId(
      marketplaceId,
      user.tenantId,
      {
        page: Number(page),
        pageSize: Number(pageSize),
      },
    );
  }

  /**
   * Get a specific mapping by ID
   *
   * @param mappingId - Mapping ID
   * @param user - Authenticated user
   * @returns Marketplace mapping
   */
  @Get('mappings/:mappingId')
  async getMapping(
    @Param('mappingId') mappingId: string,
    @GetUser() user: any,
  ): Promise<ProductMarketplaceMapping> {
    const mapping = await this.mappingRepository.findById(
      mappingId,
      user.tenantId,
    );

    if (!mapping) {
      throw new HttpException('Mapping not found', HttpStatus.NOT_FOUND);
    }

    return mapping;
  }

  /**
   * Create a new marketplace mapping
   *
   * @param dto - Mapping data
   * @param user - Authenticated user
   * @returns Created mapping
   */
  @Post('mappings')
  async createMapping(
    @Body(ValidationPipe) dto: CreateProductMarketplaceMappingDto,
    @GetUser() user: any,
  ): Promise<ProductMarketplaceMapping> {
    // Check if product exists
    const product = await this.productService.findById(
      dto.productId,
      user.tenantId,
    );

    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    // Check if variant exists if variantId is provided
    if (dto.variantId) {
      const variant = await this.variantService.findById(
        dto.variantId,
        user.tenantId,
      );

      if (!variant) {
        throw new HttpException('Variant not found', HttpStatus.NOT_FOUND);
      }

      if (variant.parentId !== dto.productId) {
        throw new HttpException(
          'Variant does not belong to the specified product',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Check if mapping already exists
    const existingMapping =
      await this.mappingRepository.findByProductAndMarketplace(
        dto.productId,
        dto.marketplaceId,
        user.tenantId,
      );

    if (existingMapping) {
      throw new HttpException(
        'Mapping already exists for this product and marketplace',
        HttpStatus.CONFLICT,
      );
    }

    // Set tenant ID
    dto.tenantId = user.tenantId;

    // Create mapping
    return this.mappingRepository.create(dto, user.tenantId);
  }

  /**
   * Update a marketplace mapping
   *
   * @param mappingId - Mapping ID
   * @param dto - Updated mapping data
   * @param user - Authenticated user
   * @returns Updated mapping
   */
  @Put('mappings/:mappingId')
  async updateMapping(
    @Param('mappingId') mappingId: string,
    @Body(ValidationPipe) dto: UpdateProductMarketplaceMappingDto,
    @GetUser() user: any,
  ): Promise<ProductMarketplaceMapping> {
    const mapping = await this.mappingRepository.findById(
      mappingId,
      user.tenantId,
    );

    if (!mapping) {
      throw new HttpException('Mapping not found', HttpStatus.NOT_FOUND);
    }

    // Prevent changing productId and marketplaceId
    if (dto.productId && dto.productId !== mapping.productId) {
      throw new HttpException(
        'Cannot change productId',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.marketplaceId && dto.marketplaceId !== mapping.marketplaceId) {
      throw new HttpException(
        'Cannot change marketplaceId',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Update mapping
    return this.mappingRepository.update(mappingId, dto, user.tenantId);
  }

  /**
   * Delete a marketplace mapping
   *
   * @param mappingId - Mapping ID
   * @param user - Authenticated user
   * @returns Deleted mapping ID
   */
  @Delete('mappings/:mappingId')
  async deleteMapping(
    @Param('mappingId') mappingId: string,
    @GetUser() user: any,
  ): Promise<{ id: string }> {
    const mapping = await this.mappingRepository.findById(
      mappingId,
      user.tenantId,
    );

    if (!mapping) {
      throw new HttpException('Mapping not found', HttpStatus.NOT_FOUND);
    }

    await this.mappingRepository.delete(mappingId, user.tenantId);

    return { id: mappingId };
  }

  /**
   * Sync a product to a marketplace
   *
   * @param marketplaceId - Marketplace ID
   * @param dto - Sync data
   * @param user - Authenticated user
   * @returns Sync result
   */
  @Post('sync/:marketplaceId')
  async syncProduct(
    @Param('marketplaceId') marketplaceId: string,
    @Body(ValidationPipe) dto: SyncProductDto,
    @GetUser() user: any,
  ): Promise<MarketplaceSyncResult> {
    // Validate marketplace
    const supportedMarketplaces = ['takealot', 'bob-shop', 'makro'];
    if (!supportedMarketplaces.includes(marketplaceId)) {
      throw new HttpException(
        `Marketplace ${marketplaceId} is not supported yet`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if product exists
    const product = await this.productService.findById(
      dto.productId,
      user.tenantId,
    );

    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    // Perform sync
    return this.syncService.syncProductToMarketplace(
      dto.productId,
      marketplaceId,
      user.tenantId,
    );
  }

  /**
   * Validate a product for a marketplace
   *
   * @param marketplaceId - Marketplace ID
   * @param dto - Validation data
   * @param user - Authenticated user
   * @returns Validation result
   */
  @Post('validate/:marketplaceId')
  async validateProduct(
    @Param('marketplaceId') marketplaceId: string,
    @Body(ValidationPipe) dto: ValidateProductDto,
    @GetUser() user: any,
  ): Promise<MarketplaceValidationResult> {
    // Check if product exists
    const product = await this.productService.findById(
      dto.productId,
      user.tenantId,
    );

    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    let variants;

    // Get variants if requested
    if (dto.includeVariants) {
      variants = await this.variantService.findByParentId(
        dto.productId,
        user.tenantId,
      );
    }

    // Validate product for specified marketplace
    return this.validationService.validateProduct(
      product as Product,
      marketplaceId,
      variants,
    );
  }

  /**
   * Get products that need to be synced to a marketplace
   *
   * @param marketplaceId - Marketplace ID
   * @param thresholdHours - Hours threshold for considering a product as needing sync
   * @param limit - Maximum number of products to return
   * @param user - Authenticated user
   * @returns List of product IDs
   */
  @Get('needs-sync/:marketplaceId')
  async getProductsNeedingSync(
    @Param('marketplaceId') marketplaceId: string,
    @Query('thresholdHours') thresholdHours = '24',
    @Query('limit') limit = '100',
    @GetUser() user: any,
  ): Promise<string[]> {
    return this.syncService.findProductsNeedingSync(
      Number(thresholdHours),
      marketplaceId,
      user.tenantId,
      Number(limit),
    );
  }

  /**
   * Sync stock level for a product to all connected marketplaces
   *
   * @param productId - Product ID
   * @param stockLevel - New stock level
   * @param user - Authenticated user
   * @returns Sync results
   */
  @Post('sync-stock/:productId')
  async syncStock(
    @Param('productId') productId: string,
    @Body() { stockLevel }: { stockLevel: number },
    @GetUser() user: any,
  ): Promise<MarketplaceSyncResult[]> {
    // Check if product exists
    const product = await this.productService.findById(
      productId,
      user.tenantId,
    );

    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    return this.syncService.syncStockToAllMarketplaces(
      productId,
      stockLevel,
      user.tenantId,
    );
  }

  /**
   * Sync price for a product to all connected marketplaces
   *
   * @param productId - Product ID
   * @param price - New price
   * @param user - Authenticated user
   * @returns Sync results
   */
  @Post('sync-price/:productId')
  async syncPrice(
    @Param('productId') productId: string,
    @Body() { price }: { price: number },
    @GetUser() user: any,
  ): Promise<MarketplaceSyncResult[]> {
    // Check if product exists
    const product = await this.productService.findById(
      productId,
      user.tenantId,
    );

    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    return this.syncService.syncPriceToAllMarketplaces(
      productId,
      price,
      user.tenantId,
    );
  }

  /**
   * Get marketplace stats for a tenant
   *
   * @param marketplaceId - Optional marketplace ID to filter by
   * @param user - Authenticated user
   * @returns Marketplace stats
   */
  @Get('stats')
  async getMarketplaceStats(
    @Query('marketplaceId') marketplaceId: string,
    @GetUser() user: any,
  ): Promise<{
    totalMappings: number;
    activeCount: number;
    inactiveCount: number;
    pendingCount: number;
    errorCount: number;
    marketplaces: string[];
  }> {
    // Get all mappings
    let mappings: ProductMarketplaceMapping[];

    if (marketplaceId) {
      mappings = await this.mappingRepository.findByMarketplaceId(
        marketplaceId,
        user.tenantId,
        { pageSize: 1000 }, // Fetch a larger set for stats
      );
    } else {
      // This is simplified - in a real application, you would use aggregation queries
      // Here we're just fetching all mappings which isn't efficient for large datasets
      mappings = await this.mappingRepository.find({ tenantId: user.tenantId });
    }

    // Count mappings by status
    const activeCount = mappings.filter((m) => m.status === 'active').length;
    const inactiveCount = mappings.filter(
      (m) => m.status === 'inactive',
    ).length;
    const pendingCount = mappings.filter((m) => m.status === 'pending').length;
    const errorCount = mappings.filter((m) => m.status === 'error').length;

    // Get unique marketplace IDs
    const marketplaces = [...new Set(mappings.map((m) => m.marketplaceId))];

    return {
      totalMappings: mappings.length,
      activeCount,
      inactiveCount,
      pendingCount,
      errorCount,
      marketplaces,
    };
  }
}
