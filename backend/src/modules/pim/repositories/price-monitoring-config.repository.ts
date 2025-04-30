import { Injectable, Logger } from '@nestjs/common';

import { v4 as uuidv4 } from 'uuid';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { PriceMonitoringConfig } from '../models/competitor-price.model';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { FirestoreAdvancedFilter, FindOptions, QueryFilterOperator } from '../../../common/repositories/base/repository-types';

/**
 * Repository for price monitoring configurations
 * Handles persistence of price monitoring settings
 */
@Injectable()
export class PriceMonitoringConfigRepository extends FirestoreBaseRepository<PriceMonitoringConfig> {
  protected readonly logger = new Logger(PriceMonitoringConfigRepository.name);

  constructor(
    firestoreConfigService: FirestoreConfigService,
  ) {
    super(firestoreConfigService, 'price-monitoring-configs', {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 30 * 60 * 1000, // 30 minutes
    });
  }

  /**
   * Create a new price monitoring configuration
   * @param data Configuration data
   */
  async create(
    data: Omit<PriceMonitoringConfig, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version' | 'deletedAt'>,
  ): Promise<PriceMonitoringConfig> {
    try {
      const now = new Date();

      const newConfig: Omit<PriceMonitoringConfig, 'createdAt' | 'updatedAt'> = {
        ...data,
        id: uuidv4(),
        isDeleted: false,
        version: 1,
        deletedAt: null,
      };

      return super.create(newConfig);
    } catch (error) {
      this.logger.error(
        `Error creating price monitoring config: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update a price monitoring configuration
   * @param id Configuration ID
   * @param data Updated data
   */
  async update(
    id: string,
    data: Partial<PriceMonitoringConfig>,
  ): Promise<PriceMonitoringConfig> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      return super.update(id, updateData);
    } catch (error) {
      this.logger.error(
        `Error updating price monitoring config: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find price monitoring config for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   */
  async findByProductId(
    productId: string,
    organizationId: string,
  ): Promise<PriceMonitoringConfig | null> {
    try {
      const query = {
        where: [
          { field: 'productId', operator: '==' as QueryFilterOperator, value: productId },
          { field: 'organizationId', operator: '==' as QueryFilterOperator, value: organizationId },
        ],
        limit: 1,
      };

      const results = await this.find({
        advancedFilters: query.where,
        limit: query.limit,
      });

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      this.logger.error(
        `Error finding monitoring config: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find all enabled price monitoring configurations
   * @param organizationId Organization ID
   * @param limit Maximum records to return
   */
  async findEnabled(
    organizationId: string,
    limit: number = 100,
  ): Promise<PriceMonitoringConfig[]> {
    try {
      const query = {
        where: [
          { field: 'organizationId', operator: '==' as QueryFilterOperator, value: organizationId },
          { field: 'isEnabled', operator: '==' as QueryFilterOperator, value: true },
        ],
        limit,
      };

      return this.find({
        advancedFilters: query.where,
        limit: query.limit,
      });
    } catch (error) {
      this.logger.error(
        `Error finding enabled monitoring configs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find configurations for multiple products
   * @param productIds Array of product IDs
   * @param organizationId Organization ID
   */
  async findByProductIds(
    productIds: string[],
    organizationId: string,
  ): Promise<Record<string, PriceMonitoringConfig>> {
    try {
      const query = {
        where: [
          { field: 'productId', operator: 'in' as QueryFilterOperator, value: productIds },
          { field: 'organizationId', operator: '==' as QueryFilterOperator, value: organizationId },
        ],
        limit: productIds.length,
      };

      const configs = await this.find({
        advancedFilters: query.where,
        limit: query.limit,
      });

      // Convert to record keyed by product ID
      const result: Record<string, PriceMonitoringConfig> = {};

      configs.forEach((config) => {
        result[config.productId] = config;
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Error finding configs by product IDs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find configurations due for monitoring
   * @param organizationId Organization ID
   * @param thresholdMinutes Minutes threshold for considering a config due for update
   * @param limit Maximum records to return
   */
  async findConfigsDueForMonitoring(
    organizationId: string,
    thresholdMinutes: number = 60,
    limit: number = 50,
  ): Promise<PriceMonitoringConfig[]> {
    try {
      // Note: In a real implementation, you would track lastMonitoredTime
      // Since we don't have that field yet, this is a simplified implementation
      // that returns enabled configs

      const query = {
        where: [
          { field: 'organizationId', operator: '==' as QueryFilterOperator, value: organizationId },
          { field: 'isEnabled', operator: '==' as QueryFilterOperator, value: true },
        ],
        limit,
      };

      return this.find({
        advancedFilters: query.where,
        limit: query.limit,
      });
    } catch (error) {
      this.logger.error(
        `Error finding configs for monitoring: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
