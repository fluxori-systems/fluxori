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
export * from './interfaces/security.interfaces';

// Services
export { SecurityService } from './services/security.service';
export { CredentialManagerService } from './services/credential-manager.service';
export { VpcServiceControlsService } from './services/vpc-service-controls.service';
export { FileScannerService } from './services/file-scanner.service';
export { DlpService } from './services/dlp.service';
export { CloudArmorService } from './services/cloud-armor.service';
export { SecurityMetricsService } from './services/security-metrics.service';
export { SecurityAuditService } from './services/security-audit.service';

// Controllers
export * from './controllers/security.controller';
export * from './controllers/credential.controller';
export * from './controllers/security-audit.controller';

// Guards and interceptors
export * from './guards/rate-limit.guard';
export * from './interceptors/security.interceptor';

// Health indicators
export * from './health/security-health.indicator';