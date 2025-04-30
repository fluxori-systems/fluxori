import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PriceHistoryService } from './price-history.service';
import { PriceHistoryRepository } from '../repositories/price-history.repository';
import { PriceHistoryRecord, PriceVerificationStatus } from '../models/price-history.model';

describe('PriceHistoryService', () => {
  let service: PriceHistoryService;
  import { PriceHistoryRepository } from '../repositories/price-history.repository';
let repository: Partial<PriceHistoryRepository>;


  beforeEach(() => {
    repository = {
      create: vi.fn(),
      recordCompetitorPrice: vi.fn(),
      recordOurPrice: vi.fn(),
      findByProductId: vi.fn(),
      findByProductIds: vi.fn(),
      getAggregatedPriceHistory: vi.fn(),
      calculatePriceStatistics: vi.fn(),
    };
    service = new PriceHistoryService(repository as PriceHistoryRepository);
  });

  it('should create a price history record for a competitor', async () => {
    const competitorPrice = {
      productId: 'p1',
      organizationId: 'org1',
      competitorId: 'c1',
      competitorName: 'Competitor',
      marketplaceId: 'm1',
      marketplaceName: 'Marketplace',
      price: 100,
      shipping: 10,
      currency: 'USD',
      hasBuyBox: false,
      sourceType: 'MANUAL',
      verificationStatus: PriceVerificationStatus.VERIFIED,
      recordType: 'COMPETITOR_PRICE',
    };
    repository.recordCompetitorPrice.mockResolvedValue({ ...competitorPrice, id: 'rec1', createdAt: new Date() });
    const result = await service.recordCompetitorPrice(competitorPrice as any);
    expect(repository.recordCompetitorPrice).toHaveBeenCalledWith(competitorPrice);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('createdAt');
  });

  it('should create a price history record for our price', async () => {
    const ourPrice = {
      productId: 'p2',
      organizationId: 'org2',
      price: 200,
      shipping: 20,
      currency: 'USD',
      recordType: 'OUR_PRICE',
    };
    repository.recordOurPrice.mockResolvedValue({ ...ourPrice, id: 'rec2', createdAt: new Date() });
    const result = await service.recordOurPrice(
      ourPrice.productId,
      ourPrice.organizationId,
      ourPrice.price,
      ourPrice.shipping,
      ourPrice.currency,
      {}
    );
    expect(repository.recordOurPrice).toHaveBeenCalled();
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('createdAt');
  });

  it('should get price history for a product', async () => {
    const mockRecords: PriceHistoryRecord[] = [
      { id: '1', productId: 'p1', organizationId: 'org1', price: 100, shipping: 10, currency: 'USD', recordType: 'OUR_PRICE', createdAt: new Date() },
    ];
    repository.findByProductId.mockResolvedValue(mockRecords);
    const result = await service.getPriceHistory('p1', 'org1', { start: new Date(), end: new Date() });
    expect(repository.findByProductId).toHaveBeenCalled();
    expect(result).toEqual(mockRecords);
  });

  it('should aggregate price history', async () => {
    const aggResult = { ourPrices: [100, 110], competitorPrices: { c1: [120, 130] } };
    repository.getAggregatedPriceHistory.mockResolvedValue(aggResult);
    const result = await service.getAggregatedPriceHistory('p1', 'org1', { start: new Date(), end: new Date() });
    expect(result).toEqual(aggResult);
  });

  it('should calculate price statistics', async () => {
    const stats = { avgPrice: 100, minPrice: 90, maxPrice: 110, priceChange: 20, priceChangePercentage: 20, volatility: 5 };
    repository.calculatePriceStatistics.mockResolvedValue(stats);
    const result = await service.calculatePriceStatistics('p1', 'org1', { start: new Date(), end: new Date() });
    expect(result).toEqual(stats);
  });

  it('should handle missing required fields', async () => {
    await expect(service.recordCompetitorPrice({} as any)).rejects.toBeDefined();
  });
});
