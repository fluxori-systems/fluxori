import { CreditModelType, CreditUsageType } from '../interfaces/types';

/**
 * DTOs for credit system API
 */

/**
 * DTO for creating a credit allocation
 */
export class CreateAllocationDto {
  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Credit model type
   */
  modelType: CreditModelType;

  /**
   * Total credits to allocate
   */
  totalCredits: number;

  /**
   * Optional user ID for user-specific allocation
   */
  userId?: string;

  /**
   * Optional date when credits reset (ISO string)
   */
  resetDate?: string;

  /**
   * Optional date when allocation expires (ISO string)
   */
  expirationDate?: string;

  /**
   * Optional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * DTO for adding credits to an allocation
 */
export class AddCreditsDto {
  /**
   * Allocation ID
   */
  allocationId: string;

  /**
   * Amount of credits to add
   */
  amount: number;

  /**
   * Optional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * DTO for checking credit availability
 */
export class CheckCreditsDto {
  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Optional user ID
   */
  userId?: string;

  /**
   * Expected input tokens
   */
  expectedInputTokens: number;

  /**
   * Expected output tokens
   */
  expectedOutputTokens: number;

  /**
   * Model ID
   */
  modelId: string;

  /**
   * Usage type
   */
  usageType: CreditUsageType;

  /**
   * Optional operation ID
   */
  operationId?: string;

  /**
   * Optional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * DTO for recording credit usage
 */
export class RecordUsageDto {
  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Optional user ID
   */
  userId?: string;

  /**
   * Usage type
   */
  usageType: CreditUsageType;

  /**
   * Model ID
   */
  modelId: string;

  /**
   * Model provider
   */
  modelProvider: string;

  /**
   * Input tokens
   */
  inputTokens: number;

  /**
   * Output tokens
   */
  outputTokens: number;

  /**
   * Optional processing time in milliseconds
   */
  processingTime?: number;

  /**
   * Optional operation ID
   */
  operationId?: string;

  /**
   * Optional reservation ID
   */
  reservationId?: string;

  /**
   * Optional resource ID
   */
  resourceId?: string;

  /**
   * Optional resource type
   */
  resourceType?: string;

  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * Optional error message
   */
  errorMessage?: string;

  /**
   * Optional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * DTO for optimizing model selection
 */
export class OptimizeModelDto {
  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * User prompt for token estimation
   */
  userPrompt: string;

  /**
   * Task complexity level
   */
  taskComplexity: 'simple' | 'standard' | 'complex';

  /**
   * Optional preferred model
   */
  preferredModel?: string;
}
