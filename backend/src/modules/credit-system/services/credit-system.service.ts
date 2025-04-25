import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { v4 as uuidv4 } from 'uuid';

import { ModelRegistryRepository } from 'src/modules/agent-framework';
import { FeatureFlagService } from 'src/modules/feature-flags';

import { AgentFrameworkDependencies } from '../interfaces/dependencies';
import {
  CreditAllocation,
  CreditCheckRequest,
  CreditCheckResponse,
  CreditModelType,
  CreditReservation,
  CreditTransaction,
  CreditUsageLog,
  CreditUsageRequest,
  CreditUsageType,
  TokenUsageCalculation,
} from '../interfaces/types';
import {
  CreditAllocationRepository,
  CreditPricingTierRepository,
  CreditReservationRepository,
  CreditTransactionRepository,
  CreditUsageLogRepository,
} from '../repositories';

/**
 * Service for managing credit system operations
 */
@Injectable()
export class CreditSystemService implements OnModuleInit {
  private readonly logger = new Logger(CreditSystemService.name);
  private readonly reservationExpirationMs = 5 * 60 * 1000; // 5 minutes
  private isInitialized = false;
  private cacheHitCount = 0;
  private cacheMissCount = 0;
  private responseTimeMs: number[] = [];
  private modelPricingCache: Map<
    string,
    {
      modelId: string;
      provider: string;
      inputCost: number;
      outputCost: number;
      timestamp: number;
    }
  > = new Map();

  constructor(
    private readonly allocationRepository: CreditAllocationRepository,
    private readonly transactionRepository: CreditTransactionRepository,
    private readonly pricingRepository: CreditPricingTierRepository,
    private readonly reservationRepository: CreditReservationRepository,
    private readonly usageLogRepository: CreditUsageLogRepository,
    private readonly featureFlagService: FeatureFlagService,
    private readonly modelRegistryRepository: ModelRegistryRepository,
    private readonly agentFrameworkDeps: AgentFrameworkDependencies,
  ) {}

  /**
   * Initialize service
   */
  async onModuleInit() {
    this.logger.log('Initializing Credit System Service');

    // Load active pricing tiers into cache
    await this.refreshPricingCache();

    // Clean up any expired reservations
    await this.cleanupExpiredReservations();

    // Set up periodic tasks
    setInterval(() => this.refreshPricingCache(), 30 * 60 * 1000); // Refresh pricing cache every 30 minutes
    setInterval(() => this.cleanupExpiredReservations(), 5 * 60 * 1000); // Cleanup expired reservations every 5 minutes

    this.isInitialized = true;
    this.logger.log('Credit System Service initialized');
  }

