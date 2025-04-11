/**
 * Injection Tokens for Dependency Injection
 * 
 * This file defines tokens that can be used to inject dependencies
 * across module boundaries. These tokens represent interfaces rather
 * than concrete implementations, allowing for loose coupling between modules.
 */

// Product-related tokens
export const PRODUCT_SERVICE_TOKEN = Symbol('PRODUCT_SERVICE');

// Observability-related tokens
export const LOGGER_SERVICE_TOKEN = Symbol('LOGGER_SERVICE');
export const METRICS_SERVICE_TOKEN = Symbol('METRICS_SERVICE');
export const TRACING_SERVICE_TOKEN = Symbol('TRACING_SERVICE');
export const HEALTH_SERVICE_TOKEN = Symbol('HEALTH_SERVICE');

// Auth-related tokens
export const AUTH_SERVICE_TOKEN = Symbol('AUTH_SERVICE');

// Storage-related tokens
export const STORAGE_SERVICE_TOKEN = Symbol('STORAGE_SERVICE');