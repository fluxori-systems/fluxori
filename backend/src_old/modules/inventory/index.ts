/**
 * Inventory Module Public API
 *
 * This file defines the public interface of the Inventory module, exporting only what should be
 * accessible to other modules. This ensures proper encapsulation and prevents direct access to
 * internal components.
 */

// Re-export module
export { InventoryModule } from "./inventory.module";

// Re-export primary services
export { InventoryService } from "./services/inventory.service";
export { WarehouseService } from "./services/warehouse.service";

// Re-export repositories
export { ProductRepository } from "./repositories/product.repository";
export { StockLevelRepository } from "./repositories/stock-level.repository";
export { StockMovementRepository } from "./repositories/stock-movement.repository";
export { WarehouseRepository } from "./repositories/warehouse.repository";

// Re-export models/schemas
export { Product } from "./models/product.schema";
export { StockLevel } from "./models/stock-level.schema";
export { StockMovement } from "./models/stock-movement.schema";
export { Warehouse } from "./models/warehouse.schema";

// Re-export interfaces and types
export * from "./interfaces/types";
