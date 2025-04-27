"use client";

/**
 * Shared types module
 *
 * This module exports type definitions used by both UI and Motion modules,
 * enabling dependency inversion to avoid circular dependencies.
 */

// Re-export types using 'export type' to prevent ambiguous exports
export type {
  MotionMode,
  AnimationMode,
  AnimationParams,
  AnimationStrategyConfig,
  ConfidenceLevel,
  NetworkCondition,
} from "./motion-types";

// Export South African market types
export type {
  ConnectionQuality,
  ConnectionQualityResult,
} from "./sa-market-types";

export type {
  MotionDurations,
  MotionEasings,
  AIAnimationTokens,
  ComplexityPreset,
  NetworkAnimationPreset,
} from "./motion-tokens";

// Export non-type values
export {
  durations,
  easings,
  aiAnimations,
  complexityPresets,
  networkAnimationPresets,
} from "./motion-tokens";
