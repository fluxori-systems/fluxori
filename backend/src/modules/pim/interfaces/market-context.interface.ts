/**
 * Market Context Interface
 *
 * Interface and service for handling market-specific functionality
 */

import { MarketContext } from './types';

/**
 * Market context provider options
 */
export interface MarketContextProviderOptions {
  /**
   * Default region to use when no specific region is determined
   */
  defaultRegion: string;

  /**
   * Enabled regions for this application instance
   */
  enabledRegions: string[];

  /**
   * Default currency for each region
   */
  regionCurrencies: Record<string, string>;

  /**
   * Region-specific features configuration
   */
  regionalFeatures?: Record<
    string,
    {
      loadSheddingResilience?: boolean;
      networkAwareComponents?: boolean;
      multiWarehouseSupport?: boolean;
      euVatCompliance?: boolean;
      marketplaceIntegration?: boolean;
      [key: string]: boolean | undefined;
    }
  >;
}

/**
 * Interface for the market context provider
 */
export interface IMarketContextProvider {
  /**
   * Get the market context for a specific organization
   *
   * @param organizationId The organization ID
   * @returns The market context
   */
  getMarketContext(organizationId: string): Promise<MarketContext>;

  /**
   * Get the market context using region and country
   *
   * @param region The region code
   * @param country The country code
   * @returns The market context
   */
  getMarketContextByRegion(
    region: string,
    country: string,
  ): Promise<MarketContext>;

  /**
   * Check if a specific feature is available in the given market context
   *
   * @param feature The feature name
   * @param context The market context
   * @returns Whether the feature is available
   */
  isFeatureAvailable(feature: string, context: MarketContext): Promise<boolean>;

  /**
   * Get VAT rate for a specific region and date
   *
   * @param region The region code
   * @param date The date to check (defaults to current date)
   * @returns The applicable VAT rate as a decimal (e.g., 0.15 for 15%)
   */
  getVatRate(region: string, date?: Date): Promise<number>;

  /**
   * Get all available regions
   *
   * @returns List of available regions
   */
  getAvailableRegions(): Promise<string[]>;
}

/**
 * Market feature enum - standard feature names
 */
export enum MarketFeature {
  LOAD_SHEDDING_RESILIENCE = 'loadSheddingResilience',
  NETWORK_AWARE_COMPONENTS = 'networkAwareComponents',
  MULTI_WAREHOUSE_SUPPORT = 'multiWarehouseSupport',
  EU_VAT_COMPLIANCE = 'euVatCompliance',
  MARKETPLACE_INTEGRATION = 'marketplaceIntegration',
}
