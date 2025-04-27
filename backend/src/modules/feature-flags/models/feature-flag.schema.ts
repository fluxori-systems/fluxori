// Import types instead
import {
  FeatureFlagType,
  Environment,
  UserTargeting,
  OrganizationTargeting,
  ScheduleConfig,
} from '../interfaces/types';

/**
 * Metadata for feature flags (extend as fields are discovered)
 */
export interface FeatureFlagMetadata {
  // Add concrete metadata fields here as they are discovered in the codebase
}

/**
 * Feature Flag Schema structure
 * This schema definition provides documentation for the feature flag structure
 * used in the Firestore database.
 */
export interface FeatureFlagSchema {
  // Required fields
  key: string;
  name: string;
  type: FeatureFlagType;
  enabled: boolean;
  defaultValue: boolean;

  // Optional fields
  description?: string;
  percentage?: number;
  userTargeting?: UserTargeting;
  organizationTargeting?: OrganizationTargeting;
  environments?: Environment[];
  schedule?: ScheduleConfig;
  tags?: string[];
  metadata?: FeatureFlagMetadata;
  lastModifiedBy?: string;
  lastModifiedAt?: Date;

  // Firestore standard fields - added automatically
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  version?: number;
}
