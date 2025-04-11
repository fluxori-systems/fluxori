'use client';

import { useState, useEffect } from 'react';
import { IConnectionService } from '../../shared/services/connection-service.interface';
import { MotionMode } from '../../shared/types/motion-types';
import type { ConnectionQuality, ConnectionQualityResult } from '../../shared/types/sa-market-types';

// South African mobile network thresholds - these are intentionally conservative
// based on real-world testing in various South African regions
const CONNECTION_THRESHOLDS = {
  // Downlink speed thresholds in Mbps
  POOR_DOWNLINK: 0.5,   // Very slow (rural areas, 2G EDGE)
  LOW_DOWNLINK: 1.5,    // Slow (3G in congested areas)
  MEDIUM_DOWNLINK: 5.0, // Average (good 3G/weak 4G)
  
  // RTT thresholds in ms
  POOR_RTT: 600,  // Very high latency (rural areas)
  LOW_RTT: 400,   // High latency (weak signal)
  MEDIUM_RTT: 200, // Average latency
  
  // Update interval in ms (check every 5 seconds)
  UPDATE_INTERVAL: 5000,
};

/**
 * Implementation of the connection service interface
 * Provides network quality information optimized for South African conditions
 */
export class ConnectionServiceImpl implements IConnectionService {
  private connectionData: ConnectionQualityResult;
  private subscribers: Set<(quality: ConnectionQualityResult) => void> = new Set();
  private motionMode: MotionMode = 'full';
  private interval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Initialize with default values
    this.connectionData = {
      quality: 'medium', // Default to medium as a safe start
      isDataSaver: false,
      isMetered: false,
      saveData: false,
    };
    
