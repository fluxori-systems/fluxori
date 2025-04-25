import * as z from 'zod';

/**
 * Schema for credit allocation validation
 */
export const CreditAllocationSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1, 'Organization ID is required'),
  userId: z.string().optional(),
  modelType: z.enum(['subscription', 'pay_as_you_go', 'quota', 'prepaid'], {
    errorMap: () => ({ message: 'Invalid credit model type' }),
  }),
  totalCredits: z.number().positive('Total credits must be positive'),
  remainingCredits: z.number().min(0, 'Remaining credits cannot be negative'),
  resetDate: z.date().optional(),
  expirationDate: z.date().optional(),
  isActive: z.boolean(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Schema for credit transaction validation
 */
export const CreditTransactionSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1, 'Organization ID is required'),
  userId: z.string().optional(),
  amount: z.number().positive('Transaction amount must be positive'),
  transactionType: z.enum(['credit', 'debit'], {
    errorMap: () => ({ message: 'Invalid transaction type' }),
  }),
  usageType: z.enum(
    [
      'token_usage',
      'model_call',
      'document_processing',
      'rag_query',
      'embedding',
      'insight_generation',
    ],
    {
      errorMap: () => ({ message: 'Invalid usage type' }),
    },
  ),
  modelId: z.string().optional(),
  modelProvider: z.string().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  costPerToken: z.number().optional(),
  operationId: z.string().optional(),
  resourceId: z.string().optional(),
  resourceType: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Schema for credit usage log validation
 */
export const CreditUsageLogSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1, 'Organization ID is required'),
  userId: z.string().optional(),
  usageType: z.enum(
    [
      'token_usage',
      'model_call',
      'document_processing',
      'rag_query',
      'embedding',
      'insight_generation',
    ],
    {
      errorMap: () => ({ message: 'Invalid usage type' }),
    },
  ),
  modelId: z.string().optional(),
  modelProvider: z.string().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  totalTokens: z.number().optional(),
  creditsUsed: z.number().min(0, 'Credits used cannot be negative'),
  processingTime: z.number().optional(),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  resourceId: z.string().optional(),
  resourceType: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});
