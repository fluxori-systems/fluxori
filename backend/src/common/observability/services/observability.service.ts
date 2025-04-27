import { Injectable, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Import interfaces

// Import constants
import {
  TRACE_ATTRIBUTES,
  METRIC_NAMES,
  SA_PERFORMANCE_THRESHOLDS,
} from '../constants/observability.constants';
import { OBSERVABILITY_TOKENS } from '../constants/observability.tokens';
import {
  DEFAULT_OBSERVABILITY_OPTIONS,
  ObservabilityModuleOptions,
} from '../interfaces/observability-options.interface';
import {
  Span,
  LogContext,
  SpanOptions,
  SpanStatus,
  MetricOptions,
  HealthStatus,
  ComponentHealth,
  HealthCheckResult,
  TraceContext,
  HealthCheckFunction,
  IObservabilityService,
  IEnhancedLoggerService,
  IMetricsService,
  ITracingService,
  IHealthService,
} from '../interfaces/observability.interfaces';

/**
 * Main service that combines all observability aspects (logging, tracing, metrics, health)
 * and provides a unified interface for them.
 * Implements IObservabilityService interface for dependency injection.
 */
@Injectable()
export class ObservabilityService implements IObservabilityService {
  // Options
  private readonly appName: string;
  private readonly environment: string;
  private readonly region: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(OBSERVABILITY_TOKENS.LOGGER_SERVICE)
    private readonly logger: IEnhancedLoggerService,
    @Inject(OBSERVABILITY_TOKENS.TRACING_SERVICE)
    private readonly tracer: ITracingService,
    @Inject(OBSERVABILITY_TOKENS.METRICS_SERVICE)
    private readonly metrics: IMetricsService,
    @Inject(OBSERVABILITY_TOKENS.HEALTH_SERVICE)
    private readonly healthService: IHealthService,
    @Optional()
    @Inject(OBSERVABILITY_TOKENS.OBSERVABILITY_OPTIONS)
    private readonly options?: ObservabilityModuleOptions,
  ) {
    // Apply options with defaults
    const mergedOptions = { ...DEFAULT_OBSERVABILITY_OPTIONS, ...options };

    this.appName = mergedOptions.appName || 'fluxori-api';
    this.environment =
      mergedOptions.environment || process.env.NODE_ENV || 'development';
    this.region =
      mergedOptions.region || process.env.GCP_REGION || 'africa-south1';

    if (this.logger?.log) {
      this.logger.log(
        'Observability service initialized',
        'ObservabilityService',
      );
    }
  }

  /**
   * Start a new trace
   */
  startTrace(name: string, attributes?: Record<string, any>): Span {
    return this.tracer.startTrace(name, {
      ...attributes,
      [TRACE_ATTRIBUTES.SERVICE_NAME]: this.appName,
    });
  }

  /**
   * Start a new span
   */
  startSpan(options: SpanOptions, traceId?: string): Span {
    return this.tracer.startSpan(options, traceId);
  }

  /**
   * End a span
   */
  endSpan(span: Span): void {
    this.tracer.endSpan(span);
  }

  /**
   * Extract trace context from HTTP headers
   */
  extractTraceContext(
    headers: Record<string, string | string[]>,
  ): TraceContext | undefined {
    return this.tracer.extractTraceContext(headers);
  }

  /**
   * Inject trace context into HTTP headers
   */
  injectTraceContext(
    span: Span,
    headers: Record<string, string | string[]>,
  ): void {
    this.tracer.injectTraceContext(span, headers);
  }

  /**
   * Trace a function execution
   */
  traceFunction<T>(
    name: string,
    fn: () => T | Promise<T>,
    parentSpan?: Span,
    attributes?: Record<string, any>,
  ): Promise<T> {
    return this.tracer.traceFunction(name, fn, parentSpan, attributes);
  }

  /**
   * Log an informational message with context
   */
  log(message: string, context?: string | LogContext): void {
    if (this.logger?.log) {
      this.logger.log(message, context);
    }
  }

  /**
   * Log an error message with context
   */
  error(
    message: string | Error,
    trace?: string,
    context?: string | LogContext,
  ): void {
    if (this.logger?.error) {
      this.logger.error(message, trace, context);
    }
  }

  /**
   * Log a warning message with context
   */
  warn(message: string, context?: string | LogContext): void {
    if (this.logger?.warn) {
      this.logger.warn(message, context);
    }
  }

  /**
   * Log a debug message with context
   */
  debug(message: string, context?: string | LogContext): void {
    if (this.logger?.debug) {
      this.logger.debug(message, context);
    }
  }

  /**
   * Log a verbose message with context
   */
  verbose(message: string, context?: string | LogContext): void {
    if (this.logger?.verbose) {
      this.logger.verbose(message, context);
    }
  }

  /**
   * Set global context that will be added to all logs
   */
  setGlobalContext(context: Record<string, any>): void {
    if (this.logger?.setGlobalContext) {
      this.logger.setGlobalContext(context);
    }
  }

  /**
   * Register a metric
   */
  registerMetric(options: MetricOptions): void {
    this.metrics.registerMetric(options);
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(
    metricName: string,
    value: number = 1,
    labels?: Record<string, string>,
  ): void {
    this.metrics.incrementCounter(metricName, value, labels);
  }

  /**
   * Record a gauge metric value
   */
  recordGauge(
    metricName: string,
    value: number,
    labels?: Record<string, string>,
  ): void {
    this.metrics.recordGauge(metricName, value, labels);
  }

  /**
   * Record a distribution metric value
   */
  recordDistribution(
    metricName: string,
    value: number,
    labels?: Record<string, string>,
  ): void {
    this.metrics.recordDistribution(metricName, value, labels);
  }

  /**
   * Start a timer and return a function to stop it and record the duration
   */
  startTimer(metricName: string, labels?: Record<string, string>): () => void {
    return this.metrics.startTimer(metricName, labels);
  }

  /**
   * Get distribution statistics for a metric
   */
  getDistributionStats(metricName: string):
    | {
        count: number;
        min: number;
        max: number;
        mean: number;
        p50: number;
        p90: number;
        p95: number;
        p99: number;
      }
    | undefined {
    return this.metrics.getDistributionStats(metricName);
  }

  /**
   * Register a health check
   */
  registerHealthCheck(
    component: string,
    checkFunction: HealthCheckFunction,
  ): void {
    this.healthService.registerHealthCheck(component, checkFunction);
  }

  /**
   * Run all health checks
   */
  runHealthChecks(): Promise<HealthCheckResult> {
    return this.healthService.runAllHealthChecks();
  }

  /**
   * Get a simplified health check (for public endpoints)
   */
  getPublicHealthCheck(): Promise<{ status: string; region: string }> {
    return this.healthService.getPublicHealthCheck();
  }

  /**
   * Get a detailed health check
   */
  getDetailedHealthCheck(): Promise<HealthCheckResult> {
    return this.healthService.getDetailedHealthCheck();
  }

  // ----- Convenience Methods -----

  /**
   * Track an HTTP request
   */
  trackHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    userId?: string,
    organizationId?: string,
  ): void {
    // Record request count
    this.incrementCounter(METRIC_NAMES.HTTP_REQUEST_COUNT, 1, {
      method,
      path,
      status: statusCode.toString(),
    });

    // Record request duration
    this.recordDistribution(METRIC_NAMES.HTTP_REQUEST_DURATION, durationMs, {
      method,
      path,
      status: statusCode.toString(),
    });

    // Record error count if applicable
    if (statusCode >= 400) {
      this.incrementCounter(METRIC_NAMES.HTTP_ERROR_COUNT, 1, {
        method,
        path,
        status: statusCode.toString(),
      });
    }

    // Log slow requests based on SA thresholds
    if (
      durationMs > SA_PERFORMANCE_THRESHOLDS.HTTP_ACCEPTABLE_RESPONSE_TIME_MS
    ) {
      this.warn(`Slow HTTP request: ${method} ${path} took ${durationMs}ms`, {
        service: 'HttpMetrics',
        userId,
        organizationId,
        timestamp: new Date(),
        customFields: {
          request: JSON.stringify({ method, path, statusCode, durationMs }),
        },
      });
    }
  }

  /**
   * Track a database operation
   */
  trackDatabaseOperation(
    operation: string,
    collection: string,
    durationMs: number,
    success: boolean = true,
  ): void {
    // Record operation count
    this.incrementCounter(METRIC_NAMES.DB_OPERATION_COUNT, 1, {
      operation,
      collection,
      success: success.toString(),
    });

    // Record operation duration
    this.recordDistribution(METRIC_NAMES.DB_OPERATION_DURATION, durationMs, {
      operation,
      collection,
    });

    // Log slow DB operations based on SA thresholds
    if (
      durationMs > SA_PERFORMANCE_THRESHOLDS.DB_ACCEPTABLE_OPERATION_TIME_MS
    ) {
      this.warn(
        `Slow DB operation: ${operation} on ${collection} took ${durationMs}ms`,
        {
          service: 'DatabaseMetrics',
          timestamp: new Date(),
          customFields: {
            database: JSON.stringify({ operation, collection, durationMs }),
          },
        },
      );
    }

    // Record error if applicable
    if (!success) {
      this.incrementCounter(METRIC_NAMES.DB_ERROR_COUNT, 1, {
        operation,
        collection,
      });
    }
  }

  /**
   * Track cache operations
   */
  trackCacheOperation(cache: string, hit: boolean): void {
    if (hit) {
      this.incrementCounter(METRIC_NAMES.CACHE_HIT_COUNT, 1, { cache });
    } else {
      this.incrementCounter(METRIC_NAMES.CACHE_MISS_COUNT, 1, { cache });
    }
  }

  /**
   * Track AI model usage
   */
  trackAIModelUsage(
    model: string,
    operation: string,
    inputTokens: number,
    outputTokens: number,
    durationMs: number,
    creditCost: number,
    organizationId?: string,
  ): void {
    // Track token usage
    this.incrementCounter(METRIC_NAMES.AI_TOKEN_USAGE, inputTokens, {
      model,
      operation,
      type: 'input',
    });

    this.incrementCounter(METRIC_NAMES.AI_TOKEN_USAGE, outputTokens, {
      model,
      operation,
      type: 'output',
    });

    // Track request duration
    this.recordDistribution(METRIC_NAMES.AI_REQUEST_DURATION, durationMs, {
      model,
      operation,
    });

    // Track credit usage
    if (creditCost > 0 && organizationId) {
      this.recordGauge(METRIC_NAMES.AI_CREDIT_USAGE, creditCost, {
        model,
        operation,
        organizationId,
      });
    }

    // Log slow AI requests based on SA thresholds
    if (durationMs > SA_PERFORMANCE_THRESHOLDS.AI_ACCEPTABLE_RESPONSE_TIME_MS) {
      this.warn(
        `Slow AI request: ${operation} with ${model} took ${durationMs}ms`,
        {
          service: 'AIMetrics',
          timestamp: new Date(),
          customFields: {
            ai: JSON.stringify({
              model,
              operation,
              durationMs,
              inputTokens,
              outputTokens,
            }),
          },
        },
      );
    }
  }

  /**
   * Track feature flag evaluation
   */
  trackFeatureFlagEvaluation(
    flag: string,
    enabled: boolean,
    userId?: string,
    organizationId?: string,
  ): void {
    this.incrementCounter(METRIC_NAMES.FEATURE_FLAG_EVALUATION, 1, {
      flag,
      result: enabled ? 'enabled' : 'disabled',
    });

    if (enabled) {
      this.incrementCounter(METRIC_NAMES.FEATURE_FLAG_ENABLED_COUNT, 1, {
        flag,
      });
    }

    this.debug(
      `Feature flag ${flag} evaluated: ${enabled ? 'enabled' : 'disabled'}`,
      {
        service: 'FeatureFlagMetrics',
        userId,
        organizationId,
        timestamp: new Date(),
        customFields: {
          featureFlag: JSON.stringify({ flag, enabled }),
        },
      },
    );
  }

  /**
   * Check if a request should be monitored for South African performance
   */
  shouldMonitorForSA(path: string): boolean {
    // List of paths to specifically monitor for South African performance
    const saMonitoredPaths = [
      '/api/orders',
      '/api/marketplace',
      '/api/inventory',
      '/api/auth',
      '/api/ai-insights',
    ];

    return (
      this.region === 'africa-south1' ||
      saMonitoredPaths.some((monitoredPath) => path.startsWith(monitoredPath))
    );
  }
}
