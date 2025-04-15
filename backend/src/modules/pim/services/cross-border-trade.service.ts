import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { MarketContextService } from './market-context.service';
import { MarketFeature } from '../interfaces/market-context.interface';
import { FeatureFlagService } from '../../../modules/feature-flags/services/feature-flag.service';
import { MultiCurrencyService, PriceConversionResult } from './multi-currency.service';
import { RegionalWarehouseService, RegionalWarehouse } from './regional-warehouse.service';
import { AfricanTaxFrameworkService } from './african-tax-framework.service';
import { TaxRateRequest, TaxRateResult } from '../interfaces/tax-rate.interface';

/**
 * Cross-border shipping options
 */
export enum CrossBorderShippingMethod {
  /**
   * Standard shipping (slower but cheaper)
   */
  STANDARD = 'standard',

  /**
   * Express shipping (faster but more expensive)
   */
  EXPRESS = 'express',

  /**
   * Economy shipping (slowest and cheapest)
   */
  ECONOMY = 'economy',

  /**
   * Fulfilled by marketplace
   */
  FULFILLED_BY_MARKETPLACE = 'fulfilled_by_marketplace',

  /**
   * Freight shipping for large items
   */
  FREIGHT = 'freight',

  /**
   * Local pickup from nearest warehouse
   */
  LOCAL_PICKUP = 'local_pickup'
}

/**
 * Document type for cross-border trade
 */
export enum CrossBorderDocumentType {
  /**
   * Commercial invoice
   */
  COMMERCIAL_INVOICE = 'commercial_invoice',

  /**
   * Customs declaration form
   */
  CUSTOMS_DECLARATION = 'customs_declaration',

  /**
   * Certificate of origin
   */
  CERTIFICATE_OF_ORIGIN = 'certificate_of_origin',

  /**
   * Packing list
   */
  PACKING_LIST = 'packing_list',

  /**
   * Bill of lading
   */
  BILL_OF_LADING = 'bill_of_lading',

  /**
   * Export permit
   */
  EXPORT_PERMIT = 'export_permit',

  /**
   * Import permit
   */
  IMPORT_PERMIT = 'import_permit',

  /**
   * Phytosanitary certificate
   */
  PHYTOSANITARY_CERTIFICATE = 'phytosanitary_certificate',

  /**
   * Dangerous goods declaration
   */
  DANGEROUS_GOODS_DECLARATION = 'dangerous_goods_declaration'
}

/**
 * Cross-border product restriction level
 */
export enum ProductRestrictionLevel {
  /**
   * No restrictions, can be shipped freely
   */
  UNRESTRICTED = 'unrestricted',

  /**
   * Some restrictions, requires additional documentation
   */
  RESTRICTED = 'restricted',

  /**
   * Highly restricted, requires special permits
   */
  HIGHLY_RESTRICTED = 'highly_restricted',

  /**
   * Prohibited, cannot be shipped
   */
  PROHIBITED = 'prohibited'
}

/**
 * Customs information for a product
 */
export interface ProductCustomsInfo {
  /**
   * HS (Harmonized System) code
   */
  hsCode: string;

  /**
   * Product description for customs
   */
  description: string;

  /**
   * Country of origin
   */
  countryOfOrigin: string;

  /**
   * Declared value in the product's currency
   */
  declaredValue: number;

  /**
   * Currency of the declared value
   */
  declaredValueCurrency: string;

  /**
   * Product weight in kilograms
   */
  weightKg: number;

  /**
   * Product restriction level
   */
  restrictionLevel: ProductRestrictionLevel;

  /**
   * Required documents for this product
   */
  requiredDocuments?: CrossBorderDocumentType[];

  /**
   * Additional customs information
   */
  additionalInfo?: Record<string, any>;
}

/**
 * Regional trade agreement
 */
export interface RegionalTradeAgreement {
  /**
   * Agreement code (e.g., 'SADC', 'EAC', 'ECOWAS')
   */
  code: string;

  /**
   * Agreement name
   */
  name: string;

  /**
   * Member countries
   */
  memberCountries: string[];

  /**
   * Whether the agreement is active
   */
  isActive: boolean;

  /**
   * Duty-free thresholds
   */
  dutyFreeThresholds?: {
    /**
     * Maximum value for duty-free imports
     */
    value?: number;

    /**
     * Currency of the threshold value
     */
    currency?: string;

    /**
     * Maximum weight for duty-free imports (kg)
     */
    weightKg?: number;
  };

  /**
   * Required documents for this agreement
   */
  requiredDocuments?: CrossBorderDocumentType[];
}

/**
 * Duty calculation result
 */
export interface DutyCalculationResult {
  /**
   * Duty amount
   */
  dutyAmount: number;

  /**
   * Currency of the duty amount
   */
  currency: string;

  /**
   * Duty rate as a percentage
   */
  dutyRatePercentage: number;

  /**
   * Tax amount
   */
  taxAmount: number;

  /**
   * Customs processing fee
   */
  customsProcessingFee: number;

  /**
   * Total duties and taxes
   */
  totalDutiesAndTaxes: number;

  /**
   * Whether the shipment qualifies for duty-free treatment
   */
  isDutyFree: boolean;

  /**
   * Reason for duty-free status (if applicable)
   */
  dutyFreeReason?: string;

  /**
   * Required documents
   */
  requiredDocuments: CrossBorderDocumentType[];

  /**
   * Additional fees and descriptions
   */
  additionalFees?: Array<{
    description: string;
    amount: number;
  }>;
}

/**
 * Cross-border shipping estimate
 */
export interface CrossBorderShippingEstimate {
  /**
   * Origin country
   */
  originCountry: string;

  /**
   * Destination country
   */
  destinationCountry: string;

  /**
   * Shipping method
   */
  shippingMethod: CrossBorderShippingMethod;

  /**
   * Base shipping cost
   */
  baseCost: number;

  /**
   * Currency of the cost
   */
  currency: string;

  /**
   * Estimated delivery time in days (min-max)
   */
  estimatedDeliveryDays: {
    min: number;
    max: number;
  };

  /**
   * Duty and tax estimates
   */
  duties?: DutyCalculationResult;

  /**
   * Required documents
   */
  requiredDocuments: CrossBorderDocumentType[];

  /**
   * Total cost including duties and taxes
   */
  totalCost: number;

  /**
   * Whether the rate is guaranteed
   */
  isGuaranteed: boolean;

  /**
   * Tracking available
   */
  trackingAvailable: boolean;

  /**
   * Insurance options
   */
  insuranceOptions?: Array<{
    level: string;
    coverageAmount: number;
    cost: number;
  }>;

  /**
   * Carrier code
   */
  carrierCode?: string;

  /**
   * Carrier name
   */
  carrierName?: string;

  /**
   * Transit points (if any)
   */
  transitPoints?: string[];
}

/**
 * Cross-border shipment details
 */
export interface CrossBorderShipmentDetails {
  /**
   * Shipment ID
   */
  shipmentId: string;

  /**
   * Origin warehouse
   */
  originWarehouse: RegionalWarehouse;

  /**
   * Destination address
   */
  destinationAddress: {
    country: string;
    region?: string;
    city?: string;
    postalCode?: string;
    addressLine1: string;
    addressLine2?: string;
    recipientName: string;
    phoneNumber?: string;
  };

