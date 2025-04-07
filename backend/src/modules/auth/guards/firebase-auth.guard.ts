import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FirebaseAuthService } from '../services/firebase-auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Firebase Authentication Guard for routes
 * Provides authentication and authorization capabilities using Firebase Auth
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private readonly firebaseAuth: FirebaseAuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the endpoint is marked as public
    const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authentication token');
    }

    try {
      const token = authHeader.split(' ')[1];
      const decodedToken = await this.firebaseAuth.verifyIdToken(token);

      // Add the verified user to the request
      request.user = {
        id: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || 'user',
        organizationId: decodedToken.organizationId,
      };

      return true;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}