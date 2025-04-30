"use client";

import { useState, useEffect, ReactNode } from "react";

import { useRouter } from "next/navigation";

import { Stack, Center, Loader, Text, ThemeIcon } from "@mantine/core";

import { IconAlertTriangle, IconLock } from "@tabler/icons-react";

import { useAuth } from "../../lib/firebase/useAuth";

interface RouteGuardProps {
  children: ReactNode;
  requiredPermissions?: string[];
  organizationRequired?: boolean;
}

/**
 * Route Guard Component
 * Protects routes based on authentication, permissions, and organization membership
 */
export default function RouteGuard({
  children,
  requiredPermissions = [],
  organizationRequired = false,
}: RouteGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, hasPermission } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Authentication check
    if (isLoading) return; // Still loading auth state

    if (!isAuthenticated) {
      // Not authenticated - redirect to login
      router.push(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }

    // Organization membership check
    if (organizationRequired && !user?.organizationId) {
      // No organization - redirect to organization creation
      router.push(
        `/create-organization?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }

    // Permissions check
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((permission) =>
        hasPermission(permission),
      );

      if (!hasAllPermissions) {
        // Lacks permissions - redirect to unauthorized page
        router.push("/unauthorized");
        return;
      }
    }

    // User is authorized to view the route
    setAuthorized(true);
    setCheckingAuth(false);
  }, [
    isLoading,
    isAuthenticated,
    user,
    requiredPermissions,
    organizationRequired,
    router,
    hasPermission,
  ]);

  // Loading state
  if (isLoading || checkingAuth) {
    return (
      <Center style={{ height: "50vh" }}>
        <Loader size="xl" />
      </Center>
    );
  }

  // Authorized - render children
  if (authorized) {
    return <>{children}</>;
  }

  // Fallback - will typically be redirected before reaching this
  return (
    <Center style={{ height: "50vh" }}>
      <Stack ta="center">
        <ThemeIcon size="xl" radius="xl" c="red">
          <IconLock size={24} />
        </ThemeIcon>
        <Text>Unauthorized access</Text>
      </Stack>
    </Center>
  );
}
