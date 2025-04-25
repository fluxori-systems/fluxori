/**
 * Agent Framework Module Public API
 *
 * This file defines the public interface of the Agent Framework module, exporting only what should be
 * accessible to other modules. This ensures proper encapsulation and prevents direct access to
 * internal components.
 */

// Re-export module
export { AgentFrameworkModule } from './agent-framework.module';

// Re-export primary services
export { AgentService } from './services/agent.service';
export { ModelAdapterFactory } from './services/model-adapter.factory';

// Re-export repositories
export { ModelRegistryRepository } from './repositories/model-registry.repository';
export { AgentConfigRepository } from './repositories/agent-config.repository';
export { AgentConversationRepository } from './repositories/agent-conversation.repository';

// Re-export interfaces and types
export { ModelAdapter } from './interfaces/model-adapter.interface';
export * from './interfaces/types';

// Re-export adapters (if they need to be extended)
export { VertexAIModelAdapter } from './adapters/vertex-ai.adapter';

// Re-export utilities
export { TokenEstimator } from './utils/token-estimator';
