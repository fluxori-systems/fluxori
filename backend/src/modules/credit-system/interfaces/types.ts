/**
 * Types for the Credit System module
 */

/**
 * Placeholder for Credit Alert arguments. TODO: Add concrete fields as discovered.
 */
export interface CreditAlertArguments {
  // TODO: Add concrete argument fields here
}

/**
 * Placeholder for Credit Alert message. TODO: Add concrete fields as discovered.
 */
export interface CreditAlertMessage {
  // TODO: Add concrete message fields here
}

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
  /** Custom fields for extensibility */
  customFields?: Record<string, unknown>;
  /** Add further fields as real usage emerges */
}

/**
 * Placeholder for Credit System arguments fields. TODO: Add concrete fields as discovered.
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
    [key: string]: unknown;
  };
  /** Additional arguments as needed */
  [key: string]: unknown;
  /** Add further fields as real usage emerges */
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
  // TODO: Refine metadata type as requirements become clear
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
  // TODO: Refine metadata type as requirements become clear
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
  // TODO: Refine metadata type as requirements become clear
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
  // TODO: Refine metadata type as requirements become clear
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
   * Arguments for the credit alert. TODO: Refine fields as discovered.
   */
  arguments: CreditAlertArguments;
  /**
   * Messages related to the credit alert. TODO: Refine fields as discovered.
   */
  messages: CreditAlertMessage[];
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
  // TODO: Refine metadata type as requirements become clear
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
  // TODO: Refine metadata type as requirements become clear
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
