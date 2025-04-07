/**
 * Types related to analytics data
 */

/**
 * Parameters for usage history queries
 */
export interface UsageHistoryParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Parameters for daily usage queries
 */
export interface UsageByDayParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Parameters for model usage queries
 */
export interface UsageByModelParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Parameters for endpoint usage queries
 */
export interface UsageByEndpointParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Single usage record
 */
export interface UsageRecord {
  timestamp: string;
  endpoint: string;
  model: string;
  tokensUsed: number;
  cost: number;
  userId?: string;
  organizationId?: string;
}

/**
 * Aggregated daily usage
 */
export interface DailyUsage {
  date: string;
  tokensUsed: number;
  cost: number;
  requestCount?: number;
}

/**
 * Usage data aggregated by model
 */
export interface ModelUsage {
  model: string;
  tokensUsed: number;
  cost: number;
  percentage: number;
  requestCount?: number;
}

/**
 * Usage data aggregated by endpoint
 */
export interface EndpointUsage {
  endpoint: string;
  tokensUsed: number;
  cost: number;
  percentage: number;
  requestCount?: number;
}

/**
 * Credit allotment for an organization
 */
export interface CreditAllotment {
  organizationId: string;
  monthlyLimit: number;
  usedCredits: number;
  remainingCredits: number;
  resetDate: string;
}

/**
 * Credit purchase request
 */
export interface CreditPurchaseRequest {
  amount: number;
  paymentMethodId?: string;
}

/**
 * Credit purchase response
 */
export interface CreditPurchaseResponse {
  success: boolean;
  transactionId: string;
  credits: number;
  amount: number;
  timestamp: string;
}

/**
 * Credit information
 */
export interface CreditInfo {
  credits: number;
  used: number;
  limit: number;
  resetDate: string;
}