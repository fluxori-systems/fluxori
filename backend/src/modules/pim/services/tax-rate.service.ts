/**
 * Centralized Tax Rate Service
 *
 * Implementation of the Tax Rate Service that provides tax rates for all regions
 */

import { Injectable } from '@nestjs/common';

import {
  TaxRateService as ITaxRateService,
  TaxRateRequest,
  TaxRateResult,
  TaxRateSchedule,
  TaxJurisdiction,
  TaxType,
  TaxJurisdictionLevel,
} from '../interfaces/tax-rate.interface';
import { TaxRateRepository } from '../repositories/tax-rate.repository';

/**
 * Centralized Tax Rate Service
 *
 * Core service providing access to tax rates across all regions
 */
@Injectable()
export class TaxRateService implements ITaxRateService {
  /**
   * Constructor
   *
   * @param taxRateRepository Repository for tax rate data
   */
  constructor(private readonly taxRateRepository: TaxRateRepository) {}

  /**
   * Get the current tax rate for the given parameters
   *
   * @param params Tax rate request parameters
   * @returns Promise with tax rate result
   */
  async getCurrentRate(params: TaxRateRequest): Promise<TaxRateResult> {
    // Use current date if not specified
    const date = params.transactionDate || new Date();
    return this.getRateAtDate({ ...params, transactionDate: date });
  }

  /**
   * Get tax rate valid at a specific date
   *
   * @param params Tax rate request parameters
   * @returns Promise with tax rate result
   */
  async getRateAtDate(params: TaxRateRequest): Promise<TaxRateResult> {
    // Ensure we have a transaction date
    const transactionDate = params.transactionDate || new Date();

    // Build jurisdiction from params
    const jurisdiction: TaxJurisdiction = {
      country: params.country,
      region: params.region,
      city: params.city,
      level: params.city ? TaxJurisdictionLevel.CITY : params.region ? TaxJurisdictionLevel.PROVINCE : TaxJurisdictionLevel.COUNTRY,
    };

    // First check for product-specific rates if we have product info
    if (
      params.productType ||
      (params.productCategories && params.productCategories.length > 0)
    ) {
      try {
        const specialRate = await this.taxRateRepository.findSpecialRate(
          jurisdiction,
          params.taxType,
          transactionDate,
          params.productType,
          params.productCategories,
        );

        if (specialRate) {
          return this.convertScheduleToResult(
            specialRate,
            true,
            params.includeHistory,
          );
        }
      } catch (error) {
        // Fall back to standard rate if there's an error finding special rates
        console.error('Error finding special tax rate:', error);
      }
    }

    // Get standard rate for this jurisdiction and date
    const standardRate = await this.taxRateRepository.findRateAtDate(
      jurisdiction,
      params.taxType,
      transactionDate,
    );

    if (!standardRate) {
      throw new Error(
        `No tax rate found for jurisdiction ${params.country}${params.region ? '/' + params.region : ''} and tax type ${params.taxType} at date ${transactionDate.toISOString()}`,
      );
    }

    return this.convertScheduleToResult(
      standardRate,
      false,
      params.includeHistory,
    );
  }

  /**
   * Get all tax rates for a jurisdiction
   *
   * @param jurisdiction Tax jurisdiction
   * @param includeHistory Whether to include historical and future rates
   * @returns Promise with array of tax rate schedules
   */
  async getAllRatesForJurisdiction(
    jurisdiction: TaxJurisdiction,
    includeHistory: boolean = false,
  ): Promise<TaxRateSchedule[]> {
    return this.taxRateRepository.findAllRatesForJurisdiction(
      jurisdiction,
      includeHistory,
    );
  }

  /**
   * Get rate changes for a specific jurisdiction and tax type
   *
   * @param jurisdiction Tax jurisdiction
   * @param taxType Tax type
   * @returns Promise with rate changes over time
   */
  async getRateChanges(
    jurisdiction: TaxJurisdiction,
    taxType: TaxType | string,
  ): Promise<TaxRateSchedule[]> {
    return this.taxRateRepository.findRateChanges(jurisdiction, taxType);
  }

