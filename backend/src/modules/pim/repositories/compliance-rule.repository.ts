/**
 * Compliance Rule Repository
 * 
 * Repository for managing compliance rules in the advanced compliance framework
 */

import { Injectable, Logger } from '@nestjs/common';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { ComplianceRule } from '../services/compliance/compliance-framework.service';

/**
 * Repository for compliance rules
 */
@Injectable()
export class ComplianceRuleRepository extends FirestoreBaseRepository<ComplianceRule> {
  constructor() {
    super(
      'compliance_rules',
      {
        idField: 'id',
        defaultOrderField: 'updatedAt',
        defaultOrderDirection: 'desc',
      },
    );
    
    this.logger = new Logger(ComplianceRuleRepository.name);
  }
  
  /**
   * Find rules by product type and region
   * 
   * @param productType Product type
   * @param regionCode Region code
   * @param tenantId Tenant ID
   * @returns Matching compliance rules
   */
  async findByProductTypeAndRegion(
    productType: string,
    regionCode: string,
    tenantId: string,
  ): Promise<ComplianceRule[]> {
    return this.findWithFilters(
      [
        {
          field: 'productTypes',
          operator: 'array-contains',
          value: productType,
        },
        {
          field: 'regionCodes',
          operator: 'array-contains',
          value: regionCode,
        },
      ],
      tenantId,
    );
  }
  
  /**
   * Find rules by authority
   * 
   * @param authority Compliance authority
   * @param tenantId Tenant ID
   * @returns Matching compliance rules
   */
  async findByAuthority(
    authority: string,
    tenantId: string,
  ): Promise<ComplianceRule[]> {
    return this.findWithFilters(
      [
        {
          field: 'authority',
          operator: '==',
          value: authority,
        },
      ],
      tenantId,
    );
  }
  
  /**
   * Find rules by category
   * 
   * @param category Compliance category
   * @param tenantId Tenant ID
   * @returns Matching compliance rules
   */
  async findByCategory(
    category: string,
    tenantId: string,
  ): Promise<ComplianceRule[]> {
    return this.findWithFilters(
      [
        {
          field: 'category',
          operator: '==',
          value: category,
        },
      ],
      tenantId,
    );
  }
  
  /**
   * Find rules with complex filters
   * 
   * @param filters Filter criteria
   * @param tenantId Tenant ID
   * @returns Matching compliance rules
   */
  async findByFilters(
    filters: Record<string, any>,
    tenantId: string,
  ): Promise<ComplianceRule[]> {
    // Convert filters to array of filter objects for the base repository
    const filterArray = [];
    
    for (const [key, value] of Object.entries(filters)) {
      // Handle special cases for array containment
      if (key === 'regionCodes') {
        filterArray.push({
          field: 'regionCodes',
          operator: 'array-contains',
          value,
        });
      }
      else if (key === 'productTypes') {
        filterArray.push({
          field: 'productTypes',
          operator: 'array-contains',
          value,
        });
      }
      // Handle date comparisons
      else if (key === 'expirationDate') {
        if (value.$gt) {
          filterArray.push({
            field: 'expirationDate',
            operator: '>',
            value: value.$gt,
          });
        } else if (value.$lt) {
          filterArray.push({
            field: 'expirationDate',
            operator: '<',
            value: value.$lt,
          });
        }
      }
      // Handle array of possible values
      else if (value && value.$in && Array.isArray(value.$in)) {
        // This is a simplified approach - in a real system, you might need
        // to use multiple queries and merge results for IN operations
        for (const item of value.$in) {
          filterArray.push({
            field: key,
            operator: '==',
            value: item,
          });
        }
      }
      // Handle regular equality
      else {
        filterArray.push({
          field: key,
          operator: '==',
          value,
        });
      }
    }
    
    return this.findWithFilters(filterArray, tenantId);
  }
}