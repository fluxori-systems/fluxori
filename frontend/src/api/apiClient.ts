'use client';

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Import types
import { 
  SignedUrlParams, 
  SignedUrlResponse, 
  FileListParams, 
  FileMetadata, 
  FileOperationResponse, 
  DownloadUrlResponse,
  DownloadUrlParams,
  AttachFileParams
} from '../types/storage.types';

import { 
  UsageHistoryParams, 
  UsageRecord, 
  UsageByDayParams, 
  DailyUsage, 
  UsageByModelParams, 
  ModelUsage, 
  CreditAllotment,
  CreditInfo,
  EndpointUsage,
  CreditPurchaseResponse
} from '../types/analytics.types';

import { 
  Organization, 
  User, 
  LoginCredentials,
  LoginResponse,
  RegisterData,
  RegisterResponse,
  ApiError
} from '../types/api.types';

/**
 * Creates and returns a properly typed API client instance
 */
export function getApiClient(): AxiosInstance {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Get token from localStorage or secure storage
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );
  
  return client;
}

// Define interfaces for each API section
export interface AuthAPI {
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  register: (data: RegisterData) => Promise<RegisterResponse>;
  getCurrentUser: () => Promise<User>;
  logout: () => Promise<void>;
}

export interface StorageAPI {
  getSignedUploadUrl: (params: SignedUrlParams) => Promise<SignedUrlResponse>;
  getFiles: (params?: FileListParams) => Promise<FileMetadata[]>;
  deleteFile: (fileId: string) => Promise<FileOperationResponse>;
  attachFileToEntity: (params: AttachFileParams) => Promise<FileOperationResponse>;
  getDownloadUrl: (params: DownloadUrlParams) => Promise<DownloadUrlResponse>;
  getFileMetadata: (fileId: string) => Promise<FileMetadata>;
}

export interface AICreditsAPI {
  getCreditInfo: () => Promise<CreditInfo>;
  getUsageHistory: (params?: UsageHistoryParams) => Promise<UsageRecord[]>;
  getUsageByDay: (params?: UsageByDayParams) => Promise<DailyUsage[]>;
  getUsageByModel: (params?: UsageByModelParams) => Promise<ModelUsage[]>;
  getUsageByEndpoint: (params?: UsageByModelParams) => Promise<EndpointUsage[]>;
  purchaseCredits: (params: { amount: number; paymentMethodId?: string }) => Promise<CreditPurchaseResponse>;
}

export interface AdminAPI {
  getOrganizations: () => Promise<Organization[]>;
  getCreditAllotments: () => Promise<CreditAllotment[]>;
  updateCreditAllotment: (params: {
    organizationId: string;
    monthlyLimit: number;
  }) => Promise<{ success: boolean }>;
}

// Export the direct axios instance for simpler API calls
export const apiClient = getApiClient();

// Main API client with all sections
export const api = {
  auth: {
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
      const client = getApiClient();
      const response = await client.post<LoginResponse>('/auth/login', credentials);
      
      // Store token in localStorage if successful
      if (response.data?.token && typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      return response.data;
    },
    
    register: async (data: RegisterData): Promise<RegisterResponse> => {
      const client = getApiClient();
      const response = await client.post<RegisterResponse>('/auth/register', data);
      return response.data;
    },
    
    getCurrentUser: async (): Promise<User> => {
      const client = getApiClient();
      const response = await client.get<User>('/auth/me');
      return response.data;
    },
    
    logout: async (): Promise<void> => {
      const client = getApiClient();
      await client.post('/auth/logout');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    },
  },
  
  storage: {
    getSignedUploadUrl: async (params: SignedUrlParams): Promise<SignedUrlResponse> => {
      const client = getApiClient();
      const response = await client.post<SignedUrlResponse>('/files/signed-url', params);
      return response.data;
    },
    
    getFiles: async (params?: FileListParams): Promise<FileMetadata[]> => {
      const client = getApiClient();
      const response = await client.get<FileMetadata[]>('/files', { params });
      return response.data;
    },
    
    deleteFile: async (fileId: string): Promise<FileOperationResponse> => {
      const client = getApiClient();
      const response = await client.delete<FileOperationResponse>(`/files/${fileId}`);
      return response.data;
    },
    
    attachFileToEntity: async (params: AttachFileParams): Promise<FileOperationResponse> => {
      const client = getApiClient();
      const { fileId, entityType, entityId } = params;
      const response = await client.post<FileOperationResponse>(`/files/${fileId}/attach`, { 
        entityType, 
        entityId 
      });
      return response.data;
    },
    
    getDownloadUrl: async (params: DownloadUrlParams): Promise<DownloadUrlResponse> => {
      const client = getApiClient();
      const { fileId, expiresInMinutes } = params;
      const response = await client.get<DownloadUrlResponse>(`/files/${fileId}/download-url`, {
        params: { expiresInMinutes },
      });
      return response.data;
    },
    
    getFileMetadata: async (fileId: string): Promise<FileMetadata> => {
      const client = getApiClient();
      const response = await client.get<FileMetadata>(`/files/${fileId}/metadata`);
      return response.data;
    },
  },
  
  // AI Credits API
  aiCredits: {
    getCreditInfo: async (): Promise<CreditInfo> => {
      const client = getApiClient();
      const response = await client.get<CreditInfo>('/ai-credits/info');
      return response.data;
    },
    
    getUsageHistory: async (params: UsageHistoryParams = {}): Promise<UsageRecord[]> => {
      const client = getApiClient();
      const response = await client.get<UsageRecord[]>('/ai-credits/usage-history', { params });
      return response.data;
    },
    
    getUsageByDay: async (params: UsageByDayParams = {}): Promise<DailyUsage[]> => {
      const client = getApiClient();
      const response = await client.get<DailyUsage[]>('/ai-credits/usage-by-day', { params });
      return response.data;
    },
    
    getUsageByModel: async (params: UsageByModelParams = {}): Promise<ModelUsage[]> => {
      const client = getApiClient();
      const response = await client.get<ModelUsage[]>('/ai-credits/usage-by-model', { params });
      return response.data;
    },
    
    getUsageByEndpoint: async (params: UsageByModelParams = {}): Promise<EndpointUsage[]> => {
      const client = getApiClient();
      const response = await client.get<EndpointUsage[]>('/ai-credits/usage-by-endpoint', { params });
      return response.data;
    },
    
    purchaseCredits: async (params: { amount: number; paymentMethodId?: string }): Promise<CreditPurchaseResponse> => {
      const client = getApiClient();
      const response = await client.post<CreditPurchaseResponse>('/ai-credits/purchase', params);
      return response.data;
    },
  },
  
  // Admin API
  admin: {
    getOrganizations: async (): Promise<Organization[]> => {
      const client = getApiClient();
      const response = await client.get<Organization[]>('/admin/organizations');
      return response.data;
    },
    
    getCreditAllotments: async (): Promise<CreditAllotment[]> => {
      const client = getApiClient();
      const response = await client.get<CreditAllotment[]>('/admin/ai-credits/allotments');
      return response.data;
    },
    
    updateCreditAllotment: async (params: { organizationId: string; monthlyLimit: number }): Promise<{ success: boolean }> => {
      const client = getApiClient();
      const response = await client.put<{ success: boolean }>(`/admin/ai-credits/allotments/${params.organizationId}`, {
        monthlyLimit: params.monthlyLimit
      });
      return response.data;
    },
  },
};