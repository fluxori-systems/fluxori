import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { MarketContextService } from './market-context.service';
import { FeatureFlagService } from '../../../modules/feature-flags/services/feature-flag.service';

/**
 * Currency exchange rate
 */
export interface ExchangeRate {
  /**
   * Source currency code
   */
  from: string;

  /**
   * Target currency code
   */
  to: string;

  /**
   * Exchange rate (amount of target currency per 1 unit of source currency)
   */
  rate: number;

  /**
   * Last updated timestamp
   */
  lastUpdated: Date;

  /**
   * Source of the exchange rate
   */
  source: string;
}

/**
 * Currency information
 */
export interface CurrencyInfo {
  /**
   * Currency code (e.g., 'ZAR', 'USD')
   */
  code: string;

  /**
   * Currency name
   */
  name: string;

  /**
   * Currency symbol
   */
  symbol: string;

  /**
   * ISO numeric code
   */
  numericCode?: string;

  /**
   * Number of decimal places
   */
  decimalDigits: number;

  /**
   * Regions where this currency is used
   */
  regions?: string[];

  /**
   * Whether this is a default currency for the organization
   */
  isDefault?: boolean;
}

/**
 * Price conversion result
 */
export interface PriceConversionResult {
  /**
   * Original price amount
   */
  originalPrice: number;

  /**
   * Original currency code
   */
  originalCurrency: string;

  /**
   * Converted price amount
   */
  convertedPrice: number;

  /**
   * Target currency code
   */
  targetCurrency: string;

  /**
   * Exchange rate used for conversion
   */
  exchangeRate: number;

  /**
   * Conversion timestamp
   */
  conversionTime: Date;

  /**
   * Whether the price includes VAT
   */
  includesVat: boolean;

  /**
   * VAT amount in target currency (if applicable)
   */
  vatAmount?: number;
}

/**
 * Multi-currency pricing configuration
 */
export interface MultiCurrencyConfig {
  /**
   * Default currency code
   */
  defaultCurrency: string;

  /**
   * Enabled currencies
   */
  enabledCurrencies: string[];

  /**
   * Automatic conversion settings
   */
  automaticConversion: {
    /**
     * Whether to enable automatic conversion
     */
    enabled: boolean;

    /**
     * Whether to update prices when exchange rates change
     */
    updatePricesOnRateChange: boolean;

    /**
     * Threshold for significant exchange rate changes (percentage)
     */
    significantChangeThresholdPercent: number;
  };

  /**
   * Exchange rate display settings
   */
  exchangeRateDisplay: {
    /**
     * Whether to show exchange rates to customers
     */
    showRatesToCustomers: boolean;

    /**
     * Whether to show last updated time
     */
    showLastUpdated: boolean;
  };

  /**
   * Rounding settings
   */
  rounding: {
    /**
     * Rounding method ('up', 'down', 'nearest')
     */
    method: 'up' | 'down' | 'nearest';

    /**
     * Precision (number of decimal places)
     */
    precision: number;

    /**
     * Whether to use psychological pricing (e.g., 9.99 instead of 10.00)
     */
    usePsychologicalPricing: boolean;
  };
}

/**
 * MultiCurrencyService
 *
 * Service for handling multi-currency pricing for the PIM module
 * with African market optimizations:
 * - Support for all major African currencies
 * - Regional pricing strategies
 * - Cross-border price calculations
 * - VAT handling for different regions
 */
@Injectable()
export class MultiCurrencyService {
  private readonly logger = new Logger(MultiCurrencyService.name);

  // Cache for exchange rates to reduce external API calls
  private exchangeRateCache: Map<string, ExchangeRate> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Default multi-currency configuration
  private defaultConfig: MultiCurrencyConfig = {
    defaultCurrency: 'USD',
    enabledCurrencies: ['USD', 'ZAR', 'NAD', 'BWP', 'KES', 'NGN', 'GHS', 'EUR'],
    automaticConversion: {
      enabled: true,
      updatePricesOnRateChange: true,
      significantChangeThresholdPercent: 5,
    },
    exchangeRateDisplay: {
      showRatesToCustomers: true,
      showLastUpdated: true,
    },
    rounding: {
      method: 'nearest',
      precision: 2,
      usePsychologicalPricing: true,
    },
  };

