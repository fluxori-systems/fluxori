import { FirestoreEntity, Timestamp } from '../../../types/google-cloud.types';

/**
 * User role enum
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
}

/**
 * User entity schema for Firestore
 */
export interface User extends FirestoreEntity {
  /** User's full name */
  name: string;

  /** User's email address */
  email: string;

  /** User's role in the system */
  role: UserRole;

  /** ID of the organization the user belongs to */
  organizationId?: string;

  /** Whether the user account is active */
  isActive: boolean;

  /** Timestamp of the user's last login */
  lastLogin?: Date | Timestamp;

  /** Profile picture URL */
  profilePictureUrl?: string;

  /** User preferences */
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    language?: string;
  };
}
