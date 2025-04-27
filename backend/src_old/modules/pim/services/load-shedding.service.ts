import { Injectable, Logger } from "@nestjs/common";
import { FeatureFlagService } from "@modules/feature-flags";

/**
 * Load shedding schedule information
 */
interface LoadSheddingSchedule {
  /** Whether load shedding is currently active */
  isActive: boolean;
  /** Current load shedding stage (0-8, 0 means no load shedding) */
  stage: number;
  /** Next scheduled load shedding start time */
  nextStart?: Date;
  /** Next scheduled load shedding end time */
  nextEnd?: Date;
  /** Area code for location-specific schedules */
  areaCode?: string;
  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * Queued operation
 */
interface QueuedOperation<T, R> {
  /** Operation type */
  type: string;
  /** Input data */
  data: T;
  /** Operation function */
  operationFn: (item: T) => Promise<R>;
  /** Timestamp when operation was queued */
  queuedAt: Date;
  /** Organization ID */
  organizationId?: string;
  /** Retry count */
  retries: number;
  /** Maximum retries allowed */
  maxRetries: number;
}

/**
 * LoadSheddingService
 *
 * South African market-specific service that handles operations during power outages (load shedding)
 * - Detects load shedding status
 * - Queues operations during outages
 * - Processes queued operations when power returns
 * - Provides adaptation strategies for different load shedding stages
 */
@Injectable()
export class LoadSheddingService {
  private readonly logger = new Logger(LoadSheddingService.name);

  // Default to no load shedding
  private currentStatus: LoadSheddingSchedule = {
    isActive: false,
    stage: 0,
    lastUpdated: new Date(),
  };

  // Organization-specific load shedding schedules
  private organizationSchedules: Map<string, LoadSheddingSchedule> = new Map();

  // Queue for operations during load shedding
  private operationQueue: QueuedOperation<any, any>[] = [];

  // Is the queue processor running
  private isProcessingQueue: boolean = false;

  // Maximum queue size
  private readonly MAX_QUEUE_SIZE = 1000;

  // Queue processing interval (ms)
  private readonly QUEUE_PROCESS_INTERVAL = 60000; // 1 minute

  constructor(private readonly featureFlagService: FeatureFlagService) {
    // Start queue processor
    this.startQueueProcessor();
  }

  /**
   * Check if load shedding is currently active
   * If organization-specific schedule is available, that will be used
   * Otherwise, a global default status will be returned
   *
   * @param organizationId Organization ID (optional)
   * @returns Whether load shedding is active
   */
  async isLoadSheddingActive(organizationId?: string): Promise<boolean> {
    // Check if load shedding resilience is enabled via feature flag
    if (organizationId) {
      const isEnabled = await this.featureFlagService.isEnabled(
        "pim.south-africa.load-shedding-resilience",
        organizationId,
      );

      if (!isEnabled) {
        return false;
      }

      // If organization-specific schedule is available, use it
      if (this.organizationSchedules.has(organizationId)) {
        const orgSchedule = this.organizationSchedules.get(organizationId);
        return orgSchedule.isActive;
      }
    }

    return this.currentStatus.isActive;
  }

  /**
   * Get the current load shedding stage
   *
   * @param organizationId Organization ID (optional)
   * @returns Current load shedding stage (0-8, 0 means no load shedding)
   */
  async getLoadSheddingStage(organizationId?: string): Promise<number> {
    if (organizationId && this.organizationSchedules.has(organizationId)) {
      const orgSchedule = this.organizationSchedules.get(organizationId);
      return orgSchedule.stage;
    }

    return this.currentStatus.stage;
  }

  /**
   * Queue an operation to be executed when load shedding ends
   *
   * @param type Operation type identifier
   * @param data Operation input data
   * @param operationFn Function to execute with the data
   * @param organizationId Organization ID (optional)
   * @returns True if operation was queued successfully
   */
  async queueOperations<T, R>(
    type: string,
    data: T[],
    operationFn: (item: T) => Promise<R>,
    organizationId?: string,
  ): Promise<boolean> {
    // Check if queue is full
    if (this.operationQueue.length >= this.MAX_QUEUE_SIZE) {
      this.logger.warn(`Operation queue is full, cannot queue more operations`);
      return false;
    }

    // Add operations to queue
    for (const item of data) {
      this.operationQueue.push({
        type,
        data: item,
        operationFn,
        queuedAt: new Date(),
        organizationId,
        retries: 0,
        maxRetries: 3,
      });
    }

    this.logger.log(
      `Queued ${data.length} operations of type ${type} for execution after load shedding`,
    );
    return true;
  }

  /**
   * Update load shedding status
   *
   * @param isActive Whether load shedding is active
   * @param stage Current load shedding stage
   * @param nextStart Next scheduled start time
   * @param nextEnd Next scheduled end time
   * @param areaCode Area code for location-specific schedules
   */
  updateLoadSheddingStatus(
    isActive: boolean,
    stage: number = 0,
    nextStart?: Date,
    nextEnd?: Date,
    areaCode?: string,
  ): void {
    const wasActive = this.currentStatus.isActive;

    this.currentStatus = {
      isActive,
      stage,
      nextStart,
      nextEnd,
      areaCode,
      lastUpdated: new Date(),
    };

    this.logger.log(
      `Updated load shedding status: Stage ${stage}, Active: ${isActive}`,
    );

    // If load shedding ended, start processing the queue
    if (wasActive && !isActive) {
      this.processQueue();
    }
  }

