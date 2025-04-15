import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { MarketContextService } from './market-context.service';
import { MarketFeature } from '../interfaces/market-context.interface';
import { WarehouseInfo } from '../interfaces/types';
import { FeatureFlagService } from '../../../modules/feature-flags/services/feature-flag.service';

/**
 * Regional warehouse information with enhanced fields
 */
export interface RegionalWarehouse extends WarehouseInfo {
  /**
   * Whether this is a default warehouse for the region
   */
  isRegionalDefault: boolean;

  /**
   * Priority for inventory allocation (lower is higher priority)
   */
  allocationPriority: number;

  /**
   * Whether this warehouse supports cross-border shipping
   */
  supportsCrossBorderShipping: boolean;

  /**
   * Supported countries for shipping from this warehouse
   */
  shippingCountries: string[];

  /**
   * Warehouse capacity utilization (0-100%)
   */
  capacityUtilization?: number;

  /**
   * Estimated lead times in days for different destinations
   */
  estimatedLeadTimes?: {
    domestic: number;
    regional: number;
    international: number;
  };

  /**
   * Currency used for warehouse operations
   */
  operatingCurrency: string;

  /**
   * Whether this warehouse is currently active for this region
   */
  isActiveForRegion: boolean;

  /**
   * Special capabilities of this warehouse
   */
  capabilities?: string[];

  /**
   * Regional tax and compliance information
   */
  taxAndCompliance?: {
    vat?: {
      registrationNumber?: string;
      registeredCountry?: string;
      ratePercent: number;
    };
    customsInfo?: {
      brokerName?: string;
      supportsFulfilledByMarketplace: boolean;
      supportsImportDocuments: boolean;
    };
  };
}

/**
 * Regional warehouse filter options
 */
export interface RegionalWarehouseFilter {
  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Filter by region
   */
  region?: string;

  /**
   * Filter by country
   */
  country?: string;

  /**
   * Filter by cross-border shipping support
   */
  supportsCrossBorderShipping?: boolean;

  /**
   * Filter warehouses that can ship to this country
   */
  canShipToCountry?: string;

  /**
   * Only include active warehouses
   */
  activeOnly?: boolean;

  /**
   * Only include warehouses with specific capabilities
   */
  requiredCapabilities?: string[];

  /**
   * Maximum utilization threshold (0-100%)
   */
  maxUtilization?: number;
}

/**
 * Regional warehouse allocation strategy
 */
export enum AllocationStrategy {
  /**
   * Allocate inventory from closest warehouse to destination
   */
  CLOSEST_TO_DESTINATION = 'closest_to_destination',

  /**
   * Allocate inventory from warehouse with highest stock level
   */
  HIGHEST_STOCK = 'highest_stock',

  /**
   * Allocate inventory from warehouse with highest priority
   */
  PRIORITY_BASED = 'priority_based',

  /**
   * Allocate inventory from warehouse with shortest lead time
   */
  SHORTEST_LEAD_TIME = 'shortest_lead_time',

  /**
   * Allocate inventory from default warehouse
   */
  DEFAULT_WAREHOUSE = 'default_warehouse',

  /**
   * Use smart allocation based on multiple factors
   */
  SMART = 'smart'
}

/**
 * RegionalWarehouseService
 * 
 * Service for managing regional warehouses across African markets
 * with multi-currency and cross-border trade support
 */
@Injectable()
export class RegionalWarehouseService {
  private readonly logger = new Logger(RegionalWarehouseService.name);

  // Cached warehouse data to reduce database calls
  private warehouseCache: Map<string, Map<string, RegionalWarehouse[]>> = new Map();
  private warehouseCacheTTL = 5 * 60 * 1000; // 5 minutes
  private lastCacheRefresh: Map<string, number> = new Map();

