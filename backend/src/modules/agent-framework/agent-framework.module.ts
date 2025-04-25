import { Module } from '@nestjs/common';

import { FeatureFlagsModule } from 'src/modules/feature-flags';

import { VertexAIModelAdapter } from './adapters/vertex-ai.adapter';
import { AgentController } from './controllers/agent.controller';
import { AgentConfigRepository } from './repositories/agent-config.repository';
import { AgentConversationRepository } from './repositories/agent-conversation.repository';
import { ModelRegistryRepository } from './repositories/model-registry.repository';
import { AgentService } from './services/agent.service';
import { ModelAdapterFactory } from './services/model-adapter.factory';

// Repositories

// Adapters

// Utils
import { TokenEstimator } from './utils/token-estimator';

// Import feature flags module through its public API

/**
 * Module for the agent framework
 */
@Module({
  imports: [FeatureFlagsModule],
  controllers: [AgentController],
  providers: [
    // Services
    AgentService,
    ModelAdapterFactory,

    // Repositories
    ModelRegistryRepository,
    AgentConfigRepository,
    AgentConversationRepository,

    // Adapters
    VertexAIModelAdapter,

    // Utils
    TokenEstimator,
  ],
  exports: [
    AgentService,
    ModelAdapterFactory,
    ModelRegistryRepository,
    AgentConfigRepository,
    AgentConversationRepository,
  ],
})
export class AgentFrameworkModule {}
