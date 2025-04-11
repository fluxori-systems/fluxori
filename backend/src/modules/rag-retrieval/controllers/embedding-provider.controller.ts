import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  ForbiddenException,
} from "@nestjs/common";

import { EmbeddingProvider } from "../models/embedding-provider.schema";
import {
  EmbeddingService,
  CreateEmbeddingProviderDto,
  UpdateEmbeddingProviderDto,
  EmbeddingResponse,
} from "../services/embedding.service";

/**
 * Controller for Embedding Provider endpoints
 */
@Controller("api/embedding-providers")
export class EmbeddingProviderController {
  private readonly logger = new Logger(EmbeddingProviderController.name);

  constructor(private readonly embeddingService: EmbeddingService) {}

  /**
   * Create a new embedding provider
   * @param createEmbeddingProviderDto Provider creation data
   * @returns Created provider
   */
  @Post()
  async create(
    @Body() createEmbeddingProviderDto: CreateEmbeddingProviderDto,
  ): Promise<EmbeddingProvider> {
    return this.embeddingService.createProvider(createEmbeddingProviderDto);
  }

  /**
   * Get provider by ID
   * @param id Provider ID
   * @returns Provider data
   */
  @Get(":id")
  async findById(@Param("id") id: string): Promise<EmbeddingProvider> {
    return this.embeddingService.findById(id);
  }

  /**
   * Get providers by organization
   * @param organizationId Organization ID
   * @returns Array of providers
   */
  @Get("organization/:organizationId")
  async findByOrganization(
    @Param("organizationId") organizationId: string,
  ): Promise<EmbeddingProvider[]> {
    return this.embeddingService.findByOrganization(organizationId);
  }

  /**
   * Get default provider for an organization
   * @param organizationId Organization ID
   * @returns Default provider
   */
  @Get("organization/:organizationId/default")
  async findDefaultProvider(
    @Param("organizationId") organizationId: string,
  ): Promise<EmbeddingProvider> {
    const provider =
      await this.embeddingService.findDefaultProvider(organizationId);

    if (!provider) {
      throw new ForbiddenException(
        `No default embedding provider found for organization ${organizationId}`,
      );
    }

    return provider;
  }

  /**
   * Update a provider
   * @param id Provider ID
   * @param updateEmbeddingProviderDto Update data
   * @returns Updated provider
   */
  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updateEmbeddingProviderDto: UpdateEmbeddingProviderDto,
  ): Promise<EmbeddingProvider> {
    return this.embeddingService.updateProvider(id, updateEmbeddingProviderDto);
  }

  /**
   * Set a provider as the default
   * @param id Provider ID
   * @returns Updated provider
   */
  @Put(":id/set-default")
  async setAsDefault(@Param("id") id: string): Promise<EmbeddingProvider> {
    return this.embeddingService.setAsDefault(id);
  }

  /**
   * Enable a provider
   * @param id Provider ID
   * @returns Updated provider
   */
  @Put(":id/enable")
  async enable(@Param("id") id: string): Promise<EmbeddingProvider> {
    return this.embeddingService.setEnabled(id, true);
  }

  /**
   * Disable a provider
   * @param id Provider ID
   * @returns Updated provider
   */
  @Put(":id/disable")
  async disable(@Param("id") id: string): Promise<EmbeddingProvider> {
    return this.embeddingService.setEnabled(id, false);
  }

  /**
   * Delete a provider
   * @param id Provider ID
   * @returns Success indicator
   */
  @Delete(":id")
  async delete(@Param("id") id: string): Promise<{ success: boolean }> {
    await this.embeddingService.deleteProvider(id);
    return { success: true };
  }

  /**
   * Generate embeddings for text
   * @param texts Texts in request body
   * @param organizationId Organization ID in request body
   * @param providerId Optional provider ID in request body
   * @returns Embedding response
   */
  @Post("generate-embeddings")
  async generateEmbeddings(
    @Body("texts") texts: string[],
    @Body("organizationId") organizationId: string,
    @Body("providerId") providerId?: string,
  ): Promise<EmbeddingResponse> {
    if (!texts || !texts.length) {
      throw new ForbiddenException("Text array is required");
    }

    if (!organizationId) {
      throw new ForbiddenException("Organization ID is required");
    }

    return this.embeddingService.generateEmbeddings(
      texts,
      organizationId,
      providerId,
    );
  }
}
