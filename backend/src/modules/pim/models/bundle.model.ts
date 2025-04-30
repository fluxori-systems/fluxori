/**
 * Pricing strategy for product bundles
 */
export enum PricingStrategy {
  FIXED_PRICE = 'FIXED_PRICE',
  DISCOUNT_PERCENTAGE = 'DISCOUNT_PERCENTAGE',
  COMPONENT_SUM = 'COMPONENT_SUM',
  CUSTOM_FORMULA = 'CUSTOM_FORMULA',
}

/**
 * Bundle component model
 */
export interface BundleComponent {
  /**
   * Product ID of the component
   */
  productId: string;

  /**
   * SKU of the component
   */
  sku: string;

  /**
   * Quantity of the component in the bundle
   */
  quantity: number;

  /**
   * Whether the component is required
   */
  isRequired: boolean;
}

/**
 * Bundle model
 */
import { FirestoreEntityWithMetadata } from '../../../common/repositories/base/repository-types';
import { ProductAttribute } from '../interfaces/types';
import { Timestamp } from '../../../types/google-cloud.types';

export interface Bundle extends FirestoreEntityWithMetadata {
  /**
   * Bundle ID (auto-generated, required by FirestoreEntityWithMetadata)
   */
  id: string;

  /**
   * Name of the bundle
   */
  name: string;

  /**
   * Description of the bundle
   */
  description: string;

  /**
   * SKU for the bundle
   */
  sku: string;

  /**
   * Components of the bundle
   */
  components: BundleComponent[];

  /**
   * Pricing strategy for the bundle
   */
  pricingStrategy: PricingStrategy;

  /**
   * Price or discount value (depends on strategy)
   * For FIXED_PRICE: the actual price
   * For DISCOUNT_PERCENTAGE: the discount percentage (0-100)
   * For COMPONENT_SUM: ignored
   * For CUSTOM_FORMULA: custom formula expression
   */
  pricingValue?: number | string;

  /**
   * Category ID for the bundle
   */
  categoryId?: string;

  /**
   * Images for the bundle
   */
  images: string[];

  /**
   * Additional attributes for the bundle
   */
  attributes: ProductAttribute[];

  /**
   * Whether the bundle is active
   */
  isActive: boolean;

  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Creation timestamp (required by FirestoreEntityWithMetadata)
   */
  createdAt: Date | Timestamp;

  /**
   * Last update timestamp (required by FirestoreEntityWithMetadata)
   */
  updatedAt: Date | Timestamp;

  /**
   * Whether the bundle is deleted (required by FirestoreEntityWithMetadata)
   */
  isDeleted: boolean;

  /**
   * Deletion timestamp (optional, required by FirestoreEntityWithMetadata)
   */
  deletedAt?: Date | Timestamp | null;

  /**
   * Version for optimistic concurrency (required by FirestoreEntityWithMetadata)
   */
  version: number;
}
