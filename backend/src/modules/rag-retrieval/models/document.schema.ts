/**
 * Document entity schema
 */
import { FirestoreEntityWithMetadata } from '../../../common/repositories/base/repository-types';
import { DocumentType, DocumentStatus } from '../interfaces/types';

/**
 * Document entity for Firestore
 */
export interface Document extends FirestoreEntityWithMetadata {
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

  // FirestoreEntityWithMetadata required fields
  isDeleted: boolean;
  deletedAt?: Date | null;
  version: number;
}
