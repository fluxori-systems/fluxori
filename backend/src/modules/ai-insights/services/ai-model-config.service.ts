import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { AIModelConfig } from '../models/ai-model-config.schema';
import { AIModelConfigRepository } from '../repositories/ai-model-config.repository';

/**
 * DTO for creating a new AI model configuration
 */
export interface CreateAIModelConfigDto {
  organizationId: string;
  modelProvider: string;
  modelName: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  isDefault?: boolean;
  isEnabled?: boolean;
  metadata?: Record<string, any>;
}

/**
 * DTO for updating an AI model configuration
 */
export interface UpdateAIModelConfigDto {
  modelProvider?: string;
  modelName?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  isDefault?: boolean;
  isEnabled?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Service for AI Model Configuration operations
 */
@Injectable()
export class AIModelConfigService {
  private readonly logger = new Logger(AIModelConfigService.name);

  constructor(
    private readonly modelConfigRepository: AIModelConfigRepository,
  ) {}

  /**
   * Create a new AI model configuration
   * @param createDto Configuration data
   * @returns Created configuration
   */
  async create(createDto: CreateAIModelConfigDto): Promise<AIModelConfig> {
    this.logger.log(
      `Creating new AI model config for ${createDto.modelProvider}/${createDto.modelName}`,
    );

    // Set defaults if not provided
    const data: CreateAIModelConfigDto = {
      ...createDto,
      isDefault: createDto.isDefault || false,
      isEnabled: createDto.isEnabled !== undefined ? createDto.isEnabled : true,
    };

    // If this is set as default, clear other defaults
    if (data.isDefault) {
      await this.clearDefaultConfigs(data.organizationId);
    }

    return this.modelConfigRepository.create(data);
  }

  /**
   * Find configuration by ID
   * @param id Configuration ID
   * @returns Configuration or throws if not found
   */
  async findById(id: string): Promise<AIModelConfig> {
    const config = await this.modelConfigRepository.findById(id);

    if (!config) {
      this.logger.warn(`AI model config with ID ${id} not found`);
      throw new NotFoundException(`AI model config with ID ${id} not found`);
    }

    return config;
  }

  /**
   * Find configurations by organization ID
   * @param organizationId Organization ID
   * @returns Array of configurations
   */
  async findByOrganization(organizationId: string): Promise<AIModelConfig[]> {
    return this.modelConfigRepository.findByOrganization(organizationId);
  }

  /**
   * Find default configuration for an organization
   * @param organizationId Organization ID
   * @returns Default configuration or null if not found
   */
  async findDefaultConfig(
    organizationId: string,
  ): Promise<AIModelConfig | null> {
    return this.modelConfigRepository.findDefaultConfig(organizationId);
  }

  /**
   * Update a configuration
   * @param id Configuration ID
   * @param updateDto Update data
   * @returns Updated configuration
   */
  async update(
    id: string,
    updateDto: UpdateAIModelConfigDto,
  ): Promise<AIModelConfig> {
    this.logger.log(`Updating AI model config with ID: ${id}`);

    // If setting as default, clear other defaults
    if (updateDto.isDefault) {
      // Get the config to find its organization
      const config = await this.findById(id);
      await this.clearDefaultConfigs(config.organizationId);
    }

    const updated = await this.modelConfigRepository.update(id, updateDto);

    if (!updated) {
      throw new NotFoundException(`AI model config with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * Set a configuration as the default for an organization
   * @param id Configuration ID
   * @returns Updated configuration
   */
  async setAsDefault(id: string): Promise<AIModelConfig> {
    this.logger.log(`Setting AI model config ${id} as default`);

    // Get the config to find its organization
    const config = await this.findById(id);

    const success = await this.modelConfigRepository.setAsDefault(
      id,
      config.organizationId,
    );

    if (!success) {
      throw new Error(`Failed to set AI model config ${id} as default`);
    }

    // Return the updated config
    return this.findById(id);
  }

  /**
   * Enable or disable a configuration
   * @param id Configuration ID
   * @param enabled Enabled state
   * @returns Updated configuration
   */
  async setEnabled(id: string, enabled: boolean): Promise<AIModelConfig> {
    this.logger.log(
      `${enabled ? 'Enabling' : 'Disabling'} AI model config ${id}`,
    );

    const updated = await this.modelConfigRepository.setEnabled(id, enabled);

    if (!updated) {
      throw new NotFoundException(`AI model config with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * Delete a configuration
   * @param id Configuration ID
   * @returns Success indicator
   */
  async delete(id: string): Promise<boolean> {
    this.logger.log(`Deleting AI model config with ID: ${id}`);

    try {
      // The delete method returns void, not a result to check
      await this.modelConfigRepository.delete(id);
      return true;
    } catch (error) {
      if (error.message?.includes('not found')) {
        throw new NotFoundException(`AI model config with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Clear default flag on all configs for an organization
   * @param organizationId Organization ID
   * @returns Success indicator
   */
  private async clearDefaultConfigs(organizationId: string): Promise<boolean> {
    const configs =
      await this.modelConfigRepository.findByOrganization(organizationId);

    const defaultConfigs = configs.filter((config) => config.isDefault);

    for (const config of defaultConfigs) {
      await this.modelConfigRepository.update(config.id, { isDefault: false });
    }

    return true;
  }

  /**
   * Validate API credentials for a model provider
   * @param modelProvider Provider name
   * @param apiKey API key to validate
   * @returns Validation result
   */
  async validateCredentials(
    modelProvider: string,
    apiKey: string,
  ): Promise<{ valid: boolean; message?: string }> {
    this.logger.log(`Validating credentials for ${modelProvider}`);

    // Implementation would depend on the specific AI provider
    // This is a placeholder for the actual implementation

    // Example validation logic
    try {
      if (modelProvider === 'openai') {
        // TODO: Implement actual OpenAI validation
        return { valid: true };
      } else if (modelProvider === 'vertex-ai') {
        // TODO: Implement actual Vertex AI validation
        return { valid: true };
      } else {
        return {
          valid: false,
          message: `Unsupported model provider: ${modelProvider}`,
        };
      }
    } catch (error) {
      return {
        valid: false,
        message: `Validation failed: ${error.message}`,
      };
    }
  }
}
