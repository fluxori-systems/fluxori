import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";

// Import GCP services
import { GlobalExceptionFilter } from "@common/filters";
import { ServiceAuthInterceptor } from "@common/interceptors";
import {
  ObservabilityModule,
  TracingInterceptor,
  MetricsInterceptor,
  LoggingInterceptor,
} from "@common/observability";
import { GoogleCloudStorageService, STORAGE_SERVICE } from "@common/storage";
import { ServiceAuthUtils } from "@common/utils";
import { FirestoreConfigService } from "./config/firestore.config";

// Import modules
import { configValidationSchema } from "./config/validation.schema";
import { HealthModule } from "./health/health.module";
import { AgentFrameworkModule } from "@modules/agent-framework";
import { AIInsightsModule } from "@modules/ai-insights";
import { AuthModule } from "@modules/auth";
import { BuyBoxModule } from "@modules/buybox";
import { ConnectorsModule } from "@modules/connectors";
import { CreditSystemModule } from "@modules/credit-system";
import { InventoryModule } from "@modules/inventory";
import { OrganizationsModule } from "@modules/organizations";
import { MarketplacesModule } from "@modules/marketplaces";
import { OrderIngestionModule } from "@modules/order-ingestion";
import { NotificationsModule } from "@modules/notifications";
import { RagRetrievalModule } from "@modules/rag-retrieval";
import { ScheduledTasksModule } from "@modules/scheduled-tasks";
import { InternationalTradeModule } from "@modules/international-trade";
import { StorageModule } from "@modules/storage";
import { FeatureFlagsModule } from "@modules/feature-flags";
import { UsersModule } from "@modules/users";
import { SecurityModule } from "@modules/security";
import { PimModule } from "@modules/pim";

// Import observability module

// Import global filters, guards, and interceptors

// Configuration validation schema

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      envFilePath: [".env"],
    }),

    // HTTP Module for health checks
    HttpModule,

    // Observability module
    ObservabilityModule.registerWithOptions({
      appName: "fluxori-api",
      environment: process.env.NODE_ENV || "development",
      region: process.env.GCP_REGION || "africa-south1",
      logging: {
        sanitizeLogs: true,
        useJsonFormat: process.env.NODE_ENV === "production",
      },
      tracing: {
        enabled: true,
        pathSamplingRates: {
          "^/health": 0.1, // Lower sampling for health endpoints
          "^/metrics": 0.1, // Lower sampling for metrics endpoints
        },
      },
      metrics: {
        enabled: true,
        registerDefaultMetrics: true,
        metricPrefix: "fluxori.",
      },
      health: {
        enabled: true,
        registerDefaultHealthChecks: true,
        exposeDetails: process.env.NODE_ENV !== "production",
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
