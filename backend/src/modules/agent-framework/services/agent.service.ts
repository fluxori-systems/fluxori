import { Injectable, Logger } from '@nestjs/common';

import { v4 as uuidv4 } from 'uuid';

import { FeatureFlagService } from 'src/modules/feature-flags';

import { ModelAdapterFactory } from './model-adapter.factory';
import {
  AgentConfig,
  AgentConversation,
  ModelRegistryEntry,
  ConversationMessage,
  AgentContext,
  AgentResponse,
  AgentResponseType,
  ModelComplexity,
  CreateConversationRequest,
  SendMessageRequest,
  ConversationResponse,
} from '../interfaces/types';
import { AgentConfigRepository } from '../repositories/agent-config.repository';
import { AgentConversationRepository } from '../repositories/agent-conversation.repository';
import { ModelRegistryRepository } from '../repositories/model-registry.repository';

/**
 * Service for agent operations
 */
@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly modelRegistryRepository: ModelRegistryRepository,
    private readonly agentConfigRepository: AgentConfigRepository,
    private readonly conversationRepository: AgentConversationRepository,
    private readonly adapterFactory: ModelAdapterFactory,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  /**
   * Create a new conversation with an agent
   * @param request Conversation creation request
   * @returns New conversation
   */
  async createConversation(
    request: CreateConversationRequest,
  ): Promise<AgentConversation> {
    try {
      // Get the agent configuration
      const agentConfig = await this.agentConfigRepository.findById(
        request.agentConfigId,
      );
      if (!agentConfig) {
        throw new Error(
          `Agent configuration not found: ${request.agentConfigId}`,
        );
      }

      // Check if this agent is allowed via feature flags
      const agentEnabled = await this.checkAgentFeatureFlag(
        agentConfig.name,
        request.organizationId,
      );

      if (!agentEnabled) {
        throw new Error(
          `Agent '${agentConfig.name}' is not available for your organization.`,
        );
      }

      // Create initial messages array with system prompt
      const messages: ConversationMessage[] = [
        {
          id: uuidv4(),
          role: 'system',
          content: agentConfig.systemPrompt,
          timestamp: new Date(),
        },
      ];

      // Add initial user message if provided
      if (request.initialMessage) {
        messages.push({
          id: uuidv4(),
          role: 'user',
          content: request.initialMessage,
          timestamp: new Date(),
        });
      }

      // Create the conversation
      const conversation = await this.conversationRepository.create({
        organizationId: request.organizationId,
        userId: request.userId,
        title: request.title || 'New Conversation',
        messages,
        agentConfigId: request.agentConfigId,
        tokensUsed: 0,
        cost: 0,
        lastActivityAt: new Date(),
        metadata: request.metadata || {},
        isActive: true,
        tags: [],
        // FirestoreEntityWithMetadata required fields
        isDeleted: false,
        deletedAt: null,
        version: 1,
      });

      // If there's an initial message, generate an agent response
      if (request.initialMessage) {
        await this.processAgentResponse(conversation.id);
      }

      return conversation;
    } catch (error) {
      this.logger.error(
        `Error creating conversation: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to create conversation: ${error.message}`);
    }
  }

  /**
   * Send a message to an agent
   * @param request Message request
   * @returns Updated conversation
   */
  async sendMessage(request: SendMessageRequest): Promise<AgentResponse> {
    try {
      // Get the conversation
      const conversation = await this.conversationRepository.findById(
        request.conversationId,
      );
      if (!conversation) {
        throw new Error(`Conversation not found: ${request.conversationId}`);
      }

      // Verify user has access to the conversation
      if (conversation.userId !== request.userId) {
        throw new Error('User does not have access to this conversation');
      }

      // Get the agent configuration
      const agentConfig = await this.agentConfigRepository.findById(
        conversation.agentConfigId,
      );
      if (!agentConfig) {
        throw new Error(
          `Agent configuration not found: ${conversation.agentConfigId}`,
        );
      }

      // Check if this agent is allowed via feature flags
      const agentEnabled = await this.checkAgentFeatureFlag(
        agentConfig.name,
        conversation.organizationId,
      );

      if (!agentEnabled) {
        return {
          type: AgentResponseType.ERROR,
          content: `Agent '${agentConfig.name}' is no longer available for your organization.`,
          tokenUsage: { input: 0, output: 0, total: 0 },
          modelInfo: {
            provider: 'none',
            model: 'none',
            complexity: ModelComplexity.SIMPLE,
          },
          processingTime: 0,
          cost: 0,
        };
      }

      // Add user message to conversation
      const userMessage: ConversationMessage = {
        id: uuidv4(),
        role: 'user',
        content: request.message,
        timestamp: new Date(),
        metadata: request.attachments
          ? { attachments: request.attachments }
          : undefined,
      };

      await this.conversationRepository.addMessage(
        conversation.id,
        userMessage,
      );

      // Process the message and generate agent response
      return this.processAgentResponse(conversation.id, request.overrideModel);
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`, error.stack);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Get a conversation by ID
   * @param conversationId Conversation ID
   * @param userId User ID requesting the conversation
   * @returns Conversation details
   */
  async getConversation(
    conversationId: string,
    userId: string,
  ): Promise<ConversationResponse> {
    try {
      const conversation =
        await this.conversationRepository.findById(conversationId);
      if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }

      // Verify user has access to the conversation
      if (conversation.userId !== userId) {
        throw new Error('User does not have access to this conversation');
      }

      return {
        id: conversation.id,
        title: conversation.title,
        messages: conversation.messages,
        lastUpdated:
          conversation.lastActivityAt instanceof Date
            ? conversation.lastActivityAt
            : new Date(conversation.lastActivityAt),
        metadata: conversation.metadata,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching conversation: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to fetch conversation: ${error.message}`);
    }
  }

  /**
   * List user conversations
   * @param organizationId Organization ID
   * @param userId User ID
   * @param limit Maximum number of conversations to return
   * @returns List of conversations
   */
  async listUserConversations(
    organizationId: string,
    userId: string,
    limit = 20,
  ): Promise<ConversationResponse[]> {
    try {
      const conversations = await this.conversationRepository.findByUser(
        organizationId,
        userId,
        limit,
      );

      return conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        messages: conversation.messages,
        lastUpdated:
          conversation.lastActivityAt instanceof Date
            ? conversation.lastActivityAt
            : new Date(conversation.lastActivityAt),
        metadata: conversation.metadata,
      }));
    } catch (error) {
      this.logger.error(
        `Error listing conversations: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to list conversations: ${error.message}`);
    }
  }

  /**
   * Get active agent configurations
   * @param organizationId Organization ID
   * @returns List of agent configurations
   */
  async getAgentConfigurations(organizationId: string): Promise<AgentConfig[]> {
    try {
      // Get all agent configurations for the organization
      const configs =
        await this.agentConfigRepository.findByOrganization(organizationId);

      // Filter based on feature flags
      const filteredConfigs = [];

      for (const config of configs) {
        // Check if this agent is allowed via feature flags
        const isEnabled = await this.checkAgentFeatureFlag(
          config.name,
          organizationId,
        );

        if (isEnabled) {
          filteredConfigs.push(config);
        }
      }

      return filteredConfigs;
    } catch (error) {
      this.logger.error(
        `Error fetching agent configurations: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to fetch agent configurations: ${error.message}`);
    }
  }

  /**
   * Process an agent response for a conversation
   * @param conversationId Conversation ID
   * @param overrideModel Optional model to use instead of the default
   * @returns Agent response
   * @private
   */
  private async processAgentResponse(
    conversationId: string,
    overrideModel?: string,
  ): Promise<AgentResponse> {
    try {
      // Get the conversation
      const conversation =
        await this.conversationRepository.findById(conversationId);
      if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }

      // Get the agent configuration
      const agentConfig = await this.agentConfigRepository.findById(
        conversation.agentConfigId,
      );
      if (!agentConfig) {
        throw new Error(
          `Agent configuration not found: ${conversation.agentConfigId}`,
        );
      }

      // Determine which model to use
      const modelName = overrideModel || agentConfig.defaultModel;

      // Find the model in the registry
      const allModels = await this.modelRegistryRepository.findAll();
      const model = allModels.find((m) => m.model === modelName && m.isEnabled);

      if (!model) {
        throw new Error(`Model not found: ${modelName}`);
      }

      // Get the appropriate adapter for this model
      const adapter = this.adapterFactory.getAdapter(model);

      // Extract the messages for the chat context
      const messages = conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        name: msg.role === 'function' ? msg.id : undefined,
        functionCall: msg.functionCall,
      }));

      // Use the agent configuration parameters, with model-specific overrides where needed
      const modelParameters = {
        temperature: agentConfig.parameters.temperature,
        topP: agentConfig.parameters.topP,
        maxOutputTokens: Math.min(
          agentConfig.parameters.maxOutputTokens,
          model.maxOutputTokens,
        ),
        presencePenalty: agentConfig.parameters.presencePenalty,
        frequencyPenalty: agentConfig.parameters.frequencyPenalty,
        functions: agentConfig.functions,
      };

      // Prepare the chat request
      const chatRequest = {
        messages: messages,
        options: modelParameters,
      };

      // Measure processing time
      const startTime = Date.now();

      // Generate the response
      const response = await adapter.generateChatCompletion(model, chatRequest);

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      // Create the assistant message
      const assistantMessage: ConversationMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        functionCall: response.functionCall,
        metadata: {
          model: model.model,
          provider: model.provider,
          tokenCount: response.usage.outputTokens,
          cost: response.usage.cost,
        },
      };

      // Add the assistant message to the conversation
      await this.conversationRepository.addMessage(
        conversation.id,
        assistantMessage,
      );

      // Update the conversation's token usage and cost
      await this.conversationRepository.update(conversation.id, {
        tokensUsed: conversation.tokensUsed + response.usage.totalTokens,
        cost: conversation.cost + response.usage.cost,
        lastActivityAt: new Date(),
      });

      // Return the agent response
      return {
        type: response.functionCall
          ? AgentResponseType.ACTION
          : AgentResponseType.TEXT,
        content: response.functionCall
          ? response.functionCall
          : response.content,
        tokenUsage: {
          input: response.usage.inputTokens,
          output: response.usage.outputTokens,
          total: response.usage.totalTokens,
        },
        modelInfo: {
          provider: model.provider,
          model: model.model,
          complexity: model.complexity,
        },
        processingTime,
        cost: response.usage.cost,
        metadata: {
          conversationId,
          messageId: assistantMessage.id,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error processing agent response: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to process agent response: ${error.message}`);
    }
  }

  /**
   * Get the best model for a task based on complexity
   * @param organizationId Organization ID
   * @param complexity Task complexity
   * @param preferredProvider Optional preferred provider
   * @param requiredCapabilities Optional required capabilities
   * @returns Best matching model or null if none found
   */
  async getBestModelForTask(
    organizationId: string,
    complexity: ModelComplexity,
    preferredProvider?: string,
    requiredCapabilities?: string[],
  ): Promise<ModelRegistryEntry | null> {
    try {
      return this.modelRegistryRepository.findBestModelForTask({
        complexity,
        preferredProvider,
        requiredCapabilities,
      });
    } catch (error) {
      this.logger.error(
        `Error finding model for task: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to find model for task: ${error.message}`);
    }
  }

  /**
   * Archive old conversations for a user
   * @param organizationId Organization ID
   * @param userId User ID
   * @param keepActive Number of conversations to keep active
   * @returns Number of archived conversations
   */
  async archiveOldConversations(
    organizationId: string,
    userId: string,
    keepActive = 10,
  ): Promise<number> {
    try {
      return this.conversationRepository.archiveOldUserConversations(
        organizationId,
        userId,
        keepActive,
      );
    } catch (error) {
      this.logger.error(
        `Error archiving conversations: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to archive conversations: ${error.message}`);
    }
  }

  /**
   * Check if an agent is enabled via feature flags
   * @param agentName Agent name
   * @param organizationId Organization ID
   * @returns Whether the agent is enabled
   * @private
   */
  private async checkAgentFeatureFlag(
    agentName: string,
    organizationId: string,
  ): Promise<boolean> {
    // Create a standardized feature flag key from the agent name
    const flagKey = `agent-${agentName.toLowerCase().replace(/\s+/g, '-')}`;

    try {
      // Check if the feature flag exists and is enabled for this organization
      return await this.featureFlagService.isEnabled(flagKey, {
        organizationId,
      });
    } catch (error) {
      // If the flag doesn't exist or there's an error, default to enabled
      // This prevents blocking existing agents if feature flags haven't been set up yet
      this.logger.warn(
        `Error checking feature flag for agent ${agentName}: ${error.message}`,
      );
      return true;
    }
  }
}
