import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
} from '@nestjs/common';

import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import { ObservabilityService } from '../../../common/observability';
import { SecurityContext } from '../interfaces/security.interfaces';
import { SecurityService } from '../services/security.service';

/**
 * Security interceptor that applies security controls to all requests
 * - Creates a security context for each request
 * - Applies security headers to responses
 * - Logs security events
 * - Integrates with the observability system
 */
@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityInterceptor.name);

  constructor(
    @Inject('SECURITY_MODULE_OPTIONS') private readonly options: any,
    private readonly securityService: SecurityService,
    private readonly observability: ObservabilityService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    // Skip for health and metrics endpoints
    if (request.path.includes('/health') || request.path.includes('/metrics')) {
      return next.handle();
    }

    // Create security context from the request
    const securityContext = this.securityService.createSecurityContext(request);

    // Store the security context in the request for use by handlers
    (request as any).securityContext = securityContext;

    // Apply security headers to the response
    this.securityService.applySecurityHeaders(
      response,
      this.options.defaultPolicyConfig,
    );

    // Create a span for the security context
    const span = this.observability.startTrace('security.request', {
      path: request.path,
      method: request.method,
      userId: securityContext.userId,
      organizationId: securityContext.organizationId,
    });

    // Start request timing
    const startTime = process.hrtime();

    // Process the request
    return next.handle().pipe(
      tap(() => {
        // Calculate request duration
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const durationMs = seconds * 1000 + nanoseconds / 1000000;

        // Log successful request for security monitoring
        this.logSecurityEvent(
          securityContext,
          'request.success',
          durationMs,
          response.statusCode,
        );

        // End the span
        span.setAttribute('request.duration', durationMs);
        span.setAttribute('response.status', response.statusCode);
        span.end();
      }),
      catchError((error) => {
        // Calculate request duration
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const durationMs = seconds * 1000 + nanoseconds / 1000000;

        // Determine if this is a security-related error
        const isSecurityError = this.isSecurityError(error);

        // Log security event
        this.logSecurityEvent(
          securityContext,
          isSecurityError ? 'security.violation' : 'request.error',
          durationMs,
          error.status || 500,
          error.message,
        );

        // Record error in the span
        span.recordException(error);
        span.setAttribute('security.violation', isSecurityError);
        span.setAttribute('response.status', error.status || 500);
        span.end();

        // Re-throw the error
        throw error;
      }),
    );
  }

  /**
   * Log a security event
   */
  private logSecurityEvent(
    context: SecurityContext,
    event: string,
    durationMs: number,
    statusCode: number,
    errorMessage?: string,
  ): void {
    // Only log extended events if enabled
    if (
      !this.options.enableExtendedAuditLogging &&
      event === 'request.success'
    ) {
      return;
    }

    try {
      // Log the security event
      const contextWithExtra = { ...context } as any;
      contextWithExtra.timestamp = new Date();
      this.securityService.logSecurityEvent(event, contextWithExtra);
    } catch (error) {
      this.logger.error(
        `Failed to log security event: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Determine if an error is security-related
   */
  private isSecurityError(error: any): boolean {
    // Check for common security error patterns
    if (!error) return false;

    // Check HTTP status codes associated with security errors
    if (error.status === 401 || error.status === 403 || error.status === 429) {
      return true;
    }

    // Check error message for security-related terms
    const securityTerms = [
      'unauthorized',
      'forbidden',
      'permission',
      'access denied',
      'csrf',
      'xss',
      'injection',
      'token',
      'security',
      'authentication',
      'rate limit',
      'permissions',
      'firewall',
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return securityTerms.some((term) => errorMessage.includes(term));
  }
}
