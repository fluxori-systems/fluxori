/**
 * User roles in the system
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
}

/**
 * User model for Firestore
 */
import { FirestoreEntityWithMetadata } from '../../../common/repositories/base/repository-types';

export interface User extends FirestoreEntityWithMetadata {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  organizationId?: string;
  isActive: boolean;
  lastLogin?: Date;
}
