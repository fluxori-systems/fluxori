/**
 * Interface for JWT payload
 */
export interface JwtPayload {
  /** User ID */
  sub: string;

  /** User email */
  email: string;

  /** User role */
  role: string;

  /** Organization ID */
  organizationId?: string;
}
