import { Injectable, Logger } from '@nestjs/common';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { MarketplaceCredential } from '../models/marketplace-credentials.schema';
import { MarketplaceCredentials } from '../interfaces/types';

/**
 * Repository for managing marketplace credentials in Firestore
 */
@Injectable()
export class MarketplaceCredentialsRepository extends FirestoreBaseRepository<MarketplaceCredential> {
  protected readonly logger = new Logger(MarketplaceCredentialsRepository.name);
  protected readonly collectionName = 'marketplace_credentials';

  constructor(protected readonly firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 10 * 60 * 1000, // 10 minutes
      requiredFields: ['marketplaceId', 'organizationId', 'credentials', 'isActive'] as Array<keyof MarketplaceCredential>,
    });
  }

  /**
   * Find credentials for a specific marketplace and organization
   * @param marketplaceId The marketplace ID
   * @param organizationId The organization ID
   * @returns The credential if found
   */
  async findOne(marketplaceId: string, organizationId: string): Promise<MarketplaceCredential | null> {
    try {
      const querySnapshot = await this.collection
        .where('marketplaceId', '==', marketplaceId)
        .where('organizationId', '==', organizationId)
        .where('isActive', '==', true)
        .where('isDeleted', '==', false)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return this.converter.fromFirestore(doc);
    } catch (error) {
      this.logger.error(`Error finding credential: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find all credentials for an organization
   * @param organizationId The organization ID
   * @returns Array of credentials
   */
  async findByOrganization(organizationId: string): Promise<MarketplaceCredential[]> {
    try {
      const querySnapshot = await this.collection
        .where('organizationId', '==', organizationId)
        .where('isActive', '==', true)
        .where('isDeleted', '==', false)
        .get();

      return querySnapshot.docs.map(doc => this.converter.fromFirestore(doc));
    } catch (error) {
      this.logger.error(`Error finding credentials by organization: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create or update credentials for a marketplace and organization
   * @param marketplaceId The marketplace ID
   * @param organizationId The organization ID
   * @param credentials The credentials data
   * @returns The created or updated credential
   */
  async upsert(
    marketplaceId: string,
    organizationId: string,
    credentials: MarketplaceCredentials,
  ): Promise<MarketplaceCredential> {
    try {
      // Check if credentials already exist
      const existing = await this.findOne(marketplaceId, organizationId);
      
      // Clean up credentials object
      const cleanCredentials = { ...credentials };
      if ('organizationId' in cleanCredentials) {
        // @ts-ignore: We know this property exists because we just checked
        delete cleanCredentials.organizationId; // Don't store organizationId twice
      }
      
      // Prepare the update data
      const credentialData: Partial<MarketplaceCredential> = {
        marketplaceId,
        organizationId,
        credentials: cleanCredentials,
        isActive: true,
        // Store refresh/access tokens separately
        refreshToken: credentials.refreshToken,
        accessToken: credentials.accessToken,
        updatedAt: new Date(),
      };
      
      if (existing) {
        // Update existing credentials
        const updated = await this.update(existing.id, credentialData);
        if (!updated) {
          throw new Error(`Failed to update credential for marketplace ${marketplaceId}`);
        }
        return updated;
      } else {
        // Create new credentials
        credentialData.createdAt = new Date();
        return this.create(credentialData as MarketplaceCredential);
      }
    } catch (error) {
      this.logger.error(`Error upserting credential: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update connection status for a marketplace credential
   * @param id The credential ID
   * @param connected Whether the connection was successful
   * @param message Optional message about the connection
   * @returns The updated credential
   */
  async updateConnectionStatus(
    id: string,
    connected: boolean,
    message?: string,
  ): Promise<MarketplaceCredential | null> {
    try {
      return this.update(id, {
        lastConnectionStatus: {
          connected,
          message,
          timestamp: new Date(),
        },
        updatedAt: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error updating connection status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update tokens for a marketplace credential
   * @param id The credential ID
   * @param accessToken The new access token
   * @param refreshToken Optional new refresh token
   * @param expiresIn Optional token expiration time in seconds
   * @returns The updated credential
   */
  async updateTokens(
    id: string,
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number,
  ): Promise<MarketplaceCredential | null> {
    try {
      const updateData: Partial<MarketplaceCredential> = { 
        accessToken,
        updatedAt: new Date(),
      };
      
      if (refreshToken) {
        updateData.refreshToken = refreshToken;
      }
      
      if (expiresIn) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + expiresIn * 1000);
        updateData.tokenExpiresAt = expiresAt;
      }
      
      return this.update(id, updateData);
    } catch (error) {
      this.logger.error(`Error updating tokens: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Deactivate credentials
   * @param id The credential ID
   * @returns The updated credential
   */
  async deactivate(id: string): Promise<MarketplaceCredential | null> {
    try {
      return this.update(id, { 
        isActive: false,
        updatedAt: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error deactivating credential: ${error.message}`, error.stack);
      throw error;
    }
  }
}