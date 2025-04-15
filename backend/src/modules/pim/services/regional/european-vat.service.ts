/**
 * European VAT Service
 * 
 * VAT service implementation for European countries
 */

import { Injectable } from '@nestjs/common';
import { VatService } from '../vat.service.interface';
import { VatCalculation } from '../../utils/south-african-vat';

/**
 * European VAT rates by country (as of 2025)
 */
const EU_VAT_RATES: Record<string, { 
  standard: number, 
  reduced?: number, 
  superReduced?: number,
  exempt?: string[]
}> = {
  // Country codes use ISO-3166-1 alpha-2
  'at': { standard: 0.20, reduced: 0.10 }, // Austria
  'be': { standard: 0.21, reduced: 0.06, superReduced: 0.00 }, // Belgium
  'bg': { standard: 0.20, reduced: 0.09 }, // Bulgaria
  'cy': { standard: 0.19, reduced: 0.09, superReduced: 0.05 }, // Cyprus
  'cz': { standard: 0.21, reduced: 0.15, superReduced: 0.10 }, // Czech Republic
  'de': { standard: 0.19, reduced: 0.07 }, // Germany
  'dk': { standard: 0.25 }, // Denmark
  'ee': { standard: 0.22, reduced: 0.09 }, // Estonia
  'es': { standard: 0.21, reduced: 0.10, superReduced: 0.04 }, // Spain
  'fi': { standard: 0.24, reduced: 0.14, superReduced: 0.10 }, // Finland
  'fr': { standard: 0.20, reduced: 0.10, superReduced: 0.055 }, // France
  'gr': { standard: 0.24, reduced: 0.13, superReduced: 0.06 }, // Greece
  'hr': { standard: 0.25, reduced: 0.13, superReduced: 0.05 }, // Croatia
  'hu': { standard: 0.27, reduced: 0.18, superReduced: 0.05 }, // Hungary
  'ie': { standard: 0.23, reduced: 0.135, superReduced: 0.09 }, // Ireland
  'it': { standard: 0.22, reduced: 0.10, superReduced: 0.04 }, // Italy
  'lt': { standard: 0.21, reduced: 0.09, superReduced: 0.05 }, // Lithuania
  'lu': { standard: 0.17, reduced: 0.14, superReduced: 0.08 }, // Luxembourg
  'lv': { standard: 0.21, reduced: 0.12, superReduced: 0.05 }, // Latvia
  'mt': { standard: 0.18, reduced: 0.07, superReduced: 0.05 }, // Malta
  'nl': { standard: 0.21, reduced: 0.09 }, // Netherlands
  'pl': { standard: 0.23, reduced: 0.08, superReduced: 0.05 }, // Poland
  'pt': { standard: 0.23, reduced: 0.13, superReduced: 0.06 }, // Portugal
  'ro': { standard: 0.19, reduced: 0.09, superReduced: 0.05 }, // Romania
  'se': { standard: 0.25, reduced: 0.12, superReduced: 0.06 }, // Sweden
  'si': { standard: 0.22, reduced: 0.095 }, // Slovenia
  'sk': { standard: 0.20, reduced: 0.10 }, // Slovakia
  
  // Non-EU but following similar VAT rules
  'gb': { standard: 0.20, reduced: 0.05, exempt: ['books', 'children-clothing'] }, // UK
  'ch': { standard: 0.077, reduced: 0.025 }, // Switzerland
  'no': { standard: 0.25, reduced: 0.15, superReduced: 0.12 }, // Norway
};

// Products that typically use reduced VAT rates
const REDUCED_RATE_PRODUCTS = [
  'food-basic',
  'water-supply',
  'pharmaceuticals',
  'medical-equipment',
  'books-physical',
  'newspapers',
  'hotel-accommodation',
  'restaurant-services',
  'public-transport'
];

// Products that typically use super-reduced VAT rates
const SUPER_REDUCED_RATE_PRODUCTS = [
  'food-essential',
  'books-educational',
  'medical-prescription',
  'disability-equipment',
  'children-clothing'
];

/**
 * European VAT Service
 * 
 * Implementation of the VAT service interface for European countries
 */
