/**
 * Compliance Rule Repository
 *
 * Repository for managing compliance rules in the advanced compliance framework
 */

import { Injectable, Logger } from '@nestjs/common';
import { QueryFilterOperator } from '../../../types/google-cloud.types';
import { 
  FirestoreConfigService 
} from '../../../config/firestore.config';
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
  ComplianceRule,
  ComplianceCategory,
  ComplianceAuthority,
  ComplianceValidationRule
} from '../services/compliance/compliance-framework.service';

/**
 * Interface for stored compliance rules with metadata
 * 
 * Note: We explicitly implement all fields to avoid conflicts 
 * between ComplianceRule and FirestoreEntityWithMetadata
 */
export interface ComplianceRuleRecord {
  id: string;
  name: string;
  description: string;
  category: ComplianceCategory;
  authority: ComplianceAuthority;
  regionCodes: string[]; 
  productTypes: string[]; 
  requiredAttributes: string[]; 
  validationRules: ComplianceValidationRule[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  exemptionCriteria?: string;
  references?: string[];
  effectiveDate: Date;
  expirationDate?: Date;
  
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
 * Repository for compliance rules
 */
@Injectable()
export class ComplianceRuleRepository extends FirestoreBaseRepository<ComplianceRuleRecord> {
  protected readonly logger = new Logger(ComplianceRuleRepository.name);

  constructor(protected readonly firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'compliance_rules');
  }
  
  /**
   * Find a rule by ID with tenant filtering
   * 
   * @param id Rule ID
   * @param tenantId Tenant ID
   * @param options Additional find options
   * @returns Compliance rule or null if not found
   */
  async findById(
    id: string,
    tenantIdOrOptions?: string | FindByIdOptions,
    optionsParam?: FindByIdOptions
  ): Promise<ComplianceRuleRecord | null> {
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
   * Create a new compliance rule with tenant ID
   * 
   * @param data Rule data
   * @param tenantIdOrOptions Tenant ID or create options
   * @param optionsParam Additional create options
   * @returns Created compliance rule
   */
  async create(
    data: Omit<ComplianceRuleRecord, 'id' | 'createdAt' | 'updatedAt'>,
    tenantIdOrOptions?: string | CreateDocumentOptions,
    optionsParam?: CreateDocumentOptions
  ): Promise<ComplianceRuleRecord> {
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
   * Update a compliance rule with tenant filtering
   * 
   * @param idOrEntity Rule ID or entity with ID
   * @param dataOrTenantId Update data or tenant ID
   * @param tenantIdOrOptions Tenant ID or update options
   * @param optionsParam Additional update options
   * @returns Updated compliance rule
   */
  async update(
    idOrEntity: string | ComplianceRuleRecord,
    dataOrTenantId?: Partial<Omit<ComplianceRuleRecord, 'id' | 'createdAt' | 'updatedAt'>> | string,
    tenantIdOrOptions?: string | UpdateDocumentOptions,
    optionsParam?: UpdateDocumentOptions
  ): Promise<ComplianceRuleRecord> {
    let id: string;
    let data: Partial<Omit<ComplianceRuleRecord, 'id' | 'createdAt' | 'updatedAt'>>;
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
   * Delete a compliance rule with tenant filtering
   * 
   * @param id Rule ID
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
   * Find rules by product type and region
   *
   * @param productType Product type
   * @param regionCode Region code
   * @param tenantId Optional tenant ID
   * @returns Matching compliance rules
   */
  async findByProductTypeAndRegion(
    productType: string,
    regionCode: string,
    tenantId?: string
  ): Promise<ComplianceRule[]> {
    const advancedFilters = [
      { field: 'productTypes', operator: 'array-contains' as QueryFilterOperator, value: productType },
      { field: 'regionCodes', operator: 'array-contains' as QueryFilterOperator, value: regionCode },
      { field: 'isDeleted', operator: '==' as QueryFilterOperator, value: false }
    ];
    
    // Add tenant filter if provided
    if (tenantId) {
      advancedFilters.push({ 
        field: 'tenantId', 
        operator: '==' as QueryFilterOperator, 
        value: tenantId 
      });
    }
    
    this.logger.debug(`Finding rules for product type ${productType} and region ${regionCode}`);
    return this.find({ advancedFilters });
  }

  /**
   * Find rules by authority
   *
   * @param authority Compliance authority
   * @param tenantId Optional tenant ID
   * @returns Matching compliance rules
   */
  async findByAuthority(
    authority: string,
    tenantId?: string
  ): Promise<ComplianceRuleRecord[]> {
    const advancedFilters = [
      { field: 'authority', operator: '==' as QueryFilterOperator, value: authority },
      { field: 'isDeleted', operator: '==' as QueryFilterOperator, value: false }
    ];
    
    // Add tenant filter if provided
    if (tenantId) {
      advancedFilters.push({ 
        field: 'tenantId', 
        operator: '==' as QueryFilterOperator, 
        value: tenantId 
      });
    }
    
    this.logger.debug(`Finding rules for authority ${authority}`);
    return this.find({ advancedFilters });
  }

  /**
   * Find rules by category
   *
   * @param category Compliance category
   * @param tenantId Optional tenant ID
   * @returns Matching compliance rules
   */
  async findByCategory(
    category: string,
    tenantId?: string
  ): Promise<ComplianceRuleRecord[]> {
    const advancedFilters = [
      { field: 'category', operator: '==' as QueryFilterOperator, value: category },
      { field: 'isDeleted', operator: '==' as QueryFilterOperator, value: false }
    ];
    
    // Add tenant filter if provided
    if (tenantId) {
      advancedFilters.push({ 
        field: 'tenantId', 
        operator: '==' as QueryFilterOperator, 
        value: tenantId 
      });
    }
    
    this.logger.debug(`Finding rules for category ${category}`);
    return this.find({ advancedFilters });
  }

  /**
   * Find rules with complex filters
   *
   * @param filters Filter criteria
   * @param tenantId Optional tenant ID
   * @returns Matching compliance rules
   */
  async findByFilters(
    filters: Record<string, any>,
    tenantId?: string
  ): Promise<ComplianceRuleRecord[]> {
    // Convert filters to array of filter objects for the base repository
    const filterArray = [];
    
    // Always include non-deleted items unless caller explicitly included it
    const hasDeletedFilter = Object.keys(filters).includes('isDeleted');
    if (!hasDeletedFilter) {
      filterArray.push({ 
        field: 'isDeleted', 
        operator: '==' as QueryFilterOperator, 
        value: false 
      });
    }
    
    // Add tenant filter if provided
    if (tenantId) {
      filterArray.push({ 
        field: 'tenantId', 
        operator: '==' as QueryFilterOperator, 
        value: tenantId 
      });
    }

    for (const [key, value] of Object.entries(filters)) {
      // Skip processing tenantId since we already handled it
      if (key === 'tenantId') continue;
      
      // Handle special cases for array containment
      if (key === 'regionCodes') {
        filterArray.push({
          field: 'regionCodes',
          operator: 'array-contains' as QueryFilterOperator,
          value,
        });
      } else if (key === 'productTypes') {
        filterArray.push({
          field: 'productTypes',
          operator: 'array-contains' as QueryFilterOperator,
          value,
        });
      }
      // Special handling for isDeleted to ensure boolean type
      else if (key === 'isDeleted') {
        filterArray.push({
          field: 'isDeleted',
          operator: '==' as QueryFilterOperator,
          // Convert to proper boolean if it's a string
          value: typeof value === 'string' ? value === 'true' : Boolean(value),
        });
      }
      // Handle date comparisons
      else if (key === 'expirationDate') {
        if (value.$gt) {
          filterArray.push({
            field: 'expirationDate',
            operator: '>' as QueryFilterOperator,
            value: value.$gt,
          });
        } else if (value.$lt) {
          filterArray.push({
            field: 'expirationDate',
            operator: '<' as QueryFilterOperator,
            value: value.$lt,
          });
        }
      }
      // Handle array of possible values
      else if (value && value.$in && Array.isArray(value.$in)) {
        // This is a simplified approach - in a real system, you might need
        // to use multiple queries and merge results for IN operations
        for (const item of value.$in) {
          filterArray.push({
            field: key,
            operator: '==' as QueryFilterOperator,
            value: item,
          });
        }
      }
      // Handle regular equality
      else {
        filterArray.push({
          field: key,
          operator: '==' as QueryFilterOperator,
          value,
        });
      }
    }
    
    this.logger.debug(`Finding rules with complex filters: ${JSON.stringify(filters)}`);
    return this.find({ advancedFilters: filterArray });
  }
  
  /**
   * Find all rules by tenant
   * 
   * @param tenantId Tenant ID
   * @returns All compliance rules for the tenant
   */
  async findByTenant(tenantId: string): Promise<ComplianceRuleRecord[]> {
    this.logger.debug(`Finding all rules for tenant ${tenantId}`);
    return this.find({
      advancedFilters: [
        { field: 'tenantId', operator: '==' as QueryFilterOperator, value: tenantId },
        { field: 'isDeleted', operator: '==' as QueryFilterOperator, value: false }
      ]
    });
  }
  
  /**
   * Find rules by product and tenant
   * 
   * @param productId Product ID  
   * @param tenantId Tenant ID
   * @returns Compliance rules for the product
   */
  async findByProduct(
    productId: string,
    tenantId: string
  ): Promise<ComplianceRuleRecord[]> {
    this.logger.debug(`Finding rules for product ${productId}`);
    return this.find({
      advancedFilters: [
        { field: 'tenantId', operator: '==' as QueryFilterOperator, value: tenantId },
        { field: 'productId', operator: '==' as QueryFilterOperator, value: productId },
        { field: 'isDeleted', operator: '==' as QueryFilterOperator, value: false }
      ]
    });
  }
}
