'use strict';
/**
 * PIM Module Types
 *
 * Core types for the Product Information Management module
 * that are shared across different components.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ImageSize = exports.ProductType = exports.ProductStatus = void 0;
/**
 * Product status enum
 */
var ProductStatus;
(function (ProductStatus) {
  ProductStatus['DRAFT'] = 'draft';
  ProductStatus['ACTIVE'] = 'active';
  ProductStatus['ARCHIVED'] = 'archived';
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
/**
 * Product type enum
 */
var ProductType;
(function (ProductType) {
  ProductType['SIMPLE'] = 'simple';
  ProductType['VARIANT'] = 'variant';
  ProductType['BUNDLE'] = 'bundle';
  ProductType['VIRTUAL'] = 'virtual';
})(ProductType || (exports.ProductType = ProductType = {}));
/**
 * Product image size enum
 */
var ImageSize;
(function (ImageSize) {
  ImageSize['THUMBNAIL'] = 'thumbnail';
  ImageSize['SMALL'] = 'small';
  ImageSize['MEDIUM'] = 'medium';
  ImageSize['LARGE'] = 'large';
  ImageSize['ORIGINAL'] = 'original';
})(ImageSize || (exports.ImageSize = ImageSize = {}));