  // Organization-specific configurations
  private organizationConfigs: Map<string, MultiCurrencyConfig> = new Map();

  constructor(
    private readonly marketContextService: MarketContextService,
    private readonly featureFlagService: FeatureFlagService,
  ) {
    // Initialize with some example exchange rates for demonstration
    this.initializeExchangeRates();
  }

  /**
   * Get the multi-currency configuration for an organization
   *
   * @param organizationId Organization ID
   * @returns Multi-currency configuration
   */
  async getMultiCurrencyConfig(
    organizationId: string,
  ): Promise<MultiCurrencyConfig> {
    // Check if organization has a custom configuration
    if (this.organizationConfigs.has(organizationId)) {
      return this.organizationConfigs.get(organizationId)!;
    }

    // Determine default currency from market context
    const marketContext =
      await this.marketContextService.getMarketContext(organizationId);
    const defaultCurrency = marketContext.defaultCurrency;

    // Return default config with organization's default currency
    return {
      ...this.defaultConfig,
      defaultCurrency,
    };
  }

  /**
   * Set the multi-currency configuration for an organization
   *
   * @param organizationId Organization ID
   * @param config Multi-currency configuration
   * @returns Updated configuration
   */
  async setMultiCurrencyConfig(
    organizationId: string,
    config: Partial<MultiCurrencyConfig>,
  ): Promise<MultiCurrencyConfig> {
    // Get existing config or default
    const existingConfig = await this.getMultiCurrencyConfig(organizationId);

    // Merge with new config
    const updatedConfig: MultiCurrencyConfig = {
      ...existingConfig,
      ...config,
      // Preserve nested objects
      automaticConversion: {
        ...existingConfig.automaticConversion,
        ...(config.automaticConversion || {}),
      },
      exchangeRateDisplay: {
        ...existingConfig.exchangeRateDisplay,
        ...(config.exchangeRateDisplay || {}),
      },
      rounding: {
        ...existingConfig.rounding,
        ...(config.rounding || {}),
      },
    };

    // Save to organization configs
    this.organizationConfigs.set(organizationId, updatedConfig);

    return updatedConfig;
  }

