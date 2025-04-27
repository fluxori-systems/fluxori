// Types for frontend observability components

/**
 * Basic health check result interface
 */
export interface HealthCheckResult {
  status: "up" | "down" | "degraded";
  name: string;
  details?: Record<string, any>;
  message?: string;
  timestamp: string;
}

/**
 * Detailed system health information
 */
export interface SystemHealthInfo {
  status: "healthy" | "unhealthy" | "degraded";
  components: HealthCheckResult[];
  uptime: number;
  timestamp: string;
  version: string;
}

/**
 * Interface for metric data points
 */
export interface MetricDataPoint {
  timestamp: string;
  value: number;
  labels?: Record<string, string>;
}

/**
 * Interface for a complete metric with metadata
 */
export interface Metric {
  name: string;
  description: string;
  unit: string;
  type: "counter" | "gauge" | "histogram";
  dataPoints: MetricDataPoint[];
}

/**
 * Interface for a trace span
 */
export interface TraceSpan {
  id: string;
  parentId?: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: "success" | "error" | "unknown";
  attributes: Record<string, any>;
}

/**
 * Interface for a complete trace
 */
export interface Trace {
  traceId: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  spans: TraceSpan[];
  rootSpan: string; // ID of the root span
}

/**
 * Interface for error tracking information
 */
export interface ErrorInfo {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  componentName?: string;
  url?: string;
  user?: {
    id: string;
    email?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Interface for frontend performance metrics
 */
export interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  resourceLoadTimes: Array<{
    name: string;
    duration: number;
    initiatorType: string;
  }>;
}

/**
 * Interface for API request metrics
 */
export interface ApiMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: string;
  success: boolean;
}

/**
 * Interface for observability system configuration
 */
export interface ObservabilityConfig {
  enabled: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
  errorSamplingRate: number;
  performanceSamplingRate: number;
  metricsReportingIntervalMs: number;
  tracesSamplingRate: number;
  apiRequestTracking: boolean;
  userInteractionTracking: boolean;
}
