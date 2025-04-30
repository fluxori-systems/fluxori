import { Controller, Get, Post, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { PriceHistoryService } from '../services/price-history.service';
import { PriceHistoryRecord } from '../models/price-history.model';
import { DateRange } from '../models/date-range.model';

@Controller('price-history')
export class PriceHistoryController {
  constructor(private readonly priceHistoryService: PriceHistoryService) {}

  @Post()
  async create(
    @Body() data: Omit<
      PriceHistoryRecord,
      'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version' | 'deletedAt'
    >
  ): Promise<PriceHistoryRecord> {
    return this.priceHistoryService.createPriceHistory(data);
  }

  @Get(':productId')
  async getPriceHistory(
    @Param('productId') productId: string,
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('marketplaceId') marketplaceId?: string,
    @Query('recordType') recordType?: 'OUR_PRICE' | 'COMPETITOR_PRICE',
    @Query('limit') limit?: number,
  ): Promise<PriceHistoryRecord[]> {
    const dateRange: DateRange = { start: new Date(startDate), end: new Date(endDate) };
    return this.priceHistoryService.getPriceHistory(productId, organizationId, dateRange, { marketplaceId, recordType, limit });
  }

  @Get('aggregated/:productId')
  async getAggregated(
    @Param('productId') productId: string,
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('marketplaceId') marketplaceId?: string,
    @Query('includeCompetitors') includeCompetitors?: boolean,
  ): Promise<{ dates: string[]; ourPrices: number[]; competitorPrices: Record<string, number[]>; }> {
    const dateRange: DateRange = { start: new Date(startDate), end: new Date(endDate) };
    return this.priceHistoryService.getAggregatedPriceHistory(productId, organizationId, dateRange, { marketplaceId, includeCompetitors });
  }

  @Get('stats/:productId')
  async getStats(
    @Param('productId') productId: string,
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('competitorId') competitorId?: string,
    @Query('marketplaceId') marketplaceId?: string,
    @Query('recordType') recordType?: 'OUR_PRICE' | 'COMPETITOR_PRICE',
  ): Promise<{ avgPrice: number; minPrice: number; maxPrice: number; priceChange: number; priceChangePercentage: number; volatility: number; }> {
    const dateRange: DateRange = { start: new Date(startDate), end: new Date(endDate) };
    return this.priceHistoryService.calculatePriceStatistics(productId, organizationId, dateRange, { competitorId, marketplaceId, recordType });
  }
}
