import { Injectable, Logger } from '@nestjs/common';

import {
  AgentService,
  ModelRegistryRepository,
  ModelRegistryEntry,
  AgentResponse,
  TokenEstimator,
} from 'src/modules/agent-framework';

// Define the ChatMessage interface inline since it's not exported by the agent-framework
interface ChatMessage {
  role: string;
  content: string;
  name?: string;
  functionCall?: {
    name: string;
    arguments: CreditArguments; // TODO: Refine fields as discovered
  };
}

import { CreditSystemService } from './credit-system.service';
import { CreditArguments } from '../interfaces/types';
import { CreditUsageType } from '../interfaces/types';

/**
 * Service for tracking token usage and integrating with the Agent Framework
 */
@Injectable()
export class TokenTrackingService {
  private readonly logger = new Logger(TokenTrackingService.name);

  constructor(
    private readonly creditSystemService: CreditSystemService,
    private readonly modelRegistryRepository: ModelRegistryRepository,
    private readonly tokenEstimator: TokenEstimator,
  ) {}

  /**
   * Checks if an organization has sufficient credits for a model request
   * @param organizationId Organization ID
   * @param userId User ID
   * @param modelId Model ID
   * @param messages Chat messages
   * @returns Whether operation can proceed and reservation ID if applicable
   */
  async checkCreditsForModelRequest(
    organizationId: string,
    userId: string,
    modelId: string,
    messages: ChatMessage[],
  ): Promise<{
    canProceed: boolean;
    reservationId?: string;
    reason?: string;
  }> {
    try {
      // Get the model
      const allModels = await this.modelRegistryRepository.findAll();
      const model = allModels.find((m) => m.model === modelId);

      if (!model) {
        return {
          canProceed: false,
          reason: `Model not found: ${modelId}`,
        };
      }

      // Estimate tokens for messages
      const inputTokens =
        this.tokenEstimator.estimateTokensForConversation(messages);

      // Estimate output tokens (usually a fraction of input)
      const outputTokens = Math.min(
        model.maxOutputTokens,
        Math.ceil(inputTokens * 0.7), // Rough estimate
      );

      // Generate a unique operation ID
      const operationId = `agt_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      // Check credits
      const creditCheck = await this.creditSystemService.checkCredits({
        organizationId,
        userId,
        expectedInputTokens: inputTokens,
        expectedOutputTokens: outputTokens,
        modelId,
        usageType: CreditUsageType.MODEL_CALL,
        operationId,
      });

      if (!creditCheck.hasCredits) {
        return {
          canProceed: false,
          reason: creditCheck.reason || 'Insufficient credits',
        };
      }

      return {
        canProceed: true,
        reservationId: creditCheck.reservationId,
      };
    } catch (error) {
      this.logger.error(
        `Error checking credits for model request: ${error.message}`,
        error.stack,
      );

      return {
        canProceed: false,
        reason: `Error checking credits: ${error.message}`,
      };
    }
  }

  /**
   * Records token usage from an agent response
   * @param organizationId Organization ID
   * @param userId User ID
   * @param response Agent response
   * @param reservationId Optional reservation ID
   * @param metadata Optional metadata
   * @returns Whether recording was successful
   */
  async recordAgentResponseUsage(
    organizationId: string,
    userId: string,
    response: AgentResponse,
    reservationId?: string,
    metadata?: Record<string, any>,
  ): Promise<boolean> {
    try {
      // Extract token usage from response
      const {
        tokenUsage,
        modelInfo,
        processingTime,
        metadata: responseMetadata,
      } = response;

      // Record usage
      await this.creditSystemService.recordUsage({
        organizationId,
        userId,
        usageType: CreditUsageType.MODEL_CALL,
        modelId: modelInfo.model,
        modelProvider: modelInfo.provider,
        inputTokens: tokenUsage.input,
        outputTokens: tokenUsage.output,
        processingTime,
        reservationId,
        success: true,
        metadata: {
          ...metadata,
          // Optionally, you can extract and merge only allowed fields from responseMetadata here if needed
        },
      });

      return true;
    } catch (error) {
      this.logger.error(
        `Error recording agent response usage: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Check and record token usage for embedding operations
   * @param organizationId Organization ID
   * @param userId User ID
   * @param modelId Model ID
   * @param textLength Total length of text to embed
   * @returns Whether operation can proceed and reservation ID if applicable
   */
  async checkCreditsForEmbedding(
    organizationId: string,
    userId: string,
    modelId: string,
    textLength: number,
  ): Promise<{
    canProceed: boolean;
    reservationId?: string;
    reason?: string;
  }> {
    try {
      // Estimate tokens based on text length
      // For embedding models, we typically count 1 token per ~4 characters
      const estimatedTokens = Math.ceil(textLength / 4);

      // Generate a unique operation ID
      const operationId = `emb_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      // Check credits
      const creditCheck = await this.creditSystemService.checkCredits({
        organizationId,
        userId,
        expectedInputTokens: estimatedTokens,
        expectedOutputTokens: 0, // No output tokens for embeddings
        modelId,
        usageType: CreditUsageType.EMBEDDING,
        operationId,
      });

      if (!creditCheck.hasCredits) {
        return {
          canProceed: false,
          reason: creditCheck.reason || 'Insufficient credits',
        };
      }

      return {
        canProceed: true,
        reservationId: creditCheck.reservationId,
      };
    } catch (error) {
      this.logger.error(
        `Error checking credits for embedding: ${error.message}`,
        error.stack,
      );

      return {
        canProceed: false,
        reason: `Error checking credits: ${error.message}`,
      };
    }
  }

  /**
   * Check and record token usage for RAG operations
   * @param organizationId Organization ID
   * @param userId User ID
   * @param queryLength Length of the query text
   * @param documentCount Number of documents retrieved
   * @param averageDocumentLength Average length of retrieved documents
   * @returns Whether operation can proceed and reservation ID if applicable
   */
  async checkCreditsForRagQuery(
    organizationId: string,
    userId: string,
    queryLength: number,
    documentCount: number,
    averageDocumentLength: number,
  ): Promise<{
    canProceed: boolean;
    reservationId?: string;
    reason?: string;
  }> {
    try {
      // Estimate tokens for query
      const queryTokens = Math.ceil(queryLength / 4);

      // Estimate tokens for retrieved documents
      const documentTokens = Math.ceil(
        (documentCount * averageDocumentLength) / 4,
      );

      // Generate a unique operation ID
      const operationId = `rag_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      // Check credits
      const creditCheck = await this.creditSystemService.checkCredits({
        organizationId,
        userId,
        expectedInputTokens: queryTokens,
        expectedOutputTokens: documentTokens,
        modelId: 'rag-query', // Special model ID for RAG operations
        usageType: CreditUsageType.RAG_QUERY,
        operationId,
      });

      if (!creditCheck.hasCredits) {
        return {
          canProceed: false,
          reason: creditCheck.reason || 'Insufficient credits',
        };
      }

      return {
        canProceed: true,
        reservationId: creditCheck.reservationId,
      };
    } catch (error) {
      this.logger.error(
        `Error checking credits for RAG query: ${error.message}`,
        error.stack,
      );

      return {
        canProceed: false,
        reason: `Error checking credits: ${error.message}`,
      };
    }
  }

  /**
   * Optimizes model selection based on cost and complexity requirements
   * @param organizationId Organization ID
   * @param userPrompt User prompt
   * @param taskComplexity Complexity level required
   * @param preferredModel Optional preferred model
   * @returns Optimal model to use
   */
  async optimizeModelSelection(
    organizationId: string,
    userPrompt: string,
    taskComplexity: 'simple' | 'standard' | 'complex',
    preferredModel?: string,
  ): Promise<{
    model: ModelRegistryEntry | null;
    reason: string;
  }> {
    try {
      // Get all active models
      const allModels = await this.modelRegistryRepository.findAll();
      const activeModels = allModels.filter((model) => model.isEnabled);

      // If preferred model is specified, try to use it
      if (preferredModel) {
        const model = activeModels.find((m) => m.model === preferredModel);

        if (model && model.isEnabled) {
          return {
            model,
            reason: 'Using preferred model',
          };
        }
      }

      // Filter models by complexity
      let eligibleModels = activeModels;
      if (taskComplexity === 'simple') {
        eligibleModels = activeModels.filter(
          (m) =>
            m.complexity === 'simple' ||
            m.complexity === 'standard' ||
            m.complexity === 'complex',
        );
      } else if (taskComplexity === 'standard') {
        eligibleModels = activeModels.filter(
          (m) => m.complexity === 'standard' || m.complexity === 'complex',
        );
      } else {
        eligibleModels = activeModels.filter((m) => m.complexity === 'complex');
      }

      if (eligibleModels.length === 0) {
        return {
          model: null,
          reason: 'No models available for the required complexity',
        };
      }

      // Estimate tokens for the prompt
      const estimatedTokens =
        this.tokenEstimator.estimateTokensForString(userPrompt);

      // Sort models by cost
      const sortedModels = [...eligibleModels].sort((a, b) => {
        // Calculate total cost
        const costA =
          (estimatedTokens * a.costPer1kInputTokens) / 1000 +
          (estimatedTokens * 0.7 * a.costPer1kOutputTokens) / 1000;
        const costB =
          (estimatedTokens * b.costPer1kInputTokens) / 1000 +
          (estimatedTokens * 0.7 * b.costPer1kOutputTokens) / 1000;

        return costA - costB;
      });

      // Return the most cost-efficient model
      return {
        model: sortedModels[0],
        reason:
          'Selected most cost-efficient model for the required complexity',
      };
    } catch (error) {
      this.logger.error(
        `Error optimizing model selection: ${error.message}`,
        error.stack,
      );

      // Fallback to a default model (first available)
      const allModels = await this.modelRegistryRepository.findAll();
      const defaultModel = allModels.length > 0 ? allModels[0] : null;

      return {
        model: defaultModel,
        reason: `Error optimizing model selection, using fallback model: ${error.message}`,
      };
    }
  }
}
