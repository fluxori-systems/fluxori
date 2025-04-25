import { Injectable, Logger } from '@nestjs/common';

import { NetworkStatusService } from '../../../../common/utils/network-status.service';
import { FeatureFlagService } from '../../../../modules/feature-flags/services/feature-flag.service';
import { OperationResult } from '../../interfaces/types';
import { LoadSheddingService } from '../load-shedding.service';

/**
 * Bulk Operation configuration options
 */
export interface BulkOperationOptions {
  /** Maximum number of operations to process in parallel */
  maxConcurrency?: number;
  /** Chunk size for batched operations */
  chunkSize?: number;
  /** Timeout for each operation in milliseconds */
  operationTimeout?: number;
  /** Whether to continue on errors */
  continueOnError?: boolean;
  /** Whether to enable automatic retry on network failures */
  enableRetry?: boolean;
  /** Maximum number of retries per operation */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
  /** Whether to enable low-bandwidth mode */
  lowBandwidthMode?: boolean;
  /** Whether to enable load shedding resilience */
  loadSheddingResilience?: boolean;
}

/**
 * Bulk Operation result statistics
 */
export interface BulkOperationStats {
  /** Total number of operations processed */
  totalOperations: number;
  /** Number of successful operations */
  successCount: number;
  /** Number of failed operations */
  failureCount: number;
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Network conditions during processing */
  networkConditions: {
    /** Connection type */
    connectionType: string;
    /** Download speed in Mbps */
    downloadSpeed?: number;
    /** Upload speed in Mbps */
    uploadSpeed?: number;
    /** Latency in milliseconds */
    latency?: number;
    /** Whether load shedding was active */
    loadSheddingActive: boolean;
  };
}

/**
 * BulkOperationsService
 *
 * Service for optimized bulk operations with South African market optimizations:
 * - Network-aware processing with adaptive concurrency
 * - Load shedding resilience with operation queueing
 * - Bandwidth-efficient chunking
 * - Automatic retries with backoff
 */
@Injectable()
export class BulkOperationsService {
  private readonly logger = new Logger(BulkOperationsService.name);

  // Default options optimized for South African conditions
  private readonly defaultOptions: BulkOperationOptions = {
    maxConcurrency: 5,
    chunkSize: 20,
    operationTimeout: 30000,
    continueOnError: true,
    enableRetry: true,
    maxRetries: 3,
    retryDelay: 1000,
    lowBandwidthMode: false,
    loadSheddingResilience: true,
  };

