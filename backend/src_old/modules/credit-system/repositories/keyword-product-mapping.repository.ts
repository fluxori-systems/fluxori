import { Injectable } from "@nestjs/common";
import { FirestoreBaseRepository } from "@common/repositories";
import { KeywordProductMapping } from "../interfaces/types";
import { FirestoreConfigService } from "../../../config/firestore.config";
import { FindOptions } from "@common/repositories";

/**
 * Repository for keyword product mappings
 */
@Injectable()
export class KeywordProductMappingRepository extends FirestoreBaseRepository<KeywordProductMapping> {
  constructor(private readonly firestoreConfig: FirestoreConfigService) {
    super(firestoreConfig, "keyword-product-mappings");
  }

  /**
   * Find mappings by organization ID
   * @param organizationId Organization ID
   * @returns Promise with array of KeywordProductMapping objects
   */
  async findByOrganization(
    organizationId: string,
  ): Promise<KeywordProductMapping[]> {
    return await this.findBy("organizationId", organizationId);
  }

  /**
   * Find mappings by product ID
   * @param organizationId Organization ID
   * @param productId Product ID
   * @returns Promise with array of KeywordProductMapping objects
   */
  async findByProduct(
    organizationId: string,
    productId: string,
  ): Promise<KeywordProductMapping[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "productId", operator: "==", value: productId },
      ],
    });
  }

  /**
   * Find mappings by SKU
   * @param organizationId Organization ID
   * @param sku SKU
   * @returns Promise with array of KeywordProductMapping objects
   */
  async findBySku(
    organizationId: string,
    sku: string,
  ): Promise<KeywordProductMapping[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "sku", operator: "==", value: sku },
      ],
    });
  }

  /**
   * Find mappings by keyword
   * @param organizationId Organization ID
   * @param keyword Keyword
   * @returns Promise with array of KeywordProductMapping objects
   */
  async findByKeyword(
    organizationId: string,
    keyword: string,
  ): Promise<KeywordProductMapping[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "keywords", operator: "array-contains", value: { keyword } },
      ],
    });
  }

  /**
   * Find products with auto-keyword enabled
   * @param organizationId Organization ID
   * @returns Promise with array of KeywordProductMapping objects
   */
  async findWithAutoKeywordEnabled(
    organizationId: string,
  ): Promise<KeywordProductMapping[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "autoKeywordEnabled", operator: "==", value: true },
      ],
    });
  }

  /**
   * Update keyword relevance for a product
   * @param id Mapping ID
   * @param keyword Keyword
   * @param relevanceScore Relevance score
   */
  async updateKeywordRelevance(
    id: string,
    keyword: string,
    relevanceScore: number,
  ): Promise<void> {
    const mapping = await this.findById(id);
    if (!mapping) {
      throw new Error(`Mapping with ID ${id} not found`);
    }

    const keywordIndex = mapping.keywords.findIndex(
      (k) => k.keyword === keyword,
    );
    if (keywordIndex === -1) {
      throw new Error(`Keyword ${keyword} not found in mapping ${id}`);
    }

    const updatedKeywords = [...mapping.keywords];
    updatedKeywords[keywordIndex] = {
      ...updatedKeywords[keywordIndex],
      relevanceScore,
    };

    await this.update(id, {
      keywords: updatedKeywords,
      lastUpdated: new Date(),
    });
  }

  /**
   * Add a ranking for a keyword
   * @param id Mapping ID
   * @param keyword Keyword
   * @param marketplace Marketplace
   * @param position Position
   */
  async addRanking(
    id: string,
    keyword: string,
    marketplace: string,
    position: number,
  ): Promise<void> {
    const mapping = await this.findById(id);
    if (!mapping) {
      throw new Error(`Mapping with ID ${id} not found`);
    }

    const keywordIndex = mapping.keywords.findIndex(
      (k) => k.keyword === keyword,
    );
    if (keywordIndex === -1) {
      throw new Error(`Keyword ${keyword} not found in mapping ${id}`);
    }

    const updatedKeywords = [...mapping.keywords];
    const keywordData = updatedKeywords[keywordIndex];

    // Find existing ranking for this marketplace or create a new one
    const rankingIndex =
      keywordData.ranking?.findIndex((r) => r.marketplace === marketplace) ??
      -1;

    if (rankingIndex >= 0 && keywordData.ranking) {
      // Update existing ranking
      keywordData.ranking[rankingIndex] = {
        ...keywordData.ranking[rankingIndex],
        position,
        lastChecked: new Date(),
      };
    } else {
      // Add new ranking
      if (!keywordData.ranking) {
        keywordData.ranking = [];
      }

      keywordData.ranking.push({
        marketplace,
        position,
        lastChecked: new Date(),
      });
    }

    updatedKeywords[keywordIndex] = keywordData;

    await this.update(id, {
      keywords: updatedKeywords,
      lastUpdated: new Date(),
    });
  }

  /**
   * Add a suggested keyword to a product
   * @param id Mapping ID
   * @param keyword Keyword
   * @param relevance Relevance score
   * @param searchVolume Search volume
   * @param competition Competition level
   * @param opportunity Opportunity score
   */
  async addSuggestedKeyword(
    id: string,
    keyword: string,
    relevance: number,
    searchVolume: number,
    competition: number,
    opportunity: number,
  ): Promise<void> {
    const mapping = await this.findById(id);
    if (!mapping) {
      throw new Error(`Mapping with ID ${id} not found`);
    }

    // Check if keyword already exists in suggestions
    const exists = mapping.suggestedKeywords?.some(
      (k) => k.keyword === keyword,
    );

    if (exists) {
      // Update existing suggestion
      const updatedSuggestions =
        mapping.suggestedKeywords?.map((s) => {
          if (s.keyword === keyword) {
            return {
              keyword,
              relevance,
              searchVolume,
              competition,
              opportunity,
            };
          }
          return s;
        }) || [];

      await this.update(id, {
        suggestedKeywords: updatedSuggestions,
        lastUpdated: new Date(),
      });
    } else {
      // Add new suggestion
      const suggestions = mapping.suggestedKeywords || [];

      await this.update(id, {
        suggestedKeywords: [
          ...suggestions,
          {
            keyword,
            relevance,
            searchVolume,
            competition,
            opportunity,
          },
        ],
        lastUpdated: new Date(),
      });
    }
  }

  /**
   * Add attribute recommendation
   * @param id Mapping ID
   * @param attribute Attribute name
   * @param currentValue Current value
   * @param recommendedValue Recommended value
   * @param confidence Confidence score
   * @param impact Impact level
   * @param reason Recommendation reason
   */
  async addAttributeRecommendation(
    id: string,
    attribute: string,
    currentValue: string | undefined,
    recommendedValue: string,
    confidence: number,
    impact: "high" | "medium" | "low",
    reason: string,
  ): Promise<void> {
    const mapping = await this.findById(id);
    if (!mapping) {
      throw new Error(`Mapping with ID ${id} not found`);
    }

    // Check if recommendation for this attribute already exists
    const exists = mapping.attributeRecommendations?.some(
      (r) => r.attribute === attribute,
    );

    if (exists) {
      // Update existing recommendation
      const updatedRecommendations =
        mapping.attributeRecommendations?.map((r) => {
          if (r.attribute === attribute) {
            return {
              attribute,
              currentValue,
              recommendedValue,
              confidence,
              impact,
              reason,
            };
          }
          return r;
        }) || [];

      await this.update(id, {
        attributeRecommendations: updatedRecommendations,
        lastUpdated: new Date(),
      });
    } else {
      // Add new recommendation
      const recommendations = mapping.attributeRecommendations || [];

      await this.update(id, {
        attributeRecommendations: [
          ...recommendations,
          {
            attribute,
            currentValue,
            recommendedValue,
            confidence,
            impact,
            reason,
          },
        ],
        lastUpdated: new Date(),
      });
    }
  }

  /**
   * Blacklist a keyword for a product
   * @param id Mapping ID
   * @param keyword Keyword to blacklist
   */
  async blacklistKeyword(id: string, keyword: string): Promise<void> {
    const mapping = await this.findById(id);
    if (!mapping) {
      throw new Error(`Mapping with ID ${id} not found`);
    }

    const blacklistedKeywords = mapping.blacklistedKeywords || [];

    if (!blacklistedKeywords.includes(keyword)) {
      await this.update(id, {
        blacklistedKeywords: [...blacklistedKeywords, keyword],
        lastUpdated: new Date(),
      });
    }
  }

  /**
   * Remove a keyword from blacklist
   * @param id Mapping ID
   * @param keyword Keyword to remove from blacklist
   */
  async removeFromBlacklist(id: string, keyword: string): Promise<void> {
    const mapping = await this.findById(id);
    if (!mapping) {
      throw new Error(`Mapping with ID ${id} not found`);
    }

    const blacklistedKeywords = mapping.blacklistedKeywords || [];

    await this.update(id, {
      blacklistedKeywords: blacklistedKeywords.filter((k) => k !== keyword),
      lastUpdated: new Date(),
    });
  }

  /**
   * Enable or disable auto keyword optimization for a product
   * @param id Mapping ID
   * @param enabled Whether auto-keyword is enabled
   */
  async setAutoKeywordEnabled(id: string, enabled: boolean): Promise<void> {
    const mapping = await this.findById(id);
    if (!mapping) {
      throw new Error(`Mapping with ID ${id} not found`);
    }

    await this.update(id, {
      autoKeywordEnabled: enabled,
      lastUpdated: new Date(),
    });
  }

  /**
   * Get all active mappings ready for optimization
   * @param organizationId Organization ID
   * @param limit Maximum number of mappings to return
   * @returns Promise with array of KeywordProductMapping objects
   */
  async findMappingsForOptimization(
    organizationId: string,
    limit: number = 100,
  ): Promise<KeywordProductMapping[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "autoKeywordEnabled", operator: "==", value: true },
      ],
      queryOptions: {
        limit,
      },
    });
  }
}
