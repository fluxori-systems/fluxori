import { Module } from '@nestjs/common';
import { FirestoreConfigService } from '../../config/firestore.config';
import { ProductRepository } from './repositories/product.repository';
import { StockLevelRepository } from './repositories/stock-level.repository';
import { WarehouseRepository } from './repositories/warehouse.repository';
import { InventoryService } from './services/inventory.service';
import { WarehouseService } from './services/warehouse.service';
import { InventoryController } from './controllers/inventory.controller';
import { StockMovementRepository } from './repositories/stock-movement.repository';

/**
 * Inventory Module
 * 
 * Manages product inventory, stock levels, warehouses, and stock movements
 */
@Module({
  imports: [],
  controllers: [
    InventoryController,
  ],
  providers: [
    FirestoreConfigService,
    ProductRepository,
    StockLevelRepository,
    StockMovementRepository,
    WarehouseRepository,
    InventoryService,
    WarehouseService,
  ],
  exports: [
    InventoryService,
    WarehouseService,
    ProductRepository,
    StockLevelRepository,
    WarehouseRepository,
  ],
})
export class InventoryModule {}