/**
 * Common types used across different API endpoints
 */

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Base entity fields that are common across most entities
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Common error response shape
 */
export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, any>;
  status?: number;
}

/**
 * Common success response shape
 */
export interface ApiSuccessResponse<T = any> {
  data: T;
  message?: string;
}

/**
 * Utility type for API endpoints that return paginated data
 */
export type PaginatedEndpoint<T> = (params?: any) => Promise<PaginatedResponse<T>>;

/**
 * Utility type for API endpoints that return a single entity
 */
export type EntityEndpoint<T> = (id: string) => Promise<T>;

/**
 * Utility type for API endpoints that create entities
 */
export type CreateEndpoint<T, C = any> = (data: C) => Promise<T>;

/**
 * Utility type for API endpoints that update entities
 */
export type UpdateEndpoint<T, U = any> = (id: string, data: U) => Promise<T>;

/**
 * Utility type for API endpoints that delete entities
 */
export type DeleteEndpoint = (id: string) => Promise<{ success: boolean }>;

/**
 * Common query parameters for paginated endpoints
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}