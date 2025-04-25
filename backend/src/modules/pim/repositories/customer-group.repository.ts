/**
 * Customer Group Repository
 *
 * Repository for managing customer group data.
 */
import { Injectable, Logger } from '@nestjs/common';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { CustomerGroup } from '../models/b2b/customer-tier.model';

/**
 * Repository for customer groups
 */
@Injectable()
export class CustomerGroupRepository extends FirestoreBaseRepository<CustomerGroup> {
  protected readonly logger = new Logger(CustomerGroupRepository.name);

  /**
   * Constructor initializes the repository with collection name
   */
  constructor() {
    super('customer_groups');
  }

  /**
   * Find active customer groups for an organization
   * @param organizationId The organization ID
   * @returns Array of active customer groups
   */
  async findActiveGroups(organizationId: string): Promise<CustomerGroup[]> {
    const query = this.collection
      .where('isActive', '==', true)
      .where('organizationId', '==', organizationId);

    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));
  }

  /**
   * Find customer groups by tier ID
   * @param tierId The tier ID to filter by
   * @param organizationId The organization ID
   * @returns Array of customer groups with the specified tier ID
   */
  async findByTierId(
    tierId: string,
    organizationId: string,
  ): Promise<CustomerGroup[]> {
    const query = this.collection
      .where('tierId', '==', tierId)
      .where('organizationId', '==', organizationId);

    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));
  }

  /**
   * Find customer groups by customer ID
   * @param customerId The customer ID to filter by
   * @param organizationId The organization ID
   * @returns Array of customer groups containing the specified customer
   */
  async findByCustomerId(
    customerId: string,
    organizationId: string,
  ): Promise<CustomerGroup[]> {
    const query = this.collection
      .where('customerIds', 'array-contains', customerId)
      .where('organizationId', '==', organizationId);

    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));
  }

  /**
   * Find customer groups with a custom price list
   * @param priceListId The price list ID
   * @param organizationId The organization ID
   * @returns Array of customer groups with the specified price list
   */
  async findByPriceListId(
    priceListId: string,
    organizationId: string,
  ): Promise<CustomerGroup[]> {
    const query = this.collection
      .where('customPriceListId', '==', priceListId)
      .where('organizationId', '==', organizationId);

    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));
  }

  /**
   * Find currently active groups (based on validity dates)
   * @param organizationId The organization ID
   * @returns Array of currently active groups
   */
  async findCurrentlyActiveGroups(
    organizationId: string,
  ): Promise<CustomerGroup[]> {
    const now = new Date();

    // Need to use two queries and combine the results due to Firestore limitations
    // 1. First query: groups with no end date or end date in the future
    const query1 = this.collection
      .where('isActive', '==', true)
      .where('organizationId', '==', organizationId)
      .where('validFrom', '<=', now);

    // Execute the first query
    const snapshot1 = await this.executeQuery(query1);

    // Filter out groups with an end date in the past
    const validGroups = snapshot1.docs
      .map((doc) => this.mapSnapshotToEntity(doc))
      .filter((group) => !group.validTo || group.validTo > now);

    return validGroups;
  }
}
