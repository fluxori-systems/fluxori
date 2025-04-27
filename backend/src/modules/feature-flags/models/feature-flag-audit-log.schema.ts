// Using interface-based schema for Firestore compatibility

/**
 * Metadata for FeatureFlagAuditLog (TODO: add concrete fields as discovered)
 */
export interface FeatureFlagAuditLogMetadata {
  // TODO: Add concrete metadata fields here as they are discovered in the codebase
}

/**
 * Feature Flag Audit Log Schema structure
 * This schema definition provides documentation for the feature flag audit log structure
 * used in the Firestore database.
 */
export interface FeatureFlagAuditLogSchema {
  // Required fields
  flagId: string;
  flagKey: string;
  action: 'created' | 'updated' | 'deleted' | 'toggled';
  performedBy: string;
  timestamp: Date;
  changes: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }>;

  // Optional fields
  metadata?: FeatureFlagAuditLogMetadata;

  // Firestore standard fields - added automatically
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  version?: number;
}
