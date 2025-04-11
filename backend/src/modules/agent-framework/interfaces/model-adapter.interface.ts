/**
 * Interface definitions for the model adapter system
 */
import { ModelRegistryEntry, AgentError } from "./types";

/**
 * Common options for model generation
 */
export interface ModelRequestOptions {
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stopSequences?: string[];
  functions?: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
  functionCall?: "auto" | "none" | string;
}

/**
 * Completion request
 */
export interface CompletionRequest {
  prompt: string;
  options?: ModelRequestOptions;
}

/**
 * Message for chat completion
 */
export interface ChatMessage {
  role: string;
  content: string;
  name?: string;
  functionCall?: {
    name: string;
    arguments: Record<string, any>;
  };
}

/**
 * Chat completion request
 */
export interface ChatCompletionRequest {
  messages: ChatMessage[];
  options?: ModelRequestOptions;
}

/**
 * Result of token counting operation
 */
export interface TokenCountResult {
  inputTokens: number;
  estimatedOutputTokens: number;
  totalTokens: number;
}

/**
 * Model usage statistics
 */
export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  processingTime: number;
  cost: number;
}

/**
 * Response from model generation
 */
export interface ModelResponse {
  content: string;
  usage: ModelUsage;
  finishReason:
    | "stop"
    | "length"
    | "function_call"
    | "content_filter"
    | "error";
  functionCall?: {
    name: string;
    arguments: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

/**
 * Interface that all model adapters must implement
 */
export interface ModelAdapter {
  /**
   * Initialize the adapter with configuration
   */
  initialize(config: Record<string, any>): Promise<void>;

  /**
   * Check if the adapter can handle a specific model
   */
  supportsModel(modelName: string): boolean;

  /**
   * Generate completion from prompt
   */
  generateCompletion(
    model: ModelRegistryEntry,
    request: CompletionRequest,
  ): Promise<ModelResponse>;

  /**
   * Generate chat completion from messages
   */
  generateChatCompletion(
    model: ModelRegistryEntry,
    request: ChatCompletionRequest,
  ): Promise<ModelResponse>;

  /**
   * Count tokens in a completion request
   */
  countCompletionTokens(
    model: ModelRegistryEntry,
    request: CompletionRequest,
  ): Promise<TokenCountResult>;

  /**
   * Count tokens in a chat completion request
   */
  countChatTokens(
    model: ModelRegistryEntry,
    request: ChatCompletionRequest,
  ): Promise<TokenCountResult>;

  /**
   * Validate credentials for this model provider
   */
  validateCredentials(credentials: Record<string, string>): Promise<boolean>;

  /**
   * Get token usage and cost information
   */
  calculateTokenCost(
    model: ModelRegistryEntry,
    inputTokens: number,
    outputTokens: number,
  ): number;

  /**
   * List available models from this provider
   */
  listAvailableModels(): Promise<Partial<ModelRegistryEntry>[]>;

  /**
   * Get provider unique name
   */
  getProviderName(): string;
}
