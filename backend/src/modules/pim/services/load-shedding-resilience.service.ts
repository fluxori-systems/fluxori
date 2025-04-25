/**
 * Load Shedding Resilience Service for PIM Module
 *
 * This service provides patterns and utilities for making the PIM module
 * resilient to load shedding (scheduled power outages) in South Africa.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MarketContextService } from './market-context.service';
import { FeatureFlagService } from '../../feature-flags/services/feature-flag.service';
import { MarketFeature } from '../interfaces/market-context.interface';
import { LoadSheddingInfo } from '../interfaces/types';

/**
 * Batch operation options
 */
export interface BatchOperationOptions {
  /**
   * Batch size for processing
   */
  batchSize?: number;

  /**
   * Pause between batches in milliseconds
   */
  pauseAfterBatch?: number;

  /**
   * Number of retries for failed operations
   */
  retryCount?: number;

  /**
   * Delay between retries in milliseconds
   */
  retryDelay?: number;

  /**
   * Whether to continue execution after errors
   */
  continueOnError?: boolean;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult<T, R> {
  /**
   * Number of items processed
   */
  processed: number;

  /**
   * Number of successful operations
   */
  succeeded: number;

  /**
   * Number of failed operations
   */
  failed: number;

  /**
   * Results for each operation
   */
  results: Array<{
    /**
     * Whether the operation was successful
     */
    success: boolean;

    /**
     * The item that was processed
     */
    item: T;

    /**
     * The result of the operation
     */
    result?: R;

    /**
     * The error if operation failed
     */
    error?: Error;
  }>;
}

/**
 * Resilient operation options
 */
export interface ResilientOperationOptions {
  /**
   * Priority (1-10, 1 is highest)
   */
  priority?: number;

  /**
   * Maximum number of retries
   */
  maxRetries?: number;

  /**
   * Whether to execute immediately if possible
   */
  executeImmediatelyIfPossible?: boolean;

  /**
   * Cache key for result caching
   */
  cacheKey?: string;

  /**
   * Cache TTL in milliseconds
   */
  cacheTtlMs?: number;
}

/**
 * Operation to queue for load shedding resilience
 */
interface QueuedOperation<T> {
  /**
   * Operation ID
   */
  id: string;

  /**
   * Operation type
   */
  type: string;

  /**
   * Operation parameters
   */
  params: any;

  /**
   * Number of retries
   */
  retries: number;

  /**
   * Maximum number of retries
   */
  maxRetries: number;

  /**
   * When the operation was last retried
   */
  lastRetryAt?: Date;

  /**
   * When the operation was created
   */
  createdAt: Date;

  /**
   * Priority (lower is higher)
   */
  priority: number;

  /**
   * Callback function to execute
   */
  callback: (params: any) => Promise<T>;
}

/**
 * Load shedding data from external source
 */
interface LoadSheddingSchedule {
  /**
   * Current load shedding stage
   */
  stage: number;

  /**
   * Area code
   */
  area: string;

  /**
   * Start time of outage
   */
  startTime: Date;

  /**
   * End time of outage
   */
  endTime: Date;

  /**
   * Whether load shedding is currently active
   */
  active: boolean;
}

/**
 * Cached item
 */
interface CacheItem<T> {
  /**
   * Cached data
   */
  data: T;

  /**
   * When the cache item expires
   */
  expiresAt: Date;
}

/**
 * Load Shedding Resilience Service
 *
 * Provides patterns for making operations resilient to power outages,
 * including operation queueing, data caching, and recovery mechanisms.
 */
@Injectable()
export class LoadSheddingResilienceService implements OnModuleInit {
  private readonly logger = new Logger(LoadSheddingResilienceService.name);

  /**
   * Queue of operations to process
   */
  private operationQueue: QueuedOperation<any>[] = [];

  /**
   * Whether the queue is currently being processed
   */
  private isProcessingQueue = false;

  /**
   * Current load shedding info
   */
  private loadSheddingInfo: LoadSheddingInfo = {
    stage: 0,
    active: false,
  };

  /**
   * Interval for processing the queue
   */
  private processingInterval: NodeJS.Timeout | null = null;

  /**
   * Interval for checking load shedding status
   */
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Local in-memory cache
   */
  private localCache: Map<string, CacheItem<any>> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly marketContextService: MarketContextService,
  ) {}

