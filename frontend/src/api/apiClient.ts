'use client';

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Import types

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
import {
  Product,
  ProductCategory,
  ProductBrand,
  CreateProductDto,
  UpdateProductDto,
  ProductVariant,
  ProductType,
  ProductStatus
} from '../types/product/product.types';
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

export interface ProductAPI {
  // Product operations
  getProducts: (params?: { limit?: number; offset?: number; categoryId?: string; search?: string; status?: ProductStatus }) => Promise<{ products: Product[]; total: number }>;
  getProduct: (id: string) => Promise<Product>;
  createProduct: (data: CreateProductDto) => Promise<Product>;
  updateProduct: (id: string, data: UpdateProductDto) => Promise<Product>;
  deleteProduct: (id: string) => Promise<{ success: boolean }>;
  
  // Category operations
  getCategories: (params?: { parentId?: string; includeSubcategories?: boolean }) => Promise<ProductCategory[]>;
  getCategoryTree: () => Promise<ProductCategory[]>;
  getCategory: (id: string) => Promise<ProductCategory>;
  createCategory: (data: Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt' | 'level' | 'path' | 'productCount'>) => Promise<ProductCategory>;
  updateCategory: (id: string, data: Partial<Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt' | 'level' | 'path' | 'productCount'>>) => Promise<ProductCategory>;
  deleteCategory: (id: string) => Promise<{ success: boolean }>;
  
  // Variant operations
  getProductVariants: (productId: string) => Promise<ProductVariant[]>;
  createProductVariant: (productId: string, variant: Omit<ProductVariant, 'id'>) => Promise<ProductVariant>;
  updateProductVariant: (productId: string, variantId: string, data: Partial<Omit<ProductVariant, 'id'>>) => Promise<ProductVariant>;
  deleteProductVariant: (productId: string, variantId: string) => Promise<{ success: boolean }>;
  
  // Brand operations
  getBrands: () => Promise<ProductBrand[]>;
  getBrand: (id: string) => Promise<ProductBrand>;
  createBrand: (data: Omit<ProductBrand, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>) => Promise<ProductBrand>;
  updateBrand: (id: string, data: Partial<Omit<ProductBrand, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>>) => Promise<ProductBrand>;
  deleteBrand: (id: string) => Promise<{ success: boolean }>;
  
  // Import/Export operations
  exportProducts: (format: 'csv' | 'xlsx' | 'json', filters?: Record<string, any>) => Promise<Blob>;
  importProducts: (file: File, options?: { updateExisting?: boolean; skipErrors?: boolean }) => Promise<{ 
    success: boolean; 
    created: number; 
    updated: number; 
    errors: { row: number; message: string }[] 
  }>;
  
  // Marketplace operations
  validateProductForMarketplace: (productId: string, marketplaceId: string) => Promise<{ 
    valid: boolean; 
    issues: { field: string; message: string; severity: 'error' | 'warning' }[] 
  }>;
  syncProductToMarketplace: (productId: string, marketplaceId: string) => Promise<{ 
    success: boolean; 
    marketplaceId: string; 
    externalId?: string; 
    issues?: { field: string; message: string }[] 
  }>;
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
    
    getUsageHistory: async (params: UsageHistoryParams): Promise<UsageRecord[]> => {
      const client = getApiClient();
      const response = await client.get<UsageRecord[]>('/ai-credits/usage-history', { params });
      return response.data;
    },
    
    getUsageByDay: async (params: UsageByDayParams): Promise<DailyUsage[]> => {
      const client = getApiClient();
      const response = await client.get<DailyUsage[]>('/ai-credits/usage-by-day', { params });
      return response.data;
    },
    
    getUsageByModel: async (params: UsageByModelParams): Promise<ModelUsage[]> => {
      const client = getApiClient();
      const response = await client.get<ModelUsage[]>('/ai-credits/usage-by-model', { params });
      return response.data;
    },
    
    getUsageByEndpoint: async (params: UsageByModelParams): Promise<EndpointUsage[]> => {
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

  // PIM API - Product Information Management
  pim: {
    // Product operations
    getProducts: async (params?: { limit?: number; offset?: number; categoryId?: string; search?: string; status?: ProductStatus }): Promise<{ products: Product[]; total: number }> => {
      const client = getApiClient();
      const response = await client.get<{ products: Product[]; total: number }>('/pim/products', { params });
      return response.data;
    },
    
    getProduct: async (id: string): Promise<Product> => {
      const client = getApiClient();
      const response = await client.get<Product>(`/pim/products/${id}`);
      return response.data;
    },
    
    createProduct: async (data: CreateProductDto): Promise<Product> => {
      const client = getApiClient();
      const response = await client.post<Product>('/pim/products', data);
      return response.data;
    },
    
    updateProduct: async (id: string, data: UpdateProductDto): Promise<Product> => {
      const client = getApiClient();
      const response = await client.put<Product>(`/pim/products/${id}`, data);
      return response.data;
    },
    
    deleteProduct: async (id: string): Promise<{ success: boolean }> => {
      const client = getApiClient();
      const response = await client.delete<{ success: boolean }>(`/pim/products/${id}`);
      return response.data;
    },
    
    // Category operations
    getCategories: async (params?: { parentId?: string; includeSubcategories?: boolean }): Promise<ProductCategory[]> => {
      const client = getApiClient();
      const response = await client.get<ProductCategory[]>('/pim/categories', { params });
      return response.data;
    },
    
    getCategoryTree: async (): Promise<ProductCategory[]> => {
      const client = getApiClient();
      const response = await client.get<ProductCategory[]>('/pim/categories/tree');
      return response.data;
    },
    
    getCategory: async (id: string): Promise<ProductCategory> => {
      const client = getApiClient();
      const response = await client.get<ProductCategory>(`/pim/categories/${id}`);
      return response.data;
    },
    
    createCategory: async (data: Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt' | 'level' | 'path' | 'productCount'>): Promise<ProductCategory> => {
      const client = getApiClient();
      const response = await client.post<ProductCategory>('/pim/categories', data);
      return response.data;
    },
    
    updateCategory: async (id: string, data: Partial<Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt' | 'level' | 'path' | 'productCount'>>): Promise<ProductCategory> => {
      const client = getApiClient();
      const response = await client.put<ProductCategory>(`/pim/categories/${id}`, data);
      return response.data;
    },
    
    deleteCategory: async (id: string): Promise<{ success: boolean }> => {
      const client = getApiClient();
      const response = await client.delete<{ success: boolean }>(`/pim/categories/${id}`);
      return response.data;
    },
    
    // Variant operations
    getProductVariants: async (productId: string): Promise<ProductVariant[]> => {
      const client = getApiClient();
      const response = await client.get<ProductVariant[]>(`/pim/products/${productId}/variants`);
      return response.data;
    },
    
    createProductVariant: async (productId: string, variant: Omit<ProductVariant, 'id'>): Promise<ProductVariant> => {
      const client = getApiClient();
      const response = await client.post<ProductVariant>(`/pim/products/${productId}/variants`, variant);
      return response.data;
    },
    
    updateProductVariant: async (productId: string, variantId: string, data: Partial<Omit<ProductVariant, 'id'>>): Promise<ProductVariant> => {
      const client = getApiClient();
      const response = await client.put<ProductVariant>(`/pim/products/${productId}/variants/${variantId}`, data);
      return response.data;
    },
    
    deleteProductVariant: async (productId: string, variantId: string): Promise<{ success: boolean }> => {
      const client = getApiClient();
      const response = await client.delete<{ success: boolean }>(`/pim/products/${productId}/variants/${variantId}`);
      return response.data;
    },
    
    // Brand operations
    getBrands: async (): Promise<ProductBrand[]> => {
      const client = getApiClient();
      const response = await client.get<ProductBrand[]>('/pim/brands');
      return response.data;
    },
    
    getBrand: async (id: string): Promise<ProductBrand> => {
      const client = getApiClient();
      const response = await client.get<ProductBrand>(`/pim/brands/${id}`);
      return response.data;
    },
    
    createBrand: async (data: Omit<ProductBrand, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>): Promise<ProductBrand> => {
      const client = getApiClient();
      const response = await client.post<ProductBrand>('/pim/brands', data);
      return response.data;
    },
    
    updateBrand: async (id: string, data: Partial<Omit<ProductBrand, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>>): Promise<ProductBrand> => {
      const client = getApiClient();
      const response = await client.put<ProductBrand>(`/pim/brands/${id}`, data);
      return response.data;
    },
    
    deleteBrand: async (id: string): Promise<{ success: boolean }> => {
      const client = getApiClient();
      const response = await client.delete<{ success: boolean }>(`/pim/brands/${id}`);
      return response.data;
    },
    
    // Import/Export operations
    exportProducts: async (format: 'csv' | 'xlsx' | 'json', filters?: Record<string, any>): Promise<Blob> => {
      const client = getApiClient();
      const response = await client.get<Blob>(`/pim/export?format=${format}`, { 
        params: filters,
        responseType: 'blob'
      });
      return response.data;
    },
    
    importProducts: async (file: File, options?: { updateExisting?: boolean; skipErrors?: boolean }): Promise<{ 
      success: boolean; 
      created: number; 
      updated: number; 
      errors: { row: number; message: string }[] 
    }> => {
      const client = getApiClient();
      const formData = new FormData();
      formData.append('file', file);
      
      if (options) {
        if (options.updateExisting !== undefined) {
          formData.append('updateExisting', options.updateExisting.toString());
        }
        if (options.skipErrors !== undefined) {
          formData.append('skipErrors', options.skipErrors.toString());
        }
      }
      
      const response = await client.post<{ 
        success: boolean; 
        created: number; 
        updated: number; 
        errors: { row: number; message: string }[] 
      }>('/pim/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    },
    
    // Marketplace operations
    validateProductForMarketplace: async (productId: string, marketplaceId: string): Promise<{ 
      valid: boolean; 
      issues: { field: string; message: string; severity: 'error' | 'warning' }[] 
    }> => {
      const client = getApiClient();
      const response = await client.get<{ 
        valid: boolean; 
        issues: { field: string; message: string; severity: 'error' | 'warning' }[] 
      }>(`/pim/products/${productId}/validate-for-marketplace/${marketplaceId}`);
      return response.data;
    },
    
    syncProductToMarketplace: async (productId: string, marketplaceId: string): Promise<{ 
      success: boolean; 
      marketplaceId: string; 
      externalId?: string; 
      issues?: { field: string; message: string }[] 
    }> => {
      const client = getApiClient();
      const response = await client.post<{ 
        success: boolean; 
        marketplaceId: string; 
        externalId?: string; 
        issues?: { field: string; message: string }[] 
      }>(`/pim/products/${productId}/sync-to-marketplace/${marketplaceId}`);
      return response.data;
    },
  }
};