'use client';

import { ConnectionQualityResult } from '../types/motion-types';

// Re-export to make it available to UI module
export type { ConnectionQualityResult };

/**
 * Interface for connection quality detection services
 * This abstraction allows for different implementations without creating circular dependencies
 */
export interface IConnectionService {
  /**
   * Get current connection quality information
   */
  getConnectionQuality(): ConnectionQualityResult;
  
  /**
   * Subscribe to connection quality changes
   * @param callback Function to call when connection quality changes
   * @returns Unsubscribe function
   */
  subscribeToConnectionChanges(
    callback: (quality: ConnectionQualityResult) => void
  ): () => void;
  
  /**
   * Check if data saver mode is enabled
   */
  isDataSaverEnabled(): boolean;
  
  /**
   * Check if the connection is metered
   */
  isConnectionMetered(): boolean;
}

/**
 * Context key for accessing the connection service
 * @internal
 */
export const CONNECTION_SERVICE_KEY = 'connectionService';

/**
 * React hook to access the connection service
 * This is a placeholder that gets implemented by the service provider
 * @returns The current connection service implementation
 */
export function useConnectionService(): IConnectionService {
  throw new Error('useConnectionService must be used within a ServiceProvider');
}