  /**
   * Initialize the service on module initialization
   */
  async onModuleInit(): Promise<void> {
    // Check if load shedding resilience is enabled via feature flags
    // Use attributes to pass the default value since it's not part of the standard context
    const isLoadSheddingEnabled = await this.featureFlagService.isEnabled(
      'pim.loadSheddingResilience',
      {
        attributes: { defaultValue: true }, // Default to enabled if no flag exists
      },
    );

    if (isLoadSheddingEnabled) {
      this.logger.log('Load shedding resilience enabled');

      // Start periodic processing of the operation queue
      const queueIntervalMs =
        this.configService.get<number>('LOAD_SHEDDING_QUEUE_INTERVAL_MS') ||
        30000; // 30 seconds
      this.processingInterval = setInterval(
        () => this.processQueue(),
        queueIntervalMs,
      );

      // Start periodic checking of load shedding status
      const checkIntervalMs =
        this.configService.get<number>('LOAD_SHEDDING_CHECK_INTERVAL_MS') ||
        300000; // 5 minutes
      this.checkInterval = setInterval(
        () => this.updateLoadSheddingStatus(),
        checkIntervalMs,
      );

      // Initial load shedding status check
      await this.updateLoadSheddingStatus();
    } else {
      this.logger.log('Load shedding resilience disabled');
    }
  }

