/**
 * Stub type declarations for South African VAT utility
 */
export declare class SouthAfricanVat {
  static VAT_RATES: any[];
  static getVatRateForDate(date?: Date): any;
  static getAllVatRates(): any[];
  static calculateVat(priceExcludingVat: number, date?: Date): any;
  static removeVat(priceIncludingVat: number, date?: Date): any;
  static getVatRateChangesBreakdown(
    price: number,
    includesVat?: boolean,
  ): any[];
  static getMidpointDate(startDate: Date, endDate?: Date): Date;
}
