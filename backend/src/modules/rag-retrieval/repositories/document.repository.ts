import { Injectable, Logger } from '@nestjs/common';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { Document } from '../models/document.schema';
import { DocumentStatus, DocumentType } from '../interfaces/types';

/**
 * Repository for Document entities
 */
@Injectable()
export class DocumentRepository extends FirestoreBaseRepository<Document> {
  // Collection name in Firestore
  protected readonly collectionName = 'documents';
  
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 5 * 60 * 1000, // 5 minutes
      requiredFields: ['organizationId', 'title', 'documentType', 'status'],
    });
  }
  
  /**
   * Find documents by organization ID
   * @param organizationId Organization ID
   * @returns Array of documents
   */
  async findByOrganization(organizationId: string): Promise<Document[]> {
    return this.findAll({ organizationId });
  }
  
  /**
   * Find documents by type
   * @param documentType Document type
   * @returns Array of documents
   */
  async findByType(documentType: DocumentType): Promise<Document[]> {
    return this.findAll({ documentType });
  }
  
  /**
   * Find documents by status
   * @param status Document status
   * @returns Array of documents
   */
  async findByStatus(status: DocumentStatus): Promise<Document[]> {
    return this.findAll({ status });
  }
  
  /**
   * Find documents with advanced filtering
   * @param params Query parameters
   * @returns Array of documents
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
    // Start with basic filter object
    const filter: Partial<Document> = {};
    
    // Add equality filters
    if (params.organizationId) filter.organizationId = params.organizationId;
    if (params.documentType) filter.documentType = params.documentType;
    if (params.status) filter.status = params.status;
    if (params.isIndexed !== undefined) filter.isIndexed = params.isIndexed;
    if (params.isPublic !== undefined) filter.isPublic = params.isPublic;
    
    // Basic query options
    const options = {
      orderBy: 'createdAt' as keyof Document,
      direction: 'desc' as 'asc' | 'desc',
      limit: params.limit,
      offset: params.offset
    };
    
    // Execute the query
    let documents = await this.findAll(filter, options);
    
    // Apply post-query filters that can't be done in Firestore directly
    if (params.tags && params.tags.length > 0) {
      const tagsToCheck = params.tags;
      documents = documents.filter(doc => {
        if (!doc.tags) return false;
        const docTags = doc.tags;
        return tagsToCheck.some(tag => docTags.includes(tag));
      });
    }
    
    // Date filtering
    if (params.fromDate) {
      const fromDate = new Date(params.fromDate);
      documents = documents.filter(doc => {
        const createdAt = doc.createdAt instanceof Date 
          ? doc.createdAt 
          : new Date(doc.createdAt as any);
        return createdAt >= fromDate;
      });
    }
    
    if (params.toDate) {
      const toDate = new Date(params.toDate);
      documents = documents.filter(doc => {
        const createdAt = doc.createdAt instanceof Date 
          ? doc.createdAt 
          : new Date(doc.createdAt as any);
        return createdAt <= toDate;
      });
    }
    
    return documents;
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
  ): Promise<Document | null> {
    const updates: Partial<Document> = { status };
    
    if (error) {
      updates.processingError = error;
    }
    
    if (status === DocumentStatus.INDEXED) {
      updates.lastIndexedAt = new Date();
    }
    
    return this.update(id, updates);
  }
  
  /**
   * Mark document as indexed
   * @param id Document ID
   * @param chunkCount Number of chunks
   * @param tokenCount Number of tokens
   * @returns Updated document
   */
  async markAsIndexed(
    id: string,
    chunkCount: number,
    tokenCount: number
  ): Promise<Document | null> {
    return this.update(id, {
      status: DocumentStatus.INDEXED,
      isIndexed: true,
      chunkCount,
      tokenCount,
      lastIndexedAt: new Date()
    });
  }
  
  /**
   * Find documents that need indexing
   * @param organizationId Organization ID
   * @param limit Maximum number to return
   * @returns Array of documents
   */
  async findPendingIndexing(
    organizationId: string,
    limit: number = 10
  ): Promise<Document[]> {
    return this.findWithFilters({
      organizationId,
      status: DocumentStatus.PENDING,
      isIndexed: false,
      limit
    });
  }
  
  /**
   * Count documents by status for an organization
   * @param organizationId Organization ID
   * @returns Count by status
   */
  async countByStatus(
    organizationId: string
  ): Promise<Record<DocumentStatus, number>> {
    const documents = await this.findByOrganization(organizationId);
    
    // Initialize counts
    const counts: Record<string, number> = {};
    Object.values(DocumentStatus).forEach(status => {
      counts[status] = 0;
    });
    
    // Count by status
    documents.forEach(doc => {
      counts[doc.status] = (counts[doc.status] || 0) + 1;
    });
    
    return counts as Record<DocumentStatus, number>;
  }
}