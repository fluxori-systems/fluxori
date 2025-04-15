/**
 * B2B Contract Model
 * 
 * Defines business contracts for B2B customers with specialized terms,
 * pricing, and payment conditions.
 */

/**
 * Contract status indicating the current state in the lifecycle
 */
export enum ContractStatus {
  /**
   * Draft contract being prepared
   */
  DRAFT = 'DRAFT',
  
  /**
   * Contract pending approval
   */
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  
  /**
   * Contract that has been approved but not yet active
   */
  APPROVED = 'APPROVED',
  
  /**
   * Active contract currently in effect
   */
  ACTIVE = 'ACTIVE',
  
  /**
   * Contract that has been suspended
   */
  SUSPENDED = 'SUSPENDED',
  
  /**
   * Contract that has expired
   */
  EXPIRED = 'EXPIRED',
  
  /**
   * Contract that has been terminated
   */
  TERMINATED = 'TERMINATED',
  
  /**
   * Contract pending renewal
   */
  PENDING_RENEWAL = 'PENDING_RENEWAL',
  
  /**
   * Contract renewed for a new term
   */
  RENEWED = 'RENEWED'
}

/**
 * Contract payment terms configuration
 */
export interface ContractPaymentTerms {
  /**
   * Number of days allowed for payment after invoice
   */
  daysToPayment: number;
  
  /**
   * Discount percentage for early payment, if applicable
   */
  earlyPaymentDiscount?: number;
  
  /**
   * Days threshold for early payment discount
   */
  earlyPaymentDays?: number;
  
  /**
   * Whether payment terms apply to all products or only specific ones
   */
  appliesTo: 'all_products' | 'specific_products';
  
  /**
   * Product IDs these payment terms apply to (if specific)
   */
  productIds?: string[];
  
  /**
   * Payment methods allowed under this contract
   */
  allowedPaymentMethods?: string[];
  
  /**
   * Credit limit in base currency
   */
  creditLimit?: number;
  
  /**
   * Whether split payments are allowed
   */
  allowSplitPayments?: boolean;
  
  /**
   * Whether automatic payments are enabled
   */
  enableAutomaticPayments?: boolean;
}

/**
 * Contract pricing terms configuration
 */
export interface ContractPricingTerms {
  /**
   * Global discount percentage applied to all products
   */
  globalDiscountPercentage?: number;
  
  /**
   * Specific product pricing overrides
   */
  specificProductPrices?: Array<{
    /**
     * Product ID for the specific pricing
     */
    productId: string;
    
    /**
     * SKU for the specific pricing
     */
    sku: string;
    
    /**
     * Fixed price override for this product
     */
    fixedPrice?: number;
    
    /**
     * Discount percentage for this specific product
     */
    discountPercentage?: number;
    
    /**
     * Whether this pricing applies to all variants
     */
    applyToAllVariants?: boolean;
  }>;
  
  /**
   * Volume-based discounts
   */
  volumeDiscounts?: Array<{
    /**
     * Minimum order value to qualify for this discount
     */
    minOrderValue: number;
    
    /**
     * Discount percentage at this order value
     */
    discountPercentage: number;
  }>;
  
  /**
   * Whether prices are locked for the duration of the contract
   */
  pricesLocked: boolean;
  
  /**
   * Maximum price increase percentage allowed during contract term
   */
  maxPriceIncreasePercentage?: number;
  
  /**
   * Frequency of allowed price reviews
   */
  priceReviewFrequency?: 'monthly' | 'quarterly' | 'semi_annually' | 'annually' | 'never';
}

/**
 * Contract delivery terms configuration
 */
export interface ContractDeliveryTerms {
  /**
   * Preferred shipping method
   */
  preferredShippingMethod?: string;
  
  /**
   * Whether to prioritize fulfillment for this contract
   */
  priorityFulfillment?: boolean;
  
  /**
   * Negotiated shipping rates
   */
  negotiatedShippingRates?: Record<string, number>;
  
  /**
   * Whether free shipping is included
   */
  freeShipping?: boolean;
  
  /**
   * Minimum order value for free shipping
   */
  freeShippingMinOrderValue?: number;
  
  /**
   * Whether partial shipments are allowed
   */
  allowPartialShipments?: boolean;
  
  /**
   * Special delivery instructions
   */
  deliveryInstructions?: string;
}

/**
 * Contract approval history record
 */
export interface ContractApproval {
  /**
   * Approval timestamp
   */
  timestamp: Date;
  
  /**
   * User ID who approved
   */
  approvedBy: string;
  
  /**
   * User name who approved
   */
  approverName: string;
  
  /**
   * Role of the approver
   */
  approverRole?: string;
  
  /**
   * Optional comments on the approval
   */
  comments?: string;
}

/**
 * B2B Customer Contract model
 */
export interface CustomerContract {
  /**
   * Unique identifier for the contract
   */
  id?: string;
  
  /**
   * Organization that owns this contract
   */
  organizationId: string;
  
  /**
   * Customer ID this contract is with
   */
  customerId: string;
  
  /**
   * Customer group ID, if this contract applies to a group
   */
  customerGroupId?: string;
  
  /**
   * External contract reference/number
   */
  contractNumber: string;
  
  /**
   * Display name for the contract
   */
  name: string;
  
  /**
   * Detailed description of the contract
   */
  description?: string;
  
  /**
   * Start date of the contract
   */
  startDate: Date;
  
  /**
   * End date of the contract
   */
  endDate: Date;
  
  /**
   * Current status of the contract
   */
  status: ContractStatus;
  
  /**
   * Whether auto-renewal is enabled
   */
  autoRenew: boolean;
  
  /**
   * Length of renewal term if auto-renew is enabled
   */
  renewalTermMonths?: number;
  
  /**
   * Pricing terms for this contract
   */
  pricingTerms: ContractPricingTerms;
  
  /**
   * Payment terms for this contract
   */
  paymentTerms?: ContractPaymentTerms;
  
  /**
   * Delivery terms for this contract
   */
  deliveryTerms?: ContractDeliveryTerms;
  
  /**
   * Minimum order value required by this contract
   */
  minimumOrderValue?: number;
  
  /**
   * Approval history for this contract
   */
  approvals?: ContractApproval[];
  
  /**
   * Attachments associated with this contract (document IDs)
   */
  attachmentIds?: string[];
  
  /**
   * Spending limit for this contract (if applicable)
   */
  spendingLimit?: number;
  
  /**
   * Whether spending limit resets periodically
   */
  spendingLimitPeriod?: 'monthly' | 'quarterly' | 'annually' | 'contract_term';
  
  /**
   * Region-specific contract terms
   */
  regionalTerms?: Record<string, {
    pricingTerms?: Partial<ContractPricingTerms>;
    paymentTerms?: Partial<ContractPaymentTerms>;
    deliveryTerms?: Partial<ContractDeliveryTerms>;
    isActive: boolean;
  }>;
  
  /**
   * Custom fields specific to this contract
   */
  customFields?: Record<string, any>;
  
  /**
   * Creation timestamp
   */
  createdAt: Date;
  
  /**
   * Last update timestamp
   */
  updatedAt: Date;
}