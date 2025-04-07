import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Create and configure an API client for making requests
 */
export function createApiClient(config?: AxiosRequestConfig): AxiosInstance {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    ...config,
  });
  
  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config) => {
      // Get auth token from localStorage or another source
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Response interceptor - extract data and handle errors
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // For successful requests, return just the data
      return response.data;
    },
    (error) => {
      // Handle errors
      if (error.response?.status === 401) {
        // Handle unauthorized errors
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          // Optionally redirect to login
          // window.location.href = '/login';
        }
      }
      
      return Promise.reject(error.response?.data || error.message);
    }
  );
  
  return client;
}

/**
 * Default API client instance
 */
export const apiClient = createApiClient();