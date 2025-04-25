import { Injectable, LogLevel, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Logging, Entry } from '@google-cloud/logging';
import { v4 as uuidv4 } from 'uuid';

// Import interfaces

// Import constants
import {
  SENSITIVE_DATA_FIELDS,
  SAMPLING_RATES,
} from '../constants/observability.constants';
import { OBSERVABILITY_TOKENS } from '../constants/observability.tokens';
import { DEFAULT_OBSERVABILITY_OPTIONS } from '../interfaces/observability-options.interface';
import {
  LogContext,
  StructuredLogEntry,
  TraceContext,
  IEnhancedLoggerService,
} from '../interfaces/observability.interfaces';

/**
 * Enhanced logger service that extends the basic NestJS logger with
 * structured logging, context enrichment, and GCP Cloud Logging integration.
 * Implements IEnhancedLoggerService interface for dependency injection.
 */
@Injectable()
export class EnhancedLoggerService implements IEnhancedLoggerService {
  private cloudLogging: Logging;
  private logName: string;
  private projectId: string;
  private isProduction: boolean;
  private logStream: any;

  // Stores active trace contexts by correlation ID
  private activeTraces: Map<string, TraceContext> = new Map();

  // Global log context that is added to all logs
  private globalContext: Record<string, any> = {};

  // Cache of sanitized objects to improve performance
  private readonly sanitizeCache = new Map<string, any>();

  // Default options
  private readonly logToConsole: boolean;
  private readonly sanitizeLogs: boolean;
  private readonly useJsonFormat: boolean;
  private readonly debugSamplingRate: number;
  private readonly environment: string;
  private readonly region: string;

  constructor(
    private readonly configService: ConfigService,
    @Optional()
    @Inject(OBSERVABILITY_TOKENS.OBSERVABILITY_OPTIONS)
    private readonly options?: any,
  ) {
    // Apply options with defaults
    const mergedOptions = { ...DEFAULT_OBSERVABILITY_OPTIONS, ...options };
    const loggingOptions = mergedOptions.logging || {};

    this.projectId = this.configService.get<string>('GCP_PROJECT_ID', '');
    this.logName = this.configService.get<string>(
      'GCP_LOG_NAME',
      'fluxori-api',
    );
    this.isProduction =
      this.configService.get<string>('NODE_ENV', 'development') ===
      'production';

    this.logToConsole = this.configService.get<boolean>('LOG_TO_CONSOLE', true);
    this.sanitizeLogs =
      loggingOptions.sanitizeLogs !== undefined
        ? loggingOptions.sanitizeLogs
        : true;
    this.useJsonFormat =
      loggingOptions.useJsonFormat !== undefined
        ? loggingOptions.useJsonFormat
        : this.isProduction;
    this.debugSamplingRate =
      loggingOptions.debugSamplingRate || SAMPLING_RATES.DEBUG_LOGS;
    this.environment =
      mergedOptions.environment || process.env.NODE_ENV || 'development';
    this.region =
      mergedOptions.region || process.env.GCP_REGION || 'africa-south1';

    // Add global context
    this.setGlobalContext({
      environment: this.environment,
      region: this.region,
      service: mergedOptions.appName || 'fluxori-api',
      ...(loggingOptions.customFields || {}),
    });

    // Initialize GCP Cloud Logging client
    if (this.isProduction && this.projectId) {
      try {
        this.cloudLogging = new Logging({
          projectId: this.projectId,
        });
        this.logStream = this.cloudLogging.log(this.logName);
        this.log(
          `Enhanced logger initialized for project ${this.projectId}`,
          'LoggerService',
        );
      } catch (error) {
        console.error('Failed to initialize Cloud Logging:', error);
      }
    }
  }

  /**
   * Log an informational message
   */
  log(
    message: string | Record<string, any>,
    context?: string | LogContext,
  ): void {
    this.writeLog('log' as LogLevel, message, context);
  }