  /**
   * Products in the shipment
   */
  products: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    customsInfo: ProductCustomsInfo;
  }>;

  /**
   * Shipping method
   */
  shippingMethod: CrossBorderShippingMethod;

  /**
   * Shipping cost
   */
  shippingCost: number;

  /**
   * Duties and taxes
   */
  dutiesAndTaxes: DutyCalculationResult;

  /**
   * Currency
   */
  currency: string;

  /**
   * Total shipment value
   */
  totalValue: number;

  /**
   * Total weight in kg
   */
  totalWeightKg: number;

  /**
   * Required documents
   */
  requiredDocuments: CrossBorderDocumentType[];

  /**
   * Document statuses
   */
  documentStatus: Record<CrossBorderDocumentType, 'pending' | 'submitted' | 'approved' | 'rejected'>;

  /**
   * Tracking information
   */
  tracking?: {
    trackingNumber: string;
    trackingUrl: string;
    carrier: string;
    status: string;
    estimatedDelivery?: Date;
    events?: Array<{
      timestamp: Date;
      status: string;
      location?: string;
      description: string;
    }>;
  };

  /**
   * Insurance information
   */
  insurance?: {
    level: string;
    coverageAmount: number;
    cost: number;
    policyNumber?: string;
  };

  /**
   * Additional information
   */
  additionalInfo?: Record<string, any>;
}

/**
 * Cross-border shipping estimate request
 */
export interface ShippingEstimateRequest {
  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Origin country
   */
  originCountry: string;

  /**
   * Origin warehouse ID (optional)
   */
  originWarehouseId?: string;

  /**
   * Destination country
   */
  destinationCountry: string;

  /**
   * Destination region/province/state (optional)
   */
  destinationRegion?: string;

  /**
   * Destination postal code (optional)
   */
  destinationPostalCode?: string;

  /**
   * Products to ship
   */
  products: Array<{
    /**
     * Product ID
     */
    productId: string;

    /**
     * Product variant ID (if applicable)
     */
    variantId?: string;

    /**
     * Quantity
     */
    quantity: number;

    /**
     * Unit price
     */
    unitPrice: number;

    /**
     * Currency
     */
    currency: string;

    /**
     * HS code
     */
    hsCode?: string;

    /**
     * Product weight in kg
     */
    weightKg: number;
  }>;

  /**
   * Preferred shipping methods
   */
  preferredShippingMethods?: CrossBorderShippingMethod[];

  /**
   * Whether to include all available methods
   */
  includeAllMethods?: boolean;

  /**
   * Insurance requested
   */
  insuranceRequested?: boolean;

  /**
   * Insurance value
   */
  insuranceValue?: number;

  /**
   * Delivery date needed by
   */
  neededByDate?: Date;
}

/**
 * CrossBorderTradeService
 * 
 * Service for managing cross-border trade in African markets
 */
@Injectable()
export class CrossBorderTradeService {
  private readonly logger = new Logger(CrossBorderTradeService.name);

  // Cache for regional trade agreements to reduce lookups
  private readonly tradeAgreementCache: Map<string, RegionalTradeAgreement> = new Map();

  constructor(
    private readonly marketContextService: MarketContextService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly multiCurrencyService: MultiCurrencyService,
    private readonly regionalWarehouseService: RegionalWarehouseService,
    private readonly africanTaxFrameworkService: AfricanTaxFrameworkService
  ) {
    // Initialize trade agreement cache
    this.initializeTradeAgreements();
  }

  /**
   * Check if cross-border trade is enabled for an organization
   * 
   * @param organizationId Organization ID
   * @returns Boolean indicating if the feature is enabled
   */
  async isCrossBorderTradeEnabled(organizationId: string): Promise<boolean> {
    // Check with feature flag service first (more specific)
    const featureFlagEnabled = await this.featureFlagService.isEnabled(
      'pim.africa.cross-border-trade',
      organizationId
    );

    if (featureFlagEnabled) return true;

    // Check with market context as a fallback
    const marketContext = await this.marketContextService.getMarketContext(organizationId);
    const marketFeatureEnabled = await this.marketContextService.isFeatureAvailable(
      MarketFeature.CROSS_BORDER_TRADING,
      marketContext
    );

    return marketFeatureEnabled;
  }

  /**
   * Get all regional trade agreements
   * 
   * @returns Array of regional trade agreements
   */
  async getRegionalTradeAgreements(): Promise<RegionalTradeAgreement[]> {
    return Array.from(this.tradeAgreementCache.values());
  }

  /**
   * Get trade agreement by code
   * 
   * @param code Trade agreement code (e.g., 'SADC')
   * @returns Trade agreement or undefined if not found
   */
  async getTradeAgreementByCode(code: string): Promise<RegionalTradeAgreement | undefined> {
    return this.tradeAgreementCache.get(code);
  }

  /**
   * Get applicable trade agreements for a pair of countries
   * 
   * @param originCountry Origin country code
   * @param destinationCountry Destination country code
   * @returns Array of applicable trade agreements
   */
  async getApplicableTradeAgreements(
    originCountry: string,
    destinationCountry: string
  ): Promise<RegionalTradeAgreement[]> {
    const allAgreements = await this.getRegionalTradeAgreements();
    
    // Filter agreements that include both countries
    return allAgreements.filter(agreement => 
      agreement.isActive &&
      agreement.memberCountries.includes(originCountry) &&
      agreement.memberCountries.includes(destinationCountry)
    );
  }

