/**
 * Options for the Observability Module
 */
import { LogLevel } from '@nestjs/common';

import { SAMPLING_RATES } from '../constants/observability.constants';

/**
 * Logging options
 */
export interface LoggingOptions {
  /**
   * Minimum log level to record
   */
  logLevel?: LogLevel;

  /**
   * Whether to sanitize sensitive data in logs
   */
  sanitizeLogs?: boolean;

  /**
   * Whether to use JSON format for logs
   */
  useJsonFormat?: boolean;

  /**
   * Custom log fields to include in all logs
   */
  customFields?: Record<string, any>;

  /**
   * Sampling rate for debug logs
   */
  debugSamplingRate?: number;
}

/**
 * Tracing options
 */
export interface TracingOptions {
  /**
   * Whether to enable distributed tracing
   */
  enabled?: boolean;

  /**
   * Default sampling rate
   */
  defaultSamplingRate?: number;

  /**
   * Path-specific sampling rates
   */
  pathSamplingRates?: Record<string, number>;

  /**
   * Whether to include request bodies in traces
   */
  includeRequestBodies?: boolean;

  /**
   * Whether to include response bodies in traces
   */
  includeResponseBodies?: boolean;

  /**
   * Maximum trace attributes to record
   */
  maxTraceAttributes?: number;
}

/**
 * Metrics options
 */
export interface MetricsOptions {
  /**
   * Whether to enable metrics collection
   */
  enabled?: boolean;

  /**
   * Whether to register default metrics
   */
  registerDefaultMetrics?: boolean;

  /**
   * Prefix for all metric names
   */
  metricPrefix?: string;

  /**
   * Default labels to add to all metrics
   */
  defaultLabels?: Record<string, string>;

  /**
   * Metrics collection interval in milliseconds
   */
  collectionInterval?: number;
}

/**
 * Health check options
 */
export interface HealthCheckOptions {
  /**
   * Whether to enable health checks
   */
  enabled?: boolean;

  /**
   * Whether to register default health checks
   */
  registerDefaultHealthChecks?: boolean;

  /**
   * Health check interval in milliseconds
   */
  healthCheckInterval?: number;

  /**
   * Whether to expose detailed health information
   */
  exposeDetails?: boolean;
}

/**
 * Options for the ObservabilityModule
 */
export interface ObservabilityModuleOptions {
  /**
   * Application name
   */
  appName?: string;

  /**
   * Environment name
   */
  environment?: string;

  /**
   * Region name
   */
  region?: string;

  /**
   * Logging options
   */
  logging?: LoggingOptions;

  /**
   * Tracing options
   */
  tracing?: TracingOptions;

  /**
   * Metrics options
   */
  metrics?: MetricsOptions;

  /**
   * Health check options
   */
  health?: HealthCheckOptions;
}

/**
 * Default observability options
 */
export const DEFAULT_OBSERVABILITY_OPTIONS: ObservabilityModuleOptions = {
  appName: 'fluxori-api',
  environment: process.env.NODE_ENV || 'development',
  region: process.env.GCP_REGION || 'africa-south1',
  logging: {
    logLevel: 'log',
    sanitizeLogs: true,
    useJsonFormat: process.env.NODE_ENV === 'production',
    debugSamplingRate: SAMPLING_RATES.DEBUG_LOGS,
  },
  tracing: {
    enabled: true,
    defaultSamplingRate: SAMPLING_RATES.DEFAULT,
    includeRequestBodies: false,
    includeResponseBodies: false,
    maxTraceAttributes: 32,
  },
  metrics: {
    enabled: true,
    registerDefaultMetrics: true,
    metricPrefix: 'fluxori.',
    collectionInterval: 60000, // 1 minute
  },
  health: {
    enabled: true,
    registerDefaultHealthChecks: true,
    healthCheckInterval: 60000, // 1 minute
    exposeDetails: process.env.NODE_ENV !== 'production',
  },
};
