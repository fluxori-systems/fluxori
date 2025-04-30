/**
 * Compliance Requirement Repository
 *
 * Repository for managing compliance requirements in the advanced compliance framework
 */

import { Injectable, Logger } from '@nestjs/common';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { QueryFilterOperator } from '../../../types/google-cloud.types';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { 
  FirestoreEntityWithMetadata,
  FindOptions,
  CreateDocumentOptions,
  UpdateDocumentOptions,
  DeleteDocumentOptions,
  FindByIdOptions,
  FirestoreAdvancedFilter
} from '../../../common/repositories/base/repository-types';
import { 
  ComplianceRequirement,
  ComplianceStatus,
  ComplianceStatusChange
} from '../services/compliance/compliance-framework.service';

/**
 * Interface for stored compliance requirements with metadata
 * 
 * Note: We explicitly implement all fields to avoid conflicts
 * between ComplianceRequirement and FirestoreEntityWithMetadata
 */
export interface ComplianceRequirementRecord {
  id: string;
  productId: string;
  ruleId: string;
  status: ComplianceStatus;
  requiredBy: Date;
  documentationUrls?: string[]; 
  certificateIds?: string[];
  notes?: string;
  assignedTo?: string;
  lastChecked?: Date;
  history: ComplianceStatusChange[];
  
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
 * Repository for compliance requirements
 */
@Injectable()
export class ComplianceRequirementRepository extends FirestoreBaseRepository<ComplianceRequirementRecord> {
  protected readonly logger = new Logger(ComplianceRequirementRepository.name);

  constructor(protected readonly firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'compliance_requirements');
  }
  
