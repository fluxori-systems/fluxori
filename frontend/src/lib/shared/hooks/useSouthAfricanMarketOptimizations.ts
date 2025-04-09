'use client';

import { useEffect, useState, useMemo } from 'react';
import type { ConnectionQualityResult, SADeviceProfile, SANetworkProfile, 
        SAPerformanceRecommendation, SouthAfricanMarketOptimizations,
        SA_CONNECTION_THRESHOLDS as TSA_CONNECTION_THRESHOLDS, 
        SAPerformanceThresholds } from '../interfaces';
import { useConnectionService } from '../services/connection-service.interface';

// Import the constants from the interfaces file
import { SA_CONNECTION_THRESHOLDS } from '../interfaces/connection.interface';

// Device detection logic to identify common South African devices
function detectSADeviceProfile(): SADeviceProfile {
  if (typeof navigator === 'undefined') {
    return 'MID_RANGE' as SADeviceProfile; // Default for SSR
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const memory = (navigator as any).deviceMemory || 4;
  
  // Feature phones often have Opera Mini or specific browser signatures
  if (userAgent.includes('opera mini') || userAgent.includes('kaios')) {
    return 'FEATURE_PHONE' as SADeviceProfile;
  }
  
  // Basic smartphones often have low memory and older Android versions
  if (memory <= 1 || userAgent.includes('android 5.') || userAgent.includes('android 6.')) {
    return 'BASIC' as SADeviceProfile;
  }
  
  // Entry-level devices (common in SA market)
  if (memory <= 2 || userAgent.includes('android 7.') || userAgent.includes('android 8.')) {
    return 'ENTRY_LEVEL' as SADeviceProfile;
  }
  
  // Mid-range devices (common in SA urban areas)
  if (memory <= 4 || userAgent.includes('android 9.') || userAgent.includes('android 10.')) {
    return 'MID_RANGE' as SADeviceProfile;
  }
  
  // Remaining are high-end devices
  return 'HIGH_END' as SADeviceProfile;
}

// Network detection logic to determine South African network profiles
function detectSANetworkProfile(connectionQuality: ConnectionQualityResult): SANetworkProfile {
  // Use connection quality from SA-calibrated connection quality assessment
  if (connectionQuality.isMetered) {
    return 'METERED_CONNECTION' as SANetworkProfile;
  }
  
  if (!connectionQuality.downlinkSpeed) {
    return 'PERI_URBAN' as SANetworkProfile; // Default if no data available
  }
  
  // High-end fiber connections (mostly in wealthy urban areas)
  if (connectionQuality.downlinkSpeed > 5 && connectionQuality.rtt && connectionQuality.rtt < 100) {
    return 'URBAN_FIBER' as SANetworkProfile;
  }
  
  // LTE connections (urban areas)
  if (connectionQuality.downlinkSpeed > 2 && connectionQuality.rtt && connectionQuality.rtt < 200) {
    return 'URBAN_LTE' as SANetworkProfile;
  }
  
  // Peri-urban connections (suburbs and smaller towns)
  if (connectionQuality.downlinkSpeed > 1) {
    return 'PERI_URBAN' as SANetworkProfile;
  }
  
  // Township connections (densely populated areas)
  if (connectionQuality.downlinkSpeed > 0.5) {
    return 'TOWNSHIP' as SANetworkProfile;
  }
  
  // Rural connections (low bandwidth, high latency)
  return 'RURAL' as SANetworkProfile;
}

// Generate recommendations based on device and network profiles
function generateRecommendations(deviceProfile: SADeviceProfile, networkProfile: SANetworkProfile): SAPerformanceRecommendation[] {
  const recommendations: SAPerformanceRecommendation[] = [];
  
  // Common recommendations for all profiles
  recommendations.push({
    type: 'important',
    name: 'Network-aware animations',
    description: 'Adjust animation complexity based on network quality',
    implemented: true // We've implemented this in our components
  });
  
  // Device-specific recommendations
  if (deviceProfile === 'FEATURE_PHONE' || deviceProfile === 'BASIC') {
    recommendations.push({
      type: 'critical',
      name: 'Minimal JavaScript',
      description: 'Reduce JavaScript usage for entry-level devices',
      implemented: true
    });
    
    recommendations.push({
      type: 'critical',
      name: 'Text-based alternatives',
      description: 'Provide text-based alternatives to interactive features',
      implemented: false
    });
  }
  
  // Network-specific recommendations
  if (networkProfile === 'RURAL' || networkProfile === 'TOWNSHIP') {
    recommendations.push({
      type: 'critical',
      name: 'Minimize requests',
      description: 'Combine resources to reduce HTTP requests',
      implemented: true
    });
    
    recommendations.push({
      type: 'important',
      name: 'Aggressive caching',
      description: 'Cache resources aggressively for offline use',
      implemented: true
    });
  }
  
  if (networkProfile === 'METERED_CONNECTION') {
    recommendations.push({
      type: 'critical',
      name: 'Data saver mode',
      description: 'Implement extreme data saving techniques',
      implemented: true
    });
  }
  
  return recommendations;
}

/**
 * Calculate latency adjustment based on profile in milliseconds
 * This simulates additional network latency for optimizations
 */
function calculateAdditionalLatency(networkProfile: SANetworkProfile): number {
  switch (networkProfile) {
    case 'RURAL':
      return 300;
    case 'TOWNSHIP':
      return 150;
    case 'PERI_URBAN':
      return 75;
    case 'URBAN_LTE':
      return 30;
    case 'URBAN_FIBER':
      return 0;
    case 'METERED_CONNECTION':
      return 100;
    default:
      return 50;
  }
}

/**
 * Hook that provides South African market-specific optimizations
 * Implements the dependency inversion pattern to avoid circular dependencies
 */
export function useSouthAfricanMarketOptimizations(): SouthAfricanMarketOptimizations {
  // Get connection service through the connection service interface
  const connectionService = useConnectionService();
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQualityResult>(
    connectionService.getConnectionQuality()
  );
  const [deviceProfile, setDeviceProfile] = useState<SADeviceProfile>('MID_RANGE' as SADeviceProfile);
  const [isClient, setIsClient] = useState(false);
  
  // Subscribe to connection changes
  useEffect(() => {
    const unsubscribe = connectionService.subscribeToConnectionChanges(
      (newQuality) => setConnectionQuality(newQuality)
    );
    
    return unsubscribe;
  }, [connectionService]);
  
  // Client-side only detection
  useEffect(() => {
    setIsClient(true);
    setDeviceProfile(detectSADeviceProfile());
  }, []);
  
  // Detect network profile
  const networkProfile = useMemo(() => 
    detectSANetworkProfile(connectionQuality), 
    [connectionQuality]
  );
  
  // Generate recommendations
  const recommendations = useMemo(() => 
    generateRecommendations(deviceProfile, networkProfile),
    [deviceProfile, networkProfile]
  );
  
  // Calculate additional latency
  const additionalLatencyMs = useMemo(() => 
    calculateAdditionalLatency(networkProfile),
    [networkProfile]
  );
  
  // Determine if rural connection (high latency, low bandwidth)
  const isRural = networkProfile === 'RURAL';
  
  // Flag for South African user - this would typically come from GeoIP detection
  // For this implementation, we're assuming all users are South African
  const isSouthAfrican = true;
  
  // Optimization flags
  const shouldReduceMotion = 
    deviceProfile === 'BASIC' || 
    deviceProfile === 'FEATURE_PHONE' || 
    networkProfile === 'RURAL';
    
  const shouldReduceDataUsage = 
    connectionQuality.isDataSaver || 
    connectionQuality.isMetered || 
    networkProfile === 'RURAL' || 
    networkProfile === 'TOWNSHIP' || 
    networkProfile === 'METERED_CONNECTION';
    
  const shouldReduceJavascript = 
    deviceProfile === 'BASIC' || 
    deviceProfile === 'FEATURE_PHONE';
    
  const shouldUseLowResImages = 
    shouldReduceDataUsage || 
    deviceProfile === 'BASIC' || 
    deviceProfile === 'FEATURE_PHONE';
    
  const shouldDeferNonEssential = 
    networkProfile !== 'URBAN_FIBER' || 
    deviceProfile === 'ENTRY_LEVEL' || 
    deviceProfile === 'BASIC';
    
  const shouldUsePlaceholders = 
    networkProfile === 'RURAL' || 
    networkProfile === 'TOWNSHIP';
  
  return {
    deviceProfile,
    networkProfile,
    isSouthAfrican,
    isRural,
    isMetered: connectionQuality.isMetered,
    recommendations,
    shouldReduceMotion,
    shouldReduceDataUsage,
    shouldReduceJavascript,
    shouldUseLowResImages,
    shouldDeferNonEssential,
    shouldUsePlaceholders,
    additionalLatencyMs
  };
}

// Alias for useSouthAfricanMarketOptimizations for older components
export const useSouthAfricanMarket = useSouthAfricanMarketOptimizations;

/**
 * Hook that provides performance thresholds calibrated for South African market
 */
export function useSAPerformanceThresholds(): SAPerformanceThresholds {
  const { networkProfile, deviceProfile } = useSouthAfricanMarketOptimizations();
  
  // Adjust animation duration based on network profile
  const getAnimationDuration = (baseDuration: number): number => {
    switch (networkProfile) {
      case 'RURAL':
        return baseDuration * 0.25; // 75% reduction
      case 'TOWNSHIP':
        return baseDuration * 0.4; // 60% reduction
      case 'PERI_URBAN':
        return baseDuration * 0.6; // 40% reduction
      case 'URBAN_LTE':
        return baseDuration * 0.8; // 20% reduction
      case 'METERED_CONNECTION':
        return baseDuration * 0.3; // 70% reduction
      default:
        return baseDuration;
    }
  };
  
  // Determine image quality based on network and device
  const getImageQuality = (): 'low' | 'medium' | 'high' => {
    if (deviceProfile === 'FEATURE_PHONE' || 
        deviceProfile === 'BASIC' ||
        networkProfile === 'RURAL') {
      return 'low';
    }
    
    if (deviceProfile === 'ENTRY_LEVEL' || 
        networkProfile === 'TOWNSHIP' ||
        networkProfile === 'METERED_CONNECTION') {
      return 'medium';
    }
    
    return 'high';
  };
  
  // Prioritization function for loading resources
  const prioritizeResource = (resource: string): 'critical' | 'high' | 'medium' | 'low' => {
    // Main content and UI elements are critical
    if (resource.includes('main') || resource.includes('layout') || resource.includes('text')) {
      return 'critical';
    }
    
    // Important functionality
    if (resource.includes('interactive') || resource.includes('function')) {
      return 'high';
    }
    
    // Enhancement features
    if (resource.includes('chart') || resource.includes('graph')) {
      return 'medium';
    }
    
    // Decorative elements
    return 'low';
  };
  
  return {
    getAnimationDuration,
    getImageQuality,
    prioritizeResource,
    connectionThresholds: SA_CONNECTION_THRESHOLDS
  };
}