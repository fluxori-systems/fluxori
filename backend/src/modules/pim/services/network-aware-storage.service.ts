/**
 * Network-Aware Storage Service for PIM Module
 * 
 * This service extends the standard storage service with network awareness
 * specifically optimized for South African market conditions, including
 * variable connection quality and load shedding resilience.
 */

import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService, STORAGE_SERVICE } from '../../../common/storage/storage.interface';
import { FeatureFlagService } from '../../feature-flags/services/feature-flag.service';
import { MarketContextService } from './market-context.service';
import { NetworkQualityInfo } from '../interfaces/types';
import { CompressionQuality, ResizeOption } from '../models/image.model';
import { ImageUploadOptions } from '../interfaces/image-upload-options.interface';

/**
 * Queue entry for pending operations during network issues
 */
interface QueuedOperation {
  id: string;
  operation: 'upload' | 'delete' | 'update';
  params: any;
  retries: number;
  lastRetry?: Date;
  createdAt: Date;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Network-Aware Storage Service
 * 
 * Provides storage functionality with adaptations for variable network quality
 * and resilience during load shedding incidents.
 */
@Injectable()
export class NetworkAwareStorageService implements OnModuleInit {
  private readonly logger = new Logger(NetworkAwareStorageService.name);
  private operationQueue: QueuedOperation[] = [];
  private isProcessingQueue = false;
  private networkStatus: NetworkQualityInfo = {
    connectionType: 'unknown',
    connectionQuality: 'medium',
    quality: 'medium'
  };
  private loadSheddingActive = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly marketContextService: MarketContextService,
  ) {}

  /**
   * Initialize the service and start operation queue processing
   */
  async onModuleInit(): Promise<void> {
    // Check if load shedding resilience is enabled
    const isLoadSheddingResilience = await this.featureFlagService.isEnabled('pim.loadSheddingResilience', {
      attributes: { defaultValue: true }
    });

    if (isLoadSheddingResilience) {
      this.logger.log('Load shedding resilience enabled for NetworkAwareStorageService');
      
      // Start periodic processing of the operation queue
      const processingIntervalMs = this.configService.get<number>('QUEUE_PROCESSING_INTERVAL_MS') || 30000; // 30 seconds default
      this.processingInterval = setInterval(() => this.processQueue(), processingIntervalMs);
      
      // Periodic check of network status
      const networkCheckIntervalMs = this.configService.get<number>('NETWORK_CHECK_INTERVAL_MS') || 60000; // 1 minute default
      setInterval(() => this.updateNetworkStatus(), networkCheckIntervalMs);
      
      // Initial network status check
      await this.updateNetworkStatus();
    } else {
      this.logger.log('Load shedding resilience disabled for NetworkAwareStorageService');
    }
  }

