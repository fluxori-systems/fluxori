import React, { useState } from 'react';

interface ImagePreviewProps {
  url: string;
  fileName: string;
  className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  url,
  fileName,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState(false);

  const handleClick = () => {
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
  };

  const handleError = () => {
    setError(true);
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-md ${className}`}>
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            Unable to load image
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`image-preview cursor-pointer rounded-md overflow-hidden ${className}`}
        onClick={handleClick}
      >
        <img 
          src={url} 
          alt={fileName} 
          className="object-contain w-full h-full"
          onError={handleError}
        />
      </div>

      {/* Expanded view / lightbox */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="max-w-4xl max-h-screen relative">
            <button 
              onClick={handleClose}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 focus:outline-none"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={url} 
              alt={fileName} 
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
};