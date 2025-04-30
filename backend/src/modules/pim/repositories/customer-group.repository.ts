/**
 * Customer Group Repository
 *
 * Repository for managing customer group data.
 * Implements standardized repository pattern with tenant awareness.
 */
import { Injectable, Logger } from '@nestjs/common';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { CustomerGroup } from '../models/b2b/customer-tier.model';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { 
  FirestoreAdvancedFilter, 
  FindOptions, 
  FindByIdOptions 
} from '../../../common/repositories/base/repository-types';

/**
 * Repository for customer groups
 * Implements standardized tenant-aware repository pattern
 */
@Injectable()
export class CustomerGroupRepository extends FirestoreBaseRepository<CustomerGroup> {
  protected readonly logger = new Logger(CustomerGroupRepository.name);

  /**
   * Constructor initializes the repository with collection name and options
   * @param firestoreConfigService Firestore configuration service
   */
  constructor(
    firestoreConfigService: FirestoreConfigService,
  ) {
    super(firestoreConfigService, 'customer_groups', {
      useSoftDeletes: true,
      useVersioning: true,
    });
  }

  /**
   * Find a group by ID with tenant awareness
   * @param id The group ID
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns The group or null if not found
   */
  async findById(
    id: string,
    tenantIdOrOptions?: string | FindByIdOptions,
    options?: FindByIdOptions,
  ): Promise<CustomerGroup | null> {
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
   * Find all groups for a tenant
   * @param tenantId The tenant ID (organization ID)
   * @param options Optional find options
   * @returns Array of groups for the tenant
   */
  async findByTenant(
    tenantId: string,
    options?: Partial<Omit<FindOptions<CustomerGroup>, 'filter'>>,
  ): Promise<CustomerGroup[]> {
    this.logger.debug(`Finding all groups for tenant: ${tenantId}`);
    
    const mergedOptions: FindOptions<CustomerGroup> = {
      ...options,
      filter: {
        organizationId: tenantId,
        isDeleted: false,
      },
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Find active customer groups with tenant awareness
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as first parameter)
   * @returns Array of active customer groups
   */
  async findActiveGroups(
    tenantIdOrOptions: string | FindOptions<CustomerGroup>,
    options?: FindOptions<CustomerGroup>,
  ): Promise<CustomerGroup[]> {
    this.logger.debug('Finding active groups');
    
    // Handle overloaded method signature
    let searchOptions: FindOptions<CustomerGroup>;
    
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
   * Find customer groups by tier ID with tenant awareness
   * @param tierId The tier ID to filter by
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of customer groups with the specified tier ID
   */
  async findByTierId(
    tierId: string,
    tenantIdOrOptions: string | FindOptions<CustomerGroup>,
    options?: FindOptions<CustomerGroup>,
  ): Promise<CustomerGroup[]> {
    this.logger.debug(`Finding groups by tier ID: ${tierId}`);
    
    // Handle overloaded method signature
    let searchOptions: FindOptions<CustomerGroup>;
    
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
            field: 'tierId',
            operator: '==',
            value: tierId,
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
            field: 'tierId',
            operator: '==',
            value: tierId,
          },
        ],
      };
    }
    
    return this.find(searchOptions);
  }

  /**
   * Find customer groups by customer ID with tenant awareness
   * @param customerId The customer ID to filter by
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of customer groups containing the specified customer
   */
  async findByCustomerId(
    customerId: string,
    tenantIdOrOptions: string | FindOptions<CustomerGroup>,
    options?: FindOptions<CustomerGroup>,
  ): Promise<CustomerGroup[]> {
    this.logger.debug(`Finding groups by customer ID: ${customerId}`);
    
    // Handle overloaded method signature
    let searchOptions: FindOptions<CustomerGroup>;
    
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
            field: 'customerIds',
            operator: 'array-contains',
            value: customerId,
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
            field: 'customerIds',
            operator: 'array-contains',
            value: customerId,
          },
        ],
      };
    }
    
    return this.find(searchOptions);
  }

  /**
   * Find customer groups with a custom price list with tenant awareness
   * @param priceListId The price list ID
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of customer groups with the specified price list
   */
  async findByPriceListId(
    priceListId: string,
    tenantIdOrOptions: string | FindOptions<CustomerGroup>,
    options?: FindOptions<CustomerGroup>,
  ): Promise<CustomerGroup[]> {
    this.logger.debug(`Finding groups by price list ID: ${priceListId}`);
    
    // Handle overloaded method signature
    let searchOptions: FindOptions<CustomerGroup>;
    
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
            field: 'customPriceListId',
            operator: '==',
            value: priceListId,
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
            field: 'customPriceListId',
            operator: '==',
            value: priceListId,
          },
        ],
      };
    }
    
    return this.find(searchOptions);
  }

  /**
   * Find currently active groups (based on validity dates) with tenant awareness
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as first parameter)
   * @returns Array of currently active groups
   */
  async findCurrentlyActiveGroups(
    tenantIdOrOptions: string | FindOptions<CustomerGroup>,
    options?: FindOptions<CustomerGroup>,
  ): Promise<CustomerGroup[]> {
    this.logger.debug('Finding currently active groups (based on validity dates)');
    const now = new Date();
    
    // Handle overloaded method signature
    let allGroups: CustomerGroup[];
    
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const searchOptions: FindOptions<CustomerGroup> = {
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
          {
            field: 'validFrom',
            operator: '<=',
            value: now,
          },
        ],
      };
      
      allGroups = await this.find(searchOptions);
    } else {
      // If options object was provided
      const searchOptions: FindOptions<CustomerGroup> = {
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
          {
            field: 'validFrom',
            operator: '<=',
            value: now,
          },
        ],
      };
      
      allGroups = await this.find(searchOptions);
    }
    
    // Filter locally for end dates in the future or null
    return allGroups.filter((group) => !group.validTo || group.validTo > now);
  }
}
