/**
 * B2B Price List Repository
 * 
 * Repository for managing B2B price list data.
 */
import { Injectable, Logger } from '@nestjs/common';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { B2BPriceList } from '../models/b2b/price-list.model';

/**
 * Repository for B2B price lists
 */
@Injectable()
export class B2BPriceListRepository extends FirestoreBaseRepository<B2BPriceList> {
  protected readonly logger = new Logger(B2BPriceListRepository.name);
  
  /**
   * Constructor initializes the repository with collection name
   */
  constructor() {
    super('b2b_price_lists');
  }
  
  /**
   * Find active price lists for an organization
   * @param organizationId The organization ID
   * @returns Array of active price lists
   */
  async findActivePriceLists(organizationId: string): Promise<B2BPriceList[]> {
    const query = this.collection
      .where('isActive', '==', true)
      .where('organizationId', '==', organizationId);
    
    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
  }
  
  /**
   * Find price lists by tier ID
   * @param customerTierId The customer tier ID
   * @param organizationId The organization ID
   * @returns Array of price lists for the specified tier
   */
  async findByTierId(
    customerTierId: string,
    organizationId: string
  ): Promise<B2BPriceList[]> {
    const query = this.collection
      .where('customerTierIds', 'array-contains', customerTierId)
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true);
    
    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
  }
  
  /**
   * Find price lists by group ID
   * @param customerGroupId The customer group ID
   * @param organizationId The organization ID
   * @returns Array of price lists for the specified group
   */
  async findByGroupId(
    customerGroupId: string,
    organizationId: string
  ): Promise<B2BPriceList[]> {
    const query = this.collection
      .where('customerGroupIds', 'array-contains', customerGroupId)
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true);
    
    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
  }
  
  /**
   * Find price lists by customer ID
   * @param customerId The customer ID
   * @param organizationId The organization ID
   * @returns Array of price lists for the specified customer
   */
  async findByCustomerId(
    customerId: string,
    organizationId: string
  ): Promise<B2BPriceList[]> {
    const query = this.collection
      .where('customerIds', 'array-contains', customerId)
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true);
    
    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
  }
  
  /**
   * Find price lists by contract ID
   * @param contractId The contract ID
   * @param organizationId The organization ID
   * @returns Array of price lists for the specified contract
   */
  async findByContractId(
    contractId: string,
    organizationId: string
  ): Promise<B2BPriceList[]> {
    const query = this.collection
      .where('contractId', '==', contractId)
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true);
    
    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
  }
  
  /**
   * Find price lists by currency code
   * @param currencyCode The currency code
   * @param organizationId The organization ID
   * @returns Array of price lists with the specified currency
   */
  async findByCurrency(
    currencyCode: string,
    organizationId: string
  ): Promise<B2BPriceList[]> {
    const query = this.collection
      .where('currencyCode', '==', currencyCode)
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true);
    
    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
  }
  
  /**
   * Find currently active price lists (based on validity dates)
   * @param organizationId The organization ID
   * @returns Array of currently active price lists
   */
  async findCurrentlyActivePriceLists(organizationId: string): Promise<B2BPriceList[]> {
    const now = new Date();
    
    // First query: price lists with start date before now
    const query = this.collection
      .where('isActive', '==', true)
      .where('organizationId', '==', organizationId)
      .where('startDate', '<=', now);
    
    // Execute the query
    const snapshot = await this.executeQuery(query);
    
    // Filter out price lists with an end date in the past
    const validPriceLists = snapshot.docs
      .map(doc => this.mapSnapshotToEntity(doc))
      .filter(priceList => !priceList.endDate || priceList.endDate > now);
    
    return validPriceLists;
  }
  
  /**
   * Find price lists containing specific product SKUs
   * @param sku The product SKU
   * @param organizationId The organization ID
   * @returns Array of price lists containing the specified product
   */
  async findByProductSku(
    sku: string,
    organizationId: string
  ): Promise<B2BPriceList[]> {
    // Due to Firestore limitations, we need to fetch all price lists and filter in memory
    const query = this.collection
      .where('isActive', '==', true)
      .where('organizationId', '==', organizationId);
    
    const snapshot = await this.executeQuery(query);
    const allPriceLists = snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
    
    // Filter price lists that contain the specified SKU
    return allPriceLists.filter(priceList => 
      priceList.prices.some(price => price.sku === sku)
    );
  }
}