  /**
   * Refresh the pricing cache
   */
  private async refreshPricingCache(): Promise<void> {
    try {
      this.logger.debug('Refreshing pricing cache');

      const activeTiers = await this.pricingRepository.findAllActive();

      // Clear the cache
      this.modelPricingCache.clear();

      // Add active tiers to cache
      for (const tier of activeTiers) {
        const cacheKey = `${tier.modelId}:${tier.modelProvider}`;
        this.modelPricingCache.set(cacheKey, {
          modelId: tier.modelId,
          provider: tier.modelProvider,
          inputCost: tier.inputTokenCost,
          outputCost: tier.outputTokenCost,
          timestamp: Date.now(),
        });
      }

      this.logger.debug(
        `Refreshed pricing cache with ${activeTiers.length} tiers`,
      );
    } catch (error) {
      this.logger.error(
        `Error refreshing pricing cache: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Clean up expired reservations
   */
  private async cleanupExpiredReservations(): Promise<void> {
    try {
      this.logger.debug('Cleaning up expired reservations');

      const count = await this.reservationRepository.cleanupExpired();

      if (count > 0) {
        this.logger.log(`Cleaned up ${count} expired credit reservations`);
      }
    } catch (error) {
      this.logger.error(
        `Error cleaning up expired reservations: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Create a new credit allocation for an organization
   * @param organizationId Organization ID
   * @param modelType Credit model type
   * @param totalCredits Total credits to allocate
   * @param userId Optional user ID for user-specific allocation
   * @param resetDate Optional date when credits reset
   * @param expirationDate Optional date when allocation expires
   * @param metadata Optional metadata
   * @returns Created credit allocation
   */
  async createAllocation(
    organizationId: string,
    modelType: CreditModelType,
    totalCredits: number,
    userId?: string,
    resetDate?: Date,
    expirationDate?: Date,
    metadata?: Record<string, any>,
  ): Promise<CreditAllocation> {
    this.logger.log(
      `Creating allocation of ${totalCredits} credits for organization ${organizationId}`,
    );

    try {
      // Create the allocation
      const allocation = await this.allocationRepository.create({
        organizationId,
        userId,
        modelType,
        totalCredits,
        remainingCredits: totalCredits,
        resetDate,
        expirationDate,
        isActive: true,
        metadata,
      });

      // Record the transaction
      await this.transactionRepository.create({
        organizationId,
        userId,
        amount: totalCredits,
        transactionType: 'credit',
        usageType: CreditUsageType.TOKEN_USAGE, // Default
        metadata: {
          allocationId: allocation.id,
          allocationCreated: true,
          ...metadata,
        },
      });

      return allocation;
    } catch (error) {
      this.logger.error(
        `Error creating allocation: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to create credit allocation: ${error.message}`);
    }
  }

  /**
   * Get active credit allocation for an organization
   * @param organizationId Organization ID
   * @param userId Optional user ID for user-specific allocation
   * @returns Active credit allocation or null if not found
   */
  async getActiveAllocation(
    organizationId: string,
    userId?: string,
  ): Promise<CreditAllocation | null> {
    try {
      if (userId) {
        // Try to get user-specific allocation first
        const userAllocation = await this.allocationRepository.findActiveByUser(
          organizationId,
          userId,
        );

        if (userAllocation) {
          return userAllocation;
        }
      }

      // Fall back to organization-level allocation
      return this.allocationRepository.findActiveByOrganization(organizationId);
    } catch (error) {
      this.logger.error(
        `Error fetching active allocation: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Failed to fetch active credit allocation: ${error.message}`,
      );
    }
  }

  /**
   * Check if an organization has enough credits for an operation
   * @param request Credit check request
   * @returns Credit check response
   */
  async checkCredits(
    request: CreditCheckRequest,
  ): Promise<CreditCheckResponse> {
    const startTime = Date.now();

    try {
      // Calculate cost for the operation
      const cost = await this.calculateCost(
        request.modelId,
        request.expectedInputTokens,
        request.expectedOutputTokens,
      );

      // Get active allocation for the organization
      const allocation = await this.getActiveAllocation(
        request.organizationId,
        request.userId,
      );

      if (!allocation) {
        return {
          hasCredits: false,
          availableCredits: 0,
          estimatedCost: cost,
          reason: 'No active credit allocation found',
        };
      }

      // Check if feature is enabled via feature flags
      const featureKey = `credit-intensive-${request.usageType.toLowerCase()}`;
      const featureEnabled = await this.featureFlagService.isEnabled(
        featureKey,
        {
          organizationId: request.organizationId,
          userId: request.userId,
        },
      );

      if (!featureEnabled) {
        return {
          hasCredits: false,
          availableCredits: allocation.remainingCredits,
          estimatedCost: cost,
          reason: 'Feature is disabled by feature flag',
        };
      }

      // Calculate available credits (accounting for any pending reservations)
      const pendingReservations =
        await this.reservationRepository.getTotalReserved(
          request.organizationId,
        );

      const availableCredits =
        allocation.remainingCredits - pendingReservations;

      // Check if there are enough credits
      const hasCredits = availableCredits >= cost;

      // If there are enough credits and a reservation is requested
      if (hasCredits && request.operationId) {
        // Create a reservation
        const reservation = await this.reservationRepository.create({
          organizationId: request.organizationId,
          userId: request.userId,
          operationId: request.operationId,
          reservationAmount: cost,
          usageType: request.usageType,
          status: 'pending',
          expirationDate: new Date(Date.now() + this.reservationExpirationMs),
          metadata: request.metadata,
        });

        // Record response time
        this.recordResponseTime(startTime);

        return {
          hasCredits: true,
          availableCredits,
          estimatedCost: cost,
          reservationId: reservation.id,
        };
      }

      // Record response time
      this.recordResponseTime(startTime);

      return {
        hasCredits,
        availableCredits,
        estimatedCost: cost,
        reason: hasCredits ? undefined : 'Insufficient credits',
      };
    } catch (error) {
      this.logger.error(
        `Error checking credits: ${error.message}`,
        error.stack,
      );

      // Record response time
      this.recordResponseTime(startTime);

      return {
        hasCredits: false,
        availableCredits: 0,
        estimatedCost: 0,
        reason: `Error checking credits: ${error.message}`,
      };
    }
  }

  /**
   * Record credit usage for an operation
   * @param request Credit usage request
   * @returns Created usage log
   */
  async recordUsage(request: CreditUsageRequest): Promise<CreditUsageLog> {
    const startTime = Date.now();

    try {
      // Calculate cost for the operation
      const cost = await this.calculateCost(
        request.modelId,
        request.inputTokens,
        request.outputTokens,
      );

      // Create usage log
      const usageLog = await this.usageLogRepository.create({
        organizationId: request.organizationId,
        userId: request.userId,
        usageType: request.usageType,
        modelId: request.modelId,
        modelProvider: request.modelProvider,
        inputTokens: request.inputTokens,
        outputTokens: request.outputTokens,
        totalTokens: request.inputTokens + request.outputTokens,
        creditsUsed: cost,
        processingTime: request.processingTime,
        success: request.success,
        errorMessage: request.errorMessage,
        resourceId: request.resourceId,
        resourceType: request.resourceType,
        metadata: {
          ...request.metadata,
          operationId: request.operationId,
          reservationId: request.reservationId,
        },
      });

      // Handle reservation if provided
      if (request.reservationId) {
        const reservation = await this.reservationRepository.findById(
          request.reservationId,
        );

        if (reservation) {
          // Mark the reservation as confirmed
          await this.reservationRepository.updateStatus(
            request.reservationId,
            'confirmed',
          );

          // Use the reservation amount as the cost
          const reservationCost = reservation.reservationAmount;

          // Deduct the credits from the allocation
          await this.deductCredits(
            request.organizationId,
            reservationCost,
            request.usageType,
            request.userId,
            request.modelId,
            request.modelProvider,
            request.inputTokens,
            request.outputTokens,
            request.operationId,
            request.resourceId,
            request.resourceType,
            request.metadata,
          );

          // Record response time
          this.recordResponseTime(startTime);

          return usageLog;
        }
      }

      // Deduct the credits from the allocation if no reservation or reservation not found
      await this.deductCredits(
        request.organizationId,
        cost,
        request.usageType,
        request.userId,
        request.modelId,
        request.modelProvider,
        request.inputTokens,
        request.outputTokens,
        request.operationId,
        request.resourceId,
        request.resourceType,
        request.metadata,
      );

      // Record response time
      this.recordResponseTime(startTime);

      return usageLog;
    } catch (error) {
      this.logger.error(`Error recording usage: ${error.message}`, error.stack);

      // Record response time
      this.recordResponseTime(startTime);

      throw new Error(`Failed to record credit usage: ${error.message}`);
    }
  }

  /**
   * Calculate cost for token usage
   * @param modelId Model ID
   * @param inputTokens Input tokens
   * @param outputTokens Output tokens
   * @returns Calculated cost in credits
   */
  async calculateCost(
    modelId: string,
    inputTokens: number,
    outputTokens: number,
  ): Promise<number> {
    try {
      // Try to get pricing from cache
      const modelInfo = await this.getModelInfoForPricing(modelId);
      const cacheKey = `${modelId}:${modelInfo?.provider}`;

      if (this.modelPricingCache.has(cacheKey)) {
        this.cacheHitCount++;
        const pricing = this.modelPricingCache.get(cacheKey);

        if (pricing) {
          const inputCost = (inputTokens * pricing.inputCost) / 1000;
          const outputCost = (outputTokens * pricing.outputCost) / 1000;

          // Minimum cost is 1 credit
          return Math.max(1, Math.ceil(inputCost + outputCost));
        }
      }

      this.cacheMissCount++;

      // Pricing not in cache, try to get from database
      if (modelInfo) {
        const pricingTier = await this.pricingRepository.findActiveForModel(
          modelId,
          modelInfo.provider,
        );

        if (pricingTier) {
          // Update cache
          this.modelPricingCache.set(cacheKey, {
            modelId,
            provider: modelInfo.provider,
            inputCost: pricingTier.inputTokenCost,
            outputCost: pricingTier.outputTokenCost,
            timestamp: Date.now(),
          });

          const inputCost = (inputTokens * pricingTier.inputTokenCost) / 1000;
          const outputCost =
            (outputTokens * pricingTier.outputTokenCost) / 1000;

          // Minimum cost is 1 credit
          return Math.max(1, Math.ceil(inputCost + outputCost));
        }
      }

      // If not found in database, use fallback pricing based on model name
      if (modelId.includes('gpt-4')) {
        const inputCost = ((inputTokens * 0.03) / 1000) * 100; // Convert dollars to credits (100 credits = $1)
        const outputCost = ((outputTokens * 0.06) / 1000) * 100;

        return Math.max(1, Math.ceil(inputCost + outputCost));
      } else if (modelId.includes('gpt-3.5')) {
        const inputCost = ((inputTokens * 0.001) / 1000) * 100;
        const outputCost = ((outputTokens * 0.002) / 1000) * 100;

        return Math.max(1, Math.ceil(inputCost + outputCost));
      } else if (modelId.includes('vertex') || modelId.includes('gemini')) {
        const inputCost = ((inputTokens * 0.0005) / 1000) * 100;
        const outputCost = ((outputTokens * 0.0015) / 1000) * 100;

        return Math.max(1, Math.ceil(inputCost + outputCost));
      } else if (modelId.includes('embed')) {
        const inputCost = ((inputTokens * 0.0001) / 1000) * 100;
        const outputCost = 0;

        return Math.max(1, Math.ceil(inputCost + outputCost));
      } else {
        // Default pricing
        const inputCost = ((inputTokens * 0.01) / 1000) * 100;
        const outputCost = ((outputTokens * 0.02) / 1000) * 100;

        return Math.max(1, Math.ceil(inputCost + outputCost));
      }
    } catch (error) {
      this.logger.error(
        `Error calculating cost: ${error.message}`,
        error.stack,
      );

      // Fallback to a safe default
      return Math.max(1, Math.ceil((inputTokens + outputTokens) / 1000));
    }
  }

  /**
   * Get model information for pricing
   * @param modelId Model ID
   * @returns Model information or null if not found
   */
  private async getModelInfoForPricing(modelId: string): Promise<{
    provider: string;
    costPer1kInputTokens: number;
    costPer1kOutputTokens: number;
  } | null> {
    try {
      // Using findAll() and filtering as findByModelName is not available
      const allModels = await this.modelRegistryRepository.findAll();
      const model = allModels.find((m) => m.model === modelId);

      if (model) {
        return {
          provider: model.provider,
          costPer1kInputTokens: model.costPer1kInputTokens,
          costPer1kOutputTokens: model.costPer1kOutputTokens,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error getting model info: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Deduct credits from an allocation
   * @param organizationId Organization ID
   * @param amount Amount to deduct
   * @param usageType Usage type
   * @param userId Optional user ID
   * @param modelId Optional model ID
   * @param modelProvider Optional model provider
   * @param inputTokens Optional input tokens
   * @param outputTokens Optional output tokens
   * @param operationId Optional operation ID
   * @param resourceId Optional resource ID
   * @param resourceType Optional resource type
   * @param metadata Optional metadata
   * @returns Updated allocation
   */
  private async deductCredits(
    organizationId: string,
    amount: number,
    usageType: CreditUsageType,
    userId?: string,
    modelId?: string,
    modelProvider?: string,
    inputTokens?: number,
    outputTokens?: number,
    operationId?: string,
    resourceId?: string,
    resourceType?: string,
    metadata?: Record<string, any>,
  ): Promise<CreditAllocation> {
    // Get active allocation
    const allocation = await this.getActiveAllocation(organizationId, userId);

    if (!allocation) {
      throw new Error(
        `No active credit allocation found for organization ${organizationId}`,
      );
    }

    if (allocation.remainingCredits < amount) {
      throw new Error(
        `Insufficient credits: Required ${amount}, Available ${allocation.remainingCredits}`,
      );
    }

    // Create transaction record
    await this.transactionRepository.create({
      organizationId,
      userId,
      amount,
      transactionType: 'debit',
      usageType,
      modelId,
      modelProvider,
      inputTokens,
      outputTokens,
      operationId,
      resourceId,
      resourceType,
      metadata,
    });

    // Deduct credits from allocation
    return this.allocationRepository.decrementCredits(allocation.id, amount);
  }

  /**
   * Add credits to an allocation
   * @param allocationId Allocation ID
   * @param amount Amount to add
   * @param userId User ID making the change
   * @param metadata Optional metadata
   * @returns Updated allocation
   */
  async addCreditsToAllocation(
    allocationId: string,
    amount: number,
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<CreditAllocation> {
    try {
      // Get the allocation
      const allocation = await this.allocationRepository.findById(allocationId);

      if (!allocation) {
        throw new Error(`Credit allocation not found: ${allocationId}`);
      }

      // Create transaction record
      await this.transactionRepository.create({
        organizationId: allocation.organizationId,
        userId,
        amount,
        transactionType: 'credit',
        usageType: CreditUsageType.TOKEN_USAGE, // Default
        metadata: {
          allocationId,
          creditAddedBy: userId,
          ...metadata,
        },
      });

      // Add credits to allocation
      return this.allocationRepository.addCredits(allocationId, amount);
    } catch (error) {
      this.logger.error(`Error adding credits: ${error.message}`, error.stack);
      throw new Error(`Failed to add credits: ${error.message}`);
    }
  }

  /**
   * Get recent transactions for an organization
   * @param organizationId Organization ID
   * @param limit Maximum number of transactions to return
   * @returns Array of transactions
   */
  async getRecentTransactions(
    organizationId: string,
    limit: number = 50,
  ): Promise<CreditTransaction[]> {
    return this.transactionRepository.findByOrganization(organizationId, limit);
  }

  /**
   * Get recent usage logs for an organization
   * @param organizationId Organization ID
   * @param limit Maximum number of logs to return
   * @returns Array of usage logs
   */
  async getRecentUsageLogs(
    organizationId: string,
    limit: number = 50,
  ): Promise<CreditUsageLog[]> {
    return this.usageLogRepository.findByOrganization(organizationId, limit);
  }

  /**
   * Get usage statistics for a period
   * @param organizationId Organization ID
   * @param startDate Start date for the period
   * @param endDate End date for the period
   * @returns Usage statistics
   */
  async getUsageStatistics(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return this.usageLogRepository.getUsageStats(
      organizationId,
      startDate,
      endDate,
    );
  }

  /**
   * Calculate token usage for request
   * @param modelId Model ID
   * @param messages Chat messages
   * @returns Token usage calculation
   */
  async calculateTokenUsage(
    modelId: string,
    messages: any[],
  ): Promise<TokenUsageCalculation> {
    try {
      // Get model from registry
      const allModels = await this.modelRegistryRepository.findAll();
      const model = allModels.find((m) => m.model === modelId);

      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }

      // Count tokens in messages
      const tokenCounts = await this.agentFrameworkDeps.countTokensInMessages(
        model,
        messages,
      );

      // Calculate cost
      const creditCost = await this.calculateCost(
        modelId,
        tokenCounts.inputTokens,
        tokenCounts.outputTokens,
      );

      return {
        inputTokens: tokenCounts.inputTokens,
        outputTokens: tokenCounts.outputTokens,
        totalTokens: tokenCounts.inputTokens + tokenCounts.outputTokens,
        creditCost,
        modelId,
        modelProvider: model.provider,
      };
    } catch (error) {
      this.logger.error(
        `Error calculating token usage: ${error.message}`,
        error.stack,
      );

      // Fallback to estimation
      const estimatedInputTokens = this.estimateTokensFromMessages(messages);
      const estimatedOutputTokens = Math.ceil(estimatedInputTokens * 0.5); // Rough estimate

      // Calculate cost
      const creditCost = await this.calculateCost(
        modelId,
        estimatedInputTokens,
        estimatedOutputTokens,
      );

      const modelInfo = await this.getModelInfoForPricing(modelId);

      return {
        inputTokens: estimatedInputTokens,
        outputTokens: estimatedOutputTokens,
        totalTokens: estimatedInputTokens + estimatedOutputTokens,
        creditCost,
        modelId,
        modelProvider: modelInfo?.provider || 'unknown',
      };
    }
  }

  /**
   * Estimate tokens from messages (fallback method)
   * @param messages Chat messages
   * @returns Estimated token count
   */
  private estimateTokensFromMessages(messages: any[]): number {
    let totalChars = 0;

    for (const message of messages) {
      if (typeof message.content === 'string') {
        totalChars += message.content.length;
      } else if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (typeof part === 'string') {
            totalChars += part.length;
          } else if (part && typeof part.text === 'string') {
            totalChars += part.text.length;
          }
        }
      }

      // Add some overhead for message structure
      totalChars += 20;
    }

    // Average of 4 characters per token for English text
    return Math.ceil(totalChars / 4);
  }

  /**
   * Record response time for metrics
   * @param startTime Start time in milliseconds
   */
  private recordResponseTime(startTime: number): void {
    const responseTime = Date.now() - startTime;

    // Keep only the last 100 response times
    if (this.responseTimeMs.length >= 100) {
      this.responseTimeMs.shift();
    }

    this.responseTimeMs.push(responseTime);
  }

  /**
   * Get system status information
   * @returns Credit system status
   */
  async getSystemStatus(): Promise<{
    isOperational: boolean;
    latestTransaction?: Date;
    reservationCount: number;
    cacheHitRate: number;
    averageLatency: number;
  }> {
    try {
      // Get the latest transaction
      const transactions = await this.transactionRepository.findByOrganization(
        'system', // Special organization ID for system-level operations
        1,
      );

      // Handle different date types for the latest transaction
      let latestTransaction: Date | undefined = undefined;
      if (transactions.length > 0) {
        const txCreatedAt = transactions[0].createdAt;
        if (txCreatedAt instanceof Date) {
          latestTransaction = txCreatedAt;
        } else if (
          typeof txCreatedAt === 'string' ||
          typeof txCreatedAt === 'number'
        ) {
          latestTransaction = new Date(txCreatedAt);
        } else if (txCreatedAt && typeof txCreatedAt.toDate === 'function') {
          // Handle Firestore Timestamp
          latestTransaction = txCreatedAt.toDate();
        }
      }

      // Get reservation count
      const reservations = await this.reservationRepository.find({
        filter: { status: 'pending' } as any,
      });

      // Calculate cache hit rate
      const totalCacheRequests = this.cacheHitCount + this.cacheMissCount;
      const cacheHitRate =
        totalCacheRequests > 0
          ? (this.cacheHitCount / totalCacheRequests) * 100
          : 0;

      // Calculate average latency
      const averageLatency =
        this.responseTimeMs.length > 0
          ? this.responseTimeMs.reduce((sum, time) => sum + time, 0) /
            this.responseTimeMs.length
          : 0;

      return {
        isOperational: this.isInitialized,
        latestTransaction:
          latestTransaction instanceof Date
            ? latestTransaction
            : latestTransaction
              ? new Date(latestTransaction)
              : undefined,
        reservationCount: reservations.length,
        cacheHitRate,
        averageLatency,
      };
    } catch (error) {
      this.logger.error(
        `Error getting system status: ${error.message}`,
        error.stack,
      );

      return {
        isOperational: false,
        reservationCount: 0,
        cacheHitRate: 0,
        averageLatency: 0,
      };
    }
  }

  /**
   * Release a credit reservation without using the credits
   * @param reservationId Reservation ID
   * @returns Success status
   */
  async releaseReservation(reservationId: string): Promise<boolean> {
    try {
      const reservation =
        await this.reservationRepository.findById(reservationId);

      if (!reservation) {
        throw new Error(`Reservation not found: ${reservationId}`);
      }

      if (reservation.status !== 'pending') {
        throw new Error(`Reservation is not pending: ${reservationId}`);
      }

      await this.reservationRepository.updateStatus(reservationId, 'released');

      return true;
    } catch (error) {
      this.logger.error(
        `Error releasing reservation: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
