import { TenantEntity } from '../../../common/types/tenant-entity';
import {
  InsightType,
  InsightSeverity,
  InsightStatus,
  InsightData,
} from '../interfaces/types';

/**
 * Insight entity for Firestore
 */
import { FirestoreEntityWithMetadata } from '../../../common/repositories/base/repository-types';

export interface Insight extends TenantEntity, FirestoreEntityWithMetadata {
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
