/**
 * Types for the Feature Flags module
 */
import { FirestoreEntity } from "../../../types/google-cloud.types";

/**
 * Feature flag types
 */
export enum FeatureFlagType {
  BOOLEAN = "boolean",
  PERCENTAGE = "percentage",
  USER_TARGETED = "user_targeted",
  ORGANIZATION_TARGETED = "organization_targeted",
  ENVIRONMENT_TARGETED = "environment_targeted",
  SCHEDULED = "scheduled",
}

/**
 * Environment types for environment-specific flags
 */
export enum Environment {
  DEVELOPMENT = "development",
  STAGING = "staging",
  PRODUCTION = "production",
  ALL = "all",
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
    type: "once" | "daily" | "weekly" | "monthly";
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
  metadata?: Record<string, any>;

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
  action: "created" | "updated" | "deleted" | "toggled";
  performedBy: string;
  timestamp: Date;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
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
  attributes?: Record<string, any>;
  defaultValue?: boolean;
}

/**
 * Feature flag evaluation result
 */
export interface FlagEvaluationResult {
  flagKey: string;
  enabled: boolean;
  source: "evaluation" | "default" | "override" | "error";
  timestamp: Date;
  reason?: string;
  metadata?: Record<string, any>;
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
  metadata?: Record<string, any>;
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
  VALIDATION_ERROR = "validation_error",
  NOT_FOUND = "not_found",
  DUPLICATE_KEY = "duplicate_key",
  EVALUATION_ERROR = "evaluation_error",
  PERMISSION_DENIED = "permission_denied",
  INTERNAL_ERROR = "internal_error",
}

/**
 * Feature flag subscription for real-time updates
 */
export interface FlagSubscription {
  flagKeys: string[];
  callback: (flags: Record<string, boolean>) => void;
  evaluationContext?: FlagEvaluationContext;
}
