/**
 * Helper functions for repositories
 * Common utilities for working with repositories
 */

import {
  QueryFilter,
  QueryOptions,
  SortDirection,
  RepositoryOptions,
} from "../types";

/**
 * Creates a query filter for a simple equality condition
 */
export function equalTo<T>(field: keyof T, value: any): QueryFilter<T> {
  return {
    field: field as string,
    operator: "==",
    value,
  };
}

/**
 * Creates a query filter for a greater than condition
 */
export function greaterThan<T>(field: keyof T, value: any): QueryFilter<T> {
  return {
    field: field as string,
    operator: ">",
    value,
  };
}

/**
 * Creates a query filter for a less than condition
 */
export function lessThan<T>(field: keyof T, value: any): QueryFilter<T> {
  return {
    field: field as string,
    operator: "<",
    value,
  };
}

/**
 * Creates a query options object with standard pagination
 */
export function paginatedQuery<T>(
  page: number = 1,
  pageSize: number = 20,
  orderBy: keyof T | string = "createdAt",
  direction: SortDirection = "desc",
): QueryOptions<T> {
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: orderBy as string,
    direction,
  };
}

/**
 * Creates a standard set of filters for tenant-aware repositories
 */
export function organizationFilters<T>(
  organizationId: string,
  additionalFilters: QueryFilter<T>[] = [],
): QueryFilter<T>[] {
  return [
    {
      field: "organizationId",
      operator: "==",
      value: organizationId,
    },
    ...additionalFilters,
  ];
}

/**
 * Creates a standard set of filters for soft-deleted entities
 */
export function deletedStateFilters<T>(
  includeDeleted: boolean = false,
  additionalFilters: QueryFilter<T>[] = [],
): QueryFilter<T>[] {
  if (!includeDeleted) {
    return [
      {
        field: "deleted",
        operator: "==",
        value: false,
      },
      ...additionalFilters,
    ];
  }
  return additionalFilters;
}

/**
 * Standard repository factory options
 */
export const STANDARD_REPOSITORY_OPTIONS: Partial<RepositoryOptions> = {
  enableCache: true,
  cacheTTLMs: 300000, // 5 minutes
  useSoftDeletes: true,
  autoTimestamps: true,
  validateOnWrite: true,
};

/**
 * Create repository options with custom settings
 */
export function createRepositoryOptions(
  customOptions: Partial<RepositoryOptions> = {},
): RepositoryOptions {
  return {
    ...STANDARD_REPOSITORY_OPTIONS,
    ...customOptions,
    collectionName: customOptions.collectionName || "NO_COLLECTION_SPECIFIED",
  } as RepositoryOptions;
}
