"use client";

/**
 * Hook for general UI performance monitoring
 */

import { useCallback } from "react";

interface PerformanceMonitoringConfig {
  /** Component name for tracking */
  componentName: string;
  /** Whether to measure component mount time */
  measureMountTime?: boolean;
  /** Whether to measure component render time */
  measureRenderTime?: boolean;
}

interface MetricOptions {
  /** Name of the metric */
  name?: string;
  /** Type of metric */
  type?: "render" | "interaction" | "animation" | "network";
  /** Priority of the metric */
  priority?: "high" | "medium" | "low";
}

export function usePerformanceMonitoring(config: PerformanceMonitoringConfig) {
  const {
    componentName,
    measureMountTime = false,
    measureRenderTime = false,
  } = config;

  /**
   * Wrapper to measure function execution time
   */
  const measureExecutionTime = useCallback(
    <T extends (...args: any[]) => any>(fn: T, options?: MetricOptions) => {
      return (...args: Parameters<T>): ReturnType<T> => {
        const start = performance.now();
        const result = fn(...args);
        const duration = performance.now() - start;

        // Record this metric
        recordMetric(options?.name || "executionTime", duration, options);

        return result;
      };
    },
    [componentName],
  );

  /**
   * Record a performance metric
   */
  const recordMetric = useCallback(
    (metricName: string, value: number, options?: MetricOptions) => {
      // Log performance metrics to console in development
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[Performance] ${componentName} - ${metricName}: ${value.toFixed(2)}ms`,
          options,
        );
      }

      // Here we would also send metrics to a service like
      // Application Insights or a custom analytics endpoint
    },
    [componentName],
  );

  /**
   * Get the current timestamp
   */
  const now = useCallback(() => {
    return performance.now();
  }, []);

  return {
    measureExecutionTime,
    recordMetric,
    now,
  };
}
