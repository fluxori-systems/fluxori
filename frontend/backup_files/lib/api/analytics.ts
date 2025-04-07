import { apiClient } from './client';
import {
  UsageHistoryParams,
  UsageByDayParams,
  UsageByModelParams,
  UsageByEndpointParams,
  UsageRecord,
  DailyUsage,
  ModelUsage,
  EndpointUsage,
  CreditInfo,
  CreditPurchaseRequest,
  CreditPurchaseResponse,
  CreditAllotment,
} from './types/analytics';

/**
 * Analytics API endpoints
 */
export const analyticsApi = {
  /**
   * Get credit information for the current user
   */
  getCreditInfo: async (): Promise<CreditInfo> => {
    return await apiClient.get<CreditInfo>('/ai-credits/info');
  },
  
  /**
   * Get usage history with optional filtering
   */
  getUsageHistory: async (params?: UsageHistoryParams): Promise<UsageRecord[]> => {
    return await apiClient.get<UsageRecord[]>('/ai-credits/usage-history', { params });
  },
  
  /**
   * Get usage aggregated by day
   */
  getUsageByDay: async (params?: UsageByDayParams): Promise<DailyUsage[]> => {
    return await apiClient.get<DailyUsage[]>('/ai-credits/usage-by-day', { params });
  },
  
  /**
   * Get usage aggregated by model
   */
  getUsageByModel: async (params?: UsageByModelParams): Promise<ModelUsage[]> => {
    return await apiClient.get<ModelUsage[]>('/ai-credits/usage-by-model', { params });
  },
  
  /**
   * Get usage aggregated by endpoint
   */
  getUsageByEndpoint: async (params?: UsageByEndpointParams): Promise<EndpointUsage[]> => {
    return await apiClient.get<EndpointUsage[]>('/ai-credits/usage-by-endpoint', { params });
  },
  
  /**
   * Purchase credits
   */
  purchaseCredits: async (request: CreditPurchaseRequest): Promise<CreditPurchaseResponse> => {
    return await apiClient.post<CreditPurchaseResponse>('/ai-credits/purchase', request);
  },
};

/**
 * Admin analytics API endpoints
 */
export const adminAnalyticsApi = {
  /**
   * Get organizations (admin only)
   */
  getOrganizations: async (): Promise<any[]> => {
    return await apiClient.get<any[]>('/admin/organizations');
  },
  
  /**
   * Get credit allotments for all organizations (admin only)
   */
  getCreditAllotments: async (): Promise<CreditAllotment[]> => {
    return await apiClient.get<CreditAllotment[]>('/admin/ai-credits/allotments');
  },
  
  /**
   * Update credit allotment for an organization (admin only)
   */
  updateCreditAllotment: async (params: {
    organizationId: string;
    monthlyLimit: number;
  }): Promise<{ success: boolean }> => {
    const { organizationId, monthlyLimit } = params;
    return await apiClient.put<{ success: boolean }>(
      `/admin/ai-credits/allotments/${organizationId}`,
      { monthlyLimit }
    );
  },
};