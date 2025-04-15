/**
 * Product Validation Service
 * 
 * Service for validating products against general and category-specific
 * business rules to ensure data quality and compliance.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { Product, ProductStatus, ProductType } from '../models/product.model';
import { ProductVariant } from '../models/product-variant.model';
import { CategoryService } from './category.service';
import { AttributeTemplateService } from './attribute-template.service';
import { MarketContextService } from './market-context.service';
import { Category } from '../models/category.model';
import { ProductAttribute } from '../interfaces/types';
import { LoadSheddingResilienceService } from './load-shedding-resilience.service';

/**
 * Validation rule severity
 */
export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Validation rule
 */
export interface ValidationRule {
  /**
   * Rule ID
   */
  id: string;
  
  /**
   * Rule description
   */
  description: string;
  
  /**
   * Fields this rule validates
   */
  fields: string[];
  
  /**
   * Rule severity
   */
  severity: ValidationSeverity;
  
  /**
   * Category IDs this rule applies to (undefined = all categories)
   */
  categoryIds?: string[];
  
  /**
   * Product types this rule applies to (undefined = all types)
   */
  productTypes?: ProductType[];
  
  /**
   * Validator function
   */
  validator: (
    product: Product, 
    context?: ValidationContext
  ) => ValidationIssue[];
}

/**
 * Validation issue returned by a rule
 */
export interface ValidationIssue {
  /**
   * Rule ID that generated this issue
   */
  ruleId: string;
  
  /**
   * Field name with the issue
   */
  field: string;
  
  /**
   * Issue message
   */
  message: string;
  
  /**
   * Issue severity
   */
  severity: ValidationSeverity;
  
  /**
   * Metadata about the issue
   */
  metadata?: Record<string, any>;
}

/**
 * Validation context passed to validator functions
 */
export interface ValidationContext {
  /**
   * Product being validated
   */
  product: Product;
  
  /**
   * Product variants (if applicable)
   */
  variants?: ProductVariant[];
  
  /**
   * Product category
   */
  category?: Category;
  
  /**
   * Market context
   */
  marketContext?: any;
  
  /**
   * Tenant ID
   */
  tenantId: string;
}

/**
 * Result of product validation
 */
export interface ValidationResult {
  /**
   * Is the product valid (no errors)
   */
  valid: boolean;
  
  /**
   * Validation errors
   */
  errors: ValidationIssue[];
  
  /**
   * Validation warnings
   */
  warnings: ValidationIssue[];
  
  /**
   * Validation information
   */
  info: ValidationIssue[];
  
  /**
   * Product ID that was validated
   */
  productId: string;
  
  /**
   * Product SKU that was validated
   */
  productSku: string;
  
  /**
   * Validation score (0-100)
   */
  score: number;
  
  /**
   * Metadata about the validation
   */
  metadata: {
    /**
     * Timestamp of validation
     */
    timestamp: Date;
    
    /**
     * Rules that were skipped
     */
    skippedRules?: string[];
    
    /**
     * Fields that passed validation
     */
    validFields: string[];
    
    /**
     * Fields with issues
     */
    invalidFields: string[];
  };
}

/**
 * Service for validating products
 */
