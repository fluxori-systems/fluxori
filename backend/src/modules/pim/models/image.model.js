'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResizeOption = exports.CompressionQuality = void 0;
/**
 * Enum for image compression quality
 */
var CompressionQuality;
(function (CompressionQuality) {
  CompressionQuality['LOW'] = 'low';
  CompressionQuality['MEDIUM'] = 'medium';
  CompressionQuality['HIGH'] = 'high';
  CompressionQuality['ADAPTIVE'] = 'adaptive';
})(
  CompressionQuality || (exports.CompressionQuality = CompressionQuality = {}),
);
/**
 * Enum for image resize options
 */
var ResizeOption;
(function (ResizeOption) {
  ResizeOption['NONE'] = 'none';
  ResizeOption['THUMBNAIL'] = 'thumbnail';
  ResizeOption['SMALL'] = 'small';
  ResizeOption['MEDIUM'] = 'medium';
  ResizeOption['LARGE'] = 'large';
  ResizeOption['CUSTOM'] = 'custom';
})(ResizeOption || (exports.ResizeOption = ResizeOption = {}));
