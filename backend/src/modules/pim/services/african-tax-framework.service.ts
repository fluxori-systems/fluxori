/**
 * African Tax Framework Service
 *
 * Service implementing regional tax frameworks for African countries
 * Extends the Centralized Tax Rate Service with African-specific tax optimizations
 */

import { Injectable } from '@nestjs/common';

import {
  TaxRateService as ITaxRateService,
  TaxRateRequest,
  TaxRateResult,
  TaxRateSchedule,
  TaxJurisdiction,
  TaxType,
} from '../interfaces/tax-rate.interface';
import { TaxRateRepository } from '../repositories/tax-rate.repository';

/**
 * Interface for African country-specific tax rules
 */
export interface AfricanTaxRule {
  /**
   * Country code (ISO 3166-1 alpha-2)
   */
  country: string;

  /**
   * Default tax type for the country
   */
  defaultTaxType: TaxType;

  /**
   * Current standard rate
   */
  standardRate: number;

  /**
   * Whether to check regional rates (provinces, states)
   */
  hasRegionalRates: boolean;

  /**
   * Whether the country supports tax exemption for certain product types
   */
  supportsTaxExemption: boolean;

  /**
   * Whether the country has reduced rates for certain product types
   */
  hasReducedRates: boolean;

  /**
   * Whether the country has zero rates for certain product types
   */
  hasZeroRates: boolean;

  /**
   * Date when the tax system started
   */
  taxSystemStartDate: Date;

  /**
   * Special tax handling notes
   */
  notes?: string;
}

/**
 * African Tax Framework Service
 *
 * Extended service for African tax rates and frameworks
 */
@Injectable()
export class AfricanTaxFrameworkService {
  /**
   * Map of African countries and their tax rules
   */
  private africanTaxRules: Map<string, AfricanTaxRule>;

  /**
   * Constructor
   *
   * @param taxRateService Core tax rate service
   * @param taxRateRepository Tax rate repository
   */
  constructor(
    private readonly taxRateService: ITaxRateService,
    private readonly taxRateRepository: TaxRateRepository,
  ) {
    // Initialize African tax rules
    this.initializeAfricanTaxRules();
  }

