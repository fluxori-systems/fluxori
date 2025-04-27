/**
 * Common connector types used across all connector modules
 */

/**
 * Placeholder for connector settings fields. TODO: Add concrete fields as discovered.
 */
export interface ConnectorSettings {
  // TODO: Add concrete settings fields here as they are discovered in the codebase
}

export interface ConnectorCredentials {
  type: string;
  organizationId: string;
  accountId?: string;
  settings?: ConnectorSettings; // TODO: replace with concrete fields as discovered
  [key: string]: any;
}

export interface ConnectionStatus {
  connected: boolean;
  message: string;
  quality: ConnectionQuality;
  details?: Record<string, any>;
  lastChecked?: Date;
}

export enum ConnectionQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown',
}

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  filter?: ConnectorSettings; // TODO: replace with concrete fields as discovered
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems?: number;
    totalPages?: number;
    hasNextPage: boolean;
  };
}
