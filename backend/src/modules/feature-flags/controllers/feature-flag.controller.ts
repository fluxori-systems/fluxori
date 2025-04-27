import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';

import {
  FirebaseAuthGuard,
  GetUser,
  DecodedFirebaseToken,
} from '@modules/auth';

import {
  FeatureFlag,
  FeatureFlagDTO,
  FeatureFlagToggleDTO,
  FeatureFlagAuditLog,
  Environment,
  FlagEvaluationContext,
  FlagEvaluationResult,
} from '../interfaces/types';
import { FeatureFlagService } from '../services/feature-flag.service';

@Controller('feature-flags')
@UseGuards(FirebaseAuthGuard)
export class FeatureFlagController {
  private readonly logger = new Logger(FeatureFlagController.name);

  constructor(private readonly featureFlagService: FeatureFlagService) {}

  /**
   * Create a new feature flag
   */
  @Post()
  async createFlag(
    @Body() flagDTO: FeatureFlagDTO,
    @GetUser() user: DecodedFirebaseToken,
  ): Promise<FeatureFlag> {
    this.logger.log(`Creating feature flag: ${flagDTO.key}`);
    return this.featureFlagService.createFlag(flagDTO, user.id);
  }

  /**
   * Get all feature flags
   */
  @Get()
  async getAllFlags(
    @Query('environment') environment?: Environment,
  ): Promise<FeatureFlag[]> {
    this.logger.log(
      `Getting all feature flags${environment ? ` for environment: ${environment}` : ''}`,
    );
    return this.featureFlagService.getAllFlags(environment);
  }

  /**
   * Get a feature flag by ID
   */
  @Get(':id')
  async getFlagById(@Param('id') id: string): Promise<FeatureFlag> {
    this.logger.log(`Getting feature flag by ID: ${id}`);
    return this.featureFlagService.getFlagById(id);
  }

  /**
   * Get a feature flag by key
   */
  @Get('key/:key')
  async getFlagByKey(@Param('key') key: string): Promise<FeatureFlag> {
    this.logger.log(`Getting feature flag by key: ${key}`);
    return this.featureFlagService.getFlagByKey(key);
  }

  /**
   * Update a feature flag
   */
  @Patch(':id')
  async updateFlag(
    @Param('id') id: string,
    @Body() flagDTO: Partial<FeatureFlagDTO>,
    @GetUser() user: DecodedFirebaseToken,
  ): Promise<FeatureFlag> {
    this.logger.log(`Updating feature flag: ${id}`);
    return this.featureFlagService.updateFlag(id, flagDTO, user.id);
  }

  /**
   * Toggle a feature flag's enabled status
   */
  @Patch(':id/toggle')
  async toggleFlag(
    @Param('id') id: string,
    @Body() toggleDTO: FeatureFlagToggleDTO,
    @GetUser() user: DecodedFirebaseToken,
  ): Promise<FeatureFlag> {
    this.logger.log(`Toggling feature flag: ${id} to ${toggleDTO.enabled}`);
    return this.featureFlagService.toggleFlag(id, toggleDTO, user.id);
  }

  /**
   * Delete a feature flag
   */
  @Delete(':id')
  async deleteFlag(
    @Param('id') id: string,
    @GetUser() user: DecodedFirebaseToken,
  ): Promise<{ success: boolean }> {
    this.logger.log(`Deleting feature flag: ${id}`);
    const result = await this.featureFlagService.deleteFlag(id, user.id);
    return { success: result };
  }

  /**
   * Get audit logs for a feature flag
   */
  @Get(':id/audit-logs')
  async getAuditLogs(@Param('id') id: string): Promise<FeatureFlagAuditLog[]> {
    this.logger.log(`Getting audit logs for feature flag: ${id}`);
    return this.featureFlagService.getAuditLogs(id);
  }

  /**
   * Evaluate a feature flag for the current context
   */
  @Post('evaluate/:key')
  async evaluateFlag(
    @Param('key') key: string,
    @Body() context: FlagEvaluationContext,
    @GetUser() user: DecodedFirebaseToken,
  ): Promise<FlagEvaluationResult> {
    this.logger.debug(`Evaluating feature flag: ${key}`);

    // Merge the user context with the provided context
    const mergedContext: FlagEvaluationContext = {
      ...context,
      userId: context.userId || user.id,
      userRole: context.userRole || user.role,
      organizationId: context.organizationId || user.organizationId,
    };

    return this.featureFlagService.evaluateFlag(key, mergedContext);
  }

  /**
   * Check if a feature flag is enabled for the current context
   */
  @Post('is-enabled/:key')
  async isEnabled(
    @Param('key') key: string,
    @Body() context: FlagEvaluationContext,
    @GetUser() user: DecodedFirebaseToken,
  ): Promise<{ enabled: boolean }> {
    this.logger.debug(`Checking if feature flag is enabled: ${key}`);

    // Merge the user context with the provided context using our common auth utilities
    const mergedContext: FlagEvaluationContext = {
      ...context,
      userId: context.userId || user.uid,
      userRole: context.userRole || user.role,
      organizationId: context.organizationId || user.organizationId,
    };

    // Log additional context if the user is in an organization
    if (
      mergedContext.organizationId &&
      user.organizationId === mergedContext.organizationId
    ) {
      this.logger.debug(
        `User belongs to evaluated organization: ${mergedContext.organizationId}`,
      );
    }

    const isEnabled = await this.featureFlagService.isEnabled(
      key,
      mergedContext,
    );
    return { enabled: isEnabled };
  }

  /**
   * Evaluate multiple feature flags at once
   */
  @Post('evaluate-batch')
  async evaluateBatchFlags(
    @Body() data: { keys: string[]; context: FlagEvaluationContext },
    @GetUser() user: DecodedFirebaseToken,
  ): Promise<Record<string, FlagEvaluationResult>> {
    this.logger.debug(
      `Evaluating batch of feature flags: ${data.keys.join(', ')}`,
    );

    // Merge the user context with the provided context
    const mergedContext: FlagEvaluationContext = {
      ...data.context,
      userId: data.context.userId || user.id,
      userRole: data.context.userRole || user.role,
      organizationId: data.context.organizationId || user.organizationId,
    };

    const results: Record<string, FlagEvaluationResult> = {};

    // Evaluate each flag
    for (const key of data.keys) {
      results[key] = await this.featureFlagService.evaluateFlag(
        key,
        mergedContext,
      );
    }

    return results;
  }
}
