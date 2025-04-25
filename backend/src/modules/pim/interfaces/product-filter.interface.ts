/**
 * Interface for filtering products in the PIM module
 */
export interface ProductFilter {
  /**
   * Text search query for product fields
   */
  query?: string;

  /**
   * Filter by product status
   */
  status?: string | string[];

  /**
   * Filter by category IDs
   */
  categoryIds?: string[];

  /**
   * Filter by SKU pattern
   */
  skuPattern?: string;

  /**
   * Filter by price range (ZAR)
   */
  priceRange?: {
    min?: number;
    max?: number;
  };

  /**
   * Filter by creation date range
   */
  createdAt?: {
    from?: Date;
    to?: Date;
  };

  /**
   * Filter by last updated date range
   */
  updatedAt?: {
    from?: Date;
    to?: Date;
  };

  /**
   * Filter by attribute values
   */
  attributes?: Record<string, any>;

  /**
   * Filter by availability in specific marketplaces
   */
  marketplaceIds?: string[];

  /**
   * Filter by organization ID
   */
  organizationId: string;

  /**
   * Pagination: page number (1-based)
   */
  page?: number;

  /**
   * Pagination: items per page
   */
  limit?: number;

  /**
   * Field to sort by
   */
  sortBy?: string;

  /**
   * Sort direction
   */
  sortDirection?: 'asc' | 'desc';

  /**
   * South African specific filter: VAT included
   */
  vatIncluded?: boolean;

  /**
   * South African specific filter: compliance status
   */
  complianceStatus?: {
    icasa?: boolean;
    sabs?: boolean;
    nrcs?: boolean;
  };
}
