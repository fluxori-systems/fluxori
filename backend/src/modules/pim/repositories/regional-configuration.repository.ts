/**
 * Regional Configuration Repository
 *
 * Repository for managing region configurations in the enhanced regional support framework
 */

import { Injectable, Logger } from '@nestjs/common';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { QueryFilterOperator } from '../../../types/google-cloud.types';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { RegionConfiguration } from '../services/enhanced-regional/regional-configuration.service';

/**
 * Repository for regional configurations
 */
@Injectable()
export class RegionalConfigurationRepository extends FirestoreBaseRepository<RegionConfiguration> {
  protected readonly logger = new Logger(RegionalConfigurationRepository.name);
  constructor(protected readonly firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'regional_configurations');
  }

  /**
   * Find region by country code
   *
   * @param countryCode ISO country code
   * @param tenantId Tenant ID
   * @returns Region configurations matching the country code
   */
  async findByCountryCode(
    countryCode: string,
    tenantId: string,
  ): Promise<RegionConfiguration[]> {
    return this.find({
      advancedFilters: [
        { field: 'tenantId', operator: '==' as QueryFilterOperator, value: tenantId },
        { field: 'countryCode', operator: '==' as QueryFilterOperator, value: countryCode.toLowerCase() },
      ],
    });
  }

  /**
   * Find active regions
   *
   * @param tenantId Tenant ID
   * @returns Active region configurations
   */
  async findActive(tenantId: string): Promise<RegionConfiguration[]> {
    return this.find({
      advancedFilters: [
        { field: 'tenantId', operator: '==' as QueryFilterOperator, value: tenantId },
        { field: 'active', operator: '==' as QueryFilterOperator, value: true },
      ],
    });
  }

  /**
   * Find regions that support a specific currency
   *
   * @param currencyCode Currency code
   * @param tenantId Tenant ID
   * @returns Region configurations that support the currency
   */
  async findByCurrency(
    currencyCode: string,
    tenantId: string,
  ): Promise<RegionConfiguration[]> {
    const regions = await this.find({
      advancedFilters: [
        { field: 'tenantId', operator: '==' as QueryFilterOperator, value: tenantId },
      ],
    });

    return regions.filter(
      (region) =>
        region.primaryCurrency === currencyCode ||
        region.supportedCurrencies.includes(currencyCode),
    );
  }

  /**
   * Find regions that support a specific language
   *
   * @param languageCode Language code
   * @param tenantId Tenant ID
   * @returns Region configurations that support the language
   */
  async findByLanguage(
    languageCode: string,
    tenantId: string,
  ): Promise<RegionConfiguration[]> {
    const regions = await this.find({
      advancedFilters: [
        { field: 'tenantId', operator: '==' as QueryFilterOperator, value: tenantId },
      ],
    });

    return regions.filter(
      (region) =>
        region.primaryLanguage === languageCode ||
        region.supportedLanguages.includes(languageCode),
    );
  }

  /**
   * Find regions that support a specific marketplace
   *
   * @param marketplaceId Marketplace ID
   * @param tenantId Tenant ID
   * @returns Region configurations that support the marketplace
   */
  async findByMarketplace(
    marketplaceId: string,
    tenantId: string,
  ): Promise<RegionConfiguration[]> {
    const regions = await this.find({
      advancedFilters: [
        { field: 'tenantId', operator: '==' as QueryFilterOperator, value: tenantId },
      ],
    });

    return regions.filter((region) =>
      region.supportedMarketplaces.includes(marketplaceId),
    );
  }

  /**
   * Find regions by business rule
   *
   * @param rule Business rule key
   * @param value Business rule value
   * @param tenantId Tenant ID
   * @returns Region configurations that match the business rule
   */
  async findByBusinessRule(
    rule: string,
    value: any,
    tenantId: string,
  ): Promise<RegionConfiguration[]> {
    const regions = await this.find({
      advancedFilters: [
        { field: 'tenantId', operator: '==' as QueryFilterOperator, value: tenantId },
      ],
    });

    return regions.filter((region) => region.businessRules[rule] === value);
  }
}
