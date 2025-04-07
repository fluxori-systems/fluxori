/**
 * Types for the RAG Retrieval module
 */
import { FirestoreEntity } from '../../../types/google-cloud.types';

/**
 * Document type enum
 */
export enum DocumentType {
  PDF = 'pdf',
  TEXT = 'text',
  HTML = 'html',
  MARKDOWN = 'markdown',
  JSON = 'json',
  CSV = 'csv',
  DOCX = 'docx',
  XLSX = 'xlsx',
  PPTX = 'pptx',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  OTHER = 'other',
}

/**
 * Document status enum
 */
export enum DocumentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  INDEXED = 'indexed',
  FAILED = 'failed',
  DELETED = 'deleted',
}

/**
 * Document chunk model
 */
export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
  index: number;
  tokenCount: number;
}

/**
 * Embedding provider type
 */
export enum EmbeddingProviderType {
  OPENAI = 'openai',
  VERTEX_AI = 'vertex_ai',
  AZURE = 'azure',
  COHERE = 'cohere',
  HUGGINGFACE = 'huggingface',
  CUSTOM = 'custom',
}

/**
 * Vector search result interface
 */
export interface VectorSearchResult {
  documentId: string;
  documentType: DocumentType;
  title: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
  chunkContent?: string;
  url?: string;
}

/**
 * Document search query parameters
 */
export interface DocumentSearchQuery {
  query: string;
  organizationId: string;
  limit?: number;
  offset?: number;
  documentTypes?: DocumentType[];
  metadata?: Record<string, any>;
  minScore?: number;
  includeChunkContent?: boolean;
}

/**
 * Document chunking options
 */
export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separator?: string;
  metadataToInclude?: string[];
}

/**
 * Document processing result
 */
export interface DocumentProcessingResult {
  documentId: string;
  chunks: number;
  tokens: number;
  processedPages: number;
  totalPages: number;
  status: DocumentStatus;
  error?: string;
}