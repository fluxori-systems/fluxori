import { Injectable } from "@nestjs/common";
import { FirestoreBaseRepository } from "@common/repositories";
import { FirestoreConfigService } from "../../../config/firestore.config";
import { FirestoreEntity } from "../../../types/google-cloud.types";
import { KeywordResearchPricing } from "../interfaces/types";

/**
 * Keyword research pricing tier entity stored in Firestore
 */
interface KeywordResearchPricingTier
  extends FirestoreEntity,
    KeywordResearchPricing {
  name: string;
  description?: string;
  isActive: boolean;
  effectiveDate: Date;
  expirationDate?: Date;
}

/**
 * Repository for keyword research pricing tiers
 */
@Injectable()
export class KeywordResearchPricingRepository extends FirestoreBaseRepository<KeywordResearchPricingTier> {
  protected readonly collectionName = "keyword_research_pricing_tiers";

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, "keyword_research_pricing_tiers", {
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 60 * 60 * 1000, // 1 hour
      requiredFields: [
        "name",
        "basePrice",
        "marketplaceMultiplier",
        "cacheDiscount",
        "isActive",
      ],
    });
  }

  /**
   * Find active pricing tier
   * @returns Active pricing tier or null if not found
   */
  async findActivePricingTier(): Promise<KeywordResearchPricingTier | null> {
    const now = new Date();

    const results = await this.find({
      filter: {
        isActive: true,
      } as Partial<KeywordResearchPricingTier>,
    });

    // Filter by effective date
    const validTiers = results.filter((tier) => {
      // Check if within effective date range
      const effectiveDate =
        tier.effectiveDate instanceof Date
          ? tier.effectiveDate
          : new Date(tier.effectiveDate);

      let isValid = effectiveDate <= now;

      // Check expiration if set
      if (tier.expirationDate) {
        const expirationDate =
          tier.expirationDate instanceof Date
            ? tier.expirationDate
            : new Date(tier.expirationDate);

        isValid = isValid && expirationDate > now;
      }

      return isValid;
    });

    // Return most recently effective pricing tier
    if (validTiers.length > 0) {
      return validTiers.sort((a, b) => {
        const dateA =
          a.effectiveDate instanceof Date
            ? a.effectiveDate
            : new Date(a.effectiveDate);

        const dateB =
          b.effectiveDate instanceof Date
            ? b.effectiveDate
            : new Date(b.effectiveDate);

        return dateB.getTime() - dateA.getTime();
      })[0];
    }

    return null;
  }

  /**
   * Create default pricing tier if none exists
   * @returns Created pricing tier
   */
  async createDefaultPricingTier(): Promise<KeywordResearchPricingTier> {
    // Check if any pricing tier exists
    const existing = await this.findActivePricingTier();

    if (existing) {
      return existing;
    }

    // Create default pricing tier
    return this.create({
      name: "Standard Keyword Research Pricing",
      description: "Default pricing for keyword research services",
      basePrice: 10, // 10 credits per keyword
      marketplaceMultiplier: {
        takealot: 1.0, // Standard for South Africa primary
        loot: 1.0, // Standard for South Africa primary
        makro: 1.0, // Standard for South Africa primary
        amazon: 1.5, // Premium for global marketplace
        buck_cheap: 0.8, // Discount for smaller marketplace
        bob_shop: 0.8, // Discount for smaller marketplace
      },
      cacheDiscount: 0.0, // No discount for cached results
      bulkDiscountThresholds: [
        { count: 5, discountPercent: 0.1 }, // 10% discount for 5+ keywords
        { count: 10, discountPercent: 0.15 }, // 15% discount for 10+ keywords
        { count: 25, discountPercent: 0.25 }, // 25% discount for 25+ keywords
        { count: 50, discountPercent: 0.35 }, // 35% discount for 50+ keywords
      ],
      additionalFeatures: {
        seoMetricsPrice: 5, // Additional 5 credits for SEO metrics
        deepScanByPage: 2, // 2 credits per additional page scanned
        competitorAnalysisPrice: 15, // 15 credits for competitor analysis
        historicalDataPrice: 10, // 10 credits for historical data
      },
      isActive: true,
      effectiveDate: new Date(),
    });
  }

  /**
   * Calculate price for keyword research request
   * @param keywordCount Number of keywords
   * @param marketplaces Array of marketplaces
   * @param includeSEOMetrics Whether to include SEO metrics
   * @param maxPagesToScan Maximum pages to scan (default: 2)
   * @param cachePercentage Percentage of keywords already in cache (0-1)
   * @returns Total price in credits
   */
  async calculatePrice(
    keywordCount: number,
    marketplaces: string[],
    includeSEOMetrics: boolean = false,
    maxPagesToScan: number = 2,
    cachePercentage: number = 0,
  ): Promise<number> {
    // Get pricing tier
    let pricingTier = await this.findActivePricingTier();

    // Use default if no pricing tier found
    if (!pricingTier) {
      pricingTier = await this.createDefaultPricingTier();
    }

    // Calculate base price per marketplace
    let totalBasePrice = 0;
    for (const marketplace of marketplaces) {
      const multiplier =
        pricingTier.marketplaceMultiplier[marketplace.toLowerCase()] || 1.0;
      totalBasePrice += pricingTier.basePrice * multiplier * keywordCount;
    }

    // Apply cache discount
    if (cachePercentage > 0) {
      const cachedKeywords = Math.floor(keywordCount * cachePercentage);
      const freshKeywords = keywordCount - cachedKeywords;

      // Recalculate with cache discount applied to cached keywords
      totalBasePrice = 0;
      for (const marketplace of marketplaces) {
        const multiplier =
          pricingTier.marketplaceMultiplier[marketplace.toLowerCase()] || 1.0;
        const basePrice = pricingTier.basePrice * multiplier;

        // Fresh keywords at full price, cached at discount
        totalBasePrice +=
          basePrice * freshKeywords +
          basePrice * cachedKeywords * (1 - pricingTier.cacheDiscount);
      }
    }

    // Additional costs
    let additionalCosts = 0;

    // SEO metrics
    if (includeSEOMetrics) {
      additionalCosts +=
        pricingTier.additionalFeatures.seoMetricsPrice * keywordCount;
    }

    // Deep scan pages beyond the default
    const defaultPages = 2;
    if (maxPagesToScan > defaultPages) {
      const extraPages = maxPagesToScan - defaultPages;
      additionalCosts +=
        pricingTier.additionalFeatures.deepScanByPage *
        extraPages *
        keywordCount;
    }

    // Calculate total before bulk discount
    let totalPrice = totalBasePrice + additionalCosts;

    // Apply bulk discount
    if (keywordCount > 1) {
      // Find applicable discount tier
      let discountPercent = 0;
      for (const threshold of pricingTier.bulkDiscountThresholds) {
        if (
          keywordCount >= threshold.count &&
          threshold.discountPercent > discountPercent
        ) {
          discountPercent = threshold.discountPercent;
        }
      }

      if (discountPercent > 0) {
        totalPrice = totalPrice * (1 - discountPercent);
      }
    }

    // Round up to nearest credit
    return Math.ceil(totalPrice);
  }
}
