/**
 * VAT Service Interface
 *
 * Interface for VAT calculation services
 */

import { VatCalculation } from '../utils/south-african-vat';

/**
 * VAT Service interface
 *
 * Defines common methods for VAT services across different regions
 */
export interface VatService {
  /**
   * Calculate VAT for a price excluding VAT
   *
   * @param price The price excluding VAT
   * @param productType Optional product type for special VAT rules
   * @param date Optional date for historical/future VAT rates
   * @returns VAT calculation result
   */
  calculateVat(
    price: number,
    productType?: string,
    date?: Date,
  ): VatCalculation;

  /**
   * Calculate price excluding VAT from a price including VAT
   *
   * @param priceWithVat The price including VAT
   * @param productType Optional product type for special VAT rules
   * @param date Optional date for historical/future VAT rates
   * @returns VAT calculation result
   */
  removeVat(
    priceWithVat: number,
    productType?: string,
    date?: Date,
  ): VatCalculation;

  /**
   * Get current VAT rate
   *
   * @param productType Optional product type for special VAT rules
   * @param date Optional date for historical/future VAT rates
   * @returns The VAT rate as a decimal (e.g., 0.15 for 15%)
   */
  getVatRate(productType?: string, date?: Date): number;

  /**
   * Get VAT rate name or description
   *
   * @param productType Optional product type for special VAT rules
   * @param date Optional date
   * @returns The VAT rate name or description (e.g., "Standard Rate 15%")
   */
  getVatRateName(productType?: string, date?: Date): string;

  /**
   * Check if a product type is VAT exempt
   *
   * @param productType The product type
   * @returns Whether the product type is VAT exempt
   */
  isVatExempt(productType: string): boolean;

  /**
   * Get a breakdown of VAT rates for multiple periods
   *
   * @param price The base price
   * @param includesVat Whether the price already includes VAT
   * @returns Array of VAT calculations for different periods
   */
  getVatRateChangesBreakdown(
    price: number,
    includesVat?: boolean,
  ): VatCalculation[];
}
