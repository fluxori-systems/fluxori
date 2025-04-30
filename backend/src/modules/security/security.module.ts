import { DynamicModule, Module, Provider } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { SecurityController } from './internal/controllers/security.controller';
import { CredentialController } from './internal/controllers/credential.controller';
import { SecurityAuditController } from './internal/controllers/security-audit.controller';
import { RateLimitGuard } from './internal/guards/rate-limit.guard';
import { SecurityHealthIndicator } from './internal/health/security-health.indicator';
import { SecurityInterceptor } from './internal/interceptors/security.interceptor';
import { SecurityModuleOptions } from './internal/interfaces/security.interfaces';
import { CloudArmorService } from './internal/services/cloud-armor.service';
import { CredentialManagerService } from './internal/services/credential-manager.service';
import { DlpService } from './internal/services/dlp.service';
import { FileScannerService } from './internal/services/file-scanner.service';
import { SecurityAuditService } from './internal/services/security-audit.service';
import { SecurityMetricsService } from './internal/services/security-metrics.service';
import { SecurityService } from './internal/services/security.service';
import { VpcServiceControlsService } from './internal/services/vpc-service-controls.service';

/**
 * Security module for the Fluxori platform
 *
 * Provides comprehensive security controls including:
 * - VPC Service Controls management
 * - IAM role management
 * - Secret management
 * - File security scanning
 * - Runtime security monitoring
 * - Security auditing and compliance
 */
@Module({})
export class SecurityModule {
  /**
   * Register the Security module with default options
   * @returns Dynamic module with default configuration
   */
  static register(): DynamicModule {
    return this.registerWithOptions({});
  }

  /**
   * Register the Security module with custom options
   * @param options Module configuration options
   * @returns Configured Security module
   */
  static registerWithOptions(options: SecurityModuleOptions): DynamicModule {
    const providers: Provider[] = [
      // Core security services
      SecurityService,
      CredentialManagerService,
      SecurityAuditService,

      // GCP security services
      VpcServiceControlsService,
      CloudArmorService,
      DlpService,

      // Content security
      FileScannerService,

      // Monitoring and metrics
      SecurityMetricsService,
      SecurityHealthIndicator,

      // Global security interceptor (if enabled)
      ...(options.enableCrossModuleSecurityContext
        ? [
            {
              provide: APP_INTERCEPTOR,
              useClass: SecurityInterceptor,
            },
          ]
        : []),

      // Global rate limit guard
      {
        provide: APP_GUARD,
        useClass: RateLimitGuard,
      },

      // Module options
      {
        provide: 'SECURITY_MODULE_OPTIONS',
        useValue: {
          enableExtendedAuditLogging:
            options.enableExtendedAuditLogging ?? false,
          enableCrossModuleSecurityContext:
            options.enableCrossModuleSecurityContext ?? true,
          defaultPolicyConfig: options.defaultPolicyConfig ?? {
            rateLimit: {
              limit: 60,
              windowSecs: 60,
            },
            cors: {
              origins: ['https://app.fluxori.com'],
              methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
              headers: ['Content-Type', 'Authorization'],
              allowCredentials: true,
            },
            fileUpload: {
              maxSizeBytes: 10 * 1024 * 1024, // 10 MB default
              allowedExtensions: [
                '.jpg',
                '.jpeg',
                '.png',
                '.pdf',
                '.xlsx',
                '.csv',
              ],
              scanForMalware: true,
              validateContentType: true,
            },
          },
          // Apply provided configurations or use defaults
          vpcServiceControls: options.vpcServiceControls,
          wafConfig: options.wafConfig ?? {
            rateLimit: {
              requestsPerMinute: 300,
              banDurationSeconds: 300,
            },
            geoRestrictions: {
              enabled: true,
              allowedCountries: ['ZA', 'US', 'GB', 'DE', 'AU', 'CA'],
              blockUnlisted: true,
            },
            owaspProtection: {
              xssProtection: true,
              sqlInjectionProtection: true,
              remoteFileInclusionProtection: true,
              localFileInclusionProtection: true,
            },
            customRules: [],
          },
          rateLimiting: options.rateLimiting ?? {
            global: {
              requestsPerMinutePerIp: 300,
            },
          },
          southAfricanCompliance: options.southAfricanCompliance ?? {
            enablePopiaControls: true,
            enforceDataResidency: true,
            enhancedPiiProtection: true,
          },
        },
      },
    ];

    return {
      module: SecurityModule,
      imports: [],
      controllers: [
        SecurityController,
        CredentialController,
        SecurityAuditController,
      ],
      providers,
      exports: [
        SecurityService,
        CredentialManagerService,
        SecurityAuditService,
        VpcServiceControlsService,
        FileScannerService,
        DlpService,
        SecurityMetricsService,
        SecurityHealthIndicator,
      ],
    };
  }
}
