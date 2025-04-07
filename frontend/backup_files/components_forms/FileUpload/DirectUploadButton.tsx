import React, { useState, useRef } from 'react';
import { api } from '../../../api/apiClient';
import { FileUploadProgress } from './FileUploadProgress';

interface FileInfo {
  id: string;
  name: string;
  url: string;
  size?: number;
}

interface DirectUploadButtonProps {
  onUploadComplete: (fileInfo: FileInfo) => void;
  onUploadError?: (error: Error) => void;
  acceptedFileTypes?: string[];
  maxSizeBytes?: number;
  folder?: string;
  buttonText?: string;
  className?: string;
  entityType?: string;
  entityId?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const DirectUploadButton: React.FC<DirectUploadButtonProps> = ({
  onUploadComplete,
  onUploadError,
  acceptedFileTypes = ['image/*', 'application/pdf'],
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  folder = 'uploads',
  buttonText = 'Upload File',
  className = '',
  entityType,
  entityId,
  variant = 'primary',
  size = 'md',
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    outline: 'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'bg-transparent text-blue-600 hover:bg-blue-50',
  };

  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-2 px-4',
    lg: 'text-base py-3 px-6',
  };

  const handleClick = () => {
    if (!disabled && !uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size
    if (file.size > maxSizeBytes) {
      const error = new Error(`File size exceeds maximum allowed (${Math.round(maxSizeBytes / (1024 * 1024))}MB)`);
      onUploadError?.(error);
      return;
    }

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
      onUploadComplete(fileInfo);
      
      // If the file was uploaded and we have entity information, attach it to the entity
      if (entityType && entityId) {
        await api.storage.attachFileToEntity(fileId, entityType, entityId);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      onUploadError?.(error as Error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Build accept string for file input
  const acceptString = acceptedFileTypes.join(',');

  return (
    <div className={`direct-upload-button-container ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={acceptString}
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />
      
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || uploading}
        className={`rounded font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors
          ${variantClasses[variant]} ${sizeClasses[size]}
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {uploading ? 'Uploading...' : buttonText}
      </button>
      
      {uploading && (
        <div className="mt-3">
          <FileUploadProgress progress={uploadProgress} />
        </div>
      )}
    </div>
  );
};