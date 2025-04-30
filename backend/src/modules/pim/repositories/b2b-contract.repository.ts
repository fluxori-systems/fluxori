/**
 * B2B Contract Repository
 *
 * Repository for managing B2B customer contract data.
 * Implements standardized repository pattern with tenant awareness.
 */
import { Injectable, Logger } from '@nestjs/common';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { CustomerContract, ContractStatus } from '../models/b2b/contract.model';
import { FindByIdOptions, FindOptions } from '../../../common/repositories/base/repository-types';

/**
 * Repository for B2B customer contracts
 * Implements standardized tenant-aware repository pattern
 */
@Injectable()
export class B2BContractRepository extends FirestoreBaseRepository<CustomerContract> {
  protected readonly logger = new Logger(B2BContractRepository.name);

  /**
   * Constructor initializes the repository with collection name and options
   * @param firestoreConfigService Firestore configuration service
   */
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'b2b_contracts', {
      useSoftDeletes: true,
      useVersioning: true,
    });
  }

  /**
   * Find a contract by ID with tenant awareness
   * @param id The contract ID
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns The contract or null if not found
   */
  async findById(
    id: string,
    tenantIdOrOptions?: string | FindByIdOptions,
    options?: FindByIdOptions,
  ): Promise<CustomerContract | null> {
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
   * Find all contracts for a tenant
   * @param tenantId The tenant ID (organization ID)
   * @param options Optional find options
   * @returns Array of contracts for the tenant
   */
  async findByTenant(
    tenantId: string,
    options?: Partial<Omit<FindOptions<CustomerContract>, 'filter'>>,
  ): Promise<CustomerContract[]> {
    this.logger.debug(`Finding all contracts for tenant: ${tenantId}`);
    
    const mergedOptions: FindOptions<CustomerContract> = {
      ...options,
      filter: {
        organizationId: tenantId,
        isDeleted: false,
      },
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Find a contract by its contract number with tenant awareness
   * @param contractNumber The unique contract number
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns The contract or null if not found
   */
  async findByContractNumber(
    contractNumber: string,
    tenantIdOrOptions: string | FindOptions<CustomerContract>,
    options?: FindOptions<CustomerContract>,
  ): Promise<CustomerContract | null> {
    this.logger.debug(`Finding contract by number: ${contractNumber}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<CustomerContract> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          organizationId: tenantId,
          isDeleted: false,
        },
      };
      
      return this.findOneBy('contractNumber', contractNumber, mergedOptions);
    }
    
    return this.findOneBy('contractNumber', contractNumber, tenantIdOrOptions);
  }

  /**
   * Find active contracts for a customer with tenant awareness
   * @param customerId The customer ID
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of active contracts for the customer
   */
  async findActiveContractsByCustomer(
    customerId: string,
    tenantIdOrOptions: string | FindOptions<CustomerContract>,
    options?: FindOptions<CustomerContract>,
  ): Promise<CustomerContract[]> {
    this.logger.debug(`Finding active contracts for customer: ${customerId}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<CustomerContract> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          customerId,
          organizationId: tenantId,
          status: ContractStatus.ACTIVE,
          isDeleted: false,
        },
      };
      
      return this.find(mergedOptions);
    }
    
    // If options object was provided, ensure we filter by customer ID and active status
    const mergedOptions: FindOptions<CustomerContract> = {
      ...tenantIdOrOptions,
      filter: {
        ...(tenantIdOrOptions.filter || {}),
        customerId,
        status: ContractStatus.ACTIVE,
        isDeleted: false,
      },
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Find contracts by customer group ID with tenant awareness
   * @param customerGroupId The customer group ID
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of contracts for the customer group
   */
  async findByCustomerGroup(
    customerGroupId: string,
    tenantIdOrOptions: string | FindOptions<CustomerContract>,
    options?: FindOptions<CustomerContract>,
  ): Promise<CustomerContract[]> {
    this.logger.debug(`Finding contracts by customer group: ${customerGroupId}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<CustomerContract> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          customerGroupId,
          organizationId: tenantId,
          isDeleted: false,
        },
      };
      
      return this.find(mergedOptions);
    }
    
    // If options object was provided, ensure we filter by customer group ID
    const mergedOptions: FindOptions<CustomerContract> = {
      ...tenantIdOrOptions,
      filter: {
        ...(tenantIdOrOptions.filter || {}),
        customerGroupId,
        isDeleted: false,
      },
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Find contracts by status with tenant awareness
   * @param status The contract status
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of contracts with the specified status
   */
  async findByStatus(
    status: ContractStatus,
    tenantIdOrOptions: string | FindOptions<CustomerContract>,
    options?: FindOptions<CustomerContract>,
  ): Promise<CustomerContract[]> {
    this.logger.debug(`Finding contracts by status: ${status}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<CustomerContract> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          status,
          organizationId: tenantId,
          isDeleted: false,
        },
      };
      
      return this.find(mergedOptions);
    }
    
    // If options object was provided, ensure we filter by status
    const mergedOptions: FindOptions<CustomerContract> = {
      ...tenantIdOrOptions,
      filter: {
        ...(tenantIdOrOptions.filter || {}),
        status,
        isDeleted: false,
      },
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Find contracts that expire soon (within the next X days) with tenant awareness
   * @param days Number of days in the future to check
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of contracts expiring within the specified days
   */
  async findContractsExpiringWithinDays(
    days: number,
    tenantIdOrOptions: string | FindOptions<CustomerContract>,
    options?: FindOptions<CustomerContract>,
  ): Promise<CustomerContract[]> {
    this.logger.debug(`Finding contracts expiring within ${days} days`);
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);
    
    // Handle overloaded method signature
    let baseContracts: CustomerContract[];
    
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<CustomerContract> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          status: ContractStatus.ACTIVE,
          organizationId: tenantId,
          isDeleted: false,
        },
      };
      
      baseContracts = await this.find(mergedOptions);
    } else {
      // If options object was provided, ensure we filter by active status
      const mergedOptions: FindOptions<CustomerContract> = {
        ...tenantIdOrOptions,
        filter: {
          ...(tenantIdOrOptions.filter || {}),
          status: ContractStatus.ACTIVE,
          isDeleted: false,
        },
      };
      
      baseContracts = await this.find(mergedOptions);
    }
    
    // Firestore can't do range queries with multiple inequalities on different fields, so use in-memory filtering
    return baseContracts.filter(
      (contract) =>
        contract.endDate >= now && contract.endDate <= futureDate
    );
  }

  /**
   * Find contracts eligible for renewal with tenant awareness
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as first parameter)
   * @returns Array of contracts eligible for renewal
   */
  async findRenewalEligibleContracts(
    tenantIdOrOptions: string | FindOptions<CustomerContract>,
    options?: FindOptions<CustomerContract>,
  ): Promise<CustomerContract[]> {
    this.logger.debug('Finding renewal eligible contracts');
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + 30); // Next 30 days
    
    // Handle overloaded method signature
    let baseContracts: CustomerContract[];
    
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<CustomerContract> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          autoRenew: true,
          organizationId: tenantId,
          isDeleted: false,
        },
      };
      
      baseContracts = await this.find(mergedOptions);
    } else {
      // If options object was provided, ensure we filter by autoRenew
      const mergedOptions: FindOptions<CustomerContract> = {
        ...tenantIdOrOptions,
        filter: {
          ...(tenantIdOrOptions.filter || {}),
          autoRenew: true,
          isDeleted: false,
        },
      };
      
      baseContracts = await this.find(mergedOptions);
    }
    
    // Firestore can't do range queries with multiple inequalities on different fields, so use in-memory filtering
    return baseContracts.filter(
      (contract) => contract.endDate <= futureDate
    );
  }

  /**
   * Find contracts with specified minimum global discount with tenant awareness
   * @param minimumDiscount Minimum discount percentage to filter by
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of contracts offering at least the minimum discount
   */
  async findByMinimumGlobalDiscount(
    minimumDiscount: number,
    tenantIdOrOptions: string | FindOptions<CustomerContract>,
    options?: FindOptions<CustomerContract>,
  ): Promise<CustomerContract[]> {
    this.logger.debug(`Finding contracts with minimum discount: ${minimumDiscount}%`);
    
    // Handle overloaded method signature
    let baseContracts: CustomerContract[];
    
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<CustomerContract> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          status: ContractStatus.ACTIVE,
          organizationId: tenantId,
          isDeleted: false,
        },
      };
      
      baseContracts = await this.find(mergedOptions);
    } else {
      // If options object was provided, ensure we filter by active status
      const mergedOptions: FindOptions<CustomerContract> = {
        ...tenantIdOrOptions,
        filter: {
          ...(tenantIdOrOptions.filter || {}),
          status: ContractStatus.ACTIVE,
          isDeleted: false,
        },
      };
      
      baseContracts = await this.find(mergedOptions);
    }
    
    // Firestore can't filter nested fields, so use in-memory filtering
    return baseContracts.filter(
      (contract) =>
        contract.pricingTerms &&
        contract.pricingTerms.globalDiscountPercentage !== undefined &&
        contract.pricingTerms.globalDiscountPercentage >= minimumDiscount
    );
  }
}
