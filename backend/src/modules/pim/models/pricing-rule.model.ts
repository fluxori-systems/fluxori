/**
 * Pricing rule operation enum
 * Defines the type of pricing operation to perform
 */
export enum PricingRuleOperation {
  /**
   * Fixed price regardless of original price
   */
  FIXED_PRICE = 'FIXED_PRICE',

  /**
   * Percentage discount from original price
   */
  PERCENTAGE_DISCOUNT = 'PERCENTAGE_DISCOUNT',

  /**
   * Fixed amount discount from original price
   */
  AMOUNT_DISCOUNT = 'AMOUNT_DISCOUNT',

  /**
   * Percentage markup above original price
   */
  PERCENTAGE_MARKUP = 'PERCENTAGE_MARKUP',

  /**
   * Fixed amount markup above original price
   */
  AMOUNT_MARKUP = 'AMOUNT_MARKUP',

  /**
   * Match a competitor's price exactly
   */
  MATCH_COMPETITOR = 'MATCH_COMPETITOR',

  /**
   * Beat a competitor's price by a percentage
   */
  BEAT_COMPETITOR_PERCENTAGE = 'BEAT_COMPETITOR_PERCENTAGE',

  /**
   * Beat a competitor's price by a fixed amount
   */
  BEAT_COMPETITOR_AMOUNT = 'BEAT_COMPETITOR_AMOUNT',

  /**
   * Custom formula for price calculation
   */
  CUSTOM_FORMULA = 'CUSTOM_FORMULA',
}

/**
 * Pricing rule schedule type enum
 * Defines when and how often the rule should be applied
 */
export enum PricingRuleScheduleType {
  /**
   * Apply the rule once
   */
  ONCE = 'ONCE',

  /**
   * Apply the rule repeatedly on a schedule
   */
  RECURRING = 'RECURRING',

  /**
   * Apply the rule continuously (always active)
   */
  ALWAYS = 'ALWAYS',
}

/**
 * Pricing rule execution status enum
 * Tracks the status of rule execution
 */
export enum PricingRuleExecutionStatus {
  /**
   * Rule is pending execution
   */
  PENDING = 'PENDING',

  /**
   * Rule is currently executing
   */
  IN_PROGRESS = 'IN_PROGRESS',

  /**
   * Rule has been executed successfully
   */
  COMPLETED = 'COMPLETED',

  /**
   * Rule execution failed
   */
  FAILED = 'FAILED',

  /**
   * Rule execution has been canceled
   */
  CANCELED = 'CANCELED',
}

/**
 * Pricing rule scope
 * Defines which products the rule applies to
 */
export interface PricingRuleScope {
  /**
   * Apply to all products (ignores productIds and categoryIds)
   */
  applyToAll: boolean;

  /**
   * Specific product IDs to apply the rule to
   */
  productIds?: string[];

  /**
   * Specific category IDs to apply the rule to
   */
  categoryIds?: string[];

  /**
   * Apply to products with these attributes (key-value pairs)
   */
  attributeFilters?: Record<string, any>;

  /**
   * Apply to products with these types
   */
  productTypes?: string[];
}

/**
 * Pricing rule constraints
 * Sets limits on the rule's price adjustments
 */
export interface PricingRuleConstraints {
  /**
   * Minimum price allowed (will not go below this price)
   */
  minPrice?: number;

  /**
   * Maximum price allowed (will not go above this price)
   */
  maxPrice?: number;

  /**
   * Minimum margin percentage required (based on cost)
   */
  minMarginPercentage?: number;

  /**
   * Minimum margin amount required (based on cost)
   */
  minMarginAmount?: number;

  /**
   * Maximum discount percentage allowed from original price
   */
  maxDiscountPercentage?: number;

  /**
   * Maximum discount amount allowed from original price
   */
  maxDiscountAmount?: number;
}

/**
 * Pricing rule schedule configuration
 * Defines when the rule should be applied
 */
export interface PricingRuleSchedule {
  /**
   * Type of schedule
   */
  type: PricingRuleScheduleType;

