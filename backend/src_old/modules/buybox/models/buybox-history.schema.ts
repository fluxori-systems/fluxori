/**
 * BuyBox History Schema
 */
import { FirestoreEntity } from "../../../types/google-cloud.types";
import {
  BuyBoxStatus,
  CompetitorPrice,
  PriceAdjustment,
} from "../interfaces/types";

/**
 * BuyBox History entity for Firestore
 */
export interface BuyBoxHistory extends FirestoreEntity {
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
  metadata?: Record<string, any>;
}
