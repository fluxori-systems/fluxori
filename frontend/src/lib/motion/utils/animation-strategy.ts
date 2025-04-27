"use client";

import { ComplexityPreset, complexityPresets } from "./motion-tokens";
import {
  MotionMode,
  NetworkCondition,
  AnimationStrategyConfig,
  AnimationParams,
} from "../../shared/types/motion-types";

/**
 * Animation strategy patterns for different animation requirements
 * This implements the Strategy pattern for handling animations
 */

// Re-export types from shared module
export type {
  NetworkCondition,
  AnimationStrategyConfig,
  AnimationParams,
} from "../../shared/types/motion-types";

/**
 * Detect network condition based on Navigator API
 * Falls back to 'medium' if not available
 */
export function detectNetworkCondition(): NetworkCondition {
  if (typeof navigator === "undefined" || !("connection" in navigator)) {
    return "medium";
  }

  const connection = (navigator as any).connection;

  if (!connection) {
    return "medium";
  }

  // Handle based on effective connection type
  if (
    connection.effectiveType === "slow-2g" ||
    connection.effectiveType === "2g"
  ) {
    return "poor";
  }

  if (connection.effectiveType === "3g") {
    return "slow";
  }

  if (connection.effectiveType === "4g") {
    return "medium";
  }

  // Check downlink speed if available (in Mbps)
  if (typeof connection.downlink === "number") {
    if (connection.downlink < 0.5) return "poor";
    if (connection.downlink < 2) return "slow";
    if (connection.downlink < 10) return "medium";
    return "fast";
  }

  // Default to medium
  return "medium";
}

/**
 * Get animation parameters based on strategy configuration
 */
export function getAnimationStrategy(
  config: AnimationStrategyConfig,
): AnimationParams {
  const {
    motionMode,
    networkAware = true,
    shouldReduceMotion = false,
    customDuration = 1.0,
    animationType,
  } = config;

  // Network condition detection
  const networkCondition =
    config.networkCondition ||
    (networkAware ? detectNetworkCondition() : "fast");

  // Respect reduced motion settings
  if (shouldReduceMotion) {
    return {
      enabled: false,
      durationMultiplier: 0,
      useSimpleEasings: true,
      reduceComplexity: true,
      maxActiveAnimations: 0,
      disableStaggering: true,
      scaleMultiplier: 1.0,
    };
  }

  // If animations are completely disabled
  if (motionMode === "minimal") {
    return {
      enabled: false,
      durationMultiplier: 0,
      useSimpleEasings: true,
      reduceComplexity: true,
      maxActiveAnimations: 0,
      disableStaggering: true,
      scaleMultiplier: 1.0,
    };
  }

  // Get complexity preset
  const preset: ComplexityPreset = complexityPresets[motionMode];

  // Base parameters from preset
  const baseParams: AnimationParams = {
    enabled: !preset.disableGSAP,
    durationMultiplier: preset.reduceDuration * customDuration,
    useSimpleEasings: preset.useSimpleEasings,
    reduceComplexity: motionMode !== "full",
    maxActiveAnimations: preset.maxActiveAnimations,
    disableStaggering: preset.disableStaggering,
    scaleMultiplier: 1.0,
  };

  // Apply South African network condition optimizations
  if (networkAware && preset.reduceNetworkAnimations) {
    switch (networkCondition) {
      case "poor":
        // For very poor connections (2G)
        return {
          ...baseParams,
          durationMultiplier: baseParams.durationMultiplier * 0.5,
          useSimpleEasings: true,
          reduceComplexity: true,
          maxActiveAnimations: Math.min(baseParams.maxActiveAnimations, 1),
          disableStaggering: true,
          scaleMultiplier: 0.5, // Reduced scale for hover/press effects
        };

      case "slow":
        // For slow connections (3G)
        return {
          ...baseParams,
          durationMultiplier: baseParams.durationMultiplier * 0.7,
          useSimpleEasings: true,
          reduceComplexity: true,
          maxActiveAnimations: Math.min(baseParams.maxActiveAnimations, 2),
          disableStaggering: true,
          scaleMultiplier: 0.7,
        };

      case "medium":
        // For average connections
        return {
          ...baseParams,
          durationMultiplier: baseParams.durationMultiplier * 0.9,
          useSimpleEasings: baseParams.useSimpleEasings,
          reduceComplexity: baseParams.reduceComplexity,
          scaleMultiplier: 0.9,
        };

      case "fast":
      default:
        // No additional reductions for fast connections
        return baseParams;
    }
  }

  // Animation type-specific adjustments
  switch (animationType) {
    case "shake":
    case "error":
      // Always ensure error animations are visible even in reduced modes
      return {
        ...baseParams,
        enabled: true,
        maxActiveAnimations: Math.max(baseParams.maxActiveAnimations, 1),
      };

    case "loading":
      // Loading animations should be less intensive
      return {
        ...baseParams,
        durationMultiplier: baseParams.durationMultiplier * 1.5, // Slower, gentler loading animations
      };

    default:
      return baseParams;
  }
}
