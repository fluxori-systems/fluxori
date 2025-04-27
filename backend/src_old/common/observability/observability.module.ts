import { Module, DynamicModule, Global, Provider } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";

// Import constants
import { OBSERVABILITY_PROVIDERS } from "./constants/observability.constants";
import { OBSERVABILITY_TOKENS } from "./constants/observability.tokens";

// Import interfaces
import {
  IEnhancedLoggerService,
  IMetricsService,
  ITracingService,
  IHealthService,
  IObservabilityService,
} from "./interfaces/observability.interfaces";
import { ObservabilityModuleOptions } from "./interfaces/observability-options.interface";

// Import services
import { EnhancedLoggerService } from "./services/enhanced-logger.service";
import { HealthService } from "./services/health.service";
import { MetricsService } from "./services/metrics.service";
import { ObservabilityService } from "./services/observability.service";
import { TracingService } from "./services/tracing.service";

// Import controllers
import { HealthController } from "./controllers/health.controller";
import { MetricsController } from "./controllers/metrics.controller";

// Import interceptors
import { LoggingInterceptor } from "./interceptors/logging.interceptor";
import { MetricsInterceptor } from "./interceptors/metrics.interceptor";
import { TracingInterceptor } from "./interceptors/tracing.interceptor";

/**
 * ObservabilityModule provides a complete observability solution including
 * enhanced logging, distributed tracing, metrics collection, and health checks.
 */
