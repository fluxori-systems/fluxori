/**
 * Shared Product Interface
 *
 * This interface defines the minimal contract for Product objects
 * that can be shared between modules. It includes only the properties
 * that are required for cross-module communication.
 */

export interface IProduct {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  description?: string;
  pricing?: {
    basePrice: number;
    salePrice?: number;
    currency: string;
  };
  stockQuantity?: number;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  mainImageUrl?: string;
  additionalImageUrls?: string[];
  externalIds?: Record<string, string>;
  metadata?: Record<string, any>;
}

/**
 * Product Service Interface
 *
 * This interface defines the operations that can be performed on Products
 * across module boundaries. It serves as a contract for modules that need
 * to work with products without directly depending on the inventory module.
 */
export interface IProductService {
  /**
   * Get a product by its ID
   */
  getProductById(id: string): Promise<IProduct | null>;

  /**
   * Get a product by its SKU
   */
  getProductBySku(
    organizationId: string,
    sku: string,
  ): Promise<IProduct | null>;

  /**
   * Create a new product
   */
  createProduct(product: Partial<IProduct>): Promise<IProduct>;

  /**
   * Update an existing product
   */
  updateProduct(id: string, data: Partial<IProduct>): Promise<IProduct>;

  /**
   * Update stock quantity for a product
   */
  updateStock(productId: string, quantity: number): Promise<IProduct>;
}
