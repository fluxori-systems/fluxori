"use client";

import { useMemo } from "react";

import { useDesignTokens } from "../lib/design-system/hooks/useDesignTokens";
import { motion } from "../lib/design-system/tokens/motion";
import { useConnectionQuality } from "../lib/motion/hooks/useConnectionQuality";
import { useSouthAfricanMarketOptimizations } from "../lib/shared/hooks/useSouthAfricanMarketOptimizations";

// Connection quality levels for chart optimization
export type ChartConnectionQuality = "high" | "medium" | "low" | "poor";

// Network profile configuration
export interface NetworkProfileConfig {
  // Number of data points to display (may be reduced for poor connections)
  maxDataPoints: number;
  // Whether to show the grid
  showGrid: boolean;
  // Whether to show tooltips
  showTooltips: boolean;
  // Whether to show animation
  animate: boolean;
  // Animation duration multiplier (1.0 = normal, 0.5 = half speed)
  animationDurationMultiplier: number;
  // Whether to use a curved line or straight line
  useCurve: boolean;
  // Whether to use simplified legends
  simplifiedLegend: boolean;
  // Line thickness in pixels
  lineThickness: number;
  // Point radius
  pointRadius: number;
  // Whether to show reference lines
  showReferenceLines: boolean;
  // Maximum number of labels to show on axes
  maxAxisLabels: number;
}

// Animation configuration
export interface NetworkAwareAnimationConfig {
  // Whether animations are enabled
  enabled: boolean;
  // Duration in milliseconds
  duration: number;
  // Easing function (for Chart.js)
  easing:
    | "linear"
    | "easeInQuad"
    | "easeOutQuad"
    | "easeInOutQuad"
    | "easeInCubic"
    | "easeOutCubic"
    | "easeInOutCubic"
    | "easeInQuart"
    | "easeOutQuart"
    | "easeInOutQuart"
    | "easeInQuint"
    | "easeOutQuint"
    | "easeInOutQuint"
    | "easeInSine"
    | "easeOutSine"
    | "easeInOutSine"
    | "easeInExpo"
    | "easeOutExpo"
    | "easeInOutExpo"
    | "easeInCirc"
    | "easeOutCirc"
    | "easeInOutCirc"
    | "easeInElastic"
    | "easeOutElastic"
    | "easeInOutElastic"
    | "easeInBack"
    | "easeOutBack"
    | "easeInOutBack"
    | "easeInBounce"
    | "easeOutBounce"
    | "easeInOutBounce";
}

// Chart optimization configuration based on network conditions
export const CHART_NETWORK_PROFILES: Record<
  ChartConnectionQuality,
  NetworkProfileConfig
> = {
  high: {
    maxDataPoints: Infinity,
    showGrid: true,
    showTooltips: true,
    animate: true,
    animationDurationMultiplier: 1.0,
    useCurve: true,
    simplifiedLegend: false,
    lineThickness: 2,
    pointRadius: 3,
    showReferenceLines: true,
    maxAxisLabels: Infinity,
  },
  medium: {
    maxDataPoints: 100,
    showGrid: true,
    showTooltips: true,
    animate: true,
    animationDurationMultiplier: 0.7,
    useCurve: true,
    simplifiedLegend: false,
    lineThickness: 2,
    pointRadius: 3,
    showReferenceLines: true,
    maxAxisLabels: 10,
  },
  low: {
    maxDataPoints: 50,
    showGrid: false,
    showTooltips: true,
    animate: true,
    animationDurationMultiplier: 0.5,
    useCurve: false,
    simplifiedLegend: true,
    lineThickness: 1.5,
    pointRadius: 2,
    showReferenceLines: false,
    maxAxisLabels: 5,
  },
  poor: {
    maxDataPoints: 20,
    showGrid: false,
    showTooltips: false,
    animate: false,
    animationDurationMultiplier: 0,
    useCurve: false,
    simplifiedLegend: true,
    lineThickness: 1,
    pointRadius: 0,
    showReferenceLines: false,
    maxAxisLabels: 3,
  },
};

// Hook return type
export interface UseNetworkAwareChartResult {
  // Whether to show a simplified version of the chart
  shouldSimplify: boolean;
  // Whether to show text alternative instead of chart
  showTextAlternative: boolean;
  // Chart animation configuration
  animation: NetworkAwareAnimationConfig;
  // Network profile configuration
  profileConfig: NetworkProfileConfig;
  // Optimized data with appropriate number of points for network conditions
  getOptimizedData: <T>(data: T[]) => T[];
  // Color generator function that maps to design system tokens
  getDesignSystemColors: (count: number) => string[];
}

/**
 * Converts motion tokens (string) to animation duration (number)
 * @param durationToken Motion duration token
 * @returns Duration in milliseconds
 */
