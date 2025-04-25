import * as crypto from 'crypto';

import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

import { ObservabilityService } from '../../../common/observability';
import { CredentialManagerService as ICredentialManagerService } from '../interfaces/security.interfaces';

/**
 * Service for securely managing sensitive credentials using GCP Secret Manager
 */
@Injectable()
export class CredentialManagerService implements ICredentialManagerService {
  private readonly logger = new Logger(CredentialManagerService.name);
  private readonly secretManager: SecretManagerServiceClient;
  private readonly projectId: string;
  private readonly secretPrefix: string;
  private readonly cache: Map<string, { value: string; expiresAt: number }> =
    new Map();
  private readonly cacheTtl = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(
    @Inject('SECURITY_MODULE_OPTIONS') private readonly options: any,
    private readonly configService: ConfigService,
    private readonly observability: ObservabilityService,
  ) {
    this.projectId = this.configService.get<string>('GCP_PROJECT_ID') || '';
    this.secretPrefix =
      this.configService.get<string>('SECRET_PREFIX') || 'fluxori';

    // Initialize GCP Secret Manager client
    this.secretManager = new SecretManagerServiceClient();

    this.logger.log('Credential Manager service initialized');
  }

  /**
   * Get a credential by key
   * @param key The credential key
   * @returns The credential value
   */
  async getCredential(key: string): Promise<string> {
    const span = this.observability.startTrace('security.getCredential', {
      key,
    });

    try {
      // Check the cache first
      const cachedValue = this.cache.get(key);
      if (cachedValue && cachedValue.expiresAt > Date.now()) {
        span.addEvent('credential.cache.hit');
        span.end();
        return cachedValue.value;
      }

      span.addEvent('credential.cache.miss');

      // Format the secret name
      const secretName = this.formatSecretName(key);

      // Get the latest version of the secret
      const [version] = await this.secretManager.accessSecretVersion({
        name: `${secretName}/versions/latest`,
      });

      // Extract the secret value
      const payload = version.payload?.data?.toString() || '';

      // Cache the result for future use
      this.cache.set(key, {
        value: payload,
        expiresAt: Date.now() + this.cacheTtl,
      });

      this.observability.incrementCounter('credential.access.count');

      span.end();
      return payload;
    } catch (error) {
      span.recordException(error);
      span.end();

      // Log the error without revealing the key
      this.logger.error(
        `Failed to get credential: ${error.message}`,
        error.stack,
      );
      this.observability.error(
        'Credential access failed',
        error,
        CredentialManagerService.name,
      );

      throw new Error(`Failed to access credential: ${error.message}`);
    }
  }

  /**
   * Store a credential
   * @param key The credential key
   * @param value The credential value
   * @param options Options such as expiration
   */
  async storeCredential(
    key: string,
    value: string,
    options?: { expireInDays?: number },
  ): Promise<void> {
    const span = this.observability.startTrace('security.storeCredential', {
      key,
      hasOptions: !!options,
    });

    try {
      // Format the secret name
      const secretName = this.formatSecretName(key);

      // Check if the secret already exists
      let secretExists = true;
      try {
        await this.secretManager.getSecret({
          name: secretName,
        });
      } catch (error) {
        secretExists = false;
      }

      // Create the secret if it doesn't exist
      if (!secretExists) {
        span.addEvent('credential.create');

        await this.secretManager.createSecret({
          parent: `projects/${this.projectId}`,
          secretId: this.formatSecretId(key),
          secret: {
            replication: {
              automatic: {},
            },
            labels: {
              'created-by': 'fluxori-security',
              environment:
                this.configService.get<string>('NODE_ENV') || 'development',
            },
            // Add expiration date if provided
            ...(options?.expireInDays
              ? {
                  expireTime: {
                    seconds:
                      Math.floor(Date.now() / 1000) +
                      options.expireInDays * 86400,
                  },
                }
              : {}),
          },
        });
      }

      // Add a new version with the credential value
      span.addEvent('credential.addVersion');

      await this.secretManager.addSecretVersion({
        parent: secretName,
        payload: {
          data: Buffer.from(value),
        },
      });

      // Invalidate the cache for this key
      this.cache.delete(key);

      this.observability.incrementCounter('credential.store.count');

      span.end();
      this.logger.log(
        `Credential stored successfully: ${this.maskSecretId(key)}`,
      );
    } catch (error) {
      span.recordException(error);
      span.end();

      this.logger.error(
        `Failed to store credential: ${error.message}`,
        error.stack,
      );
      this.observability.error(
        'Credential storage failed',
        error,
        CredentialManagerService.name,
      );

      throw new Error(`Failed to store credential: ${error.message}`);
    }
  }

