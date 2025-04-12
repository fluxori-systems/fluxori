/**
 * Common connector types used across all connector modules
 * 
 * These types define the common interface for working with external API connectors,
 * particularly for South African marketplace and service integrations.
 */

/**
 * Credentials for API connectors
 */
export interface ConnectorCredentials {
  /** Organization ID that owns these credentials */
  organizationId: string;
  
  /** Type of credentials */
  type: string;
  
  /** API Key (for API_KEY auth type) */
  apiKey?: string;
  
  /** API Secret (for API_KEY auth type) */
  apiSecret?: string;
  
  /** OAuth access token */
  accessToken?: string;
  
  /** OAuth refresh token */
  refreshToken?: string;
  
  /** OAuth token expiry date */
  tokenExpiresAt?: Date;
  
  /** Account or seller ID */
  accountId?: string;
  
  /** API endpoint URL */
  endpoint?: string;
  
  /** Additional settings */
  settings?: Record<string, any>;
  
  /** Any other custom properties */
  [key: string]: any;
}

/**
 * Connection quality assessment
 */
export enum ConnectionQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown'
}

/**
 * Status of connection to API
 */
export interface ConnectionStatus {
  /** Whether the connection is established */
  connected: boolean;
  
  /** Status message */
  message: string;
  
  /** Connection quality (based on latency, success rate, etc.) */
  quality: ConnectionQuality;
  
  /** Timestamp of last connection check */
  lastChecked?: Date;
  
  /** Detailed connection information */
  details?: Record<string, any>;
}

/**
 * Network status information specific to South African conditions
 */
export interface NetworkStatus {
  /** Current connection quality */
  quality: ConnectionQuality;
  
  /** Type of connection detected */
  connectionType?: 'fiber' | '4g' | '3g' | '2g' | 'unknown';
  
  /** Provider detection (for SA-specific optimizations) */
  provider?: 'Vodacom' | 'MTN' | 'CellC' | 'Telkom' | 'Rain' | 'other' | 'unknown';
  
  /** Whether load shedding (power outage) might be affecting service */
  possibleLoadShedding?: boolean;
  
  /** Average latency in milliseconds */
  averageLatencyMs?: number;
  
  /** Packet loss percentage (0-100) */
  packetLoss?: number;
  
  /** Success rate for recent requests (0-100) */
  successRate?: number;
  
  /** Network cost classification */
  costCategory?: 'low' | 'medium' | 'high' | 'unknown';
  
  /** Downlink speed estimate in Mbps */
  downlinkSpeed?: number;
  
  /** Additional metrics and information */
  [key: string]: any;
}

/**
 * Generic result type for operations
 */
export interface OperationResult<T> {
  /** Whether the operation succeeded */
  success: boolean;
  
  /** Result data (if operation succeeded) */
  data?: T;
  
  /** Error information (if operation failed) */
  error?: {
    /** Error code */
    code: string;
    
    /** Error message */
    message: string;
    
    /** Detailed error information */
    details?: any;
  };
}

/**
 * Pagination options for list operations
 */
export interface PaginationOptions {
  /** Page number (0-based) */
  page?: number;
  
  /** Items per page */
  pageSize?: number;
  
  /** Sort field */
  sortBy?: string;
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  
  /** Filter criteria */
  filter?: Record<string, any>;
}

/**
 * Paginated response with data and pagination information
 */
export interface PaginatedResponse<T> {
  /** Response data */
  data: T[];
  
  /** Pagination metadata */
  pagination: {
    /** Current page (0-based) */
    page: number;
    
    /** Items per page */
    pageSize: number;
    
    /** Total items (if available) */
    totalItems?: number;
    
    /** Total pages (if available) */
    totalPages?: number;
    
    /** Whether there is a next page */
    hasNextPage: boolean;
    
    /** Next page token for cursor-based pagination */
    nextPageToken?: string;
  };
}