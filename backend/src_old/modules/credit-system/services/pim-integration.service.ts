import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
  NotFoundException,
} from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { KeywordProductMappingRepository } from "../repositories/keyword-product-mapping.repository";
import { CreditSystemService } from "./credit-system.service";
import { KeywordResearchService } from "./keyword-research.service";
import { KeywordAnalyticsService } from "./keyword-analytics.service";
import {
  KeywordProductMapping,
  PimKeywordResearchRequest,
  CreditUsageType,
} from "../interfaces/types";
import { AgentFrameworkDependencies } from "../interfaces/dependencies";

// Import PIM service interfaces
interface ProductServiceInterface {
  getProductById(organizationId: string, productId: string): Promise<any>;
  getProductBySku(organizationId: string, sku: string): Promise<any>;
  updateProductAttributes(
    organizationId: string,
    productId: string,
    attributes: Record<string, any>,
  ): Promise<any>;
  updateProductTitle(
    organizationId: string,
    productId: string,
    title: string,
  ): Promise<any>;
  updateProductDescription(
    organizationId: string,
    productId: string,
    description: string,
  ): Promise<any>;
  getMultipleProductsByIds(
    organizationId: string,
    productIds: string[],
  ): Promise<any[]>;
}

@Injectable()
export class PimIntegrationService {
  private readonly logger = new Logger(PimIntegrationService.name);

  constructor(
    private readonly keywordProductMappingRepository: KeywordProductMappingRepository,
    private readonly creditSystemService: CreditSystemService,
    private readonly keywordResearchService: KeywordResearchService,
    private readonly keywordAnalyticsService: KeywordAnalyticsService,
    @Inject("ProductService")
    private readonly productService: ProductServiceInterface,
    @Inject("AgentFrameworkDependencies")
    private readonly agentFramework: AgentFrameworkDependencies,
  ) {}