  /**
   * Initialize African tax rules for all supported countries
   */
  private initializeAfricanTaxRules(): void {
    this.africanTaxRules = new Map<string, AfricanTaxRule>();

    // South Africa
    this.africanTaxRules.set('ZA', {
      country: 'ZA',
      defaultTaxType: TaxType.VAT,
      standardRate: 0.15, // 15%
      hasRegionalRates: false,
      supportsTaxExemption: true,
      hasReducedRates: false, // SA doesn't have reduced rates
      hasZeroRates: true, // SA has zero-rated items
      taxSystemStartDate: new Date('1991-09-30'), // SA VAT introduction
      notes: 'Going to 15.5% in May 2025, then 16% in April 2026',
    });

    // Nigeria
    this.africanTaxRules.set('NG', {
      country: 'NG',
      defaultTaxType: TaxType.VAT,
      standardRate: 0.075, // 7.5%
      hasRegionalRates: true,
      supportsTaxExemption: true,
      hasReducedRates: false,
      hasZeroRates: true,
      taxSystemStartDate: new Date('1994-01-01'),
      notes: 'Regional taxes may apply in addition to federal VAT',
    });

    // Kenya
    this.africanTaxRules.set('KE', {
      country: 'KE',
      defaultTaxType: TaxType.VAT,
      standardRate: 0.16, // 16%
      hasRegionalRates: false,
      supportsTaxExemption: true,
      hasReducedRates: true, // Kenya has reduced rates for some items
      hasZeroRates: true,
      taxSystemStartDate: new Date('1990-01-01'),
      notes: 'Digital services tax applies at 1.5% of gross transaction value',
    });

    // Ghana
    this.africanTaxRules.set('GH', {
      country: 'GH',
      defaultTaxType: TaxType.VAT,
      standardRate: 0.125, // 12.5% standard VAT
      hasRegionalRates: false,
      supportsTaxExemption: true,
      hasReducedRates: false,
      hasZeroRates: true,
      taxSystemStartDate: new Date('1998-01-01'),
      notes: 'Additionally, 2.5% NHIL and 2.5% GETFund levy often applicable',
    });

    // Egypt
    this.africanTaxRules.set('EG', {
      country: 'EG',
      defaultTaxType: TaxType.VAT,
      standardRate: 0.14, // 14%
      hasRegionalRates: false,
      supportsTaxExemption: true,
      hasReducedRates: true, // Reduced rates for some items
      hasZeroRates: true,
      taxSystemStartDate: new Date('2016-09-08'),
      notes: 'Replaced GST system',
    });

    // Morocco
    this.africanTaxRules.set('MA', {
      country: 'MA',
      defaultTaxType: TaxType.VAT,
      standardRate: 0.2, // 20%
      hasRegionalRates: false,
      supportsTaxExemption: true,
      hasReducedRates: true, // Has 7%, 10%, 14% reduced rates
      hasZeroRates: true,
      taxSystemStartDate: new Date('1986-01-01'),
      notes: 'Multiple reduced rates for different product categories',
    });

    // Tanzania
    this.africanTaxRules.set('TZ', {
      country: 'TZ',
      defaultTaxType: TaxType.VAT,
      standardRate: 0.18, // 18%
      hasRegionalRates: false,
      supportsTaxExemption: true,
      hasReducedRates: false,
      hasZeroRates: true,
      taxSystemStartDate: new Date('1998-07-01'),
      notes: 'Special treatment for Zanzibar',
    });

    // Uganda
    this.africanTaxRules.set('UG', {
      country: 'UG',
      defaultTaxType: TaxType.VAT,
      standardRate: 0.18, // 18%
      hasRegionalRates: false,
      supportsTaxExemption: true,
      hasReducedRates: false,
      hasZeroRates: true,
      taxSystemStartDate: new Date('1996-07-01'),
      notes: 'Digital services tax being implemented',
    });

    // Angola
    this.africanTaxRules.set('AO', {
      country: 'AO',
      defaultTaxType: TaxType.VAT,
      standardRate: 0.14, // 14%
      hasRegionalRates: false,
      supportsTaxExemption: true,
      hasReducedRates: true, // 5% and 7% rates
      hasZeroRates: true,
      taxSystemStartDate: new Date('2019-10-01'),
      notes: 'Replaced consumption tax in 2019',
    });

    // Ethiopia
    this.africanTaxRules.set('ET', {
      country: 'ET',
      defaultTaxType: TaxType.VAT,
      standardRate: 0.15, // 15%
      hasRegionalRates: false,
      supportsTaxExemption: true,
      hasReducedRates: false,
      hasZeroRates: true,
      taxSystemStartDate: new Date('2003-01-01'),
      notes: 'Thresholds apply for registration',
    });
  }

  /**
   * Get tax rules for a specific African country
   *
   * @param countryCode ISO country code
   * @returns Tax rules for the country or undefined if not supported
   */
  public getCountryTaxRules(countryCode: string): AfricanTaxRule | undefined {
    return this.africanTaxRules.get(countryCode);
  }

  /**
   * Get list of all supported African countries
   *
   * @returns Array of country codes
   */
  public getSupportedCountries(): string[] {
    return Array.from(this.africanTaxRules.keys());
  }

  /**
   * Check if a country is supported in the African Tax Framework
   *
   * @param countryCode ISO country code
   * @returns Boolean indicating support
   */
  public isCountrySupported(countryCode: string): boolean {
    return this.africanTaxRules.has(countryCode);
  }

