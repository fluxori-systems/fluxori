import { FirestoreEntity } from '../../../types/google-cloud.types';
import {
  InsightType,
  InsightSeverity,
  InsightStatus,
} from '../interfaces/types';

/**
 * Insight entity for Firestore
 */
export interface Insight extends FirestoreEntity {
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
