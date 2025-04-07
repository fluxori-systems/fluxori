import React, { useState } from 'react';

interface AudioPreviewProps {
  url: string;
  className?: string;
}

export const AudioPreview: React.FC<AudioPreviewProps> = ({
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
    <div className={`audio-preview ${className}`}>
      <div className="p-4 bg-gray-100 rounded-md">
        <div className="audio-player-container">
          {isLoading && (
            <div className="flex items-center justify-center h-10 my-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
            </div>
          )}
          
          {error ? (
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <svg 
                  className="mx-auto h-10 w-10 text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 010-7.072m12.728 2.828a9 9 0 010-12.728" 
                  />
                </svg>
                <p className="mt-1 text-xs text-gray-500">
                  Unable to load audio
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <svg className="h-24 w-24 text-gray-500 mb-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <audio 
                className={`w-full ${isLoading ? 'hidden' : 'block'}`}
                controls
                preload="metadata"
                onLoadedData={handleLoadedData}
                onError={handleError}
                controlsList="nodownload"
              >
                <source src={url} />
                Your browser does not support audio playback.
              </audio>
            </>
          )}
        </div>
      </div>
    </div>
  );
};