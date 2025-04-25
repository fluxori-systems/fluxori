import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Repositories
import { MarketplaceController } from './controllers/marketplace.controller';
import { MarketplaceCredentialsRepository } from './repositories/marketplace-credentials.repository';

// Services
import { MarketplaceAdapterFactory } from './services/marketplace-adapter.factory';
import { MarketplaceSyncService } from './services/marketplace-sync.service';

// Controllers

// Import modules and tokens for cross-module dependencies
import { FirestoreConfigService } from '../../config/firestore.config';
import { PRODUCT_SERVICE_TOKEN } from '../../shared/tokens';
import { InventoryModule } from '../inventory/inventory.module';

/**
 * Marketplaces module for integrating with various e-commerce platforms
 */
@Module({
  imports: [
    ConfigModule,
    // Import the inventory module to access IProductService via token
    InventoryModule,
  ],
  controllers: [MarketplaceController],
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

    // We no longer need to provide a mock InventoryService, since we import the real one through the token
  ],
  exports: [
    MarketplaceAdapterFactory,
    MarketplaceSyncService,
    MarketplaceCredentialsRepository,
  ],
})
export class MarketplacesModule {}
