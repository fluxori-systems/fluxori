/* eslint-disable import/default, import/no-named-as-default, import/no-named-as-default-member */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { SecurityModuleOptions } from '../interfaces/security.interfaces';

import { Request } from 'express';
import Redis from 'ioredis';

import { ObservabilityService } from '../../../../common/observability';

/**
 * Metadata key for rate limit configuration
 */
export const RATE_LIMIT_KEY = 'rate_limit';

/**
 * Rate limit configuration for a route
 */
export interface RateLimitConfig {
  /** Maximum requests allowed in the time window */
  limit: number;
  /** Time window in seconds */
  windowSecs: number;
  /** Whether to scope by user ID */
  scopeByUser?: boolean;
  /** Whether to scope by organization ID */
  scopeByOrganization?: boolean;
  /** Custom error message */
  errorMessage?: string;
}

/**
 * Guard that implements rate limiting for API endpoints
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly redis: Redis | null = null;
  private readonly useMemoryFallback: boolean;
  private readonly memoryStore: Map<
    string,
    { count: number; resetTime: number }
  > = new Map();

  constructor(
    @Inject('SECURITY_MODULE_OPTIONS')
    private readonly options: SecurityModuleOptions,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly observability: ObservabilityService,
  ) {
    // Initialize Redis client if configured
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl);
        this.useMemoryFallback = false;
        this.logger.log('Rate limit guard initialized with Redis');
      } catch (error) {
        this.logger.error(
          `Failed to connect to Redis: ${error.message}`,
          error.stack,
        );
        this.useMemoryFallback = true;
        this.logger.warn('Falling back to in-memory rate limiting');
      }
    } else {
      this.useMemoryFallback = true;
      this.logger.log('Rate limit guard initialized with in-memory storage');
    }

    // Clean up expired in-memory rate limit entries periodically
    if (this.useMemoryFallback) {
      setInterval(() => this.cleanupExpiredEntries(), 60000); // every minute
    }
  }

  /**
   * Determine if the request is allowed based on rate limits
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get route-specific rate limit configuration
    const routeConfig = this.reflector.get<RateLimitConfig>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    // Get controller-level rate limit configuration
    const controllerConfig = this.reflector.get<RateLimitConfig>(
      RATE_LIMIT_KEY,
      context.getClass(),
    );

    // Use route-specific config if available, otherwise controller config
    const config = routeConfig || controllerConfig;

    // If no rate limit is configured, allow the request
    if (!config && !this.options.rateLimiting?.global) {
      return true;
    }

    // Use configured rate limit or fall back to global configuration
    const rateLimit = config || {
      limit: this.options.rateLimiting?.global?.requestsPerMinutePerIp || 100,
      windowSecs: 60,
      scopeByUser: false,
      scopeByOrganization: false,
    };

    const request = context.switchToHttp().getRequest<Request>();

    // Generate a rate limit key based on the configuration
    const key = this.generateRateLimitKey(request, rateLimit);

    // Check if the rate limit has been exceeded
    const { allowed, current, limit, ttl } = await this.checkRateLimit(
      key,
      rateLimit,
    );

    // Add rate limit headers to the response
    const response = context.switchToHttp().getResponse();
    response.header('X-RateLimit-Limit', limit.toString());
    response.header(
      'X-RateLimit-Remaining',
      Math.max(0, limit - current).toString(),
    );
    response.header(
      'X-RateLimit-Reset',
      Math.ceil(Date.now() / 1000 + ttl).toString(),
    );

    // Track rate limit metrics
    this.observability.incrementCounter('security.rateLimit.check');
    if (!allowed) {
      this.observability.incrementCounter('security.rateLimit.exceeded');

      // Log rate limit exceeded
      this.logger.warn(
        `Rate limit exceeded: ${key}, current: ${current}, limit: ${limit}`,
      );

      // Create a custom error message
      const errorMessage =
        rateLimit.errorMessage ||
        'Rate limit exceeded. Please try again later.';

      // Throw rate limit exceeded exception
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: errorMessage,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * Generate a rate limit key based on the request and configuration
   */
  private generateRateLimitKey(
    request: Request,
    config: RateLimitConfig,
  ): string {
    const parts: string[] = ['rate-limit'];

    // Add the request path
    parts.push(request.path);

    // Add client IP for all rate limits
    parts.push(this.getClientIp(request));

    // Add user ID if configured
    const user = (request as any).user;
    if (config.scopeByUser && user?.id) {
      parts.push(`user:${user.id}`);
    }

    // Add organization ID if configured
    if (config.scopeByOrganization && user?.organizationId) {
      parts.push(`org:${user.organizationId}`);
    }

    return parts.join(':');
  }

  /**
   * Check if a rate limit has been exceeded
   */
  private async checkRateLimit(
    key: string,
    config: RateLimitConfig,
  ): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    ttl: number;
  }> {
    // Use Redis implementation if available
    if (this.redis !== null) {
      return this.checkRateLimitRedis(key, config);
    } else {
      // Fall back to in-memory implementation
      return this.checkRateLimitMemory(key, config);
    }
  }

  /**
   * Check rate limit using Redis
   */
  private async checkRateLimitRedis(
    key: string,
    config: RateLimitConfig,
  ): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    ttl: number;
  }> {
    try {
      const multi = this.redis!.multi();

      // Get the current count
      multi.get(key);

      // Increment the counter
      multi.incr(key);

      // Get the TTL
      multi.ttl(key);

      const results = await multi.exec();
      const [currentStr, newCount, ttl] = results
        ? results.map((result: any) => (result[0] ? null : result[1]))
        : [null, 1, config.windowSecs];

      // If this is a new key, set the expiration
      if (currentStr === null || ttl === -1) {
        await this.redis!.expire(key, config.windowSecs);
      }

      const current = Number(newCount || 1);
      const allowed = current <= config.limit;

      return {
        allowed,
        current,
        limit: config.limit,
        ttl: ttl === -1 ? config.windowSecs : Number(ttl || config.windowSecs),
      };
    } catch (error) {
      this.logger.error(
        `Redis rate limit error: ${error.message}`,
        error.stack,
      );

      // On Redis failure, fall back to memory implementation
      return this.checkRateLimitMemory(key, config);
    }
  }

  /**
   * Check rate limit using in-memory storage
   */
  private checkRateLimitMemory(
    key: string,
    config: RateLimitConfig,
  ): { allowed: boolean; current: number; limit: number; ttl: number } {
    const now = Date.now();

    // Get or create rate limit entry
    let entry = this.memoryStore.get(key);
    if (!entry || entry.resetTime <= now) {
      // Create a new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + config.windowSecs * 1000,
      };
      this.memoryStore.set(key, entry);
    }

    // Increment the counter
    entry.count++;

    // Calculate TTL in seconds
    const ttl = Math.max(0, Math.floor((entry.resetTime - now) / 1000));

    return {
      allowed: entry.count <= config.limit,
      current: entry.count,
      limit: config.limit,
      ttl,
    };
  }

  /**
   * Clean up expired entries from the in-memory store
   */
  private cleanupExpiredEntries(): void {
    if (!this.useMemoryFallback) return;

    const now = Date.now();
    let expiredCount = 0;

    // Convert to array first to avoid the need for downlevelIteration
    Array.from(this.memoryStore.entries()).forEach(([key, entry]) => {
      if (entry.resetTime <= now) {
        this.memoryStore.delete(key);
        expiredCount++;
      }
    });

    if (expiredCount > 0) {
      this.logger.debug(
        `Cleaned up ${expiredCount} expired rate limit entries`,
      );
    }
  }

  /**
   * Get the client IP address from the request
   */
  private getClientIp(request: Request): string {
    // Try X-Forwarded-For header first (for requests behind a proxy)
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      const ips = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor.split(',')[0].trim();
      return ips;
    }

    // Fall back to connection remote address
    return request.ip || request.connection.remoteAddress || '127.0.0.1';
  }
}
