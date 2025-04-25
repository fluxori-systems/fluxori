/**
 * Customer Tier Repository
 *
 * Repository for managing customer tier data.
 */
import { Injectable, Logger } from '@nestjs/common';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { CustomerTier } from '../models/b2b/customer-tier.model';

/**
 * Repository for customer tiers
 */
@Injectable()
export class CustomerTierRepository extends FirestoreBaseRepository<CustomerTier> {
  protected readonly logger = new Logger(CustomerTierRepository.name);

  /**
   * Constructor initializes the repository with collection name
   */
  constructor() {
    super('customer_tiers');
  }

  /**
   * Find a customer tier by code
   * @param code The unique tier code to search for
   * @param organizationId The organization ID
   * @returns The customer tier or null if not found
   */
  async findByCode(
    code: string,
    organizationId: string,
  ): Promise<CustomerTier | null> {
    const query = this.collection
      .where('code', '==', code)
      .where('organizationId', '==', organizationId)
      .limit(1);

    const snapshot = await this.executeQuery(query);
    return snapshot.docs.length > 0
      ? this.mapSnapshotToEntity(snapshot.docs[0])
      : null;
  }

  /**
   * Find active customer tiers for an organization
   * @param organizationId The organization ID
   * @returns Array of active customer tiers
   */
  async findActiveTiers(organizationId: string): Promise<CustomerTier[]> {
    const query = this.collection
      .where('isActive', '==', true)
      .where('organizationId', '==', organizationId);

    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));
  }

  /**
   * Find customer tiers by type
   * @param tierType The tier type to filter by
   * @param organizationId The organization ID
   * @returns Array of customer tiers with the specified type
   */
  async findByType(
    tierType: string,
    organizationId: string,
  ): Promise<CustomerTier[]> {
    const query = this.collection
      .where('type', '==', tierType)
      .where('organizationId', '==', organizationId);

    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));
  }
}
