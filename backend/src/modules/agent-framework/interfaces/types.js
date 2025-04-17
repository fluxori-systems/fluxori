"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentErrorType = exports.AgentResponseType = exports.ModelComplexity = void 0;
/**
 * Model complexity levels
 */
var ModelComplexity;
(function (ModelComplexity) {
    ModelComplexity["SIMPLE"] = "simple";
    ModelComplexity["STANDARD"] = "standard";
    ModelComplexity["COMPLEX"] = "complex";
})(ModelComplexity || (exports.ModelComplexity = ModelComplexity = {}));
/**
 * Response types that agents can produce
 */
var AgentResponseType;
(function (AgentResponseType) {
    AgentResponseType["TEXT"] = "text";
    AgentResponseType["DATA"] = "data";
    AgentResponseType["VISUALIZATION"] = "visualization";
    AgentResponseType["ACTION"] = "action";
    AgentResponseType["ERROR"] = "error";
})(AgentResponseType || (exports.AgentResponseType = AgentResponseType = {}));
/**
 * Error types for agent operations
 */
var AgentErrorType;
(function (AgentErrorType) {
    AgentErrorType["CONFIGURATION_ERROR"] = "configuration_error";
    AgentErrorType["EXECUTION_ERROR"] = "execution_error";
    AgentErrorType["AUTHORIZATION_ERROR"] = "authorization_error";
    AgentErrorType["MODEL_UNAVAILABLE"] = "model_unavailable";
    AgentErrorType["TOKEN_LIMIT_EXCEEDED"] = "token_limit_exceeded";
    AgentErrorType["CREDIT_LIMIT_EXCEEDED"] = "credit_limit_exceeded";
    AgentErrorType["INTERNAL_ERROR"] = "internal_error";
    AgentErrorType["RATE_LIMIT_EXCEEDED"] = "rate_limit_exceeded";
    AgentErrorType["INVALID_INPUT"] = "invalid_input";
})(AgentErrorType || (exports.AgentErrorType = AgentErrorType = {}));
