/**
 * Regional Configuration Service
 * 
 * This service provides enhanced regional support for the PIM module,
 * extending the existing market context architecture with more detailed
 * region-specific configurations and capabilities.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { MarketContextService } from '../market-context.service';
import { RegionalConfigurationRepository } from '../../repositories/regional-configuration.repository';
import { FeatureFlagService } from '../../../feature-flags';

/**
 * Region data including currencies, languages, and business rules
 */
export interface RegionConfiguration {
  /** Unique region identifier */
  id: string;
  
  /** Display name of region */
  name: string;
  
  /** ISO country code */
  countryCode: string;
  
  /** Whether this region is currently active */
  active: boolean;
  
  /** Primary currency code */
  primaryCurrency: string;
  
  /** Supported currency codes */
  supportedCurrencies: string[];
  
  /** Primary language code */
  primaryLanguage: string;
  
  /** Supported language codes */
  supportedLanguages: string[];
  
  /** Default time zone */
  timezone: string;
  
  /** Region-specific business rules */
  businessRules: {
    /** Default VAT/Tax rate */
    defaultTaxRate: number;
    
    /** Default shipping methods */
    defaultShippingMethods: string[];
    
    /** Default payment methods */
    defaultPaymentMethods: string[];
    
    /** Whether marketplace integration is enabled */
    enableMarketplaceIntegration: boolean;
    
    /** Whether multi-warehouse is enabled */
    enableMultiWarehouse: boolean;
    
    /** Whether load shedding resilience is enabled (South Africa) */
    enableLoadSheddingResilience: boolean;
    
    /** Whether network aware components are enabled */
    enableNetworkAwareComponents: boolean;
    
    /** Whether EU VAT compliance is needed */
    enableEuVatCompliance: boolean;
    
    /** Whether cross-border trading is enabled */
    enableCrossBorderTrading: boolean;
    
    /** Whether to enable African tax framework */
    enableAfricanTaxFramework: boolean;
    
    /** Whether to enable advanced compliance framework */
    enableAdvancedComplianceFramework: boolean;
    
    /** Custom region-specific settings */
    customSettings?: Record<string, any>;
  };
  
  /** Supported marketplaces */
  supportedMarketplaces: string[];
  
  /** Required product attributes for this region */
  requiredProductAttributes: string[];
  
  /** Regional pricing rules */
  pricingRules: {
    /** Price rounding rule */
    roundingRule: 'nearest' | 'up' | 'down';
    
    /** Round to nearest multiple */
    roundToNearest?: number;
    
    /** Psychological pricing ending (e.g. .99) */
    pricingEnding?: string;
    
    /** Minimum markup percentage */
    minimumMarkupPercentage?: number;
  };
  
  /** Localization settings */
  localization: {
    /** Date format */
    dateFormat: string;
    
    /** Number format */
    numberFormat: string;
    
    /** Currency format */
    currencyFormat: string;
    
    /** Address format */
    addressFormat: string;
  };
  
  /** Region-specific compliance requirements */
  complianceRequirements: {
    /** Required certifications */
    requiredCertifications: string[];
    
    /** Required documentation */
    requiredDocumentation: string[];
    
    /** Restricted product categories */
    restrictedCategories: string[];
    
    /** Warning labels required */
    warningLabelsRequired: boolean;
  };
  
  /** Regional warehouse information */
  warehouses?: {
    /** Default warehouse ID */
    defaultWarehouseId?: string;
    
    /** Regional warehouse IDs */
    regionalWarehouseIds?: string[];
  };
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Language information for regional support
 */
export interface LanguageConfiguration {
  /** Language code (e.g. 'en', 'fr', 'es') */
  code: string;
  
  /** Language name in English */
  nameInEnglish: string;
  
  /** Native language name */
  nativeName: string;
  
  /** RTL (right-to-left) language */
  isRtl: boolean;
  
  /** Date format */
  dateFormat: string;
  
