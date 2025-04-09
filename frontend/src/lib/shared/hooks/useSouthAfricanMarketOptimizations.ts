'use client';

import { useEffect, useState, useMemo } from 'react';
import { useConnectionQuality } from '../../ui/hooks/useConnection';

/**
 * Regional connection quality thresholds for South Africa
 * These are calibrated specifically for the South African market
 * where connectivity can vary significantly between urban and rural areas
 */
export const SA_CONNECTION_THRESHOLDS = {
  // South Africa has limited 5G and primarily relies on 4G/LTE
  HIGH_SPEED: 2.5, // 2.5 Mbps+ considered good in SA
  MEDIUM_SPEED: 1.0, // 1.0-2.5 Mbps common in urban areas
  LOW_SPEED: 0.5, // 0.5-1.0 Mbps common in many townships/peri-urban
  POOR_SPEED: 0.2, // Below 0.5 Mbps common in rural areas
  
  // Round-trip time thresholds (ms)
  GOOD_RTT: 150, // Good experience for most apps
  MEDIUM_RTT: 300, // Acceptable for most applications
  POOR_RTT: 450, // Challenging for interactive applications
  VERY_POOR_RTT: 600, // Very difficult for real-time applications
};

/**
 * Device profiles common in the South African market
 */
export enum SADeviceProfile {
  HIGH_END = 'high-end',
  MID_RANGE = 'mid-range',
  ENTRY_LEVEL = 'entry-level',
  BASIC = 'basic',
  FEATURE_PHONE = 'feature-phone'
}

/**
 * Network profiles common in the South African market
 */
export enum SANetworkProfile {
  URBAN_FIBER = 'urban-fiber',
  URBAN_LTE = 'urban-lte',
  PERI_URBAN = 'peri-urban',
  TOWNSHIP = 'township',
  RURAL = 'rural',
  METERED_CONNECTION = 'metered-connection'
}

/**
 * Performance recommendations for South African market
 */
export interface SAPerformanceRecommendation {
  type: 'critical' | 'important' | 'suggested';
  name: string;
  description: string;
  implemented: boolean;
}

/**
 * South African market optimizations result
 */
export interface SouthAfricanMarketOptimizations {
  deviceProfile: SADeviceProfile;
  networkProfile: SANetworkProfile;
  isSouthAfrican: boolean;
  isRural: boolean;
  isMetered: boolean;
  recommendations: SAPerformanceRecommendation[];
  shouldReduceMotion: boolean;
  shouldReduceDataUsage: boolean;
  shouldReduceJavascript: boolean;
  shouldUseLowResImages: boolean;
  shouldDeferNonEssential: boolean;
  shouldUsePlaceholders: boolean;
  additionalLatencyMs: number;
}

