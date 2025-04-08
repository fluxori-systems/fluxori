import { Controller, Get, Logger } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  HttpHealthIndicator
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { FirestoreHealthIndicator } from './firestore-health.indicator';
import { STORAGE_SERVICE } from '../common/storage/storage.interface';
import { Inject } from '@nestjs/common';

/**
 * Health controller
 * 
 * Provides health check endpoints for the application
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly http: HttpHealthIndicator,
    private readonly firestore: FirestoreHealthIndicator,
    private readonly configService: ConfigService,
    @Inject(STORAGE_SERVICE) private readonly storageService: any
  ) {}

  /**
   * Minimal health check endpoint
   * Returns simple UP status without checking dependencies
   */
  @Get()
  basicCheck(): HealthCheckResult {
    return {
      status: 'ok',
      info: {
        service: {
          status: 'up',
          timestamp: new Date().toISOString()
        }
      },
      details: {
        service: {
          status: 'up',
          timestamp: new Date().toISOString()
        }
      },
      error: {}
    };
  }

  /**
   * Complete health check endpoint
   * Checks all dependencies including Firestore, HTTP, disk, and memory
   */
  @Get('/check')
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Check Firestore database health
      async () => this.firestore.isHealthy('database'),
      
      // Check disk space
      async () => this.disk.checkStorage('disk', { path: '/', thresholdPercent: 90 }),
      
      // Check memory usage
      async () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      async () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),   // 500MB
      
      // Check external dependencies
      ...this.getExternalDependencyChecks()
    ]);
  }

  /**
   * Get external dependency health checks
   */
  private getExternalDependencyChecks() {
    const checks = [];

    // Check OpenAI API if configured
    const openAiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openAiKey) {
      checks.push(
        () => this.http.pingCheck('openai_api', 'https://api.openai.com/v1/engines')
      );
    }

    // Add checks for other external services as needed
    return checks;
  }

  /**
   * Readiness check
   * Determines if the application is ready to receive traffic
   */
  @Get('/readiness')
  @HealthCheck()
  async readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Just check Firestore since it's the main dependency
      async () => this.firestore.isHealthy('database')
    ]);
  }

  /**
   * Liveness check
   * Determines if the application is running and not crashed
   */
  @Get('/liveness')
  @HealthCheck()
  async liveness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Simply check memory to ensure app is running
      async () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024)
    ]);
  }
}