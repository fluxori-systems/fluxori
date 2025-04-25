/**
 * Category Model
 *
 * Core model for product categories in the PIM module
 */

import { TenantEntity } from '../../../types/google-cloud.types';
import { ProductAttribute } from '../interfaces/types';

/**
 * Category status enum
 */
export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  HIDDEN = 'hidden',
}

/**
 * Category entity
 */
export interface Category extends TenantEntity {
  /**
   * Category name
   */
  name: string;

  /**
   * Category description
   */
  description?: string;

  /**
   * Category status
   */
  status: CategoryStatus;

  /**
   * Parent category ID (null for root categories)
   */
  parentId: string | null;

  /**
   * Path of category IDs from root to this category
   */
  path?: string[];

  /**
   * Category level in hierarchy (0 for root)
   */
  level: number;

  /**
   * Position for sorting within parent
   */
  position: number;

  /**
   * URL key/slug for SEO
   */
  urlKey?: string;

  /**
   * Category image URL
   */
  imageUrl?: string;

  /**
   * Thumbnail image URL
   */
  thumbnailUrl?: string;

  /**
   * Whether category is included in menu
   */
  includeInMenu: boolean;

  /**
   * Default attributes for products in this category
   */
  defaultAttributes?: ProductAttribute[];

  /**
   * Required attributes for products in this category
   */
  requiredAttributes?: string[];

  /**
   * Marketplace mappings for this category
   */
  marketplaceMappings?: {
    /**
     * Marketplace ID
     */
    marketplaceId: string;

    /**
     * External category ID in the marketplace
     */
    externalId: string;

    /**
     * External category name
     */
    externalName?: string;
  }[];

  /**
   * SEO metadata
   */
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
  };

  /**
   * Child category count (for performance optimization)
   */
  childCount?: number;

  /**
   * Product count (for performance optimization)
   */
  productCount?: number;

  /**
   * Region-specific data
   */
  regional?: {
    /**
     * South Africa specific data
     */
    southAfrica?: {
      /**
       * Whether category requires ICASA approval
       */
      requiresIcasa?: boolean;

      /**
       * Whether category requires SABS approval
       */
      requiresSabs?: boolean;

      /**
       * Whether category requires NRCS approval
       */
      requiresNrcs?: boolean;
    };

    /**
     * Europe specific data
     */
    europe?: {
      /**
       * Whether category requires CE marking
       */
      requiresCeMarking?: boolean;

      /**
       * Whether category has special GDPR requirements
       */
      hasGdprRequirements?: boolean;
    };
  };
}

/**
 * Category hierarchy node (for tree structure)
 */
export interface CategoryNode extends Category {
  /**
   * Child categories
   */
  children?: CategoryNode[];
}

/**
 * Category creation DTO
 */
export type CreateCategoryDto = Omit<
  Category,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'isDeleted'
  | 'deletedAt'
  | 'version'
  | 'path'
  | 'level'
  | 'childCount'
  | 'productCount'
>;

/**
 * Category update DTO
 */
export type UpdateCategoryDto = Partial<CreateCategoryDto>;
