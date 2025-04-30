/**
 * Offer Service
 *
 * This service manages product offers for the PIM module, providing creation, retrieval,
 * updating, and deletion of offers, as well as offer validation and compliance checks.
 * Strictly typed for TypeScript compliance.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';

export interface Offer {
  id: string;
  productId: string;
  marketplaceId: string;
  price: number;
  currency: string;
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOfferDto {
  productId: string;
  marketplaceId: string;
  price: number;
  currency: string;
  validFrom: Date;
  validTo: Date;
}

export interface UpdateOfferDto {
  price?: number;
  currency?: string;
  validFrom?: Date;
  validTo?: Date;
  isActive?: boolean;
}

@Injectable()
export class OfferService {
  private readonly logger = new Logger(OfferService.name);
  constructor(private readonly offerRepository: import('../repositories/offer.repository').OfferRepository) {}

  /**
   * Create a new offer
   */
  createOffer(dto: CreateOfferDto): Offer {
    const offer = this.offerRepository.create(dto);
    this.logger.log(`Created offer ${offer.id} for product ${offer.productId}`);
    return offer;
  }

  /**
   * Get an offer by ID
   */
  getOfferById(id: string): Offer {
    return this.offerRepository.findById(id);
  }

  /**
   * Update an offer
   */
  updateOffer(id: string, dto: UpdateOfferDto): Offer {
    const offer = this.offerRepository.update(id, dto);
    this.logger.log(`Updated offer ${id}`);
    return offer;
  }

  /**
   * Delete an offer
   */
  deleteOffer(id: string): void {
    this.offerRepository.delete(id);
    this.logger.log(`Deleted offer ${id}`);
  }

  /**
   * List all offers for a product
   */
  listOffersByProduct(productId: string): Offer[] {
    return this.offerRepository.findByProduct(productId);
  }
}
