'use client';

import { useEffect, useRef } from 'react';
import { defaultPerformanceMonitoringService } from '../services/performance/performance-monitoring.service';
import { AnimationPerformanceData, PerformanceMetricType, MetricPriority } from '../types/performance';

/**
 * Configuration for the usePerformanceMonitoring hook
 */
interface PerformanceMonitoringOptions {
  /** Component name to be recorded with metrics */
  componentName: string;
  
  /** Whether to measure component mount time */
  measureMountTime?: boolean;
  
  /** Whether to measure component render time */
  measureRenderTime?: boolean;
  
  /** Whether to measure interaction times */
  measureInteractions?: boolean;
  
  /** Default metric type */
  metricType?: PerformanceMetricType;
  
  /** Default metric priority */
  priority?: MetricPriority;
  
  /** Whether metrics are enabled */
  enabled?: boolean;
}

/**
 * Result from the usePerformanceMonitoring hook
 */
interface PerformanceMonitoringResult {
  /**
   * Start timing an operation
   * @param operationName Operation name
   * @param options Optional configuration
   * @returns Timing handle
   */
  startTiming: (
    operationName: string,
    options?: {
      type?: PerformanceMetricType;
      priority?: MetricPriority;
      context?: Record<string, any>;
    }
  ) => string;
  
  /**
   * Stop timing an operation
   * @param handle Timing handle from startTiming
   * @param additionalData Additional data to include
   * @returns Duration in milliseconds
   */
  stopTiming: (
    handle: string,
    additionalData?: Record<string, any>
  ) => number;
  
  /**
   * Record animation performance
   * @param data Animation performance data
   */
  recordAnimation: (data: Partial<AnimationPerformanceData>) => void;
  
  /**
   * Record a custom metric
   * @param metricId Metric identifier
   * @param value Metric value
   * @param options Optional configuration
   */
  recordMetric: (
    metricId: string,
    value: number,
    options?: {
      label?: string;
      type?: PerformanceMetricType;
      priority?: MetricPriority;
      context?: Record<string, any>;
    }
  ) => void;
  
  /**
   * Measure execution time of a function
   * @param fn Function to measure
   * @param options Measurement options
   * @returns Function result
   */
  measureExecutionTime: <T>(
    fn: () => T,
    options: {
      name: string;
      type?: PerformanceMetricType;
      priority?: MetricPriority;
      context?: Record<string, any>;
    }
  ) => T;
  
  /**
   * Measure execution time of an async function
   * @param fn Async function to measure
   * @param options Measurement options
   * @returns Promise with function result
   */
  measureAsyncExecutionTime: <T>(
    fn: () => Promise<T>,
    options: {
      name: string;
      type?: PerformanceMetricType;
      priority?: MetricPriority;
      context?: Record<string, any>;
    }
  ) => Promise<T>;
}

/**
 * Hook for performance monitoring
 * Provides methods to measure performance within React components
 * 
 * @param options Configuration options
 * @returns Performance monitoring methods
 */
