import { Injectable, Logger } from '@nestjs/common';

import { VertexAIModelAdapter } from '../adapters/vertex-ai.adapter';
import { ModelAdapter } from '../interfaces/model-adapter.interface';
import { ModelRegistryEntry } from '../interfaces/types';

/**
 * Factory for creating and managing model adapters
 */
@Injectable()
export class ModelAdapterFactory {
  private readonly logger = new Logger(ModelAdapterFactory.name);
  private readonly adapters: Map<string, ModelAdapter> = new Map();

  constructor(private readonly vertexAdapter: VertexAIModelAdapter) {
    // Register the built-in adapters
    this.registerAdapter('vertex-ai', vertexAdapter);
  }

  /**
   * Register a model adapter
   * @param providerName Provider name
   * @param adapter Model adapter implementation
   */
  registerAdapter(providerName: string, adapter: ModelAdapter): void {
    this.adapters.set(providerName, adapter);
    this.logger.log(`Registered model adapter for provider: ${providerName}`);
  }

  /**
   * Get an adapter for a specific model
   * @param model Model registry entry
   * @returns The appropriate adapter for the model
   * @throws Error if no adapter is found
   */
  getAdapter(model: ModelRegistryEntry): ModelAdapter {
    // Try to find adapter by provider
    const adapter = this.adapters.get(model.provider);

    if (!adapter) {
      throw new Error(`No adapter found for provider: ${model.provider}`);
    }

    // Verify that the adapter supports this model
    if (!adapter.supportsModel(model.model)) {
      throw new Error(
        `Adapter for provider ${model.provider} does not support model: ${model.model}`,
      );
    }

    return adapter;
  }

  /**
   * Initialize all registered adapters
   * @param config Configuration for adapters
   */
  async initializeAdapters(config: Record<string, any>): Promise<void> {
    const initPromises: Promise<void>[] = [];

    // Initialize the Vertex AI adapter
    if (config['vertex-ai']) {
      initPromises.push(
        this.vertexAdapter.initialize(config['vertex-ai']).catch((error) => {
          this.logger.error(
            `Failed to initialize Vertex AI adapter: ${error.message}`,
            error.stack,
          );
          // Don't throw - we want to continue initializing other adapters
        }),
      );
    }

    // Initialize any other registered adapters
    for (const [provider, adapter] of this.adapters.entries()) {
      // Skip Vertex AI as we already handled it
      if (provider === 'vertex-ai') continue;

      // Only initialize if config is provided
      if (config[provider]) {
        initPromises.push(
          adapter.initialize(config[provider]).catch((error) => {
            this.logger.error(
              `Failed to initialize ${provider} adapter: ${error.message}`,
              error.stack,
            );
            // Don't throw - we want to continue initializing other adapters
          }),
        );
      }
    }

    // Wait for all adapters to initialize
    await Promise.all(initPromises);
    this.logger.log('All model adapters initialized');
  }

  /**
   * Get all registered adapter providers
   * @returns List of provider names
   */
  getRegisteredProviders(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if a provider is registered
   * @param providerName Provider name
   * @returns Whether the provider is registered
   */
  hasProvider(providerName: string): boolean {
    return this.adapters.has(providerName);
  }

  /**
   * Get an adapter by provider name
   * @param providerName Provider name
   * @returns The adapter for the provider
   * @throws Error if no adapter is found
   */
  getAdapterByProvider(providerName: string): ModelAdapter {
    const adapter = this.adapters.get(providerName);

    if (!adapter) {
      throw new Error(`No adapter found for provider: ${providerName}`);
    }

    return adapter;
  }
}
