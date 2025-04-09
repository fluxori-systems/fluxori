import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Monitoring } from '@google-cloud/monitoring';

import { ObservabilityService } from '../../../common/observability';

/**
 * Service for collecting and reporting security metrics
 */
@Injectable()
export class SecurityMetricsService {
  private readonly logger = new Logger(SecurityMetricsService.name);
  private readonly monitoring: Monitoring;
  private readonly projectId: string;
  private readonly metricPrefix = 'custom.googleapis.com/fluxori/security';
  
  // Cache of last collected metrics to reduce API calls
  private cachedMetrics: Record<string, number> = {};
  private lastCacheUpdate = 0;
  private readonly cacheTtl = 60000; // 1 minute cache TTL
  
  constructor(
    @Inject('SECURITY_MODULE_OPTIONS') private readonly options: any,
    private readonly configService: ConfigService,
    private readonly observability: ObservabilityService,
  ) {
    this.projectId = this.configService.get<string>('GCP_PROJECT_ID');
    
    // Initialize GCP Monitoring client
    this.monitoring = new Monitoring();
    
    this.logger.log('Security Metrics service initialized');
  }
  
  /**
   * Collect security metrics from various sources
   * @returns Object with security metrics
   */
  async collectSecurityMetrics(): Promise<Record<string, number>> {
    // Use cached metrics if they're still fresh
    if (Date.now() - this.lastCacheUpdate < this.cacheTtl) {
      return this.cachedMetrics;
    }
    
    const span = this.observability.startTrace('security.collectMetrics');
    
    try {
      // Create new metrics object by querying various sources
      const metrics: Record<string, number> = {};
      
      // Collect metrics from Cloud Monitoring
      const monitoringMetrics = await this.collectMonitoringMetrics();
      Object.assign(metrics, monitoringMetrics);
      
      // Collect security incidents metrics
      const incidentMetrics = await this.collectIncidentMetrics();
      Object.assign(metrics, incidentMetrics);
      
      // Collect authentication metrics
      const authMetrics = await this.collectAuthMetrics();
      Object.assign(metrics, authMetrics);
      
      // Cache the collected metrics
      this.cachedMetrics = metrics;
      this.lastCacheUpdate = Date.now();
      
      span.end();
      return metrics;
    } catch (error) {
      span.recordException(error);
      span.end();
      
      this.logger.error(`Failed to collect security metrics: ${error.message}`, error.stack);
      this.observability.error('Security metrics collection failed', error, SecurityMetricsService.name);
      
      // Return the last cached metrics if available, otherwise empty object
      return this.cachedMetrics || {};
    }
  }
  
  /**
   * Collect metrics from Cloud Monitoring
   */
  private async collectMonitoringMetrics(): Promise<Record<string, number>> {
    try {
      const metrics: Record<string, number> = {};
      
      // In a real implementation, this would query Cloud Monitoring Time Series
      // For this example, we'll return placeholder values
      
      metrics['security.waf.requests.blocked'] = 123;
      metrics['security.waf.requests.allowed'] = 9876;
      metrics['security.dlp.scans'] = 45;
      metrics['security.dlp.findings'] = 3;
      metrics['security.vpc.perimeter.violations'] = 2;
      
      return metrics;
    } catch (error) {
      this.logger.error(`Failed to collect monitoring metrics: ${error.message}`, error.stack);
      return {};
    }
  }
  
  /**
   * Collect security incident metrics
   */
  private async collectIncidentMetrics(): Promise<Record<string, number>> {
    try {
      const metrics: Record<string, number> = {};
      
      // In a real implementation, this would query security incidents data
      // For this example, we'll return placeholder values
      
      metrics['security.incidents.active'] = 1;
      metrics['security.incidents.resolved.24h'] = 4;
      metrics['security.incidents.total.30d'] = 12;
      metrics['security.incidents.mttd.minutes'] = 18; // Mean time to detect
      metrics['security.incidents.mttr.minutes'] = 45; // Mean time to resolve
      
      return metrics;
    } catch (error) {
      this.logger.error(`Failed to collect incident metrics: ${error.message}`, error.stack);
      return {};
    }
  }
  
  /**
   * Collect authentication-related security metrics
   */
  private async collectAuthMetrics(): Promise<Record<string, number>> {
    try {
      const metrics: Record<string, number> = {};
      
      // In a real implementation, this would query auth metrics from Firebase or logs
      // For this example, we'll return placeholder values
      
      metrics['security.auth.login.success'] = 456;
      metrics['security.auth.login.failure'] = 23;
      metrics['security.auth.password.reset'] = 7;
      metrics['security.auth.bruteforce.blocked'] = 3;
      metrics['security.alerts.24h'] = 8;
      
      return metrics;
    } catch (error) {
      this.logger.error(`Failed to collect auth metrics: ${error.message}`, error.stack);
      return {};
    }
  }
  
  /**
   * Record a custom security metric
   * @param metricName The name of the metric
   * @param value The metric value
   * @param labels Optional metric labels
   */
  async recordMetric(
    metricName: string,
    value: number,
    labels: Record<string, string> = {}
  ): Promise<void> {
    try {
      // Use the observability service to record the metric
      this.observability.recordGauge(`security.${metricName}`, value, labels);
      
      // Update the cached metric
      this.cachedMetrics[`security.${metricName}`] = value;
      
      this.logger.debug(`Recorded security metric: ${metricName} = ${value}`);
    } catch (error) {
      this.logger.error(`Failed to record security metric: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Increment a counter metric
   * @param metricName The name of the metric
   * @param incrementBy The amount to increment by
   * @param labels Optional metric labels
   */
  async incrementMetric(
    metricName: string,
    incrementBy = 1,
    labels: Record<string, string> = {}
  ): Promise<void> {
    try {
      // Use the observability service to increment the counter
      this.observability.incrementCounter(`security.${metricName}`, incrementBy, labels);
      
      // Update the cached metric
      const currentValue = this.cachedMetrics[`security.${metricName}`] || 0;
      this.cachedMetrics[`security.${metricName}`] = currentValue + incrementBy;
      
      this.logger.debug(`Incremented security metric: ${metricName} by ${incrementBy}`);
    } catch (error) {
      this.logger.error(`Failed to increment security metric: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Create or update a Cloud Monitoring alert policy for a security metric
   * @param metricName The metric to alert on
   * @param threshold The alert threshold
   * @param duration The duration the threshold must be exceeded
   * @param description Alert description
   */
  async createAlertPolicy(
    metricName: string,
    threshold: number,
    duration: { seconds: number },
    description: string
  ): Promise<string> {
    try {
      // In a real implementation, this would create a Cloud Monitoring alert policy
      // For this example, we'll just log the action
      
      this.logger.log(`Would create alert policy for metric: ${metricName}, threshold: ${threshold}, duration: ${duration.seconds}s`);
      
      return `projects/${this.projectId}/alertPolicies/security-${metricName}-${Date.now()}`;
    } catch (error) {
      this.logger.error(`Failed to create alert policy: ${error.message}`, error.stack);
      throw error;
    }
  }
}