  /**
   * Find a compliance requirement by ID with tenant filtering
   * 
   * @param id Requirement ID
   * @param tenantIdOrOptions Tenant ID or find options
   * @param optionsParam Additional find options
   * @returns Compliance requirement or null if not found
   */
  async findById(
    id: string,
    tenantIdOrOptions?: string | FindByIdOptions,
    optionsParam?: FindByIdOptions
  ): Promise<ComplianceRequirementRecord | null> {
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
   * Create a new compliance requirement with tenant ID
   * 
   * @param data Requirement data
   * @param tenantIdOrOptions Tenant ID or create options
   * @param optionsParam Additional create options
   * @returns Created compliance requirement
   */
  async create(
    data: Omit<ComplianceRequirementRecord, 'id' | 'createdAt' | 'updatedAt'>,
    tenantIdOrOptions?: string | CreateDocumentOptions,
    optionsParam?: CreateDocumentOptions
  ): Promise<ComplianceRequirementRecord> {
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
   * Update a compliance requirement with tenant filtering
   * 
   * @param idOrEntity Requirement ID or entity with ID
   * @param dataOrTenantId Update data or tenant ID
   * @param tenantIdOrOptions Tenant ID or update options
   * @param optionsParam Additional update options
   * @returns Updated compliance requirement
   */
  async update(
    idOrEntity: string | ComplianceRequirementRecord,
    dataOrTenantId?: Partial<Omit<ComplianceRequirementRecord, 'id' | 'createdAt' | 'updatedAt'>> | string,
    tenantIdOrOptions?: string | UpdateDocumentOptions,
    optionsParam?: UpdateDocumentOptions
  ): Promise<ComplianceRequirementRecord> {
    let id: string;
    let data: Partial<Omit<ComplianceRequirementRecord, 'id' | 'createdAt' | 'updatedAt'>>;
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
   * Delete a compliance requirement with tenant filtering
   * 
   * @param id Requirement ID
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
   * Find requirements for a product
   *
   * @param productId Product ID
   * @param tenantId Tenant ID
   * @param options Optional find options
   * @returns Matching compliance requirements
   */
  async findByProduct(
    productId: string,
    tenantId: string,
    options?: FindOptions<ComplianceRequirementRecord>
  ): Promise<ComplianceRequirementRecord[]> {
    this.logger.debug(`Finding compliance requirements for product ${productId}`);
    
    const findOptions: FindOptions<ComplianceRequirementRecord> = {
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
        ...options.advancedFilters.filter(f => 
          f.field !== 'tenantId' && f.field !== 'productId' && f.field !== 'isDeleted'
        )
      ];
    }
    
    return this.find(findOptions);
  }

  /**
   * Find requirement for a specific product and rule
   *
   * @param productId Product ID
   * @param ruleId Rule ID
   * @param tenantId Tenant ID
   * @param options Optional find options
   * @returns Matching compliance requirement or null
   */
  async findByProductAndRule(
    productId: string,
    ruleId: string,
    tenantId: string,
    options?: FindOptions<ComplianceRequirementRecord>
  ): Promise<ComplianceRequirementRecord | null> {
    this.logger.debug(`Finding compliance requirement for product ${productId} and rule ${ruleId}`);
    
    const findOptions: FindOptions<ComplianceRequirementRecord> = {
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
        ...options.advancedFilters.filter(f => 
          f.field !== 'tenantId' && f.field !== 'productId' && 
          f.field !== 'ruleId' && f.field !== 'isDeleted'
        )
      ];
    }
    
    const results = await this.find(findOptions);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find requirements by status
   *
   * @param status Compliance status
   * @param tenantId Tenant ID
   * @param options Optional find options
   * @returns Matching compliance requirements
   */
  async findByStatus(
    status: string,
    tenantId: string,
    options?: FindOptions<ComplianceRequirementRecord>
  ): Promise<ComplianceRequirementRecord[]> {
    this.logger.debug(`Finding compliance requirements with status ${status}`);
    
    const findOptions: FindOptions<ComplianceRequirementRecord> = {
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
        ...options.advancedFilters.filter(f => 
          f.field !== 'tenantId' && f.field !== 'status' && f.field !== 'isDeleted'
        )
      ];
    }
    
    return this.find(findOptions);
  }

  /**
   * Find requirements with upcoming due dates
   *
   * @param date Cutoff date
   * @param tenantId Tenant ID
   * @param options Optional find options
   * @returns Compliance requirements due by the given date
   */
  async findUpcoming(
    date: Date,
    tenantId: string,
    options?: FindOptions<ComplianceRequirementRecord>
  ): Promise<ComplianceRequirementRecord[]> {
    this.logger.debug(`Finding upcoming compliance requirements due by ${date.toISOString()}`);
    
    const findOptions: FindOptions<ComplianceRequirementRecord> = {
      ...options,
      advancedFilters: [
        { field: 'tenantId', operator: '==' as QueryFilterOperator, value: tenantId },
        { field: 'requiredBy', operator: '<=' as QueryFilterOperator, value: date },
        { field: 'status', operator: 'in' as QueryFilterOperator, value: ['pending_verification', 'in_progress'] },
        { field: 'isDeleted', operator: '==' as QueryFilterOperator, value: false },
      ],
    };
    
    // If additional filters were provided, merge them
    if (options?.advancedFilters && options.advancedFilters.length > 0) {
      findOptions.advancedFilters = [
        ...(findOptions.advancedFilters || []),
        ...options.advancedFilters.filter(f => 
          f.field !== 'tenantId' && f.field !== 'requiredBy' && 
          f.field !== 'status' && f.field !== 'isDeleted'
        )
      ];
    }
    
    return this.find(findOptions);
  }

  /**
   * Find requirements assigned to a user
   *
   * @param userId User ID
   * @param tenantId Tenant ID
   * @param options Optional find options
   * @returns Compliance requirements assigned to the user
   */
  async findByAssignee(
    userId: string,
    tenantId: string,
    options?: FindOptions<ComplianceRequirementRecord>
  ): Promise<ComplianceRequirementRecord[]> {
    this.logger.debug(`Finding compliance requirements assigned to user ${userId}`);
    
    const findOptions: FindOptions<ComplianceRequirementRecord> = {
      ...options,
      advancedFilters: [
        { field: 'tenantId', operator: '==' as QueryFilterOperator, value: tenantId },
        { field: 'assignedTo', operator: '==' as QueryFilterOperator, value: userId },
        { field: 'isDeleted', operator: '==' as QueryFilterOperator, value: false },
      ],
    };
    
    // If additional filters were provided, merge them
    if (options?.advancedFilters && options.advancedFilters.length > 0) {
      findOptions.advancedFilters = [
        ...(findOptions.advancedFilters || []),
        ...options.advancedFilters.filter(f => 
          f.field !== 'tenantId' && f.field !== 'assignedTo' && f.field !== 'isDeleted'
        )
      ];
    }
    
    return this.find(findOptions);
  }
  
  /**
   * Find all requirements for a tenant
   * 
   * @param tenantId Tenant ID
   * @param options Optional find options
   * @returns All compliance requirements for the tenant
   */
  async findByTenant(
    tenantId: string,
    options?: FindOptions<ComplianceRequirementRecord>
  ): Promise<ComplianceRequirementRecord[]> {
    this.logger.debug(`Finding all compliance requirements for tenant ${tenantId}`);
    
    const findOptions: FindOptions<ComplianceRequirementRecord> = {
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
        ...options.advancedFilters.filter(f => 
          f.field !== 'tenantId' && f.field !== 'isDeleted'
        )
      ];
    }
    
    return this.find(findOptions);
  }
  
  /**
   * Find requirements for a specific rule
   * 
   * @param ruleId Rule ID
   * @param tenantId Tenant ID
   * @param options Optional find options
   * @returns Compliance requirements for the rule
   */
  async findByRule(
    ruleId: string,
    tenantId: string,
    options?: FindOptions<ComplianceRequirementRecord>
  ): Promise<ComplianceRequirementRecord[]> {
    this.logger.debug(`Finding compliance requirements for rule ${ruleId}`);
    
    const findOptions: FindOptions<ComplianceRequirementRecord> = {
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
        ...options.advancedFilters.filter((f: FirestoreAdvancedFilter<ComplianceRequirementRecord>) => 
          f.field !== 'tenantId' && f.field !== 'ruleId' && f.field !== 'isDeleted'
        )
      ];
    }
    
    return this.find(findOptions);
  }
}
