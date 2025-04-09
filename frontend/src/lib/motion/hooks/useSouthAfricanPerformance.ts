'use client';

import { useState, useEffect, useCallback } from 'react';
import { DeviceProfile, NetworkProfile, getDeviceProfile, getNetworkProfile } from '../data/device-profiles';
import { defaultPerformanceMonitoringService } from '../services/performance/performance-monitoring.service';
import { 
  PerformanceInsight, 
  defaultPerformanceAnalyticsService 
} from '../services/performance/performance-analytics.service';

/**
 * Interface for the hook return value
 */
export interface SouthAfricanPerformanceData {
  // Performance insights
  insights: PerformanceInsight[];
  criticalInsights: PerformanceInsight[];
  
  // Device and network profiles
  deviceProfile: DeviceProfile | null;
  networkProfile: NetworkProfile | null;
  
  // Market impact information
  affectedMarketShare: number;
  
  // Animation recommendations based on current profile
  animationRecommendations: {
    shouldAnimateAtAll: boolean;
    maxConcurrentAnimations: number;
    useSimpleAnimations: boolean;
    durationMultiplier: number;
    maxFps: number;
  };
  
  // Network recommendations based on current profile
  networkRecommendations: {
    maxInitialPayloadKB: number;
    maxImageSizeKB: number;
    shouldPreloadResources: boolean;
    shouldUseLazyLoading: boolean;
    shouldUseCompression: boolean;
    isExpensiveNetwork: boolean;
    dataCostPerMBZAR: number;
  };
  
  // Methods
  refreshInsights: () => void;
  runPerformanceAnalysis: () => void;
}

// Network information interface for narrowing
interface NetworkInfo {
  downlink?: number;
  rtt?: number;
  effectiveType?: string;
  saveData?: boolean;
}

/**
 * Hook to access South African market-specific performance data
 * 
 * This provides easy access to device profiles, network profiles, and 
 * performance insights specifically tailored for the South African market
 */