  /**
   * Start date and time for the rule
   */
  startDate?: Date;

  /**
   * End date and time for the rule
   */
  endDate?: Date;

  /**
   * Days of the week to apply the rule (for recurring rules)
   * 0 = Sunday, 1 = Monday, ..., 6 = Saturday
   */
  daysOfWeek?: number[];

  /**
   * Time of day to apply the rule (for recurring rules)
   */
  timeOfDay?: {
    hour: number;
    minute: number;
  };

  /**
   * Interval in minutes between rule applications (for recurring rules)
   */
  intervalMinutes?: number;
}

/**
 * Pricing rule execution history
 * Tracks when the rule was executed and the results
 */
export interface PricingRuleExecution {
  /**
   * Execution ID
   */
  id: string;

  /**
   * Execution start time
   */
  startTime: Date;

  /**
   * Execution end time
   */
  endTime?: Date;

  /**
   * Execution status
   */
  status: PricingRuleExecutionStatus;

  /**
   * Number of products affected
   */
  productsAffected: number;

  /**
   * Products that failed to update
   */
  failedProducts?: string[];

  /**
   * Error message if execution failed
   */
  error?: string;

  /**
   * User who triggered the execution
   */
  triggeredBy?: string;
}

/**
 * Competitor reference for competitor-based pricing rules
 */
export interface CompetitorReference {
  /**
   * Competitor name
   */
  name: string;

  /**
   * Competitor product ID or reference
   */
  productId: string;

  /**
   * Marketplace where competitor product is listed
   */
  marketplace: string;
}

/**
 * Pricing rule model
 * Defines how product prices should be calculated and updated
 */
export interface PricingRule {
  /**
   * Rule ID (auto-generated)
   */
  id?: string;

  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Rule name
   */
  name: string;

  /**
   * Rule description
   */
  description?: string;

  /**
   * Rule scope - which products it applies to
   */
  scope: PricingRuleScope;

  /**
   * Operation to perform
   */
  operation: PricingRuleOperation;

  /**
   * Value for the operation
   * - For FIXED_PRICE: the actual price
   * - For PERCENTAGE_DISCOUNT: the discount percentage (0-100)
   * - For AMOUNT_DISCOUNT: the discount amount
   * - For PERCENTAGE_MARKUP: the markup percentage
   * - For AMOUNT_MARKUP: the markup amount
   * - For MATCH_COMPETITOR: ignored
   * - For BEAT_COMPETITOR_PERCENTAGE: the percentage to beat by
   * - For BEAT_COMPETITOR_AMOUNT: the amount to beat by
   * - For CUSTOM_FORMULA: formula string
   */
  value: number | string;

  /**
   * For competitor-based rules, reference to competitor product
   */
  competitorReference?: CompetitorReference;

  /**
   * Constraints for the rule
   */
  constraints?: PricingRuleConstraints;

  /**
   * Rule schedule configuration
   */
  schedule: PricingRuleSchedule;

  /**
   * Rule priority (lower numbers = higher priority)
   */
  priority: number;

  /**
   * Whether the rule is active
   */
  isActive: boolean;

  /**
   * Markets the rule applies to (list of market codes)
   * When empty, applies to all markets
   */
  markets?: string[];

  /**
   * Channels the rule applies to (list of channel codes, e.g., 'website', 'marketplace')
   * When empty, applies to all channels
   */
  channels?: string[];

  /**
   * Currency code for the rule
   * When empty, applies to default currency
   */
  currencyCode?: string;

  /**
   * Custom fields for extensions
   */
  customFields?: Record<string, any>;

  /**
   * Recent rule executions
   * Limited to the most recent executions
   */
  recentExecutions?: PricingRuleExecution[];

  /**
   * Execution statistics
   */
  executionStats?: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    lastExecutionTime?: Date;
  };

  /**
   * Creation timestamp
   */
  createdAt: Date;

  /**
   * Last update timestamp
   */
  updatedAt: Date;

  /**
   * User who created the rule
   */
  createdBy?: string;

  /**
   * User who last updated the rule
   */
  updatedBy?: string;
}