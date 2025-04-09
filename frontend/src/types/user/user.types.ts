/**
 * User entity interfaces
 */
import { TenantEntity } from '../core/entity.types';

/**
 * User role enum
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  GUEST = 'guest',
}

/**
 * User status enum
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

/**
 * User interface
 */
export interface User extends TenantEntity {
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  
  // Auth related
  lastLogin?: Date | string;
  isEmailVerified?: boolean;
  
  // Profile
  profilePictureUrl?: string;
  title?: string;
  department?: string;
  
  // Preferences
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
    dateFormat?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
    dashboardLayout?: any;
  };
  
  // Access control
  permissions?: string[];
  accessibleFeatures?: string[];
  
  // System fields
  deviceTokens?: string[];
  metadata?: Record<string, any>;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Registration data
 */
export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
  inviteToken?: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password update
 */
export interface PasswordUpdate {
  currentPassword: string;
  newPassword: string;
}

/**
 * User profile update
 */
export interface UserProfileUpdate {
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  department?: string;
  profilePictureUrl?: string;
  preferences?: Partial<User['preferences']>;
}