export function useSouthAfricanPerformance(): SouthAfricanPerformanceData {
  // State for insights, profiles and recommendations
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile | null>(null);
  const [networkProfile, setNetworkProfile] = useState<NetworkProfile | null>(null);
  const [affectedMarketShare, setAffectedMarketShare] = useState<number>(0);
  
  // Initialize with device and network profiles
  useEffect(() => {
    detectProfiles();
    refreshInsights();
    
    // Set up interval for periodic refresh
    const intervalId = setInterval(refreshInsights, 60000); // Every 60 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Detect device and network profiles based on current capabilities
  const detectProfiles = useCallback(() => {
    // Get device capabilities from monitoring service
    const capabilities = defaultPerformanceMonitoringService.getDeviceCapabilities();
    
    // Convert capabilities to format expected by getDeviceProfile
    const profileCapabilities = {
      memory: capabilities.memory,
      cpuCores: capabilities.hardwareConcurrency || 1,
      pixelRatio: capabilities.screenDimensions?.dpr || 1,
      screenWidth: capabilities.screenDimensions?.width || 1024,
      screenHeight: capabilities.screenDimensions?.height || 768,
      isLowEndDevice: capabilities.cpuPerformance === 'low'
    };
    
    // Get device profile
    const detectedDeviceProfile = getDeviceProfile(profileCapabilities);
    setDeviceProfile(detectedDeviceProfile || null);
    
    // Safely access navigator.connection with proper type handling
    const networkConditions: NetworkInfo = {};
    
    if (typeof navigator !== 'undefined' && navigator.connection) {
      const conn = navigator.connection;
      
      // Only set properties if they exist
      if (typeof conn.downlink === 'number') {
        networkConditions.downlink = conn.downlink;
      }
      
      if (typeof conn.rtt === 'number') {
        networkConditions.rtt = conn.rtt;
      }
      
      if (typeof conn.effectiveType === 'string') {
        networkConditions.effectiveType = conn.effectiveType;
      }
      
      if (typeof conn.saveData === 'boolean') {
        networkConditions.saveData = conn.saveData;
      }
    } else {
      // Fallback if Network Information API is not available
      networkConditions.downlink = capabilities.cpuPerformance === 'low' ? 2 : 10;
      networkConditions.rtt = capabilities.cpuPerformance === 'low' ? 300 : 100;
      networkConditions.effectiveType = capabilities.cpuPerformance === 'low' ? '3g' : '4g';
      networkConditions.saveData = capabilities.cpuPerformance === 'low';
    }
    
    // Get network profile
    const detectedNetworkProfile = getNetworkProfile(networkConditions);
    setNetworkProfile(detectedNetworkProfile || null);
    
    // Calculate total affected market share for current device type
    if (detectedDeviceProfile) {
      setAffectedMarketShare(detectedDeviceProfile.marketSharePercent);
    }
  }, []);
  
  // Refresh insights from the analytics service
  const refreshInsights = useCallback(() => {
    // Get all insights
    const allInsights = defaultPerformanceAnalyticsService.getAllInsights();
    setInsights(allInsights);
  }, []);
  
  // Run a performance analysis manually
  const runPerformanceAnalysis = useCallback(() => {
    // Generate new insights
    defaultPerformanceAnalyticsService.generateInsights();
    refreshInsights();
  }, [refreshInsights]);
  
  // Get critical insights only
  const criticalInsights = insights.filter(insight => 
    insight.severity === 'critical'
  );
  
  // Animation recommendations based on current device profile
  const animationRecommendations = {
    shouldAnimateAtAll: true,
    maxConcurrentAnimations: 5,
    useSimpleAnimations: false,
    durationMultiplier: 1.0,
    maxFps: 60
  };
  
  // Network recommendations based on current network profile
  const networkRecommendations = {
    maxInitialPayloadKB: 1000,
    maxImageSizeKB: 300,
    shouldPreloadResources: true,
    shouldUseLazyLoading: true,
    shouldUseCompression: true,
    isExpensiveNetwork: false,
    dataCostPerMBZAR: 0.03
  };
  
  // Update recommendations based on device profile
  if (deviceProfile) {
    const { optimizationRecommendations } = deviceProfile;
    
    animationRecommendations.maxConcurrentAnimations = optimizationRecommendations.maxConcurrentAnimations;
    animationRecommendations.useSimpleAnimations = 
      optimizationRecommendations.useSimpleBezier || 
      optimizationRecommendations.disablePhysics;
    animationRecommendations.durationMultiplier = optimizationRecommendations.durationMultiplier;
    animationRecommendations.maxFps = optimizationRecommendations.maxFPS;
    
    // Determine if animations should be disabled completely
    animationRecommendations.shouldAnimateAtAll = 
      !optimizationRecommendations.disablePhysics || 
      !optimizationRecommendations.disableParallax;
  }
  
  // Update recommendations based on network profile
  if (networkProfile) {
    const { bandwidthRecommendations, dataCostPerMBZAR } = networkProfile;
    
    networkRecommendations.maxInitialPayloadKB = bandwidthRecommendations.maxInitialPageSizeKB;
    networkRecommendations.maxImageSizeKB = bandwidthRecommendations.maxImageSizeKB;
    networkRecommendations.shouldPreloadResources = bandwidthRecommendations.preloadCriticalResources;
    networkRecommendations.shouldUseLazyLoading = bandwidthRecommendations.lazyLoadNonCritical;
    networkRecommendations.shouldUseCompression = bandwidthRecommendations.useCompression;
    networkRecommendations.isExpensiveNetwork = dataCostPerMBZAR > 0.04;
    networkRecommendations.dataCostPerMBZAR = dataCostPerMBZAR;
    
    // Further restrict animations on expensive networks
    if (dataCostPerMBZAR > 0.05) {
      animationRecommendations.shouldAnimateAtAll = false;
    }
  }
  
  return {
    insights,
    criticalInsights,
    deviceProfile,
    networkProfile,
    affectedMarketShare,
    animationRecommendations,
    networkRecommendations,
    refreshInsights,
    runPerformanceAnalysis
  };
}