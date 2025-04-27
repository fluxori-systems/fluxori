import { useState, useEffect, useCallback, useRef } from "react";

import { v4 as uuidv4 } from "uuid";

import { observabilityApi } from "../api/observability.api";
import {
  ErrorInfo,
  ApiMetric,
  PerformanceMetrics,
  ObservabilityConfig,
} from "../types/observability.types";

// Default configuration
const DEFAULT_CONFIG: ObservabilityConfig = {
  enabled: process.env.NODE_ENV === "production",
  logLevel: "info",
  errorSamplingRate: 1.0, // Report all errors in production
  performanceSamplingRate: 0.1, // Report 10% of performance metrics
  metricsReportingIntervalMs: 60000, // Report metrics every minute
  tracesSamplingRate: 0.1, // Sample 10% of traces
  apiRequestTracking: true,
  userInteractionTracking: false,
};

/**
 * Hook for using the observability system in React components
 */
export function useObservability(customConfig?: Partial<ObservabilityConfig>) {
  // Merge default with custom config
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const unhandledErrorListenerRef =
    useRef<(event: ErrorEvent) => void | null>(null);
  const unhandledRejectionListenerRef =
    useRef<(event: PromiseRejectionEvent) => void | null>(null);

  // Initialize error tracking
  useEffect(() => {
    if (!config.enabled) return;

    const handleError = (event: ErrorEvent) => {
      if (Math.random() > config.errorSamplingRate) return;

      const errorInfo: Omit<ErrorInfo, "id" | "timestamp"> = {
        message: event.message || "Unknown error",
        stack: event.error?.stack,
        url: window.location.href,
        componentName: event.filename || undefined,
        metadata: {
          lineNumber: event.lineno,
          columnNumber: event.colno,
        },
      };

      // Report error to backend
      observabilityApi.reportError(errorInfo).catch(console.error);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (Math.random() > config.errorSamplingRate) return;

      const reason = event.reason;
      const errorInfo: Omit<ErrorInfo, "id" | "timestamp"> = {
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        url: window.location.href,
        metadata: {
          type: "unhandledRejection",
        },
      };

      // Report error to backend
      observabilityApi.reportError(errorInfo).catch(console.error);
    };

    // Set up global error listeners
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    // Store references to the listeners (using type assertion to fix readonly error)
    (unhandledErrorListenerRef as any).current = handleError;
    (unhandledRejectionListenerRef as any).current = handleRejection;

    setIsInitialized(true);

    // Clean up listeners on unmount
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [config.enabled, config.errorSamplingRate]);

  // Initialize performance tracking
  useEffect(() => {
    if (
      !config.enabled ||
      !config.performanceSamplingRate ||
      Math.random() > config.performanceSamplingRate
    ) {
      return;
    }

    // Use Performance API to get metrics
    const collectPerformanceMetrics = () => {
      if (!window.performance || !window.performance.timing) {
        return;
      }

      const timing = window.performance.timing;

      const metrics: PerformanceMetrics = {
        pageLoadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded:
          timing.domContentLoadedEventEnd - timing.navigationStart,
        resourceLoadTimes: [],
      };

      // Collect resource timing data
      const resources = window.performance.getEntriesByType("resource");
      resources.forEach((resource: any) => {
        metrics.resourceLoadTimes.push({
          name: resource.name,
          duration: resource.duration,
          initiatorType: resource.initiatorType,
        });
      });

      // Get Web Vitals if available
      if ("PerformanceObserver" in window) {
        const perfEntries = window.performance.getEntriesByType("paint");
        perfEntries.forEach((entry: any) => {
          if (entry.name === "first-contentful-paint") {
            metrics.firstContentfulPaint = entry.startTime;
          }
        });
      }

      // Report metrics to backend
      observabilityApi.reportPerformance(metrics).catch(console.error);
    };

    // Wait for page to fully load
    if (document.readyState === "complete") {
      setTimeout(collectPerformanceMetrics, 0);
    } else {
      window.addEventListener(
        "load",
        () => {
          setTimeout(collectPerformanceMetrics, 0);
        },
        { once: true },
      );
    }
  }, [config.enabled, config.performanceSamplingRate]);

  // Track API requests
  const trackApiRequest = useCallback(
    (metric: Omit<ApiMetric, "timestamp">) => {
      if (!config.enabled || !config.apiRequestTracking) return;
      observabilityApi.reportApiMetric(metric).catch(console.error);
    },
    [config.enabled, config.apiRequestTracking],
  );

  // Log error with context
  const logError = useCallback(
    (
      error: Error | string,
      componentName?: string,
      metadata?: Record<string, any>,
    ) => {
      if (!config.enabled || Math.random() > config.errorSamplingRate) return;

      const errorMessage = error instanceof Error ? error.message : error;
      const errorStack = error instanceof Error ? error.stack : undefined;

      const errorInfo: Omit<ErrorInfo, "id" | "timestamp"> = {
        message: errorMessage,
        stack: errorStack,
        url: window.location.href,
        componentName,
        metadata,
      };

      return observabilityApi.reportError(errorInfo);
    },
    [config.enabled, config.errorSamplingRate],
  );

  // Create trace context for API calls
  const createTraceContext = useCallback(() => {
    // Generate a new trace ID
    return {
      traceId: uuidv4(),
      spanId: uuidv4(),
      timestamp: new Date().toISOString(),
    };
  }, []);

  return {
    isInitialized,
    trackApiRequest,
    logError,
    createTraceContext,
    config,
  };
}

/**
 * Error boundary hook for React components
 */
export function useErrorBoundary() {
  const { logError } = useObservability();

  const handleError = useCallback(
    (error: Error, componentStack: string, componentName?: string) => {
      logError(error, componentName, { componentStack });
    },
    [logError],
  );

  return { handleError };
}

/**
 * Hook for tracking performance of specific components
 */
export function useComponentPerformance(componentName: string) {
  const startTimeRef = useRef<number | null>(null);
  const { trackApiRequest } = useObservability();

  const startMeasure = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const endMeasure = useCallback(
    (operation: string) => {
      if (startTimeRef.current === null) return;

      const duration = performance.now() - startTimeRef.current;
      trackApiRequest({
        endpoint: `component/${componentName}/${operation}`,
        method: "RENDER",
        statusCode: 200,
        duration,
        success: true,
      });

      startTimeRef.current = null;
    },
    [componentName, trackApiRequest],
  );

  // Auto-start on mount
  useEffect(() => {
    startMeasure();

    return () => {
      if (startTimeRef.current !== null) {
        endMeasure("unmount");
      }
    };
  }, [startMeasure, endMeasure]);

  return { startMeasure, endMeasure };
}
