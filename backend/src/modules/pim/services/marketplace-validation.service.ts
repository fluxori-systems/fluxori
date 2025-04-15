/**
 * Marketplace Validation Service
 * 
 * This service validates product data against marketplace-specific requirements
 * to ensure products can be successfully listed on various marketplaces.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { Product } from '../models/product.model';
import { ProductVariant } from '../models/product-variant.model';
import { MarketContextService } from './market-context.service';

/**
 * Validation result for marketplace requirements
 */
export interface MarketplaceValidationResult {
  /**
   * Whether the product is valid for the marketplace
   */
  valid: boolean;
  
  /**
   * Validation errors keyed by field names
   */
  errors: Record<string, string[]>;
  
  /**
   * Validation warnings keyed by field names
   */
  warnings: Record<string, string[]>;
  
  /**
   * Recommendations for improvement
   */
  recommendations: string[];
  
  /**
   * Score from 0-100 indicating how well the product meets requirements
   */
  score: number;
  
  /**
   * Whether specific fields are valid
   */
  fields: Record<string, boolean>;
  
  /**
   * Metadata about the validation
   */
  metadata: Record<string, any>;
}

/**
 * Service that validates products against marketplace requirements
 */
@Injectable()
export class MarketplaceValidationService {
  private readonly logger = new Logger(MarketplaceValidationService.name);
  
  constructor(
    private readonly marketContextService: MarketContextService,
    @Inject('PIM_MODULE_OPTIONS') private readonly options: any
  ) {}
  
  /**
   * Validate a product against Takealot marketplace requirements
   * 
   * @param product - The product to validate
   * @param variants - Optional product variants
   * @returns Validation result
   */
  validateProductForTakealot(
    product: Product,
    variants?: ProductVariant[]
  ): MarketplaceValidationResult {
    this.logger.debug(`Validating product ${product.id} for Takealot`);
    
    const errors: Record<string, string[]> = {};
    const warnings: Record<string, string[]> = {};
    const recommendations: string[] = [];
    const fields: Record<string, boolean> = {};
    
    // Check required fields
    this.validateRequiredFields(product, errors, fields);
    
    // Check South African specific requirements
    this.validateSouthAfricanRequirements(product, errors, warnings, fields);
    
    // Check product attributes
    this.validateProductAttributes(product, errors, warnings, fields);
    
    // Check product content quality
    this.validateContentQuality(product, errors, warnings, recommendations, fields);
    
    // Validate variants if present
    if (variants && variants.length > 0) {
      this.validateVariants(variants, errors, warnings, fields);
    }
    
    // Calculate validation score
    const score = this.calculateValidationScore(errors, warnings, fields);
    
    return {
      valid: Object.keys(errors).length === 0,
      errors,
      warnings,
      recommendations,
      score,
      fields,
      metadata: {
        marketplace: 'takealot',
        variantCount: variants?.length || 0
      }
    };
  }
  
  /**
   * Validate required fields for a product
   */
  private validateRequiredFields(
    product: Product,
    errors: Record<string, string[]>,
    fields: Record<string, boolean>
  ): void {
    // Check name
    if (!product.name || product.name.length < 3) {
      errors.name = ['Product name is required and should be at least 3 characters long'];
      fields.name = false;
    } else {
      fields.name = true;
    }
    
    // Check description
    if (!product.description || product.description.length < 20) {
      errors.description = ['Product description is required and should be at least 20 characters long'];
      fields.description = false;
    } else {
      fields.description = true;
    }
    
    // Check pricing
    if (!product.pricing || !product.pricing.basePrice || product.pricing.basePrice <= 0) {
      errors.pricing = ['Valid product price is required'];
      fields.pricing = false;
    } else {
      fields.pricing = true;
    }
    
    // Check currency
    if (!product.pricing?.currency || product.pricing.currency !== 'ZAR') {
      errors.currency = ['Currency must be ZAR for Takealot'];
      fields.currency = false;
    } else {
      fields.currency = true;
    }
    
    // Check images
    if (!product.images?.main) {
      errors.images = ['At least one product image is required'];
      fields.images = false;
    } else {
      fields.images = true;
    }
    
    // Check stock
    if (!product.stock || product.stock.quantity === undefined) {
      errors.stock = ['Stock quantity is required'];
      fields.stock = false;
    } else {
      fields.stock = true;
    }
  }
  
