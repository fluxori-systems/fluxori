/**
 * Organization entity interfaces
 */
import { BaseEntity } from "../core/entity.types";

/**
 * Organization subscription plan
 */
export enum SubscriptionPlan {
  FREE = "free",
  STARTER = "starter",
  BUSINESS = "business",
  ENTERPRISE = "enterprise",
}

/**
 * Organization status
 */
export enum OrganizationStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING = "pending",
}

/**
 * Industry sector
 */
export enum IndustrySector {
  RETAIL = "retail",
  WHOLESALE = "wholesale",
  MANUFACTURING = "manufacturing",
  SERVICES = "services",
  TECHNOLOGY = "technology",
  OTHER = "other",
}

/**
 * Organization entity interface
 */
export interface Organization extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  status: OrganizationStatus;
  plan: SubscriptionPlan;
  industry?: IndustrySector;

  // Logo and branding
  logoUrl?: string;
  brandColor?: string;

  // Address
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  // Billing
  billing?: {
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    vatNumber?: string;
    companyRegistrationNumber?: string;
  };

  // South Africa specific
  bbbeeLevel?: number;
  bbbeeVerificationId?: string;

  // Metadata
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  userCount?: number;

  // Feature flags and limits
  featureFlags?: {
    enableAI?: boolean;
    enableAdvancedAnalytics?: boolean;
    enableMultiWarehouse?: boolean;
    enableInternationalTrade?: boolean;
    enableMarketplaceIntegration?: boolean;
    [key: string]: boolean | undefined;
  };

  limits?: {
    maxUsers?: number;
    maxProducts?: number;
    maxStorage?: number;
    maxOrders?: number;
    maxApiCalls?: number;
    [key: string]: number | undefined;
  };
}

/**
 * Organization invitation interface
 */
export interface OrganizationInvitation extends BaseEntity {
  organizationId: string;
  email: string;
  role: string;
  invitedById: string;
  invitedByName: string;
  token: string;
  expiresAt: Date | string;
  status: "pending" | "accepted" | "declined" | "expired";
}

/**
 * Organization membership interface
 */
export interface OrganizationMembership extends BaseEntity {
  organizationId: string;
  userId: string;
  role: string;
  joinedAt: Date | string;
  isActive: boolean;
  permissions?: string[];
}

/**
 * Organization creation DTO
 */
export interface CreateOrganizationDto {
  name: string;
  industry?: IndustrySector;
  website?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

/**
 * Organization update DTO
 */
export interface UpdateOrganizationDto {
  name?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  industry?: IndustrySector;
  logoUrl?: string;
  brandColor?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  billing?: {
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    vatNumber?: string;
    companyRegistrationNumber?: string;
  };
  settings?: Record<string, any>;
}
