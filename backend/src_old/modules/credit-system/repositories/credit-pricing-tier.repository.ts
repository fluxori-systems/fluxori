import { Injectable } from "@nestjs/common";

import { FirestoreBaseRepository } from "@common/repositories";
import { FirestoreConfigService } from "../../../config/firestore.config";
import { CreditPricingTier } from "../interfaces/types";

/**
 * Repository for credit pricing tiers
 */
@Injectable()
export class CreditPricingTierRepository extends FirestoreBaseRepository<CreditPricingTier> {
  protected readonly collectionName = "credit_pricing_tiers";

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, "credit_pricing_tiers", {
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 30 * 60 * 1000, // 30 minutes (pricing doesn't change often)
      requiredFields: [
        "modelId",
        "modelProvider",
        "displayName",
        "inputTokenCost",
        "outputTokenCost",
        "effectiveDate",
        "isActive",
      ],
    });
  }

  /**
   * Find active pricing tier for a model
   * @param modelId Model ID
   * @param modelProvider Model provider
   * @param region Optional region for region-specific pricing
   * @returns Active pricing tier or null if not found
   */
  async findActiveForModel(
    modelId: string,
    modelProvider: string,
    region?: string,
  ): Promise<CreditPricingTier | null> {
    const currentDate = new Date();

    const pricingTiers = await this.find({
      filter: {
        modelId,
        modelProvider,
        isActive: true,
      } as Partial<CreditPricingTier>,
    });

    // Filter to find the active tier as of the current date
    const activeTiers = pricingTiers.filter((tier) => {
      const effectiveDate =
        tier.effectiveDate instanceof Date
          ? tier.effectiveDate
          : new Date(tier.effectiveDate);

      // Skip if not yet effective
      if (effectiveDate > currentDate) {
        return false;
      }

      // Skip if expired
      if (tier.expirationDate) {
        const expirationDate =
          tier.expirationDate instanceof Date
            ? tier.expirationDate
            : new Date(tier.expirationDate);

        if (expirationDate < currentDate) {
          return false;
        }
      }

      return true;
    });

    // Sort by effective date in descending order to get the most recent
    activeTiers.sort((a, b) => {
      const dateA =
        a.effectiveDate instanceof Date
          ? a.effectiveDate
          : new Date(a.effectiveDate);

      const dateB =
        b.effectiveDate instanceof Date
          ? b.effectiveDate
          : new Date(b.effectiveDate);

      return dateB.getTime() - dateA.getTime();
    });

    // Return the most recent active tier
    return activeTiers.length > 0 ? activeTiers[0] : null;
  }

  /**
   * Find all active pricing tiers
   * @returns Array of active pricing tiers
   */
  async findAllActive(): Promise<CreditPricingTier[]> {
    const currentDate = new Date();

    const pricingTiers = await this.find({
      filter: { isActive: true } as Partial<CreditPricingTier>,
    });

    // Filter to find the active tiers as of the current date
    return pricingTiers.filter((tier) => {
      const effectiveDate =
        tier.effectiveDate instanceof Date
          ? tier.effectiveDate
          : new Date(tier.effectiveDate);

      // Skip if not yet effective
      if (effectiveDate > currentDate) {
        return false;
      }

      // Skip if expired
      if (tier.expirationDate) {
        const expirationDate =
          tier.expirationDate instanceof Date
            ? tier.expirationDate
            : new Date(tier.expirationDate);

        if (expirationDate < currentDate) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Update specific fields of an entity
   * @param id Entity ID
   * @param fields Fields to update
   * @returns Updated entity
   */
  async updateFields(
    id: string,
    fields: Partial<CreditPricingTier>,
  ): Promise<CreditPricingTier> {
    return this.update(id, fields);
  }

  /**
   * Deactivate pricing tier
   * @param tierId Pricing tier ID
   * @returns Updated pricing tier
   */
  async deactivate(tierId: string): Promise<CreditPricingTier> {
    return this.updateFields(tierId, {
      isActive: false,
    });
  }

  /**
   * Find pricing tiers by provider
   * @param modelProvider Model provider
   * @returns Array of pricing tiers
   */
  async findByProvider(modelProvider: string): Promise<CreditPricingTier[]> {
    return this.find({
      filter: { modelProvider } as Partial<CreditPricingTier>,
    });
  }
}
