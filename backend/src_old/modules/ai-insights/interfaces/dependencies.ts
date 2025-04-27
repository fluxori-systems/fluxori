// Dependencies for AI insights module
// Using Google Cloud services

// Export the interfaces and types needed by this module
export interface IAIModelConfigDocument {
  id: string;
  name: string;
  provider: string;
  model: string;
  prompt: string;
  maxTokens: number;
  temperature: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInsightDocument {
  id: string;
  organizationId: string;
  type: InsightType;
  title: string;
  description: string;
  data: any;
  severity: InsightSeverity;
  confidence: number;
  status: InsightStatus;
  relatedEntityType?: string;
  relatedEntityId?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum InsightType {
  SALES_TREND = "sales_trend",
  INVENTORY_ALERT = "inventory_alert",
  COMPETITOR_CHANGE = "competitor_change",
  ANOMALY_DETECTION = "anomaly_detection",
  PRICING_OPPORTUNITY = "pricing_opportunity",
}

export enum InsightSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum InsightStatus {
  NEW = "new",
  VIEWED = "viewed",
  ACTIONED = "actioned",
  DISMISSED = "dismissed",
}
