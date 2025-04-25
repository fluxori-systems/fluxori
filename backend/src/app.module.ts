import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Import GCP services
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ServiceAuthInterceptor } from './common/interceptors/service-auth.interceptor';
import {
  ObservabilityModule,
  TracingInterceptor,
  MetricsInterceptor,
  LoggingInterceptor,
} from './common/observability';
import { GoogleCloudStorageService } from './common/storage/google-cloud-storage.service';
import { STORAGE_SERVICE } from './common/storage/storage.interface';
import { ServiceAuthUtils } from './common/utils/service-auth';
import { FirestoreConfigService } from './config/firestore.config';

// Import modules
import { configValidationSchema } from './config/validation.schema';
import { HealthModule } from './health/health.module';
import { AgentFrameworkModule } from './modules/agent-framework';
import { AIInsightsModule } from './modules/ai-insights/ai-insights.module';
import { AuthModule } from './modules/auth/auth.module';
import { BuyBoxModule } from './modules/buybox/buybox.module';
import { ConnectorsModule } from './modules/connectors';
import { CreditSystemModule } from './modules/credit-system';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { InternationalTradeModule } from './modules/international-trade/international-trade.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MarketplacesModule } from './modules/marketplaces/marketplaces.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrderIngestionModule } from './modules/order-ingestion/order-ingestion.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PimModule } from './modules/pim';
import { RagRetrievalModule } from './modules/rag-retrieval/rag-retrieval.module';
import { ScheduledTasksModule } from './modules/scheduled-tasks/scheduled-tasks.module';
import { SecurityModule } from './modules/security';
import { StorageModule } from './modules/storage/storage.module';
import { UsersModule } from './modules/users/users.module';

// Import observability module

// Import global filters, guards, and interceptors

// Configuration validation schema

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      envFilePath: ['.env'],
    }),

    // HTTP Module for health checks
    HttpModule,

    // Observability module
    ObservabilityModule.registerWithOptions({
      appName: 'fluxori-api',
      environment: process.env.NODE_ENV || 'development',
      region: process.env.GCP_REGION || 'africa-south1',
      logging: {
        sanitizeLogs: true,
        useJsonFormat: process.env.NODE_ENV === 'production',
      },
      tracing: {
        enabled: true,
        pathSamplingRates: {
          '^/health': 0.1, // Lower sampling for health endpoints
          '^/metrics': 0.1, // Lower sampling for metrics endpoints
        },
      },
      metrics: {
        enabled: true,
        registerDefaultMetrics: true,
        metricPrefix: 'fluxori.',
      },
      health: {
        enabled: true,
        registerDefaultHealthChecks: true,
        exposeDetails: process.env.NODE_ENV !== 'production',
      },
    }),

    // Feature modules
    AgentFrameworkModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    InventoryModule,
    ConnectorsModule, // API connector framework
    MarketplacesModule,
    OrderIngestionModule,
    BuyBoxModule,
    AIInsightsModule,
    CreditSystemModule,
    NotificationsModule,
    ScheduledTasksModule,
    InternationalTradeModule,
    RagRetrievalModule,
    StorageModule,
    FeatureFlagsModule,
    HealthModule,
    SecurityModule.registerWithOptions({
      enableExtendedAuditLogging: true,
      enableCrossModuleSecurityContext: true,
      southAfricanCompliance: {
        enablePopiaControls: true,
        enforceDataResidency: true,
        enhancedPiiProtection: true,
      },
    }),
    PimModule.register({
      enableAdvancedB2BSupport: true, // Enable B2B features
      enableSouthAfricanOptimizations: true, // South African market optimizations
      enableAiFeatures: true, // Enable AI-powered features
      enableExtendedDataProtection: true, // Enable POPIA compliance
    }),
  ],
  providers: [
    // GCP Services
    FirestoreConfigService,
    {
      provide: STORAGE_SERVICE,
      useClass: GoogleCloudStorageService,
    },
    ServiceAuthUtils,

    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },

    // Service authentication interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: ServiceAuthInterceptor,
    },

    // Add global observability interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: TracingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [FirestoreConfigService, ServiceAuthUtils],
})
export class AppModule {}
