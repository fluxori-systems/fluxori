/**
 * Validation utilities for repository operations
 * Provides entity validation for the Firestore repositories
 */

import { BadRequestException } from '@nestjs/common';
import { FirestoreEntity } from '../../../types/google-cloud.types';

/**
 * Custom error class for repository validation errors
 */
export class RepositoryValidationError extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'RepositoryValidationError';
  }
}

/**
 * Validate an entity against a schema or rules
 */
export function validateEntity<T extends Record<string, any>>(
  entity: T, 
  rules: Record<string, any> = {}
): boolean {
  // Simple validation - can be expanded with more complex validation logic
  for (const [key, rule] of Object.entries(rules)) {
    if (rule.required && (entity[key] === undefined || entity[key] === null)) {
      throw new RepositoryValidationError(`Missing required field: ${key}`);
    }
  }
  return true;
}

/**
 * Validate that required fields are present in an entity
 * @throws BadRequestException if required fields are missing
 */
export function validateRequiredFields<T extends FirestoreEntity>(
  entity: Partial<T>, 
  requiredFields: string[]
): void {
  const missingFields: string[] = [];
  
  // Check for each required field
  for (const field of requiredFields) {
    if (entity[field] === undefined || entity[field] === null) {
      missingFields.push(field);
    }
  }
  
  // Throw error if any required fields are missing
  if (missingFields.length > 0) {
    throw new BadRequestException(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

/**
 * Validate that an entity ID exists and has the correct format
 * @throws BadRequestException if ID is invalid
 */
export function validateEntityId(id: string | undefined): void {
  if (!id) {
    throw new BadRequestException('Entity ID is required');
  }
  
  if (typeof id !== 'string') {
    throw new BadRequestException('Entity ID must be a string');
  }
  
  if (id.trim() === '') {
    throw new BadRequestException('Entity ID cannot be empty');
  }
  
  // Check for invalid characters in ID
  const invalidChars = /[.\/\[\]#$]/;
  if (invalidChars.test(id)) {
    throw new BadRequestException('Entity ID contains invalid characters');
  }
}

/**
 * Check if entity is marked as deleted
 */
export function isEntityDeleted<T extends FirestoreEntity>(entity: T): boolean {
  return Boolean(entity.isDeleted);
}

/**
 * Validate that an entity is not deleted
 * @throws BadRequestException if entity is deleted
 */
export function validateEntityNotDeleted<T extends FirestoreEntity>(
  entity: T, 
  errorMessage: string = 'Entity is deleted'
): void {
  if (isEntityDeleted(entity)) {
    throw new BadRequestException(errorMessage);
  }
}

/**
 * Validate batch items for a batch operation
 */
export function validateBatchItems<T>(
  items: T[],
  minItems: number = 1,
  maxItems: number = 500
): void {
  if (!Array.isArray(items)) {
    throw new BadRequestException('Items must be an array');
  }
  
  if (items.length < minItems) {
    throw new BadRequestException(`Batch operation requires at least ${minItems} item(s)`);
  }
  
  if (items.length > maxItems) {
    throw new BadRequestException(`Batch operation cannot exceed ${maxItems} items`);
  }
}