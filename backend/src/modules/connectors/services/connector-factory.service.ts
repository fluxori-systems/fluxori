/**
 * Connector Factory Service
 *
 * This service is responsible for creating, caching, and managing connector instances.
 * It serves as the primary entry point for obtaining connector instances throughout the application.
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

import {
  IConnector,
  IMarketplaceConnector,
} from '../interfaces/connector.interface';
import {
  ConnectorCredentials,
  MarketplaceProduct,
  MarketplaceOrder,
  OrderAcknowledgment,
} from '../interfaces/types';
import { ConnectorCredentialsRepository } from '../repositories/connector-credentials.repository';

/**
 * Service for creating and managing connector instances
 */
@Injectable()
export class ConnectorFactoryService implements OnModuleDestroy {
  private readonly logger = new Logger(ConnectorFactoryService.name);
  private readonly connectors = new Map<string, IConnector>();
  private readonly connectorClasses = new Map<
    string,
    new (...args: any[]) => IConnector
  >();

  constructor(
    private readonly credentialsRepository: ConnectorCredentialsRepository,
  ) {}

  /**
   * Register a connector class with the factory
   * @param id Unique identifier for the connector
   * @param connectorClass Constructor for the connector
   */
  registerConnector<T extends IConnector>(
    id: string,
    connectorClass: new (...args: any[]) => T,
  ): void {
    this.logger.log(`Registering connector: ${id}`);
    this.connectorClasses.set(id, connectorClass);
  }

  /**
   * Get a fully initialized connector instance
   * @param connectorId ID of the connector
   * @param organizationId Organization ID for credentials
   * @returns Initialized connector instance
   */
  async getConnector<T extends IConnector>(
    connectorId: string,
    organizationId: string,
  ): Promise<T> {
    const cacheKey = `${connectorId}:${organizationId}`;

    // Check for existing initialized instance
    if (this.connectors.has(cacheKey)) {
      return this.connectors.get(cacheKey) as T;
    }

    // Get connector class
    const ConnectorClass = this.connectorClasses.get(connectorId);
    if (!ConnectorClass) {
      throw new Error(`No connector registered with ID: ${connectorId}`);
    }

    // Get credentials from repository
    const credentials =
      await this.credentialsRepository.findByConnectorAndOrganization(
        connectorId,
        organizationId,
      );

    if (!credentials) {
      throw new Error(
        `No credentials found for connector ${connectorId} and organization ${organizationId}`,
      );
    }

    // Create instance
    const connector = new ConnectorClass() as T;

    // Initialize connector
    await connector.initialize(credentials.credentials);

    // Cache the initialized connector
    this.connectors.set(cacheKey, connector);

    return connector;
  }

  /**
   * Get a marketplace connector
   * @param connectorId ID of the marketplace connector
   * @param organizationId Organization ID for credentials
   * @returns Initialized marketplace connector
   */
  async getMarketplaceConnector(
    connectorId: string,
    organizationId: string,
  ): Promise<
    IMarketplaceConnector<
      MarketplaceProduct,
      MarketplaceOrder,
      OrderAcknowledgment
    >
  > {
    return this.getConnector(connectorId, organizationId);
  }

  /**
   * Create a new connector instance with provided credentials
   * This doesn't store the instance in the cache
   * @param connectorId ID of the connector
   * @param credentials Credentials for initialization
   * @returns Initialized connector instance
   */
  async createConnector<T extends IConnector>(
    connectorId: string,
    credentials: ConnectorCredentials,
  ): Promise<T> {
    // Get connector class
    const ConnectorClass = this.connectorClasses.get(connectorId);
    if (!ConnectorClass) {
      throw new Error(`No connector registered with ID: ${connectorId}`);
    }

    // Create instance
    const connector = new ConnectorClass() as T;

    // Initialize connector
    await connector.initialize(credentials);

    return connector;
  }

  /**
   * Test a connection using provided credentials
   * @param connectorId ID of the connector
   * @param credentials Credentials to test
   * @returns Connection status
   */
  async testConnection(connectorId: string, credentials: ConnectorCredentials) {
    try {
      const connector = await this.createConnector(connectorId, credentials);
      const status = await connector.testConnection();

      // Clean up the test connector
      await connector.close();

      return status;
    } catch (error) {
      this.logger.error(
        `Error testing connection for ${connectorId}: ${error.message}`,
        error.stack,
      );

      return {
        connected: false,
        message: `Connection test failed: ${error.message}`,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Get all available connector types
   * @returns List of available connector IDs
   */
  getAvailableConnectors(): string[] {
    return Array.from(this.connectorClasses.keys());
  }

  /**
   * Check if a connector type exists
   * @param connectorId ID to check
   * @returns Whether the connector type exists
   */
  hasConnector(connectorId: string): boolean {
    return this.connectorClasses.has(connectorId);
  }

  /**
   * Get health status for all active connectors
   */
  async getConnectorsHealth() {
    const health: Record<string, any> = {};

    for (const [key, connector] of this.connectors.entries()) {
      try {
        const status = await connector.getHealthStatus();
        health[key] = status;
      } catch (error) {
        health[key] = {
          connected: false,
          message: `Error getting health: ${error.message}`,
          lastChecked: new Date(),
        };
      }
    }

    return health;
  }

  /**
   * Clean up all connectors on module destruction
   */
  async onModuleDestroy() {
    this.logger.log('Cleaning up connector instances');

    for (const [key, connector] of this.connectors.entries()) {
      try {
        await connector.close();
        this.logger.log(`Closed connector: ${key}`);
      } catch (error) {
        this.logger.error(`Error closing connector ${key}: ${error.message}`);
      }
    }

    this.connectors.clear();
  }
}
