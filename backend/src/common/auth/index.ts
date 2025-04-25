/**
 * Common Auth Utilities
 *
 * This module provides a simplified interface for accessing auth components
 * throughout the application. It re-exports components from the auth module
 * to create a more convenient API for common auth operations.
 */

// Re-export essential auth components
export {
  FirebaseAuthGuard,
  GetUser,
  Public,
  AuthService,
  FirebaseAuthService,
} from 'src/modules/auth';

// Re-export DTOs and interfaces
export { LoginDto, RegisterDto } from 'src/modules/auth';

export { JwtPayload } from 'src/modules/auth';

/**
 * Firebase decoded token interface for improved type safety
 */
export interface DecodedFirebaseToken {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  organizationId?: string;
  role?: string;
  [key: string]: any;
}

/**
 * Auth utilities for common auth operations
 */
export const AuthUtils = {
  /**
   * Checks if a user has admin role
   * @param user The user object from @GetUser() decorator
   * @returns True if user has admin role
   */
  isAdmin: (user: DecodedFirebaseToken): boolean => {
    return user?.role === 'admin';
  },

  /**
   * Checks if a user belongs to an organization
   * @param user The user object from @GetUser() decorator
   * @param organizationId The organization ID to check
   * @returns True if user belongs to the organization
   */
  isInOrganization: (
    user: DecodedFirebaseToken,
    organizationId: string,
  ): boolean => {
    return user?.organizationId === organizationId;
  },

  /**
   * Checks if a user is the owner of a resource
   * @param user The user object from @GetUser() decorator
   * @param ownerId The owner ID of the resource
   * @returns True if user is the owner
   */
  isOwner: (user: DecodedFirebaseToken, ownerId: string): boolean => {
    return user?.uid === ownerId;
  },
};
