"use client";

import { RefObject, useEffect } from "react";

import { gsap } from "gsap";

import { defaultConnectionService } from "./connection-service.impl";
import { defaultPerformanceMonitoringService } from "./performance/performance-monitoring.service";
import {
  IAnimationService,
  ComponentAnimationConfig,
  PerformanceMonitoringSettings,
  AnimationFrameRecord,
  PerformanceAnalysisResult,
} from "../../shared/services/animation-service.interface";
import { complexityPresets } from "../../shared/types/motion-tokens";
import {
  AnimationParams,
  AnimationStrategyConfig,
  MotionMode,
  NetworkCondition,
} from "../../shared/types/motion-types";

/**
 * Implementation of the animation service interface
 * Provides animation capabilities with network awareness
 */
export class AnimationServiceImpl implements IAnimationService {
  private motionMode: MotionMode = "full";
  private prefersReducedMotion: boolean = false;
  private performanceData: Record<string, any> = {};
  private animationFrames: Record<string, AnimationFrameRecord[]> = {};

  constructor() {
    // Check for reduced motion preference in browser
    if (typeof window !== "undefined") {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      this.prefersReducedMotion = query.matches;

      // Listen for changes
      query.addEventListener("change", (event) => {
        this.prefersReducedMotion = event.matches;
      });
    }
  }

  /**
   * Set the current motion mode
   * This affects how animations are applied
   */
  public setMotionMode(mode: MotionMode): void {
    this.motionMode = mode;
  }

  /**
   * Get the current motion mode
   */
  public getMotionMode(): string {
    return this.motionMode;
  }

  /**
   * Check if animations should be reduced
   */
  public shouldReduceMotion(): boolean {
    return this.prefersReducedMotion || this.motionMode === "minimal";
  }

