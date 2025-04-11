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
 * Configuration options for performance analytics
 */
export interface PerformanceAnalyticsConfig {
  /** Whether to enable automatic insights generation */
  enableAutoInsights?: boolean;
  
  /** Whether to include device-specific insights */
  includeDeviceInsights?: boolean;
  
  /** Whether to include network-specific insights */
  includeNetworkInsights?: boolean;
  
  /** Minimum severity level to include */
  minSeverity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  
  /** Maximum number of insights to store */
  maxInsightCount?: number;
  
  /** Whether to enable real-time monitoring */
  enableRealtimeMonitoring?: boolean;
}

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
  
  /** Timestamp when the insight was generated */
  timestamp: number;
}

/**
 * Service for analyzing performance data for South African market
 */
export class SouthAfricanPerformanceAnalyticsService {
  // Dependencies
  private readonly performanceMonitoring: IPerformanceMonitoringService;
  
  // Keep a record of generated insights
  private readonly insights: Map<string, PerformanceInsight> = new Map();
  
  constructor(
    performanceMonitoring: IPerformanceMonitoringService = defaultPerformanceMonitoringService
  ) {
    this.performanceMonitoring = performanceMonitoring;
  }
  
  /**
   * Get all recorded performance insights
   */
  getAllInsights(): PerformanceInsight[] {
    return Array.from(this.insights.values());
  }
  
  /**
   * Get insights filtered by severity
   */
  getInsightsBySeverity(severity: PerformanceInsight['severity']): PerformanceInsight[] {
    return this.getAllInsights().filter(insight => insight.severity === severity);
  }
  
  /**
   * Get insights related to a specific metric
   */
  getInsightsByMetric(metricId: string): PerformanceInsight[] {
    return this.getAllInsights().filter(insight => 
      insight.relatedMetrics.includes(metricId)
    );
  }
  
  /**
   * Get insights for a specific device profile
   */
  getInsightsByDeviceProfile(profileId: string): PerformanceInsight[] {
    return this.getAllInsights().filter(insight => 
      !insight.targetDeviceProfiles || 
      insight.targetDeviceProfiles.includes(profileId)
    );
  }
  
  /**
   * Get insights for a specific network profile
   */
  getInsightsByNetworkProfile(profileId: string): PerformanceInsight[] {
    return this.getAllInsights().filter(insight => 
      !insight.targetNetworkProfiles || 
      insight.targetNetworkProfiles.includes(profileId)
    );
  }
  
  /**
   * Get insights sorted by estimated impact
   */
  getInsightsByImpact(minImpact: number = 0): PerformanceInsight[] {
    return this.getAllInsights()
      .filter(insight => insight.estimatedImpact >= minImpact)
      .sort((a, b) => b.estimatedImpact - a.estimatedImpact);
  }
  
  /**
   * Get the most recent insights
   */
  getRecentInsights(count: number = 5): PerformanceInsight[] {
    return this.getAllInsights()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }
  
  /**
   * Generate insights based on current performance metrics,
   * device capabilities, and network conditions.
   */
  generateInsights(): PerformanceInsight[] {
    // Get current metrics
    const metrics = this.performanceMonitoring.getMetrics();
    
    // Get detected or default device profile
    const deviceCapabilities: DeviceCapabilities = {
      memory: 4,
      hardwareConcurrency: 4,
      screenDimensions: {
        width: 1080,
        height: 1920,
        dpr: 2
      },
      deviceType: 'mobile',
      cpuPerformance: 'medium',
      gpuTier: 'medium',
      isHighResolutionScreen: true
    };
    
    const deviceProfile = getDeviceProfile(deviceCapabilities) || southAfricanDeviceProfiles[1]; // Mid-range as default
    
    // Get detected or default network profile
    const networkConditions = {
      downlink: 5,
      rtt: 100,
      effectiveType: '4g',
      saveData: false
    };
    
    const networkProfile = getNetworkProfile(networkConditions) || southAfricanNetworkProfiles[0]; // Vodacom urban as default
    
    // Array to collect insights
    const insights: PerformanceInsight[] = [];
    
    // Generate device-specific insights
    this.generateDeviceInsights(deviceProfile, metrics, insights);
    
    // Generate network-specific insights
    this.generateNetworkInsights(networkProfile, insights);
    
    // Generate insights based on metrics
    this.generateMetricInsights(metrics, deviceProfile, networkProfile, insights);
    
    // Store insights
    insights.forEach(insight => {
      this.insights.set(insight.id, insight);
    });
    
    return insights;
  }
  
