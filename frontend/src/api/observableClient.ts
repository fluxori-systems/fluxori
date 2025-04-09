import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig
} from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { observabilityApi } from './observability.api';

/**
 * Creates and returns a properly configured Axios instance with observability
 * features like request/response tracking, error reporting, and distributed tracing.
 */
export function getObservableClient(baseURL?: string): AxiosInstance {
  const defaultBaseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  
  const client = axios.create({
    baseURL: baseURL || defaultBaseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  // Request interceptor for adding auth token and tracing headers
  client.interceptors.request.use(
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
        config.headers['X-Trace-ID'] = traceId;
        config.headers['X-Span-ID'] = spanId;
        
        // Get token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add user and organization context if available
        const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
        const orgId = typeof window !== 'undefined' ? localStorage.getItem('organization_id') : null;
        
        if (userId) {
          config.headers['X-User-ID'] = userId;
        }
        
        if (orgId) {
          config.headers['X-Organization-ID'] = orgId;
        }
      }
      
      return config;
    },
    (error: AxiosError) => {
      // Report request error
      observabilityApi.reportError({
        message: `API Request Error: ${error.message}`,
        stack: error.stack,
        componentName: 'ObservableClient',
        metadata: {
          config: error.config,
          code: error.code
        }
      }).catch(console.error);
      
      return Promise.reject(error);
    }
  );
  
  // Response interceptor for metrics collection and error tracking
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      const config = response.config;
      const startTime = (config as any).metadata?.startTime;
      
      if (startTime) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Get the normalized endpoint path
        const url = new URL(response.config.url || '', response.config.baseURL);
        const endpoint = url.pathname;
        
        // Report API metrics
        observabilityApi.reportApiMetric({
          endpoint,
          method: response.config.method?.toUpperCase() || 'UNKNOWN',
          statusCode: response.status,
          duration,
          success: true
        }).catch(console.error);
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
        let endpoint = 'unknown';
        try {
          if (config?.url) {
            const url = new URL(config.url, config.baseURL);
            endpoint = url.pathname;
          }
        } catch (e) {
          console.error('Failed to parse URL', e);
        }
        
        // Report API error metrics
        observabilityApi.reportApiMetric({
          endpoint,
          method: config?.method?.toUpperCase() || 'UNKNOWN',
          statusCode: error.response?.status || 0,
          duration,
          success: false
        }).catch(console.error);
        
        // Report detailed error for monitoring
        observabilityApi.reportError({
          message: `API Response Error: ${error.message}`,
          stack: error.stack,
          componentName: 'ObservableClient',
          metadata: {
            status: error.response?.status,
            endpoint,
            method: config?.method,
            responseData: error.response?.data
          }
        }).catch(console.error);
      }
      
      return Promise.reject(error);
    }
  );
  
  return client;
}

// Export a pre-configured instance with the default base URL
export const observableClient = getObservableClient();