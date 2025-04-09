import { Injectable, Inject, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, BehaviorSubject } from 'rxjs';
import * as crypto from 'crypto';

import { 
  SecurityService as ISecurityService,
  SecurityContext,
  SecurityEvaluationResult,
  SecurityPolicyConfig,
  SecurityHealthStatus
} from '../interfaces/security.interfaces';
import { ObservabilityService } from '../../../common/observability';
import { FeatureFlagService } from '../../feature-flags/services/feature-flag.service';
import { FileScannerService } from './file-scanner.service';
import { DlpService } from './dlp.service';
import { SecurityMetricsService } from './security-metrics.service';

/**
 * Core security service that provides security controls and policy enforcement
 */
@Injectable()
export class SecurityService implements ISecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private readonly securityMetrics$ = new BehaviorSubject<Record<string, number>>({});
  
  constructor(
    @Inject('SECURITY_MODULE_OPTIONS') private readonly options: any,
    private readonly observability: ObservabilityService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly fileScanner: FileScannerService,
    private readonly dlpService: DlpService,
    private readonly securityMetricsService: SecurityMetricsService,
  ) {
    this.logger.log('Security service initialized with South African compliance configuration');
    this.initializeMetrics();
  }
  
  /**
   * Initialize security metrics collection
   */
  private initializeMetrics(): void {
    // Schedule regular metrics updates
    setInterval(() => {
      this.updateSecurityMetrics();
    }, 60000); // Update every minute
    
    // Initial metrics update
    this.updateSecurityMetrics();
  }
  
  /**
   * Update security metrics from various sources
   */
  private async updateSecurityMetrics(): Promise<void> {
    try {
      const metrics = await this.securityMetricsService.collectSecurityMetrics();
      this.securityMetrics$.next(metrics);
    } catch (error) {
      this.logger.error(`Failed to update security metrics: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Evaluates whether a security context meets policy requirements
   * @param context The security context to evaluate
   * @param operation The operation being performed
   * @param resource The resource being accessed
   * @returns The security evaluation result
   */
  async evaluateAccess(
    context: SecurityContext,
    operation: string,
    resource: string
  ): Promise<SecurityEvaluationResult> {
    // Start a trace for the security evaluation
    const span = this.observability.startTrace('security.evaluateAccess', {
      userId: context.userId,
      operation,
      resource,
    });
    
    try {
      // Check if the security feature is enabled via feature flags
      const securityEnabled = await this.featureFlagService.isEnabled(
        'enhanced-security-controls',
        {
          userId: context.userId,
          organizationId: context.organizationId,
        }
      );
      
      // Default access policy when security controls are disabled
      if (!securityEnabled) {
        span.addEvent('security.policy.disabled');
        span.end();
        
        return {
          allowed: true,
          reason: 'Enhanced security controls are disabled',
          accessLevel: 'write', // Default to full access if security is disabled
          riskScore: 50,
          actions: ['log'],
        };
      }
      
      // Evaluate access based on context, operation, and resource
      const result = await this.performAccessEvaluation(context, operation, resource);
      
      // Record the evaluation result
      span.setAttribute('security.evaluation.allowed', result.allowed);
      span.setAttribute('security.evaluation.riskScore', result.riskScore || 0);
      
      // Record metrics
      this.observability.incrementCounter('security.evaluation.count');
      if (!result.allowed) {
        this.observability.incrementCounter('security.evaluation.denied');
      }
      
      // Log security event if denied or high risk
      if (!result.allowed || (result.riskScore && result.riskScore > 70)) {
        this.logSecurityEvent(
          result.allowed ? 'high-risk-access' : 'access-denied',
          context
        );
      }
      
      span.end();
      return result;
    } catch (error) {
      span.recordException(error);
      span.end();
      
      this.logger.error(`Error in security evaluation: ${error.message}`, error.stack);
      this.observability.error('Security evaluation failed', error, SecurityService.name);
      
      // Default to denial on error
      return {
        allowed: false,
        reason: 'Security evaluation error',
        riskScore: 100,
        actions: ['log', 'alert'],
      };
    }
  }
  
  /**
   * Perform the actual access evaluation logic
   */
  private async performAccessEvaluation(
    context: SecurityContext,
    operation: string,
    resource: string
  ): Promise<SecurityEvaluationResult> {
    // Calculate a risk score based on various factors
    const riskScore = this.calculateRiskScore(context, operation, resource);
    
    // High risk operations require stricter evaluation
    const isHighRiskOperation = ['delete', 'update_all', 'admin'].includes(operation);
    
    // Deny access for high-risk operations with high risk scores
    if (isHighRiskOperation && riskScore > 70) {
      return {
        allowed: false,
        reason: 'High risk operation with elevated risk factors',
        riskScore,
        actions: ['log', 'alert'],
      };
    }
    
    // Check for South African data residency requirements
    if (
      this.options.southAfricanCompliance?.enforceDataResidency &&
      resource.startsWith('pii:') && 
      !context.clientIp?.startsWith('41.') // South African IP range check (simplified)
    ) {
      return {
        allowed: false,
        reason: 'Access to PII data outside South Africa is restricted',
        riskScore: 85,
        actions: ['log', 'alert'],
      };
    }
    
    // Special handling for organization-level resources
    if (resource.includes(':org:') && context.organizationId) {
      const resourceOrgId = resource.split(':org:')[1].split(':')[0];
      
      // Only allow access to your own organization's resources
      if (resourceOrgId !== context.organizationId) {
        return {
          allowed: false,
          reason: 'Cross-organization access denied',
          riskScore: 90,
          actions: ['log', 'alert'],
        };
      }
    }
    
    // Determine access level based on roles
    let accessLevel: 'read' | 'write' | 'admin' = 'read';
    
    if (context.roles?.includes('admin')) {
      accessLevel = 'admin';
    } else if (context.roles?.includes('editor') || context.roles?.includes('contributor')) {
      accessLevel = 'write';
    }
    
    // Check if the operation is allowed for the determined access level
    const operationAllowed = this.isOperationAllowedForAccessLevel(operation, accessLevel);
    
    if (!operationAllowed) {
      return {
        allowed: false,
        reason: `Operation ${operation} requires higher access level than ${accessLevel}`,
        riskScore,
        actions: ['log'],
      };
    }
    
    // Default to allowed with the appropriate access level
    return {
      allowed: true,
      reason: 'Access granted based on role and context',
      accessLevel,
      riskScore,
      actions: riskScore > 50 ? ['log'] : [],
    };
  }
  
  /**
   * Calculate a risk score based on various security factors
   */
  private calculateRiskScore(
    context: SecurityContext,
    operation: string,
    resource: string
  ): number {
    let score = 0;
    
    // Operation risk
    if (operation === 'delete') score += 30;
    else if (operation === 'update') score += 20;
    else if (operation === 'create') score += 10;
    
    // Resource sensitivity
    if (resource.startsWith('pii:')) score += 30;
    else if (resource.startsWith('financial:')) score += 25;
    else if (resource.startsWith('admin:')) score += 20;
    
    // Context factors
    if (!context.userId) score += 20; // Unauthenticated access
    if (!context.session) score += 15; // No session context
    
    // New/suspicious session
    if (context.session && 
        (new Date().getTime() - context.session.createdAt.getTime()) < 10 * 60 * 1000) {
      score += 10; // Session less than 10 minutes old
    }
    
    // Cap score at 100
    return Math.min(score, 100);
  }
  
  /**
   * Check if an operation is allowed for a given access level
   */
  private isOperationAllowedForAccessLevel(
    operation: string,
    accessLevel: 'read' | 'write' | 'admin'
  ): boolean {
    switch (accessLevel) {
      case 'read':
        return ['read', 'list', 'get'].includes(operation);
      
      case 'write':
        return ['read', 'list', 'get', 'create', 'update'].includes(operation);
      
      case 'admin':
        return true; // Admin can perform all operations
      
      default:
        return false;
    }
  }
  
  /**
   * Creates a security context from an Express request
   * @param request The Express request
   * @returns A security context
   */
  createSecurityContext(request: Request): SecurityContext {
    const context: SecurityContext = {
      clientIp: this.getClientIp(request),
      userAgent: request.headers['user-agent'],
      path: request.path,
      method: request.method,
    };
    
    // Extract user information if available
    if (request.user) {
      context.userId = request.user.id;
      context.roles = request.user.role ? [request.user.role] : [];
      context.organizationId = request.user.organizationId;
    }
    
    // Extract session information if available
    if (request.session) {
      context.session = {
        id: request.sessionID,
        createdAt: request.session.createdAt || new Date(),
        lastActivity: new Date(),
      };
    }
    
    // Extract resource information from route parameters if available
    if (request.params.id) {
      context.resourceId = request.params.id;
    }
    
    // Attempt to determine resource type from the URL path
    const pathParts = request.path.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      context.resourceType = pathParts[0]; // e.g., /users/123 -> users
    }
    
    return context;
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
    return request.ip || request.connection.remoteAddress || '';
  }
  
  /**
   * Validates whether a file meets security requirements
   * @param file The file to validate
   * @param config The security policy configuration
   * @returns Whether the file is valid and any validation messages
   */
  async validateFile(
    file: Buffer,
    config: SecurityPolicyConfig
  ): Promise<{ valid: boolean; messages: string[] }> {
    const fileConfig = config.fileUpload || this.options.defaultPolicyConfig.fileUpload;
    const messages: string[] = [];
    
    // Check file size
    if (file.length > fileConfig.maxSizeBytes) {
      messages.push(`File size exceeds the maximum allowed size of ${fileConfig.maxSizeBytes} bytes`);
    }
    
    // If scanning is enabled, perform a malware scan
    if (fileConfig.scanForMalware) {
      const scanResult = await this.scanFile(file);
      if (!scanResult.clean) {
        messages.push(`File failed security scan: ${scanResult.threats.join(', ')}`);
      }
    }
    
    // Validate file content if required
    // This would typically involve checking file signatures, magic bytes, etc.
    if (fileConfig.validateContentType) {
      try {
        const contentValidation = this.validateFileContent(file);
        if (!contentValidation.valid) {
          messages.push(`File content validation failed: ${contentValidation.reason}`);
        }
      } catch (error) {
        messages.push(`Error validating file content: ${error.message}`);
      }
    }
    
    return {
      valid: messages.length === 0,
      messages,
    };
  }
  
  /**
   * Validate the file content matches its declared type
   */
  private validateFileContent(file: Buffer): { valid: boolean; reason?: string } {
    // Check for common file signatures
    const magicBytes = file.slice(0, 4).toString('hex');
    
    // Simple validation of common file types
    // In a real implementation, this would be much more comprehensive
    if (magicBytes.startsWith('89504e47')) {
      return { valid: true }; // PNG
    } else if (magicBytes.startsWith('ffd8ff')) {
      return { valid: true }; // JPEG
    } else if (magicBytes.startsWith('25504446')) {
      return { valid: true }; // PDF
    } else if (magicBytes.startsWith('504b0304')) {
      return { valid: true }; // ZIP/XLSX/DOCX
    }
    
    // For a more comprehensive implementation, use a proper file type detection library
    return { valid: false, reason: 'Unrecognized or unsupported file format' };
  }
  
  /**
   * Scans a file for malware and other security threats
   * @param file The file to scan
   * @returns Scan results including threats detected
   */
  async scanFile(
    file: Buffer
  ): Promise<{ clean: boolean; threats: string[] }> {
    return this.fileScanner.scanFile(file);
  }
  
  /**
   * Scans text for sensitive information (PII, credentials, etc.)
   * @param text The text to scan
   * @param config DLP configuration
   * @returns Scan results with detected sensitive information
   */
  async scanText(
    text: string,
    config?: Record<string, any>
  ): Promise<{ hasSensitiveInfo: boolean; infoTypes: string[] }> {
    return this.dlpService.scanText(text, config);
  }
  
  /**
   * Apply security headers to an HTTP response
   * @param response The HTTP response
   * @param config Security policy configuration
   */
  applySecurityHeaders(
    response: Response,
    config?: SecurityPolicyConfig
  ): void {
    const policyConfig = config || this.options.defaultPolicyConfig;
    
    // Set standard security headers
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-XSS-Protection', '1; mode=block');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Add strict transport security
    response.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
    
    // Add content-security-policy if configured
    if (policyConfig.csp?.directives) {
      const cspHeader = policyConfig.csp.reportOnly 
        ? 'Content-Security-Policy-Report-Only' 
        : 'Content-Security-Policy';
      
      const cspValue = Object.entries(policyConfig.csp.directives)
        .map(([directive, values]) => `${directive} ${values.join(' ')}`)
        .join('; ');
      
      response.setHeader(cspHeader, cspValue);
    }
    
    // Remove potentially dangerous headers
    response.removeHeader('X-Powered-By');
    response.removeHeader('Server');
    
    // Add a nonce for inline scripts if needed
    if (policyConfig.csp?.directives?.['script-src']) {
      const nonce = crypto.randomBytes(16).toString('base64');
      response.locals.cspNonce = nonce;
      
      // Add nonce to the CSP header for script-src
      const cspHeader = policyConfig.csp.reportOnly 
        ? 'Content-Security-Policy-Report-Only' 
        : 'Content-Security-Policy';
      
      let cspValue = response.getHeader(cspHeader) as string;
      if (cspValue) {
        // Add nonce to existing script-src directive
        cspValue = cspValue.replace(
          /(script-src[^;]*)/,
          `$1 'nonce-${nonce}'`
        );
        
        response.setHeader(cspHeader, cspValue);
      }
    }
  }
  
  /**
   * Get security metrics
   * @returns Observable of security metrics
   */
  getSecurityMetrics(): Observable<Record<string, number>> {
    return this.securityMetrics$.asObservable();
  }
  
  /**
   * Log a security event
   * @param event The security event to log
   * @param context The security context
   */
  async logSecurityEvent(
    event: string,
    context: SecurityContext
  ): Promise<void> {
    // Create structured log
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      userId: context.userId || 'anonymous',
      organizationId: context.organizationId,
      clientIp: context.clientIp,
      userAgent: context.userAgent,
      path: context.path,
      method: context.method,
      resourceId: context.resourceId,
      resourceType: context.resourceType,
    };
    
    // Log via observability service
    this.observability.log(`Security event: ${event}`, {
      service: SecurityService.name,
      data: logData,
    });
    
    // Increment security event counter
    this.observability.incrementCounter('security.events.total');
    this.observability.incrementCounter(`security.events.${event}`);
    
    // For high-severity events, create an alert
    const highSeverityEvents = [
      'access-denied',
      'brute-force-attempt',
      'malware-detected',
      'data-exfiltration-attempt',
      'privilege-escalation',
    ];
    
    if (highSeverityEvents.includes(event)) {
      this.observability.incrementCounter('security.alerts');
      
      // Additional alerting would be implemented here
      // (e.g., sending to a SIEM system, creating a Cloud Monitoring alert)
    }
  }
  
  /**
   * Get the current security health status
   * @returns Current security health status
   */
  async getSecurityHealth(): Promise<SecurityHealthStatus> {
    // Fetch health status from various security components
    const componentStatuses = await Promise.all([
      this.checkComponentHealth('firewall', () => this.checkFirewallHealth()),
      this.checkComponentHealth('filescanner', () => this.fileScanner.getServiceHealth()),
      this.checkComponentHealth('dlp', () => this.dlpService.getServiceHealth()),
      this.checkComponentHealth('secrets', () => this.checkSecretsManagerHealth()),
    ]);
    
    // Count active incidents from metrics
    const metrics = await this.securityMetricsService.collectSecurityMetrics();
    const activeIncidents = metrics['security.incidents.active'] || 0;
    const recentAlerts = metrics['security.alerts.24h'] || 0;
    
    // Calculate overall status
    const unhealthyComponents = componentStatuses.filter(c => c.status === 'unhealthy').length;
    const degradedComponents = componentStatuses.filter(c => c.status === 'degraded').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyComponents > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedComponents > 0) {
      overallStatus = 'degraded';
    }
    
    return {
      status: overallStatus,
      components: componentStatuses,
      lastScanTime: new Date(), // In a real implementation, this would be fetched from actual scan data
      activeIncidents,
      recentAlerts,
    };
  }
  
  /**
   * Helper to check component health with error handling
   */
  private async checkComponentHealth(
    name: string,
    healthCheckFn: () => Promise<any>
  ): Promise<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastChecked: Date;
    error?: string;
  }> {
    try {
      const result = await healthCheckFn();
      return {
        name,
        status: result.status || 'healthy',
        lastChecked: new Date(),
        error: result.error,
      };
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        lastChecked: new Date(),
        error: error.message,
      };
    }
  }
  
  /**
   * Check firewall health
   */
  private async checkFirewallHealth(): Promise<{ status: string; error?: string }> {
    // This would involve checking Cloud Armor policies in a real implementation
    return { status: 'healthy' };
  }
  
  /**
   * Check Secrets Manager health
   */
  private async checkSecretsManagerHealth(): Promise<{ status: string; error?: string }> {
    // This would involve testing access to Secret Manager in a real implementation
    return { status: 'healthy' };
  }
}