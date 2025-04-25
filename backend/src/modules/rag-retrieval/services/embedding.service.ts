import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EmbeddingProviderType } from '../interfaces/types';
import { EmbeddingProvider } from '../models/embedding-provider.schema';
import { EmbeddingProviderRepository } from '../repositories/embedding-provider.repository';

/**
 * DTO for creating a new embedding provider
 */
export interface CreateEmbeddingProviderDto {
  organizationId: string;
  name: string;
  description?: string;
  type: EmbeddingProviderType;
  apiKey: string;
  apiEndpoint?: string;
  modelName: string;
  isDefault?: boolean;
  isEnabled?: boolean;
  dimensions: number;
  maxTokens: number;
  batchSize: number;
  metadata?: Record<string, any>;
  costPerToken?: number;
}

/**
 * DTO for updating an embedding provider
 */
export interface UpdateEmbeddingProviderDto {
  name?: string;
  description?: string;
  apiKey?: string;
  apiEndpoint?: string;
  modelName?: string;
  isDefault?: boolean;
  isEnabled?: boolean;
  dimensions?: number;
  maxTokens?: number;
  batchSize?: number;
  metadata?: Record<string, any>;
  costPerToken?: number;
}

/**
 * Embedding generation response
 */
export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  tokenCount: number;
  cost: number;
  provider: EmbeddingProviderType;
}