  /**
   * Update organization-specific load shedding schedule
   *
   * @param organizationId Organization ID
   * @param isActive Whether load shedding is active
   * @param stage Current load shedding stage
   * @param nextStart Next scheduled start time
   * @param nextEnd Next scheduled end time
   * @param areaCode Area code for location-specific schedules
   */
  updateOrganizationLoadSheddingSchedule(
    organizationId: string,
    isActive: boolean,
    stage: number = 0,
    nextStart?: Date,
    nextEnd?: Date,
    areaCode?: string,
  ): void {
    const wasActive =
      this.organizationSchedules.has(organizationId) &&
      this.organizationSchedules.get(organizationId).isActive;

    this.organizationSchedules.set(organizationId, {
      isActive,
      stage,
      nextStart,
      nextEnd,
      areaCode,
      lastUpdated: new Date(),
    });

    this.logger.log(
      `Updated load shedding schedule for organization ${organizationId}: Stage ${stage}, Active: ${isActive}`,
    );

    // If load shedding ended for this organization, process its queued operations
    if (wasActive && !isActive) {
      this.processOrganizationQueue(organizationId);
    }
  }

  /**
   * Get adaptation strategies based on current load shedding conditions
   *
   * @param organizationId Organization ID (optional)
   * @returns Adaptation strategies for the current load shedding stage
   */
  async getAdaptationStrategies(organizationId?: string): Promise<{
    reducedConcurrency: number;
    enableBatchProcessing: boolean;
    lowPowerMode: boolean;
    offlineCapability: boolean;
    extendedTimeouts: boolean;
    prioritizeEssential: boolean;
  }> {
    const stage = await this.getLoadSheddingStage(organizationId);

    // Default strategies
    const strategies = {
      reducedConcurrency: 5, // Default concurrency
      enableBatchProcessing: false,
      lowPowerMode: false,
      offlineCapability: false,
      extendedTimeouts: false,
      prioritizeEssential: false,
    };

    // Adjust strategies based on load shedding stage
    if (stage >= 1) {
      strategies.reducedConcurrency = Math.max(1, 5 - stage); // Reduce concurrency as stage increases
      strategies.enableBatchProcessing = true;
    }

    if (stage >= 2) {
      strategies.extendedTimeouts = true;
    }

    if (stage >= 4) {
      strategies.lowPowerMode = true;
      strategies.offlineCapability = true;
    }

    if (stage >= 6) {
      strategies.prioritizeEssential = true;
    }

    return strategies;
  }

  /**
   * Start the queue processor that periodically checks and processes queued operations
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (
        !this.currentStatus.isActive &&
        !this.isProcessingQueue &&
        this.operationQueue.length > 0
      ) {
        this.processQueue();
      }
    }, this.QUEUE_PROCESS_INTERVAL);
  }

  /**
   * Process all queued operations
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    this.logger.log(
      `Processing ${this.operationQueue.length} queued operations`,
    );

    const queueCopy = [...this.operationQueue];
    this.operationQueue = [];

    let successCount = 0;
    let failureCount = 0;
    const failedOperations: QueuedOperation<any, any>[] = [];

    for (const operation of queueCopy) {
      try {
        // Skip if this organization is still in load shedding
        if (
          operation.organizationId &&
          this.organizationSchedules.has(operation.organizationId) &&
          this.organizationSchedules.get(operation.organizationId).isActive
        ) {
          failedOperations.push(operation);
          continue;
        }

        // Execute the operation
        await operation.operationFn(operation.data);
        successCount++;
      } catch (error) {
        this.logger.error(
          `Error processing queued operation: ${error.message}`,
          error.stack,
        );

        // Add to retry queue if retries are available
        if (operation.retries < operation.maxRetries) {
          operation.retries++;
          failedOperations.push(operation);
        } else {
          failureCount++;
        }
      }
    }

    // Re-queue failed operations
    if (failedOperations.length > 0) {
      this.operationQueue.push(...failedOperations);
    }

    this.logger.log(
      `Queue processing complete. Success: ${successCount}, Failed: ${failureCount}, Requeued: ${failedOperations.length}`,
    );
    this.isProcessingQueue = false;
  }

  /**
   * Process queued operations for a specific organization
   *
   * @param organizationId Organization ID
   */
  private async processOrganizationQueue(
    organizationId: string,
  ): Promise<void> {
    if (this.isProcessingQueue) {
      return;
    }

    // Filter operations for this organization
    const orgOperations = this.operationQueue.filter(
      (op) => op.organizationId === organizationId,
    );

    if (orgOperations.length === 0) {
      return;
    }

    this.logger.log(
      `Processing ${orgOperations.length} queued operations for organization ${organizationId}`,
    );

    // Remove these operations from the main queue
    this.operationQueue = this.operationQueue.filter(
      (op) => op.organizationId !== organizationId,
    );

    let successCount = 0;
    let failureCount = 0;
    const failedOperations: QueuedOperation<any, any>[] = [];

    for (const operation of orgOperations) {
      try {
        // Execute the operation
        await operation.operationFn(operation.data);
        successCount++;
      } catch (error) {
        this.logger.error(
          `Error processing queued operation for organization ${organizationId}: ${error.message}`,
          error.stack,
        );

        // Add to retry queue if retries are available
        if (operation.retries < operation.maxRetries) {
          operation.retries++;
          failedOperations.push(operation);
        } else {
          failureCount++;
        }
      }
    }

    // Re-queue failed operations
    if (failedOperations.length > 0) {
      this.operationQueue.push(...failedOperations);
    }

    this.logger.log(
      `Organization queue processing complete. Success: ${successCount}, Failed: ${failureCount}, Requeued: ${failedOperations.length}`,
    );
  }
}
