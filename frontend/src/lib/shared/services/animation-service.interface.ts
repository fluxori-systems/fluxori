"use client";

import { RefObject } from "react";

import {
  AnimationMode,
  AnimationParams,
  AnimationStrategyConfig,
} from "../types/motion-types";

/**
 * Configuration options for component animations
 */
export interface ComponentAnimationConfig {
  /** Reference to the DOM element */
  ref: RefObject<HTMLElement>;
  /** Whether the animation is enabled */
  enabled?: boolean;
  /** Animation mode */
  mode: AnimationMode;
  /** Is component in active state */
  isActive?: boolean;
  /** Custom animation properties */
  properties?: Record<string, any>;
  /** Enable network-aware optimizations */
  networkAware?: boolean;
  /** Custom duration multiplier */
  durationMultiplier?: number;
}

/**
 * Performance monitoring settings
 */
export interface PerformanceMonitoringSettings {
  /** Unique identifier for the monitoring session */
  id?: string;
  /** Component name */
  component: string;
  /** Animation type */
  type?: string;
  /** Auto-adapt settings based on results */
  autoAdapt?: boolean;
}

/**
 * Animation frame record
 */
export interface AnimationFrameRecord {
  /** Component name */
  component: string;
  /** Current timestamp */
  timestamp: number;
}

/**
 * Performance analysis result
 */
export interface PerformanceAnalysisResult {
  /** Whether performance issues were detected */
  hasIssues: boolean;
  /** Severity level of issues (0-3) */
  severityLevel: number;
  /** Average frame time in ms */
  averageFrameTime?: number;
  /** Max frame time in ms */
  maxFrameTime?: number;
  /** Drop rate percentage */
  dropRate?: number;
}

/**
 * Interface for animation services
 * This abstraction allows for different implementations without creating circular dependencies
 */
export interface IAnimationService {
  /**
   * Apply animation to a component
   * @param config Animation configuration
   * @returns Cleanup function
   */
  animateComponent(config: ComponentAnimationConfig): () => void;

  /**
   * Get animation parameters based on strategy configuration
   * @param config Strategy configuration
   * @returns Animation parameters
   */
  getAnimationStrategy(config: AnimationStrategyConfig): AnimationParams;

  /**
   * Check if animations should be reduced based on user preferences and system settings
   * @returns True if animations should be reduced
   */
  shouldReduceMotion(): boolean;

  /**
   * Get the current motion mode setting
   * @returns Current motion mode
   */
  getMotionMode(): string;

  /**
   * Start performance monitoring for an animation
   * @param settings Monitoring settings
   * @returns Monitoring session ID
   */
  startPerformanceMonitoring(settings: PerformanceMonitoringSettings): number;

  /**
   * Record an animation frame
   * @param record Frame record
   */
  recordAnimationFrame(record: AnimationFrameRecord): void;

  /**
   * Stop performance monitoring for an animation
   * @param settings Monitoring settings
   */
  stopPerformanceMonitoring(settings: PerformanceMonitoringSettings): void;

  /**
   * Get performance analysis for a component
   * @param settings Analysis settings
   * @returns Performance analysis result
   */
  getPerformanceAnalysis(
    settings: PerformanceMonitoringSettings,
  ): PerformanceAnalysisResult | null;
}

/**
 * Context key for accessing the animation service
 * @internal
 */
export const ANIMATION_SERVICE_KEY = "animationService";

/**
 * React hook to access the animation service
 * This is a placeholder that gets implemented by the service provider
 * @returns The current animation service implementation
 */
export function useAnimationService(): IAnimationService {
  throw new Error("useAnimationService must be used within a ServiceProvider");
}