  /** Time format */
  timeFormat: string;
  
  /** Number format */
  numberFormat: string;
  
  /** Currency format */
  currencyFormat: string;
  
  /** Active status */
  active: boolean;
}

/**
 * Currency information for regional support
 */
export interface CurrencyConfiguration {
  /** Currency code (e.g. 'USD', 'EUR', 'ZAR') */
  code: string;
  
  /** Currency name */
  name: string;
  
  /** Currency symbol */
  symbol: string;
  
  /** Default fraction digits */
  fractionDigits: number;
  
  /** Price rounding rule */
  roundingRule: 'nearest' | 'up' | 'down';
  
  /** Round to nearest multiple */
  roundToNearest?: number;
  
  /** Psychological pricing ending (e.g. .99) */
  pricingEnding?: string;
  
  /** Currency exchange rate to base currency */
  exchangeRate?: number;
  
  /** Last exchange rate update */
  exchangeRateUpdatedAt?: Date;
  
  /** Active status */
  active: boolean;
}

/**
 * Regional marketplace configuration
 */
export interface RegionalMarketplace {
  /** Marketplace ID */
  id: string;
  
  /** Marketplace name */
  name: string;
  
  /** Regions where this marketplace is available */
  availableRegions: string[];
  
  /** Required product attributes */
  requiredProductAttributes: string[];
  
  /** Default currency */
  defaultCurrency: string;
  
  /** Whether the marketplace is active */
  active: boolean;
  
  /** Special marketplace settings */
  settings?: Record<string, any>;
}

/**
 * Enhanced regional support service for the PIM module
 */
@Injectable()
export class RegionalConfigurationService {
  private readonly logger = new Logger(RegionalConfigurationService.name);
  
  // Cache for region configurations
  private configCache = new Map<string, RegionConfiguration>();
  private cacheTimestamp = new Date();
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds
  
  constructor(
    private readonly marketContextService: MarketContextService,
    private readonly regionalConfigRepository: RegionalConfigurationRepository,
    private readonly featureFlagService: FeatureFlagService,
    @Inject('PIM_MODULE_OPTIONS') private readonly pimOptions: any,
  ) {
    this.logger.log('Regional Configuration Service initialized');
  }
  
  /**
   * Get all available region configurations
   * 
   * @param tenantId The tenant ID
   * @returns List of region configurations
   */
  async getAllRegions(tenantId: string): Promise<RegionConfiguration[]> {
    return this.regionalConfigRepository.findAll(tenantId);
  }
  
  /**
   * Get region configuration by ID
   * 
   * @param regionId The region ID
   * @param tenantId The tenant ID
   * @returns Region configuration
   */
  async getRegionById(regionId: string, tenantId: string): Promise<RegionConfiguration> {
    // Check cache first
    const cacheKey = `${tenantId}:${regionId}`;
    
    // Verify cache freshness
    const now = new Date();
    if (now.getTime() - this.cacheTimestamp.getTime() > this.CACHE_TTL) {
      this.configCache.clear();
      this.cacheTimestamp = now;
    }
    
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }
    
    // Get from repository
    const region = await this.regionalConfigRepository.findById(regionId, tenantId);
    
    if (region) {
      this.configCache.set(cacheKey, region);
      return region;
    }
    
    throw new Error(`Region with ID ${regionId} not found`);
  }
  
  /**
   * Get region configuration by country code
   * 
   * @param countryCode The ISO country code
   * @param tenantId The tenant ID
   * @returns Region configuration
   */
  async getRegionByCountryCode(countryCode: string, tenantId: string): Promise<RegionConfiguration> {
    const regions = await this.regionalConfigRepository.findByCountryCode(countryCode, tenantId);
    
    if (regions.length > 0) {
      return regions[0];
    }
    
    throw new Error(`Region with country code ${countryCode} not found`);
  }
  
