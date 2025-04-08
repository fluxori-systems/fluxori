/**
 * Repository Module Public API
 * 
 * This file defines the public interface of the Repository module, exporting only what should be
 * accessible to other modules. This ensures proper encapsulation and prevents direct access to
 * internal components.
 */

// Export main repository implementations
export { 
  FirestoreBaseRepository,
  TenantAwareRepository as TenantRepository
} from './firestore-base.repository';

// Export core repository types and utilities
export {
  Repository,
  RepositoryOptions,
  QueryFilter,
  QueryOptions,
  SortDirection,
  EntityReference,
  EntityWithId,
  FirestoreQueryOptions,
  FirestoreAdvancedFilter,
  CreateDocumentOptions,
  FindByIdOptions,
  FindOptions,
  UpdateDocumentOptions,
  DeleteDocumentOptions,
  BatchDeleteOptions
} from './base/repository-types';

export {
  RepositoryValidationError,
  validateEntity
} from './base/repository-validation';

export {
  RepositoryTransaction,
  TransactionOperation
} from './base/repository-transactions';

export {
  RepositoryCache,
  CacheOptions
} from './base/repository-cache';

export {
  RepositoryStats
} from './base/repository-stats';

// Export repository utilities
export {
  RepositoryConverter,
  EntityConverter
} from './base/repository-converter';

// Import types for utility functions
import { 
  QueryFilter,
  QueryOptions,
  SortDirection,
  RepositoryOptions
} from './base/repository-types';

// Define and export repository utilities
/**
 * Creates a query filter for a simple equality condition
 */
export function equalTo<T>(field: keyof T, value: any): QueryFilter<T> {
  return {
    field: field as string,
    operator: '==',
    value
  };
}

/**
 * Creates a query filter for a greater than condition
 */
export function greaterThan<T>(field: keyof T, value: any): QueryFilter<T> {
  return {
    field: field as string,
    operator: '>',
    value
  };
}

/**
 * Creates a query filter for a less than condition
 */
export function lessThan<T>(field: keyof T, value: any): QueryFilter<T> {
  return {
    field: field as string,
    operator: '<',
    value
  };
}

/**
 * Creates a query options object with standard pagination
 */
export function paginatedQuery<T>(
  page: number = 1, 
  pageSize: number = 20,
  orderBy: keyof T | string = 'createdAt',
  direction: SortDirection = 'desc'
): QueryOptions<T> {
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: orderBy as string,
    direction
  };
}

/**
 * Creates a standard set of filters for tenant-aware repositories
 */
export function organizationFilters<T>(
  organizationId: string,
  additionalFilters: QueryFilter<T>[] = []
): QueryFilter<T>[] {
  return [
    {
      field: 'organizationId',
      operator: '==',
      value: organizationId
    },
    ...additionalFilters
  ];
}

/**
 * Creates a standard set of filters for soft-deleted entities
 */
export function deletedStateFilters<T>(
  includeDeleted: boolean = false,
  additionalFilters: QueryFilter<T>[] = []
): QueryFilter<T>[] {
  if (!includeDeleted) {
    return [
      {
        field: 'deleted',
        operator: '==',
        value: false
      },
      ...additionalFilters
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
  validateOnWrite: true
};

/**
 * Create repository options with custom settings
 */
export function createRepositoryOptions(
  customOptions: Partial<RepositoryOptions> = {}
): RepositoryOptions {
  return {
    ...STANDARD_REPOSITORY_OPTIONS,
    ...customOptions
  } as RepositoryOptions;
}