import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfferService } from './offer.service';
import { OfferRepository } from '../repositories/offer.repository';
import { CreateOfferDto, UpdateOfferDto, Offer } from './offer.service';

// Create a mock OfferRepository
class MockOfferRepository {
  offers: Offer[] = [];
  create = vi.fn((dto: CreateOfferDto) => {
    const offer: Offer = {
      id: 'test_id',
      ...dto,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.offers.push(offer);
    return offer;
  });
  findById = vi.fn((id: string) => {
    return this.offers.find(o => o.id === id);
  });
  update = vi.fn((id: string, dto: UpdateOfferDto) => {
    const offer = this.offers.find(o => o.id === id);
    if (!offer) throw new Error('Not found');
    Object.assign(offer, dto, { updatedAt: new Date() });
    return offer;
  });
  delete = vi.fn((id: string) => {
    const idx = this.offers.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Not found');
    this.offers.splice(idx, 1);
  });
  findByProduct = vi.fn((productId: string) => {
    return this.offers.filter(o => o.productId === productId);
  });
}

describe('OfferService', () => {
  let service: OfferService;
  let repository: MockOfferRepository;

  beforeEach(() => {
    repository = new MockOfferRepository();
    service = new OfferService(repository as unknown as OfferRepository);
  });

  it('should create an offer', () => {
    const dto: CreateOfferDto = {
      productId: 'p1',
      title: 'Special',
      price: 100,
      currency: 'USD',
      validFrom: new Date(),
      validTo: new Date(),
    };
    const offer = service.createOffer(dto);
    expect(offer).toMatchObject({ productId: 'p1', title: 'Special', price: 100 });
    expect(repository.create).toHaveBeenCalledWith(dto);
  });

  it('should get offer by id', () => {
    const dto: CreateOfferDto = {
      productId: 'p1',
      title: 'Special',
      price: 100,
      currency: 'USD',
      validFrom: new Date(),
      validTo: new Date(),
    };
    const created = service.createOffer(dto);
    const found = service.getOfferById(created.id);
    expect(found).toBe(created);
    expect(repository.findById).toHaveBeenCalledWith(created.id);
  });

  it('should update an offer', () => {
    const dto: CreateOfferDto = {
      productId: 'p1',
      title: 'Special',
      price: 100,
      currency: 'USD',
      validFrom: new Date(),
      validTo: new Date(),
    };
    const created = service.createOffer(dto);
    const update: UpdateOfferDto = { price: 200 };
    const updated = service.updateOffer(created.id, update);
    expect(updated.price).toBe(200);
    expect(repository.update).toHaveBeenCalledWith(created.id, update);
  });

  it('should delete an offer', () => {
    const dto: CreateOfferDto = {
      productId: 'p1',
      title: 'Special',
      price: 100,
      currency: 'USD',
      validFrom: new Date(),
      validTo: new Date(),
    };
    const created = service.createOffer(dto);
    service.deleteOffer(created.id);
    expect(repository.delete).toHaveBeenCalledWith(created.id);
    expect(repository.offers.length).toBe(0);
  });

  it('should list offers by product', () => {
    const dto1: CreateOfferDto = {
      productId: 'p1',
      title: 'One',
      price: 100,
      currency: 'USD',
      validFrom: new Date(),
      validTo: new Date(),
    };
    const dto2: CreateOfferDto = {
      productId: 'p2',
      title: 'Two',
      price: 200,
      currency: 'USD',
      validFrom: new Date(),
      validTo: new Date(),
    };
    service.createOffer(dto1);
    service.createOffer(dto2);
    const offers = service.listOffersByProduct('p1');
    expect(offers.length).toBe(1);
    expect(offers[0].productId).toBe('p1');
    expect(repository.findByProduct).toHaveBeenCalledWith('p1');
  });
});