@Global()
@Module({})
export class ObservabilityModule {
  /**
   * Register the module with default configuration
   */
  static register(): DynamicModule {
    return {
      module: ObservabilityModule,
      imports: [ConfigModule],
      controllers: [HealthController, MetricsController],
      providers: [
        ...this.createProviders(),
        // Register interceptors globally
        { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
        { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
        { provide: APP_INTERCEPTOR, useClass: TracingInterceptor },
      ],
      exports: [
        // Concrete implementations
        ObservabilityService,
        TracingService,
        MetricsService,
        EnhancedLoggerService,
        HealthService,

        // Interface tokens
        OBSERVABILITY_TOKENS.OBSERVABILITY_SERVICE,
        OBSERVABILITY_TOKENS.LOGGER_SERVICE,
        OBSERVABILITY_TOKENS.TRACING_SERVICE,
        OBSERVABILITY_TOKENS.METRICS_SERVICE,
        OBSERVABILITY_TOKENS.HEALTH_SERVICE,

        // Interceptors
        TracingInterceptor,
        MetricsInterceptor,
        LoggingInterceptor,

        // Old providers for backward compatibility
        ...Object.values(OBSERVABILITY_PROVIDERS),
      ],
    };
  }

  /**
   * Register the module with custom options
   */
  static registerWithOptions(
    options: ObservabilityModuleOptions,
  ): DynamicModule {
    return {
      module: ObservabilityModule,
      imports: [ConfigModule],
      controllers: [HealthController, MetricsController],
      providers: [
        ...this.createProviders(options),
        // Register interceptors globally
        { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
        { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
        { provide: APP_INTERCEPTOR, useClass: TracingInterceptor },
      ],
      exports: [
        // Concrete implementations
        ObservabilityService,
        TracingService,
        MetricsService,
        EnhancedLoggerService,
        HealthService,

        // Interface tokens
        OBSERVABILITY_TOKENS.OBSERVABILITY_SERVICE,
        OBSERVABILITY_TOKENS.LOGGER_SERVICE,
        OBSERVABILITY_TOKENS.TRACING_SERVICE,
        OBSERVABILITY_TOKENS.METRICS_SERVICE,
        OBSERVABILITY_TOKENS.HEALTH_SERVICE,

        // Interceptors
        TracingInterceptor,
        MetricsInterceptor,
        LoggingInterceptor,

        // Old providers for backward compatibility
        ...Object.values(OBSERVABILITY_PROVIDERS),
      ],
    };
  }

  /**
   * Create providers for the module
   */
  private static createProviders(
    options?: ObservabilityModuleOptions,
  ): Provider[] {
    return [
      // Options provider
      {
        provide: OBSERVABILITY_TOKENS.OBSERVABILITY_OPTIONS,
        useValue: options || {},
      },

      // Enhanced Logger Provider with token
      {
        provide: EnhancedLoggerService,
        useFactory: (configService: ConfigService) => {
          return new EnhancedLoggerService(configService, options);
        },
        inject: [ConfigService],
      },
      // Provide the interface token
      {
        provide: OBSERVABILITY_TOKENS.LOGGER_SERVICE,
        useExisting: EnhancedLoggerService,
      },

      // Tracing Provider with token
      {
        provide: TracingService,
        useFactory: (
          configService: ConfigService,
          logger: IEnhancedLoggerService,
        ) => {
          return new TracingService(configService, logger, options);
        },
        inject: [ConfigService, OBSERVABILITY_TOKENS.LOGGER_SERVICE],
      },
      // Provide the interface token
      {
        provide: OBSERVABILITY_TOKENS.TRACING_SERVICE,
        useExisting: TracingService,
      },

      // Metrics Provider with token
      {
        provide: MetricsService,
        useFactory: (
          configService: ConfigService,
          logger: IEnhancedLoggerService,
        ) => {
          return new MetricsService(configService, logger, options);
        },
        inject: [ConfigService, OBSERVABILITY_TOKENS.LOGGER_SERVICE],
      },
      // Provide the interface token
      {
        provide: OBSERVABILITY_TOKENS.METRICS_SERVICE,
        useExisting: MetricsService,
      },

      // Health Checker Provider with token
      {
        provide: HealthService,
        useFactory: (
          configService: ConfigService,
          logger: IEnhancedLoggerService,
        ) => {
          return new HealthService(configService, logger, options);
        },
        inject: [ConfigService, OBSERVABILITY_TOKENS.LOGGER_SERVICE],
      },
      // Provide the interface token
      {
        provide: OBSERVABILITY_TOKENS.HEALTH_SERVICE,
        useExisting: HealthService,
      },

      // Main Observability Service
      {
        provide: ObservabilityService,
        useFactory: (
          configService: ConfigService,
          logger: IEnhancedLoggerService,
          tracer: ITracingService,
          metrics: IMetricsService,
          healthService: IHealthService,
        ) => {
          return new ObservabilityService(
            configService,
            logger,
            tracer,
            metrics,
            healthService,
            options,
          );
        },
        inject: [
          ConfigService,
          OBSERVABILITY_TOKENS.LOGGER_SERVICE,
          OBSERVABILITY_TOKENS.TRACING_SERVICE,
          OBSERVABILITY_TOKENS.METRICS_SERVICE,
          OBSERVABILITY_TOKENS.HEALTH_SERVICE,
        ],
      },
      // Provide the interface token
      {
        provide: OBSERVABILITY_TOKENS.OBSERVABILITY_SERVICE,
        useExisting: ObservabilityService,
      },

      // Also provide the old constants for backward compatibility
      {
        provide: OBSERVABILITY_PROVIDERS.LOGGER,
        useExisting: OBSERVABILITY_TOKENS.LOGGER_SERVICE,
      },
      {
        provide: OBSERVABILITY_PROVIDERS.TRACER,
        useExisting: OBSERVABILITY_TOKENS.TRACING_SERVICE,
      },
      {
        provide: OBSERVABILITY_PROVIDERS.METRICS,
        useExisting: OBSERVABILITY_TOKENS.METRICS_SERVICE,
      },
      {
        provide: OBSERVABILITY_PROVIDERS.HEALTH_CHECKER,
        useExisting: OBSERVABILITY_TOKENS.HEALTH_SERVICE,
      },
    ];
  }
}