  /**
   * Generate insights based on device capabilities
   */
  private generateDeviceInsights(
    deviceProfile: DeviceProfile,
    metrics: PerformanceMetric[],
    insights: PerformanceInsight[]
  ): void {
    if (!deviceProfile) return;
    
    // Check for low RAM devices
    if (deviceProfile.memory <= 2048) {
      insights.push({
        id: `low_memory_device_${deviceProfile.deviceName}`,
        title: 'Low memory device optimization needed',
        description: `Device profile "${deviceProfile.deviceName}" has limited memory (${deviceProfile.memory}MB), which may cause performance issues with heavy animations and UI components.`,
        severity: 'high',
        recommendation: 'Reduce memory usage by implementing memory-efficient components, lazy loading and careful DOM management.',
        relatedMetrics: metrics
          .filter(m => m.label.includes('memory') || m.label.includes('heap'))
          .map(m => m.id),
        targetDeviceProfiles: [deviceProfile.deviceName],
        estimatedImpact: 8,
        timestamp: Date.now()
      });
    }
    
    // Check for CPU constraints
    if (deviceProfile.processorTier === 'entry' || deviceProfile.processorTier === 'low') {
      insights.push({
        id: `cpu_constraint_${deviceProfile.deviceName}`,
        title: 'CPU-constrained device detected',
        description: `Device profile "${deviceProfile.deviceName}" has limited CPU capabilities, which may impact animation smoothness and responsiveness.`,
        severity: 'medium',
        recommendation: 'Optimize JavaScript execution, reduce animation complexity, and consider using lightweight animations for this device profile.',
        relatedMetrics: metrics
          .filter(m => m.label.includes('cpu') || m.label.includes('fps'))
          .map(m => m.id),
        targetDeviceProfiles: [deviceProfile.deviceName],
        estimatedImpact: 7,
        timestamp: Date.now()
      });
    }
    
    // Check for low-end GPU
    if (!deviceProfile.hasGPUAcceleration) {
      insights.push({
        id: `gpu_limitation_${deviceProfile.deviceName}`,
        title: 'GPU limitations detected',
        description: `Device profile "${deviceProfile.deviceName}" has limited GPU capabilities, which impacts rendering performance, especially for complex animations and effects.`,
        severity: 'medium',
        recommendation: 'Reduce use of complex CSS animations, shadows, blurs, and 3D transforms. Consider using simpler visual effects for this device profile.',
        relatedMetrics: metrics
          .filter(m => m.label.includes('fps') || m.label.includes('render'))
          .map(m => m.id),
        targetDeviceProfiles: [deviceProfile.deviceName],
        estimatedImpact: 6,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Generate insights based on network capabilities
   */
  private generateNetworkInsights(
    networkProfile: NetworkProfile,
    insights: PerformanceInsight[]
  ): void {
    if (!networkProfile) return;
    
    // For expensive data networks, provide data usage insights
    if (networkProfile.dataCostPerMBZAR > 0.04) {
      // Check if recommendations are implemented
      const recommendedOptimizations: string[] = [];
      
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
    
    // High latency network optimizations
    if (networkProfile.latencyMs > 200) {
      insights.push({
        id: `high_latency_${networkProfile.provider}_${networkProfile.locationType}`,
        title: `High latency optimization for ${networkProfile.provider}`,
        description: `Users on ${networkProfile.provider} in ${networkProfile.locationType} areas experience high latency (avg ${networkProfile.latencyMs}ms), which impacts perceived performance.`,
        severity: 'high',
        recommendation: 'Implement optimistic UI updates, reduce round-trips, and use background sync for non-critical operations.',
        relatedMetrics: [],
        targetNetworkProfiles: [`${networkProfile.provider}_${networkProfile.locationType}`],
        estimatedImpact: 7,
        timestamp: Date.now()
      });
    }
    
    // Connection stability insights
    if (networkProfile.packetLossPercent > 5.0) {
      insights.push({
        id: `unstable_connection_${networkProfile.provider}_${networkProfile.locationType}`,
        title: `Connection reliability for ${networkProfile.provider}`,
        description: `Users on ${networkProfile.provider} in ${networkProfile.locationType} areas experience unstable connections (${(networkProfile.packetLossPercent).toFixed(1)}% packet loss), with frequent disconnections.`,
        severity: 'high',
        recommendation: 'Implement offline-first approach, robust retry mechanisms, and local caching strategies.',
        relatedMetrics: [],
        targetNetworkProfiles: [`${networkProfile.provider}_${networkProfile.locationType}`],
        estimatedImpact: 9,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Generate insights based on performance metrics
   */
  private generateMetricInsights(
    metrics: PerformanceMetric[],
    deviceProfile: DeviceProfile,
    networkProfile: NetworkProfile,
    insights: PerformanceInsight[]
  ): void {
    // Find FPS metrics
    const fpsMetrics = metrics.filter(m => m.label.includes('fps'));
    const hasLowFPS = fpsMetrics.some(m => m.value < 30);
    
    if (hasLowFPS) {
      insights.push({
        id: 'low_fps',
        title: 'Low frame rate detected',
        description: 'Frame rate is below 30 FPS, which results in visibly choppy animations.',
        severity: 'high',
        recommendation: 'Optimize animations, reduce visual complexity, and prioritize smooth motion.',
        relatedMetrics: fpsMetrics.map(m => m.id),
        estimatedImpact: 8,
        timestamp: Date.now()
      });
    }
    
    // Find memory usage metrics
    const memoryMetrics = metrics.filter(m => m.label.includes('memory') || m.label.includes('heap'));
    const highMemoryUsage = memoryMetrics.some(m => 
      (m.label.includes('percent') && m.value > 70) || 
      (m.label.includes('mb') && m.value > deviceProfile.memory * 0.4)
    );
    
    if (highMemoryUsage) {
      insights.push({
        id: 'high_memory_usage',
        title: 'High memory consumption',
        description: 'Memory usage is excessive, which may lead to poor performance or crashes on lower-end devices.',
        severity: 'critical',
        recommendation: 'Check for memory leaks, reduce DOM size, and optimize asset loading.',
        relatedMetrics: memoryMetrics.map(m => m.id),
        estimatedImpact: 9,
        timestamp: Date.now()
      });
    }
    
    // Find layout shift metrics
    const clsMetrics = metrics.filter(m => m.label.includes('cls') || m.label.includes('layout_shift'));
    const highCLS = clsMetrics.some(m => m.value > 0.1);
    
    if (highCLS) {
      insights.push({
        id: 'high_cls',
        title: 'Excessive layout shifts',
        description: 'Cumulative Layout Shift (CLS) is high, causing a poor user experience as elements move unexpectedly.',
        severity: 'high',
        recommendation: 'Set explicit dimensions for images and embeds, avoid inserting content above existing content, and use transform animations instead of layout-triggering properties.',
        relatedMetrics: clsMetrics.map(m => m.id),
        estimatedImpact: 7,
        timestamp: Date.now()
      });
    }
    
    // Find loading performance metrics
    const loadingMetrics = metrics.filter(m => 
      m.label.includes('lcp') || 
      m.label.includes('fcp') || 
      m.label.includes('load_time')
    );
    
    const slowLoading = loadingMetrics.some(m => 
      (m.label.includes('lcp') && m.value > 2500) || 
      (m.label.includes('fcp') && m.value > 1800) ||
      (m.label.includes('load_time') && m.value > 3000)
    );
    
    if (slowLoading) {
      // Tailor recommendations based on network type
      let loadingRecommendation = 'Optimize critical rendering path, reduce initial bundle size, and implement code splitting.';
      
      if (networkProfile && networkProfile.downloadSpeedMbps < 1.0) {
        // Specific recommendations for low-bandwidth networks
        loadingRecommendation = 'Drastically reduce initial payload size, implement aggressive code splitting, and defer non-critical resources. Consider a text-only mode for extremely slow connections.';
      }
      
      insights.push({
        id: 'slow_loading',
        title: 'Slow page loading',
        description: 'Page loading metrics indicate the site loads too slowly, especially on slower connections common in South Africa.',
        severity: 'critical',
        recommendation: loadingRecommendation,
        relatedMetrics: loadingMetrics.map(m => m.id),
        estimatedImpact: 10,
        timestamp: Date.now()
      });
    }
    
    // Find TTI (Time to Interactive) and TBT (Total Blocking Time) metrics
    const interactivityMetrics = metrics.filter(m => 
      m.label.includes('tti') || 
      m.label.includes('tbt') || 
      m.label.includes('fid')
    );
    
    const poorInteractivity = interactivityMetrics.some(m => 
      (m.label.includes('tti') && m.value > 3500) || 
      (m.label.includes('tbt') && m.value > 300) ||
      (m.label.includes('fid') && m.value > 100)
    );
    
    if (poorInteractivity) {
      insights.push({
        id: 'poor_interactivity',
        title: 'Poor interactivity',
        description: 'The page takes too long to become fully interactive, causing user frustration, especially on lower-end devices common in South Africa.',
        severity: 'high',
        recommendation: 'Break up long tasks, optimize JavaScript execution, reduce main thread work, and implement web workers for heavy operations.',
        relatedMetrics: interactivityMetrics.map(m => m.id),
        estimatedImpact: 8,
        timestamp: Date.now()
      });
    }
  }
}

// Export a default instance
export const defaultPerformanceAnalyticsService = new SouthAfricanPerformanceAnalyticsService();