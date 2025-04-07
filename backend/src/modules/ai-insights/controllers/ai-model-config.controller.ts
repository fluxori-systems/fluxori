import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Logger,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import { 
  AIModelConfigService, 
  CreateAIModelConfigDto, 
  UpdateAIModelConfigDto 
} from '../services/ai-model-config.service';
import { AIModelConfig } from '../models/ai-model-config.schema';

/**
 * Controller for AI Model Configuration endpoints
 */
@Controller('api/ai-model-configs')
export class AIModelConfigController {
  private readonly logger = new Logger(AIModelConfigController.name);
  
  constructor(private readonly modelConfigService: AIModelConfigService) {}
  
  /**
   * Create a new AI model configuration
   * @param createDto Configuration creation data
   * @returns Created configuration
   */
  @Post()
  async create(@Body() createDto: CreateAIModelConfigDto): Promise<AIModelConfig> {
    return this.modelConfigService.create(createDto);
  }
  
  /**
   * Get configuration by ID
   * @param id Configuration ID
   * @returns Configuration data
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<AIModelConfig> {
    return this.modelConfigService.findById(id);
  }
  
  /**
   * Get configurations by organization
   * @param organizationId Organization ID
   * @returns Array of configurations
   */
  @Get('organization/:organizationId')
  async findByOrganization(
    @Param('organizationId') organizationId: string
  ): Promise<AIModelConfig[]> {
    return this.modelConfigService.findByOrganization(organizationId);
  }
  
  /**
   * Get default configuration for an organization
   * @param organizationId Organization ID
   * @returns Default configuration
   */
  @Get('organization/:organizationId/default')
  async findDefaultConfig(
    @Param('organizationId') organizationId: string
  ): Promise<AIModelConfig> {
    const config = await this.modelConfigService.findDefaultConfig(organizationId);
    
    if (!config) {
      throw new NotFoundException(`No default AI model config found for organization ${organizationId}`);
    }
    
    return config;
  }
  
  /**
   * Update a configuration
   * @param id Configuration ID
   * @param updateDto Update data
   * @returns Updated configuration
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAIModelConfigDto
  ): Promise<AIModelConfig> {
    return this.modelConfigService.update(id, updateDto);
  }
  
  /**
   * Set a configuration as the default
   * @param id Configuration ID
   * @returns Updated configuration
   */
  @Put(':id/set-default')
  async setAsDefault(@Param('id') id: string): Promise<AIModelConfig> {
    return this.modelConfigService.setAsDefault(id);
  }
  
  /**
   * Enable a configuration
   * @param id Configuration ID
   * @returns Updated configuration
   */
  @Put(':id/enable')
  async enable(@Param('id') id: string): Promise<AIModelConfig> {
    return this.modelConfigService.setEnabled(id, true);
  }
  
  /**
   * Disable a configuration
   * @param id Configuration ID
   * @returns Updated configuration
   */
  @Put(':id/disable')
  async disable(@Param('id') id: string): Promise<AIModelConfig> {
    return this.modelConfigService.setEnabled(id, false);
  }
  
  /**
   * Delete a configuration
   * @param id Configuration ID
   * @returns Success indicator
   */
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.modelConfigService.delete(id);
    return { success: true };
  }
  
  /**
   * Validate API credentials for a model provider
   * @param provider Provider name in body
   * @param apiKey API key in body
   * @returns Validation result
   */
  @Post('validate-credentials')
  async validateCredentials(
    @Body('provider') provider: string,
    @Body('apiKey') apiKey: string
  ): Promise<{ valid: boolean; message?: string }> {
    if (!provider || !apiKey) {
      throw new ForbiddenException('Provider and API key are required');
    }
    
    return this.modelConfigService.validateCredentials(provider, apiKey);
  }
}