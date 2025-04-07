import { Injectable, Logger } from '@nestjs/common';
import { IMarketplaceAdapter } from '../interfaces/marketplace-adapter.interface';
import { MarketplaceCredentials } from '../interfaces/types';
import { MarketplaceCredentialsRepository } from '../repositories/marketplace-credentials.repository';
import { ConnectionStatus } from '../models/marketplace-credentials.schema';

/**
 * Factory service for managing marketplace adapters
 */
@Injectable()
export class MarketplaceAdapterFactory {
  private readonly logger = new Logger(MarketplaceAdapterFactory.name);
  private readonly adapters = new Map<string, IMarketplaceAdapter>();
  
  constructor(
    private readonly credentialsRepository: MarketplaceCredentialsRepository,
  ) {}
  
  /**
   * Register a marketplace adapter
   * @param adapter The adapter to register
   */
  registerAdapter(adapter: IMarketplaceAdapter): void {
    this.logger.log(`Registering adapter for marketplace: ${adapter.marketplaceName}`);
    this.adapters.set(adapter.marketplaceId, adapter);
  }
  
  /**
   * Get an adapter for a marketplace
   * @param marketplaceId The marketplace ID
   * @returns The marketplace adapter
   * @throws Error if adapter not found
   */
  getAdapter(marketplaceId: string): IMarketplaceAdapter {
    const adapter = this.adapters.get(marketplaceId);
    
    if (!adapter) {
      throw new Error(`Adapter not found for marketplace: ${marketplaceId}`);
    }
    
    return adapter;
  }
  
  /**
   * Get all registered marketplace adapters
   * @returns Array of all adapters
   */
  getAllAdapters(): IMarketplaceAdapter[] {
    return Array.from(this.adapters.values());
  }
  
  /**
   * Get an initialized adapter for a specific marketplace and organization
   * @param marketplaceId The marketplace ID
   * @param organizationId The organization ID
   * @returns The initialized marketplace adapter
   * @throws Error if adapter not found or initialization fails
   */
  async getInitializedAdapter(marketplaceId: string, organizationId: string): Promise<IMarketplaceAdapter> {
    try {
      const adapter = this.getAdapter(marketplaceId);
      
      // Find credentials for this marketplace and organization
      const storedCredentials = await this.credentialsRepository.findOne(marketplaceId, organizationId);
      
      if (!storedCredentials) {
        throw new Error(`No credentials found for marketplace '${marketplaceId}' and organization '${organizationId}'`);
      }
      
      // Build credentials object by combining stored credential details
      const credentials: MarketplaceCredentials = {
        ...storedCredentials.credentials,
        organizationId, // Always include organizationId
        accessToken: storedCredentials.accessToken,
        refreshToken: storedCredentials.refreshToken,
      };
      
      // Initialize adapter with credentials
      await adapter.initialize(credentials);
      
      return adapter;
    } catch (error) {
      this.logger.error(
        `Failed to get initialized adapter for marketplace '${marketplaceId}' and organization '${organizationId}': ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
  
  /**
   * Test the connection to a marketplace
   * @param marketplaceId The marketplace ID
   * @param organizationId The organization ID
   * @param credentials Optional credentials to test (if not provided, will use stored credentials)
   * @returns Connection status object
   */
  async testConnection(
    marketplaceId: string,
    organizationId: string,
    credentials?: MarketplaceCredentials,
  ): Promise<ConnectionStatus> {
    try {
      const adapter = this.getAdapter(marketplaceId);
      
      if (credentials) {
        // Initialize with provided credentials
        await adapter.initialize({
          ...credentials,
          organizationId,
        });
      } else {
        // Initialize with stored credentials
        const storedCredentials = await this.credentialsRepository.findOne(marketplaceId, organizationId);
        
        if (!storedCredentials) {
          throw new Error(`No credentials found for marketplace '${marketplaceId}' and organization '${organizationId}'`);
        }
        
        await adapter.initialize({
          ...storedCredentials.credentials,
          organizationId,
          accessToken: storedCredentials.accessToken,
          refreshToken: storedCredentials.refreshToken,
        });
      }
      
      // Test the connection
      const connectionStatus = await adapter.testConnection();
      
      // If we have stored credentials, update the connection status
      if (!credentials) {
        const storedCredentials = await this.credentialsRepository.findOne(marketplaceId, organizationId);
        
        if (storedCredentials) {
          await this.credentialsRepository.updateConnectionStatus(
            storedCredentials.id,
            connectionStatus.connected,
            connectionStatus.message,
          );
        }
      }
      
      return connectionStatus;
    } catch (error) {
      this.logger.error(
        `Connection test failed for marketplace '${marketplaceId}' and organization '${organizationId}': ${error.message}`,
        error.stack,
      );
      
      return {
        connected: false,
        message: `Connection test failed: ${error.message}`,
      };
    }
  }
}