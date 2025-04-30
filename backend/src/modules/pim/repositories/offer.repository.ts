import { Injectable, NotFoundException } from '@nestjs/common';
import { Offer, CreateOfferDto, UpdateOfferDto } from '../services/offer.service';

/**
 * Repository for Offer persistence.
 * For demonstration, this uses an in-memory array. Replace with DB integration as needed.
 */
@Injectable()
export class OfferRepository {
  private offers: Offer[] = [];

  create(dto: CreateOfferDto): Offer {
    const offer: Offer = {
      id: 'offer_' + Math.random().toString(36).substr(2, 9),
      ...dto,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.offers.push(offer);
    return offer;
  }

  findById(id: string): Offer {
    const offer = this.offers.find(o => o.id === id);
    if (!offer) throw new NotFoundException(`Offer ${id} not found`);
    return offer;
  }

  update(id: string, dto: UpdateOfferDto): Offer {
    const offer = this.findById(id);
    Object.assign(offer, dto, { updatedAt: new Date() });
    return offer;
  }

  delete(id: string): void {
    const idx = this.offers.findIndex(o => o.id === id);
    if (idx === -1) throw new NotFoundException(`Offer ${id} not found`);
    this.offers.splice(idx, 1);
  }

  findByProduct(productId: string): Offer[] {
    return this.offers.filter(o => o.productId === productId);
  }
}