  /**
   * Log an error message
   */
  error(
    message: string | Error | Record<string, any>,
    trace?: string,
    context?: string | LogContext,
  ): void {
    let errorMessage: string;
    let errorTrace: string | undefined = trace;

    if (message instanceof Error) {
      errorMessage = message.message;
      errorTrace = message.stack;
    } else if (typeof message === 'object') {
      errorMessage = JSON.stringify(message);
    } else {
      errorMessage = message;
    }

    this.writeLog('error', errorMessage, context, errorTrace);
  }

  /**
   * Log a warning message
   */
  warn(
    message: string | Record<string, any>,
    context?: string | LogContext,
  ): void {
    this.writeLog('warn', message, context);
  }

  /**
   * Log a debug message
   */
  debug(
    message: string | Record<string, any>,
    context?: string | LogContext,
  ): void {
    // Apply sampling for debug logs
    if (this.isProduction && Math.random() > this.debugSamplingRate) {
      return;
    }
    this.writeLog('debug', message, context);
  }

  /**
   * Log a verbose message
   */
  verbose(
    message: string | Record<string, any>,
    context?: string | LogContext,
  ): void {
    // Apply even more aggressive sampling for verbose logs
    if (this.isProduction && Math.random() > this.debugSamplingRate / 2) {
      return;
    }
    this.writeLog('verbose', message, context);
  }

  /**
   * Set the current trace context
   */
  setTraceContext(traceId: string, context: TraceContext): void {
    this.activeTraces.set(traceId, context);
  }

  /**
   * Get the current trace context
   */
  getTraceContext(traceId: string): TraceContext | undefined {
    return this.activeTraces.get(traceId);
  }

  /**
   * Clear a trace context
   */
  clearTraceContext(traceId: string): void {
    this.activeTraces.delete(traceId);
  }

  /**
   * Set global context that will be added to all logs
   */
  setGlobalContext(context: Record<string, any>): void {
    this.globalContext = {
      ...this.globalContext,
      ...context,
    };
  }

  /**
   * Create a structured log with all context
   */
  createStructuredLog(
    level: LogLevel,
    message: string | Record<string, any>,
    context?: string | LogContext,
    trace?: string,
  ): StructuredLogEntry {
    // Parse the message
    let logMessage: string;
    let logData: Record<string, any> | undefined;

    if (typeof message === 'object') {
      logMessage = message.message || 'Object logged';
      logData = message;
    } else {
      logMessage = message;
    }

    // Parse the context
    let contextName: string | undefined;
    let logContext: LogContext = {};

    if (typeof context === 'string') {
      contextName = context;
    } else if (context) {
      logContext = context;
      contextName = logContext.service;
    }

    // Add trace context if it exists
    if (
      logContext.trace?.traceId &&
      this.activeTraces.has(logContext.trace.traceId)
    ) {
      logContext.trace = this.activeTraces.get(logContext.trace.traceId);
    }

    // Create structured log entry
    const logEntry: StructuredLogEntry = {
      message: logMessage,
      severity: level,
      context: {
        ...this.globalContext,
        ...logContext,
        service: contextName || this.globalContext.service || 'fluxori-api',
      },
      data: logData,
      timestamp: new Date(),
    };

    // Add stack trace for errors
    if (trace) {
      logEntry.stack = trace;
    }

    // Sanitize sensitive data if enabled
    if (this.sanitizeLogs) {
      if (logEntry.data) {
        logEntry.data = this.sanitizeObject(logEntry.data);
      }
      if (logEntry.context) {
        logEntry.context = this.sanitizeObject(logEntry.context);
      }
    }

    return logEntry;
  }

  /**
   * Format a structured log for console output
   */
  private formatForConsole(log: StructuredLogEntry): string {
    const timestamp = log.timestamp.toISOString();
    const context = log.context?.service ? `[${log.context.service}]` : '';
    const traceId = log.context?.trace?.traceId
      ? `(trace: ${log.context.trace.traceId})`
      : '';

    let message = `${timestamp} ${log.severity.toUpperCase()} ${context} ${log.message} ${traceId}`;

    if (log.data && Object.keys(log.data).length > 0) {
      message += '\nData: ' + JSON.stringify(log.data, null, 2);
    }

    if (log.stack) {
      message += '\nStack: ' + log.stack;
    }

    return message;
  }

