import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { FirebaseAuthGuard } from 'src/modules/auth/guards/firebase-auth.guard';

import { LoggingInterceptor } from 'src/common/observability/interceptors/logging.interceptor';
import { MetricsInterceptor } from 'src/common/observability/interceptors/metrics.interceptor';
import { TracingInterceptor } from 'src/common/observability/interceptors/tracing.interceptor';

import {
  CreditAllocation,
  CreditCheckRequest,
  CreditModelType,
  CreditTransaction,
  CreditUsageLog,
  CreditUsageRequest,
} from '../interfaces/types';
import { CreditSystemService } from '../services/credit-system.service';
import { TokenTrackingService } from '../services/token-tracking.service';

interface CreateAllocationDto {
  organizationId: string;
  modelType: CreditModelType;
  totalCredits: number;
  userId?: string;
  resetDate?: string; // ISO date string
  expirationDate?: string; // ISO date string
  metadata?: Record<string, any>;
}

interface AddCreditsDto {
  allocationId: string;
  amount: number;
  metadata?: Record<string, any>;
}

interface RecordUsageDto extends CreditUsageRequest {}

interface CheckCreditsDto extends CreditCheckRequest {}

interface OptimizeModelDto {
  organizationId: string;
  userPrompt: string;
  taskComplexity: 'simple' | 'standard' | 'complex';
  preferredModel?: string;
}

/**
 * Controller for credit system operations
 */
@Controller('api/credit-system')
@UseGuards(FirebaseAuthGuard)
@UseInterceptors(LoggingInterceptor, MetricsInterceptor, TracingInterceptor)
export class CreditSystemController {
  constructor(
    private readonly creditSystemService: CreditSystemService,
    private readonly tokenTrackingService: TokenTrackingService,
  ) {}

  /**
   * Create a new credit allocation
   */
  @Post('allocations')
  async createAllocation(
    @Body() createDto: CreateAllocationDto,
    @GetUser() user: { id: string; admin: boolean; organizationId: string },
  ): Promise<CreditAllocation> {
    // Check authorization
    if (!user.admin && user.organizationId !== createDto.organizationId) {
      throw new ForbiddenException(
        'You do not have permission to create allocations for this organization',
      );
    }

    // Convert ISO date strings to Date objects
    let resetDate: Date | undefined;
    let expirationDate: Date | undefined;

    if (createDto.resetDate) {
      resetDate = new Date(createDto.resetDate);
    }

    if (createDto.expirationDate) {
      expirationDate = new Date(createDto.expirationDate);
    }

    return this.creditSystemService.createAllocation(
      createDto.organizationId,
      createDto.modelType,
      createDto.totalCredits,
      createDto.userId,
      resetDate,
      expirationDate,
      createDto.metadata,
    );
  }

  /**
   * Get active allocation for an organization or user
   */
  @Get('allocations/active')
  async getActiveAllocation(
    @Query('organizationId') organizationId: string,
    @GetUser() user: { id: string; admin: boolean; organizationId: string },
    @Query('userId') userId?: string,
  ): Promise<CreditAllocation> {
    // Check authorization
    if (!user.admin && user.organizationId !== organizationId) {
      throw new ForbiddenException(
        'You do not have permission to view allocations for this organization',
      );
    }

    const allocation = await this.creditSystemService.getActiveAllocation(
      organizationId,
      userId,
    );

    if (!allocation) {
      throw new NotFoundException(
        `No active allocation found for organization ${organizationId}`,
      );
    }

    return allocation;
  }

  /**
   * Add credits to an allocation
   */
  @Post('allocations/add-credits')
  async addCredits(
    @Body() addCreditsDto: AddCreditsDto,
    @GetUser() user: { id: string; admin: boolean; organizationId: string },
  ): Promise<CreditAllocation> {
    // Only admins can add credits
    if (!user.admin) {
      throw new ForbiddenException('Only administrators can add credits');
    }

    return this.creditSystemService.addCreditsToAllocation(
      addCreditsDto.allocationId,
      addCreditsDto.amount,
      user.id,
      addCreditsDto.metadata,
    );
  }

  /**
   * Get recent transactions for an organization
   */
  @Get('transactions/:organizationId')
  async getTransactions(
    @Param('organizationId') organizationId: string,
    @GetUser() user: { id: string; admin: boolean; organizationId: string },
    @Query('limit') limit?: number,
  ): Promise<CreditTransaction[]> {
    // Check authorization
    if (!user.admin && user.organizationId !== organizationId) {
      throw new ForbiddenException(
        'You do not have permission to view transactions for this organization',
      );
    }

    return this.creditSystemService.getRecentTransactions(
      organizationId,
      limit,
    );
  }

