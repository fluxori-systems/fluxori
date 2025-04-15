/**
 * Attribute Template Repository
 * 
 * Repository pattern implementation for AttributeTemplate entities
 */

import { Injectable } from '@nestjs/common';
import { TenantAwareRepository } from '../../../common/repositories/firestore-base.repository';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { AttributeTemplate, AttributeScope } from '../models/attribute-template.model';
import { QueryOptions } from '../../../types/google-cloud.types';

/**
 * Attribute Template Repository
 * 
 * Handles data access operations for attribute templates in the PIM module
 */
@Injectable()
export class AttributeTemplateRepository extends TenantAwareRepository<AttributeTemplate> {
  /**
   * Constructor
   * 
   * @param firestoreConfigService Firestore configuration service
   */
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'attribute_templates', {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 300000, // 5 minute cache TTL (attribute templates change infrequently)
      requiredFields: ['name', 'scope', 'organizationId']
    });
  }

  /**
   * Find attribute templates by category
   * 
   * @param organizationId The organization ID
   * @param categoryId The category ID
   * @returns Array of attribute templates for the category
   */
  async findByCategory(organizationId: string, categoryId: string): Promise<AttributeTemplate[]> {
    return this.find({
      advancedFilters: [
        {
          field: 'organizationId',
          operator: '==',
          value: organizationId
        },
        {
          field: 'isActive',
          operator: '==',
          value: true
        },
        {
          field: 'categoryIds',
          operator: 'array-contains',
          value: categoryId
        }
      ],
      queryOptions: {
        orderBy: 'position',
        direction: 'asc'
      }
    });
  }

  /**
   * Find global attribute templates
   * 
   * @param organizationId The organization ID
   * @returns Array of global attribute templates
   */
  async findGlobalTemplates(organizationId: string): Promise<AttributeTemplate[]> {
    return this.find({
      advancedFilters: [
        {
          field: 'organizationId',
          operator: '==',
          value: organizationId
        },
        {
          field: 'isActive',
          operator: '==',
          value: true
        },
        {
          field: 'scope',
          operator: '==',
          value: AttributeScope.GLOBAL
        }
      ],
      queryOptions: {
        orderBy: 'position',
        direction: 'asc'
      }
    });
  }

  /**
   * Find attribute templates by region
   * 
   * @param organizationId The organization ID
   * @param region The region (e.g., 'south-africa', 'europe')
   * @returns Array of regional attribute templates
   */
  async findByRegion(organizationId: string, region: string): Promise<AttributeTemplate[]> {
    return this.find({
      advancedFilters: [
        {
          field: 'organizationId',
          operator: '==',
          value: organizationId
        },
        {
          field: 'isActive',
          operator: '==',
          value: true
        },
        {
          field: 'scope',
          operator: '==',
          value: AttributeScope.REGIONAL
        },
        {
          field: 'region',
          operator: '==',
          value: region
        }
      ],
      queryOptions: {
        orderBy: 'position',
        direction: 'asc'
      }
    });
  }

  /**
   * Find attribute templates by marketplace
   * 
   * @param organizationId The organization ID
   * @param marketplaceId The marketplace ID
   * @returns Array of marketplace attribute templates
   */
  async findByMarketplace(organizationId: string, marketplaceId: string): Promise<AttributeTemplate[]> {
    return this.find({
      advancedFilters: [
        {
          field: 'organizationId',
          operator: '==',
          value: organizationId
        },
        {
          field: 'isActive',
          operator: '==',
          value: true
        },
        {
          field: 'scope',
          operator: '==',
          value: AttributeScope.MARKETPLACE
        },
        {
          field: 'marketplaceId',
          operator: '==',
          value: marketplaceId
        }
      ],
      queryOptions: {
        orderBy: 'position',
        direction: 'asc'
      }
    });
  }

  /**
   * Find attribute templates by scope
   * 
   * @param organizationId The organization ID
   * @param scope The attribute scope
   * @param options Query options for pagination, sorting, etc.
   * @returns Array of attribute templates with the given scope
   */
  async findByScope(
    organizationId: string,
    scope: AttributeScope,
    options: QueryOptions = {}
  ): Promise<AttributeTemplate[]> {
    return this.find({
      advancedFilters: [
        {
          field: 'organizationId',
          operator: '==',
          value: organizationId
        },
        {
          field: 'scope',
          operator: '==',
          value: scope
        }
      ],
      queryOptions: {
        orderBy: options.orderBy?.[0]?.field as string || 'position',
        direction: options.orderBy?.[0]?.direction || 'asc',
        limit: options.pagination?.pageSize,
        offset: options.pagination?.pageSize ? (options.pagination.page || 1 - 1) * options.pagination.pageSize : 0
      }
    });
  }

  /**
   * Find attribute templates that apply to all products
   * 
   * @param organizationId The organization ID
   * @returns Array of attribute templates that apply to all products
   */
  async findGlobalApplicable(organizationId: string): Promise<AttributeTemplate[]> {
    return this.find({
      advancedFilters: [
        {
          field: 'organizationId',
          operator: '==',
          value: organizationId
        },
        {
          field: 'isActive',
          operator: '==',
          value: true
        },
        {
          field: 'applyToAllProducts',
          operator: '==',
          value: true
        }
      ],
      queryOptions: {
        orderBy: 'position',
        direction: 'asc'
      }
    });
  }
}