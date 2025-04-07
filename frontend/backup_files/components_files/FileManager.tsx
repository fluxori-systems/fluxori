import React, { useState, useEffect } from 'react';
import { FilePreview, getFileType } from './previews/FilePreview';
import { DirectUploadButton } from '../forms/FileUpload';
import { api } from '../../api/apiClient';

interface FileInfo {
  id: string;
  name: string;
  url: string;
  size?: number;
  contentType?: string;
  createdAt?: string;
  entityType?: string;
  entityId?: string;
}

interface FileManagerProps {
  entityType?: string;
  entityId?: string;
  allowUpload?: boolean;
  allowDelete?: boolean;
  title?: string;
  emptyMessage?: string;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  className?: string;
  onFilesChange?: (files: FileInfo[]) => void;
}

export const FileManager: React.FC<FileManagerProps> = ({
  entityType,
  entityId,
  allowUpload = true,
  allowDelete = true,
  title = 'Files',
  emptyMessage = 'No files yet. Upload some files to get started.',
  maxFiles,
  acceptedFileTypes,
  className = '',
  onFilesChange,
}) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [entityType, entityId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (entityType) params.entityType = entityType;
      if (entityId) params.entityId = entityId;
      
      const filesData = await api.storage.getFiles(params);
      setFiles(filesData);
      
      // Notify parent component of files change
      if (onFilesChange) {
        onFilesChange(filesData);
      }
    } catch (err) {
      console.error('Error loading files:', err);
      setError('Failed to load files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = async (fileInfo: FileInfo) => {
    // Refresh the file list
    await loadFiles();
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!allowDelete) return;
    
    try {
      await api.storage.deleteFile(fileId);
      
      // Remove file from state
      setFiles((prevFiles) => {
        const updatedFiles = prevFiles.filter((file) => file.id !== fileId);
        
        // Notify parent component of files change
        if (onFilesChange) {
          onFilesChange(updatedFiles);
        }
        
        return updatedFiles;
      });
      
      // Deselect if this was the selected file
      if (selectedFile === fileId) {
        setSelectedFile(null);
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      // Show error but don't update state
    }
  };

  // Group files by type for better organization
  const groupedFiles = files.reduce((groups, file) => {
    const fileType = getFileType(file.name, file.contentType);
    if (!groups[fileType]) {
      groups[fileType] = [];
    }
    groups[fileType].push(file);
    return groups;
  }, {} as Record<string, FileInfo[]>);

  // Sort groups by priority (images first, then videos, etc.)
  const groupPriority = ['image', 'video', 'document', 'audio', 'other'];
  const sortedGroups = Object.keys(groupedFiles).sort(
    (a, b) => groupPriority.indexOf(a) - groupPriority.indexOf(b)
  );

  return (
    <div className={`file-manager ${className}`}>
      {title && (
        <div className="file-manager-header mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          
          {allowUpload && (!maxFiles || files.length < maxFiles) && (
            <DirectUploadButton
              onUploadComplete={handleUploadComplete}
              onUploadError={(err) => console.error('Upload error:', err)}
              acceptedFileTypes={acceptedFileTypes}
              entityType={entityType}
              entityId={entityId}
              buttonText="Upload File"
              size="sm"
              variant="primary"
            />
          )}
        </div>
      )}
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded-md"></div>
          <div className="h-24 bg-gray-200 rounded-md"></div>
        </div>
      ) : error ? (
        <div className="text-center p-4 border border-red-200 rounded-md">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={loadFiles}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Try Again
          </button>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center p-8 border border-gray-200 rounded-md">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" 
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            {emptyMessage}
          </p>
          
          {allowUpload && (
            <DirectUploadButton
              onUploadComplete={handleUploadComplete}
              onUploadError={(err) => console.error('Upload error:', err)}
              acceptedFileTypes={acceptedFileTypes}
              entityType={entityType}
              entityId={entityId}
              buttonText="Upload File"
              className="mt-4"
              size="md"
              variant="outline"
            />
          )}
        </div>
      ) : (
        <div className="file-manager-content">
          {/* If a file is selected for preview */}
          {selectedFile && (
            <div className="selected-file-preview mb-6 p-4 border border-gray-200 rounded-md">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-md font-medium">File Preview</h4>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex justify-center">
                <FilePreview 
                  fileId={selectedFile} 
                  size="lg"
                  showFileName={true}
                  showDownloadButton={true}
                />
              </div>
            </div>
          )}
          
          {/* File list grouped by type */}
          <div className="grid grid-cols-1 gap-6">
            {sortedGroups.map((fileType) => (
              <div key={fileType} className="file-group">
                <h4 className="text-sm font-medium text-gray-700 capitalize mb-2">
                  {fileType === 'other' ? 'Other Files' : `${fileType}s`}
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {groupedFiles[fileType].map((file) => (
                    <div key={file.id} className="file-item border border-gray-200 rounded-md overflow-hidden bg-white">
                      <div 
                        className="preview-container h-28 cursor-pointer"
                        onClick={() => setSelectedFile(file.id)}
                      >
                        <FilePreview 
                          fileId={file.id}
                          fileName={file.name}
                          fileUrl={file.url}
                          contentType={file.contentType}
                          size="sm"
                          showFileName={false}
                          showDownloadButton={false}
                          className="h-full w-full"
                        />
                      </div>
                      
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">
                            {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''}
                          </span>
                          
                          {allowDelete && (
                            <button 
                              onClick={() => handleDeleteFile(file.id)}
                              className="text-red-500 hover:text-red-700 text-xs"
                              title="Delete file"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};