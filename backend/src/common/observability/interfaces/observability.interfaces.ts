/**
 * Core interfaces for the Fluxori Observability System
 * This file defines the contracts for logging, tracing, and metrics
 */

import { LogLevel } from "@nestjs/common";
import { LoggerService } from "@nestjs/common";

/**
 * Trace context that is propagated throughout the system
 */
export interface TraceContext {
  /**
   * Unique request/operation ID used for correlating logs across services
   */
  traceId: string;

  /**
   * Parent span ID for linking operations in a causality chain
   */
  parentSpanId?: string;

  /**
   * Current span ID for the operation
   */
  spanId: string;

  /**
   * When the trace was started
   */
  startTime: Date;

  /**
   * Source service that initiated the trace
   */
  source?: string;

  /**
   * Additional trace attributes
   */
  attributes?: Record<string, any>;
}

/**
 * Context added to all logs
 */
export interface LogContext {
  /**
   * Trace information for distributed tracing
   */
  trace?: TraceContext;

  /**
   * User ID if available
   */
  userId?: string;

  /**
   * Organization ID if available
   */
  organizationId?: string;

  /**
   * Service name or module generating the log
   */
  service?: string;

  /**
   * Feature flag context
   */
  featureFlags?: Record<string, boolean>;

  /**
   * Custom dimensions for logs
   */
  [key: string]: any;
}

/**
 * Structured log entry
 */
export interface StructuredLogEntry {
  /**
   * Log message
   */
  message: string;

  /**
   * Severity level
   */
  severity: LogLevel;

  /**
   * Context data for the log
   */
  context?: LogContext;

  /**
   * Additional data related to the log
   */
  data?: Record<string, any>;

  /**
   * Timestamp when the log was created
   */
  timestamp: Date;

  /**
   * Stack trace for errors
   */
  stack?: string;
}

/**
 * Options for creating a span
 */
export interface SpanOptions {
  /**
   * Name of the span
   */
  name: string;

  /**
   * Optional parent span
   */
  parentSpan?: Span;

  /**
   * Attributes to add to the span
   */
  attributes?: Record<string, any>;
}

/**
 * Simplified span interface for tracing
 */
export interface Span {
  /**
   * Span ID
   */
  id: string;

  /**
   * Span name
   */
  name: string;

  /**
   * Trace ID that this span belongs to
   */
  traceId: string;

  /**
   * Parent span ID
   */
  parentSpanId?: string;

  /**
   * Add attribute to span
   */
  setAttribute(key: string, value: any): void;

  /**
   * Add multiple attributes to span
   */
  setAttributes(attributes: Record<string, any>): void;

  /**
   * Add event to span
   */
  addEvent(name: string, attributes?: Record<string, any>): void;

  /**
   * Set span status
   */
  setStatus(status: SpanStatus, message?: string): void;

  /**
   * End the span
   */
  end(): void;

  /**
   * Record exception in the span
   */
  recordException(exception: Error): void;

  /**
   * Get the current span context
   */
  context(): TraceContext;
}

/**
 * Span status
 */
export enum SpanStatus {
  OK = "ok",
  ERROR = "error",
}

/**
 * Metrics category
 */
export enum MetricCategory {
  BUSINESS = "business",
  TECHNICAL = "technical",
  PERFORMANCE = "performance",
  RELIABILITY = "reliability",
  SECURITY = "security",
  USER_EXPERIENCE = "user_experience",
}

/**
 * Metric value types
 */
export enum MetricValueType {
  INT64 = "int64",
  DOUBLE = "double",
  DISTRIBUTION = "distribution",
  BOOLEAN = "boolean",
  STRING = "string",
}

/**
 * Options for creating a metric
 */
export interface MetricOptions {
  /**
   * Metric name
   */
  name: string;

  /**
   * Description of the metric
   */
  description: string;

  /**
   * Metric category
   */
  category: MetricCategory;

  /**
   * Value type
   */
  valueType: MetricValueType;

  /**
   * Unit of measurement (e.g., "ms", "bytes", "count")
   */
  unit?: string;

  /**
   * Metric labels/dimensions
   */
  labels?: string[];

  /**
   * Whether values are cumulative (counters) or instantaneous (gauges)
   */
  isCumulative?: boolean;
}

/**
 * Interface for metric reporting
 */
export interface MetricReporter {
  /**
   * Record a counter metric
   */
  incrementCounter(
    metricName: string,
    value?: number,
    labels?: Record<string, string>,
  ): void;

  /**
   * Record a gauge metric
   */
  recordGauge(
    metricName: string,
    value: number,
    labels?: Record<string, string>,
  ): void;

  /**
   * Record a distribution metric
   */
  recordDistribution(
    metricName: string,
    value: number,
    labels?: Record<string, string>,
  ): void;

  /**
   * Register a metric
   */
  registerMetric(options: MetricOptions): void;

  /**
   * Start a timer, returns a function to stop the timer and record the duration
   */
  startTimer(metricName: string, labels?: Record<string, string>): () => void;
}

/**
 * Service health status
 */
export enum HealthStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  UNHEALTHY = "unhealthy",
}

/**
 * Component health information
 */
export interface ComponentHealth {
  /**
   * Component name
   */
  component: string;

  /**
   * Health status
   */
  status: HealthStatus;

  /**
   * Details about the component health
   */
  details?: Record<string, any>;

  /**
   * Time taken to check health
   */
  responseTime?: number;

  /**
   * Last checked timestamp
   */
  timestamp: Date;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  /**
   * Overall system status
   */
  status: HealthStatus;