  /**
   * Calculate tax for an African country with all local rules applied
   * Takes into account regional taxes, exemptions, and special rates
   *
   * @param params Tax calculation parameters
   * @returns Tax calculation result
   */
  public async calculateAfricanTax(
    params: TaxRateRequest,
  ): Promise<TaxRateResult> {
    // First check if the country is supported
    if (!this.isCountrySupported(params.country)) {
      // Fall back to standard tax service if not specifically handled
      return this.taxRateService.getCurrentRate(params);
    }

    const countryRules = this.africanTaxRules.get(params.country);

    // If no specific tax type was provided, use the country's default
    if (!params.taxType) {
      params.taxType = countryRules.defaultTaxType;
    }

    // Try to get the rate from the centralized service first
    try {
      // Get the centralized tax rate
      const centralizedRate = await this.taxRateService.getCurrentRate(params);

      // Check if we need to apply any special country-specific rules
      return this.applyCountrySpecificRules(centralizedRate, params);
    } catch (error) {
      // Handle case where the rate isn't in the centralized system
      // This could happen for new African countries we're expanding to
      // but haven't fully added to the database yet

      if (countryRules) {
        // Create a basic rate result using the country's standard rate
        const fallbackResult: TaxRateResult = {
          rate: countryRules.standardRate,
          ratePercentage: countryRules.standardRate * 100,
          name: 'Standard Rate',
          taxType: countryRules.defaultTaxType,
          jurisdiction: {
            country: params.country,
            region: params.region,
            city: params.city,
            level: params.city
              ? 'city'
              : params.region
                ? 'province'
                : 'country',
          },
          validFrom: countryRules.taxSystemStartDate,
          validTo: null,
          description: `Default ${countryRules.defaultTaxType} rate for ${params.country}`,
          scheduleId: 'fallback',
          isSpecialRate: false,
          legalReference: 'Tax system standard rate',
        };

        // Still try to apply country-specific rules
        return this.applyCountrySpecificRules(fallbackResult, params);
      }

      // If no fallback is available, re-throw the error
      throw error;
    }
  }

