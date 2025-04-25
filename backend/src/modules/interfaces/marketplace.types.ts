/**
 * Common marketplace types used across modules
 *
 * This file defines the common marketplace types for e-commerce integrations,
 * with specific support for South African e-commerce specifics.
 */

/**
 * Marketplace product interface
 * Common fields across different marketplaces
 */
export interface MarketplaceProduct {
  /** Marketplace-specific ID */
  id: string;

  /** SKU of the product */
  sku: string;

  /** Product name */
  name: string;

  /** Product description */
  description?: string;

  /** Price in marketplace's currency */
  price: number;

  /** Compare-at or list price */
  compareAtPrice?: number;

  /** Currency code */
  currency: string;

  /** Available stock */
  stockLevel: number;

  /** Product status */
  status: 'active' | 'inactive' | 'pending' | 'rejected';

  /** Category identifiers */
  categories?: string[];

  /** Image URLs */
  images?: string[];

  /** Product attributes (varies by marketplace) */
  attributes?: Record<string, any>;

  /** Product variants (if applicable) */
  variants?: Omit<MarketplaceProduct, 'variants'>[];

  /** URL to product on marketplace */
  marketplaceUrl?: string;

  /** Creation date */
  createdAt: Date;

  /** Last update date */
  updatedAt: Date;

  /** Additional marketplace-specific fields */
  [key: string]: any;
}

/**
 * Marketplace order interface
 * Common fields across different marketplaces
 */
export interface MarketplaceOrder {
  /** Internal ID */
  id: string;

  /** Marketplace-specific order ID */
  marketplaceOrderId: string;

  /** Order number (if different from IDs) */
  orderNumber?: string;

  /** Customer identifier */
  customerId?: string;

  /** Customer name */
  customerName?: string;

  /** Customer email */
  customerEmail?: string;

  /** Order status */
  status: string;

  /** Payment status */
  financialStatus?: string;

  /** Shipping status */
  fulfillmentStatus?: string;

  /** Order creation date */
  createdAt: Date;

  /** Last update date */
  updatedAt: Date;

  /** Currency code */
  currency: string;

  /** Total price including taxes and shipping */
  totalPrice: number;

  /** Subtotal (before tax/shipping) */
  subtotalPrice: number;

  /** Total tax amount */
  totalTax?: number;

  /** Total shipping cost */
  totalShipping?: number;

  /** Total discount amount */
  totalDiscount?: number;

  /** Order items */
  items: MarketplaceOrderItem[];

  /** Shipping address */
  shippingAddress?: Address;

  /** Billing address */
  billingAddress?: Address;

  /** Additional marketplace-specific fields */
  [key: string]: any;
}

/**
 * Order item in a marketplace order
 */
export interface MarketplaceOrderItem {
  /** Item ID */
  id: string;

  /** Product SKU */
  sku: string;

  /** Product name */
  name: string;

  /** Quantity ordered */
  quantity: number;

  /** Unit price */
  price: number;

  /** Total price (price * quantity) */
  totalPrice: number;

  /** Tax amount */
  tax?: number;

  /** Image URL */
  image?: string;

  /** Variant ID if applicable */
  variantId?: string;

  /** Custom properties */
  properties?: Record<string, any>;

  /** Additional marketplace-specific fields */
  [key: string]: any;
}

/**
 * Address for shipping or billing
 */
export interface Address {
  /** Full name */
  name?: string;

  /** First name */
  firstName?: string;

  /** Last name */
  lastName?: string;

  /** Company name */
  company?: string;

  /** Address line 1 */
  address1: string;

  /** Address line 2 */
  address2?: string;

  /** City */
  city: string;

  /** State/Province */
  province?: string;

  /** Postal code */
  zip: string;

  /** Country */
  country: string;

  /** Phone number */
  phone?: string;

  /** Email address */
  email?: string;

  /** Additional address fields */
  [key: string]: any;
}

/**
 * Response when acknowledging order receipt
 */
export interface OrderAcknowledgment {
  /** Order ID */
  orderId: string;

  /** Whether acknowledgment succeeded */
  success: boolean;

  /** Reference ID from marketplace */
  marketplaceReference?: string;

  /** Timestamp of acknowledgment */
  timestamp: Date;

  /** Acknowledgment message */
  message?: string;
}
