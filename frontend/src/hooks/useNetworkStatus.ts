/**
 * Network Status Hook
 * 
 * Optimized for South African network conditions with load-shedding awareness
 */
import { useState, useEffect, useCallback } from 'react';

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'critical' | 'offline';

export interface NetworkStatus {
  isOnline: boolean;
  connectionQuality: ConnectionQuality;
  bandwidth?: number;
  latency?: number;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  saveData?: boolean;
  possibleLoadShedding?: boolean;
}

/**
 * Default connection settings for South African networks
 */
const SA_NETWORK_SETTINGS = {
  // Timeouts for different connection qualities (ms)
  timeouts: {
    excellent: 10000,
    good: 15000,
    fair: 20000,
    poor: 30000,
    critical: 40000,
    offline: 5000,
  },
  
  // Bandwidth estimates by connection type (Mbps)
  bandwidthEstimates: {
    '4g': 10,
    '3g': 2,
    '2g': 0.3,
    'slow-2g': 0.1,
  },
  
  // Connection quality thresholds by RTT (ms)
  qualityThresholds: {
    excellent: 100,  // Fiber/good LTE
    good: 200,       // LTE/stable connection
    fair: 400,       // 3G/unstable LTE
    poor: 700,       // 2G/very unstable
    critical: 1000,  // Barely connected
  },
};

/**
 * Hook for monitoring network status with South African market optimizations
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionQuality: 'good', // Assume good by default
  });
  
  /**
   * Check for possible load shedding based on connection patterns
   */
  const checkForLoadShedding = useCallback(() => {
    // Count disconnection events in the last hour
    const now = Date.now();
    const disconnectionEvents = sessionStorage.getItem('network_disconnections');
    
    if (disconnectionEvents) {
      try {
        const events = JSON.parse(disconnectionEvents);
        const recentEvents = events.filter((time: number) => now - time < 3600000);
        
        // If we had more than 2 disconnection events in the last hour, 
        // it might be load shedding
        return recentEvents.length >= 2;
      } catch (e) {
        return false;
      }
    }
    
    return false;
  }, []);
  
  /**
   * Log a network disconnection event
   */
  const logDisconnection = useCallback(() => {
    const now = Date.now();
    const events = JSON.parse(sessionStorage.getItem('network_disconnections') || '[]');
    events.push(now);
    
    // Keep only events from the last 24 hours
    const recentEvents = events.filter((time: number) => now - time < 86400000);
    sessionStorage.setItem('network_disconnections', JSON.stringify(recentEvents));
  }, []);
  
  /**
   * Estimate network quality based on various factors
   */
  const estimateNetworkQuality = useCallback((): ConnectionQuality => {
    if (typeof navigator === 'undefined') return 'good';
    
    if (!navigator.onLine) return 'offline';
    
    // Check for Network Information API
    const connection = (navigator as any).connection;
    
    if (connection) {
      // Data saver is enabled - likely a constrained connection
      if (connection.saveData) {
        return 'poor';
      }
      
      // Use effective type to determine quality
      if (connection.effectiveType) {
        switch (connection.effectiveType) {
          case '4g':
            return connection.rtt < SA_NETWORK_SETTINGS.qualityThresholds.good ? 'excellent' : 'good';
          case '3g':
            return 'fair';
          case '2g':
            return 'poor';
          case 'slow-2g':
            return 'critical';
          default:
            return 'fair';
        }
      }
      
      // Use RTT if available
      if (connection.rtt) {
        if (connection.rtt < SA_NETWORK_SETTINGS.qualityThresholds.excellent) return 'excellent';
        if (connection.rtt < SA_NETWORK_SETTINGS.qualityThresholds.good) return 'good';
        if (connection.rtt < SA_NETWORK_SETTINGS.qualityThresholds.fair) return 'fair';
        if (connection.rtt < SA_NETWORK_SETTINGS.qualityThresholds.poor) return 'poor';
        if (connection.rtt < SA_NETWORK_SETTINGS.qualityThresholds.critical) return 'critical';
        return 'critical';
      }
      
      // Use downlink if available
      if (connection.downlink) {
        if (connection.downlink > 10) return 'excellent';
        if (connection.downlink > 5) return 'good';
        if (connection.downlink > 2) return 'fair';
        if (connection.downlink > 0.5) return 'poor';
        return 'critical';
      }
    }
    
    // Default to fair if we can't determine
    return 'fair';
  }, []);
  
  /**
   * Update network status
   */
  const updateNetworkStatus = useCallback(() => {
    const connection = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const connectionQuality = estimateNetworkQuality();
    const possibleLoadShedding = checkForLoadShedding();
    
    setStatus({
      isOnline,
      connectionQuality,
      bandwidth: connection?.downlink,
      latency: connection?.rtt,
      effectiveType: connection?.effectiveType,
      saveData: connection?.saveData,
      possibleLoadShedding,
    });
    
    // If we went offline, log a disconnection event
    if (!isOnline) {
      logDisconnection();
    }
  }, [checkForLoadShedding, estimateNetworkQuality, logDisconnection]);
  
  useEffect(() => {
    // Initialize sessionStorage for disconnection tracking if needed
    if (typeof window !== 'undefined' && !sessionStorage.getItem('network_disconnections')) {
      sessionStorage.setItem('network_disconnections', '[]');
    }
    
    // Update the status right away
    updateNetworkStatus();
    
    // Set up event listeners for online/offline events
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    // Listen for connection changes if the API is available
    const connection = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }
    
    // Set up periodic checks
    const intervalId = setInterval(updateNetworkStatus, 30000);
    
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
      
      clearInterval(intervalId);
    };
  }, [updateNetworkStatus]);
  
  return status;
}

export default useNetworkStatus;