  /**
   * Check if a product is tax exempt in the given jurisdiction
   *
   * @param params Tax rate request parameters with product info
   * @returns Promise with boolean indicating tax exemption
   */
  async isExempt(params: TaxRateRequest): Promise<boolean> {
    // Ensure we have a transaction date
    const transactionDate = params.transactionDate || new Date();

    // Build jurisdiction from params
    const jurisdiction: TaxJurisdiction = {
      country: params.country,
      region: params.region,
      city: params.city,
      level: params.city ? TaxJurisdictionLevel.CITY : params.region ? TaxJurisdictionLevel.PROVINCE : TaxJurisdictionLevel.COUNTRY,
    };

    // Check for zero-rated or exempt product types
    try {
      const specialRate = await this.taxRateRepository.findSpecialRate(
        jurisdiction,
        params.taxType,
        transactionDate,
        params.productType,
        params.productCategories,
      );

      if (specialRate && specialRate.rate === 0) {
        return true;
      }
    } catch (error) {
      console.error('Error checking tax exemption:', error);
      return false;
    }

    return false;
  }

  /**
   * Create a new tax rate schedule
   *
   * @param schedule Tax rate schedule to create
   * @returns Promise with created tax rate schedule
   */
  async createTaxRateSchedule(
    schedule: Omit<TaxRateSchedule, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<TaxRateSchedule> {
    return this.taxRateRepository.create(schedule);
  }

  /**
   * Update an existing tax rate schedule
   *
   * @param id Schedule ID to update
   * @param updates Updates to apply
   * @returns Promise with updated tax rate schedule
   */
  async updateTaxRateSchedule(
    id: string,
    updates: Partial<Omit<TaxRateSchedule, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<TaxRateSchedule> {
    return this.taxRateRepository.update(id, updates);
  }

  /**
   * Delete a tax rate schedule
   *
   * @param id Schedule ID to delete
   * @returns Promise indicating success
   */
  async deleteTaxRateSchedule(id: string): Promise<boolean> {
    await this.taxRateRepository.delete(id);
    return true;
  }

  /**
   * Get product types with special tax rates in a jurisdiction
   *
   * @param jurisdiction Tax jurisdiction
   * @returns Promise with array of product types and their rates
   */
  async getSpecialRateProductTypes(
    jurisdiction: TaxJurisdiction,
  ): Promise<Array<{ productType: string; rate: number; name: string }>> {
    const specialRates =
      await this.taxRateRepository.findSpecialRatesByJurisdiction(jurisdiction);

    // Map to the expected return format
    return specialRates.map((rate) => ({
      productType: rate.metadata?.productType || 'unknown',
      rate: rate.rate,
      name: rate.name,
    }));
  }

  /**
   * Convert a tax rate schedule to a tax rate result
   *
   * @param schedule The tax rate schedule
   * @param isSpecialRate Whether this is a special rate
   * @param includeHistory Whether to include historical rates
   * @returns Tax rate result
   */
  private async convertScheduleToResult(
    schedule: TaxRateSchedule,
    isSpecialRate: boolean = false,
    includeHistory: boolean = false,
  ): Promise<TaxRateResult> {
    const result: TaxRateResult = {
      rate: schedule.rate,
      ratePercentage: schedule.rate * 100,
      name: schedule.name,
      taxType: schedule.taxType,
      jurisdiction: schedule.jurisdiction,
      validFrom: schedule.validFrom,
      validTo: schedule.validTo,
      description: schedule.description,
      scheduleId: schedule.id,
      isSpecialRate,
      legalReference: schedule.legalReference,
    };

    // Include history if requested
    if (includeHistory) {
      const allRates = await this.getRateChanges(
        schedule.jurisdiction,
        schedule.taxType,
      );
      const now = new Date();

      result.history = {
        past: allRates.filter((rate) =>
          rate.validTo ? rate.validTo < now : false,
        ),
        future: allRates.filter((rate) => rate.validFrom > now),
      };
    }

    return result;
  }
}
