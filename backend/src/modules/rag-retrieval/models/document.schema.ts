/**
 * Document entity schema
 */
import { FirestoreEntity } from '../../../types/google-cloud.types';
import { DocumentType, DocumentStatus } from '../interfaces/types';

/**
 * Document entity for Firestore
 */
export interface Document extends FirestoreEntity {
  organizationId: string;
  title: string;
  description?: string;
  fileName: string;
  fileType: string;
  documentType: DocumentType;
  status: DocumentStatus;
  url?: string;
  filePath: string;
  fileSize: number;
  pageCount?: number;
  chunkCount: number;
  tokenCount: number;
  isIndexed: boolean;
  isPublic: boolean;
  metadata: Record<string, any>;
  tags?: string[];
  processingError?: string;
  lastIndexedAt?: Date;
  vectorStoreId?: string;
  embeddingModel?: string;
}