  /**
   * Get recent usage logs for an organization
   */
  @Get('usage-logs/:organizationId')
  async getUsageLogs(
    @Param('organizationId') organizationId: string,
    @GetUser() user: { id: string; admin: boolean; organizationId: string },
    @Query('limit') limit?: number,
  ): Promise<CreditUsageLog[]> {
    // Check authorization
    if (!user.admin && user.organizationId !== organizationId) {
      throw new ForbiddenException(
        'You do not have permission to view usage logs for this organization',
      );
    }

    return this.creditSystemService.getRecentUsageLogs(organizationId, limit);
  }

  /**
   * Check if an organization has enough credits for an operation
   */
  @Post('check-credits')
  async checkCredits(
    @Body() checkCreditsDto: CheckCreditsDto,
    @GetUser() user: { id: string; admin: boolean; organizationId: string },
  ) {
    // Check authorization
    if (!user.admin && user.organizationId !== checkCreditsDto.organizationId) {
      throw new ForbiddenException(
        'You do not have permission to check credits for this organization',
      );
    }

    return this.creditSystemService.checkCredits(checkCreditsDto);
  }

  /**
   * Record credit usage for an operation
   */
  @Post('record-usage')
  async recordUsage(
    @Body() recordUsageDto: RecordUsageDto,
    @GetUser() user: { id: string; admin: boolean; organizationId: string },
  ) {
    // Check authorization
    if (!user.admin && user.organizationId !== recordUsageDto.organizationId) {
      throw new ForbiddenException(
        'You do not have permission to record usage for this organization',
      );
    }

    return this.creditSystemService.recordUsage(recordUsageDto);
  }

  /**
   * Release a credit reservation
   */
  @Post('release-reservation/:reservationId')
  async releaseReservation(
    @Param('reservationId') reservationId: string,
    @GetUser() user: { id: string; admin: boolean; organizationId: string },
  ) {
    // Note: Authorization check is omitted here because reservations need to be
    // released even if they fail, and the service already validates the operation

    const result =
      await this.creditSystemService.releaseReservation(reservationId);

    if (!result) {
      throw new BadRequestException(
        `Failed to release reservation: ${reservationId}`,
      );
    }

    return { success: true };
  }

  /**
   * Get usage statistics for a period
   */
  @Get('usage-stats/:organizationId')
  async getUsageStats(
    @Param('organizationId') organizationId: string,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
    @GetUser() user: { id: string; admin: boolean; organizationId: string },
  ) {
    // Check authorization
    if (!user.admin && user.organizationId !== organizationId) {
      throw new ForbiddenException(
        'You do not have permission to view usage statistics for this organization',
      );
    }

    // Parse dates
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException(
        'Invalid date format. Please use ISO format (YYYY-MM-DD)',
      );
    }

    return this.creditSystemService.getUsageStatistics(
      organizationId,
      startDate,
      endDate,
    );
  }

  /**
   * Get system status
   */
  @Get('system-status')
  async getSystemStatus(
    @GetUser() user: { id: string; admin: boolean; organizationId: string },
  ) {
    // Only admins can view system status
    if (!user.admin) {
      throw new ForbiddenException(
        'Only administrators can view system status',
      );
    }

    return this.creditSystemService.getSystemStatus();
  }

  /**
   * Optimize model selection
   */
  @Post('optimize-model')
  async optimizeModel(
    @Body() optimizeDto: OptimizeModelDto,
    @GetUser() user: { id: string; admin: boolean; organizationId: string },
  ) {
    // Check authorization
    if (!user.admin && user.organizationId !== optimizeDto.organizationId) {
      throw new ForbiddenException(
        'You do not have permission to optimize models for this organization',
      );
    }

    const result = await this.tokenTrackingService.optimizeModelSelection(
      optimizeDto.organizationId,
      optimizeDto.userPrompt,
      optimizeDto.taskComplexity,
      optimizeDto.preferredModel,
    );

    if (!result.model) {
      throw new BadRequestException(result.reason);
    }

    return {
      model: {
        id: result.model.id,
        provider: result.model.provider,
        model: result.model.model,
        displayName: result.model.displayName,
        complexity: result.model.complexity,
      },
      reason: result.reason,
    };
  }
}
