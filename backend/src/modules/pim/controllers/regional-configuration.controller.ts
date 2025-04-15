/**
 * Regional Configuration Controller
 * 
 * Controller for managing enhanced regional support
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
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../../common/guards/firebase-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { 
  RegionalConfigurationService, 
  RegionConfiguration, 
  LanguageConfiguration, 
  CurrencyConfiguration, 
  RegionalMarketplace 
} from '../services/enhanced-regional/regional-configuration.service';

/**
 * DTO for creating a region configuration
 */
class CreateRegionDto implements Partial<RegionConfiguration> {
  id: string;
  name: string;
  countryCode: string;
  active: boolean;
  primaryCurrency: string;
  supportedCurrencies: string[];
  primaryLanguage: string;
  supportedLanguages: string[];
  timezone: string;
  businessRules: {
    defaultTaxRate: number;
    defaultShippingMethods: string[];
    defaultPaymentMethods: string[];
    enableMarketplaceIntegration: boolean;
    enableMultiWarehouse: boolean;
    enableLoadSheddingResilience: boolean;
    enableNetworkAwareComponents: boolean;
    enableEuVatCompliance: boolean;
    enableCrossBorderTrading: boolean;
    enableAfricanTaxFramework: boolean;
    enableAdvancedComplianceFramework: boolean;
    customSettings?: Record<string, any>;
  };
  supportedMarketplaces: string[];
  requiredProductAttributes: string[];
  pricingRules: {
    roundingRule: 'nearest' | 'up' | 'down';
    roundToNearest?: number;
    pricingEnding?: string;
    minimumMarkupPercentage?: number;
  };
  localization: {
    dateFormat: string;
    numberFormat: string;
    currencyFormat: string;
    addressFormat: string;
  };
  complianceRequirements: {
    requiredCertifications: string[];
    requiredDocumentation: string[];
    restrictedCategories: string[];
    warningLabelsRequired: boolean;
  };
  warehouses?: {
    defaultWarehouseId?: string;
    regionalWarehouseIds?: string[];
  };
}

/**
 * DTO for updating a region configuration
 */
class UpdateRegionDto implements Partial<RegionConfiguration> {
  name?: string;
  countryCode?: string;
  active?: boolean;
  primaryCurrency?: string;
  supportedCurrencies?: string[];
  primaryLanguage?: string;
  supportedLanguages?: string[];
  timezone?: string;
  businessRules?: {
    defaultTaxRate?: number;
    defaultShippingMethods?: string[];
    defaultPaymentMethods?: string[];
    enableMarketplaceIntegration?: boolean;
    enableMultiWarehouse?: boolean;
    enableLoadSheddingResilience?: boolean;
    enableNetworkAwareComponents?: boolean;
    enableEuVatCompliance?: boolean;
    enableCrossBorderTrading?: boolean;
    enableAfricanTaxFramework?: boolean;
    enableAdvancedComplianceFramework?: boolean;
    customSettings?: Record<string, any>;
  };
  supportedMarketplaces?: string[];
  requiredProductAttributes?: string[];
  pricingRules?: {
    roundingRule?: 'nearest' | 'up' | 'down';
    roundToNearest?: number;
    pricingEnding?: string;
    minimumMarkupPercentage?: number;
  };
  localization?: {
    dateFormat?: string;
    numberFormat?: string;
    currencyFormat?: string;
    addressFormat?: string;
  };
  complianceRequirements?: {
    requiredCertifications?: string[];
    requiredDocumentation?: string[];
    restrictedCategories?: string[];
    warningLabelsRequired?: boolean;
  };
  warehouses?: {
    defaultWarehouseId?: string;
    regionalWarehouseIds?: string[];
  };
}

/**
 * Controller for regional configuration APIs
 */
@Controller('pim/regions')
@UseGuards(FirebaseAuthGuard)
export class RegionalConfigurationController {
  private readonly logger = new Logger(RegionalConfigurationController.name);
  
  constructor(
    private readonly regionalConfigService: RegionalConfigurationService,
  ) {
    this.logger.log('Regional Configuration Controller initialized');
  }
  
