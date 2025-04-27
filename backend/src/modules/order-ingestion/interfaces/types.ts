/**
 * Placeholder for additional marketplace-specific order data.
 * TODO: Add concrete fields as discovered.
 */
export interface OrderMarketplaceData {
  // TODO: Add fields for marketplace-specific order data
}

/**
 * Placeholder for order line item properties/customizations.
 * TODO: Add concrete fields as discovered.
 */
export interface OrderLineItemProperties {
  // TODO: Add fields for line item properties
}

/**
 * Placeholder for marketplace order item properties.
 * TODO: Add concrete fields as discovered.
 */
export interface MarketplaceOrderProperties {
  // TODO: Add fields for marketplace order item properties
}

/**
 * Placeholder for marketplace-specific options during order ingestion.
 * TODO: Add concrete fields as discovered.
 */
export interface OrderMarketplaceSpecific {
  // TODO: Add fields for marketplace-specific ingestion options
}

/**
 * Order model representing an order in the system
 */
export interface Order {
  /**
   * Marketplace this order came from (e.g. 'shopify', 'amazon')
   */
  marketplaceName: string;

  /**
   * Marketplace-specific order ID
   */
  marketplaceOrderId: string;

  /**
   * Marketplace-specific order number (typically user-facing)
   */
  orderNumber?: string;

  /**
   * Order status (marketplace-specific, e.g. 'pending', 'processing', 'shipped')
   */
  status: string;

  /**
   * Financial status (e.g. 'pending', 'paid', 'refunded')
   */
  financialStatus?: string;

  /**
   * Fulfillment status (e.g. 'unfulfilled', 'partial', 'fulfilled')
   */
  fulfillmentStatus?: string;

  /**
   * Order currency code (ISO 4217)
   */
  currency: string;

  /**
   * Total price including taxes and shipping
   */
  totalPrice: number;

  /**
   * Subtotal price (excluding taxes and shipping)
   */
  subtotalPrice: number;

  /**
   * Total tax amount
   */
  totalTax?: number;

  /**
   * Total shipping cost
   */
  totalShipping?: number;

  /**
   * Total discount amount
   */
  totalDiscount?: number;

  /**
   * Date the order was created on the marketplace
   */
  marketplaceDate: Date;

  /**
   * Customer information
   */
  customer?: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };

  /**
   * Shipping address
   */
  shippingAddress?: Address;

  /**
   * Billing address
   */
  billingAddress?: Address;

  /**
   * Line items in the order
   */
  lineItems: OrderLineItem[];

  /**
   * Additional marketplace-specific data
   */
  /**
   * Additional marketplace-specific data
   */
  marketplaceData?: OrderMarketplaceData; // TODO: Refine fields as discovered

  /**
   * Organization ID that owns this order
   */
  organizationId: string;

  /**
   * Xero invoice ID if pushed to Xero
   */
  xeroInvoiceId?: string;

  /**
   * Xero invoice number if pushed to Xero
   */
  xeroInvoiceNumber?: string;

  /**
   * Whether a push to Xero has been attempted
   */
  xeroPushAttempted?: boolean;

  /**
   * Date of the last Xero push attempt
   */
  xeroPushDate?: Date;

  /**
   * Status of the last Xero push attempt
   */
  xeroPushStatus?: 'success' | 'failed';

  /**
   * Error message from the last Xero push attempt
   */
  xeroPushError?: string;

  /**
   * Tags associated with this order
   */
  tags?: string[];

  /**
   * Notes about this order
   */
  notes?: string;

  /**
   * Date the order was created in our system
   */
  createdAt: Date;

  /**
   * Date the order was last updated in our system
   */
  updatedAt: Date;
}

/**
 * Mongoose document for Order
 */
export type OrderDocument = Order & Document;

/**
 * Address information
 */
export interface Address {
  /**
   * First name
   */
  firstName?: string;

  /**
   * Last name
   */
  lastName?: string;

  /**
   * Full name
   */
  name?: string;

  /**
   * Company name
   */
  company?: string;

  /**
   * Address line 1
   */
  address1: string;

  /**
   * Address line 2
   */
  address2?: string;

  /**
   * City
   */
  city: string;

  /**
   * State/province/region
   */
  province?: string;

  /**
   * Postal/ZIP code
   */
  zip: string;

