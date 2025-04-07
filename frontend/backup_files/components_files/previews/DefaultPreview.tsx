import React from 'react';

interface DefaultPreviewProps {
  fileName: string;
  fileUrl: string;
  className?: string;
}

export const DefaultPreview: React.FC<DefaultPreviewProps> = ({
  fileName,
  fileUrl,
  className = '',
}) => {
  // Get file extension
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  // File icon based on extension
  const getFileIcon = () => {
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return (
        <svg className="h-16 w-16 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6zM8 7h2v2H8V7zm0 4h2v2H8v-2zm0 4h2v2H8v-2z"/>
        </svg>
      );
    }
    
    // Code files
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'java', 'c', 'cpp', 'rb', 'php'].includes(extension)) {
      return (
        <svg className="h-16 w-16 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6zM9.5 12l-1.5 1.5 1.5 1.5-1 1-2.5-2.5L8.5 11l1 1zm5 0l1.5 1.5-1.5 1.5 1 1 2.5-2.5L15.5 11l-1 1z"/>
        </svg>
      );
    }
    
    // Default file icon
    return (
      <svg className="h-16 w-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6zM16 16H8v-1h8v1zm0-3H8v-1h8v1z"/>
      </svg>
    );
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className={`default-preview flex flex-col items-center justify-center p-6 bg-gray-100 rounded-md ${className}`}>
      <div className="file-icon mb-3">
        {getFileIcon()}
      </div>
      
      <div className="file-info text-center">
        <span className="block text-sm font-medium text-gray-900 truncate max-w-full">
          {fileName}
        </span>
        
        <span className="block text-xs text-gray-500 mt-1">
          {extension.toUpperCase()} File
        </span>
      </div>
      
      <a 
        href={fileUrl}
        download={fileName}
        className="mt-4 inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Download
      </a>
    </div>
  );
};