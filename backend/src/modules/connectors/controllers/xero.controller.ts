/**
 * Xero Controller
 *
 * REST API controller for Xero integration with specialized
 * South African functionality.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

// Connector

// Guards and interceptors
import { FirebaseAuthGuard } from '../../../common/guards/firebase-auth.guard';
import { LoggingInterceptor } from '../../../common/observability/interceptors/logging.interceptor';
import { MetricsInterceptor } from '../../../common/observability/interceptors/metrics.interceptor';
import { TracingInterceptor } from '../../../common/observability/interceptors/tracing.interceptor';
import { XeroConnector } from '../adapters/xero/xero-connector';

@ApiTags('xero')
@Controller('xero')
@UseGuards(FirebaseAuthGuard)
@UseInterceptors(LoggingInterceptor, TracingInterceptor, MetricsInterceptor)
export class XeroController {
  private readonly logger = new Logger(XeroController.name);

  constructor(private readonly xeroConnector: XeroConnector) {}

  @Get('test')
  @ApiOperation({ summary: 'Test Xero API connection' })
  @ApiResponse({ status: 200, description: 'Connection test result' })
  async testConnection() {
    return this.xeroConnector.testConnection();
  }
}
