import React from 'react';

interface FileUploadProgressProps {
  progress: number;
  className?: string;
}

export const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  progress,
  className = '',
}) => {
  // Calculate color based on progress
  const getProgressColor = () => {
    if (progress < 40) return 'bg-blue-500';
    if (progress < 80) return 'bg-blue-600';
    return 'bg-blue-700';
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">Uploading...</span>
        <span className="text-sm font-medium text-gray-700">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${getProgressColor()} transition-all duration-300`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};