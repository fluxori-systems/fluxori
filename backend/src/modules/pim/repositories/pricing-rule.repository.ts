import { Injectable, Logger } from '@nestjs/common';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { 
  PricingRule, 
  PricingRuleExecutionStatus, 
  PricingRuleScheduleType 
} from '../models/pricing-rule.model';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { QueryFilterOperator } from '../../../types/google-cloud.types';

/**
 * Enhanced type to ensure PricingRule matches FirestoreEntity requirements
 */
export interface PricingRuleEntity extends PricingRule {
  id: string; // Make id required
}

/**
 * Repository for pricing rules
 */
@Injectable()
export class PricingRuleRepository extends FirestoreBaseRepository<PricingRuleEntity> {
  protected readonly logger = new Logger(PricingRuleRepository.name);

  constructor(
    firestoreConfigService: FirestoreConfigService,
  ) {
    super(firestoreConfigService, 'pricing-rules', {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 300000, // 5 minutes
    });
  }

  /**
   * Find active pricing rules by organization
   * @param organizationId Organization ID
   * @param options Query options
   */
  async findActiveRulesByOrganization(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      productId?: string;
      categoryId?: string;
    },
  ): Promise<PricingRule[]> {
    try {
      // Set default options
      const limit = options?.limit || 100;
      const offset = options?.offset || 0;
      
      // Create advanced filters with proper types
      const advancedFilters = [
        { field: 'organizationId', operator: '==' as QueryFilterOperator, value: organizationId },
        { field: 'isActive', operator: '==' as QueryFilterOperator, value: true }
      ];
      
      // Add filters for specific product or category - we'll filter in memory afterward
      if (options?.productId || options?.categoryId) {
        advancedFilters.push({ field: 'scope.applyToAll', operator: '==' as QueryFilterOperator, value: true });
      }
      
      // Use find method with proper query options
      const queryOptions = {
        orderBy: 'priority',
        direction: 'asc' as 'asc' | 'desc',
        limit,
        offset
      };
      
      // Execute query using proper repository methods
      const rules = await this.find({
        advancedFilters,
        queryOptions
      });
      
      // If we're filtering by productId or categoryId, we need to do it in memory
      // since Firestore doesn't support array-contains-any with other filters
      let filteredRules = rules;
      
      if (options?.productId) {
        const productId = options.productId;
        filteredRules = filteredRules.filter(rule => 
          rule.scope.applyToAll || 
          (rule.scope.productIds && rule.scope.productIds.includes(productId))
        );
      }
      
      if (options?.categoryId) {
        const categoryId = options.categoryId;
        filteredRules = filteredRules.filter(rule => 
          rule.scope.applyToAll || 
          (rule.scope.categoryIds && rule.scope.categoryIds.includes(categoryId))
        );
      }
      
      return filteredRules;
    } catch (error) {
      this.logger.error(`Error finding active pricing rules: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Add execution record to a pricing rule
   * @param ruleId Rule ID
   * @param execution Execution record
   */
  async addExecution(
    ruleId: string,
    execution: {
      id: string;
      startTime: Date;
      endTime?: Date;
      status: PricingRuleExecutionStatus;
      productsAffected: number;
      failedProducts?: string[];
      error?: string;
      triggeredBy?: string;
    },
  ): Promise<void> {
    try {
      // Get current rule
      const rule = await this.findById(ruleId);
      if (!rule) {
        throw new Error(`Pricing rule not found with ID: ${ruleId}`);
      }
      
      // Create new execution record
      const newExecution = {
        ...execution,
        startTime: execution.startTime,
        endTime: execution.endTime || null,
      };
      
      // Get existing executions or initialize empty array
      const recentExecutions = rule.recentExecutions || [];
      
      // Add new execution to the beginning of the array
      recentExecutions.unshift(newExecution);
      
      // Keep only the 10 most recent executions
      const limitedExecutions = recentExecutions.slice(0, 10);
      
      // Calculate execution stats
      const isSuccess = execution.status === PricingRuleExecutionStatus.COMPLETED;
      const executionStats = {
        totalExecutions: (rule.executionStats?.totalExecutions || 0) + 1,
        successfulExecutions: (rule.executionStats?.successfulExecutions || 0) + (isSuccess ? 1 : 0),
        failedExecutions: (rule.executionStats?.failedExecutions || 0) + (isSuccess ? 0 : 1),
        lastExecutionTime: execution.endTime || execution.startTime,
      };
      
      // Update rule with new execution data
      await this.update(ruleId, {
        recentExecutions: limitedExecutions,
        executionStats,
        // updatedAt is automatically handled by the repository
      });
    } catch (error) {
      this.logger.error(`Error adding execution record: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find rules by schedule type and date range
   * @param scheduleType Schedule type
   * @param startDate Start date
   * @param endDate End date
   * @param organizationId Organization ID
   */
  async findRulesBySchedule(
    scheduleType: string,
    startDate: Date,
    endDate: Date,
    organizationId?: string,
  ): Promise<PricingRule[]> {
    try {
      // Create advanced filters with proper types
      const advancedFilters = [
        { field: 'schedule.type', operator: '==' as QueryFilterOperator, value: scheduleType },
        { field: 'isActive', operator: '==' as QueryFilterOperator, value: true }
      ];
      
      // Filter by organization if provided
      if (organizationId) {
        advancedFilters.push({ field: 'organizationId', operator: '==' as QueryFilterOperator, value: organizationId });
      }
      
      // Execute query using proper repository methods
      const rules = await this.find({
        advancedFilters
      });
      
      // Filter by date range in memory, as Firestore has limitations with date queries
      const filteredRules = rules.filter(rule => {
        // Always type should be valid for any date range
        if (scheduleType === 'ALWAYS') {
          return true;
        }
        
        // Check if rule's date range overlaps with the provided date range
        const ruleStart = rule.schedule.startDate ? new Date(rule.schedule.startDate) : new Date(0);
        const ruleEnd = rule.schedule.endDate ? new Date(rule.schedule.endDate) : new Date(8640000000000000); // Max date
        
        return ruleStart <= endDate && ruleEnd >= startDate;
      });
      
      return filteredRules;
    } catch (error) {
      this.logger.error(`Error finding rules by schedule: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Convert document data to entity
   * This is a helper method used inside other methods that handle data conversion
   * @param data Document data and id
   */
  private convertToEntity(data: any, id: string): PricingRule {
    return {
      ...data,
      id,
      createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
      schedule: data.schedule ? {
        ...data.schedule,
        startDate: data.schedule.startDate?.toDate?.() || data.schedule.startDate || null,
        endDate: data.schedule.endDate?.toDate?.() || data.schedule.endDate || null,
      } : { type: PricingRuleScheduleType.ALWAYS },
      recentExecutions: (data.recentExecutions || []).map(execution => ({
        ...execution,
        startTime: execution.startTime?.toDate?.() || execution.startTime || new Date(),
        endTime: execution.endTime?.toDate?.() || execution.endTime || null,
      })),
      executionStats: data.executionStats ? {
        ...data.executionStats,
        lastExecutionTime: data.executionStats.lastExecutionTime?.toDate?.() || 
                       data.executionStats.lastExecutionTime || null,
      } : undefined,
    } as PricingRule;
  }
}