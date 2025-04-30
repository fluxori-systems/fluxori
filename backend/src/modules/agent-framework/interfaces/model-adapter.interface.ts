/**
 * Interface definitions for the model adapter system
 */
import { ModelRegistryEntry, AgentError } from './types';

/**
 * Placeholder for Adapter parameters fields. TODO: Add concrete fields as discovered.
 */
export interface AdapterParameters {
  // TODO: Add concrete parameters fields here as they are discovered in the codebase
}

/**
 * Placeholder for Adapter arguments fields. TODO: Add concrete fields as discovered.
 */
export interface AdapterArguments {
  // TODO: Add concrete arguments fields here as they are discovered in the codebase
}

/**
 * Placeholder for Adapter metadata fields. TODO: Add concrete fields as discovered.
 */
export interface AdapterMetadata {
  /**
   * Aggressively refined: Metadata for model adapters.
   * Extend as new metadata requirements emerge.
   */
  provider?: string;
  model?: string;
  version?: string;
  tokenCount?: number;
  cost?: number;
  attachments?: { type: string; content: unknown }[];
  [key: string]: unknown; // Extensibility for future metadata fields
}

/**
 * Placeholder for Adapter config fields. TODO: Add concrete fields as discovered.
 */

/**
 * AdapterConfig defines configuration for all supported model adapters.
 * As new providers are added, extend this interface with their config types.
 */
export interface AdapterConfig {
  /**
   * Configuration for Vertex AI adapter (optional)
   */
  'vertex-ai'?: VertexAIClientConfig;
  // Add future providers here as:
  // '<provider-name>'?: <ProviderConfigType>;

  /**
   * Fallback for not-yet-typed providers (to be removed as concrete types are added)
   */
  [provider: string]: unknown;
}

/**
 * Placeholder for Vertex AI Client Config
 * TODO: Refine fields as requirements become clear
 */
export interface VertexAIClientConfig {
  projectId: string;
  location?: string; // Optional, defaults in code
  apiEndpoint?: string;
  credentials: VertexAICredentials; // Required for API access
}

/**
 * Placeholder for Vertex AI Credentials
 * TODO: Refine fields as requirements become clear
 */
export interface VertexAICredentials {
  /**
   * Aggressively refined: Required fields for Vertex AI service account credentials.
   * Add new fields as provider requirements expand.
   */
  type: 'service_account';
  client_email: string;
  private_key: string;
  // Allow extensibility for additional fields
  [key: string]: unknown;
}

/**
 * Placeholder for Vertex AI Request Options
 * TODO: Refine fields as requirements become clear
 */
export interface VertexAIRequestOptions {
  [key: string]: unknown;
}

/**
 * Placeholder for Vertex AI Function Arguments
 * TODO: Refine fields as requirements become clear
 */
export interface VertexAIFunctionArguments {
  [key: string]: unknown;
}

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
    parameters: AdapterParameters; // TODO: Refine fields as discovered
  }>;
  functionCall?: 'auto' | 'none' | string;
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
    arguments: AdapterArguments; // TODO: Refine fields as discovered
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
    | 'stop'
    | 'length'
    | 'function_call'
    | 'content_filter'
    | 'error';
  functionCall?: {
    name: string;
    arguments: AdapterArguments; // TODO: Refine fields as discovered
  };
  metadata?: AdapterMetadata; // TODO: Refine fields as discovered
}

/**
 * Interface that all model adapters must implement
 */
export interface ModelAdapter {
  /**
   * Initialize the adapter with configuration
   */
  initialize(config: AdapterConfig): Promise<void>; // TODO: Refine fields as discovered

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
