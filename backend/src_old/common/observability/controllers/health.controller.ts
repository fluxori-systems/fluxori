import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

// Import services
import { Public } from "@common/decorators";
import {
  HealthCheckResult,
  HealthStatus,
} from "../interfaces/observability.interfaces";
import { HealthService } from "../services/health.service";
import { ObservabilityService } from "../services/observability.service";

// Import interfaces

// Import decorators

/**
 * Controller for health check endpoints
 */
@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly observability: ObservabilityService,
  ) {}

  /**
   * Basic health check endpoint
   * This endpoint is public and can be used by load balancers, etc.
   */
  @Public()
  @Get()
  @ApiOperation({ summary: "Basic health check" })
  @ApiResponse({
    status: 200,
    description: "System is healthy",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "healthy" },
        region: { type: "string", example: "africa-south1" },
      },
    },
  })
  @ApiResponse({ status: 503, description: "System is unhealthy" })
  async getHealth(): Promise<{ status: string; region: string }> {
    return this.observability.getPublicHealthCheck();
  }

  /**
   * Detailed health check with component status
   * This endpoint is protected and only available to authenticated users
   */
  @Get("detailed")
  @ApiOperation({ summary: "Detailed health check with component status" })
  @ApiResponse({
    status: 200,
    description: "Detailed health information",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "healthy" },
        components: {
          type: "array",
          items: {
            type: "object",
            properties: {
              component: { type: "string", example: "system.memory" },
              status: { type: "string", example: "healthy" },
              details: { type: "object" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
        region: { type: "string", example: "africa-south1" },
        environment: { type: "string", example: "production" },
        version: { type: "string", example: "1.0.0" },
        timestamp: { type: "string", format: "date-time" },
      },
    },
  })
  @ApiResponse({ status: 503, description: "System is unhealthy" })
  async getDetailedHealth(): Promise<HealthCheckResult> {
    const result = await this.observability.getDetailedHealthCheck();

    // Set appropriate HTTP status code based on health status
    if (result.status === HealthStatus.UNHEALTHY) {
      throw new Error("Service is unhealthy");
    }

    return result;
  }

  /**
   * Readiness check for Kubernetes/Cloud Run health probes
   * This endpoint indicates whether the service is ready to handle traffic
   */
  @Public()
  @Get("readiness")
  @ApiOperation({ summary: "Readiness check for health probes" })
  @ApiResponse({ status: 200, description: "Service is ready" })
  @ApiResponse({ status: 503, description: "Service is not ready" })
  async getReadiness(): Promise<{ status: string; timestamp: string }> {
    const result = await this.observability.getDetailedHealthCheck();

    if (result.status === HealthStatus.UNHEALTHY) {
      throw new Error("Service is not ready");
    }

    return {
      status: "ready",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Liveness check for Kubernetes/Cloud Run health probes
   * This endpoint indicates whether the service is alive and should be restarted if not
   */
  @Public()
  @Get("liveness")
  @ApiOperation({ summary: "Liveness check for health probes" })
  @ApiResponse({ status: 200, description: "Service is alive" })
  @ApiResponse({ status: 503, description: "Service needs restart" })
  async getLiveness(): Promise<{ status: string; uptime: number }> {
    // For liveness, we just need to verify the service responds
    // A successful response indicates the service is alive
    return {
      status: "alive",
      uptime: process.uptime(),
    };
  }
}