  /**
   * Calculate duties and taxes for a cross-border shipment
   * 
   * @param params Calculation parameters
   * @returns Duty calculation result
   */
  async calculateDutiesAndTaxes(params: {
    organizationId: string;
    originCountry: string;
    destinationCountry: string;
    products: Array<{
      productId: string;
      hsCode: string;
      quantity: number;
      unitPrice: number;
      currency: string;
      weightKg: number;
    }>;
    shippingCost?: number;
    shippingCurrency?: string;
    insuranceAmount?: number;
    insuranceCurrency?: string;
  }): Promise<DutyCalculationResult> {
    this.logger.log(`Calculating duties for shipment from ${params.originCountry} to ${params.destinationCountry}`);

    // Check if feature is enabled
    const isEnabled = await this.isCrossBorderTradeEnabled(params.organizationId);
    if (!isEnabled) {
      throw new Error('Cross-border trade feature is not enabled for this organization');
    }

    // Get applicable trade agreements
    const agreements = await this.getApplicableTradeAgreements(
      params.originCountry,
      params.destinationCountry
    );

    // Determine if the shipment is duty-free based on trade agreements
    const isDutyFree = agreements.length > 0;
    let dutyFreeReason = '';
    if (isDutyFree) {
      dutyFreeReason = `Qualifies for duty-free treatment under ${agreements.map(a => a.name).join(', ')}`;
    }

    // Calculate total value in a common currency (USD)
    let totalValueUSD = 0;
    
    // Convert product prices to USD for duty calculation
    for (const product of params.products) {
      const conversionResult = await this.multiCurrencyService.convertPrice(
        product.unitPrice * product.quantity,
        product.currency,
        'USD'
      );
      totalValueUSD += conversionResult.convertedPrice;
    }

    // Add shipping cost if provided
    if (params.shippingCost && params.shippingCurrency) {
      const conversionResult = await this.multiCurrencyService.convertPrice(
        params.shippingCost,
        params.shippingCurrency,
        'USD'
      );
      totalValueUSD += conversionResult.convertedPrice;
    }

    // Add insurance amount if provided
    if (params.insuranceAmount && params.insuranceCurrency) {
      const conversionResult = await this.multiCurrencyService.convertPrice(
        params.insuranceAmount,
        params.insuranceCurrency,
        'USD'
      );
      totalValueUSD += conversionResult.convertedPrice;
    }

    // Check duty-free threshold for agreements
    if (agreements.length > 0) {
      const exceedsDutyFreeThreshold = agreements.some(agreement => {
        if (!agreement.dutyFreeThresholds) return false;
        
        // Check value threshold
        if (agreement.dutyFreeThresholds.value !== undefined && 
            agreement.dutyFreeThresholds.currency !== undefined) {
          // Convert threshold to USD for comparison
          const thresholdValueUSD = this.convertValueToUSD(
            agreement.dutyFreeThresholds.value,
            agreement.dutyFreeThresholds.currency
          );
          
          if (totalValueUSD > thresholdValueUSD) {
            return true;
          }
        }
        
        // Check weight threshold
        if (agreement.dutyFreeThresholds.weightKg !== undefined) {
          const totalWeightKg = params.products.reduce(
            (sum, product) => sum + (product.weightKg * product.quantity), 0
          );
          
          if (totalWeightKg > agreement.dutyFreeThresholds.weightKg) {
            return true;
          }
        }
        
        return false;
      });
      
      // If any threshold is exceeded, it's not duty-free
      if (exceedsDutyFreeThreshold) {
        isDutyFree = false;
      }
    }

    // Get destination country's duty rate
    const dutyRate = await this.getDutyRate(params.destinationCountry, isDutyFree);
    
    // Calculate duty amount
    const dutyAmount = isDutyFree ? 0 : (totalValueUSD * dutyRate);
    
    // Get destination country's tax rate
    const taxRate = await this.getTaxRate(params.destinationCountry);
    
    // Calculate tax amount (typically applied to duty + value)
    const taxAmount = (totalValueUSD + dutyAmount) * taxRate;
    
    // Calculate customs processing fee
    const customsProcessingFee = this.getCustomsProcessingFee(params.destinationCountry, totalValueUSD);
    
    // Calculate total duties and taxes
    const totalDutiesAndTaxes = dutyAmount + taxAmount + customsProcessingFee;
    
    // Determine required documents
    const requiredDocuments = await this.getRequiredDocuments(
      params.originCountry,
      params.destinationCountry,
      params.products,
      agreements
    );
    
    // Build the result
    return {
      dutyAmount,
      currency: 'USD', // Standardize on USD for the calculation result
      dutyRatePercentage: dutyRate * 100,
      taxAmount,
      customsProcessingFee,
      totalDutiesAndTaxes,
      isDutyFree,
      dutyFreeReason: isDutyFree ? dutyFreeReason : undefined,
      requiredDocuments,
      additionalFees: this.getAdditionalFees(params.destinationCountry, totalValueUSD)
    };
  }

  /**
   * Get shipping estimates for cross-border shipment
   * 
   * @param request Shipping estimate request
   * @returns Array of shipping estimates
   */
  async getShippingEstimates(
    request: ShippingEstimateRequest
  ): Promise<CrossBorderShippingEstimate[]> {
    this.logger.log(`Getting shipping estimates from ${request.originCountry} to ${request.destinationCountry}`);

    // Check if feature is enabled
    const isEnabled = await this.isCrossBorderTradeEnabled(request.organizationId);
    if (!isEnabled) {
      throw new Error('Cross-border trade feature is not enabled for this organization');
    }

    // Determine origin warehouse if not specified
    let originWarehouse: RegionalWarehouse | null = null;
    if (request.originWarehouseId) {
      originWarehouse = await this.regionalWarehouseService.getWarehouseById(
        request.organizationId,
        request.originWarehouseId
      );
    } else {
      // Find warehouses that can ship to destination country
      const warehouses = await this.regionalWarehouseService.findWarehouses({
        organizationId: request.organizationId,
        country: request.originCountry,
        canShipToCountry: request.destinationCountry,
        supportsCrossBorderShipping: true,
        activeOnly: true
      });
      
      if (warehouses.length > 0) {
        // Use the first available warehouse
        originWarehouse = warehouses[0];
      }
    }

    if (!originWarehouse) {
      throw new Error(`No suitable warehouse found in ${request.originCountry} for shipping to ${request.destinationCountry}`);
    }

    // Calculate total value and weight
    let totalValue = 0;
    let totalWeightKg = 0;
    let baseCurrency = '';

    for (const product of request.products) {
      totalValue += product.unitPrice * product.quantity;
      totalWeightKg += product.weightKg * product.quantity;
      
      // Use the currency of the first product as base
      if (!baseCurrency) {
        baseCurrency = product.currency;
      } else if (baseCurrency !== product.currency) {
        // If mixed currencies, convert to the warehouse currency
        const converted = await this.multiCurrencyService.convertPrice(
          product.unitPrice * product.quantity,
          product.currency,
          originWarehouse.operatingCurrency
        );
        totalValue += converted.convertedPrice;
      }
    }

    // Calculate duties and taxes
    const dutiesResult = await this.calculateDutiesAndTaxes({
      organizationId: request.organizationId,
      originCountry: request.originCountry,
      destinationCountry: request.destinationCountry,
      products: request.products.map(p => ({
        ...p,
        hsCode: p.hsCode || '0000.00.00' // Default HS code if not provided
      }))
    });

    // Convert duties to the warehouse currency
    const dutiesInWarehouseCurrency = await this.multiCurrencyService.convertPrice(
      dutiesResult.totalDutiesAndTaxes,
      'USD', // Duties are calculated in USD
      originWarehouse.operatingCurrency
    );

    // Determine available shipping methods
    const availableMethods = request.includeAllMethods
      ? Object.values(CrossBorderShippingMethod)
      : request.preferredShippingMethods || [
          CrossBorderShippingMethod.STANDARD,
          CrossBorderShippingMethod.EXPRESS
        ];

    // Get estimates for each shipping method
    const estimates: CrossBorderShippingEstimate[] = [];

    for (const method of availableMethods) {
      // Skip methods that aren't suitable (e.g., don't offer fulfillment by marketplace if not supported)
      if (method === CrossBorderShippingMethod.FULFILLED_BY_MARKETPLACE && 
          !originWarehouse.taxAndCompliance?.customsInfo?.supportsFulfilledByMarketplace) {
        continue;
      }

      // Calculate shipping cost for this method
      const { cost, deliveryDays } = this.calculateShippingCost(
        method,
        request.originCountry,
        request.destinationCountry,
        totalWeightKg,
        totalValue,
        originWarehouse.operatingCurrency
      );

      // Calculate total cost
      const totalCost = cost + dutiesInWarehouseCurrency.convertedPrice;

      // Add insurance options if requested
      let insuranceOptions = undefined;
      if (request.insuranceRequested) {
        insuranceOptions = this.getInsuranceOptions(
          totalValue,
          request.insuranceValue,
          originWarehouse.operatingCurrency
        );
      }

      // Determine required documents for this shipping method
      const requiredDocuments = [
        ...dutiesResult.requiredDocuments,
        ...this.getDocumentsForShippingMethod(method)
      ];

      // Add the estimate
      estimates.push({
        originCountry: request.originCountry,
        destinationCountry: request.destinationCountry,
        shippingMethod: method,
        baseCost: cost,
        currency: originWarehouse.operatingCurrency,
        estimatedDeliveryDays: deliveryDays,
        duties: {
          ...dutiesResult,
          // Update currency to match the warehouse
          currency: originWarehouse.operatingCurrency,
          dutyAmount: dutiesInWarehouseCurrency.convertedPrice * (dutiesResult.dutyAmount / dutiesResult.totalDutiesAndTaxes),
          taxAmount: dutiesInWarehouseCurrency.convertedPrice * (dutiesResult.taxAmount / dutiesResult.totalDutiesAndTaxes),
          customsProcessingFee: dutiesInWarehouseCurrency.convertedPrice * (dutiesResult.customsProcessingFee / dutiesResult.totalDutiesAndTaxes),
          totalDutiesAndTaxes: dutiesInWarehouseCurrency.convertedPrice
        },
        requiredDocuments,
        totalCost,
        isGuaranteed: method === CrossBorderShippingMethod.EXPRESS,
        trackingAvailable: method !== CrossBorderShippingMethod.ECONOMY,
        insuranceOptions,
        carrierCode: this.getCarrierCode(method, request.originCountry, request.destinationCountry),
        carrierName: this.getCarrierName(method, request.originCountry, request.destinationCountry),
        transitPoints: this.getTransitPoints(request.originCountry, request.destinationCountry)
      });
    }

    // Sort by total cost (lowest first)
    return estimates.sort((a, b) => a.totalCost - b.totalCost);
  }

