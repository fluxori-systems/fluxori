/**
 * South African VAT Rate Management
 *
 * This utility manages VAT rates according to South African tax regulations,
 * including the 2025 National Budget-announced rate changes:
 * - Current rate: 15.0% (until April 30, 2025)
 * - First increase: 15.5% (May 1, 2025 to March 31, 2026)
 * - Second increase: 16.0% (from April 1, 2026)
 */

/**
 * Interface for VAT rate schedule
 */
export interface VatRateSchedule {
  /**
   * VAT rate as a decimal (e.g., 0.15 for 15%)
   */
  rate: number;

  /**
   * Date from which this rate is valid
   */
  validFrom: Date;

  /**
   * Date until which this rate is valid (undefined for the current rate)
   */
  validTo?: Date;

  /**
   * Description of the rate period
   */
  description: string;
}

/**
 * Interface for VAT calculation result
 */
export interface VatCalculation {
  /**
   * VAT rate used for calculation (decimal form)
   */
  vatRate: number;

  /**
   * VAT rate as percentage (e.g., 15.0)
   */
  vatRatePercentage: number;

  /**
   * Amount of VAT
   */
  vatAmount: number;

  /**
   * Price excluding VAT
   */
  priceExcludingVat: number;

  /**
   * Price including VAT
   */
  priceIncludingVat: number;

  /**
   * Information about the rate schedule used
   */
  rateScheduleInfo: {
    validFrom: Date;
    validTo?: Date;
    description: string;
  };
}

/**
 * Utility class for South African VAT calculations
 */
export class SouthAfricanVat {
  // VAT rate schedule with implementation of announced changes
  private static readonly VAT_RATES: VatRateSchedule[] = [
    {
      rate: 0.15, // 15.0%
      validFrom: new Date('1900-01-01'), // Default historical rate
      validTo: new Date('2025-04-30T23:59:59.999Z'),
      description: 'Standard VAT rate until April 30, 2025',
    },
    {
      rate: 0.155, // 15.5%
      validFrom: new Date('2025-05-01T00:00:00.000Z'),
      validTo: new Date('2026-03-31T23:59:59.999Z'),
      description: 'VAT rate from May 1, 2025 to March 31, 2026',
    },
    {
      rate: 0.16, // 16.0%
      validFrom: new Date('2026-04-01T00:00:00.000Z'),
      validTo: undefined, // No end date for latest rate
      description: 'VAT rate from April 1, 2026 onwards',
    },
  ];

  /**
   * Get the applicable VAT rate for a specific date
   *
   * @param date The date to check (defaults to current date)
   * @returns The applicable VAT rate schedule
   */
  public static getVatRateForDate(date: Date = new Date()): VatRateSchedule {
    const applicableRate = this.VAT_RATES.find(
      (rate) =>
        date >= rate.validFrom && (!rate.validTo || date <= rate.validTo),
    );

    if (!applicableRate) {
      // Fallback to the latest rate if no match found
      return this.VAT_RATES[this.VAT_RATES.length - 1];
    }

    return applicableRate;
  }

  /**
   * Get all VAT rates
   *
   * @returns Array of all VAT rate schedules
   */
  public static getAllVatRates(): VatRateSchedule[] {
    return [...this.VAT_RATES];
  }

  /**
   * Calculate VAT for a price excluding VAT
   *
   * @param priceExcludingVat The price excluding VAT
   * @param date The date to use for VAT rate determination
   * @returns VAT calculation result
   */
  public static calculateVat(
    priceExcludingVat: number,
    date: Date = new Date(),
  ): VatCalculation {
    const vatSchedule = this.getVatRateForDate(date);
    const vatRate = vatSchedule.rate;
    const vatAmount = priceExcludingVat * vatRate;
    const priceIncludingVat = priceExcludingVat + vatAmount;

    return {
      vatRate,
      vatRatePercentage: vatRate * 100,
      vatAmount,
      priceExcludingVat,
      priceIncludingVat,
      rateScheduleInfo: {
        validFrom: vatSchedule.validFrom,
        validTo: vatSchedule.validTo,
        description: vatSchedule.description,
      },
    };
  }

  /**
   * Calculate price excluding VAT from a price including VAT
   *
   * @param priceIncludingVat The price including VAT
   * @param date The date to use for VAT rate determination
   * @returns VAT calculation result
   */
  public static removeVat(
    priceIncludingVat: number,
    date: Date = new Date(),
  ): VatCalculation {
    const vatSchedule = this.getVatRateForDate(date);
    const vatRate = vatSchedule.rate;
    const priceExcludingVat = priceIncludingVat / (1 + vatRate);
    const vatAmount = priceIncludingVat - priceExcludingVat;

    return {
      vatRate,
      vatRatePercentage: vatRate * 100,
      vatAmount,
      priceExcludingVat,
      priceIncludingVat,
      rateScheduleInfo: {
        validFrom: vatSchedule.validFrom,
        validTo: vatSchedule.validTo,
        description: vatSchedule.description,
      },
    };
  }

  /**
   * Generate VAT rate changes breakdown for a price
   *
   * @param price The price (excluding VAT)
   * @param includesVat Whether the price already includes VAT
   * @returns Array of VAT calculations for all rate periods
   */
  public static getVatRateChangesBreakdown(
    price: number,
    includesVat: boolean = false,
  ): VatCalculation[] {
    return this.VAT_RATES.map((ratePeriod) => {
      const midpointDate = this.getMidpointDate(
        ratePeriod.validFrom,
        ratePeriod.validTo,
      );

      if (includesVat) {
        return this.removeVat(price, midpointDate);
      } else {
        return this.calculateVat(price, midpointDate);
      }
    });
  }

  /**
   * Helper method to get a midpoint date between two dates
   *
   * @param startDate The start date
   * @param endDate The end date (optional)
   * @returns The midpoint date
   */
  private static getMidpointDate(startDate: Date, endDate?: Date): Date {
    if (!endDate) {
      // If no end date, use a date far in the future for the current rate
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 10);
      endDate = futureDate;
    }

    const midpointTime = (startDate.getTime() + endDate.getTime()) / 2;
    return new Date(midpointTime);
  }
}
