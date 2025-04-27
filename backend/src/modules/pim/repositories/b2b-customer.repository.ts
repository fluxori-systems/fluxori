/**
 * B2B Customer Repository
 *
 * Repository for managing B2B customer data.
 */
import { Injectable, Logger } from '@nestjs/common';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import {
  B2BCustomer,
  B2BAccountType,
  B2BCustomerStatus,
} from '../models/b2b/customer.model';

/**
 * Repository for B2B customers
 */
@Injectable()
export class B2BCustomerRepository extends FirestoreBaseRepository<B2BCustomer> {
  protected readonly logger = new Logger(B2BCustomerRepository.name);

  /**
   * Constructor initializes the repository with collection name
   */
  constructor() {
    super('b2b_customers');
  }

  /**
   * Find a B2B customer by customer number
   * @param customerNumber The unique customer number to search for
   * @param organizationId The organization ID
   * @returns The B2B customer or null if not found
   */
  async findByCustomerNumber(
    customerNumber: string,
    organizationId: string,
  ): Promise<B2BCustomer | null> {
    // Use findOneBy with filter
    return this.findOneBy('customerNumber', customerNumber, {
      filter: { organizationId },
    });
  }

  /**
   * Find B2B customers by tier ID
   * @param customerTierId The customer tier ID
   * @param organizationId The organization ID
   * @returns Array of B2B customers in the specified tier
   */
  async findByTierId(
    customerTierId: string,
    organizationId: string,
  ): Promise<B2BCustomer[]> {
    // Use find with filter
    return this.find({ filter: { customerTierId, organizationId } });
  }

  /**
   * Find B2B customers by group ID
   * @param customerGroupId The customer group ID
   * @param organizationId The organization ID
   * @returns Array of B2B customers in the specified group
   */
  async findByGroupId(
    customerGroupId: string,
    organizationId: string,
  ): Promise<B2BCustomer[]> {
    // Use find with advancedFilters
    return this.find({
      filter: { organizationId },
      advancedFilters: [
        {
          field: 'customerGroupIds',
          operator: 'array-contains',
          value: customerGroupId,
        },
      ],
    });
  }

  /**
   * Find B2B customers by account type
   * @param accountType The account type
   * @param organizationId The organization ID
   * @returns Array of B2B customers with the specified account type
   */
  async findByAccountType(
    accountType: string,
    organizationId: string,
  ): Promise<B2BCustomer[]> {
    // Use find with filter
    return this.find({
      filter: { accountType: accountType as B2BAccountType, organizationId },
    });
  }

  /**
   * Find B2B customers by status
   * @param status The customer status
   * @param organizationId The organization ID
   * @returns Array of B2B customers with the specified status
   */
  async findByStatus(
    status: string,
    organizationId: string,
  ): Promise<B2BCustomer[]> {
    // Use find with filter
    return this.find({
      filter: { status: status as B2BCustomerStatus, organizationId },
    });
  }

  /**
   * Find customers by credit status
   * @param creditStatus The credit status to filter by
   * @param organizationId The organization ID
   * @returns Array of customers with the specified credit status
   */
  async findByCreditStatus(
    creditStatus: string,
    organizationId: string,
  ): Promise<B2BCustomer[]> {
    // Use find with filter
    return this.find({
      filter: { organizationId },
      advancedFilters: [
        {
          field: 'paymentInfo.creditStatus',
          operator: '==',
          value: creditStatus,
        },
      ],
    });
  }

  /**
   * Find B2B customers by market region
   * @param marketRegion The market region
   * @param organizationId The organization ID
   * @returns Array of B2B customers in the specified market region
   */
  async findByMarketRegion(
    marketRegion: string,
    organizationId: string,
  ): Promise<B2BCustomer[]> {
    // Use find with filter
    return this.find({ filter: { marketRegion, organizationId } });
  }

  /**
   * Find B2B customers by parent company ID
   * @param parentCompanyId The parent company ID
   * @param organizationId The organization ID
   * @returns Array of B2B customers with the specified parent company
   */
  async findByParentCompany(
    parentCompanyId: string,
    organizationId: string,
  ): Promise<B2BCustomer[]> {
    // Use find with filter
    return this.find({
      filter: { organizationId },
      advancedFilters: [
        {
          field: 'organizationalHierarchy.parentCompanyId',
          operator: '==',
          value: parentCompanyId,
        },
      ],
    });
  }
}
