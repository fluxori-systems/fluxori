/**
 * ProductForScan: Recursive type for PIM product scanning
 * Supports nested objects and arrays, but only allows primitive values at leaf nodes.
 */

export type ProductForScan = {
  [key: string]: string | number | boolean | Date | null | undefined | ProductForScan | ProductForScan[];
};