  /**
   * Validate South African specific requirements
   */
  private validateSouthAfricanRequirements(
    product: Product,
    errors: Record<string, string[]>,
    warnings: Record<string, string[]>,
    fields: Record<string, boolean>
  ): void {
    // Check for South African barcode
    const hasBarcode = this.hasSouthAfricanBarcode(product);
    fields.barcode = hasBarcode;
    
    if (!hasBarcode) {
      warnings.barcode = ['South African barcode is recommended for Takealot listings'];
    }
    
    // Check for dimensions
    if (!product.dimensions || product.dimensions.length !== 3) {
      warnings.dimensions = ['Product dimensions are recommended for shipping calculations'];
      fields.dimensions = false;
    } else {
      fields.dimensions = true;
    }
    
    // Check for weight
    if (!product.weight || product.weight <= 0) {
      warnings.weight = ['Product weight is recommended for shipping calculations'];
      fields.weight = false;
    } else {
      fields.weight = true;
    }
    
    // Check for regulatory compliance
    this.validateRegulatoryCompliance(product, errors, warnings, fields);
  }
  
  /**
   * Check if product has a South African barcode
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
   * Validate regulatory compliance for South African products
   */
  private validateRegulatoryCompliance(
    product: Product,
    errors: Record<string, string[]>,
    warnings: Record<string, string[]>,
    fields: Record<string, boolean>
  ): void {
    // Check product category to determine required certifications
    const category = this.getCategoryType(product);
    
    if (category === 'electronics') {
      // Electronics require ICASA approval
      const hasIcasa = product.regional?.southAfrica?.icasaApproved || 
        product.compliance?.southAfrica?.icasa;
      
      fields.icasa = !!hasIcasa;
      
      if (!hasIcasa) {
        warnings.compliance = warnings.compliance || [];
        warnings.compliance.push('ICASA approval is recommended for electronic products');
      }
    } else if (category === 'appliances') {
      // Appliances may require SABS approval
      const hasSabs = product.regional?.southAfrica?.sabsApproved || 
        product.compliance?.southAfrica?.sabs;
      
      fields.sabs = !!hasSabs;
      
      if (!hasSabs) {
        warnings.compliance = warnings.compliance || [];
        warnings.compliance.push('SABS approval may be required for certain appliances');
      }
    }
    
    // NRCS is required for certain product categories
    if (this.requiresNrcs(product)) {
      const hasNrcs = product.regional?.southAfrica?.nrcsApproved || 
        product.compliance?.southAfrica?.nrcs;
      
      fields.nrcs = !!hasNrcs;
      
      if (!hasNrcs) {
        errors.compliance = errors.compliance || [];
        errors.compliance.push('NRCS approval is required for this product category');
      }
    }
  }
  
  /**
   * Get general category type for a product
   */
  private getCategoryType(product: Product): string {
    // This is a simplified implementation
    // In a real system, you would use the category hierarchy
    
    const categoryNames = product.categories.map(c => c.name.toLowerCase());
    
    if (categoryNames.some(name => 
      name.includes('electronics') || 
      name.includes('computer') || 
      name.includes('phone') ||
      name.includes('audio') ||
      name.includes('video')
    )) {
      return 'electronics';
    }
    
    if (categoryNames.some(name => 
      name.includes('appliance') || 
      name.includes('kitchen') || 
      name.includes('household')
    )) {
      return 'appliances';
    }
    
    return 'general';
  }
  
