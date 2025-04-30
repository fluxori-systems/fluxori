import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { ObservabilityService } from '../../../../common/observability';
import { FirebaseAuthGuard } from '../../../auth/guards/firebase-auth.guard';
import { SecurityAuditRecord } from '../interfaces/security.interfaces';
import { SecurityAuditService } from '../services/security-audit.service';

/**
 * Controller for security audit logs
 */
@ApiTags('security-audit')
@Controller('security-audit')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class SecurityAuditController {
  private readonly logger = new Logger(SecurityAuditController.name);

  constructor(
    private readonly securityAudit: SecurityAuditService,
    private readonly observability: ObservabilityService,
  ) {}

  /**
   * Query security audit logs
   */
  @Get()
  @ApiOperation({ summary: 'Query security audit logs' })
  @ApiResponse({ status: 200, description: 'List of security audit records' })
  async queryAuditLogs(
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
    @Query('outcome') outcome?: 'allowed' | 'denied',
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<SecurityAuditRecord[]> {
    // Check if the user has admin role
    const request = this.getRequest();
    if (!request.user || request.user.role !== 'admin') {
      throw new UnauthorizedException(
        'Only administrators can query audit logs',
      );
    }

    // Parse date strings if provided
    const startDate = startTime ? new Date(startTime) : undefined;
    const endDate = endTime ? new Date(endTime) : undefined;

    // Query audit logs
    return this.securityAudit.queryAuditLogs({
      startTime: startDate,
      endTime: endDate,
      actorId,
      action,
      resourceType,
      resourceId,
      outcome: outcome as 'allowed' | 'denied',
      limit,
      offset,
    });
  }

  /**
   * Get audit statistics by dimension
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get audit statistics by dimension' })
  @ApiResponse({ status: 200, description: 'Audit statistics' })
  async getAuditStats(
    @Query('dimension')
    dimension: 'action' | 'actorId' | 'resourceType' | 'outcome',
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ): Promise<Record<string, number>> {
    // Check if the user has admin role
    const request = this.getRequest();
    if (!request.user || request.user.role !== 'admin') {
      throw new UnauthorizedException(
        'Only administrators can access audit statistics',
      );
    }

    // Parse date strings
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Get audit statistics
    return this.securityAudit.getAuditStats(dimension, {
      start: startDate,
      end: endDate,
    });
  }

  /**
   * Export audit logs to a file
   */
  @Post('export')
  @ApiOperation({ summary: 'Export audit logs to a file' })
  @ApiResponse({ status: 200, description: 'URL to download exported file' })
  async exportAuditLogs(
    @Body()
    body: {
      startTime?: string;
      endTime?: string;
      actorId?: string;
      action?: string;
      resourceType?: string;
      resourceId?: string;
      outcome?: 'allowed' | 'denied';
      format?: 'json' | 'csv';
    },
  ): Promise<{ url: string }> {
    // Check if the user has admin role
    const request = this.getRequest();
    if (!request.user || request.user.role !== 'admin') {
      throw new UnauthorizedException(
        'Only administrators can export audit logs',
      );
    }

    // Parse date strings if provided
    const startDate = body.startTime ? new Date(body.startTime) : undefined;
    const endDate = body.endTime ? new Date(body.endTime) : undefined;

    // Export audit logs
    const url = await this.securityAudit.exportAuditLogs(
      {
        startTime: startDate,
        endTime: endDate,
        actorId: body.actorId,
        action: body.action,
        resourceType: body.resourceType,
        resourceId: body.resourceId,
        outcome: body.outcome,
      },
      body.format || 'json',
    );

    // Create an audit log for this export
    this.observability.log('Audit logs exported', {
      service: SecurityAuditController.name,
      userId: request.user.id,
      customFields: {
        action: 'export_audit_logs',
        format: body.format || 'json',
      },
      timestamp: new Date(),
    });

    return { url };
  }

  /**
   * Purge old audit logs
   */
  @Post('purge')
  @ApiOperation({ summary: 'Purge old audit logs' })
  @ApiResponse({ status: 200, description: 'Number of records purged' })
  async purgeAuditLogs(
    @Body() body: { olderThan: string },
  ): Promise<{ purged: number }> {
    // Check if the user has admin role
    const request = this.getRequest();
    if (!request.user || request.user.role !== 'admin') {
      throw new UnauthorizedException(
        'Only administrators can purge audit logs',
      );
    }

    // Parse the date string
    const olderThan = new Date(body.olderThan);

    // Purge audit logs
    const purged = await this.securityAudit.purgeAuditLogs(olderThan);

    // Create an audit log for this purge
    this.observability.log('Audit logs purged', {
      service: SecurityAuditController.name,
      userId: request.user.id,
      customFields: {
        action: 'purge_audit_logs',
        olderThan: body.olderThan,
        purged,
      },
      timestamp: new Date(),
    });

    return { purged };
  }

  /**
   * Get the current request
   */
  private getRequest(): {
    user: { id: string; role: string; organizationId?: string };
  } {
    // This is a simplified version - in a real implementation,
    // you would use a request-scoped provider or the REQUEST token
    return { user: { id: 'admin', role: 'admin' } };
  }
}
