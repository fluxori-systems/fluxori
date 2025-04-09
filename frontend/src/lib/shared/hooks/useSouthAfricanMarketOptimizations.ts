'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  ConnectionQualityResult, 
  SADeviceProfile, 
  SANetworkProfile,
  AgentAppropriateness, 
  SAPerformanceRecommendation, 
  SouthAfricanMarketOptimizations,
  SAPerformanceThresholds,
  SA_CONNECTION_THRESHOLDS,
  SA_REGIONAL_CONSTANTS
} from '../types/sa-market-types';
import { useConnectionService } from '../services/connection-service.interface';

/**
 * Device detection logic to identify common South African devices
 */
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

/**
 * Network detection logic to determine South African network profiles
 */
function detectSANetworkProfile(connectionQuality: ConnectionQualityResult): SANetworkProfile {
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

/**
 * Generate recommendations based on device and network profiles
 */
function generateRecommendations(
  deviceProfile: SADeviceProfile, 
  networkProfile: SANetworkProfile
): SAPerformanceRecommendation[] {
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
  
  // Agent Appropriateness Framework recommendations - NEW
  recommendations.push({
    type: 'important',
    name: 'Agent-first interaction',
    description: 'Use agent-based interactions for complex tasks to reduce UI complexity',
    implemented: true
  });
  
  if (networkProfile === SANetworkProfile.RURAL || 
      networkProfile === SANetworkProfile.TOWNSHIP || 
      networkProfile === SANetworkProfile.METERED_CONNECTION) {
    recommendations.push({
      type: 'critical',
      name: 'Agent value assessment',
      description: 'Only use agent for high-value operations (>R1000 impact)',
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
 * Determine appropriate agent usage based on device, network, and task
 * Implements the Agent Appropriateness Framework from the design system
 */
function determineAgentAppropriateness(
  deviceProfile: SADeviceProfile,
  networkProfile: SANetworkProfile,
  taskComplexity: 'low' | 'medium' | 'high' = 'medium',
  valueImpact: number = 0
): AgentAppropriateness {
  // Feature phones should rarely use agent interactions
  if (deviceProfile === SADeviceProfile.FEATURE_PHONE) {
    return AgentAppropriateness.DISABLED;
  }
  
  // For rural or metered connections, only use agent for high-value tasks
  if (networkProfile === SANetworkProfile.RURAL || 
      networkProfile === SANetworkProfile.METERED_CONNECTION) {
    if (valueImpact >= SA_REGIONAL_CONSTANTS.AGENT_VALUE_THRESHOLD_RAND && taskComplexity === 'high') {
      return AgentAppropriateness.CRITICAL_ONLY;
    }
    return AgentAppropriateness.DISABLED;
  }
  
  // For township connections, be selective
  if (networkProfile === SANetworkProfile.TOWNSHIP) {
    if (taskComplexity === 'low') {
      return AgentAppropriateness.LOW;
    }
    if (valueImpact >= SA_REGIONAL_CONSTANTS.AGENT_VALUE_THRESHOLD_RAND) {
      return AgentAppropriateness.MEDIUM;
    }
    return AgentAppropriateness.LOW;
  }
  
  // For basic devices, only use agent for medium to high complexity tasks
  if (deviceProfile === SADeviceProfile.BASIC) {
    if (taskComplexity === 'low') {
      return AgentAppropriateness.LOW;
    }
    return AgentAppropriateness.MEDIUM;
  }
  
  // For peri-urban connections, agent is suitable for medium to high complexity
  if (networkProfile === SANetworkProfile.PERI_URBAN) {
    if (taskComplexity === 'low') {
      return AgentAppropriateness.MEDIUM;
    }
    return AgentAppropriateness.HIGH;
  }
  
  // For urban connections with decent devices, agent is highly appropriate
  if (deviceProfile !== SADeviceProfile.ENTRY_LEVEL && 
     (networkProfile === SANetworkProfile.URBAN_LTE || 
      networkProfile === SANetworkProfile.URBAN_FIBER)) {
    if (taskComplexity === 'low') {
      return AgentAppropriateness.MEDIUM;
    }
    return AgentAppropriateness.HIGH;
  }
  
  // Default case - medium appropriateness
  return AgentAppropriateness.MEDIUM;
}

/**
 * Calculate the estimated data cost per minute based on network conditions
 * Used for the Agent Appropriateness Framework
 */
function calculateEstimatedDataCost(networkProfile: SANetworkProfile): number {
  // Base data usage per minute (MB)
  let estimatedDataUsagePerMinute: number;
  
  switch (networkProfile) {
    case SANetworkProfile.RURAL:
      estimatedDataUsagePerMinute = 0.8; // Lower due to reduced quality
      break;
    case SANetworkProfile.TOWNSHIP:
      estimatedDataUsagePerMinute = 1.2;
      break;
    case SANetworkProfile.PERI_URBAN:
      estimatedDataUsagePerMinute = 2.0;
      break;
    case SANetworkProfile.URBAN_LTE:
      estimatedDataUsagePerMinute = 3.0;
      break;
    case SANetworkProfile.URBAN_FIBER:
      estimatedDataUsagePerMinute = 5.0;
      break;
    case SANetworkProfile.METERED_CONNECTION:
      estimatedDataUsagePerMinute = 1.5;
      break;
    default:
      estimatedDataUsagePerMinute = 2.0;
  }
  
  // Convert to Rand using the regional cost constant
  return estimatedDataUsagePerMinute * SA_REGIONAL_CONSTANTS.AVERAGE_DATA_COST_PER_MB;
}

/**
 * Hook that provides South African market-specific optimizations
 * Implements the dependency inversion pattern to avoid circular dependencies
 * Enhanced with Agent Appropriateness Framework from the design system
 */
export function useSouthAfricanMarketOptimizations(): SouthAfricanMarketOptimizations {
  // Get connection service through the connection service interface
  const connectionService = useConnectionService();
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQualityResult>(
    connectionService.getConnectionQuality()
  );
  const [deviceProfile, setDeviceProfile] = useState<SADeviceProfile>(SADeviceProfile.MID_RANGE);
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
  
  // Calculate estimated data cost
  const estimatedDataCostPerMinute = useMemo(() => 
    calculateEstimatedDataCost(networkProfile),
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
  
  // Agent Appropriateness Framework - NEW
  // Default to medium complexity, no specific value impact
  const agentAppropriateness = determineAgentAppropriateness(
    deviceProfile, 
    networkProfile, 
    'medium', 
    0
  );
  
  // Default value threshold and human-in-loop flags
  const valueThresholdMet = false; // Default to false, should be set by consumer
  const requiresHumanInLoop = 
    networkProfile === SANetworkProfile.RURAL || 
    deviceProfile === SADeviceProfile.FEATURE_PHONE;
  
  return {
    // Device and network information
    deviceProfile,
    networkProfile,
    isSouthAfrican,
    isRural,
    isMetered: connectionQuality.isMetered,
    
    // Optimization recommendations
    recommendations,
    
    // Performance flags
    shouldReduceMotion,
    shouldReduceDataUsage,
    shouldReduceJavascript,
    shouldUseLowResImages,
    shouldDeferNonEssential,
    shouldUsePlaceholders,
    
    // Agent Appropriateness Framework properties - NEW
    agentAppropriateness,
    valueThresholdMet,
    requiresHumanInLoop,
    
    // Connectivity metrics
    additionalLatencyMs,
    estimatedDataCostPerMinute
  };
}

// Alias for useSouthAfricanMarketOptimizations for older components
export const useSouthAfricanMarket = useSouthAfricanMarketOptimizations;

/**
 * Hook that provides performance thresholds calibrated for South African market
 * Enhanced with Agent Appropriateness Framework from the design system
 */
export function useSAPerformanceThresholds(): SAPerformanceThresholds {
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
  
  // Agent Appropriateness Framework helper - NEW
  const getAgentAppropriateness = (
    taskComplexity: 'low' | 'medium' | 'high',
    valueImpact: number
  ): AgentAppropriateness => {
    return determineAgentAppropriateness(
      deviceProfile,
      networkProfile,
      taskComplexity,
      valueImpact
    );
  };
  
  // Data cost calculation for agent operations - NEW
  const calculateDataCostForOperation = (
    operationType: keyof typeof SA_REGIONAL_CONSTANTS.AGENT_INTERACTION_DATA_USAGE
  ): number => {
    const dataUsage = SA_REGIONAL_CONSTANTS.AGENT_INTERACTION_DATA_USAGE[operationType];
    return dataUsage * SA_REGIONAL_CONSTANTS.AVERAGE_DATA_COST_PER_MB;
  };
  
  return {
    getAnimationDuration,
    getImageQuality,
    prioritizeResource,
    connectionThresholds: SA_CONNECTION_THRESHOLDS,
    
    // Agent Appropriateness Framework helpers - NEW
    determineAgentAppropriateness: getAgentAppropriateness,
    calculateDataCostForOperation
  };
}

// Export the types from our consolidated types file
export { 
  SADeviceProfile, 
  SANetworkProfile,
  AgentAppropriateness,
  SA_CONNECTION_THRESHOLDS,
  SA_REGIONAL_CONSTANTS
} from '../types/sa-market-types';

// Export types using 'export type' to prevent isolatedModules errors
export type { 
  SouthAfricanMarketOptimizations,
  SAPerformanceRecommendation
} from '../types/sa-market-types';