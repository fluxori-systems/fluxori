/**
 * Credit System Module Public API
 *
 * This file defines the public interface of the Credit System module, exporting only what should be
 * accessible to other modules. This ensures proper encapsulation and prevents direct access to
 * internal components.
 */

// Export the module
export { CreditSystemModule } from "./credit-system.module";

// Export main services
export { CreditSystemService } from "./services/credit-system.service";
export { TokenTrackingService } from "./services/token-tracking.service";

// Export necessary public interfaces
export {
  CreditCheckRequest,
  CreditCheckResponse,
  CreditUsageRequest,
  CreditUsageType,
  CreditModelType,
  TokenUsageCalculation,
} from "./interfaces/types";

// Export DTOs
export {
  CreateAllocationDto,
  AddCreditsDto,
  CheckCreditsDto,
  RecordUsageDto,
  OptimizeModelDto,
} from "./models/credit-dto";