    // Start monitoring if in browser environment
    if (typeof window !== 'undefined') {
      this.startMonitoring();
    }
  }
  
  /**
   * Set the current motion mode
   * This affects how connection quality is determined
   */
  public setMotionMode(mode: MotionMode): void {
    this.motionMode = mode;
    this.updateConnectionQuality();
  }
  
  /**
   * Get current connection quality information
   */
  public getConnectionQuality(): ConnectionQualityResult {
    return { ...this.connectionData };
  }
  
  /**
   * Subscribe to connection quality changes
   * @param callback Function to call when connection quality changes
   * @returns Unsubscribe function
   */
  public subscribeToConnectionChanges(
    callback: (quality: ConnectionQualityResult) => void
  ): () => void {
    this.subscribers.add(callback);
    
    // Immediately notify with current state
    callback(this.connectionData);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }
  
  /**
   * Check if data saver mode is enabled
   */
  public isDataSaverEnabled(): boolean {
    return this.connectionData.isDataSaver;
  }
  
  /**
   * Check if the connection is metered
   */
  public isConnectionMetered(): boolean {
    return this.connectionData.isMetered;
  }
  
  /**
   * Start monitoring connection quality
   */
  private startMonitoring(): void {
    // Initial detection
    this.updateConnectionQuality();
    
    // Setup periodic monitoring
    this.interval = setInterval(() => {
      this.updateConnectionQuality();
    }, CONNECTION_THRESHOLDS.UPDATE_INTERVAL);
    
    // Change detection if supported
    const connection = (navigator as any).connection;
    if (connection) {
      const handleConnectionChange = () => {
        this.updateConnectionQuality();
      };
      
      connection.addEventListener('change', handleConnectionChange);
    }
  }
  
  /**
   * Stop monitoring connection quality
   */
  public stopMonitoring(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    const connection = (navigator as any).connection;
    if (connection) {
      connection.removeEventListener('change', this.updateConnectionQuality);
    }
  }
  
  /**
   * Update connection quality information
   */
  private updateConnectionQuality(): void {
    const newData = this.detectConnectionQuality();
    
    // Check if data has changed
    const hasChanged = 
      newData.quality !== this.connectionData.quality ||
      newData.isDataSaver !== this.connectionData.isDataSaver ||
      newData.isMetered !== this.connectionData.isMetered;
    
    // Update current data
    this.connectionData = newData;
    
    // Notify subscribers if data has changed
    if (hasChanged) {
      this.notifySubscribers();
    }
  }
  
  /**
   * Notify all subscribers of connection quality changes
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      callback(this.connectionData);
    });
  }
  
  /**
   * Detect current connection quality
   * @returns Connection quality information
   */
  private detectConnectionQuality(): ConnectionQualityResult {
    // Navigator Connection API support check
    const connection = (navigator as any).connection;
    const hasConnectionAPI = typeof connection !== 'undefined';
    
    // Base result
    const result: ConnectionQualityResult = {
      quality: 'medium', // Default
      isDataSaver: false,
      isMetered: false,
      saveData: false,
    };
    
    // Get motion mode quality floor
    if (this.motionMode === 'minimal') {
      result.quality = 'poor';
    } else if (this.motionMode === 'reduced') {
      result.quality = 'low';
    }
    
    // If Connection API is not available, use motionMode-based fallback
    if (!hasConnectionAPI) {
      return result;
    }
    
    // Get raw values from Connection API
    result.downlinkSpeed = connection.downlink;
    result.rtt = connection.rtt;
    result.effectiveType = connection.effectiveType;
    result.isDataSaver = !!connection.saveData;
    result.isMetered = !!connection.metered;
    
    // Calculate quality based on network conditions
    
    // Data saver mode is active - treat as poor connection
    if (result.isDataSaver) {
      result.quality = 'poor';
      return result;
    }
    
    // Explicit effective connection type from the browser
    if (connection.effectiveType) {
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        result.quality = 'poor';
        return result;
      }
      
      if (connection.effectiveType === '3g') {
        result.quality = 'low';
        // Continue with more specific checks
      }
      
      if (connection.effectiveType === '4g') {
        result.quality = 'medium';
        // Continue with more specific checks
      }
    }
    
    // Check RTT if available - high priority for South African conditions
    // where latency is often more limiting than bandwidth
    if (typeof connection.rtt === 'number' && connection.rtt > 0) {
      if (connection.rtt >= CONNECTION_THRESHOLDS.POOR_RTT) {
        result.quality = 'poor';
        return result;
      }
      
      if (connection.rtt >= CONNECTION_THRESHOLDS.LOW_RTT) {
        result.quality = 'low';
        // RTT indicates low, continue checking downlink
      } else if (connection.rtt >= CONNECTION_THRESHOLDS.MEDIUM_RTT) {
        // RTT indicates medium, continue checking downlink
        if (result.quality !== 'low') {
          result.quality = 'medium';
        }
      } else {
        // RTT indicates good connection
        if (result.quality !== 'low' && result.quality !== 'poor') {
          result.quality = 'high';
        }
      }
    }
    
    // Check downlink speed if available
    if (typeof connection.downlink === 'number' && connection.downlink > 0) {
      if (connection.downlink <= CONNECTION_THRESHOLDS.POOR_DOWNLINK) {
        result.quality = 'poor';
        return result;
      }
      
      if (connection.downlink <= CONNECTION_THRESHOLDS.LOW_DOWNLINK) {
        // Don't upgrade from poor, but set to low otherwise
        if (result.quality !== 'poor') {
          result.quality = 'low';
        }
      } else if (connection.downlink <= CONNECTION_THRESHOLDS.MEDIUM_DOWNLINK) {
        // Don't upgrade from poor/low, but set to medium otherwise
        if (result.quality !== 'poor' && result.quality !== 'low') {
          result.quality = 'medium';
        }
      } else {
        // Don't upgrade from poor/low/medium, but set to high otherwise
        if (result.quality !== 'poor' && result.quality !== 'low' && result.quality !== 'medium') {
          result.quality = 'high';
        }
      }
    }
    
    return result;
  }
}

/**
 * Default implementation of the connection service
 */
export const defaultConnectionService = new ConnectionServiceImpl();