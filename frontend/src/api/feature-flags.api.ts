import { apiClient } from './apiClient';
import {
  FeatureFlag,
  FeatureFlagDTO,
  FeatureFlagToggleDTO,
  FeatureFlagAuditLog,
  Environment,
  FlagEvaluationContext,
  FlagEvaluationResult
} from '../types/feature-flags/feature-flag.types';

/**
 * API client for feature flags
 */
export const featureFlagsApi = {
  /**
   * Get all feature flags
   */
  getAllFlags: async (environment?: Environment): Promise<FeatureFlag[]> => {
    const params = environment ? { environment } : {};
    const response = await apiClient.get('/feature-flags', { params });
    return response.data;
  },

  /**
   * Get a feature flag by ID
   */
  getFlagById: async (id: string): Promise<FeatureFlag> => {
    const response = await apiClient.get(`/feature-flags/${id}`);
    return response.data;
  },

  /**
   * Get a feature flag by key
   */
  getFlagByKey: async (key: string): Promise<FeatureFlag> => {
    const response = await apiClient.get(`/feature-flags/key/${key}`);
    return response.data;
  },

  /**
   * Create a new feature flag
   */
  createFlag: async (flagData: FeatureFlagDTO): Promise<FeatureFlag> => {
    const response = await apiClient.post('/feature-flags', flagData);
    return response.data;
  },

  /**
   * Update a feature flag
   */
  updateFlag: async (id: string, flagData: Partial<FeatureFlagDTO>): Promise<FeatureFlag> => {
    const response = await apiClient.patch(`/feature-flags/${id}`, flagData);
    return response.data;
  },

  /**
   * Toggle a feature flag's enabled status
   */
  toggleFlag: async (id: string, enabled: boolean): Promise<FeatureFlag> => {
    const response = await apiClient.patch(`/feature-flags/${id}/toggle`, { enabled });
    return response.data;
  },

  /**
   * Delete a feature flag
   */
  deleteFlag: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/feature-flags/${id}`);
    return response.data;
  },

  /**
   * Get audit logs for a feature flag
   */
  getAuditLogs: async (id: string): Promise<FeatureFlagAuditLog[]> => {
    const response = await apiClient.get(`/feature-flags/${id}/audit-logs`);
    return response.data;
  },

  /**
   * Evaluate a feature flag for the current context
   */
  evaluateFlag: async (key: string, context: FlagEvaluationContext): Promise<FlagEvaluationResult> => {
    const response = await apiClient.post(`/feature-flags/evaluate/${key}`, context);
    return response.data;
  },

  /**
   * Check if a feature flag is enabled for the current context
   */
  isEnabled: async (key: string, context: FlagEvaluationContext): Promise<boolean> => {
    const response = await apiClient.post(`/feature-flags/is-enabled/${key}`, context);
    return response.data.enabled;
  },

  /**
   * Evaluate multiple feature flags at once
   */
  evaluateBatch: async (
    keys: string[], 
    context: FlagEvaluationContext
  ): Promise<Record<string, FlagEvaluationResult>> => {
    const response = await apiClient.post('/feature-flags/evaluate-batch', {
      keys,
      context
    });
    return response.data;
  }
};