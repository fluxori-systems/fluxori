'use client';

import {
  PerformanceMetric,
  PerformanceMetricType,
  MetricPriority,
  PerformanceMonitoringConfig,
  AnimationPerformanceData,
  DeviceCapabilities,
  IPerformanceMonitoringService,
  SamplingStrategy
} from '../../types/performance';
import type { ConnectionQualityResult } from '../../../shared/types/sa-market-types';
import { MotionMode } from '../../../shared/types/motion-types';
import { defaultConnectionService } from '../connection-service.impl';

/**
 * Implementation of the Performance Monitoring Service
 * Provides detailed performance metrics for animations and components
 * with special focus on South African market optimizations
 */
export class PerformanceMonitoringService implements IPerformanceMonitoringService {
  // Performance metrics collection
  private metrics: PerformanceMetric[] = [];
  
  // Active timing operations
  private timings: Map<string, {
    startTime: number;
    type: PerformanceMetricType;
    priority: MetricPriority;
    component?: string;
    context?: Record<string, any>;
  }> = new Map();
  
  // Configuration
  private config: PerformanceMonitoringConfig = {
    enabled: true,
    consoleLogging: false,
    priorityThreshold: 'medium',
    sampleRate: 0.1, // Only sample 10% by default to minimize overhead
    bufferSize: 100,
    analyticsEnabled: false,
    measureFps: false,
    trackDeviceCapabilities: true
  };
  
  // Sampling strategy
  private samplingStrategy: SamplingStrategy = 'adaptive';
  
  // Device capabilities
  private deviceCapabilities: DeviceCapabilities = {
    cpuPerformance: 'unknown',
    gpuTier: 'unknown',
    deviceType: 'unknown',
    isHighResolutionScreen: false
  };
  
  constructor() {
    if (typeof window !== 'undefined') {
      // Detect device capabilities on initialization
      this.detectDeviceCapabilities();
      
      // Set appropriate sampling strategy based on device
      this.setSamplingStrategy();
    }
  }
  
  /**
   * Record a performance metric
   * @param metric Metric to record
   */
  public recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    if (!this.config.enabled) return;
    
    // Apply sampling based on strategy
    if (!this.shouldSampleMetric(metric.priority, metric.type)) {
      return;
    }
    
