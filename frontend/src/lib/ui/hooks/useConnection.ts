'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  IConnectionService,
  ConnectionQualityResult
} from '../../shared/services/connection-service.interface';
import { SERVICE_KEYS } from '../../shared/services/service-registry';
import { useService } from '../../shared/providers/service-provider';

/**
 * Safely get the connection service, either from context or a fallback
 * @returns Connection service
 */
function getConnectionService(): IConnectionService {
  try {
    // Try to get from context - this will be defined if the ServiceProvider is used
    return useService<IConnectionService>(SERVICE_KEYS.CONNECTION_SERVICE);
  } catch (error) {
    // If we're not in a ServiceProvider, try to import the default implementation
    try {
      // Dynamic import to avoid circular dependencies
      const { defaultConnectionService } = require('../../motion/services/connection-service.impl');
      return defaultConnectionService;
    } catch (e) {
      // If all else fails, throw a meaningful error
      throw new Error(
        'Connection service not available. Make sure to either use ServiceProvider ' +
        'or import the implementation directly.'
      );
    }
  }
}

/**
 * Hook to get current connection quality information
 * This implementation avoids direct circular dependencies by accessing
 * the connection service through the service registry
 */
export function useConnectionQuality(): ConnectionQualityResult {
  const connectionService = getConnectionService();
  const [quality, setQuality] = useState<ConnectionQualityResult>(
    connectionService.getConnectionQuality()
  );

  useEffect(() => {
    // Subscribe to connection quality changes
    const unsubscribe = connectionService.subscribeToConnectionChanges(
      (newQuality) => setQuality(newQuality)
    );

    // Unsubscribe when component unmounts
    return unsubscribe;
  }, [connectionService]);

  return quality;
}

/**
 * Hook to check if data saver mode is enabled
 */
export function useDataSaverMode(): boolean {
  const connectionService = getConnectionService();
  const [isDataSaver, setIsDataSaver] = useState<boolean>(() => 
    connectionService.isDataSaverEnabled()
  );
  
  useEffect(() => {
    // Initial check
    setIsDataSaver(connectionService.isDataSaverEnabled());
    
    // Subscribe to changes
    const unsubscribe = connectionService.subscribeToConnectionChanges(
      (quality) => setIsDataSaver(quality.isDataSaver)
    );
    
    return unsubscribe;
  }, [connectionService]);
  
  return isDataSaver;
}

/**
 * Hook for network-aware component rendering
 * Allows components to adapt based on network conditions
 */
export function useNetworkAware<T>(options: {
  highQuality: T,
  mediumQuality: T,
  lowQuality: T,
  poorQuality: T,
  dataSaverMode?: T
}): T {
  const { 
    highQuality, 
    mediumQuality, 
    lowQuality, 
    poorQuality,
    dataSaverMode 
  } = options;
  
  const connectionQuality = useConnectionQuality();
  
  // If in data saver mode and a specific value is provided, use that
  if (dataSaverMode !== undefined && connectionQuality.isDataSaver) {
    return dataSaverMode;
  }
  
  // Otherwise select based on connection quality
  switch (connectionQuality.quality) {
    case 'high':
      return highQuality;
    case 'medium':
      return mediumQuality;
    case 'low':
      return lowQuality;
    case 'poor':
      return poorQuality;
    default:
      return mediumQuality; // Fallback to medium quality
  }
}

/**
 * Hook to determine if an element should be lazy loaded based on network conditions
 */
export function useShouldLazyLoad(priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'): boolean {
  const connectionQuality = useConnectionQuality();
  
  // Always lazy load in data saver mode except for critical content
  if (connectionQuality.isDataSaver && priority !== 'critical') {
    return true;
  }
  
  // For different connection qualities, determine based on priority
  switch (connectionQuality.quality) {
    case 'high':
      return priority === 'low';
    case 'medium':
      return priority === 'low' || priority === 'medium';
    case 'low':
    case 'poor':
      return priority !== 'critical';
    default:
      return true;
  }
}

/**
 * Hook to decide whether to load an image at full or reduced quality
 * based on network conditions
 */
export function useImageQuality(): {
  quality: 'low' | 'medium' | 'high';
  shouldLazyLoad: boolean;
  maxSizeKB: number;
} {
  const connectionQuality = useConnectionQuality();
  
  // Default values
  let quality: 'low' | 'medium' | 'high' = 'high';
  let shouldLazyLoad = false;
  let maxSizeKB = 1000;
  
  // Data saver mode overrides everything
  if (connectionQuality.isDataSaver) {
    return {
      quality: 'low',
      shouldLazyLoad: true,
      maxSizeKB: 50
    };
  }
  
  // Set based on connection quality
  switch (connectionQuality.quality) {
    case 'high':
      quality = 'high';
      shouldLazyLoad = false;
      maxSizeKB = 1000;
      break;
    case 'medium':
      quality = 'medium';
      shouldLazyLoad = true;
      maxSizeKB = 350;
      break;
    case 'low':
      quality = 'low';
      shouldLazyLoad = true;
      maxSizeKB = 150;
      break;
    case 'poor':
      quality = 'low';
      shouldLazyLoad = true;
      maxSizeKB = 80;
      break;
  }
  
  return { quality, shouldLazyLoad, maxSizeKB };
}