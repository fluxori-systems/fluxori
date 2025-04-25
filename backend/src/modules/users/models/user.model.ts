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
export interface User {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  organizationId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
