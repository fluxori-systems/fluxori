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
  HttpStatus,
  HttpException,
} from '@nestjs/common';

import { FirebaseAuthGuard } from '../../../common/guards/firebase-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { OperationResult } from '../interfaces/types';
import {
  ProductVariant,
  CreateProductVariantDto,
  UpdateProductVariantDto,
  VariantGroup,
} from '../models/product-variant.model';
import { ProductVariantService } from '../services/product-variant.service';

/**
 * Controller for product variant operations
 */
@Controller('pim/variants')
@UseGuards(FirebaseAuthGuard)
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) {}

  /**
   * Get a product variant by ID
   *
   * @param variantId - The variant ID
   * @param user - The authenticated user with tenant ID
   * @returns The product variant
   */
  @Get(':variantId')
  async getVariant(
    @Param('variantId') variantId: string,
    @GetUser() user: any,
  ): Promise<ProductVariant> {
    const variant = await this.productVariantService.findById(
      variantId,
      user.tenantId,
    );

    if (!variant) {
      throw new HttpException(
        `Variant with ID ${variantId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return variant;
  }

  /**
   * Get all variants for a parent product
   *
   * @param productId - The parent product ID
   * @param user - The authenticated user with tenant ID
   * @returns Array of variants
   */
  @Get('product/:productId')
  async getVariantsForProduct(
    @Param('productId') productId: string,
    @GetUser() user: any,
  ): Promise<ProductVariant[]> {
    return this.productVariantService.findByParentId(productId, user.tenantId);
  }

  /**
   * Get a variant group (all variants for a product)
   *
   * @param productId - The product ID
   * @param user - The authenticated user with tenant ID
   * @returns Variant group
   */
  @Get('group/:productId')
  async getVariantGroup(
    @Param('productId') productId: string,
    @GetUser() user: any,
  ): Promise<VariantGroup> {
    const group = await this.productVariantService.getVariantGroup(
      productId,
      user.tenantId,
    );

    if (!group) {
      throw new HttpException(
        `Product with ID ${productId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return group;
  }

  /**
   * Create a new product variant
   *
   * @param dto - Create variant data
   * @param user - The authenticated user with tenant ID
   * @returns The created variant
   */
  @Post()
  async createVariant(
    @Body() dto: CreateProductVariantDto,
    @GetUser() user: any,
  ): Promise<ProductVariant> {
    return this.productVariantService.create(user.tenantId, dto);
  }

  /**
   * Update a product variant
   *
   * @param variantId - The variant ID
   * @param dto - Update data
   * @param user - The authenticated user with tenant ID
   * @returns The updated variant
   */
  @Put(':variantId')
  async updateVariant(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateProductVariantDto,
    @GetUser() user: any,
  ): Promise<ProductVariant> {
    return this.productVariantService.update(variantId, user.tenantId, dto);
  }

  /**
   * Update variant positions in bulk
   *
   * @param positions - Array of variant IDs and their new positions
   * @param user - The authenticated user with tenant ID
   * @returns Operation result
   */
  @Put('positions')
  async updatePositions(
    @Body() positions: Array<{ variantId: string; position: number }>,
    @GetUser() user: any,
  ): Promise<OperationResult> {
    return this.productVariantService.updatePositions(user.tenantId, positions);
  }

  /**
   * Delete a product variant
   *
   * @param variantId - The variant ID
   * @param user - The authenticated user with tenant ID
   * @returns Operation result
   */
  @Delete(':variantId')
  async deleteVariant(
    @Param('variantId') variantId: string,
    @GetUser() user: any,
  ): Promise<OperationResult> {
    return this.productVariantService.delete(variantId, user.tenantId);
  }

  /**
   * Generate variants based on attribute combinations
   *
   * @param productId - The parent product ID
   * @param attributeCodes - Array of attribute codes to use for variants
   * @param user - The authenticated user with tenant ID
   * @returns Operation result with generated variants
   */
  @Post('generate/:productId')
  async generateVariants(
    @Param('productId') productId: string,
    @Body() { attributeCodes }: { attributeCodes: string[] },
    @GetUser() user: any,
  ): Promise<OperationResult<{ variants: ProductVariant[] }>> {
    return this.productVariantService.generateVariants(
      productId,
      user.tenantId,
      attributeCodes,
    );
  }
}
