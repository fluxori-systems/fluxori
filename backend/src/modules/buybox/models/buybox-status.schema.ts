/**
 * BuyBox Status Schema
 */
import { FirestoreEntityWithMetadata } from '../../../common/repositories/base/repository-types';
import type {
  BuyBoxStatus as BuyBoxStatusType,
  CompetitorPrice,
  MarketPosition,
  PriceSourceType,
} from '../interfaces/types';

/**
 * BuyBox Status entity for Firestore
 */
export interface BuyBoxStatus extends FirestoreEntityWithMetadata {
  organizationId: string;
  productId: string;
  productSku: string;
  productName: string;
  marketplaceId: string;
  marketplaceName: string;
  status: BuyBoxStatusType;
  currentPrice: number;
  currentShipping: number;
  currency: string;
  listingUrl?: string;
  lastUpdated: Date;
  lastChecked: Date;
  competitors: CompetitorPrice[];
  marketPosition: MarketPosition;
  buyBoxWinner?: {
    competitorId: string;
    competitorName: string;
    price: number;
    shipping: number;
    totalPrice: number;
  };
  isMonitored: boolean;
  monitoringInterval: number; // minutes
  sourceType: PriceSourceType;
  metadata?: BuyBoxMetadata;
}

export interface BuyBoxMetadata {
  costPrice?: number;
  // Add more fields as they are discovered in the codebase
}
