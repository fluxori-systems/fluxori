/**
 * Product Attribute Repository
 *
 * Repository for managing product attributes
 */

import { Injectable, Logger } from '@nestjs/common';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { ProductAttribute } from '../interfaces/types';

/**
 * Repository for product attributes
 */
@Injectable()
export class ProductAttributeRepository extends FirestoreBaseRepository<ProductAttribute> {
  constructor(firestoreConfigService: import('../../../config/firestore.config').FirestoreConfigService) {
    super(firestoreConfigService, 'product_attributes');
  }

  /**
   * Find attributes by codes
   *
   * @param codes Attribute codes
   * @param tenantId Tenant ID
   * @returns Attributes with the specified codes
   */
  async findByCodes(
    codes: string[],
    tenantId: string,
  ): Promise<ProductAttribute[]> {
    if (!codes || codes.length === 0) {
      return [];
    }

    const attributes = await this.findAll();
    // If ProductAttribute ever includes tenantId, restore this filter
    return attributes.filter((attr) => codes.includes(attr.code));
  }

  /**
   * Find attributes by attribute group
   *
   * @param group Attribute group
   * @param tenantId Tenant ID
   * @returns Attributes in the specified group
   */
  async findByGroup(
    group: string,
    tenantId: string,
  ): Promise<ProductAttribute[]> {
    // attributeGroup and tenantId are not valid fields; filter in-memory after fetching all
    const attributes = await this.findAll();
    return attributes.filter((attr) => (attr as any).attributeGroup === group);
  }

  /**
   * Find filterable attributes
   *
   * @param tenantId Tenant ID
   * @returns Filterable attributes
   */
  async findFilterable(tenantId: string): Promise<ProductAttribute[]> {
    const attributes = await this.findAll();
    return attributes.filter((attr) => attr.filterable === true);
  }

  /**
   * Find attributes for product listing
   *
   * @param tenantId Tenant ID
   * @returns Attributes used in product listing
   */
  async findForProductListing(tenantId: string): Promise<ProductAttribute[]> {
    const attributes = await this.findAll();
    return attributes.filter((attr) => (attr as any).usedInProductListing === true);
  }

  /**
   * Find required attributes
   *
   * @param tenantId Tenant ID
   * @returns Required attributes
   */
  async findRequired(tenantId: string): Promise<ProductAttribute[]> {
    const attributes = await this.findAll();
    return attributes.filter((attr) => attr.required === true);
  }

  /**
   * Find attributes by type
   *
   * @param type Attribute type
   * @param tenantId Tenant ID
   * @returns Attributes of the specified type
   */
  async findByType(
    type: string,
    tenantId: string,
  ): Promise<ProductAttribute[]> {
    const attributes = await this.findAll();
    return attributes.filter((attr) => attr.type === type);
  }
}
