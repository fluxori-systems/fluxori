import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Import types directly to solve type errors with import() expressions
import { 
  SignedUrlParams, 
  SignedUrlResponse, 
  FileListParams, 
  FileMetadata, 
  FileOperationResponse, 
  DownloadUrlResponse
} from '../types/storage.types';

import { 
  UsageHistoryParams, 
  UsageRecord, 
  UsageByDayParams, 
  DailyUsage, 
  UsageByModelParams, 
  ModelUsage, 
  CreditAllotment 
} from '../types/analytics.types';

import { Organization, User } from '../types/api.types';

/**
 * Creates and returns an API client instance
 */
function getApiClient(): AxiosInstance {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      // Get token from localStorage or secure storage
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Response interceptor for data extraction and error handling
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // For successful requests, return just the data
      return response.data;
    },
    (error) => {
      // Add custom error handling here
      if (error.response?.status === 401) {
        // Handle unauthorized errors (e.g., redirect to login)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          // window.location.href = '/auth/login';
        }
      }
      
      return Promise.reject(error.response?.data || error.message);
    }
  );
  
  return client;
}

// Define interfaces for each API section
export interface AuthAPI {
  login: (credentials: { email: string; password: string }) => Promise<{
    token: string;
    user: User;
  }>;
  register: (data: {
    email: string;
    password: string;
    name: string;
  }) => Promise<{
    success: boolean;
    message: string;
  }>;
  getCurrentUser: () => Promise<User>;
  logout: () => Promise<void>;
}

export interface StorageAPI {
  getSignedUploadUrl: (params: SignedUrlParams) => Promise<SignedUrlResponse>;
  getFiles: (params: FileListParams) => Promise<FileMetadata[]>;
  deleteFile: (fileId: string) => Promise<FileOperationResponse>;
  attachFileToEntity: (fileId: string, entityType: string, entityId: string) => Promise<FileOperationResponse>;
  getDownloadUrl: (fileId: string, expiresInMinutes?: number) => Promise<DownloadUrlResponse>;
  getFileMetadata: (fileId: string) => Promise<FileMetadata>;
}

export interface AICreditsAPI {
  getCreditInfo: () => Promise<{ 
    credits: number;
    used: number;
    limit: number;
    resetDate: string;
  }>;
  getUsageHistory: (params: UsageHistoryParams) => Promise<UsageRecord[]>;
  getUsageByDay: (params: UsageByDayParams) => Promise<DailyUsage[]>;
  getUsageByModel: (params: UsageByModelParams) => Promise<ModelUsage[]>;
  purchaseCredits: (params: { amount: number; paymentMethodId?: string }) => Promise<{ 
    success: boolean;
    transactionId: string;
  }>;
}

export interface AdminAPI {
  getOrganizations: () => Promise<Organization[]>;
  getCreditAllotments: () => Promise<CreditAllotment[]>;
  updateCreditAllotment: (params: {
    organizationId: string;
    monthlyLimit: number;
  }) => Promise<{ success: boolean }>;
}

// Main API client with all sections
export const api = {
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      const client = getApiClient();
      return await client.post('/auth/login', credentials);
    },
    register: async (data: { email: string; password: string; name: string }) => {
      const client = getApiClient();
      return await client.post('/auth/register', data);
    },
    getCurrentUser: async () => {
      const client = getApiClient();
      return await client.get('/auth/me');
    },
    logout: async () => {
      const client = getApiClient();
      await client.post('/auth/logout');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    },
  },
  
  storage: {
    getSignedUploadUrl: async (params: SignedUrlParams) => {
      const client = getApiClient();
      return await client.post<SignedUrlResponse>('/files/signed-url', params);
    },
    getFiles: async (params: FileListParams) => {
      const client = getApiClient();
      return await client.get<FileMetadata[]>('/files', { params });
    },
    deleteFile: async (fileId: string) => {
      const client = getApiClient();
      return await client.delete<FileOperationResponse>(`/files/${fileId}`);
    },
    attachFileToEntity: async (fileId: string, entityType: string, entityId: string) => {
      const client = getApiClient();
      return await client.post<FileOperationResponse>(`/files/${fileId}/attach`, { entityType, entityId });
    },
    getDownloadUrl: async (fileId: string, expiresInMinutes?: number) => {
      const client = getApiClient();
      return await client.get<DownloadUrlResponse>(`/files/${fileId}/download-url`, {
        params: { expiresInMinutes },
      });
    },
    getFileMetadata: async (fileId: string) => {
      const client = getApiClient();
      return await client.get<FileMetadata>(`/files/${fileId}/metadata`);
    },
  },
  
  // AI Credits API
  aiCredits: {
    getCreditInfo: async () => {
      const client = getApiClient();
      return await client.get<{ credits: number; used: number; limit: number; resetDate: string }>('/ai-credits/info');
    },
    getUsageHistory: async (params: UsageHistoryParams) => {
      const client = getApiClient();
      return await client.get<UsageRecord[]>('/ai-credits/usage-history', { params });
    },
    getUsageByDay: async (params: UsageByDayParams) => {
      const client = getApiClient();
      return await client.get<DailyUsage[]>('/ai-credits/usage-by-day', { params });
    },
    getUsageByModel: async (params: UsageByModelParams) => {
      const client = getApiClient();
      return await client.get<ModelUsage[]>('/ai-credits/usage-by-model', { params });
    },
    purchaseCredits: async (params: { amount: number; paymentMethodId?: string }) => {
      const client = getApiClient();
      return await client.post<{ success: boolean; transactionId: string }>('/ai-credits/purchase', params);
    },
  },
  
  // Admin API
  admin: {
    getOrganizations: async () => {
      const client = getApiClient();
      return await client.get<Organization[]>('/admin/organizations');
    },
    getCreditAllotments: async () => {
      const client = getApiClient();
      return await client.get<CreditAllotment[]>('/admin/ai-credits/allotments');
    },
    updateCreditAllotment: async (params: { organizationId: string; monthlyLimit: number }) => {
      const client = getApiClient();
      return await client.put<{ success: boolean }>(`/admin/ai-credits/allotments/${params.organizationId}`, {
        monthlyLimit: params.monthlyLimit
      });
    },
  },
};