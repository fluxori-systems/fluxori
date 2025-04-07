import { Logger } from '@nestjs/common';
import { 
  Firestore, 
  Transaction, 
  WriteBatch
} from '@google-cloud/firestore';
import { 
  FirestoreBatchWriteResult,
  TransactionExecutionOptions
} from '../../../types/google-cloud.types';

/**
 * Repository Transactions
 * 
 * Handles transaction and batch operations for Firestore
 */
export class RepositoryTransactions {
  private readonly logger: Logger;
  private readonly firestore: Firestore;
  private readonly collectionName: string;
  
  // Default settings
  private readonly defaultMaxRetries = 5;
  private readonly defaultRetryDelayMs = 500;
  private readonly defaultBatchSize = 500;
  private readonly defaultTimeoutMs = 60000; // 1 minute
  
  constructor(
    firestore: Firestore,
    collectionName: string,
    logger?: Logger,
  ) {
    this.firestore = firestore;
    this.collectionName = collectionName;
    this.logger = logger || new Logger(`${collectionName}Transactions`);
  }
  
  /**
   * Execute a function within a Firestore transaction with retry logic
   * @param updateFunction Function that uses the transaction
   * @param options Transaction options
   * @returns Result of the transaction function
   */
  async withTransaction<T>(
    updateFunction: (transaction: Transaction) => Promise<T>,
    options: TransactionExecutionOptions = {},
  ): Promise<T> {
    const maxAttempts = options.maxAttempts || this.defaultMaxRetries;
    const retryDelayMs = options.retryDelayMs || this.defaultRetryDelayMs;
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
    
    let lastError: Error | null = null;
    
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Transaction timed out after ${timeoutMs}ms in collection "${this.collectionName}"`));
      }, timeoutMs);
    });
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Set up transaction options
        const transactionOptions: any = {};
        if (options.readOnly) {
          transactionOptions.readOnly = true;
        }
        
        // Run the transaction with the race against timeout
        const result = await Promise.race([
          this.firestore.runTransaction(async (tx) => {
            return await updateFunction(tx);
          }, transactionOptions),
          timeoutPromise
        ]);
        
        // Transaction succeeded
        return result;
      } catch (error) {
        // Store the error for possible re-throw
        lastError = error as Error;
        
        // Check if retry is appropriate (only retry if it's a retryable error)
        if (attempt < maxAttempts && this.isRetryableError(error)) {
          // Calculate exponential backoff with jitter
          const baseDelay = retryDelayMs * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 100;
          const delay = Math.min(baseDelay + jitter, 10000); // Cap at 10 seconds
          
          this.logger.warn(
            `Transaction attempt ${attempt} failed, retrying in ${delay}ms: ${(error as Error).message}`,
          );
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Last attempt or non-retryable error
          this.logger.error(
            `Transaction failed after ${attempt} attempts in collection "${this.collectionName}": ${(error as Error).message}`,
            (error as Error).stack,
          );
          
          throw error;
        }
      }
    }
    
    // This should not be reached due to the throw in the last iteration,
    // but TypeScript requires a return statement
    throw lastError || new Error(`Transaction failed in collection "${this.collectionName}"`);
  }
  
  /**
   * Execute a batch operation with automatic chunking
   * @param batchFunction Function to apply to the batch
   * @returns Batch operation result
   */
  async withBatch(batchFunction: (batch: WriteBatch) => void): Promise<FirestoreBatchWriteResult> {
    try {
      const batch = this.firestore.batch();
      
      // Apply the function to the batch
      batchFunction(batch);
      
      // Commit the batch
      await batch.commit();
      
      return {
        status: 'success',
        successCount: 1,
        errorCount: 0,
      };
    } catch (error) {
      this.logger.error(
        `Batch operation failed in collection "${this.collectionName}": ${(error as Error).message}`,
        (error as Error).stack,
      );
      
      return {
        status: 'error',
        successCount: 0,
        errorCount: 1,
        errors: [
          {
            index: 0,
            error: error as Error,
          },
        ],
      };
    }
  }
  
  /**
   * Execute batch operations over an array of items
   * @param items Array of items to process
   * @param batchSize Maximum items per batch (default: 500)
   * @param processFn Function to process each item in the batch
   * @returns Batch execution result
   */
  async executeBatched<T>(
    items: T[],
    batchSize: number = this.defaultBatchSize,
    processFn: (item: T, batch: WriteBatch, index: number) => void,
  ): Promise<FirestoreBatchWriteResult> {
    if (items.length === 0) {
      return {
        status: 'success',
        successCount: 0,
        errorCount: 0,
      };
    }
    
    const result: FirestoreBatchWriteResult = {
      status: 'success',
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
    
    // Process items in batches
    for (let i = 0; i < items.length; i += batchSize) {
      // Get current batch of items
      const batch = this.firestore.batch();
      const batchItems = items.slice(i, i + batchSize);
      let batchError = false;
      
      // Process each item in the batch
      for (let j = 0; j < batchItems.length; j++) {
        const index = i + j;
        try {
          processFn(batchItems[j], batch, index);
        } catch (error) {
          batchError = true;
          result.errorCount++;
          result.errors!.push({
            index,
            error: error as Error,
          });
        }
      }
      
      // Skip committing if all items in the batch failed
      if (batchError && result.errorCount === batchItems.length) {
        continue;
      }
      
      // Commit the batch and handle any errors
      try {
        await batch.commit();
        result.successCount += batchItems.length - (result.errors?.filter(e => e.index >= i && e.index < i + batchItems.length).length || 0);
      } catch (error) {
        // If the batch commit fails, mark all items as failed
        result.errorCount += batchItems.length - (result.errors?.filter(e => e.index >= i && e.index < i + batchItems.length).length || 0);
        
        for (let j = 0; j < batchItems.length; j++) {
          const index = i + j;
          // Only add an error if this item hasn't already been marked as failed
          if (!result.errors?.some(e => e.index === index)) {
            result.errors!.push({
              index,
              error: error as Error,
            });
          }
        }
      }
    }
    
    // Determine overall status
    if (result.errorCount > 0) {
      result.status = result.successCount > 0 ? 'partial' : 'error';
    }
    
    return result;
  }
  
  /**
   * Check if an error is a known Firestore concurrency conflict
   * @param error Error to check
   * @returns True if the error is a concurrency conflict
   */
  isConcurrencyConflictError(error: unknown): boolean {
    // Check for standard Firestore error codes
    if (error && typeof error === 'object' && 'code' in error) {
      const errorWithCode = error as { code: string };
      return errorWithCode.code === 'failed-precondition' || 
             errorWithCode.code === 'aborted';
    }
    
    // Check for error message patterns
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('failed-precondition') ||
             message.includes('aborted') ||
             message.includes('concurrency') ||
             message.includes('conflict');
    }
    
    return false;
  }
  
  /**
   * Check if an error is retryable
   * @param error Error to check
   * @returns True if the error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    // Standard Firebase retryable error codes
    const retryableCodes = [
      'aborted',
      'cancelled',
      'deadline-exceeded',
      'resource-exhausted',
      'unavailable',
      'internal',
    ];
    
    // Check for error code
    if (error && typeof error === 'object' && 'code' in error) {
      const errorWithCode = error as { code: string };
      return retryableCodes.includes(errorWithCode.code);
    }
    
    // Check for error message patterns
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('aborted') ||
             message.includes('deadline') ||
             message.includes('unavailable') ||
             message.includes('retry') ||
             message.includes('timeout');
    }
    
    return false;
  }
}