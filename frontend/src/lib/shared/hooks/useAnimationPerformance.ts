"use client";

/**
 * Hook for animation performance monitoring and adaptation
 */

import { useState, useCallback, useRef } from "react";

import { useAnimationService } from "../services";

interface AnimationPerformanceConfig {
  /** Component name for tracking */
  componentName: string;
  /** Type of animation */
  animationType: "hover" | "click" | "load" | "scroll";
  /** Animation complexity */
  complexity: "high" | "medium" | "low";
  /** Whether to measure individual frame times */
  measureFrameTimes?: boolean;
  /** Whether to automatically adapt animation settings */
  autoAdapt?: boolean;
}

interface AdaptedSettings {
  /** Multiply duration by this factor (lower = faster) */
  durationMultiplier: number;
  /** Whether to use simpler easing functions */
  useSimpleEasings: boolean;
  /** Whether to disable certain effects */
  disableEffects: boolean;
  /** Adjusted animation complexity */
  complexity: "high" | "medium" | "low" | "minimal";
}

export function useAnimationPerformance(config: AnimationPerformanceConfig) {
  const {
    componentName,
    animationType,
    complexity,
    measureFrameTimes = true,
    autoAdapt = true,
  } = config;

  const animationService = useAnimationService();
  const [hasPerformanceIssues, setHasPerformanceIssues] = useState(false);
  const [adaptedSettings, setAdaptedSettings] = useState<AdaptedSettings>({
    durationMultiplier: 1.0,
    useSimpleEasings: false,
    disableEffects: false,
    complexity: complexity,
  });

  // Keep track of animation IDs
  const animationIds = useRef<Record<string, number>>({});

  // Start monitoring an animation
  const startMonitoring = useCallback(() => {
    const id = Date.now();
    animationIds.current[id] = id;

    if (animationService.startPerformanceMonitoring) {
      animationService.startPerformanceMonitoring({
        id: String(id),
        component: componentName,
        type: animationType,
      });
    }

    return id;
  }, [animationService, componentName, animationType]);

  // Record a frame during animation
  const recordFrame = useCallback(() => {
    if (measureFrameTimes && animationService.recordAnimationFrame) {
      animationService.recordAnimationFrame({
        component: componentName,
        timestamp: performance.now(),
      });
    }
  }, [animationService, componentName, measureFrameTimes]);

  // Stop monitoring an animation
  const stopMonitoring = useCallback(
    (id: number) => {
      if (animationService.stopPerformanceMonitoring) {
        animationService.stopPerformanceMonitoring({
          id: String(id),
          component: componentName,
          autoAdapt,
        });
      }

      delete animationIds.current[id];

      // Check for performance issues and adapt if needed
      if (autoAdapt && animationService.getPerformanceAnalysis) {
        const analysis = animationService.getPerformanceAnalysis({
          component: componentName,
        });

        if (analysis) {
          setHasPerformanceIssues(analysis.hasIssues);

          // Update adapted settings based on performance
          if (analysis.hasIssues) {
            setAdaptedSettings({
              durationMultiplier: analysis.severityLevel > 1 ? 0.5 : 0.75,
              useSimpleEasings: analysis.severityLevel > 0,
              disableEffects: analysis.severityLevel > 2,
              complexity:
                analysis.severityLevel > 2
                  ? "minimal"
                  : analysis.severityLevel > 1
                    ? "low"
                    : "medium",
            });
          } else {
            // Reset to original complexity if no issues
            setAdaptedSettings({
              durationMultiplier: 1.0,
              useSimpleEasings: false,
              disableEffects: false,
              complexity: complexity,
            });
          }
        }
      }
    },
    [animationService, componentName, autoAdapt, complexity],
  );

  return {
    startMonitoring,
    stopMonitoring,
    recordFrame,
    adaptedSettings,
    hasPerformanceIssues,
  };
}
