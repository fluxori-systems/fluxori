import { Injectable, Logger } from '@nestjs/common';

import { DocumentChunk, ChunkingOptions } from '../interfaces/types';

/**
 * Service for document chunking operations
 */
@Injectable()
export class DocumentChunkingService {
  private readonly logger = new Logger(DocumentChunkingService.name);

  /**
   * Split text into chunks
   * @param documentId Document ID
   * @param text Text to split
   * @param options Chunking options
   * @returns Array of document chunks
   */
  splitTextIntoChunks(
    documentId: string,
    text: string,
    options: ChunkingOptions = {},
  ): DocumentChunk[] {
    const { chunkSize = 1000, chunkOverlap = 200, separator = '\n' } = options;

    if (chunkSize <= 0) {
      throw new Error('Chunk size must be positive');
    }

    if (chunkOverlap >= chunkSize) {
      throw new Error('Chunk overlap must be less than chunk size');
    }

    this.logger.log(
      `Splitting document ${documentId} into chunks (size: ${chunkSize}, overlap: ${chunkOverlap})`,
    );

    // Split text by separator
    const segments = text.split(separator);

    const chunks: DocumentChunk[] = [];
    let currentChunk = '';
    let currentChunkTokens = 0;
    let index = 0;

    for (const segment of segments) {
      // Skip empty segments
      if (!segment.trim()) continue;

      // Estimate token count (roughly 4 chars per token)
      const segmentTokens = Math.ceil(segment.length / 4);

      // If adding this segment would exceed the chunk size, create a new chunk
      if (currentChunk && currentChunkTokens + segmentTokens > chunkSize) {
        chunks.push({
          id: `${documentId}-${index}`,
          documentId,
          content: currentChunk.trim(),
          metadata: {},
          index,
          tokenCount: currentChunkTokens,
        });

        // Start a new chunk with overlap
        const words = currentChunk.split(' ');
        const overlapTokens = Math.min(chunkOverlap, currentChunkTokens);
        const overlapWords = Math.ceil(
          words.length * (overlapTokens / currentChunkTokens),
        );

        currentChunk =
          words.slice(-overlapWords).join(' ') + separator + segment;
        currentChunkTokens = Math.ceil(currentChunk.length / 4);
        index++;
      } else {
        // Add segment to current chunk
        currentChunk += (currentChunk ? separator : '') + segment;
        currentChunkTokens = Math.ceil(currentChunk.length / 4);
      }
    }

    // Add the final chunk if not empty
    if (currentChunk.trim()) {
      chunks.push({
        id: `${documentId}-${index}`,
        documentId,
        content: currentChunk.trim(),
        metadata: {},
        index,
        tokenCount: currentChunkTokens,
      });
    }

    this.logger.log(
      `Document ${documentId} split into ${chunks.length} chunks`,
    );
    return chunks;
  }

  /**
   * Estimate token count for text
   * @param text Text to estimate
   * @returns Estimated token count
   */
  estimateTokenCount(text: string): number {
    // Simplified estimation - approximately 4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Add metadata to chunks
   * @param chunks Document chunks
   * @param metadata Metadata to add
   * @param fieldsToInclude Fields to include from metadata
   * @returns Updated chunks
   */
  addMetadataToChunks(
    chunks: DocumentChunk[],
    metadata: Record<string, any>,
    fieldsToInclude?: string[],
  ): DocumentChunk[] {
    let selectedMetadata: Record<string, any> = {};

    // If fields are specified, only include those
    if (fieldsToInclude && fieldsToInclude.length > 0) {
      for (const field of fieldsToInclude) {
        if (metadata[field] !== undefined) {
          selectedMetadata[field] = metadata[field];
        }
      }
    } else {
      // Otherwise include all metadata
      selectedMetadata = { ...metadata };
    }

    // Update each chunk with metadata
    return chunks.map((chunk) => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        ...selectedMetadata,
        chunkIndex: chunk.index,
        totalChunks: chunks.length,
      },
    }));
  }
}
