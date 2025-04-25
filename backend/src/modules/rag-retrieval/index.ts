/**
 * RAG Retrieval Module Exports
 */

// Main module
export { RagRetrievalModule } from './rag-retrieval.module';

// Models
export { Document } from './models/document.schema';
export { EmbeddingProvider } from './models/embedding-provider.schema';

// Types
export {
  DocumentType,
  DocumentStatus,
  DocumentChunk,
  EmbeddingProviderType,
  VectorSearchResult,
  DocumentSearchQuery,
  ChunkingOptions,
  DocumentProcessingResult,
} from './interfaces/types';

// Services
export { DocumentService } from './services/document.service';
export { EmbeddingService } from './services/embedding.service';
export { DocumentChunkingService } from './services/document-chunking.service';

// Service DTOs
export {
  CreateDocumentDto,
  UpdateDocumentDto,
} from './services/document.service';

export {
  CreateEmbeddingProviderDto,
  UpdateEmbeddingProviderDto,
  EmbeddingResponse,
} from './services/embedding.service';

// Repositories
export { DocumentRepository } from './repositories/document.repository';
export { EmbeddingProviderRepository } from './repositories/embedding-provider.repository';
