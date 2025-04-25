/**
 * Compliance Check Repository
 *
 * Repository for managing compliance check results in the advanced compliance framework
 */

import { Injectable, Logger } from '@nestjs/common';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { ComplianceCheckResult } from '../services/compliance/compliance-framework.service';

/**
 * Interface for stored compliance check records
 */
export interface ComplianceCheckRecord extends ComplianceCheckResult {
  id: string;
  tenantId: string;
  createdAt: Date;
}

/**
 * Repository for compliance check results
 */
@Injectable()
export class ComplianceCheckRepository extends FirestoreBaseRepository<ComplianceCheckRecord> {
  constructor() {
    super('compliance_checks', {
      idField: 'id',
      defaultOrderField: 'checkDate',
      defaultOrderDirection: 'desc',
    });

    this.logger = new Logger(ComplianceCheckRepository.name);
  }

  /**
   * Save a compliance check result
   *
   * @param result Compliance check result
   * @param tenantId Tenant ID
   * @returns Saved record
   */
  async saveCheckResult(
    result: ComplianceCheckResult,
    tenantId: string,
  ): Promise<ComplianceCheckRecord> {
    const record: ComplianceCheckRecord = {
      ...result,
      id: `check_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      tenantId,
      createdAt: new Date(),
    };

    return this.create(record, tenantId);
  }

  /**
   * Find check results for a product
   *
   * @param productId Product ID
   * @param tenantId Tenant ID
   * @returns Compliance check records
   */
  async findByProduct(
    productId: string,
    tenantId: string,
  ): Promise<ComplianceCheckRecord[]> {
    return this.findWithFilters(
      [
        {
          field: 'productId',
          operator: '==',
          value: productId,
        },
      ],
      tenantId,
    );
  }

  /**
   * Find check results for a specific rule
   *
   * @param ruleId Rule ID
   * @param tenantId Tenant ID
   * @returns Compliance check records
   */
  async findByRule(
    ruleId: string,
    tenantId: string,
  ): Promise<ComplianceCheckRecord[]> {
    return this.findWithFilters(
      [
        {
          field: 'ruleId',
          operator: '==',
          value: ruleId,
        },
      ],
      tenantId,
    );
  }

  /**
   * Find check results for a specific product and rule
   *
   * @param productId Product ID
   * @param ruleId Rule ID
   * @param tenantId Tenant ID
   * @returns Compliance check records
   */
  async findByProductAndRule(
    productId: string,
    ruleId: string,
    tenantId: string,
  ): Promise<ComplianceCheckRecord[]> {
    return this.findWithFilters(
      [
        {
          field: 'productId',
          operator: '==',
          value: productId,
        },
        {
          field: 'ruleId',
          operator: '==',
          value: ruleId,
        },
      ],
      tenantId,
    );
  }

  /**
   * Find check results by status
   *
   * @param status Compliance status
   * @param tenantId Tenant ID
   * @returns Compliance check records
   */
  async findByStatus(
    status: string,
    tenantId: string,
  ): Promise<ComplianceCheckRecord[]> {
    return this.findWithFilters(
      [
        {
          field: 'status',
          operator: '==',
          value: status,
        },
      ],
      tenantId,
    );
  }

  /**
   * Find check results by date range
   *
   * @param startDate Start date
   * @param endDate End date
   * @param tenantId Tenant ID
   * @returns Compliance check records in date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<ComplianceCheckRecord[]> {
    return this.findWithFilters(
      [
        {
          field: 'checkDate',
          operator: '>=',
          value: startDate,
        },
        {
          field: 'checkDate',
          operator: '<=',
          value: endDate,
        },
      ],
      tenantId,
    );
  }
}
