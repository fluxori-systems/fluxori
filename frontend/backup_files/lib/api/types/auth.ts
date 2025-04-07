import { BaseEntity } from './common';

/**
 * User data
 */
export interface User extends BaseEntity {
  email: string;
  name: string;
  role: string;
}

/**
 * Login request
 */
export interface LoginRequest {
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
 * Registration request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * Registration response
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: User;
}

/**
 * Organization data
 */
export interface Organization extends BaseEntity {
  name: string;
  plan: string;
  status: 'active' | 'inactive' | 'suspended';
}

/**
 * Credit allotment data
 */
export interface CreditAllotment extends BaseEntity {
  organizationId: string;
  monthlyLimit: number;
  usedCredits: number;
  remainingCredits: number;
  resetDate: string;
  currentUsage?: number; // For backward compatibility
  lastUpdated?: string; // For backward compatibility
}

/**
 * JWT payload structure
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  org: string;
  iat: number;
  exp: number;
}