/**
 * BuyBox Status Schema
 */
import { FirestoreEntity } from '../../../types/google-cloud.types';
import {
  BuyBoxStatus as BuyBoxStatusEnum,
  CompetitorPrice,
  MarketPosition,
  PriceSourceType,
} from '../interfaces/types';

/**
 * BuyBox Status entity for Firestore
 */
export interface BuyBoxStatus extends FirestoreEntity {
  organizationId: string;
  productId: string;
  productSku: string;
  productName: string;
  marketplaceId: string;
  marketplaceName: string;
  status: BuyBoxStatusEnum;
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
  metadata?: Record<string, any>;
}
