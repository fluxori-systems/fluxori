"use client";

/**
 * Enhanced auth hook that provides authentication state and role-based permissions
 */
import { useCallback } from "react";

import { useFirebase } from "../contexts/firebase-context";
import { User, UserRole } from "../types/user/user.types";

interface UseAuthResult {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isEmailVerified: boolean;
  hasOrganization: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    organizationName?: string,
  ) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasFeatureAccess: (feature: string) => boolean;
  refreshToken: () => Promise<string | null>;
}

export function useAuth(): UseAuthResult {
  const {
    user,
    firebaseUser,
    isLoading,
    error,
    login,
    logout,
    register,
    resetPassword,
    refreshAuthToken,
  } = useFirebase();

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;

      // Admins have all permissions
      if (user.role === UserRole.ADMIN) return true;

      // Check explicit permissions
      return !!user.permissions?.includes(permission);
    },
    [user],
  );

  /**
   * Check if user has a specific role or one of multiple roles
   */
  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      if (!user) return false;

      if (Array.isArray(role)) {
        return role.includes(user.role);
      }

      return user.role === role;
    },
    [user],
  );

  /**
   * Check if user has access to a specific feature
   */
  const hasFeatureAccess = useCallback(
    (feature: string): boolean => {
      if (!user) return false;

      // Admins have access to all features
      if (user.role === UserRole.ADMIN) return true;

      // Check if feature is in accessible features
      return !!user.accessibleFeatures?.includes(feature);
    },
    [user],
  );

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !!firebaseUser,
    isAdmin: user?.role === UserRole.ADMIN,
    isManager: user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN,
    isEmailVerified: !!firebaseUser?.emailVerified,
    hasOrganization: !!user?.organizationId,
    error,
    login,
    logout,
    register,
    resetPassword,
    hasPermission,
    hasRole,
    hasFeatureAccess,
    refreshToken: refreshAuthToken,
  };
}
