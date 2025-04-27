import { Injectable, Logger } from '@nestjs/common';

import { FirestoreBaseRepository } from '../../../common/repositories';
import { FirestoreConfigService } from '../../../config/firestore.config';
import {
  InsightStatus,
  InsightType,
  InsightSeverity,
} from '../interfaces/types';
import { Insight } from '../models/insight.schema'; // Insight now extends TenantEntity

/**
 * Repository for Insight entities in Firestore
 */
@Injectable()
export class InsightRepository extends FirestoreBaseRepository<Insight> {
  // Collection name in Firestore
  protected readonly collectionName = 'insights';

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'insights', {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 5 * 60 * 1000, // 5 minutes
      requiredFields: [
        'organizationId',
        'type',
        'title',
        'description',
        'status',
      ],
    });
  }

  /**
   * Find insights by organization ID
   * @param organizationId Organization ID
   * @returns Array of insights
   */
  async findByOrganization(organizationId: string): Promise<Insight[]> {
    return this.find({
      filter: { organizationId } as Partial<Insight>,
    });
  }

  /**
   * Find insights by type
   * @param type Insight type
   * @returns Array of insights
   */
  async findByType(type: InsightType): Promise<Insight[]> {
    return this.find({
      filter: { type } as Partial<Insight>,
    });
  }

  /**
   * Find insights by status
   * @param status Insight status
   * @returns Array of insights
   */
  async findByStatus(status: InsightStatus): Promise<Insight[]> {
    return this.find({
      filter: { status } as Partial<Insight>,
    });
  }

  /**
   * Find insights by severity
   * @param severity Insight severity
   * @returns Array of insights
   */
  async findBySeverity(severity: InsightSeverity): Promise<Insight[]> {
    return this.find({
      filter: { severity } as Partial<Insight>,
    });
  }

  /**
   * Find insights by related entity
   * @param relatedEntityType Entity type
   * @param relatedEntityId Entity ID
   * @returns Array of insights
   */
  async findByRelatedEntity(
    relatedEntityType: string,
    relatedEntityId: string,
  ): Promise<Insight[]> {
    return this.find({
      filter: {
        relatedEntityType,
        relatedEntityId,
      } as Partial<Insight>,
    });
  }

  /**
   * Find insights with advanced filtering
   * @param params Query parameters
   * @returns Array of insights
   */
  async findWithFilters(params: {
    organizationId?: string;
    type?: InsightType;
    status?: InsightStatus;
    severity?: InsightSeverity;
    relatedEntityType?: string;
    relatedEntityId?: string;
    minConfidence?: number;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Insight[]> {
    // Start with basic filter object
    const filter: Partial<Insight> = {};

    // Add equality filters
    if (params.organizationId) filter.organizationId = params.organizationId;
    if (params.type) filter.type = params.type;
    if (params.status) filter.status = params.status;
    if (params.severity) filter.severity = params.severity;
    if (params.relatedEntityType)
      filter.relatedEntityType = params.relatedEntityType;
    if (params.relatedEntityId) filter.relatedEntityId = params.relatedEntityId;

    // Basic query options
    const options = {
      orderBy: 'generatedAt' as keyof Insight,
      direction: 'desc' as 'asc' | 'desc',
      limit: params.limit,
      offset: params.offset,
    };

    // Execute the query
    let insights = await this.find({
      filter,
      queryOptions: options,
    });

    // Apply post-query filters that can't be done in Firestore directly
    if (params.minConfidence !== undefined) {
      const minConfidence = params.minConfidence;
      insights = insights.filter(
        (insight) => insight.confidence >= minConfidence,
      );
    }

    if (params.fromDate) {
      const fromDate = params.fromDate;
      insights = insights.filter((insight) => {
        const generatedAt =
          insight.generatedAt instanceof Date
            ? insight.generatedAt
            : new Date(insight.generatedAt);
        return generatedAt >= fromDate;
      });
    }

    if (params.toDate) {
      const toDate = params.toDate;
      insights = insights.filter((insight) => {
        const generatedAt =
          insight.generatedAt instanceof Date
            ? insight.generatedAt
            : new Date(insight.generatedAt);
        return generatedAt <= toDate;
      });
    }

    return insights;
  }

  /**
   * Update insight status
   * @param id Insight ID
   * @param status New status
   * @param userId User making the change
   * @returns Updated insight
   */
  async updateStatus(
    id: string,
    status: InsightStatus,
    userId?: string,
  ): Promise<Insight | null> {
    const now = new Date();
    const updates: Partial<Insight> = {
      status,
    };

    // Add appropriate timestamp based on status
    if (status === InsightStatus.ACKNOWLEDGED) {
      updates.acknowledgedAt = now;
      if (userId) updates.acknowledgedBy = userId;
    } else if (status === InsightStatus.RESOLVED) {
      updates.resolvedAt = now;
      if (userId) updates.resolvedBy = userId;
    }

    return this.update(id, updates);
  }

  /**
   * Count insights by organization and type
   * @param organizationId Organization ID
   * @param type Optional insight type to filter by
   * @returns Count of insights
   */
  async countByOrganization(
    organizationId: string,
    type?: InsightType,
  ): Promise<number> {
    const filter: Partial<Insight> = { organizationId };
    if (type) filter.type = type;

    return this.count({
      filter,
    });
  }
}
