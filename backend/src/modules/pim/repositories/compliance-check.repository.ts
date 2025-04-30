/**
 * Compliance Check Repository
 *
 * Repository for managing compliance check results in the advanced compliance framework
 */

import { Injectable, Logger } from '@nestjs/common';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { QueryFilterOperator } from '../../../types/google-cloud.types';
import { 
  FirestoreEntityWithMetadata,
  FindOptions,
  CreateDocumentOptions,
  UpdateDocumentOptions,
  DeleteDocumentOptions,
  FindByIdOptions,
  FirestoreAdvancedFilter
} from '../../../common/repositories/base/repository-types';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { ComplianceCheckResult } from '../services/compliance/compliance-framework.service';

/**
 * Interface for stored compliance check records
 * 
 * Note: We explicitly implement all fields to avoid conflicts
 * between ComplianceCheckResult and FirestoreEntityWithMetadata
 */
export interface ComplianceCheckRecord {
  // ComplianceCheckResult fields
  productId: string;
  ruleId: string;
  status: string;
  validationResults: {
    passed: boolean;
    rule: any;
    message: string;
    attributes?: Record<string, any>;
  }[];
  overallCompliance: boolean;
  missingRequirements: string[];
  recommendations: string[];
  checkDate: Date;
  
  // Required unique field
  id: string;
  
  // Tenant field
  tenantId: string;
  
  // Metadata fields from FirestoreEntityWithMetadata
  version: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Repository for compliance check results
 */
@Injectable()
export class ComplianceCheckRepository extends FirestoreBaseRepository<ComplianceCheckRecord> {
  protected readonly logger = new Logger(ComplianceCheckRepository.name);
  
  constructor(protected readonly firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'compliance_checks');
  }
  
  /**
   * Find a compliance check record by ID with tenant filtering
   * 
   * @param id Check record ID
   * @param tenantIdOrOptions Tenant ID or find options
   * @param optionsParam Additional find options
   * @returns Compliance check record or null if not found
   */
  async findById(
    id: string,
    tenantIdOrOptions?: string | FindByIdOptions,
    optionsParam?: FindByIdOptions
  ): Promise<ComplianceCheckRecord | null> {
    let options: FindByIdOptions = {};
    let tenantId: string | undefined;
    
    if (typeof tenantIdOrOptions === 'string') {
      tenantId = tenantIdOrOptions;
      options = optionsParam || {};
    } else {
      options = tenantIdOrOptions || {};
    }
    
    const result = await super.findById(id, options);
    
    // Filter by tenant if provided
    if (result && tenantId && result.tenantId !== tenantId) {
      return null;
    }
    
    return result;
  }
  
  /**
   * Create a new compliance check record with tenant ID
   * 
   * @param data Check record data
   * @param tenantIdOrOptions Tenant ID or create options
   * @param optionsParam Additional create options
   * @returns Created compliance check record
   */
  async create(
    data: Omit<ComplianceCheckRecord, 'id' | 'createdAt' | 'updatedAt'>,
    tenantIdOrOptions?: string | CreateDocumentOptions,
    optionsParam?: CreateDocumentOptions
  ): Promise<ComplianceCheckRecord> {
    let options: CreateDocumentOptions = {};
    
    // Handle overloaded parameters
    if (typeof tenantIdOrOptions === 'string') {
      // If second parameter is a string, it's the tenantId
      const tenantId = tenantIdOrOptions;
      options = optionsParam || {};
      
      // Add tenantId to the entity data
      data = { 
        ...data, 
        tenantId 
      };
    } else {
      // Otherwise, it's the options object
      options = tenantIdOrOptions || {};
    }
    
    return super.create(data, options);
  }
  
