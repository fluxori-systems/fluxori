'use client';

import { 
  PerformanceMetric, 
  IPerformanceMonitoringService,
  DeviceCapabilities 
} from '../../types/performance';
import { 
  DeviceProfile, 
  NetworkProfile, 
  getDeviceProfile,
  getNetworkProfile,
  southAfricanDeviceProfiles,
  southAfricanNetworkProfiles 
} from '../../data/device-profiles';
import { defaultPerformanceMonitoringService } from './performance-monitoring.service';

/**
 * Interface for performance insights for South African market
 */
export interface PerformanceInsight {
  /** Unique ID for the insight */
  id: string;
  
  /** Short title/summary of the insight */
  title: string;
  
  /** Detailed description of the insight */
  description: string;
  
  /** Severity level of the issue */
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  
  /** Recommendation for addressing the issue */
  recommendation: string;
  
  /** Related metrics IDs that led to this insight */
  relatedMetrics: string[];
  
  /** Specific device profiles this applies to */
  targetDeviceProfiles?: string[];
  
  /** Specific network profiles this applies to */
  targetNetworkProfiles?: string[];
  
  /** Estimated impact on user experience (1-10) */
  estimatedImpact: number;
  
  /** Market share percentage affected */
  affectedMarketSharePercent?: number;
  
  /** Timestamp the insight was generated */
  timestamp: number;
}

/**
 * Analytics configuration
 */
export interface PerformanceAnalyticsConfig {
  /** Whether analytics is enabled */
  enabled: boolean;
  
  /** Analysis interval in milliseconds */
  analysisInterval: number;
  
  /** Whether to send analytics to backend */
  sendToBackend: boolean;
  
  /** Whether to focus specifically on South African market */
  focusSouthAfricanMarket: boolean;
  
  /** Backend endpoint for analytics data */
  backendEndpoint?: string;
  
  /** API key for backend (if needed) */
  apiKey?: string;
  
  /** Maximum insights to store locally */
  maxStoredInsights: number;
}

/**
 * Performance Analytics Service
 * Analyzes performance data specifically for South African market conditions
 */
export class PerformanceAnalyticsService {
  // Service configuration
  private config: PerformanceAnalyticsConfig = {
    enabled: true,
    analysisInterval: 30000, // 30 seconds
    sendToBackend: false,
    focusSouthAfricanMarket: true,
    maxStoredInsights: 50
  };
  
  // Reference to performance monitoring service
  private monitoringService: IPerformanceMonitoringService;
  
  // Generated insights
  private insights: PerformanceInsight[] = [];
  
  // Analysis interval ID
  private analysisIntervalId?: NodeJS.Timeout;
  
  // Device market distribution data
  private deviceMarketDistribution: Map<string, number> = new Map();
  
  // Animation performance thresholds specific to different SA network conditions
  private networkSpecificThresholds: Map<string, { 
    maxAnimationDuration: number, 
    maxDroppedFramesAllowed: number 
  }> = new Map();
  
  /**
   * Create a new analytics service
   * @param monitoringService Performance monitoring service to use
   */
  constructor(monitoringService?: IPerformanceMonitoringService) {
    this.monitoringService = monitoringService || defaultPerformanceMonitoringService;
    
    // Initialize device market distribution data
    this.initializeMarketData();
    
    // Initialize network-specific thresholds
    this.initializeNetworkThresholds();
    
    // Start automatic analysis if enabled
    if (this.config.enabled && typeof window !== 'undefined') {
      this.startAutomaticAnalysis();
    }
  }
  
  /**
   * Start automatic analysis of performance data
   */
  public startAutomaticAnalysis(): void {
    if (this.analysisIntervalId) {
      clearInterval(this.analysisIntervalId);
    }
    
    this.analysisIntervalId = setInterval(() => {
      this.analyzePerformanceData();
    }, this.config.analysisInterval);
    
    // Run initial analysis
    this.analyzePerformanceData();
  }
  
  /**
   * Stop automatic analysis
   */
  public stopAutomaticAnalysis(): void {
    if (this.analysisIntervalId) {
      clearInterval(this.analysisIntervalId);
      this.analysisIntervalId = undefined;
    }
  }
  
  /**
   * Update analytics configuration
   * @param config New configuration
   */
  public updateConfig(config: Partial<PerformanceAnalyticsConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...config };
    
