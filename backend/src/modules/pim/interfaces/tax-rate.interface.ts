/**
 * Tax Rate Service Interfaces
 *
 * Interfaces and types for the Centralized Tax Rate Service
 */

/**
 * Tax type enum
 */
export enum TaxType {
  VAT = 'vat', // Value Added Tax
  GST = 'gst', // Goods and Services Tax
  SALES = 'sales', // Sales Tax
  CT = 'ct', // Consumption Tax
  CUSTOM = 'custom', // Custom tax type
}

/**
 * Tax jurisdiction level
 */
export enum TaxJurisdictionLevel {
  COUNTRY = 'country',
  STATE = 'state',
  PROVINCE = 'province',
  CITY = 'city',
  CUSTOM = 'custom',
}

/**
 * Tax jurisdiction identification
 */
export interface TaxJurisdiction {
  /**
   * Country code (ISO 3166-1 alpha-2)
   */
  country: string;

  /**
   * State/province/region (optional)
   */
  region?: string;

  /**
   * City/municipality (optional)
   */
  city?: string;

  /**
   * Jurisdiction level
   */
  level: TaxJurisdictionLevel;

  /**
   * Postal/ZIP code ranges (optional)
   */
  postalCodes?: string[];
}

/**
 * Tax rate schedule - a tax rate valid for a specific period
 */
export interface TaxRateSchedule {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * Tax jurisdiction this rate applies to
   */
  jurisdiction: TaxJurisdiction;

  /**
   * Tax type (VAT, GST, etc.)
   */
  taxType: TaxType;

  /**
   * Tax rate as a decimal (e.g., 0.15 for 15%)
   */
  rate: number;

  /**
   * Name of this tax rate (e.g., "Standard Rate", "Reduced Rate")
   */
  name: string;

  /**
   * Date from which this rate is valid
   */
  validFrom: Date;

  /**
   * Date until which this rate is valid (null for indefinite)
   */
  validTo: Date | null;

  /**
   * Description of this tax rate
   */
  description?: string;

  /**
   * Legal reference (e.g., law, regulation, announcement)
   */
  legalReference?: string;

  /**
   * Source URL for documentation
   */
  sourceUrl?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;

  /**
   * Creation date (for audit)
   */
  createdAt: Date;

  /**
   * Last update date (for audit)
   */
  updatedAt: Date;

  /**
   * User who created this rate entry
   */
  createdBy?: string;

  /**
   * User who last updated this rate entry
   */
  updatedBy?: string;
}

/**
 * Tax rate request parameters
 */
export interface TaxRateRequest {
  /**
   * Country code (ISO 3166-1 alpha-2)
   */
  country: string;

  /**
   * Region/state/province (optional)
   */
  region?: string;

  /**
   * City (optional for more specific rates)
   */
  city?: string;

  /**
   * Postal/ZIP code (optional)
   */
  postalCode?: string;

  /**
   * Tax type (VAT, GST, etc.)
   */
  taxType: TaxType | string;

  /**
   * Transaction date (defaults to current date)
   */
  transactionDate?: Date;

  /**
   * Product type (for special tax rates)
   */
  productType?: string;

  /**
   * Product categories (for category-specific rates)
   */
  productCategories?: string[];

  /**
   * Include historical rates
   */
  includeHistory?: boolean;

  /**
   * Additional context data
   */
  context?: Record<string, any>;
}

/**
 * Tax rate result
 */
export interface TaxRateResult {
  /**
   * The applicable tax rate as a decimal
   */
  rate: number;

  /**
   * The tax rate as a percentage (e.g., 15 for 15%)
   */
  ratePercentage: number;

  /**
   * Name of the tax rate (e.g., "Standard Rate")
   */
  name: string;

  /**
   * Tax type (VAT, GST, etc.)
   */
  taxType: TaxType | string;

  /**
   * Jurisdiction this rate applies to
   */
  jurisdiction: TaxJurisdiction;

  /**
   * Date from which this rate is valid
   */
  validFrom: Date;

  /**
   * Date until which this rate is valid
   */
  validTo: Date | null;

  /**
   * Description of this tax rate
   */
  description?: string;

  /**
   * Rate schedule ID for reference
   */
  scheduleId: string;

  /**
   * Historical rates if requested
   */
  history?: {
    past: TaxRateSchedule[];
    future: TaxRateSchedule[];
  };

  /**
   * Whether this is a special rate for specific product types
   */
  isSpecialRate: boolean;

  /**
   * Legal reference for this rate
   */
  legalReference?: string;
}

/**
 * Tax rate service interface
 *
 * Core interface for the Centralized Tax Rate Service
 */
export interface TaxRateService {
  /**
   * Get the current tax rate for the given parameters
   *
   * @param params Tax rate request parameters
   * @returns Promise with tax rate result
   */
  getCurrentRate(params: TaxRateRequest): Promise<TaxRateResult>;

  /**
   * Get tax rate valid at a specific date
   *
   * @param params Tax rate request parameters
   * @returns Promise with tax rate result
   */
  getRateAtDate(params: TaxRateRequest): Promise<TaxRateResult>;

  /**
   * Get all tax rates for a jurisdiction
   *
   * @param jurisdiction Tax jurisdiction
   * @param includeHistory Whether to include historical and future rates
   * @returns Promise with array of tax rate schedules
   */
  getAllRatesForJurisdiction(
    jurisdiction: TaxJurisdiction,
    includeHistory?: boolean,
  ): Promise<TaxRateSchedule[]>;

  /**
   * Get rate changes for a specific jurisdiction and tax type
   *
   * @param jurisdiction Tax jurisdiction
   * @param taxType Tax type
   * @returns Promise with rate changes over time
   */
  getRateChanges(
    jurisdiction: TaxJurisdiction,
    taxType: TaxType | string,
  ): Promise<TaxRateSchedule[]>;

  /**
   * Check if a product is tax exempt in the given jurisdiction
   *
   * @param params Tax rate request parameters with product info
   * @returns Promise with boolean indicating tax exemption
   */
  isExempt(params: TaxRateRequest): Promise<boolean>;

  /**
   * Create a new tax rate schedule
   *
   * @param schedule Tax rate schedule to create
   * @returns Promise with created tax rate schedule
   */
  createTaxRateSchedule(
    schedule: Omit<TaxRateSchedule, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<TaxRateSchedule>;

  /**
   * Update an existing tax rate schedule
   *
   * @param id Schedule ID to update
   * @param updates Updates to apply
   * @returns Promise with updated tax rate schedule
   */
  updateTaxRateSchedule(
    id: string,
    updates: Partial<Omit<TaxRateSchedule, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<TaxRateSchedule>;

  /**
   * Delete a tax rate schedule
   *
   * @param id Schedule ID to delete
   * @returns Promise indicating success
   */
  deleteTaxRateSchedule(id: string): Promise<boolean>;

  /**
   * Get product types with special tax rates in a jurisdiction
   *
   * @param jurisdiction Tax jurisdiction
   * @returns Promise with array of product types and their rates
   */
  getSpecialRateProductTypes(
    jurisdiction: TaxJurisdiction,
  ): Promise<Array<{ productType: string; rate: number; name: string }>>;
}
