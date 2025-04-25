/**
 * Xero Module
 *
 * Main module for Xero API integration with specialized South African
 * support for e-commerce operations.
 */

import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Main connector
import { XeroConnector } from './xero-connector';

// External dependencies
import { ObservabilityService } from '../../../../common/observability';
import { EnhancedLoggerService } from '../../../../common/observability/services/enhanced-logger.service';
import { CredentialManagerService } from '../../../security/services/credential-manager.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60000, // 60 seconds
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [],
  providers: [
    // Main connector
    XeroConnector,

    // External dependencies
    CredentialManagerService,
    EnhancedLoggerService,
    ObservabilityService,
  ],
  exports: [
    // Main connector
    XeroConnector,
  ],
})
export class XeroModule {}
