import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Repositories
import { MarketplaceCredentialsRepository } from './repositories/marketplace-credentials.repository';

// Services
import { MarketplaceAdapterFactory } from './services/marketplace-adapter.factory';
import { MarketplaceSyncService } from './services/marketplace-sync.service';

// Controllers
import { MarketplaceController } from './controllers/marketplace.controller';

// Import services directly instead of the module
import { InventoryService } from '../inventory/services/inventory.service';

// GCP Services
import { FirestoreConfigService } from '../../config/firestore.config';

/**
 * Marketplaces module for integrating with various e-commerce platforms
 */
@Module({
  imports: [
    ConfigModule,
    // Import the inventory module to access InventoryService
    // We'll use forwardRef to avoid circular dependencies
  ],
  controllers: [
    MarketplaceController,
  ],
  providers: [
    // Repositories
    MarketplaceCredentialsRepository,
    
    // Services
    MarketplaceAdapterFactory,
    MarketplaceSyncService,
    
    // GCP Services
    FirestoreConfigService,
    
    // Register adapter factory as a single instance
    {
      provide: 'MARKETPLACE_ADAPTERS_FACTORY',
      useExisting: MarketplaceAdapterFactory,
    },
    
    // Provide a mock InventoryService until we have direct dependency
    {
      provide: InventoryService,
      useValue: {
        getProductById: (id: string, organizationId?: string) => Promise.resolve({ id, organizationId }),
        createProduct: (product: any) => Promise.resolve(product),
      },
    },
  ],
  exports: [
    MarketplaceAdapterFactory,
    MarketplaceSyncService,
    MarketplaceCredentialsRepository,
  ],
})
export class MarketplacesModule {}