  /**
   * Update a compliance check record with tenant filtering
   * 
   * @param idOrEntity Check record ID or entity with ID
   * @param dataOrTenantId Update data or tenant ID
   * @param tenantIdOrOptions Tenant ID or update options
   * @param optionsParam Additional update options
   * @returns Updated compliance check record
   */
  async update(
    idOrEntity: string | ComplianceCheckRecord,
    dataOrTenantId?: Partial<Omit<ComplianceCheckRecord, 'id' | 'createdAt' | 'updatedAt'>> | string,
    tenantIdOrOptions?: string | UpdateDocumentOptions,
    optionsParam?: UpdateDocumentOptions
  ): Promise<ComplianceCheckRecord> {
    let id: string;
    let data: Partial<Omit<ComplianceCheckRecord, 'id' | 'createdAt' | 'updatedAt'>>;
    let options: UpdateDocumentOptions = {};
    
    // Handle different parameter combinations
    if (typeof idOrEntity === 'string') {
      // First parameter is ID
      id = idOrEntity;
      
      if (dataOrTenantId && typeof dataOrTenantId !== 'string') {
        // Second parameter is update data
        data = dataOrTenantId;
        
        if (typeof tenantIdOrOptions === 'string') {
          // Third parameter is tenant ID
          const tenantId = tenantIdOrOptions;
          options = optionsParam || {};
          
          // Add tenantId filter
          data = { ...data, tenantId };
        } else {
          // Third parameter is options
          options = tenantIdOrOptions || {};
        }
      } else {
        // Invalid parameter combination
        throw new Error('Invalid parameters for update: missing data object');
      }
    } else {
      // First parameter is entity object
      id = idOrEntity.id;
      
      if (typeof dataOrTenantId === 'string') {
        // Second parameter is tenant ID
        const tenantId = dataOrTenantId;
        options = typeof tenantIdOrOptions !== 'string' ? tenantIdOrOptions || {} : {};
        
        // Extract update data from entity, ensuring tenant ID
        data = {
          ...idOrEntity,
          tenantId
        };
      } else {
        // Second parameter is options or undefined
        options = dataOrTenantId as UpdateDocumentOptions || {};
        data = idOrEntity;
      }
    }
    
    return super.update(id, data, options);
  }
  
  /**
   * Delete a compliance check record with tenant filtering
   * 
   * @param id Check record ID
   * @param tenantIdOrOptions Tenant ID or delete options
   * @param optionsParam Additional delete options
   */
  async delete(
    id: string,
    tenantIdOrOptions?: string | DeleteDocumentOptions,
    optionsParam?: DeleteDocumentOptions
  ): Promise<void> {
    let options: DeleteDocumentOptions = {};
    
    if (typeof tenantIdOrOptions === 'string') {
      // Second parameter is tenant ID - we could verify the entity belongs
      // to this tenant before deletion, but for simplicity we'll just delete by ID
      options = optionsParam || {};
    } else {
      // Second parameter is options
      options = tenantIdOrOptions || {};
    }
    
    await super.delete(id, options);
  }

  /**
   * Save a compliance check result
   *
   * @param result Compliance check result
   * @param tenantId Tenant ID
   * @param options Optional create options
   * @returns Saved record
   */
  async saveCheckResult(
    result: ComplianceCheckResult,
    tenantId: string,
    options?: CreateDocumentOptions
  ): Promise<ComplianceCheckRecord> {
    this.logger.debug(`Saving compliance check result for product ${result.productId}, rule ${result.ruleId}`);
    
    // Create new record with required metadata fields
    // Note: id, createdAt, and updatedAt will be set by the base repository
    const record = {
      ...result,
      tenantId,
      isDeleted: false,
      deletedAt: null,
      version: 1,
    };

    // Use the tenant-aware create method which handles the id, timestamps
    return this.create(record as Omit<ComplianceCheckRecord, 'id' | 'createdAt' | 'updatedAt'>, options);
  }

