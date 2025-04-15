/**
 * B2B Customer Model
 * 
 * Defines the structure for B2B customers with business-specific attributes,
 * organizational hierarchy, and relationship management.
 */

/**
 * B2B customer status
 */
export enum B2BCustomerStatus {
  /**
   * Active customer
   */
  ACTIVE = 'ACTIVE',
  
  /**
   * Inactive customer
   */
  INACTIVE = 'INACTIVE',
  
  /**
   * Pending approval
   */
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  
  /**
   * Customer on credit hold
   */
  CREDIT_HOLD = 'CREDIT_HOLD',
  
  /**
   * Suspended customer
   */
  SUSPENDED = 'SUSPENDED'
}

/**
 * B2B customer account type
 */
export enum B2BAccountType {
  /**
   * Corporate account
   */
  CORPORATE = 'CORPORATE',
  
  /**
   * Small business account
   */
  SMALL_BUSINESS = 'SMALL_BUSINESS',
  
  /**
   * Government entity
   */
  GOVERNMENT = 'GOVERNMENT',
  
  /**
   * Non-profit organization
   */
  NON_PROFIT = 'NON_PROFIT',
  
  /**
   * Educational institution
   */
  EDUCATION = 'EDUCATION',
  
  /**
   * Healthcare organization
   */
  HEALTHCARE = 'HEALTHCARE'
}

/**
 * B2B credit status
 */
export enum CreditStatus {
  /**
   * Not eligible for credit
   */
  NOT_ELIGIBLE = 'NOT_ELIGIBLE',
  
  /**
   * Application pending
   */
  APPLICATION_PENDING = 'APPLICATION_PENDING',
  
  /**
   * Credit approved
   */
  APPROVED = 'APPROVED',
  
  /**
   * Credit rejected
   */
  REJECTED = 'REJECTED',
  
  /**
   * Credit on hold
   */
  ON_HOLD = 'ON_HOLD'
}

/**
 * B2B customer contact model
 */
export interface B2BCustomerContact {
  /**
   * Unique identifier for this contact
   */
  id?: string;
  
  /**
   * First name
   */
  firstName: string;
  
  /**
   * Last name
   */
  lastName: string;
  
  /**
   * Job title
   */
  jobTitle: string;
  
  /**
   * Department
   */
  department?: string;
  
  /**
   * Email address
   */
  email: string;
  
  /**
   * Phone number
   */
  phone?: string;
  
  /**
   * Mobile number
   */
  mobile?: string;
  
  /**
   * Whether this is the primary contact
   */
  isPrimary: boolean;
  
  /**
   * Contact roles (e.g., "purchaser", "accounts_payable", "technical_contact")
   */
  roles: string[];
  
  /**
   * Permissions assigned to this contact
   */
  permissions?: string[];
  
  /**
   * Whether this contact can place orders
   */
  canPlaceOrders: boolean;
  
  /**
   * Whether this contact can approve orders
   */
  canApproveOrders: boolean;
  
  /**
   * Maximum order value this contact can approve (if applicable)
   */
  approvalLimit?: number;
  
  /**
   * Notes about this contact
   */
  notes?: string;
  
  /**
   * Last contact date
   */
  lastContactDate?: Date;
  
  /**
   * Whether this contact is active
   */
  isActive: boolean;
  
  /**
   * Creation timestamp
   */
  createdAt: Date;
  
  /**
   * Last update timestamp
   */
  updatedAt: Date;
}

/**
 * B2B address model
 */
export interface B2BAddress {
  /**
   * Unique identifier for this address
   */
  id?: string;
  
  /**
   * Address type (e.g., shipping, billing, headquarters)
   */
  type: 'billing' | 'shipping' | 'headquarters' | 'branch' | 'other';
  
  /**
   * Address name/label
   */
  name: string;
  
  /**
   * Company name
   */
  companyName: string;
  
  /**
   * Street address line 1
   */
  address1: string;
  
  /**
   * Street address line 2
   */
  address2?: string;
  
  /**
   * City
   */
  city: string;
  
  /**
   * State/province
   */
  state?: string;
  
  /**
   * Postal/ZIP code
   */
  postalCode: string;
  
  /**
   * Country code (ISO)
   */
  country: string;
  
  /**
   * Phone number
   */
  phone?: string;
  
  /**
   * Whether this is the default address for its type
   */
  isDefault: boolean;
  
  /**
   * Special delivery instructions
   */
  deliveryInstructions?: string;
  
  /**
   * Commercial address flag
   */
  isCommercial: boolean;
  
  /**
   * Residential address flag
   */
  isResidential: boolean;
  
  /**
   * Tax region for this address
   */
  taxRegion?: string;
  
  /**
   * Whether this address is active
   */
  isActive: boolean;
  
  /**
   * Validation status of the address
   */
  validationStatus?: 'validated' | 'validation_failed' | 'not_validated';
  
  /**
   * Creation timestamp
   */
  createdAt: Date;
  
  /**
   * Last update timestamp
   */
  updatedAt: Date;
}

/**
 * B2B payment information model
 */
export interface B2BPaymentInfo {
  /**
   * Credit status
   */
  creditStatus: CreditStatus;
  
  /**
   * Credit limit in base currency
   */
  creditLimit?: number;
  
  /**
   * Current outstanding balance
   */
  outstandingBalance?: number;
  
  /**
   * Current available credit
   */
  availableCredit?: number;
  
  /**
   * Default payment terms (e.g., "Net 30")
   */
  paymentTerms?: string;
  
  /**
   * Default payment method
   */
  defaultPaymentMethod?: string;
  
