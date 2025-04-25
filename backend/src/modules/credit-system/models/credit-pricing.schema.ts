import * as z from 'zod';

/**
 * Schema for pricing tier validation
 */
export const CreditPricingTierSchema = z.object({
  id: z.string().optional(),
  modelId: z.string().min(1, 'Model ID is required'),
  modelProvider: z.string().min(1, 'Model provider is required'),
  displayName: z.string().min(1, 'Display name is required'),
  inputTokenCost: z.number().min(0, 'Input token cost cannot be negative'),
  outputTokenCost: z.number().min(0, 'Output token cost cannot be negative'),
  effectiveDate: z.date(),
  expirationDate: z.date().optional(),
  isActive: z.boolean(),
  regionSpecificPricing: z
    .record(
      z.object({
        inputTokenCost: z.number().min(0),
        outputTokenCost: z.number().min(0),
      }),
    )
    .optional(),
});

/**
 * Schema for credit reservation validation
 */
export const CreditReservationSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1, 'Organization ID is required'),
  userId: z.string().optional(),
  operationId: z.string().min(1, 'Operation ID is required'),
  reservationAmount: z.number().positive('Reservation amount must be positive'),
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
  status: z.enum(['pending', 'confirmed', 'released', 'expired'], {
    errorMap: () => ({ message: 'Invalid reservation status' }),
  }),
  expirationDate: z.date(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Schema for credit alert validation
 */
export const CreditAlertSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1, 'Organization ID is required'),
  alertType: z.enum(
    ['low_balance', 'high_usage', 'quota_exceeded', 'approaching_limit'],
    {
      errorMap: () => ({ message: 'Invalid alert type' }),
    },
  ),
  thresholdPercentage: z
    .number()
    .min(0)
    .max(100, 'Threshold must be between 0 and 100'),
  triggered: z.boolean(),
  lastTriggeredAt: z.date().optional(),
  createdBy: z.string().min(1, 'Creator ID is required'),
  notificationChannels: z.array(z.string()),
  isActive: z.boolean(),
});