  /**
   * Get all supported currencies
   *
   * @returns List of all supported currencies
   */
  async getSupportedCurrencies(): Promise<CurrencyInfo[]> {
    return [
      {
        code: 'ZAR',
        name: 'South African Rand',
        symbol: 'R',
        decimalDigits: 2,
        regions: ['south-africa'],
      },
      {
        code: 'NAD',
        name: 'Namibian Dollar',
        symbol: 'N$',
        decimalDigits: 2,
        regions: ['south-africa'],
      },
      {
        code: 'BWP',
        name: 'Botswana Pula',
        symbol: 'P',
        decimalDigits: 2,
        regions: ['south-africa'],
      },
      {
        code: 'LSL',
        name: 'Lesotho Loti',
        symbol: 'L',
        decimalDigits: 2,
        regions: ['south-africa'],
      },
      {
        code: 'SZL',
        name: 'Swazi Lilangeni',
        symbol: 'E',
        decimalDigits: 2,
        regions: ['south-africa'],
      },
      {
        code: 'KES',
        name: 'Kenyan Shilling',
        symbol: 'KSh',
        decimalDigits: 2,
        regions: ['east-africa'],
      },
      {
        code: 'UGX',
        name: 'Ugandan Shilling',
        symbol: 'USh',
        decimalDigits: 0,
        regions: ['east-africa'],
      },
      {
        code: 'TZS',
        name: 'Tanzanian Shilling',
        symbol: 'TSh',
        decimalDigits: 0,
        regions: ['east-africa'],
      },
      {
        code: 'RWF',
        name: 'Rwandan Franc',
        symbol: 'FRw',
        decimalDigits: 0,
        regions: ['east-africa'],
      },
      {
        code: 'NGN',
        name: 'Nigerian Naira',
        symbol: '₦',
        decimalDigits: 2,
        regions: ['west-africa'],
      },
      {
        code: 'GHS',
        name: 'Ghanaian Cedi',
        symbol: '₵',
        decimalDigits: 2,
        regions: ['west-africa'],
      },
      {
        code: 'XOF',
        name: 'West African CFA Franc',
        symbol: 'CFA',
        decimalDigits: 0,
        regions: ['west-africa'],
      },
      {
        code: 'EGP',
        name: 'Egyptian Pound',
        symbol: 'E£',
        decimalDigits: 2,
        regions: ['north-africa'],
      },
      {
        code: 'MAD',
        name: 'Moroccan Dirham',
        symbol: 'DH',
        decimalDigits: 2,
        regions: ['north-africa'],
      },
      {
        code: 'TND',
        name: 'Tunisian Dinar',
        symbol: 'DT',
        decimalDigits: 3,
        regions: ['north-africa'],
      },
      {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        decimalDigits: 2,
        regions: ['global'],
      },
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        decimalDigits: 2,
        regions: ['global'],
      },
      {
        code: 'GBP',
        name: 'British Pound',
        symbol: '£',
        decimalDigits: 2,
        regions: ['global'],
      },
    ];
  }

  /**
   * Get enabled currencies for an organization
   *
   * @param organizationId Organization ID
   * @returns List of enabled currencies
   */
  async getEnabledCurrencies(organizationId: string): Promise<CurrencyInfo[]> {
    const config = await this.getMultiCurrencyConfig(organizationId);
    const allCurrencies = await this.getSupportedCurrencies();
    const enabled = allCurrencies.filter((c) =>
      config.enabledCurrencies.includes(c.code),
    );

    // Mark default currency
    return enabled.map((currency) => ({
      ...currency,
      isDefault: currency.code === config.defaultCurrency,
    }));
  }

  /**
   * Get currency information
   *
   * @param currencyCode Currency code
   * @returns Currency information or undefined if not found
   */
  async getCurrencyInfo(
    currencyCode: string,
  ): Promise<CurrencyInfo | undefined> {
    const currencies = await this.getSupportedCurrencies();
    return currencies.find((c) => c.code === currencyCode);
  }

  /**
   * Get current exchange rate between two currencies
   *
   * @param fromCurrency Source currency code
   * @param toCurrency Target currency code
   * @returns Exchange rate information
   */
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<ExchangeRate> {
    // If currencies are the same, return 1:1 rate
    if (fromCurrency === toCurrency) {
      return {
        from: fromCurrency,
        to: toCurrency,
        rate: 1,
        lastUpdated: new Date(),
        source: 'system',
      };
    }

    // Generate cache key
    const cacheKey = `${fromCurrency}_${toCurrency}`;

    // Check if we have a cached rate that's still valid
    const cachedRate = this.exchangeRateCache.get(cacheKey);
    if (
      cachedRate &&
      Date.now() - cachedRate.lastUpdated.getTime() < this.CACHE_TTL
    ) {
      return cachedRate;
    }

    // In a real implementation, we would fetch the rate from an external API or database
    // For this example, we'll try to find the rate from our pre-defined rates
    const newRate = this.fetchExchangeRate(fromCurrency, toCurrency);

    if (!newRate) {
      throw new NotFoundException(
        `Exchange rate from ${fromCurrency} to ${toCurrency} not found`,
      );
    }

    // Update cache
    this.exchangeRateCache.set(cacheKey, newRate);

    return newRate;
  }

  /**
   * Convert a price from one currency to another
   *
   * @param price Price to convert
   * @param fromCurrency Source currency code
   * @param toCurrency Target currency code
   * @param includesVat Whether the price includes VAT
   * @param options Conversion options
   * @returns Price conversion result
   */
  async convertPrice(
    price: number,
    fromCurrency: string,
    toCurrency: string,
    includesVat: boolean = false,
    options: {
      roundingMethod?: 'up' | 'down' | 'nearest';
      precision?: number;
      usePsychologicalPricing?: boolean;
      vat?: {
        sourceRate?: number;
        targetRate?: number;
      };
    } = {},
  ): Promise<PriceConversionResult> {
    // Get the exchange rate
    const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);

    // Convert the price
    let convertedPrice = price * exchangeRate.rate;

    // Handle VAT if needed
    let vatAmount: number | undefined;

    if (options.vat) {
      if (includesVat) {
        // If source price includes VAT, remove source VAT and add target VAT
        const sourceRate = options.vat.sourceRate || 0;
        const targetRate = options.vat.targetRate || 0;

        // Extract base price (without VAT)
        const basePrice = price / (1 + sourceRate / 100);

        // Convert base price
        const convertedBasePrice = basePrice * exchangeRate.rate;

        // Add target VAT
        vatAmount = convertedBasePrice * (targetRate / 100);
        convertedPrice = convertedBasePrice * (1 + targetRate / 100);
      } else {
        // If source price doesn't include VAT, just add target VAT if needed
        const targetRate = options.vat.targetRate || 0;

        // Convert base price
        const convertedBasePrice = price * exchangeRate.rate;

        // Calculate VAT amount
        vatAmount = convertedBasePrice * (targetRate / 100);

        // If we want the result to include VAT
        if (includesVat) {
          convertedPrice = convertedBasePrice * (1 + targetRate / 100);
        }
      }
    }

    // Apply rounding
    const roundingMethod = options.roundingMethod || 'nearest';
    const precision = options.precision !== undefined ? options.precision : 2;

    convertedPrice = this.roundPrice(convertedPrice, roundingMethod, precision);

    // Apply psychological pricing if enabled
    if (options.usePsychologicalPricing) {
      convertedPrice = this.applyPsychologicalPricing(
        convertedPrice,
        precision,
      );
    }

    // Prepare result
    const result: PriceConversionResult = {
      originalPrice: price,
      originalCurrency: fromCurrency,
      convertedPrice,
      targetCurrency: toCurrency,
      exchangeRate: exchangeRate.rate,
      conversionTime: new Date(),
      includesVat,
    };

    // Add VAT amount if applicable
    if (vatAmount !== undefined) {
      result.vatAmount = this.roundPrice(vatAmount, roundingMethod, precision);
    }

    return result;
  }

  /**
   * Convert prices for multiple products
   *
   * @param items Array of products with prices
   * @param fromCurrency Source currency code
   * @param toCurrency Target currency code
   * @param includesVat Whether prices include VAT
   * @param options Conversion options
   * @returns Array of converted price results
   */
  async convertMultiplePrices(
    items: Array<{ id: string; price: number }>,
    fromCurrency: string,
    toCurrency: string,
    includesVat: boolean = false,
    options: {
      roundingMethod?: 'up' | 'down' | 'nearest';
      precision?: number;
      usePsychologicalPricing?: boolean;
      vat?: {
        sourceRate?: number;
        targetRate?: number;
      };
    } = {},
  ): Promise<Array<{ id: string; result: PriceConversionResult }>> {
    // Optimize by getting the exchange rate once
    const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);

    // Process all conversions
    const results = await Promise.all(
      items.map(async (item) => {
        // Convert using the same exchange rate for all
        const convertedPrice = item.price * exchangeRate.rate;

        // Handle VAT if needed
        let calculatedPrice = convertedPrice;
        let vatAmount: number | undefined;

        if (options.vat) {
          if (includesVat) {
            // If source price includes VAT, remove source VAT and add target VAT
            const sourceRate = options.vat.sourceRate || 0;
            const targetRate = options.vat.targetRate || 0;

            // Extract base price (without VAT)
            const basePrice = item.price / (1 + sourceRate / 100);

            // Convert base price
            const convertedBasePrice = basePrice * exchangeRate.rate;

            // Add target VAT
            vatAmount = convertedBasePrice * (targetRate / 100);
            calculatedPrice = convertedBasePrice * (1 + targetRate / 100);
          } else {
            // If source price doesn't include VAT, just add target VAT if needed
            const targetRate = options.vat.targetRate || 0;

            // Convert base price
            const convertedBasePrice = item.price * exchangeRate.rate;

            // Calculate VAT amount
            vatAmount = convertedBasePrice * (targetRate / 100);

            // If we want the result to include VAT
            if (includesVat) {
              calculatedPrice = convertedBasePrice * (1 + targetRate / 100);
            }
          }
        }

        // Apply rounding
        const roundingMethod = options.roundingMethod || 'nearest';
        const precision =
          options.precision !== undefined ? options.precision : 2;

        calculatedPrice = this.roundPrice(
          calculatedPrice,
          roundingMethod,
          precision,
        );

        // Apply psychological pricing if enabled
        if (options.usePsychologicalPricing) {
          calculatedPrice = this.applyPsychologicalPricing(
            calculatedPrice,
            precision,
          );
        }

        // Prepare result
        const result: PriceConversionResult = {
          originalPrice: item.price,
          originalCurrency: fromCurrency,
          convertedPrice: calculatedPrice,
          targetCurrency: toCurrency,
          exchangeRate: exchangeRate.rate,
          conversionTime: new Date(),
          includesVat,
        };

        // Add VAT amount if applicable
        if (vatAmount !== undefined) {
          result.vatAmount = this.roundPrice(
            vatAmount,
            roundingMethod,
            precision,
          );
        }

        return { id: item.id, result };
      }),
    );

    return results;
  }

  /**
   * Get currencies used in a specific region
   *
   * @param region Region code
   * @returns Currencies used in the region
   */
  async getCurrenciesForRegion(region: string): Promise<CurrencyInfo[]> {
    const allCurrencies = await this.getSupportedCurrencies();
    return allCurrencies.filter(
      (currency) =>
        currency.regions?.includes(region) ||
        currency.regions?.includes('global'),
    );
  }

  /**
   * Get default currency for a region
   *
   * @param region Region code
   * @returns Default currency for the region
   */
  async getDefaultCurrencyForRegion(region: string): Promise<CurrencyInfo> {
    const regionCurrencies = await this.getCurrenciesForRegion(region);

    // Define default currencies for each region
    const regionDefaults: Record<string, string> = {
      'south-africa': 'ZAR',
      'east-africa': 'KES',
      'west-africa': 'NGN',
      'north-africa': 'EGP',
      africa: 'USD',
    };

    // Get the default for this region
    const defaultCurrency = regionDefaults[region] || 'USD';

    // Find the currency info
    const currencyInfo = regionCurrencies.find(
      (c) => c.code === defaultCurrency,
    );

    if (!currencyInfo) {
      // Fallback to the first currency in the region
      return (
        regionCurrencies[0] || {
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          decimalDigits: 2,
          regions: ['global'],
        }
      );
    }

    return currencyInfo;
  }

  /**
   * Update exchange rates for all currencies
   * This would be called periodically in a real system
   *
   * @returns Success indicator
   */
  async updateAllExchangeRates(): Promise<boolean> {
    this.logger.log('Updating all exchange rates');

    // In a real implementation, this would fetch rates from an external API
    // For this example, we'll just refresh our pre-defined rates

    // Clear the cache
    this.exchangeRateCache.clear();

    // Re-initialize with fresh rates
    this.initializeExchangeRates();

    return true;
  }

  /**
   * Format a price according to a currency's rules
   *
   * @param price Price to format
   * @param currencyCode Currency code
   * @param options Formatting options
   * @returns Formatted price string
   */
  async formatPrice(
    price: number,
    currencyCode: string,
    options: {
      style?: 'currency' | 'decimal';
      showSymbol?: boolean;
      locale?: string;
    } = {},
  ): Promise<string> {
    const currency = await this.getCurrencyInfo(currencyCode);

    if (!currency) {
      throw new NotFoundException(`Currency ${currencyCode} not found`);
    }

    const style = options.style || 'currency';
    const showSymbol =
      options.showSymbol !== undefined ? options.showSymbol : true;
    const locale = options.locale || 'en-US';

    try {
      if (style === 'currency') {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: currency.decimalDigits,
          maximumFractionDigits: currency.decimalDigits,
        }).format(price);
      } else {
        const formatted = new Intl.NumberFormat(locale, {
          style: 'decimal',
          minimumFractionDigits: currency.decimalDigits,
          maximumFractionDigits: currency.decimalDigits,
        }).format(price);

        return showSymbol ? `${currency.symbol}${formatted}` : formatted;
      }
    } catch (error) {
      this.logger.error(`Error formatting price: ${error.message}`);
      // Fallback to basic formatting
      return showSymbol
        ? `${currency.symbol}${price.toFixed(currency.decimalDigits)}`
        : price.toFixed(currency.decimalDigits);
    }
  }

  /**
   * Initialize the exchange rate cache with example rates
   * In a real implementation, these would come from an external source
   */
  private initializeExchangeRates(): void {
    const now = new Date();
    const source = 'example-data';

    // Define base rates against USD
    const baseRates: Record<string, number> = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.78,
      ZAR: 18.2,
      NAD: 18.2, // Pegged to ZAR
      BWP: 13.45,
      LSL: 18.2, // Pegged to ZAR
      SZL: 18.2, // Pegged to ZAR
      KES: 130.55,
      UGX: 3760.5,
      TZS: 2520.75,
      RWF: 1250.3,
      NGN: 830.25,
      GHS: 14.35,
      XOF: 603.2,
      EGP: 30.85,
      MAD: 9.95,
      TND: 3.1,
    };

    // Create cross-rates for all currency pairs
    for (const fromCurrency of Object.keys(baseRates)) {
      for (const toCurrency of Object.keys(baseRates)) {
        if (fromCurrency !== toCurrency) {
          const fromRate = baseRates[fromCurrency];
          const toRate = baseRates[toCurrency];
          const crossRate = toRate / fromRate;

          const exchangeRate: ExchangeRate = {
            from: fromCurrency,
            to: toCurrency,
            rate: crossRate,
            lastUpdated: now,
            source,
          };

          // Add to cache
          this.exchangeRateCache.set(
            `${fromCurrency}_${toCurrency}`,
            exchangeRate,
          );
        }
      }
    }
  }

  /**
   * Fetch exchange rate from pre-defined rates
   * In a real implementation, this would call an external API
   *
   * @param fromCurrency Source currency code
   * @param toCurrency Target currency code
   * @returns Exchange rate or undefined if not found
   */
  private fetchExchangeRate(
    fromCurrency: string,
    toCurrency: string,
  ): ExchangeRate | undefined {
    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const cachedRate = this.exchangeRateCache.get(cacheKey);

    if (cachedRate) {
      // Simulate a small fluctuation (±2%)
      const fluctuation = 1 + (Math.random() * 0.04 - 0.02); // Random value between 0.98 and 1.02
      const newRate = cachedRate.rate * fluctuation;

      return {
        ...cachedRate,
        rate: newRate,
        lastUpdated: new Date(),
      };
    }

    return undefined;
  }

  /**
   * Round a price according to a rounding method
   *
   * @param price Price to round
   * @param method Rounding method
   * @param precision Number of decimal places
   * @returns Rounded price
   */
  private roundPrice(
    price: number,
    method: 'up' | 'down' | 'nearest',
    precision: number,
  ): number {
    const multiplier = Math.pow(10, precision);

    switch (method) {
      case 'up':
        return Math.ceil(price * multiplier) / multiplier;
      case 'down':
        return Math.floor(price * multiplier) / multiplier;
      case 'nearest':
      default:
        return Math.round(price * multiplier) / multiplier;
    }
  }

  /**
   * Apply psychological pricing to a price (e.g., 9.99 instead of 10.00)
   *
   * @param price Price to adjust
   * @param precision Number of decimal places
   * @returns Adjusted price
   */
  private applyPsychologicalPricing(price: number, precision: number): number {
    if (precision <= 0) {
      // For currencies without decimal places, subtract 1
      return Math.ceil(price) - 1;
    }

    const multiplier = Math.pow(10, precision);
    const nearestWholeUnit = Math.ceil(price);

    // Calculate the "magic number" (e.g., 0.99, 0.95)
    const magicNumber = multiplier - 1;

    // Apply psychological pricing
    return nearestWholeUnit - (1 / multiplier) * magicNumber;
  }
}