  /**
   * Update load shedding status from external source
   * In a production environment, this would connect to:
   * - EskomSePush API
   * - Local power utility API
   * - Other load shedding information service
   */
  private async updateLoadSheddingStatus(): Promise<void> {
    try {
      // In a real implementation, this would call an external API
      // For this sample, we'll simulate the load shedding status

      // Simplified simulation - in production, this would connect to a real API
      const simulatedSchedule: LoadSheddingSchedule = {
        stage: 0, // 0-8, where 0 means no load shedding
        area: 'Area 7',
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        active: false,
      };

      // Update internal state
      this.loadSheddingInfo = {
        stage: simulatedSchedule.stage,
        active: simulatedSchedule.active,
        nextStartTime:
          simulatedSchedule.stage > 0 ? simulatedSchedule.startTime : undefined,
        nextEndTime:
          simulatedSchedule.stage > 0 ? simulatedSchedule.endTime : undefined,
        areaCode: 'Area 7',
        areaName: 'Johannesburg North',
      };

      // Log current status
      this.logger.debug(
        `Load shedding status: Stage ${this.loadSheddingInfo.stage}, Active: ${this.loadSheddingInfo.active}`,
      );

      // If load shedding has ended, process the queue
      if (
        !this.loadSheddingInfo.active &&
        this.operationQueue.length > 0 &&
        !this.isProcessingQueue
      ) {
        await this.processQueue();
      }
    } catch (error) {
      this.logger.error(
        `Error updating load shedding status: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Enqueue an operation for resilient execution
   *
   * @param type Operation type
   * @param params Operation parameters
   * @param callback Function to execute
   * @param options Additional options
   * @returns Operation ID
   */
  async enqueueOperation<T>(
    type: string,
    params: any,
    callback: (params: any) => Promise<T>,
    options: {
      priority?: number;
      maxRetries?: number;
    } = {},
  ): Promise<string> {
    const id = `op_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    this.operationQueue.push({
      id,
      type,
      params,
      callback,
      retries: 0,
      maxRetries: options.maxRetries || 5,
      createdAt: new Date(),
      priority: options.priority || 5, // Default priority (1-10, 1 is highest)
    });

    this.logger.log(
      `Enqueued operation ${id} of type ${type} with priority ${options.priority || 5}`,
    );

    // If we're not in load shedding and not already processing, trigger processing
    if (!this.loadSheddingInfo.active && !this.isProcessingQueue) {
      setImmediate(() => this.processQueue());
    }

    return id;
  }

  /**
   * Process the operation queue
   * Executes operations based on priority and load shedding status
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.operationQueue.length === 0) {
      return;
    }

    // If load shedding is active, only process critical operations
    if (this.loadSheddingInfo.active) {
      const criticalOnly = this.operationQueue.filter((op) => op.priority <= 3);
      if (criticalOnly.length === 0) {
        this.logger.log(
          'Load shedding active, no critical operations to process',
        );
        return;
      }
    }

    this.isProcessingQueue = true;

    try {
      // Sort by priority (lower number = higher priority)
      const sortedQueue = [...this.operationQueue].sort(
        (a, b) => a.priority - b.priority,
      );

      // Process a batch of operations
      const batchSize = this.loadSheddingInfo.active ? 3 : 10; // Process fewer during load shedding
      const batch = sortedQueue.slice(0, batchSize);

      this.logger.log(
        `Processing ${batch.length} operations from queue (${this.operationQueue.length} total)`,
      );

      // Process operations in parallel
      const results = await Promise.allSettled(
        batch.map((op) => this.executeOperation(op)),
      );

      // Remove successful operations from queue
      const completedIds = results
        .map((result, index) =>
          result.status === 'fulfilled' && result.value
            ? batch[index].id
            : null,
        )
        .filter((id): id is string => id !== null);

      this.operationQueue = this.operationQueue.filter(
        (op) => !completedIds.includes(op.id),
      );

      this.logger.log(
        `Completed ${completedIds.length} operations, ${this.operationQueue.length} remaining in queue`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing operation queue: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Execute a single operation with retry logic
   *
   * @param operation Operation to execute
   * @returns Whether the operation completed successfully
   */
  private async executeOperation(
    operation: QueuedOperation<any>,
  ): Promise<boolean> {
    try {
      operation.lastRetryAt = new Date();
      operation.retries++;

      // Execute the operation
      await operation.callback(operation.params);

      this.logger.log(
        `Successfully executed operation ${operation.id} of type ${operation.type}`,
      );
      return true;
    } catch (error) {
      // Log the error
      this.logger.error(
        `Error executing operation ${operation.id} of type ${operation.type}: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Check if we should retry
      if (operation.retries < operation.maxRetries) {
        this.logger.log(
          `Operation ${operation.id} will be retried (${operation.retries}/${operation.maxRetries})`,
        );
        return false; // Keep in queue for retry
      } else {
        this.logger.warn(
          `Operation ${operation.id} failed after ${operation.retries} retries and will be removed from queue`,
        );
        return true; // Remove from queue
      }
    }
  }

  /**
   * Execute an operation with load shedding resilience
   * If load shedding is active, the operation will be queued for later execution
   *
   * @param type Operation type
   * @param params Operation parameters
   * @param callback Function to execute
   * @param options Additional options
   * @returns Operation result or undefined if queued
   */
  async executeWithResilience<T>(
    type: string,
    params: any,
    callback: (params: any) => Promise<T>,
    options: ResilientOperationOptions = {},
  ): Promise<T | undefined> {
    // Check cache first if cache key is provided
    if (options.cacheKey) {
      const cached = this.getFromCache<T>(options.cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for key ${options.cacheKey}`);
        return cached;
      }
    }

    // Check if load shedding is active
    const executeImmediately =
      options.executeImmediatelyIfPossible !== false &&
      (!this.loadSheddingInfo.active || options.priority === 1); // Priority 1 always executes immediately

    if (executeImmediately) {
      try {
        // Execute immediately
        const result = await callback(params);

        // Cache result if cache key is provided
        if (options.cacheKey) {
          this.addToCache(options.cacheKey, result, options.cacheTtlMs);
        }

        return result;
      } catch (error) {
        // If execution fails, queue for retry
        this.logger.warn(
          `Operation ${type} failed with error: ${error instanceof Error ? error.message : String(error)}. Queueing for retry.`,
        );
        await this.enqueueOperation(type, params, callback, {
          priority: options.priority,
          maxRetries: options.maxRetries,
        });
        return undefined;
      }
    } else {
      // Queue for later execution
      await this.enqueueOperation(
        type,
        params,
        async (p) => {
          const result = await callback(p);
          // Cache result if cache key is provided
          if (options.cacheKey) {
            this.addToCache(options.cacheKey, result, options.cacheTtlMs);
          }
          return result;
        },
        {
          priority: options.priority,
          maxRetries: options.maxRetries,
        },
      );

      return undefined;
    }
  }

  /**
   * Execute a batch of operations with load shedding resilience
   * This method processes a collection of items in batches, with retry logic and
   * pauses between batches to avoid overloading systems during load shedding
   *
   * @param items Collection of items to process
   * @param callback Function to execute for each item
   * @param options Batch execution options
   * @returns Information about the batch processing
   */
  async executeBatchWithResilience<T, R>(
    items: T[],
    callback: (item: T) => Promise<R>,
    options: BatchOperationOptions = {},
  ): Promise<BatchOperationResult<T, R>> {
    try {
      // Set default options
      const batchSize = options.batchSize || 10;
      const pauseAfterBatch = options.pauseAfterBatch || 1000;
      const retryCount = options.retryCount || 2;
      const retryDelay = options.retryDelay || 3000;
      const continueOnError = options.continueOnError !== false;

      // Results tracking
      let processed = 0;
      let succeeded = 0;
      let failed = 0;
      const results: Array<{
        success: boolean;
        item: T;
        result?: R;
        error?: Error;
      }> = [];

      // Process in batches
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);

        this.logger.log(
          `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(items.length / batchSize)}`,
        );

        // Check if load shedding is active before each batch
        const loadSheddingStatus = await this.getLoadSheddingInfo();
        if (loadSheddingStatus.active && loadSheddingStatus.stage > 4) {
          // Skip processing during severe load shedding
          this.logger.warn(
            `Pausing batch processing due to load shedding stage ${loadSheddingStatus.stage}`,
          );

          // Wait for some time and then check again
          await new Promise((resolve) => setTimeout(resolve, 60000)); // 1 minute

          // Go back one step in the loop to retry this batch
          i -= batchSize;
          continue;
        }

        // Process each item in the batch
        const batchPromises = batch.map(async (item) => {
          let retries = 0;
          let success = false;
          let result: R | undefined;
          let lastError: Error | undefined;

          // Try with retries
          while (retries <= retryCount && !success) {
            try {
              if (retries > 0) {
                this.logger.log(`Retry ${retries}/${retryCount} for item`);
                // Wait before retry
                await new Promise((resolve) => setTimeout(resolve, retryDelay));
              }

              result = await callback(item);
              success = true;
            } catch (error) {
              lastError =
                error instanceof Error ? error : new Error(String(error));
              this.logger.warn(
                `Error processing item (retry ${retries}/${retryCount}): ${lastError.message}`,
              );
              retries++;
            }
          }

          // Update counters
          processed++;
          if (success) {
            succeeded++;
          } else {
            failed++;
          }

          // Add to results
          return {
            success,
            item,
            result: success ? result : undefined,
            error: success ? undefined : lastError,
          };
        });

        // Wait for all items in the batch to complete
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Check if we should continue after errors
        if (!continueOnError && batchResults.some((r) => !r.success)) {
          this.logger.error(
            'Stopping batch processing due to errors and continueOnError=false',
          );
          break;
        }

        // Pause between batches if not the last batch
        if (i + batchSize < items.length) {
          this.logger.debug(`Pausing for ${pauseAfterBatch}ms between batches`);
          await new Promise((resolve) => setTimeout(resolve, pauseAfterBatch));
        }
      }

      return {
        processed,
        succeeded,
        failed,
        results,
      };
    } catch (error) {
      this.logger.error(
        `Error in batch execution: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get current load shedding information
   *
   * @returns Current load shedding status
   */
  async getLoadSheddingInfo(): Promise<LoadSheddingInfo> {
    return { ...this.loadSheddingInfo };
  }

  /**
   * Get current load shedding status (alias for getLoadSheddingInfo)
   *
   * @returns Current load shedding status
   */
  async getCurrentStatus(): Promise<LoadSheddingInfo> {
    const info = await this.getLoadSheddingInfo();
    // Add currentStage field for backward compatibility
    return {
      ...info,
      currentStage: info.stage,
    };
  }

  /**
   * Check if load shedding is currently active
   *
   * @returns Whether load shedding is active
   */
  async isLoadSheddingActive(): Promise<boolean> {
    return this.loadSheddingInfo.active;
  }

  /**
   * Get current load shedding stage
   *
   * @returns Current load shedding stage (0-8, where 0 means no load shedding)
   */
  async getLoadSheddingStage(): Promise<number> {
    return this.loadSheddingInfo.stage;
  }

  /**
   * Get operation queue statistics
   *
   * @returns Queue statistics
   */
  async getQueueStats(): Promise<{
    totalOperations: number;
    operationsByType: Record<string, number>;
    operationsByPriority: Record<string, number>;
  }> {
    // Count operations by type
    const operationsByType: Record<string, number> = {};
    const operationsByPriority: Record<string, number> = {};

    for (const op of this.operationQueue) {
      operationsByType[op.type] = (operationsByType[op.type] || 0) + 1;
      operationsByPriority[op.priority] =
        (operationsByPriority[op.priority] || 0) + 1;
    }

    return {
      totalOperations: this.operationQueue.length,
      operationsByType,
      operationsByPriority,
    };
  }

  /**
   * Add an item to the cache
   *
   * @param key Cache key
   * @param data Data to cache
   * @param ttlMs Time to live in milliseconds
   */
  private addToCache<T>(key: string, data: T, ttlMs?: number): void {
    const defaultTtlMs = 3600000; // 1 hour
    const expiresAt = new Date(Date.now() + (ttlMs || defaultTtlMs));

    this.localCache.set(key, { data, expiresAt });

    // Clean expired cache entries
    this.cleanCache();
  }

  /**
   * Get an item from the cache
   *
   * @param key Cache key
   * @returns Cached data or undefined if not found or expired
   */
  private getFromCache<T>(key: string): T | undefined {
    const cached = this.localCache.get(key);

    if (!cached) {
      return undefined;
    }

    // Check if expired
    if (cached.expiresAt < new Date()) {
      this.localCache.delete(key);
      return undefined;
    }

    return cached.data as T;
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache(): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    // First collect keys to delete
    this.localCache.forEach((value, key) => {
      if (value.expiresAt < now) {
        keysToDelete.push(key);
      }
    });

    // Then delete them
    keysToDelete.forEach((key) => {
      this.localCache.delete(key);
    });
  }
}