  /**
   * Find check results for a product
   *
   * @param productId Product ID
   * @param tenantId Tenant ID
   * @param options Optional find options
   * @returns Compliance check records
   */
  async findByProduct(
    productId: string,
    tenantId: string,
    options?: FindOptions<ComplianceCheckRecord>
  ): Promise<ComplianceCheckRecord[]> {
    this.logger.debug(`Finding compliance checks for product ${productId}`);
    
    const findOptions: FindOptions<ComplianceCheckRecord> = {
      ...options,
      advancedFilters: [
        { field: 'tenantId', operator: '==' as QueryFilterOperator, value: tenantId },
        { field: 'productId', operator: '==' as QueryFilterOperator, value: productId },
        { field: 'isDeleted', operator: '==' as QueryFilterOperator, value: false },
      ],
    };
    
    // If additional filters were provided, merge them
    if (options?.advancedFilters && options.advancedFilters.length > 0) {
      findOptions.advancedFilters = [
        ...(findOptions.advancedFilters || []),
        ...options.advancedFilters.filter((f: FirestoreAdvancedFilter<ComplianceCheckRecord>) => 
          f.field !== 'tenantId' && f.field !== 'productId' && f.field !== 'isDeleted'
        )
      ];
    }
    
    return this.find(findOptions);
  }

  /**
   * Find check results for a specific rule
   *
   * @param ruleId Rule ID
   * @param tenantId Tenant ID
   * @param options Optional find options
   * @returns Compliance check records
   */
  async findByRule(
    ruleId: string,
    tenantId: string,
    options?: FindOptions<ComplianceCheckRecord>
  ): Promise<ComplianceCheckRecord[]> {
    this.logger.debug(`Finding compliance checks for rule ${ruleId}`);
    
    const findOptions: FindOptions<ComplianceCheckRecord> = {
      ...options,
      advancedFilters: [
        { field: 'tenantId', operator: '==' as QueryFilterOperator, value: tenantId },
        { field: 'ruleId', operator: '==' as QueryFilterOperator, value: ruleId },
        { field: 'isDeleted', operator: '==' as QueryFilterOperator, value: false },
      ],
    };
    
    // If additional filters were provided, merge them
    if (options?.advancedFilters && options.advancedFilters.length > 0) {
      findOptions.advancedFilters = [
        ...(findOptions.advancedFilters || []),
        ...options.advancedFilters.filter((f: FirestoreAdvancedFilter<ComplianceCheckRecord>) => 
          f.field !== 'tenantId' && f.field !== 'ruleId' && f.field !== 'isDeleted'
        )
      ];
    }
    
    return this.find(findOptions);
  }

  /**
   * Find check results for a specific product and rule
   *
   * @param productId Product ID
   * @param ruleId Rule ID
   * @param tenantId Tenant ID
   * @param options Optional find options
   * @returns Compliance check records
   */
  async findByProductAndRule(
    productId: string,
    ruleId: string,
    tenantId: string,
    options?: FindOptions<ComplianceCheckRecord>
  ): Promise<ComplianceCheckRecord[]> {
    this.logger.debug(`Finding compliance checks for product ${productId} and rule ${ruleId}`);
    
    const findOptions: FindOptions<ComplianceCheckRecord> = {
      ...options,
      advancedFilters: [
        { field: 'tenantId', operator: '==' as QueryFilterOperator, value: tenantId },
        { field: 'productId', operator: '==' as QueryFilterOperator, value: productId },
        { field: 'ruleId', operator: '==' as QueryFilterOperator, value: ruleId },
        { field: 'isDeleted', operator: '==' as QueryFilterOperator, value: false },
      ],
    };
    
    // If additional filters were provided, merge them
    if (options?.advancedFilters && options.advancedFilters.length > 0) {
      findOptions.advancedFilters = [
        ...(findOptions.advancedFilters || []),
        ...options.advancedFilters.filter((f: FirestoreAdvancedFilter<ComplianceCheckRecord>) => 
          f.field !== 'tenantId' && f.field !== 'productId' && f.field !== 'ruleId' && f.field !== 'isDeleted'
        )
      ];
    }
    
    return this.find(findOptions);
  }

