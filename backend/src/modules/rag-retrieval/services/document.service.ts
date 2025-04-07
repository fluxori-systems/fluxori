import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DocumentRepository } from '../repositories/document.repository';
import { Document } from '../models/document.schema';
import { 
  DocumentType, 
  DocumentStatus,
  ChunkingOptions
} from '../interfaces/types';

/**
 * DTO for creating a new document
 */
export interface CreateDocumentDto {
  organizationId: string;
  title: string;
  description?: string;
  fileName: string;
  fileType: string;
  documentType: DocumentType;
  url?: string;
  filePath: string;
  fileSize: number;
  pageCount?: number;
  isPublic?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
}

/**
 * DTO for updating a document
 */
export interface UpdateDocumentDto {
  title?: string;
  description?: string;
  status?: DocumentStatus;
  isPublic?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
}

/**
 * Service for Document operations
 */
@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  
  constructor(private readonly documentRepository: DocumentRepository) {}
  
  /**
   * Create a new document
   * @param createDocumentDto Document creation data
   * @returns Created document
   */
  async createDocument(createDocumentDto: CreateDocumentDto): Promise<Document> {
    this.logger.log(`Creating new document: ${createDocumentDto.title}`);
    
    const data = {
      ...createDocumentDto,
      status: DocumentStatus.PENDING,
      isIndexed: false,
      chunkCount: 0,
      tokenCount: 0,
      isPublic: createDocumentDto.isPublic || false,
      metadata: createDocumentDto.metadata || {},
    };
    
    return this.documentRepository.create(data);
  }
  
  /**
   * Find document by ID
   * @param id Document ID
   * @returns Document or throws if not found
   */
  async findById(id: string): Promise<Document> {
    const document = await this.documentRepository.findById(id);
    
    if (!document) {
      this.logger.warn(`Document with ID ${id} not found`);
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    
    return document;
  }
  
  /**
   * Find documents by organization ID
   * @param organizationId Organization ID
   * @returns Array of documents
   */
  async findByOrganization(organizationId: string): Promise<Document[]> {
    return this.documentRepository.findByOrganization(organizationId);
  }
  
  /**
   * Query documents with filters
   * @param params Query parameters
   * @returns Array of filtered documents
   */
  async findWithFilters(params: {
    organizationId?: string;
    documentType?: DocumentType;
    status?: DocumentStatus;
    isIndexed?: boolean;
    isPublic?: boolean;
    tags?: string[];
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Document[]> {
    return this.documentRepository.findWithFilters(params);
  }
  
  /**
   * Update a document
   * @param id Document ID
   * @param updateDocumentDto Update data
   * @returns Updated document
   */
  async updateDocument(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    this.logger.log(`Updating document with ID: ${id}`);
    
    const updated = await this.documentRepository.update(id, updateDocumentDto);
    
    if (!updated) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    
    return updated;
  }
  
  /**
   * Update document status
   * @param id Document ID
   * @param status New status
   * @param error Optional error message
   * @returns Updated document
   */
  async updateStatus(
    id: string,
    status: DocumentStatus,
    error?: string
  ): Promise<Document> {
    this.logger.log(`Updating document ${id} status to: ${status}`);
    
    const updated = await this.documentRepository.updateStatus(id, status, error);
    
    if (!updated) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    
    return updated;
  }
  
  /**
   * Mark document as indexed with chunk and token counts
   * @param id Document ID
   * @param chunkCount Number of chunks
   * @param tokenCount Number of tokens
   * @returns Updated document
   */
  async markAsIndexed(
    id: string,
    chunkCount: number,
    tokenCount: number
  ): Promise<Document> {
    this.logger.log(`Marking document ${id} as indexed with ${chunkCount} chunks and ${tokenCount} tokens`);
    
    const updated = await this.documentRepository.markAsIndexed(id, chunkCount, tokenCount);
    
    if (!updated) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    
    return updated;
  }
  
  /**
   * Delete a document
   * @param id Document ID
   * @returns Success indicator
   */
  async deleteDocument(id: string): Promise<boolean> {
    this.logger.log(`Deleting document with ID: ${id}`);
    
    // First update status to DELETED for consistency
    await this.updateStatus(id, DocumentStatus.DELETED);
    
    // Then perform the actual deletion
    const result = await this.documentRepository.delete(id);
    
    if (!result) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    
    return true;
  }
  
  /**
   * Find documents pending indexing for an organization
   * @param organizationId Organization ID
   * @param limit Maximum number to return
   * @returns Array of pending documents
   */
  async findPendingIndexing(
    organizationId: string,
    limit: number = 10
  ): Promise<Document[]> {
    return this.documentRepository.findPendingIndexing(organizationId, limit);
  }
  
  /**
   * Get document counts by status for an organization
   * @param organizationId Organization ID
   * @returns Counts by status
   */
  async getDocumentCounts(organizationId: string): Promise<Record<DocumentStatus, number>> {
    return this.documentRepository.countByStatus(organizationId);
  }
}