  constructor(
    private readonly networkStatusService: NetworkStatusService,
    private readonly loadSheddingService: LoadSheddingService,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  /**
   * Executes a batch of operations with optimized concurrency and resilience
   *
   * @param operations Array of operations to process
   * @param operationFn Function to execute for each operation
   * @param options Bulk operation options
   * @returns Results of all operations with statistics
   */
  async executeBulk<T, R>(
    operations: T[],
    operationFn: (item: T) => Promise<R>,
    options: Partial<BulkOperationOptions> = {},
  ): Promise<{ results: OperationResult<R>[]; stats: BulkOperationStats }> {
    const startTime = Date.now();
    const mergedOptions = { ...this.defaultOptions, ...options };
    const results: OperationResult<R>[] = [];

    // Get current network conditions
    const networkStatus = await this.networkStatusService.getNetworkStatus();
    const isLoadSheddingActive =
      await this.loadSheddingService.isLoadSheddingActive();

    // Adjust concurrency based on network conditions
    let effectiveConcurrency = this.calculateEffectiveConcurrency(
      mergedOptions.maxConcurrency,
      networkStatus,
      isLoadSheddingActive,
    );

    this.logger.log(
      `Starting bulk operation with ${operations.length} items. ` +
        `Network: ${networkStatus.connectionType}, Load shedding: ${isLoadSheddingActive}, ` +
        `Effective concurrency: ${effectiveConcurrency}`,
    );

    // Process in chunks for better memory management
    const chunks = this.chunkArray(operations, mergedOptions.chunkSize);

    for (const chunk of chunks) {
      // If load shedding becomes active during processing, queue operations
      if (
        !isLoadSheddingActive &&
        (await this.loadSheddingService.isLoadSheddingActive())
      ) {
        if (mergedOptions.loadSheddingResilience) {
          this.logger.log(
            'Load shedding detected during operation, queueing remaining operations',
          );
          const remainingOps = operations.slice(results.length);
          await this.loadSheddingService.queueOperations(
            'bulk-operations',
            remainingOps,
            operationFn,
          );
          break;
        }
      }

      // Process chunk with controlled concurrency
      const chunkResults = await this.processChunkWithConcurrency(
        chunk,
        operationFn,
        effectiveConcurrency,
        mergedOptions,
      );

      results.push(...chunkResults);

      // Adaptively adjust concurrency based on results if needed
      if (this.shouldAdjustConcurrency(chunkResults)) {
        effectiveConcurrency = Math.max(
          1,
          Math.floor(effectiveConcurrency * 0.7),
        );
        this.logger.log(
          `Reducing concurrency due to errors. New concurrency: ${effectiveConcurrency}`,
        );
      }
    }

    // Calculate statistics
    const endTime = Date.now();
    const successCount = results.filter((r) => r.success).length;
    const stats: BulkOperationStats = {
      totalOperations: results.length,
      successCount,
      failureCount: results.length - successCount,
      processingTimeMs: endTime - startTime,
      networkConditions: {
        connectionType: networkStatus.connectionType,
        downloadSpeed: networkStatus.downloadSpeed,
        uploadSpeed: networkStatus.uploadSpeed,
        latency: networkStatus.latency,
        loadSheddingActive: isLoadSheddingActive,
      },
    };

    this.logger.log(
      `Bulk operation completed. Success: ${successCount}/${results.length}, ` +
        `Time: ${stats.processingTimeMs}ms`,
    );

    return { results, stats };
  }

  /**
   * Process a chunk of operations with controlled concurrency
   *
   * @param chunk Array of operations to process
   * @param operationFn Function to execute for each operation
   * @param concurrency Maximum number of concurrent operations
   * @param options Bulk operation options
   * @returns Results of all operations in the chunk
   */
  private async processChunkWithConcurrency<T, R>(
    chunk: T[],
    operationFn: (item: T) => Promise<R>,
    concurrency: number,
    options: BulkOperationOptions,
  ): Promise<OperationResult<R>[]> {
    const results: OperationResult<R>[] = [];
    const activePromises: Promise<void>[] = [];

    for (const item of chunk) {
      // Wait if we've reached max concurrency
      if (activePromises.length >= concurrency) {
        await Promise.race(activePromises);
        // Clean up completed promises
        const activePromisesCopy = [...activePromises];
        for (let i = 0; i < activePromisesCopy.length; i++) {
          const promise = activePromisesCopy[i];
          if (
            promise.hasOwnProperty('$$settled') &&
            (promise as any).$$settled
          ) {
            activePromises.splice(activePromises.indexOf(promise), 1);
          }
        }
      }

      // Create and start a new operation promise
      const operationPromise = this.executeOperationWithRetry(
        item,
        operationFn,
        options,
      ).then((result) => {
        results.push(result);
        // Mark the promise as settled for cleanup
        (operationPromise as any).$$settled = true;
      });

      activePromises.push(operationPromise);
    }

    // Wait for all remaining operations to complete
    await Promise.all(activePromises);

    return results;
  }

  /**
   * Execute a single operation with retry logic
   *
   * @param item Operation input
   * @param operationFn Function to execute
   * @param options Bulk operation options
   * @returns Operation result
   */
  private async executeOperationWithRetry<T, R>(
    item: T,
    operationFn: (item: T) => Promise<R>,
    options: BulkOperationOptions,
  ): Promise<OperationResult<R>> {
    let retries = 0;

    while (true) {
      try {
        // Execute the operation with timeout
        const result = await this.executeWithTimeout(
          () => operationFn(item),
          options.operationTimeout,
        );

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        const isNetworkError = this.isNetworkRelatedError(error);
        const canRetry =
          options.enableRetry &&
          retries < options.maxRetries &&
          (isNetworkError || this.isRetryableError(error));

        if (canRetry) {
          retries++;
          this.logger.debug(
            `Retrying operation (attempt ${retries}/${options.maxRetries}). Error: ${error.message}`,
          );

          // Exponential backoff for retries
          const delay = options.retryDelay * Math.pow(2, retries - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        return {
          success: false,
          error: error.message,
          errorCode: error.code || error.status || 'UNKNOWN_ERROR',
        };
      }
    }
  }

  /**
   * Execute a function with a timeout
   *
   * @param fn Function to execute
   * @param timeoutMs Timeout in milliseconds
   * @returns Function result
   */
  private async executeWithTimeout<R>(
    fn: () => Promise<R>,
    timeoutMs: number,
  ): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Operation timed out'));
      }, timeoutMs);

      fn().then(
        (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
      );
    });
  }

  /**
   * Calculate effective concurrency based on network conditions and load shedding status
   *
   * @param baseConcurrency Base concurrency value
   * @param networkStatus Current network status
   * @param isLoadSheddingActive Whether load shedding is active
   * @returns Effective concurrency
   */
  private calculateEffectiveConcurrency(
    baseConcurrency: number,
    networkStatus: any,
    isLoadSheddingActive: boolean,
  ): number {
    let concurrency = baseConcurrency;

    // Reduce concurrency during load shedding
    if (isLoadSheddingActive) {
      concurrency = Math.min(concurrency, 3);
    }

    // Adjust based on connection type
    switch (networkStatus.connectionType) {
      case 'offline':
        concurrency = 1; // Minimum for offline operations
        break;
      case '2g':
        concurrency = Math.min(concurrency, 2);
        break;
      case '3g':
        concurrency = Math.min(concurrency, 3);
        break;
      case '4g':
        // Default is good for 4G
        break;
      case 'wifi':
        // Can increase for WiFi if network speed is good
        if (networkStatus.downloadSpeed > 10 && !isLoadSheddingActive) {
          concurrency = Math.min(10, concurrency + 2);
        }
        break;
    }

    // Further adjust based on measured download speed if available
    if (networkStatus.downloadSpeed !== undefined) {
      if (networkStatus.downloadSpeed < 1) {
        concurrency = Math.min(concurrency, 2);
      } else if (networkStatus.downloadSpeed < 5) {
        concurrency = Math.min(concurrency, 3);
      }
    }

    return Math.max(1, Math.floor(concurrency));
  }

  /**
   * Check if we should adjust concurrency based on operation results
   *
   * @param results Recent operation results
   * @returns Whether to adjust concurrency
   */
  private shouldAdjustConcurrency<R>(results: OperationResult<R>[]): boolean {
    if (results.length === 0) return false;

    // If more than 30% of operations failed, reduce concurrency
    const failureCount = results.filter((r) => !r.success).length;
    const failureRate = failureCount / results.length;

    return failureRate > 0.3;
  }

  /**
   * Chunk an array into smaller arrays
   *
   * @param array Array to chunk
   * @param size Chunk size
   * @returns Array of chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Check if an error is network-related
   *
   * @param error Error to check
   * @returns Whether the error is network-related
   */
  private isNetworkRelatedError(error: any): boolean {
    const errorMessage = (error.message || '').toLowerCase();
    const networkErrorPatterns = [
      'network',
      'connection',
      'offline',
      'timeout',
      'unreachable',
      'econnrefused',
      'econnreset',
      'enotfound',
      'etimedout',
    ];

    return networkErrorPatterns.some((pattern) =>
      errorMessage.includes(pattern),
    );
  }

  /**
   * Check if an error is retryable
   *
   * @param error Error to check
   * @returns Whether the error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Retry on 5xx errors, throttling, and temporary failures
    const status = error.status || error.statusCode;
    if (status >= 500 && status < 600) {
      return true;
    }

    if (status === 429) {
      return true; // Too Many Requests
    }

    // Check error codes that indicate temporary failures
    const retryableCodes = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'EPIPE',
      'RESOURCE_EXHAUSTED',
      'INTERNAL',
      'UNAVAILABLE',
      'DEADLINE_EXCEEDED',
    ];

    return retryableCodes.includes(error.code);
  }
}
