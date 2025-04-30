import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfferController } from './offer.controller';
import { OfferService, CreateOfferDto, UpdateOfferDto, Offer } from '../services/offer.service';

// Create a mock OfferService
class MockOfferService {
  createOffer = vi.fn();
  getOfferById = vi.fn();
  updateOffer = vi.fn();
  deleteOffer = vi.fn();
  listOffersByProduct = vi.fn();
}

describe('OfferController', () => {
  let controller: OfferController;
  let service: MockOfferService;

  beforeEach(() => {
    service = new MockOfferService();
    controller = new OfferController(service as unknown as OfferService);
  });

  it('should create an offer', () => {
    const dto: CreateOfferDto = {
      productId: 'p1',
      marketplaceId: 'm1',
      price: 100,
      currency: 'USD',
      validFrom: new Date(),
      validTo: new Date(),
    };
    const offer: Offer = { ...dto, id: 'id1', marketplaceId: 'm1', isActive: true, createdAt: new Date(), updatedAt: new Date() };
    service.createOffer.mockReturnValue(offer);
    const result = controller.create(dto);
    expect(result).toBe(offer);
    expect(service.createOffer).toHaveBeenCalledWith(dto);
  });

  it('should get offer by id', () => {
    const offer: Offer = {
      id: 'id1',
      productId: 'p1',
      marketplaceId: 'm1',
      price: 100,
      currency: 'USD',
      validFrom: new Date(),
      validTo: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    service.getOfferById.mockReturnValue(offer);
    const result = controller.getById('id1');
    expect(result).toBe(offer);
    expect(service.getOfferById).toHaveBeenCalledWith('id1');
  });

  it('should update an offer', () => {
    const update: UpdateOfferDto = { price: 200 };
    const offer: Offer = {
      id: 'id1',
      productId: 'p1',
      marketplaceId: 'm1',
      price: 200,
      currency: 'USD',
      validFrom: new Date(),
      validTo: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    service.updateOffer.mockReturnValue(offer);
    const result = controller.update('id1', update);
    expect(result).toBe(offer);
    expect(service.updateOffer).toHaveBeenCalledWith('id1', update);
  });

  it('should delete an offer', () => {
    service.deleteOffer.mockReturnValue(undefined);
    const result = controller.delete('id1');
    expect(result).toBeUndefined();
    expect(service.deleteOffer).toHaveBeenCalledWith('id1');
  });

  it('should list offers by product', () => {
    const offers: Offer[] = [
      {
        id: 'id1',
        productId: 'p1',
        marketplaceId: 'm1',
        price: 100,
        currency: 'USD',
        validFrom: new Date(),
        validTo: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    service.listOffersByProduct.mockReturnValue(offers);
    const result = controller.listByProduct('p1');
    expect(result).toBe(offers);
    expect(service.listOffersByProduct).toHaveBeenCalledWith('p1');
  });
});
