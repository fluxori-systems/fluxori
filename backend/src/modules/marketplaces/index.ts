// Re-export interface types
export * from './interfaces/types';
export * from './interfaces/marketplace-adapter.interface';

// Re-export schemas - use explicit re-exports to avoid ambiguity
export { MarketplaceCredential } from './models/marketplace-credentials.schema';

// Re-export adapters
export * from './adapters/base-marketplace-adapter';

// Re-export factories and services
export * from './services/marketplace-adapter.factory';
export * from './services/marketplace-sync.service';

// Re-export repositories
export * from './repositories/marketplace-credentials.repository';

// Re-export module
export * from './marketplaces.module';