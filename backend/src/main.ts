import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { LoggerFactory } from './common/utils/logger';

async function bootstrap() {
  try {
    // Create NestJS application
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Get config service
    const configService = app.get(ConfigService);
    LoggerFactory.setConfigService(configService);
    const logger = LoggerFactory.getLogger('Bootstrap');
    
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

    // Start the application
    const port = configService.get<number>('PORT', 3001);
    const host = configService.get<string>('HOST', '0.0.0.0');
    await app.listen(port, host);

    // Log application start
    const environment = configService.get<string>('NODE_ENV', 'development');
    logger.log(`Application is running in ${environment} mode`);
    logger.log(`Server running on: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
    
    // Handle shutdown signals
    process.on('SIGINT', async () => {
      logger.log('Application is shutting down...');
      await app.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.log('Application is terminating...');
      await app.close();
      process.exit(0);
    });
    
  } catch (error) {
    // Handle bootstrap errors
    const logger = new Logger('Bootstrap');
    logger.error(`Error during application bootstrap: ${error.message}`, error.stack);
    process.exit(1);
  }
}

// Run the bootstrap function
bootstrap().catch(err => {
  // Catch any unhandled promise rejections during bootstrap
  console.error('Bootstrap failed', err);
  process.exit(1);
});