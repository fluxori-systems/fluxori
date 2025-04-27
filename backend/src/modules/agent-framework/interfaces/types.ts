/**
 * Types for the Agent Framework module
 */
import { FirestoreEntityWithMetadata } from '../../../common/repositories/base/repository-types';

/**
 * Placeholder for Agent Framework metadata fields. TODO: Add concrete fields as discovered.
 */
export interface AgentMetadata {
  tokenCount?: number;
  cost?: number;
  attachments?: { type: string; content: AgentContent }[];
  model?: string;
  conversationId?: string;
  provider?: string;
  messageId?: string;
  // TODO: Add concrete metadata fields here as they are discovered in the codebase
}

/**
 * Placeholder for Agent Framework arguments fields. TODO: Add concrete fields as discovered.
 */
export interface AgentArguments {
  // TODO: Add concrete arguments fields here as they are discovered in the codebase
}

/**
 * Placeholder for Agent Framework parameters fields. TODO: Add concrete fields as discovered.
 */
export interface AgentParameters {
  // TODO: Add concrete parameters fields here as they are discovered in the codebase
}

/**
 * Placeholder for Agent Framework content fields. TODO: Add concrete fields as discovered.
 */
export type AgentContent = string | Record<string, unknown>; // TODO: Refine as discovered

/**
 * Placeholder for Agent Framework handler type. TODO: Add concrete signature as discovered.
 */
export type AgentHandler = (
  params: AgentParameters,
  context: AgentContext,
) => Promise<unknown>; // TODO: Refine as discovered

/**
 * Model complexity levels
 */
export enum ModelComplexity {
  SIMPLE = 'simple',
  STANDARD = 'standard',
  COMPLEX = 'complex',
}

/**
 * Agent conversation history entry
 */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  timestamp: Date;
  metadata?: AgentMetadata; // TODO: Refine fields as discovered
  functionCall?: {
    name: string;
    arguments: AgentArguments; // TODO: Refine fields as discovered
  };
  functionResponse?: string;
}

/**
 * Response types that agents can produce
 */
export enum AgentResponseType {
  TEXT = 'text',
  DATA = 'data',
  VISUALIZATION = 'visualization',
  ACTION = 'action',
  ERROR = 'error',
}

/**
 * Agent execution context containing conversation state and user information
 */
export interface AgentContext {
  conversationId: string;
  organizationId: string;
  userId: string;
  messages: ConversationMessage[];
  metadata?: AgentMetadata; // TODO: Refine fields as discovered
}

/**
 * Agent execution result
 */
export interface AgentResponse {
  type: AgentResponseType;
  content: AgentContent; // TODO: Refine fields as discovered
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
  metadata?: AgentMetadata; // TODO: Refine fields as discovered
}

/**
 * Agent configuration
 */
export interface AgentConfig extends FirestoreEntityWithMetadata {
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
    parameters: AgentParameters; // TODO: Refine fields as discovered
  }>;
  isEnabled: boolean;
  allowedTools?: string[];
  labels?: string[];
  metadata?: AgentMetadata; // TODO: Refine fields as discovered
}

/**
 * Conversation entity for Firestore
 */
export interface AgentConversation extends FirestoreEntityWithMetadata {
  organizationId: string;
  userId: string;
  title: string;
  messages: ConversationMessage[];
  agentConfigId: string;
  tokensUsed: number;
  cost: number;
  lastActivityAt: Date;
  metadata?: AgentMetadata; // TODO: Refine fields as discovered
  isActive: boolean;
  tags?: string[];
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  version: number;
}

/**
 * Model registry entry for Firestore
 */
export interface ModelRegistryEntry extends FirestoreEntityWithMetadata {
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
  metadata?: AgentMetadata; // TODO: Refine fields as discovered
}

/**
 * Tool definition for agent capabilities
 */
export interface AgentTool {
  name: string;
  description: string;
  parameters: AgentParameters; // TODO: Refine fields as discovered
  handler: AgentHandler; // TODO: Refine fields as discovered
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
  metadata?: AgentMetadata; // TODO: Refine fields as discovered
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
    content: AgentContent; // TODO: Refine fields as discovered
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
  metadata?: AgentMetadata; // TODO: Refine fields as discovered
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
  CONFIGURATION_ERROR = 'configuration_error',
  EXECUTION_ERROR = 'execution_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  MODEL_UNAVAILABLE = 'model_unavailable',
  TOKEN_LIMIT_EXCEEDED = 'token_limit_exceeded',
  CREDIT_LIMIT_EXCEEDED = 'credit_limit_exceeded',
  INTERNAL_ERROR = 'internal_error',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_INPUT = 'invalid_input',
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
  metadata?: AgentMetadata; // TODO: Refine fields as discovered
}
