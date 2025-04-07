import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUploadProgress } from './FileUploadProgress';
import { api } from '../../../api/apiClient';
import { useAuth } from '../../../hooks/useAuth';

interface FileInfo {
  id: string;
  name: string;
  url: string;
  size?: number;
}

interface FileUploadProps {
  onUploadComplete: (fileInfo: FileInfo) => void;
  onUploadError?: (error: Error) => void;
  maxSizeBytes?: number;
  acceptedFileTypes?: string[];
  folder?: string;
  multiple?: boolean;
  className?: string;
  entityType?: string;
  entityId?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = ['image/*', 'application/pdf'],
  folder = 'uploads',
  multiple = false,
  className = '',
  entityType,
  entityId,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const { user, organization } = useAuth();

  const handleUpload = useCallback(async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Prepare metadata
      const metadata: Record<string, any> = {};
      
      if (entityType && entityId) {
        metadata.entityType = entityType;
        metadata.entityId = entityId;
      }
      
      // 1. Request signed URL from backend
      const { url, fileId, fields } = await api.storage.getSignedUploadUrl({
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        folder,
        metadata,
      });
      
      // 2. Prepare form data for direct upload
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', file);
      
      // 3. Upload directly to GCS with progress tracking
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });
      
      // Create a promise to handle the XHR response
      const uploadPromise = new Promise<FileInfo>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 204 || xhr.status === 200) {
            // Create public URL or signed URL for preview
            const bucketName = url.split('/')[2].split('.')[0];
            const fileUrl = `https://storage.googleapis.com/${bucketName}/${folder}/${fileId}-${file.name}`;
            
            const fileInfo = { 
              id: fileId, 
              name: file.name,
              url: fileUrl,
              size: file.size
            };
            
            resolve(fileInfo);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };
      });
      
      xhr.open('POST', url, true);
      xhr.send(formData);
      
      // Wait for the upload to complete
      const fileInfo = await uploadPromise;
      
      // Handle success
      setUploadedFiles(prev => [...prev, fileInfo]);
      onUploadComplete(fileInfo);
      
      // If the file was uploaded and we have entity information, attach it to the entity
      if (entityType && entityId) {
        await api.storage.attachFileToEntity(fileId, entityType, entityId);
      }
      
      setUploading(false);
      return fileInfo;
    } catch (error) {
      console.error('Upload failed:', error);
      onUploadError?.(error as Error);
      setUploading(false);
      throw error;
    }
  }, [folder, onUploadComplete, onUploadError, entityType, entityId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (multiple) {
        acceptedFiles.forEach(file => handleUpload(file));
      } else if (acceptedFiles.length > 0) {
        handleUpload(acceptedFiles[0]);
      }
    },
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxSizeBytes,
    multiple,
    disabled: uploading,
  });

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  // Define FileIcon component directly here for simplicity
  const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );

  // Define TrashIcon component
  const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  return (
    <div className={`file-upload-container ${className}`}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-500 font-medium">Drop files here...</p>
        ) : (
          <div className="upload-prompt space-y-2">
            <FileIcon />
            <p className="text-gray-700">Drag files here or click to select</p>
            <span className="text-xs text-gray-500">
              Max size: {Math.round(maxSizeBytes / (1024 * 1024))}MB
            </span>
          </div>
        )}
      </div>

      {uploading && (
        <div className="mt-4">
          <FileUploadProgress progress={uploadProgress} />
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Uploaded Files</h3>
          <div className="border rounded divide-y">
            {uploadedFiles.map(file => (
              <div key={file.id} className="p-3 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <FileIcon />
                  <span className="text-sm">{file.name}</span>
                </div>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-gray-100"
                  onClick={() => handleRemoveFile(file.id)}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};