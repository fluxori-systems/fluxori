/**
 * Types for the Credit System module
 */
import { FirestoreEntity } from '../../../types/google-cloud.types';

/**
 * Credit allocation model types
 */
export enum CreditModelType {
  SUBSCRIPTION = 'subscription',
  PAY_AS_YOU_GO = 'pay_as_you_go',
  QUOTA = 'quota',
  PREPAID = 'prepaid',
}

/**
 * Credit usage types
 */
export enum CreditUsageType {
  TOKEN_USAGE = 'token_usage',
  MODEL_CALL = 'model_call',
  DOCUMENT_PROCESSING = 'document_processing',
  RAG_QUERY = 'rag_query',
  EMBEDDING = 'embedding',
  INSIGHT_GENERATION = 'insight_generation',
}

/**
 * Credit allocation entity stored in Firestore
 */
export interface CreditAllocation extends FirestoreEntity {
  organizationId: string;
  userId?: string;
  modelType: CreditModelType;
  totalCredits: number;
  remainingCredits: number;
  resetDate?: Date;
  expirationDate?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

/**
 * Credit usage transaction entity stored in Firestore
 */
export interface CreditTransaction extends FirestoreEntity {
  organizationId: string;
  userId?: string;
  amount: number;
  transactionType: 'credit' | 'debit';
  usageType: CreditUsageType;
  modelId?: string;
  modelProvider?: string;
  inputTokens?: number;
  outputTokens?: number;
  costPerToken?: number;
  operationId?: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, any>;
}

/**
 * Credit usage log entity stored in Firestore
 */
export interface CreditUsageLog extends FirestoreEntity {
  organizationId: string;
  userId?: string;
  usageType: CreditUsageType;
  modelId?: string;
  modelProvider?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  creditsUsed: number;
  processingTime?: number;
  success: boolean;
  errorMessage?: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, any>;
}

/**
 * Credit pricing tier entity stored in Firestore
 */
export interface CreditPricingTier extends FirestoreEntity {
  modelId: string;
  modelProvider: string;
  displayName: string;
  inputTokenCost: number; // Cost per 1000 input tokens in credits
  outputTokenCost: number; // Cost per 1000 output tokens in credits
  effectiveDate: Date;
  expirationDate?: Date;
  isActive: boolean;
  regionSpecificPricing?: {
    [region: string]: {
      inputTokenCost: number;
      outputTokenCost: number;
    };
  };
}

/**
 * Credit usage statistics entity stored in Firestore
 */
export interface CreditUsageStats extends FirestoreEntity {
  organizationId: string;
  period: 'daily' | 'weekly' | 'monthly';
  periodStart: Date;
  periodEnd: Date;
  totalCreditsUsed: number;
  totalTokens: number;
  usageByModel: {
    [modelId: string]: {
      inputTokens: number;
      outputTokens: number;
      creditsUsed: number;
    };
  };
  usageByType: {
    [type in CreditUsageType]?: number;
  };
}

/**
 * Credit reservation entity stored in Firestore
 */
export interface CreditReservation extends FirestoreEntity {
  organizationId: string;
  userId?: string;
  operationId: string;
  reservationAmount: number;
  usageType: CreditUsageType;
  status: 'pending' | 'confirmed' | 'released' | 'expired';
  expirationDate: Date;
  metadata?: Record<string, any>;
}

/**
 * Credit alert entity stored in Firestore
 */
export interface CreditAlert extends FirestoreEntity {
  organizationId: string;
  alertType:
    | 'low_balance'
    | 'high_usage'
    | 'quota_exceeded'
    | 'approaching_limit';
  thresholdPercentage: number;
  triggered: boolean;
  lastTriggeredAt?: Date;
  createdBy: string;
  notificationChannels: string[];
  isActive: boolean;
}

/**
 * Token usage calculation result
 */
export interface TokenUsageCalculation {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  creditCost: number;
  modelId: string;
  modelProvider: string;
}

/**
 * Credit check request
 */
export interface CreditCheckRequest {
  organizationId: string;
  userId?: string;
  expectedInputTokens: number;
  expectedOutputTokens: number;
  modelId: string;
  usageType: CreditUsageType;
  operationId?: string;
  metadata?: Record<string, any>;
}

/**
 * Credit check response
 */
export interface CreditCheckResponse {
  hasCredits: boolean;
  availableCredits: number;
  estimatedCost: number;
  reservationId?: string;
  reason?: string;
}

/**
 * Credit usage record request
 */
export interface CreditUsageRequest {
  organizationId: string;
  userId?: string;
  usageType: CreditUsageType;
  modelId: string;
  modelProvider: string;
  inputTokens: number;
  outputTokens: number;
  processingTime?: number;
  operationId?: string;
  reservationId?: string;
  resourceId?: string;
  resourceType?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Credit system status
 */
export interface CreditSystemStatus {
  isOperational: boolean;
  latestTransaction?: Date;
  reservationCount: number;
  activeUserCount: number;
  cacheHitRate: number;
  averageLatency: number;
}