  /**
   * Apply country-specific tax rules and adjustments
   *
   * @param baseRate Base tax rate result
   * @param params Original request params
   * @returns Modified tax rate result
   */
  private async applyCountrySpecificRules(
    baseRate: TaxRateResult,
    params: TaxRateRequest,
  ): Promise<TaxRateResult> {
    const countryCode = params.country;
    const countryRules = this.africanTaxRules.get(countryCode);

    if (!countryRules) {
      return baseRate; // No specific rules to apply
    }

    // Create a copy of the base rate to modify
    const result = { ...baseRate };

    // Apply country-specific logic based on the country code
    switch (countryCode) {
      case 'NG': // Nigeria
        // Nigeria has additional state-level taxes in some regions
        if (params.region && countryRules.hasRegionalRates) {
          // Look for region-specific tax
          try {
            const regionalJurisdiction: TaxJurisdiction = {
              country: params.country,
              region: params.region,
              level: 'province',
            };

            const regionalRates =
              await this.taxRateRepository.findAllRatesForJurisdiction(
                regionalJurisdiction,
                false,
              );

            // If there are regional rates, adjust the total rate
            if (regionalRates.length > 0) {
              // Find the applicable regional rate for this transaction
              const applicableRegionalRate = regionalRates.find(
                (rate) =>
                  rate.taxType === params.taxType &&
                  (!rate.validTo ||
                    rate.validTo >= (params.transactionDate || new Date())),
              );

              if (applicableRegionalRate) {
                // In Nigeria, we add the regional tax to the federal tax
                result.rate += applicableRegionalRate.rate;
                result.ratePercentage = result.rate * 100;
                result.name = 'Combined Federal and State Rate';
                result.description = `Combined ${result.taxType} rate including federal and ${params.region} state taxes`;
                result.isSpecialRate = true;
              }
            }
          } catch (error) {
            // If there's an error getting regional rates, continue with the base rate
            console.error(
              `Error getting regional tax rates for Nigeria/${params.region}:`,
              error,
            );
          }
        }
        break;

      case 'GH': // Ghana
        // Ghana applies additional health and education levies on top of VAT
        if (params.taxType === TaxType.VAT) {
          // Add NHIL (2.5%) and GETFund (2.5%)
          result.rate += 0.05; // Additional 5% in levies
          result.ratePercentage = result.rate * 100;
          result.name = 'VAT + Levies';
          result.description =
            'Standard VAT (12.5%) plus NHIL (2.5%) and GETFund (2.5%) levies';
          result.isSpecialRate = true;
        }
        break;

      case 'KE': // Kenya
        // Kenya has a digital services tax at 1.5% for online transactions
        if (params.context?.isDigitalService === true) {
          result.rate = 0.015; // 1.5%
          result.ratePercentage = 1.5;
          result.name = 'Digital Services Tax';
          result.description = 'Kenya DST at 1.5% for digital services';
          result.isSpecialRate = true;
        } else if (params.context?.isExport === true) {
          // Exports are zero-rated in Kenya
          result.rate = 0;
          result.ratePercentage = 0;
          result.name = 'Zero-Rated Export';
          result.description = 'Exports are zero-rated in Kenya';
          result.isSpecialRate = true;
        }
        break;

      case 'MA': // Morocco
        // Morocco has multiple reduced rates (7%, 10%, 14%)
        if (params.productType) {
          // Apply special product-based rates for Morocco if needed
          // These would come from the central database but we could override here
          // if there were special handling requirements
        }
        break;

      case 'TZ': // Tanzania
        // Special handling for Zanzibar (semi-autonomous region)
        if (params.region === 'Zanzibar') {
          // Zanzibar has its own tax administration
          // In a real implementation, we'd have specific rules here
        }
        break;

      case 'ZA': // South Africa
        // Handle South Africa's upcoming rate changes if date is in the future
        // This supplements the database-based rate schedule
        if (params.transactionDate) {
          const transactionDate = new Date(params.transactionDate);
          const may2025 = new Date('2025-05-01');
          const april2026 = new Date('2026-04-01');

          if (transactionDate >= april2026) {
            // After April 2026, VAT will be 16%
            result.rate = 0.16;
            result.ratePercentage = 16;
            result.name = 'Standard Rate (16%)';
            result.description =
              'South Africa VAT at 16% (effective April 2026)';
          } else if (transactionDate >= may2025) {
            // Between May 2025 and April 2026, VAT will be 15.5%
            result.rate = 0.155;
            result.ratePercentage = 15.5;
            result.name = 'Standard Rate (15.5%)';
            result.description =
              'South Africa VAT at 15.5% (effective May 2025)';
          }
        }
        break;

      default:
        // No special handling for other countries
        break;
    }

    return result;
  }

