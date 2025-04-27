import { Injectable } from "@nestjs/common";
import { FirestoreBaseRepository } from "@common/repositories";
import { MarketplaceStrategy, StrategyTemplate } from "../interfaces/types";
import { FirestoreConfigService } from "../../../config/firestore.config";
import { FindOptions } from "@common/repositories";

/**
 * Repository for marketplace strategies
 */
@Injectable()
export class MarketplaceStrategyRepository extends FirestoreBaseRepository<MarketplaceStrategy> {
  constructor(private readonly firestoreConfig: FirestoreConfigService) {
    super(firestoreConfig, "marketplace-strategies");
  }

  /**
   * Find strategies by organization ID
   * @param organizationId Organization ID
   * @param limit Maximum number of strategies to return
   * @returns Promise with array of MarketplaceStrategy objects
   */
  async findByOrganization(
    organizationId: string,
    limit: number = 20,
  ): Promise<MarketplaceStrategy[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
      ],
      queryOptions: {
        limit,
      },
    });
  }

  /**
   * Find strategies by organization ID and marketplace
   * @param organizationId Organization ID
   * @param marketplace Marketplace identifier
   * @param limit Maximum number of strategies to return
   * @returns Promise with array of MarketplaceStrategy objects
   */
  async findByMarketplace(
    organizationId: string,
    marketplace: string,
    limit: number = 20,
  ): Promise<MarketplaceStrategy[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "marketplace", operator: "==", value: marketplace },
      ],
      queryOptions: {
        limit,
      },
    });
  }

  /**
   * Find strategies by product ID
   * @param organizationId Organization ID
   * @param productId Product ID
   * @returns Promise with array of MarketplaceStrategy objects
   */
  async findByProduct(
    organizationId: string,
    productId: string,
  ): Promise<MarketplaceStrategy[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "productId", operator: "==", value: productId },
      ],
    });
  }

  /**
   * Find strategies by category ID
   * @param organizationId Organization ID
   * @param categoryId Category ID
   * @returns Promise with array of MarketplaceStrategy objects
   */
  async findByCategory(
    organizationId: string,
    categoryId: string,
  ): Promise<MarketplaceStrategy[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "categoryId", operator: "==", value: categoryId },
      ],
    });
  }

  /**
   * Find strategies that are about to expire
   * @param organizationId Organization ID
   * @param expiryDate Date to check against
   * @returns Promise with array of MarketplaceStrategy objects
   */
  async findExpiringStrategies(
    organizationId: string,
    expiryDate: Date,
  ): Promise<MarketplaceStrategy[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "expiresAt", operator: "<=", value: expiryDate },
      ],
    });
  }
}

/**
 * Repository for strategy templates
 */
@Injectable()
export class StrategyTemplateRepository extends FirestoreBaseRepository<StrategyTemplate> {
  constructor(private readonly firestoreConfig: FirestoreConfigService) {
    super(firestoreConfig, "strategy-templates");
  }

  /**
   * Find templates by marketplace
   * @param marketplace Marketplace identifier
   * @returns Promise with array of StrategyTemplate objects
   */
  async findByMarketplace(marketplace: string): Promise<StrategyTemplate[]> {
    return await this.find({
      advancedFilters: [
        { field: "marketplace", operator: "==", value: marketplace },
        { field: "isActive", operator: "==", value: true },
      ],
    });
  }

  /**
   * Find templates by category
   * @param category Category identifier
   * @returns Promise with array of StrategyTemplate objects
   */
  async findByCategory(category: string): Promise<StrategyTemplate[]> {
    return await this.find({
      advancedFilters: [
        { field: "category", operator: "==", value: category },
        { field: "isActive", operator: "==", value: true },
      ],
    });
  }

  /**
   * Find all active templates
   * @returns Promise with array of active StrategyTemplate objects
   */
  async findAllActive(): Promise<StrategyTemplate[]> {
    return await this.findBy("isActive", true);
  }
}
