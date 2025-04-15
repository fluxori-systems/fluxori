/**
 * South African VAT Service
 * 
 * VAT service implementation for South Africa
 */

import { Injectable } from '@nestjs/common';
import { VatService } from '../vat.service.interface';
import { SouthAfricanVat, VatCalculation } from '../../utils/south-african-vat';

/**
 * South African VAT exempt product types
 */
const SA_VAT_EXEMPT_TYPES = [
  'book-educational',
  'export',
  'basic-food',
  'international-transport'
];

/**
 * South African VAT Service
 * 
 * Implementation of the VAT service interface for South Africa
 */
@Injectable()
export class SouthAfricanVatService implements VatService {
  /**
   * Calculate VAT for a price excluding VAT
   * 
   * @param price The price excluding VAT
   * @param productType Optional product type for special VAT rules
   * @param date Optional date for historical/future VAT rates
   * @returns VAT calculation result
   */
  calculateVat(price: number, productType?: string, date: Date = new Date()): VatCalculation {
    // Check if product type is VAT exempt
    if (productType && this.isVatExempt(productType)) {
      // Return zero VAT calculation
      return {
        vatRate: 0,
        vatRatePercentage: 0,
        vatAmount: 0,
        priceExcludingVat: price,
        priceIncludingVat: price,
        rateScheduleInfo: {
          validFrom: new Date('1900-01-01'),
          description: 'VAT Exempt'
        }
      };
    }
    
    // Use the South African VAT utility for standard calculation
    return SouthAfricanVat.calculateVat(price, date);
  }
  
  /**
   * Calculate price excluding VAT from a price including VAT
   * 
   * @param priceWithVat The price including VAT
   * @param productType Optional product type for special VAT rules
   * @param date Optional date for historical/future VAT rates
   * @returns VAT calculation result
   */
  removeVat(priceWithVat: number, productType?: string, date: Date = new Date()): VatCalculation {
    // Check if product type is VAT exempt
    if (productType && this.isVatExempt(productType)) {
      // Return zero VAT calculation
      return {
        vatRate: 0,
        vatRatePercentage: 0,
        vatAmount: 0,
        priceExcludingVat: priceWithVat,
        priceIncludingVat: priceWithVat,
        rateScheduleInfo: {
          validFrom: new Date('1900-01-01'),
          description: 'VAT Exempt'
        }
      };
    }
    
    // Use the South African VAT utility for standard calculation
    return SouthAfricanVat.removeVat(priceWithVat, date);
  }
  
  /**
   * Get current VAT rate
   * 
   * @param productType Optional product type for special VAT rules
   * @param date Optional date for historical/future VAT rates
   * @returns The VAT rate as a decimal (e.g., 0.15 for 15%)
   */
  getVatRate(productType?: string, date: Date = new Date()): number {
    // Check if product type is VAT exempt
    if (productType && this.isVatExempt(productType)) {
      return 0;
    }
    
    // Use the South African VAT utility to get the rate
    const vatSchedule = SouthAfricanVat.getVatRateForDate(date);
    return vatSchedule.rate;
  }
  
  /**
   * Get VAT rate name or description
   * 
   * @param productType Optional product type for special VAT rules
   * @param date Optional date
   * @returns The VAT rate name or description (e.g., "Standard Rate 15%")
   */
  getVatRateName(productType?: string, date: Date = new Date()): string {
    // Check if product type is VAT exempt
    if (productType && this.isVatExempt(productType)) {
      return 'VAT Exempt (0%)';
    }
    
    // Use the South African VAT utility to get the rate info
    const vatSchedule = SouthAfricanVat.getVatRateForDate(date);
    const ratePercentage = vatSchedule.rate * 100;
    
    return `Standard Rate (${ratePercentage}%)`;
  }
  
  /**
   * Check if a product type is VAT exempt
   * 
   * @param productType The product type
   * @returns Whether the product type is VAT exempt
   */
  isVatExempt(productType: string): boolean {
    return SA_VAT_EXEMPT_TYPES.includes(productType.toLowerCase());
  }
  
  /**
   * Get a breakdown of VAT rates for multiple periods
   * 
   * @param price The base price
   * @param includesVat Whether the price already includes VAT
   * @returns Array of VAT calculations for different periods
   */
  getVatRateChangesBreakdown(price: number, includesVat: boolean = false): VatCalculation[] {
    return SouthAfricanVat.getVatRateChangesBreakdown(price, includesVat);
  }
}