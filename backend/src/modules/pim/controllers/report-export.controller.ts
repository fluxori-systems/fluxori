import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Query,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { 
  ReportExporterService, 
  ExportFormat, 
  ExportOptions, 
  ReportBundleOptions,
  ScheduledExport
} from '../services/report-exporter.service';
import { LoadSheddingService } from '../services/load-shedding.service';
import { NetworkAwareStorageService } from '../services/network-aware-storage.service';

/**
 * Controller for managing report exports in the PIM module
 * With South African market optimizations
 */
@ApiTags('pim-report-exports')
@Controller('pim/report-exports')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class ReportExportController {
  constructor(
    private readonly reportExporterService: ReportExporterService,
    private readonly loadSheddingService: LoadSheddingService,
    private readonly networkAwareStorageService: NetworkAwareStorageService,
  ) {}

  /**
   * Export a report
   * 
   * @param body Export request
   * @param user Authenticated user
   * @returns Export operation details
   */
  @Post()
  @ApiOperation({ summary: 'Export a report' })
  @ApiResponse({ status: 201, description: 'Export operation started' })
  async exportReport(
    @Body() body: {
      reportType: string;
      reportData: any;
      options: ExportOptions;
    },
    @GetUser() user: any,
  ): Promise<any> {
    try {
      // Auto-detect network conditions for optimizations
      if (body.options.enableNetworkOptimization === undefined) {
        const networkQuality = await this.networkAwareStorageService.getNetworkQuality();
        body.options.enableNetworkOptimization = networkQuality.quality !== 'excellent';
      }
      
      // Auto-detect load shedding for resilience
      if (body.options.enableLoadSheddingResilience === undefined) {
        const isLoadSheddingActive = await this.loadSheddingService.isLoadSheddingActive(user.organizationId);
        body.options.enableLoadSheddingResilience = isLoadSheddingActive;
      }
      
      const operation = await this.reportExporterService.exportReport(
        body.reportType,
        body.reportData,
        body.options,
        user.organizationId,
        user.uid,
      );
      
      return {
        exportId: operation.id,
        status: operation.status,
        message: operation.status === 'queued' 
          ? 'Export queued for processing due to system conditions' 
          : 'Export started',
        networkConditions: operation.networkConditions,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to start export: ${error.message}`);
    }
  }

  /**
   * Get export status
   * 
   * @param exportId Export ID
   * @param user Authenticated user
   * @returns Export operation status
   */
  @Get(':exportId')
  @ApiOperation({ summary: 'Get export status' })
  @ApiResponse({ status: 200, description: 'Export operation status' })
  async getExportStatus(
    @Param('exportId') exportId: string,
    @GetUser() user: any,
  ): Promise<any> {
    try {
      const operation = await this.reportExporterService.getExportStatus(
        exportId,
        user.organizationId,
      );
      
      return {
        exportId: operation.id,
        status: operation.status,
        reportType: operation.reportType,
        format: operation.format,
        createdAt: operation.createdAt,
        completedAt: operation.completedAt,
        fileUrl: operation.fileUrl,
        error: operation.error,
        networkConditions: operation.networkConditions,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get export status: ${error.message}`);
    }
  }

  /**
   * Schedule a report export
   * 
   * @param body Schedule request
   * @param user Authenticated user
   * @returns Scheduled export details
   */
  @Post('schedule')
  @ApiOperation({ summary: 'Schedule a report export' })
  @ApiResponse({ status: 201, description: 'Report export scheduled' })
  async scheduleExport(
    @Body() body: {
      reportType: string;
      reportParams: any;
      format: ExportFormat;
      frequency: 'daily' | 'weekly' | 'monthly';
      emailRecipients: string[];
      fileNamePrefix?: string;
    },
    @GetUser() user: any,
  ): Promise<any> {
    try {
      const schedule: Omit<ScheduledExport, 'id'> = {
        reportType: body.reportType,
        reportParams: body.reportParams,
        format: body.format,
        frequency: body.frequency,
        emailRecipients: body.emailRecipients,
        fileNamePrefix: body.fileNamePrefix,
        nextRunTime: new Date(), // This will be calculated by the service
        isActive: true,
        organizationId: user.organizationId,
        userId: user.uid,
      };
      
      const scheduledExport = await this.reportExporterService.scheduleExport(schedule);
      
      return {
        scheduleId: scheduledExport.id,
        reportType: scheduledExport.reportType,
        frequency: scheduledExport.frequency,
        nextRunTime: scheduledExport.nextRunTime,
        format: scheduledExport.format,
        isActive: scheduledExport.isActive,
        emailRecipients: scheduledExport.emailRecipients,
        message: 'Report export scheduled successfully',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to schedule export: ${error.message}`);
    }
  }

  /**
   * Get scheduled exports
   * 
   * @param user Authenticated user
   * @returns List of scheduled exports
   */
  @Get('schedules/list')
  @ApiOperation({ summary: 'Get scheduled exports' })
  @ApiResponse({ status: 200, description: 'Scheduled exports' })
  async getScheduledExports(
    @GetUser() user: any,
  ): Promise<any> {
    try {
      const schedules = await this.reportExporterService.getScheduledExports(
        user.organizationId,
      );
      
      return {
        schedules: schedules.map(schedule => ({
          scheduleId: schedule.id,
          reportType: schedule.reportType,
          frequency: schedule.frequency,
          nextRunTime: schedule.nextRunTime,
          lastRunTime: schedule.lastRunTime,
          format: schedule.format,
          isActive: schedule.isActive,
          emailRecipients: schedule.emailRecipients,
        })),
        count: schedules.length,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get scheduled exports: ${error.message}`);
    }
  }

  /**
   * Cancel a scheduled export
   * 
   * @param scheduleId Schedule ID
   * @param user Authenticated user
   * @returns Success message
   */
  @Delete('schedule/:scheduleId')
  @ApiOperation({ summary: 'Cancel a scheduled export' })
  @ApiResponse({ status: 200, description: 'Scheduled export cancelled' })
  async cancelScheduledExport(
    @Param('scheduleId') scheduleId: string,
    @GetUser() user: any,
  ): Promise<any> {
    try {
      const success = await this.reportExporterService.cancelScheduledExport(
        scheduleId,
        user.organizationId,
      );
      
      return {
        success,
        message: 'Scheduled export cancelled successfully',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to cancel scheduled export: ${error.message}`);
    }
  }

  /**
   * Create a report bundle
   * 
   * @param body Bundle request
   * @param user Authenticated user
   * @returns Bundle operation details
   */
  @Post('bundle')
  @ApiOperation({ summary: 'Create a report bundle' })
  @ApiResponse({ status: 201, description: 'Bundle operation started' })
  async createReportBundle(
    @Body() body: {
      reports: Array<{
        reportType: string;
        reportParams: any;
        fileName?: string;
      }>;
      format: ExportFormat;
      bundleName: string;
      enableNetworkOptimization?: boolean;
      enableLoadSheddingResilience?: boolean;
      compressBundle?: boolean;
      notificationEmail?: string;
    },
    @GetUser() user: any,
  ): Promise<any> {
    try {
      // Auto-detect network conditions for optimizations
      if (body.enableNetworkOptimization === undefined) {
        const networkQuality = await this.networkAwareStorageService.getNetworkQuality();
        body.enableNetworkOptimization = networkQuality.quality !== 'excellent';
      }
      
      // Auto-detect load shedding for resilience
      if (body.enableLoadSheddingResilience === undefined) {
        const isLoadSheddingActive = await this.loadSheddingService.isLoadSheddingActive(user.organizationId);
        body.enableLoadSheddingResilience = isLoadSheddingActive;
      }
      
      const bundleOptions: ReportBundleOptions = {
        reports: body.reports,
        format: body.format,
        bundleName: body.bundleName,
        enableNetworkOptimization: body.enableNetworkOptimization,
        enableLoadSheddingResilience: body.enableLoadSheddingResilience,
        compressBundle: body.compressBundle,
        notificationEmail: body.notificationEmail,
      };
      
      const operation = await this.reportExporterService.createReportBundle(
        bundleOptions,
        user.organizationId,
        user.uid,
      );
      
      return {
        bundleId: operation.id,
        status: operation.status,
        message: operation.status === 'queued' 
          ? 'Bundle queued for processing due to system conditions' 
          : 'Bundle creation started',
        reportCount: body.reports.length,
        format: body.format,
        networkConditions: operation.networkConditions,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to create report bundle: ${error.message}`);
    }
  }

  /**
   * Get bundle status
   * 
   * @param bundleId Bundle ID
   * @param user Authenticated user
   * @returns Bundle operation status
   */
  @Get('bundle/:bundleId')
  @ApiOperation({ summary: 'Get bundle status' })
  @ApiResponse({ status: 200, description: 'Bundle operation status' })
  async getBundleStatus(
    @Param('bundleId') bundleId: string,
    @GetUser() user: any,
  ): Promise<any> {
    try {
      const operation = await this.reportExporterService.getBundleStatus(
        bundleId,
        user.organizationId,
      );
      
      return {
        bundleId: operation.id,
        status: operation.status,
        format: operation.format,
        createdAt: operation.createdAt,
        completedAt: operation.completedAt,
        fileUrl: operation.fileUrl,
        error: operation.error,
        networkConditions: operation.networkConditions,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get bundle status: ${error.message}`);
    }
  }
}