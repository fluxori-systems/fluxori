/**
 * Product Attribute Repository
 *
 * Repository for managing product attributes
 */

import { Injectable, Logger } from "@nestjs/common";
import { FirestoreBaseRepository } from "@common/repositories";

/**
 * Product attribute model
 */
export interface ProductAttribute {
  /** Attribute ID */
  id: string;

  /** Attribute code */
  code: string;

  /** Attribute name */
  name: string;

  /** Attribute type */
  type: string;

  /** Attribute is required */
  required: boolean;

  /** Attribute is searchable */
  searchable: boolean;

  /** Attribute is filterable */
  filterable: boolean;

  /** Attribute is comparable */
  comparable: boolean;

  /** Attribute is used in product listing */
  usedInProductListing: boolean;

  /** Attribute is visible on frontend */
  visibleOnFrontend: boolean;

  /** Attribute is system attribute */
  isSystem: boolean;

  /** Attribute sort order */
  sortOrder: number;

  /** Attribute group */
  attributeGroup: string;

  /** Attribute validation rules */
  validationRules?: {
    /** Minimum value */
    min?: number;

    /** Maximum value */
    max?: number;

    /** Minimum length */
    minLength?: number;

    /** Maximum length */
    maxLength?: number;

    /** Validation pattern */
    pattern?: string;
  };

  /** Default value */
  defaultValue?: any;

  /** Attribute options */
  options?: Array<{
    /** Option value */
    value: string;

    /** Option label */
    label: string;

    /** Option sort order */
    sortOrder: number;
  }>;

  /** Region-specific attribute settings */
  regionalSettings?: Record<
    string,
    {
      /** Region-specific label */
      label?: string;

      /** Region-specific required flag */
      required?: boolean;

      /** Region-specific visibility flag */
      visible?: boolean;
    }
  >;

  /** Created timestamp */
  createdAt: Date;

  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Repository for product attributes
 */
@Injectable()
export class ProductAttributeRepository extends FirestoreBaseRepository<ProductAttribute> {
  constructor() {
    super("product_attributes", {
      idField: "id",
      defaultOrderField: "sortOrder",
      defaultOrderDirection: "asc",
    });

    this.logger = new Logger(ProductAttributeRepository.name);
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

    const attributes = await this.findAll(tenantId);
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
    return this.findWithFilters(
      [
        {
          field: "attributeGroup",
          operator: "==",
          value: group,
        },
      ],
      tenantId,
    );
  }

  /**
   * Find filterable attributes
   *
   * @param tenantId Tenant ID
   * @returns Filterable attributes
   */
  async findFilterable(tenantId: string): Promise<ProductAttribute[]> {
    return this.findWithFilters(
      [
        {
          field: "filterable",
          operator: "==",
          value: true,
        },
      ],
      tenantId,
    );
  }

  /**
   * Find attributes for product listing
   *
   * @param tenantId Tenant ID
   * @returns Attributes used in product listing
   */
  async findForProductListing(tenantId: string): Promise<ProductAttribute[]> {
    return this.findWithFilters(
      [
        {
          field: "usedInProductListing",
          operator: "==",
          value: true,
        },
      ],
      tenantId,
    );
  }

  /**
   * Find required attributes
   *
   * @param tenantId Tenant ID
   * @returns Required attributes
   */
  async findRequired(tenantId: string): Promise<ProductAttribute[]> {
    return this.findWithFilters(
      [
        {
          field: "required",
          operator: "==",
          value: true,
        },
      ],
      tenantId,
    );
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
    return this.findWithFilters(
      [
        {
          field: "type",
          operator: "==",
          value: type,
        },
      ],
      tenantId,
    );
  }
}
