import { FirestoreEntity } from '../../../types/google-cloud.types';

/**
 * AI Model Configuration entity for Firestore
 */
export interface AIModelConfig extends FirestoreEntity {
  organizationId: string;
  modelProvider: string;
  modelName: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
  isEnabled: boolean;
  metadata?: Record<string, any>;
}
