/**
 * Types for the Credit System module
 */

// The following legacy placeholder interfaces were removed due to lack of usage and concrete business requirements:
// - CreditAlertArguments
// - CreditAlertMessage
// - CreditMessage
// If future business needs arise, reintroduce these interfaces with strict typing based on actual usage.

/**
 * Placeholder for Credit System metadata fields. TODO: Add concrete fields as discovered.
 */
export interface CreditSystemMetadata {
  /** Source of credit operation (e.g., manual, automated, migration) */
  source?: string;
  /** Who/what triggered the operation */
  actor?: string;
  /** Timestamp for metadata creation/update */
  updatedAt?: Date;
  /** Operation type or subtype (e.g., "allocation", "usage", "refund") */
  operationType?: string;
  /** Arbitrary notes or audit info */
  notes?: string;
  /** Allocation ID related to the operation, if applicable */
  allocationId?: string;
  /** Whether the allocation was newly created */
  allocationCreated?: boolean;
  // Further extensibility must be justified by concrete business requirements. Avoid generic Record<string, unknown>.
}

/**
 * Placeholder for Credit System arguments fields.
 */
export interface CreditArguments {
  /** Model involved in the credit operation */
  modelId: string;
  /** Model provider (e.g., OpenAI, Vertex) */
  modelProvider: string;
  /** Number of input tokens */
  inputTokens: number;
  /** Number of output tokens */
  outputTokens: number;
  /** Operation type (e.g., usage, allocation, reservation) */
  operationType: string;
  /** Contextual information (organization, user, etc.) */
  context?: {
    organizationId?: string;
    userId?: string;
    environment?: string;
    // Further extensibility must be justified by concrete business requirements.
  };
  // Further extensibility must be justified by concrete business requirements. Avoid generic index signatures.
}

/**
 * Placeholder for Credit System message fields. TODO: Add concrete fields as discovered.
 */
export interface CreditMessage {
  // TODO: Add concrete message fields here as they are discovered in the codebase
}

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
  isDeleted: boolean; // Ensure always present for FirestoreEntityWithMetadata compliance
  version: number; // Ensure always present for FirestoreEntityWithMetadata compliance
  organizationId: string;
  userId?: string;
  modelType: CreditModelType;
  totalCredits: number;
  remainingCredits: number;
  resetDate?: Date;
  expirationDate?: Date;
  isActive: boolean;
  /**
   * Strictly typed metadata for reservation. Further extensibility must be justified by business needs.
   */
  metadata?: CreditSystemMetadata;
}

/**
 * Credit usage transaction entity stored in Firestore
 */
export interface CreditTransaction extends FirestoreEntity {
  isDeleted: boolean; // Ensure always present for FirestoreEntityWithMetadata compliance
  version: number; // Ensure always present for FirestoreEntityWithMetadata compliance
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
  /**
   * Strictly typed metadata for reservation. Further extensibility must be justified by business needs.
   */
  metadata?: CreditSystemMetadata;
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
  /**
   * Strictly typed metadata for reservation. Further extensibility must be justified by business needs.
   */
  metadata?: CreditSystemMetadata;
}

/**
 * Credit pricing tier entity stored in Firestore
 */
export interface CreditPricingTier extends FirestoreEntity {
  isDeleted: boolean; // Ensure always present for FirestoreEntityWithMetadata compliance
  version: number; // Ensure always present for FirestoreEntityWithMetadata compliance
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
  usageByModel: Record<
    string,
    {
      inputTokens: number;
      outputTokens: number;
      creditsUsed: number;
    }
  >;
  usageByType: Partial<Record<CreditUsageType, number>>; // More precise than {[type in CreditUsageType]?: number;}
}

/**
 * Credit reservation entity stored in Firestore
 */
export interface CreditReservation extends FirestoreEntity {
  isDeleted: boolean; // Ensure always present for FirestoreEntityWithMetadata compliance
  version: number; // Ensure always present for FirestoreEntityWithMetadata compliance
  organizationId: string;
  userId?: string;
  operationId: string;
  reservationAmount: number;
  usageType: CreditUsageType;
  status: 'pending' | 'confirmed' | 'released' | 'expired';
  expirationDate: Date;
  /**
   * Strictly typed metadata for reservation. Further extensibility must be justified by business needs.
   */
  metadata?: CreditSystemMetadata;
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
  /**
   * Arguments for the credit alert. Strict typing required if alert arguments are used in business logic.
   * Replace 'unknown' with a concrete type if/when requirements emerge.
   */
  arguments: unknown;
  /**
   * Messages related to the credit alert. Strict typing required if alert messages are used in business logic.
   * Replace 'unknown[]' with a concrete type if/when requirements emerge.
   */
  messages: unknown[];
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
  /**
   * Strictly typed metadata for reservation. Further extensibility must be justified by business needs.
   */
  metadata?: CreditSystemMetadata;
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
  /**
   * Strictly typed metadata for reservation. Further extensibility must be justified by business needs.
   */
  metadata?: CreditSystemMetadata;
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
