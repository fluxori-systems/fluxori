/**
 * Health controller for NestJS application
 *
 * Provides health check endpoints for monitoring application status
 */

import { Controller, Get, Logger, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorResult,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  HttpHealthIndicator,
} from "@nestjs/terminus";

import { FirestoreHealthIndicator } from "./firestore-health.indicator";
import { STORAGE_SERVICE } from "../common/storage/storage.interface";

/**
 * Type for health check indicator function
 */
type HealthIndicatorFunction = () => Promise<HealthIndicatorResult>;

// Define storage service interface
interface StorageService {
  // Add necessary methods based on implementation
  getBucketName(): string;
  // Add other methods as needed
}

/**
 * Health controller
 *
 * Provides health check endpoints for the application
 */
@Controller("health")
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly http: HttpHealthIndicator,
    private readonly firestore: FirestoreHealthIndicator,
    private readonly configService: ConfigService,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
  ) {}

  /**
   * Minimal health check endpoint
   * Returns simple UP status without checking dependencies
   */
  @Get()
  basicCheck(): HealthCheckResult {
    return this.getBasicHealthCheck();
  }

  /**
   * Complete health check endpoint
   * Checks all dependencies including Firestore, HTTP, disk, and memory
   */
  @Get("/check")
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.executeFullHealthCheck();
  }

  /**
   * Readiness check
   * Determines if the application is ready to receive traffic
   */
  @Get("/readiness")
  @HealthCheck()
  readiness(): Promise<HealthCheckResult> {
    return this.executeReadinessCheck();
  }

  /**
   * Liveness check
   * Determines if the application is running and not crashed
   */
  @Get("/liveness")
  @HealthCheck()
  liveness(): Promise<HealthCheckResult> {
    return this.executeLivenessCheck();
  }

  /**
   * Implementation of basic health check
   */
  private getBasicHealthCheck(): HealthCheckResult {
    // Return basic health check result in Terminus format
    return {
      status: "ok",
      info: {
        service: {
          status: "up",
          timestamp: new Date().toISOString(),
        },
      },
      details: {
        service: {
          status: "up",
          timestamp: new Date().toISOString(),
        },
      },
      error: {} as Record<string, never>,
    };
  }

  /**
   * Implementation of full health check
   */
  private executeFullHealthCheck(): Promise<HealthCheckResult> {
    const indicators: HealthIndicatorFunction[] = [
      // Check Firestore database health
      () => this.firestore.isHealthy("database"),

      // Check disk space
      () => this.disk.checkStorage("disk", { path: "/", thresholdPercent: 90 }),

      // Check memory usage
      () => this.memory.checkHeap("memory_heap", 300 * 1024 * 1024), // 300MB
      () => this.memory.checkRSS("memory_rss", 500 * 1024 * 1024), // 500MB
    ];

    // Add external dependency checks
    const externalChecks = this.getExternalDependencyChecks();

    // Run health checks
    return this.health.check([...indicators, ...externalChecks]);
  }

  /**
   * Implementation of readiness check
   */
  private executeReadinessCheck(): Promise<HealthCheckResult> {
    // Just check Firestore since it's the main dependency
    return this.health.check([() => this.firestore.isHealthy("database")]);
  }

  /**
   * Implementation of liveness check
   */
  private executeLivenessCheck(): Promise<HealthCheckResult> {
    // Simply check memory to ensure app is running
    return this.health.check([
      () => this.memory.checkHeap("memory_heap", 500 * 1024 * 1024),
    ]);
  }

  /**
   * Get external dependency health checks
   */
  private getExternalDependencyChecks(): HealthIndicatorFunction[] {
    const checks: HealthIndicatorFunction[] = [];

    // Check OpenAI API if configured
    const openAiKey = this.configService.get<string>("OPENAI_API_KEY");
    if (openAiKey) {
      checks.push(() =>
        this.http.pingCheck("openai_api", "https://api.openai.com/v1/engines"),
      );
    }

    // Add checks for other external services as needed
    return checks;
  }
}