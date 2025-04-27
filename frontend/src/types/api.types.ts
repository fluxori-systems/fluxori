/**
 * Core API Types
 *
 * Common types used across API endpoints
 */

/**
 * User information
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user" | "manager";
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Organization information
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  updatedAt: string;
  userCount?: number;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Registration data
 */
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
}

/**
 * Registration response
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Generic API error
 */
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  stack?: string;
  timestamp?: string;
}
