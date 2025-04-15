/**
 * B2B Service
 * 
 * Core service for B2B functionality, providing customer management, 
 * pricing, contract management, and order processing for business customers.
 */
import { Injectable, Logger, Inject } from '@nestjs/common';
import { B2BCustomerRepository } from '../../repositories/b2b-customer.repository';
import { CustomerTierRepository } from '../../repositories/customer-tier.repository';
import { CustomerGroupRepository } from '../../repositories/customer-group.repository';
import { B2BPriceListRepository } from '../../repositories/b2b-price-list.repository';
import { B2BContractRepository } from '../../repositories/b2b-contract.repository';
import { PurchaseOrderRepository } from '../../repositories/purchase-order.repository';
import { ApprovalWorkflowRepository } from '../../repositories/approval-workflow.repository';
import { ProductService } from '../product.service';
import { DynamicPricingService } from '../dynamic-pricing.service';
import { 
  B2BCustomer, 
  B2BAccountType, 
  B2BCustomerStatus, 
  CreditStatus 
} from '../../models/b2b/customer.model';
import { 
  CustomerTier, 
  CustomerTierType, 
  CustomerGroup 
} from '../../models/b2b/customer-tier.model';
import { 
  B2BPriceList, 
  PriceListType, 
  PriceListEntry,
  ProductVolumePrice 
} from '../../models/b2b/price-list.model';
import { 
  CustomerContract, 
  ContractStatus, 
  ContractPricingTerms 
} from '../../models/b2b/contract.model';
import { 
  PurchaseOrder, 
  PurchaseOrderStatus, 
  ApprovalWorkflow, 
  ApprovalAction,
  ApprovalActionType 
} from '../../models/b2b/purchase-order.model';

/**
 * B2B pricing calculation result
 */
interface B2BPriceCalculationResult {
  /**
   * Original product price
   */
  originalPrice: number;
  
  /**
   * Final calculated price
   */
  finalPrice: number;
  
  /**
   * Apply discount percentage (if applicable)
   */
  discountPercentage?: number;
  
  /**
   * Discount amount (if applicable)
   */
  discountAmount?: number;
  
  /**
   * Special price source
   */
  priceSource: 'standard' | 'tier' | 'group' | 'contract' | 'price_list' | 'volume' | 'custom';
  
  /**
   * Price list ID (if applicable)
   */
  priceListId?: string;
  
  /**
   * Contract ID (if applicable)
   */
  contractId?: string;
  
  /**
   * Tier ID (if applicable)
   */
  tierId?: string;
  
  /**
   * Group ID (if applicable)
   */
  groupId?: string;
  
  /**
   * Minimum order quantity for this price (if applicable)
   */
  minimumOrderQuantity?: number;
  
  /**
   * Whether the price is locked (e.g., by contract)
   */
  priceLocked?: boolean;
}

/**
 * Service for managing B2B commerce functionality
 */
@Injectable()
export class B2BService {
  private readonly logger = new Logger(B2BService.name);
  
  /**
   * Constructor injects required repositories and services
   */
  constructor(
    private readonly b2bCustomerRepository: B2BCustomerRepository,
    private readonly customerTierRepository: CustomerTierRepository,
    private readonly customerGroupRepository: CustomerGroupRepository,
    private readonly priceListRepository: B2BPriceListRepository,
    private readonly contractRepository: B2BContractRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly approvalWorkflowRepository: ApprovalWorkflowRepository,
    private readonly productService: ProductService,
    private readonly dynamicPricingService: DynamicPricingService,
    @Inject('MARKET_CONTEXT_OPTIONS') private readonly marketContextOptions: any
  ) {
    this.logger.log('B2B Service initialized');
  }
  
  /*
   * Customer Management
   */
  
  /**
   * Create a new B2B customer
   * @param customer The customer data to create
   * @returns The created customer with ID
   */
  async createCustomer(customer: B2BCustomer): Promise<B2BCustomer> {
    // Check if customer with same number already exists
    const existing = await this.b2bCustomerRepository.findByCustomerNumber(
      customer.customerNumber,
      customer.organizationId
    );
    
    if (existing) {
      throw new Error(`Customer with number ${customer.customerNumber} already exists`);
    }
    
    // Set default values if not provided
    const now = new Date();
    const newCustomer: B2BCustomer = {
      ...customer,
      status: customer.status || B2BCustomerStatus.PENDING_APPROVAL,
      createdAt: now,
      updatedAt: now,
      paymentInfo: {
        ...customer.paymentInfo,
        creditStatus: customer.paymentInfo?.creditStatus || CreditStatus.NOT_ELIGIBLE,
        requiresPurchaseOrder: customer.paymentInfo?.requiresPurchaseOrder !== undefined 
          ? customer.paymentInfo.requiresPurchaseOrder 
          : false,
        isTaxExempt: customer.paymentInfo?.isTaxExempt || false
      },
      isVip: customer.isVip || false,
      defaultCurrencyCode: customer.defaultCurrencyCode || this.getDefaultCurrencyForRegion(customer.marketRegion)
    };
    
    // Save the customer to the database
    return this.b2bCustomerRepository.create(newCustomer);
  }
  
