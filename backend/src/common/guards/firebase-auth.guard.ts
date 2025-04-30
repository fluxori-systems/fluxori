import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { Request } from 'express';
import * as admin from 'firebase-admin';
import {
  ExtendedRequest,
  AuthenticatedUser,
} from './extended-request.interface';

/**
 * Firebase Authentication Guard
 *
 * Validates Firebase JWT tokens for protected routes
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);
  private initialized = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initializeFirebase(): void {
    if (this.initialized) return;

    try {
      // Check if Firebase is already initialized
      admin.app();
      this.initialized = true;
    } catch (error: unknown) {
      try {
        // Initialize Firebase App
        const projectId = this.configService.get<string>('GCP_PROJECT_ID');

        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId,
        });

        this.initialized = true;
        this.logger.log(
          `Firebase Admin SDK initialized for project ${projectId}`,
        );
      } catch (initError) {
        // Type guard for Error
        const err =
          initError instanceof Error ? initError : new Error(String(initError));
        this.logger.error(
          `Failed to initialize Firebase: ${err.message}`,
          err.stack,
        );
        // Allow app to start even if Firebase fails to initialize
        // We'll check this.initialized before using Firebase
      }
    }
  }

  /**
   * Validate the request and extract user info
   * @param context Execution context
   * @returns Boolean indicating if request is authorized
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic =
      this.reflector.get<boolean>('isPublic', context.getHandler()) ||
      this.reflector.get<boolean>('isPublic', context.getClass());

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<ExtendedRequest>();

    // Check for service-to-service authentication
    if (request.serviceInfo?.authenticated) {
      return true;
    }

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    if (!this.initialized) {
      throw new UnauthorizedException('Authentication service unavailable');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Add user to request for controllers
      const user: AuthenticatedUser = {
        uid: decodedToken.uid ?? '',
        email: decodedToken.email ?? '',
        emailVerified:
          typeof decodedToken.email_verified === 'boolean'
            ? decodedToken.email_verified
            : false,
        displayName: decodedToken.name,
        roles: decodedToken.roles || [],
        claims: decodedToken,
      };
      request.user = user;

      return true;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.warn(`Authentication failed: ${err.message}`);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  /**
   * Extract JWT token from Authorization header
   * @param request HTTP request
   * @returns Token string or undefined
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');

    return type === 'Bearer' ? token : undefined;
  }
}
