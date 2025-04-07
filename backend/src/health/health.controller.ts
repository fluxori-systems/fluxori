import { Controller, Get, HttpCode } from '@nestjs/common';
import { FirestoreHealthIndicator, HealthResult } from './firestore-health.indicator';

/**
 * Health Controller
 * 
 * Provides GCP-native health check endpoints for the application
 */
@Controller('health')
export class HealthController {
  constructor(private readonly firestoreHealth: FirestoreHealthIndicator) {}
  
  /**
   * Basic health check endpoint
   * Compatible with GCP health checking services
   */
  @Get()
  @HttpCode(200)
  async check(): Promise<HealthResult> {
    return this.firestoreHealth.isHealthy('firestore');
  }
  
  /**
   * Detailed health check with additional information
   */
  @Get('detail')
  @HttpCode(200)
  async checkDetail(): Promise<HealthResult> {
    return this.firestoreHealth.isHealthyWithDetails('firestore');
  }
  
  /**
   * Liveness probe compatible with Kubernetes/GKE
   */
  @Get('liveness')
  @HttpCode(200)
  async liveness(): Promise<{status: string}> {
    // Liveness just checks if the application is running
    return { status: 'UP' };
  }
  
  /**
   * Readiness probe compatible with Kubernetes/GKE
   */
  @Get('readiness')
  @HttpCode(200)
  async readiness(): Promise<HealthResult> {
    // Readiness checks if the application can serve requests
    return this.firestoreHealth.isHealthy('firestore');
  }
}