  /**
   * Update an existing B2B customer
   * @param id Customer ID
   * @param updates The customer data updates
   * @returns The updated customer
   */
  async updateCustomer(id: string, updates: Partial<B2BCustomer>): Promise<B2BCustomer> {
    const existing = await this.b2bCustomerRepository.findById(id);
    
    if (!existing) {
      throw new Error(`Customer with ID ${id} not found`);
    }
    
    // Prevent changing organizationId
    if (updates.organizationId && updates.organizationId !== existing.organizationId) {
      throw new Error('Cannot change organization ID of an existing customer');
    }
    
    // Prevent changing customerNumber
    if (updates.customerNumber && updates.customerNumber !== existing.customerNumber) {
      throw new Error('Cannot change customer number of an existing customer');
    }
    
    // Update customer record
    const updatedCustomer: B2BCustomer = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    
    return this.b2bCustomerRepository.update(id, updatedCustomer);
  }
  
  /**
   * Find a B2B customer by ID
   * @param id The customer ID
   * @returns The customer if found
   */
  async findCustomerById(id: string): Promise<B2BCustomer> {
    const customer = await this.b2bCustomerRepository.findById(id);
    
    if (!customer) {
      throw new Error(`Customer with ID ${id} not found`);
    }
    
    return customer;
  }
  
  /**
   * Find customers with various filter criteria
   * @param filters Filter criteria
   * @param organizationId The organization ID
   * @returns Array of matching customers
   */
  async findCustomers(
    filters: {
      tierId?: string;
      groupId?: string;
      status?: B2BCustomerStatus;
      accountType?: B2BAccountType;
      creditStatus?: CreditStatus;
      marketRegion?: string;
    },
    organizationId: string
  ): Promise<B2BCustomer[]> {
    if (filters.tierId) {
      return this.b2bCustomerRepository.findByTierId(filters.tierId, organizationId);
    }
    
    if (filters.groupId) {
      return this.b2bCustomerRepository.findByGroupId(filters.groupId, organizationId);
    }
    
    if (filters.status) {
      return this.b2bCustomerRepository.findByStatus(filters.status, organizationId);
    }
    
    if (filters.accountType) {
      return this.b2bCustomerRepository.findByAccountType(filters.accountType, organizationId);
    }
    
    if (filters.creditStatus) {
      return this.b2bCustomerRepository.findByCreditStatus(filters.creditStatus, organizationId);
    }
    
    if (filters.marketRegion) {
      return this.b2bCustomerRepository.findByMarketRegion(filters.marketRegion, organizationId);
    }
    
    // If no specific filters, get all customers for the organization
    return this.b2bCustomerRepository.findByOrganizationId(organizationId);
  }
  
  /*
   * Customer Tier Management
   */
  
  /**
   * Create a new customer tier
   * @param tier The tier data to create
   * @returns The created tier with ID
   */
  async createCustomerTier(tier: CustomerTier): Promise<CustomerTier> {
    // Check if tier with same code already exists
    const existing = await this.customerTierRepository.findByCode(
      tier.code,
      tier.organizationId
    );
    
    if (existing) {
      throw new Error(`Tier with code ${tier.code} already exists`);
    }
    
    // Set default values if not provided
    const now = new Date();
    const newTier: CustomerTier = {
      ...tier,
      isActive: tier.isActive !== undefined ? tier.isActive : true,
      allowsPaymentTerms: tier.allowsPaymentTerms !== undefined ? tier.allowsPaymentTerms : false,
      enableCreditLimits: tier.enableCreditLimits !== undefined ? tier.enableCreditLimits : false,
      hasSpecialPaymentMethods: tier.hasSpecialPaymentMethods !== undefined ? tier.hasSpecialPaymentMethods : false,
      visibility: tier.visibility || 'public',
      createdAt: now,
      updatedAt: now
    };
    
    // Save the tier to the database
    return this.customerTierRepository.create(newTier);
  }
  
