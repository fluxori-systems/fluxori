/**
 * Connector Credentials Repository
 *
 * This repository manages storage, retrieval, and validation of API credentials
 * for various connectors. It uses the FirestoreBaseRepository pattern for
 * consistent data access throughout the application.
 */

import { Injectable, Logger } from '@nestjs/common';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { ConnectionStatus, CredentialType } from '../interfaces/types';
import { ConnectorCredentialEntity } from '../models/connector-credential.schema';

/**
 * Repository for managing connector credentials
 */
@Injectable()
export class ConnectorCredentialsRepository extends FirestoreBaseRepository<ConnectorCredentialEntity> {
  protected readonly logger = new Logger(ConnectorCredentialsRepository.name);

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'connector_credentials', {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 5 * 60 * 1000, // 5 minutes
      requiredFields: [
        'connectorId',
        'organizationId',
        'credentials',
        'isActive',
      ],
    });
  }

  /**
   * Find credentials by connector ID and organization ID
   * @param connectorId ID of the connector
   * @param organizationId ID of the organization
   * @returns Credentials entity or null if not found
   */
  async findByConnectorAndOrganization(
    connectorId: string,
    organizationId: string,
  ): Promise<ConnectorCredentialEntity | null> {
    const results = await this.find({
      advancedFilters: [
        { field: 'connectorId', operator: '==', value: connectorId },
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'isActive', operator: '==', value: true },
      ],
    });

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all credentials for an organization
   * @param organizationId ID of the organization
   * @returns Array of credential entities
   */
  async findByOrganization(
    organizationId: string,
  ): Promise<ConnectorCredentialEntity[]> {
    return this.find({
      advancedFilters: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'isActive', operator: '==', value: true },
      ],
    });
  }

  /**
   * Find all credentials for a connector
   * @param connectorId ID of the connector
   * @returns Array of credential entities
   */
  async findByConnector(
    connectorId: string,
  ): Promise<ConnectorCredentialEntity[]> {
    return this.find({
      advancedFilters: [
        { field: 'connectorId', operator: '==', value: connectorId },
        { field: 'isActive', operator: '==', value: true },
      ],
    });
  }

  /**
   * Update the connection status for a credential entity
   * @param id ID of the credential entity
   * @param connected Whether the connection was successful
   * @param message Status message
   * @param details Additional status details
   * @returns Updated credential entity
   */
  async updateConnectionStatus(
    id: string,
    connected: boolean,
    message?: string,
    details?: any,
  ): Promise<ConnectorCredentialEntity> {
    const lastConnectionStatus: ConnectionStatus = {
      connected,
      message,
      lastChecked: new Date(),
      details,
    };

    return this.update(id, { lastConnectionStatus });
  }

  /**
   * Update OAuth tokens for a credential entity
   * @param id ID of the credential entity
   * @param accessToken New access token
   * @param refreshToken New refresh token (optional)
   * @param tokenExpiresAt Expiration date for the access token
   * @returns Updated credential entity
   */
  async updateTokens(
    id: string,
    accessToken: string,
    refreshToken?: string,
    tokenExpiresAt?: Date,
  ): Promise<ConnectorCredentialEntity> {
    const updates: Partial<ConnectorCredentialEntity> = { accessToken };

    if (refreshToken) {
      updates.refreshToken = refreshToken;
    }

    if (tokenExpiresAt) {
      updates.tokenExpiresAt = tokenExpiresAt;
    }

    return this.update(id, updates);
  }

  /**
   * Find credentials that need token refresh
   * @param bufferMinutes Minutes before expiration to include
   * @returns Array of credential entities needing refresh
   */
  async findCredentialsNeedingRefresh(
    bufferMinutes = 10,
  ): Promise<ConnectorCredentialEntity[]> {
    // Calculate the time for tokens about to expire
    const bufferTime = new Date();
    bufferTime.setMinutes(bufferTime.getMinutes() + bufferMinutes);

    // Find credentials that are OAuth2 type, active, and need refresh
    return this.find({
      advancedFilters: [
        {
          field: 'credentials.type',
          operator: '==',
          value: CredentialType.OAUTH2,
        },
        { field: 'isActive', operator: '==', value: true },
        { field: 'tokenExpiresAt', operator: '<', value: bufferTime },
      ],
    });
  }

  /**
   * Create new credentials
   * @param data Credential data
   * @returns Created credential entity
   */
  async createCredentials(
    data: Omit<ConnectorCredentialEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ConnectorCredentialEntity> {
    // Check if credentials already exist
    const existing = await this.findByConnectorAndOrganization(
      data.connectorId,
      data.organizationId,
    );

    if (existing) {
      // Deactivate existing credentials
      await this.update(existing.id, { isActive: false });
    }

    // Create new credentials
    return this.create(data);
  }

  /**
   * Deactivate credentials
   * @param id ID of the credential entity
   * @returns Updated credential entity
   */
  async deactivateCredentials(id: string): Promise<ConnectorCredentialEntity> {
    return this.update(id, { isActive: false });
  }
}
