/**
 * Market Context Service
 * 
 * Provides market-specific context information for the PIM module
 * including region detection, VAT rates, and feature availability
 */

import { Injectable, Inject } from '@nestjs/common';
import { IMarketContextProvider, MarketContextProviderOptions, MarketFeature } from '../interfaces/market-context.interface';
import { MarketContext } from '../interfaces/types';
import { SouthAfricanVat } from '../utils/south-african-vat';
import { FeatureFlagService } from '../../feature-flags';

/**
 * Market Context Service
 * 
 * This service determines the market context for a given organization
 * and provides access to market-specific features and configuration
 */
@Injectable()
export class MarketContextService implements IMarketContextProvider {
  /**
   * Constructor
   * 
   * @param featureFlagService The feature flag service
   * @param options Market context provider options
   */
  constructor(
    private readonly featureFlagService: FeatureFlagService,
    // Use type assertion instead of decorator
    private readonly options: MarketContextProviderOptions = {} as MarketContextProviderOptions
  ) {}

  /**
   * Get market context for an organization
   * 
   * @param organizationId The organization ID
   * @returns The market context
   */
  async getMarketContext(organizationId: string): Promise<MarketContext> {
    // In a real implementation, we would fetch organization settings
    // from a database to determine the organization's region
    
    // For now, use a simple approach based on the default region
    const region = this.options.defaultRegion;
    const country = this.getDefaultCountryForRegion(region);
    
    return this.getMarketContextByRegion(region, country);
  }

  /**
   * Get market context by explicit region and country
   * 
   * @param region The region code
   * @param country The country code
   * @returns The market context
   */
  async getMarketContextByRegion(region: string, country: string): Promise<MarketContext> {
    // Ensure this is a supported region
    if (!this.options.enabledRegions.includes(region)) {
      region = this.options.defaultRegion;
      country = this.getDefaultCountryForRegion(region);
    }
    
    // Get regional features configuration
    const regionalFeatures = this.options.regionalFeatures?.[region] || {};
    
    // Get VAT rate for this region
    const vatRate = await this.getVatRate(region);
    
    // Build the market context
    const context: MarketContext = {
      region,
      country,
      vatRate,
      defaultCurrency: this.options.regionCurrencies[region] || 'USD',
      features: {
        loadSheddingResilience: 
          !!regionalFeatures.loadSheddingResilience,
        networkAwareComponents: 
          !!regionalFeatures.networkAwareComponents,
        multiWarehouseSupport: 
          !!regionalFeatures.multiWarehouseSupport,
        euVatCompliance: 
          !!regionalFeatures.euVatCompliance,
        marketplaceIntegration: 
          !!regionalFeatures.marketplaceIntegration
      }
    };
    
    return context;
  }

  /**
   * Check if a feature is available in a given market context
   * 
   * @param feature The feature name
   * @param context The market context
   * @returns Whether the feature is available
   */
  async isFeatureAvailable(feature: string, context: MarketContext): Promise<boolean> {
    // First check if the feature is configured for this region
    if (feature in context.features) {
      const featureEnabled = context.features[feature as keyof typeof context.features];
      if (featureEnabled === false) {
        return false;
      }
    }
    
    // Then check if the feature is enabled via feature flags
    const featureFlagKey = `pim.${context.region}.${feature}`;
    return await this.featureFlagService.isEnabled(featureFlagKey, { 
      attributes: { defaultValue: true }
    });
  }

  /**
   * Get VAT rate for a region
   * 
   * @param region The region code
   * @param date The date to check (defaults to current date)
   * @returns The VAT rate as a decimal
   */
  async getVatRate(region: string, date: Date = new Date()): Promise<number> {
    switch (region) {
      case 'south-africa':
        // Use South African VAT utility
        const vatSchedule = SouthAfricanVat.getVatRateForDate(date);
        return vatSchedule.rate;
        
      case 'europe':
        // European VAT rates vary by country - would need a more complex implementation
        // This is a placeholder
        return 0.20; // 20% as a common EU VAT rate
        
      default:
        // Default VAT rate
        return 0.15; // 15% as a reasonable default
    }
  }

  /**
   * Get all available regions
   * 
   * @returns List of available regions
   */
  async getAvailableRegions(): Promise<string[]> {
    return [...this.options.enabledRegions];
  }
  
  /**
   * Get default country code for a region
   * 
   * @param region The region code
   * @returns The default country code
   */
  private getDefaultCountryForRegion(region: string): string {
    const countryMap: Record<string, string> = {
      'south-africa': 'za',
      'africa': 'za', // Default to South Africa for general Africa region
      'europe': 'gb', // Default to UK for Europe region
      'global': 'us'  // Default to US for global region
    };
    
    return countryMap[region] || 'us';
  }
}