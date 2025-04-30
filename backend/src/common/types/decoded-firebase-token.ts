// Placeholder for DecodedFirebaseToken type
// Modernized: Use concrete fields for known claims, and a well-typed claims object for extensibility
export interface DecodedFirebaseToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
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
  claims?: Record<string, string | number | boolean | string[] | number[]>;
}
