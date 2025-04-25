import { Injectable, Logger } from '@nestjs/common';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { PricingRuleOperation } from '../interfaces/types';
import { RepricingRule } from '../models/repricing-rule.schema';

/**
 * Repository for Repricing Rule entities
 */
@Injectable()
export class RepricingRuleRepository extends FirestoreBaseRepository<RepricingRule> {
  // Collection name in Firestore
  protected readonly collectionName = 'repricing_rules';

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'repricing_rules', {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 10 * 60 * 1000, // 10 minutes
      requiredFields: ['organizationId', 'name', 'operation', 'value'],
    });
  }

  /**
   * Find rules by organization ID
   * @param organizationId Organization ID
   * @returns Array of repricing rules
   */
  async findByOrganization(organizationId: string): Promise<RepricingRule[]> {
    return this.find({
      filter: { organizationId } as Partial<RepricingRule>,
      queryOptions: {
        orderBy: 'priority',
        direction: 'asc',
      },
    });
  }

  /**
   * Find active rules by organization ID
   * @param organizationId Organization ID
   * @returns Array of active repricing rules
   */
  async findActiveRules(organizationId: string): Promise<RepricingRule[]> {
    return this.find({
      filter: {
        organizationId,
        isActive: true,
      } as Partial<RepricingRule>,
      queryOptions: {
        orderBy: 'priority',
        direction: 'asc',
      },
    });
  }

  /**
   * Find rules applicable to a specific product
   * @param organizationId Organization ID
   * @param productId Product ID
   * @param marketplaceId Marketplace ID
   * @returns Array of applicable rules
   */
  async findRulesForProduct(
    organizationId: string,
    productId: string,
    marketplaceId: string,
  ): Promise<RepricingRule[]> {
    // Get all active rules for the organization
    const allRules = await this.findActiveRules(organizationId);

    // Filter rules applicable to this product and marketplace
    return allRules.filter((rule) => {
      // Check if rule applies to all products or this specific product
      const productMatches =
        rule.applyToAllProducts ||
        (rule.productIds && rule.productIds.includes(productId));

      // Check if rule applies to all marketplaces or this specific marketplace
      const marketplaceMatches =
        rule.applyToAllMarketplaces ||
        (rule.marketplaceIds && rule.marketplaceIds.includes(marketplaceId));

      return productMatches && marketplaceMatches;
    });
  }

  /**
   * Find rules by operation type
   * @param organizationId Organization ID
   * @param operation Operation type
   * @returns Array of repricing rules
   */
  async findByOperation(
    organizationId: string,
    operation: PricingRuleOperation,
  ): Promise<RepricingRule[]> {
    return this.find({
      filter: {
        organizationId,
        operation,
      } as Partial<RepricingRule>,
      queryOptions: {
        orderBy: 'priority',
        direction: 'asc',
      },
    });
  }

  /**
   * Update rule execution stats
   * @param id Rule ID
   * @param success Whether execution was successful
   * @returns Updated rule
   */
  async updateExecutionStats(
    id: string,
    success: boolean,
  ): Promise<RepricingRule | null> {
    // Get the current rule
    const rule = await this.findById(id);

    if (!rule) {
      return null;
    }

    // Update stats
    const executionCount = (rule.executionCount || 0) + 1;
    const successCount = success
      ? (rule.successCount || 0) + 1
      : rule.successCount || 0;
    const failureCount = !success
      ? (rule.failureCount || 0) + 1
      : rule.failureCount || 0;

    // Update the rule
    return this.update(id, {
      lastExecuted: new Date(),
      executionCount,
      successCount,
      failureCount,
    });
  }
}