  constructor(
    @Inject('InventoryWarehouseService') private readonly inventoryWarehouseService: any,
    private readonly marketContextService: MarketContextService,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  /**
   * Get all regional warehouses for an organization
   * 
   * @param organizationId Organization ID
   * @returns Array of regional warehouses
   */
  async getRegionalWarehouses(organizationId: string): Promise<RegionalWarehouse[]> {
    // Check if multi-warehouse support is enabled for this organization
    const isEnabled = await this.isMultiWarehouseFeatureEnabled(organizationId);
    if (!isEnabled) {
      throw new Error('Multi-warehouse support is not enabled for this organization');
    }

    // Get market context to determine regional settings
    const marketContext = await this.marketContextService.getMarketContext(organizationId);

    // Attempt to get from cache first
    const cachedWarehouses = this.getCachedWarehouses(organizationId);
    if (cachedWarehouses) {
      return cachedWarehouses;
    }

    // Get warehouses from the inventory module
    const baseWarehouses = await this.inventoryWarehouseService.getWarehouses(organizationId);

    // Transform to regional warehouses with enhanced information
    const regionalWarehouses = await Promise.all(
      baseWarehouses.map(async (warehouse) => {
        return this.transformToRegionalWarehouse(warehouse, marketContext.region);
      })
    );

    // Cache the results
    this.cacheWarehouses(organizationId, regionalWarehouses);

    return regionalWarehouses;
  }

  /**
   * Get warehouses for a specific region
   * 
   * @param organizationId Organization ID
   * @param region Region code (e.g., 'south-africa', 'east-africa', 'west-africa')
   * @returns Array of regional warehouses
   */
  async getWarehousesByRegion(organizationId: string, region: string): Promise<RegionalWarehouse[]> {
    const allWarehouses = await this.getRegionalWarehouses(organizationId);
    return allWarehouses.filter(warehouse => warehouse.region === region && warehouse.isActiveForRegion);
  }

  /**
   * Get warehouses with advanced filtering
   * 
   * @param filter Filter options
   * @returns Filtered warehouses
   */
  async findWarehouses(filter: RegionalWarehouseFilter): Promise<RegionalWarehouse[]> {
    // Get all warehouses
    const allWarehouses = await this.getRegionalWarehouses(filter.organizationId);

    // Apply filters
    return allWarehouses.filter(warehouse => {
      // Region filter
      if (filter.region && warehouse.region !== filter.region) {
        return false;
      }

      // Country filter
      if (filter.country && warehouse.country !== filter.country) {
        return false;
      }

      // Cross-border shipping filter
      if (filter.supportsCrossBorderShipping !== undefined && 
          warehouse.supportsCrossBorderShipping !== filter.supportsCrossBorderShipping) {
        return false;
      }

      // Can ship to country filter
      if (filter.canShipToCountry && 
          !warehouse.shippingCountries.includes(filter.canShipToCountry)) {
        return false;
      }

      // Active only filter
      if (filter.activeOnly && !warehouse.isActiveForRegion) {
        return false;
      }

      // Required capabilities filter
      if (filter.requiredCapabilities && filter.requiredCapabilities.length > 0) {
        if (!warehouse.capabilities) return false;
        
        for (const capability of filter.requiredCapabilities) {
          if (!warehouse.capabilities.includes(capability)) {
            return false;
          }
        }
      }

      // Max utilization filter
      if (filter.maxUtilization !== undefined && 
          warehouse.capacityUtilization !== undefined &&
          warehouse.capacityUtilization > filter.maxUtilization) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get the default warehouse for a specific region
   * 
   * @param organizationId Organization ID
   * @param region Region code
   * @returns Default regional warehouse
   */
  async getDefaultWarehouseForRegion(organizationId: string, region: string): Promise<RegionalWarehouse> {
    const warehouses = await this.getWarehousesByRegion(organizationId, region);
    const defaultWarehouse = warehouses.find(w => w.isRegionalDefault);

    if (!defaultWarehouse) {
      throw new NotFoundException(`No default warehouse found for region ${region}`);
    }

    return defaultWarehouse;
  }

  /**
   * Set a warehouse as the default for a region
   * 
   * @param organizationId Organization ID
   * @param warehouseId Warehouse ID
   * @param region Region code
   * @returns Updated warehouse
   */
  async setDefaultWarehouseForRegion(organizationId: string, warehouseId: string, region: string): Promise<RegionalWarehouse> {
    this.logger.log(`Setting warehouse ${warehouseId} as default for region ${region}`);

    // First get all warehouses for the region
    const warehouses = await this.getWarehousesByRegion(organizationId, region);

    // Make sure the warehouse exists in this region
    const targetWarehouse = warehouses.find(w => w.warehouseId === warehouseId);
    if (!targetWarehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found in region ${region}`);
    }

    // TODO: In a real implementation, this would update the database
    // For now, we'll just update the cache to simulate this

    // Find the current default and unset it
    const currentDefault = warehouses.find(w => w.isRegionalDefault);
    if (currentDefault) {
      currentDefault.isRegionalDefault = false;
    }

    // Set the new default
    targetWarehouse.isRegionalDefault = true;

    // Clear the cache to force a refresh
    this.invalidateCache(organizationId);

    // For demonstration purposes, returning the updated warehouse
    return {
      ...targetWarehouse,
      isRegionalDefault: true
    };
  }

  /**
   * Get optimal warehouse for fulfillment using specified allocation strategy
   * 
   * @param organizationId Organization ID
   * @param productId Product ID
   * @param destinationCountry Destination country code
   * @param strategy Allocation strategy
   * @returns Optimal warehouse for fulfillment
   */
  async getOptimalWarehouse(
    organizationId: string,
    productId: string,
    destinationCountry: string,
    strategy: AllocationStrategy = AllocationStrategy.SMART
  ): Promise<RegionalWarehouse> {
    this.logger.log(`Finding optimal warehouse for product ${productId} shipping to ${destinationCountry} using strategy ${strategy}`);

    // Get all warehouses that can ship to this country
    const warehouses = await this.findWarehouses({
      organizationId,
      canShipToCountry: destinationCountry,
      activeOnly: true
    });

    if (warehouses.length === 0) {
      throw new NotFoundException(`No warehouses available that can ship to ${destinationCountry}`);
    }

    // Implement different strategies
    switch (strategy) {
      case AllocationStrategy.DEFAULT_WAREHOUSE:
        // Find the default warehouse for the appropriate region
        const defaultWarehouse = warehouses.find(w => w.isRegionalDefault);
        if (defaultWarehouse) return defaultWarehouse;
        break;

      case AllocationStrategy.PRIORITY_BASED:
        // Sort by allocation priority
        return warehouses.sort((a, b) => a.allocationPriority - b.allocationPriority)[0];

      case AllocationStrategy.SHORTEST_LEAD_TIME:
        // Get the warehouse with shortest lead time to this country
        return this.getWarehouseWithShortestLeadTime(warehouses, destinationCountry);

      case AllocationStrategy.SMART:
        // Implement a smart algorithm considering multiple factors
        return this.smartAllocation(warehouses, destinationCountry);

      // Add other strategies as needed
      default:
        // Default to priority-based if no valid strategy is specified
        return warehouses.sort((a, b) => a.allocationPriority - b.allocationPriority)[0];
    }

    // Fallback to the first warehouse if no specific one was selected
    return warehouses[0];
  }

  /**
   * Check if a warehouse can fulfill a product for a specific country
   * 
   * @param organizationId Organization ID
   * @param warehouseId Warehouse ID
   * @param productId Product ID
   * @param destinationCountry Destination country
   * @returns Whether the warehouse can fulfill the product
   */
  async canWarehouseFulfillProduct(
    organizationId: string,
    warehouseId: string,
    productId: string,
    destinationCountry: string
  ): Promise<{ canFulfill: boolean; reason?: string }> {
    try {
      // Get warehouse information
      const warehouse = await this.getWarehouseById(organizationId, warehouseId);

      // Check if warehouse is active for its region
      if (!warehouse.isActiveForRegion) {
        return { 
          canFulfill: false, 
          reason: 'Warehouse is not active for this region' 
        };
      }

      // Check if warehouse supports shipping to this country
      if (!warehouse.shippingCountries.includes(destinationCountry)) {
        return { 
          canFulfill: false, 
          reason: `Warehouse does not support shipping to ${destinationCountry}` 
        };
      }

      // TODO: In a real implementation, check stock levels and other constraints

      return { canFulfill: true };
    } catch (error) {
      this.logger.error(`Error checking if warehouse can fulfill product: ${error.message}`);
      return { 
        canFulfill: false, 
        reason: error.message 
      };
    }
  }

  /**
   * Get all countries that can be served from any warehouse
   * 
   * @param organizationId Organization ID
   * @returns Array of supported country codes
   */
  async getSupportedCountries(organizationId: string): Promise<string[]> {
    // Get all warehouses
    const warehouses = await this.getRegionalWarehouses(organizationId);

    // Collect all shipping countries
    const countriesSet = new Set<string>();
    for (const warehouse of warehouses) {
      if (warehouse.isActiveForRegion) {
        warehouse.shippingCountries.forEach(country => countriesSet.add(country));
      }
    }

    return Array.from(countriesSet);
  }

  /**
   * Get currencies used across all warehouses
   * 
   * @param organizationId Organization ID
   * @returns Array of currency codes
   */
  async getWarehouseCurrencies(organizationId: string): Promise<string[]> {
    // Get all warehouses
    const warehouses = await this.getRegionalWarehouses(organizationId);

    // Collect all currencies
    const currenciesSet = new Set<string>();
    for (const warehouse of warehouses) {
      if (warehouse.isActiveForRegion) {
        currenciesSet.add(warehouse.operatingCurrency);
      }
    }

    return Array.from(currenciesSet);
  }

  /**
   * Get warehouse by ID with enhanced regional information
   * 
   * @param organizationId Organization ID
   * @param warehouseId Warehouse ID
   * @returns Regional warehouse
   */
  async getWarehouseById(organizationId: string, warehouseId: string): Promise<RegionalWarehouse> {
    // Try cache first
    const cachedWarehouses = this.getCachedWarehouses(organizationId);
    if (cachedWarehouses) {
      const found = cachedWarehouses.find(w => w.warehouseId === warehouseId);
      if (found) return found;
    }

    // Get from inventory module
    const baseWarehouse = await this.inventoryWarehouseService.getWarehouseById(warehouseId);
    
    if (!baseWarehouse || baseWarehouse.organizationId !== organizationId) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    }

    // Get market context
    const marketContext = await this.marketContextService.getMarketContext(organizationId);

    // Transform to regional warehouse
    return this.transformToRegionalWarehouse(baseWarehouse, marketContext.region);
  }

  /**
   * Update warehouse regional settings
   * 
   * @param organizationId Organization ID
   * @param warehouseId Warehouse ID
   * @param updates Regional warehouse updates
   * @returns Updated regional warehouse
   */
  async updateWarehouseRegionalSettings(
    organizationId: string,
    warehouseId: string,
    updates: {
      supportsCrossBorderShipping?: boolean;
      shippingCountries?: string[];
      allocationPriority?: number;
      isActiveForRegion?: boolean;
      capabilities?: string[];
      estimatedLeadTimes?: {
        domestic: number;
        regional: number;
        international: number;
      };
      taxAndCompliance?: {
        vat?: {
          registrationNumber?: string;
          registeredCountry?: string;
          ratePercent: number;
        };
        customsInfo?: {
          brokerName?: string;
          supportsFulfilledByMarketplace: boolean;
          supportsImportDocuments: boolean;
        };
      };
    }
  ): Promise<RegionalWarehouse> {
    this.logger.log(`Updating regional settings for warehouse ${warehouseId}`);

    // Get the warehouse first
    const warehouse = await this.getWarehouseById(organizationId, warehouseId);

    // In a real implementation, this would update the database
    // For now, we'll just simulate the update in memory

    // Merge updates with existing data
    const updatedWarehouse: RegionalWarehouse = {
      ...warehouse,
      ...updates,
      // Ensure we don't replace the entire object for nested properties
      estimatedLeadTimes: updates.estimatedLeadTimes ? {
        ...warehouse.estimatedLeadTimes,
        ...updates.estimatedLeadTimes
      } : warehouse.estimatedLeadTimes,
      taxAndCompliance: updates.taxAndCompliance ? {
        ...warehouse.taxAndCompliance,
        ...updates.taxAndCompliance,
        vat: updates.taxAndCompliance.vat ? {
          ...warehouse.taxAndCompliance?.vat,
          ...updates.taxAndCompliance.vat
        } : warehouse.taxAndCompliance?.vat,
        customsInfo: updates.taxAndCompliance.customsInfo ? {
          ...warehouse.taxAndCompliance?.customsInfo,
          ...updates.taxAndCompliance.customsInfo
        } : warehouse.taxAndCompliance?.customsInfo
      } : warehouse.taxAndCompliance
    };

    // Invalidate cache
    this.invalidateCache(organizationId);

    return updatedWarehouse;
  }

  /**
   * Check if the multi-warehouse feature is enabled for an organization
   * 
   * @param organizationId Organization ID
   * @returns Whether the feature is enabled
   */
  private async isMultiWarehouseFeatureEnabled(organizationId: string): Promise<boolean> {
    // Check with feature flag service first (more specific)
    const featureFlagEnabled = await this.featureFlagService.isEnabled(
      'pim.africa.multi-warehouse-support', 
      organizationId
    );

    if (featureFlagEnabled) return true;

    // Check with market context as a fallback
    const marketContext = await this.marketContextService.getMarketContext(organizationId);
    const marketFeatureEnabled = await this.marketContextService.isFeatureAvailable(
      MarketFeature.MULTI_WAREHOUSE_SUPPORT,
      marketContext
    );

    return marketFeatureEnabled;
  }

  /**
   * Transform a basic warehouse to a regional warehouse with enhanced information
   * 
   * @param warehouse Base warehouse data
   * @param userRegion Current region from market context
   * @returns Enhanced regional warehouse
   */
  private async transformToRegionalWarehouse(
    warehouse: any,
    userRegion: string
  ): Promise<RegionalWarehouse> {
    // Determine warehouse region from address
    const warehouseRegion = this.getRegionFromCountry(warehouse.address.country);

    // For a real implementation, we'd get this data from the database
    // Here we're creating enhanced data based on available information
    const regionalWarehouse: RegionalWarehouse = {
      warehouseId: warehouse.id,
      name: warehouse.name,
      region: warehouseRegion,
      country: warehouse.address.country,
      city: warehouse.address.city,
      isRegionalDefault: warehouse.isDefault && warehouseRegion === userRegion,
      allocationPriority: warehouse.isDefault ? 1 : 5,
      supportsCrossBorderShipping: this.determineCrossBorderSupport(warehouse),
      shippingCountries: this.determineShippingCountries(warehouse),
      capacityUtilization: this.calculateCapacityUtilization(warehouse),
      estimatedLeadTimes: this.getEstimatedLeadTimes(warehouse),
      operatingCurrency: this.getCurrencyForCountry(warehouse.address.country),
      isActiveForRegion: warehouse.isActive,
      capabilities: this.determineWarehouseCapabilities(warehouse),
      taxAndCompliance: {
        vat: {
          registrationNumber: 'VAT12345', // Example
          registeredCountry: warehouse.address.country,
          ratePercent: this.getVatRateForCountry(warehouse.address.country)
        },
        customsInfo: {
          supportsFulfilledByMarketplace: true,
          supportsImportDocuments: true
        }
      }
    };

    return regionalWarehouse;
  }

  /**
   * Get warehouse with shortest lead time to a destination country
   * 
   * @param warehouses List of warehouses
   * @param destinationCountry Destination country
   * @returns Warehouse with shortest lead time
   */
  private getWarehouseWithShortestLeadTime(
    warehouses: RegionalWarehouse[],
    destinationCountry: string
  ): RegionalWarehouse {
    return warehouses.reduce((shortest, current) => {
      // Determine lead time type based on warehouse location relative to destination
      let leadTimeType: 'domestic' | 'regional' | 'international';
      
      if (current.country === destinationCountry) {
        leadTimeType = 'domestic';
      } else if (current.region === this.getRegionFromCountry(destinationCountry)) {
        leadTimeType = 'regional';
      } else {
        leadTimeType = 'international';
      }
      
      // Get lead times, defaulting to very high values if not defined
      const currentLeadTime = current.estimatedLeadTimes?.[leadTimeType] ?? 999;
      const shortestLeadTime = shortest.estimatedLeadTimes?.[leadTimeType] ?? 999;
      
      return currentLeadTime < shortestLeadTime ? current : shortest;
    }, warehouses[0]);
  }

  /**
   * Smart allocation algorithm considering multiple factors
   * 
   * @param warehouses List of warehouses
   * @param destinationCountry Destination country
   * @returns Optimal warehouse
   */
  private smartAllocation(
    warehouses: RegionalWarehouse[],
    destinationCountry: string
  ): RegionalWarehouse {
    // Score each warehouse based on multiple factors
    const scoredWarehouses = warehouses.map(warehouse => {
      let score = 0;
      
      // 1. Lead time score (lowest is best)
      let leadTimeType: 'domestic' | 'regional' | 'international';
      if (warehouse.country === destinationCountry) {
        leadTimeType = 'domestic';
        score += 30; // Bonus for domestic shipping
      } else if (warehouse.region === this.getRegionFromCountry(destinationCountry)) {
        leadTimeType = 'regional';
        score += 15; // Bonus for regional shipping
      } else {
        leadTimeType = 'international';
      }
      
      const leadTime = warehouse.estimatedLeadTimes?.[leadTimeType] ?? 10;
      score += Math.max(0, 20 - leadTime); // Higher score for lower lead time
      
      // 2. Priority score
      score += Math.max(0, 10 - warehouse.allocationPriority * 2);
      
      // 3. Capacity score
      if (warehouse.capacityUtilization !== undefined) {
        score += Math.max(0, 10 - Math.floor(warehouse.capacityUtilization / 10));
      }
      
      // 4. Default warehouse bonus
      if (warehouse.isRegionalDefault) {
        score += 10;
      }
      
      return { warehouse, score };
    });
    
    // Sort by score (highest first)
    scoredWarehouses.sort((a, b) => b.score - a.score);
    
    return scoredWarehouses[0].warehouse;
  }

  /**
   * Get cached warehouses for an organization
   * 
   * @param organizationId Organization ID
   * @returns Cached warehouses or undefined if not in cache
   */
  private getCachedWarehouses(organizationId: string): RegionalWarehouse[] | undefined {
    const lastRefresh = this.lastCacheRefresh.get(organizationId);
    const now = Date.now();
    
    // Check if cache is valid
    if (lastRefresh && now - lastRefresh < this.warehouseCacheTTL) {
      const orgCache = this.warehouseCache.get(organizationId);
      if (orgCache) {
        // Collect warehouses from all regions for this org
        const allWarehouses: RegionalWarehouse[] = [];
        for (const regionWarehouses of orgCache.values()) {
          allWarehouses.push(...regionWarehouses);
        }
        return allWarehouses;
      }
    }
    
    return undefined;
  }

  /**
   * Cache warehouses for an organization
   * 
   * @param organizationId Organization ID
   * @param warehouses Warehouses to cache
   */
  private cacheWarehouses(organizationId: string, warehouses: RegionalWarehouse[]): void {
    // Group warehouses by region
    const regionMap = new Map<string, RegionalWarehouse[]>();
    
    for (const warehouse of warehouses) {
      const region = warehouse.region;
      if (!regionMap.has(region)) {
        regionMap.set(region, []);
      }
      regionMap.get(region)!.push(warehouse);
    }
    
    // Store in cache
    this.warehouseCache.set(organizationId, regionMap);
    this.lastCacheRefresh.set(organizationId, Date.now());
  }

  /**
   * Invalidate cache for an organization
   * 
   * @param organizationId Organization ID
   */
  private invalidateCache(organizationId: string): void {
    this.warehouseCache.delete(organizationId);
    this.lastCacheRefresh.delete(organizationId);
  }

  /**
   * Helper methods for generating warehouse data
   * In a real implementation, these would be replaced with database queries
   */

  /**
   * Determine region from country code
   */
  private getRegionFromCountry(country: string): string {
    const regionMap: Record<string, string> = {
      'ZA': 'south-africa',
      'NA': 'south-africa', // Namibia
      'BW': 'south-africa', // Botswana
      'LS': 'south-africa', // Lesotho
      'SZ': 'south-africa', // Eswatini
      'KE': 'east-africa', // Kenya
      'UG': 'east-africa', // Uganda
      'TZ': 'east-africa', // Tanzania
      'RW': 'east-africa', // Rwanda
      'NG': 'west-africa', // Nigeria
      'GH': 'west-africa', // Ghana
      'CI': 'west-africa', // Ivory Coast
      'EG': 'north-africa', // Egypt
      'MA': 'north-africa', // Morocco
      'TN': 'north-africa', // Tunisia
    };
    
    return regionMap[country] || 'africa'; // Default to general africa
  }

  /**
   * Determine if a warehouse supports cross-border shipping
   */
  private determineCrossBorderSupport(warehouse: any): boolean {
    // In a real implementation, this would be a property in the database
    // For demonstration, we'll simulate some logic
    return warehouse.type === 'fulfillment_center' || warehouse.metadata?.crossBorderEnabled === true;
  }

  /**
   * Determine which countries a warehouse can ship to
   */
  private determineShippingCountries(warehouse: any): string[] {
    // In a real implementation, this would be a property in the database
    // For demonstration, we'll determine based on the warehouse country
    const country = warehouse.address.country;
    
    // South African warehouses can ship to SADC countries
    if (country === 'ZA') {
      return ['ZA', 'NA', 'BW', 'LS', 'SZ', 'MZ', 'ZW'];
    }
    
    // East African warehouses
    if (['KE', 'UG', 'TZ', 'RW'].includes(country)) {
      return ['KE', 'UG', 'TZ', 'RW', 'BI'];
    }
    
    // West African warehouses
    if (['NG', 'GH', 'CI'].includes(country)) {
      return ['NG', 'GH', 'CI', 'SN', 'BJ', 'TG'];
    }
    
    // Default: just the warehouse's own country
    return [country];
  }

  /**
   * Calculate capacity utilization percentage
   */
  private calculateCapacityUtilization(warehouse: any): number | undefined {
    if (warehouse.totalCapacity && warehouse.usedCapacity) {
      return (warehouse.usedCapacity / warehouse.totalCapacity) * 100;
    }
    return undefined;
  }

  /**
   * Get estimated lead times for a warehouse
   */
  private getEstimatedLeadTimes(warehouse: any): { domestic: number; regional: number; international: number } {
    // In a real implementation, this would be a property in the database
    // For demonstration, we'll use some defaults based on warehouse type
    switch (warehouse.type) {
      case 'fulfillment_center':
        return { domestic: 1, regional: 3, international: 7 };
      case 'owned':
        return { domestic: 2, regional: 5, international: 10 };
      case 'third_party':
        return { domestic: 2, regional: 4, international: 8 };
      default:
        return { domestic: 3, regional: 6, international: 12 };
    }
  }

  /**
   * Get currency for a country
   */
  private getCurrencyForCountry(country: string): string {
    const currencyMap: Record<string, string> = {
      'ZA': 'ZAR', // South African Rand
      'NA': 'NAD', // Namibian Dollar
      'BW': 'BWP', // Botswana Pula
      'LS': 'LSL', // Lesotho Loti
      'SZ': 'SZL', // Swazi Lilangeni
      'KE': 'KES', // Kenyan Shilling
      'UG': 'UGX', // Ugandan Shilling
      'TZ': 'TZS', // Tanzanian Shilling
      'RW': 'RWF', // Rwandan Franc
      'NG': 'NGN', // Nigerian Naira
      'GH': 'GHS', // Ghanaian Cedi
      'CI': 'XOF', // West African CFA franc
      'EG': 'EGP', // Egyptian Pound
      'MA': 'MAD', // Moroccan Dirham
      'TN': 'TND', // Tunisian Dinar
    };
    
    return currencyMap[country] || 'USD'; // Default to USD
  }

  /**
   * Get VAT rate for a country
   */
  private getVatRateForCountry(country: string): number {
    const vatRates: Record<string, number> = {
      'ZA': 15, // South Africa
      'NA': 15, // Namibia
      'BW': 14, // Botswana
      'LS': 15, // Lesotho
      'SZ': 15, // Eswatini
      'KE': 16, // Kenya
      'UG': 18, // Uganda
      'TZ': 18, // Tanzania
      'RW': 18, // Rwanda
      'NG': 7.5, // Nigeria
      'GH': 12.5, // Ghana
      'CI': 18, // Ivory Coast
      'EG': 14, // Egypt
      'MA': 20, // Morocco
      'TN': 19, // Tunisia
    };
    
    return vatRates[country] || 15; // Default to 15%
  }

  /**
   * Determine warehouse capabilities based on warehouse data
   */
  private determineWarehouseCapabilities(warehouse: any): string[] {
    const capabilities: string[] = [];
    
    // Add basic capabilities
    capabilities.push('storage');
    capabilities.push('picking');
    capabilities.push('packing');
    capabilities.push('shipping');
    
    // Add specialized capabilities based on metadata or warehouse type
    if (warehouse.type === 'fulfillment_center') {
      capabilities.push('customs-handling');
      capabilities.push('returns-processing');
    }
    
    if (warehouse.metadata?.refrigeration) {
      capabilities.push('refrigerated-storage');
    }
    
    if (warehouse.metadata?.hazardousMaterials) {
      capabilities.push('hazardous-materials');
    }
    
    if (warehouse.metadata?.bulkStorage) {
      capabilities.push('bulk-storage');
    }
    
    return capabilities;
  }
}