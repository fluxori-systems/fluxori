'use strict';
/**
 * Feature Flags Module Public API
 *
 * This file defines the public interface of the Feature Flags module, exporting only what should be
 * accessible to other modules. This ensures proper encapsulation and prevents direct access to
 * internal components.
 */
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __exportStar =
  (this && this.__exportStar) ||
  function (m, exports) {
    for (var p in m)
      if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports, p))
        __createBinding(exports, m, p);
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.FeatureFlagAuditLogRepository =
  exports.FeatureFlagRepository =
  exports.FeatureFlagCacheService =
  exports.FeatureFlagService =
  exports.FeatureFlagsModule =
    void 0;
// Re-export module
var feature_flags_module_1 = require('./feature-flags.module');
Object.defineProperty(exports, 'FeatureFlagsModule', {
  enumerable: true,
  get: function () {
    return feature_flags_module_1.FeatureFlagsModule;
  },
});
// Re-export primary services
var feature_flag_service_1 = require('./services/feature-flag.service');
Object.defineProperty(exports, 'FeatureFlagService', {
  enumerable: true,
  get: function () {
    return feature_flag_service_1.FeatureFlagService;
  },
});
var feature_flag_cache_service_1 = require('./services/feature-flag-cache.service');
Object.defineProperty(exports, 'FeatureFlagCacheService', {
  enumerable: true,
  get: function () {
    return feature_flag_cache_service_1.FeatureFlagCacheService;
  },
});
// Re-export repositories
var feature_flag_repository_1 = require('./repositories/feature-flag.repository');
Object.defineProperty(exports, 'FeatureFlagRepository', {
  enumerable: true,
  get: function () {
    return feature_flag_repository_1.FeatureFlagRepository;
  },
});
var feature_flag_audit_log_repository_1 = require('./repositories/feature-flag-audit-log.repository');
Object.defineProperty(exports, 'FeatureFlagAuditLogRepository', {
  enumerable: true,
  get: function () {
    return feature_flag_audit_log_repository_1.FeatureFlagAuditLogRepository;
  },
});
// Re-export interfaces and types
__exportStar(require('./interfaces/types'), exports);