  /**
   * Write a log to appropriate outputs
   */
  private writeLog(
    level: LogLevel,
    message: string | Record<string, any>,
    context?: string | LogContext,
    trace?: string,
  ): void {
    // Create structured log
    const structuredLog = this.createStructuredLog(
      level,
      message,
      context,
      trace,
    );

    // Write to console if enabled
    if (this.logToConsole) {
      const consoleMessage = this.useJsonFormat
        ? JSON.stringify(structuredLog)
        : this.formatForConsole(structuredLog);

      switch (level) {
        case 'error':
          console.error(consoleMessage);
          break;
        case 'warn':
          console.warn(consoleMessage);
          break;
        case 'debug':
          console.debug(consoleMessage);
          break;
        case 'verbose':
          console.debug(consoleMessage);
          break;
        default:
          console.log(consoleMessage);
      }
    }

    // Write to Cloud Logging if in production and configured
    if (this.isProduction && this.cloudLogging && this.logStream) {
      try {
        const severity = this.mapLogLevelToSeverity(level);

        // Create metadata with proper GCP resource
        const metadata = {
          resource: {
            type: 'cloud_run_revision',
            labels: {
              service_name: 'fluxori-api',
              revision_name: process.env.K_REVISION || 'local',
            },
          },
          severity,
          // Add trace information if available
          ...(structuredLog.context?.trace?.traceId && {
            'logging.googleapis.com/trace': `projects/${this.projectId}/traces/${structuredLog.context.trace.traceId}`,
            'logging.googleapis.com/spanId': structuredLog.context.trace.spanId,
          }),
        };

        // Create entry payload
        const entryPayload = {
          message: structuredLog.message,
          ...structuredLog.data,
          context: structuredLog.context,
          timestamp: structuredLog.timestamp.toISOString(),
          ...(structuredLog.stack && { stack: structuredLog.stack }),
        };

        // Write to Cloud Logging
        const entry = this.logStream.entry(metadata, entryPayload);
        this.logStream.write(entry).catch((err: Error) => {
          console.error(`Failed to write to Cloud Logging: ${err.message}`);
        });
      } catch (error) {
        console.error('Failed to write to Cloud Logging:', error);
      }
    }
  }

  /**
   * Map NestJS log level to GCP Cloud Logging severity
   */
  private mapLogLevelToSeverity(level: LogLevel): string {
    switch (level) {
      case 'error':
        return 'ERROR';
      case 'warn':
        return 'WARNING';
      case 'debug':
        return 'DEBUG';
      case 'verbose':
        return 'DEBUG';
      default:
        return 'INFO';
    }
  }

  /**
   * Sanitize an object by removing sensitive data
   */
  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    // For performance, check if we've already sanitized this object
    const objString = JSON.stringify(obj);
    if (this.sanitizeCache.has(objString)) {
      return this.sanitizeCache.get(objString);
    }

    // Clone the object
    const sanitized = JSON.parse(JSON.stringify(obj));

    // Recursively sanitize
    const sanitizeRecursive = (current: any): any => {
      if (!current || typeof current !== 'object') {
        return current;
      }

      // Handle arrays
      if (Array.isArray(current)) {
        return current.map((item) => sanitizeRecursive(item));
      }

      // Handle objects
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(current)) {
        // Check if key is sensitive
        if (
          SENSITIVE_DATA_FIELDS.some((field) =>
            key.toLowerCase().includes(field.toLowerCase()),
          )
        ) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          // Recursively sanitize objects
          result[key] = sanitizeRecursive(value);
        } else {
          result[key] = value;
        }
      }

      return result;
    };

    const result = sanitizeRecursive(sanitized);

    // Cache the result
    this.sanitizeCache.set(objString, result);

    // Keep cache size reasonable
    if (this.sanitizeCache.size > 1000) {
      const oldestKey = this.sanitizeCache.keys().next().value;
      this.sanitizeCache.delete(oldestKey);
    }

    return result;
  }
}
