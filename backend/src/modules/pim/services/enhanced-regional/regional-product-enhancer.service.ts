/**
 * Regional Product Enhancer Service
 * 
 * This service extends product models with region-specific attributes,
 * pricing, and validation rules based on the enhanced regional framework.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { MarketContextService } from '../market-context.service';
import { RegionalConfigurationService } from './regional-configuration.service';
import { ProductRepository } from '../../repositories/product.repository';
import { ProductVariantRepository } from '../../repositories/product-variant.repository';
import { ProductAttributeRepository } from '../../repositories/product-attribute.repository';

/**
 * Regional product attributes
 */
export interface RegionalProductAttributes {
  /** Region ID */
  regionId: string;
  
  /** Region-specific name */
  name?: string;
  
  /** Region-specific description */
  description?: string;
  
  /** Region-specific search keywords */
  searchKeywords?: string[];
  
  /** Region-specific price */
  price?: {
    /** Base price in regional currency */
    basePrice: number;
    
    /** Currency code */
    currencyCode: string;
    
    /** Whether price includes VAT */
    includesVat: boolean;
    
    /** Special price */
    specialPrice?: number;
    
    /** Special price start date */
    specialPriceFromDate?: Date;
    
    /** Special price end date */
    specialPriceToDate?: Date;
  };
  
  /** Region-specific status */
  status?: 'active' | 'inactive' | 'pending';
  
  /** Region-specific visibility */
  visibility?: 'visible' | 'hidden' | 'search_only' | 'catalog_only';
  
  /** Region-specific URL key */
  urlKey?: string;
  
  /** Region-specific custom attributes */
  customAttributes?: Record<string, any>;
  
  /** Region-specific marketplace attributes */
  marketplaceAttributes?: Record<string, any>;
  
  /** Region-specific tax class */
  taxClass?: string;
  
  /** Region-specific shipping class */
  shippingClass?: string;
  
  /** Last updated timestamp */
  updatedAt: Date;
}

/**
 * Regional validation result
 */
export interface RegionalValidationResult {
  /** Region ID */
  regionId: string;
  
  /** Is the product valid for this region */
  isValid: boolean;
  
  /** Validation issues */
  issues: Array<{
    /** Issue field */
    field: string;
    
    /** Issue message */
    message: string;
    
    /** Issue severity */
    severity: 'error' | 'warning' | 'info';
  }>;
  
  /** Missing required attributes */
  missingAttributes: string[];
  
  /** Invalid attribute values */
  invalidValues: Record<string, string>;
  
  /** Marketplace-specific validation */
  marketplaceValidation?: Record<string, {
    isValid: boolean;
    issues: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning' | 'info';
    }>;
  }>;
}

/**
 * Regional price information
 */
export interface RegionalPrice {
  /** Region ID */
  regionId: string;
  
  /** Region name */
  regionName: string;
  
  /** Price in regional currency */
  price: number;
  
  /** Currency code */
  currencyCode: string;
  
  /** Currency symbol */
  currencySymbol: string;
  
  /** Formatted price with currency */
  formattedPrice: string;
  
  /** Whether price includes VAT */
  includesVat: boolean;
  
  /** VAT amount */
  vatAmount?: number;
  
  /** VAT rate */
  vatRate?: number;
  
  /** Special price */
  specialPrice?: number;
  
  /** Formatted special price */
  formattedSpecialPrice?: string;
  
  /** Discount percentage */
  discountPercentage?: number;
  
  /** Special price start date */
  specialPriceFromDate?: Date;
  
  /** Special price end date */
  specialPriceToDate?: Date;
  
  /** Is special price active */
  isSpecialPriceActive?: boolean;
}

/**
 * Service for enhancing products with regional data
 */
@Injectable()
export class RegionalProductEnhancerService {
  private readonly logger = new Logger(RegionalProductEnhancerService.name);
  
  constructor(
    private readonly marketContextService: MarketContextService,
    private readonly regionalConfigService: RegionalConfigurationService,
    private readonly productRepository: ProductRepository,
    private readonly productVariantRepository: ProductVariantRepository,
    private readonly productAttributeRepository: ProductAttributeRepository,
    @Inject('PIM_MODULE_OPTIONS') private readonly pimOptions: any,
  ) {
    this.logger.log('Regional Product Enhancer Service initialized');
  }
  
