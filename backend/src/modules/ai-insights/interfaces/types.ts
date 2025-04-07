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

export interface IInsight {
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
}

export interface IInsightDocument extends IInsight, Document {}

export interface CreateInsightDto {
  organizationId: string;
  type: InsightType;
  title: string;
  description: string;
  data: Record<string, any>;
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