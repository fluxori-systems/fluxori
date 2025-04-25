/**
 * Global VAT Service
 *
 * Default VAT service implementation for other regions
 */

import { Injectable } from '@nestjs/common';

import { VatCalculation } from '../../utils/south-african-vat';
import { VatService } from '../vat.service.interface';

/**
 * Simplified VAT rates for various regions
 */
const GLOBAL_VAT_RATES: Record<string, number> = {
  default: 0.15, // Default rate
  australia: 0.1, // GST
  'new-zealand': 0.15, // GST
  singapore: 0.08, // GST (increasing to 9% in 2024)
  japan: 0.1, // Consumption tax
  canada: 0.05, // GST (federal only, provinces have additional taxes)
  brazil: 0.17, // ICMS (varies by state and product)
  mexico: 0.16, // IVA
  india: 0.18, // GST (standard rate, varies by product)
  china: 0.13, // VAT (standard rate, varies by product)
};

/**
 * Global VAT Service
 *
 * Implementation of the VAT service interface for global use
 */
@Injectable()
export class GlobalVatService implements VatService {
  /**
   * Calculate VAT for a price excluding VAT
   *
   * @param price The price excluding VAT
   * @param productType Optional product type (not used in this implementation)
   * @param date Optional date (not used in this implementation)
   * @param region Optional region code (defaults to 'default')
   * @returns VAT calculation result
   */
  calculateVat(
    price: number,
    productType?: string,
    date: Date = new Date(),
    region: string = 'default',
  ): VatCalculation {
    // Get the VAT rate for this region
    const vatRate = this.getVatRateForRegion(region);

    // Calculate VAT
    const vatAmount = price * vatRate;
    const priceIncludingVat = price + vatAmount;

    return {
      vatRate,
      vatRatePercentage: vatRate * 100,
      vatAmount,
      priceExcludingVat: price,
      priceIncludingVat,
      rateScheduleInfo: {
        validFrom: new Date('2000-01-01'), // Just a placeholder
        description: this.getVatRateDescription(region),
      },
    };
  }

  /**
   * Calculate price excluding VAT from a price including VAT
   *
   * @param priceWithVat The price including VAT
   * @param productType Optional product type (not used in this implementation)
   * @param date Optional date (not used in this implementation)
   * @param region Optional region code (defaults to 'default')
   * @returns VAT calculation result
   */
  removeVat(
    priceWithVat: number,
    productType?: string,
    date: Date = new Date(),
    region: string = 'default',
  ): VatCalculation {
    // Get the VAT rate for this region
    const vatRate = this.getVatRateForRegion(region);

    // Calculate price excluding VAT
    const priceExcludingVat = priceWithVat / (1 + vatRate);
    const vatAmount = priceWithVat - priceExcludingVat;

    return {
      vatRate,
      vatRatePercentage: vatRate * 100,
      vatAmount,
      priceExcludingVat,
      priceIncludingVat: priceWithVat,
      rateScheduleInfo: {
        validFrom: new Date('2000-01-01'), // Just a placeholder
        description: this.getVatRateDescription(region),
      },
    };
  }

  /**
   * Get VAT rate for a specific region
   *
   * @param region The region code
   * @returns The VAT rate as a decimal
   */
  private getVatRateForRegion(region: string = 'default'): number {
    const normalizedRegion = region.toLowerCase();
    return GLOBAL_VAT_RATES[normalizedRegion] || GLOBAL_VAT_RATES.default;
  }

  /**
   * Get descriptive name for the VAT rate
   *
   * @param region The region code
   * @returns Description of the VAT rate
   */
  private getVatRateDescription(region: string = 'default'): string {
    const vatRate = this.getVatRateForRegion(region);
    const vatPercentage = vatRate * 100;

    const regionNames: Record<string, string> = {
      default: 'Standard',
      australia: 'Australia GST',
      'new-zealand': 'New Zealand GST',
      singapore: 'Singapore GST',
      japan: 'Japan Consumption Tax',
      canada: 'Canada GST',
      brazil: 'Brazil ICMS',
      mexico: 'Mexico IVA',
      india: 'India GST',
      china: 'China VAT',
    };

    const regionName = regionNames[region.toLowerCase()] || 'Standard';
    return `${regionName} (${vatPercentage}%)`;
  }

  /**
   * Get current VAT rate
   *
   * @param productType Optional product type (not used in this implementation)
   * @param date Optional date (not used in this implementation)
   * @param region Optional region code (defaults to 'default')
   * @returns The VAT rate as a decimal
   */
  getVatRate(
    productType?: string,
    date: Date = new Date(),
    region: string = 'default',
  ): number {
    return this.getVatRateForRegion(region);
  }

  /**
   * Get VAT rate name or description
   *
   * @param productType Optional product type (not used in this implementation)
   * @param date Optional date (not used in this implementation)
   * @param region Optional region code (defaults to 'default')
   * @returns The VAT rate name or description
   */
  getVatRateName(
    productType?: string,
    date: Date = new Date(),
    region: string = 'default',
  ): string {
    return this.getVatRateDescription(region);
  }

  /**
   * Check if a product type is VAT exempt
   *
   * In this simplified implementation, nothing is VAT exempt.
   * A more complex implementation would include region-specific rules.
   *
   * @param productType The product type
   * @returns Whether the product type is VAT exempt (always false in this implementation)
   */
  isVatExempt(productType: string): boolean {
    return false;
  }

  /**
   * Get a breakdown of VAT rates for multiple regions
   *
   * @param price The base price
   * @param includesVat Whether the price already includes VAT
   * @returns Array of VAT calculations for different regions
   */
  getVatRateChangesBreakdown(
    price: number,
    includesVat: boolean = false,
  ): VatCalculation[] {
    // Return calculations for a sample of regions
    const sampleRegions = [
      'default',
      'australia',
      'singapore',
      'japan',
      'canada',
    ];
    const result: VatCalculation[] = [];

    for (const region of sampleRegions) {
      if (includesVat) {
        result.push(this.removeVat(price, undefined, new Date(), region));
      } else {
        result.push(this.calculateVat(price, undefined, new Date(), region));
      }
    }

    return result;
  }
}
