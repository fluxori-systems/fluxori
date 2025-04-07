import React, { useState } from 'react';

interface VideoPreviewProps {
  url: string;
  className?: string;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  url,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  return (
    <div className={`video-preview relative ${className}`}>
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4zm0 0v4a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h8a2 2 0 012 2v2zm-8 6V8l4 3-4 3z" 
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500">
              Unable to load video
            </p>
          </div>
        </div>
      ) : (
        <video 
          src={url}
          className="w-full h-full rounded-md"
          controls
          preload="metadata"
          onLoadedData={handleLoadedData}
          onError={handleError}
          controlsList="nodownload"
        >
          Your browser does not support video playback.
        </video>
      )}
    </div>
  );
};