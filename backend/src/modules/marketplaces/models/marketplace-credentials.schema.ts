import { FirestoreEntity, Timestamp } from '../../../types/google-cloud.types';

/**
 * Marketplace credentials schema for Firestore
 */
export interface MarketplaceCredential extends FirestoreEntity {
  /** ID of the marketplace (e.g., 'amazon', 'takealot', 'shopify') */
  marketplaceId: string;
  
  /** Organization ID that these credentials belong to */
  organizationId: string;
  
  /** Credential details */
  credentials: Record<string, any>;
  
  /** Whether the credentials are active */
  isActive: boolean;
  
  /** Status of the last connection attempt */
  lastConnectionStatus?: {
    connected: boolean;
    message?: string;
    timestamp: Date | Timestamp;
  };
  
  /** OAuth refresh token */
  refreshToken?: string;
  
  /** OAuth access token */
  accessToken?: string;
  
  /** Expiration time for the access token */
  tokenExpiresAt?: Date | Timestamp;
  
  /** Marketplace-specific settings */
  settings?: Record<string, any>;
}

/**
 * Connection status response type
 */
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