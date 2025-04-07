import { Injectable, Logger } from '@nestjs/common';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { EmbeddingProvider } from '../models/embedding-provider.schema';
import { EmbeddingProviderType } from '../interfaces/types';

/**
 * Repository for Embedding Provider entities
 */
@Injectable()
export class EmbeddingProviderRepository extends FirestoreBaseRepository<EmbeddingProvider> {
  // Collection name in Firestore
  protected readonly collectionName = 'embedding_providers';
  
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 10 * 60 * 1000, // 10 minutes
      requiredFields: ['organizationId', 'name', 'type', 'modelName'],
    });
  }
  
  /**
   * Find providers by organization ID
   * @param organizationId Organization ID
   * @returns Array of embedding providers
   */
  async findByOrganization(organizationId: string): Promise<EmbeddingProvider[]> {
    return this.findAll({ organizationId });
  }
  
  /**
   * Find default provider for an organization
   * @param organizationId Organization ID
   * @returns Default provider or null if none found
   */
  async findDefaultProvider(organizationId: string): Promise<EmbeddingProvider | null> {
    const providers = await this.findAll({ 
      organizationId,
      isDefault: true,
      isEnabled: true
    });
    
    return providers.length > 0 ? providers[0] : null;
  }
  
  /**
   * Find providers by type
   * @param type Provider type
   * @returns Array of providers
   */
  async findByType(type: EmbeddingProviderType): Promise<EmbeddingProvider[]> {
    return this.findAll({ type });
  }
  
  /**
   * Set a provider as the default for an organization
   * @param id Provider ID to set as default
   * @param organizationId Organization ID
   * @returns Success indicator
   */
  async setAsDefault(id: string, organizationId: string): Promise<boolean> {
    return this.withTransaction(async (transaction) => {
      // First, find all providers for the organization
      const providers = await this.findByOrganization(organizationId);
      
      // Clear the default flag on all providers
      for (const provider of providers) {
        if (provider.isDefault && provider.id !== id) {
          const docRef = this.firestoreConfigService.getDocument(this.collectionName, provider.id);
          transaction.update(docRef, { 
            isDefault: false,
            updatedAt: new Date()
          });
        }
      }
      
      // Set the new default
      const targetDocRef = this.firestoreConfigService.getDocument(this.collectionName, id);
      transaction.update(targetDocRef, {
        isDefault: true,
        isEnabled: true, // Ensure it's enabled
        updatedAt: new Date()
      });
      
      return true;
    });
  }
  
  /**
   * Toggle the enabled state of a provider
   * @param id Provider ID
   * @param enabled New enabled state
   * @returns Updated provider
   */
  async setEnabled(id: string, enabled: boolean): Promise<EmbeddingProvider | null> {
    return this.update(id, { isEnabled: enabled });
  }
  
  /**
   * Increment usage count for a provider
   * @param id Provider ID
   * @returns Updated usage count
   */
  async incrementUsageCount(id: string): Promise<number> {
    const provider = await this.findById(id);
    
    if (!provider) {
      throw new Error(`Embedding provider with ID ${id} not found`);
    }
    
    const newCount = (provider.usageCount || 0) + 1;
    
    await this.update(id, { 
      usageCount: newCount,
      lastUsedAt: new Date()
    });
    
    return newCount;
  }
}