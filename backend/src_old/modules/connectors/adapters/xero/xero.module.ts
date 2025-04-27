/**
 * Xero Module
 *
 * Main module for Xero API integration with specialized South African
 * support for e-commerce operations.
 */

import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";

// Main connector
import { XeroConnector } from "./xero-connector";

// External dependencies
import {
  ObservabilityService,
  EnhancedLoggerService,
} from "@common/observability";
import { CredentialManagerService } from "@modules/security";

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