@Injectable()
export class EuropeanVatService implements VatService {
  /**
   * Calculate VAT for a price excluding VAT
   * 
   * @param price The price excluding VAT
   * @param productType Optional product type for special VAT rules
   * @param date Optional date for historical/future VAT rates
   * @param country Optional country code (defaults to 'gb')
   * @returns VAT calculation result
   */
  calculateVat(
    price: number, 
    productType?: string, 
    date: Date = new Date(),
    country: string = 'gb'
  ): VatCalculation {
    // Get the appropriate VAT rate
    const vatRate = this.determineVatRate(country, productType);
    
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
        description: this.getVatRateName(productType, date, country)
      }
    };
  }
  
  /**
   * Calculate price excluding VAT from a price including VAT
   * 
   * @param priceWithVat The price including VAT
   * @param productType Optional product type for special VAT rules
   * @param date Optional date
   * @param country Optional country code (defaults to 'gb')
   * @returns VAT calculation result
   */
  removeVat(
    priceWithVat: number,

    productType?: string,
    date: Date = new Date(),
    country: string = 'gb'
  ): VatCalculation {
    // Get the appropriate VAT rate
    const vatRate = this.determineVatRate(country, productType);
    
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
        description: this.getVatRateName(productType, date, country)
      }
    };
  }
  
  /**
   * Get current VAT rate based on country and product type
   * 
   * @param country The country code
   * @param productType Optional product type for special VAT rules
   * @returns The VAT rate as a decimal
   */
  determineVatRate(country: string = 'gb', productType?: string): number {
    // Default to UK if country not found
    const countryRates = EU_VAT_RATES[country.toLowerCase()] || EU_VAT_RATES['gb'];
    
    // Check if product is exempt
    if (productType && countryRates.exempt && 
        countryRates.exempt.some(type => productType.toLowerCase().includes(type))) {
      return 0;
    }
    
    // Check if product qualifies for super-reduced rate
    if (productType && countryRates.superReduced && 
        SUPER_REDUCED_RATE_PRODUCTS.some(type => productType.toLowerCase().includes(type))) {
      return countryRates.superReduced;
    }
    
    // Check if product qualifies for reduced rate
    if (productType && countryRates.reduced && 
        REDUCED_RATE_PRODUCTS.some(type => productType.toLowerCase().includes(type))) {
      return countryRates.reduced;
    }
    
    // Default to standard rate
    return countryRates.standard;
  }
  
  /**
   * Get current VAT rate
   * 
   * @param productType Optional product type for special VAT rules
   * @param date Optional date (not used in this implementation)
   * @param country Optional country code (defaults to 'gb')
   * @returns The VAT rate as a decimal
   */
  getVatRate(productType?: string, date: Date = new Date(), country: string = 'gb'): number {
    return this.determineVatRate(country, productType);
  }
  
  /**
   * Get VAT rate name or description
   * 
   * @param productType Optional product type for special VAT rules
   * @param date Optional date (not used in this implementation)
   * @param country Optional country code (defaults to 'gb')
   * @returns The VAT rate name or description
   */
  getVatRateName(productType?: string, date: Date = new Date(), country: string = 'gb'): string {
    // Default to UK if country not found
    const countryRates = EU_VAT_RATES[country.toLowerCase()] || EU_VAT_RATES['gb'];
    
    // Check if product is exempt
    if (productType && countryRates.exempt && 
        countryRates.exempt.some(type => productType.toLowerCase().includes(type))) {
      return 'VAT Exempt (0%)';
    }
    
    // Check if product qualifies for super-reduced rate
    if (productType && countryRates.superReduced && 
        SUPER_REDUCED_RATE_PRODUCTS.some(type => productType.toLowerCase().includes(type))) {
      const rate = countryRates.superReduced * 100;
      return `Super-Reduced Rate (${rate}%)`;
    }
    
    // Check if product qualifies for reduced rate
    if (productType && countryRates.reduced && 
        REDUCED_RATE_PRODUCTS.some(type => productType.toLowerCase().includes(type))) {
      const rate = countryRates.reduced * 100;
      return `Reduced Rate (${rate}%)`;
    }
    
    // Default to standard rate
    const rate = countryRates.standard * 100;
    return `Standard Rate (${rate}%)`;
  }
  
  /**
   * Check if a product type is VAT exempt
   * 
   * @param productType The product type
   * @param country Optional country code (defaults to 'gb')
   * @returns Whether the product type is VAT exempt
   */
  isVatExempt(productType: string, country: string = 'gb'): boolean {
    // Default to UK if country not found
    const countryRates = EU_VAT_RATES[country.toLowerCase()] || EU_VAT_RATES['gb'];
    
    // Check if product is exempt
    return !!(productType && countryRates.exempt && 
            countryRates.exempt.some(type => productType.toLowerCase().includes(type)));
  }
  
  /**
   * Get a breakdown of VAT rates for multiple periods
   * This is mainly relevant for South Africa with changing rates,
   * but included here for interface compatibility.
   * 
   * @param price The base price
   * @param includesVat Whether the price already includes VAT
   * @param country Optional country code (defaults to 'gb')
   * @returns Array of VAT calculations for different product types
   */
  getVatRateChangesBreakdown(
    price: number, 
    includesVat: boolean = false,
    country: string = 'gb'
  ): VatCalculation[] {
    // For European VAT, we'll just show different product type rates
    // rather than time-based changes
    
    const countryRates = EU_VAT_RATES[country.toLowerCase()] || EU_VAT_RATES['gb'];
    const result: VatCalculation[] = [];
    
    // Standard rate
    if (includesVat) {
      result.push(this.removeVat(price, 'standard-goods', new Date(), country));
    } else {
      result.push(this.calculateVat(price, 'standard-goods', new Date(), country));
    }
    
    // Reduced rate if available
    if (countryRates.reduced) {
      if (includesVat) {
        result.push(this.removeVat(price, 'food-basic', new Date(), country));
      } else {
        result.push(this.calculateVat(price, 'food-basic', new Date(), country));
      }
    }
    
    // Super-reduced rate if available
    if (countryRates.superReduced) {
      if (includesVat) {
        result.push(this.removeVat(price, 'books-educational', new Date(), country));
      } else {
        result.push(this.calculateVat(price, 'books-educational', new Date(), country));
      }
    }
    
    // Exempt if available
    if (countryRates.exempt && countryRates.exempt.length > 0) {
      if (includesVat) {
        result.push(this.removeVat(price, countryRates.exempt[0], new Date(), country));
      } else {
        result.push(this.calculateVat(price, countryRates.exempt[0], new Date(), country));
      }
    }
    
    return result;
  }
}