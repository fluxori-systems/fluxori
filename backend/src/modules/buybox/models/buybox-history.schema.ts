/**
 * BuyBox History Schema
 */

/**
 * Placeholder for BuyBox history metadata. TODO: Add concrete fields as discovered.
 */
export interface BuyBoxHistoryMetadata {
  // TODO: Add concrete metadata fields here as they are discovered in the codebase
}

import { FirestoreEntity } from '../../../types/google-cloud.types';
import {
  BuyBoxStatus,
  CompetitorPrice,
  PriceAdjustment,
} from '../interfaces/types';

/**
 * BuyBox History entity for Firestore
 */
export interface BuyBoxHistory extends FirestoreEntity {
  version: number; // Ensure always present for FirestoreEntityWithMetadata compliance
  isDeleted: boolean; // Ensure always present for FirestoreEntityWithMetadata compliance
  organizationId: string;
  productId: string;
  productSku: string;
  productName: string;
  marketplaceId: string;
  marketplaceName: string;
  status: BuyBoxStatus;
  timestamp: Date;
  price: number;
  shipping: number;
  currency: string;
  competitors: CompetitorPrice[];
  adjustments?: PriceAdjustment[];
  buyBoxWinner?: {
    competitorId: string;
    competitorName: string;
    price: number;
    shipping: number;
    totalPrice: number;
  };
  // TODO: Refine BuyBoxHistoryMetadata as requirements become clear
  metadata?: BuyBoxHistoryMetadata;
}