  /**
   * Validate product for a specific region
   * 
   * @param productId Product ID
   * @param regionId Region ID
   * @param tenantId Tenant ID
   * @returns Validation result
   */
  async validateProductForRegion(
    productId: string,
    regionId: string,
    tenantId: string,
  ): Promise<RegionalValidationResult> {
    // Get product data
    const product = await this.productRepository.findById(productId, tenantId);
    
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    // Get region configuration
    const region = await this.regionalConfigService.getRegionById(regionId, tenantId);
    
    // Initialize validation result
    const validationResult: RegionalValidationResult = {
      regionId,
      isValid: true,
      issues: [],
      missingAttributes: [],
      invalidValues: {},
      marketplaceValidation: {},
    };
    
    // Check required attributes
    const missingAttributes = region.requiredProductAttributes.filter(
      attr => !product.attributes || !product.attributes[attr]
    );
    
    if (missingAttributes.length > 0) {
      validationResult.isValid = false;
      validationResult.missingAttributes = missingAttributes;
      
      missingAttributes.forEach(attr => {
        validationResult.issues.push({
          field: attr,
          message: `Missing required attribute for ${region.name}: ${attr}`,
          severity: 'error',
        });
      });
    }
    
    // Check regional attributes
    const regionalData = product.regionalData?.find(
      r => r.regionId === regionId
    );
    
    if (!regionalData || !regionalData.price) {
      validationResult.isValid = false;
      validationResult.issues.push({
        field: 'price',
        message: `Missing price for ${region.name}`,
        severity: 'error',
      });
    }
    
    // Check marketplace validation for the region's supported marketplaces
    for (const marketplaceId of region.supportedMarketplaces) {
      // In a real implementation, call marketplace validation for each one
      const isMarketplaceValid = await this.validateForMarketplace(
        product,
        marketplaceId,
        regionId,
        tenantId,
      );
      
      validationResult.marketplaceValidation[marketplaceId] = isMarketplaceValid;
      
      if (!isMarketplaceValid.isValid) {
        validationResult.isValid = false;
        
        isMarketplaceValid.issues.forEach(issue => {
          validationResult.issues.push({
            field: `${marketplaceId}.${issue.field}`,
            message: `${marketplaceId}: ${issue.message}`,
            severity: issue.severity,
          });
        });
      }
    }
    
    return validationResult;
  }
  
  /**
   * Get all region-specific data for a product
   * 
   * @param productId Product ID
   * @param tenantId Tenant ID
   * @returns Regional product attributes for all regions
   */
  async getProductRegionalData(
    productId: string,
    tenantId: string,
  ): Promise<RegionalProductAttributes[]> {
    // Get product data
    const product = await this.productRepository.findById(productId, tenantId);
    
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    return product.regionalData || [];
  }
  
  /**
   * Get region-specific data for a product
   * 
   * @param productId Product ID
   * @param regionId Region ID
   * @param tenantId Tenant ID
   * @returns Regional product attributes for the specified region
   */
  async getProductRegionalDataForRegion(
    productId: string,
    regionId: string,
    tenantId: string,
  ): Promise<RegionalProductAttributes | null> {
    // Get product data
    const product = await this.productRepository.findById(productId, tenantId);
    
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    return product.regionalData?.find(r => r.regionId === regionId) || null;
  }
  
  /**
   * Update region-specific data for a product
   * 
   * @param productId Product ID
   * @param regionId Region ID
   * @param regionalData Regional data to update
   * @param tenantId Tenant ID
   * @returns Updated product
   */
  async updateProductRegionalData(
    productId: string,
    regionId: string,
    regionalData: Partial<RegionalProductAttributes>,
    tenantId: string,
  ): Promise<any> {
    // Get product data
    const product = await this.productRepository.findById(productId, tenantId);
    
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    // Initialize regionalData array if it doesn't exist
    if (!product.regionalData) {
      product.regionalData = [];
    }
    
    // Find existing regional data or create new
    const existingIndex = product.regionalData.findIndex(
      r => r.regionId === regionId
    );
    
    if (existingIndex >= 0) {
      // Update existing data
      product.regionalData[existingIndex] = {
        ...product.regionalData[existingIndex],
        ...regionalData,
        updatedAt: new Date(),
      };
    } else {
      // Add new regional data
      product.regionalData.push({
        regionId,
        ...regionalData,
        updatedAt: new Date(),
      } as RegionalProductAttributes);
    }
    
    // Save updated product
    return this.productRepository.update(product, tenantId);
  }
  
