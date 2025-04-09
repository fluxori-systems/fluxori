'use client';

/**
 * Shared module for dependency inversion
 * 
 * This module provides interfaces and utilities that are shared between
 * the UI and Motion modules to prevent circular dependencies.
 */

// Re-export types
// Use 'export type' to prevent ambiguous re-exports
export type { 
  MotionMode,
  AnimationMode,
  AnimationParams,
  AnimationStrategyConfig,
  ConfidenceLevel,
  ConnectionQuality,
  ConnectionQualityResult,
  NetworkCondition
} from './types/motion-types';

export type {
  MotionDurations,
  MotionEasings,
  AIAnimationTokens,
  ComplexityPreset,
  NetworkAnimationPreset
} from './types/motion-tokens';

// Export non-type values
export { 
  durations, 
  easings, 
  aiAnimations, 
  complexityPresets,
  networkAnimationPresets
} from './types/motion-tokens';

// Re-export service interfaces
export * from './services/animation-service.interface';
export * from './services/connection-service.interface';

// Re-export service registry
export * from './services/service-registry';

// Re-export providers
export * from './providers/service-provider';
export { AppProvider } from './providers/app-provider';
export * from './providers/south-african-market-provider';

// Re-export utilities
export * from './utils/ref-utils';

// Re-export the hooks with implementations from the provider
export { 
  useAnimationService,
  useConnectionService 
} from './providers/service-provider';

// Re-export South African market optimizations
export {
  useSouthAfricanMarketOptimizations,
  useSAPerformanceThresholds,
  SADeviceProfile,
  SANetworkProfile,
  SA_CONNECTION_THRESHOLDS
} from './hooks/useSouthAfricanMarketOptimizations';

// Re-export South African market components
export {
  SouthAfricanMarketOptimizer,
  SAOptimizer
} from './components/SouthAfricanMarketOptimizer';