// Device detection logic to identify common South African devices
function detectSADeviceProfile(): SADeviceProfile {
  if (typeof navigator === 'undefined') {
    return SADeviceProfile.MID_RANGE; // Default for SSR
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const memory = (navigator as any).deviceMemory || 4;
  
  // Feature phones often have Opera Mini or specific browser signatures
  if (userAgent.includes('opera mini') || userAgent.includes('kaios')) {
    return SADeviceProfile.FEATURE_PHONE;
  }
  
  // Basic smartphones often have low memory and older Android versions
  if (memory <= 1 || userAgent.includes('android 5.') || userAgent.includes('android 6.')) {
    return SADeviceProfile.BASIC;
  }
  
  // Entry-level devices (common in SA market)
  if (memory <= 2 || userAgent.includes('android 7.') || userAgent.includes('android 8.')) {
    return SADeviceProfile.ENTRY_LEVEL;
  }
  
  // Mid-range devices (common in SA urban areas)
  if (memory <= 4 || userAgent.includes('android 9.') || userAgent.includes('android 10.')) {
    return SADeviceProfile.MID_RANGE;
  }
  
  // Remaining are high-end devices
  return SADeviceProfile.HIGH_END;
}

// Network detection logic to determine South African network profiles
function detectSANetworkProfile(connectionQuality: ReturnType<typeof useConnectionQuality>): SANetworkProfile {
  // Use connection quality from SA-calibrated connection quality assessment
  if (connectionQuality.isMetered) {
    return SANetworkProfile.METERED_CONNECTION;
  }
  
  if (!connectionQuality.downlinkSpeed) {
    return SANetworkProfile.PERI_URBAN; // Default if no data available
  }
  
  // High-end fiber connections (mostly in wealthy urban areas)
  if (connectionQuality.downlinkSpeed > 5 && connectionQuality.rtt && connectionQuality.rtt < 100) {
    return SANetworkProfile.URBAN_FIBER;
  }
  
  // LTE connections (urban areas)
  if (connectionQuality.downlinkSpeed > 2 && connectionQuality.rtt && connectionQuality.rtt < 200) {
    return SANetworkProfile.URBAN_LTE;
  }
  
  // Peri-urban connections (suburbs and smaller towns)
  if (connectionQuality.downlinkSpeed > 1) {
    return SANetworkProfile.PERI_URBAN;
  }
  
  // Township connections (densely populated areas)
  if (connectionQuality.downlinkSpeed > 0.5) {
    return SANetworkProfile.TOWNSHIP;
  }
  
  // Rural connections (low bandwidth, high latency)
  return SANetworkProfile.RURAL;
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
  if (deviceProfile === SADeviceProfile.FEATURE_PHONE || deviceProfile === SADeviceProfile.BASIC) {
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
  if (networkProfile === SANetworkProfile.RURAL || networkProfile === SANetworkProfile.TOWNSHIP) {
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
  
  if (networkProfile === SANetworkProfile.METERED_CONNECTION) {
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
    case SANetworkProfile.RURAL:
      return 300;
    case SANetworkProfile.TOWNSHIP:
      return 150;
    case SANetworkProfile.PERI_URBAN:
      return 75;
    case SANetworkProfile.URBAN_LTE:
      return 30;
    case SANetworkProfile.URBAN_FIBER:
      return 0;
    case SANetworkProfile.METERED_CONNECTION:
      return 100;
    default:
      return 50;
  }
}

/**
 * Hook that provides South African market-specific optimizations
 * Implements the dependency inversion pattern to avoid circular dependencies
 */
// Main hook - can be accessed via this name or the aliased name below
export function useSouthAfricanMarketOptimizations(): SouthAfricanMarketOptimizations {
  const connectionQuality = useConnectionQuality();
  const [deviceProfile, setDeviceProfile] = useState<SADeviceProfile>(SADeviceProfile.MID_RANGE);
  const [isClient, setIsClient] = useState(false);
  
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
  const isRural = networkProfile === SANetworkProfile.RURAL;
  
  // Flag for South African user - this would typically come from GeoIP detection
  // For this implementation, we're assuming all users are South African
  const isSouthAfrican = true;
  
  // Optimization flags
  const shouldReduceMotion = 
    deviceProfile === SADeviceProfile.BASIC || 
    deviceProfile === SADeviceProfile.FEATURE_PHONE || 
    networkProfile === SANetworkProfile.RURAL;
    
  const shouldReduceDataUsage = 
    connectionQuality.isDataSaver || 
    connectionQuality.isMetered || 
    networkProfile === SANetworkProfile.RURAL || 
    networkProfile === SANetworkProfile.TOWNSHIP || 
    networkProfile === SANetworkProfile.METERED_CONNECTION;
    
  const shouldReduceJavascript = 
    deviceProfile === SADeviceProfile.BASIC || 
    deviceProfile === SADeviceProfile.FEATURE_PHONE;
    
  const shouldUseLowResImages = 
    shouldReduceDataUsage || 
    deviceProfile === SADeviceProfile.BASIC || 
    deviceProfile === SADeviceProfile.FEATURE_PHONE;
    
  const shouldDeferNonEssential = 
    networkProfile !== SANetworkProfile.URBAN_FIBER || 
    deviceProfile === SADeviceProfile.ENTRY_LEVEL || 
    deviceProfile === SADeviceProfile.BASIC;
    
  const shouldUsePlaceholders = 
    networkProfile === SANetworkProfile.RURAL || 
    networkProfile === SANetworkProfile.TOWNSHIP;
  
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
export function useSAPerformanceThresholds() {
  const { networkProfile, deviceProfile } = useSouthAfricanMarketOptimizations();
  
  // Adjust animation duration based on network profile
  const getAnimationDuration = (baseDuration: number): number => {
    switch (networkProfile) {
      case SANetworkProfile.RURAL:
        return baseDuration * 0.25; // 75% reduction
      case SANetworkProfile.TOWNSHIP:
        return baseDuration * 0.4; // 60% reduction
      case SANetworkProfile.PERI_URBAN:
        return baseDuration * 0.6; // 40% reduction
      case SANetworkProfile.URBAN_LTE:
        return baseDuration * 0.8; // 20% reduction
      case SANetworkProfile.METERED_CONNECTION:
        return baseDuration * 0.3; // 70% reduction
      default:
        return baseDuration;
    }
  };
  
  // Determine image quality based on network and device
  const getImageQuality = (): 'low' | 'medium' | 'high' => {
    if (deviceProfile === SADeviceProfile.FEATURE_PHONE || 
        deviceProfile === SADeviceProfile.BASIC ||
        networkProfile === SANetworkProfile.RURAL) {
      return 'low';
    }
    
    if (deviceProfile === SADeviceProfile.ENTRY_LEVEL || 
        networkProfile === SANetworkProfile.TOWNSHIP ||
        networkProfile === SANetworkProfile.METERED_CONNECTION) {
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