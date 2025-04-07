/**
 * Analytics API Types
 * 
 * Types related to analytics and credit usage
 */

/**
 * Credit information for a user or organization
 */
export interface CreditInfo {
  credits: number;
  used: number;
  limit: number;
  resetDate: string;
}

/**
 * Parameters for querying usage history
 */
export interface UsageHistoryParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Individual usage record
 */
export interface UsageRecord {
  id: string;
  timestamp: string;
  model: string;
  endpoint: string;
  tokensInput: number;
  tokensOutput: number;
  credits: number;
  userId: string;
  requestId?: string;
}

/**
 * Parameters for querying usage by day
 */
export interface UsageByDayParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Usage stats aggregated by day
 */
export interface DailyUsage {
  date: string;
  totalCredits: number;
  totalRequests: number;
}

/**
 * Parameters for querying usage by model
 */
export interface UsageByModelParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Usage stats aggregated by model
 */
export interface ModelUsage {
  model: string;
  totalCredits: number;
  totalRequests: number;
  percentageOfTotal: number;
}

/**
 * Usage stats aggregated by endpoint
 */
export interface EndpointUsage {
  endpoint: string;
  totalCredits: number;
  totalRequests: number;
  percentageOfTotal: number;
}

/**
 * Response for credit purchase operations
 */
export interface CreditPurchaseResponse {
  success: boolean;
  transactionId: string;
  credits: number;
  amount: number;
  timestamp: string;
}

/**
 * Credit allotment for an organization
 */
export interface CreditAllotment {
  id: string;
  organizationId: string;
  organizationName: string;
  monthlyLimit: number;
  currentUsage?: number;
  resetDate: string;
  createdAt: string;
  updatedAt: string;
}