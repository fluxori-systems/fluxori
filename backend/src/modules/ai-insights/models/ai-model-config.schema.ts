import { TenantEntity } from '../../../common/types/tenant-entity';
import { InsightMetadata } from '../interfaces/types';

/**
 * AI Model Configuration entity for Firestore
 */
import { FirestoreEntityWithMetadata } from '../../../common/repositories/base/repository-types';

export interface AIModelConfig
  extends TenantEntity,
    FirestoreEntityWithMetadata {
  organizationId: string;
  modelProvider: string;
  modelName: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
  isEnabled: boolean;
  metadata?: InsightMetadata; // TODO: Refine fields as discovered
}
