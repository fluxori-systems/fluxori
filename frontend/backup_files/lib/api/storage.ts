import { apiClient } from './client';
import {
  FileMetadata,
  SignedUrlRequest,
  SignedUrlResponse,
  DownloadUrlRequest,
  DownloadUrlResponse,
  FileListParams,
  AttachFileRequest,
  FileOperationResponse,
} from './types/storage';

/**
 * Storage API endpoints
 */
export const storageApi = {
  /**
   * Get a signed URL for file upload
   */
  getSignedUploadUrl: async (params: SignedUrlRequest): Promise<SignedUrlResponse> => {
    return await apiClient.post<SignedUrlResponse>('/files/signed-url', params);
  },
  
  /**
   * Get a list of files
   */
  getFiles: async (params?: FileListParams): Promise<FileMetadata[]> => {
    return await apiClient.get<FileMetadata[]>('/files', { params });
  },
  
  /**
   * Delete a file
   */
  deleteFile: async (fileId: string): Promise<FileOperationResponse> => {
    return await apiClient.delete<FileOperationResponse>(`/files/${fileId}`);
  },
  
  /**
   * Attach a file to an entity
   */
  attachFileToEntity: async (params: AttachFileRequest): Promise<FileOperationResponse> => {
    const { fileId, entityType, entityId } = params;
    return await apiClient.post<FileOperationResponse>(`/files/${fileId}/attach`, {
      entityType,
      entityId,
    });
  },
  
  /**
   * Get a download URL for a file
   */
  getDownloadUrl: async (params: DownloadUrlRequest): Promise<DownloadUrlResponse> => {
    const { fileId, expiresInMinutes } = params;
    return await apiClient.get<DownloadUrlResponse>(`/files/${fileId}/download-url`, {
      params: { expiresInMinutes },
    });
  },
  
  /**
   * Get file metadata
   */
  getFileMetadata: async (fileId: string): Promise<FileMetadata> => {
    return await apiClient.get<FileMetadata>(`/files/${fileId}/metadata`);
  },
};