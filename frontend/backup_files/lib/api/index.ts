/**
 * API client for the Fluxori application
 */

// Export the API client
export { apiClient, createApiClient } from './client';

// Export API modules
export { storageApi } from './storage';
export { analyticsApi, adminAnalyticsApi } from './analytics';
export { authApi } from './auth';

// Export types
export * from './types';