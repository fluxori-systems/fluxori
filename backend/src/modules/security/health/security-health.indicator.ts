import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { HealthCheckError } from '@nestjs/terminus/dist/health-check';

import { SecurityService } from '../services/security.service';
import { CredentialManagerService } from '../services/credential-manager.service';
import { FileScannerService } from '../services/file-scanner.service';
import { DlpService } from '../services/dlp.service';
import { VpcServiceControlsService } from '../services/vpc-service-controls.service';
import { CloudArmorService } from '../services/cloud-armor.service';
import { ObservabilityService } from '../../../common/observability';

/**
 * Health indicator for the security module
 * Integrates with the Terminus health check system
 */
@Injectable()
export class SecurityHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(SecurityHealthIndicator.name);
  
  constructor(
    private readonly securityService: SecurityService,
    private readonly credentialManager: CredentialManagerService,
    private readonly fileScanner: FileScannerService,
    private readonly dlpService: DlpService,
    private readonly vpcServiceControls: VpcServiceControlsService,
    private readonly cloudArmor: CloudArmorService,
    private readonly observability: ObservabilityService,
  ) {
    super();
  }
  
  /**
   * Perform a health check for the security module
   * @param key The key to use in the health check result
   * @returns Health check result
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    // Start tracing
    const span = this.observability.startTrace('security.healthCheck');
    
    try {
      // Get the security health status
      const healthStatus = await this.securityService.getSecurityHealth();
      
      // Determine overall health
      const isHealthy = healthStatus.status !== 'unhealthy';
      
      // Get details for each component
      const details = healthStatus.components.reduce((acc, component) => {
        acc[component.name] = { status: component.status };
        if (component.error) {
          acc[component.name].error = component.error;
        }
        return acc;
      }, {} as Record<string, any>);
      
      // Add metrics
      details.activeIncidents = healthStatus.activeIncidents;
      details.recentAlerts = healthStatus.recentAlerts;
      
      if (healthStatus.lastScanTime) {
        details.lastScanTime = healthStatus.lastScanTime.toISOString();
      }
      
      // Create health check result
      const result = this.getStatus(key, isHealthy, details);
      
      // If not healthy, record an error
      if (!isHealthy) {
        const unhealthyComponents = healthStatus.components
          .filter(c => c.status === 'unhealthy')
          .map(c => `${c.name}: ${c.error || 'Unknown error'}`)
          .join(', ');
        
        this.observability.error(
          'Security health check failed',
          unhealthyComponents,
          SecurityHealthIndicator.name
        );
      }
      
      span.setAttribute('security.health.status', healthStatus.status);
      span.end();
      
      // If not healthy, throw a HealthCheckError
      if (!isHealthy) {
        throw new HealthCheckError(
          'Security health check failed',
          result
        );
      }
      
      return result;
    } catch (error) {
      // If this is already a HealthCheckError, rethrow it
      if (error instanceof HealthCheckError) {
        throw error;
      }
      
      // Otherwise, log the error and return an unhealthy status
      span.recordException(error);
      span.end();
      
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Security health check failed: ${errorMsg}`);
      
      const result = this.getStatus(key, false, {
        error: errorMsg,
      });
      
      throw new HealthCheckError('Security health check failed', result);
    }
  }
  
  /**
   * Perform a detailed health check for the security module
   * @returns Detailed health check results
   */
  async checkSecurityComponents(): Promise<{
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, {
      status: 'healthy' | 'degraded' | 'unhealthy';
      details?: Record<string, any>;
      error?: string;
    }>;
  }> {
    const span = this.observability.startTrace('security.detailedHealthCheck');
    
    try {
      // Check health of each component
      const [
        securityHealth,
        fileScannerHealth,
        dlpHealth,
        vpcHealth,
        cloudArmorHealth,
        credentialManagerHealth,
      ] = await Promise.allSettled([
        this.securityService.getSecurityHealth(),
        this.checkComponentHealth('fileScanner', () => this.fileScanner.getServiceHealth()),
        this.checkComponentHealth('dlp', () => this.dlpService.getServiceHealth()),
        this.checkComponentHealth('vpcServiceControls', () => this.vpcServiceControls.getServiceControlsStatus()
          .then(status => ({ status: status.enabled ? 'healthy' : 'degraded' }))),
        this.checkComponentHealth('cloudArmor', () => this.cloudArmor.getSecurityPolicyMetrics()
          .then(() => ({ status: 'healthy' }))),
        this.checkComponentHealth('credentialManager', () => this.credentialManager.listCredentials()
          .then(() => ({ status: 'healthy' }))),
      ]);
      
      // Process the results
      const components: Record<string, any> = {};
      
      // Process security service health
      if (securityHealth.status === 'fulfilled') {
        components.security = {
          status: securityHealth.value.status,
          components: securityHealth.value.components.reduce((acc, component) => {
            acc[component.name] = {
              status: component.status,
              lastChecked: component.lastChecked.toISOString(),
            };
            if (component.error) {
              acc[component.name].error = component.error;
            }
            return acc;
          }, {} as Record<string, any>),
          metrics: {
            activeIncidents: securityHealth.value.activeIncidents,
            recentAlerts: securityHealth.value.recentAlerts,
          },
        };
      } else {
        components.security = {
          status: 'unhealthy',
          error: securityHealth.reason?.message || 'Unknown error',
        };
      }
      
      // Process file scanner health
      components.fileScanner = fileScannerHealth.status === 'fulfilled'
        ? { status: fileScannerHealth.value.status }
        : { status: 'unhealthy', error: fileScannerHealth.reason?.message || 'Unknown error' };
      
      // Process DLP health
      components.dlp = dlpHealth.status === 'fulfilled'
        ? { status: dlpHealth.value.status }
        : { status: 'unhealthy', error: dlpHealth.reason?.message || 'Unknown error' };
      
      // Process VPC Service Controls health
      components.vpcServiceControls = vpcHealth.status === 'fulfilled'
        ? { status: vpcHealth.value.status }
        : { status: 'unhealthy', error: vpcHealth.reason?.message || 'Unknown error' };
      
      // Process Cloud Armor health
      components.cloudArmor = cloudArmorHealth.status === 'fulfilled'
        ? { status: cloudArmorHealth.value.status }
        : { status: 'unhealthy', error: cloudArmorHealth.reason?.message || 'Unknown error' };
      
      // Process Credential Manager health
      components.credentialManager = credentialManagerHealth.status === 'fulfilled'
        ? { status: credentialManagerHealth.value.status }
        : { status: 'unhealthy', error: credentialManagerHealth.reason?.message || 'Unknown error' };
      
      // Determine overall status
      const statuses = Object.values(components).map(c => c.status);
      
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (statuses.includes('unhealthy')) {
        overallStatus = 'unhealthy';
      } else if (statuses.includes('degraded')) {
        overallStatus = 'degraded';
      }
      
      span.setAttribute('security.health.overallStatus', overallStatus);
      span.end();
      
      return {
        overallStatus,
        components,
      };
    } catch (error) {
      span.recordException(error);
      span.end();
      
      this.logger.error(`Detailed security health check failed: ${error.message}`, error.stack);
      
      return {
        overallStatus: 'unhealthy',
        components: {
          error: {
            status: 'unhealthy',
            error: error.message,
          },
        },
      };
    }
  }
  
  /**
   * Check the health of a specific component with error handling
   */
  private async checkComponentHealth<T>(
    name: string,
    checkFn: () => Promise<T>
  ): Promise<T & { status: string }> {
    try {
      return await checkFn() as T & { status: string };
    } catch (error) {
      this.logger.error(`Health check failed for ${name}: ${error.message}`, error.stack);
      const result = { status: 'unhealthy', error: error.message };
      return result as unknown as T & { status: string };
    }
  }
}