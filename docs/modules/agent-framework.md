# Agent Framework Module

## Overview

The Agent Framework module provides a unified system for interacting with various AI models and services, enabling intelligent agent capabilities throughout the Fluxori platform. It abstracts model-specific implementations behind a common interface, handles conversation management, and optimizes token usage. This module is central to Fluxori's AI-powered features.

## Module Boundaries

### Exports

The module exposes the following components to the rest of the application:

- **Public APIs**:
  - `AgentFrameworkModule`: The main module for agent functionality
  - `AgentService`: Primary service for agent interactions and message generation
  - `ModelAdapterFactory`: Factory for creating model-specific adapters
  - `ModelAdapter`: Interface for implementing model-specific adapters
  - Repositories: `ModelRegistryRepository`, `AgentConfigRepository`, `AgentConversationRepository`
  - Model implementations: `VertexAIModelAdapter`
  - Utility classes: `TokenEstimator`
  - Type definitions and interfaces

### Dependencies

This module has dependencies on:

- **Required Modules**:
  - `FeatureFlagsModule`: For dynamically enabling/disabling agent capabilities

## Architecture

```
agent-framework/
├── adapters/                    # Model-specific adapters
│   └── vertex-ai.adapter.ts     # Google Vertex AI implementation
├── controllers/                 # HTTP endpoints
│   └── agent.controller.ts      # API for agent interactions
├── interfaces/                  # TypeScript interfaces
│   ├── model-adapter.interface.ts # Adapter contract
│   └── types.ts                 # Type definitions
├── models/                      # Data models (placeholder)
├── repositories/                # Data access
│   ├── agent-config.repository.ts      # Agent configuration storage
│   ├── agent-conversation.repository.ts # Conversation history
│   └── model-registry.repository.ts    # Model capabilities and settings
├── services/                    # Business logic
│   ├── agent.service.ts         # Core agent orchestration
│   └── model-adapter.factory.ts # Factory for model adapters
├── utils/                       # Utilities
│   └── token-estimator.ts       # Token usage estimation
├── agent-framework.module.ts    # Module definition
└── index.ts                     # Public API exports
```

## Integration Points

Other modules should interact with this module through its public API:

### How to Import

```typescript
// Import the entire module
import { AgentFrameworkModule } from "src/modules/agent-framework";

// Import specific components
import { AgentService, ModelAdapterFactory } from "src/modules/agent-framework";
```

### Usage Examples

#### Creating a Conversation with an Agent

```typescript
import { Injectable } from "@nestjs/common";
import {
  AgentService,
  CreateConversationRequest,
} from "src/modules/agent-framework";

@Injectable()
export class ProductAnalysisService {
  constructor(private readonly agentService: AgentService) {}

  async analyzeProduct(
    userId: string,
    organizationId: string,
    productData: any,
  ): Promise<string> {
    // Create a new conversation
    const createRequest: CreateConversationRequest = {
      userId,
      organizationId,
      agentConfigId: "product-analysis-agent",
      initialContext: {
        product: productData,
      },
      title: `Analysis of ${productData.name}`,
    };

    const conversation =
      await this.agentService.createConversation(createRequest);

    // Send a message to the agent
    const response = await this.agentService.sendMessage({
      userId,
      conversationId: conversation.id,
      message:
        "Analyze this product for potential market opportunities and pricing strategies.",
    });

    return response.message;
  }
}
```

#### Using a Specific Model Adapter

```typescript
import { Injectable } from "@nestjs/common";
import { ModelAdapterFactory, ModelAdapter } from "src/modules/agent-framework";

@Injectable()
export class CustomAgentService {
  private modelAdapter: ModelAdapter;

  constructor(private readonly modelAdapterFactory: ModelAdapterFactory) {
    // Get an adapter for a specific model
    this.modelAdapter = this.modelAdapterFactory.getAdapter("gpt-4-turbo");
  }

  async generateSuggestions(prompt: string, context: any): Promise<string> {
    // Use the adapter directly for specific use cases
    const response = await this.modelAdapter.generateResponse({
      prompt,
      context,
      temperature: 0.7,
      maxTokens: 500,
    });

    return response.content;
  }
}
```

## Data Flow

The typical data flow through the Agent Framework module:

1. Application interacts with `AgentService` to create a conversation or send a message
2. `AgentService` retrieves agent configuration from `AgentConfigRepository`
3. `ModelAdapterFactory` provides the appropriate model adapter based on configuration
4. If continuing a conversation, previous context is retrieved from `AgentConversationRepository`
5. `AgentService` prepares the prompt and context for the model
6. Model adapter sends the request to the AI model and receives a response
7. `TokenEstimator` counts token usage for tracking and billing
8. Conversation is updated in `AgentConversationRepository`
9. Response is returned to the application

## Configuration

The Agent Framework module supports the following configuration options:

| Option                    | Description                                    | Default Value  |
| ------------------------- | ---------------------------------------------- | -------------- |
| `agent.default.model`     | Default model to use when not specified        | `gpt-4-turbo`  |
| `agent.max_tokens`        | Maximum tokens to generate in responses        | `4000`         |
| `agent.temperature`       | Temperature setting for response generation    | `0.7`          |
| `agent.context_window`    | Maximum number of previous messages to include | `10`           |
| `agent.vertex.project_id` | Google Cloud project ID for Vertex AI          | -              |
| `agent.vertex.location`   | Google Cloud region for Vertex AI              | `europe-west4` |

## Testing

The Agent Framework module can be tested as follows:

```typescript
describe("AgentService", () => {
  let service: AgentService;
  let modelAdapterFactory: MockModelAdapterFactory;
  let agentConfigRepository: MockAgentConfigRepository;
  let conversationRepository: MockAgentConversationRepository;
  let mockAdapter: MockModelAdapter;

  beforeEach(async () => {
    mockAdapter = {
      generateResponse: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AgentService,
        {
          provide: ModelAdapterFactory,
          useValue: {
            getAdapter: jest.fn().mockReturnValue(mockAdapter),
          },
        },
        {
          provide: AgentConfigRepository,
          useClass: MockAgentConfigRepository,
        },
        {
          provide: AgentConversationRepository,
          useClass: MockAgentConversationRepository,
        },
        {
          provide: TokenEstimator,
          useClass: MockTokenEstimator,
        },
      ],
    }).compile();

    service = module.get<AgentService>(AgentService);
    modelAdapterFactory = module.get(ModelAdapterFactory);
    agentConfigRepository = module.get(AgentConfigRepository);
    conversationRepository = module.get(AgentConversationRepository);
  });

  it("should create a conversation", async () => {
    // Setup
    const createRequest = {
      userId: "user123",
      agentConfigId: "agent-config-123",
      title: "Test Conversation",
    };

    agentConfigRepository.findById.mockResolvedValue({
      id: "agent-config-123",
      name: "Test Agent",
      defaultModel: "gpt-4-turbo",
      systemPrompt: "You are a helpful assistant",
    });

    conversationRepository.create.mockResolvedValue({
      id: "conv-123",
      userId: "user123",
      agentConfigId: "agent-config-123",
      title: "Test Conversation",
      messages: [],
      createdAt: new Date(),
    });

    // Execute
    const result = await service.createConversation(createRequest);

    // Verify
    expect(result.id).toBe("conv-123");
    expect(result.title).toBe("Test Conversation");
    expect(conversationRepository.create).toHaveBeenCalled();
  });
});
```
