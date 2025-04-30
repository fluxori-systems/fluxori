import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Request } from 'express';
import { Observable } from 'rxjs';

import { ServiceAuthUtils } from '../utils/service-auth';
import {
  ExtendedRequest,
  ServiceInfo,
} from '../guards/extended-request.interface';

/**
 * Service Authentication Interceptor
 *
 * This interceptor validates service-to-service authentication tokens
 * for internal API endpoints.
 */
@Injectable()
export class ServiceAuthInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ServiceAuthInterceptor.name);
  private readonly isEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly serviceAuthUtils: ServiceAuthUtils,
  ) {
    this.isEnabled =
      this.configService.get<boolean>('SERVICE_AUTH_ENABLED') ?? false;
  }

  /**
   * Intercept the request to validate service authentication
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Skip if service auth is disabled
    if (!this.isEnabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<ExtendedRequest>();
    const path = request.path || '';

    // Check if this is an internal service endpoint
    if (!path.includes('/internal/')) {
      return next.handle();
    }

    // Extract the service auth token from headers
    const authHeader = request.header('X-Service-Auth') || '';

    // Validate the token
    const validationResult = this.serviceAuthUtils.validateServiceToken(
      authHeader,
      path,
    );

    if (validationResult.valid === false) {
      this.logger.warn(
        `Service auth failed: ${validationResult.error} for path ${path}`,
      );
      throw new UnauthorizedException('Service authentication failed');
    }

    // Add service info to request for downstream handlers
    const serviceInfo: ServiceInfo = {
      serviceName: validationResult.service,
      authenticated: true,
    };
    request.serviceInfo = serviceInfo;

    return next.handle();
  }
}
