"use strict";
/**
 * Credit System Module Public API
 *
 * This file defines the public interface of the Credit System module, exporting only what should be
 * accessible to other modules. This ensures proper encapsulation and prevents direct access to
 * internal components.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizeModelDto = exports.RecordUsageDto = exports.CheckCreditsDto = exports.AddCreditsDto = exports.CreateAllocationDto = exports.CreditModelType = exports.CreditUsageType = exports.TokenTrackingService = exports.CreditSystemService = exports.CreditSystemModule = void 0;
// Export the module
var credit_system_module_1 = require("./credit-system.module");
Object.defineProperty(exports, "CreditSystemModule", { enumerable: true, get: function () { return credit_system_module_1.CreditSystemModule; } });
// Export main services
var credit_system_service_1 = require("./services/credit-system.service");
Object.defineProperty(exports, "CreditSystemService", { enumerable: true, get: function () { return credit_system_service_1.CreditSystemService; } });
var token_tracking_service_1 = require("./services/token-tracking.service");
Object.defineProperty(exports, "TokenTrackingService", { enumerable: true, get: function () { return token_tracking_service_1.TokenTrackingService; } });
// Export necessary public interfaces
var types_1 = require("./interfaces/types");
Object.defineProperty(exports, "CreditUsageType", { enumerable: true, get: function () { return types_1.CreditUsageType; } });
Object.defineProperty(exports, "CreditModelType", { enumerable: true, get: function () { return types_1.CreditModelType; } });
// Export DTOs
var credit_dto_1 = require("./models/credit-dto");
Object.defineProperty(exports, "CreateAllocationDto", { enumerable: true, get: function () { return credit_dto_1.CreateAllocationDto; } });
Object.defineProperty(exports, "AddCreditsDto", { enumerable: true, get: function () { return credit_dto_1.AddCreditsDto; } });
Object.defineProperty(exports, "CheckCreditsDto", { enumerable: true, get: function () { return credit_dto_1.CheckCreditsDto; } });
Object.defineProperty(exports, "RecordUsageDto", { enumerable: true, get: function () { return credit_dto_1.RecordUsageDto; } });
Object.defineProperty(exports, "OptimizeModelDto", { enumerable: true, get: function () { return credit_dto_1.OptimizeModelDto; } });
