/**
 * Firestore types for the AI Insights module
 */

// Re-export common types
import { InsightType, InsightSeverity, InsightStatus } from './types';
export { InsightType, InsightSeverity, InsightStatus };

/**
 * Firestore Insight interface
 */
export interface FirestoreInsight {
  id?: string;
  organizationId: string;
  type: InsightType;
  title: string;
  description: string;
  data: Record<string, any>;
  severity: InsightSeverity;
  status: InsightStatus;
  confidence: number;
  relatedEntityType?: string;
  relatedEntityId?: string;
  generatedAt: Date;
  expiresAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Firestore AI Model Config interface
 */
export interface FirestoreAIModelConfig {
  id?: string;
  organizationId: string;
  modelProvider: string;
  modelName: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
  isEnabled: boolean;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Reusing DTO types from the original types.ts
 */
export { CreateInsightDto, UpdateInsightDto, QueryInsightsDto } from './types';