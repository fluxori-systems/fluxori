/**
 * Product Validation Controller
 *
 * Controller for validating products against business rules and marketplace requirements.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { FirebaseAuthGuard } from "@common/guards";
import { GetUser } from "@common/decorators";
import { ValidationService } from "../services/validation.service";
import { MarketplaceValidationService } from "../services/marketplace-validation.service";
import { ProductService } from "../services/product.service";
import { Product } from "../models/product.model";

/**
 * Product validation request DTO
 */
class ValidateProductRequestDto {
  /**
   * Product ID to validate
   */
  productId: string;

  /**
   * Include category-specific validation rules
   */
  includeCategoryRules?: boolean;

  /**
   * Include validation for variants
   */
  includeVariantValidation?: boolean;

  /**
   * Specific rule IDs to run (if empty, run all applicable rules)
   */
  ruleIds?: string[];

  /**
   * Rule IDs to skip
   */
  skipRuleIds?: string[];
}

/**
 * Controller for product validation
 */
@Controller("pim/validation")
@UseGuards(FirebaseAuthGuard)
export class ValidationController {
  private readonly logger = new Logger(ValidationController.name);

  constructor(
    private readonly validationService: ValidationService,
    private readonly marketplaceValidationService: MarketplaceValidationService,
    private readonly productService: ProductService,
  ) {}

  /**
   * Get available validation rules
   *
   * @returns List of validation rules
   */
  @Get("rules")
  async getValidationRules() {
    return {
      rules: this.validationService.getValidationRules(),
    };
  }

  /**
   * Validate a product against general business rules
   *
   * @param request - Validation request
   * @param user - Authenticated user
   * @returns Validation result
   */
  @Post("validate")
  async validateProduct(
    @Body() request: ValidateProductRequestDto,
    @GetUser() user: any,
  ) {
    this.logger.log(`Validating product ${request.productId}`);

    try {
      // Get the product
      const product = await this.productService.findById(
        request.productId,
        user.tenantId,
      );

      if (!product) {
        throw new HttpException(
          `Product with ID ${request.productId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Validate the product
      const result = await this.validationService.validateProduct(
        product,
        user.tenantId,
        {
          includeCategoryRules: request.includeCategoryRules,
          includeVariantValidation: request.includeVariantValidation,
          ruleIds: request.ruleIds,
          skipRuleIds: request.skipRuleIds,
        },
      );

      return result;
    } catch (error) {
      this.logger.error(`Validation failed: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Validation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Validate a product against marketplace requirements
   *
   * @param marketplaceId - Marketplace ID
   * @param productId - Product ID
   * @param includeVariants - Whether to include variants in validation
   * @param user - Authenticated user
   * @returns Marketplace validation result
   */
  @Get("marketplace/:marketplaceId/:productId")
  async validateForMarketplace(
    @Param("marketplaceId") marketplaceId: string,
    @Param("productId") productId: string,
    @Query("includeVariants") includeVariants: boolean = true,
    @GetUser() user: any,
  ) {
    this.logger.log(
      `Validating product ${productId} for marketplace ${marketplaceId}`,
    );

    try {
      // Get the product
      const product = await this.productService.findById(
        productId,
        user.tenantId,
      );

      if (!product) {
        throw new HttpException(
          `Product with ID ${productId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Get variants if needed
      let variants = [];

      if (includeVariants) {
        // In a real implementation, you would load variants
        // This is simplified as we don't have the actual loading in this example
      }

      // Validate for marketplace
      const result = this.marketplaceValidationService.validateProduct(
        product as Product,
        marketplaceId,
        variants,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Marketplace validation failed: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Marketplace validation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Validate a product against a specific rule
   *
   * @param ruleId - Rule ID
   * @param productId - Product ID
   * @param user - Authenticated user
   * @returns Validation issues
   */
  @Get("rule/:ruleId/:productId")
  async validateWithRule(
    @Param("ruleId") ruleId: string,
    @Param("productId") productId: string,
    @GetUser() user: any,
  ) {
    this.logger.log(`Validating product ${productId} with rule ${ruleId}`);

    try {
      // Get the product
      const product = await this.productService.findById(
        productId,
        user.tenantId,
      );

      if (!product) {
        throw new HttpException(
          `Product with ID ${productId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Run validation rule
      const issues = await this.validationService.runValidationRule(
        ruleId,
        product,
        user.tenantId,
      );

      return { ruleId, issues };
    } catch (error) {
      this.logger.error(
        `Rule validation failed: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Rule validation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check what marketplaces a product is valid for
   *
   * @param productId - Product ID
   * @param user - Authenticated user
   * @returns Marketplace validation summary
   */
  @Get("marketplace-summary/:productId")
  async checkMarketplaceValidity(
    @Param("productId") productId: string,
    @GetUser() user: any,
  ) {
    this.logger.log(`Checking marketplace validity for product ${productId}`);

    try {
      // Get the product
      const product = await this.productService.findById(
        productId,
        user.tenantId,
      );

      if (!product) {
        throw new HttpException(
          `Product with ID ${productId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      // List of marketplaces to check
      const marketplaces = ["takealot", "amazon"];

      // Validate for each marketplace
      const results = {};

      for (const marketplace of marketplaces) {
        const result = this.marketplaceValidationService.validateProduct(
          product as Product,
          marketplace,
        );

        results[marketplace] = {
          valid: result.valid,
          score: result.score,
          errorCount: Object.keys(result.errors).length,
          warningCount: Object.keys(result.warnings).length,
        };
      }

      return {
        productId,
        productName: product.name,
        marketplaces: results,
      };
    } catch (error) {
      this.logger.error(
        `Marketplace summary failed: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Marketplace summary failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Validate a batch of products
   *
   * @param productIds - Array of product IDs to validate
   * @param user - Authenticated user
   * @returns Batch validation summary
   */
  @Post("batch-validate")
  async validateBatch(
    @Body() { productIds }: { productIds: string[] },
    @GetUser() user: any,
  ) {
    this.logger.log(`Batch validating ${productIds.length} products`);

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new HttpException(
        "Product IDs must be provided as a non-empty array",
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const results = [];
      let validCount = 0;

      // Process each product
      for (const productId of productIds) {
        try {
          // Get the product
          const product = await this.productService.findById(
            productId,
            user.tenantId,
          );

          if (!product) {
            results.push({
              productId,
              success: false,
              message: "Product not found",
            });
            continue;
          }

          // Validate the product
          const validation = await this.validationService.validateProduct(
            product,
            user.tenantId,
          );

          results.push({
            productId,
            success: true,
            valid: validation.valid,
            score: validation.score,
            errorCount: validation.errors.length,
            warningCount: validation.warnings.length,
          });

          if (validation.valid) {
            validCount++;
          }
        } catch (error) {
          results.push({
            productId,
            success: false,
            message: error.message,
          });
        }
      }

      return {
        total: productIds.length,
        validCount,
        invalidCount: productIds.length - validCount,
        results,
      };
    } catch (error) {
      this.logger.error(
        `Batch validation failed: ${error.message}`,
        error.stack,
      );

      throw new HttpException(
        `Batch validation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