  /**
   * Assign a customer to a tier
   * @param customerId The customer ID
   * @param tierId The tier ID to assign
   * @returns The updated customer
   */
  async assignCustomerToTier(customerId: string, tierId: string): Promise<B2BCustomer> {
    // Verify customer and tier exist
    const [customer, tier] = await Promise.all([
      this.b2bCustomerRepository.findById(customerId),
      this.customerTierRepository.findById(tierId)
    ]);
    
    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }
    
    if (!tier) {
      throw new Error(`Tier with ID ${tierId} not found`);
    }
    
    // Update customer with new tier ID
    return this.b2bCustomerRepository.update(customerId, {
      ...customer,
      customerTierId: tierId,
      updatedAt: new Date()
    });
  }
  
  /**
   * Create a new customer group
   * @param group The group data to create
   * @returns The created group with ID
   */
  async createCustomerGroup(group: CustomerGroup): Promise<CustomerGroup> {
    // Verify tier exists
    const tier = await this.customerTierRepository.findById(group.tierId);
    
    if (!tier) {
      throw new Error(`Tier with ID ${group.tierId} not found`);
    }
    
    // Set default values if not provided
    const now = new Date();
    const newGroup: CustomerGroup = {
      ...group,
      isActive: group.isActive !== undefined ? group.isActive : true,
      createdAt: now,
      updatedAt: now
    };
    
    // Save the group to the database
    return this.customerGroupRepository.create(newGroup);
  }
  
  /**
   * Add a customer to a group
   * @param customerId The customer ID
   * @param groupId The group ID
   * @returns The updated group
   */
  async addCustomerToGroup(customerId: string, groupId: string): Promise<CustomerGroup> {
    // Verify customer and group exist
    const [customer, group] = await Promise.all([
      this.b2bCustomerRepository.findById(customerId),
      this.customerGroupRepository.findById(groupId)
    ]);
    
    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }
    
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`);
    }
    
    // Check if customer is already in the group
    if (group.customerIds.includes(customerId)) {
      return group; // Customer already in group, no changes needed
    }
    
    // Add customer to group
    const updatedGroup: CustomerGroup = {
      ...group,
      customerIds: [...group.customerIds, customerId],
      updatedAt: new Date()
    };
    
    // Update customer's groups
    const customerGroupIds = customer.customerGroupIds || [];
    if (!customerGroupIds.includes(groupId)) {
      await this.b2bCustomerRepository.update(customerId, {
        ...customer,
        customerGroupIds: [...customerGroupIds, groupId],
        updatedAt: new Date()
      });
    }
    
    // Save updated group
    return this.customerGroupRepository.update(groupId, updatedGroup);
  }
  
  /*
   * Price List Management
   */
  
  /**
   * Create a new B2B price list
   * @param priceList The price list data to create
   * @returns The created price list with ID
   */
  async createPriceList(priceList: B2BPriceList): Promise<B2BPriceList> {
    // Set default values if not provided
    const now = new Date();
    const newPriceList: B2BPriceList = {
      ...priceList,
      isActive: priceList.isActive !== undefined ? priceList.isActive : true,
      priority: priceList.priority || 0,
      enableVolumePricing: priceList.enableVolumePricing !== undefined ? priceList.enableVolumePricing : false,
      enableRegionalPricing: priceList.enableRegionalPricing !== undefined ? priceList.enableRegionalPricing : false,
      createdAt: now,
      updatedAt: now
    };
    
    // Save the price list to the database
    return this.priceListRepository.create(newPriceList);
  }
  
  /**
   * Add a product to a price list
   * @param priceListId The price list ID
   * @param priceEntry The price entry to add
   * @returns The updated price list
   */
  async addProductToPriceList(
    priceListId: string,
    priceEntry: PriceListEntry
  ): Promise<B2BPriceList> {
    // Verify price list exists
    const priceList = await this.priceListRepository.findById(priceListId);
    
    if (!priceList) {
      throw new Error(`Price list with ID ${priceListId} not found`);
    }
    
    // Check if product already exists in price list
    const existingIndex = priceList.prices.findIndex(p => p.productId === priceEntry.productId);
    
    if (existingIndex >= 0) {
      // Update existing entry
      priceList.prices[existingIndex] = {
        ...priceList.prices[existingIndex],
        ...priceEntry
      };
    } else {
      // Add new entry
      priceList.prices.push({
        ...priceEntry,
        isActive: priceEntry.isActive !== undefined ? priceEntry.isActive : true
      });
    }
    
    // Update the price list
    return this.priceListRepository.update(priceListId, {
      ...priceList,
      updatedAt: new Date()
    });
  }
  
  /**
   * Find price lists for a customer
   * @param customerId The customer ID
   * @param organizationId The organization ID
   * @returns Array of applicable price lists in priority order
   */
  async findPriceListsForCustomer(
    customerId: string,
    organizationId: string
  ): Promise<B2BPriceList[]> {
    // Get the customer record
    const customer = await this.b2bCustomerRepository.findById(customerId);
    
    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }
    
    // Build an array of price lists from various sources
    const priceListPromises: Promise<B2BPriceList[]>[] = [
      // 1. Direct customer price lists
      this.priceListRepository.findByCustomerId(customerId, organizationId),
      
      // 2. Customer group price lists
      ...(customer.customerGroupIds?.map(groupId => 
        this.priceListRepository.findByGroupId(groupId, organizationId)
      ) || []),
      
      // 3. Customer tier price lists
      ...(customer.customerTierId ? [
        this.priceListRepository.findByTierId(customer.customerTierId, organizationId)
      ] : [])
    ];
    
    // Get contracts for this customer to find contract price lists
    const contracts = await this.contractRepository.findActiveContractsByCustomer(
      customerId,
      organizationId
    );
    
    // 4. Contract price lists
    const contractPromises = contracts.map(contract => 
      contract.id ? this.priceListRepository.findByContractId(contract.id, organizationId) : []
    );
    
    // Combine all price list queries
    const allPriceLists = await Promise.all([
      ...priceListPromises,
      ...contractPromises
    ]);
    
    // Flatten and filter for active price lists
    const now = new Date();
    const validPriceLists = allPriceLists.flat().filter(priceList => 
      priceList.isActive && 
      (!priceList.startDate || priceList.startDate <= now) &&
      (!priceList.endDate || priceList.endDate >= now)
    );
    
    // Remove duplicates and sort by priority
    const uniquePriceLists = Array.from(
      new Map(validPriceLists.map(pl => [pl.id, pl])).values()
    );
    
    return uniquePriceLists.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
  
  /*
   * Contract Management
   */
  
  /**
   * Create a new B2B customer contract
   * @param contract The contract data to create
   * @returns The created contract with ID
   */
  async createContract(contract: CustomerContract): Promise<CustomerContract> {
    // Verify customer exists
    const customer = await this.b2bCustomerRepository.findById(contract.customerId);
    
    if (!customer) {
      throw new Error(`Customer with ID ${contract.customerId} not found`);
    }
    
    // Check if contract with the same number already exists
    const existing = await this.contractRepository.findByContractNumber(
      contract.contractNumber,
      contract.organizationId
    );
    
    if (existing) {
      throw new Error(`Contract with number ${contract.contractNumber} already exists`);
    }
    
    // Set default values if not provided
    const now = new Date();
    const newContract: CustomerContract = {
      ...contract,
      status: contract.status || ContractStatus.DRAFT,
      autoRenew: contract.autoRenew !== undefined ? contract.autoRenew : false,
      createdAt: now,
      updatedAt: now
    };
    
    // Save the contract to the database
    return this.contractRepository.create(newContract);
  }
  
  /**
   * Update a contract's status
   * @param contractId The contract ID
   * @param newStatus The new contract status
   * @param reason Optional reason for the status change
   * @returns The updated contract
   */
  async updateContractStatus(
    contractId: string,
    newStatus: ContractStatus,
    reason?: string
  ): Promise<CustomerContract> {
    // Verify contract exists
    const contract = await this.contractRepository.findById(contractId);
    
    if (!contract) {
      throw new Error(`Contract with ID ${contractId} not found`);
    }
    
    // Update contract status
    return this.contractRepository.update(contractId, {
      ...contract,
      status: newStatus,
      updatedAt: new Date()
    });
  }
  
  /**
   * Find active contracts for a customer
   * @param customerId The customer ID
   * @param organizationId The organization ID
   * @returns Array of active contracts
   */
  async findActiveContractsForCustomer(
    customerId: string,
    organizationId: string
  ): Promise<CustomerContract[]> {
    return this.contractRepository.findActiveContractsByCustomer(
      customerId,
      organizationId
    );
  }
  
  /**
   * Find contracts that will expire soon
   * @param days Number of days in the future
   * @param organizationId The organization ID
   * @returns Array of contracts expiring soon
   */
  async findContractsExpiringSoon(
    days: number,
    organizationId: string
  ): Promise<CustomerContract[]> {
    return this.contractRepository.findContractsExpiringWithinDays(
      days,
      organizationId
    );
  }
  
  /*
   * B2B Pricing
   */
  
  /**
   * Calculate B2B price for a product
   * @param productId The product ID
   * @param customerId The B2B customer ID
   * @param options Additional pricing options
   * @returns The calculated B2B price result
   */
  async calculateB2BPrice(
    productId: string,
    customerId: string,
    options?: {
      quantity?: number;
      currencyCode?: string;
      contractId?: string;
      market?: string;
      calculateForDate?: Date;
    }
  ): Promise<B2BPriceCalculationResult> {
    // Get the product's standard price
    const product = await this.productService.getProductById(productId);
    
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    // Get the customer
    const customer = await this.b2bCustomerRepository.findById(customerId);
    
    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }
    
    // Get the organization ID
    const organizationId = customer.organizationId;
    
    // Start with the standard price
    const standardPrice = product.price;
    let finalPrice = standardPrice;
    let discountPercentage: number | undefined;
    let discountAmount: number | undefined;
    let priceSource: 'standard' | 'tier' | 'group' | 'contract' | 'price_list' | 'volume' | 'custom' = 'standard';
    let appliedPriceListId: string | undefined;
    let appliedContractId: string | undefined;
    let appliedTierId: string | undefined;
    let appliedGroupId: string | undefined;
    let minimumOrderQuantity: number | undefined;
    let priceLocked = false;
    
    // 1. Check for contract pricing (highest priority)
    if (options?.contractId) {
      // If a specific contract ID is provided, only check that contract
      const contract = await this.contractRepository.findById(options.contractId);
      
      if (contract && contract.status === ContractStatus.ACTIVE) {
        const contractPrice = this.calculateContractPrice(
          product,
          contract,
          options?.quantity || 1
        );
        
        if (contractPrice) {
          finalPrice = contractPrice.finalPrice;
          discountPercentage = contractPrice.discountPercentage;
          discountAmount = contractPrice.discountAmount;
          priceSource = 'contract';
          appliedContractId = contract.id;
          priceLocked = contract.pricingTerms.pricesLocked || false;
        }
      }
    } else {
      // Otherwise, check all active contracts for this customer
      const activeContracts = await this.contractRepository.findActiveContractsByCustomer(
        customerId,
        organizationId
      );
      
      // Find the contract with the best price for this product
      let bestContractPrice: number | null = null;
      let bestContract: CustomerContract | null = null;
      
      for (const contract of activeContracts) {
        const contractPrice = this.calculateContractPrice(
          product,
          contract,
          options?.quantity || 1
        );
        
        if (contractPrice && (bestContractPrice === null || contractPrice.finalPrice < bestContractPrice)) {
          bestContractPrice = contractPrice.finalPrice;
          bestContract = contract;
          discountPercentage = contractPrice.discountPercentage;
          discountAmount = contractPrice.discountAmount;
        }
      }
      
      if (bestContractPrice !== null && bestContract) {
        finalPrice = bestContractPrice;
        priceSource = 'contract';
        appliedContractId = bestContract.id;
        priceLocked = bestContract.pricingTerms.pricesLocked || false;
      }
    }
    
    // 2. If no contract pricing applied, check price lists
    if (priceSource === 'standard') {
      const priceLists = await this.findPriceListsForCustomer(customerId, organizationId);
      
      // Find the best price from price lists
      let bestPriceListPrice: number | null = null;
      let bestPriceList: B2BPriceList | null = null;
      let bestPriceGroupId: string | undefined;
      let bestPriceTierId: string | undefined;
      let bestPriceMinQuantity: number | undefined;
      
      for (const priceList of priceLists) {
        // Check if this price list applies to the specific currency requested
        if (options?.currencyCode && priceList.currencyCode !== options.currencyCode) {
          continue;
        }
        
        // Check if this price list has an entry for this product
        const productEntry = priceList.prices.find(p => p.productId === productId && p.isActive);
        
        if (productEntry) {
          // Check minimum quantity if applicable
          if (productEntry.minQuantity && (!options?.quantity || options.quantity < productEntry.minQuantity)) {
            continue;
          }
          
          // Check maximum quantity if applicable
          if (productEntry.maxQuantity && options?.quantity && options.quantity > productEntry.maxQuantity) {
            continue;
          }
          
          // Check if this price is better than current best
          if (bestPriceListPrice === null || productEntry.price < bestPriceListPrice) {
            bestPriceListPrice = productEntry.price;
            bestPriceList = priceList;
            bestPriceMinQuantity = productEntry.minQuantity;
            
            // Determine if this is a group or tier price list
            if (priceList.type === PriceListType.GROUP_SPECIFIC && priceList.customerGroupIds?.length) {
              bestPriceGroupId = priceList.customerGroupIds[0];
            } else if (priceList.type === PriceListType.TIER_SPECIFIC && priceList.customerTierIds?.length) {
              bestPriceTierId = priceList.customerTierIds[0];
            }
          }
        }
        
        // If volume pricing is enabled, check volume pricing
        if (priceList.enableVolumePricing && priceList.volumePrices && options?.quantity) {
          const volumePrice = priceList.volumePrices.find(vp => 
            vp.productId === productId && 
            vp.isActive
          );
          
          if (volumePrice) {
            // Find the applicable tier based on quantity
            const applicableTier = volumePrice.tiers.find(tier => 
              options.quantity! >= tier.minQuantity && 
              (!tier.maxQuantity || options.quantity! <= tier.maxQuantity)
            );
            
            if (applicableTier && (bestPriceListPrice === null || applicableTier.price! < bestPriceListPrice)) {
              bestPriceListPrice = applicableTier.price!;
              bestPriceList = priceList;
              bestPriceMinQuantity = applicableTier.minQuantity;
              priceSource = 'volume';
            }
          }
        }
      }
      
      if (bestPriceListPrice !== null && bestPriceList) {
        finalPrice = bestPriceListPrice;
        discountAmount = standardPrice - bestPriceListPrice;
        discountPercentage = (discountAmount / standardPrice) * 100;
        
        if (priceSource === 'standard') {
          priceSource = bestPriceGroupId ? 'group' : (bestPriceTierId ? 'tier' : 'price_list');
        }
        
        appliedPriceListId = bestPriceList.id;
        appliedGroupId = bestPriceGroupId;
        appliedTierId = bestPriceTierId;
        minimumOrderQuantity = bestPriceMinQuantity;
      }
    }
    
    // 3. If no specific pricing found, apply customer tier discount
    if (priceSource === 'standard' && customer.customerTierId) {
      const tier = await this.customerTierRepository.findById(customer.customerTierId);
      
      if (tier && tier.isActive && tier.discountPercentage) {
        discountPercentage = tier.discountPercentage;
        discountAmount = (standardPrice * (discountPercentage / 100));
        finalPrice = standardPrice - discountAmount;
        priceSource = 'tier';
        appliedTierId = tier.id;
      }
    }
    
    // 4. If no tier pricing, check customer group discount
    if (priceSource === 'standard' && customer.customerGroupIds?.length) {
      // Find customer groups with discounts
      const customerGroups = await Promise.all(
        customer.customerGroupIds.map(groupId => 
          this.customerGroupRepository.findById(groupId)
        )
      );
      
      // Find the group with the best discount
      let bestDiscount = 0;
      let bestGroup: CustomerGroup | null = null;
      
      for (const group of customerGroups) {
        if (group && group.isActive && group.customDiscountPercentage && group.customDiscountPercentage > bestDiscount) {
          bestDiscount = group.customDiscountPercentage;
          bestGroup = group;
        }
      }
      
      if (bestDiscount > 0 && bestGroup) {
        discountPercentage = bestDiscount;
        discountAmount = (standardPrice * (discountPercentage / 100));
        finalPrice = standardPrice - discountAmount;
        priceSource = 'group';
        appliedGroupId = bestGroup.id;
      }
    }
    
    return {
      originalPrice: standardPrice,
      finalPrice,
      discountPercentage,
      discountAmount,
      priceSource,
      priceListId: appliedPriceListId,
      contractId: appliedContractId,
      tierId: appliedTierId,
      groupId: appliedGroupId,
      minimumOrderQuantity,
      priceLocked
    };
  }
  
  /**
   * Calculate price based on a contract
   * @param product The product
   * @param contract The contract
   * @param quantity The quantity
   * @returns The calculated contract price, or null if not applicable
   */
  private calculateContractPrice(
    product: any,
    contract: CustomerContract,
    quantity: number
  ): { 
    finalPrice: number; 
    discountPercentage?: number; 
    discountAmount?: number; 
  } | null {
    const pricing = contract.pricingTerms;
    const standardPrice = product.price;
    
    // 1. Check for specific product pricing
    if (pricing.specificProductPrices) {
      const productPricing = pricing.specificProductPrices.find(p => 
        p.productId === product.id || p.sku === product.sku
      );
      
      if (productPricing) {
        if (productPricing.fixedPrice !== undefined) {
          return {
            finalPrice: productPricing.fixedPrice,
            discountAmount: standardPrice - productPricing.fixedPrice,
            discountPercentage: ((standardPrice - productPricing.fixedPrice) / standardPrice) * 100
          };
        }
        
        if (productPricing.discountPercentage !== undefined) {
          const discountAmount = standardPrice * (productPricing.discountPercentage / 100);
          return {
            finalPrice: standardPrice - discountAmount,
            discountPercentage: productPricing.discountPercentage,
            discountAmount
          };
        }
      }
    }
    
    // 2. Check for volume-based discounts
    if (pricing.volumeDiscounts && pricing.volumeDiscounts.length > 0) {
      // Sort by minimum order value, descending (to find the highest applicable tier)
      const sortedTiers = [...pricing.volumeDiscounts].sort((a, b) => b.minOrderValue - a.minOrderValue);
      
      // Calculate order value based on current product and quantity
      const orderValue = standardPrice * quantity;
      
      // Find the first tier that applies to this order value
      const applicableTier = sortedTiers.find(tier => orderValue >= tier.minOrderValue);
      
      if (applicableTier) {
        const discountAmount = standardPrice * (applicableTier.discountPercentage / 100);
        return {
          finalPrice: standardPrice - discountAmount,
          discountPercentage: applicableTier.discountPercentage,
          discountAmount
        };
      }
    }
    
    // 3. Apply global discount if available
    if (pricing.globalDiscountPercentage !== undefined && pricing.globalDiscountPercentage > 0) {
      const discountAmount = standardPrice * (pricing.globalDiscountPercentage / 100);
      return {
        finalPrice: standardPrice - discountAmount,
        discountPercentage: pricing.globalDiscountPercentage,
        discountAmount
      };
    }
    
    return null; // No contract pricing applies
  }
  
  /*
   * Purchase Order Management
   */
  
  /**
   * Create a new purchase order
   * @param purchaseOrder The purchase order data
   * @returns The created purchase order with ID
   */
  async createPurchaseOrder(purchaseOrder: PurchaseOrder): Promise<PurchaseOrder> {
    // Verify customer exists
    const customer = await this.b2bCustomerRepository.findById(purchaseOrder.customerId);
    
    if (!customer) {
      throw new Error(`Customer with ID ${purchaseOrder.customerId} not found`);
    }
    
    // Check if PO number is already used
    if (purchaseOrder.purchaseOrderNumber) {
      const existing = await this.purchaseOrderRepository.findByPurchaseOrderNumber(
        purchaseOrder.purchaseOrderNumber,
        purchaseOrder.organizationId
      );
      
      if (existing) {
        throw new Error(`Purchase order with number ${purchaseOrder.purchaseOrderNumber} already exists`);
      }
    }
    
    // Set default values and current timestamp
    const now = new Date();
    const newPurchaseOrder: PurchaseOrder = {
      ...purchaseOrder,
      status: purchaseOrder.status || PurchaseOrderStatus.DRAFT,
      orderDate: purchaseOrder.orderDate || now,
      isRecurring: purchaseOrder.isRecurring || false,
      createdAt: now,
      updatedAt: now,
      createdBy: purchaseOrder.createdBy
    };
    
    // Look up customer's default approval workflow
    if (!newPurchaseOrder.approvalWorkflowId && customer.defaultApprovalWorkflowId) {
      newPurchaseOrder.approvalWorkflowId = customer.defaultApprovalWorkflowId;
    }
    
    // Save the purchase order
    return this.purchaseOrderRepository.create(newPurchaseOrder);
  }
  
  /**
   * Submit a purchase order for approval
   * @param orderId The purchase order ID
   * @param submitterUserId The user submitting the order
   * @param submitterName The name of the user submitting the order
   * @returns The updated purchase order
   */
  async submitPurchaseOrderForApproval(
    orderId: string,
    submitterUserId: string,
    submitterName: string
  ): Promise<PurchaseOrder> {
    // Verify purchase order exists
    const order = await this.purchaseOrderRepository.findById(orderId);
    
    if (!order) {
      throw new Error(`Purchase order with ID ${orderId} not found`);
    }
    
    // Check if order is in a state that can be submitted
    if (order.status !== PurchaseOrderStatus.DRAFT) {
      throw new Error(`Purchase order with ID ${orderId} cannot be submitted (current status: ${order.status})`);
    }
    
    // Get the approval workflow
    let workflowId = order.approvalWorkflowId;
    let nextApprover: { id?: string; name?: string } = {};
    
    if (workflowId) {
      const workflow = await this.approvalWorkflowRepository.findById(workflowId);
      
      if (workflow && workflow.steps.length > 0) {
        // Get the first step in the workflow
        const firstStep = workflow.steps.find(step => step.stepNumber === 1);
        
        if (firstStep && firstStep.approverUserIds && firstStep.approverUserIds.length > 0) {
          nextApprover.id = firstStep.approverUserIds[0];
        }
      }
    }
    
    // Create an approval action record
    const approvalAction: ApprovalAction = {
      actionType: ApprovalActionType.SUBMITTED,
      timestamp: new Date(),
      userId: submitterUserId,
      userName: submitterName,
      nextApproverId: nextApprover.id,
      nextApproverName: nextApprover.name
    };
    
    // Update the purchase order
    const updatedOrder: PurchaseOrder = {
      ...order,
      status: PurchaseOrderStatus.PENDING_APPROVAL,
      currentApprovalStep: 1,
      approvalActions: [...(order.approvalActions || []), approvalAction],
      updatedAt: new Date(),
      updatedBy: submitterUserId
    };
    
    return this.purchaseOrderRepository.update(orderId, updatedOrder);
  }
  
  /**
   * Approve a purchase order
   * @param orderId The purchase order ID
   * @param approverUserId The user approving the order
   * @param approverName The name of the user approving the order
   * @param comments Optional approval comments
   * @returns The updated purchase order
   */
  async approvePurchaseOrder(
    orderId: string,
    approverUserId: string,
    approverName: string,
    comments?: string
  ): Promise<PurchaseOrder> {
    // Verify purchase order exists
    const order = await this.purchaseOrderRepository.findById(orderId);
    
    if (!order) {
      throw new Error(`Purchase order with ID ${orderId} not found`);
    }
    
    // Check if order is in a state that can be approved
    if (order.status !== PurchaseOrderStatus.PENDING_APPROVAL) {
      throw new Error(`Purchase order with ID ${orderId} cannot be approved (current status: ${order.status})`);
    }
    
    // Get the workflow and determine next steps
    let nextApprover: { id?: string; name?: string } = {};
    let finalApproval = true;
    
    if (order.approvalWorkflowId && order.currentApprovalStep !== undefined) {
      const workflow = await this.approvalWorkflowRepository.findById(order.approvalWorkflowId);
      
      if (workflow) {
        // Check if there are more steps in the workflow
        const nextStep = workflow.steps.find(step => step.stepNumber === order.currentApprovalStep! + 1);
        
        if (nextStep) {
          finalApproval = false;
          
          if (nextStep.approverUserIds && nextStep.approverUserIds.length > 0) {
            nextApprover.id = nextStep.approverUserIds[0];
          }
        }
      }
    }
    
    // Create an approval action record
    const approvalAction: ApprovalAction = {
      actionType: ApprovalActionType.APPROVED,
      timestamp: new Date(),
      userId: approverUserId,
      userName: approverName,
      comments: comments,
      nextApproverId: nextApprover.id,
      nextApproverName: nextApprover.name
    };
    
    // Update the purchase order
    const updatedOrder: PurchaseOrder = {
      ...order,
      status: finalApproval ? PurchaseOrderStatus.APPROVED : PurchaseOrderStatus.PENDING_APPROVAL,
      currentApprovalStep: finalApproval ? undefined : (order.currentApprovalStep! + 1),
      approvalActions: [...(order.approvalActions || []), approvalAction],
      updatedAt: new Date(),
      updatedBy: approverUserId
    };
    
    return this.purchaseOrderRepository.update(orderId, updatedOrder);
  }
  
  /**
   * Find purchase orders pending approval
   * @param organizationId The organization ID
   * @returns Array of purchase orders pending approval
   */
  async findOrdersPendingApproval(organizationId: string): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.findPendingApproval(organizationId);
  }
  
  /**
   * Find purchase orders for a specific approver
   * @param approverId The approver user ID
   * @param organizationId The organization ID
   * @returns Array of purchase orders pending approval by this approver
   */
  async findOrdersPendingApprovalByApprover(
    approverId: string,
    organizationId: string
  ): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.findPendingOrdersForApprover(
      approverId,
      organizationId
    );
  }
  
  /**
   * Find purchase orders for a customer
   * @param customerId The customer ID
   * @param organizationId The organization ID
   * @param status Optional status filter
   * @returns Array of purchase orders for the customer
   */
  async findCustomerOrders(
    customerId: string,
    organizationId: string,
    status?: PurchaseOrderStatus
  ): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.findByCustomer(
      customerId,
      organizationId,
      status
    );
  }
  
  /*
   * Helper Methods
   */
  
  /**
   * Get default currency code for a region
   * @param region The region
   * @returns The default currency code for the region
   */
  private getDefaultCurrencyForRegion(region?: string): string {
    if (!region) {
      // Use the system's default region
      region = this.marketContextOptions.defaultRegion || 'south-africa';
    }
    
    // Return the currency code for the region
    return this.marketContextOptions.regionCurrencies?.[region] || 'ZAR';
  }
}