  /**
   * Country
   */
  country: string;

  /**
   * Phone number
   */
  phone?: string;
}

/**
 * Order line item
 */
export interface OrderLineItem {
  /**
   * Marketplace-specific ID
   */
  marketplaceLineItemId: string;

  /**
   * Product SKU
   */
  sku: string;

  /**
   * Product name
   */
  name: string;

  /**
   * Product variant title (if applicable)
   */
  variantTitle?: string;

  /**
   * Quantity
   */
  quantity: number;

  /**
   * Unit price
   */
  price: number;

  /**
   * Total price (price * quantity - discount)
   */
  totalPrice: number;

  /**
   * Tax amount
   */
  tax?: number;

  /**
   * Discount amount
   */
  discount?: number;

  /**
   * Product image URL
   */
  imageUrl?: string;

  /**
   * Line item properties/customizations
   */
  properties?: OrderLineItemProperties; // TODO: Refine fields as discovered
}

/**
 * Marketplace order format (input from marketplace adapters)
 */
export interface MarketplaceOrder {
  /**
   * Marketplace-specific order ID
   */
  id: string;

  /**
   * User-facing order number
   */
  orderNumber?: string;

  /**
   * Date the order was created
   */
  createdAt: Date;

  /**
   * Date the order was last updated
   */
  updatedAt: Date;

  /**
   * Order status
   */
  status: string;

  /**
   * Financial status
   */
  financialStatus?: string;

  /**
   * Fulfillment status
   */
  fulfillmentStatus?: string;

  /**
   * Currency code
   */
  currency: string;

  /**
   * Total price
   */
  totalPrice: number;

  /**
   * Subtotal price
   */
  subtotalPrice: number;

  /**
   * Total tax
   */
  totalTax?: number;

  /**
   * Total shipping cost
   */
  totalShipping?: number;

  /**
   * Total discount
   */
  totalDiscount?: number;

  /**
   * Customer ID
   */
  customerId?: string;

  /**
   * Customer name
   */
  customerName?: string;

  /**
   * Customer email
   */
  customerEmail?: string;

  /**
   * Line items
   */
  items: {
    id: string;
    sku: string;
    name: string;
    quantity: number;
    price: number;
    totalPrice: number;
    tax?: number;
    discount?: number;
    image?: string;
    variantId?: string;
    properties?: MarketplaceOrderProperties; // TODO: Refine fields as discovered
  }[];

  /**
   * Shipping address
   */
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    zip: string;
    country: string;
    phone?: string;
    email?: string;
  };

  /**
   * Billing address
   */
  billingAddress?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    zip: string;
    country: string;
    phone?: string;
    email?: string;
  };

  /**
   * Additional information
   */
}

/**
 * Options for order ingestion
 */
export interface OrderIngestionOptions {
  /**
   * Whether to skip existing orders
   */
  skipExisting?: boolean;

  /**
   * Whether to create Xero invoices for eligible orders
   */
  createXeroInvoices?: boolean;

  /**
   * Whether to update existing orders if found
   */
  updateExisting?: boolean;

  /**
   * Additional marketplace-specific options
   */
  marketplaceSpecific?: OrderMarketplaceSpecific; // TODO: Refine fields as discovered
}

/**
 * Response when ingesting orders
 */
export interface OrderIngestionResponse {
  /**
   * Whether the operation was successful overall
   */
  success: boolean;

  /**
   * Count of new orders created
   */
  ordersCreated: number;

  /**
   * Count of existing orders updated
   */
  ordersUpdated: number;

  /**
   * Count of orders skipped
   */
  ordersSkipped: number;

  /**
   * Count of Xero invoices created
   */
  xeroInvoicesCreated: number;

  /**
   * Any errors that occurred during processing
   */
  errors: Array<{
    orderId?: string;
    message: string;
    details?: unknown; // TODO: Replace with a stricter type
  }>;
}

/**
 * Xero invoice creation result
 */
export interface XeroInvoiceResult {
  /**
   * Whether creation was successful
   */
  success: boolean;

  /**
   * Xero invoice ID if successful
   */
  invoiceId?: string;

  /**
   * Xero invoice number if successful
   */
  invoiceNumber?: string;

  /**
   * Error message if unsuccessful
   */
  error?: string;
}
