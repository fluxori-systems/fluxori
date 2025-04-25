import {
  Injectable,
  LoggerService,
  Logger as NestLogger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Logging } from '@google-cloud/logging';

/**
 * Factory for creating loggers with consistent configuration
 */
export class LoggerFactory {
  private static configService: ConfigService;
  private static loggers: Map<string, Logger> = new Map();

  /**
   * Set the config service for all loggers
   */
  public static setConfigService(configService: ConfigService): void {
    this.configService = configService;
  }

  /**
   * Get a logger instance for a specific context
   */
  public static getLogger(context: string): Logger {
    if (!this.configService) {
      // Use default logger if config service not set
      const logger = new Logger(new NestLogger());
      logger.setContext(context);
      return logger;
    }

    if (!this.loggers.has(context)) {
      this.loggers.set(context, new Logger(this.configService, context));
    }

    return this.loggers.get(context)!;
  }
}

/**
 * Google Cloud Logger service that replaces Winston.
 * This service integrates with Google Cloud Logging for centralized log management.
 */
@Injectable()
export class Logger implements LoggerService {
  private nestLogger: NestLogger;
  private cloudLogging: Logging;
  private logName: string;
  private projectId: string;
  private isProduction: boolean;
  private context: string = 'Fluxori';

  constructor(
    private configService: ConfigService | NestLogger,
    context?: string,
  ) {
    if (configService instanceof NestLogger) {
      this.nestLogger = configService;
      if (context) {
        this.setContext(context);
      }
      return;
    }

    if (context) {
      this.setContext(context);
    } else {
      this.nestLogger = new NestLogger(this.context);
    }

    // Cast configService to actual ConfigService for get() method access
    const config = this.configService as ConfigService;
    this.projectId = config.get<string>('GCP_PROJECT_ID', '');
    this.logName = config.get<string>('GCP_LOG_NAME', 'fluxori-api');
    this.isProduction =
      config.get<string>('NODE_ENV', 'development') === 'production';

    // Initialize Google Cloud Logging if we're in production
    if (this.isProduction && this.projectId) {
      this.cloudLogging = new Logging({
        projectId: this.projectId,
      });
    }
  }

  /**
   * Log an informational message
   */
  log(message: string, context?: string): void {
    this.nestLogger.log(message, context);

    if (this.isProduction && this.cloudLogging) {
      const log = this.cloudLogging.log(this.logName);
      const metadata = {
        resource: {
          type: 'cloud_run_revision',
          labels: {
            service_name: 'fluxori-api',
            revision_name: process.env.K_REVISION || 'local',
          },
        },
        severity: 'INFO',
      };

      const entry = log.entry(metadata, {
        message,
        context,
        timestamp: new Date().toISOString(),
      });

      log.write(entry).catch((err) => {
        this.nestLogger.error(
          `Failed to write to Cloud Logging: ${err.message}`,
          'Logger',
        );
      });
    }
  }

  /**
   * Log an error message
   */
  error(message: string, trace?: string, context?: string): void {
    this.nestLogger.error(message, trace, context);

    if (this.isProduction && this.cloudLogging) {
      const log = this.cloudLogging.log(this.logName);
      const metadata = {
        resource: {
          type: 'cloud_run_revision',
          labels: {
            service_name: 'fluxori-api',
            revision_name: process.env.K_REVISION || 'local',
          },
        },
        severity: 'ERROR',
      };

      const entry = log.entry(metadata, {
        message,
        stack: trace,
        context,
        timestamp: new Date().toISOString(),
      });

      log.write(entry).catch((err) => {
        this.nestLogger.error(
          `Failed to write to Cloud Logging: ${err.message}`,
          'Logger',
        );
      });
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: string): void {
    this.nestLogger.warn(message, context);

    if (this.isProduction && this.cloudLogging) {
      const log = this.cloudLogging.log(this.logName);
      const metadata = {
        resource: {
          type: 'cloud_run_revision',
          labels: {
            service_name: 'fluxori-api',
            revision_name: process.env.K_REVISION || 'local',
          },
        },
        severity: 'WARNING',
      };

      const entry = log.entry(metadata, {
        message,
        context,
        timestamp: new Date().toISOString(),
      });

      log.write(entry).catch((err) => {
        this.nestLogger.error(
          `Failed to write to Cloud Logging: ${err.message}`,
          'Logger',
        );
      });
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: string): void {
    this.nestLogger.debug(message, context);

    if (this.isProduction && this.cloudLogging) {
      const log = this.cloudLogging.log(this.logName);
      const metadata = {
        resource: {
          type: 'cloud_run_revision',
          labels: {
            service_name: 'fluxori-api',
            revision_name: process.env.K_REVISION || 'local',
          },
        },
        severity: 'DEBUG',
      };

      const entry = log.entry(metadata, {
        message,
        context,
        timestamp: new Date().toISOString(),
      });

      log.write(entry).catch((err) => {
        this.nestLogger.error(
          `Failed to write to Cloud Logging: ${err.message}`,
          'Logger',
        );
      });
    }
  }

  /**
   * Log a verbose message
   */
  verbose(message: string, context?: string): void {
    this.nestLogger.verbose(message, context);

    if (this.isProduction && this.cloudLogging) {
      const log = this.cloudLogging.log(this.logName);
      const metadata = {
        resource: {
          type: 'cloud_run_revision',
          labels: {
            service_name: 'fluxori-api',
            revision_name: process.env.K_REVISION || 'local',
          },
        },
        severity: 'DEBUG',
      };

      const entry = log.entry(metadata, {
        message,
        context,
        timestamp: new Date().toISOString(),
        verbose: true,
      });

      log.write(entry).catch((err) => {
        this.nestLogger.error(
          `Failed to write to Cloud Logging: ${err.message}`,
          'Logger',
        );
      });
    }
  }

  /**
   * Set the logger context
   */
  setContext(context: string): void {
    this.context = context;
    this.nestLogger = new NestLogger(context);
  }
}
