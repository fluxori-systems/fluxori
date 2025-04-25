import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';

import { LoadSheddingResilienceService } from './load-shedding-resilience.service';
import { MarketContextService } from './market-context.service';
import { NetworkAwareStorageService } from './network-aware-storage.service';
import { OperationResult, NetworkQualityInfo } from '../interfaces/types';
import {
  ProductVariant,
  VariantGroup,
  CreateProductVariantDto,
  UpdateProductVariantDto,
} from '../models/product-variant.model';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { ProductRepository } from '../repositories/product.repository';

/**
 * Service for managing product variants
 */
@Injectable()
export class ProductVariantService {
  private readonly logger = new Logger(ProductVariantService.name);

  constructor(
    private readonly productVariantRepository: ProductVariantRepository,
    private readonly productRepository: ProductRepository,
    private readonly marketContextService: MarketContextService,
    private readonly networkAwareStorageService: NetworkAwareStorageService,
    private readonly loadSheddingResilienceService: LoadSheddingResilienceService,
    @Inject('PIM_MODULE_OPTIONS') private readonly options: any,
  ) {}

  /**
   * Create a new product variant
   *
   * @param tenantId - Tenant ID for multi-tenancy
   * @param dto - Create variant data
   * @returns The created variant
   */
  async create(
    tenantId: string,
    dto: CreateProductVariantDto,
  ): Promise<ProductVariant> {
    const parent = await this.productRepository.findById(
      dto.parentId,
      tenantId,
    );

    if (!parent) {
      throw new NotFoundException(
        `Parent product with ID ${dto.parentId} not found`,
      );
    }

    // Handle South African regional specifics
    if (this.options.enableSouthAfricanOptimizations) {
      const context =
        await this.marketContextService.getMarketContext(tenantId);

      if (context.region === 'south-africa') {
        // Apply South African market specifics
        if (!dto.regional) dto.regional = {};
        if (!dto.regional.southAfrica) dto.regional.southAfrica = {};
      }
    }

    // For resilience against load shedding, wrap the operation
    if (this.options.enableLoadSheddingResilience) {
      return this.loadSheddingResilienceService.executeWithResilience(
        async () => this.productVariantRepository.create(dto, tenantId),
        'create-product-variant',
        { priority: 'high' },
      );
    }

    return this.productVariantRepository.create(dto, tenantId);
  }

  /**
   * Get a product variant by ID
   *
   * @param variantId - The variant ID
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns The product variant or null if not found
   */
  async findById(
    variantId: string,
    tenantId: string,
  ): Promise<ProductVariant | null> {
    return this.productVariantRepository.findById(variantId, tenantId);
  }

  /**
   * Get all variants for a parent product
   *
   * @param parentId - The parent product ID
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns Array of variants
   */
  async findByParentId(
    parentId: string,
    tenantId: string,
  ): Promise<ProductVariant[]> {
    return this.productVariantRepository.findByParentId(parentId, tenantId);
  }

  /**
   * Get a variant group (all variants for a product)
   *
   * @param productId - The product ID
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns Variant group or null if parent not found
   */
  async getVariantGroup(
    productId: string,
    tenantId: string,
  ): Promise<VariantGroup | null> {
    const product = await this.productRepository.findById(productId, tenantId);

    if (!product) {
      return null;
    }

    const variants = await this.productVariantRepository.findByParentId(
      productId,
      tenantId,
    );

    // Determine which attributes are used for variants
    const variantAttributes = product.attributes
      .filter((attr) => attr.usedForVariants)
      .map((attr) => attr.code);

    return {
      productId,
      variantAttributes,
      variants,
      displayMode: 'dropdown', // Default display mode
    };
  }

