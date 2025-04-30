/**
 * Customer Tier Repository
 *
 * Repository for managing customer tier data.
 * Implements standardized repository pattern with tenant awareness.
 */
import { Injectable, Logger } from '@nestjs/common';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { CustomerTier } from '../models/b2b/customer-tier.model';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { 
  FirestoreAdvancedFilter, 
  FindOptions, 
  FindByIdOptions 
} from '../../../common/repositories/base/repository-types';

/**
 * Repository for customer tiers
 * Implements standardized tenant-aware repository pattern
 */
@Injectable()
export class CustomerTierRepository extends FirestoreBaseRepository<CustomerTier> {
  protected readonly logger = new Logger(CustomerTierRepository.name);

  /**
   * Constructor initializes the repository with collection name and options
   * @param firestoreConfigService Firestore configuration service
   */
  constructor(
    firestoreConfigService: FirestoreConfigService,
  ) {
    super(firestoreConfigService, 'customer_tiers', {
      useSoftDeletes: true,
      useVersioning: true,
    });
  }

  /**
   * Find a tier by ID with tenant awareness
   * @param id The tier ID
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns The tier or null if not found
   */
  async findById(
    id: string,
    tenantIdOrOptions?: string | FindByIdOptions,
    options?: FindByIdOptions,
  ): Promise<CustomerTier | null> {
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      // First find document by ID
      const result = await super.findById(id, options);
      
      // Then check if it belongs to the specified tenant
      if (result && result.organizationId === tenantId) {
        return result;
      }
      return null;
    }
    
    return super.findById(id, tenantIdOrOptions);
  }

  /**
   * Find all tiers for a tenant
   * @param tenantId The tenant ID (organization ID)
   * @param options Optional find options
   * @returns Array of tiers for the tenant
   */
  async findByTenant(
    tenantId: string,
    options?: Partial<Omit<FindOptions<CustomerTier>, 'filter'>>,
  ): Promise<CustomerTier[]> {
    this.logger.debug(`Finding all tiers for tenant: ${tenantId}`);
    
    const mergedOptions: FindOptions<CustomerTier> = {
      ...options,
      filter: {
        organizationId: tenantId,
        isDeleted: false,
      },
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Find a customer tier by code with tenant awareness
   * @param code The unique tier code to search for
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns The customer tier or null if not found
   */
  async findByCode(
    code: string,
    tenantIdOrOptions: string | FindOptions<CustomerTier>,
    options?: FindOptions<CustomerTier>,
  ): Promise<CustomerTier | null> {
    this.logger.debug(`Finding tier by code: ${code}`);
    
    // Handle overloaded method signature
    let searchOptions: FindOptions<CustomerTier>;
    
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      searchOptions = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          isDeleted: false,
        },
        advancedFilters: [
          ...(options?.advancedFilters || []),
          {
            field: 'code',
            operator: '==',
            value: code,
          },
          {
            field: 'organizationId',
            operator: '==',
            value: tenantId,
          },
        ],
        limit: 1,
      };
    } else {
      // If options object was provided
      searchOptions = {
        ...tenantIdOrOptions,
        filter: {
          ...(tenantIdOrOptions.filter || {}),
          isDeleted: false,
        },
        advancedFilters: [
          ...(tenantIdOrOptions.advancedFilters || []),
          {
            field: 'code',
            operator: '==',
            value: code,
          },
        ],
        limit: 1,
      };
    }
    
    const results = await this.find(searchOptions);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find active customer tiers with tenant awareness
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as first parameter)
   * @returns Array of active customer tiers
   */
  async findActiveTiers(
    tenantIdOrOptions: string | FindOptions<CustomerTier>,
    options?: FindOptions<CustomerTier>,
  ): Promise<CustomerTier[]> {
    this.logger.debug('Finding active tiers');
    
    // Handle overloaded method signature
    let searchOptions: FindOptions<CustomerTier>;
    
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      searchOptions = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          isDeleted: false,
        },
        advancedFilters: [
          ...(options?.advancedFilters || []),
          {
            field: 'isActive',
            operator: '==',
            value: true,
          },
          {
            field: 'organizationId',
            operator: '==',
            value: tenantId,
          },
        ],
      };
    } else {
      // If options object was provided
      searchOptions = {
        ...tenantIdOrOptions,
        filter: {
          ...(tenantIdOrOptions.filter || {}),
          isDeleted: false,
        },
        advancedFilters: [
          ...(tenantIdOrOptions.advancedFilters || []),
          {
            field: 'isActive',
            operator: '==',
            value: true,
          },
        ],
      };
    }
    
    return this.find(searchOptions);
  }

  /**
   * Find customer tiers by type with tenant awareness
   * @param tierType The tier type to filter by
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of customer tiers with the specified type
   */
  async findByType(
    tierType: string,
    tenantIdOrOptions: string | FindOptions<CustomerTier>,
    options?: FindOptions<CustomerTier>,
  ): Promise<CustomerTier[]> {
    this.logger.debug(`Finding tiers by type: ${tierType}`);
    
    // Handle overloaded method signature
    let searchOptions: FindOptions<CustomerTier>;
    
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      searchOptions = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          isDeleted: false,
        },
        advancedFilters: [
          ...(options?.advancedFilters || []),
          {
            field: 'type',
            operator: '==',
            value: tierType,
          },
          {
            field: 'organizationId',
            operator: '==',
            value: tenantId,
          },
        ],
      };
    } else {
      // If options object was provided
      searchOptions = {
        ...tenantIdOrOptions,
        filter: {
          ...(tenantIdOrOptions.filter || {}),
          isDeleted: false,
        },
        advancedFilters: [
          ...(tenantIdOrOptions.advancedFilters || []),
          {
            field: 'type',
            operator: '==',
            value: tierType,
          },
        ],
      };
    }
    
    return this.find(searchOptions);
  }
}
