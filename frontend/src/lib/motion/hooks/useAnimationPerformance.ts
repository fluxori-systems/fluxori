"use client";

import { useRef, useEffect, useState } from "react";

import { usePerformanceMonitoring } from "./usePerformanceMonitoring";
import { defaultConnectionService } from "../services/connection-service.impl";

/**
 * Animation performance configuration
 */
interface AnimationPerformanceOptions {
  /** Component name */
  componentName: string;

  /** Animation type */
  animationType: string;

  /** Animation complexity */
  complexity?: "high" | "medium" | "low";

  /** Whether to measure frame times */
  measureFrameTimes?: boolean;

  /** Whether to automatically adapt animation based on performance */
  autoAdapt?: boolean;

  /** Whether performance monitoring is enabled */
  enabled?: boolean;
}

/**
 * Animation performance monitoring result
 */
interface AnimationPerformanceResult {
  /**
   * Start monitoring animation performance
   * @returns Animation ID to use with stopMonitoring
   */
  startMonitoring: () => string;

  /**
   * Stop monitoring animation performance
   * @param animationId Animation ID from startMonitoring
   */
  stopMonitoring: (animationId: string) => void;

  /**
   * Record a frame paint event
   */
  recordFrame: () => void;

  /**
   * Get current animation settings
   * These may be adapted based on performance
   */
  adaptedSettings: {
    /** Whether animation complexity should be reduced */
    reduceComplexity: boolean;

    /** Duration multiplier (1.0 is normal) */
    durationMultiplier: number;

    /** Whether to use simple easings */
    useSimpleEasings: boolean;

    /** Whether to stagger animations */
    disableStaggering: boolean;
  };

  /**
   * Whether frame rate issues have been detected
   */
  hasPerformanceIssues: boolean;
}

/**
 * Info for an active animation session
 */
interface ActiveAnimation {
  id: string;
  startTime: number;
  frameCount: number;
  frameTimes: number[];
  lastFrameTime: number;
  animationType: string;
  complexity: "high" | "medium" | "low";
}

/**
 * Hook for monitoring animation performance
 * Provides methods to measure animation performance and adapt settings
 *
 * @param options Configuration options
 * @returns Animation performance monitoring methods
 */
export function useAnimationPerformance(
  options: AnimationPerformanceOptions,
): AnimationPerformanceResult {
  const {
    componentName,
    animationType,
    complexity = "medium",
    measureFrameTimes = true,
    autoAdapt = true,
    enabled = true,
  } = options;

  // Use the general performance monitoring hook
  const performance = usePerformanceMonitoring({
    componentName,
    metricType: "animation",
    priority: complexity === "high" ? "high" : "medium",
    enabled,
  });

  // Active animation reference
  const activeAnimation = useRef<ActiveAnimation | null>(null);

  // Performance issue detection
  const [hasPerformanceIssues, setHasPerformanceIssues] = useState(false);

  // Adapted settings based on performance and network
  const [adaptedSettings, setAdaptedSettings] = useState({
    reduceComplexity: false,
    durationMultiplier: 1.0,
    useSimpleEasings: false,
    disableStaggering: false,
  });

  // Update settings based on network and performance
  useEffect(() => {
    if (!autoAdapt || !enabled) return;

    try {
      // Get network quality
      const { quality, isDataSaver } =
        defaultConnectionService.getConnectionQuality();

      // Basic adaptations based on network quality
      const networkSettings = {
        reduceComplexity:
          quality === "poor" || quality === "low" || isDataSaver,
        durationMultiplier:
          quality === "poor"
            ? 0.6
            : quality === "low"
              ? 0.8
              : quality === "medium"
                ? 0.9
                : 1.0,
        useSimpleEasings:
          quality === "poor" || quality === "low" || isDataSaver,
        disableStaggering: quality === "poor" || isDataSaver,
      };

      // Combine with performance-based adaptation
      setAdaptedSettings({
        reduceComplexity:
          hasPerformanceIssues || networkSettings.reduceComplexity,
        durationMultiplier: hasPerformanceIssues
          ? 0.7 * networkSettings.durationMultiplier
          : networkSettings.durationMultiplier,
        useSimpleEasings:
          hasPerformanceIssues || networkSettings.useSimpleEasings,
        disableStaggering:
          hasPerformanceIssues || networkSettings.disableStaggering,
      });
    } catch (e) {
      // Fallback to default settings if network service unavailable
      setAdaptedSettings({
        reduceComplexity: hasPerformanceIssues,
        durationMultiplier: hasPerformanceIssues ? 0.7 : 1.0,
        useSimpleEasings: hasPerformanceIssues,
        disableStaggering: hasPerformanceIssues,
      });
    }
  }, [hasPerformanceIssues, autoAdapt, enabled]);

  // Start monitoring animation performance
  const startMonitoring = (): string => {
    if (!enabled) return "";

    const animationId = `${componentName}_${animationType}_${Date.now()}`;

    // Initialize animation tracking
    activeAnimation.current = {
      id: animationId,
      startTime: window.performance.now(),
      frameCount: 0,
      frameTimes: [],
      lastFrameTime: window.performance.now(),
      animationType,
      complexity,
    };

    return animationId;
  };

  // Stop monitoring animation performance
  const stopMonitoring = (animationId: string): void => {
    if (
      !enabled ||
      !activeAnimation.current ||
      activeAnimation.current.id !== animationId
    )
      return;

    const animation = activeAnimation.current;
    const endTime = window.performance.now();
    const duration = endTime - animation.startTime;

    // Calculate animation metrics
    let avgFrameTime = 0;
    let droppedFrames = false;
    let droppedFrameCount = 0;

    if (animation.frameCount > 0 && animation.frameTimes.length > 0) {
      // Calculate average frame time
      avgFrameTime =
        animation.frameTimes.reduce((sum, time) => sum + time, 0) /
        animation.frameTimes.length;

      // Check for dropped frames (60fps = 16.67ms/frame)
      // Allow for some variance, consider a frame dropped if > 25ms
      const droppedFrameThreshold = 25;
      droppedFrameCount = animation.frameTimes.filter(
        (time) => time > droppedFrameThreshold,
      ).length;
      droppedFrames = droppedFrameCount > 0;

      // Consider it a performance issue if more than 10% of frames are dropped
      if (droppedFrameCount > animation.frameCount * 0.1) {
        setHasPerformanceIssues(true);
      }
    }

    // Record animation performance
    performance.recordAnimation({
      duration,
      startTime: animation.startTime,
      endTime,
      avgFrameTime,
      droppedFrames,
      droppedFrameCount,
      complexity: animation.complexity,
      animationType: animation.animationType,
      component: componentName,
    });

    // Clear animation tracking
    activeAnimation.current = null;
  };

  // Record a frame paint event
  const recordFrame = (): void => {
    if (!enabled || !activeAnimation.current || !measureFrameTimes) return;

    const now = window.performance.now();
    const frameTime = now - activeAnimation.current.lastFrameTime;

    // Update animation tracking
    activeAnimation.current.frameCount++;
    activeAnimation.current.frameTimes.push(frameTime);
    activeAnimation.current.lastFrameTime = now;
  };

  return {
    startMonitoring,
    stopMonitoring,
    recordFrame,
    adaptedSettings,
    hasPerformanceIssues,
  };
}
