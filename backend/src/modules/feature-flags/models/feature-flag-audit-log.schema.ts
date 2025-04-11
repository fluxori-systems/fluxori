// Using interface-based schema for Firestore compatibility

/**
 * Feature Flag Audit Log Schema structure
 * This schema definition provides documentation for the feature flag audit log structure
 * used in the Firestore database.
 */
export interface FeatureFlagAuditLogSchema {
  // Required fields
  flagId: string;
  flagKey: string;
  action: "created" | "updated" | "deleted" | "toggled";
  performedBy: string;
  timestamp: Date;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;

  // Optional fields
  metadata?: Record<string, any>;

  // Firestore standard fields - added automatically
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  version?: number;
}