    // Handle changes in automatic analysis setting
    if (oldConfig.enabled !== this.config.enabled || 
        oldConfig.analysisInterval !== this.config.analysisInterval) {
      if (this.config.enabled) {
        this.startAutomaticAnalysis();
      } else {
        this.stopAutomaticAnalysis();
      }
    }
  }
  
  /**
   * Get current insights
   * @param filters Optional filters to apply
   */
  public getInsights(filters?: {
    minSeverity?: 'critical' | 'high' | 'medium' | 'low' | 'info',
    deviceType?: string,
    networkType?: string,
    limit?: number
  }): PerformanceInsight[] {
    let result = [...this.insights];
    
    // Apply filters
    if (filters) {
      if (filters.minSeverity) {
        const severityLevels = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1, 'info': 0 };
        const minLevel = severityLevels[filters.minSeverity];
        result = result.filter(i => severityLevels[i.severity] >= minLevel);
      }
      
      if (filters.deviceType) {
        result = result.filter(i => 
          !i.targetDeviceProfiles || 
          i.targetDeviceProfiles.includes(filters.deviceType!)
        );
      }
      
      if (filters.networkType) {
        result = result.filter(i => 
          !i.targetNetworkProfiles || 
          i.targetNetworkProfiles.includes(filters.networkType!)
        );
      }
      
      if (filters.limit && filters.limit > 0) {
        result = result.slice(-filters.limit);
      }
    }
    
    return result;
  }
  
  /**
   * Clear all insights
   */
  public clearInsights(): void {
    this.insights = [];
  }
  
  /**
   * Analyze current performance data and generate insights
   */
  public analyzePerformanceData(): void {
    if (!this.config.enabled) return;
    
    // Get device capabilities from performance monitoring
    const deviceCapabilities = this.monitoringService.getDeviceCapabilities();
    
    // Get performance metrics
    const allMetrics = this.monitoringService.getMetrics();
    
    // Group metrics by type for analysis
    const animationMetrics = allMetrics.filter(m => m.type === 'animation');
    const interactionMetrics = allMetrics.filter(m => m.type === 'interaction');
    const layoutMetrics = allMetrics.filter(m => m.type === 'layout');
    const renderingMetrics = allMetrics.filter(m => m.type === 'rendering');
    
    // Create a list of new insights
    const newInsights: PerformanceInsight[] = [];
    
    // Market-focused insights based on South African device profiles
    if (this.config.focusSouthAfricanMarket) {
      this.generateSouthAfricanMarketInsights(
        deviceCapabilities, 
        animationMetrics, 
        interactionMetrics,
        newInsights
      );
    }
    
    // General performance insights
    this.generateGeneralPerformanceInsights(
      allMetrics,
      animationMetrics,
      interactionMetrics,
      layoutMetrics,
      renderingMetrics,
      newInsights
    );
    
    // Add new insights to our collection
    this.insights = [...this.insights, ...newInsights];
    
    // Trim insights if we have too many
    if (this.insights.length > this.config.maxStoredInsights) {
      this.insights = this.insights.slice(-this.config.maxStoredInsights);
    }
    
    // Send insights to backend if enabled
    if (this.config.sendToBackend && newInsights.length > 0) {
      this.sendInsightsToBackend(newInsights);
    }
    
    // Log insights if in development
    if (process.env.NODE_ENV === 'development' && newInsights.length > 0) {
      console.log(`[Performance Analytics] Generated ${newInsights.length} new insights:`, newInsights);
    }
  }
  
  /**
   * Generate South African market-specific insights based on device profiles
   */
  private generateSouthAfricanMarketInsights(
    deviceCapabilities: DeviceCapabilities,
    animationMetrics: PerformanceMetric[],
    interactionMetrics: PerformanceMetric[],
    insights: PerformanceInsight[]
  ): void {
    // Get matching device profile for current device
    const deviceProfile = this.getDeviceProfileFromCapabilities(deviceCapabilities);
    
    // If we don't have a matching profile, we can't generate specific insights
    if (!deviceProfile) return;
    
    // Get recent network conditions
    const networkQuality = this.extractLatestNetworkQuality(animationMetrics, interactionMetrics);
    
    // Find matching network profile
    const networkProfile = this.getNetworkProfileFromQuality(networkQuality);
    
    // Generate insights based on device and network profiles
    
    // 1. Animation performance for specific device types
    this.analyzeAnimationPerformanceForDeviceType(
      deviceProfile,
      networkProfile,
      animationMetrics,
      insights
    );
    
    // 2. Interaction performance for network conditions
    this.analyzeInteractionPerformanceForNetwork(
      deviceProfile,
      networkProfile, 
      interactionMetrics,
      insights
    );
    
    // 3. Data usage implications
    this.analyzeDataUsageImplications(
      deviceProfile,
      networkProfile,
      insights
    );
    
    // 4. Market share impact analysis
    this.analyzeMarketShareImpact(
      deviceProfile,
      animationMetrics,
      interactionMetrics,
      insights
    );
  }
  
  /**
   * Generate general performance insights
   */
  private generateGeneralPerformanceInsights(
    allMetrics: PerformanceMetric[],
    animationMetrics: PerformanceMetric[],
    interactionMetrics: PerformanceMetric[],
    layoutMetrics: PerformanceMetric[],
    renderingMetrics: PerformanceMetric[],
    insights: PerformanceInsight[]
  ): void {
    // 1. Identify slow animations
    this.identifySlowAnimations(animationMetrics, insights);
    
    // 2. Identify slow interaction responses
    this.identifySlowInteractions(interactionMetrics, insights);
    
    // 3. Identify layout thrashing
    this.identifyLayoutThrashing(layoutMetrics, insights);
    
    // 4. Identify rendering bottlenecks
    this.identifyRenderingBottlenecks(renderingMetrics, insights);
    
    // 5. Identify areas for optimization based on all metrics
    this.identifyGeneralOptimizationAreas(allMetrics, insights);
  }
  
  /**
   * Analyze animation performance specific to device type
   */
  private analyzeAnimationPerformanceForDeviceType(
    deviceProfile: DeviceProfile,
    networkProfile: NetworkProfile | undefined,
    animationMetrics: PerformanceMetric[],
    insights: PerformanceInsight[]
  ): void {
    if (animationMetrics.length === 0) return;
    
    // Get optimization recommendations for this device
    const recommendations = deviceProfile.optimizationRecommendations;
    
    // Check for animations exceeding maximum concurrent count
    const uniqueAnimationTimes = new Map<number, string[]>();
    
    // Group animations by timestamp (approximating concurrency)
    animationMetrics.forEach(metric => {
      // Round to nearest 100ms to group roughly concurrent animations
      const timeKey = Math.round(metric.timestamp / 100) * 100;
      const animations = uniqueAnimationTimes.get(timeKey) || [];
      
      if (!animations.includes(metric.id)) {
        animations.push(metric.id);
      }
      
      uniqueAnimationTimes.set(timeKey, animations);
    });
    
    // Find timestamps where concurrent animations exceeded recommendations
    const excessiveConcurrentAnimations = Array.from(uniqueAnimationTimes.entries())
      .filter(([_, animations]) => animations.length > recommendations.maxConcurrentAnimations);
    
    if (excessiveConcurrentAnimations.length > 0) {
      // Get the worst case
      const [worstTimestamp, worstCaseAnimations] = excessiveConcurrentAnimations.reduce(
        (prev, curr) => curr[1].length > prev[1].length ? curr : prev,
        excessiveConcurrentAnimations[0]
      );
      
      insights.push({
        id: `too_many_concurrent_animations_${deviceProfile.deviceType}`,
        title: `Too many concurrent animations for ${deviceProfile.deviceName}`,
        description: `Detected ${worstCaseAnimations.length} concurrent animations, but this device type should have no more than ${recommendations.maxConcurrentAnimations} simultaneous animations for optimal performance.`,
        severity: worstCaseAnimations.length > recommendations.maxConcurrentAnimations * 2 ? 'critical' : 'high',
        recommendation: `Reduce concurrent animations to ${recommendations.maxConcurrentAnimations} or fewer for ${deviceProfile.deviceType} devices. Consider using sequential animations or reducing animation complexity.`,
        relatedMetrics: worstCaseAnimations,
        targetDeviceProfiles: [deviceProfile.deviceType],
        estimatedImpact: 8,
        affectedMarketSharePercent: deviceProfile.marketSharePercent,
        timestamp: Date.now()
      });
    }
    
    // Check for animations using complex effects on low-end devices
    if (recommendations.disablePhysics || recommendations.useSimpleBezier) {
      const complexAnimations = animationMetrics.filter(metric => 
        metric.context?.complexity === 'high' ||
        metric.context?.animationType?.includes('physics') ||
        metric.context?.animationType?.includes('parallax')
      );
      
      if (complexAnimations.length > 0) {
        insights.push({
          id: `complex_animations_${deviceProfile.deviceType}`,
          title: `Complex animations on ${deviceProfile.deviceName}`,
          description: `Detected ${complexAnimations.length} complex animations on a device type that struggles with advanced effects.`,
          severity: 'high',
          recommendation: deviceProfile.processorTier === 'entry' ? 
            `Completely disable physics-based and complex animations for ${deviceProfile.deviceType} devices to prevent poor performance.` :
            `Simplify animations for ${deviceProfile.deviceType} devices. ${recommendations.useSimpleBezier ? 'Use simple easings instead of complex bezier curves.' : ''}`,
          relatedMetrics: complexAnimations.map(m => m.id),
          targetDeviceProfiles: [deviceProfile.deviceType],
          estimatedImpact: 7,
          affectedMarketSharePercent: deviceProfile.marketSharePercent,
          timestamp: Date.now()
        });
      }
    }
    
    // Check for animations exceeding optimal duration based on network conditions
    if (networkProfile) {
      // Get network-specific thresholds
      const thresholdKey = `${networkProfile.provider}_${networkProfile.locationType}`;
      const thresholds = this.networkSpecificThresholds.get(thresholdKey) || {
        maxAnimationDuration: 300,
        maxDroppedFramesAllowed: 0
      };
      
      const longAnimations = animationMetrics.filter(metric => 
        metric.value > thresholds.maxAnimationDuration
      );
      
      if (longAnimations.length > 0) {
        insights.push({
          id: `long_animations_${networkProfile.provider}_${networkProfile.locationType}`,
          title: `Animation duration exceeds recommended for ${networkProfile.provider} in ${networkProfile.locationType} areas`,
          description: `${longAnimations.length} animations exceed the recommended duration of ${thresholds.maxAnimationDuration}ms for the current network conditions.`,
          severity: 'medium',
          recommendation: `Reduce animation duration to ${thresholds.maxAnimationDuration}ms or less for users on ${networkProfile.provider} in ${networkProfile.locationType} areas. Consider using the durationMultiplier of ${recommendations.durationMultiplier} for these devices.`,
          relatedMetrics: longAnimations.map(m => m.id),
          targetNetworkProfiles: [`${networkProfile.provider}_${networkProfile.locationType}`],
          estimatedImpact: 6,
          timestamp: Date.now()
        });
      }
    }
  }
  
  /**
   * Analyze interaction performance for network conditions
   */
  private analyzeInteractionPerformanceForNetwork(
    deviceProfile: DeviceProfile,
    networkProfile: NetworkProfile | undefined,
    interactionMetrics: PerformanceMetric[],
    insights: PerformanceInsight[]
  ): void {
    if (!networkProfile || interactionMetrics.length === 0) return;
    
    // Define latency thresholds based on network conditions
    // For high-latency networks, interaction feedback should be faster
    const latencyBasedThreshold = Math.max(50, 250 - networkProfile.latencyMs / 2);
    
    // Look for slow interactions
    const slowInteractions = interactionMetrics.filter(metric => metric.value > latencyBasedThreshold);
    
    if (slowInteractions.length > 0) {
      insights.push({
        id: `slow_interactions_${networkProfile.provider}_${networkProfile.locationType}`,
        title: `Slow interaction feedback for ${networkProfile.provider} connections`,
        description: `${slowInteractions.length} user interactions have slow feedback times (>${latencyBasedThreshold}ms) on ${networkProfile.provider} connections in ${networkProfile.locationType} areas.`,
        severity: networkProfile.latencyMs > 200 ? 'critical' : 'high',
        recommendation: `Optimize interaction feedback times for high-latency networks. For ${networkProfile.provider} connections in ${networkProfile.locationType} areas (avg latency: ${networkProfile.latencyMs}ms), provide immediate visual feedback within ${latencyBasedThreshold}ms even if the full operation is still processing.`,
        relatedMetrics: slowInteractions.map(m => m.id),
        targetNetworkProfiles: [`${networkProfile.provider}_${networkProfile.locationType}`],
        estimatedImpact: networkProfile.latencyMs > 200 ? 9 : 7,
        timestamp: Date.now()
      });
    }
    
    // Special case for extremely high-latency or packet loss conditions
    if (networkProfile.latencyMs > 300 || networkProfile.packetLossPercent > 5) {
      // Check if we have any long-running operations
      const longOperations = interactionMetrics.filter(metric => 
        metric.value > 500 && metric.context?.isNetworkDependent
      );
      
      if (longOperations.length > 0) {
        insights.push({
          id: `network_resilience_${networkProfile.provider}_${networkProfile.locationType}`,
          title: `Network resilience needed for ${networkProfile.provider} in ${networkProfile.locationType} areas`,
          description: `${longOperations.length} network-dependent operations may fail or timeout under typical ${networkProfile.provider} conditions in ${networkProfile.locationType} areas (${networkProfile.latencyMs}ms latency, ${networkProfile.packetLossPercent}% packet loss).`,
          severity: 'critical',
          recommendation: `Implement robust offline capabilities, retry mechanisms, and optimistic UI updates for users on ${networkProfile.provider} networks in ${networkProfile.locationType} areas. Consider shorter request timeouts with multiple retries rather than long timeouts.`,
          relatedMetrics: longOperations.map(m => m.id),
          targetNetworkProfiles: [`${networkProfile.provider}_${networkProfile.locationType}`],
          estimatedImpact: 10,
          timestamp: Date.now()
        });
      }
    }
  }
  
  /**
   * Analyze data usage implications based on network profile
   */
  private analyzeDataUsageImplications(
    deviceProfile: DeviceProfile,
    networkProfile: NetworkProfile | undefined,
    insights: PerformanceInsight[]
  ): void {
    if (!networkProfile) return;
    
    // For expensive data networks, provide data usage insights
    if (networkProfile.dataCostPerMBZAR > 0.04) {
      // Check if recommendations are implemented
      const recommendedOptimizations = [];
      
      if (networkProfile.bandwidthRecommendations.useCompression) {
        recommendedOptimizations.push("Enable data compression");
      }
      
      if (networkProfile.bandwidthRecommendations.useAggressiveCaching) {
        recommendedOptimizations.push("Implement aggressive caching");
      }
      
      if (networkProfile.bandwidthRecommendations.lazyLoadNonCritical) {
        recommendedOptimizations.push("Lazy-load non-critical resources");
      }
      
      if (recommendedOptimizations.length > 0) {
        insights.push({
          id: `data_cost_optimization_${networkProfile.provider}_${networkProfile.locationType}`,
          title: `Data cost optimization for ${networkProfile.provider} in ${networkProfile.locationType} areas`,
          description: `Users on ${networkProfile.provider} in ${networkProfile.locationType} areas pay approximately R${networkProfile.dataCostPerMBZAR.toFixed(2)} per MB, which is relatively expensive.`,
          severity: 'high',
          recommendation: `Optimize for data costs: ${recommendedOptimizations.join(", ")}. Limit initial page load to ${networkProfile.bandwidthRecommendations.maxInitialPageSizeKB}KB and image sizes to ${networkProfile.bandwidthRecommendations.maxImageSizeKB}KB.`,
          relatedMetrics: [],
          targetNetworkProfiles: [`${networkProfile.provider}_${networkProfile.locationType}`],
          estimatedImpact: 8,
          timestamp: Date.now()
        });
      }
    }
    
    // Special data saving tips for very expensive networks
    if (networkProfile.dataCostPerMBZAR > 0.06) {
      insights.push({
        id: `extreme_data_saving_${networkProfile.provider}_${networkProfile.locationType}`,
        title: `Critical data saving for ${networkProfile.provider} in ${networkProfile.locationType} areas`,
        description: `Users on ${networkProfile.provider} in ${networkProfile.locationType} areas pay R${networkProfile.dataCostPerMBZAR.toFixed(2)} per MB, making data extremely expensive.`,
        severity: 'critical',
        recommendation: `Implement text-only mode, completely disable non-critical images and animations, and provide explicit data usage warnings. Keep initial payload under ${networkProfile.bandwidthRecommendations.maxInitialPageSizeKB}KB.`,
        relatedMetrics: [],
        targetNetworkProfiles: [`${networkProfile.provider}_${networkProfile.locationType}`],
        estimatedImpact: 10,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Analyze market share impact of performance issues
   */
  private analyzeMarketShareImpact(
    deviceProfile: DeviceProfile,
    animationMetrics: PerformanceMetric[],
    interactionMetrics: PerformanceMetric[],
    insights: PerformanceInsight[]
  ): void {
    // Collect all problematic metrics
    const problematicAnimations = animationMetrics.filter(m => 
      m.context?.droppedFrames || m.value > 300
    );
    
    const problematicInteractions = interactionMetrics.filter(m => 
      m.value > 200
    );
    
    if (problematicAnimations.length === 0 && problematicInteractions.length === 0) {
      return;
    }
    
    // Calculate affected device types
    const affectedDeviceTypes = new Set<string>();
    
    if (problematicAnimations.length > 0 && deviceProfile.processorTier !== 'high') {
      affectedDeviceTypes.add(deviceProfile.deviceType);
      
      // Also consider similar low-end devices
      if (deviceProfile.processorTier === 'entry' || deviceProfile.processorTier === 'low') {
        southAfricanDeviceProfiles
          .filter(p => p.processorTier === 'entry' || p.processorTier === 'low')
          .forEach(p => affectedDeviceTypes.add(p.deviceType));
      }
    }
    
    if (problematicInteractions.length > 0) {
      affectedDeviceTypes.add(deviceProfile.deviceType);
    }
    
    // Calculate total affected market share
    const affectedMarketShare = Array.from(affectedDeviceTypes)
      .map(deviceType => {
        const profile = southAfricanDeviceProfiles.find(p => p.deviceType === deviceType);
        return profile ? profile.marketSharePercent : 0;
      })
      .reduce((total, share) => total + share, 0);
    
    if (affectedMarketShare > 10) {
      insights.push({
        id: `market_share_impact_${deviceProfile.deviceType}`,
        title: `Performance issues affect ${affectedMarketShare.toFixed(1)}% of South African market`,
        description: `Current performance issues may negatively impact approximately ${affectedMarketShare.toFixed(1)}% of South African users who use similar devices to ${deviceProfile.deviceName}.`,
        severity: affectedMarketShare > 25 ? 'critical' : 'high',
        recommendation: `Prioritize optimizations for ${Array.from(affectedDeviceTypes).join(', ')} devices to improve experience for a significant portion of the South African market.`,
        relatedMetrics: [
          ...problematicAnimations.map(m => m.id),
          ...problematicInteractions.map(m => m.id)
        ],
        targetDeviceProfiles: Array.from(affectedDeviceTypes),
        estimatedImpact: Math.min(10, Math.round(affectedMarketShare / 10)),
        affectedMarketSharePercent: affectedMarketShare,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Identify slow animations (general analysis)
   */
  private identifySlowAnimations(
    animationMetrics: PerformanceMetric[],
    insights: PerformanceInsight[]
  ): void {
    if (animationMetrics.length === 0) return;
    
    // Group animations by component
    const animationsByComponent = new Map<string, PerformanceMetric[]>();
    
    animationMetrics.forEach(metric => {
      const component = metric.component || 'unknown';
      const metrics = animationsByComponent.get(component) || [];
      metrics.push(metric);
      animationsByComponent.set(component, metrics);
    });
    
    // Look for components with consistently slow animations
    Array.from(animationsByComponent.entries()).forEach(([component, metrics]) => {
      if (metrics.length < 3) return; // Need enough samples
      
      const avgDuration = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
      
      if (avgDuration > 200) {
        const severity = avgDuration > 500 ? 'critical' : (avgDuration > 300 ? 'high' : 'medium');
        
        insights.push({
          id: `slow_animations_${component}`,
          title: `Slow animations in ${component}`,
          description: `Animations in ${component} are consistently slow (average ${avgDuration.toFixed(1)}ms).`,
          severity,
          recommendation: avgDuration > 500 ? 
            `Significantly optimize or remove animations in ${component}. Consider breaking into smaller animations or using simpler effects.` :
            `Optimize animations in ${component} to target durations under 200ms for better performance.`,
          relatedMetrics: metrics.map(m => m.id),
          estimatedImpact: avgDuration > 500 ? 9 : (avgDuration > 300 ? 7 : 5),
          timestamp: Date.now()
        });
      }
    });
  }
  
  /**
   * Identify slow interactions (general analysis)
   */
  private identifySlowInteractions(
    interactionMetrics: PerformanceMetric[],
    insights: PerformanceInsight[]
  ): void {
    if (interactionMetrics.length === 0) return;
    
    // Group interactions by component
    const interactionsByComponent = new Map<string, PerformanceMetric[]>();
    
    interactionMetrics.forEach(metric => {
      const component = metric.component || 'unknown';
      const metrics = interactionsByComponent.get(component) || [];
      metrics.push(metric);
      interactionsByComponent.set(component, metrics);
    });
    
    // Look for components with consistently slow interactions
    Array.from(interactionsByComponent.entries()).forEach(([component, metrics]) => {
      if (metrics.length < 2) return; // Need enough samples
      
      const avgDuration = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
      
      if (avgDuration > 100) {
        const severity = avgDuration > 300 ? 'critical' : (avgDuration > 200 ? 'high' : 'medium');
        
        insights.push({
          id: `slow_interactions_${component}`,
          title: `Slow interaction response in ${component}`,
          description: `User interactions in ${component} are taking too long to respond (average ${avgDuration.toFixed(1)}ms).`,
          severity,
          recommendation: avgDuration > 300 ? 
            `Urgent optimization needed for ${component} interactions. Consider moving work off the main thread, implementing skeleton screens, or adding immediate visual feedback.` :
            `Improve responsiveness of ${component} interactions to keep all responses under 100ms for perceived instantaneous feedback.`,
          relatedMetrics: metrics.map(m => m.id),
          estimatedImpact: avgDuration > 300 ? 10 : (avgDuration > 200 ? 8 : 6),
          timestamp: Date.now()
        });
      }
    });
  }
  
  /**
   * Identify layout thrashing issues
   */
  private identifyLayoutThrashing(
    layoutMetrics: PerformanceMetric[],
    insights: PerformanceInsight[]
  ): void {
    if (layoutMetrics.length < 5) return;
    
    // Check for rapid sequences of layout operations
    // Sort by timestamp
    const sortedLayoutMetrics = [...layoutMetrics].sort((a, b) => a.timestamp - b.timestamp);
    
    // Look for clusters of layout calculations
    const layoutClusters: PerformanceMetric[][] = [];
    let currentCluster: PerformanceMetric[] = [];
    
    sortedLayoutMetrics.forEach((metric, index) => {
      if (index === 0) {
        currentCluster.push(metric);
        return;
      }
      
      const prevMetric = sortedLayoutMetrics[index - 1];
      const timeDiff = metric.timestamp - prevMetric.timestamp;
      
      // If layout calculations happen in quick succession (within 100ms)
      if (timeDiff < 100) {
        currentCluster.push(metric);
      } else {
        if (currentCluster.length > 2) {
          layoutClusters.push([...currentCluster]);
        }
        currentCluster = [metric];
      }
    });
    
    // Add the last cluster if it's significant
    if (currentCluster.length > 2) {
      layoutClusters.push(currentCluster);
    }
    
    // Generate insights for significant layout thrashing
    layoutClusters.forEach((cluster, index) => {
      if (cluster.length >= 4) {
        insights.push({
          id: `layout_thrashing_${index}`,
          title: `Layout thrashing detected`,
          description: `Detected ${cluster.length} layout operations in rapid succession, causing potential layout thrashing.`,
          severity: cluster.length > 8 ? 'critical' : (cluster.length > 5 ? 'high' : 'medium'),
          recommendation: `Batch DOM reads and writes to prevent layout thrashing. Use requestAnimationFrame to coordinate layout-affecting code and consider using a virtual DOM approach to minimize layout recalculations.`,
          relatedMetrics: cluster.map(m => m.id),
          estimatedImpact: Math.min(10, 5 + cluster.length / 2),
          timestamp: Date.now()
        });
      }
    });
  }
  
  /**
   * Identify rendering bottlenecks
   */
  private identifyRenderingBottlenecks(
    renderingMetrics: PerformanceMetric[],
    insights: PerformanceInsight[]
  ): void {
    if (renderingMetrics.length === 0) return;
    
    // Find long renders
    const longRenders = renderingMetrics.filter(m => m.value > 50);
    
    if (longRenders.length > 0) {
      // Group by component
      const rendersByComponent = new Map<string, PerformanceMetric[]>();
      
      longRenders.forEach(metric => {
        const component = metric.component || 'unknown';
        const metrics = rendersByComponent.get(component) || [];
        metrics.push(metric);
        rendersByComponent.set(component, metrics);
      });
      
      // Find the worst offenders
      Array.from(rendersByComponent.entries())
        .filter(([_, metrics]) => metrics.length >= 2)
        .sort((a, b) => {
          const avgA = a[1].reduce((sum, m) => sum + m.value, 0) / a[1].length;
          const avgB = b[1].reduce((sum, m) => sum + m.value, 0) / b[1].length;
          return avgB - avgA;
        })
        .slice(0, 3) // Top 3 worst components
        .forEach(([component, metrics]) => {
          const avgRenderTime = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
          
          insights.push({
            id: `rendering_bottleneck_${component}`,
            title: `Rendering bottleneck in ${component}`,
            description: `${component} has slow render times (average ${avgRenderTime.toFixed(1)}ms over ${metrics.length} renders).`,
            severity: avgRenderTime > 100 ? 'critical' : (avgRenderTime > 70 ? 'high' : 'medium'),
            recommendation: `Optimize rendering in ${component}. Consider memoization, optimizing re-renders, virtualizing long lists, or breaking into smaller components.`,
            relatedMetrics: metrics.map(m => m.id),
            estimatedImpact: avgRenderTime > 100 ? 9 : (avgRenderTime > 70 ? 7 : 5),
            timestamp: Date.now()
          });
        });
    }
  }
  
  /**
   * Identify general optimization areas
   */
  private identifyGeneralOptimizationAreas(
    allMetrics: PerformanceMetric[],
    insights: PerformanceInsight[]
  ): void {
    if (allMetrics.length < 10) return;
    
    // Check for data saver mode frequency
    const dataSaverMetrics = allMetrics.filter(m => m.dataSaver === true);
    const dataSaverPercentage = (dataSaverMetrics.length / allMetrics.length) * 100;
    
    if (dataSaverPercentage > 15) {
      insights.push({
        id: 'high_data_saver_usage',
        title: 'High data saver mode usage detected',
        description: `${dataSaverPercentage.toFixed(1)}% of users have data saver mode enabled, indicating cost-sensitive users.`,
        severity: dataSaverPercentage > 30 ? 'critical' : 'high',
        recommendation: 'Implement comprehensive data-saving features including reduced image quality option, text-only mode, and explicit data usage indicators. Consider defaulting to reduced data usage.',
        relatedMetrics: dataSaverMetrics.slice(0, 10).map(m => m.id),
        estimatedImpact: dataSaverPercentage > 30 ? 9 : 7,
        timestamp: Date.now()
      });
    }
    
    // Check for reduced motion preference
    const reducedMotionMetrics = allMetrics.filter(m => m.motionMode === 'reduced' || m.motionMode === 'minimal');
    const reducedMotionPercentage = (reducedMotionMetrics.length / allMetrics.length) * 100;
    
    if (reducedMotionPercentage > 10) {
      insights.push({
        id: 'high_reduced_motion_preference',
        title: 'Many users prefer reduced motion',
        description: `${reducedMotionPercentage.toFixed(1)}% of users have chosen reduced motion settings.`,
        severity: 'medium',
        recommendation: 'Ensure all animations respect reduced motion preferences. Consider creating a simplified UI option with minimal animations by default.',
        relatedMetrics: reducedMotionMetrics.slice(0, 10).map(m => m.id),
        estimatedImpact: 6,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Initialize market data from South African device profiles
   */
  private initializeMarketData(): void {
    // Map device types to market share percentages
    southAfricanDeviceProfiles.forEach(profile => {
      this.deviceMarketDistribution.set(profile.deviceType, profile.marketSharePercent);
    });
  }
  
  /**
   * Initialize network-specific thresholds for different SA networks
   */
  private initializeNetworkThresholds(): void {
    // Urban high-speed networks
    this.networkSpecificThresholds.set('Vodacom_urban', {
      maxAnimationDuration: 400,
      maxDroppedFramesAllowed: 3
    });
    
    this.networkSpecificThresholds.set('MTN_urban', {
      maxAnimationDuration: 400,
      maxDroppedFramesAllowed: 3
    });
    
    // Township networks
    this.networkSpecificThresholds.set('Vodacom_township', {
      maxAnimationDuration: 300,
      maxDroppedFramesAllowed: 1
    });
    
    this.networkSpecificThresholds.set('MTN_township', {
      maxAnimationDuration: 250,
      maxDroppedFramesAllowed: 1
    });
    
    // Rural networks
    this.networkSpecificThresholds.set('Vodacom_rural', {
      maxAnimationDuration: 200,
      maxDroppedFramesAllowed: 0
    });
    
    this.networkSpecificThresholds.set('MTN_rural', {
      maxAnimationDuration: 150,
      maxDroppedFramesAllowed: 0
    });
    
    // Fixed networks
    this.networkSpecificThresholds.set('Telkom_urban', {
      maxAnimationDuration: 600,
      maxDroppedFramesAllowed: 5
    });
    
    this.networkSpecificThresholds.set('ISP_urban', {
      maxAnimationDuration: 500,
      maxDroppedFramesAllowed: 4
    });
    
    // 5G
    this.networkSpecificThresholds.set('Rain_urban', {
      maxAnimationDuration: 600,
      maxDroppedFramesAllowed: 5
    });
  }
  
  /**
   * Extract latest network quality from metrics
   */
  private extractLatestNetworkQuality(
    animationMetrics: PerformanceMetric[],
    interactionMetrics: PerformanceMetric[]
  ): string | undefined {
    // Combine metrics and sort by timestamp (newest first)
    const allMetrics = [...animationMetrics, ...interactionMetrics]
      .sort((a, b) => b.timestamp - a.timestamp);
    
    // Find the most recent metric with network quality info
    for (const metric of allMetrics) {
      if (metric.networkQuality) {
        return metric.networkQuality;
      }
    }
    
    return undefined;
  }
  
  /**
   * Get device profile from capabilities
   */
  private getDeviceProfileFromCapabilities(
    capabilities: DeviceCapabilities
  ): DeviceProfile | undefined {
    // Convert capabilities to format expected by getDeviceProfile
    const profileCapabilities = {
      memory: capabilities.memory,
      cpuCores: capabilities.hardwareConcurrency,
      pixelRatio: capabilities.screenDimensions?.dpr,
      screenWidth: capabilities.screenDimensions?.width,
      screenHeight: capabilities.screenDimensions?.height,
      isLowEndDevice: capabilities.cpuPerformance === 'low'
    };
    
    return getDeviceProfile(profileCapabilities);
  }
  
  /**
   * Get network profile from quality string
   */
  private getNetworkProfileFromQuality(
    qualityString?: string
  ): NetworkProfile | undefined {
    if (!qualityString) return undefined;
    
    // Convert quality string to network conditions
    const conditions: any = {};
    
    if (qualityString === 'high') {
      conditions.downlink = 50;
      conditions.rtt = 30;
      conditions.effectiveType = '4g';
    } else if (qualityString === 'medium') {
      conditions.downlink = 10;
      conditions.rtt = 100;
      conditions.effectiveType = '4g';
    } else if (qualityString === 'low') {
      conditions.downlink = 3;
      conditions.rtt = 200;
      conditions.effectiveType = '3g';
    } else if (qualityString === 'poor') {
      conditions.downlink = 0.5;
      conditions.rtt = 500;
      conditions.effectiveType = '2g';
      conditions.saveData = true;
    }
    
    return getNetworkProfile(conditions);
  }
  
  /**
   * Send insights to backend
   * @param insights Insights to send
   */
  private sendInsightsToBackend(insights: PerformanceInsight[]): void {
    if (!this.config.backendEndpoint) return;
    
    // This would be implemented to send data to your backend
    // For now, just log that we would send it
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance Analytics] Would send ${insights.length} insights to ${this.config.backendEndpoint}`);
    }
    
    // Actual implementation would use fetch API or similar
    // fetch(this.config.backendEndpoint, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': this.config.apiKey ? `Bearer ${this.config.apiKey}` : undefined
    //   },
    //   body: JSON.stringify({
    //     insights,
    //     deviceInfo: {
    //       capabilities: this.monitoringService.getDeviceCapabilities(),
    //       timestamp: Date.now()
    //     }
    //   })
    // });
  }
}

/**
 * Default instance of the performance analytics service
 */
export const defaultPerformanceAnalyticsService = new PerformanceAnalyticsService();