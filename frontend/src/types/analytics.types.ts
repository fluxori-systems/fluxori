/**
 * Types for analytics and reporting features
 */

import { ProductStatus, ProductType } from './product/product.types';

/**
 * Time period for analytics data
 */
export enum AnalyticsTimePeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom',
}

/**
 * Analytics data granularity
 */
export enum AnalyticsGranularity {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

/**
 * Network quality enumeration
 */
export enum NetworkQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CRITICAL = 'critical',
  OFFLINE = 'offline',
}

/**
 * Data point for time series analytics
 */
export interface AnalyticsTimePoint {
  timestamp: Date;
  value: number;
}

/**
 * Usage history parameters
 */
export interface UsageHistoryParams {
  startDate: string;
  endDate: string;
  granularity: string;
  userId?: string;
  modelId?: string;
}

/**
 * Usage record
 */
export interface UsageRecord {
  timestamp: string;
  userId: string;
  modelId: string;
  tokensUsed: number;
  creditsUsed: number;
  requestDuration: number;
  requestType: string;
}

/**
 * Usage by day parameters
 */
export interface UsageByDayParams {
  startDate: string;
  endDate: string;
  userId?: string;
  modelId?: string;
}

/**
 * Daily usage
 */
export interface DailyUsage {
  date: string;
  tokensUsed: number;
  creditsUsed: number;
  requestCount: number;
}

/**
 * Usage by model parameters
 */
export interface UsageByModelParams {
  startDate: string;
  endDate: string;
  userId?: string;
}

/**
 * Model usage
 */
export interface ModelUsage {
  modelId: string;
  modelName: string;
  tokensUsed: number;
  creditsUsed: number;
  requestCount: number;
}

/**
 * Credit allotment
 */
export interface CreditAllotment {
  userId: string;
  organizationId: string;
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  refreshDate: string;
  plan: string;
}

/**
 * Credit info
 */
export interface CreditInfo {
  available: number;
  used: number;
  total: number;
  refreshDate: string;
  plan: string;
}

/**
 * Endpoint usage
 */
export interface EndpointUsage {
  endpoint: string;
  calls: number;
  tokensUsed: number;
  creditsUsed: number;
}

/**
 * Credit purchase response
 */
export interface CreditPurchaseResponse {
  success: boolean;
  transactionId?: string;
  creditsAdded?: number;
  newTotal?: number;
  error?: string;
}

/**
 * Catalog sizing report
 */
export interface CatalogSizeReport {
  totalProducts: number;
  productsByStatus: Record<ProductStatus, number>;
  productsByType: Record<ProductType, number>;
  totalCategories: number;
  totalAttributes: number;
  totalVariants: number;
  averageVariantsPerProduct: number;
  catalogSizeKB: number;
  largestCategories: Array<{
    id: string;
    name: string;
    productCount: number;
  }>;
  attributesUsageCount: Record<string, number>;
  dataLastUpdated: Date;
  totalMediaItems: number;
  totalMediaSizeKB: number;
}

/**
 * Product activity report
 */
export interface ProductActivityReport {
  period: AnalyticsTimePeriod;
  granularity: AnalyticsGranularity;
  startDate: Date;
  endDate: Date;
  productsCreated: AnalyticsTimePoint[];
  productsUpdated: AnalyticsTimePoint[];
  productsDeleted: AnalyticsTimePoint[];
  mostEditedProducts: Array<{
    id: string;
    name: string;
    sku: string;
    updateCount: number;
    lastUpdated: Date;
  }>;
  productFieldChangeFrequency: Record<string, number>;
  totalActivities: number;
}

/**
 * Catalog completeness report
 */
export interface CatalogCompletenessReport {
  overallCompleteness: number; // 0-100%
  statusBreakdown: Array<{
    status: ProductStatus;
    count: number;
    avgCompleteness: number;
  }>;
  attributeCompleteness: Array<{
    attributeId: string;
    attributeName: string;
    fillRate: number; // 0-100%
  }>;
  incompleteProducts: Array<{
    id: string;
    name: string;
    sku: string;
    completeness: number;
    missingAttributes: string[];
  }>;
  categoryCompleteness: Array<{
    categoryId: string;
    categoryName: string;
    avgCompleteness: number;
  }>;
  productsWithoutImages: number;
  productsWithoutCategories: number;
  productsWithoutPricing: number;
}