  /**
   * Calculate regional prices for a product
   * 
   * @param productId Product ID
   * @param tenantId Tenant ID
   * @returns Regional prices for all active regions
   */
  async calculateRegionalPrices(
    productId: string,
    tenantId: string,
  ): Promise<RegionalPrice[]> {
    // Get product data
    const product = await this.productRepository.findById(productId, tenantId);
    
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    // Get all active regions
    const regions = await this.regionalConfigService.getAllRegions(tenantId);
    const activeRegions = regions.filter(r => r.active);
    
    // Get all currencies
    const currencies = await this.regionalConfigService.getSupportedCurrencies(tenantId);
    
    // Calculate regional prices
    const regionalPrices: RegionalPrice[] = [];
    
    for (const region of activeRegions) {
      // Find regional data for this region
      const regionalData = product.regionalData?.find(
        r => r.regionId === region.id
      );
      
      // Get currency for this region
      const currency = currencies.find(c => c.code === region.primaryCurrency);
      
      if (!currency) {
        this.logger.warn(`Currency not found for region ${region.id}: ${region.primaryCurrency}`);
        continue;
      }
      
      // Use regional price if available, otherwise convert from base price
      let price: number;
      let includesVat: boolean;
      let specialPrice: number | undefined;
      let specialPriceFromDate: Date | undefined;
      let specialPriceToDate: Date | undefined;
      
      if (regionalData?.price) {
        // Use regional price
        price = regionalData.price.basePrice;
        includesVat = regionalData.price.includesVat;
        specialPrice = regionalData.price.specialPrice;
        specialPriceFromDate = regionalData.price.specialPriceFromDate;
        specialPriceToDate = regionalData.price.specialPriceToDate;
      } else {
        // Convert from base price
        price = this.convertCurrency(
          product.pricing.basePrice,
          product.pricing.currency,
          region.primaryCurrency,
          currencies
        );
        includesVat = product.pricing.vatIncluded;
      }
      
      // Calculate VAT
      const vatRate = await this.marketContextService.getVatRate(region.id);
      let vatAmount: number | undefined;
      
      if (includesVat) {
        // Calculate VAT amount from inclusive price
        vatAmount = price - (price / (1 + vatRate));
      } else {
        // Calculate VAT amount to add
        vatAmount = price * vatRate;
      }
      
      // Format price according to regional settings
      const formattedPrice = this.formatPrice(
        price,
        currency,
        region.localization.currencyFormat
      );
      
      // Calculate and format special price if available
      let formattedSpecialPrice: string | undefined;
      let discountPercentage: number | undefined;
      let isSpecialPriceActive = false;
      
      if (specialPrice) {
        formattedSpecialPrice = this.formatPrice(
          specialPrice,
          currency,
          region.localization.currencyFormat
        );
        
        discountPercentage = Math.round(((price - specialPrice) / price) * 100);
        
        // Check if special price is active
        const now = new Date();
        isSpecialPriceActive = (
          (!specialPriceFromDate || now >= specialPriceFromDate) &&
          (!specialPriceToDate || now <= specialPriceToDate)
        );
      }
      
      // Add to regional prices
      regionalPrices.push({
        regionId: region.id,
        regionName: region.name,
        price,
        currencyCode: currency.code,
        currencySymbol: currency.symbol,
        formattedPrice,
        includesVat,
        vatAmount,
        vatRate,
        specialPrice,
        formattedSpecialPrice,
        discountPercentage,
        specialPriceFromDate,
        specialPriceToDate,
        isSpecialPriceActive,
      });
    }
    
    return regionalPrices;
  }
  
  /**
   * Auto-generate region-specific data for a product
   * 
   * @param productId Product ID
   * @param regionIds Region IDs to generate data for (all active regions if not specified)
   * @param tenantId Tenant ID
   * @returns Updated product
   */
  async generateRegionalData(
    productId: string,
    regionIds: string[] | undefined,
    tenantId: string,
  ): Promise<any> {
    // Get product data
    const product = await this.productRepository.findById(productId, tenantId);
    
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    // Get regions to generate data for
    let regions;
    
    if (regionIds && regionIds.length > 0) {
      // Get specific regions
      regions = await Promise.all(
        regionIds.map(id => this.regionalConfigService.getRegionById(id, tenantId))
      );
    } else {
      // Get all active regions
      const allRegions = await this.regionalConfigService.getAllRegions(tenantId);
      regions = allRegions.filter(r => r.active);
    }
    
    // Get currencies
    const currencies = await this.regionalConfigService.getSupportedCurrencies(tenantId);
    
    // Initialize regionalData array if it doesn't exist
    if (!product.regionalData) {
      product.regionalData = [];
    }
    
    // Generate data for each region
    for (const region of regions) {
      // Skip if regional data already exists for this region
      const existingIndex = product.regionalData.findIndex(
        r => r.regionId === region.id
      );
      
      if (existingIndex >= 0) {
        continue;
      }
      
      // Convert price to regional currency
      const basePrice = this.convertCurrency(
        product.pricing.basePrice,
        product.pricing.currency,
        region.primaryCurrency,
        currencies
      );
      
      // Apply regional price formatting rules
      const formattedPrice = this.applyPriceFormatting(
        basePrice,
        region.pricingRules
      );
      
      // Create regional data
      const regionalData: RegionalProductAttributes = {
        regionId: region.id,
        name: product.name,
        description: product.description,
        searchKeywords: product.searchKeywords,
        price: {
          basePrice: formattedPrice,
          currencyCode: region.primaryCurrency,
          includesVat: product.pricing.vatIncluded,
        },
        status: 'active',
        visibility: 'visible',
        urlKey: this.generateUrlKey(product.name, region.id),
        customAttributes: {},
        marketplaceAttributes: {},
        updatedAt: new Date(),
      };
      
      // Add to product regional data
      product.regionalData.push(regionalData);
    }
    
    // Save updated product
    return this.productRepository.update(product, tenantId);
  }
  
