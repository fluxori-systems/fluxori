import React, { useState, useEffect } from 'react';
import { DocumentPreview } from './DocumentPreview';
import { ImagePreview } from './ImagePreview';
import { VideoPreview } from './VideoPreview';
import { AudioPreview } from './AudioPreview';
import { DefaultPreview } from './DefaultPreview';
import { api } from '../../../api/apiClient';

export interface FilePreviewProps {
  fileId: string;
  fileName?: string;
  fileUrl?: string;
  contentType?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showDownloadButton?: boolean;
  showFileName?: boolean;
  className?: string;
}

// Helper to determine file type from extension or content type
export const getFileType = (fileName: string, contentType?: string): 'image' | 'video' | 'audio' | 'document' | 'other' => {
  const extension = (fileName || '').split('.').pop()?.toLowerCase();
  
  // Image files
  if (
    contentType?.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension || '')
  ) {
    return 'image';
  }
  
  // Video files
  if (
    contentType?.startsWith('video/') ||
    ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(extension || '')
  ) {
    return 'video';
  }
  
  // Audio files
  if (
    contentType?.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extension || '')
  ) {
    return 'audio';
  }
  
  // Document files
  if (
    contentType?.includes('pdf') ||
    contentType?.includes('document') ||
    contentType?.includes('spreadsheet') ||
    contentType?.includes('presentation') ||
    ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv'].includes(extension || '')
  ) {
    return 'document';
  }
  
  // Default for other file types
  return 'other';
};

export const FilePreview: React.FC<FilePreviewProps> = ({
  fileId,
  fileName,
  fileUrl,
  contentType,
  size = 'md',
  showDownloadButton = true,
  showFileName = true,
  className = '',
}) => {
  const [loading, setLoading] = useState(!fileUrl);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    url: string;
    fileName: string;
    contentType?: string;
  } | null>(fileUrl ? { url: fileUrl, fileName: fileName || 'File' } : null);

  useEffect(() => {
    const fetchFileInfo = async () => {
      if (fileUrl) {
        return; // Skip fetching if URL is already provided
      }
      
      try {
        setLoading(true);
        const response = await api.storage.getDownloadUrl(fileId);
        setFileInfo({
          url: response.url,
          fileName: response.fileName || fileName || 'File',
          contentType: response.contentType || contentType,
        });
      } catch (err) {
        console.error('Error fetching file info:', err);
        setError('Failed to load file preview');
      } finally {
        setLoading(false);
      }
    };

    fetchFileInfo();
  }, [fileId, fileUrl, fileName, contentType]);

  // Size classes
  const sizeClasses = {
    sm: 'max-w-xs max-h-48',
    md: 'max-w-md max-h-80',
    lg: 'max-w-lg max-h-96',
    full: 'w-full h-full',
  };

  if (loading) {
    return (
      <div className={`file-preview-loading ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-md h-48 w-full"></div>
        {showFileName && (
          <div className="animate-pulse bg-gray-200 h-5 w-1/2 mt-2 rounded"></div>
        )}
      </div>
    );
  }

  if (error || !fileInfo) {
    return (
      <div className={`file-preview-error text-center p-4 border border-red-200 rounded-md ${className}`}>
        <p className="text-red-500">
          {error || 'Could not load file preview'}
        </p>
      </div>
    );
  }

  // Determine file type
  const fileType = getFileType(fileInfo.fileName, fileInfo.contentType);
  
  // Render appropriate preview component based on file type
  const renderPreview = () => {
    switch (fileType) {
      case 'image':
        return (
          <ImagePreview 
            url={fileInfo.url}
            fileName={fileInfo.fileName}
            className={sizeClasses[size]}
          />
        );
      case 'video':
        return (
          <VideoPreview 
            url={fileInfo.url}
            className={sizeClasses[size]}
          />
        );
      case 'audio':
        return (
          <AudioPreview 
            url={fileInfo.url}
            className={sizeClasses[size]}
          />
        );
      case 'document':
        return (
          <DocumentPreview 
            url={fileInfo.url}
            fileName={fileInfo.fileName}
            className={sizeClasses[size]}
          />
        );
      default:
        return (
          <DefaultPreview 
            fileName={fileInfo.fileName} 
            fileUrl={fileInfo.url}
            className={sizeClasses[size]}
          />
        );
    }
  };

  return (
    <div className={`file-preview ${className}`}>
      <div className="preview-container">
        {renderPreview()}
      </div>
      
      {showFileName && (
        <div className="file-name mt-2 text-sm text-gray-700 truncate">
          {fileInfo.fileName}
        </div>
      )}
      
      {showDownloadButton && (
        <a 
          href={fileInfo.url} 
          download={fileInfo.fileName}
          className="download-button mt-2 inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Download
        </a>
      )}
    </div>
  );
};