/**
 * Marketplace integration report
 */
export interface MarketplaceSyncReport {
  totalIntegrations: number;
  marketplaceBreakdown: Array<{
    marketplaceId: string;
    marketplaceName: string;
    syncedProducts: number;
    failedProducts: number;
    pendingProducts: number;
    notSyncedProducts: number;
    lastSyncDate?: Date;
  }>;
  productsWithNoIntegration: number;
  syncActivity: AnalyticsTimePoint[];
  syncErrorBreakdown: Record<string, number>;
  mostFailedProducts: Array<{
    id: string;
    name: string;
    sku: string;
    failureCount: number;
    lastError: string;
  }>;
}

/**
 * Stock and pricing performance report
 */
export interface InventoryPerformanceReport {
  period: AnalyticsTimePeriod;
  startDate: Date;
  endDate: Date;
  
  // Inventory metrics
  outOfStockProducts: number;
  lowStockProducts: number;
  overstockedProducts: number;
  stockTurnoverRate: number;
  stockValueZAR: number;
  
  // Pricing metrics
  averageProductPrice: number;
  priceDistribution: Array<{
    range: string; // e.g., "0-100", "100-500", etc.
    count: number;
  }>;
  productsWithoutPrices: number;
  productsWithSalePrices: number;
  
  // Time series data
  stockLevelTrend: AnalyticsTimePoint[];
  pricingTrend: AnalyticsTimePoint[];
}

/**
 * Network performance report for South African optimization
 */
export interface NetworkPerformanceReport {
  period: AnalyticsTimePeriod;
  startDate: Date;
  endDate: Date;
  
  // Load shedding metrics
  loadSheddingIncidents: number;
  loadSheddingDurationHours: number;
  loadSheddingStageDistribution: Record<number, number>; // key is stage, value is hours
  
  // Network quality metrics
  networkQualityDistribution: Record<string, number>; // key is quality level, value is percentage
  requestSuccessRate: number;
  averageResponseTimeMs: number;
  bandwidthUsageMB: number;
  
  // Operational resilience
  operationsCompletedDuringLoadShedding: number;
  operationsDeferredDuringLoadShedding: number;
  failedOperationsDuringLoadShedding: number;
  
  // Time series data
  networkQualityTrend: AnalyticsTimePoint[];
  loadSheddingTrend: AnalyticsTimePoint[];
}

/**
 * AI feature usage report
 */
export interface AIFeatureUsageReport {
  period: AnalyticsTimePeriod;
  startDate: Date;
  endDate: Date;
  
  // Feature usage counts
  totalAIFeaturesUsed: number;
  featureUsageBreakdown: Record<string, number>;
  
  // Performance metrics
  averageProcessingTimeMs: Record<string, number>;
  successRateByFeature: Record<string, number>;
  
  // Credit usage
  totalCreditsUsed: number;
  creditsUsedByFeature: Record<string, number>;
  
  // Time series data
  dailyUsageTrend: AnalyticsTimePoint[];
  creditUsageTrend: AnalyticsTimePoint[];
}

/**
 * South African-specific analytics metrics
 */
export interface SouthAfricanMarketReport {
  // VAT-specific metrics
  vatCompliantProducts: number;
  vatNonCompliantProducts: number;
  totalVatCollectedZAR: number;
  
  // Regulatory compliance
  icasaCompliantProducts: number;
  sabsCompliantProducts: number;
  nrcsCompliantProducts: number;
  
  // Regional performance
  performanceByProvince: Record<string, number>;
  
  // Load shedding impact
  loadSheddingImpactScore: number; // 0-100
  operationsPreventedByLoadShedding: number;
  estimatedRevenueImpactZAR: number;
}

/**
 * Analytics dashboard configuration
 */
export interface AnalyticsDashboardConfig {
  organizationId: string;
  enabledReports: string[];
  defaultPeriod: AnalyticsTimePeriod;
  defaultGranularity: AnalyticsGranularity;
  refreshIntervalMinutes: number;
  emailReportSchedule?: string; // cron expression
  emailRecipients?: string[];
  customReportDefinitions?: Record<string, any>;
}