  /**
   * Get customs information for a product
   * 
   * @param productId Product ID
   * @param organizationId Organization ID
   * @returns Product customs information
   */
  async getProductCustomsInfo(
    productId: string,
    organizationId: string
  ): Promise<ProductCustomsInfo> {
    // In a real implementation, this would fetch product customs info from a database
    // For this example, we'll return mock data
    return {
      hsCode: '6109.10.00', // T-shirts, cotton
      description: 'Cotton T-shirt, short sleeve, printed design',
      countryOfOrigin: 'ZA',
      declaredValue: 15.99,
      declaredValueCurrency: 'USD',
      weightKg: 0.2,
      restrictionLevel: ProductRestrictionLevel.UNRESTRICTED,
      requiredDocuments: [
        CrossBorderDocumentType.COMMERCIAL_INVOICE,
        CrossBorderDocumentType.PACKING_LIST
      ]
    };
  }

  /**
   * Update customs information for a product
   * 
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param customsInfo Customs information
   * @returns Updated customs information
   */
  async updateProductCustomsInfo(
    productId: string,
    organizationId: string,
    customsInfo: Partial<ProductCustomsInfo>
  ): Promise<ProductCustomsInfo> {
    // In a real implementation, this would update the database
    // For this example, we'll return the merged data
    const existingInfo = await this.getProductCustomsInfo(productId, organizationId);
    
    return {
      ...existingInfo,
      ...customsInfo
    };
  }

