'use client';

import { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/user/user.types';

interface PermissionGuardProps {
  permission?: string;
  role?: UserRole | UserRole[];
  feature?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Component that conditionally renders its children based on user permissions
 * Use this to protect UI elements that should only be visible to certain users
 */
export default function PermissionGuard({
  permission,
  role,
  feature,
  fallback = null,
  children
}: PermissionGuardProps) {
  const { hasPermission, hasRole, hasFeatureAccess, isAuthenticated } = useAuth();
  
  // Must be authenticated to see anything
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }
  
  // Check if user meets all specified criteria
  const hasRequiredPermission = !permission || hasPermission(permission);
  const hasRequiredRole = !role || hasRole(role);
  const hasRequiredFeature = !feature || hasFeatureAccess(feature);
  
  // Only render children if all conditions are met
  if (hasRequiredPermission && hasRequiredRole && hasRequiredFeature) {
    return <>{children}</>;
  }
  
  // Otherwise render fallback
  return <>{fallback}</>;
}