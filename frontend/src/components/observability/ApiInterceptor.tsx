import React, { useEffect, ReactNode } from "react";

import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { v4 as uuidv4 } from "uuid";

import { observabilityApi } from "../../api/observability.api";
import { useObservability } from "../../hooks/useObservability";

interface ApiInterceptorProps {
  children: ReactNode;
}

/**
 * Component that intercepts all API calls for observability purposes.
 * Should be placed high in the component tree.
 */
export const ApiInterceptor: React.FC<ApiInterceptorProps> = ({ children }) => {
  const { logError, trackApiRequest, config } = useObservability();

  useEffect(() => {
    if (!config.enabled) return;

    // Set up request interceptor
    const requestInterceptor = axios.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Start timing the request
        const startTime = performance.now();

        // Store timing information for the response interceptor
        (config as any).metadata = {
          ...(config as any).metadata,
          startTime,
        };

        // Add tracing headers
        const traceId = uuidv4();
        const spanId = uuidv4();

        if (config.headers) {
          // Add tracing context to headers
          config.headers["X-Trace-ID"] = traceId;
          config.headers["X-Span-ID"] = spanId;

          // Add user and organization context if available
          const userId =
            typeof window !== "undefined"
              ? localStorage.getItem("user_id")
              : null;
          const orgId =
            typeof window !== "undefined"
              ? localStorage.getItem("organization_id")
              : null;

          if (userId) {
            config.headers["X-User-ID"] = userId;
          }

          if (orgId) {
            config.headers["X-Organization-ID"] = orgId;
          }
        }

        return config;
      },
      (error: AxiosError) => {
        // Log request error
        logError(error, "ApiInterceptor", {
          config: error.config,
          code: error.code,
        });

        return Promise.reject(error);
      },
    );

    // Set up response interceptor
    const responseInterceptor = axios.interceptors.response.use(
      (response: AxiosResponse) => {
        const config = response.config;
        const startTime = (config as any).metadata?.startTime;

        if (startTime) {
          const endTime = performance.now();
          const duration = endTime - startTime;

          // Get the normalized endpoint path
          const url = new URL(
            response.config.url || "",
            response.config.baseURL,
          );
          const endpoint = url.pathname;

          // Track API request
          trackApiRequest({
            endpoint,
            method: response.config.method?.toUpperCase() || "UNKNOWN",
            statusCode: response.status,
            duration,
            success: true,
          });
        }

        return response;
      },
      (error: AxiosError) => {
        const config = error.config as any;
        const startTime = config?.metadata?.startTime;

        if (startTime) {
          const endTime = performance.now();
          const duration = endTime - startTime;

          // Get the normalized endpoint path
          let endpoint = "unknown";
          try {
            if (config?.url) {
              const url = new URL(config.url, config.baseURL);
              endpoint = url.pathname;
            }
          } catch (e) {
            console.error("Failed to parse URL", e);
          }

          // Track API request error
          trackApiRequest({
            endpoint,
            method: config?.method?.toUpperCase() || "UNKNOWN",
            statusCode: error.response?.status || 0,
            duration,
            success: false,
          });

          // Log detailed error
          logError(error, "ApiInterceptor", {
            status: error.response?.status,
            endpoint,
            method: config?.method,
            responseData: error.response?.data,
          });
        }

        return Promise.reject(error);
      },
    );

    // Clean up interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [config.enabled, logError, trackApiRequest]);

  return <>{children}</>;
};
