import React, { useState } from 'react';

interface DocumentPreviewProps {
  url: string;
  fileName: string;
  className?: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  url,
  fileName,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const isPdf = fileName.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('.pdf');

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  // For PDFs, we can render an inline preview
  if (isPdf) {
    return (
      <div className={`document-preview relative ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        
        {error ? (
          <div className="flex items-center justify-center bg-gray-100 rounded-md h-full w-full">
            <div className="text-center p-4">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
              <p className="mt-2 text-sm text-gray-500">
                Unable to load document preview
              </p>
            </div>
          </div>
        ) : (
          <iframe 
            src={`${url}#toolbar=0`}
            className="w-full h-full min-h-[300px] rounded-md"
            onLoad={handleLoad}
            onError={handleError}
            title={fileName}
          />
        )}
      </div>
    );
  }

  // For other document types, show an icon and filename
  return (
    <div className={`document-preview flex flex-col items-center justify-center p-4 bg-gray-100 rounded-md ${className}`}>
      <div className="document-icon mb-3">
        {fileName.toLowerCase().endsWith('.doc') || fileName.toLowerCase().endsWith('.docx') ? (
          <svg className="h-16 w-16 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6zM9.5 14a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 2a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
          </svg>
        ) : fileName.toLowerCase().endsWith('.xls') || fileName.toLowerCase().endsWith('.xlsx') ? (
          <svg className="h-16 w-16 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6zM16 10H8v2h8v-2zm0 4H8v2h8v-2z"/>
          </svg>
        ) : fileName.toLowerCase().endsWith('.ppt') || fileName.toLowerCase().endsWith('.pptx') ? (
          <svg className="h-16 w-16 text-red-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6zM10 10h4a2 2 0 0 1 0 4h-2v2H8v-6h2zm2 2h2a.5.5 0 0 0 0-1h-2v1z"/>
          </svg>
        ) : (
          <svg className="h-16 w-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6zM16 10H8v2h8v-2zm0 4H8v2h8v-2z"/>
          </svg>
        )}
      </div>
      <span className="text-sm font-medium text-gray-900 truncate max-w-full">
        {fileName}
      </span>
      <a 
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
      >
        Open document
      </a>
    </div>
  );
};