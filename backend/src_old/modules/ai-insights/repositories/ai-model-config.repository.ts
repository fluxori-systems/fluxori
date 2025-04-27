import { Injectable } from "@nestjs/common";

import { FirestoreBaseRepository } from "../../../common/repositories";
import { FirestoreConfigService } from "../../../config/firestore.config";
import { AIModelConfig } from "../models/ai-model-config.schema";

/**
 * Repository for AI Model Configuration
 */
@Injectable()
export class AIModelConfigRepository extends FirestoreBaseRepository<AIModelConfig> {
  // Collection name in Firestore
  protected readonly collectionName = "ai_model_configs";

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, "ai_model_configs", {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 10 * 60 * 1000, // 10 minutes
      requiredFields: ["organizationId", "modelProvider", "modelName"],
    });
  }

  /**
   * Find configurations by organization ID
   * @param organizationId Organization ID
   * @returns Array of AI model configurations
   */
  async findByOrganization(organizationId: string): Promise<AIModelConfig[]> {
    return this.find({
      filter: { organizationId } as Partial<AIModelConfig>,
    });
  }

  /**
   * Find default configuration for an organization
   * @param organizationId Organization ID
   * @returns Default configuration or null if none found
   */
  async findDefaultConfig(
    organizationId: string,
  ): Promise<AIModelConfig | null> {
    const configs = await this.find({
      filter: {
        organizationId,
        isDefault: true,
        isEnabled: true,
      } as Partial<AIModelConfig>,
    });

    return configs.length > 0 ? configs[0] : null;
  }

  /**
   * Find configurations by model provider
   * @param provider Provider name
   * @returns Array of AI model configurations
   */
  async findByProvider(provider: string): Promise<AIModelConfig[]> {
    return this.find({
      filter: { modelProvider: provider } as Partial<AIModelConfig>,
    });
  }

  /**
   * Find configurations by model name
   * @param modelName Model name to find
   * @returns Array of AI model configurations
   */
  async findByModelName(modelName: string): Promise<AIModelConfig[]> {
    return this.find({
      filter: { modelName } as Partial<AIModelConfig>,
    });
  }

  /**
   * Set a configuration as the default for an organization
   * @param id Configuration ID to set as default
   * @param organizationId Organization ID
   * @returns Success indicator
   */
  async setAsDefault(id: string, organizationId: string): Promise<boolean> {
    return this.runTransaction(async (context) => {
      const transaction = context;
      // First, find all configs for the organization
      const configs = await this.findByOrganization(organizationId);

      // Clear the default flag on all configs
      for (const config of configs) {
        if (config.isDefault && config.id !== id) {
          const docRef = this.getDocRef(config.id);
          transaction.update(docRef, {
            isDefault: false,
            updatedAt: new Date(),
          });
        }
      }

      // Set the new default
      const targetDocRef = this.getDocRef(id);
      transaction.update(targetDocRef, {
        isDefault: true,
        isEnabled: true, // Ensure it's enabled
        updatedAt: new Date(),
      });

      return true;
    });
  }

  /**
   * Toggle the enabled state of a configuration
   * @param id Configuration ID
   * @param enabled New enabled state
   * @returns Updated configuration
   */
  async setEnabled(
    id: string,
    enabled: boolean,
  ): Promise<AIModelConfig | null> {
    return this.update(id, { isEnabled: enabled });
  }
}