  /**
   * Get all product types that have special tax treatment in a country
   *
   * @param countryCode ISO country code
   * @returns Promise with array of product types and their tax treatment
   */
  public async getSpecialProductTaxCategories(countryCode: string): Promise<
    Array<{
      productType: string;
      category: string;
      rate: number;
      description: string;
    }>
  > {
    if (!this.isCountrySupported(countryCode)) {
      return [];
    }

    const countryRules = this.africanTaxRules.get(countryCode);

    // Base jurisdiction for the query
    const jurisdiction: TaxJurisdiction = {
      country: countryCode,
      level: 'country',
    };

    // Product types with special tax treatment
    const specialProductTypes: Array<{
      productType: string;
      category: string;
      rate: number;
      description: string;
    }> = [];

    try {
      // Query for special rates from the repository
      const specialRates =
        await this.taxRateRepository.findSpecialRatesByJurisdiction(
          jurisdiction,
        );

      // Map special rates to product types
      specialRates.forEach((rate) => {
        if (rate.metadata?.productType || rate.metadata?.productTypes) {
          const productType = rate.metadata.productType || 'Multiple';

          specialProductTypes.push({
            productType,
            category: rate.name,
            rate: rate.rate,
            description:
              rate.description || `${rate.name} at ${rate.rate * 100}%`,
          });
        }
      });

      // Add country-specific hardcoded categories if not in the database
      if (countryCode === 'ZA' && specialProductTypes.length === 0) {
        // South Africa zero-rated items (simplified list)
        specialProductTypes.push(
          {
            productType: 'BasicFoodstuffs',
            category: 'Zero-Rated',
            rate: 0,
            description:
              'Basic food items like brown bread, maize meal, rice, vegetables, fruits, etc.',
          },
          {
            productType: 'ParaffinFuel',
            category: 'Zero-Rated',
            rate: 0,
            description: 'Illuminating paraffin fuel',
          },
          {
            productType: 'ExportedGoods',
            category: 'Zero-Rated',
            rate: 0,
            description: 'Goods exported from South Africa',
          },
        );
      } else if (countryCode === 'KE' && specialProductTypes.length === 0) {
        // Kenya examples
        specialProductTypes.push(
          {
            productType: 'BasicFoodstuffs',
            category: 'Zero-Rated',
            rate: 0,
            description: 'Unprocessed agricultural food products',
          },
          {
            productType: 'Petroleum',
            category: 'Reduced Rate',
            rate: 0.08,
            description: 'Petroleum products at 8% rate',
          },
        );
      }
    } catch (error) {
      console.error(
        `Error getting special product tax categories for ${countryCode}:`,
        error,
      );
    }

    return specialProductTypes;
  }

  /**
   * Check if a product is exempt from tax in the given African country
   *
   * @param params Tax rate request with product info
   * @returns Promise with tax exemption result and reason
   */
  public async isProductTaxExempt(params: TaxRateRequest): Promise<{
    exempt: boolean;
    reason?: string;
    exemptionCategory?: string;
  }> {
    if (!this.isCountrySupported(params.country)) {
      // For unsupported countries, use the base tax service
      const exempt = await this.taxRateService.isExempt(params);
      return { exempt };
    }

    const countryRules = this.africanTaxRules.get(params.country);

    // If the country doesn't support exemptions, return false
    if (!countryRules.supportsTaxExemption) {
      return { exempt: false };
    }

    // First try using the centralized tax service exemption check
    const baseExempt = await this.taxRateService.isExempt(params);

    if (baseExempt) {
      return {
        exempt: true,
        reason: 'Product is exempt according to centralized tax rules',
        exemptionCategory: 'Standard Exemption',
      };
    }

    // Apply country-specific exemption rules
    switch (params.country) {
      case 'ZA': // South Africa
        // Check for common zero-rated goods categories in South Africa
        if (
          params.productType === 'BasicFoodstuffs' ||
          (params.productCategories &&
            params.productCategories.includes('BasicFoodstuffs'))
        ) {
          return {
            exempt: true,
            reason: 'Basic foodstuffs are zero-rated in South Africa',
            exemptionCategory: 'Zero-Rated Foodstuffs',
          };
        }

        if (params.context?.isExport === true) {
          return {
            exempt: true,
            reason: 'Exported goods are zero-rated in South Africa',
            exemptionCategory: 'Export',
          };
        }
        break;

      case 'NG': // Nigeria
        // Check for Nigerian exemptions
        if (
          params.productType === 'BasicFood' ||
          params.productType === 'MedicalSupplies' ||
          params.productType === 'EducationalMaterials'
        ) {
          return {
            exempt: true,
            reason: `${params.productType} is exempt from VAT in Nigeria`,
            exemptionCategory: 'Essential Items',
          };
        }
        break;

      case 'KE': // Kenya
        // Check for Kenyan exemptions
        if (params.context?.isExport === true) {
          return {
            exempt: true,
            reason: 'Exported goods are zero-rated in Kenya',
            exemptionCategory: 'Export',
          };
        }
        break;

      default:
        // No special exemption handling for this country
        break;
    }

    // No exemption found
    return { exempt: false };
  }

