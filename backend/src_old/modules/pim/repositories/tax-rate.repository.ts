/**
 * Tax Rate Repository
 *
 * Repository for managing tax rate data
 */

import { Injectable } from "@nestjs/common";
import { TenantRepository } from "@common/repositories";
import { FirestoreConfigService } from "../../../config/firestore.config";
import {
  TaxRateSchedule,
  TaxJurisdiction,
  TaxType,
} from "../interfaces/tax-rate.interface";

/**
 * Tax Rate Repository
 *
 * Repository for storing and retrieving tax rate information
 */
@Injectable()
export class TaxRateRepository extends TenantAwareRepository<TaxRateSchedule> {
  /**
   * Constructor
   *
   * @param firestoreConfigService Firestore configuration service
   */
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, "tax-rates", {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 3600000, // 1 hour cache (tax rates change infrequently)
      requiredFields: ["jurisdiction", "taxType", "rate", "name", "validFrom"],
    });
  }

  /**
   * Find tax rate valid at a specific date
   *
   * @param jurisdiction Tax jurisdiction
   * @param taxType Tax type
   * @param date Date to check
   * @returns Tax rate schedule or null if not found
   */
  async findRateAtDate(
    jurisdiction: TaxJurisdiction,
    taxType: TaxType | string,
    date: Date,
  ): Promise<TaxRateSchedule | null> {
    // Build filters for jurisdiction
    const advancedFilters = this.buildJurisdictionFilters(jurisdiction);

    // Add tax type filter
    advancedFilters.push({
      field: "taxType",
      operator: "==",
      value: taxType,
    });

    // Add date range filters - rates valid at the specified date
    // (validFrom <= date && (validTo >= date || validTo == null))
    advancedFilters.push({
      field: "validFrom",
      operator: "<=",
      value: date,
    });

    // Query for rates
    const rates = await this.find({
      advancedFilters,
      queryOptions: {
        orderBy: "validFrom",
        direction: "desc", // Most recent first
      },
    });

    // Filter rates for which the date is within validity period
    const validRates = rates.filter((rate) => {
      // Check if rate is still valid at the date
      return !rate.validTo || rate.validTo >= date;
    });

    // Return the most recent rate (should only be one valid rate at any date)
    return validRates.length > 0 ? validRates[0] : null;
  }

  /**
   * Find special tax rate for a product type
   *
   * @param jurisdiction Tax jurisdiction
   * @param taxType Tax type
   * @param date Date to check
   * @param productType Optional product type
   * @param productCategories Optional product categories
   * @returns Special tax rate or null if not found
   */
  async findSpecialRate(
    jurisdiction: TaxJurisdiction,
    taxType: TaxType | string,
    date: Date,
    productType?: string,
    productCategories?: string[],
  ): Promise<TaxRateSchedule | null> {
    if (
      !productType &&
      (!productCategories || productCategories.length === 0)
    ) {
      return null;
    }

    // Build filters for jurisdiction and tax type
    const advancedFilters = this.buildJurisdictionFilters(jurisdiction);

    advancedFilters.push({
      field: "taxType",
      operator: "==",
      value: taxType,
    });

    // Add date range filters
    advancedFilters.push({
      field: "validFrom",
      operator: "<=",
      value: date,
    });

    // Add special rate flag
    advancedFilters.push({
      field: "metadata.isSpecialRate",
      operator: "==",
      value: true,
    });

    // Query for special rates
    const specialRates = await this.find({
      advancedFilters,
      queryOptions: {
        orderBy: "validFrom",
        direction: "desc",
      },
    });

    // Filter valid rates at the date
    const validRates = specialRates.filter((rate) => {
      // Check if rate is still valid at the date
      return !rate.validTo || rate.validTo >= date;
    });

    // If we have a product type, look for a direct match
    if (productType) {
      const productTypeMatch = validRates.find(
        (rate) =>
          rate.metadata?.productType === productType ||
          (rate.metadata?.productTypes &&
            Array.isArray(rate.metadata.productTypes) &&
            rate.metadata.productTypes.includes(productType)),
      );

      if (productTypeMatch) {
        return productTypeMatch;
      }
    }

    // If we have categories, look for category matches
    if (productCategories && productCategories.length > 0) {
      const categoryMatch = validRates.find((rate) => {
        if (
          !rate.metadata?.categories ||
          !Array.isArray(rate.metadata.categories)
        ) {
          return false;
        }

        // Check if any category matches
        return productCategories.some((category) =>
          rate.metadata.categories.includes(category),
        );
      });

      if (categoryMatch) {
        return categoryMatch;
      }
    }

    // No matches found
    return null;
  }

  /**
   * Find all tax rates for a jurisdiction
   *
   * @param jurisdiction Tax jurisdiction
   * @param includeHistory Whether to include historical rates
   * @returns Array of tax rate schedules
   */
  async findAllRatesForJurisdiction(
    jurisdiction: TaxJurisdiction,
    includeHistory: boolean = false,
  ): Promise<TaxRateSchedule[]> {
    // Build filters for jurisdiction
    const advancedFilters = this.buildJurisdictionFilters(jurisdiction);

    // If not including history, only get current rates
    if (!includeHistory) {
      const now = new Date();

      // Only include rates that are valid now
      // (validFrom <= now && (validTo >= now || validTo == null))
      advancedFilters.push({
        field: "validFrom",
        operator: "<=",
        value: now,
      });
    }

    // Find all matching rates
    const allRates = await this.find({
      advancedFilters,
      queryOptions: {
        orderBy: "validFrom",
        direction: "asc",
      },
    });

    // For current rates, filter to only those still valid
    if (!includeHistory) {
      const now = new Date();
      return allRates.filter((rate) => !rate.validTo || rate.validTo >= now);
    }

    return allRates;
  }

  /**
   * Find tax rate changes over time for a jurisdiction and tax type
   *
   * @param jurisdiction Tax jurisdiction
   * @param taxType Tax type
   * @returns Array of tax rate schedules ordered by validity date
   */
  async findRateChanges(
    jurisdiction: TaxJurisdiction,
    taxType: TaxType | string,
  ): Promise<TaxRateSchedule[]> {
    // Build filters for jurisdiction
    const advancedFilters = this.buildJurisdictionFilters(jurisdiction);

    // Add tax type filter
    advancedFilters.push({
      field: "taxType",
      operator: "==",
      value: taxType,
    });

    // Find all matching rates
    return this.find({
      advancedFilters,
      queryOptions: {
        orderBy: "validFrom",
        direction: "asc",
      },
    });
  }

  /**
   * Find special tax rates for a jurisdiction
   *
   * @param jurisdiction Tax jurisdiction
   * @returns Array of special tax rate schedules
   */
  async findSpecialRatesByJurisdiction(
    jurisdiction: TaxJurisdiction,
  ): Promise<TaxRateSchedule[]> {
    // Build filters for jurisdiction
    const advancedFilters = this.buildJurisdictionFilters(jurisdiction);

    // Add special rate flag
    advancedFilters.push({
      field: "metadata.isSpecialRate",
      operator: "==",
      value: true,
    });

    // Filter to only currently valid rates
    const now = new Date();
    advancedFilters.push({
      field: "validFrom",
      operator: "<=",
      value: now,
    });

    // Find all matching rates
    const rates = await this.find({
      advancedFilters,
      queryOptions: {
        orderBy: "validFrom",
        direction: "desc",
      },
    });

    // Filter to only currently valid rates
    return rates.filter((rate) => !rate.validTo || rate.validTo >= now);
  }

  /**
   * Build Firestore filters for a jurisdiction
   *
   * @param jurisdiction Tax jurisdiction
   * @returns Array of advanced filters for the jurisdiction
   */
  private buildJurisdictionFilters(jurisdiction: TaxJurisdiction) {
    const filters = [];

    // Add country filter
    filters.push({
      field: "jurisdiction.country",
      operator: "==",
      value: jurisdiction.country,
    });

    // Add region filter if specified
    if (jurisdiction.region) {
      filters.push({
        field: "jurisdiction.region",
        operator: "==",
        value: jurisdiction.region,
      });
    }

    // Add city filter if specified
    if (jurisdiction.city) {
      filters.push({
        field: "jurisdiction.city",
        operator: "==",
        value: jurisdiction.city,
      });
    }

    return filters;
  }
}
