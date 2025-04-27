import { Injectable, Logger, OnModuleInit } from "@nestjs/common";

import { FirestoreConfigService } from "src/config/firestore.config";

import { FirestoreBaseRepository } from "src/common/repositories";

import { ModelRegistryEntry, ModelComplexity } from "../interfaces/types";

/**
 * Repository for managing AI model registry entries
 */
@Injectable()
export class ModelRegistryRepository
  extends FirestoreBaseRepository<ModelRegistryEntry>
  implements OnModuleInit
{
  protected readonly logger = new Logger(ModelRegistryRepository.name);

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, "model_registry");
  }

  /**
   * Initialize the repository when module loads
   */
  onModuleInit(): void {
    this.logger.log("ModelRegistryRepository initialized");
  }

  /**
   * Find models by provider
   */
  async findByProvider(provider: string): Promise<ModelRegistryEntry[]> {
    return this.find({
      advancedFilters: [
        { field: "provider", operator: "==", value: provider },
        { field: "isEnabled", operator: "==", value: true },
      ],
      queryOptions: {
        orderBy: "order",
        direction: "asc",
      },
    });
  }

  /**
   * Find models by complexity level
   */
  async findByComplexity(
    complexity: ModelComplexity,
  ): Promise<ModelRegistryEntry[]> {
    return this.find({
      advancedFilters: [
        { field: "complexity", operator: "==", value: complexity },
        { field: "isEnabled", operator: "==", value: true },
      ],
      queryOptions: {
        orderBy: "order",
        direction: "asc",
      },
    });
  }

  /**
   * Find models by capability
   */
  async findByCapability(capability: string): Promise<ModelRegistryEntry[]> {
    // This is a simplified implementation - in a real implementation, we would use
    // a more sophisticated query that checks array membership
    const allModels = await this.find({
      advancedFilters: [{ field: "isEnabled", operator: "==", value: true }],
    });

    return allModels.filter((model) => model.capabilities.includes(capability));
  }

  /**
   * Find the best model based on complexity and other requirements
   */
  async findBestModelForTask(params: {
    complexity: ModelComplexity;
    preferredProvider?: string;
    requiredCapabilities?: string[];
    preferredModel?: string;
  }): Promise<ModelRegistryEntry | null> {
    const {
      complexity,
      preferredProvider,
      requiredCapabilities,
      preferredModel,
    } = params;

    // If preferred model is specified and exists, use it
    if (preferredModel) {
      const allModels = await this.find({
        advancedFilters: [{ field: "isEnabled", operator: "==", value: true }],
      });

      const model = allModels.find(
        (m) => m.model === preferredModel && m.isEnabled,
      );
      if (model) return model;
    }

    // Get all enabled models of the requested complexity
    let models = await this.findByComplexity(complexity);

    // Filter by provider if specified
    if (preferredProvider) {
      const providerModels = models.filter(
        (m) => m.provider === preferredProvider,
      );
      if (providerModels.length > 0) {
        models = providerModels;
      }
    }

    // Filter by required capabilities
    if (requiredCapabilities && requiredCapabilities.length > 0) {
      models = models.filter((model) =>
        requiredCapabilities.every((capability) =>
          model.capabilities.includes(capability),
        ),
      );
    }

    // Return the first matching model (models are already ordered by the 'order' field)
    return models.length > 0 ? models[0] : null;
  }

  /**
   * Set a model's enabled status
   */
  async setEnabled(
    id: string,
    isEnabled: boolean,
  ): Promise<ModelRegistryEntry | null> {
    return this.update(id, { isEnabled });
  }

  /**
   * Update a model's order (for display sorting)
   */
  async updateOrder(
    id: string,
    order: number,
  ): Promise<ModelRegistryEntry | null> {
    return this.update(id, { order });
  }
}