export function usePerformanceMonitoring(
  options: PerformanceMonitoringOptions
): PerformanceMonitoringResult {
  const {
    componentName,
    measureMountTime = true,
    measureRenderTime = false,
    measureInteractions = false,
    metricType = 'component',
    priority = 'medium',
    enabled = true
  } = options;
  
  // Store render time reference
  const renderStartTime = useRef<number>(0);
  
  // Start timing render
  if (measureRenderTime && enabled) {
    renderStartTime.current = performance.now();
  }
  
  // Measure component mount time
  useEffect(() => {
    if (!measureMountTime || !enabled) return;
    
    // Record mount time
    const mountTime = performance.now() - performance.timing.domLoading;
    
    defaultPerformanceMonitoringService.recordMetric({
      id: `mount_${componentName}`,
      type: 'component',
      label: `Mount: ${componentName}`,
      value: mountTime,
      priority,
      component: componentName
    });
    
    // Record render time if enabled
    if (measureRenderTime && renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      
      defaultPerformanceMonitoringService.recordMetric({
        id: `render_${componentName}`,
        type: 'rendering',
        label: `Render: ${componentName}`,
        value: renderTime,
        priority,
        component: componentName
      });
    }
    
    // Clean up function
    return () => {
      if (!enabled) return;
      
      // Record unmount (might catch only in development due to StrictMode)
      defaultPerformanceMonitoringService.recordMetric({
        id: `unmount_${componentName}`,
        type: 'component',
        label: `Unmount: ${componentName}`,
        value: 0, // No timing for unmount, just record it happened
        priority: 'low',
        component: componentName
      });
    };
  }, [componentName, measureMountTime, measureRenderTime, priority, enabled]);
  
  // Start timing an operation
  const startTiming = (
    operationName: string,
    options?: {
      type?: PerformanceMetricType;
      priority?: MetricPriority;
      context?: Record<string, any>;
    }
  ): string => {
    if (!enabled) return operationName;
    
    return defaultPerformanceMonitoringService.startTiming(
      operationName,
      {
        type: options?.type || metricType,
        priority: options?.priority || priority,
        component: componentName,
        context: options?.context
      }
    );
  };
  
  // Stop timing an operation
  const stopTiming = (
    handle: string,
    additionalData?: Record<string, any>
  ): number => {
    if (!enabled) return 0;
    
    return defaultPerformanceMonitoringService.stopTiming(handle, additionalData);
  };
  
  // Record animation performance
  const recordAnimation = (data: Partial<AnimationPerformanceData>): void => {
    if (!enabled) return;
    
    defaultPerformanceMonitoringService.recordAnimationPerformance({
      // Default values
      duration: 0,
      startTime: 0,
      endTime: 0,
      component: componentName,
      // Override with provided data
      ...data
    });
  };
  
  // Record a custom metric
  const recordMetric = (
    metricId: string,
    value: number,
    options?: {
      label?: string;
      type?: PerformanceMetricType;
      priority?: MetricPriority;
      context?: Record<string, any>;
    }
  ): void => {
    if (!enabled) return;
    
    defaultPerformanceMonitoringService.recordMetric({
      id: metricId,
      type: options?.type || metricType,
      label: options?.label || metricId.replace(/([A-Z])/g, ' $1').trim(),
      value,
      priority: options?.priority || priority,
      component: componentName,
      context: options?.context
    });
  };
  
  // Measure execution time of a function
  const measureExecutionTime = <T>(
    fn: () => T,
    options: {
      name: string;
      type?: PerformanceMetricType;
      priority?: MetricPriority;
      context?: Record<string, any>;
    }
  ): T => {
    if (!enabled) return fn();
    
    const startTime = performance.now();
    
    try {
      // Execute the function
      const result = fn();
      
      // Record the execution time
      const executionTime = performance.now() - startTime;
      
      recordMetric(
        options.name,
        executionTime,
        {
          type: options.type || 'component',
          priority: options.priority || priority,
          context: options.context
        }
      );
      
      return result;
    } catch (error) {
      // Record execution failure
      recordMetric(
        `${options.name}_error`,
        performance.now() - startTime,
        {
          type: options.type || 'component',
          priority: 'high', // Errors are high priority
          context: { 
            ...options.context,
            error: error instanceof Error ? error.message : String(error)
          }
        }
      );
      
      // Re-throw the error
      throw error;
    }
  };
  
  // Measure execution time of an async function
  const measureAsyncExecutionTime = async <T>(
    fn: () => Promise<T>,
    options: {
      name: string;
      type?: PerformanceMetricType;
      priority?: MetricPriority;
      context?: Record<string, any>;
    }
  ): Promise<T> => {
    if (!enabled) return fn();
    
    const startTime = performance.now();
    
    try {
      // Execute the async function
      const result = await fn();
      
      // Record the execution time
      const executionTime = performance.now() - startTime;
      
      recordMetric(
        options.name,
        executionTime,
        {
          type: options.type || 'component',
          priority: options.priority || priority,
          context: options.context
        }
      );
      
      return result;
    } catch (error) {
      // Record execution failure
      recordMetric(
        `${options.name}_error`,
        performance.now() - startTime,
        {
          type: options.type || 'component',
          priority: 'high', // Errors are high priority
          context: { 
            ...options.context,
            error: error instanceof Error ? error.message : String(error)
          }
        }
      );
      
      // Re-throw the error
      throw error;
    }
  };
  
  return {
    startTiming,
    stopTiming,
    recordAnimation,
    recordMetric,
    measureExecutionTime,
    measureAsyncExecutionTime
  };
}