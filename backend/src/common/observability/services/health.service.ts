import * as os from 'os';

import { Injectable, Inject, Optional, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Import interfaces
import { OBSERVABILITY_TOKENS } from '../constants/observability.tokens';
import { DEFAULT_OBSERVABILITY_OPTIONS } from '../interfaces/observability-options.interface';
import {
  HealthStatus,
  ComponentHealth,
  HealthCheckResult,
  HealthCheckFunction,
  IHealthService,
  IEnhancedLoggerService,
} from '../interfaces/observability.interfaces';

// Import constants

/**
 * Health service that provides health check capabilities.
 * Implements IHealthService interface for dependency injection.
 */
@Injectable()
export class HealthService implements IHealthService, OnModuleInit {
  // Registry of health check functions
  private healthChecks: Map<string, HealthCheckFunction> = new Map();

  // Cache of health results
  private healthCache: Map<string, ComponentHealth> = new Map();

  // Last overall health status
  private lastStatus: HealthStatus = HealthStatus.HEALTHY;

  // Options
  private readonly enabled: boolean;
  private readonly exposeDetails: boolean;
  private readonly environment: string;
  private readonly region: string;
  private readonly serviceName: string;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly checkIntervalMs: number;
  private readonly version: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(OBSERVABILITY_TOKENS.LOGGER_SERVICE)
    private readonly logger: IEnhancedLoggerService,
    @Optional()
    @Inject(OBSERVABILITY_TOKENS.OBSERVABILITY_OPTIONS)
    private readonly options?: any,
  ) {
    // Apply options with defaults
    const mergedOptions = { ...DEFAULT_OBSERVABILITY_OPTIONS, ...options };
    const healthOptions = mergedOptions.health || {};

    this.enabled =
      healthOptions.enabled !== undefined ? healthOptions.enabled : true;
    this.exposeDetails =
      healthOptions.exposeDetails !== undefined
        ? healthOptions.exposeDetails
        : process.env.NODE_ENV !== 'production';
    this.environment =
      mergedOptions.environment || process.env.NODE_ENV || 'development';
    this.region =
      mergedOptions.region || process.env.GCP_REGION || 'africa-south1';
    this.serviceName = mergedOptions.appName || 'fluxori-api';
    this.checkIntervalMs = healthOptions.healthCheckInterval || 60000; // 1 minute
    this.version = process.env.npm_package_version || '1.0.0';

    if (this.enabled) {
      this.logger.log('Health service initialized', 'HealthService');

      // Register default health checks
      if (healthOptions.registerDefaultHealthChecks !== false) {
        this.registerDefaultHealthChecks();
      }
    }
  }

  /**
   * Initialize health checks
   */
  async onModuleInit() {
    if (this.enabled) {
      // Start periodic health checks
      this.checkInterval = setInterval(() => {
        this.runAllHealthChecks()
          .then((result) => {
            // Only log health status changes
            if (result.status !== this.lastStatus) {
              if (result.status === HealthStatus.HEALTHY) {
                this.logger.log(
                  `System health recovered to HEALTHY from ${this.lastStatus}`,
                  'HealthService',
                );
              } else {
                this.logger.warn(
                  `System health degraded to ${result.status} from ${this.lastStatus}`,
                  {
                    service: 'HealthService',
                    healthResult: this.exposeDetails
                      ? result
                      : { status: result.status },
                  },
                );
              }
              this.lastStatus = result.status;
            }
          })
          .catch((err) => {
            this.logger.error(
              'Failed to run health checks',
              err,
              'HealthService',
            );
          });
      }, this.checkIntervalMs);

      // Run initial health check
      await this.runAllHealthChecks();
    }
  }

  /**
   * Register a health check function
   */
  registerHealthCheck(
    component: string,
    checkFunction: HealthCheckFunction,
  ): void {
    if (!this.enabled) {
      return;
    }

    this.healthChecks.set(component, checkFunction);
    if (this.logger?.debug) {
      this.logger.debug(
        `Registered health check for ${component}`,
        'HealthService',
      );
    }
  }

  /**
   * Get the current health status of a specific component
   */
  getComponentHealth(component: string): ComponentHealth | undefined {
    return this.healthCache.get(component);
  }

  /**
   * Run all registered health checks
   */
  async runAllHealthChecks(): Promise<HealthCheckResult> {
    if (!this.enabled) {
      // Return default healthy status if not enabled
      return {
        status: HealthStatus.HEALTHY,
        components: [],
        region: this.region,
        environment: this.environment,
        version: this.version,
        timestamp: new Date(),
      };
    }

    const components: ComponentHealth[] = [];
    let overallStatus = HealthStatus.HEALTHY;

    // Run all health checks in parallel
    const checkPromises = Array.from(this.healthChecks.entries()).map(
      async ([component, checkFunction]) => {
        try {
          const startTime = Date.now();
          const result = await checkFunction();
          const responseTime = Date.now() - startTime;

          // Add response time if not already included
          if (result.responseTime === undefined) {
            result.responseTime = responseTime;
          }

          // Update cache
          this.healthCache.set(component, result);

          // Update overall status (worst status wins)
          if (result.status === HealthStatus.UNHEALTHY) {
            overallStatus = HealthStatus.UNHEALTHY;
          } else if (
            result.status === HealthStatus.DEGRADED &&
            overallStatus !== HealthStatus.UNHEALTHY
          ) {
            overallStatus = HealthStatus.DEGRADED;
          }

          return result;
        } catch (error) {
          // If a health check throws, consider it unhealthy
          const unhealthyResult: ComponentHealth = {
            component,
            status: HealthStatus.UNHEALTHY,
            details: {
              error: error.message,
              stack: this.exposeDetails ? error.stack : undefined,
            },
            timestamp: new Date(),
          };

          this.healthCache.set(component, unhealthyResult);
          overallStatus = HealthStatus.UNHEALTHY;

          return unhealthyResult;
        }
      },
    );

    // Wait for all checks to complete
    const results = await Promise.all(checkPromises);
    components.push(...results);

    // Create the health check result
    const healthResult: HealthCheckResult = {
      status: overallStatus,
      components,
      region: this.region,
      environment: this.environment,
      version: this.version,
      timestamp: new Date(),
    };

    return healthResult;
  }

  /**
   * Get a simplified health check response (for public health endpoints)
   */
  async getPublicHealthCheck(): Promise<{ status: string; region: string }> {
    const result = await this.runAllHealthChecks();

    return {
      status: result.status,
      region: this.region,
    };
  }

  /**
   * Get full health check details
   */
  async getDetailedHealthCheck(): Promise<HealthCheckResult> {
    return this.runAllHealthChecks();
  }

  /**
   * Register default health checks
   */
  private registerDefaultHealthChecks(): void {
    // System memory health check
    this.registerHealthCheck('system.memory', async () => {
      const freeMem = os.freemem();
      const totalMem = os.totalmem();
      const freeMemPercentage = (freeMem / totalMem) * 100;

      let status = HealthStatus.HEALTHY;
      if (freeMemPercentage < 5) {
        status = HealthStatus.UNHEALTHY;
      } else if (freeMemPercentage < 15) {
        status = HealthStatus.DEGRADED;
      }

      return {
        component: 'system.memory',
        status,
        details: {
          freeMemoryMB: Math.round(freeMem / (1024 * 1024)),
          totalMemoryMB: Math.round(totalMem / (1024 * 1024)),
          freeMemoryPercentage: Math.round(freeMemPercentage),
        },
        timestamp: new Date(),
      };
    });

    // CPU load health check
    this.registerHealthCheck('system.cpu', async () => {
      const loadAvg = os.loadavg();
      const cpuCount = os.cpus().length;
      const relativeLoad = loadAvg[0] / cpuCount;

      let status = HealthStatus.HEALTHY;
      if (relativeLoad > 1.5) {
        status = HealthStatus.UNHEALTHY;
      } else if (relativeLoad > 0.8) {
        status = HealthStatus.DEGRADED;
      }

      return {
        component: 'system.cpu',
        status,
        details: {
          loadAverage1min: loadAvg[0],
          loadAverage5min: loadAvg[1],
          loadAverage15min: loadAvg[2],
          cpuCount,
          relativeLoad,
        },
        timestamp: new Date(),
      };
    });

    // Disk space health check
    // Note: This is a simplified check as detailed disk space info requires additional libraries
    this.registerHealthCheck('system.disk', async () => {
      // In a real implementation, use a library like 'diskusage' to get actual disk space
      // For now, we'll just report healthy
      return {
        component: 'system.disk',
        status: HealthStatus.HEALTHY,
        details: {
          note: 'Disk space check is a placeholder',
        },
        timestamp: new Date(),
      };
    });

    // Uptime health check
    this.registerHealthCheck('system.uptime', async () => {
      const uptimeSeconds = process.uptime();

      // System is degraded if it's a very new restart (less than 1 minute)
      const status =
        uptimeSeconds < 60 ? HealthStatus.DEGRADED : HealthStatus.HEALTHY;

      return {
        component: 'system.uptime',
        status,
        details: {
          uptimeSeconds: Math.round(uptimeSeconds),
          uptimeHuman: this.formatUptime(uptimeSeconds),
        },
        timestamp: new Date(),
      };
    });

    this.logger.log('Default health checks registered', 'HealthService');
  }

  /**
   * Format uptime into a human-readable string
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0)
      parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
  }
}
