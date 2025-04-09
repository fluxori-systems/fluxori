'use client';

/**
 * Types of performance metrics to collect
 */
export type PerformanceMetricType = 
  | 'animation' // Animation rendering performance
  | 'interaction' // User interaction performance
  | 'network' // Network-related metrics
  | 'layout' // Layout calculation metrics
  | 'component' // Component-specific metrics
  | 'rendering'; // General rendering metrics

/**
 * Metric priority levels for importance/severity
 */
export type MetricPriority = 
  | 'critical' // Mission critical metrics
  | 'high' // High priority metrics
  | 'medium' // Medium priority metrics
  | 'low'; // Low priority metrics (debug only)

/**
 * Performance metric data structure
 */
export interface PerformanceMetric {
  /** Unique identifier for the metric */
  id: string;
  
  /** Type of metric */
  type: PerformanceMetricType;
  
  /** Metric label/name */
  label: string;
  
  /** Metric value (e.g., timing in ms) */
  value: number;
  
  /** Priority/importance level */
  priority: MetricPriority;
  
  /** Component name associated with metric */
  component?: string;
  
  /** Timestamp when metric was recorded */
  timestamp: number;
  
  /** Additional contextual data */
  context?: Record<string, any>;
  
  /** Network quality when metric was recorded */
  networkQuality?: string;
  
  /** User's motion mode preference */
  motionMode?: string;
  
  /** Whether data saver mode was active */
  dataSaver?: boolean;
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceMonitoringConfig {
  /** Whether performance monitoring is enabled */
  enabled: boolean;
  
  /** Whether to log metrics to console */
  consoleLogging?: boolean;
  
  /** Priority threshold for metrics to collect */
  priorityThreshold?: MetricPriority;
  
  /** Sample rate for metrics (0.0-1.0) */
  sampleRate?: number;
  
  /** Maximum metrics to collect before sending/clearing */
  bufferSize?: number;
  
  /** Whether to send metrics to analytics */
  analyticsEnabled?: boolean;
  
  /** Whether to measure actual FPS/frame budget */
  measureFps?: boolean;
  
  /** Whether to track device capabilities */
  trackDeviceCapabilities?: boolean;
}

/**
 * Performance sampling strategies
 */
export type SamplingStrategy = 
  | 'always' // Always collect metrics
  | 'random' // Randomly sample based on sample rate
  | 'adaptive' // Adaptively sample based on device/network
  | 'priority'; // Sample based on priority threshold

/**
 * Animation performance data
 */
export interface AnimationPerformanceData {
  /** Animation duration in ms */
  duration: number;
  
  /** Animation start timestamp */
  startTime: number;
  
  /** Animation end timestamp */
  endTime: number;
  
  /** Average frame time during animation */
  avgFrameTime?: number;
  
  /** Whether animation dropped frames */
  droppedFrames?: boolean;
  
  /** Number of dropped frames if any */
  droppedFrameCount?: number;
  
  /** Animation complexity level */
  complexity?: 'high' | 'medium' | 'low';
  
  /** Animation type */
  animationType?: string;
  
  /** Component where animation occurred */
  component?: string;
}

/**
 * Device capability metrics
 */
export interface DeviceCapabilities {
  /** CPU cores or performance estimate */
  cpuPerformance: 'high' | 'medium' | 'low' | 'unknown';
  
  /** GPU capabilities estimate */
  gpuTier: 'high' | 'medium' | 'low' | 'unknown';
  
  /** Device memory in GB */
  memory?: number;
  
  /** Device type */
  deviceType: 'desktop' | 'tablet' | 'mobile' | 'unknown';
  
  /** Hardware concurrency (CPU threads) */
  hardwareConcurrency?: number;
  
  /** Whether the device has a high-resolution screen */
  isHighResolutionScreen: boolean;
  
  /** Screen dimensions */
  screenDimensions?: {
    width: number;
    height: number;
    dpr: number;
  };
  
  /** Browser engine */
  browserEngine?: string;
}

/**
 * Interface for the performance monitoring service
 */
export interface IPerformanceMonitoringService {
  /**
   * Record a performance metric
   * @param metric Metric to record
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void;
  
  /**
   * Start timing an operation
   * @param metricId Unique identifier for the metric
   * @param options Additional timing options
   * @returns Timing handle (pass to stopTiming)
   */
  startTiming(
    metricId: string, 
    options?: {
      type?: PerformanceMetricType;
      priority?: MetricPriority;
      component?: string;
      context?: Record<string, any>;
    }
  ): string;
  
  /**
   * Stop timing an operation and record the metric
   * @param handle Timing handle from startTiming
   * @param additionalData Additional data to record with metric
   * @returns Timing result in milliseconds
   */
  stopTiming(
    handle: string, 
    additionalData?: Record<string, any>
  ): number;
  
  /**
   * Record animation performance data
   * @param data Animation performance data
   */
  recordAnimationPerformance(data: AnimationPerformanceData): void;
  
  /**
   * Get collected metrics
   * @param options Filter options
   * @returns Collected metrics
   */
  getMetrics(options?: {
    type?: PerformanceMetricType;
    priority?: MetricPriority;
    component?: string;
    limit?: number;
  }): PerformanceMetric[];
  
  /**
   * Clear collected metrics
   */
  clearMetrics(): void;
  
  /**
   * Get detected device capabilities
   */
  getDeviceCapabilities(): DeviceCapabilities;
  
  /**
   * Get current monitoring configuration
   */
  getConfig(): PerformanceMonitoringConfig;
  
  /**
   * Update monitoring configuration
   * @param config New configuration (partial)
   */
  updateConfig(config: Partial<PerformanceMonitoringConfig>): void;
}