import { Injectable } from "@nestjs/common";

import {
  AgentResponse,
  ModelAdapter,
  ModelRegistryEntry,
  TokenEstimator,
} from "src/modules/agent-framework";

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

import { AgentFrameworkDependencies } from "../interfaces/dependencies";

/**
 * Adapter for integrating with Agent Framework
 */
@Injectable()
export class AgentFrameworkAdapter implements AgentFrameworkDependencies {
  constructor(private readonly tokenEstimator: TokenEstimator) {}

  /**
   * Calculate token cost for a specific model
   * @param model Model registry entry
   * @param inputTokens Input token count
   * @param outputTokens Output token count
   * @returns Cost in credits
   */
  calculateTokenCost(
    model: ModelRegistryEntry,
    inputTokens: number,
    outputTokens: number,
  ): number {
    const inputCost = (inputTokens * model.costPer1kInputTokens) / 1000;
    const outputCost = (outputTokens * model.costPer1kOutputTokens) / 1000;

    // Convert from dollars to credits (assuming 100 credits = $1)
    const creditCost = Math.ceil((inputCost + outputCost) * 100);

    // Ensure minimum cost of 1 credit
    return Math.max(1, creditCost);
  }

  /**
   * Count tokens in chat messages
   * @param model Model registry entry
   * @param messages Chat messages
   * @returns Token counts
   */
  async countTokensInMessages(
    model: ModelRegistryEntry,
    messages: ChatMessage[],
  ): Promise<{ inputTokens: number; outputTokens: number }> {
    // Use token estimator to count tokens
    const inputTokens =
      this.tokenEstimator.estimateTokensForConversation(messages);

    // For output tokens, we use a heuristic based on input tokens and model context window
    const maxOutputTokens = model.maxOutputTokens;
    const estimatedOutputTokens = Math.min(
      maxOutputTokens,
      Math.ceil(inputTokens * 0.7), // Rough heuristic: output is ~70% of input
    );

    return {
      inputTokens,
      outputTokens: estimatedOutputTokens,
    };
  }

  /**
   * Get model adapter for a model
   * @param model Model registry entry
   * @returns Model adapter (unused in this context)
   */
  getModelAdapter(model: ModelRegistryEntry): ModelAdapter {
    // This is a stub - in actual implementation, this would
    // delegate to the ModelAdapterFactory service in the Agent Framework
    // Since we're not performing actual model calls here, we can return null
    return null as unknown as ModelAdapter;
  }

  /**
   * Extract token usage information from agent response
   * @param response Agent response
   * @returns Token usage information
   */
  extractTokenUsage(response: AgentResponse): {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    modelId: string;
    modelProvider: string;
  } {
    return {
      inputTokens: response.tokenUsage.input,
      outputTokens: response.tokenUsage.output,
      totalTokens: response.tokenUsage.total,
      cost: response.cost,
      modelId: response.modelInfo.model,
      modelProvider: response.modelInfo.provider,
    };
  }
}
