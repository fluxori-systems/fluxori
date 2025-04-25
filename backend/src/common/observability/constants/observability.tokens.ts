/**
 * Observability Module Dependency Injection Tokens
 *
 * These tokens are used for dependency injection in the observability module.
 * They allow for loose coupling between services by depending on interfaces
 * rather than concrete implementations.
 */

export const OBSERVABILITY_TOKENS = {
  // The main service
  OBSERVABILITY_SERVICE: Symbol('OBSERVABILITY_SERVICE'),

  // Core services
  LOGGER_SERVICE: Symbol('LOGGER_SERVICE'),
  METRICS_SERVICE: Symbol('METRICS_SERVICE'),
  TRACING_SERVICE: Symbol('TRACING_SERVICE'),
  HEALTH_SERVICE: Symbol('HEALTH_SERVICE'),

  // Options token
  OBSERVABILITY_OPTIONS: Symbol('OBSERVABILITY_OPTIONS'),
};