  /**
   * Allowed payment methods
   */
  allowedPaymentMethods?: string[];
  
  /**
   * Whether purchase orders are required
   */
  requiresPurchaseOrder: boolean;
  
  /**
   * Whether tax exemption is in place
   */
  isTaxExempt: boolean;
  
  /**
   * Tax exemption certificate ID
   */
  taxExemptionCertificateId?: string;
  
  /**
   * Tax exemption expiration date
   */
  taxExemptionExpirationDate?: Date;
  
  /**
   * Current payment status
   */
  paymentStatus?: 'good_standing' | 'late_payment' | 'collections';
  
  /**
   * Notes about payment behavior
   */
  paymentNotes?: string;
  
  /**
   * Credit reference information
   */
  creditReferences?: Array<{
    /**
     * Reference company name
     */
    companyName: string;
    
    /**
     * Contact person
     */
    contactName?: string;
    
    /**
     * Contact email
     */
    email?: string;
    
    /**
     * Contact phone
     */
    phone?: string;
    
    /**
     * Reference notes
     */
    notes?: string;
  }>;
  
  /**
   * Last credit review date
   */
  lastCreditReviewDate?: Date;
  
  /**
   * Next scheduled credit review date
   */
  nextCreditReviewDate?: Date;
}

/**
 * Organizational hierarchy position
 */
export interface OrganizationalHierarchy {
  /**
   * Parent company ID (if this is a subsidiary)
   */
  parentCompanyId?: string;
  
  /**
   * Child company IDs (if this is a parent company)
   */
  childCompanyIds?: string[];
  
  /**
   * Division or department within organization
   */
  division?: string;
  
  /**
   * Branch or location identifier
   */
  branch?: string;
  
  /**
   * Hierarchical depth in the organization tree
   */
  hierarchyDepth?: number;
  
  /**
   * Whether this is a headquarters
   */
  isHeadquarters?: boolean;
}

/**
 * B2B Customer model
 */
export interface B2BCustomer {
  /**
   * Unique identifier for the B2B customer
   */
  id?: string;
  
  /**
   * Organization that owns this customer record
   */
  organizationId: string;
  
  /**
   * Customer number/identifier
   */
  customerNumber: string;
  
  /**
   * Company name
   */
  companyName: string;
  
  /**
   * Legal business name
   */
  legalName?: string;
  
  /**
   * Trading/DBA name
   */
  tradingName?: string;
  
  /**
   * Website URL
   */
  website?: string;
  
  /**
   * Industry sector
   */
  industry?: string;
  
  /**
   * Business registration number
   */
  registrationNumber?: string;
  
  /**
   * VAT/tax ID
   */
  taxId?: string;
  
  /**
   * Current customer status
   */
  status: B2BCustomerStatus;
  
  /**
   * Type of business account
   */
  accountType: B2BAccountType;
  
  /**
   * Assigned customer tier ID
   */
  customerTierId?: string;
  
  /**
   * Assigned customer group IDs
   */
  customerGroupIds?: string[];
  
  /**
   * Assigned customer representative (sales rep)
   */
  accountManagerId?: string;
  
  /**
   * Secondary account managers
   */
  secondaryAccountManagerIds?: string[];
  
  /**
   * Customer contacts list
   */
  contacts: B2BCustomerContact[];
  
  /**
   * Primary contact ID
   */
  primaryContactId?: string;
  
  /**
   * Customer addresses
   */
  addresses: B2BAddress[];
  
  /**
   * Customer payment information
   */
  paymentInfo: B2BPaymentInfo;
  
  /**
   * Customer organizational hierarchy
   */
  organizationalHierarchy?: OrganizationalHierarchy;
  
  /**
   * Default price list ID for this customer
   */
  defaultPriceListId?: string;
  
  /**
   * Default approval workflow ID for this customer
   */
  defaultApprovalWorkflowId?: string;
  
  /**
   * Default currency code for this customer
   */
  defaultCurrencyCode: string;
  
  /**
   * Default warehouse/location for this customer
   */
  defaultWarehouseId?: string;
  
  /**
   * Annual revenue (in base currency)
   */
  annualRevenue?: number;
  
  /**
   * Number of employees
   */
  employeeCount?: number;
  
  /**
   * Year company was founded
   */
  yearFounded?: number;
  
  /**
   * Company description
   */
  description?: string;
  
  /**
   * Social media profiles
   */
  socialProfiles?: Record<string, string>;
  
  /**
   * Customer lifecycle stage
   */
  lifecycleStage?: 'prospect' | 'new' | 'established' | 'at_risk' | 'churned' | 'reactivated';
  
  /**
   * Annual spent amount
   */
  annualSpend?: number;
  
  /**
   * Customer lifetime value
   */
  lifetimeValue?: number;
  
  /**
   * Market region for this customer
   */
  marketRegion?: string;
  
  /**
   * Tags for customer categorization
   */
  tags?: string[];
  
  /**
   * Whether the customer is VIP
   */
  isVip: boolean;
  
  /**
   * Notes about this customer
   */
  notes?: string;
  
  /**
   * Custom fields specific to this customer
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
  
  /**
   * Account onboarding status
   */
  onboardingStatus?: 'pending' | 'in_progress' | 'completed';
  
  /**
   * Account onboarding completion percentage
   */
  onboardingPercentComplete?: number;
  
  /**
   * Last order date
   */
  lastOrderDate?: Date;
  
  /**
   * First order date
   */
  firstOrderDate?: Date;
  
  /**
   * Total lifetime orders
   */
  totalOrders?: number;
}