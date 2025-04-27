/**
 * Core entity types used across the application
 */

/**
 * Base entity interface
 * Common properties shared by all entities
 */
export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  isDeleted?: boolean;
  deletedAt?: Date | string | null;
  version?: number;
}

/**
 * Tenant-aware entity interface
 * For all data that should be segregated by organization
 */
export interface TenantEntity extends BaseEntity {
  organizationId: string;
}

/**
 * User-attributed entity interface
 * For entities that should track which user created/modified them
 */
export interface UserAttributedEntity extends TenantEntity {
  createdById: string;
  updatedById?: string;
}

/**
 * Versionable entity interface
 * For entities that need version history
 */
export interface VersionableEntity extends TenantEntity {
  version: number;
  previousVersionId?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Query options for fetching entities
 */
export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  includeDeleted?: boolean;
  filters?: Record<string, any>;
  search?: string;
}

/**
 * Database field types
 */
export enum FieldType {
  TEXT = "text",
  NUMBER = "number",
  BOOLEAN = "boolean",
  DATE = "date",
  OBJECT = "object",
  ARRAY = "array",
  REFERENCE = "reference",
  GEO_POINT = "geopoint",
  MAP = "map",
}

/**
 * Advanced filter options for queries
 */
export interface AdvancedFilter {
  field: string;
  operator:
    | "=="
    | "!="
    | "<"
    | "<="
    | ">"
    | ">="
    | "array-contains"
    | "array-contains-any"
    | "in"
    | "not-in";
  value: any;
}
