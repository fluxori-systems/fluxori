// Types for Vertex AI Adapter integration

export interface VertexAIClientConfig {
  projectId: string;
  location: string;
  apiKey?: string;
  endpoint?: string;
  [key: string]: any;
}

export interface VertexAIRequestOptions {
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  [key: string]: any;
}

export interface VertexAIFunctionArguments {
  [key: string]: any;
}
