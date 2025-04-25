/**
 * B2B Contract Repository
 *
 * Repository for managing B2B customer contract data.
 */
import { Injectable, Logger } from '@nestjs/common';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { CustomerContract, ContractStatus } from '../models/b2b/contract.model';

/**
 * Repository for B2B customer contracts
 */
@Injectable()
export class B2BContractRepository extends FirestoreBaseRepository<CustomerContract> {
  protected readonly logger = new Logger(B2BContractRepository.name);

  /**
   * Constructor initializes the repository with collection name
   */
  constructor() {
    super('b2b_contracts');
  }

  /**
   * Find a contract by its contract number
   * @param contractNumber The unique contract number
   * @param organizationId The organization ID
   * @returns The contract or null if not found
   */
  async findByContractNumber(
    contractNumber: string,
    organizationId: string,
  ): Promise<CustomerContract | null> {
    const query = this.collection
      .where('contractNumber', '==', contractNumber)
      .where('organizationId', '==', organizationId)
      .limit(1);

    const snapshot = await this.executeQuery(query);
    return snapshot.docs.length > 0
      ? this.mapSnapshotToEntity(snapshot.docs[0])
      : null;
  }

  /**
   * Find active contracts for a customer
   * @param customerId The customer ID
   * @param organizationId The organization ID
   * @returns Array of active contracts for the customer
   */
  async findActiveContractsByCustomer(
    customerId: string,
    organizationId: string,
  ): Promise<CustomerContract[]> {
    const query = this.collection
      .where('customerId', '==', customerId)
      .where('organizationId', '==', organizationId)
      .where('status', '==', ContractStatus.ACTIVE);

    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));
  }

  /**
   * Find contracts by customer group ID
   * @param customerGroupId The customer group ID
   * @param organizationId The organization ID
   * @returns Array of contracts for the customer group
   */
  async findByCustomerGroup(
    customerGroupId: string,
    organizationId: string,
  ): Promise<CustomerContract[]> {
    const query = this.collection
      .where('customerGroupId', '==', customerGroupId)
      .where('organizationId', '==', organizationId);

    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));
  }

  /**
   * Find contracts by status
   * @param status The contract status
   * @param organizationId The organization ID
   * @returns Array of contracts with the specified status
   */
  async findByStatus(
    status: ContractStatus,
    organizationId: string,
  ): Promise<CustomerContract[]> {
    const query = this.collection
      .where('status', '==', status)
      .where('organizationId', '==', organizationId);

    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));
  }

  /**
   * Find contracts that expire soon (within the next X days)
   * @param days Number of days in the future to check
   * @param organizationId The organization ID
   * @returns Array of contracts expiring within the specified days
   */
  async findContractsExpiringWithinDays(
    days: number,
    organizationId: string,
  ): Promise<CustomerContract[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const query = this.collection
      .where('status', '==', ContractStatus.ACTIVE)
      .where('organizationId', '==', organizationId)
      .where('endDate', '>=', now)
      .where('endDate', '<=', futureDate);

    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));
  }

  /**
   * Find contracts eligible for renewal (expired or expiring soon with autoRenew enabled)
   * @param organizationId The organization ID
   * @returns Array of contracts eligible for renewal
   */
  async findRenewalEligibleContracts(
    organizationId: string,
  ): Promise<CustomerContract[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + 30); // Next 30 days

    const query = this.collection
      .where('autoRenew', '==', true)
      .where('organizationId', '==', organizationId)
      .where('endDate', '<=', futureDate);

    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));
  }

  /**
   * Find contracts with global discount
   * @param minimumDiscount Minimum discount percentage to filter by
   * @param organizationId The organization ID
   * @returns Array of contracts offering at least the minimum discount
   */
  async findByMinimumGlobalDiscount(
    minimumDiscount: number,
    organizationId: string,
  ): Promise<CustomerContract[]> {
    // Due to Firestore limitations, we need to fetch all and filter in memory
    const query = this.collection
      .where('status', '==', ContractStatus.ACTIVE)
      .where('organizationId', '==', organizationId);

    const snapshot = await this.executeQuery(query);
    const contracts = snapshot.docs.map((doc) => this.mapSnapshotToEntity(doc));

    return contracts.filter(
      (contract) =>
        contract.pricingTerms.globalDiscountPercentage &&
        contract.pricingTerms.globalDiscountPercentage >= minimumDiscount,
    );
  }
}
