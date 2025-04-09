'use client';

/**
 * Currency formatter utility for Fluxori
 * Specializes in South African Rand (ZAR) formatting
 */

/**
 * Formats a number as currency
 * @param amount The amount to format
 * @param currency The currency code (default: ZAR)
 * @param locale The locale to use (default: en-ZA)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'ZAR',
  locale: string = 'en-ZA'
): string {
  try {
    // Use Intl.NumberFormat for proper currency formatting
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback for older browsers or unsupported currencies
    const currencySymbol = getCurrencySymbol(currency);
    return `${currencySymbol}${amount.toFixed(2)}`;
  }
}

/**
 * Get currency symbol from currency code
 * @param currency Currency code
 * @returns Currency symbol
 */
function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'ZAR': 'R',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'AUD': 'A$',
    'NAD': 'N$', // Namibian Dollar
    'BWP': 'P',  // Botswana Pula
    'ZMW': 'K',  // Zambian Kwacha
    'MZN': 'MT', // Mozambican Metical
    'LSL': 'L',  // Lesotho Loti
    'SZL': 'E',  // Swazi Lilangeni
  };
  
  return symbols[currency] || currency;
}

/**
 * Format price specifically for South African market
 * Includes VAT display and optional deposit
 * @param amount Price amount
 * @param includeVAT Whether to show VAT included text
 * @param deposit Optional deposit amount 
 * @returns Formatted price string with VAT indication
 */
export function formatSAPriceWithVAT(
  amount: number,
  includeVAT: boolean = true,
  deposit?: number
): string {
  const formattedPrice = formatCurrency(amount);
  
  if (deposit && deposit > 0) {
    const formattedDeposit = formatCurrency(deposit);
    return `${formattedPrice} (${includeVAT ? 'incl. VAT, ' : ''}${formattedDeposit} deposit)`;
  }
  
  return includeVAT ? `${formattedPrice} (incl. VAT)` : formattedPrice;
}

/**
 * Format discount to show percentage and amount
 * @param originalPrice Original price
 * @param currentPrice Current discounted price
 * @returns Formatted discount string
 */
export function formatDiscount(originalPrice: number, currentPrice: number): string {
  const discountAmount = originalPrice - currentPrice;
  const discountPercentage = Math.round((discountAmount / originalPrice) * 100);
  
  const formattedAmount = formatCurrency(discountAmount);
  return `Save ${formattedAmount} (${discountPercentage}%)`;
}