import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Optional,
} from "@nestjs/common";

import { Request, Response } from "express";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";

// Import services
import {
  TRACE_ATTRIBUTES,
  TRACE_HEADERS,
  SAMPLING_RATES,
} from "../constants/observability.constants";
import {
  ObservabilityModuleOptions,
  DEFAULT_OBSERVABILITY_OPTIONS,
} from "../interfaces/observability-options.interface";
import { Span } from "../interfaces/observability.interfaces";
import { ObservabilityService } from "../services/observability.service";
import { TracingService } from "../services/tracing.service";

// Import constants

// Import interfaces

/**
 * Interceptor that adds tracing to HTTP requests
 */
@Injectable()
export class TracingInterceptor implements NestInterceptor {
  private readonly samplingRates: Record<string, number>;
  private readonly defaultSamplingRate: number;
  private readonly includeRequestBodies: boolean;
  private readonly includeResponseBodies: boolean;

  constructor(
    private readonly tracer: TracingService,
    private readonly observability: ObservabilityService,
    @Optional()
    @Inject("OBSERVABILITY_OPTIONS")
    private readonly options?: ObservabilityModuleOptions,
  ) {
    // Apply options with defaults
    const mergedOptions = { ...DEFAULT_OBSERVABILITY_OPTIONS, ...options };
    const tracingOptions = mergedOptions.tracing || {};

    this.samplingRates = tracingOptions.pathSamplingRates || {};
    this.defaultSamplingRate =
      tracingOptions.defaultSamplingRate || SAMPLING_RATES.DEFAULT;
    this.includeRequestBodies = tracingOptions.includeRequestBodies || false;
    this.includeResponseBodies = tracingOptions.includeResponseBodies || false;
  }

  /**
   * Intercept HTTP requests to add tracing
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Only apply to HTTP requests
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context
      .switchToHttp()
      .getRequest<
        Request & { user?: any; traceId?: string; span?: any; route?: any }
      >();
    const path = request.route?.path || request.path;

    // Apply sampling
    const shouldSample = this.shouldSampleRequest(path);
    if (!shouldSample) {
      return next.handle();
    }

    // Get or create a trace context
    const traceId = this.getOrCreateTraceId(request);
    const spanId = uuidv4();
    const parentSpanId = this.getParentSpanId(request);

    // Start a span for this request
    const span = this.tracer.startSpan(
      {
        name: `HTTP ${request.method} ${path}`,
        attributes: {
          [TRACE_ATTRIBUTES.HTTP_METHOD]: request.method,
          [TRACE_ATTRIBUTES.HTTP_URL]: request.url,
          ...(request.user && { [TRACE_ATTRIBUTES.USER_ID]: request.user.id }),
          ...(request.headers["user-agent"] && {
            "http.user_agent": request.headers["user-agent"],
          }),
          ...(this.includeRequestBodies &&
            request.body && {
              "http.request.body": this.sanitizeBody(request.body),
            }),
        },
      },
      traceId,
    );

    // Add span context to the request for downstream use
    request.span = span;
    request.traceId = traceId;

    // Create a timer to measure request duration
    const startTime = Date.now();

    // Process the request and capture the result
    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse<Response>();
          const duration = Date.now() - startTime;

          // Add response attributes to the span
          span.setAttribute(
            TRACE_ATTRIBUTES.HTTP_STATUS_CODE,
            response.statusCode,
          );

          if (this.includeResponseBodies && data) {
            span.setAttribute("http.response.body", this.sanitizeBody(data));
          }

          // Add user context if available
          let userId: string | undefined;
          let organizationId: string | undefined;

          if (request.user) {
            userId = request.user.id;
            organizationId = request.user.organizationId;
            span.setAttribute(TRACE_ATTRIBUTES.USER_ID, userId);

            if (organizationId) {
              span.setAttribute(
                TRACE_ATTRIBUTES.ORGANIZATION_ID,
                organizationId,
              );
            }
          }

          // End the span
          span.end();

          // Track metrics
          this.observability.trackHttpRequest(
            request.method,
            path,
            response.statusCode,
            duration,
            userId,
            organizationId,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Add error attributes to the span
          span.setAttribute(TRACE_ATTRIBUTES.HTTP_STATUS_CODE, statusCode);
          span.setAttribute(TRACE_ATTRIBUTES.ERROR, true);
          span.setAttribute(TRACE_ATTRIBUTES.ERROR_MESSAGE, error.message);
          span.recordException(error);

          // Add user context if available
          let userId: string | undefined;
          let organizationId: string | undefined;

          if (request.user) {
            userId = request.user.id;
            organizationId = request.user.organizationId;
          }

          // End the span
          span.end();

          // Track metrics
          this.observability.trackHttpRequest(
            request.method,
            path,
            statusCode,
            duration,
            userId,
            organizationId,
          );
        },
      }),
    );
  }

  /**
   * Get an existing trace ID from the request or create a new one
   */
  private getOrCreateTraceId(request: Request): string {
    const traceHeader = request.headers[TRACE_HEADERS.TRACE_ID];

    if (traceHeader && typeof traceHeader === "string") {
      return traceHeader;
    }

    return uuidv4();
  }

  /**
   * Get parent span ID from the request if available
   */
  private getParentSpanId(request: Request): string | undefined {
    const parentSpanHeader = request.headers[TRACE_HEADERS.PARENT_SPAN_ID];

    if (parentSpanHeader && typeof parentSpanHeader === "string") {
      return parentSpanHeader;
    }

    return undefined;
  }

  /**
   * Determine if this request should be sampled based on path
   */
  private shouldSampleRequest(path: string): boolean {
    // Check path-specific sampling rates
    for (const [pattern, rate] of Object.entries(this.samplingRates)) {
      if (new RegExp(pattern).test(path)) {
        return Math.random() < rate;
      }
    }

    // Apply default sampling rate
    return Math.random() < this.defaultSamplingRate;
  }

  /**
   * Sanitize request/response bodies to remove sensitive data
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    try {
      // Clone the body
      const sanitized = JSON.parse(JSON.stringify(body));

      // Recursively sanitize sensitive fields
      const sanitizeRecursive = (obj: any): any => {
        if (!obj || typeof obj !== "object") {
          return obj;
        }

        // Handle arrays
        if (Array.isArray(obj)) {
          return obj.map((item) => sanitizeRecursive(item));
        }

        // Handle objects
        const result: Record<string, any> = {};

        for (const [key, value] of Object.entries(obj)) {
          // Mask sensitive fields
          const sensitiveFields = [
            "password",
            "token",
            "secret",
            "apiKey",
            "key",
            "accessToken",
            "refreshToken",
            "authorization",
            "credential",
            "privateKey",
            "secret",
          ];

          if (
            sensitiveFields.some((field) =>
              key.toLowerCase().includes(field.toLowerCase()),
            )
          ) {
            result[key] = "[REDACTED]";
          } else if (typeof value === "object" && value !== null) {
            result[key] = sanitizeRecursive(value);
          } else {
            result[key] = value;
          }
        }

        return result;
      };

      return sanitizeRecursive(sanitized);
    } catch (error) {
      // If sanitization fails, return a simplified representation
      return { _sanitized: "[Complex Body]" };
    }
  }
}
