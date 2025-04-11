import { Injectable, Logger, NotFoundException } from "@nestjs/common";

import {
  InsightStatus,
  InsightType,
  InsightSeverity,
  CreateInsightDto,
  UpdateInsightDto,
  QueryInsightsDto,
} from "../interfaces/types";
import { Insight } from "../models/insight.schema";
import { InsightRepository } from "../repositories/insight.repository";

/**
 * Service for Insight operations
 */
@Injectable()
export class InsightService {
  private readonly logger = new Logger(InsightService.name);

  constructor(private readonly insightRepository: InsightRepository) {}

  /**
   * Create a new insight
   * @param createInsightDto Insight creation data
   * @returns Created insight
   */
  async createInsight(createInsightDto: CreateInsightDto): Promise<Insight> {
    this.logger.log(`Creating new insight of type: ${createInsightDto.type}`);

    const data = {
      ...createInsightDto,
      status: InsightStatus.NEW,
      generatedAt: new Date(),
    };

    return this.insightRepository.create(data);
  }

  /**
   * Find insight by ID
   * @param id Insight ID
   * @returns Insight or throws if not found
   */
  async findById(id: string): Promise<Insight> {
    const insight = await this.insightRepository.findById(id);

    if (!insight) {
      this.logger.warn(`Insight with ID ${id} not found`);
      throw new NotFoundException(`Insight with ID ${id} not found`);
    }

    return insight;
  }

  /**
   * Find insights by organization ID
   * @param organizationId Organization ID
   * @returns Array of insights
   */
  async findByOrganization(organizationId: string): Promise<Insight[]> {
    return this.insightRepository.findByOrganization(organizationId);
  }

  /**
   * Query insights with filters
   * @param queryDto Query parameters
   * @returns Array of filtered insights
   */
  async findWithFilters(queryDto: QueryInsightsDto): Promise<Insight[]> {
    return this.insightRepository.findWithFilters(queryDto);
  }

  /**
   * Update insight status
   * @param id Insight ID
   * @param updateDto Update data
   * @param userId User ID making the update
   * @returns Updated insight
   */
  async updateStatus(
    id: string,
    updateDto: UpdateInsightDto,
    userId?: string,
  ): Promise<Insight> {
    this.logger.log(`Updating insight ${id} status to: ${updateDto.status}`);

    if (!updateDto.status) {
      throw new Error("Status is required for insight update");
    }

    const updated = await this.insightRepository.updateStatus(
      id,
      updateDto.status,
      userId || updateDto.acknowledgedBy || updateDto.resolvedBy,
    );

    if (!updated) {
      throw new NotFoundException(`Insight with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * Mark an insight as acknowledged
   * @param id Insight ID
   * @param userId User ID acknowledging the insight
   * @returns Updated insight
   */
  async acknowledgeInsight(id: string, userId: string): Promise<Insight> {
    return this.updateStatus(id, {
      status: InsightStatus.ACKNOWLEDGED,
      acknowledgedBy: userId,
    });
  }

  /**
   * Mark an insight as resolved
   * @param id Insight ID
   * @param userId User ID resolving the insight
   * @returns Updated insight
   */
  async resolveInsight(id: string, userId: string): Promise<Insight> {
    return this.updateStatus(id, {
      status: InsightStatus.RESOLVED,
      resolvedBy: userId,
    });
  }

  /**
   * Mark an insight as dismissed
   * @param id Insight ID
   * @param userId User ID dismissing the insight
   * @returns Updated insight
   */
  async dismissInsight(id: string, userId: string): Promise<Insight> {
    return this.updateStatus(id, {
      status: InsightStatus.DISMISSED,
    });
  }

  /**
   * Delete an insight
   * @param id Insight ID
   * @returns Success indicator
   */
  async deleteInsight(id: string): Promise<boolean> {
    this.logger.log(`Deleting insight with ID: ${id}`);

    try {
      // The delete method returns void, not a result to check
      await this.insightRepository.delete(id);
      return true;
    } catch (error) {
      if (error.message?.includes("not found")) {
        throw new NotFoundException(`Insight with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Get counts of insights by type for an organization
   * @param organizationId Organization ID
   * @returns Counts by insight type
   */
  async getInsightCounts(
    organizationId: string,
  ): Promise<Record<InsightType, number>> {
    const insights = await this.findByOrganization(organizationId);

    // Initialize counts
    const counts: Record<string, number> = {};
    Object.values(InsightType).forEach((type) => {
      counts[type] = 0;
    });

    // Count by type
    insights.forEach((insight) => {
      counts[insight.type] = (counts[insight.type] || 0) + 1;
    });

    return counts as Record<InsightType, number>;
  }

  /**
   * Delete expired insights for an organization
   * @param organizationId Organization ID
   * @returns Number of insights deleted
   */
  async cleanupExpiredInsights(organizationId: string): Promise<number> {
    const now = new Date();
    const insights = await this.findByOrganization(organizationId);

    let deletedCount = 0;

    for (const insight of insights) {
      // Skip insights without expiration date
      if (!insight.expiresAt) continue;

      // Convert Firestore Timestamp to Date if needed
      const expiryDate =
        insight.expiresAt instanceof Date
          ? insight.expiresAt
          : new Date(insight.expiresAt);

      if (expiryDate <= now) {
        await this.insightRepository.delete(insight.id);
        deletedCount++;
      }
    }

    this.logger.log(
      `Deleted ${deletedCount} expired insights for organization ${organizationId}`,
    );
    return deletedCount;
  }
}
