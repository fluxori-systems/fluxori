import { apiClient } from "./apiClient";
import {
  SystemHealthInfo,
  HealthCheckResult,
  Metric,
  Trace,
  ErrorInfo,
  ApiMetric,
  PerformanceMetrics,
} from "../types/observability.types";

/**
 * API client for the Observability system
 */
export const observabilityApi = {
  /**
   * Get the overall system health status
   */
  getSystemHealth: async (): Promise<SystemHealthInfo> => {
    const response = await apiClient.get<SystemHealthInfo>("/health");
    return response.data;
  },

  /**
   * Get detailed health status with component-level information
   */
  getDetailedHealth: async (): Promise<SystemHealthInfo> => {
    const response = await apiClient.get<SystemHealthInfo>("/health/detailed");
    return response.data;
  },

  /**
   * Get the status of a specific component
   */
  getComponentHealth: async (
    componentName: string,
  ): Promise<HealthCheckResult> => {
    const response = await apiClient.get<HealthCheckResult>(
      `/health/components/${componentName}`,
    );
    return response.data;
  },

  /**
   * Get metrics for the specified name and optional time range
   */
  getMetrics: async (
    name: string,
    params?: {
      startTime?: string;
      endTime?: string;
      interval?: string;
      labels?: Record<string, string>;
    },
  ): Promise<Metric> => {
    const response = await apiClient.get<Metric>(`/metrics/${name}`, {
      params,
    });
    return response.data;
  },

  /**
   * Get a list of all available metrics
   */
  listMetrics: async (): Promise<
    { name: string; description: string; type: string }[]
  > => {
    const response =
      await apiClient.get<
        { name: string; description: string; type: string }[]
      >("/metrics");
    return response.data;
  },

  /**
   * Get a trace by its ID
   */
  getTrace: async (traceId: string): Promise<Trace> => {
    const response = await apiClient.get<Trace>(`/traces/${traceId}`);
    return response.data;
  },

  /**
   * Search for traces based on criteria
   */
  searchTraces: async (params: {
    serviceName?: string;
    operationName?: string;
    tags?: Record<string, string>;
    startTime?: string;
    endTime?: string;
    minDuration?: number;
    maxDuration?: number;
    limit?: number;
  }): Promise<Trace[]> => {
    const response = await apiClient.get<Trace[]>("/traces", { params });
    return response.data;
  },

  /**
   * Report a frontend error to the backend
   */
  reportError: async (
    error: Omit<ErrorInfo, "id" | "timestamp">,
  ): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string }>("/errors", error);
    return response.data;
  },

  /**
   * Report frontend performance metrics
   */
  reportPerformance: async (metrics: PerformanceMetrics): Promise<void> => {
    await apiClient.post("/metrics/frontend/performance", metrics);
  },

  /**
   * Report API request metrics from the frontend
   */
  reportApiMetric: async (
    metric: Omit<ApiMetric, "timestamp">,
  ): Promise<void> => {
    await apiClient.post("/metrics/frontend/api", metric);
  },

  /**
   * Get API metrics for dashboard
   */
  getApiMetrics: async (params?: {
    startTime?: string;
    endTime?: string;
    endpoint?: string;
    method?: string;
  }): Promise<ApiMetric[]> => {
    const response = await apiClient.get<ApiMetric[]>("/metrics/api", {
      params,
    });
    return response.data;
  },
};