  /**
   * Check if a product requires NRCS approval
   */
  private requiresNrcs(product: Product): boolean {
    // This is a simplified implementation
    // In a real system, you would use the category hierarchy and product attributes
    
    const categoryNames = product.categories.map(c => c.name.toLowerCase());
    
    return categoryNames.some(name => 
      name.includes('electrical') || 
      name.includes('children') || 
      name.includes('toys') ||
      name.includes('safety')
    );
  }
  
  /**
   * Validate product attributes
   */
  private validateProductAttributes(
    product: Product,
    errors: Record<string, string[]>,
    warnings: Record<string, string[]>,
    fields: Record<string, boolean>
  ): void {
    // Check if product has sufficient attributes
    if (!product.attributes || product.attributes.length < 3) {
      warnings.attributes = ['Product should have at least 3 attributes for good marketplace visibility'];
      fields.attributeCount = false;
    } else {
      fields.attributeCount = true;
    }
    
    // Check specific important attributes
    const hasColor = product.attributes.some(attr => 
      attr.code === 'color' || attr.code === 'colour'
    );
    
    const hasBrand = product.attributes.some(attr => 
      attr.code === 'brand' || attr.code === 'manufacturer'
    );
    
    const hasMaterial = product.attributes.some(attr => 
      attr.code === 'material' || attr.code === 'fabric'
    );
    
    fields.hasColor = hasColor;
    fields.hasBrand = hasBrand;
    fields.hasMaterial = hasMaterial;
    
    if (!hasBrand) {
      warnings.brand = ['Brand information is important for marketplace search'];
    }
    
    if (!hasColor && this.isColorRelevant(product)) {
      warnings.color = ['Color information is helpful for this product type'];
    }
    
    if (!hasMaterial && this.isMaterialRelevant(product)) {
      warnings.material = ['Material information is helpful for this product type'];
    }
  }
  
  /**
   * Check if color is relevant for a product
   */
  private isColorRelevant(product: Product): boolean {
    // Simplified logic - in reality would be more sophisticated
    const categoryNames = product.categories.map(c => c.name.toLowerCase());
    
    return categoryNames.some(name => 
      name.includes('clothing') || 
      name.includes('fashion') || 
      name.includes('home') ||
      name.includes('furniture') ||
      name.includes('decor')
    );
  }
  
  /**
   * Check if material is relevant for a product
   */
  private isMaterialRelevant(product: Product): boolean {
    // Simplified logic - in reality would be more sophisticated
    const categoryNames = product.categories.map(c => c.name.toLowerCase());
    
    return categoryNames.some(name => 
      name.includes('clothing') || 
      name.includes('fashion') || 
      name.includes('home') ||
      name.includes('furniture') ||
      name.includes('decor')
    );
  }
  
  /**
   * Validate product content quality
   */
  private validateContentQuality(
    product: Product,
    errors: Record<string, string[]>,
    warnings: Record<string, string[]>,
    recommendations: string[],
    fields: Record<string, boolean>
  ): void {
    // Title quality
    if (product.name.length < 20) {
      warnings.titleLength = ['Title is shorter than recommended (20+ characters)'];
      fields.titleLength = false;
      recommendations.push('Extend the product title to include more keywords and details');
    } else if (product.name.length > 150) {
      warnings.titleLength = ['Title is longer than recommended (max 150 characters)'];
      fields.titleLength = false;
    } else {
      fields.titleLength = true;
    }
    
    // Description quality
    if (product.description.length < 100) {
      warnings.descriptionLength = ['Description is shorter than recommended (100+ characters)'];
      fields.descriptionLength = false;
      recommendations.push('Expand the product description with more details and features');
    } else if (product.description.length > 5000) {
      warnings.descriptionLength = ['Description is very long, consider making it more concise'];
      fields.descriptionLength = true;
    } else {
      fields.descriptionLength = true;
    }
    
    // Image count
    const imageCount = 1 + (product.images?.gallery?.length || 0);
    fields.imageCount = imageCount >= 3;
    
    if (imageCount < 3) {
      warnings.imageCount = ['Product should have at least 3 images for good presentation'];
      recommendations.push('Add more product images from different angles');
    }
  }
  