  /**
   * Individual component results
   */
  components: ComponentHealth[];

  /**
   * Region information
   */
  region: string;

  /**
   * Environment (production, staging, etc.)
   */
  environment: string;

  /**
   * Version information
   */
  version: string;

  /**
   * Timestamp of the health check
   */
  timestamp: Date;
}

/** 
 * Type for health check functions
 */
export type HealthCheckFunction = () => Promise<ComponentHealth>;

/**
 * Enhanced Logger Service Interface
 * Extends the NestJS Logger Service with additional functionality
 */
export interface IEnhancedLoggerService extends LoggerService {
  /**
   * Set the current trace context
   */
  setTraceContext(traceId: string, context: TraceContext): void;

  /**
   * Get the current trace context
   */
  getTraceContext(traceId: string): TraceContext | undefined;

  /**
   * Clear a trace context
   */
  clearTraceContext(traceId: string): void;

  /**
   * Set global context that will be added to all logs
   */
  setGlobalContext(context: Record<string, any>): void;
}

/**
 * Metrics Service Interface
 */
export interface IMetricsService extends MetricReporter {
  /**
   * Get distribution values for a specific metric
   */
  getDistributionValues(metricName: string): number[] | undefined;

  /**
   * Get distribution statistics for a metric
   */
  getDistributionStats(metricName: string): {
    count: number;
    min: number;
    max: number;
    mean: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  } | undefined;

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, Record<string, number>>;
}

/**
 * Tracing Service Interface
 */
export interface ITracingService {
  /**
   * Determine if a trace should be sampled based on sampling rate
   */
  shouldSample(path?: string): boolean;

  /**
   * Start a new trace
   */
  startTrace(name: string, attributes?: Record<string, any>): Span;

  /**
   * Start a new span (either in an existing trace or a new one)
   */
  startSpan(options: SpanOptions, traceId?: string): Span;

  /**
   * End and process a span
   */
  endSpan(span: Span): void;

  /**
   * Extract trace context from HTTP headers
   */
  extractTraceContext(
    headers: Record<string, string | string[]>,
  ): TraceContext | undefined;

  /**
   * Inject trace context into HTTP headers
   */
  injectTraceContext(
    span: Span,
    headers: Record<string, string | string[]>,
  ): void;

  /**
   * Trace a function execution
   */
  traceFunction<T>(
    name: string,
    fn: () => T | Promise<T>,
    parentSpan?: Span,
    attributes?: Record<string, any>,
  ): Promise<T>;
}

/**
 * Health Service Interface
 */
export interface IHealthService {
  /**
   * Register a health check function
   */
  registerHealthCheck(
    component: string,
    checkFunction: HealthCheckFunction,
  ): void;

  /**
   * Get the current health status of a specific component
   */
  getComponentHealth(component: string): ComponentHealth | undefined;

  /**
   * Run all registered health checks
   */
  runAllHealthChecks(): Promise<HealthCheckResult>;

  /**
   * Get a simplified health check response (for public health endpoints)
   */
  getPublicHealthCheck(): Promise<{ status: string; region: string }>;

  /**
   * Get full health check details
   */
  getDetailedHealthCheck(): Promise<HealthCheckResult>;
}

/**
 * Main Observability Service Interface
 */
export interface IObservabilityService {
  // Tracing methods
  startTrace(name: string, attributes?: Record<string, any>): Span;
  startSpan(options: SpanOptions, traceId?: string): Span;
  endSpan(span: Span): void;
  extractTraceContext(headers: Record<string, string | string[]>): TraceContext | undefined;
  injectTraceContext(span: Span, headers: Record<string, string | string[]>): void;
  traceFunction<T>(name: string, fn: () => T | Promise<T>, parentSpan?: Span, attributes?: Record<string, any>): Promise<T>;
  
  // Logging methods
  log(message: string, context?: string | LogContext): void;
  error(message: string | Error, trace?: string, context?: string | LogContext): void;
  warn(message: string, context?: string | LogContext): void;
  debug(message: string, context?: string | LogContext): void;
  verbose(message: string, context?: string | LogContext): void;
  setGlobalContext(context: Record<string, any>): void;
  
  // Metrics methods
  registerMetric(options: MetricOptions): void;
  incrementCounter(metricName: string, value?: number, labels?: Record<string, string>): void;
  recordGauge(metricName: string, value: number, labels?: Record<string, string>): void;
  recordDistribution(metricName: string, value: number, labels?: Record<string, string>): void;
  startTimer(metricName: string, labels?: Record<string, string>): () => void;
  getDistributionStats(metricName: string): { count: number, min: number, max: number, mean: number, p50: number, p90: number, p95: number, p99: number } | undefined;
  
  // Health methods
  registerHealthCheck(component: string, checkFunction: HealthCheckFunction): void;
  runHealthChecks(): Promise<HealthCheckResult>;
  getPublicHealthCheck(): Promise<{ status: string; region: string }>;
  getDetailedHealthCheck(): Promise<HealthCheckResult>;
  
  // Convenience Methods
  trackHttpRequest(method: string, path: string, statusCode: number, durationMs: number, userId?: string, organizationId?: string): void;
  trackDatabaseOperation(operation: string, collection: string, durationMs: number, success?: boolean): void;
  trackCacheOperation(cache: string, hit: boolean): void;
  trackAIModelUsage(model: string, operation: string, inputTokens: number, outputTokens: number, durationMs: number, creditCost: number, organizationId?: string): void;
  trackFeatureFlagEvaluation(flag: string, enabled: boolean, userId?: string, organizationId?: string): void;
}