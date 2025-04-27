/**
 * B2B Purchase Order Model
 *
 * Defines the purchase order structure and approval workflows
 * for B2B customers.
 */

/**
 * Purchase order status
 */
export enum PurchaseOrderStatus {
  /**
   * Draft order being prepared
   */
  DRAFT = "DRAFT",

  /**
   * Order pending approval
   */
  PENDING_APPROVAL = "PENDING_APPROVAL",

  /**
   * Order that has been approved
   */
  APPROVED = "APPROVED",

  /**
   * Order that has been rejected
   */
  REJECTED = "REJECTED",

  /**
   * Order that has been placed (submitted to supplier)
   */
  PLACED = "PLACED",

  /**
   * Order in processing status
   */
  PROCESSING = "PROCESSING",

  /**
   * Order partially shipped
   */
  PARTIALLY_SHIPPED = "PARTIALLY_SHIPPED",

  /**
   * Order fully shipped
   */
  SHIPPED = "SHIPPED",

  /**
   * Order fully delivered
   */
  DELIVERED = "DELIVERED",

  /**
   * Order has been invoiced
   */
  INVOICED = "INVOICED",

  /**
   * Order has been paid
   */
  PAID = "PAID",

  /**
   * Order is complete
   */
  COMPLETED = "COMPLETED",

  /**
   * Order has been cancelled
   */
  CANCELLED = "CANCELLED",
}

/**
 * Approval action type
 */
export enum ApprovalActionType {
  /**
   * Approval request submitted
   */
  SUBMITTED = "SUBMITTED",

  /**
   * Approval request approved
   */
  APPROVED = "APPROVED",

  /**
   * Approval request rejected
   */
  REJECTED = "REJECTED",

  /**
   * Approval request returned for changes
   */
  RETURNED_FOR_CHANGES = "RETURNED_FOR_CHANGES",

  /**
   * Approval request escalated
   */
  ESCALATED = "ESCALATED",

  /**
   * Approval automatically approved (e.g., by system rules)
   */
  AUTO_APPROVED = "AUTO_APPROVED",

  /**
   * Approval automatically rejected (e.g., exceeded limit)
   */
  AUTO_REJECTED = "AUTO_REJECTED",
}

/**
 * Approval action record for tracking approval workflow
 */
export interface ApprovalAction {
  /**
   * Unique identifier for the approval action
   */
  id?: string;

  /**
   * Action type
   */
  actionType: ApprovalActionType;

  /**
   * Timestamp of the action
   */
  timestamp: Date;

  /**
   * User ID who performed the action
   */
  userId: string;

  /**
   * Display name of the user who performed the action
   */
  userName: string;

  /**
   * Role of the user who performed the action
   */
  userRole?: string;

  /**
   * Comments provided with the action
   */
  comments?: string;

  /**
   * Next approver in the workflow (if applicable)
   */
  nextApproverId?: string;

  /**
   * Next approver name (if applicable)
   */
  nextApproverName?: string;
}

/**
 * Approval workflow definition
 */
export interface ApprovalWorkflow {
  /**
   * Unique identifier for the approval workflow
   */
  id?: string;

  /**
   * Organization that owns this workflow
   */
  organizationId: string;

  /**
   * Display name for the workflow
   */
  name: string;

  /**
   * Description of the workflow
   */
  description?: string;

  /**
   * Whether this workflow is active
   */
  isActive: boolean;

  /**
   * Approval steps in this workflow
   */
  steps: Array<{
    /**
     * Step number in the sequence
     */
    stepNumber: number;

    /**
     * Display name for this step
     */
    name: string;

    /**
     * User role required for this approval step
     */
    approverRole: string;

    /**
     * Specific user IDs who can approve at this step
     */
    approverUserIds?: string[];

    /**
     * Whether multiple approvers are required at this step
     */
    requiresMultipleApprovers: boolean;

    /**
     * Number of approvals required at this step (if multiple)
     */
    requiredApprovalCount?: number;

    /**
     * Maximum time in hours before step auto-escalates
     */
    timeoutHours?: number;

    /**
     * What happens when the step times out
     */
    timeoutAction?: "auto_approve" | "auto_reject" | "escalate";

    /**
     * Where to escalate to on timeout (if applicable)
     */
    escalationUserId?: string;
  }>;

  /**
   * Order value thresholds for this workflow
   */
  orderValueThresholds?: Array<{
    /**
     * Minimum order value for this threshold
     */
    minValue: number;

    /**
     * Additional approval steps required at this threshold
     */
    additionalSteps: Array<{
      /**
       * Step number to insert (relative to base workflow)
       */
      afterStepNumber: number;

      /**
       * Name of the additional step
       */
      name: string;

      /**
       * Role required for this approval
       */
      approverRole: string;

      /**
       * Specific approver user IDs
       */
      approverUserIds?: string[];
    }>;
  }>;

  /**
   * Customer tier IDs this workflow applies to
   */
  customerTierIds?: string[];

  /**
   * Customer group IDs this workflow applies to
   */
  customerGroupIds?: string[];

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
 * Recurring order configuration
 */
export interface RecurringOrderConfig {
  /**
   * Unique identifier for this configuration
   */
  id?: string;

  /**
   * Whether this recurring order is active
   */
  isActive: boolean;

  /**
   * Frequency type for recurrence
   */
  frequencyType: "daily" | "weekly" | "monthly" | "quarterly" | "custom";

  /**
   * Interval for the frequency (e.g., every 2 weeks)
   */
  interval: number;

  /**
   * Day of week for weekly orders (0 = Sunday, 6 = Saturday)
   */
  dayOfWeek?: number;

  /**
   * Day of month for monthly orders
   */
  dayOfMonth?: number;

