import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Optional,
} from '@nestjs/common';

import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// Import services
import {
  ObservabilityModuleOptions,
  DEFAULT_OBSERVABILITY_OPTIONS,
} from '../interfaces/observability-options.interface';
import { LogContext } from '../interfaces/observability.interfaces';
import { EnhancedLoggerService } from '../services/enhanced-logger.service';

// Import interfaces

/**
 * Interceptor that adds structured logging to HTTP requests
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly debugSamplingRate: number;
  private readonly logRequestBodies: boolean;
  private readonly logResponseBodies: boolean;

  constructor(
    private readonly logger: EnhancedLoggerService,
    @Optional()
    @Inject('OBSERVABILITY_OPTIONS')
    private readonly options?: ObservabilityModuleOptions,
  ) {
    // Apply options with defaults
    const mergedOptions = { ...DEFAULT_OBSERVABILITY_OPTIONS, ...options };
    const loggingOptions = mergedOptions.logging || {};
    const tracingOptions = mergedOptions.tracing || {};

    this.debugSamplingRate = loggingOptions.debugSamplingRate || 0.05;
    this.logRequestBodies = tracingOptions.includeRequestBodies || false;
    this.logResponseBodies = tracingOptions.includeResponseBodies || false;
  }

  /**
   * Intercept HTTP requests to add structured logging
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Only apply to HTTP requests
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { traceId?: string; user?: any }>();
    const startTime = Date.now();
    const traceId = request.traceId;
    const shouldSample = Math.random() < this.debugSamplingRate;

    // Create log context
    const logContext: LogContext = {
      service: 'HttpLogger',
      ...(traceId && { trace: { traceId, spanId: '', startTime: new Date() } }),
    };

    // Add user context if available
    if (request.user) {
      logContext.userId = request.user.id;
      logContext.organizationId = request.user.organizationId;
    }

    // Log request if sampling allows
    if (shouldSample) {
      this.logger.debug(`${request.method} ${request.path} - Request`, {
        ...logContext,
        request: {
          method: request.method,
          path: request.path,
          query: request.query,
          params: request.params,
          headers: this.sanitizeHeaders(request.headers),
          ...(this.logRequestBodies && request.body && { body: request.body }),
        },
      });
    }

    // Process the request and log the result
    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse<Response>();
          const duration = Date.now() - startTime;

          // Log normal info message for all requests
          this.logger.log(
            `${request.method} ${request.path} - ${response.statusCode} (${duration}ms)`,
            logContext,
          );

          // Log response details if sampling allows
          if (shouldSample) {
            this.logger.debug(`${request.method} ${request.path} - Response`, {
              ...logContext,
              response: {
                statusCode: response.statusCode,
                duration,
                headers: this.sanitizeHeaders(response.getHeaders()),
                ...(this.logResponseBodies && data && { body: data }),
              },
            });
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Always log errors
          this.logger.error(
            `${request.method} ${request.path} - ${statusCode} Error: ${error.message} (${duration}ms)`,
            error.stack,
            {
              ...logContext,
              error: {
                message: error.message,
                statusCode,
                duration,
                path: request.path,
                method: request.method,
              },
            },
          );
        },
      }),
    );
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    if (!headers) return {};

    const result: Record<string, any> = {};
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'set-cookie',
      'x-auth-token',
      'api-key',
      'apikey',
      'password',
      'refresh-token',
      'access-token',
    ];

    // Clone only safe headers
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveHeaders.includes(lowerKey)) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}
