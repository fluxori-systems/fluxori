import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import * as compression from 'compression';
import helmet from 'helmet';

import { AppModule } from './app.module';
import {
  EnhancedLoggerService,
  ObservabilityService,
} from './common/observability';
import { HealthStatus } from './common/observability/interfaces/observability.interfaces';
import { setupSwagger } from './swagger.config';

async function bootstrap() {
  try {
    // Create NestJS application with custom logger
    const app = await NestFactory.create(AppModule, {
      bufferLogs: true, // Buffer logs until our logger is ready
    });

    // Get services
    const configService = app.get(ConfigService);
    const logger = app.get(EnhancedLoggerService);
    const observability = app.get(ObservabilityService);

    // Use our enhanced logger for the application
    app.useLogger(logger);

    // Set global application prefix if specified in config
    const apiPrefix = configService.get<string>('API_PREFIX', 'api');
    if (apiPrefix) {
      app.setGlobalPrefix(apiPrefix);
    }

    // Set up security middleware
    app.use(helmet());

    // Enable request compression
    app.use(compression());

    // Configure CORS options
    app.enableCors({
      origin: configService.get<string>('CORS_ORIGIN', '*'),
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    // Set up global validation pipe with transform
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Set up Swagger documentation if not in production
    if (process.env.NODE_ENV !== 'production') {
      setupSwagger(app);
    }

    // Start the application
    const port = configService.get<number>('PORT', 3001);
    const host = configService.get<string>('HOST', '0.0.0.0');

    // Register additional health checks that require app context
    observability.registerHealthCheck('app.startup', async () => {
      return {
        component: 'app.startup',
        status: HealthStatus.HEALTHY,
        details: {
          startupTime: new Date(),
          host,
          port,
          version: process.env.npm_package_version || '1.0.0',
        },
        timestamp: new Date(),
      };
    });

    await app.listen(port, host);

    // Log application start
    const environment = configService.get<string>('NODE_ENV', 'development');
    const region = configService.get<string>('GCP_REGION', 'unknown');

    logger.log(
      `Application is running in ${environment} mode (Region: ${region})`,
      'Bootstrap',
    );
    logger.log(
      `Server running on: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`,
      'Bootstrap',
    );

    // Log initial metrics
    observability.recordGauge('system.startup.time', process.uptime());

    // Check system health on startup
    const healthStatus = await observability.getDetailedHealthCheck();
    logger.log(`Initial health check: ${healthStatus.status}`, {
      service: 'Bootstrap',
      health: healthStatus,
    });

    // Handle shutdown signals
    process.on('SIGINT', async () => {
      logger.log('Application is shutting down...', 'Bootstrap');
      await app.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.log('Application is terminating...', 'Bootstrap');
      await app.close();
      process.exit(0);
    });
  } catch (error) {
    // Handle bootstrap errors
    console.error(
      `Error during application bootstrap: ${error.message}`,
      error.stack,
    );
    process.exit(1);
  }
}

// Run the bootstrap function
bootstrap().catch((err) => {
  // Catch any unhandled promise rejections during bootstrap
  console.error('Bootstrap failed', err);
  process.exit(1);
});
