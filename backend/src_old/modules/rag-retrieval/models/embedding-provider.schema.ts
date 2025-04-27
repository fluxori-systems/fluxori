/**
 * Embedding Provider entity schema
 */
import { FirestoreEntity } from "../../../types/google-cloud.types";
import { EmbeddingProviderType } from "../interfaces/types";

/**
 * Embedding Provider entity for Firestore
 */
export interface EmbeddingProvider extends FirestoreEntity {
  organizationId: string;
  name: string;
  description?: string;
  type: EmbeddingProviderType;
  apiKey: string;
  apiEndpoint?: string;
  modelName: string;
  isDefault: boolean;
  isEnabled: boolean;
  dimensions: number;
  maxTokens: number;
  batchSize: number;
  metadata?: Record<string, any>;
  lastUsedAt?: Date;
  usageCount: number;
  costPerToken: number;
}