  /**
   * Create a new region configuration
   * 
   * @param region Region configuration data
   * @param tenantId The tenant ID
   * @returns Created region configuration
   */
  async createRegion(region: Omit<RegionConfiguration, 'createdAt' | 'updatedAt'>, tenantId: string): Promise<RegionConfiguration> {
    const newRegion: RegionConfiguration = {
      ...region,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const created = await this.regionalConfigRepository.create(newRegion, tenantId);
    
    // Update enabled regions in market context options
    await this.updateEnabledRegions(tenantId);
    
    // Clear cache
    this.configCache.clear();
    this.cacheTimestamp = new Date();
    
    return created;
  }
  
  /**
   * Update an existing region configuration
   * 
   * @param regionId The region ID
   * @param updates Region updates
   * @param tenantId The tenant ID
   * @returns Updated region configuration
   */
  async updateRegion(regionId: string, updates: Partial<RegionConfiguration>, tenantId: string): Promise<RegionConfiguration> {
    const existing = await this.getRegionById(regionId, tenantId);
    
    const updated: RegionConfiguration = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    
    const result = await this.regionalConfigRepository.update(updated, tenantId);
    
    // Clear cache for this region
    const cacheKey = `${tenantId}:${regionId}`;
    this.configCache.delete(cacheKey);
    
    return result;
  }
  
  /**
   * Delete a region configuration
   * 
   * @param regionId The region ID
   * @param tenantId The tenant ID
   * @returns Operation success
   */
  async deleteRegion(regionId: string, tenantId: string): Promise<boolean> {
    try {
      await this.regionalConfigRepository.delete(regionId, tenantId);
      
      // Clear cache for this region
      const cacheKey = `${tenantId}:${regionId}`;
      this.configCache.delete(cacheKey);
      
      // Update enabled regions in market context options
      await this.updateEnabledRegions(tenantId);
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete region ${regionId}: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Check if a specific region has a feature enabled
   * 
   * @param regionId The region ID
   * @param featureKey The feature key
   * @param tenantId The tenant ID
   * @returns Whether the feature is enabled
   */
  async isFeatureEnabledForRegion(regionId: string, featureKey: string, tenantId: string): Promise<boolean> {
    const region = await this.getRegionById(regionId, tenantId);
    
    // Check if the feature is directly specified in business rules
    const businessRuleKey = `enable${featureKey.charAt(0).toUpperCase() + featureKey.slice(1)}`;
    if (businessRuleKey in region.businessRules) {
      return region.businessRules[businessRuleKey] as boolean;
    }
    
    // Fall back to feature flag service
    const featureFlagKey = `pim.region.${regionId}.${featureKey}`;
    return this.featureFlagService.isEnabled(featureFlagKey, tenantId);
  }
  
  /**
   * Get all supported languages
   * 
   * @param tenantId The tenant ID
   * @returns List of supported languages
   */
  async getSupportedLanguages(tenantId: string): Promise<LanguageConfiguration[]> {
    // This would typically come from a database
    // For demonstration purposes, returning a static list
    return [
      {
        code: 'en',
        nameInEnglish: 'English',
        nativeName: 'English',
        isRtl: false,
        dateFormat: 'MM/dd/yyyy',
        timeFormat: 'h:mm a',
        numberFormat: '#,##0.00',
        currencyFormat: '¤#,##0.00',
        active: true,
      },
      {
        code: 'af',
        nameInEnglish: 'Afrikaans',
        nativeName: 'Afrikaans',
        isRtl: false,
        dateFormat: 'yyyy/MM/dd',
        timeFormat: 'HH:mm',
        numberFormat: '# ##0,00',
        currencyFormat: '¤# ##0,00',
        active: true,
      },
      {
        code: 'zu',
        nameInEnglish: 'Zulu',
        nativeName: 'isiZulu',
        isRtl: false,
        dateFormat: 'yyyy/MM/dd',
        timeFormat: 'HH:mm',
        numberFormat: '# ##0,00',
        currencyFormat: '¤# ##0,00',
        active: true,
      },
      {
        code: 'fr',
        nameInEnglish: 'French',
        nativeName: 'Français',
        isRtl: false,
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm',
        numberFormat: '# ##0,00',
        currencyFormat: '# ##0,00 ¤',
        active: true,
      },
      {
        code: 'pt',
        nameInEnglish: 'Portuguese',
        nativeName: 'Português',
        isRtl: false,
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm',
        numberFormat: '# ##0,00',
        currencyFormat: '¤# ##0,00',
        active: true,
      },
      {
        code: 'ar',
        nameInEnglish: 'Arabic',
        nativeName: 'العربية',
        isRtl: true,
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm',
        numberFormat: '#,##0.00',
        currencyFormat: '¤ #,##0.00',
        active: true,
      },
    ];
  }
  
  /**
   * Get all supported currencies
   * 
   * @param tenantId The tenant ID
   * @returns List of supported currencies
   */
  async getSupportedCurrencies(tenantId: string): Promise<CurrencyConfiguration[]> {
    // This would typically come from a database
    // For demonstration purposes, returning a static list
    return [
      {
        code: 'ZAR',
        name: 'South African Rand',
        symbol: 'R',
        fractionDigits: 2,
        roundingRule: 'nearest',
        roundToNearest: 0.01,
        pricingEnding: '.99',
        active: true,
      },
      {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        fractionDigits: 2,
        roundingRule: 'nearest',
        roundToNearest: 0.01,
        pricingEnding: '.99',
        exchangeRate: 18.5, // 1 USD = 18.5 ZAR
        exchangeRateUpdatedAt: new Date(),
        active: true,
      },
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        fractionDigits: 2,
        roundingRule: 'nearest',
        roundToNearest: 0.01,
        pricingEnding: '.99',
        exchangeRate: 20.2, // 1 EUR = 20.2 ZAR
        exchangeRateUpdatedAt: new Date(),
        active: true,
      },
      {
        code: 'NGN',
        name: 'Nigerian Naira',
        symbol: '₦',
        fractionDigits: 2,
        roundingRule: 'nearest',
        roundToNearest: 0.01,
        active: true,
      },
      {
        code: 'KES',
        name: 'Kenyan Shilling',
        symbol: 'KSh',
        fractionDigits: 2,
        roundingRule: 'nearest',
        roundToNearest: 0.01,
        active: true,
      },
      {
        code: 'EGP',
        name: 'Egyptian Pound',
        symbol: 'E£',
        fractionDigits: 2,
        roundingRule: 'nearest',
        roundToNearest: 0.01,
        active: true,
      },
    ];
  }
  
  /**
   * Get all supported marketplaces by region
   * 
   * @param regionId The region ID
   * @param tenantId The tenant ID
   * @returns List of supported marketplaces for the region
   */
  async getMarketplacesByRegion(regionId: string, tenantId: string): Promise<RegionalMarketplace[]> {
    const region = await this.getRegionById(regionId, tenantId);
    
    // Filter all marketplaces by those supported in this region
    const allMarketplaces = await this.getAllMarketplaces(tenantId);
    
    return allMarketplaces.filter(marketplace => 
      marketplace.availableRegions.includes(regionId) ||
      marketplace.availableRegions.includes(region.countryCode)
    );
  }
  
  /**
   * Get all supported marketplaces
   * 
   * @param tenantId The tenant ID
   * @returns List of all supported marketplaces
   */
  async getAllMarketplaces(tenantId: string): Promise<RegionalMarketplace[]> {
    // This would typically come from a database
    // For demonstration purposes, returning a static list
    return [
      {
        id: 'takealot',
        name: 'Takealot',
        availableRegions: ['south-africa', 'za'],
        requiredProductAttributes: ['barcode', 'title', 'brand', 'description'],
        defaultCurrency: 'ZAR',
        active: true,
        settings: {
          commissionRate: 0.15,
          fulfillmentOptions: ['takealot_express', 'marketplace_fulfilled'],
        },
      },
      {
        id: 'bidorbuy',
        name: 'Bidorbuy',
        availableRegions: ['south-africa', 'za'],
        requiredProductAttributes: ['barcode', 'title', 'brand', 'description'],
        defaultCurrency: 'ZAR',
        active: true,
        settings: {
          commissionRate: 0.10,
          supportsAuctions: true,
        },
      },
      {
        code: 'makro',
        name: 'Makro Online',
        availableRegions: ['south-africa', 'za'],
        requiredProductAttributes: ['barcode', 'title', 'brand', 'description'],
        defaultCurrency: 'ZAR',
        active: true,
        settings: {
          commissionRate: 0.12,
          supportsStorePickup: true,
        },
      },
      {
        id: 'jumia',
        name: 'Jumia',
        availableRegions: ['nigeria', 'kenya', 'egypt', 'morocco', 'algeria', 'ghana'],
        requiredProductAttributes: ['barcode', 'title', 'brand', 'description'],
        defaultCurrency: 'USD',
        active: true,
        settings: {
          commissionRate: 0.15,
        },
      },
      {
        id: 'konga',
        name: 'Konga',
        availableRegions: ['nigeria'],
        requiredProductAttributes: ['sku', 'title', 'brand', 'description'],
        defaultCurrency: 'NGN',
        active: true,
      },
      {
        id: 'kilimall',
        name: 'Kilimall',
        availableRegions: ['kenya', 'uganda', 'nigeria'],
        requiredProductAttributes: ['sku', 'title', 'brand', 'description'],
        defaultCurrency: 'USD',
        active: true,
      },
    ];
  }
  
  /**
   * Check if a region's currency price requires update
   * 
   * @param productId The product ID
   * @param regionId The region ID
   * @param tenantId The tenant ID
   * @returns Whether the price needs to be updated due to exchange rate changes
   */
  async checkCurrencyPriceUpdate(productId: string, regionId: string, tenantId: string): Promise<boolean> {
    // Implementation would check if exchange rates have changed
    // For demonstration purposes, returning a static value
    return true;
  }
  
  /**
   * Get localization settings for a region
   * 
   * @param regionId The region ID
   * @param languageCode The language code
   * @param tenantId The tenant ID
   * @returns Localization settings
   */
  async getLocalizationSettings(regionId: string, languageCode: string, tenantId: string): Promise<any> {
    const region = await this.getRegionById(regionId, tenantId);
    const languages = await this.getSupportedLanguages(tenantId);
    
    const language = languages.find(l => l.code === languageCode) || 
                     languages.find(l => l.code === region.primaryLanguage) ||
                     languages.find(l => l.code === 'en');
    
    return {
      region: region.name,
      country: region.countryCode,
      language: language.code,
      locale: `${language.code}-${region.countryCode.toUpperCase()}`,
      isRtl: language.isRtl,
      dateFormat: language.dateFormat,
      timeFormat: language.timeFormat,
      numberFormat: language.numberFormat,
      currencyFormat: language.currencyFormat,
      currency: region.primaryCurrency,
      timezone: region.timezone,
      addressFormat: region.localization.addressFormat,
    };
  }
  
  /**
   * Update enabled regions in market context options
   * 
   * @param tenantId The tenant ID
   */
  private async updateEnabledRegions(tenantId: string): Promise<void> {
    // Get all active regions
    const regions = await this.regionalConfigRepository.findAll(tenantId);
    const activeRegionIds = regions.filter(r => r.active).map(r => r.id);
    
    // This would typically update a global configuration
    // For demonstration purposes, just logging
    this.logger.log(`Updated enabled regions: ${activeRegionIds.join(', ')}`);
  }
  
  /**
   * Initialize default regions if none exist
   * 
   * @param tenantId The tenant ID
   */
  async initializeDefaultRegions(tenantId: string): Promise<void> {
    const regions = await this.regionalConfigRepository.findAll(tenantId);
    
    if (regions.length === 0) {
      // Create default South Africa region
      await this.createRegion({
        id: 'south-africa',
        name: 'South Africa',
        countryCode: 'za',
        active: true,
        primaryCurrency: 'ZAR',
        supportedCurrencies: ['ZAR', 'USD', 'EUR'],
        primaryLanguage: 'en',
        supportedLanguages: ['en', 'af', 'zu', 'xh', 'st', 'tn'],
        timezone: 'Africa/Johannesburg',
        businessRules: {
          defaultTaxRate: 0.15,
          defaultShippingMethods: ['courier', 'post_office', 'collection'],
          defaultPaymentMethods: ['credit_card', 'eft', 'paypal'],
          enableMarketplaceIntegration: true,
          enableMultiWarehouse: true,
          enableLoadSheddingResilience: true,
          enableNetworkAwareComponents: true,
          enableEuVatCompliance: false,
          enableCrossBorderTrading: true,
          enableAfricanTaxFramework: true,
          enableAdvancedComplianceFramework: true,
        },
        supportedMarketplaces: ['takealot', 'bidorbuy', 'makro'],
        requiredProductAttributes: ['title', 'description', 'barcode', 'brand'],
        pricingRules: {
          roundingRule: 'nearest',
          roundToNearest: 0.01,
          pricingEnding: '.99',
          minimumMarkupPercentage: 10,
        },
        localization: {
          dateFormat: 'yyyy/MM/dd',
          numberFormat: '# ##0,00',
          currencyFormat: '¤ # ##0,00',
          addressFormat: '{firstName} {lastName}\n{addressLine1}\n{addressLine2}\n{city}\n{postalCode}',
        },
        complianceRequirements: {
          requiredCertifications: ['sabs', 'nrcs', 'icasa'],
          requiredDocumentation: ['import_permit', 'compliance_certificate'],
          restrictedCategories: ['alcohol', 'weapons', 'pharmaceuticals'],
          warningLabelsRequired: true,
        },
        warehouses: {
          defaultWarehouseId: 'johannesburg-main',
          regionalWarehouseIds: ['cape-town-main', 'durban-main'],
        },
      }, tenantId);
      
      // Create default Nigeria region
      await this.createRegion({
        id: 'nigeria',
        name: 'Nigeria',
        countryCode: 'ng',
        active: true,
        primaryCurrency: 'NGN',
        supportedCurrencies: ['NGN', 'USD'],
        primaryLanguage: 'en',
        supportedLanguages: ['en', 'yo', 'ha', 'ig'],
        timezone: 'Africa/Lagos',
        businessRules: {
          defaultTaxRate: 0.075,
          defaultShippingMethods: ['courier', 'collection'],
          defaultPaymentMethods: ['credit_card', 'bank_transfer', 'cash_on_delivery'],
          enableMarketplaceIntegration: true,
          enableMultiWarehouse: true,
          enableLoadSheddingResilience: true,
          enableNetworkAwareComponents: true,
          enableEuVatCompliance: false,
          enableCrossBorderTrading: true,
          enableAfricanTaxFramework: true,
          enableAdvancedComplianceFramework: true,
        },
        supportedMarketplaces: ['jumia', 'konga'],
        requiredProductAttributes: ['title', 'description', 'brand'],
        pricingRules: {
          roundingRule: 'nearest',
          roundToNearest: 0.01,
          pricingEnding: '.00',
        },
        localization: {
          dateFormat: 'dd/MM/yyyy',
          numberFormat: '#,##0.00',
          currencyFormat: '¤#,##0.00',
          addressFormat: '{firstName} {lastName}\n{addressLine1}\n{city}, {state}\n{postalCode}',
        },
        complianceRequirements: {
          requiredCertifications: ['son', 'nafdac'],
          requiredDocumentation: ['import_documentation'],
          restrictedCategories: ['alcohol', 'weapons', 'pharmaceuticals'],
          warningLabelsRequired: true,
        },
        warehouses: {
          defaultWarehouseId: 'lagos-main',
          regionalWarehouseIds: ['abuja-main', 'port-harcourt-main'],
        },
      }, tenantId);
      
      // Create default Kenya region
      await this.createRegion({
        id: 'kenya',
        name: 'Kenya',
        countryCode: 'ke',
        active: true,
        primaryCurrency: 'KES',
        supportedCurrencies: ['KES', 'USD'],
        primaryLanguage: 'en',
        supportedLanguages: ['en', 'sw'],
        timezone: 'Africa/Nairobi',
        businessRules: {
          defaultTaxRate: 0.16,
          defaultShippingMethods: ['courier', 'collection'],
          defaultPaymentMethods: ['credit_card', 'mpesa', 'cash_on_delivery'],
          enableMarketplaceIntegration: true,
          enableMultiWarehouse: true,
          enableLoadSheddingResilience: false,
          enableNetworkAwareComponents: true,
          enableEuVatCompliance: false,
          enableCrossBorderTrading: true,
          enableAfricanTaxFramework: true,
          enableAdvancedComplianceFramework: true,
        },
        supportedMarketplaces: ['jumia', 'kilimall'],
        requiredProductAttributes: ['title', 'description', 'brand'],
        pricingRules: {
          roundingRule: 'nearest',
          roundToNearest: 0.01,
        },
        localization: {
          dateFormat: 'dd/MM/yyyy',
          numberFormat: '#,##0.00',
          currencyFormat: '¤#,##0.00',
          addressFormat: '{firstName} {lastName}\n{addressLine1}\n{city}\n{postalCode}',
        },
        complianceRequirements: {
          requiredCertifications: ['kebs'],
          requiredDocumentation: ['import_documentation'],
          restrictedCategories: ['alcohol', 'weapons', 'pharmaceuticals'],
          warningLabelsRequired: true,
        },
        warehouses: {
          defaultWarehouseId: 'nairobi-main',
          regionalWarehouseIds: ['mombasa-main'],
        },
      }, tenantId);
      
      // Create default Egypt region
      await this.createRegion({
        id: 'egypt',
        name: 'Egypt',
        countryCode: 'eg',
        active: true,
        primaryCurrency: 'EGP',
        supportedCurrencies: ['EGP', 'USD'],
        primaryLanguage: 'ar',
        supportedLanguages: ['ar', 'en'],
        timezone: 'Africa/Cairo',
        businessRules: {
          defaultTaxRate: 0.14,
          defaultShippingMethods: ['courier', 'collection'],
          defaultPaymentMethods: ['credit_card', 'cash_on_delivery'],
          enableMarketplaceIntegration: true,
          enableMultiWarehouse: true,
          enableLoadSheddingResilience: false,
          enableNetworkAwareComponents: true,
          enableEuVatCompliance: false,
          enableCrossBorderTrading: true,
          enableAfricanTaxFramework: true,
          enableAdvancedComplianceFramework: true,
        },
        supportedMarketplaces: ['jumia'],
        requiredProductAttributes: ['title', 'description', 'brand'],
        pricingRules: {
          roundingRule: 'nearest',
          roundToNearest: 0.01,
        },
        localization: {
          dateFormat: 'dd/MM/yyyy',
          numberFormat: '#,##0.00',
          currencyFormat: '¤#,##0.00',
          addressFormat: '{firstName} {lastName}\n{addressLine1}\n{city}\n{postalCode}',
        },
        complianceRequirements: {
          requiredCertifications: ['eos'],
          requiredDocumentation: ['import_documentation'],
          restrictedCategories: ['alcohol', 'weapons', 'pharmaceuticals'],
          warningLabelsRequired: true,
        },
        warehouses: {
          defaultWarehouseId: 'cairo-main',
          regionalWarehouseIds: ['alexandria-main'],
        },
      }, tenantId);
      
      // Log completion
      this.logger.log('Default regions initialized');
    }
  }
}