/**
 * Service for embedding operations
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    private readonly embeddingProviderRepository: EmbeddingProviderRepository,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a new embedding provider
   * @param createDto Provider creation data
   * @returns Created provider
   */
  async createProvider(
    createDto: CreateEmbeddingProviderDto,
  ): Promise<EmbeddingProvider> {
    this.logger.log(`Creating new embedding provider: ${createDto.name}`);

    // Set defaults if not provided
    const data: any = {
      ...createDto,
      isDefault: createDto.isDefault || false,
      isEnabled: createDto.isEnabled !== undefined ? createDto.isEnabled : true,
      costPerToken:
        createDto.costPerToken || this.getDefaultCostPerToken(createDto.type),
      usageCount: 0,
    };

    // If this is set as default, clear other defaults
    if (data.isDefault) {
      await this.clearDefaultProviders(data.organizationId);
    }

    return this.embeddingProviderRepository.create(data as any);
  }

  /**
   * Find provider by ID
   * @param id Provider ID
   * @returns Provider or throws if not found
   */
  async findById(id: string): Promise<EmbeddingProvider> {
    const provider = await this.embeddingProviderRepository.findById(id);

    if (!provider) {
      this.logger.warn(`Embedding provider with ID ${id} not found`);
      throw new NotFoundException(`Embedding provider with ID ${id} not found`);
    }

    return provider;
  }

  /**
   * Find providers by organization ID
   * @param organizationId Organization ID
   * @returns Array of providers
   */
  async findByOrganization(
    organizationId: string,
  ): Promise<EmbeddingProvider[]> {
    return this.embeddingProviderRepository.findByOrganization(organizationId);
  }

  /**
   * Find default provider for an organization
   * @param organizationId Organization ID
   * @returns Default provider or null if not found
   */
  async findDefaultProvider(
    organizationId: string,
  ): Promise<EmbeddingProvider | null> {
    return this.embeddingProviderRepository.findDefaultProvider(organizationId);
  }

  /**
   * Update a provider
   * @param id Provider ID
   * @param updateDto Update data
   * @returns Updated provider
   */
  async updateProvider(
    id: string,
    updateDto: UpdateEmbeddingProviderDto,
  ): Promise<EmbeddingProvider> {
    this.logger.log(`Updating embedding provider with ID: ${id}`);

    // If setting as default, clear other defaults
    if (updateDto.isDefault) {
      // Get the provider to find its organization
      const provider = await this.findById(id);
      await this.clearDefaultProviders(provider.organizationId);
    }

    const updated = await this.embeddingProviderRepository.update(
      id,
      updateDto,
    );

    if (!updated) {
      throw new NotFoundException(`Embedding provider with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * Set a provider as the default for an organization
   * @param id Provider ID
   * @returns Updated provider
   */
  async setAsDefault(id: string): Promise<EmbeddingProvider> {
    this.logger.log(`Setting embedding provider ${id} as default`);

    // Get the provider to find its organization
    const provider = await this.findById(id);

    const success = await this.embeddingProviderRepository.setAsDefault(
      id,
      provider.organizationId,
    );

    if (!success) {
      throw new Error(`Failed to set embedding provider ${id} as default`);
    }

    // Return the updated provider
    return this.findById(id);
  }

  /**
   * Enable or disable a provider
   * @param id Provider ID
   * @param enabled Enabled state
   * @returns Updated provider
   */
  async setEnabled(id: string, enabled: boolean): Promise<EmbeddingProvider> {
    this.logger.log(
      `${enabled ? 'Enabling' : 'Disabling'} embedding provider ${id}`,
    );

    const updated = await this.embeddingProviderRepository.setEnabled(
      id,
      enabled,
    );

    if (!updated) {
      throw new NotFoundException(`Embedding provider with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * Delete a provider
   * @param id Provider ID
   * @returns Success indicator
   */
  async deleteProvider(id: string): Promise<boolean> {
    this.logger.log(`Deleting embedding provider with ID: ${id}`);

    try {
      // The delete method returns void, not a result to check
      await this.embeddingProviderRepository.delete(id);
      return true;
    } catch (error) {
      if (error.message?.includes('not found')) {
        throw new NotFoundException(
          `Embedding provider with ID ${id} not found`,
        );
      }
      throw error;
    }
  }

  /**
   * Generate embeddings for text
   * @param texts Array of text strings
   * @param organizationId Organization ID
   * @param providerId Optional specific provider ID
   * @returns Embedding response
   */
  async generateEmbeddings(
    texts: string[],
    organizationId: string,
    providerId?: string,
  ): Promise<EmbeddingResponse> {
    // Get the provider
    let provider: EmbeddingProvider;

    if (providerId) {
      provider = await this.findById(providerId);
      if (provider.organizationId !== organizationId) {
        throw new Error(
          'Provider does not belong to the specified organization',
        );
      }
    } else {
      const defaultProvider = await this.findDefaultProvider(organizationId);
      if (!defaultProvider) {
        throw new Error(
          `No default embedding provider found for organization ${organizationId}`,
        );
      }
      provider = defaultProvider;
    }

    if (!provider.isEnabled) {
      throw new Error(`Embedding provider ${provider.id} is not enabled`);
    }

    // Update usage count
    await this.embeddingProviderRepository.incrementUsageCount(provider.id);

    // Generate embeddings based on provider type
    return this.callEmbeddingProvider(provider, texts);
  }

  /**
   * Call the appropriate embedding provider API
   * @param provider Embedding provider
   * @param texts Texts to embed
   * @returns Embedding response
   */
  private async callEmbeddingProvider(
    provider: EmbeddingProvider,
    texts: string[],
  ): Promise<EmbeddingResponse> {
    // Implement mock behavior for demonstration
    this.logger.log(
      `Generating embeddings using ${provider.type}/${provider.modelName}`,
    );

    // Calculate estimated token count (4 chars = ~1 token)
    const totalChars = texts.reduce((sum, text) => sum + text.length, 0);
    const estimatedTokens = Math.ceil(totalChars / 4);

    // Calculate cost
    const cost = provider.costPerToken * estimatedTokens;

    // Generate random embeddings of appropriate dimension for demonstration
    const embeddings = texts.map(() =>
      Array.from({ length: provider.dimensions }, () => Math.random() * 2 - 1),
    );

    // In a real implementation, this would call the appropriate API
    // This implementation is a placeholder

    return {
      embeddings,
      model: provider.modelName,
      tokenCount: estimatedTokens,
      cost,
      provider: provider.type,
    };
  }

  /**
   * Clear default flag on all providers for an organization
   * @param organizationId Organization ID
   * @returns Success indicator
   */
  private async clearDefaultProviders(
    organizationId: string,
  ): Promise<boolean> {
    const providers =
      await this.embeddingProviderRepository.findByOrganization(organizationId);

    const defaultProviders = providers.filter((provider) => provider.isDefault);

    for (const provider of defaultProviders) {
      await this.embeddingProviderRepository.update(provider.id, {
        isDefault: false,
      });
    }

    return true;
  }

  /**
   * Get default cost per token based on provider type
   * @param providerType Provider type
   * @returns Default cost per token
   */
  private getDefaultCostPerToken(providerType: EmbeddingProviderType): number {
    switch (providerType) {
      case EmbeddingProviderType.OPENAI:
        return 0.0001;
      case EmbeddingProviderType.VERTEX_AI:
        return 0.0002;
      case EmbeddingProviderType.AZURE:
        return 0.0001;
      case EmbeddingProviderType.COHERE:
        return 0.00015;
      case EmbeddingProviderType.HUGGINGFACE:
        return 0.00005;
      case EmbeddingProviderType.CUSTOM:
        return 0.0001;
      default:
        return 0.0001;
    }
  }
}
