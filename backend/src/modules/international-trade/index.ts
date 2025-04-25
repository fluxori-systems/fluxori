/**
 * International Trade Module Public API
 *
 * This file defines the public interface of the International Trade module, exporting only what should be
 * accessible to other modules. This ensures proper encapsulation and prevents direct access to
 * internal components.
 */

// Re-export module
export { InternationalTradeModule } from './international-trade.module';

// Re-export types and interfaces
export {
  // Enums
  ShippingMethod,
  ShipmentStatus,
  CustomsStatus,
  ComplianceStatus,
  IncoTerm,

  // Interfaces
  IInternationalShipment,
  IHSCode,
  ITradeRestriction,
  IComplianceRequirement,

  // DTOs
  CreateShipmentDto,
  UpdateShipmentDto,
  QueryShipmentsDto,
  ShipmentResponse,
} from './interfaces/types';

// Re-export dependency interfaces
export * from './interfaces/dependencies';

// Note: As the module is developed with services or repositories, they should be exported here.
