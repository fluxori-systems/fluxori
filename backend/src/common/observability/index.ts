/**
 * Fluxori Observability System
 *
 * A comprehensive observability solution that includes:
 * - Structured, context-rich logging
 * - Distributed tracing across service boundaries
 * - Metric collection and reporting
 * - Health monitoring
 *
 * Optimized for South African deployment with performance considerations.
 */

// Export module
export { ObservabilityModule } from "./observability.module";

// Export services by interface
export { 
  IEnhancedLoggerService,
  IMetricsService,
  ITracingService,
  IHealthService,
  IObservabilityService,
  
  // Export other interfaces
  LogContext,
  Span,
  SpanOptions,
  TraceContext,
  SpanStatus,
  MetricCategory,
  MetricValueType,
  MetricOptions,
  HealthStatus,
  ComponentHealth,
  HealthCheckResult,
  HealthCheckFunction,
} from './interfaces/observability.interfaces';

// Export concrete implementations (for backward compatibility)
export { EnhancedLoggerService } from './services/enhanced-logger.service';
export { MetricsService } from './services/metrics.service';
export { TracingService } from './services/tracing.service';
export { HealthService } from './services/health.service';
export { ObservabilityService } from './services/observability.service';

// Export interceptors
export { LoggingInterceptor } from './interceptors/logging.interceptor';
export { MetricsInterceptor } from './interceptors/metrics.interceptor';
export { TracingInterceptor } from './interceptors/tracing.interceptor';

// Export options interface
export { ObservabilityModuleOptions } from './interfaces/observability-options.interface';

// Export constants
export { METRIC_NAMES, TRACE_ATTRIBUTES, OBSERVABILITY_PROVIDERS } from './constants/observability.constants';
export { OBSERVABILITY_TOKENS } from './constants/observability.tokens';

// Export controllers
export { HealthController } from './controllers/health.controller';
export { MetricsController } from './controllers/metrics.controller';
