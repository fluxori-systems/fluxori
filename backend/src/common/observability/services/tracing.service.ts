import { Injectable, Inject, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { v4 as uuidv4 } from "uuid";

// Import interfaces
import {
  Span,
  TraceContext,
  SpanOptions,
  SpanStatus,
  ITracingService,
  IEnhancedLoggerService,
} from "../interfaces/observability.interfaces";

// Import constants
import {
  TRACE_ATTRIBUTES,
  SAMPLING_RATES,
} from "../constants/observability.constants";
import { OBSERVABILITY_TOKENS } from "../constants/observability.tokens";
import { DEFAULT_OBSERVABILITY_OPTIONS } from "../interfaces/observability-options.interface";

/**
 * Internal span implementation
 */
class SpanImpl implements Span {
  private startTime: Date;
  private endTime: Date | null = null;
  private attributesMap: Map<string, any> = new Map();
  private events: Array<{
    name: string;
    timestamp: Date;
    attributes?: Record<string, any>;
  }> = [];
  private status: SpanStatus = SpanStatus.OK;
  private statusMessage?: string;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly traceId: string,
    public readonly parentSpanId?: string,
    attributes?: Record<string, any>,
  ) {
    this.startTime = new Date();
    if (attributes) {
      this.setAttributes(attributes);
    }
  }

  /**
   * Set a single attribute
   */
  setAttribute(key: string, value: any): void {
    this.attributesMap.set(key, value);
  }

  /**
   * Set multiple attributes
   */
  setAttributes(attributes: Record<string, any>): void {
    Object.entries(attributes).forEach(([key, value]) => {
      this.attributesMap.set(key, value);
    });
  }

  /**
   * Add an event to the span
   */
  addEvent(name: string, attributes?: Record<string, any>): void {
    this.events.push({
      name,
      timestamp: new Date(),
      attributes,
    });
  }

  /**
   * Set the span status
   */
  setStatus(status: SpanStatus, message?: string): void {
    this.status = status;
    this.statusMessage = message;
  }

  /**
   * End the span
   */
  end(): void {
    if (!this.endTime) {
      this.endTime = new Date();
    }
  }

  /**
   * Record an exception in the span
   */
  recordException(exception: Error): void {
    this.setStatus(SpanStatus.ERROR, exception.message);
    this.addEvent("exception", {
      "exception.type": exception.name,
      "exception.message": exception.message,
      "exception.stacktrace": exception.stack,
    });
  }

  /**
   * Get the duration of the span in milliseconds
   */
  getDurationMs(): number {
    const end = this.endTime || new Date();
    return end.getTime() - this.startTime.getTime();
  }

  /**
   * Get span attributes as a plain object
   */
  getAttributes(): Record<string, any> {
    return Object.fromEntries(this.attributesMap);
  }

  /**
   * Get span events
   */
  getEvents(): Array<{
    name: string;
    timestamp: Date;
    attributes?: Record<string, any>;
  }> {
    return [...this.events];
  }

  /**
   * Get trace context for this span
   */
  context(): TraceContext {
    return {
      traceId: this.traceId,
      spanId: this.id,
      parentSpanId: this.parentSpanId,
      startTime: this.startTime,
      attributes: this.getAttributes(),
    };
  }

  /**
   * Convert span to a serializable object
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      traceId: this.traceId,
      parentSpanId: this.parentSpanId,
      startTime: this.startTime.toISOString(),
      endTime: this.endTime ? this.endTime.toISOString() : null,
      duration: this.getDurationMs(),
      attributes: this.getAttributes(),
      events: this.events.map((event) => ({
        ...event,
        timestamp: event.timestamp.toISOString(),
      })),
      status: this.status,
      statusMessage: this.statusMessage,
    };
  }
}

/**
 * Tracing service that provides distributed tracing capabilities.
 * Implements ITracingService interface for dependency injection.
 */
@Injectable()
export class TracingService implements ITracingService {
  // Maps trace ID to active spans
  private readonly activeTraces: Map<string, Map<string, SpanImpl>> = new Map();

  // Trace context storage (for async operations)
  private readonly asyncContextStorage: Map<string, TraceContext> = new Map();

  // Default options
  private readonly enabled: boolean;
  private readonly defaultSamplingRate: number;
  private readonly pathSamplingRates: Record<string, number>;
  private readonly maxTraceAttributes: number;
  private readonly environment: string;
  private readonly region: string;
  private readonly serviceName: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(OBSERVABILITY_TOKENS.LOGGER_SERVICE) private readonly logger: IEnhancedLoggerService,
    @Optional() @Inject(OBSERVABILITY_TOKENS.OBSERVABILITY_OPTIONS) private readonly options?: any,
  ) {
    // Apply options with defaults
    const mergedOptions = { ...DEFAULT_OBSERVABILITY_OPTIONS, ...options };
    const tracingOptions = mergedOptions.tracing || {};

    this.enabled =
      tracingOptions.enabled !== undefined ? tracingOptions.enabled : true;
    this.defaultSamplingRate =
      tracingOptions.defaultSamplingRate || SAMPLING_RATES.DEFAULT;
    this.pathSamplingRates = tracingOptions.pathSamplingRates || {};
    this.maxTraceAttributes = tracingOptions.maxTraceAttributes || 32;
    this.environment =
      mergedOptions.environment || process.env.NODE_ENV || "development";
    this.region =
      mergedOptions.region || process.env.GCP_REGION || "africa-south1";
    this.serviceName = mergedOptions.appName || "fluxori-api";

    if (this.enabled && this.logger?.log) {
      this.logger.log("Tracing service initialized", "TracingService");
    }
  }

  /**
   * Determine if a trace should be sampled based on sampling rate
   */
  shouldSample(path?: string): boolean {
    if (!this.enabled) {
      return false;
    }

    // Check path-specific sampling rates
    if (path) {
      for (const [pattern, rate] of Object.entries(this.pathSamplingRates)) {
        if (new RegExp(pattern).test(path)) {
          return Math.random() < rate;
        }
      }
    }

    // Use default sampling rate
    return Math.random() < this.defaultSamplingRate;
  }

  /**
   * Start a new trace
   */
  startTrace(name: string, attributes?: Record<string, any>): Span {
    const traceId = uuidv4();
    const rootSpan = this.startSpan(
      {
        name,
        attributes: {
          ...attributes,
          [TRACE_ATTRIBUTES.SERVICE_NAME]: this.serviceName,
          [TRACE_ATTRIBUTES.ENV]: this.environment,
          [TRACE_ATTRIBUTES.REGION]: this.region,
        },
      },
      traceId,
    );

    return rootSpan;
  }

  /**
   * Start a new span (either in an existing trace or a new one)
   */
  startSpan(options: SpanOptions, traceId?: string): Span {
    if (!this.enabled) {
      // Return a no-op span if tracing is disabled
      return this.createNoOpSpan();
    }

    // Generate IDs
    const spanId = uuidv4();
    const effectiveTraceId =
      traceId || (options.parentSpan ? options.parentSpan.traceId : uuidv4());
    const parentSpanId = options.parentSpan ? options.parentSpan.id : undefined;

    // Create the span
    const span = new SpanImpl(
      spanId,
      options.name,
      effectiveTraceId,
      parentSpanId,
      options.attributes,
    );

    // Store in active traces
    if (!this.activeTraces.has(effectiveTraceId)) {
      this.activeTraces.set(effectiveTraceId, new Map());
    }
    const traceMap = this.activeTraces.get(effectiveTraceId);
    if (traceMap) {
      traceMap.set(spanId, span);
    }

    // Update the logger context
    if (this.logger?.setTraceContext) {
      this.logger.setTraceContext(effectiveTraceId, span.context());
    }

    return span;
  }

  /**
   * End and process a span
   */
  endSpan(span: Span): void {
    if (!this.enabled || !span) {
      return;
    }

    // Ensure the span is an internal span
    if (!(span instanceof SpanImpl)) {
      return;
    }

    // Mark the span as ended
    span.end();

    // Export the span to the logger
    const spanData = (span as SpanImpl).toJSON();
    if (this.logger?.debug) {
      this.logger.debug("Span completed", {
        service: "TracingService",
        trace: {
          traceId: span.traceId,
          spanId: span.id,
          parentSpanId: span.parentSpanId,
          startTime: new Date(),
        },
        span: spanData,
      });
    }

    // Clean up if it's a root span (no parent)
    if (!span.parentSpanId) {
      // Remove from active traces after a delay to allow for async spans
      setTimeout(() => {
        if (this.activeTraces.has(span.traceId)) {
          this.activeTraces.delete(span.traceId);
          if (this.logger?.clearTraceContext) {
            this.logger.clearTraceContext(span.traceId);
          }
        }
      }, 5000);
    } else {
      // Just remove this span from active spans
      if (this.activeTraces.has(span.traceId)) {
        const traceMap = this.activeTraces.get(span.traceId);
        if (traceMap && span.id) {
          traceMap.delete(span.id);
        }
      }
    }
  }

  /**
   * Get an active span by its ID
   */
  getSpan(traceId: string, spanId: string): Span | undefined {
    if (!this.enabled) {
      return undefined;
    }

    if (this.activeTraces.has(traceId)) {
      const traceMap = this.activeTraces.get(traceId);
      if (traceMap) {
        return traceMap.get(spanId);
      }
    }

    return undefined;
  }

  /**
   * Store trace context for async operations
   */
  setAsyncContext(asyncId: string, context: TraceContext): void {
    this.asyncContextStorage.set(asyncId, context);
  }

  /**
   * Get trace context for async operations
   */
  getAsyncContext(asyncId: string): TraceContext | undefined {
    return this.asyncContextStorage.get(asyncId);
  }

  /**
   * Clear async context
   */
  clearAsyncContext(asyncId: string): void {
    this.asyncContextStorage.delete(asyncId);
  }

  /**
   * Extract trace context from HTTP headers
   */
  extractTraceContext(
    headers: Record<string, string | string[]>,
  ): TraceContext | undefined {
    if (!this.enabled || !headers) {
      return undefined;
    }

    const traceId = this.getHeaderValue(headers, "x-trace-id");
    const spanId = this.getHeaderValue(headers, "x-span-id");

    if (!traceId || !spanId) {
      return undefined;
    }

    return {
      traceId,
      spanId,
      parentSpanId: this.getHeaderValue(headers, "x-parent-span-id"),
      startTime: new Date(),
      source: "http",
    };
  }

  /**
   * Inject trace context into HTTP headers
   */
  injectTraceContext(
    span: Span,
    headers: Record<string, string | string[]>,
  ): void {
    if (!this.enabled || !span) {
      return;
    }

    headers["x-trace-id"] = span.traceId;
    headers["x-span-id"] = span.id;
    if (span.parentSpanId) {
      headers["x-parent-span-id"] = span.parentSpanId;
    }
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
    if (!this.enabled) {
      return Promise.resolve(fn());
    }

    const span = this.startSpan({
      name,
      parentSpan,
      attributes,
    });

    try {
      const result = fn();

      if (result instanceof Promise) {
        return result
          .then((value) => {
            span.end();
            return value;
          })
          .catch((error) => {
            span.recordException(error);
            span.end();
            throw error;
          });
      } else {
        span.end();
        return Promise.resolve(result);
      }
    } catch (error) {
      span.recordException(error);
      span.end();
      throw error;
    }
  }

  /**
   * Create a no-op span for when tracing is disabled
   */
  private createNoOpSpan(): Span {
    const noOpId = "00000000-0000-0000-0000-000000000000";

    return {
      id: noOpId,
      name: "no-op-span",
      traceId: noOpId,
      parentSpanId: undefined,
      setAttribute: () => {},
      setAttributes: () => {},
      addEvent: () => {},
      setStatus: () => {},
      end: () => {},
      recordException: () => {},
      context: () => ({
        traceId: noOpId,
        spanId: noOpId,
        startTime: new Date(),
      }),
    };
  }

  /**
   * Safely extract header value (handling array values)
   */
  private getHeaderValue(
    headers: Record<string, string | string[]>,
    key: string,
  ): string | undefined {
    const value = headers[key] || headers[key.toLowerCase()];

    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  }
}
