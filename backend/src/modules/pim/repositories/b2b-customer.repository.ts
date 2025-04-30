/**
 * B2B Customer Repository
 *
 * Repository for managing B2B customer data.
 * Implements standardized repository pattern with tenant awareness.
 */
import { Injectable, Logger } from '@nestjs/common';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { FirestoreConfigService } from '../../../config/firestore.config';
import {
  B2BCustomer,
  B2BAccountType,
  B2BCustomerStatus,
} from '../models/b2b/customer.model';
import { FindByIdOptions, FindOptions } from '../../../common/repositories/base/repository-types';

/**
 * Repository for B2B customers
 * Implements standardized tenant-aware repository pattern
 */
@Injectable()
export class B2BCustomerRepository extends FirestoreBaseRepository<B2BCustomer> {
  protected readonly logger = new Logger(B2BCustomerRepository.name);

  /**
   * Constructor initializes the repository with collection name and options
   * @param firestoreConfigService Firestore configuration service
   */
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'b2b_customers', {
      useSoftDeletes: true,
      useVersioning: true,
    });
  }

  /**
   * Find a customer by ID with tenant awareness
   * @param id The customer ID
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns The customer or null if not found
   */
  async findById(
    id: string,
    tenantIdOrOptions?: string | FindByIdOptions,
    options?: FindByIdOptions,
  ): Promise<B2BCustomer | null> {
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
   * Find all customers for a tenant
   * @param tenantId The tenant ID (organization ID)
   * @param options Optional find options
   * @returns Array of customers for the tenant
   */
  async findByTenant(
    tenantId: string,
    options?: Partial<Omit<FindOptions<B2BCustomer>, 'filter'>>,
  ): Promise<B2BCustomer[]> {
    this.logger.debug(`Finding all customers for tenant: ${tenantId}`);
    
    const mergedOptions: FindOptions<B2BCustomer> = {
      ...options,
      filter: {
        organizationId: tenantId,
        isDeleted: false,
      },
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Find a B2B customer by customer number with tenant awareness
   * @param customerNumber The unique customer number to search for
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns The B2B customer or null if not found
   */
  async findByCustomerNumber(
    customerNumber: string,
    tenantIdOrOptions: string | FindOptions<B2BCustomer>,
    options?: FindOptions<B2BCustomer>,
  ): Promise<B2BCustomer | null> {
    this.logger.debug(`Finding customer by number: ${customerNumber}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<B2BCustomer> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          organizationId: tenantId,
          isDeleted: false,
        },
      };
      
      return this.findOneBy('customerNumber', customerNumber, mergedOptions);
    }
    
    return this.findOneBy('customerNumber', customerNumber, tenantIdOrOptions);
  }

  /**
   * Find B2B customers by tier ID with tenant awareness
   * @param customerTierId The customer tier ID
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of B2B customers in the specified tier
   */
  async findByTierId(
    customerTierId: string,
    tenantIdOrOptions: string | FindOptions<B2BCustomer>,
    options?: FindOptions<B2BCustomer>,
  ): Promise<B2BCustomer[]> {
    this.logger.debug(`Finding customers by tier ID: ${customerTierId}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<B2BCustomer> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          customerTierId,
          organizationId: tenantId,
          isDeleted: false,
        },
      };
      
      return this.find(mergedOptions);
    }
    
    // If options object was provided, ensure we filter by tier ID
    const mergedOptions: FindOptions<B2BCustomer> = {
      ...tenantIdOrOptions,
      filter: {
        ...(tenantIdOrOptions.filter || {}),
        customerTierId,
        isDeleted: false,
      },
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Find B2B customers by group ID with tenant awareness
   * @param customerGroupId The customer group ID
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of B2B customers in the specified group
   */
  async findByGroupId(
    customerGroupId: string,
    tenantIdOrOptions: string | FindOptions<B2BCustomer>,
    options?: FindOptions<B2BCustomer>,
  ): Promise<B2BCustomer[]> {
    this.logger.debug(`Finding customers by group ID: ${customerGroupId}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<B2BCustomer> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          organizationId: tenantId,
          isDeleted: false,
        },
        advancedFilters: [
          ...(options?.advancedFilters || []),
          {
            field: 'customerGroupIds',
            operator: 'array-contains',
            value: customerGroupId,
          },
        ],
      };
      
      return this.find(mergedOptions);
    }
    
    // If options object was provided, ensure we filter by group ID
    const mergedOptions: FindOptions<B2BCustomer> = {
      ...tenantIdOrOptions,
      filter: {
        ...(tenantIdOrOptions.filter || {}),
        isDeleted: false,
      },
      advancedFilters: [
        ...(tenantIdOrOptions.advancedFilters || []),
        {
          field: 'customerGroupIds',
          operator: 'array-contains',
          value: customerGroupId,
        },
      ],
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Find B2B customers by account type with tenant awareness
   * @param accountType The account type
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of B2B customers with the specified account type
   */
  async findByAccountType(
    accountType: string,
    tenantIdOrOptions: string | FindOptions<B2BCustomer>,
    options?: FindOptions<B2BCustomer>,
  ): Promise<B2BCustomer[]> {
    this.logger.debug(`Finding customers by account type: ${accountType}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<B2BCustomer> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          accountType: accountType as B2BAccountType,
          organizationId: tenantId,
          isDeleted: false,
        },
      };
      
      return this.find(mergedOptions);
    }
    
    // If options object was provided, ensure we filter by account type
    const mergedOptions: FindOptions<B2BCustomer> = {
      ...tenantIdOrOptions,
      filter: {
        ...(tenantIdOrOptions.filter || {}),
        accountType: accountType as B2BAccountType,
        isDeleted: false,
      },
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Find B2B customers by status with tenant awareness
   * @param status The customer status
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of B2B customers with the specified status
   */
  async findByStatus(
    status: string,
    tenantIdOrOptions: string | FindOptions<B2BCustomer>,
    options?: FindOptions<B2BCustomer>,
  ): Promise<B2BCustomer[]> {
    this.logger.debug(`Finding customers by status: ${status}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<B2BCustomer> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          status: status as B2BCustomerStatus,
          organizationId: tenantId,
          isDeleted: false,
        },
      };
      
      return this.find(mergedOptions);
    }
    
    // If options object was provided, ensure we filter by status
    const mergedOptions: FindOptions<B2BCustomer> = {
      ...tenantIdOrOptions,
      filter: {
        ...(tenantIdOrOptions.filter || {}),
        status: status as B2BCustomerStatus,
        isDeleted: false,
      },
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Find customers by credit status with tenant awareness
   * @param creditStatus The credit status to filter by
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of customers with the specified credit status
   */
  async findByCreditStatus(
    creditStatus: string,
    tenantIdOrOptions: string | FindOptions<B2BCustomer>,
    options?: FindOptions<B2BCustomer>,
  ): Promise<B2BCustomer[]> {
    this.logger.debug(`Finding customers by credit status: ${creditStatus}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<B2BCustomer> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          organizationId: tenantId,
          isDeleted: false,
        },
        advancedFilters: [
          ...(options?.advancedFilters || []),
          {
            field: 'paymentInfo.creditStatus',
            operator: '==',
            value: creditStatus,
          },
        ],
      };
      
      return this.find(mergedOptions);
    }
    
    // If options object was provided, ensure we filter by credit status
    const mergedOptions: FindOptions<B2BCustomer> = {
      ...tenantIdOrOptions,
      filter: {
        ...(tenantIdOrOptions.filter || {}),
        isDeleted: false,
      },
      advancedFilters: [
        ...(tenantIdOrOptions.advancedFilters || []),
        {
          field: 'paymentInfo.creditStatus',
          operator: '==',
          value: creditStatus,
        },
      ],
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Find B2B customers by market region with tenant awareness
   * @param marketRegion The market region
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of B2B customers in the specified market region
   */
  async findByMarketRegion(
    marketRegion: string,
    tenantIdOrOptions: string | FindOptions<B2BCustomer>,
    options?: FindOptions<B2BCustomer>,
  ): Promise<B2BCustomer[]> {
    this.logger.debug(`Finding customers by market region: ${marketRegion}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<B2BCustomer> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          marketRegion,
          organizationId: tenantId,
          isDeleted: false,
        },
      };
      
      return this.find(mergedOptions);
    }
    
    // If options object was provided, ensure we filter by market region
    const mergedOptions: FindOptions<B2BCustomer> = {
      ...tenantIdOrOptions,
      filter: {
        ...(tenantIdOrOptions.filter || {}),
        marketRegion,
        isDeleted: false,
      },
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Find B2B customers by parent company ID with tenant awareness
   * @param parentCompanyId The parent company ID
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of B2B customers with the specified parent company
   */
  async findByParentCompany(
    parentCompanyId: string,
    tenantIdOrOptions: string | FindOptions<B2BCustomer>,
    options?: FindOptions<B2BCustomer>,
  ): Promise<B2BCustomer[]> {
    this.logger.debug(`Finding customers by parent company: ${parentCompanyId}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<B2BCustomer> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          organizationId: tenantId,
          isDeleted: false,
        },
        advancedFilters: [
          ...(options?.advancedFilters || []),
          {
            field: 'organizationalHierarchy.parentCompanyId',
            operator: '==',
            value: parentCompanyId,
          },
        ],
      };
      
      return this.find(mergedOptions);
    }
    
    // If options object was provided, ensure we filter by parent company ID
    const mergedOptions: FindOptions<B2BCustomer> = {
      ...tenantIdOrOptions,
      filter: {
        ...(tenantIdOrOptions.filter || {}),
        isDeleted: false,
      },
      advancedFilters: [
        ...(tenantIdOrOptions.advancedFilters || []),
        {
          field: 'organizationalHierarchy.parentCompanyId',
          operator: '==',
          value: parentCompanyId,
        },
      ],
    };
    
    return this.find(mergedOptions);
  }
}
