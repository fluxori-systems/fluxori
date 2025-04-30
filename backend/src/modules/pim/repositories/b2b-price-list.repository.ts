/**
 * B2B Price List Repository
 *
 * Repository for managing B2B price list data.
 * Implements standardized repository pattern with tenant awareness.
 */
import { Injectable, Logger } from '@nestjs/common';
import { 
  QueryFilterOperator,
  FindByIdOptions,
  FindOptions,
  UpdateDocumentOptions
} from '../../../common/repositories/base/repository-types';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { B2BPriceList } from '../models/b2b/price-list.model';

/**
 * Repository for B2B price lists
 * Implements standardized tenant-aware repository pattern
 */
@Injectable()
export class B2BPriceListRepository extends FirestoreBaseRepository<B2BPriceList> {
  protected readonly logger = new Logger(B2BPriceListRepository.name);

  /**
   * Constructor initializes the repository with collection name and options
   * @param firestoreConfigService Firestore configuration service
   */
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'b2b_price_lists', {
      useSoftDeletes: true,
      useVersioning: true,
    });
  }

  /**
   * Find a price list by ID with tenant awareness
   * @param id The price list ID
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns The price list or null if not found
   */
  async findById(
    id: string,
    tenantIdOrOptions?: string | FindByIdOptions,
    options?: FindByIdOptions,
  ): Promise<B2BPriceList | null> {
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
   * Find all price lists for a tenant
   * @param tenantId The tenant ID (organization ID)
   * @param options Optional find options
   * @returns Array of price lists for the tenant
   */
  async findByTenant(
    tenantId: string,
    options?: Partial<Omit<FindOptions<B2BPriceList>, 'filter'>>,
  ): Promise<B2BPriceList[]> {
    this.logger.debug(`Finding all price lists for tenant: ${tenantId}`);
    
    const mergedOptions: FindOptions<B2BPriceList> = {
      ...options,
      filter: {
        organizationId: tenantId,
        isDeleted: false,
      },
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Find active price lists with tenant awareness
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as first parameter)
   * @returns Array of active price lists
   */
  async findActivePriceLists(
    tenantIdOrOptions: string | FindOptions<B2BPriceList>,
    options?: FindOptions<B2BPriceList>,
  ): Promise<B2BPriceList[]> {
    this.logger.debug('Finding active price lists');
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<B2BPriceList> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          isActive: true,
          organizationId: tenantId,
          isDeleted: false,
        },
      };
      
      return this.find(mergedOptions);
    }
    
    // If options object was provided
    const mergedOptions: FindOptions<B2BPriceList> = {
      ...tenantIdOrOptions,
      filter: {
        ...(tenantIdOrOptions.filter || {}),
        isActive: true,
        isDeleted: false,
      },
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Find price lists by customer group ID with tenant awareness
   * @param groupId The customer group ID
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of price lists for the specified group
   */
  async findByGroupId(
    groupId: string,
    tenantIdOrOptions: string | FindOptions<B2BPriceList>,
    options?: FindOptions<B2BPriceList>,
  ): Promise<B2BPriceList[]> {
    this.logger.debug(`Finding price lists by group ID: ${groupId}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<B2BPriceList> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          organizationId: tenantId,
          isActive: true,
          isDeleted: false,
        },
        advancedFilters: [
          ...(options?.advancedFilters || []),
          {
            field: 'customerGroupIds',
            operator: 'array-contains',
            value: groupId,
          },
        ],
      };
      
      return this.find(mergedOptions);
    }
    
    // If options object was provided
    const mergedOptions: FindOptions<B2BPriceList> = {
      ...tenantIdOrOptions,
      filter: {
        ...(tenantIdOrOptions.filter || {}),
        isActive: true,
        isDeleted: false,
      },
      advancedFilters: [
        ...(tenantIdOrOptions.advancedFilters || []),
        {
          field: 'customerGroupIds',
          operator: 'array-contains',
          value: groupId,
        },
      ],
    };
    
    return this.find(mergedOptions);
  }

  async findByCustomerTier(
    customerTierId: string,
    tenantIdOrOptions: string | FindOptions<B2BPriceList>,
    options?: FindOptions<B2BPriceList>,
  ): Promise<B2BPriceList[]> {
    this.logger.debug(`Finding price lists by tier ID: ${customerTierId}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<B2BPriceList> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          organizationId: tenantId,
          isActive: true,
          isDeleted: false,
        },
        advancedFilters: [
          ...(options?.advancedFilters || []),
          {
            field: 'customerTierIds',
            operator: 'array-contains',
            value: customerTierId,
          },
        ],
      };
      
      return this.find(mergedOptions);
    }
    
    // If options object was provided
    const mergedOptions: FindOptions<B2BPriceList> = {
      ...tenantIdOrOptions,
      filter: {
        ...(tenantIdOrOptions.filter || {}),
        isActive: true,
        isDeleted: false,
      },
      advancedFilters: [
        ...(tenantIdOrOptions.advancedFilters || []),
        {
          field: 'customerTierIds',
          operator: 'array-contains',
          value: customerTierId,
        },
      ],
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Find price lists applicable to a specific customer with tenant awareness
   * @param customerId The customer ID
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of price lists for the specified customer
   */
  async findByCustomer(
    customerId: string,
    tenantIdOrOptions: string | FindOptions<B2BPriceList>,
    options?: FindOptions<B2BPriceList>,
  ): Promise<B2BPriceList[]> {
    this.logger.debug(`Finding price lists by customer ID: ${customerId}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<B2BPriceList> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          organizationId: tenantId,
          isActive: true,
          isDeleted: false,
        },
        advancedFilters: [
          ...(options?.advancedFilters || []),
          {
            field: 'customerIds',
            operator: 'array-contains',
            value: customerId,
          },
        ],
      };
      
      return this.find(mergedOptions);
    }
    
    // If options object was provided
    const mergedOptions: FindOptions<B2BPriceList> = {
      ...tenantIdOrOptions,
      filter: {
        ...(tenantIdOrOptions.filter || {}),
        isActive: true,
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
    
    return this.find(mergedOptions);
  }

  /**
   * Get price lists by product ID with tenant awareness
   * @param productId The product ID
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of price lists containing the specified product
   */
  async findByProduct(
    productId: string,
    tenantIdOrOptions: string | FindOptions<B2BPriceList>,
    options?: FindOptions<B2BPriceList>,
  ): Promise<B2BPriceList[]> {
    this.logger.debug(`Finding price lists by product ID: ${productId}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<B2BPriceList> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          organizationId: tenantId,
          isActive: true,
          isDeleted: false,
        },
        advancedFilters: [
          ...(options?.advancedFilters || []),
          {
            field: 'productIds',
            operator: 'array-contains',
            value: productId,
          },
        ],
      };
      
      return this.find(mergedOptions);
    }
    
    // If options object was provided
    const mergedOptions: FindOptions<B2BPriceList> = {
      ...tenantIdOrOptions,
      filter: {
        ...(tenantIdOrOptions.filter || {}),
        isActive: true,
        isDeleted: false,
      },
      advancedFilters: [
        ...(tenantIdOrOptions.advancedFilters || []),
        {
          field: 'productIds',
          operator: 'array-contains',
          value: productId,
        },
      ],
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Find price lists by contract ID with tenant awareness
   * @param contractId The contract ID
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as second parameter)
   * @returns Array of price lists associated with the specified contract
   */
  async findByContractId(
    contractId: string,
    tenantIdOrOptions: string | FindOptions<B2BPriceList>,
    options?: FindOptions<B2BPriceList>,
  ): Promise<B2BPriceList[]> {
    this.logger.debug(`Finding price lists by contract ID: ${contractId}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<B2BPriceList> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          organizationId: tenantId,
          isActive: true,
          isDeleted: false,
        },
        advancedFilters: [
          ...(options?.advancedFilters || []),
          {
            field: 'contractIds',
            operator: 'array-contains',
            value: contractId,
          },
        ],
      };
      
      return this.find(mergedOptions);
    }
    
    // If options object was provided
    const mergedOptions: FindOptions<B2BPriceList> = {
      ...tenantIdOrOptions,
      filter: {
        ...(tenantIdOrOptions.filter || {}),
        isActive: true,
        isDeleted: false,
      },
      advancedFilters: [
        ...(tenantIdOrOptions.advancedFilters || []),
        {
          field: 'contractIds',
          operator: 'array-contains',
          value: contractId,
        },
      ],
    };
    
    return this.find(mergedOptions);
  }

  async findByRegion(
    region: string,
    tenantIdOrOptions: string | FindOptions<B2BPriceList>,
    options?: FindOptions<B2BPriceList>,
  ): Promise<B2BPriceList[]> {
    this.logger.debug(`Finding price lists by region: ${region}`);
    
    // Handle overloaded method signature
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const mergedOptions: FindOptions<B2BPriceList> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          organizationId: tenantId,
          isActive: true,
          isDeleted: false,
        },
        advancedFilters: [
          ...(options?.advancedFilters || []),
          {
            field: 'regionCodes',
            operator: 'array-contains',
            value: region,
          },
        ],
      };
      
      return this.find(mergedOptions);
    }
    
    // If options object was provided
    const mergedOptions: FindOptions<B2BPriceList> = {
      ...tenantIdOrOptions,
      filter: {
        ...(tenantIdOrOptions.filter || {}),
        isActive: true,
        isDeleted: false,
      },
      advancedFilters: [
        ...(tenantIdOrOptions.advancedFilters || []),
        {
          field: 'regionCodes',
          operator: 'array-contains',
          value: region,
        },
      ],
    };
    
    return this.find(mergedOptions);
  }

  /**
   * Get a product's price from a specific price list with tenant awareness
   * @param priceListId The price list ID
   * @param productId The product ID
   * @param tenantId Optional tenant ID for security
   * @returns The price object or null if not found
   */
  async getProductPrice(
    priceListId: string,
    productId: string,
    tenantId?: string,
  ): Promise<any | null> {
    this.logger.debug(`Getting price for product ${productId} from price list ${priceListId}`);
    
    // If tenant ID is provided, use it for security filtering
    let priceList: B2BPriceList | null;
    
    if (tenantId) {
      // First find document by ID
      priceList = await super.findById(priceListId);
      
      // Then check if it belongs to the specified tenant
      if (!priceList || priceList.organizationId !== tenantId) {
        return null;
      }
    } else {
      priceList = await super.findById(priceListId);
    }

    if (!priceList || !priceList.prices) {
      return null;
    }

    return priceList.prices.find((p) => p.productId === productId) || null;
  }

  /**
   * Add or update a product price in a price list with tenant awareness
   * @param priceListId The price list ID
   * @param productPrice The product price object
   * @param tenantId Optional tenant ID for security
   * @returns The updated price list
   */
  async updateProductPrice(
    priceListId: string,
    productPrice: {
      productId: string;
      price: number;
      sku: string;
      isActive: boolean;
      currencyCode?: string;
      startDate?: Date;
      endDate?: Date;
      minimumQuantity?: number;
      discountType?: string;
      discountValue?: number;
      notes?: string;
    },
    tenantId?: string,
  ): Promise<B2BPriceList> {
    this.logger.debug(`Updating price for product ${productPrice.productId} in price list ${priceListId}`);
    
    // If tenant ID is provided, use it for security
    let priceList: B2BPriceList | null;
    
    if (tenantId) {
      // First find document by ID
      priceList = await super.findById(priceListId);
      
      // Then check if it belongs to the specified tenant
      if (!priceList || priceList.organizationId !== tenantId) {
        throw new Error(`Price list with ID ${priceListId} not found or not authorized`);
      }
    } else {
      priceList = await super.findById(priceListId);
    }

    if (!priceList) {
      throw new Error(`Price list with ID ${priceListId} not found`);
    }

    if (!priceList.prices) {
      priceList.prices = [];
    }

    // Find existing price or create new one
    const existingPriceIndex = priceList.prices.findIndex(
      (p) => p.productId === productPrice.productId,
    );

    if (existingPriceIndex >= 0) {
      // Update existing price
      priceList.prices[existingPriceIndex] = {
        ...priceList.prices[existingPriceIndex],
        ...productPrice,
        updatedAt: new Date(),
      };
    } else {
      // Add new price
      priceList.prices.push({
        ...productPrice,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Update price list with new prices
    // Using Set constructor with spread operator
    // First convert to array if needed
    const productIds = priceList.productIds || [];
    const newProductIds = Array.from(new Set([...productIds, productPrice.productId]));
    
    return this.update(
      priceListId,
      {
        prices: priceList.prices,
        productIds: newProductIds,
      },
    );
  }

  /**
   * Remove a product price from a price list with tenant awareness
   * @param priceListId The price list ID
   * @param productId The product ID
   * @param tenantId Optional tenant ID for security
   * @returns The updated price list
   */
  async removeProductPrice(
    priceListId: string,
    productId: string,
    tenantId?: string,
  ): Promise<B2BPriceList> {
    this.logger.debug(`Removing price for product ${productId} from price list ${priceListId}`);
    
    // If tenant ID is provided, use it for security
    let priceList: B2BPriceList | null;
    
    if (tenantId) {
      // First find document by ID
      priceList = await super.findById(priceListId);
      
      // Then check if it belongs to the specified tenant
      if (!priceList || priceList.organizationId !== tenantId) {
        throw new Error(`Price list with ID ${priceListId} not found or not authorized`);
      }
    } else {
      priceList = await super.findById(priceListId);
    }

    if (!priceList || !priceList.prices) {
      throw new Error(
        `Price list with ID ${priceListId} not found or has no prices`,
      );
    }

    // Remove price
    const updatedPrices = priceList.prices.filter(
      (p) => p.productId !== productId,
    );

    // Remove from product IDs as well if no other prices use this product
    const updatedProductIds = updatedPrices.some(
      (p) => p.productId === productId,
    )
      ? priceList.productIds
      : (priceList.productIds || []).filter((id) => id !== productId);

    // Update price list with new prices
    return this.update(
      priceListId,
      {
        prices: updatedPrices,
        productIds: updatedProductIds,
      },
    );
  }

  /**
   * Find price lists by date range with tenant awareness
   * @param startDate The start date for validity
   * @param endDate The end date for validity (optional)
   * @param tenantIdOrOptions The tenant ID or find options
   * @param options Optional find options (if tenant ID is provided as third parameter)
   * @returns Array of price lists valid in the specified date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date | null,
    tenantIdOrOptions: string | FindOptions<B2BPriceList>,
    options?: FindOptions<B2BPriceList>,
  ): Promise<B2BPriceList[]> {
    this.logger.debug(`Finding price lists by date range: ${startDate} - ${endDate || 'open end'}`);
    
    // Handle overloaded method signature
    let results: B2BPriceList[];
    
    if (typeof tenantIdOrOptions === 'string') {
      const tenantId = tenantIdOrOptions;
      const searchOptions: FindOptions<B2BPriceList> = {
        ...options,
        filter: {
          ...(options?.filter || {}),
          organizationId: tenantId,
          isActive: true,
          isDeleted: false,
        },
        advancedFilters: [
          ...(options?.advancedFilters || []),
          {
            field: 'validFrom',
            operator: '<=' as QueryFilterOperator,
            value: startDate,
          },
          ...(endDate ? [
            {
              field: 'validTo',
              operator: '>=' as QueryFilterOperator,
              value: endDate,
            },
          ] : []),
        ],
      };
      
      results = await this.find(searchOptions);
    } else {
      // If options object was provided
      const searchOptions: FindOptions<B2BPriceList> = {
        ...tenantIdOrOptions,
        filter: {
          ...(tenantIdOrOptions.filter || {}),
          isActive: true,
          isDeleted: false,
        },
        advancedFilters: [
          ...(tenantIdOrOptions.advancedFilters || []),
          {
            field: 'validFrom',
            operator: '<=' as QueryFilterOperator,
            value: startDate,
          },
          ...(endDate ? [
            {
              field: 'validTo',
              operator: '>=' as QueryFilterOperator,
              value: endDate,
            },
          ] : []),
        ],
      };
      
      results = await this.find(searchOptions);
    }
    
    // If no end date provided, filter locally for null validTo or validTo >= startDate
    if (!endDate) {
      return results.filter((pl) => !pl.validTo || pl.validTo >= startDate);
    }
    
    return results;
  }
}
