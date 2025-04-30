import { Injectable, Logger } from '@nestjs/common';
import { toJSDate } from '../../../common/utils/date.util';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { CreditUsageLog, CreditUsageType } from '../interfaces/types';

/**
 * Repository for credit usage logs
 */
@Injectable()
export class CreditUsageLogRepository extends FirestoreBaseRepository<CreditUsageLog> {
  protected readonly collectionName = 'credit_usage_logs';

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'credit_usage_logs', {
      useVersioning: true,
      enableCache: false, // Logs are append-only, no need to cache
      requiredFields: ['organizationId', 'usageType', 'creditsUsed', 'success'],
    });
  }

  /**
   * Find usage logs by organization
   * @param organizationId Organization ID
   * @param limit Maximum number of logs to return
   * @returns Array of usage logs
   */
  async findByOrganization(
    organizationId: string,
    limit?: number,
  ): Promise<CreditUsageLog[]> {
    return this.find({
      filter: { organizationId } as Partial<CreditUsageLog>,
      queryOptions: {
        orderBy: 'createdAt',
        direction: 'desc',
        limit: limit || 100,
      },
    });
  }

  /**
   * Find usage logs by user
   * @param organizationId Organization ID
   * @param userId User ID
   * @param limit Maximum number of logs to return
   * @returns Array of usage logs
   */
  async findByUser(
    organizationId: string,
    userId: string,
    limit?: number,
  ): Promise<CreditUsageLog[]> {
    return this.find({
      filter: {
        organizationId,
        userId,
      } as Partial<CreditUsageLog>,
      queryOptions: {
        orderBy: 'createdAt',
        direction: 'desc',
        limit: limit || 50,
      },
    });
  }

  /**
   * Find usage logs by model
   * @param organizationId Organization ID
   * @param modelId Model ID
   * @param limit Maximum number of logs to return
   * @returns Array of usage logs
   */
  async findByModel(
    organizationId: string,
    modelId: string,
    limit?: number,
  ): Promise<CreditUsageLog[]> {
    return this.find({
      filter: {
        organizationId,
        modelId,
      } as Partial<CreditUsageLog>,
      queryOptions: {
        orderBy: 'createdAt',
        direction: 'desc',
        limit: limit || 50,
      },
    });
  }

  /**
   * Find usage logs by usage type
   * @param organizationId Organization ID
   * @param usageType Usage type
   * @param limit Maximum number of logs to return
   * @returns Array of usage logs
   */
  async findByUsageType(
    organizationId: string,
    usageType: CreditUsageType,
    limit?: number,
  ): Promise<CreditUsageLog[]> {
    return this.find({
      filter: {
        organizationId,
        usageType,
      } as Partial<CreditUsageLog>,
      queryOptions: {
        orderBy: 'createdAt',
        direction: 'desc',
        limit: limit || 50,
      },
    });
  }

  /**
   * Get total usage statistics for a period
   * @param organizationId Organization ID
   * @param startDate Start date for the period
   * @param endDate End date for the period
   * @returns Usage statistics
   */
  async getUsageStats(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalCreditsUsed: number;
    totalTokens: number;
    successfulOperations: number;
    failedOperations: number;
    usageByModel: Record<
      string,
      {
        inputTokens: number;
        outputTokens: number;
        creditsUsed: number;
      }
    >;
    usageByType: Record<CreditUsageType, number>;
  }> {
    // Get logs for the organization
    const logs = await this.find({
      filter: { organizationId } as Partial<CreditUsageLog>,
    });

    // Filter by date range
    const filteredLogs = logs.filter((log) => {
      // Handle different date types, including Firestore Timestamp
      let createdAt: Date;
      if (log.createdAt instanceof Date) {
        createdAt = log.createdAt;
      } else if (
        typeof log.createdAt === 'string' ||
        typeof log.createdAt === 'number'
      ) {
        createdAt = new Date(log.createdAt);
      } else if (log.createdAt && typeof log.createdAt.toDate === 'function') {
        // Handle Firestore Timestamp
        createdAt = toJSDate(log.createdAt);
      } else {
        createdAt = new Date(); // Fallback
      }

      return createdAt >= startDate && createdAt <= endDate;
    });

    // Initialize the result
    const result = {
      totalCreditsUsed: 0,
      totalTokens: 0,
      successfulOperations: 0,
      failedOperations: 0,
      usageByModel: {} as Record<
        string,
        {
          inputTokens: number;
          outputTokens: number;
          creditsUsed: number;
        }
      >,
      usageByType: {} as Record<CreditUsageType, number>,
    };

    // Calculate the statistics
    filteredLogs.forEach((log) => {
      // Total credits and tokens
      result.totalCreditsUsed += log.creditsUsed;
      result.totalTokens += log.totalTokens || 0;

      // Successful and failed operations
      if (log.success) {
        result.successfulOperations++;
      } else {
        result.failedOperations++;
      }

      // Usage by model
      if (log.modelId) {
        if (!result.usageByModel[log.modelId]) {
          result.usageByModel[log.modelId] = {
            inputTokens: 0,
            outputTokens: 0,
            creditsUsed: 0,
          };
        }

        result.usageByModel[log.modelId].inputTokens += log.inputTokens || 0;
        result.usageByModel[log.modelId].outputTokens += log.outputTokens || 0;
        result.usageByModel[log.modelId].creditsUsed += log.creditsUsed;
      }

      // Usage by type
      if (!result.usageByType[log.usageType]) {
        result.usageByType[log.usageType] = 0;
      }

      result.usageByType[log.usageType] += log.creditsUsed;
    });

    return result;
  }
}
