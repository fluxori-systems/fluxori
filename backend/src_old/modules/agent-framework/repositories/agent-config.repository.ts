import { Injectable, Logger, OnModuleInit } from "@nestjs/common";

import { FirestoreConfigService } from "src/config/firestore.config";

import { FirestoreBaseRepository } from "src/common/repositories";

import { AgentConfig } from "../interfaces/types";

/**
 * Repository for managing agent configurations
 */
@Injectable()
export class AgentConfigRepository
  extends FirestoreBaseRepository<AgentConfig>
  implements OnModuleInit
{
  protected readonly logger = new Logger(AgentConfigRepository.name);

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, "agent_configs");
  }

  /**
   * Initialize the repository when module loads
   */
  onModuleInit(): void {
    this.logger.log("AgentConfigRepository initialized");
  }

  /**
   * Find configurations for a specific organization
   * @param organizationId Organization ID
   * @returns List of agent configurations
   */
  async findByOrganization(organizationId: string): Promise<AgentConfig[]> {
    return this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "isEnabled", operator: "==", value: true },
      ],
    });
  }

  /**
   * Find active configurations by label
   * @param organizationId Organization ID
   * @param label Label to search for
   * @returns List of agent configurations with the given label
   */
  async findByLabel(
    organizationId: string,
    label: string,
  ): Promise<AgentConfig[]> {
    // This is a simplified implementation - in a real implementation, we would use
    // a more sophisticated query that checks array membership
    const configs = await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "isEnabled", operator: "==", value: true },
      ],
    });

    return configs.filter(
      (config) => config.labels && config.labels.includes(label),
    );
  }

  /**
   * Find an agent configuration by name for a specific organization
   * @param organizationId Organization ID
   * @param name Agent name
   * @returns Agent configuration or null if not found
   */
  async findByName(
    organizationId: string,
    name: string,
  ): Promise<AgentConfig | null> {
    const results = await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "name", operator: "==", value: name },
        { field: "isEnabled", operator: "==", value: true },
      ],
    });

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Update the enabled status of an agent configuration
   * @param id Agent configuration ID
   * @param isEnabled New enabled status
   * @returns Updated agent configuration or null if not found
   */
  async setEnabled(
    id: string,
    isEnabled: boolean,
  ): Promise<AgentConfig | null> {
    return this.update(id, { isEnabled });
  }

  /**
   * Update the system prompt for an agent
   * @param id Agent configuration ID
   * @param systemPrompt New system prompt
   * @returns Updated agent configuration or null if not found
   */
  async updateSystemPrompt(
    id: string,
    systemPrompt: string,
  ): Promise<AgentConfig | null> {
    return this.update(id, { systemPrompt });
  }

  /**
   * Update the default model for an agent
   * @param id Agent configuration ID
   * @param defaultModel New default model
   * @returns Updated agent configuration or null if not found
   */
  async updateDefaultModel(
    id: string,
    defaultModel: string,
  ): Promise<AgentConfig | null> {
    return this.update(id, { defaultModel });
  }

  /**
   * Update the parameters for an agent
   * @param id Agent configuration ID
   * @param parameters New parameters
   * @returns Updated agent configuration or null if not found
   */
  async updateParameters(
    id: string,
    parameters: AgentConfig["parameters"],
  ): Promise<AgentConfig | null> {
    return this.update(id, { parameters });
  }
}
