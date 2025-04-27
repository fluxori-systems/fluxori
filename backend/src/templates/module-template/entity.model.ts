import { FirestoreEntity } from '../../../types/google-cloud.types';

/**
 * Entity definition
 *
 * Replace this with your entity's properties
 */
export interface Entity extends FirestoreEntity {
  organizationId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  metadata?: Record<string, any>;
}