const convertMotionDurationToMs = (durationToken: string): number => {
  return parseInt(durationToken.replace("ms", ""), 10);
};

/**
 * Hook that provides chart configuration based on network conditions
 * Implements the Agent-First Interface design philosophy with SA market optimization
 *
 * @param forceConnectionQuality Optional override for connection quality (useful for testing)
 * @returns Configuration for network-aware charts
 */
export function useNetworkAwareChart(
  forceConnectionQuality?: ChartConnectionQuality,
): UseNetworkAwareChartResult {
  // Get connection service info
  const { quality: connectionQuality, isDataSaver } = useConnectionQuality();

  // Get South African market optimizations
  const {
    shouldReduceDataUsage,
    shouldReduceMotion,
    networkProfile,
    agentAppropriateness,
  } = useSouthAfricanMarketOptimizations();

  // Get design system tokens
  const { color } = useDesignTokens();

  // Map connection quality to chart profile
  const effectiveConnectionQuality = useMemo((): ChartConnectionQuality => {
    if (forceConnectionQuality) {
      return forceConnectionQuality;
    }

    // Data saver mode or poor connection forces the 'poor' profile
    if (isDataSaver || connectionQuality === "poor") {
      return "poor";
    }

    // South African market optimization influences quality level
    if (shouldReduceDataUsage) {
      return connectionQuality === "low" ? "poor" : "low";
    }

    // Map connection quality to chart profile
    if (connectionQuality === "high") return "high";
    if (connectionQuality === "medium") return "medium";
    if (connectionQuality === "low") return "low";
    if (connectionQuality === "poor") return "poor";
    return "medium"; // Default to medium as fallback
  }, [
    forceConnectionQuality,
    connectionQuality,
    isDataSaver,
    shouldReduceDataUsage,
  ]);

  // Get profile configuration based on effective connection quality
  const profileConfig = useMemo(() => {
    return CHART_NETWORK_PROFILES[effectiveConnectionQuality];
  }, [effectiveConnectionQuality]);

  // Determine if we should show a simplified version
  const shouldSimplify = useMemo(() => {
    return (
      effectiveConnectionQuality === "poor" ||
      effectiveConnectionQuality === "low"
    );
  }, [effectiveConnectionQuality]);

  // Determine if we should show text alternative instead of chart
  const showTextAlternative = useMemo(() => {
    return (
      effectiveConnectionQuality === "poor" &&
      (shouldReduceDataUsage || isDataSaver)
    );
  }, [effectiveConnectionQuality, shouldReduceDataUsage, isDataSaver]);

  // Configure animation based on motion tokens and network conditions
  const animation = useMemo((): NetworkAwareAnimationConfig => {
    const baseAnimationDuration = convertMotionDurationToMs(
      shouldReduceMotion
        ? motion.durations.microInteraction // Use shortest duration for reduced motion
        : motion.durations.elementTransition, // Use standard duration otherwise
    );

    // For poor connections or when animations should be disabled, return disabled config
    if (!profileConfig.animate || shouldReduceMotion) {
      return {
        enabled: false,
        duration: 0,
        easing: "linear",
      };
    }

    // For other connections, apply the duration multiplier from profile config
    return {
      enabled: true,
      duration:
        baseAnimationDuration * profileConfig.animationDurationMultiplier,
      easing: shouldSimplify ? "easeOutQuad" : "easeInOutQuad",
    };
  }, [profileConfig, shouldReduceMotion, shouldSimplify]);

  // Function to optimize data based on network conditions
  const getOptimizedData = useMemo(() => {
    return <T>(data: T[]): T[] => {
      // If data is less than or equal to max points, return as is
      if (!data || data.length <= profileConfig.maxDataPoints) {
        return data;
      }

      // If maxDataPoints is Infinity, return all data
      if (profileConfig.maxDataPoints === Infinity) {
        return data;
      }

      // Otherwise, downsample the data
      const factor = Math.ceil(data.length / profileConfig.maxDataPoints);
      return data.filter((_, index) => index % factor === 0);
    };
  }, [profileConfig.maxDataPoints]);

  // Function to get design system colors for chart elements
  const getDesignSystemColors = useMemo(() => {
    return (count: number): string[] => {
      // Define base color keys from design system
      const colorKeys = [
        "primary.500",
        "secondary.500",
        "success.base",
        "info.base",
        "warning.base",
        "error.base",
        "primary.600",
        "secondary.600",
        "primary.400",
        "secondary.400",
      ];

      // If we need more colors than available, cycle through them
      const colors: string[] = [];
      for (let i = 0; i < count; i++) {
        colors.push(color(colorKeys[i % colorKeys.length]) || "#888");
      }

      return colors;
    };
  }, [color]);

  return {
    shouldSimplify,
    showTextAlternative,
    animation,
    profileConfig,
    getOptimizedData,
    getDesignSystemColors,
  };
}
