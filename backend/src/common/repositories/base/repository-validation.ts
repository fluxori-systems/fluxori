/**
 * Repository Validation
 * 
 * Provides validation functions for Firestore repositories
 */

import { Logger } from '@nestjs/common';
import { Timestamp } from '@google-cloud/firestore';
import { FirestoreEntity } from '../../../types/google-cloud.types';

/**
 * Options for data validation
 */
export interface DataValidationOptions {
  allowEmpty?: boolean;
  skipCircularCheck?: boolean;
  skipUndefinedCheck?: boolean;
  extraValidators?: Array<(data: Record<string, unknown>) => void>;
}

/**
 * Repository validation service
 */
export class RepositoryValidation {
  private readonly logger: Logger;
  private readonly requiredFields: string[];
  
  /**
   * Create a new validation service
   * @param collectionName Collection name for error context
   * @param requiredFields Fields that must be present on all documents
   * @param logger Optional logger instance
   */
  constructor(
    private readonly collectionName: string,
    requiredFields: string[] = [],
    logger?: Logger
  ) {
    this.requiredFields = requiredFields;
    this.logger = logger || new Logger('RepositoryValidation');
  }
  
  /**
   * Validates that an ID meets Firestore requirements
   * @param id Document ID to validate
   * @throws Error if ID is invalid
   */
  validateDocumentId(id: string): void {
    if (!id) {
      throw new Error('Document ID cannot be empty');
    }
    
    if (id.includes('/') || id.includes('.') || id.includes('__') || id.includes('..')) {
      throw new Error('Document ID cannot contain /, ., __, or ..');
    }
    
    if (id.startsWith('.') || id.endsWith('.')) {
      throw new Error('Document ID cannot start or end with a period');
    }
    
    if (id.length > 1500) {
      throw new Error('Document ID cannot exceed 1500 bytes');
    }
  }
  
  /**
   * Validates and enforces required fields on a data object
   * @param data Data object to validate
   * @throws Error if any required field is missing
   */
  validateRequiredFields<T extends Record<string, unknown>>(data: T): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Data must be a non-null object');
    }
    
    // Skip validation if no required fields are configured
    if (!this.requiredFields.length) return;
    
    // Check each required field
    const missingFields = this.requiredFields.filter(field => {
      return data[field] === undefined || data[field] === null;
    });
    
    // Throw error if any required fields are missing
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }
  
  /**
   * Validates data before saving to Firestore
   * @param data Data to validate
   * @param options Additional validation options
   * @throws Error if data is invalid
   */
  validateData<T extends Record<string, unknown>>(data: T, options: DataValidationOptions = {}): void {
    // Basic type checking
    if (!data) {
      throw new Error('Data cannot be null or undefined');
    }
    
    if (typeof data !== 'object') {
      throw new Error('Data must be an object');
    }
    
    // Check if data is empty when not allowed
    if (!options.allowEmpty && Object.keys(data).length === 0) {
      throw new Error('Data object cannot be empty');
    }
    
    // Check for circular references which Firestore can't handle
    if (!options.skipCircularCheck) {
      try {
        JSON.stringify(data);
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('circular')) {
          throw new Error('Data contains circular references which cannot be stored in Firestore');
        }
        // Other JSON errors may indicate issues - throw with context
        throw new Error(`Data validation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Ensure no undefined values (Firestore doesn't accept them)
    if (!options.skipUndefinedCheck) {
      this.checkForUndefinedValues(data);
    }
    
    // Run any additional validators
    if (options.extraValidators) {
      for (const validator of options.extraValidators) {
        validator(data);
      }
    }
  }
  
  /**
   * Recursively checks for undefined values in an object
   * @param obj Object to check
   * @param path Current property path for error reporting
   * @throws Error if undefined values are found
   */
  private checkForUndefinedValues(obj: Record<string, unknown>, path: string = ''): void {
    if (!obj || typeof obj !== 'object') {
      return;
    }
    
    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (value === undefined) {
        throw new Error(`Property at path "${currentPath}" has undefined value. Firestore does not accept undefined values.`);
      }
      
      if (value && typeof value === 'object' && !(value instanceof Date) && !(value instanceof Timestamp)) {
        this.checkForUndefinedValues(value as Record<string, unknown>, currentPath);
      }
    });
  }
}
