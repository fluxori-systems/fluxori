import { Injectable, Logger, OnModuleInit } from "@nestjs/common";

import { FirestoreConfigService } from "src/config/firestore.config";

import { FirestoreBaseRepository } from "src/common/repositories";

import { AgentConversation, ConversationMessage } from "../interfaces/types";

/**
 * Repository for managing agent conversations
 */
@Injectable()
export class AgentConversationRepository
  extends FirestoreBaseRepository<AgentConversation>
  implements OnModuleInit
{
  protected readonly logger = new Logger(AgentConversationRepository.name);

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, "agent_conversations");
  }

  /**
   * Initialize the repository when module loads
   */
  onModuleInit(): void {
    this.logger.log("AgentConversationRepository initialized");
  }

  /**
   * Find all conversations for a specific organization
   * @param organizationId Organization ID
   * @param limit Maximum number of conversations to return
   * @returns List of conversations
   */
  async findByOrganization(
    organizationId: string,
    limit = 100,
  ): Promise<AgentConversation[]> {
    return this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "isActive", operator: "==", value: true },
      ],
      queryOptions: {
        orderBy: "lastActivityAt",
        direction: "desc",
        limit,
      },
    });
  }

  /**
   * Find all conversations for a specific user
   * @param organizationId Organization ID
   * @param userId User ID
   * @param limit Maximum number of conversations to return
   * @returns List of conversations
   */
  async findByUser(
    organizationId: string,
    userId: string,
    limit = 50,
  ): Promise<AgentConversation[]> {
    return this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "userId", operator: "==", value: userId },
        { field: "isActive", operator: "==", value: true },
      ],
      queryOptions: {
        orderBy: "lastActivityAt",
        direction: "desc",
        limit,
      },
    });
  }

  /**
   * Find all conversations for a specific agent configuration
   * @param organizationId Organization ID
   * @param agentConfigId Agent configuration ID
   * @param limit Maximum number of conversations to return
   * @returns List of conversations
   */
  async findByAgentConfig(
    organizationId: string,
    agentConfigId: string,
    limit = 50,
  ): Promise<AgentConversation[]> {
    return this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "agentConfigId", operator: "==", value: agentConfigId },
        { field: "isActive", operator: "==", value: true },
      ],
      queryOptions: {
        orderBy: "lastActivityAt",
        direction: "desc",
        limit,
      },
    });
  }

  /**
   * Add a new message to a conversation
   * @param conversationId Conversation ID
   * @param message Message to add
   * @returns Updated conversation or null if not found
   */
  async addMessage(
    conversationId: string,
    message: ConversationMessage,
  ): Promise<AgentConversation | null> {
    const conversation = await this.findById(conversationId);
    if (!conversation) return null;

    // Add message to the conversation
    const updatedMessages = [...conversation.messages, message];

    // Update the conversation
    return this.update(conversationId, {
      messages: updatedMessages,
      lastActivityAt: new Date(),
      // Update token count and cost if provided in the message metadata
      ...(message.metadata?.tokenCount
        ? {
            tokensUsed:
              conversation.tokensUsed + (message.metadata.tokenCount as number),
          }
        : {}),
      ...(message.metadata?.cost
        ? {
            cost: conversation.cost + (message.metadata.cost as number),
          }
        : {}),
    });
  }

  /**
   * Set a conversation's active status
   * @param conversationId Conversation ID
   * @param isActive Whether the conversation is active
   * @returns Updated conversation or null if not found
   */
  async setActive(
    conversationId: string,
    isActive: boolean,
  ): Promise<AgentConversation | null> {
    return this.update(conversationId, { isActive });
  }

  /**
   * Update conversation title
   * @param conversationId Conversation ID
   * @param title New title
   * @returns Updated conversation or null if not found
   */
  async updateTitle(
    conversationId: string,
    title: string,
  ): Promise<AgentConversation | null> {
    return this.update(conversationId, { title });
  }

  /**
   * Archive older user conversations beyond a limit
   * @param organizationId Organization ID
   * @param userId User ID
   * @param keepActive Number of conversations to keep active
   * @returns Number of conversations archived
   */
  async archiveOldUserConversations(
    organizationId: string,
    userId: string,
    keepActive = 10,
  ): Promise<number> {
    // Get all of the user's active conversations
    const conversations = await this.findByUser(organizationId, userId, 1000);

    // If we have fewer conversations than the limit, do nothing
    if (conversations.length <= keepActive) {
      return 0;
    }

    // Sort by last activity date (newest first)
    conversations.sort((a, b) => {
      const dateA =
        a.lastActivityAt instanceof Date
          ? a.lastActivityAt
          : new Date(a.lastActivityAt);
      const dateB =
        b.lastActivityAt instanceof Date
          ? b.lastActivityAt
          : new Date(b.lastActivityAt);
      return dateB.getTime() - dateA.getTime();
    });

    // Keep the most recent 'keepActive' conversations active, archive the rest
    const toArchive = conversations.slice(keepActive);

    // Archive each conversation
    let archivedCount = 0;
    for (const conversation of toArchive) {
      await this.update(conversation.id, {
        isActive: false,
      });
      archivedCount++;
    }

    return archivedCount;
  }
}
