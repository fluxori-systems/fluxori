/**
 * VAT Service Factory
 * 
 * Factory pattern for creating region-specific VAT services
 */

import { Injectable } from '@nestjs/common';
import { MarketContextService } from './market-context.service';
import { SouthAfricanVatService } from './regional/south-african-vat.service';
import { EuropeanVatService } from './regional/european-vat.service';
import { GlobalVatService } from './regional/global-vat.service';
import { VatService } from './vat.service.interface';

/**
 * VAT Service Factory
 * 
 * This factory returns the appropriate VAT service based on market context
 */
@Injectable()
export class VatServiceFactory {
  /**
   * Constructor
   * 
   * @param southAfricanVatService South Africa specific VAT service
   * @param europeanVatService European VAT service
   * @param globalVatService Default global VAT service
   * @param marketContextService Market context service
   */
  constructor(
    private readonly southAfricanVatService: SouthAfricanVatService,
    private readonly europeanVatService: EuropeanVatService,
    private readonly globalVatService: GlobalVatService,
    private readonly marketContextService: MarketContextService
  ) {}

  /**
   * Get the appropriate VAT service for an organization
   * 
   * @param organizationId The organization ID
   * @returns The appropriate VAT service
   */
  async getVatService(organizationId: string): Promise<VatService> {
    const context = await this.marketContextService.getMarketContext(organizationId);
    return this.getVatServiceForRegion(context.region);
  }

  /**
   * Get the appropriate VAT service for a region
   * 
   * @param region The region code
   * @returns The appropriate VAT service
   */
  getVatServiceForRegion(region: string): VatService {
    switch (region) {
      case 'south-africa':
        return this.southAfricanVatService;
        
      case 'europe':
        return this.europeanVatService;
        
      default:
        return this.globalVatService;
    }
  }
}