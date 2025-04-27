/**
 * TypeScript fixer for NestJS Health Module
 *
 * This script creates fixed versions of the health module files that
 * currently use @ts-nocheck suppressions, properly typing all the
 * interfaces and dependencies.
 */

import * as fs from "fs";
import * as path from "path";

// Define the paths for our files
const healthDir = path.resolve(__dirname, "../../src/health");
const firestoreHealthIndicatorPath = path.join(
  healthDir,
  "firestore-health.indicator.ts",
);
const healthControllerPath = path.join(healthDir, "health.controller.ts");

// Replace @ts-nocheck in firestore-health.indicator.ts
const firestoreHealthIndicatorContent = `/**
 * Firestore Health Indicator for NestJS
 *
 * Implements health check indicator for Firestore database connections
 */

import { Injectable, Logger } from "@nestjs/common";
import { HealthIndicatorResult, HealthIndicator } from "@nestjs/terminus";

import { Timestamp } from "@google-cloud/firestore";

import { FirestoreConfigService } from "../config/firestore.config";
import { isFirestoreTimestamp } from "../types/google-cloud.types";

/**
 * For backwards compatibility with GCP health checks
 */
export interface HealthResult {
  status: "UP" | "DOWN";
  details?: Record<string, any>;
  error?: string;
}

/**
 * Firestore Health Indicator
 *
 * Implements health checks for Firestore connection using GCP native patterns
 * Extends NestJS Terminus HealthIndicator for compatibility
 */
@Injectable()
export class FirestoreHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(FirestoreHealthIndicator.name);
  private readonly testCollection = "_health_checks";

  constructor(private readonly firestoreConfigService: FirestoreConfigService) {
    super();
  }

  /**
   * Basic health check for Firestore
   * @param componentName Name of the component being checked
   * @returns Health check result in Terminus format
   */
  async isHealthy(componentName: string): Promise<HealthIndicatorResult> {
    try {
      // Get Firestore instance
      const db = this.firestoreConfigService.getFirestore();

      // Ping Firestore with a trivial operation
      await db.collection(this.testCollection).doc("ping").set({
        timestamp: new Date(),
        ping: true,
      });

      // Return result in NestJS Terminus format
      return this.getStatus(componentName, true, {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        \`Firestore health check failed: \${errorMessage}\`,
        stackTrace,
      );

      // Return result in NestJS Terminus format
      return this.getStatus(componentName, false, {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Detailed health check for Firestore with additional metrics
   * @param componentName Name of the component being checked
   * @returns Health check result with details in Terminus format
   */
  async isHealthyWithDetails(
    componentName: string,
  ): Promise<HealthIndicatorResult> {
    try {
      const startTime = process.hrtime();

      // Get Firestore instance
      const db = this.firestoreConfigService.getFirestore();

      // Use a health check collection for the test
      const healthCollection = db.collection(this.testCollection);
      const docRef = healthCollection.doc("ping");

      // Write a document
      await docRef.set({
        timestamp: new Date(),
        ping: true,
      });

      // Read the document
      const doc = await docRef.get();
      const docData = doc.data();

      // Calculate operation time
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const responseTime = seconds * 1000 + nanoseconds / 1000000;

      // Format timestamp properly
      let timestampString = "unknown";
      if (docData?.timestamp) {
        if (isFirestoreTimestamp(docData.timestamp)) {
          timestampString = docData.timestamp.toDate().toISOString();
        } else if (docData.timestamp instanceof Date) {
          timestampString = docData.timestamp.toISOString();
        } else {
          timestampString = String(docData.timestamp);
        }
      }

      // Return result in NestJS Terminus format
      return this.getStatus(componentName, true, {
        responseTime: \`\${responseTime.toFixed(2)} ms\`,
        documentExists: doc.exists,
        timestamp: timestampString,
        region: this.firestoreConfigService.getRegion() || "default",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        \`Firestore detailed health check failed: \${errorMessage}\`,
        stackTrace,
      );

      // Return result in NestJS Terminus format
      return this.getStatus(componentName, false, {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }
}`;

// Replace @ts-nocheck in health.controller.ts
const healthControllerContent = `/**
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
}`;

// Write the fixed files
fs.writeFileSync(firestoreHealthIndicatorPath, firestoreHealthIndicatorContent);
fs.writeFileSync(healthControllerPath, healthControllerContent);

console.log(
  "Successfully fixed TypeScript suppressions in health module files:",
);
console.log("- firestore-health.indicator.ts");
console.log("- health.controller.ts");