    // Add timestamp and network information
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
      networkQuality: this.getCurrentNetworkQuality()?.quality,
      motionMode: this.getCurrentMotionMode(),
      dataSaver: this.isDataSaverEnabled()
    };
    
    // Add to metrics collection
    this.metrics.push(fullMetric);
    
    // Log to console if enabled
    if (this.config.consoleLogging) {
      console.log(`[Performance] ${fullMetric.label}: ${fullMetric.value}ms`, fullMetric);
    }
    
    // Send to analytics if enabled and sample rate allows
    if (this.config.analyticsEnabled && Math.random() < (this.config.sampleRate || 0.1)) {
      this.sendToAnalytics(fullMetric);
    }
    
    // Check if we need to clear metrics buffer
    if (this.metrics.length > (this.config.bufferSize || 100)) {
      // Keep the most recent metrics
      this.metrics = this.metrics.slice(-Math.floor((this.config.bufferSize || 100) / 2));
    }
  }
  
  /**
   * Start timing an operation
   * @param metricId Unique identifier for the metric
   * @param options Additional timing options
   * @returns Timing handle (pass to stopTiming)
   */
  public startTiming(
    metricId: string, 
    options?: {
      type?: PerformanceMetricType;
      priority?: MetricPriority;
      component?: string;
      context?: Record<string, any>;
    }
  ): string {
    if (!this.config.enabled) return metricId;
    
    const handle = `${metricId}_${Date.now()}`;
    
    this.timings.set(handle, {
      startTime: performance.now(),
      type: options?.type || 'component',
      priority: options?.priority || 'medium',
      component: options?.component,
      context: options?.context
    });
    
    return handle;
  }
  
  /**
   * Stop timing an operation and record the metric
   * @param handle Timing handle from startTiming
   * @param additionalData Additional data to record with metric
   * @returns Timing result in milliseconds
   */
  public stopTiming(
    handle: string, 
    additionalData?: Record<string, any>
  ): number {
    if (!this.config.enabled || !this.timings.has(handle)) return 0;
    
    const endTime = performance.now();
    const timing = this.timings.get(handle)!;
    const duration = endTime - timing.startTime;
    
    // Record the metric
    this.recordMetric({
      id: handle.split('_')[0], // Extract original metric ID
      type: timing.type,
      label: handle.split('_')[0].replace(/([A-Z])/g, ' $1').trim(), // Format ID as label
      value: duration,
      priority: timing.priority,
      component: timing.component,
      context: {
        ...timing.context,
        ...additionalData
      }
    });
    
    // Clear the timing
    this.timings.delete(handle);
    
    return duration;
  }
  
  /**
   * Record animation performance data
   * @param data Animation performance data
   */
  public recordAnimationPerformance(data: AnimationPerformanceData): void {
    if (!this.config.enabled) return;
    
    // Calculate performance metrics
    const duration = data.endTime - data.startTime;
    
    // Record the metric
    this.recordMetric({
      id: `animation_${data.component || 'unknown'}_${data.animationType || 'unknown'}`,
      type: 'animation',
      label: `Animation: ${data.component || 'Unknown'} (${data.animationType || 'Unknown'})`,
      value: duration,
      priority: this.getPriorityForAnimation(data),
      component: data.component,
      context: {
        ...data,
        droppedFrames: data.droppedFrames || false,
        droppedFrameCount: data.droppedFrameCount || 0,
        avgFrameTime: data.avgFrameTime || 0
      }
    });
  }
  
  /**
   * Get collected metrics
   * @param options Filter options
   * @returns Collected metrics
   */
  public getMetrics(options?: {
    type?: PerformanceMetricType;
    priority?: MetricPriority;
    component?: string;
    limit?: number;
  }): PerformanceMetric[] {
    if (!options) return [...this.metrics];
    
    // Filter metrics
    let filteredMetrics = [...this.metrics];
    
    if (options.type) {
      filteredMetrics = filteredMetrics.filter(m => m.type === options.type);
    }
    
    if (options.priority) {
      filteredMetrics = filteredMetrics.filter(m => this.getPriorityLevel(m.priority) >= this.getPriorityLevel(options.priority || 'low'));
    }
    
    if (options.component) {
      filteredMetrics = filteredMetrics.filter(m => m.component === options.component);
    }
    
    // Apply limit
    if (options.limit && options.limit > 0) {
      filteredMetrics = filteredMetrics.slice(-options.limit);
    }
    
    return filteredMetrics;
  }
  
  /**
   * Clear collected metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
  }
  
  /**
   * Get detected device capabilities
   */
  public getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }
  
  /**
   * Get current monitoring configuration
   */
  public getConfig(): PerformanceMonitoringConfig {
    return { ...this.config };
  }
  
  /**
   * Update monitoring configuration
   * @param config New configuration (partial)
   */
  public updateConfig(config: Partial<PerformanceMonitoringConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update sampling strategy if device tracking changed
    if (config.trackDeviceCapabilities !== undefined) {
      this.setSamplingStrategy();
    }
  }
  
  /**
   * Get numeric priority level for comparison
   * @param priority Priority level
   * @returns Numeric priority level (higher is more important)
   */
  private getPriorityLevel(priority: MetricPriority): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }
  
  /**
   * Get current network quality
   */
  private getCurrentNetworkQuality(): ConnectionQualityResult | undefined {
    try {
      return defaultConnectionService.getConnectionQuality();
    } catch (e) {
      return undefined;
    }
  }
  
  /**
   * Get current motion mode
   */
  private getCurrentMotionMode(): string | undefined {
    try {
      if ('getMotionMode' in defaultConnectionService) {
        return (defaultConnectionService as any).getMotionMode();
      }
      return undefined;
    } catch (e) {
      return undefined;
    }
  }
  
  /**
   * Check if data saver is enabled
   */
  private isDataSaverEnabled(): boolean | undefined {
    try {
      return defaultConnectionService.isDataSaverEnabled();
    } catch (e) {
      return undefined;
    }
  }
  
  /**
   * Send metric to analytics (placeholder for integration)
   * @param metric Metric to send
   */
  private sendToAnalytics(metric: PerformanceMetric): void {
    // This would be implemented to connect with your analytics provider
    // E.g., Google Analytics, Mixpanel, custom backend, etc.
    
    // For now, just log that we would send it
    if (this.config.consoleLogging) {
      console.log('[Analytics] Would send metric:', metric);
    }
  }
  
  /**
   * Determine priority for animation performance data
   * @param data Animation performance data
   * @returns Priority level for the metric
   */
  private getPriorityForAnimation(data: AnimationPerformanceData): MetricPriority {
    // Prioritize problematic animations
    if (data.droppedFrames && (data.droppedFrameCount || 0) > 5) {
      return 'critical';
    }
    
    if (data.droppedFrames) {
      return 'high';
    }
    
    // Prioritize by animation complexity
    if (data.complexity === 'high') {
      return 'medium';
    }
    
    return 'low';
  }
  
  /**
   * Determine if a metric should be sampled based on strategy
   * @param priority Metric priority
   * @param type Metric type
   * @returns Whether to sample this metric
   */
  private shouldSampleMetric(priority: MetricPriority, type: PerformanceMetricType): boolean {
    // Always sample based on priority threshold
    if (this.getPriorityLevel(priority) >= this.getPriorityLevel(this.config.priorityThreshold || 'medium')) {
      return true;
    }
    
    // Apply sampling strategy
    switch (this.samplingStrategy) {
      case 'always':
        return true;
        
      case 'random':
        return Math.random() < (this.config.sampleRate || 0.1);
        
      case 'adaptive':
        // Sample less on low-end devices
        if (this.deviceCapabilities.cpuPerformance === 'low') {
          return Math.random() < (this.config.sampleRate || 0.1) / 2;
        }
        
        // Sample more for animation metrics on high-end devices
        if (type === 'animation' && this.deviceCapabilities.cpuPerformance === 'high') {
          return Math.random() < Math.min(1.0, (this.config.sampleRate || 0.1) * 2);
        }
        
        return Math.random() < (this.config.sampleRate || 0.1);
        
      case 'priority':
        // Only sample based on priority
        return false;
        
      default:
        return Math.random() < (this.config.sampleRate || 0.1);
    }
  }
  
  /**
   * Detect device capabilities to optimize performance monitoring
   */
  private detectDeviceCapabilities(): void {
    if (typeof window === 'undefined') return;
    
    // Get device memory (Chrome only)
    const memory = (navigator as any).deviceMemory as number | undefined;
    
    // Get CPU cores
    const cores = navigator.hardwareConcurrency || 0;
    
    // Get screen information
    const dpr = window.devicePixelRatio || 1;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    
    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = isMobile && Math.min(screenWidth, screenHeight) > 640;
    
    // Determine device capabilities
    const deviceType = isTablet ? 'tablet' : (isMobile ? 'mobile' : 'desktop');
    
    // Estimate CPU performance
    let cpuPerformance: 'high' | 'medium' | 'low' | 'unknown' = 'unknown';
    
    if (cores >= 8) {
      cpuPerformance = 'high';
    } else if (cores >= 4) {
      cpuPerformance = 'medium';
    } else if (cores > 0) {
      cpuPerformance = 'low';
    }
    
    // Adjust based on memory (if available)
    if (memory !== undefined) {
      if (memory <= 2) {
        cpuPerformance = 'low'; // Low RAM devices are usually constrained
      } else if (memory >= 8 && cpuPerformance !== 'low') {
        cpuPerformance = 'high';
      }
    }
    
    // Detect browser engine
    let browserEngine = 'unknown';
    if (navigator.userAgent.indexOf('Chrome') !== -1) {
      browserEngine = 'Blink';
    } else if (navigator.userAgent.indexOf('Safari') !== -1) {
      browserEngine = 'WebKit';
    } else if (navigator.userAgent.indexOf('Firefox') !== -1) {
      browserEngine = 'Gecko';
    } else if (navigator.userAgent.indexOf('Edg') !== -1) {
      browserEngine = 'EdgeHTML';
    }
    
    // Heuristic check for GPU capabilities based on DPR and resolution
    let gpuTier: 'high' | 'medium' | 'low' | 'unknown' = 'unknown';
    
    // Simple heuristic, can be improved
    const totalPixels = screenWidth * screenHeight * dpr * dpr;
    
    if (totalPixels > 4000000) {
      gpuTier = 'high';
    } else if (totalPixels > 2000000) {
      gpuTier = 'medium';
    } else {
      gpuTier = 'low';
    }
    
    // Adjust for mobile devices
    if (deviceType === 'mobile') {
      if (gpuTier === 'high') gpuTier = 'medium';
      if (cpuPerformance === 'high') cpuPerformance = 'medium';
    }
    
    // Set device capabilities
    this.deviceCapabilities = {
      cpuPerformance,
      gpuTier,
      memory,
      deviceType,
      hardwareConcurrency: cores,
      isHighResolutionScreen: dpr > 1,
      screenDimensions: {
        width: screenWidth,
        height: screenHeight,
        dpr
      },
      browserEngine
    };
  }
  
  /**
   * Set appropriate sampling strategy based on device capabilities
   */
  private setSamplingStrategy(): void {
    // Don't apply if device tracking is disabled
    if (!this.config.trackDeviceCapabilities) {
      this.samplingStrategy = 'random';
      return;
    }
    
    // Use adaptive sampling by default for optimal performance/data balance
    this.samplingStrategy = 'adaptive';
    
    // Adjust sample rate based on device capabilities
    if (this.deviceCapabilities.cpuPerformance === 'low') {
      // Sample less on low-end devices to reduce performance impact
      this.config.sampleRate = Math.min(this.config.sampleRate || 0.1, 0.05);
    } else if (this.deviceCapabilities.cpuPerformance === 'high') {
      // Can sample more on high-end devices
      this.config.sampleRate = Math.min((this.config.sampleRate || 0.1) * 2, 0.5);
    }
  }
}

/**
 * Default instance of the performance monitoring service
 */
export const defaultPerformanceMonitoringService = new PerformanceMonitoringService();