  /**
   * Update the current network status
   * In a real implementation, this would detect actual network conditions
   * For now, we'll use a placeholder implementation
   */
  private async updateNetworkStatus(): Promise<void> {
    try {
      // Simulate network status check
      // In a real implementation, this would:
      // 1. Check actual connection quality
      // 2. Check for load shedding (e.g., via an API or service)
      // 3. Update internal state based on findings
      
      // For demonstration, we'll use a simplified approach
      const simulatedNetworkStatus: NetworkQualityInfo = {
        connectionType: 'wifi', // or 'cellular', 'ethernet'
        connectionQuality: 'medium', // 'high', 'medium', 'low'
        quality: 'medium', // For backward compatibility
        estimatedBandwidth: 2500, // Kbps
        latency: 200, // ms
        // We would get this from an external service in production
        loadSheddingStage: 0, // 0-8, where 0 means no load shedding
      };

      // Update internal network status
      this.networkStatus = simulatedNetworkStatus;
      
      // Update load shedding flag
      this.loadSheddingActive = (this.networkStatus.loadSheddingStage || 0) > 0;
      
      // Log current status (only when there's a change or every 5 minutes)
      this.logger.debug(`Network status: ${JSON.stringify(this.networkStatus)}`);
      
      // If not load shedding and we have queued operations, process the queue
      if (!this.loadSheddingActive && this.operationQueue.length > 0 && !this.isProcessingQueue) {
        await this.processQueue();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error updating network status: ${errorMessage}`, errorStack);
    }
  }

  /**
   * Process the operation queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Sort by priority and then by age
      const sortedQueue = [...this.operationQueue].sort((a, b) => {
        if (a.priority !== b.priority) {
          const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      // Process up to 5 operations at a time
      const batch = sortedQueue.slice(0, 5);
      const processingResults = await Promise.allSettled(
        batch.map(entry => this.processQueueEntry(entry))
      );

      // Remove successfully processed operations
      for (let i = 0; i < batch.length; i++) {
        const result = processingResults[i];
        if (result.status === 'fulfilled' && result.value) {
          this.operationQueue = this.operationQueue.filter(entry => entry.id !== batch[i].id);
        }
      }

      this.logger.log(`Processed ${batch.length} queued operations, ${this.operationQueue.length} remaining`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error processing operation queue: ${errorMessage}`, errorStack);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Process a single queued operation
   * 
   * @param entry The queue entry to process
   * @returns Whether the operation was successful
   */
  private async processQueueEntry(entry: QueuedOperation): Promise<boolean> {
    try {
      // Update retry information
      entry.retries += 1;
      entry.lastRetry = new Date();

      // Execute the operation based on type
      switch (entry.operation) {
        case 'upload':
          await this.storageService.uploadFile(
            entry.params.file,
            entry.params.filePath,
            entry.params.options
          );
          break;
        case 'delete':
          await this.storageService.deleteFile(entry.params.filePath);
          break;
        case 'update':
          // Handle update operation if needed
          break;
      }

      this.logger.log(`Successfully processed queued operation ${entry.id} (${entry.operation})`);
      return true;
    } catch (error) {
      // Check if we should retry
      const maxRetries = 5;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (entry.retries < maxRetries) {
        this.logger.warn(`Failed to process operation ${entry.id}, will retry (${entry.retries}/${maxRetries}): ${errorMessage}`);
        return false;
      } else {
        this.logger.error(`Failed to process operation ${entry.id} after ${entry.retries} retries: ${errorMessage}`);
        // Remove from queue to avoid infinite retries
        return true;
      }
    }
  }

  /**
   * Queue an operation for later execution
   * 
   * @param operation Operation type
   * @param params Operation parameters
   * @param priority Operation priority
   * @returns Operation ID
   */
  private queueOperation(
    operation: 'upload' | 'delete' | 'update',
    params: any,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): string {
    const id = `op-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    this.operationQueue.push({
      id,
      operation,
      params,
      retries: 0,
      createdAt: new Date(),
      priority
    });
    
    this.logger.log(`Queued ${operation} operation ${id} with ${priority} priority`);
    
    return id;
  }

  /**
   * Upload a file to storage with network awareness
   * 
   * @param file File buffer to upload
   * @param filePath Path to store the file
   * @param options Upload options
   * @returns Public URL of the uploaded file
   */
  async uploadFile(
    file: Buffer,
    filePath: string,
    options?: {
      contentType?: string;
      metadata?: Record<string, string>;
      isPublic?: boolean;
      networkQuality?: NetworkQualityInfo;
      enableLoadSheddingResilience?: boolean;
    }
  ): Promise<string> {
    // Check if we have a network issue or load shedding
    if ((this.loadSheddingActive || this.networkStatus.connectionQuality === 'low') && 
        (options?.enableLoadSheddingResilience !== false)) {
      
      // Queue the operation for later
      this.queueOperation('upload', { file, filePath, options }, 'medium');
      
      // Return a placeholder URL
      const bucketName = this.configService.get<string>('GCS_BUCKET_NAME') || 'fluxori-uploads';
      return `https://storage.googleapis.com/${bucketName}/${filePath}`;
    }
    
    // If network is healthy, process immediately
    try {
      return await this.storageService.uploadFile(file, filePath, {
        contentType: options?.contentType,
        metadata: options?.metadata,
        isPublic: options?.isPublic
      });
    } catch (error) {
      // On error, queue for retry if load shedding resilience is enabled
      if (options?.enableLoadSheddingResilience !== false) {
        this.queueOperation('upload', { file, filePath, options }, 'medium');
        const bucketName = this.configService.get<string>('GCS_BUCKET_NAME') || 'fluxori-uploads';
        return `https://storage.googleapis.com/${bucketName}/${filePath}`;
      } else {
        throw error;
      }
    }
  }

  /**
   * Delete a file with network resilience
   * 
   * @param filePath Path of the file to delete
   * @param options Delete options
   */
  async deleteFile(
    filePath: string,
    options?: {
      enableLoadSheddingResilience?: boolean;
    }
  ): Promise<void> {
    // Check if we have a network issue or load shedding
    if ((this.loadSheddingActive || this.networkStatus.connectionQuality === 'low') && 
        (options?.enableLoadSheddingResilience !== false)) {
      
      // Queue the operation for later
      this.queueOperation('delete', { filePath }, 'low');
      return;
    }
    
    // If network is healthy, process immediately
    try {
      await this.storageService.deleteFile(filePath);
    } catch (error) {
      // On error, queue for retry if load shedding resilience is enabled
      if (options?.enableLoadSheddingResilience !== false) {
        this.queueOperation('delete', { filePath }, 'low');
      } else {
        throw error;
      }
    }
  }

  /**
   * Get network-optimized image options based on current conditions
   * 
   * @param originalOptions Original image options
   * @returns Network-optimized image options
   */
  async getNetworkOptimizedImageOptions(originalOptions: ImageUploadOptions): Promise<ImageUploadOptions> {
    // Start with original options
    const optimizedOptions: ImageUploadOptions = { ...originalOptions };
    
    // Use either provided network quality or current detected quality
    const networkQuality = originalOptions.networkQuality || this.networkStatus;
    
    // Get market context to check feature availability
    const organizationId = originalOptions.metadata?.organizationId;
    if (!organizationId) {
      return optimizedOptions;
    }
    
    const marketContext = await this.marketContextService.getMarketContext(organizationId);
    const isNetworkAwareEnabled = marketContext.features.networkAwareComponents;
    
    // If network awareness is not enabled, return original options
    if (!isNetworkAwareEnabled) {
      return optimizedOptions;
    }
    
    // Adjust options based on network quality
    const connectionQuality = networkQuality.connectionQuality || networkQuality.quality;
    
    if (connectionQuality === 'low' || this.loadSheddingActive) {
      // For poor connections or during load shedding
      optimizedOptions.compressionQuality = CompressionQuality.LOW;
      optimizedOptions.generateThumbnails = false;
      
      // Handle resize option safely
      if (originalOptions.resizeOption === ResizeOption.LARGE) {
        optimizedOptions.resizeOption = ResizeOption.MEDIUM;
      }
      
      optimizedOptions.optimizeForLowBandwidth = true;
      optimizedOptions.enableLoadSheddingResilience = true;
    } else if (connectionQuality === 'medium') {
      // For medium connections
      optimizedOptions.compressionQuality = CompressionQuality.MEDIUM;
      optimizedOptions.generateThumbnails = true;
      optimizedOptions.optimizeForLowBandwidth = true;
    } else {
      // For good connections
      // Use original settings or defaults
      optimizedOptions.compressionQuality = optimizedOptions.compressionQuality || CompressionQuality.ADAPTIVE;
      optimizedOptions.generateThumbnails = optimizedOptions.generateThumbnails !== false;
      optimizedOptions.optimizeForLowBandwidth = optimizedOptions.optimizeForLowBandwidth !== false;
    }
    
    return optimizedOptions;
  }

  /**
   * Get current network status
   * 
   * @returns Current network quality information
   */
  async getCurrentNetworkStatus(): Promise<NetworkQualityInfo> {
    return { ...this.networkStatus };
  }

  /**
   * Check if load shedding is currently active
   * 
   * @returns Whether load shedding is active
   */
  async isLoadSheddingActive(): Promise<boolean> {
    return this.loadSheddingActive;
  }

  /**
   * Get network quality information
   * 
   * @returns Network quality details
   */
  getNetworkQuality(): NetworkQualityInfo {
    // Make sure to include quality field for backward compatibility
    return { 
      ...this.networkStatus,
      quality: this.networkStatus.connectionQuality 
    };
  }
}