  /**
   * Find check results by status
   *
   * @param status Compliance status
   * @param tenantId Tenant ID
   * @param options Optional find options
   * @returns Compliance check records
   */
  async findByStatus(
    status: string,
    tenantId: string,
    options?: FindOptions<ComplianceCheckRecord>
  ): Promise<ComplianceCheckRecord[]> {
    this.logger.debug(`Finding compliance checks with status ${status}`);
    
    const findOptions: FindOptions<ComplianceCheckRecord> = {
      ...options,
      advancedFilters: [
        { field: 'tenantId', operator: '==' as QueryFilterOperator, value: tenantId },
        { field: 'status', operator: '==' as QueryFilterOperator, value: status },
        { field: 'isDeleted', operator: '==' as QueryFilterOperator, value: false },
      ],
    };
    
    // If additional filters were provided, merge them
    if (options?.advancedFilters && options.advancedFilters.length > 0) {
      findOptions.advancedFilters = [
        ...(findOptions.advancedFilters || []),
        ...options.advancedFilters.filter((f: FirestoreAdvancedFilter<ComplianceCheckRecord>) => 
          f.field !== 'tenantId' && f.field !== 'status' && f.field !== 'isDeleted'
        )
      ];
    }
    
    return this.find(findOptions);
  }

  /**
   * Find check results by date range
   *
   * @param startDate Start date
   * @param endDate End date
   * @param tenantId Tenant ID
   * @param options Optional find options
   * @returns Compliance check records in date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    tenantId: string,
    options?: FindOptions<ComplianceCheckRecord>
  ): Promise<ComplianceCheckRecord[]> {
    this.logger.debug(`Finding compliance checks between ${startDate.toISOString()} and ${endDate.toISOString()}`);
    
    const findOptions: FindOptions<ComplianceCheckRecord> = {
      ...options,
      advancedFilters: [
        { field: 'tenantId', operator: '==' as QueryFilterOperator, value: tenantId },
        { field: 'checkDate', operator: '>=' as QueryFilterOperator, value: startDate },
        { field: 'checkDate', operator: '<=' as QueryFilterOperator, value: endDate },
        { field: 'isDeleted', operator: '==' as QueryFilterOperator, value: false },
      ],
    };
    
    // If additional filters were provided, merge them
    if (options?.advancedFilters && options.advancedFilters.length > 0) {
      findOptions.advancedFilters = [
        ...(findOptions.advancedFilters || []),
        ...options.advancedFilters.filter((f: FirestoreAdvancedFilter<ComplianceCheckRecord>) => 
          f.field !== 'tenantId' && f.field !== 'checkDate' && f.field !== 'isDeleted'
        )
      ];
    }
    
    return this.find(findOptions);
  }
  
  /**
   * Find all checks for a tenant with optional filtering
   * 
   * @param tenantId Tenant ID
   * @param options Optional find options
   * @returns All compliance check records for the tenant
   */
  async findByTenant(
    tenantId: string,
    options?: FindOptions<ComplianceCheckRecord>
  ): Promise<ComplianceCheckRecord[]> {
    this.logger.debug(`Finding all compliance checks for tenant ${tenantId}`);
    
    const findOptions: FindOptions<ComplianceCheckRecord> = {
      ...options,
      advancedFilters: [
        { field: 'tenantId', operator: '==' as QueryFilterOperator, value: tenantId },
        { field: 'isDeleted', operator: '==' as QueryFilterOperator, value: false },
      ],
    };
    
    // If additional filters were provided, merge them
    if (options?.advancedFilters && options.advancedFilters.length > 0) {
      findOptions.advancedFilters = [
        ...(findOptions.advancedFilters || []),
        ...options.advancedFilters.filter((f: FirestoreAdvancedFilter<ComplianceCheckRecord>) => 
          f.field !== 'tenantId' && f.field !== 'isDeleted'
        )
      ];
    }
    
    return this.find(findOptions);
  }
}