  /**
   * Animate a component based on configuration
   * @param config Animation configuration
   * @returns Cleanup function
   */
  public animateComponent(config: ComponentAnimationConfig): () => void {
    const {
      ref,
      enabled = true,
      mode,
      isActive = false,
      properties = {},
      networkAware = true,
      durationMultiplier = 1.0,
    } = config;

    // Get network information
    const connectionData = defaultConnectionService.getConnectionQuality();

    // Map connection quality to network condition
    const networkQuality: NetworkCondition =
      connectionData.quality === "high"
        ? "fast"
        : connectionData.quality === "medium"
          ? "medium"
          : connectionData.quality === "low"
            ? "slow"
            : "poor";

    // Get animation strategy
    const strategy = this.getAnimationStrategy({
      animationType: mode,
      motionMode: this.motionMode,
      networkAware,
      shouldReduceMotion: this.prefersReducedMotion,
      networkCondition: networkQuality,
      customDuration: durationMultiplier,
    });

    // Early return if animations are disabled or ref is not set
    if (!strategy.enabled || !enabled || !ref.current) {
      return () => {}; // No-op cleanup
    }

    // Start performance timing
    const startTime = performance.now();

    // Determine animation complexity
    const complexity = strategy.reduceComplexity
      ? strategy.useSimpleEasings
        ? "low"
        : "medium"
      : "high";

    // Generate a unique ID for this animation
    const componentName =
      ref.current.getAttribute("data-component-name") ||
      ref.current.className.split(" ")[0] ||
      "unknown";

    const animationId = `${componentName}_${mode}_${Date.now()}`;

    let animation: gsap.core.Animation | null = null;

    // Apply animation based on mode
    switch (mode) {
      case "hover":
        if (isActive) {
          animation = gsap.to(ref.current, {
            scale: properties.scale || 1 + 0.03 * strategy.scaleMultiplier,
            duration: 0.2 * strategy.durationMultiplier,
            ease: strategy.useSimpleEasings ? "power1.out" : "back.out(1.5)",
            ...properties,
          });
        } else {
          animation = gsap.to(ref.current, {
            scale: 1,
            duration: 0.3 * strategy.durationMultiplier,
            ease: strategy.useSimpleEasings ? "power1.in" : "back.in(1.5)",
            ...properties,
          });
        }
        break;

      case "press":
        if (isActive) {
          animation = gsap.to(ref.current, {
            scale: 0.97,
            duration: 0.1 * strategy.durationMultiplier,
            ...properties,
          });
        } else {
          animation = gsap.to(ref.current, {
            scale: 1,
            duration: 0.2 * strategy.durationMultiplier,
            ...properties,
          });
        }
        break;

      case "focus":
        if (isActive) {
          animation = gsap.to(ref.current, {
            boxShadow:
              properties.boxShadow || "0 0 0 3px rgba(58, 134, 255, 0.2)",
            duration: 0.2 * strategy.durationMultiplier,
            ...properties,
          });
        } else {
          animation = gsap.to(ref.current, {
            boxShadow: "0 0 0 0px rgba(58, 134, 255, 0)",
            duration: 0.2 * strategy.durationMultiplier,
            ...properties,
          });
        }
        break;

      case "shake":
        if (isActive) {
          // Apply shake animation for errors - this is important so we keep it even in reduced mode
          animation = gsap.to(ref.current, {
            x: properties.x || -3,
            duration: 0.07 * strategy.durationMultiplier,
            ease: "power2.out",
            repeat: strategy.reduceComplexity ? 2 : 5,
            yoyo: true,
            onComplete: () => {
              gsap.to(ref.current, {
                x: 0,
                duration: 0.05 * strategy.durationMultiplier,
              });
            },
            ...properties,
          });
        }
        break;

      case "success":
        if (isActive) {
          // Flash green for success feedback
          animation = gsap
            .timeline()
            .to(ref.current, {
              backgroundColor:
                properties.successColor || "rgba(56, 176, 0, 0.1)",
              duration: 0.2 * strategy.durationMultiplier,
              ...properties,
            })
            .to(ref.current, {
              backgroundColor: "transparent",
              duration: 0.5 * strategy.durationMultiplier,
              ...properties,
            });
        }
        break;

      case "loading":
        if (isActive) {
          // Subtle pulse animation
          animation = gsap.to(ref.current, {
            opacity: properties.opacity || 0.7,
            duration: 0.5 * strategy.durationMultiplier,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            ...properties,
          });
        } else {
          animation = gsap.to(ref.current, {
            opacity: 1,
            duration: 0.2 * strategy.durationMultiplier,
            ...properties,
          });
        }
        break;

      case "error":
        if (isActive) {
          // Apply error animation - flash red background
          animation = gsap
            .timeline()
            .to(ref.current, {
              backgroundColor:
                properties.errorColor || "rgba(255, 58, 58, 0.1)",
              duration: 0.2 * strategy.durationMultiplier,
              ...properties,
            })
            .to(ref.current, {
              backgroundColor: "transparent",
              duration: 0.5 * strategy.durationMultiplier,
              ...properties,
            });
        }
        break;

      case "appear":
        if (isActive) {
          // Fade in animation
          animation = gsap.fromTo(
            ref.current,
            {
              opacity: 0,
              y: properties.y || 10,
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.3 * strategy.durationMultiplier,
              ease: strategy.useSimpleEasings ? "power1.out" : "back.out(1.2)",
              ...properties,
            },
          );
        }
        break;
    }

    // Return cleanup function
    return () => {
      if (animation) {
        animation.kill();
      }

      // Reset any transforms
      if (ref.current) {
        gsap.set(ref.current, { clearProps: "all" });
      }

      // Record animation performance
      const endTime = performance.now();
      defaultPerformanceMonitoringService.recordAnimationPerformance({
        duration: endTime - startTime,
        startTime,
        endTime,
        animationType: mode,
        component: componentName,
        complexity: complexity as "high" | "medium" | "low",
      });
    };
  }