  /**
   * Validate product variants
   */
  private validateVariants(
    variants: ProductVariant[],
    errors: Record<string, string[]>,
    warnings: Record<string, string[]>,
    fields: Record<string, boolean>
  ): void {
    // Check variant SKUs
    const skus = variants.map(v => v.sku);
    const uniqueSkus = new Set(skus);
    
    if (uniqueSkus.size !== variants.length) {
      errors.variantSkus = ['All variant SKUs must be unique'];
      fields.variantSkus = false;
    } else {
      fields.variantSkus = true;
    }
    
    // Check variant prices
    const hasAllPrices = variants.every(v => v.pricing && v.pricing.basePrice > 0);
    fields.variantPrices = hasAllPrices;
    
    if (!hasAllPrices) {
      errors.variantPrices = ['All variants must have valid prices'];
    }
    
    // Check variant stocks
    const hasAllStocks = variants.every(v => v.stock && v.stock.quantity !== undefined);
    fields.variantStocks = hasAllStocks;
    
    if (!hasAllStocks) {
      errors.variantStocks = ['All variants must have stock information'];
    }
    
    // Check variant attributes
    const hasAllAttributes = variants.every(v => v.attributes && v.attributes.length > 0);
    fields.variantAttributes = hasAllAttributes;
    
    if (!hasAllAttributes) {
      errors.variantAttributes = ['All variants must have distinguishing attributes'];
    }
  }
  
  /**
   * Calculate a validation score based on errors and warnings
   */
  private calculateValidationScore(
    errors: Record<string, string[]>,
    warnings: Record<string, string[]>,
    fields: Record<string, boolean>
  ): number {
    // Count total fields checked
    const totalFields = Object.keys(fields).length;
    if (totalFields === 0) return 0;
    
    // Count valid fields
    const validFields = Object.values(fields).filter(Boolean).length;
    
    // Calculate raw score
    const rawScore = (validFields / totalFields) * 100;
    
    // Apply penalties
    const errorCount = Object.keys(errors).length;
    const warningCount = Object.keys(warnings).length;
    
    // Each error reduces score by 10 points
    const errorPenalty = Math.min(50, errorCount * 10);
    
    // Each warning reduces score by 2 points
    const warningPenalty = Math.min(30, warningCount * 2);
    
    // Calculate final score
    let finalScore = Math.max(0, rawScore - errorPenalty - warningPenalty);
    
    // Round to nearest integer
    return Math.round(finalScore);
  }
  
  /**
   * Validate a product against Amazon marketplace requirements
   * (Placeholder for future implementation)
   */
  validateProductForAmazon(
    product: Product,
    variants?: ProductVariant[]
  ): MarketplaceValidationResult {
    // Placeholder implementation
    return {
      valid: false,
      errors: { implementation: ['Amazon validation not yet implemented'] },
      warnings: {},
      recommendations: [],
      score: 0,
      fields: {},
      metadata: {
        marketplace: 'amazon',
        status: 'not_implemented'
      }
    };
  }
  
  /**
   * Validate a product against requirements for a specific marketplace
   * 
   * @param product - The product to validate
   * @param marketplaceId - Marketplace ID (e.g., 'takealot', 'amazon')
   * @param variants - Optional product variants
   * @returns Validation result
   */
  validateProduct(
    product: Product,
    marketplaceId: string,
    variants?: ProductVariant[]
  ): MarketplaceValidationResult {
    switch (marketplaceId.toLowerCase()) {
      case 'takealot':
        return this.validateProductForTakealot(product, variants);
      case 'amazon':
        return this.validateProductForAmazon(product, variants);
      default:
        return {
          valid: false,
          errors: { marketplace: [`Validation for ${marketplaceId} not supported`] },
          warnings: {},
          recommendations: [],
          score: 0,
          fields: {},
          metadata: {
            marketplace: marketplaceId,
            status: 'not_supported'
          }
        };
    }
  }
}