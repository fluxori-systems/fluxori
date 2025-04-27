/**
 * Types for the Agent Framework module
 */
import { FirestoreEntity } from "../../../types/google-cloud.types";

/**
 * Model complexity levels
 */
export enum ModelComplexity {
  SIMPLE = "simple",
  STANDARD = "standard",
  COMPLEX = "complex",
}

/**
 * Agent conversation history entry
 */
export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system" | "function";
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  functionCall?: {
    name: string;
    arguments: Record<string, any>;
  };
  functionResponse?: string;
}

/**
 * Response types that agents can produce
 */
export enum AgentResponseType {
  TEXT = "text",
  DATA = "data",
  VISUALIZATION = "visualization",
  ACTION = "action",
  ERROR = "error",
}

/**
 * Agent execution context containing conversation state and user information
 */
export interface AgentContext {
  conversationId: string;
  organizationId: string;
  userId: string;
  messages: ConversationMessage[];
  metadata?: Record<string, any>;
}

/**
 * Agent execution result
 */
export interface AgentResponse {
  type: AgentResponseType;
  content: string | Record<string, any>;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  modelInfo: {
    provider: string;
    model: string;
    complexity: ModelComplexity;
  };
  processingTime: number;
  cost: number;
  metadata?: Record<string, any>;
}

/**
 * Agent configuration
 */
export interface AgentConfig extends FirestoreEntity {
  organizationId: string;
  name: string;
  description?: string;
  systemPrompt: string;
  defaultModel: string;
  parameters: {
    temperature: number;
    topP?: number;
    maxOutputTokens: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
  };
  functions?: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
  isEnabled: boolean;
  allowedTools?: string[];
  labels?: string[];
  metadata?: Record<string, any>;
}

/**
 * Conversation entity for Firestore
 */
export interface AgentConversation extends FirestoreEntity {
  organizationId: string;
  userId: string;
  title: string;
  messages: ConversationMessage[];
  agentConfigId: string;
  tokensUsed: number;
  cost: number;
  lastActivityAt: Date;
  metadata?: Record<string, any>;
  isActive: boolean;
  tags?: string[];
}

/**
 * Model registry entry for Firestore
 */
export interface ModelRegistryEntry extends FirestoreEntity {
  provider: string;
  model: string;
  displayName: string;
  description?: string;
  maxInputTokens: number;
  maxOutputTokens: number;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
  capabilities: string[];
  complexity: ModelComplexity;
  regionRestrictions?: string[];
  endpoint?: string;
  isEnabled: boolean;
  order: number;
  metadata?: Record<string, any>;
}

/**
 * Tool definition for agent capabilities
 */
export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler: (params: Record<string, any>, context: AgentContext) => Promise<any>;
  requiresAuthentication: boolean;
}

/**
 * Request to create a new conversation
 */
export interface CreateConversationRequest {
  organizationId: string;
  userId: string;
  title?: string;
  agentConfigId: string;
  initialMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Request to send a message to an agent
 */
export interface SendMessageRequest {
  conversationId: string;
  userId: string;
  message: string;
  overrideModel?: string;
  attachments?: Array<{
    type: string;
    content: string | Record<string, any>;
  }>;
}

/**
 * Response with conversation details
 */
export interface ConversationResponse {
  id: string;
  title: string;
  messages: ConversationMessage[];
  lastUpdated: Date;
  metadata?: Record<string, any>;
}

/**
 * Parameters for selecting a model based on task complexity
 */
export interface ModelSelectionParams {
  organizationId: string;
  preferredComplexity?: ModelComplexity;
  preferredProvider?: string;
  requiredCapabilities?: string[];
  preferredModel?: string;
}

/**
 * Error types for agent operations
 */
export enum AgentErrorType {
  CONFIGURATION_ERROR = "configuration_error",
  EXECUTION_ERROR = "execution_error",
  AUTHORIZATION_ERROR = "authorization_error",
  MODEL_UNAVAILABLE = "model_unavailable",
  TOKEN_LIMIT_EXCEEDED = "token_limit_exceeded",
  CREDIT_LIMIT_EXCEEDED = "credit_limit_exceeded",
  INTERNAL_ERROR = "internal_error",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  INVALID_INPUT = "invalid_input",
}

/**
 * Agent error with detailed information
 */
export interface AgentError {
  type: AgentErrorType;
  message: string;
  detail?: string;
  retryable: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}