  /**
   * Get animation parameters based on strategy configuration
   * @param config Strategy configuration
   * @returns Animation parameters
   */
  public getAnimationStrategy(
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
    const networkCondition = config.networkCondition || "medium";

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
    const preset = complexityPresets[motionMode];

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

  /**
   * Start performance monitoring for an animation
   * @param settings Monitoring settings
   * @returns Monitoring session ID
   */
  public startPerformanceMonitoring(
    settings: PerformanceMonitoringSettings,
  ): number {
    const { component, type = "default" } = settings;
    const id = settings.id || `${component}_${type}_${Date.now()}`;

    // Initialize performance data for this component if it doesn't exist
    if (!this.performanceData[component]) {
      this.performanceData[component] = {
        sessions: {},
        analytics: {
          totalDuration: 0,
          sessionCount: 0,
          averageFrameTime: 0,
          issues: [],
        },
      };
    }

    // Initialize frame data for this component if it doesn't exist
    if (!this.animationFrames[component]) {
      this.animationFrames[component] = [];
    }

    // Create a new monitoring session
    this.performanceData[component].sessions[id] = {
      startTime: performance.now(),
      type,
      frames: [],
      completed: false,
    };

    return parseInt(id.toString().split("_").pop() || "0", 10);
  }

  /**
   * Record an animation frame
   * @param record Frame record
   */
  public recordAnimationFrame(record: AnimationFrameRecord): void {
    const { component, timestamp } = record;

    // Skip if component doesn't exist in performance data
    if (!this.animationFrames[component]) {
      this.animationFrames[component] = [];
    }

    // Add frame record
    this.animationFrames[component].push({
      component,
      timestamp,
    });

    // Keep only last 100 frames to prevent memory issues
    if (this.animationFrames[component].length > 100) {
      this.animationFrames[component].shift();
    }
  }

  /**
   * Stop performance monitoring for an animation
   * @param settings Monitoring settings
   */
  public stopPerformanceMonitoring(
    settings: PerformanceMonitoringSettings,
  ): void {
    const { id, component } = settings;

    // Skip if component or session doesn't exist
    if (!id || !this.performanceData[component]?.sessions[id]) {
      return;
    }

    const session = this.performanceData[component].sessions[id];
    const endTime = performance.now();
    const duration = endTime - session.startTime;

    // Update session data
    session.endTime = endTime;
    session.duration = duration;
    session.completed = true;

    // Update analytics
    const analytics = this.performanceData[component].analytics;
    analytics.totalDuration += duration;
    analytics.sessionCount += 1;

    // Calculate frame times if we have frames
    if (
      this.animationFrames[component] &&
      this.animationFrames[component].length > 1
    ) {
      const frames = this.animationFrames[component];
      let totalFrameTime = 0;
      let frameCount = 0;

      // Calculate frame times
      for (let i = 1; i < frames.length; i++) {
        const frameTime = frames[i].timestamp - frames[i - 1].timestamp;

        // Only count frames that seem legitimate (less than 100ms)
        if (frameTime > 0 && frameTime < 100) {
          totalFrameTime += frameTime;
          frameCount += 1;
        }
      }

      // Update average frame time
      if (frameCount > 0) {
        analytics.averageFrameTime = totalFrameTime / frameCount;
      }
    }

    // Auto-adapt if requested
    if (settings.autoAdapt && analytics.averageFrameTime > 16.67) {
      // 16.67ms = 60fps threshold
      // If we consistently miss 60fps, we should consider reducing animation complexity
      this.performanceData[component].analytics.issues.push({
        type: "performance",
        message: "Animation is not maintaining 60fps",
        timestamp: Date.now(),
        frameTime: analytics.averageFrameTime,
      });
    }
  }

  /**
   * Get performance analysis for a component
   * @param settings Analysis settings
   * @returns Performance analysis result
   */
  public getPerformanceAnalysis(
    settings: PerformanceMonitoringSettings,
  ): PerformanceAnalysisResult | null {
    const { component } = settings;

    // Skip if component doesn't exist in performance data
    if (!this.performanceData[component]) {
      return null;
    }

    const analytics = this.performanceData[component].analytics;

    // Calculate severity level based on average frame time
    // >16.67ms = missing 60fps (level 1)
    // >33.33ms = missing 30fps (level 2)
    // >50ms = very poor performance (level 3)
    let severityLevel = 0;
    if (analytics.averageFrameTime > 50) {
      severityLevel = 3;
    } else if (analytics.averageFrameTime > 33.33) {
      severityLevel = 2;
    } else if (analytics.averageFrameTime > 16.67) {
      severityLevel = 1;
    }

    // Calculate drop rate percentage
    const targetFrameTime = 16.67; // 60fps target
    const dropRate =
      analytics.averageFrameTime > targetFrameTime
        ? ((analytics.averageFrameTime - targetFrameTime) / targetFrameTime) *
          100
        : 0;

    return {
      hasIssues: severityLevel > 0,
      severityLevel,
      averageFrameTime: analytics.averageFrameTime,
      dropRate,
      maxFrameTime: this.calculateMaxFrameTime(component),
    };
  }

  /**
   * Calculate maximum frame time for a component
   * @param component Component name
   * @returns Maximum frame time in milliseconds
   */
  private calculateMaxFrameTime(component: string): number {
    if (
      !this.animationFrames[component] ||
      this.animationFrames[component].length < 2
    ) {
      return 0;
    }

    const frames = this.animationFrames[component];
    let maxFrameTime = 0;

    for (let i = 1; i < frames.length; i++) {
      const frameTime = frames[i].timestamp - frames[i - 1].timestamp;

      // Only consider reasonable frame times (< 100ms) to avoid outliers
      if (frameTime > 0 && frameTime < 100 && frameTime > maxFrameTime) {
        maxFrameTime = frameTime;
      }
    }

    return maxFrameTime;
  }
}

/**
 * Default implementation of the animation service
 */
export const defaultAnimationService = new AnimationServiceImpl();
