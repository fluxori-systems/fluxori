/**
 * Types for the AI Insights module
 */

export enum InsightType {
  SALES_TREND = 'sales_trend',
  INVENTORY_ALERT = 'inventory_alert',
  PRICING_RECOMMENDATION = 'pricing_recommendation',
  MARKET_OPPORTUNITY = 'market_opportunity',
  COMPETITOR_CHANGE = 'competitor_change',
  ANOMALY_DETECTION = 'anomaly_detection',
}

export enum InsightSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum InsightStatus {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

// TODO: Replace InsightData with a more specific structure as requirements become clear
export interface InsightData {
  // Add concrete fields here as the data model matures
  [key: string]: unknown; // Use unknown for strictness
}

// TODO: Replace InsightMetadata with a more specific structure as requirements become clear
export interface InsightMetadata {
  // Add concrete fields here as the metadata model matures
  [key: string]: unknown; // Use unknown for strictness
}

export interface IInsight {
  organizationId: string;
  type: InsightType;
  title: string;
  description: string;
  data: InsightData;
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
}

export interface IInsightDocument extends IInsight, Document {}

export interface CreateInsightDto {
  organizationId: string;
  type: InsightType;
  title: string;
  description: string;
  data: InsightData; // TODO: Refine fields as discovered
  severity: InsightSeverity;
  confidence: number;
  relatedEntityType?: string;
  relatedEntityId?: string;
  expiresAt?: Date;
}

export interface UpdateInsightDto {
  status?: InsightStatus;
  acknowledgedBy?: string;
  resolvedBy?: string;
}

export interface QueryInsightsDto {
  organizationId?: string;
  type?: InsightType;
  severity?: InsightSeverity;
  status?: InsightStatus;
  relatedEntityType?: string;
  relatedEntityId?: string;
  minConfidence?: number;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface InsightResponse {
  id: string;
  organizationId: string;
  type: InsightType;
  title: string;
  description: string;
  data: InsightData; // TODO: Refine fields as discovered
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
}

export interface AIModelConfig {
  modelProvider: string;
  modelName: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}

export interface AIAnalysisResult {
  insights: CreateInsightDto[];
  metadata: {
    modelUsed: string;
    processingTime: number;
    tokensUsed: number;
  };
}
