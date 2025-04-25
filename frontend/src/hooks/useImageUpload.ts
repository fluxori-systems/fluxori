/**
 * Image Upload Hook
 * 
 * Network-aware image upload with South African optimizations
 */
import { useState, useCallback } from 'react';

import { useNetworkStatus } from './useNetworkStatus';

interface UploadOptions {
  path?: string;
  filename?: string;
  compress?: boolean;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebP?: boolean;
  networkAware?: boolean;
  metadata?: Record<string, string>;
}

interface UploadResult {
  url: string;
  path: string;
  filename: string;
  size: number;
  contentType: string;
  uploadTime: number;
  metadata?: Record<string, string>;
}

/**
 * Network-aware image upload hook that optimizes for South African conditions
 */
export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const { connectionQuality, isOnline } = useNetworkStatus();
  
  /**
   * Upload image with network-aware optimizations
   */
  const uploadImage = useCallback(
    async (
      file: File,
      options: UploadOptions = {}
    ): Promise<UploadResult | null> => {
      if (!isOnline) {
        setError(new Error('Cannot upload image while offline'));
        return null;
      }
      
      const {
        path = 'images',
        filename = `${Date.now()}-${file.name}`,
        compress = true,
        maxSizeMB = 1,
        maxWidthOrHeight = 1920,
        useWebP = true,
        networkAware = true,
        metadata = {},
      } = options;
      
      setIsUploading(true);
      setProgress(0);
      setError(null);
      
      try {
        let processedFile = file;
        let contentType = file.type;
        
        // Apply network-aware compression settings
        if (compress) {
          let finalMaxSize = maxSizeMB;
          let finalMaxDimension = maxWidthOrHeight;
          
          // Adjust compression based on network quality
          if (networkAware) {
            switch (connectionQuality) {
              case 'critical':
              case 'poor':
                // Aggressive compression for poor connections
                finalMaxSize = Math.min(maxSizeMB, 0.3);
                finalMaxDimension = Math.min(maxWidthOrHeight, 800);
                break;
              case 'fair':
                // Medium compression for fair connections
                finalMaxSize = Math.min(maxSizeMB, 0.6);
                finalMaxDimension = Math.min(maxWidthOrHeight, 1200);
                break;
              case 'excellent':
              case 'good':
              default:
                // Use specified values for good connections
                break;
            }
          }
          
          // Using browser-native image compression techniques
          const img = new Image();
          const canvas = document.createElement('canvas');
          
          // Load image and resize
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
          });
          
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > finalMaxDimension || height > finalMaxDimension) {
            if (width > height) {
              height = Math.round((height * finalMaxDimension) / width);
              width = finalMaxDimension;
            } else {
              width = Math.round((width * finalMaxDimension) / height);
              height = finalMaxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Could not get canvas context');
          }
          
          // Draw image to canvas with new dimensions
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to WebP if browser supports it and option is enabled
          if (useWebP && canvas.toDataURL('image/webp').startsWith('data:image/webp')) {
            contentType = 'image/webp';
            
            // Convert canvas to blob with quality adjusted by connection
            const quality = connectionQuality === 'poor' || connectionQuality === 'critical' 
              ? 0.7 
              : connectionQuality === 'fair' 
                ? 0.8 
                : 0.9;
            
            processedFile = await new Promise<File>((resolve, reject) => {
              canvas.toBlob((blob) => {
                if (blob) {
                  // Create new file with WebP type
                  const newFilename = filename.replace(/\.[^/.]+$/, '.webp');
                  resolve(new File([blob], newFilename, { type: 'image/webp' }));
                } else {
                  reject(new Error('Canvas to Blob conversion failed'));
                }
              }, 'image/webp', quality);
            });
          } else {
            // Keep original format but compress
            const quality = connectionQuality === 'poor' || connectionQuality === 'critical' 
              ? 0.7 
              : connectionQuality === 'fair' 
                ? 0.8 
                : 0.9;
            
            processedFile = await new Promise<File>((resolve, reject) => {
              canvas.toBlob((blob) => {
                if (blob) {
                  resolve(new File([blob], filename, { type: file.type }));
                } else {
                  reject(new Error('Canvas to Blob conversion failed'));
                }
              }, file.type, quality);
            });
          }
          
          // Clean up object URL
          URL.revokeObjectURL(img.src);
        }
        
        // Calculate upload timeout based on connection quality
        const timeout = connectionQuality === 'poor' || connectionQuality === 'critical'
          ? 60000 // 1 minute for poor connections
          : connectionQuality === 'fair'
            ? 30000 // 30 seconds for fair connections
            : 15000; // 15 seconds for good connections
        
        // Prepare form data
        const formData = new FormData();
        formData.append('file', processedFile);
        formData.append('path', path);
        formData.append('filename', filename);
        
        // Add metadata
        if (Object.keys(metadata).length > 0) {
          formData.append('metadata', JSON.stringify(metadata));
        }
        
        // Add connection quality for server-side optimizations
        if (networkAware) {
          formData.append('connectionQuality', connectionQuality);
        }
        
        // Record start time for upload timing
        const startTime = Date.now();
        
        // Upload to server
        const response = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData,
          // Custom properties like timeout and onUploadProgress aren't supported in fetch
          // Using standard fetch API without them
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed with status ${response.status}`);
        }
        
        const result = await response.json();
        const uploadTime = Date.now() - startTime;
        
        return {
          ...result,
          uploadTime,
        };
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [connectionQuality, isOnline]
  );
  
  return {
    uploadImage,
    isUploading,
    progress,
    error,
    connectionQuality,
  };
}

export default useImageUpload;