@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);
  private readonly rules: ValidationRule[] = [];
  
  constructor(
    private readonly categoryService: CategoryService,
    private readonly attributeTemplateService: AttributeTemplateService,
    private readonly marketContextService: MarketContextService,
    private readonly loadSheddingService: LoadSheddingResilienceService,
    @Inject('PIM_MODULE_OPTIONS') private readonly options: any
  ) {
    this.initializeValidationRules();
  }
  
  /**
   * Validate a product
   * 
   * @param product - Product to validate
   * @param tenantId - Tenant ID
   * @param options - Validation options
   * @returns Validation result
   */
  async validateProduct(
    product: Product,
    tenantId: string,
    options?: {
      includeCategoryRules?: boolean;
      includeVariantValidation?: boolean;
      ruleIds?: string[];
      skipRuleIds?: string[];
    }
  ): Promise<ValidationResult> {
    // Execute validation with load shedding resilience
    return this.loadSheddingService.executeWithResilience(
      async () => {
        return this.performValidation(product, tenantId, options);
      },
      'product-validation',
      { priority: 'medium' }
    );
  }
  
  /**
   * Perform the actual validation logic
   */
  private async performValidation(
    product: Product,
    tenantId: string,
    options?: {
      includeCategoryRules?: boolean;
      includeVariantValidation?: boolean;
      ruleIds?: string[];
      skipRuleIds?: string[];
    }
  ): Promise<ValidationResult> {
    this.logger.debug(`Validating product ${product.id} (${product.sku})`);
    
    // Default options
    const validationOptions = {
      includeCategoryRules: true,
      includeVariantValidation: true,
      ...options
    };
    
    // Initialize validation context
    const context: ValidationContext = {
      product,
      tenantId
    };
    
    // Get market context
    const marketContext = await this.marketContextService.getMarketContext(tenantId);
    context.marketContext = marketContext;
    
    // Get category details if needed
    if (validationOptions.includeCategoryRules && product.categories?.length > 0) {
      // Find primary category
      const primaryCategory = product.categories.find(c => c.isPrimary);
      
      if (primaryCategory) {
        const category = await this.categoryService.findById(
          primaryCategory.id, 
          tenantId
        );
        
        if (category) {
          context.category = category;
        }
      }
    }
    
    // Get variants if needed
    if (validationOptions.includeVariantValidation && 
        (product.type === ProductType.SIMPLE || product.type === ProductType.VARIANT)) {
      // In a real implementation, you would load variants
      // This is simplified as we don't have the service loading in this mock
      context.variants = [];
    }
    
    // Filter rules based on options
    let rulesToRun = this.rules;
    const skippedRules: string[] = [];
    
    // Filter by ruleIds if specified
    if (validationOptions.ruleIds?.length) {
      rulesToRun = rulesToRun.filter(rule => validationOptions.ruleIds.includes(rule.id));
    }
    
    // Exclude rules by skipRuleIds if specified
    if (validationOptions.skipRuleIds?.length) {
      rulesToRun = rulesToRun.filter(rule => {
        const shouldSkip = validationOptions.skipRuleIds.includes(rule.id);
        if (shouldSkip) {
          skippedRules.push(rule.id);
        }
        return !shouldSkip;
      });
    }
    
    // Filter by category if category-specific validation is enabled
    if (validationOptions.includeCategoryRules && context.category) {
      // Keep general rules and rules specific to this category
      rulesToRun = rulesToRun.filter(rule => 
        !rule.categoryIds || 
        rule.categoryIds.length === 0 || 
        rule.categoryIds.includes(context.category.id)
      );
    } else {
      // Keep only general rules
      rulesToRun = rulesToRun.filter(rule => 
        !rule.categoryIds || rule.categoryIds.length === 0
      );
    }
    
    // Filter by product type
    rulesToRun = rulesToRun.filter(rule => 
      !rule.productTypes || 
      rule.productTypes.length === 0 || 
      rule.productTypes.includes(product.type)
    );
    
    // Run validation rules
    const issues: ValidationIssue[] = [];
    
    for (const rule of rulesToRun) {
      try {
        const ruleIssues = rule.validator(product, context);
        issues.push(...ruleIssues);
      } catch (error) {
        this.logger.error(`Error running validation rule ${rule.id}: ${error.message}`, error.stack);
        
        // Add an issue for the failed rule
        issues.push({
          ruleId: rule.id,
          field: '_validation',
          message: `Validation rule failed: ${error.message}`,
          severity: ValidationSeverity.ERROR
        });
      }
    }
    
    // Categorize issues by severity
    const errors = issues.filter(issue => issue.severity === ValidationSeverity.ERROR);
    const warnings = issues.filter(issue => issue.severity === ValidationSeverity.WARNING);
    const info = issues.filter(issue => issue.severity === ValidationSeverity.INFO);
    
    // Calculate validity
    const valid = errors.length === 0;
    
    // Collect affected fields
    const invalidFields = [...new Set(issues.map(issue => issue.field))];
    
    // Calculate validation score
    const score = this.calculateValidationScore(product, errors, warnings, info);
    
    // Build validation result
    return {
      valid,
      errors,
      warnings,
      info,
      productId: product.id,
      productSku: product.sku,
      score,
      metadata: {
        timestamp: new Date(),
        skippedRules,
        validFields: this.getValidFields(product, invalidFields),
        invalidFields
      }
    };
  }
  
  /**
   * Initialize validation rules
   */
  private initializeValidationRules(): void {
    // Required fields rule
    this.rules.push({
      id: 'required-fields',
      description: 'Validates that all required fields are present',
      fields: ['name', 'sku', 'description', 'status', 'type', 'pricing'],
      severity: ValidationSeverity.ERROR,
      validator: (product: Product) => {
        const issues: ValidationIssue[] = [];
        
        if (!product.name || product.name.trim().length === 0) {
          issues.push({
            ruleId: 'required-fields',
            field: 'name',
            message: 'Product name is required',
            severity: ValidationSeverity.ERROR
          });
        }
        
        if (!product.sku || product.sku.trim().length === 0) {
          issues.push({
            ruleId: 'required-fields',
            field: 'sku',
            message: 'Product SKU is required',
            severity: ValidationSeverity.ERROR
          });
        }
        
        if (!product.description || product.description.trim().length === 0) {
          issues.push({
            ruleId: 'required-fields',
            field: 'description',
            message: 'Product description is required',
            severity: ValidationSeverity.ERROR
          });
        }
        
        if (!product.status) {
          issues.push({
            ruleId: 'required-fields',
            field: 'status',
            message: 'Product status is required',
            severity: ValidationSeverity.ERROR
          });
        }
        
        if (!product.type) {
          issues.push({
            ruleId: 'required-fields',
            field: 'type',
            message: 'Product type is required',
            severity: ValidationSeverity.ERROR
          });
        }
        
        if (!product.pricing || !product.pricing.basePrice) {
          issues.push({
            ruleId: 'required-fields',
            field: 'pricing',
            message: 'Product pricing is required',
            severity: ValidationSeverity.ERROR
          });
        }
        
        return issues;
      }
    });
    
    // Field format validation
    this.rules.push({
      id: 'field-formats',
      description: 'Validates that fields have the correct format',
      fields: ['sku', 'pricing.basePrice', 'weight', 'dimensions'],
      severity: ValidationSeverity.ERROR,
      validator: (product: Product) => {
        const issues: ValidationIssue[] = [];
        
        // SKU format (alphanumeric, no spaces)
        if (product.sku && !/^[a-zA-Z0-9_-]+$/.test(product.sku)) {
          issues.push({
            ruleId: 'field-formats',
            field: 'sku',
            message: 'SKU should only contain letters, numbers, underscores, and hyphens',
            severity: ValidationSeverity.ERROR
          });
        }
        
        // Price validation
        if (product.pricing?.basePrice && (
          isNaN(product.pricing.basePrice) || 
          product.pricing.basePrice <= 0
        )) {
          issues.push({
            ruleId: 'field-formats',
            field: 'pricing.basePrice',
            message: 'Price must be a positive number',
            severity: ValidationSeverity.ERROR
          });
        }
        
        // Weight validation
        if (product.weight !== undefined && (
          isNaN(product.weight) || 
          product.weight <= 0
        )) {
          issues.push({
            ruleId: 'field-formats',
            field: 'weight',
            message: 'Weight must be a positive number',
            severity: ValidationSeverity.ERROR
          });
        }
        
        // Dimensions validation
        if (product.dimensions) {
          if (!Array.isArray(product.dimensions) || product.dimensions.length !== 3) {
            issues.push({
              ruleId: 'field-formats',
              field: 'dimensions',
              message: 'Dimensions must be an array with exactly 3 values [length, width, height]',
              severity: ValidationSeverity.ERROR
            });
          } else if (product.dimensions.some(dim => isNaN(dim) || dim <= 0)) {
            issues.push({
              ruleId: 'field-formats',
              field: 'dimensions',
              message: 'All dimensions must be positive numbers',
              severity: ValidationSeverity.ERROR
            });
          }
        }
        
        return issues;
      }
    });
    
    // Category validation
    this.rules.push({
      id: 'category-validation',
      description: 'Validates that products have valid categories',
      fields: ['categories'],
      severity: ValidationSeverity.ERROR,
      validator: (product: Product) => {
        const issues: ValidationIssue[] = [];
        
        if (!product.categories || product.categories.length === 0) {
          issues.push({
            ruleId: 'category-validation',
            field: 'categories',
            message: 'Product must have at least one category',
            severity: ValidationSeverity.ERROR
          });
        } else {
          // Check for primary category
          const primaryCategories = product.categories.filter(c => c.isPrimary);
          
          if (primaryCategories.length === 0) {
            issues.push({
              ruleId: 'category-validation',
              field: 'categories',
              message: 'Product must have a primary category',
              severity: ValidationSeverity.ERROR
            });
          } else if (primaryCategories.length > 1) {
            issues.push({
              ruleId: 'category-validation',
              field: 'categories',
              message: 'Product cannot have multiple primary categories',
              severity: ValidationSeverity.ERROR
            });
          }
        }
        
        return issues;
      }
    });
    
    // Stock validation
    this.rules.push({
      id: 'stock-validation',
      description: 'Validates product stock information',
      fields: ['stock'],
      severity: ValidationSeverity.WARNING,
      validator: (product: Product) => {
        const issues: ValidationIssue[] = [];
        
        if (!product.stock) {
          issues.push({
            ruleId: 'stock-validation',
            field: 'stock',
            message: 'Stock information should be provided',
            severity: ValidationSeverity.WARNING
          });
        } else {
          if (product.stock.quantity === undefined) {
            issues.push({
              ruleId: 'stock-validation',
              field: 'stock.quantity',
              message: 'Stock quantity should be specified',
              severity: ValidationSeverity.WARNING
            });
          }
          
          if (product.stock.manageStock === undefined) {
            issues.push({
              ruleId: 'stock-validation',
              field: 'stock.manageStock',
              message: 'Stock management preference should be specified',
              severity: ValidationSeverity.WARNING
            });
          }
          
          // Check for inconsistencies
          if (product.stock.quantity === 0 && product.stock.inStock === true) {
            issues.push({
              ruleId: 'stock-validation',
              field: 'stock.inStock',
              message: 'Product cannot be in stock with 0 quantity',
              severity: ValidationSeverity.ERROR
            });
          }
        }
        
        return issues;
      }
    });
    
    // Image validation
    this.rules.push({
      id: 'image-validation',
      description: 'Validates product images',
      fields: ['images'],
      severity: ValidationSeverity.WARNING,
      validator: (product: Product) => {
        const issues: ValidationIssue[] = [];
        
        if (!product.images || !product.images.main) {
          issues.push({
            ruleId: 'image-validation',
            field: 'images.main',
            message: 'Main product image is required',
            severity: ValidationSeverity.WARNING
          });
        }
        
        // Check image count
        const imageCount = 1 + (product.images?.gallery?.length || 0);
        
        if (imageCount < 3) {
          issues.push({
            ruleId: 'image-validation',
            field: 'images.gallery',
            message: `Product has only ${imageCount} images. At least 3 images are recommended.`,
            severity: ValidationSeverity.INFO
          });
        }
        
        // Validate image URLs
        if (product.images?.main && !this.isValidImageUrl(product.images.main)) {
          issues.push({
            ruleId: 'image-validation',
            field: 'images.main',
            message: 'Main image URL is not valid',
            severity: ValidationSeverity.ERROR
          });
        }
        
        if (product.images?.gallery) {
          product.images.gallery.forEach((url, index) => {
            if (!this.isValidImageUrl(url)) {
              issues.push({
                ruleId: 'image-validation',
                field: `images.gallery[${index}]`,
                message: `Gallery image ${index + 1} URL is not valid`,
                severity: ValidationSeverity.ERROR
              });
            }
          });
        }
        
        return issues;
      }
    });
    
    // SEO validation
    this.rules.push({
      id: 'seo-validation',
      description: 'Validates product SEO information',
      fields: ['seo', 'name', 'description'],
      severity: ValidationSeverity.INFO,
      validator: (product: Product) => {
        const issues: ValidationIssue[] = [];
        
        // Check name length for SEO
        if (product.name && (product.name.length < 5 || product.name.length > 70)) {
          issues.push({
            ruleId: 'seo-validation',
            field: 'name',
            message: `Product name length (${product.name.length} chars) is not optimal for SEO. Aim for 5-70 characters.`,
            severity: ValidationSeverity.INFO
          });
        }
        
        // Check description length for SEO
        if (product.description && product.description.length < 100) {
          issues.push({
            ruleId: 'seo-validation',
            field: 'description',
            message: 'Description is too short for good SEO. Aim for at least 100 characters.',
            severity: ValidationSeverity.INFO
          });
        }
        
        // Check for SEO fields
        if (!product.seo) {
          issues.push({
            ruleId: 'seo-validation',
            field: 'seo',
            message: 'SEO information is recommended for better search visibility',
            severity: ValidationSeverity.INFO
          });
        } else {
          // Check meta title
          if (!product.seo.metaTitle) {
            issues.push({
              ruleId: 'seo-validation',
              field: 'seo.metaTitle',
              message: 'Meta title is recommended for SEO',
              severity: ValidationSeverity.INFO
            });
          } else if (product.seo.metaTitle.length > 70) {
            issues.push({
              ruleId: 'seo-validation',
              field: 'seo.metaTitle',
              message: `Meta title is too long (${product.seo.metaTitle.length} chars). Keep it under 70 characters.`,
              severity: ValidationSeverity.INFO
            });
          }
          
          // Check meta description
          if (!product.seo.metaDescription) {
            issues.push({
              ruleId: 'seo-validation',
              field: 'seo.metaDescription',
              message: 'Meta description is recommended for SEO',
              severity: ValidationSeverity.INFO
            });
          } else if (product.seo.metaDescription.length > 160) {
            issues.push({
              ruleId: 'seo-validation',
              field: 'seo.metaDescription',
              message: `Meta description is too long (${product.seo.metaDescription.length} chars). Keep it under 160 characters.`,
              severity: ValidationSeverity.INFO
            });
          }
        }
        
        return issues;
      }
    });
    
    // Content quality validation
    this.rules.push({
      id: 'content-quality',
      description: 'Validates the quality of product content',
      fields: ['name', 'description', 'shortDescription', 'attributes'],
      severity: ValidationSeverity.WARNING,
      validator: (product: Product) => {
        const issues: ValidationIssue[] = [];
        
        // Check for duplicate words in name
        if (product.name) {
          const words = product.name.toLowerCase().split(/\s+/);
          const wordCounts = words.reduce((acc, word) => {
            if (word.length >= 3) { // Only count meaningful words
              acc[word] = (acc[word] || 0) + 1;
            }
            return acc;
          }, {});
          
          const duplicates = Object.entries(wordCounts)
            .filter(([word, count]) => count > 1 && word.length > 3)
            .map(([word]) => word);
          
          if (duplicates.length > 0) {
            issues.push({
              ruleId: 'content-quality',
              field: 'name',
              message: `Product name contains duplicate words: ${duplicates.join(', ')}`,
              severity: ValidationSeverity.INFO
            });
          }
        }
        
        // Check for short description
        if (!product.shortDescription) {
          issues.push({
            ruleId: 'content-quality',
            field: 'shortDescription',
            message: 'Short description is recommended for product listings',
            severity: ValidationSeverity.WARNING
          });
        } else if (product.shortDescription.length > 160) {
          issues.push({
            ruleId: 'content-quality',
            field: 'shortDescription',
            message: `Short description is too long (${product.shortDescription.length} chars). Keep it under 160 characters.`,
            severity: ValidationSeverity.INFO
          });
        }
        
        // Check for attributes
        if (!product.attributes || product.attributes.length === 0) {
          issues.push({
            ruleId: 'content-quality',
            field: 'attributes',
            message: 'Product should have attributes for better filtering and search',
            severity: ValidationSeverity.WARNING
          });
        } else if (product.attributes.length < 3) {
          issues.push({
            ruleId: 'content-quality',
            field: 'attributes',
            message: `Product has only ${product.attributes.length} attributes. More attributes improve product discoverability.`,
            severity: ValidationSeverity.INFO
          });
        }
        
        return issues;
      }
    });
    
    // South African specific validation
    this.rules.push({
      id: 'south-african-compliance',
      description: 'Validates South African specific requirements',
      fields: ['regional.southAfrica', 'compliance.southAfrica'],
      severity: ValidationSeverity.WARNING,
      validator: (product: Product, context: ValidationContext) => {
        const issues: ValidationIssue[] = [];
        
        // Only apply for South African market context
        if (context?.marketContext?.region !== 'south-africa') {
          return [];
        }
        
        // Check for ICASA approval for electronics
        if (this.isElectronicsProduct(product, context)) {
          const hasIcasa = product.regional?.southAfrica?.icasaApproved || 
            product.compliance?.southAfrica?.icasa;
          
          if (!hasIcasa) {
            issues.push({
              ruleId: 'south-african-compliance',
              field: 'regional.southAfrica.icasaApproved',
              message: 'ICASA approval is required for electronic products in South Africa',
              severity: ValidationSeverity.WARNING
            });
          }
        }
        
        // Check for barcode
        const hasBarcode = this.hasSouthAfricanBarcode(product);
        
        if (!hasBarcode) {
          issues.push({
            ruleId: 'south-african-compliance',
            field: 'regional.southAfrica.saBarcode',
            message: 'South African barcode is recommended for South African market',
            severity: ValidationSeverity.INFO
          });
        }
        
        // Check for dimensions and weight (important for shipping)
        if (!product.dimensions || !product.weight) {
          issues.push({
            ruleId: 'south-african-compliance',
            field: 'dimensions',
            message: 'Dimensions and weight are important for shipping in South Africa',
            severity: ValidationSeverity.WARNING
          });
        }
        
        return issues;
      }
    });
    
    // Variant validation rule
    this.rules.push({
      id: 'variant-validation',
      description: 'Validates product variants',
      fields: ['type', 'variants'],
      severity: ValidationSeverity.ERROR,
      productTypes: [ProductType.SIMPLE],
      validator: (product: Product, context: ValidationContext) => {
        const issues: ValidationIssue[] = [];
        
        // Only apply to products with variants
        if (product.type !== ProductType.SIMPLE || !context?.variants || context.variants.length === 0) {
          return [];
        }
        
        // Check that variants have unique SKUs
        const skus = context.variants.map(v => v.sku);
        const uniqueSkus = new Set(skus);
        
        if (uniqueSkus.size !== context.variants.length) {
          issues.push({
            ruleId: 'variant-validation',
            field: 'variants',
            message: 'All variant SKUs must be unique',
            severity: ValidationSeverity.ERROR,
            metadata: {
              duplicateCount: context.variants.length - uniqueSkus.size
            }
          });
        }
        
        // Check that all variants have names
        const missingNames = context.variants.filter(v => !v.name).length;
        
        if (missingNames > 0) {
          issues.push({
            ruleId: 'variant-validation',
            field: 'variants',
            message: `${missingNames} variants are missing names`,
            severity: ValidationSeverity.ERROR
          });
        }
        
        // Check that variants have distinct attribute combinations
        const attrSets = context.variants.map(variant => {
          // Create a string representation of attribute combinations
          return this.getVariantAttributeKey(variant.attributes);
        });
        
        const uniqueAttrSets = new Set(attrSets);
        
        if (uniqueAttrSets.size !== context.variants.length) {
          issues.push({
            ruleId: 'variant-validation',
            field: 'variants',
            message: 'All variants must have unique attribute combinations',
            severity: ValidationSeverity.ERROR,
            metadata: {
              duplicateCount: context.variants.length - uniqueAttrSets.size
            }
          });
        }
        
        return issues;
      }
    });
    
    // Add more rules based on ADR requirements...
    
    this.logger.log(`Initialized ${this.rules.length} validation rules`);
  }
  
  /**
   * Calculate validation score
   */
  private calculateValidationScore(
    product: Product,
    errors: ValidationIssue[],
    warnings: ValidationIssue[],
    info: ValidationIssue[]
  ): number {
    // Base score starts at 100
    let score = 100;
    
    // Each error reduces score significantly
    score -= errors.length * 15;
    
    // Each warning reduces score moderately
    score -= warnings.length * 5;
    
    // Each info reduces score slightly
    score -= info.length * 1;
    
    // Bonus for completeness
    if (product.images?.gallery?.length >= 3) {
      score += 5;
    }
    
    if (product.attributes?.length >= 5) {
      score += 5;
    }
    
    if (product.seo?.metaTitle && product.seo?.metaDescription) {
      score += 5;
    }
    
    if (product.dimensions && product.weight) {
      score += 5;
    }
    
    // Cap score between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  /**
   * Get valid fields (fields without issues)
   */
  private getValidFields(product: Product, invalidFields: string[]): string[] {
    // Get all potential fields from the product
    const allFields = [
      'name',
      'sku',
      'description',
      'shortDescription',
      'status',
      'type',
      'categories',
      'pricing',
      'weight',
      'dimensions',
      'images',
      'attributes',
      'stock',
      'seo',
      'regional',
      'compliance',
      'tags'
    ];
    
    // Filter out invalid fields and fields that don't exist on the product
    return allFields.filter(field => {
      return !invalidFields.includes(field) && 
        (product[field] !== undefined && product[field] !== null);
    });
  }
  
  /**
   * Check if a product is an electronics product
   */
  private isElectronicsProduct(product: Product, context: ValidationContext): boolean {
    // Check categories
    const categoryNames = product.categories.map(c => c.name.toLowerCase());
    
    return categoryNames.some(name => 
      name.includes('electronics') || 
      name.includes('computer') || 
      name.includes('phone') ||
      name.includes('mobile') ||
      name.includes('tablet') ||
      name.includes('tv') ||
      name.includes('audio') ||
      name.includes('camera')
    );
  }
  
  /**
   * Check if a product has a South African barcode
   */
  private hasSouthAfricanBarcode(product: Product): boolean {
    // Check in regional data
    if (product.regional?.southAfrica?.saBarcode) {
      return true;
    }
    
    // Check in attributes
    const barcodeAttribute = product.attributes.find(
      attr => attr.code === 'barcode' || attr.code === 'sa_barcode' || attr.code === 'ean'
    );
    
    return !!barcodeAttribute;
  }
  
  /**
   * Create a unique key for variant attribute combinations
   */
  private getVariantAttributeKey(attributes: ProductAttribute[]): string {
    if (!attributes || attributes.length === 0) {
      return '';
    }
    
    return attributes
      .filter(attr => attr.usedForVariants)
      .sort((a, b) => a.code.localeCompare(b.code))
      .map(attr => `${attr.code}:${attr.value}`)
      .join('|');
  }
  
  /**
   * Validate an image URL
   */
  private isValidImageUrl(url: string): boolean {
    // Simple URL validation
    try {
      const parsedUrl = new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Get available validation rules
   */
  getValidationRules(): Omit<ValidationRule, 'validator'>[] {
    // Return rules without the validator function (for API responses)
    return this.rules.map(({ validator, ...rule }) => rule);
  }
  
  /**
   * Run a specific validation rule
   */
  async runValidationRule(
    ruleId: string,
    product: Product,
    tenantId: string
  ): Promise<ValidationIssue[]> {
    const rule = this.rules.find(r => r.id === ruleId);
    
    if (!rule) {
      throw new Error(`Validation rule with ID ${ruleId} not found`);
    }
    
    const context: ValidationContext = {
      product,
      tenantId
    };
    
    return rule.validator(product, context);
  }
}