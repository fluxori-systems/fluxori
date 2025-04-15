/**
 * Interface for filtering categories in the PIM module
 */
export interface CategoryFilter {
  /**
   * Text search query for category fields
   */
  query?: string;
  
  /**
   * Filter by parent category ID
   */
  parentId?: string;
  
  /**
   * Filter by category status
   */
  status?: string | string[];
  
  /**
   * Filter by organization ID
   */
  organizationId: string;
  
  /**
   * Whether to include children in the results
   */
  includeChildren?: boolean;
  
  /**
   * Maximum depth of children to include
   */
  maxDepth?: number;
  
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
   * Filter by marketplace mappings
   */
  marketplaceIds?: string[];
  
  /**
   * South African specific filter: Takealot category mapping exists
   */
  hasTakealotMapping?: boolean;
}
