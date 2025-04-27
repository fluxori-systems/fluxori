"use strict";
/**
 * Agent Framework Module Public API
 *
 * This file defines the public interface of the Agent Framework module, exporting only what should be
 * accessible to other modules. This ensures proper encapsulation and prevents direct access to
 * internal components.
 */
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __exportStar =
  (this && this.__exportStar) ||
  function (m, exports) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p))
        __createBinding(exports, m, p);
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenEstimator =
  exports.VertexAIModelAdapter =
  exports.AgentConversationRepository =
  exports.AgentConfigRepository =
  exports.ModelRegistryRepository =
  exports.ModelAdapterFactory =
  exports.AgentService =
  exports.AgentFrameworkModule =
    void 0;
// Re-export module
var agent_framework_module_1 = require("./agent-framework.module");
Object.defineProperty(exports, "AgentFrameworkModule", {
  enumerable: true,
  get: function () {
    return agent_framework_module_1.AgentFrameworkModule;
  },
});
// Re-export primary services
var agent_service_1 = require("./services/agent.service");
Object.defineProperty(exports, "AgentService", {
  enumerable: true,
  get: function () {
    return agent_service_1.AgentService;
  },
});
var model_adapter_factory_1 = require("./services/model-adapter.factory");
Object.defineProperty(exports, "ModelAdapterFactory", {
  enumerable: true,
  get: function () {
    return model_adapter_factory_1.ModelAdapterFactory;
  },
});
// Re-export repositories
var model_registry_repository_1 = require("./repositories/model-registry.repository");
Object.defineProperty(exports, "ModelRegistryRepository", {
  enumerable: true,
  get: function () {
    return model_registry_repository_1.ModelRegistryRepository;
  },
});
var agent_config_repository_1 = require("./repositories/agent-config.repository");
Object.defineProperty(exports, "AgentConfigRepository", {
  enumerable: true,
  get: function () {
    return agent_config_repository_1.AgentConfigRepository;
  },
});
var agent_conversation_repository_1 = require("./repositories/agent-conversation.repository");
Object.defineProperty(exports, "AgentConversationRepository", {
  enumerable: true,
  get: function () {
    return agent_conversation_repository_1.AgentConversationRepository;
  },
});
__exportStar(require("./interfaces/types"), exports);
// Re-export adapters (if they need to be extended)
var vertex_ai_adapter_1 = require("./adapters/vertex-ai.adapter");
Object.defineProperty(exports, "VertexAIModelAdapter", {
  enumerable: true,
  get: function () {
    return vertex_ai_adapter_1.VertexAIModelAdapter;
  },
});
// Re-export utilities
var token_estimator_1 = require("./utils/token-estimator");
Object.defineProperty(exports, "TokenEstimator", {
  enumerable: true,
  get: function () {
    return token_estimator_1.TokenEstimator;
  },
});
