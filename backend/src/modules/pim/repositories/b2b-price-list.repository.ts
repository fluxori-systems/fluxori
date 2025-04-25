/**
 * B2B Price List Repository
 *
 * Repository for managing B2B price list data.
 * TypeScript-compliant implementation with proper typing.
 */
import { Injectable, Logger } from '@nestjs/common';

import {
  FindByIdOptions,
  FindOptions,
  UpdateDocumentOptions,
  CreateDocumentOptions,
  DeleteDocumentOptions,
} from '../../../common/repositories/base/repository-types';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { B2BPriceList } from '../models/b2b/price-list.model';

/**
 * Repository for B2B price lists
 */
@Injectable()
export class B2BPriceListRepository extends FirestoreBaseRepository<
  B2BPriceList,
  string
> {
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
    return snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));
  }

  /**
   * Find price lists by tier ID
   * @param customerTierId The customer tier ID
   * @param organizationId The organization ID
   * @returns Array of price lists for the specified tier
   */
  async findByCustomerTier(
    customerTierId: string,
    organizationId: string,
  ): Promise<B2BPriceList[]> {
    const query = this.collection
      .where('customerTierIds', 'array-contains', customerTierId)
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true);

    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));
  }

  /**
   * Find price lists applicable to a specific customer
   * @param customerId The customer ID
   * @param organizationId The organization ID
   * @returns Array of price lists for the specified customer
   */
  async findByCustomer(
    customerId: string,
    organizationId: string,
  ): Promise<B2BPriceList[]> {
    const query = this.collection
      .where('customerIds', 'array-contains', customerId)
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true);

    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));
  }

  /**
   * Get price lists by product ID
   * @param productId The product ID
   * @param organizationId The organization ID
   * @returns Array of price lists containing the specified product
   */
  async findByProduct(
    productId: string,
    organizationId: string,
  ): Promise<B2BPriceList[]> {
    const query = this.collection
      .where('productIds', 'array-contains', productId)
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true);

    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));
  }

  /**
   * Find price lists by region
   * @param region The region code
   * @param organizationId The organization ID
   * @returns Array of price lists for the specified region
   */
  async findByRegion(
    region: string,
    organizationId: string,
  ): Promise<B2BPriceList[]> {
    const query = this.collection
      .where('regionCodes', 'array-contains', region)
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true);

    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));
  }

  /**
   * Get a product's price from a specific price list
   * @param priceListId The price list ID
   * @param productId The product ID
   * @returns The price object or null if not found
   */
  async getProductPrice(
    priceListId: string,
    productId: string,
  ): Promise<any | null> {
    const priceList = await this.findById(priceListId);

    if (!priceList || !priceList.prices) {
      return null;
    }

    return priceList.prices.find((p) => p.productId === productId) || null;
  }

  /**
   * Add or update a product price in a price list
   * @param priceListId The price list ID
   * @param productPrice The product price object
   * @returns The updated price list
   */
  async updateProductPrice(
    priceListId: string,
    productPrice: {
      productId: string;
      price: number;
      currencyCode?: string;
      startDate?: Date;
      endDate?: Date;
      minimumQuantity?: number;
      discountType?: string;
      discountValue?: number;
      notes?: string;
    },
  ): Promise<B2BPriceList> {
    const priceList = await this.findById(priceListId);

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
    return this.update(priceListId, {
      prices: priceList.prices,
      productIds: [
        ...new Set([...(priceList.productIds || []), productPrice.productId]),
      ],
    });
  }

  /**
   * Remove a product price from a price list
   * @param priceListId The price list ID
   * @param productId The product ID
   * @returns The updated price list
   */
  async removeProductPrice(
    priceListId: string,
    productId: string,
  ): Promise<B2BPriceList> {
    const priceList = await this.findById(priceListId);

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
    return this.update(priceListId, {
      prices: updatedPrices,
      productIds: updatedProductIds,
    });
  }

  /**
   * Find price lists by date range
   * @param startDate The start date for validity
   * @param endDate The end date for validity (optional)
   * @param organizationId The organization ID
   * @returns Array of price lists valid in the specified date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date | null,
    organizationId: string,
  ): Promise<B2BPriceList[]> {
    let query = this.collection
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true)
      .where('validFrom', '<=', startDate);

    if (endDate) {
      query = query.where('validTo', '>=', endDate);
    }

    const snapshot = await this.executeQuery(query);

    // Additional filter for price lists with no end date
    const priceLists = snapshot.docs.map((doc) =>
      this.mapSnapshotToEntity(doc),
    );

    if (!endDate) {
      return priceLists.filter((pl) => !pl.validTo || pl.validTo >= startDate);
    }

    return priceLists;
  }

  /**
   * Required method implementations to satisfy the Repository interface
   */

  // Core Repository methods
  async findAll(options?: FindOptions<B2BPriceList>): Promise<B2BPriceList[]> {
    // Implementation details would go here
    // This is just a stub to satisfy TypeScript
    return super.find(options);
  }

  async findByIds(
    ids: string[],
    options?: FindByIdOptions,
  ): Promise<B2BPriceList[]> {
    // Implementation details would go here
    // This is just a stub to satisfy TypeScript
    const results: B2BPriceList[] = [];

    for (const id of ids) {
      const item = await this.findById(id, options);
      if (item) {
        results.push(item);
      }
    }

    return results;
  }

  async findBy(
    field: keyof B2BPriceList | string,
    value: any,
    options?: FindOptions<B2BPriceList>,
  ): Promise<B2BPriceList[]> {
    // Implementation details would go here
    // This is just a stub to satisfy TypeScript
    const query = this.collection.where(field as string, '==', value);
    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));
  }

  async findOneBy(
    field: keyof B2BPriceList | string,
    value: any,
    options?: FindOptions<B2BPriceList>,
  ): Promise<B2BPriceList | null> {
    // Implementation details would go here
    // This is just a stub to satisfy TypeScript
    const results = await this.findBy(field, value, { ...options, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async exists(id: string): Promise<boolean> {
    // Implementation details would go here
    // This is just a stub to satisfy TypeScript
    const doc = await this.findById(id);
    return !!doc;
  }

  async createMany(
    items: Array<Omit<B2BPriceList, 'id'>>,
    options?: CreateDocumentOptions,
  ): Promise<B2BPriceList[]> {
    // Implementation details would go here
    // This is just a stub to satisfy TypeScript
    const results: B2BPriceList[] = [];

    for (const item of items) {
      const result = await this.create(item, options);
      results.push(result);
    }

    return results;
  }

  async updateMany(
    items: Array<{ id: string; data: Partial<B2BPriceList> }>,
    options?: UpdateDocumentOptions,
  ): Promise<B2BPriceList[]> {
    // Implementation details would go here
    // This is just a stub to satisfy TypeScript
    const results: B2BPriceList[] = [];

    for (const item of items) {
      const result = await this.update(item.id, item.data, options);
      results.push(result);
    }

    return results;
  }

  async deleteMany(
    ids: string[],
    options?: DeleteDocumentOptions,
  ): Promise<void> {
    // Implementation details would go here
    // This is just a stub to satisfy TypeScript
    for (const id of ids) {
      await this.delete(id, options);
    }
  }

  async runTransaction<R>(
    callback: (transaction: any) => Promise<R>,
  ): Promise<R> {
    // Implementation details would go here
    // This is just a stub to satisfy TypeScript
    return this.firestore.runTransaction(callback);
  }
}