  /**
   * Get all region configurations
   */
  @Get()
  async getAllRegions(
    @GetUser() user: any,
    @Query('active') active?: boolean,
    @Query('currency') currency?: string,
    @Query('language') language?: string,
    @Query('marketplace') marketplace?: string,
  ) {
    try {
      if (active === true) {
        const regions = await this.regionalConfigService.getAllRegions(user.tenantId);
        return regions.filter(r => r.active);
      }
      
      if (currency) {
        const regions = await this.regionalConfigService.getAllRegions(user.tenantId);
        return regions.filter(r => 
          r.primaryCurrency === currency ||
          r.supportedCurrencies.includes(currency)
        );
      }
      
      if (language) {
        const regions = await this.regionalConfigService.getAllRegions(user.tenantId);
        return regions.filter(r => 
          r.primaryLanguage === language ||
          r.supportedLanguages.includes(language)
        );
      }
      
      if (marketplace) {
        const regions = await this.regionalConfigService.getAllRegions(user.tenantId);
        return regions.filter(r => 
          r.supportedMarketplaces.includes(marketplace)
        );
      }
      
      return this.regionalConfigService.getAllRegions(user.tenantId);
    } catch (error) {
      this.logger.error(`Error fetching region configurations: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch region configurations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  /**
   * Get a specific region configuration
   */
  @Get(':id')
  async getRegionById(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    try {
      return this.regionalConfigService.getRegionById(id, user.tenantId);
    } catch (error) {
      this.logger.error(`Error fetching region configuration: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch region configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  /**
   * Get a region configuration by country code
   */
  @Get('country/:countryCode')
  async getRegionByCountryCode(
    @Param('countryCode') countryCode: string,
    @GetUser() user: any,
  ) {
    try {
      return this.regionalConfigService.getRegionByCountryCode(countryCode, user.tenantId);
    } catch (error) {
      this.logger.error(`Error fetching region configuration: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch region configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  /**
   * Create a new region configuration
   */
  @Post()
  async createRegion(
    @Body() createRegionDto: CreateRegionDto,
    @GetUser() user: any,
  ) {
    try {
      return this.regionalConfigService.createRegion(createRegionDto, user.tenantId);
    } catch (error) {
      this.logger.error(`Error creating region configuration: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to create region configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  /**
   * Update an existing region configuration
   */
  @Put(':id')
  async updateRegion(
    @Param('id') id: string,
    @Body() updateRegionDto: UpdateRegionDto,
    @GetUser() user: any,
  ) {
    try {
      return this.regionalConfigService.updateRegion(id, updateRegionDto, user.tenantId);
    } catch (error) {
      this.logger.error(`Error updating region configuration: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to update region configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  /**
   * Delete a region configuration
   */
  @Delete(':id')
  async deleteRegion(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    try {
      const success = await this.regionalConfigService.deleteRegion(id, user.tenantId);
      return { success, message: success ? 'Region deleted successfully' : 'Failed to delete region' };
    } catch (error) {
      this.logger.error(`Error deleting region configuration: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to delete region configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  /**
   * Get supported languages
   */
  @Get('settings/languages')
  async getSupportedLanguages(
    @GetUser() user: any,
  ) {
    try {
      return this.regionalConfigService.getSupportedLanguages(user.tenantId);
    } catch (error) {
      this.logger.error(`Error fetching supported languages: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch supported languages: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  /**
   * Get supported currencies
   */
  @Get('settings/currencies')
  async getSupportedCurrencies(
    @GetUser() user: any,
  ) {
    try {
      return this.regionalConfigService.getSupportedCurrencies(user.tenantId);
    } catch (error) {
      this.logger.error(`Error fetching supported currencies: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch supported currencies: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  /**
   * Get all supported marketplaces
   */
  @Get('settings/marketplaces')
  async getAllMarketplaces(
    @GetUser() user: any,
  ) {
    try {
      return this.regionalConfigService.getAllMarketplaces(user.tenantId);
    } catch (error) {
      this.logger.error(`Error fetching marketplaces: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch marketplaces: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  /**
   * Get marketplaces for a specific region
   */
  @Get(':id/marketplaces')
  async getMarketplacesByRegion(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    try {
      return this.regionalConfigService.getMarketplacesByRegion(id, user.tenantId);
    } catch (error) {
      this.logger.error(`Error fetching marketplaces for region: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch marketplaces for region: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  /**
   * Get localization settings for a region and language
   */
  @Get(':id/localization')
  async getLocalizationSettings(
    @Param('id') id: string,
    @Query('language') language: string,
    @GetUser() user: any,
  ) {
    try {
      return this.regionalConfigService.getLocalizationSettings(id, language, user.tenantId);
    } catch (error) {
      this.logger.error(`Error fetching localization settings: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch localization settings: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  /**
   * Initialize default regions
   */
  @Post('settings/initialize')
  async initializeDefaultRegions(
    @GetUser() user: any,
  ) {
    try {
      await this.regionalConfigService.initializeDefaultRegions(user.tenantId);
      return { success: true, message: 'Default regions initialized successfully' };
    } catch (error) {
      this.logger.error(`Error initializing default regions: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to initialize default regions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  /**
   * Check if a region's feature is enabled
   */
  @Get(':id/features/:featureKey')
  async isFeatureEnabled(
    @Param('id') id: string,
    @Param('featureKey') featureKey: string,
    @GetUser() user: any,
  ) {
    try {
      const isEnabled = await this.regionalConfigService.isFeatureEnabledForRegion(
        id,
        featureKey,
        user.tenantId,
      );
      
      return { 
        feature: featureKey,
        region: id,
        enabled: isEnabled,
      };
    } catch (error) {
      this.logger.error(`Error checking region feature: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to check region feature: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}