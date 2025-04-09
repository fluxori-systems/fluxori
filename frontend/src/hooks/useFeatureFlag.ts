import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { featureFlagsApi } from '../api/feature-flags.api';

import { Environment } from '../types/feature-flags/feature-flag.types';

// Types for feature flag hooks
export interface FeatureFlagContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  organizationId?: string;
  organizationType?: string;
  environment?: Environment;
  attributes?: Record<string, any>;
}

export interface FeatureFlagResult {
  isEnabled: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<boolean>;
}

/**
 * Hook to check if a feature flag is enabled
 */
export function useFeatureFlag(flagKey: string, additionalContext?: FeatureFlagContext): FeatureFlagResult {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  // Memoize the evaluation context
  const context = useMemo(() => {
    return {
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      organizationId: user?.organizationId,
      ...additionalContext,
    };
  }, [user, additionalContext]);

  // Function to fetch the flag status
  const fetchFlagStatus = useCallback(async () => {
    if (!flagKey) {
      setIsLoading(false);
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const enabled = await featureFlagsApi.isEnabled(flagKey, context);
      setIsEnabled(enabled);
      return enabled;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch feature flag status'));
      setIsEnabled(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [flagKey, context]);

  // Fetch flag status on mount and when dependencies change
  useEffect(() => {
    fetchFlagStatus();
  }, [fetchFlagStatus]);

  return { isEnabled, isLoading, error, refetch: fetchFlagStatus };
}

/**
 * Hook to check multiple feature flags at once
 */
export interface FeatureFlagsResult {
  [key: string]: boolean | any;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useFeatureFlags(
  flagKeys: string[], 
  additionalContext?: FeatureFlagContext
): FeatureFlagsResult {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  // Memoize the evaluation context
  const context = useMemo(() => {
    return {
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      organizationId: user?.organizationId,
      ...additionalContext,
    };
  }, [user, additionalContext]);

  // Function to fetch multiple flag statuses
  const fetchFlagStatuses = useCallback(async () => {
    if (!flagKeys || flagKeys.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const evaluationResults = await featureFlagsApi.evaluateBatch(flagKeys, context);

      const results: Record<string, boolean> = {};
      
      // Extract enabled status from each flag result
      Object.entries(evaluationResults).forEach(([key, value]) => {
        results[key] = value.enabled;
      });

      setFlags(results);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch feature flags'));
      // Set all flags to false on error
      const errorFlags: Record<string, boolean> = {};
      flagKeys.forEach(key => {
        errorFlags[key] = false;
      });
      setFlags(errorFlags);
    } finally {
      setIsLoading(false);
    }
  }, [flagKeys, context]);

  // Fetch flag statuses on mount and when dependencies change
  useEffect(() => {
    fetchFlagStatuses();
  }, [fetchFlagStatuses]);

  // Create a combined result object that includes both flags and metadata
  const result: FeatureFlagsResult = {
    ...flags,
    isLoading,
    error,
    refetch: fetchFlagStatuses,
  };

  return result;
}