  /**
   * Update a product variant
   *
   * @param variantId - The variant ID
   * @param tenantId - Tenant ID for multi-tenancy
   * @param dto - Update data
   * @returns The updated variant
   */
  async update(
    variantId: string,
    tenantId: string,
    dto: UpdateProductVariantDto,
  ): Promise<ProductVariant> {
    const variant = await this.productVariantRepository.findById(
      variantId,
      tenantId,
    );

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${variantId} not found`);
    }

    // Handle image processing with network-aware component
    if (dto.images && this.options.enableSouthAfricanOptimizations) {
      const networkInfo: NetworkQualityInfo =
        await this.networkAwareStorageService.getNetworkQuality();

      if (networkInfo.connectionQuality !== 'high') {
        this.logger.log(
          `Processing images with optimized settings for ${networkInfo.connectionQuality} connection`,
        );

        if (dto.images.main) {
          dto.images.main =
            await this.networkAwareStorageService.optimizeImageUrl(
              dto.images.main,
              networkInfo,
            );
        }

        if (dto.images.gallery && dto.images.gallery.length > 0) {
          dto.images.gallery = await Promise.all(
            dto.images.gallery.map((url) =>
              this.networkAwareStorageService.optimizeImageUrl(
                url,
                networkInfo,
              ),
            ),
          );
        }
      }
    }

    return this.productVariantRepository.update(variantId, dto, tenantId);
  }

  /**
   * Update variant positions in bulk
   *
   * @param tenantId - Tenant ID for multi-tenancy
   * @param positions - Array of variant IDs and their new positions
   * @returns Operation result
   */
  async updatePositions(
    tenantId: string,
    positions: Array<{ variantId: string; position: number }>,
  ): Promise<OperationResult> {
    try {
      await Promise.all(
        positions.map(({ variantId, position }) =>
          this.productVariantRepository.updatePosition(
            variantId,
            position,
            tenantId,
          ),
        ),
      );

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to update variant positions: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: 'Failed to update variant positions',
        errorCode: 'UPDATE_POSITIONS_FAILED',
      };
    }
  }

  /**
   * Delete a product variant
   *
   * @param variantId - The variant ID
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns Operation result
   */
  async delete(variantId: string, tenantId: string): Promise<OperationResult> {
    try {
      const variant = await this.productVariantRepository.findById(
        variantId,
        tenantId,
      );

      if (!variant) {
        return {
          success: false,
          error: `Variant with ID ${variantId} not found`,
          errorCode: 'VARIANT_NOT_FOUND',
        };
      }

      await this.productVariantRepository.delete(variantId, tenantId);

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to delete variant ${variantId}: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: 'Failed to delete variant',
        errorCode: 'DELETE_VARIANT_FAILED',
      };
    }
  }

  /**
   * Delete all variants for a parent product
   *
   * @param parentId - The parent product ID
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns Operation result with count of deleted variants
   */
  async deleteByParentId(
    parentId: string,
    tenantId: string,
  ): Promise<OperationResult<{ count: number }>> {
    try {
      const count = await this.productVariantRepository.deleteByParentId(
        parentId,
        tenantId,
      );

      return {
        success: true,
        data: { count },
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete variants for product ${parentId}: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: 'Failed to delete variants',
        errorCode: 'DELETE_VARIANTS_FAILED',
      };
    }
  }

  /**
   * Generate variants based on attribute combinations
   *
   * @param productId - The parent product ID
   * @param tenantId - Tenant ID for multi-tenancy
   * @param attributeCodes - Array of attribute codes to use for variants
   * @returns Operation result with generated variants
   */
  async generateVariants(
    productId: string,
    tenantId: string,
    attributeCodes: string[],
  ): Promise<OperationResult<{ variants: ProductVariant[] }>> {
    try {
      const product = await this.productRepository.findById(
        productId,
        tenantId,
      );

      if (!product) {
        return {
          success: false,
          error: `Product with ID ${productId} not found`,
          errorCode: 'PRODUCT_NOT_FOUND',
        };
      }

      // Get the attributes we'll use for variants
      const variantAttributes = product.attributes.filter((attr) =>
        attributeCodes.includes(attr.code),
      );

      if (variantAttributes.length === 0) {
        return {
          success: false,
          error: 'No valid attributes found for variant generation',
          errorCode: 'NO_VARIANT_ATTRIBUTES',
        };
      }

      // Generate combinations of attribute values
      const combinations =
        this.generateAttributeCombinations(variantAttributes);

      // Create a variant for each combination
      const variants: ProductVariant[] = [];
      let position = 0;

      for (const combination of combinations) {
        // Create a name based on the combination
        const nameParts = combination.map((attr) => attr.value);
        const variantName = `${product.name} - ${nameParts.join(' - ')}`;

        // Generate a unique SKU
        const skuBase = product.sku;
        const skuSuffix = combination
          .map((attr) => `${attr.code}-${attr.value}`)
          .join('-');
        const sku = `${skuBase}-${skuSuffix}`.substring(0, 64); // Limit SKU length

        // Create the variant
        const variantDto: CreateProductVariantDto = {
          parentId: productId,
          sku,
          name: variantName,
          attributes: combination,
          position: position++,
          pricing: { ...product.pricing }, // Copy parent pricing initially
          stock: product.stock ? { ...product.stock } : undefined,
          dimensions: product.dimensions,
          weight: product.weight,
          isDefault: position === 1, // First variant is default
        };

        const variant = await this.productVariantRepository.create(
          variantDto,
          tenantId,
        );
        variants.push(variant);
      }

      // Update the product to mark these attributes as variant attributes
      const updatedAttributes = product.attributes.map((attr) => {
        if (attributeCodes.includes(attr.code)) {
          return { ...attr, usedForVariants: true };
        }
        return attr;
      });

      await this.productRepository.update(
        productId,
        { attributes: updatedAttributes },
        tenantId,
      );

      return {
        success: true,
        data: { variants },
        metadata: {
          combinationCount: combinations.length,
          attributesUsed: attributeCodes,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate variants: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: 'Failed to generate variants',
        errorCode: 'GENERATE_VARIANTS_FAILED',
      };
    }
  }

  /**
   * Private helper method to generate all possible combinations of attribute values
   */
  private generateAttributeCombinations(
    attributes: Array<{
      code: string;
      value: any;
      label: string;
      type: string;
    }>,
  ): Array<Array<{ code: string; value: any; label: string; type: string }>> {
    // Implementation for a simple case with discrete values
    // For more complex scenarios, this would need to be enhanced

    if (attributes.length === 0) {
      return [];
    }

    if (attributes.length === 1) {
      const attr = attributes[0];
      // If the attribute has predefined options
      if (attr.validation?.options) {
        return attr.validation.options.map((option) => [
          {
            code: attr.code,
            value: option,
            label: `${attr.label}: ${option}`,
            type: attr.type,
          },
        ]);
      }
      // For boolean attributes
      else if (attr.type === 'boolean') {
        return [
          [
            {
              code: attr.code,
              value: true,
              label: `${attr.label}: Yes`,
              type: attr.type,
            },
          ],
          [
            {
              code: attr.code,
              value: false,
              label: `${attr.label}: No`,
              type: attr.type,
            },
          ],
        ];
      }
      // Default to using the current value
      return [
        [
          {
            code: attr.code,
            value: attr.value,
            label: attr.label,
            type: attr.type,
          },
        ],
      ];
    }

    // Recursive case for multiple attributes
    const [firstAttr, ...restAttrs] = attributes;
    const restCombinations = this.generateAttributeCombinations(restAttrs);

    const result = [];

    // For the first attribute
    let firstOptions = [];

    // If the attribute has predefined options
    if (firstAttr.validation?.options) {
      firstOptions = firstAttr.validation.options.map((option) => ({
        code: firstAttr.code,
        value: option,
        label: `${firstAttr.label}: ${option}`,
        type: firstAttr.type,
      }));
    }
    // For boolean attributes
    else if (firstAttr.type === 'boolean') {
      firstOptions = [
        {
          code: firstAttr.code,
          value: true,
          label: `${firstAttr.label}: Yes`,
          type: firstAttr.type,
        },
        {
          code: firstAttr.code,
          value: false,
          label: `${firstAttr.label}: No`,
          type: firstAttr.type,
        },
      ];
    }
    // Default to using the current value
    else {
      firstOptions = [
        {
          code: firstAttr.code,
          value: firstAttr.value,
          label: firstAttr.label,
          type: firstAttr.type,
        },
      ];
    }

    // Combine first attribute options with all other combinations
    for (const option of firstOptions) {
      for (const combination of restCombinations) {
        result.push([option, ...combination]);
      }
    }

    return result;
  }
}