  /**
   * Rotate a credential
   * @param key The credential key
   * @returns The new credential value
   */
  async rotateCredential(key: string): Promise<string> {
    const span = this.observability.startTrace('security.rotateCredential', {
      key,
    });

    try {
      // Get the current credential to determine its structure and length
      const currentValue = await this.getCredential(key);

      // Generate a new credential value
      const newValue = this.generateCredential(currentValue);

      // Store the new credential
      await this.storeCredential(key, newValue);

      // Invalidate the cache for this key
      this.cache.delete(key);

      this.observability.incrementCounter('credential.rotate.count');

      span.end();
      this.logger.log(
        `Credential rotated successfully: ${this.maskSecretId(key)}`,
      );

      return newValue;
    } catch (error) {
      span.recordException(error);
      span.end();

      this.logger.error(
        `Failed to rotate credential: ${error.message}`,
        error.stack,
      );
      this.observability.error(
        'Credential rotation failed',
        error,
        CredentialManagerService.name,
      );

      throw new Error(`Failed to rotate credential: ${error.message}`);
    }
  }

  /**
   * List available credentials (only returns metadata, not values)
   * @returns List of credential metadata
   */
  async listCredentials(): Promise<
    { key: string; createdAt: Date; expiresAt?: Date }[]
  > {
    const span = this.observability.startTrace('security.listCredentials');

    try {
      // List all secrets in the project with our prefix
      const [secrets] = await this.secretManager.listSecrets({
        parent: `projects/${this.projectId}`,
        filter: `name:${this.secretPrefix}`,
      });

      // Map to the expected format
      const credentials = await Promise.all(
        secrets.map(async (secret) => {
          if (!secret.name) {
            this.logger.warn('Found a secret with no name, skipping');
            return {
              key: 'unknown',
              createdAt: new Date(),
              expiresAt: undefined,
            };
          }

          // Extract the key from the full secret name
          const key = this.extractKeyFromSecretName(secret.name);

          // Get the latest version to determine creation time
          const [versions] = await this.secretManager.listSecretVersions({
            parent: secret.name,
            filter: 'state:ENABLED',
          });

          const latestVersion = versions[0];

          return {
            key,
            createdAt:
              latestVersion?.createTime &&
              typeof latestVersion.createTime.seconds === 'number'
                ? new Date(latestVersion.createTime.seconds * 1000)
                : new Date(),
            expiresAt:
              secret.expireTime && typeof secret.expireTime.seconds === 'number'
                ? new Date(secret.expireTime.seconds * 1000)
                : undefined,
          };
        }),
      );

      span.end();
      return credentials;
    } catch (error) {
      span.recordException(error);
      span.end();

      this.logger.error(
        `Failed to list credentials: ${error.message}`,
        error.stack,
      );
      this.observability.error(
        'Credential listing failed',
        error,
        CredentialManagerService.name,
      );

      throw new Error(`Failed to list credentials: ${error.message}`);
    }
  }

  /**
   * Format a secret ID from a key
   */
  private formatSecretId(key: string): string {
    // Replace invalid characters with underscores
    // Secret IDs must only contain letters, numbers, underscores, and hyphens
    return `${this.secretPrefix}-${key.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
  }

  /**
   * Format a full secret name
   */
  private formatSecretName(key: string): string {
    return `projects/${this.projectId}/secrets/${this.formatSecretId(key)}`;
  }

  /**
   * Extract the key from a full secret name
   */
  private extractKeyFromSecretName(name: string): string {
    // Extract the secret ID from the full name
    const secretId = name.split('/').pop() || '';

    // Remove the prefix to get the original key
    return secretId.startsWith(`${this.secretPrefix}-`)
      ? secretId.substring(this.secretPrefix.length + 1)
      : secretId;
  }

  /**
   * Generate a new credential based on the structure of an existing one
   */
  private generateCredential(currentValue: string): string {
    // For API keys, generate a new random key of the same length
    if (/^[A-Za-z0-9_-]+$/.test(currentValue)) {
      return crypto
        .randomBytes(Math.ceil(currentValue.length * 0.75))
        .toString('base64')
        .replace(/[+/=]/g, '')
        .substring(0, currentValue.length);
    }

    // For JSON credentials, parse and regenerate any secret fields
    if (currentValue.startsWith('{') && currentValue.endsWith('}')) {
      try {
        const parsed = JSON.parse(currentValue);

        // Regenerate common secret fields
        if (parsed.apiKey) {
          parsed.apiKey = this.generateCredential(parsed.apiKey);
        }
        if (parsed.secret) {
          parsed.secret = this.generateCredential(parsed.secret);
        }
        if (parsed.password) {
          parsed.password = this.generateRandomPassword();
        }
        if (parsed.token) {
          parsed.token = this.generateCredential(parsed.token);
        }

        return JSON.stringify(parsed);
      } catch (e) {
        // Not valid JSON, fall back to default behavior
      }
    }

    // For other types, generate a secure 32-character string
    return crypto.randomBytes(24).toString('base64');
  }

  /**
   * Generate a random password
   */
  private generateRandomPassword(): string {
    // Generate a secure password with mixed characters
    const length = 16;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';

    let password = '';
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes[i] % charset.length;
      password += charset[randomIndex];
    }

    return password;
  }

  /**
   * Mask a secret ID for logging
   */
  private maskSecretId(key: string): string {
    if (key.length <= 4) {
      return '****';
    }

    // Show first two and last two characters
    return `${key.substring(0, 2)}****${key.substring(key.length - 2)}`;
  }
}
