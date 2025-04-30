/**
 * Customer Tier Model
 *
 * Defines the tiering structure for B2B customers with associated benefits and requirements.
 * This is a core component of the Advanced B2B Support feature.
 */
import { FirestoreEntityWithMetadata } from '../../../../common/repositories/base/repository-types';

/**
 * Standard customer tier types
 */
export enum CustomerTierType {
  STANDARD = 'STANDARD',
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  CUSTOM = 'CUSTOM',
}

/**
 * Customer tier model for B2B functionality
 * Implements FirestoreEntityWithMetadata for repository compliance
 */
export interface CustomerTier extends FirestoreEntityWithMetadata {
  /** Unique identifier */
  id: string;
  /** Soft delete flag */
  isDeleted: boolean;
  /** Version for optimistic locking */
  version: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Deletion timestamp (optional) */
  deletedAt?: Date | undefined;
  /**
   * Organization that owns this tier configuration
   */
  organizationId: string;

  /**
   * Display name for the tier
   */
  name: string;

  /**
   * Unique code for the tier (e.g., "GOLD", "TIER_1")
   */
  code: string;

  /**
   * Detailed description of the tier benefits and requirements
   */
  description?: string;

  /**
   * Type of tier (standard tiers or custom)
   */
  type: CustomerTierType;

  /**
   * Default discount percentage applied to all products for this tier
   */
  discountPercentage?: number;

  /**
   * Minimum order value required to qualify for this tier (in base currency)
   */
  minimumOrderValue?: number;

  /**
   * Minimum number of orders required to maintain this tier status
   */
  minimumOrderFrequency?: number;

  /**
   * Time period for the minimum order frequency (monthly, quarterly, annually)
   */
  orderFrequencyPeriod?: 'monthly' | 'quarterly' | 'annually';

  /**
   * Special pricing lists associated with this tier
   */
  priceListIds?: string[];

  /**
   * Whether payment terms are available for this tier
   */
  allowsPaymentTerms: boolean;

  /**
   * Maximum days for payment terms, if allowed
   */
  maximumPaymentTermDays?: number;

  /**
   * Whether the tier is currently active
   */
  isActive: boolean;

  /**
   * Whether credit limits are enabled for this tier
   */
  enableCreditLimits: boolean;

  /**
   * Default credit limit for customers in this tier (if enabled)
   */
  defaultCreditLimit?: number;

  /**
   * Whether special payment methods are available for this tier
   */
  hasSpecialPaymentMethods: boolean;

  /**
   * Available payment methods for this tier
   */
  availablePaymentMethods?: string[];

  /**
   * Regional configurations for this tier (allows different settings by region)
   */
  regionalSettings?: Record<
    string,
    {
      discountPercentage?: number;
      minimumOrderValue?: number;
      isActive: boolean;
    }
  >;

  /**
   * Additional custom fields specific to this tier
   */
  customFields?: import('../custom-fields.model').CustomFields;

  /**
   * Visibility level of the tier (public = visible to all, private = only to assigned customers)
   */
  visibility: 'public' | 'private';
}

/**
 * Customer group model - allows grouping B2B customers for specialized pricing and rules
 * Implements FirestoreEntityWithMetadata for repository compliance
 */
export interface CustomerGroup extends FirestoreEntityWithMetadata {
  /** Unique identifier */
  id: string;
  /** Soft delete flag */
  isDeleted: boolean;
  /** Version for optimistic locking */
  version: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Deletion timestamp (optional) */
  deletedAt?: Date | undefined;
  /**
   * Organization that owns this customer group
   */
  organizationId: string;

  /**
   * Display name for the group
   */
  name: string;

  /**
   * Detailed description of the group
   */
  description?: string;

  /**
   * Associated customer tier ID
   */
  tierId: string;

  /**
   * Array of customer IDs that belong to this group
   */
  customerIds: string[];

  /**
   * Optional custom price list for this specific group
   */
  customPriceListId?: string;

  /**
   * Override discount percentage specific to this group
   */
  customDiscountPercentage?: number;

  /**
   * Date from which this group is valid
   */
  validFrom?: Date;

  /**
   * Date until which this group is valid
   */
  validTo?: Date;

  /**
   * Whether the group is currently active
   */
  isActive: boolean;

  /**
   * Optional custom approval workflow for this group
   */
  customApprovalWorkflowId?: string;

  /**
   * Regional configurations for this group (allows different settings by region)
   */
  regionalSettings?: Record<
    string,
    {
      discountPercentage?: number;
      isActive: boolean;
      customPriceListId?: string;
    }
  >;

  /**
   * Additional custom fields specific to this group
   */
  customFields?: import('../custom-fields.model').CustomFields;
}
