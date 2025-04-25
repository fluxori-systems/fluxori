/**
 * Transaction utilities for Firestore repositories
 * Provides utilities for managing transactions in repositories
 */

import { Logger } from '@nestjs/common';

import { Firestore, Transaction, WriteBatch } from '@google-cloud/firestore';

import {
  TransactionContext,
  TransactionExecutionOptions,
  FirestoreBatchWriteResult,
} from '../../../types/google-cloud.types';

/**
 * Repository transaction interface
 */
export interface RepositoryTransaction {
  run<T>(fn: (transaction: Transaction) => Promise<T>): Promise<T>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Transaction operation type
 */
export type TransactionOperation<T> = (transaction: Transaction) => Promise<T>;

/**
 * Default transaction execution options
 */
export const DEFAULT_TRANSACTION_OPTIONS: TransactionExecutionOptions = {
  maxAttempts: 5,
  readOnly: false,
  retryDelayMs: 200,
  timeoutMs: 30000,
};

/**
 * Execute a function within a transaction
 * @param firestore Firestore instance
 * @param executionFunction Function to execute in transaction
 * @param options Transaction options
 * @returns Result of the transaction execution
 */
export async function executeTransaction<T>(
  firestore: Firestore,
  executionFunction: (txContext: TransactionContext) => Promise<T>,
  options: Partial<TransactionExecutionOptions> = {},
): Promise<T> {
  const mergedOptions = { ...DEFAULT_TRANSACTION_OPTIONS, ...options };
  const logger = new Logger('Transaction');

  let attempts = 0;

  // Store the last error
  let lastError: Error | null = null;

  // Function to delay between retries with exponential backoff
  const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const calculateBackoff = (attempt: number): number => {
    return mergedOptions.retryDelayMs! * Math.pow(2, attempt);
  };

  while (attempts < mergedOptions.maxAttempts!) {
    attempts++;

    try {
      // Create transaction
      let result: T;

      if (mergedOptions.readOnly) {
        // Read-only transaction
        result = await firestore.runTransaction(
          async (transaction) => {
            const txContext: TransactionContext = {
              transaction,
              options: mergedOptions,
            };

            return executionFunction(txContext);
          },
          { readOnly: true },
        );
      } else {
        // Read-write transaction
        result = await firestore.runTransaction(async (transaction) => {
          const txContext: TransactionContext = {
            transaction,
            options: mergedOptions,
          };

          return executionFunction(txContext);
        });
      }

      // If we got here, the transaction succeeded
      return result;
    } catch (error) {
      lastError = error as Error;

      // Log the error
      logger.debug(
        `Transaction attempt ${attempts}/${mergedOptions.maxAttempts} failed: ${error.message}`,
      );

      // Exit early if we've reached max attempts
      if (attempts >= mergedOptions.maxAttempts!) {
        break;
      }

      // Calculate backoff with jitter
      const backoff = calculateBackoff(attempts) * (0.5 + Math.random() * 0.5);

      // Wait before trying again
      await delay(backoff);
    }
  }

  // If we got here, all transaction attempts failed
  logger.error(
    `Transaction failed after ${attempts} attempts: ${lastError?.message}`,
    lastError?.stack,
  );

  throw lastError || new Error('Transaction failed');
}

/**
 * Execute a batch write operation with automatic chunking
 * @param firestore Firestore instance
 * @param operations Function that populates a batch with operations
 * @param options Batch options
 * @returns Result of the batch operation
 */
export async function executeBatch(
  firestore: Firestore,
  operations: (batch: WriteBatch) => void,
  batchSize: number = 500,
): Promise<FirestoreBatchWriteResult> {
  const batch = firestore.batch();

  // Execute the operations to populate the batch
  operations(batch);

  try {
    // Commit the batch
    await batch.commit();

    return {
      status: 'success',
      successCount: 1,
      errorCount: 0,
      writtenCount: 1,
    };
  } catch (error) {
    return {
      status: 'error',
      successCount: 0,
      errorCount: 1,
      errors: [{ index: 0, error: error as Error }],
    };
  }
}

/**
 * Execute multiple batch operations
 * @param firestore Firestore instance
 * @param batches Array of functions that populate batches
 * @returns Result of the batch operations
 */
export async function executeMultiBatch(
  firestore: Firestore,
  batches: ((batch: WriteBatch) => void)[],
  batchSize: number = 500,
): Promise<FirestoreBatchWriteResult> {
  const results: FirestoreBatchWriteResult[] = [];

  // Execute each batch
  for (let i = 0; i < batches.length; i++) {
    const batchOperation = batches[i];
    const result = await executeBatch(firestore, batchOperation, batchSize);
    results.push(result);
  }

  // Count successes and errors
  let successCount = 0;
  let errorCount = 0;
  let writtenCount = 0;
  const errors: { index: number; error: Error; id?: string }[] = [];

  results.forEach((result, index) => {
    successCount += result.successCount;
    errorCount += result.errorCount;
    writtenCount += result.writtenCount || 0;

    if (result.errors && result.errors.length > 0) {
      result.errors.forEach((error) => {
        errors.push({
          index: index * batchSize + error.index,
          id: error.id,
          error: error.error,
        });
      });
    }
  });

  // Determine overall status
  let status: 'success' | 'partial' | 'error' = 'success';
  if (errorCount > 0) {
    status = successCount > 0 ? 'partial' : 'error';
  }

  return {
    status,
    successCount,
    errorCount,
    writtenCount,
    errors: errors.length > 0 ? errors : undefined,
  };
}
