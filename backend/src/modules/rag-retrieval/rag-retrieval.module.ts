import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Configuration
import { FirestoreConfigService } from '../../config/firestore.config';

// Controllers
import { DocumentController } from './controllers/document.controller';
import { EmbeddingProviderController } from './controllers/embedding-provider.controller';

// Services
import { DocumentService } from './services/document.service';
import { EmbeddingService } from './services/embedding.service';
import { DocumentChunkingService } from './services/document-chunking.service';

// Repositories
import { DocumentRepository } from './repositories/document.repository';
import { EmbeddingProviderRepository } from './repositories/embedding-provider.repository';

/**
 * RAG Retrieval Module
 * 
 * Provides functionality for document management, chunking, embedding, and retrieval.
 */
@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [
    DocumentController,
    EmbeddingProviderController,
  ],
  providers: [
    // Configuration
    FirestoreConfigService,
    
    // Repositories
    DocumentRepository,
    EmbeddingProviderRepository,
    
    // Services
    DocumentService,
    EmbeddingService,
    DocumentChunkingService,
  ],
  exports: [
    DocumentService,
    EmbeddingService,
    DocumentChunkingService,
  ],
})
export class RagRetrievalModule {}