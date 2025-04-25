/**
 * Order Ingestion Module Public API
 *
 * This file defines the public interface of the Order Ingestion module, exporting only what should be
 * accessible to other modules. This ensures proper encapsulation and prevents direct access to
 * internal components.
 */

// Re-export module
export { OrderIngestionModule } from './order-ingestion.module';

// Re-export order mapper interfaces
export {
  IOrderMapper,
  IOrderMapperRegistry,
} from './interfaces/order-mapper.interface';

// Re-export order mapper registry
export { OrderMapperRegistry } from './mappers/order-mapper.registry';

// Re-export types
export * from './interfaces/types';

// Note: As the module is developed with services or repositories, they should be exported here.
