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

// Import services
import {
  METRIC_NAMES,
  SA_PERFORMANCE_THRESHOLDS,
} from "../constants/observability.constants";
import {
  ObservabilityModuleOptions,
  DEFAULT_OBSERVABILITY_OPTIONS,
} from "../interfaces/observability-options.interface";
import { MetricsService } from "../services/metrics.service";
import { ObservabilityService } from "../services/observability.service";

// Import interfaces

// Import constants

/**
 * Interceptor that collects metrics for HTTP requests
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly metricPrefix: string;
  private readonly pathGroupPattern: RegExp = /\/api\/([^\/]+)/;

  constructor(
    private readonly metrics: MetricsService,
    private readonly observability: ObservabilityService,
    @Optional()
    @Inject("OBSERVABILITY_OPTIONS")
    private readonly options?: ObservabilityModuleOptions,
  ) {
    // Apply options with defaults
    const mergedOptions = { ...DEFAULT_OBSERVABILITY_OPTIONS, ...options };
    const metricsOptions = mergedOptions.metrics || {};

    this.metricPrefix = metricsOptions.metricPrefix || "fluxori.";
  }

  /**
   * Intercept HTTP requests to collect metrics
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Only apply to HTTP requests
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: any; traceId?: string; span?: any }>();
    const startTime = Date.now();

    // Process the request and collect metrics
    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse<Response>();
          const duration = Date.now() - startTime;
          const path = this.normalizePath(request);
          const pathGroup = this.getPathGroup(request.path);

          // Collect detailed route metrics
          this.metrics.recordDistribution(
            METRIC_NAMES.HTTP_REQUEST_DURATION,
            duration,
            {
              method: request.method,
              path,
              status: response.statusCode.toString(),
              pathGroup,
            },
          );

          // Just use trackHttpRequest from ObservabilityService which handles
          // incrementing counters, recording errors, and logging slow requests
          this.observability.trackHttpRequest(
            request.method,
            path,
            response.statusCode,
            duration,
            request.user?.id,
            request.user?.organizationId,
          );

          // Track response size when available
          const contentLength = response.get("content-length");
          if (contentLength) {
            const size = parseInt(contentLength, 10);
            this.metrics.recordDistribution(
              METRIC_NAMES.HTTP_RESPONSE_SIZE,
              size,
              {
                method: request.method,
                path,
              },
            );
          }

          // Monitor system resource usage periodically
          this.recordSystemMetrics();
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          const path = this.normalizePath(request);

          // Use trackHttpRequest which handles all the error metrics
          this.observability.trackHttpRequest(
            request.method,
            path,
            statusCode,
            duration,
            request.user?.id,
            request.user?.organizationId,
          );
        },
      }),
    );
  }

  /**
   * Normalize the path to avoid explosion of metrics
   * For paths with IDs, replaces the IDs with a placeholder
   */
  private normalizePath(request: Request): string {
    // Use route pattern if available (from NestJS)
    if (request.route?.path) {
      return request.route.path;
    }

    // Otherwise, try to normalize common ID patterns
    let path = request.path;

    // Replace UUIDs
    path = path.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ":id",
    );

    // Replace numeric IDs
    path = path.replace(/\/(\d+)(?:\/|$)/g, "/:id$1");

    return path;
  }

  /**
   * Extract the API group from the path (e.g., /api/users/1 -> users)
   */
  private getPathGroup(path: string): string {
    const match = path.match(this.pathGroupPattern);
    return match ? match[1] : "other";
  }

  /**
   * Record system metrics (memory, CPU usage)
   */
  private recordSystemMetrics(): void {
    // Keep track of when we last recorded system metrics
    // to avoid doing it too frequently
    const now = Date.now();
    if (
      !MetricsInterceptor.lastSystemMetricsTime ||
      now - MetricsInterceptor.lastSystemMetricsTime > 60000
    ) {
      // Once per minute

      // Record memory usage
      try {
        if (global.gc) {
          // Force garbage collection if available
          global.gc();
        }

        const memoryUsage = process.memoryUsage();
        this.metrics.recordGauge(
          METRIC_NAMES.MEMORY_USAGE,
          Math.round(memoryUsage.rss / (1024 * 1024)), // Convert to MB
          { type: "rss" },
        );

        this.metrics.recordGauge(
          METRIC_NAMES.MEMORY_USAGE,
          Math.round(memoryUsage.heapUsed / (1024 * 1024)), // Convert to MB
          { type: "heapUsed" },
        );
      } catch (error) {
        // Ignore memory metric errors
      }

      MetricsInterceptor.lastSystemMetricsTime = now;
    }
  }

  // Static variable to track when we last recorded system metrics
  private static lastSystemMetricsTime: number = 0;
}
