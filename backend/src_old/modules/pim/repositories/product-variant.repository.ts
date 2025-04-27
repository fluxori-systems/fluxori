import { Injectable } from "@nestjs/common";
import { FirestoreBaseRepository } from "@common/repositories";
import { ProductVariant } from "../models/product-variant.model";
import { FirestoreService } from "../../../config/firestore.config";

/**
 * Repository for product variants
 */
@Injectable()
export class ProductVariantRepository extends FirestoreBaseRepository<ProductVariant> {
  /**
   * Collection name in Firestore
   */
  protected collectionName = "product-variants";

  constructor(protected readonly firestoreService: FirestoreService) {
    super(firestoreService);
  }

  /**
   * Find all variants for a parent product
   *
   * @param parentId - The parent product ID
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns Array of product variants
   */
  async findByParentId(
    parentId: string,
    tenantId: string,
  ): Promise<ProductVariant[]> {
    return this.find({
      tenantId,
      filters: [{ field: "parentId", operator: "==", value: parentId }],
      orderBy: [{ field: "position", direction: "asc" }],
    });
  }

  /**
   * Find variant by SKU
   *
   * @param sku - The variant SKU
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns Product variant or null if not found
   */
  async findBySku(
    sku: string,
    tenantId: string,
  ): Promise<ProductVariant | null> {
    const variants = await this.find({
      tenantId,
      filters: [{ field: "sku", operator: "==", value: sku }],
      limit: 1,
    });

    return variants.length > 0 ? variants[0] : null;
  }

  /**
   * Find variants by attribute value
   *
   * @param attributeCode - Attribute code
   * @param attributeValue - Attribute value
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns Array of product variants
   */
  async findByAttributeValue(
    attributeCode: string,
    attributeValue: any,
    tenantId: string,
  ): Promise<ProductVariant[]> {
    // Implementation of this requires a custom query or search index
    // This is a placeholder implementation
    const allVariants = await this.find({ tenantId });

    return allVariants.filter((variant) => {
      const attribute = variant.attributes.find(
        (attr) => attr.code === attributeCode,
      );
      return attribute && attribute.value === attributeValue;
    });
  }

  /**
   * Update variant position within a group
   *
   * @param variantId - The variant ID
   * @param position - New position
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns Updated variant
   */
  async updatePosition(
    variantId: string,
    position: number,
    tenantId: string,
  ): Promise<ProductVariant> {
    const variant = await this.findById(variantId, tenantId);

    if (!variant) {
      throw new Error(`Variant with ID ${variantId} not found`);
    }

    return this.update(variantId, { position }, tenantId);
  }

  /**
   * Delete all variants for a parent product
   *
   * @param parentId - The parent product ID
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns Number of variants deleted
   */
  async deleteByParentId(parentId: string, tenantId: string): Promise<number> {
    const variants = await this.findByParentId(parentId, tenantId);

    await Promise.all(
      variants.map((variant) => this.delete(variant.id, tenantId)),
    );

    return variants.length;
  }
}
