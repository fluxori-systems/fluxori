/**
 * Feature Flags Module Public API
 *
 * This file defines the public interface of the Feature Flags module, exporting only what should be
 * accessible to other modules. This ensures proper encapsulation and prevents direct access to
 * internal components.
 */

// Re-export module
export { FeatureFlagsModule } from "./feature-flags.module";

// Re-export primary services
export { FeatureFlagService } from "./services/feature-flag.service";
export { FeatureFlagCacheService } from "./services/feature-flag-cache.service";

// Re-export repositories
export { FeatureFlagRepository } from "./repositories/feature-flag.repository";
export { FeatureFlagAuditLogRepository } from "./repositories/feature-flag-audit-log.repository";

// Re-export models/schemas
export { FeatureFlagSchema as FeatureFlag } from "./models/feature-flag.schema";
export { FeatureFlagAuditLogSchema as FeatureFlagAuditLog } from "./models/feature-flag-audit-log.schema";

// Re-export interfaces and types
export * from "./interfaces/types";
