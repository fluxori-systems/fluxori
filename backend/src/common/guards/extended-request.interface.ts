import { Request } from 'express';

/**
 * Service-to-service authentication info attached by ServiceAuthInterceptor
 */
export interface ServiceInfo {
  serviceName: string;
  authenticated: boolean;
}

/**
 * Firebase-authenticated user info attached by FirebaseAuthGuard
 */
// Modernized: Use concrete fields and a stricter claims type
export interface AuthenticatedUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  roles?: string[];
  claims: Record<string, string | number | boolean | string[] | number[]>;
  organizationId?: string;
}

/**
 * Extended Express Request with optional serviceInfo and user fields
 */
export interface ExtendedRequest extends Request {
  serviceInfo?: ServiceInfo;
  user?: AuthenticatedUser;
}
