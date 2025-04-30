/**
 * PriceHistoryRecord model for product price history tracking
 */
import { PriceVerificationStatus } from './competitor-price.model';

export { PriceVerificationStatus };

import { FirestoreEntityWithMetadata } from '../../../common/repositories/base/repository-types';

export interface PriceHistoryRecord extends FirestoreEntityWithMetadata {
  /** Unique record ID */
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
  /** Tenant ID (optional) */
  tenantId?: string;
  /** Organization ID */
  organizationId: string;
  /** Product ID */
  productId: string;
  /** Variant ID (optional) */
  variantId?: string;
  /** Marketplace ID (optional) */
  marketplaceId?: string;
  /** Marketplace Name (optional) */
  marketplaceName?: string;
  /** Record type: our price or competitor price */
  recordType: 'OUR_PRICE' | 'COMPETITOR_PRICE';
  /** Price value */
  price: number;
  /** Shipping value */
  shipping: number;
  /** Total price */
  totalPrice: number;
  /** Currency code */
  currency: string;
  /** Timestamp for the price record */
  // createdAt: Date; (removed duplicate, already defined at top)

  /** Timestamp for when the price was recorded */
  recordedAt?: Date;
  /** Competitor ID (if applicable) */
  competitorId?: string;
  /** Competitor Name (if applicable) */
  competitorName?: string;
  /** Source type */
  sourceType?: string;
  /** Has BuyBox */
  hasBuyBox?: boolean;
  /** Verification status */
  verificationStatus?: PriceVerificationStatus;
  /** Stock status (optional) */
  stockStatus?: string;
  /** Additional metadata (optional) */
  /**
   * Additional metadata for this price record. Use a strict union for allowed types.
   */
  metadata?: import('./custom-fields.model').CustomFields;
  // TODO: If extensibility is needed, consider using 'unknown' with runtime validation.
}
