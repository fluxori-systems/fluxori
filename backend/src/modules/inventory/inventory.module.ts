import { Module } from '@nestjs/common';

import { InventoryController } from './controllers/inventory.controller';
import { ProductRepository } from './repositories/product.repository';
import { StockLevelRepository } from './repositories/stock-level.repository';
import { StockMovementRepository } from './repositories/stock-movement.repository';
import { WarehouseRepository } from './repositories/warehouse.repository';
import { InventoryService } from './services/inventory.service';
import { WarehouseService } from './services/warehouse.service';
import { FirestoreConfigService } from '../../config/firestore.config';
import { PRODUCT_SERVICE_TOKEN } from '../../shared/tokens';

/**
 * Inventory Module
 *
 * Manages product inventory, stock levels, warehouses, and stock movements
 */
@Module({
  imports: [],
  controllers: [InventoryController],
  providers: [
    FirestoreConfigService,
    ProductRepository,
    StockLevelRepository,
    StockMovementRepository,
    WarehouseRepository,
    InventoryService,
    WarehouseService,
    // Provide InventoryService as IProductService via token
    {
      provide: PRODUCT_SERVICE_TOKEN,
      useExisting: InventoryService,
    },
  ],
  exports: [
    InventoryService,
    WarehouseService,
    ProductRepository,
    StockLevelRepository,
    WarehouseRepository,
    // Export the token provider
    PRODUCT_SERVICE_TOKEN,
  ],
})
export class InventoryModule {}
