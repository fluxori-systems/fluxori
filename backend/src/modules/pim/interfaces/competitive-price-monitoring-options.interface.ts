// Option interfaces for CompetitivePriceMonitoringService

import { PriceSourceType } from '../models/competitor-price.model';

export interface RecordOurPriceOptions {
  variantId?: string;
  marketplaceId?: string;
  marketplaceName?: string;
  hasBuyBox?: boolean;
  sourceType?: PriceSourceType;
}

export interface GetCompetitorPricesOptions {
  marketplaceId?: string;
  includeOutOfStock?: boolean;
  limit?: number;
  offset?: number;
}

export interface GetPriceHistoryOptions {
  marketplaceId?: string;
  includeCompetitors?: boolean;
}

export interface GetPriceAlertsOptions {
  includeResolved?: boolean;
  alertType?: string;
  limit?: number;
  offset?: number;
}

export interface GeneratePriceReportOptions {
  marketplaceId?: string;
  includeHistory?: boolean;
  daysOfHistory?: number;
  includeRecommendations?: boolean;
}

export interface RunBatchMonitoringOptions {
  limit?: number;
  autoAdjustPrices?: boolean;
}
