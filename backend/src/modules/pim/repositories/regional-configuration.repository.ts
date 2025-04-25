/**
 * Regional Configuration Repository
 *
 * Repository for managing region configurations in the enhanced regional support framework
 */

import { Injectable, Logger } from '@nestjs/common';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { RegionConfiguration } from '../services/enhanced-regional/regional-configuration.service';

/**
 * Repository for regional configurations
 */
@Injectable()
export class RegionalConfigurationRepository extends FirestoreBaseRepository<RegionConfiguration> {
  constructor() {
    super('regional_configurations', {
      idField: 'id',
      defaultOrderField: 'name',
      defaultOrderDirection: 'asc',
    });

    this.logger = new Logger(RegionalConfigurationRepository.name);
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
    return this.findWithFilters(
      [
        {
          field: 'countryCode',
          operator: '==',
          value: countryCode.toLowerCase(),
        },
      ],
      tenantId,
    );
  }

  /**
   * Find active regions
   *
   * @param tenantId Tenant ID
   * @returns Active region configurations
   */
  async findActive(tenantId: string): Promise<RegionConfiguration[]> {
    return this.findWithFilters(
      [
        {
          field: 'active',
          operator: '==',
          value: true,
        },
      ],
      tenantId,
    );
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
    const regions = await this.findAll(tenantId);

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
    const regions = await this.findAll(tenantId);

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
    const regions = await this.findAll(tenantId);

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
    const regions = await this.findAll(tenantId);

    return regions.filter((region) => region.businessRules[rule] === value);
  }
}
