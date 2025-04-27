/**
 * Dependencies interfaces for Credit System module
 *
 * This file defines the interfaces for dependencies required by the Credit System module
 * from other modules. This approach ensures proper dependency management and loose coupling.
 */

import {
  AgentResponse,
  ModelAdapter,
  ModelRegistryEntry,
} from "../../agent-framework";

// Define the ChatMessage interface inline since it's not exported by the agent-framework
interface ChatMessage {
  role: string;
  content: string;
  name?: string;
  functionCall?: {
    name: string;
    arguments: Record<string, any>;
  };
}
import { FeatureFlagService } from "../../feature-flags";

/**
 * Agent Framework dependencies required by the Credit System
 */
export interface AgentFrameworkDependencies {
  /**
   * Calculate token cost for a specific model
   */
  calculateTokenCost(
    model: ModelRegistryEntry,
    inputTokens: number,
    outputTokens: number,
  ): number;

  /**
   * Count tokens in a chat messages array
   */
  countTokensInMessages(
    model: ModelRegistryEntry,
    messages: ChatMessage[],
  ): Promise<{ inputTokens: number; outputTokens: number }>;

  /**
   * Get a model adapter for a specific model registry entry
   */
  getModelAdapter(model: ModelRegistryEntry): ModelAdapter;

  /**
   * Get token usage from agent response
   */
  extractTokenUsage(response: AgentResponse): {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    modelId: string;
    modelProvider: string;
  };
}

/**
 * Feature Flags dependencies required by the Credit System
 */
export interface FeatureFlagDependencies {
  /**
   * Check if a feature flag is enabled for the given context
   */
  isFeatureEnabled(
    flagKey: string,
    context: {
      organizationId?: string;
      userId?: string;
      environment?: string;
    },
  ): Promise<boolean>;

  /**
   * Subscribe to changes in feature flag status
   */
  subscribeToFlagChanges(
    flagKeys: string[],
    callback: (flags: Record<string, boolean>) => void,
  ): () => void;
}

/**
 * Auth System dependencies required by the Credit System
 */
export interface AuthDependencies {
  /**
   * Get organization ID for a user
   */
  getUserOrganization(userId: string): Promise<string | null>;

  /**
   * Check if a user has admin permissions
   */
  isUserAdmin(userId: string, organizationId: string): Promise<boolean>;
}
