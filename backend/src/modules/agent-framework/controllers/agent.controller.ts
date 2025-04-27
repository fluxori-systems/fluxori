import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import {
  FirebaseAuthGuard,
  GetUser,
  DecodedFirebaseToken,
} from '@modules/auth';
// import { AuthUtils } from '../../modules/auth'; // Uncomment if AuthUtils is public API

import {
  CreateConversationRequest,
  SendMessageRequest,
  AgentConfig,
  ConversationResponse,
  AgentResponse,
  ModelComplexity,
} from '../interfaces/types';
import { AgentService } from '../services/agent.service';

// We're using the DecodedFirebaseToken interface from common/auth

/**
 * Controller for agent framework endpoints
 */
@Controller('api/agent-framework')
@UseGuards(FirebaseAuthGuard)
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(private readonly agentService: AgentService) {}

  /**
   * Create a new conversation
   * @param createRequest Conversation creation request
   * @param user Authenticated user
   * @returns New conversation
   */
  @Post('conversations')
  async createConversation(
    @Body() createRequest: CreateConversationRequest,
    @GetUser() user: DecodedFirebaseToken,
  ) {
    try {
      // Ensure the user is working with their own data using our auth utilities
      // Inline AuthUtils.isOwner logic: ensure user is working with their own data
      if (user.sub !== createRequest.userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const conversation =
        await this.agentService.createConversation(createRequest);
      return {
        id: conversation.id,
        title: conversation.title,
        agentConfigId: conversation.agentConfigId,
        created: conversation.createdAt,
      };
    } catch (error) {
      this.logger.error(
        `Error creating conversation: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to create conversation: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Send a message to an agent
   * @param messageRequest Message request
   * @param user Authenticated user
   * @returns Agent response
   */
  @Post('messages')
  async sendMessage(
    @Body() messageRequest: SendMessageRequest,
    @GetUser() user: DecodedFirebaseToken, // TODO: Refine user type further if needed,
  ): Promise<AgentResponse> {
    try {
      // Ensure the user is working with their own data
      if (user.uid !== messageRequest.userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      return this.agentService.sendMessage(messageRequest);
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to send message: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a conversation by ID
   * @param id Conversation ID
   * @param user Authenticated user
   * @returns Conversation
   */
  @Get('conversations/:id')
  async getConversation(
    @Param('id') id: string,
    @GetUser() user: DecodedFirebaseToken, // TODO: Refine user type further if needed,
  ): Promise<ConversationResponse> {
    try {
      return this.agentService.getConversation(id, user.uid);
    } catch (error) {
      this.logger.error(
        `Error fetching conversation: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to fetch conversation: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * List conversations for a user
   * @param organizationId Organization ID
   * @param limit Maximum number of conversations
   * @param user Authenticated user
   * @returns List of conversations
   */
  @Get('conversations')
  async listConversations(
    @Query('organizationId') organizationId: string,
    @Query('limit') limit = 20,
    @GetUser() user: DecodedFirebaseToken, // TODO: Refine user type further if needed,
  ): Promise<ConversationResponse[]> {
    try {
      return this.agentService.listUserConversations(
        organizationId,
        user.uid,
        Number(limit),
      );
    } catch (error) {
      this.logger.error(
        `Error listing conversations: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to list conversations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get agent configurations for an organization
   * @param organizationId Organization ID
   * @returns List of agent configurations
   */
  @Get('configs')
  async getAgentConfigurations(
    @Query('organizationId') organizationId: string,
  ): Promise<AgentConfig[]> {
    try {
      return this.agentService.getAgentConfigurations(organizationId);
    } catch (error) {
      this.logger.error(
        `Error fetching configurations: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to fetch configurations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get the best model for a task
   * @param organizationId Organization ID
   * @param complexity Task complexity
   * @param provider Optional preferred provider
   * @param capabilities Optional comma-separated required capabilities
   * @returns Best model or 404 if none found
   */
  @Get('models/best')
  async getBestModel(
    @Query('organizationId') organizationId: string,
    @Query('complexity') complexity: ModelComplexity,
    @Query('provider') provider?: string,
    @Query('capabilities') capabilities?: string,
  ) {
    try {
      // Parse capabilities if provided
      const requiredCapabilities = capabilities
        ? capabilities.split(',')
        : undefined;

      const model = await this.agentService.getBestModelForTask(
        organizationId,
        complexity,
        provider,
        requiredCapabilities,
      );

      if (!model) {
        throw new HttpException(
          'No suitable model found',
          HttpStatus.NOT_FOUND,
        );
      }

      return model;
    } catch (error) {
      this.logger.error(
        `Error finding best model: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to find best model: ${error.message}`,
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Archive old user conversations
   * @param organizationId Organization ID
   * @param keepActive Number of conversations to keep active
   * @param user Authenticated user
   * @returns Number of archived conversations
   */
  @Post('conversations/archive')
  async archiveOldConversations(
    @Query('organizationId') organizationId: string,
    @Query('keepActive') keepActive = 10,
    @GetUser() user: DecodedFirebaseToken, // TODO: Refine user type further if needed,
  ): Promise<{ archivedCount: number }> {
    try {
      const archivedCount = await this.agentService.archiveOldConversations(
        organizationId,
        user.uid,
        Number(keepActive),
      );

      return { archivedCount };
    } catch (error) {
      this.logger.error(
        `Error archiving conversations: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to archive conversations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