  /**
   * Create a new cross-border shipment
   * 
   * @param shipmentDetails Shipment details
   * @returns Created shipment details
   */
  async createCrossBorderShipment(
    organizationId: string,
    shipmentDetails: Omit<CrossBorderShipmentDetails, 'shipmentId' | 'documentStatus'>
  ): Promise<CrossBorderShipmentDetails> {
    // Check if feature is enabled
    const isEnabled = await this.isCrossBorderTradeEnabled(organizationId);
    if (!isEnabled) {
      throw new Error('Cross-border trade feature is not enabled for this organization');
    }

    // Generate unique shipment ID
    const shipmentId = `CBS-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    
    // Initialize document status
    const documentStatus: Record<CrossBorderDocumentType, 'pending' | 'submitted' | 'approved' | 'rejected'> = 
      Object.values(CrossBorderDocumentType).reduce((acc, doc) => {
        acc[doc] = 'pending';
        return acc;
      }, {} as Record<CrossBorderDocumentType, 'pending' | 'submitted' | 'approved' | 'rejected'>);
    
    // Set status for required documents
    shipmentDetails.requiredDocuments.forEach(doc => {
      documentStatus[doc] = 'pending';
    });
    
    // Create the shipment
    const newShipment: CrossBorderShipmentDetails = {
      ...shipmentDetails,
      shipmentId,
      documentStatus
    };
    
    // In a real implementation, save to database
    this.logger.log(`Created cross-border shipment ${shipmentId}`);
    
    return newShipment;
  }

  /**
   * Check if a product can be shipped to a destination country
   * 
   * @param params Check parameters
   * @returns Shipping eligibility result
   */
  async checkProductShippingEligibility(params: {
    productId: string;
    organizationId: string;
    destinationCountry: string;
  }): Promise<{
    eligible: boolean;
    restrictionLevel: ProductRestrictionLevel;
    requiredDocuments: CrossBorderDocumentType[];
    reason?: string;
  }> {
    // Check if feature is enabled
    const isEnabled = await this.isCrossBorderTradeEnabled(params.organizationId);
    if (!isEnabled) {
      throw new Error('Cross-border trade feature is not enabled for this organization');
    }

    // Get product customs info
    const customsInfo = await this.getProductCustomsInfo(params.productId, params.organizationId);
    
    // Check if product is completely prohibited
    if (customsInfo.restrictionLevel === ProductRestrictionLevel.PROHIBITED) {
      return {
        eligible: false,
        restrictionLevel: ProductRestrictionLevel.PROHIBITED,
        requiredDocuments: [],
        reason: 'Product is prohibited for export to the destination country'
      };
    }
    
    // Check for country-specific restrictions
    const countryRestrictions = await this.getCountryProductRestrictions(
      params.destinationCountry,
      customsInfo.hsCode
    );
    
    if (countryRestrictions.restrictionLevel === ProductRestrictionLevel.PROHIBITED) {
      return {
        eligible: false,
        restrictionLevel: ProductRestrictionLevel.PROHIBITED,
        requiredDocuments: [],
        reason: countryRestrictions.reason
      };
    }
    
    // Determine final restriction level (most restrictive of the two)
    const restrictionLevel = this.getMostRestrictiveLevel(
      customsInfo.restrictionLevel,
      countryRestrictions.restrictionLevel
    );
    
    // Combine required documents
    const requiredDocuments = [
      ...(customsInfo.requiredDocuments || []),
      ...countryRestrictions.requiredDocuments
    ];
    
    // Product is eligible but may require documents
    return {
      eligible: true,
      restrictionLevel,
      requiredDocuments: [...new Set(requiredDocuments)], // Remove duplicates
      reason: restrictionLevel !== ProductRestrictionLevel.UNRESTRICTED
        ? 'Product requires additional documentation for export'
        : undefined
    };
  }

  /**
   * Get country-specific restrictions for a product based on HS code
   * 
   * @param countryCode Destination country
   * @param hsCode HS code
   * @returns Country-specific restrictions
   */
  async getCountryProductRestrictions(
    countryCode: string,
    hsCode: string
  ): Promise<{
    restrictionLevel: ProductRestrictionLevel;
    requiredDocuments: CrossBorderDocumentType[];
    reason?: string;
  }> {
    // In a real implementation, this would query a database of country-specific restrictions
    // For this example, we'll return some sample data
    
    // Create a deterministic but varying result based on country and HS code
    const hashCode = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };
    
    const combinedHash = hashCode(`${countryCode}${hsCode}`);
    
    // Use the hash to deterministically select a restriction level
    const restrictionValue = combinedHash % 100;
    
    if (restrictionValue < 60) {
      // 60% chance of unrestricted
      return {
        restrictionLevel: ProductRestrictionLevel.UNRESTRICTED,
        requiredDocuments: [
          CrossBorderDocumentType.COMMERCIAL_INVOICE,
          CrossBorderDocumentType.PACKING_LIST
        ]
      };
    } else if (restrictionValue < 85) {
      // 25% chance of restricted
      return {
        restrictionLevel: ProductRestrictionLevel.RESTRICTED,
        requiredDocuments: [
          CrossBorderDocumentType.COMMERCIAL_INVOICE,
          CrossBorderDocumentType.PACKING_LIST,
          CrossBorderDocumentType.CERTIFICATE_OF_ORIGIN
        ],
        reason: 'Product requires certificate of origin for import to this country'
      };
    } else if (restrictionValue < 95) {
      // 10% chance of highly restricted
      return {
        restrictionLevel: ProductRestrictionLevel.HIGHLY_RESTRICTED,
        requiredDocuments: [
          CrossBorderDocumentType.COMMERCIAL_INVOICE,
          CrossBorderDocumentType.PACKING_LIST,
          CrossBorderDocumentType.CERTIFICATE_OF_ORIGIN,
          CrossBorderDocumentType.IMPORT_PERMIT
        ],
        reason: 'Product requires import permit and additional documentation'
      };
    } else {
      // 5% chance of prohibited
      return {
        restrictionLevel: ProductRestrictionLevel.PROHIBITED,
        requiredDocuments: [],
        reason: 'Product is prohibited for import to this country'
      };
    }
  }

  /**
   * Initialize regional trade agreements
   */
  private initializeTradeAgreements(): void {
    // SADC - Southern African Development Community
    this.tradeAgreementCache.set('SADC', {
      code: 'SADC',
      name: 'Southern African Development Community',
      memberCountries: ['ZA', 'NA', 'BW', 'LS', 'SZ', 'MZ', 'ZW', 'AO', 'MU', 'TZ', 'MW', 'CD', 'SC', 'MG'],
      isActive: true,
      dutyFreeThresholds: {
        value: 1000,
        currency: 'USD',
        weightKg: 20
      },
      requiredDocuments: [
        CrossBorderDocumentType.CERTIFICATE_OF_ORIGIN,
        CrossBorderDocumentType.COMMERCIAL_INVOICE
      ]
    });
    
    // EAC - East African Community
    this.tradeAgreementCache.set('EAC', {
      code: 'EAC',
      name: 'East African Community',
      memberCountries: ['KE', 'UG', 'TZ', 'RW', 'BI', 'SS'],
      isActive: true,
      dutyFreeThresholds: {
        value: 2000,
        currency: 'USD',
        weightKg: 25
      },
      requiredDocuments: [
        CrossBorderDocumentType.CERTIFICATE_OF_ORIGIN,
        CrossBorderDocumentType.COMMERCIAL_INVOICE
      ]
    });
    
    // ECOWAS - Economic Community of West African States
    this.tradeAgreementCache.set('ECOWAS', {
      code: 'ECOWAS',
      name: 'Economic Community of West African States',
      memberCountries: ['NG', 'GH', 'CI', 'SN', 'BJ', 'TG', 'GN', 'ML', 'NE', 'BF', 'SL', 'LR', 'GM', 'CV', 'GW'],
      isActive: true,
      dutyFreeThresholds: {
        value: 1500,
        currency: 'USD'
      },
      requiredDocuments: [
        CrossBorderDocumentType.CERTIFICATE_OF_ORIGIN,
        CrossBorderDocumentType.COMMERCIAL_INVOICE
      ]
    });
    
    // COMESA - Common Market for Eastern and Southern Africa
    this.tradeAgreementCache.set('COMESA', {
      code: 'COMESA',
      name: 'Common Market for Eastern and Southern Africa',
      memberCountries: ['KE', 'UG', 'ZM', 'ZW', 'MU', 'RW', 'BI', 'CD', 'DJ', 'EG', 'ER', 'ET', 'LS', 'LY', 'MG', 'MW', 'SC', 'SD', 'SZ', 'TN'],
      isActive: true,
      dutyFreeThresholds: {
        value: 1000,
        currency: 'USD'
      },
      requiredDocuments: [
        CrossBorderDocumentType.CERTIFICATE_OF_ORIGIN,
        CrossBorderDocumentType.COMMERCIAL_INVOICE
      ]
    });
    
    // UMA - Arab Maghreb Union
    this.tradeAgreementCache.set('UMA', {
      code: 'UMA',
      name: 'Arab Maghreb Union',
      memberCountries: ['MA', 'DZ', 'TN', 'LY', 'MR'],
      isActive: true,
      requiredDocuments: [
        CrossBorderDocumentType.CERTIFICATE_OF_ORIGIN,
        CrossBorderDocumentType.COMMERCIAL_INVOICE
      ]
    });
  }

  /**
   * Helper methods for shipping and duty calculations
   */
  
  /**
   * Get duty rate for a country
   * 
   * @param countryCode Country code
   * @param isDutyFree Whether the shipment is duty-free
   * @returns Duty rate as a decimal
   */
  private async getDutyRate(countryCode: string, isDutyFree: boolean): Promise<number> {
    if (isDutyFree) return 0;
    
    // In a real implementation, this would come from a database
    // For this example, we'll use some representative rates
    const dutyRates: Record<string, number> = {
      'ZA': 0.20, // South Africa
      'KE': 0.25, // Kenya
      'NG': 0.20, // Nigeria
      'GH': 0.20, // Ghana
      'EG': 0.30, // Egypt
      'MA': 0.25, // Morocco
      'TZ': 0.25, // Tanzania
      'UG': 0.25, // Uganda
      'RW': 0.25, // Rwanda
      'BW': 0.20, // Botswana
      'NA': 0.20, // Namibia
      'MZ': 0.20, // Mozambique
      'ZW': 0.40, // Zimbabwe
      'CI': 0.20, // Ivory Coast
      'SN': 0.20  // Senegal
    };
    
    return dutyRates[countryCode] || 0.25; // Default to 25%
  }
  
  /**
   * Get tax rate for a country
   * 
   * @param countryCode Country code
   * @returns Tax rate as a decimal
   */
  private async getTaxRate(countryCode: string): Promise<number> {
    try {
      // Try to get from African Tax Framework Service
      const taxRequest: TaxRateRequest = {
        country: countryCode,
        taxType: TaxType.VAT
      };
      
      const taxResult = await this.africanTaxFrameworkService.calculateAfricanTax(taxRequest);
      return taxResult.rate;
    } catch (error) {
      // Fallback to hardcoded rates
      const taxRates: Record<string, number> = {
        'ZA': 0.15, // South Africa
        'KE': 0.16, // Kenya
        'NG': 0.075, // Nigeria
        'GH': 0.125, // Ghana
        'EG': 0.14, // Egypt
        'MA': 0.20, // Morocco
        'TZ': 0.18, // Tanzania
        'UG': 0.18, // Uganda
        'RW': 0.18, // Rwanda
        'BW': 0.14, // Botswana
        'NA': 0.15, // Namibia
        'MZ': 0.17, // Mozambique
        'ZW': 0.15, // Zimbabwe
        'CI': 0.18, // Ivory Coast
        'SN': 0.18  // Senegal
      };
      
      return taxRates[countryCode] || 0.15; // Default to 15%
    }
  }
  
  /**
   * Get customs processing fee for a country
   * 
   * @param countryCode Country code
   * @param shipmentValue Shipment value in USD
   * @returns Processing fee in USD
   */
  private getCustomsProcessingFee(countryCode: string, shipmentValue: number): number {
    // In a real implementation, this would come from a database
    // For this example, we'll use some representative fees
    
    // Basic fee structure used by many countries
    if (shipmentValue <= 100) {
      return 5;
    } else if (shipmentValue <= 500) {
      return 10;
    } else if (shipmentValue <= 1000) {
      return 25;
    } else if (shipmentValue <= 5000) {
      return 50;
    } else {
      return 100;
    }
  }
  
  /**
   * Get additional fees for customs processing
   * 
   * @param countryCode Country code
   * @param shipmentValue Shipment value in USD
   * @returns Array of additional fees
   */
  private getAdditionalFees(
    countryCode: string,
    shipmentValue: number
  ): Array<{ description: string; amount: number }> | undefined {
    // In a real implementation, this would come from a database
    // For this example, we'll return some sample fees for certain countries
    
    const fees: Array<{ description: string; amount: number }> = [];
    
    switch (countryCode) {
      case 'ZA':
        // South Africa
        fees.push({ description: 'SARS Processing Fee', amount: 15 });
        break;
        
      case 'KE':
        // Kenya
        fees.push({ description: 'KRA Documentation Fee', amount: 10 });
        fees.push({ description: 'Port Health Fee', amount: 5 });
        break;
        
      case 'NG':
        // Nigeria
        fees.push({ description: 'NCS Assessment Fee', amount: 20 });
        fees.push({ description: 'ETLS Levy', amount: shipmentValue * 0.005 }); // 0.5% of value
        break;
        
      case 'EG':
        // Egypt
        fees.push({ description: 'Inspection Fee', amount: 25 });
        break;
    }
    
    return fees.length > 0 ? fees : undefined;
  }
  
  /**
   * Calculate shipping cost for a method
   * 
   * @param method Shipping method
   * @param originCountry Origin country
   * @param destinationCountry Destination country
   * @param weightKg Weight in kg
   * @param value Value in origin currency
   * @param currency Currency code
   * @returns Shipping cost and delivery days
   */
  private calculateShippingCost(
    method: CrossBorderShippingMethod,
    originCountry: string,
    destinationCountry: string,
    weightKg: number,
    value: number,
    currency: string
  ): { cost: number; deliveryDays: { min: number; max: number } } {
    // In a real implementation, this would call a shipping rate API
    // For this example, we'll calculate based on weight, distance, and method
    
    // Base rates per kg (in the given currency)
    const baseRates: Record<CrossBorderShippingMethod, number> = {
      [CrossBorderShippingMethod.STANDARD]: 10,
      [CrossBorderShippingMethod.EXPRESS]: 25,
      [CrossBorderShippingMethod.ECONOMY]: 5,
      [CrossBorderShippingMethod.FULFILLED_BY_MARKETPLACE]: 15,
      [CrossBorderShippingMethod.FREIGHT]: 8,
      [CrossBorderShippingMethod.LOCAL_PICKUP]: 0
    };
    
    // Delivery day ranges by method
    const deliveryDays: Record<CrossBorderShippingMethod, { min: number; max: number }> = {
      [CrossBorderShippingMethod.STANDARD]: { min: 5, max: 10 },
      [CrossBorderShippingMethod.EXPRESS]: { min: 2, max: 5 },
      [CrossBorderShippingMethod.ECONOMY]: { min: 7, max: 14 },
      [CrossBorderShippingMethod.FULFILLED_BY_MARKETPLACE]: { min: 3, max: 7 },
      [CrossBorderShippingMethod.FREIGHT]: { min: 10, max: 20 },
      [CrossBorderShippingMethod.LOCAL_PICKUP]: { min: 1, max: 2 }
    };
    
    // Calculate distance factor (simplified for example)
    const distanceFactor = this.calculateDistanceFactor(originCountry, destinationCountry);
    
    // Calculate base cost from weight, rate, and distance
    let cost = baseRates[method] * weightKg * distanceFactor;
    
    // Add value-based insurance for expensive shipments (0.5% of value)
    if (value > 1000) {
      cost += value * 0.005;
    }
    
    // Add handling fee for certain methods
    if (method === CrossBorderShippingMethod.EXPRESS) {
      cost += 20; // Express handling fee
    }
    
    // Adjust for local pickup (should be cheapest)
    if (method === CrossBorderShippingMethod.LOCAL_PICKUP) {
      cost = 0; // Local pickup is free
    }
    
    // Adjust delivery days based on distance
    const adjustedDeliveryDays = {
      min: Math.round(deliveryDays[method].min * distanceFactor),
      max: Math.round(deliveryDays[method].max * distanceFactor)
    };
    
    return {
      cost: Math.round(cost * 100) / 100, // Round to 2 decimal places
      deliveryDays: adjustedDeliveryDays
    };
  }
  
  /**
   * Calculate distance factor between countries
   * 
   * @param originCountry Origin country
   * @param destinationCountry Destination country
   * @returns Distance factor multiplier
   */
  private calculateDistanceFactor(originCountry: string, destinationCountry: string): number {
    // In a real implementation, this would use actual geographic distances
    // For this example, we'll use a simplified regional approach
    
    // Check if countries are the same
    if (originCountry === destinationCountry) {
      return 0.8; // Domestic shipping (20% discount)
    }
    
    // Group countries by region
    const regions: Record<string, string[]> = {
      'southern-africa': ['ZA', 'NA', 'BW', 'LS', 'SZ', 'MZ', 'ZW'],
      'east-africa': ['KE', 'UG', 'TZ', 'RW', 'BI'],
      'west-africa': ['NG', 'GH', 'CI', 'SN', 'BJ', 'TG'],
      'north-africa': ['EG', 'MA', 'TN', 'DZ', 'LY']
    };
    
    // Find regions for both countries
    const originRegion = Object.keys(regions).find(region => 
      regions[region].includes(originCountry)
    );
    
    const destRegion = Object.keys(regions).find(region => 
      regions[region].includes(destinationCountry)
    );
    
    // If both countries are in the same region
    if (originRegion && destRegion && originRegion === destRegion) {
      return 1.0; // Standard rate for intra-regional
    }
    
    // If both countries are in Africa but different regions
    if (originRegion && destRegion) {
      return 1.5; // 50% surcharge for inter-regional within Africa
    }
    
    // If either country is outside recognized African regions
    return 2.0; // 100% surcharge for shipping involving non-African regions
  }
  
  /**
   * Get insurance options for a shipment
   * 
   * @param shipmentValue Shipment value
   * @param declaredValue Declared value (optional)
   * @param currency Currency code
   * @returns Insurance options
   */
  private getInsuranceOptions(
    shipmentValue: number,
    declaredValue?: number,
    currency?: string
  ): Array<{ level: string; coverageAmount: number; cost: number }> {
    // Use the higher of shipment value or declared value
    const value = declaredValue && declaredValue > shipmentValue ? declaredValue : shipmentValue;
    
    // Standard insurance options
    return [
      {
        level: 'basic',
        coverageAmount: value,
        cost: value * 0.01 // 1% of value
      },
      {
        level: 'premium',
        coverageAmount: value * 1.5,
        cost: value * 0.02 // 2% of value
      },
      {
        level: 'full',
        coverageAmount: value * 2,
        cost: value * 0.03 // 3% of value
      }
    ];
  }
  
  /**
   * Get carrier code for a shipping method
   * 
   * @param method Shipping method
   * @param originCountry Origin country
   * @param destinationCountry Destination country
   * @returns Carrier code
   */
  private getCarrierCode(
    method: CrossBorderShippingMethod,
    originCountry: string,
    destinationCountry: string
  ): string {
    // In a real implementation, this would determine the actual carrier
    // For this example, we'll return some sample carriers
    
    switch (method) {
      case CrossBorderShippingMethod.EXPRESS:
        return 'DHL';
      case CrossBorderShippingMethod.STANDARD:
        return 'FEDEX';
      case CrossBorderShippingMethod.ECONOMY:
        return 'POST';
      case CrossBorderShippingMethod.FREIGHT:
        return 'FREIGHT';
      case CrossBorderShippingMethod.FULFILLED_BY_MARKETPLACE:
        return 'MKT';
      case CrossBorderShippingMethod.LOCAL_PICKUP:
        return 'SELF';
      default:
        return 'STD';
    }
  }
  
  /**
   * Get carrier name for a shipping method
   * 
   * @param method Shipping method
   * @param originCountry Origin country
   * @param destinationCountry Destination country
   * @returns Carrier name
   */
  private getCarrierName(
    method: CrossBorderShippingMethod,
    originCountry: string,
    destinationCountry: string
  ): string {
    // In a real implementation, this would determine the actual carrier
    // For this example, we'll return some sample carriers
    
    switch (method) {
      case CrossBorderShippingMethod.EXPRESS:
        return 'DHL Express';
      case CrossBorderShippingMethod.STANDARD:
        return 'FedEx International';
      case CrossBorderShippingMethod.ECONOMY:
        return 'Postal Service';
      case CrossBorderShippingMethod.FREIGHT:
        return 'Cross-Border Freight';
      case CrossBorderShippingMethod.FULFILLED_BY_MARKETPLACE:
        return 'Marketplace Logistics';
      case CrossBorderShippingMethod.LOCAL_PICKUP:
        return 'Self Pickup';
      default:
        return 'Standard Shipping';
    }
  }
  
  /**
   * Get transit points between countries
   * 
   * @param originCountry Origin country
   * @param destinationCountry Destination country
   * @returns Array of transit points
   */
  private getTransitPoints(
    originCountry: string,
    destinationCountry: string
  ): string[] | undefined {
    // In a real implementation, this would determine actual transit routes
    // For this example, we'll return some sample routes
    
    // Common transit hubs in Africa
    const transitHubs: Record<string, string[]> = {
      'ZA': ['Johannesburg', 'Cape Town'],
      'KE': ['Nairobi'],
      'EG': ['Cairo'],
      'ET': ['Addis Ababa'],
      'MA': ['Casablanca'],
      'NG': ['Lagos'],
      'SN': ['Dakar'],
      'RW': ['Kigali']
    };
    
    // No transit points for same country
    if (originCountry === destinationCountry) {
      return undefined;
    }
    
    // Simplified transit logic
    const originRegion = this.getCountryRegion(originCountry);
    const destRegion = this.getCountryRegion(destinationCountry);
    
    if (originRegion === destRegion) {
      // Intra-regional shipping might have one transit point
      const regionalHub = this.getRegionalHub(originRegion);
      if (regionalHub && regionalHub.country !== originCountry && regionalHub.country !== destinationCountry) {
        return [regionalHub.city];
      }
      return undefined;
    } else {
      // Inter-regional shipping typically has multiple transit points
      const originHub = this.getRegionalHub(originRegion);
      const destHub = this.getRegionalHub(destRegion);
      
      const transitPoints: string[] = [];
      
      if (originHub) {
        transitPoints.push(originHub.city);
      }
      
      // For long distances, add a global hub
      if (this.isLongDistance(originCountry, destinationCountry)) {
        transitPoints.push('Dubai');
      }
      
      if (destHub) {
        transitPoints.push(destHub.city);
      }
      
      return transitPoints.length > 0 ? transitPoints : undefined;
    }
  }
  
  /**
   * Get region for a country
   * 
   * @param countryCode Country code
   * @returns Region name
   */
  private getCountryRegion(countryCode: string): string {
    // Simplified region mapping
    const regionMap: Record<string, string> = {
      'ZA': 'southern-africa',
      'NA': 'southern-africa',
      'BW': 'southern-africa',
      'LS': 'southern-africa',
      'SZ': 'southern-africa',
      'MZ': 'southern-africa',
      'ZW': 'southern-africa',
      'KE': 'east-africa',
      'UG': 'east-africa',
      'TZ': 'east-africa',
      'RW': 'east-africa',
      'BI': 'east-africa',
      'ET': 'east-africa',
      'NG': 'west-africa',
      'GH': 'west-africa',
      'CI': 'west-africa',
      'SN': 'west-africa',
      'BJ': 'west-africa',
      'TG': 'west-africa',
      'EG': 'north-africa',
      'MA': 'north-africa',
      'TN': 'north-africa',
      'DZ': 'north-africa',
      'LY': 'north-africa'
    };
    
    return regionMap[countryCode] || 'other';
  }
  
  /**
   * Get main hub for a region
   * 
   * @param region Region name
   * @returns Hub information
   */
  private getRegionalHub(region: string): { country: string; city: string } | undefined {
    // Main logistics hubs by region
    const hubs: Record<string, { country: string; city: string }> = {
      'southern-africa': { country: 'ZA', city: 'Johannesburg' },
      'east-africa': { country: 'KE', city: 'Nairobi' },
      'west-africa': { country: 'NG', city: 'Lagos' },
      'north-africa': { country: 'EG', city: 'Cairo' }
    };
    
    return hubs[region];
  }
  
  /**
   * Check if a route is considered long distance
   * 
   * @param originCountry Origin country
   * @param destinationCountry Destination country
   * @returns Whether the route is long distance
   */
  private isLongDistance(originCountry: string, destinationCountry: string): boolean {
    const originRegion = this.getCountryRegion(originCountry);
    const destRegion = this.getCountryRegion(destinationCountry);
    
    // Different regions are considered long distance
    if (originRegion !== destRegion) {
      // North-South connections are always long distance
      if (
        (originRegion === 'north-africa' && destRegion === 'southern-africa') ||
        (originRegion === 'southern-africa' && destRegion === 'north-africa')
      ) {
        return true;
      }
      
      // East-West connections are always long distance
      if (
        (originRegion === 'east-africa' && destRegion === 'west-africa') ||
        (originRegion === 'west-africa' && destRegion === 'east-africa')
      ) {
        return true;
      }
    }
    
    // Default to short distance
    return false;
  }
  
  /**
   * Get required documents for cross-border shipping
   * 
   * @param originCountry Origin country
   * @param destinationCountry Destination country
   * @param products Products in the shipment
   * @param agreements Applicable trade agreements
   * @returns Array of required document types
   */
  private async getRequiredDocuments(
    originCountry: string,
    destinationCountry: string,
    products: Array<{
      productId: string;
      hsCode: string;
      quantity: number;
      unitPrice: number;
      currency: string;
      weightKg: number;
    }>,
    agreements: RegionalTradeAgreement[]
  ): Promise<CrossBorderDocumentType[]> {
    // Basic documents required for all shipments
    const documents: Set<CrossBorderDocumentType> = new Set([
      CrossBorderDocumentType.COMMERCIAL_INVOICE,
      CrossBorderDocumentType.PACKING_LIST,
      CrossBorderDocumentType.CUSTOMS_DECLARATION
    ]);
    
    // Add documents required by trade agreements
    for (const agreement of agreements) {
      if (agreement.requiredDocuments) {
        agreement.requiredDocuments.forEach(doc => documents.add(doc));
      }
    }
    
    // Check for product-specific required documents
    for (const product of products) {
      // Check HS code for restricted items that need special documents
      if (this.isRestrictedHsCode(product.hsCode)) {
        documents.add(CrossBorderDocumentType.IMPORT_PERMIT);
      }
      
      // Check for agricultural products
      if (this.isAgriculturalHsCode(product.hsCode)) {
        documents.add(CrossBorderDocumentType.PHYTOSANITARY_CERTIFICATE);
      }
      
      // Check for dangerous goods
      if (this.isDangerousGoodsHsCode(product.hsCode)) {
        documents.add(CrossBorderDocumentType.DANGEROUS_GOODS_DECLARATION);
      }
    }
    
    // Check country-specific requirements
    const countrySpecificDocs = this.getCountrySpecificDocuments(
      originCountry, 
      destinationCountry
    );
    
    countrySpecificDocs.forEach(doc => documents.add(doc));
    
    return Array.from(documents);
  }
  
  /**
   * Get documents required for a specific shipping method
   * 
   * @param method Shipping method
   * @returns Array of document types
   */
  private getDocumentsForShippingMethod(
    method: CrossBorderShippingMethod
  ): CrossBorderDocumentType[] {
    switch (method) {
      case CrossBorderShippingMethod.FREIGHT:
        return [CrossBorderDocumentType.BILL_OF_LADING];
      case CrossBorderShippingMethod.FULFILLED_BY_MARKETPLACE:
        return []; // Marketplace handles documentation
      default:
        return [];
    }
  }
  
  /**
   * Check if an HS code indicates a restricted product
   * 
   * @param hsCode HS code
   * @returns Whether the product is restricted
   */
  private isRestrictedHsCode(hsCode: string): boolean {
    // In a real implementation, this would check against a database
    // For this example, we'll check some common restricted prefixes
    
    // Simplistic check based on HS chapter
    const chapter = hsCode.substring(0, 2);
    
    // Commonly restricted chapters:
    // 93: Arms and ammunition
    // 71: Precious stones and metals
    // 29: Organic chemicals
    // 38: Some chemicals
    const restrictedChapters = ['93', '71', '29', '38'];
    
    return restrictedChapters.includes(chapter);
  }
  
  /**
   * Check if an HS code indicates an agricultural product
   * 
   * @param hsCode HS code
   * @returns Whether the product is agricultural
   */
  private isAgriculturalHsCode(hsCode: string): boolean {
    // Agricultural products are generally in chapters 1-24
    const chapter = parseInt(hsCode.substring(0, 2), 10);
    return chapter >= 1 && chapter <= 24;
  }
  
  /**
   * Check if an HS code indicates dangerous goods
   * 
   * @param hsCode HS code
   * @returns Whether the product is dangerous goods
   */
  private isDangerousGoodsHsCode(hsCode: string): boolean {
    // Common dangerous goods chapters
    const dangerousChapters = ['28', '29', '36', '38', '39'];
    const chapter = hsCode.substring(0, 2);
    
    return dangerousChapters.includes(chapter);
  }
  
  /**
   * Get country-specific required documents
   * 
   * @param originCountry Origin country
   * @param destinationCountry Destination country
   * @returns Array of document types
   */
  private getCountrySpecificDocuments(
    originCountry: string,
    destinationCountry: string
  ): CrossBorderDocumentType[] {
    // In a real implementation, this would check against a database
    // For this example, we'll return some common requirements
    
    const documents: CrossBorderDocumentType[] = [];
    
    // Example: For South Africa, certificate of origin is always required
    if (destinationCountry === 'ZA') {
      documents.push(CrossBorderDocumentType.CERTIFICATE_OF_ORIGIN);
    }
    
    // Egypt requires more documentation
    if (destinationCountry === 'EG') {
      documents.push(CrossBorderDocumentType.CERTIFICATE_OF_ORIGIN);
      documents.push(CrossBorderDocumentType.IMPORT_PERMIT);
    }
    
    return documents;
  }
  
  /**
   * Get most restrictive level from two product restriction levels
   * 
   * @param level1 First restriction level
   * @param level2 Second restriction level
   * @returns Most restrictive level
   */
  private getMostRestrictiveLevel(
    level1: ProductRestrictionLevel,
    level2: ProductRestrictionLevel
  ): ProductRestrictionLevel {
    const restrictionOrder = [
      ProductRestrictionLevel.UNRESTRICTED,
      ProductRestrictionLevel.RESTRICTED,
      ProductRestrictionLevel.HIGHLY_RESTRICTED,
      ProductRestrictionLevel.PROHIBITED
    ];
    
    const level1Index = restrictionOrder.indexOf(level1);
    const level2Index = restrictionOrder.indexOf(level2);
    
    return restrictionOrder[Math.max(level1Index, level2Index)];
  }
  
  /**
   * Convert a value to USD (simplified for example)
   * 
   * @param value Value to convert
   * @param currency Source currency
   * @returns Converted value in USD
   */
  private convertValueToUSD(value: number, currency: string): number {
    // In a real implementation, this would use the actual exchange rate
    // For this example, we'll use some representative rates
    const usdRates: Record<string, number> = {
      'USD': 1.00,
      'ZAR': 0.055, // 1 ZAR = 0.055 USD
      'KES': 0.0077, // 1 KES = 0.0077 USD
      'NGN': 0.0012, // 1 NGN = 0.0012 USD
      'GHS': 0.070, // 1 GHS = 0.070 USD
      'EGP': 0.032, // 1 EGP = 0.032 USD
      'EUR': 1.08 // 1 EUR = 1.08 USD
    };
    
    const rate = usdRates[currency] || 1;
    return value * rate;
  }
}