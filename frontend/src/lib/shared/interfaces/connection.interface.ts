/**
 * Connection interfaces for the Shared module
 * This file provides interfaces for connection services that both 
 * UI and Motion modules can use without direct dependencies
 */

import { ConnectionQualityResult } from '../types/sa-market-types';

/**
 * Connection service interface
 * Provides a common interface for working with connection information
 */
export interface IConnectionService {
  /**
   * Get the current connection quality
   */
  getConnectionQuality(): ConnectionQualityResult;
  
  /**
   * Check if the system is in a save-data mode
   */
  isDataSaverEnabled(): boolean;
  
  /**
   * Subscribe to connection quality changes
   * @param callback Function to call when connection quality changes
   * @returns Function to unsubscribe
   */
  subscribeToConnectionChanges(
    callback: (quality: ConnectionQualityResult) => void
  ): () => void;
  
  /**
   * Get information about the current connection
   */
  getConnectionInfo(): {
    type?: string;
    downlink?: number;
    rtt?: number;
    effectiveType?: string;
    saveData?: boolean;
  };
}