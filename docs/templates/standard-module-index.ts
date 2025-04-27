/**
 * Module public API
 *
 * This file defines the public interface of the module, exporting only what should be
 * accessible to other modules. This pattern ensures proper encapsulation and prevents
 * direct access to internal components.
 */

// Re-export module
export { ModuleNameModule } from "./module-name.module";

// Re-export primary services
export { PrimaryService } from "./services/primary.service";
export { SupportingService } from "./services/supporting.service";

// Re-export controllers if they need to be extended
// export { MainController } from './controllers/main.controller';

// Re-export public models/schemas
export { MainModel } from "./models/main.model";
export { SupportingModel } from "./models/supporting.model";

// Re-export interfaces and types
export * from "./interfaces/types";
export * from "./interfaces/public-interfaces";

// DO NOT export internal utilities, helpers, or implementation details
