import { FirestoreEntityWithMetadata } from '../repositories/base/repository-types';

export interface TenantEntity extends FirestoreEntityWithMetadata {
  organizationId: string;
  // Add any other tenant-specific fields here if needed
}
