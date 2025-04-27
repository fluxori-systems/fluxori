/* eslint-disable @typescript-eslint/ban-ts-comment */
// Properly typed Jest mocks for agent service tests

import { Test, TestingModule } from '@nestjs/testing';

import { FirestoreConfigService } from '../../../config/firestore.config';
import { VertexAIModelAdapter } from '../adapters/vertex-ai.adapter';
import {
  ModelComplexity,
  AgentConfig,
  ModelRegistryEntry,
  AgentConversation,
} from '../interfaces/types';
import { AgentConfigRepository } from '../repositories/agent-config.repository';
import { AgentConversationRepository } from '../repositories/agent-conversation.repository';
import { ModelRegistryRepository } from '../repositories/model-registry.repository';
import { AgentService } from '../services/agent.service';
import { ModelAdapterFactory } from '../services/model-adapter.factory';
import { TokenEstimator } from '../utils/token-estimator';

// Type-safe mocks using proper typing for Jest
jest.mock('../../../config/firestore.config');
jest.mock('../repositories/model-registry.repository');
jest.mock('../repositories/agent-config.repository');
jest.mock('../repositories/agent-conversation.repository');
jest.mock('../adapters/vertex-ai.adapter');

// Properly typed mocks for repositories
type MockType<T> = {
  [P in keyof T]?: jest.Mock<unknown>;
};

describe('AgentService', () => {
  let service: AgentService;
  let modelRegistryRepository: ModelRegistryRepository;
  let agentConfigRepository: AgentConfigRepository;
  let conversationRepository: AgentConversationRepository;
  let adapterFactory: ModelAdapterFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentService,
        ModelAdapterFactory,
        ModelRegistryRepository,
        AgentConfigRepository,
        AgentConversationRepository,
        VertexAIModelAdapter,
        TokenEstimator,
        FirestoreConfigService,
      ],
    }).compile();

    service = module.get<AgentService>(AgentService);
    modelRegistryRepository = module.get<ModelRegistryRepository>(
      ModelRegistryRepository,
    );
    agentConfigRepository = module.get<AgentConfigRepository>(
      AgentConfigRepository,
    );
    conversationRepository = module.get<AgentConversationRepository>(
      AgentConversationRepository,
    );
    adapterFactory = module.get<ModelAdapterFactory>(ModelAdapterFactory);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createConversation', () => {
    it('should create a new conversation', async () => {
      // Mock data
      const agentConfig: AgentConfig = {
        id: 'config-123',
        organizationId: 'org-123',
        name: 'Test Agent',
        systemPrompt: 'You are a helpful assistant',
        defaultModel: 'gemini-pro',
        parameters: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        deletedAt: null,
        version: 1,
      };

      const conversation: AgentConversation = {
        id: 'conv-123',
        organizationId: 'org-123',
        userId: 'user-123',
        title: 'New Conversation',
        messages: [
          {
            id: 'msg-1',
            role: 'system',
            content: 'You are a helpful assistant',
            timestamp: new Date(),
          },
        ],
        agentConfigId: 'config-123',
        tokensUsed: 0,
        cost: 0,
        lastActivityAt: new Date(),
        isActive: true,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        deletedAt: null,
        version: 1,
      };

      // Properly typed mocks
      jest
        .spyOn(agentConfigRepository, 'findById')
        .mockResolvedValue(agentConfig);
      jest
        .spyOn(conversationRepository, 'create')
        .mockResolvedValue(conversation);

      // Execute
      const result = await service.createConversation({
        organizationId: 'org-123',
        userId: 'user-123',
        agentConfigId: 'config-123',
      });

      // Assert
      expect(result).toEqual(conversation);
      expect(agentConfigRepository.findById).toHaveBeenCalledWith('config-123');
      expect(conversationRepository.create).toHaveBeenCalled();
    });
  });

  describe('getBestModelForTask', () => {
    it('should find the best model for a task', async () => {
      // Mock data
      const model: ModelRegistryEntry = {
        id: 'model-123',
        provider: 'vertex-ai',
        model: 'gemini-pro',
        displayName: 'Gemini Pro',
        description: 'Advanced LLM',
        maxInputTokens: 30000,
        maxOutputTokens: 2048,
        costPer1kInputTokens: 0.0001,
        costPer1kOutputTokens: 0.0002,
        capabilities: ['text', 'chat', 'function_calling'],
        complexity: ModelComplexity.STANDARD,
        isEnabled: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        deletedAt: null,
        version: 1,
      };

      // Properly typed mock
      jest
        .spyOn(modelRegistryRepository, 'findBestModelForTask')
        .mockResolvedValue(model);

      // Execute
      const result = await service.getBestModelForTask(
        'org-123',
        ModelComplexity.STANDARD,
        'vertex-ai',
        ['text', 'chat'],
      );

      // Assert
      expect(result).toEqual(model);
      expect(modelRegistryRepository.findBestModelForTask).toHaveBeenCalledWith(
        {
          complexity: ModelComplexity.STANDARD,
          preferredProvider: 'vertex-ai',
          requiredCapabilities: ['text', 'chat'],
        },
      );
    });
  });
});