  /**
   * Get upcoming tax rate changes for an African country
   *
   * @param countryCode ISO country code
   * @returns Promise with array of upcoming changes
   */
  public async getUpcomingRateChanges(countryCode: string): Promise<
    Array<{
      effectiveDate: Date;
      oldRate: number;
      newRate: number;
      taxType: string;
      description: string;
      legalReference?: string;
    }>
  > {
    if (!this.isCountrySupported(countryCode)) {
      return [];
    }

    const countryRules = this.africanTaxRules.get(countryCode);
    const now = new Date();

    // Base jurisdiction for the query
    const jurisdiction: TaxJurisdiction = {
      country: countryCode,
      level: 'country',
    };

    const upcomingChanges: Array<{
      effectiveDate: Date;
      oldRate: number;
      newRate: number;
      taxType: string;
      description: string;
      legalReference?: string;
    }> = [];

    try {
      // Get all future rate changes from the database
      const allRates = await this.taxRateRepository.findRateChanges(
        jurisdiction,
        countryRules.defaultTaxType,
      );

      // Filter to only future changes
      const futureRates = allRates.filter((rate) => rate.validFrom > now);

      // Sort by effective date
      futureRates.sort((a, b) => a.validFrom.getTime() - b.validFrom.getTime());

      // Get the current rate for comparison
      const currentRate = await this.taxRateService.getCurrentRate({
        country: countryCode,
        taxType: countryRules.defaultTaxType,
      });

      let previousRate = currentRate.rate;

      // Convert to the expected format
      futureRates.forEach((rate) => {
        upcomingChanges.push({
          effectiveDate: rate.validFrom,
          oldRate: previousRate,
          newRate: rate.rate,
          taxType: rate.taxType,
          description:
            rate.description ||
            `${rate.taxType} rate change from ${previousRate * 100}% to ${rate.rate * 100}%`,
          legalReference: rate.legalReference,
        });

        // Update previous rate for the next change
        previousRate = rate.rate;
      });

      // Add known upcoming changes not yet in the database
      if (countryCode === 'ZA' && upcomingChanges.length === 0) {
        // South Africa's upcoming VAT increases
        const may2025 = new Date('2025-05-01');
        const april2026 = new Date('2026-04-01');

        // Only add if they're still in the future
        if (may2025 > now) {
          upcomingChanges.push({
            effectiveDate: may2025,
            oldRate: 0.15,
            newRate: 0.155,
            taxType: 'VAT',
            description: 'VAT increase from 15% to 15.5%',
            legalReference: 'South Africa Budget 2025',
          });
        }

        if (april2026 > now) {
          upcomingChanges.push({
            effectiveDate: april2026,
            oldRate: 0.155,
            newRate: 0.16,
            taxType: 'VAT',
            description: 'VAT increase from 15.5% to 16%',
            legalReference: 'South Africa Budget 2025 (planned rate)',
          });
        }
      }

      // Add Ghana DST introduction if not in database
      if (countryCode === 'GH' && upcomingChanges.length === 0) {
        const july2025 = new Date('2025-07-01');

        if (july2025 > now) {
          upcomingChanges.push({
            effectiveDate: july2025,
            oldRate: 0,
            newRate: 0.015,
            taxType: 'Digital Services Tax',
            description: 'Introduction of Digital Services Tax at 1.5%',
            legalReference: 'Ghana Revenue Authority - DST Framework 2025',
          });
        }
      }
    } catch (error) {
      console.error(
        `Error getting upcoming rate changes for ${countryCode}:`,
        error,
      );
    }

    return upcomingChanges;
  }
}
