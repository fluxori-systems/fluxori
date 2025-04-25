/**
 * Type declaration overrides for @nestjs/terminus package.
 * This helps TypeScript correctly resolve decorator types.
 */

declare module '@nestjs/terminus' {
  // Health check decorator options
  export interface HealthCheckOptions {
    noCache?: boolean;
    swaggerDocumentation?: boolean;
  }

  // Augment the HealthCheck decorator to fix TypeScript errors
  export const HealthCheck: (options?: HealthCheckOptions) => MethodDecorator;

  // Define proper types for health indicators
  export interface HealthIndicatorResult {
    [key: string]: {
      status: string;
      [key: string]: any;
    };
  }

  export interface HealthCheckResult {
    status: string;
    info?: HealthIndicatorResult;
    error?: HealthIndicatorResult;
    details: HealthIndicatorResult;
  }

  // Health check service
  export class HealthCheckService {
    check(
      indicators: Array<() => Promise<HealthIndicatorResult> | Promise<any>>,
    ): Promise<HealthCheckResult>;
  }

  // Base health indicator class
  export abstract class HealthIndicator {
    protected getStatus(
      key: string,
      isHealthy: boolean,
      data?: { [key: string]: any },
    ): HealthIndicatorResult;
  }

  // Specific health indicators
  export class DiskHealthIndicator extends HealthIndicator {
    checkStorage(
      key: string,
      options: { path: string; thresholdPercent: number },
    ): Promise<HealthIndicatorResult>;
  }

  export class MemoryHealthIndicator extends HealthIndicator {
    checkHeap(key: string, threshold: number): Promise<HealthIndicatorResult>;
    checkRSS(key: string, threshold: number): Promise<HealthIndicatorResult>;
  }

  export class HttpHealthIndicator extends HealthIndicator {
    pingCheck(
      key: string,
      url: string,
      options?: any,
    ): Promise<HealthIndicatorResult>;
  }
}
