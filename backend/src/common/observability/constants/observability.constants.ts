/**
 * Constants for the Observability System
 */

/**
 * Observability providers
 */
export const OBSERVABILITY_PROVIDERS = {
  LOGGER: 'OBSERVABILITY_LOGGER',
  TRACER: 'OBSERVABILITY_TRACER',
  METRICS: 'OBSERVABILITY_METRICS',
  HEALTH_CHECKER: 'OBSERVABILITY_HEALTH_CHECKER',
};

/**
 * Default metric names
 */
export const METRIC_NAMES = {
  // HTTP metrics
  HTTP_REQUEST_DURATION: 'http.request.duration',
  HTTP_REQUEST_SIZE: 'http.request.size',
  HTTP_RESPONSE_SIZE: 'http.response.size',
  HTTP_REQUEST_COUNT: 'http.request.count',
  HTTP_ERROR_COUNT: 'http.error.count',

  // Database metrics
  DB_OPERATION_DURATION: 'db.operation.duration',
  DB_OPERATION_COUNT: 'db.operation.count',
  DB_ERROR_COUNT: 'db.error.count',
  DB_CONNECTION_COUNT: 'db.connection.count',

  // Cache metrics
  CACHE_HIT_COUNT: 'cache.hit.count',
  CACHE_MISS_COUNT: 'cache.miss.count',
  CACHE_SIZE: 'cache.size',

  // System metrics
  MEMORY_USAGE: 'system.memory.usage',
  CPU_USAGE: 'system.cpu.usage',
  ACTIVE_CONNECTIONS: 'system.connections.active',

  // AI metrics
  AI_TOKEN_USAGE: 'ai.token.usage',
  AI_REQUEST_DURATION: 'ai.request.duration',
  AI_CREDIT_USAGE: 'ai.credit.usage',
  AI_REQUEST_COUNT: 'ai.request.count',
  AI_ERROR_COUNT: 'ai.error.count',

  // Business metrics
  ORDER_COUNT: 'business.order.count',
  ORDER_VALUE: 'business.order.value',
  PRODUCT_COUNT: 'business.product.count',
  USER_COUNT: 'business.user.count',
  ACTIVE_USER_COUNT: 'business.user.active.count',

  // Feature flag metrics
  FEATURE_FLAG_EVALUATION: 'feature.flag.evaluation.count',
  FEATURE_FLAG_ENABLED_COUNT: 'feature.flag.enabled.count',
};

/**
 * Standard trace attribute names
 */
export const TRACE_ATTRIBUTES = {
  USER_ID: 'user.id',
  ORGANIZATION_ID: 'organization.id',
  SERVICE_NAME: 'service.name',
  HTTP_METHOD: 'http.method',
  HTTP_URL: 'http.url',
  HTTP_STATUS_CODE: 'http.status_code',
  ERROR: 'error',
  ERROR_MESSAGE: 'error.message',
  DB_STATEMENT: 'db.statement',
  DB_OPERATION: 'db.operation',
  DB_COLLECTION: 'db.collection',
  ENV: 'deployment.environment',
  REGION: 'deployment.region',
};

/**
 * HTTP header names for trace propagation
 */
export const TRACE_HEADERS = {
  TRACE_ID: 'x-trace-id',
  SPAN_ID: 'x-span-id',
  PARENT_SPAN_ID: 'x-parent-span-id',
};

/**
 * Default South African performance thresholds
 */
export const SA_PERFORMANCE_THRESHOLDS = {
  HTTP_GOOD_RESPONSE_TIME_MS: 500,
  HTTP_ACCEPTABLE_RESPONSE_TIME_MS: 2000,
  DB_GOOD_OPERATION_TIME_MS: 50,
  DB_ACCEPTABLE_OPERATION_TIME_MS: 200,
  AI_GOOD_RESPONSE_TIME_MS: 3000,
  AI_ACCEPTABLE_RESPONSE_TIME_MS: 8000,
};

/**
 * Sampling rates for high volume operations
 */
export const SAMPLING_RATES = {
  DEFAULT: 1.0, // 100% - sample everything by default
  HIGH_VOLUME_API: 0.2, // 20% - for high volume API endpoints
  BACKGROUND_TASKS: 0.5, // 50% - for background tasks
  DEBUG_LOGS: 0.05, // 5% - for verbose debug logs in production
  AI_OPERATIONS: 1.0, // 100% - always track AI operations
  DB_OPERATIONS: 0.1, // 10% - for database operations
};

/**
 * Standard log fields that should be sanitized
 */
export const SENSITIVE_DATA_FIELDS = [
  'password',
  'token',
  'apiKey',
  'secret',
  'creditCard',
  'authorization',
  'accessKey',
  'privateKey',
  'sessionToken',
];
