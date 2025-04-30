import * as crypto from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service Authentication Utilities
 *
 * This class provides utilities for authenticating service-to-service
 * communication using secure tokens.
 */
@Injectable()
export class ServiceAuthUtils {
  private readonly logger = new Logger(ServiceAuthUtils.name);
  private readonly isEnabled: boolean;
  private readonly secret: string;
  private readonly algorithm = 'sha256';
  private readonly tokenTTLMinutes = 30; // Default token validity period

  constructor(private readonly configService: ConfigService) {
    this.isEnabled = this.configService.get<boolean>(
      'SERVICE_AUTH_ENABLED',
      false,
    );
    this.secret = this.configService.get<string>('SERVICE_AUTH_SECRET', '');

    if (this.isEnabled && !this.secret) {
      this.logger.warn(
        'Service authentication is enabled but no secret is provided!',
      );
    }
  }

  /**
   * Generate a service authentication token
   * @param serviceName Name of the requesting service
   * @param targetPath Target path/resource being accessed
   * @param expiresInMinutes Token validity period in minutes
   * @returns Service authentication token
   */
  generateServiceToken(
    serviceName: string,
    targetPath: string,
    expiresInMinutes: number = this.tokenTTLMinutes,
  ): string {
    if (!this.isEnabled) {
      return '';
    }

    if (!this.secret) {
      this.logger.warn('Cannot generate service token: no secret provided');
      return '';
    }

    try {
      // Calculate expiration time
      const issuedAt = Math.floor(Date.now() / 1000);
      const expiresAt = issuedAt + expiresInMinutes * 60;

      // Create token payload
      const payload = {
        service: serviceName,
        target: targetPath,
        iat: issuedAt,
        exp: expiresAt,
      };

      // JSON stringify the payload
      const payloadStr = JSON.stringify(payload);

      // Base64 encode the payload
      const payloadBase64 = Buffer.from(payloadStr).toString('base64');

      // Create signature
      const signature = crypto
        .createHmac(this.algorithm, this.secret)
        .update(payloadBase64)
        .digest('base64');

      // Combine payload and signature
      return `${payloadBase64}.${signature}`;
    } catch (error) {
      this.logger.error(
        `Error generating service token: ${error.message}`,
        error.stack,
      );
      return '';
    }
  }

  /**
   * Validate a service authentication token
   * @param token Service authentication token
   * @param targetPath Target path/resource being accessed
   * @returns Validation result with service name or error
   */
  validateServiceToken(
    token: string,
    targetPath: string,
  ): { valid: true; service: string } | { valid: false; error: string } {
    if (!this.isEnabled) {
      return { valid: true, service: 'auth-disabled' };
    }

    if (!token) {
      return { valid: false, error: 'No authentication token provided' };
    }

    if (!this.secret) {
      this.logger.warn('Cannot validate service token: no secret provided');
      return { valid: false, error: 'Authentication configuration error' };
    }

    try {
      // Split token into payload and signature
      const [payloadBase64, signature] = token.split('.');
      if (!payloadBase64 || !signature) {
        return { valid: false, error: 'Malformed token' };
      }

      // Verify signature
      const expectedSignature = crypto
        .createHmac(this.algorithm, this.secret)
        .update(payloadBase64)
        .digest('base64');
      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid token format' };
      }

      // Decode payload
      const payloadStr = Buffer.from(payloadBase64, 'base64').toString();
      const payload = JSON.parse(payloadStr);

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return { valid: false, error: 'Token expired' };
      }

      // Check target path
      if (payload.target !== targetPath) {
        return { valid: false, error: 'Target mismatch' };
      }

      if (typeof payload.service !== 'string' || !payload.service) {
        return { valid: false, error: 'Missing service name in token' };
      }

      return { valid: true, service: payload.service };
    } catch (error) {
      this.logger.error(
        `Error validating service token: ${error.message}`,
        error.stack,
      );
      return { valid: false, error: 'Token not valid for this resource' };
    }
  }

  /**
   * Check if service authentication is enabled
   * @returns True if service authentication is enabled
   */
  isServiceAuthEnabled(): boolean {
    return this.isEnabled;
  }
}
