import React from 'react';

import { useFeatureFlag, useFeatureFlags, FeatureFlagContext } from '../../hooks/useFeatureFlag';

interface FeatureFlagProps {
  /** Feature flag key to check */
  flag: string;
  
  /** Additional context for flag evaluation */
  context?: FeatureFlagContext;
  
  /** Content to render when flag is enabled */
  children: React.ReactNode;
  
  /** Optional fallback content when flag is disabled */
  fallback?: React.ReactNode;
  
  /** Should component render while loading (defaults to false) */
  renderWhileLoading?: boolean;
  
  /** Component to show while loading (defaults to null) */
  loadingComponent?: React.ReactNode;
  
  /** Whether to invert the check (show content when flag is disabled) */
  inverted?: boolean;
}

/**
 * Component for conditionally rendering content based on feature flag state
 */
export const FeatureFlag: React.FC<FeatureFlagProps> = ({
  flag,
  context,
  children,
  fallback = null,
  renderWhileLoading = false,
  loadingComponent = null,
  inverted = false,
}) => {
  const { isEnabled, isLoading } = useFeatureFlag(flag, context);

  if (isLoading) {
    return renderWhileLoading ? <>{loadingComponent || children}</> : <>{loadingComponent}</>;
  }

  const shouldRender = inverted ? !isEnabled : isEnabled;
  
  return shouldRender ? <>{children}</> : <>{fallback}</>;
};

interface FeatureFlagGroupProps {
  /** Feature flag keys to check */
  flags: string[];
  
  /** Additional context for flag evaluation */
  context?: FeatureFlagContext;
  
  /** Content to render when all flags are enabled */
  children: React.ReactNode;
  
  /** Optional fallback content when any flag is disabled */
  fallback?: React.ReactNode;
  
  /** Component to show while loading (defaults to null) */
  loadingComponent?: React.ReactNode;
  
  /** Determines how flags are evaluated: 'all' requires all flags enabled, 'any' requires at least one enabled */
  mode?: 'all' | 'any';
  
  /** Whether to invert the check */
  inverted?: boolean;
}

/**
 * Component for conditionally rendering content based on multiple feature flags
 */
export const FeatureFlagGroup: React.FC<FeatureFlagGroupProps> = ({
  flags,
  context,
  children,
  fallback = null,
  loadingComponent = null,
  mode = 'all',
  inverted = false,
}) => {
  const { isLoading, error, refetch, ...flagResults } = useFeatureFlags(flags, context);
  
  if (isLoading) {
    return <>{loadingComponent}</>;
  }
  
  // Check if flags meet the criteria based on mode
  const flagValues = Object.values(flagResults);
  let shouldRender: boolean;
  
  if (mode === 'all') {
    shouldRender = flagValues.every(Boolean);
  } else {
    shouldRender = flagValues.some(Boolean);
  }
  
  // Apply inversion if needed
  shouldRender = inverted ? !shouldRender : shouldRender;
  
  return shouldRender ? <>{children}</> : <>{fallback}</>;
};

// Higher Order Component version for class components
export function withFeatureFlag<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  flag: string,
  options: {
    fallback?: React.ComponentType<P>;
    context?: FeatureFlagContext;
    inverted?: boolean;
  } = {}
) {
  return function WithFeatureFlag(props: P) {
    const { isEnabled, isLoading } = useFeatureFlag(flag, options.context);
    
    if (isLoading) {
      return null;
    }
    
    const shouldRender = options.inverted ? !isEnabled : isEnabled;
    
    if (shouldRender) {
      return <WrappedComponent {...props} />;
    }
    
    return options.fallback ? <options.fallback {...props} /> : null;
  };
}