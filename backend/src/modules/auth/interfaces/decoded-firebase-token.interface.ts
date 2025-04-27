/**
 * Interface for a decoded Firebase token (stubbed for compatibility)
 * Extend as needed for your project.
 */
export interface DecodedFirebaseToken {
  id: string;
  role: string;
  organizationId: string;
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  iss?: string;
  aud?: string;
  auth_time?: number;
  user_id?: string;
  sub?: string;
  iat?: number;
  exp?: number;
  firebase?: {
    identities?: Record<string, string[]>;
    sign_in_provider?: string;
  };
  [key: string]: unknown;
}
