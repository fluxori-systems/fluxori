/**
 * PIM Module Types
 *
 * Core types for the Product Information Management module
 * that are shared across different components.
 */

/**
 * Product status enum
 */
export enum ProductStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  ARCHIVED = "archived",
}

/**
 * Product type enum
 */
export enum ProductType {
  SIMPLE = "simple",
  VARIANT = "variant",
  BUNDLE = "bundle",
  VIRTUAL = "virtual",
}

/**
 * Product image size enum
 */
export enum ImageSize {
  THUMBNAIL = "thumbnail",
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
  ORIGINAL = "original",
}
