/**
 * Types for the Feature Flags module
 */

/**
 * Metadata for FeatureFlag (TODO: add concrete fields as discovered)
 */
export interface FeatureFlagMetadata {
  // TODO: Add concrete metadata fields here as they are discovered in the codebase
}

/**
 * Metadata for FeatureFlagAuditLog (TODO: add concrete fields as discovered)
 */
export interface FeatureFlagAuditLogMetadata {
  // TODO: Add concrete metadata fields here as they are discovered in the codebase
}

/**
 * Attributes for FlagEvaluationContext (TODO: add concrete fields as discovered)
 */
export interface FlagAttributes {
  // TODO: Add concrete attribute fields here as they are discovered in the codebase
}

/**
 * Metadata for FlagEvaluationResult (TODO: add concrete fields as discovered)
 */
export interface FlagEvaluationMetadata {
  /** Unique identifier for the evaluation event */
  evaluationId: string;
  /** The rule or condition that matched */
  matchedRule?: string;
  /** Timestamp of evaluation */
  evaluatedAt: Date;
  /** Variant or value returned by the evaluation */
  variant?: string;
  /** Additional context or debug info */
  context?: Record<string, unknown>;
  /** Add further fields as real usage emerges */
}

/**
 * Metadata for FeatureFlagDTO (TODO: add concrete fields as discovered)
 */
export interface FeatureFlagDTOMetadata {
  /** Unique identifier for this metadata record */
  id: string;
  /** Source of the flag (e.g., manual, import, migration) */
  source?: string;
  /** Timestamp when this metadata was created or updated */
  updatedAt: Date;
  /** Author or system that last changed the flag */
  updatedBy?: string;
  /** Arbitrary notes or audit info */
  notes?: string;
  /** Add further fields as real usage emerges */
}

import { FirestoreEntity } from '../../../types/google-cloud.types';

/**
 * Feature flag types
 */
export enum FeatureFlagType {
  BOOLEAN = 'boolean',
  PERCENTAGE = 'percentage',
  USER_TARGETED = 'user_targeted',
  ORGANIZATION_TARGETED = 'organization_targeted',
  ENVIRONMENT_TARGETED = 'environment_targeted',
  SCHEDULED = 'scheduled',
}

/**
 * Environment types for environment-specific flags
 */
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  ALL = 'all',
}

/**
 * User targeting strategy for user-targeted flags
 */
export interface UserTargeting {
  userIds?: string[];
  userRoles?: string[];
  userEmails?: string[];
}

/**
 * Organization targeting strategy for organization-targeted flags
 */
export interface OrganizationTargeting {
  organizationIds?: string[];
  organizationTypes?: string[];
}

/**
 * Scheduling configuration for scheduled flags
 */
export interface ScheduleConfig {
  startDate?: Date;
  endDate?: Date;
  timeZone?: string;
  recurrence?: {
    type: 'once' | 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
    timeRanges?: Array<{
      startTime: string; // HH:MM format
      endTime: string; // HH:MM format
    }>;
  };
}

/**
 * Feature flag entity
 */
export interface FeatureFlag extends FirestoreEntity {
  key: string;
  name: string;
  description?: string;
  type: FeatureFlagType;
  enabled: boolean;

  // For percentage rollout
  percentage?: number;

  // For user targeting
  userTargeting?: UserTargeting;

  // For organization targeting
  organizationTargeting?: OrganizationTargeting;

  // For environment targeting
  environments?: Environment[];

  // For scheduled flags
  schedule?: ScheduleConfig;

  // Default value if flag evaluation fails
  defaultValue: boolean;

  // Flag tags for grouping and categorization
  tags?: string[];

  // Additional metadata
  metadata?: FeatureFlagMetadata;

  // Audit information
  lastModifiedBy?: string;
  lastModifiedAt?: Date;
}

/**
 * Audit log entry for feature flag changes
 */
export interface FeatureFlagAuditLog extends FirestoreEntity {
  flagId: string;
  flagKey: string;
  action: 'created' | 'updated' | 'deleted' | 'toggled';
  performedBy: string;
  timestamp: Date;
  changes: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  metadata?: FeatureFlagAuditLogMetadata;
}

/**
 * Feature flag evaluation context
 */
export interface FlagEvaluationContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  organizationId?: string;
  organizationType?: string;
  environment?: Environment;
  currentDate?: Date;
  attributes?: FlagAttributes;
  defaultValue?: boolean;
}

/**
 * Feature flag evaluation result
 */
export interface FlagEvaluationResult {
  flagKey: string;
  enabled: boolean;
  source: 'evaluation' | 'default' | 'override' | 'error';
  timestamp: Date;
  reason?: string;
  metadata?: FlagEvaluationMetadata;
}

/**
 * Feature flag create/update DTO
 */
export interface FeatureFlagDTO {
  key: string;
  name: string;
  description?: string;
  type: FeatureFlagType;
  enabled: boolean;
  percentage?: number;
  userTargeting?: UserTargeting;
  organizationTargeting?: OrganizationTargeting;
  environments?: Environment[];
  schedule?: ScheduleConfig;
  defaultValue: boolean;
  tags?: string[];
  metadata?: FeatureFlagDTOMetadata;
}

/**
 * Feature flag toggle DTO
 */
export interface FeatureFlagToggleDTO {
  enabled: boolean;
}

/**
 * Error types for feature flag operations
 */
export enum FeatureFlagErrorType {
  VALIDATION_ERROR = 'validation_error',
  NOT_FOUND = 'not_found',
  DUPLICATE_KEY = 'duplicate_key',
  EVALUATION_ERROR = 'evaluation_error',
  PERMISSION_DENIED = 'permission_denied',
  INTERNAL_ERROR = 'internal_error',
}

/**
 * Feature flag subscription for real-time updates
 */
export interface FlagSubscription {
  flagKeys: string[];
  callback: (flags: Record<string, boolean>) => void;
  evaluationContext?: FlagEvaluationContext;
}