  /**
   * Bulk update regional data for multiple products
   * 
   * @param productIds Product IDs
   * @param regionId Region ID
   * @param updateData Data to update
   * @param tenantId Tenant ID
   * @returns Operation result
   */
  async bulkUpdateRegionalData(
    productIds: string[],
    regionId: string,
    updateData: Partial<RegionalProductAttributes>,
    tenantId: string,
  ): Promise<{ success: boolean; updatedCount: number; errors: any[] }> {
    const errors: any[] = [];
    let updatedCount = 0;
    
    // Update each product
    for (const productId of productIds) {
      try {
        await this.updateProductRegionalData(
          productId,
          regionId,
          updateData,
          tenantId
        );
        updatedCount++;
      } catch (error) {
        errors.push({
          productId,
          error: error.message,
        });
      }
    }
    
    return {
      success: errors.length === 0,
      updatedCount,
      errors,
    };
  }
  
  // Private helper methods
  
  /**
   * Validate product for a marketplace
   */
  private async validateForMarketplace(
    product: any,
    marketplaceId: string,
    regionId: string,
    tenantId: string,
  ): Promise<{
    isValid: boolean;
    issues: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning' | 'info';
    }>;
  }> {
    // In a real implementation, this would call marketplace-specific validation
    // For demonstration purposes, returning a mock result
    return {
      isValid: true,
      issues: [],
    };
  }
  
  /**
   * Convert currency using exchange rates
   */
  private convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    currencies: any[],
  ): number {
    // If currencies are the same, no conversion needed
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    // Find exchange rates
    const fromRate = currencies.find(c => c.code === fromCurrency)?.exchangeRate || 1;
    const toRate = currencies.find(c => c.code === toCurrency)?.exchangeRate || 1;
    
    // Convert amount
    // In a real implementation, use a more sophisticated exchange rate system
    // For demonstration purposes, using a simple conversion
    return amount * (toRate / fromRate);
  }
  
  /**
   * Format price according to currency and format string
   */
  private formatPrice(
    amount: number,
    currency: any,
    formatString: string,
  ): string {
    // In a real implementation, use proper number formatting
    // For demonstration purposes, using a simple approach
    return formatString
      .replace('¤', currency.symbol)
      .replace('#,##0.00', amount.toFixed(currency.fractionDigits));
  }
  
  /**
   * Apply regional price formatting rules
   */
  private applyPriceFormatting(
    price: number,
    pricingRules: any,
  ): number {
    // Apply rounding rule
    let formattedPrice = price;
    
    if (pricingRules.roundingRule === 'up') {
      formattedPrice = Math.ceil(formattedPrice / pricingRules.roundToNearest) * pricingRules.roundToNearest;
    } else if (pricingRules.roundingRule === 'down') {
      formattedPrice = Math.floor(formattedPrice / pricingRules.roundToNearest) * pricingRules.roundToNearest;
    } else {
      formattedPrice = Math.round(formattedPrice / pricingRules.roundToNearest) * pricingRules.roundToNearest;
    }
    
    // Apply pricing ending if specified
    if (pricingRules.pricingEnding) {
      const basePart = Math.floor(formattedPrice);
      const endingPart = parseFloat(pricingRules.pricingEnding);
      formattedPrice = basePart + endingPart;
    }
    
    return formattedPrice;
  }
  
  /**
   * Generate URL key for a product in a region
   */
  private generateUrlKey(
    productName: string,
    regionId: string,
  ): string {
    // In a real implementation, use proper URL key generation with slugification
    // For demonstration purposes, using a simple approach
    return productName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}