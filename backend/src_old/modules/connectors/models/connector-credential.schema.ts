/**
 * Connector Credential Schema
 *
 * This file defines the schema for API credentials in the connector module.
 * The schema is used to store credentials securely in Firestore and includes
 * fields for connection status, access tokens, and credential validity.
 */

import { FirestoreEntity } from "../../../types/google-cloud.types";
import { ConnectorCredentials, ConnectionStatus } from "../interfaces/types";

/**
 * Connector credential entity for storage in Firestore
 */
export interface ConnectorCredentialEntity extends FirestoreEntity {
  /** Unique identifier for the connector (e.g., 'takealot', 'amazon-sp-api', 'shopify') */
  connectorId: string;

  /** Human-readable name of the connector (e.g., 'Takealot', 'Amazon SP-API', 'Shopify') */
  connectorName: string;

  /** Organization ID that owns these credentials */
  organizationId: string;

  /** Whether the credentials are active */
  isActive: boolean;

  /** Last time these credentials were successfully used */
  lastUsedAt?: Date;

  /** Status of the last connection attempt */
  lastConnectionStatus?: ConnectionStatus;

  /** Credential data specific to this connector */
  credentials: ConnectorCredentials;

  /** Access token for OAuth credentials */
  accessToken?: string;

  /** Refresh token for OAuth credentials */
  refreshToken?: string;

  /** Expiration date for the access token */
  tokenExpiresAt?: Date;

  /** API-specific settings and configuration */
  settings?: Record<string, any>;

  /** Notes about these credentials */
  notes?: string;
}

/**
 * Base DTO for creating connector credentials
 */
export class CreateConnectorCredentialDto {
  /** Connector ID */
  connectorId: string;

  /** Connector name */
  connectorName: string;

  /** Organization ID */
  organizationId: string;

  /** Credential data */
  credentials: ConnectorCredentials;

  /** Optional access token */
  accessToken?: string;

  /** Optional refresh token */
  refreshToken?: string;

  /** Optional token expiration date */
  tokenExpiresAt?: Date;

  /** Optional API-specific settings */
  settings?: Record<string, any>;

  /** Optional notes */
  notes?: string;
}

/**
 * DTO for updating connector credentials
 */
export class UpdateConnectorCredentialDto {
  /** Optional credential data */
  credentials?: Partial<ConnectorCredentials>;

  /** Optional access token */
  accessToken?: string;

  /** Optional refresh token */
  refreshToken?: string;

  /** Optional token expiration date */
  tokenExpiresAt?: Date;

  /** Optional API-specific settings */
  settings?: Record<string, any>;

  /** Optional status update */
  isActive?: boolean;

  /** Optional notes */
  notes?: string;
}
