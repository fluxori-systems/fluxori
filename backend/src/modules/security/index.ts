/**
 * Security module for the Fluxori platform
 *
 * Provides comprehensive security controls for the Fluxori platform:
 * - VPC Service Controls management
 * - IAM role management
 * - Secret Manager integration
 * - File security scanning
 * - Data Loss Prevention (DLP)
 * - Cloud Armor Web Application Firewall
 * - Security monitoring and metrics
 * - Security audit logging
 * - South African compliance features
 */

// Main module
export * from './security.module';

// Interfaces
export * from './internal/interfaces/security.interfaces';

// Services
export { SecurityService } from './internal/services/security.service';
export { CredentialManagerService } from './internal/services/credential-manager.service';
export { VpcServiceControlsService } from './internal/services/vpc-service-controls.service';
export { FileScannerService } from './internal/services/file-scanner.service';
export { DlpService } from './internal/services/dlp.service';
export { CloudArmorService } from './internal/services/cloud-armor.service';
export { SecurityMetricsService } from './internal/services/security-metrics.service';
export { SecurityAuditService } from './internal/services/security-audit.service';

// Controllers
export * from './internal/controllers/security.controller';
export * from './internal/controllers/credential.controller';
export * from './internal/controllers/security-audit.controller';

// Guards and interceptors
export * from './internal/guards/rate-limit.guard';
export * from './internal/interceptors/security.interceptor';

// Health indicators
export * from './internal/health/security-health.indicator';