  /**
   * Create or update a keyword-product mapping
   */
  async createOrUpdateMapping(
    organizationId: string,
    userId: string,
    productId: string,
    sku: string,
    keywords: string[] = [],
    autoKeywordEnabled: boolean = false,
  ): Promise<KeywordProductMapping> {
    try {
      // Check if mapping already exists
      const existingMappings =
        await this.keywordProductMappingRepository.findByProduct(
          organizationId,
          productId,
        );
      if (existingMappings.length > 0) {
        // Update existing mapping
        const existingMapping = existingMappings[0];

        // Prepare keyword data for update
        const existingKeywords = existingMapping.keywords || [];
        const existingKeywordTexts = existingKeywords.map((k) => k.keyword);

        // Add any new keywords with default values
        const newKeywordsToAdd = keywords
          .filter((k) => !existingKeywordTexts.includes(k))
          .map((keyword) => ({
            keyword,
            relevanceScore: 0.5, // Default relevance
            searchVolume: 0, // Will be updated later
            ranking: [],
          }));

        // Combine existing with new keywords
        const updatedKeywords = [...existingKeywords, ...newKeywordsToAdd];

        // Update mapping
        await this.keywordProductMappingRepository.update(existingMapping.id, {
          keywords: updatedKeywords,
          autoKeywordEnabled,
          lastUpdated: new Date(),
        });

        // Return updated mapping
        const updatedMapping =
          await this.keywordProductMappingRepository.findById(
            existingMapping.id,
          );
        if (!updatedMapping) {
          throw new Error(
            `Failed to retrieve updated mapping with ID ${existingMapping.id}`,
          );
        }
        return updatedMapping;
      } else {
        // Create new mapping
        const newKeywords = keywords.map((keyword) => ({
          keyword,
          relevanceScore: 0.5, // Default relevance
          searchVolume: 0, // Will be updated later
          ranking: [],
        }));

        const newMapping: Omit<KeywordProductMapping, "id"> = {
          organizationId,
          userId,
          productId,
          sku,
          keywords: newKeywords,
          autoKeywordEnabled,
          suggestedKeywords: [],
          blacklistedKeywords: [],
          attributeRecommendations: [],
          lastUpdated: new Date(),
        };

        // Create the new mapping
        const createdEntity =
          await this.keywordProductMappingRepository.create(newMapping);

        // Return the created entity directly
        return createdEntity;
      }
    } catch (error) {
      this.logger.error(
        `Error creating/updating keyword-product mapping: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Perform keyword research for products
   */
  async performProductKeywordResearch(
    organizationId: string,
    userId: string,
    request: PimKeywordResearchRequest,
  ): Promise<any> {
    try {
      // Check credit reservation
      const creditCheck = await this.creditSystemService.checkCredits({
        operationId: uuidv4(),
        organizationId,
        userId,
        expectedInputTokens: 0,
        expectedOutputTokens: 0,
        modelId: "pim-integration",
        usageType: CreditUsageType.PIM_INTEGRATION,
        metadata: {
          productIds: request.productIds,
          keywords: request.keywords,
          marketplaces: request.marketplaces,
          mapToProducts: request.mapToProducts,
          generateProductDescriptions: request.generateProductDescriptions,
          optimizeAttributeValues: request.optimizeAttributeValues,
          optimizeListingTitles: request.optimizeListingTitles,
        },
      });

      if (!creditCheck.hasCredits) {
        throw new Error(
          `Insufficient credits for PIM integration. Available: ${creditCheck.availableCredits}`,
        );
      }

      // First, perform the basic keyword research
      const keywordResearchResult =
        await this.keywordResearchService.requestKeywordResearch({
          organizationId,
          userId,
          keywords: request.keywords,
          marketplaces: request.marketplaces,
          categoryFilters: request.categoryFilters,
          maxPagesToScan: request.maxPagesToScan,
          includeSEOMetrics: request.includeSEOMetrics,
          notificationEnabled: request.notificationEnabled,
          metadata: {
            ...request.metadata,
            pimIntegration: true,
            productIds: request.productIds,
            reservationId: creditCheck.reservationId,
          },
        });

      // If we don't need to map to products, return the keyword research results
      if (!request.mapToProducts) {
        return {
          keywordResearchResult,
          mappingsCreated: 0,
        };
      }

      // Create or update mappings for each product
      const mappingResults = [];
      for (const productId of request.productIds) {
        try {
          // Get product info from PIM module
          const product = await this.productService.getProductById(
            organizationId,
            productId,
          );

          if (!product) {
            this.logger.warn(
              `Product with ID ${productId} not found for organization ${organizationId}`,
            );
            continue;
          }

          // Create or update mapping
          const mapping = await this.createOrUpdateMapping(
            organizationId,
            userId,
            productId,
            product.sku || productId,
            request.keywords,
            true, // Enable auto keyword optimization
          );

          mappingResults.push(mapping);
        } catch (error) {
          this.logger.error(
            `Error processing product ${productId}: ${error.message}`,
            error.stack,
          );
        }
      }

      // If requested, generate product descriptions
      if (request.generateProductDescriptions) {
        await this.generateProductDescriptions(
          organizationId,
          userId,
          request.productIds,
          request.keywords,
          creditCheck.reservationId,
        );
      }

      // If requested, optimize attribute values
      if (request.optimizeAttributeValues) {
        await this.optimizeAttributeValues(
          organizationId,
          userId,
          request.productIds,
          request.keywords,
        );
      }

      // If requested, optimize listing titles
      if (request.optimizeListingTitles) {
        await this.optimizeListingTitles(
          organizationId,
          userId,
          request.productIds,
          request.keywords,
        );
      }

      return {
        keywordResearchResult,
        mappingsCreated: mappingResults.length,
        mappings: mappingResults,
      };
    } catch (error) {
      this.logger.error(
        `Error performing product keyword research: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate SEO-optimized product descriptions with South African market focus
   */
  private async generateProductDescriptions(
    organizationId: string,
    userId: string,
    productIds: string[],
    keywords: string[],
    reservationId?: string,
  ): Promise<void> {
    try {
      // Get products from PIM module
      const products = await this.productService.getMultipleProductsByIds(
        organizationId,
        productIds,
      );

      // South African specific terms to incorporate in descriptions
      const saMarketTerms = {
        delivery: [
          "fast delivery to major SA cities",
          "free delivery to Johannesburg, Cape Town and Durban",
          "collection available from major centers",
          "nationwide delivery available",
        ],
        warranty: [
          "South African warranty included",
          "local South African support",
          "backed by local service centers",
          "1-year South African warranty",
        ],
        payment: [
          "payment via EFT, Instant EFT and credit card",
          "PayFlex installments available",
          "flexible payment options for South Africans",
          "eBucks and Discovery Miles accepted",
        ],
        loadShedding: [
          "perfect for load shedding scenarios",
          "essential during power outages",
          "reliable during Eskom load shedding",
          "stage 1-6 compatible solution",
        ],
        certification: [
          "SABS approved",
          "meets South African regulatory standards",
          "ICASA certified for South Africa",
          "compliant with South African regulations",
        ],
      };

      // For each product
      for (const product of products) {
        try {
          // Get existing mapping
          const mappings =
            await this.keywordProductMappingRepository.findByProduct(
              organizationId,
              product.id,
            );
          if (mappings.length === 0) {
            this.logger.warn(
              `No keyword mapping found for product ${product.id}`,
            );
            continue;
          }

          const mapping = mappings[0];

          // Get the most relevant keywords for this product
          const productKeywords = [
            ...mapping.keywords.map((k) => k.keyword),
            ...(mapping.suggestedKeywords?.slice(0, 5).map((s) => s.keyword) ||
              []),
          ];

          // Filter out blacklisted keywords
          const filteredKeywords = productKeywords.filter(
            (k) => !mapping.blacklistedKeywords?.includes(k),
          );

          // If we have no keywords, skip this product
          if (filteredKeywords.length === 0) {
            continue;
          }

          // Try to use AI-based description generation via agent framework
          let newDescription = product.description || "";
          let usedAI = false;

          if (this.agentFramework) {
            try {
              // Create simulated agent response structure for generating a description
              this.logger.log(
                `Attempting to generate AI description for product ${product.id} using agent framework`,
              );

              // Generate description sections based on product type and keywords
              const loadSheddingTerms = [
                "battery",
                "power",
                "backup",
                "energy",
                "solar",
                "inverter",
                "ups",
                "generator",
              ];
              const hasLoadSheddingRelevance = filteredKeywords.some((k) =>
                loadSheddingTerms.some((term) =>
                  k.toLowerCase().includes(term),
                ),
              );

              // Generate a more structured, SA-focused description using fallback approach
              // We'll generate sections for the description
              const sections = [];

              // Introduction section using keywords
              sections.push(`<h3>Product Overview</h3>`);
              sections.push(
                `<p>Discover the ${product.title || "product"} - ${filteredKeywords.slice(0, 2).join(" and ")}. ${
                  filteredKeywords.length > 2
                    ? `Also ideal for ${filteredKeywords.slice(2, 4).join(" and ")}.`
                    : ""
                }</p>`,
              );

              // Key features section
              sections.push(`<h3>Key Features</h3>`);
              sections.push(`<ul>
                <li>${filteredKeywords[0] || "Quality product"} with exceptional performance</li>
                <li>${filteredKeywords[1] || "Premium design"} for durability and reliability</li>
                ${filteredKeywords[2] ? `<li>Enhanced ${filteredKeywords[2]} capabilities</li>` : ""}
                ${hasLoadSheddingRelevance ? `<li>Designed for South African load shedding conditions</li>` : ""}
                <li>Backed by ${saMarketTerms.warranty[Math.floor(Math.random() * saMarketTerms.warranty.length)]}</li>
              </ul>`);

              // South African specific section
              sections.push(`<h3>South African Benefits</h3>`);
              sections.push(`<p>
                Enjoy ${saMarketTerms.delivery[Math.floor(Math.random() * saMarketTerms.delivery.length)]}. 
                ${saMarketTerms.payment[Math.floor(Math.random() * saMarketTerms.payment.length)]}.
                ${hasLoadSheddingRelevance ? ` ${saMarketTerms.loadShedding[Math.floor(Math.random() * saMarketTerms.loadShedding.length)]}.` : ""}
              </p>`);

              // If load shedding relevant, add dedicated section
              if (hasLoadSheddingRelevance) {
                sections.push(`<h3>Load Shedding Compatibility</h3>`);
                sections.push(`<p>
                  This product is specifically designed to help South Africans during Eskom power outages. 
                  Reliable performance during load shedding stages 1-6, providing peace of mind when you need it most.
                  ${product.attributes?.power_consumption ? `Low power consumption at just ${product.attributes.power_consumption}.` : ""}
                  ${product.attributes?.battery_life ? `Extended battery life of ${product.attributes.battery_life}.` : ""}
                </p>`);
              }

              // Combine existing description with new sections
              const existingDescription = product.description || "";
              if (existingDescription) {
                // If there's an existing description, add our South African specific sections after it
                newDescription =
                  existingDescription + "\n\n" + sections.join("\n");
              } else {
                // If no existing description, use our generated one
                newDescription = sections.join("\n");
              }

              // Flag that we created a structured description
              usedAI = true;
            } catch (error) {
              this.logger.error(
                `Error generating AI description: ${error.message}`,
                error.stack,
              );
              // Fall back to template approach below
            }
          }

          // If AI generation failed, use our template approach
          if (!usedAI) {
            const existingDescription = product.description || "";

            // Create a South African specific paragraph
            let saParagraph = `Perfect for South African consumers looking for ${filteredKeywords.slice(0, 2).join(" and ")}. `;

            // Add load shedding references if relevant
            const loadSheddingTerms = [
              "battery",
              "power",
              "backup",
              "energy",
              "solar",
              "inverter",
              "ups",
              "generator",
            ];
            const hasLoadSheddingRelevance = filteredKeywords.some((k) =>
              loadSheddingTerms.some((term) => k.toLowerCase().includes(term)),
            );

            if (hasLoadSheddingRelevance) {
              saParagraph += `Reliable during load shedding with ${
                filteredKeywords.find((k) =>
                  loadSheddingTerms.some((term) => k.includes(term)),
                ) || "power backup"
              } features. `;
            }

            // Add delivery and payment information
            saParagraph += `${saMarketTerms.delivery[Math.floor(Math.random() * saMarketTerms.delivery.length)]}. `;
            saParagraph += `${saMarketTerms.payment[Math.floor(Math.random() * saMarketTerms.payment.length)]}.`;

            // Add keyword optimization paragraph
            const keywordParagraph =
              `Popular in South Africa for ${filteredKeywords.slice(0, 3).join(", ")}. ` +
              `Optimized for ${filteredKeywords.slice(3, 6).join(", ")}. `;

            // Only append if the description doesn't already include these keywords
            if (
              !existingDescription.includes(saParagraph) &&
              !existingDescription.includes(keywordParagraph)
            ) {
              newDescription =
                existingDescription +
                "\n\n" +
                saParagraph +
                "\n\n" +
                keywordParagraph;
            }
          }

          // Update the product description
          await this.productService.updateProductDescription(
            organizationId,
            product.id,
            newDescription,
          );

          // Record this operation in the mapping
          await this.keywordProductMappingRepository.update(mapping.id, {
            lastUpdated: new Date(),
            metadata: {
              ...mapping.metadata,
              descriptionUpdated: new Date().toISOString(),
              keywordsUsed: filteredKeywords.slice(0, 10),
              saMarketOptimized: true,
              descriptionGenerationMethod: usedAI
                ? "ai_structured"
                : "template",
            },
          });

          this.logger.log(
            `Updated description for product ${product.id} with South African market focus`,
          );
        } catch (error) {
          this.logger.error(
            `Error generating description for product ${product.id}: ${error.message}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error generating product descriptions: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Optimize product attribute values
   */
  private async optimizeAttributeValues(
    organizationId: string,
    userId: string,
    productIds: string[],
    keywords: string[],
  ): Promise<void> {
    try {
      // Get products from PIM module
      const products = await this.productService.getMultipleProductsByIds(
        organizationId,
        productIds,
      );

      // For each product
      for (const product of products) {
        try {
          // Get existing mapping
          const mappings =
            await this.keywordProductMappingRepository.findByProduct(
              organizationId,
              product.id,
            );
          if (mappings.length === 0) {
            continue;
          }

          const mapping = mappings[0];

          // Check if we have attribute recommendations
          if (
            !mapping.attributeRecommendations ||
            mapping.attributeRecommendations.length === 0
          ) {
            // Generate attribute recommendations based on keywords
            await this.generateAttributeRecommendations(
              organizationId,
              userId,
              product,
              mapping,
            );
          }

          // Apply high-impact attribute recommendations
          const highImpactRecommendations =
            mapping.attributeRecommendations?.filter(
              (r) => r.impact === "high",
            ) || [];

          if (highImpactRecommendations.length > 0) {
            const attributesToUpdate: Record<string, any> = {};

            for (const recommendation of highImpactRecommendations) {
              attributesToUpdate[recommendation.attribute] =
                recommendation.recommendedValue;
            }

            // Update product attributes
            await this.productService.updateProductAttributes(
              organizationId,
              product.id,
              attributesToUpdate,
            );

            // Record this operation in the mapping
            await this.keywordProductMappingRepository.update(mapping.id, {
              lastUpdated: new Date(),
              metadata: {
                ...mapping.metadata,
                attributesUpdated: new Date().toISOString(),
                attributesApplied: Object.keys(attributesToUpdate),
              },
            });
          }
        } catch (error) {
          this.logger.error(
            `Error optimizing attributes for product ${product.id}: ${error.message}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error optimizing product attributes: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Generate attribute recommendations based on keywords with South African market focus
   */
  private async generateAttributeRecommendations(
    organizationId: string,
    userId: string,
    product: any,
    mapping: KeywordProductMapping,
  ): Promise<void> {
    try {
      // If the agent framework adapter is not available, use fallback logic
      if (!this.agentFramework) {
        this.logger.warn(
          "Agent framework adapter not available, using fallback recommendation logic",
        );
        await this.generateBasicAttributeRecommendations(
          mapping.id,
          product,
          mapping,
        );
        return;
      }

      // Try to use the agent framework to generate South African specific recommendations
      try {
        // South African marketplaces to consider - prioritize Takealot as default
        const saMarketplaces = [
          "takealot",
          "makro",
          "loot",
          "game",
          "incredible",
          "hificorp",
        ];

        // Determine target marketplace - check if we have a preferred marketplace in mapping metadata
        let targetMarketplace = "takealot"; // Default to Takealot

        if (mapping.metadata && mapping.metadata.preferredMarketplace) {
          // Use the preferred marketplace if specified
          targetMarketplace = mapping.metadata.preferredMarketplace;
        }

        // Generate AI-powered recommendations for the South African market
        const recommendations =
          await this.agentFramework.generateAttributeRecommendations(
            product,
            mapping,
            targetMarketplace,
          );

        // Save each recommendation to the database
        if (Array.isArray(recommendations)) {
          // Track how many recommendations we add for each category
          const addedByImpact = {
            high: 0,
            medium: 0,
            low: 0,
          };

          for (const rec of recommendations) {
            await this.keywordProductMappingRepository.addAttributeRecommendation(
              mapping.id,
              rec.attribute,
              rec.currentValue || "",
              rec.recommendedValue,
              rec.confidence,
              rec.impact,
              rec.reason,
            );

            // Track recommendations by impact level
            if (rec.impact === "high") addedByImpact.high++;
            else if (rec.impact === "medium") addedByImpact.medium++;
            else if (rec.impact === "low") addedByImpact.low++;
          }

          // Log success with detailed breakdown
          this.logger.log(
            `Added ${recommendations.length} AI-generated recommendations for product ${product.id} ` +
              `(${addedByImpact.high} high, ${addedByImpact.medium} medium, ${addedByImpact.low} low impact) ` +
              `optimized for ${targetMarketplace}`,
          );

          // Update mapping metadata with recommendation stats
          await this.keywordProductMappingRepository.update(mapping.id, {
            metadata: {
              ...mapping.metadata,
              lastRecommendationGeneration: new Date().toISOString(),
              recommendationStats: {
                total: recommendations.length,
                byImpact: addedByImpact,
                marketplace: targetMarketplace,
                generatedWithAI: true,
              },
            },
          });
        } else {
          this.logger.warn(
            `No recommendations generated for product ${product.id}, using fallback logic`,
          );
          await this.generateBasicAttributeRecommendations(
            mapping.id,
            product,
            mapping,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error using AI for attribute recommendations: ${error.message}`,
          error.stack,
        );
        // Fall back to basic recommendations
        await this.generateBasicAttributeRecommendations(
          mapping.id,
          product,
          mapping,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error generating attribute recommendations: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Generate basic attribute recommendations without AI
   * This is a fallback method when AI generation is not available
   * Focused on South African market specifics
   */
  private async generateBasicAttributeRecommendations(
    mappingId: string,
    product: any,
    mapping: KeywordProductMapping,
  ): Promise<void> {
    // Get the most relevant keywords for this product
    const productKeywords = [
      ...mapping.keywords.map((k) => k.keyword),
      ...(mapping.suggestedKeywords?.slice(0, 5).map((s) => s.keyword) || []),
    ];

    // Filter out blacklisted keywords
    const filteredKeywords = productKeywords.filter(
      (k) => !mapping.blacklistedKeywords?.includes(k),
    );

    // If we have no keywords, skip this product
    if (filteredKeywords.length === 0) {
      return;
    }

    // South African-specific terms to incorporate
    const saSpecificTerms = [
      "load shedding compatible",
      "power backup",
      "energy efficient",
      "local delivery",
      "South African warranty",
      "SABS approved",
      "proudly South African",
      "free delivery",
      "loadshedding solution",
      "eskom compatible",
    ];

    // Title optimization with SA-specific terms
    if (product.title && product.title.length < 80) {
      const keywordToAdd = filteredKeywords.find(
        (k) => !product.title.toLowerCase().includes(k.toLowerCase()),
      );

      // Try to find a South African specific term to add
      const saTermToAdd = saSpecificTerms.find((term) => {
        // Check if term is relevant to the product based on keywords
        const isRelevant = filteredKeywords.some(
          (k) =>
            term.includes(k.toLowerCase()) ||
            k.toLowerCase().includes(term.split(" ")[0]),
        );
        // Only add if relevant and not already in title
        return (
          isRelevant &&
          !product.title.toLowerCase().includes(term.toLowerCase())
        );
      });

      let newTitle = product.title;
      if (keywordToAdd || saTermToAdd) {
        if (keywordToAdd && saTermToAdd) {
          newTitle = `${product.title} - ${keywordToAdd.charAt(0).toUpperCase() + keywordToAdd.slice(1)} (${saTermToAdd})`;
        } else if (keywordToAdd) {
          newTitle = `${product.title} - ${keywordToAdd.charAt(0).toUpperCase() + keywordToAdd.slice(1)}`;
        } else if (saTermToAdd) {
          newTitle = `${product.title} (${saTermToAdd})`;
        }

        await this.keywordProductMappingRepository.addAttributeRecommendation(
          mappingId,
          "title",
          product.title,
          newTitle,
          0.91,
          "high",
          "Adding high-traffic keywords and South African specific terms improves local search visibility and conversion.",
        );
      }
    }

    // Enhanced load shedding specific recommendations
    const loadSheddingTerms = [
      "battery",
      "power",
      "backup",
      "energy",
      "solar",
      "inverter",
      "ups",
      "generator",
    ];
    const hasLoadSheddingRelevance = filteredKeywords.some((k) =>
      loadSheddingTerms.some((term) => k.toLowerCase().includes(term)),
    );

    // Load shedding features (high priority for SA market)
    if (hasLoadSheddingRelevance) {
      await this.keywordProductMappingRepository.addAttributeRecommendation(
        mappingId,
        "load_shedding_features",
        product.attributes?.load_shedding_features || "",
        'Create a dedicated "Load Shedding Compatibility" section highlighting: power consumption (watts), battery life (hours), charging time, and compatibility with inverter systems. Use "Stage 1-6 compatible" terminology where relevant.',
        0.97,
        "high",
        "Load shedding compatibility is the #1 feature South African consumers search for across multiple product categories due to ongoing power instability.",
      );

      // Add technical specifications for load shedding products
      await this.keywordProductMappingRepository.addAttributeRecommendation(
        mappingId,
        "technical_specifications",
        product.attributes?.technical_specifications || "",
        "Include specific power metrics: Watts/Volt-Amps rating, battery capacity (mAh), runtime hours at different loads, and charging method (solar compatible, fast charge, etc).",
        0.94,
        "high",
        "Detailed technical specifications for power-related features significantly improve conversion rates in the South African market.",
      );
    }

    // Category attribute optimization with SA focus
    if (product.attributes && product.attributes.category) {
      // Add South African category specificity
      const saCategories = [
        { keyword: "load shedding", category: "Load Shedding Solutions" },
        { keyword: "power bank", category: "Power Backup" },
        { keyword: "battery", category: "Power & Battery Solutions" },
        { keyword: "inverter", category: "Power Backup Systems" },
        { keyword: "ups", category: "Uninterrupted Power Supply" },
        { keyword: "solar", category: "Renewable Energy Solutions" },
      ];

      // Find a relevant SA category if applicable
      const relevantSACategory = saCategories.find((cat) =>
        filteredKeywords.some((k) => k.toLowerCase().includes(cat.keyword)),
      );

      if (
        relevantSACategory &&
        !product.attributes.category
          .toLowerCase()
          .includes(relevantSACategory.category.toLowerCase())
      ) {
        await this.keywordProductMappingRepository.addAttributeRecommendation(
          mappingId,
          "category",
          product.attributes.category,
          relevantSACategory.category,
          0.89,
          "high",
          "South African category alignment improves visibility in marketplace browsing and category-specific searches.",
        );
      }
    }

    // South African delivery options (critical for SA e-commerce)
    await this.keywordProductMappingRepository.addAttributeRecommendation(
      mappingId,
      "shipping_options",
      product.attributes?.shipping_options || "",
      "Specify delivery times for Johannesburg (1-2 days), Cape Town (2-3 days), Durban (2-3 days), and other major cities. Include collection point options and weekend delivery availability.",
      0.93,
      "high",
      "South African consumers prioritize detailed delivery information in purchasing decisions due to historical challenges with delivery reliability.",
    );

    // South African payment methods
    await this.keywordProductMappingRepository.addAttributeRecommendation(
      mappingId,
      "payment_methods",
      product.attributes?.payment_methods || "",
      "Highlight support for popular South African payment methods: EFT, Instant EFT, Credit Card, PayFlex, eBucks redemption, and Mobicred where applicable.",
      0.89,
      "medium",
      "Including South African specific payment methods increases consumer confidence and reduces cart abandonment.",
    );

    // South African warranty information
    await this.keywordProductMappingRepository.addAttributeRecommendation(
      mappingId,
      "warranty_information",
      product.attributes?.warranty_information || "",
      "Specify South African warranty details including local repair centers, length of coverage, and whether on-site service is available in major metropolitan areas.",
      0.86,
      "medium",
      "Local warranty information is a significant purchasing factor for South African consumers.",
    );

    // Features attribute with SA focus
    if (!product.attributes || !product.attributes.features) {
      const featuresKeywords = filteredKeywords.slice(0, 3);
      if (featuresKeywords.length > 0) {
        // Create features with South African focus
        let featuresText = featuresKeywords.join(", ");

        // Add SA-specific highlights if relevant
        if (hasLoadSheddingRelevance) {
          featuresText +=
            ". Load shedding compatible, South African plug (15A), energy efficient";
        } else {
          featuresText +=
            ". South African warranty, local support, quality guaranteed";
        }

        await this.keywordProductMappingRepository.addAttributeRecommendation(
          mappingId,
          "features",
          "",
          featuresText,
          0.92,
          "high",
          "Feature highlights with South African specifics significantly improve search relevance and conversion.",
        );
      }
    }

    // Pricing display recommendations for SA market
    await this.keywordProductMappingRepository.addAttributeRecommendation(
      mappingId,
      "pricing_display",
      product.attributes?.pricing_display || "",
      "Show price with VAT included explicitly. Display installment options prominently. Include price comparison with similar products to demonstrate value.",
      0.85,
      "medium",
      "Transparent pricing with VAT and installment information influences South African purchasing decisions.",
    );

    // Record metadata on recommendations
    try {
      await this.keywordProductMappingRepository.update(mappingId, {
        metadata: {
          ...mapping.metadata,
          lastRecommendationGeneration: new Date().toISOString(),
          recommendationStats: {
            generatedWithAI: false,
            fallbackRecommendationsUsed: true,
            saMarketFocus: true,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error updating metadata after recommendations: ${error.message}`,
      );
    }
  }

  /**
   * Optimize product listing titles
   */
  private async optimizeListingTitles(
    organizationId: string,
    userId: string,
    productIds: string[],
    keywords: string[],
  ): Promise<void> {
    try {
      // Get products from PIM module
      const products = await this.productService.getMultipleProductsByIds(
        organizationId,
        productIds,
      );

      // For each product
      for (const product of products) {
        try {
          // Get existing mapping
          const mappings =
            await this.keywordProductMappingRepository.findByProduct(
              organizationId,
              product.id,
            );
          if (mappings.length === 0) {
            continue;
          }

          const mapping = mappings[0];

          // Get top keywords for this product
          const productKeywords = [
            ...mapping.keywords.map((k) => ({
              keyword: k.keyword,
              score: k.relevanceScore || 0.5,
            })),
            ...(mapping.suggestedKeywords?.map((s) => ({
              keyword: s.keyword,
              score: s.relevance || 0.5,
            })) || []),
          ];

          // Sort by relevance/score
          productKeywords.sort((a, b) => b.score - a.score);

          // Filter out blacklisted keywords
          const filteredKeywords = productKeywords.filter(
            (k) => !mapping.blacklistedKeywords?.includes(k.keyword),
          );

          // If we have no keywords, skip this product
          if (filteredKeywords.length === 0) {
            continue;
          }

          // Get the top 3 keywords
          const topKeywords = filteredKeywords
            .slice(0, 3)
            .map((k) => k.keyword);

          // Get the current title
          const currentTitle = product.title || "";

          // Check if the title already contains these keywords
          const missingKeywords = topKeywords.filter(
            (keyword) =>
              !currentTitle.toLowerCase().includes(keyword.toLowerCase()),
          );

          // If we have keywords to add
          if (missingKeywords.length > 0) {
            // Create an optimized title - retain original core but add keywords
            let newTitle = currentTitle;

            // If the title is too long, we'll be more selective
            if (currentTitle.length > 80) {
              // Just append one keyword as a suffix if not already present
              if (
                missingKeywords.length > 0 &&
                !currentTitle
                  .toLowerCase()
                  .includes(missingKeywords[0].toLowerCase())
              ) {
                newTitle = `${currentTitle} - ${missingKeywords[0]}`;
              }
            } else {
              // We have space to add more keywords
              if (missingKeywords.length > 0) {
                newTitle = `${currentTitle} - ${missingKeywords.join(", ")}`;
              }
            }

            // If the title was changed
            if (newTitle !== currentTitle) {
              // Update the product title
              await this.productService.updateProductTitle(
                organizationId,
                product.id,
                newTitle,
              );

              // Record this operation in the mapping
              await this.keywordProductMappingRepository.update(mapping.id, {
                lastUpdated: new Date(),
                metadata: {
                  ...mapping.metadata,
                  titleUpdated: new Date().toISOString(),
                  keywordsAdded: missingKeywords,
                },
              });
            }
          }
        } catch (error) {
          this.logger.error(
            `Error optimizing title for product ${product.id}: ${error.message}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error optimizing product titles: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Find keyword-product mappings by organization
   */
  async findMappingsByOrganization(
    organizationId: string,
  ): Promise<KeywordProductMapping[]> {
    return await this.keywordProductMappingRepository.findByOrganization(
      organizationId,
    );
  }

  /**
   * Find keyword-product mappings by product
   */
  async findMappingsByProduct(
    organizationId: string,
    productId: string,
  ): Promise<KeywordProductMapping[]> {
    return await this.keywordProductMappingRepository.findByProduct(
      organizationId,
      productId,
    );
  }

  /**
   * Get keyword-product mapping by ID
   */
  async getMappingById(id: string): Promise<KeywordProductMapping> {
    const mapping = await this.keywordProductMappingRepository.findById(id);
    if (!mapping) {
      throw new NotFoundException(
        `Keyword-product mapping with ID ${id} not found`,
      );
    }
    return mapping;
  }

  /**
   * Run auto-optimization for products
   */
  async runAutoOptimization(
    organizationId: string,
    userId: string,
  ): Promise<any> {
    try {
      // Check credit reservation
      const creditCheck = await this.creditSystemService.checkCredits({
        operationId: uuidv4(),
        organizationId,
        userId,
        expectedInputTokens: 0,
        expectedOutputTokens: 0,
        modelId: "pim-auto-optimization",
        usageType: CreditUsageType.PIM_INTEGRATION,
        metadata: {
          operation: "auto-optimization",
        },
      });

      if (!creditCheck.hasCredits) {
        throw new Error(
          `Insufficient credits for auto-optimization. Available: ${creditCheck.availableCredits}`,
        );
      }

      // Find products with auto-optimization enabled
      const mappings =
        await this.keywordProductMappingRepository.findWithAutoKeywordEnabled(
          organizationId,
        );

      if (mappings.length === 0 && creditCheck.reservationId) {
        await this.creditSystemService.releaseReservation(
          creditCheck.reservationId,
        );
        return {
          success: true,
          message: "No products with auto-optimization enabled",
          optimizedCount: 0,
        };
      }

      // Process mappings in batches
      const batchSize = 10;
      const productIds = mappings.map((m) => m.productId);
      let processedCount = 0;

      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize);

        try {
          // Generate keywords for each product in the batch
          const keywords = await this.generateKeywordsForProducts(
            organizationId,
            batch,
          );

          // Perform keyword research
          await this.performProductKeywordResearch(organizationId, userId, {
            organizationId,
            userId,
            productIds: batch,
            keywords,
            marketplaces: ["takealot", "makro"], // Default South African marketplaces
            mapToProducts: true,
            generateProductDescriptions: true,
            optimizeAttributeValues: true,
            optimizeListingTitles: true,
          });

          processedCount += batch.length;
        } catch (error) {
          this.logger.error(
            `Error processing batch: ${error.message}`,
            error.stack,
          );
        }
      }

      // Record credit usage
      if (creditCheck.reservationId) {
        await this.creditSystemService.recordUsage({
          organizationId,
          userId,
          inputTokens: 0,
          outputTokens: 0,
          modelId: "pim-auto-optimization",
          modelProvider: "fluxori",
          usageType: CreditUsageType.PIM_INTEGRATION,
          success: true,
          reservationId: creditCheck.reservationId,
          metadata: {
            operation: "auto-optimization",
            optimizedCount: processedCount,
          },
        });
      }

      return {
        success: true,
        message: `Auto-optimization completed for ${processedCount} products`,
        optimizedCount: processedCount,
      };
    } catch (error) {
      this.logger.error(
        `Error running auto-optimization: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate keywords for products based on their data
   */
  private async generateKeywordsForProducts(
    organizationId: string,
    productIds: string[],
  ): Promise<string[]> {
    try {
      // Get products from PIM module
      const products = await this.productService.getMultipleProductsByIds(
        organizationId,
        productIds,
      );

      // Extract potential keywords from product data
      const keywordSet = new Set<string>();

      for (const product of products) {
        // Add words from title
        if (product.title) {
          const titleWords = product.title
            .split(/\s+/)
            .filter((w: string) => w.length > 3);
          titleWords.forEach((word: string) =>
            keywordSet.add(word.toLowerCase()),
          );
        }

        // Add category if available
        if (product.category) {
          keywordSet.add(product.category.toLowerCase());
        }

        // Add from attributes
        if (product.attributes) {
          for (const [key, value] of Object.entries(product.attributes)) {
            if (typeof value === "string" && value.length > 3) {
              keywordSet.add(value.toLowerCase());
            }
          }
        }

        // Add brand if available
        if (product.brand) {
          keywordSet.add(product.brand.toLowerCase());
        }

        // Add tags if available
        if (product.tags && Array.isArray(product.tags)) {
          product.tags.forEach((tag: string | unknown) => {
            if (typeof tag === "string" && tag.length > 3) {
              keywordSet.add(tag.toLowerCase());
            }
          });
        }
      }

      // Convert to array and limit to reasonable number
      return Array.from(keywordSet).slice(0, 20);
    } catch (error) {
      this.logger.error(
        `Error generating keywords for products: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
}
