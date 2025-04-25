import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  UseGuards,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

import {
  CreateInsightDto,
  UpdateInsightDto,
  QueryInsightsDto,
  InsightResponse,
  InsightStatus,
} from '../interfaces/types';
import { Insight } from '../models/insight.schema';
import { InsightService } from '../services/insight.service';

/**
 * Controller for Insight endpoints
 */
@Controller('api/insights')
export class InsightController {
  private readonly logger = new Logger(InsightController.name);

  constructor(private readonly insightService: InsightService) {}

  /**
   * Create a new insight
   * @param createInsightDto Insight creation data
   * @returns Created insight
   */
  @Post()
  async create(
    @Body() createInsightDto: CreateInsightDto,
  ): Promise<InsightResponse> {
    const insight = await this.insightService.createInsight(createInsightDto);
    return this.mapToResponse(insight);
  }

  /**
   * Get insight by ID
   * @param id Insight ID
   * @returns Insight data
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<InsightResponse> {
    const insight = await this.insightService.findById(id);
    return this.mapToResponse(insight);
  }

  /**
   * Query insights with filters
   * @param queryDto Query parameters
   * @returns Array of insights
   */
  @Get()
  async findWithFilters(
    @Query() queryDto: QueryInsightsDto,
  ): Promise<InsightResponse[]> {
    if (!queryDto.organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }

    const insights = await this.insightService.findWithFilters(queryDto);
    return insights.map((insight) => this.mapToResponse(insight));
  }

  /**
   * Update insight status
   * @param id Insight ID
   * @param updateDto Update data
   * @returns Updated insight
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateInsightDto,
  ): Promise<InsightResponse> {
    const insight = await this.insightService.updateStatus(id, updateDto);
    return this.mapToResponse(insight);
  }

  /**
   * Acknowledge an insight
   * @param id Insight ID
   * @param userId User ID in request body
   * @returns Updated insight
   */
  @Put(':id/acknowledge')
  async acknowledge(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ): Promise<InsightResponse> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }

    const insight = await this.insightService.acknowledgeInsight(id, userId);
    return this.mapToResponse(insight);
  }

  /**
   * Resolve an insight
   * @param id Insight ID
   * @param userId User ID in request body
   * @returns Updated insight
   */
  @Put(':id/resolve')
  async resolve(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ): Promise<InsightResponse> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }

    const insight = await this.insightService.resolveInsight(id, userId);
    return this.mapToResponse(insight);
  }

  /**
   * Dismiss an insight
   * @param id Insight ID
   * @param userId User ID in request body
   * @returns Updated insight
   */
  @Put(':id/dismiss')
  async dismiss(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ): Promise<InsightResponse> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }

    const insight = await this.insightService.dismissInsight(id, userId);
    return this.mapToResponse(insight);
  }

  /**
   * Delete an insight
   * @param id Insight ID
   * @returns Success indicator
   */
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.insightService.deleteInsight(id);
    return { success: true };
  }

  /**
   * Get counts of insights by type for an organization
   * @param organizationId Organization ID
   * @returns Counts by type
   */
  @Get('organization/:organizationId/counts')
  async getCounts(
    @Param('organizationId') organizationId: string,
  ): Promise<Record<string, number>> {
    return this.insightService.getInsightCounts(organizationId);
  }

  /**
   * Delete expired insights for an organization
   * @param organizationId Organization ID
   * @returns Count of deleted insights
   */
  @Delete('organization/:organizationId/expired')
  async deleteExpired(
    @Param('organizationId') organizationId: string,
  ): Promise<{ count: number }> {
    const count =
      await this.insightService.cleanupExpiredInsights(organizationId);
    return { count };
  }

  /**
   * Map entity to response DTO
   * @param insight Insight entity
   * @returns Response DTO
   */
  private mapToResponse(insight: Insight): InsightResponse {
    return {
      id: insight.id,
      organizationId: insight.organizationId,
      type: insight.type,
      title: insight.title,
      description: insight.description,
      data: insight.data,
      severity: insight.severity,
      status: insight.status,
      confidence: insight.confidence,
      relatedEntityType: insight.relatedEntityType,
      relatedEntityId: insight.relatedEntityId,
      generatedAt:
        insight.generatedAt instanceof Date
          ? insight.generatedAt
          : new Date(insight.generatedAt),
      expiresAt:
        insight.expiresAt instanceof Date
          ? insight.expiresAt
          : insight.expiresAt
            ? new Date(insight.expiresAt)
            : undefined,
      acknowledgedAt:
        insight.acknowledgedAt instanceof Date
          ? insight.acknowledgedAt
          : insight.acknowledgedAt
            ? new Date(insight.acknowledgedAt)
            : undefined,
      acknowledgedBy: insight.acknowledgedBy,
      resolvedAt:
        insight.resolvedAt instanceof Date
          ? insight.resolvedAt
          : insight.resolvedAt
            ? new Date(insight.resolvedAt)
            : undefined,
      resolvedBy: insight.resolvedBy,
    };
  }
}
