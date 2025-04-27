'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.FeatureFlagErrorType =
  exports.Environment =
  exports.FeatureFlagType =
    void 0;
/**
 * Feature flag types
 */
var FeatureFlagType;
(function (FeatureFlagType) {
  FeatureFlagType['BOOLEAN'] = 'boolean';
  FeatureFlagType['PERCENTAGE'] = 'percentage';
  FeatureFlagType['USER_TARGETED'] = 'user_targeted';
  FeatureFlagType['ORGANIZATION_TARGETED'] = 'organization_targeted';
  FeatureFlagType['ENVIRONMENT_TARGETED'] = 'environment_targeted';
  FeatureFlagType['SCHEDULED'] = 'scheduled';
})(FeatureFlagType || (exports.FeatureFlagType = FeatureFlagType = {}));
/**
 * Environment types for environment-specific flags
 */
var Environment;
(function (Environment) {
  Environment['DEVELOPMENT'] = 'development';
  Environment['STAGING'] = 'staging';
  Environment['PRODUCTION'] = 'production';
  Environment['ALL'] = 'all';
})(Environment || (exports.Environment = Environment = {}));
/**
 * Error types for feature flag operations
 */
var FeatureFlagErrorType;
(function (FeatureFlagErrorType) {
  FeatureFlagErrorType['VALIDATION_ERROR'] = 'validation_error';
  FeatureFlagErrorType['NOT_FOUND'] = 'not_found';
  FeatureFlagErrorType['DUPLICATE_KEY'] = 'duplicate_key';
  FeatureFlagErrorType['EVALUATION_ERROR'] = 'evaluation_error';
  FeatureFlagErrorType['PERMISSION_DENIED'] = 'permission_denied';
  FeatureFlagErrorType['INTERNAL_ERROR'] = 'internal_error';
})(
  FeatureFlagErrorType ||
    (exports.FeatureFlagErrorType = FeatureFlagErrorType = {}),
);
