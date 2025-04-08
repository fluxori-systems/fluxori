/**
 * Marketplaces Module Public API
 * 
 * This file defines the public interface of the Marketplaces module, exporting only what should be
 * accessible to other modules. This ensures proper encapsulation and prevents direct access to
 * internal components.
 */

// Re-export module
export { MarketplacesModule } from './marketplaces.module';

// Re-export primary services
export { MarketplaceAdapterFactory } from './services/marketplace-adapter.factory';
export { MarketplaceSyncService } from './services/marketplace-sync.service';

// Re-export repositories
export { MarketplaceCredentialsRepository } from './repositories/marketplace-credentials.repository';

// Re-export models/schemas
export { MarketplaceCredential } from './models/marketplace-credentials.schema';

// Re-export interfaces and types from types.ts
export {
  MarketplaceCredentials,
  ConnectionStatus,
  MarketplaceProduct,
  StockUpdatePayload,
  PriceUpdatePayload,
  StatusUpdatePayload,
  MarketplaceOrder,
  MarketplaceOrderItem,
  Address,
  OrderAcknowledgment,
  MarketplaceCategory,
  PaginatedResponse,
  OperationResult,
  ProductFilterOptions,
  OrderFilterOptions
} from './interfaces/types';

// Re-export adapter interface
export { IMarketplaceAdapter as MarketplaceAdapter } from './interfaces/marketplace-adapter.interface';

// Define missing types that were referenced but not defined
export enum MarketplaceType {
  ONLINE = 'online',
  PHYSICAL = 'physical',
  HYBRID = 'hybrid'
}

export enum MarketplaceRegion {
  GLOBAL = 'global',
  AFRICA = 'africa',
  NORTH_AMERICA = 'north_america',
  SOUTH_AMERICA = 'south_america',
  EUROPE = 'europe',
  ASIA = 'asia',
  OCEANIA = 'oceania'
}

export enum MarketplaceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

export enum SyncDirection {
  IMPORT = 'import',
  EXPORT = 'export',
  BIDIRECTIONAL = 'bidirectional'
}

export enum SyncStatus {
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed',
  PENDING = 'pending'
}

export interface SyncResult {
  status: SyncStatus;
  message?: string;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  details?: any;
}

export interface ProductSyncResult {
  successful: string[];
  failed: Array<{ sku: string, reason: string }>;
}

export interface OrderSyncResult {
  successful: string[];
  failed: Array<{ id: string, reason: string }>;
}

export interface MarketplaceOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface SyncOptions {
  direction?: SyncDirection;
  batchSize?: number;
  startDate?: Date;
  endDate?: Date;
  filters?: Record<string, any>;
  dryRun?: boolean;
}

// For backwards compatibility
export interface Marketplace {
  id: string;
  name: string;
  type: MarketplaceType;
  region: MarketplaceRegion;
  status: MarketplaceStatus;
}

// Re-export adapters
export { BaseMarketplaceAdapter } from './adapters/base-marketplace-adapter';