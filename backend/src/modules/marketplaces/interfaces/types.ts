export interface MarketplaceCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  endpoint?: string;
  accountId?: string;
  organizationId: string;
  [key: string]: any;
}

export interface ConnectionStatus {
  connected: boolean;
  message?: string;
  details?: {
    accountInfo?: Record<string, any>;
    rateLimits?: {
      remaining: number;
      limit: number;
      reset: Date;
    };
    [key: string]: any;
  };
}

export interface MarketplaceProduct {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  stockLevel: number;
  status: "active" | "inactive" | "pending" | "rejected";
  categories?: string[];
  images?: string[];
  attributes?: Record<string, any>;
  variants?: Omit<MarketplaceProduct, "variants">[];
  marketplaceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface StockUpdatePayload {
  sku: string;
  stockLevel: number;
  locationId?: string;
}

export interface PriceUpdatePayload {
  sku: string;
  price: number;
  compareAtPrice?: number;
  currency?: string;
}

export interface StatusUpdatePayload {
  sku: string;
  status: "active" | "inactive";
}

export interface MarketplaceOrder {
  id: string;
  marketplaceOrderId: string;
  orderNumber?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  status: string;
  financialStatus?: string;
  fulfillmentStatus?: string;
  createdAt: Date;
  updatedAt: Date;
  currency: string;
  totalPrice: number;
  subtotalPrice: number;
  totalTax?: number;
  totalShipping?: number;
  totalDiscount?: number;
  items: MarketplaceOrderItem[];
  shippingAddress?: Address;
  billingAddress?: Address;
  [key: string]: any;
}

export interface MarketplaceOrderItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  totalPrice: number;
  tax?: number;
  image?: string;
  variantId?: string;
  properties?: Record<string, any>;
  [key: string]: any;
}

export interface Address {
  name?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
  [key: string]: any;
}

export interface OrderAcknowledgment {
  orderId: string;
  success: boolean;
  marketplaceReference?: string;
  timestamp: Date;
  message?: string;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  parentId?: string;
  level: number;
  isLeaf: boolean;
  children?: MarketplaceCategory[];
  attributes?: Array<{
    id: string;
    name: string;
    required: boolean;
    type: string;
    values?: string[];
  }>;
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems?: number;
    totalPages?: number;
    hasNextPage: boolean;
    nextPageToken?: string;
  };
}

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ProductFilterOptions {
  status?: "active" | "inactive" | "all";
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  updatedSince?: Date;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  [key: string]: any;
}

export interface OrderFilterOptions {
  status?: string;
  createdFrom?: Date;
  createdTo?: Date;
  updatedFrom?: Date;
  updatedTo?: Date;
  fulfillmentStatus?: string;
  financialStatus?: string;
  search?: string;
  [key: string]: any;
}