  /**
   * Months of year for quarterly/annual orders (1-12)
   */
  monthsOfYear?: number[];

  /**
   * Start date for recurring orders
   */
  startDate: Date;

  /**
   * End date for recurring orders (if applicable)
   */
  endDate?: Date;

  /**
   * Date of next scheduled order
   */
  nextOrderDate: Date;

  /**
   * Number of recurrences before automatic expiration
   */
  recurrenceLimit?: number;

  /**
   * Completed recurrence count
   */
  completedRecurrences: number;

  /**
   * Whether quantities should be adjusted based on usage
   */
  smartQuantityAdjustment?: boolean;
}

/**
 * B2B Purchase Order model
 */
export interface PurchaseOrder {
  /**
   * Unique identifier for the purchase order
   */
  id?: string;

  /**
   * Organization that owns this purchase order
   */
  organizationId: string;

  /**
   * B2B customer ID
   */
  customerId: string;

  /**
   * Linked customer contract ID (if applicable)
   */
  contractId?: string;

  /**
   * External purchase order number/reference
   */
  purchaseOrderNumber: string;

  /**
   * Current status of the purchase order
   */
  status: PurchaseOrderStatus;

  /**
   * Purchase order creation date
   */
  orderDate: Date;

  /**
   * Requested delivery date
   */
  requestedDeliveryDate?: Date;

  /**
   * Expected ship date
   */
  expectedShipDate?: Date;

  /**
   * Required ship date
   */
  requiredShipDate?: Date;

  /**
   * Line items in the purchase order
   */
  items: Array<{
    /**
     * Line item identifier
     */
    id?: string;

    /**
     * Product ID for this line item
     */
    productId: string;

    /**
     * SKU for this line item
     */
    sku: string;

    /**
     * Product name
     */
    name: string;

    /**
     * Ordered quantity
     */
    quantity: number;

    /**
     * Unit price
     */
    unitPrice: number;

    /**
     * Line item subtotal
     */
    subtotal: number;

    /**
     * Discount amount for this line
     */
    discountAmount?: number;

    /**
     * Tax amount for this line
     */
    taxAmount?: number;

    /**
     * Total price for this line
     */
    total: number;

    /**
     * Customer's line/item reference
     */
    customerReference?: string;

    /**
     * Current line item status
     */
    status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";

    /**
     * Quantity shipped
     */
    quantityShipped?: number;

    /**
     * Quantity delivered
     */
    quantityDelivered?: number;

    /**
     * Quantity backordered
     */
    quantityBackordered?: number;

    /**
     * Whether substitutions are allowed for this item
     */
    allowSubstitutions?: boolean;
  }>;

  /**
   * Currency code for this order
   */
  currencyCode: string;

  /**
   * Subtotal (before tax, shipping, etc.)
   */
  subtotal: number;

  /**
   * Tax amount
   */
  taxAmount: number;

  /**
   * Shipping amount
   */
  shippingAmount: number;

  /**
   * Discount amount
   */
  discountAmount?: number;

  /**
   * Total amount
   */
  total: number;

  /**
   * Shipping address
   */
  shippingAddress: {
    name: string;
    companyName?: string;
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
    specialInstructions?: string;
  };

  /**
   * Billing address
   */
  billingAddress: {
    name: string;
    companyName?: string;
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
  };

  /**
   * Internal notes (not visible to customer)
   */
  internalNotes?: string;

  /**
   * Customer notes (visible to customer)
   */
  customerNotes?: string;

  /**
   * Payment terms
   */
  paymentTerms?: string;

  /**
   * Payment due date
   */
  paymentDueDate?: Date;

  /**
   * Selected payment method
   */
  paymentMethod?: string;

  /**
   * Whether the order is prepaid
   */
  isPrepaid?: boolean;

  /**
   * Payment status
   */
  paymentStatus?: "unpaid" | "partially_paid" | "paid";

  /**
   * Amount paid
   */
  amountPaid?: number;

  /**
   * Balance due
   */
  balanceDue?: number;

  /**
   * Customer department for this order
   */
  department?: string;

  /**
   * Customer cost center for this order
   */
  costCenter?: string;

  /**
   * Customer project code for this order
   */
  projectCode?: string;

  /**
   * Customer GL account code for this order
   */
  glAccount?: string;

  /**
   * Approval workflow ID for this order
   */
  approvalWorkflowId?: string;

  /**
   * Current approval step in the workflow
   */
  currentApprovalStep?: number;

  /**
   * Approval actions history
   */
  approvalActions?: ApprovalAction[];

  /**
   * Whether this is a recurring order
   */
  isRecurring: boolean;

  /**
   * Recurring order configuration (if applicable)
   */
  recurringConfig?: RecurringOrderConfig;

  /**
   * Parent order ID if this is a recurring child order
   */
  parentOrderId?: string;

  /**
   * Recurrence number if this is a recurring child order
   */
  recurrenceNumber?: number;

  /**
   * Invoice IDs associated with this order
   */
  invoiceIds?: string[];

  /**
   * Shipment IDs associated with this order
   */
  shipmentIds?: string[];

  /**
   * Whether this order has special tax exemptions
   */
  hasTaxExemption?: boolean;

  /**
   * Tax exemption certificate ID
   */
  taxExemptionCertificateId?: string;

  /**
   * Custom fields specific to this order
   */
  customFields?: Record<string, any>;

  /**
   * Creation timestamp
   */
  createdAt: Date;

  /**
   * Created by user ID
   */
  createdBy: string;

  /**
   * Last update timestamp
   */
  updatedAt: Date;

  /**
   * Last updated by user ID
   */
  updatedBy?: string;
}
