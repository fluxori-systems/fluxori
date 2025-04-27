import { Injectable, Logger } from "@nestjs/common";
import {
  PricingRule,
  PricingRuleOperation,
  PricingRuleExecutionStatus,
  PricingRuleScheduleType,
} from "../models/pricing-rule.model";
import { PricingRuleRepository } from "../repositories/pricing-rule.repository";
import { ProductService } from "./product.service";
import { CategoryService } from "./category.service";
import { LoadSheddingResilienceService } from "./load-shedding-resilience.service";
import { MarketContextService } from "./market-context.service";
import { Product } from "../models/product.model";
import { v4 as uuidv4 } from "uuid";

/**
 * Price calculation result
 */
interface PriceCalculationResult {
  /**
   * Original product price before rule application
   */
  originalPrice: number;

  /**
   * Final price after rule application
   */
  finalPrice: number;

  /**
   * Amount of price change (negative for discounts, positive for markups)
   */
  priceChange: number;

  /**
   * Rules applied to calculate the price
   */
  appliedRules: Array<{
    ruleId: string;
    ruleName: string;
    operation: PricingRuleOperation;
    value: number | string;
    resultPrice: number;
    priceChange: number;
  }>;

  /**
   * Rules that were evaluated but not applied (e.g., due to constraints)
   */
  skippedRules?: Array<{
    ruleId: string;
    ruleName: string;
    reason: string;
  }>;

  /**
   * Detailed calculation steps for debugging
   */
  calculationDetails?: Record<string, any>;
}

/**
 * Price update batch for updating multiple product prices
 */
interface PriceUpdateBatch {
  /**
   * Batch ID
   */
  id: string;

  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Products to update
   */
  products: Array<{
    productId: string;
    calculationResult: PriceCalculationResult;
  }>;

  /**
   * Rules applied in this batch
   */
  appliedRules: string[];

  /**
   * Start time of the batch
   */
  startTime: Date;

  /**
   * Rules applied by product ID
   */
  rulesByProduct: Record<string, string[]>;
}

/**
 * Dynamic pricing service
 * Manages pricing rules and price calculations
 */
@Injectable()
export class DynamicPricingService {
  private readonly logger = new Logger(DynamicPricingService.name);

  constructor(
    private readonly pricingRuleRepository: PricingRuleRepository,
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly loadSheddingService: LoadSheddingResilienceService,
    private readonly marketContextService: MarketContextService,
  ) {}

  /**
   * Create a new pricing rule
   * @param rule Rule data
   * @param organizationId Organization ID
   * @param userId User ID
   */
  async createPricingRule(
    rule: Omit<
      PricingRule,
      "id" | "createdAt" | "updatedAt" | "recentExecutions" | "executionStats"
    >,
    organizationId: string,
    userId: string,
  ): Promise<PricingRule> {
    try {
      this.logger.log(`Creating pricing rule: ${rule.name}`);

      // Create rule with initial values
      const newRule: PricingRule = {
        ...rule,
        organizationId,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        recentExecutions: [],
        executionStats: {
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
        },
      };

      // Save rule
      const savedRule = await this.pricingRuleRepository.create(newRule);

      this.logger.log(`Created pricing rule with ID: ${savedRule.id}`);

      return savedRule;
    } catch (error) {
      this.logger.error(
        `Error creating pricing rule: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update an existing pricing rule
   * @param ruleId Rule ID
   * @param updates Rule updates
   * @param organizationId Organization ID
   * @param userId User ID
   */
  async updatePricingRule(
    ruleId: string,
    updates: Partial<
      Omit<
        PricingRule,
        "id" | "createdAt" | "updatedAt" | "recentExecutions" | "executionStats"
      >
    >,
    organizationId: string,
    userId: string,
  ): Promise<PricingRule> {
    try {
      this.logger.log(`Updating pricing rule: ${ruleId}`);

      // Get existing rule
      const existingRule = await this.pricingRuleRepository.findById(ruleId);
      if (!existingRule || existingRule.organizationId !== organizationId) {
        throw new Error(`Pricing rule not found with ID: ${ruleId}`);
      }

      // Update rule
      const updatedRule = await this.pricingRuleRepository.update(ruleId, {
        ...existingRule,
        ...updates,
        updatedBy: userId,
        updatedAt: new Date(),
      });

      this.logger.log(`Updated pricing rule with ID: ${ruleId}`);

      return updatedRule;
    } catch (error) {
      this.logger.error(
        `Error updating pricing rule: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete a pricing rule
   * @param ruleId Rule ID
   * @param organizationId Organization ID
   */
  async deletePricingRule(
    ruleId: string,
    organizationId: string,
  ): Promise<void> {
    try {
      this.logger.log(`Deleting pricing rule: ${ruleId}`);

      // Get existing rule
      const existingRule = await this.pricingRuleRepository.findById(ruleId);
      if (!existingRule || existingRule.organizationId !== organizationId) {
        throw new Error(`Pricing rule not found with ID: ${ruleId}`);
      }

      // Delete rule
      await this.pricingRuleRepository.delete(ruleId);

      this.logger.log(`Deleted pricing rule with ID: ${ruleId}`);
    } catch (error) {
      this.logger.error(
        `Error deleting pricing rule: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get a pricing rule by ID
   * @param ruleId Rule ID
   * @param organizationId Organization ID
   */
  async getPricingRule(
    ruleId: string,
    organizationId: string,
  ): Promise<PricingRule | null> {
    try {
      const rule = await this.pricingRuleRepository.findById(ruleId);

      if (!rule || rule.organizationId !== organizationId) {
        return null;
      }

      return rule;
    } catch (error) {
      this.logger.error(
        `Error getting pricing rule: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get all pricing rules for an organization
   * @param organizationId Organization ID
   * @param options Query options
   */
  async getAllPricingRules(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      isActive?: boolean;
    },
  ): Promise<PricingRule[]> {
    try {
      // Set default options
      const limit = options?.limit || 100;
      const offset = options?.offset || 0;

      // Create query params
      const queryParams: any = {
        where: [
          { field: "organizationId", operator: "==", value: organizationId },
        ],
        orderBy: [{ field: "priority", direction: "asc" }],
        limit,
        offset,
      };

      // Add active filter if specified
      if (options?.isActive !== undefined) {
        queryParams.where.push({
          field: "isActive",
          operator: "==",
          value: options.isActive,
        });
      }

      // Query rules
      const rules = await this.pricingRuleRepository.query(queryParams);

      return rules;
    } catch (error) {
      this.logger.error(
        `Error getting pricing rules: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculate product price based on pricing rules
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param options Calculation options
   */
  async calculateProductPrice(
    productId: string,
    organizationId: string,
    options?: {
      marketCode?: string;
      channelCode?: string;
      currencyCode?: string;
      referenceDate?: Date;
    },
  ): Promise<PriceCalculationResult> {
    try {
      this.logger.log(`Calculating price for product: ${productId}`);

      // Get product
      const product = await this.productService.findById(
        productId,
        organizationId,
      );
      if (!product) {
        throw new Error(`Product not found with ID: ${productId}`);
      }

      // Check if product has a price
      if (!product.price && product.price !== 0) {
        throw new Error(`Product ${productId} does not have a base price`);
      }

      // Get load shedding status for optimization
      const loadSheddingStatus =
        await this.loadSheddingService.getCurrentStatus();
      const isLightweightMode = loadSheddingStatus.currentStage > 4;

      // Apply simplified calculation during severe load shedding
      if (isLightweightMode) {
        return this.calculateSimplifiedPrice(product, organizationId, options);
      }

      // Get active rules for this product
      const activeRules = await this.findApplicableRules(
        product,
        organizationId,
        options,
      );

      // Calculate price using all applicable rules
      return await this.calculatePriceWithRules(product, activeRules, options);
    } catch (error) {
      this.logger.error(
        `Error calculating product price: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculate prices for multiple products
   * @param productIds Product IDs
   * @param organizationId Organization ID
   * @param options Calculation options
   */
  async calculateBatchPrices(
    productIds: string[],
    organizationId: string,
    options?: {
      marketCode?: string;
      channelCode?: string;
      currencyCode?: string;
      referenceDate?: Date;
      updatePrices?: boolean;
      userId?: string;
    },
  ): Promise<PriceUpdateBatch> {
    try {
      this.logger.log(
        `Calculating batch prices for ${productIds.length} products`,
      );

      // Create batch ID
      const batchId = uuidv4();

      // Create batch
      const batch: PriceUpdateBatch = {
        id: batchId,
        organizationId,
        products: [],
        appliedRules: [],
        startTime: new Date(),
        rulesByProduct: {},
      };

      // Get load shedding status for optimization
      const loadSheddingStatus =
        await this.loadSheddingService.getCurrentStatus();
      const isLightweightMode = loadSheddingStatus.currentStage > 4;

      // Get products
      const products = await Promise.all(
        productIds.map((id) =>
          this.productService.findById(id, organizationId),
        ),
      );

      // Filter out invalid products
      const validProducts = products.filter(
        (p) => p !== null && (p.price !== undefined || p.price === 0),
      ) as Product[];

      // Process each product using resilient execution
      await Promise.all(
        validProducts.map(async (product) => {
          try {
            let calculationResult: PriceCalculationResult;

            // Use lightweight calculation during severe load shedding
            if (isLightweightMode) {
              calculationResult = await this.calculateSimplifiedPrice(
                product,
                organizationId,
                options,
              );
            } else {
              // Get applicable rules
              const activeRules = await this.findApplicableRules(
                product,
                organizationId,
                options,
              );

              // Calculate price
              calculationResult = await this.calculatePriceWithRules(
                product,
                activeRules,
                options,
              );

              // Record applied rules
              batch.rulesByProduct[product.id] =
                calculationResult.appliedRules.map((r) => r.ruleId);

              // Add to overall applied rules list (deduplicated)
              calculationResult.appliedRules.forEach((rule) => {
                if (!batch.appliedRules.includes(rule.ruleId)) {
                  batch.appliedRules.push(rule.ruleId);
                }
              });
            }

            // Add to batch
            batch.products.push({
              productId: product.id,
              calculationResult,
            });

            // Update product price if requested
            if (options?.updatePrices) {
              await this.productService.update(
                product.id,
                { price: calculationResult.finalPrice },
                organizationId,
              );
            }
          } catch (error) {
            this.logger.error(
              `Error processing product ${product.id}: ${error.message}`,
            );
            // Continue with other products
          }
        }),
      );

      this.logger.log(
        `Processed ${batch.products.length} products in batch ${batchId}`,
      );

      // Record rule executions
      if (options?.updatePrices && options?.userId) {
        await this.recordRuleExecutions(batch, options.userId);
      }

      return batch;
    } catch (error) {
      this.logger.error(
        `Error calculating batch prices: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Execute a pricing rule
   * @param ruleId Rule ID
   * @param organizationId Organization ID
   * @param options Execution options
   */
  async executePricingRule(
    ruleId: string,
    organizationId: string,
    options?: {
      dryRun?: boolean;
      userId?: string;
      limit?: number;
    },
  ): Promise<{
    executionId: string;
    productsAffected: number;
    priceChanges: Array<{
      productId: string;
      productName: string;
      originalPrice: number;
      newPrice: number;
      priceChange: number;
      priceChangePercentage: number;
    }>;
    status: PricingRuleExecutionStatus;
    error?: string;
  }> {
    try {
      this.logger.log(`Executing pricing rule: ${ruleId}`);

      // Get rule
      const rule = await this.pricingRuleRepository.findById(ruleId);
      if (!rule || rule.organizationId !== organizationId) {
        throw new Error(`Pricing rule not found with ID: ${ruleId}`);
      }

      // Check if rule is active
      if (!rule.isActive) {
        throw new Error(`Pricing rule ${ruleId} is not active`);
      }

      // Create execution ID
      const executionId = uuidv4();

      // Execution start time
      const startTime = new Date();

      // Create execution record
      const execution = {
        id: executionId,
        startTime,
        status: PricingRuleExecutionStatus.IN_PROGRESS,
        productsAffected: 0,
        triggeredBy: options?.userId,
      };

      // Record execution start
      await this.pricingRuleRepository.addExecution(ruleId, execution);

      // Find products that match the rule scope
      const productsQuery: any = {
        where: [
          { field: "organizationId", operator: "==", value: organizationId },
        ],
        limit: options?.limit || 1000,
      };

      // Add category filter if specified
      if (rule.scope.categoryIds && rule.scope.categoryIds.length > 0) {
        productsQuery.where.push({
          field: "categoryId",
          operator: "in",
          value: rule.scope.categoryIds,
        });
      }

      // Add product type filter if specified
      if (rule.scope.productTypes && rule.scope.productTypes.length > 0) {
        productsQuery.where.push({
          field: "type",
          operator: "in",
          value: rule.scope.productTypes,
        });
      }

      // Query products
      let products: Product[] = [];

      if (rule.scope.productIds && rule.scope.productIds.length > 0) {
        // If specific product IDs are provided, fetch those directly
        products = (
          await Promise.all(
            rule.scope.productIds.map((id) =>
              this.productService.findById(id, organizationId),
            ),
          )
        ).filter((p) => p !== null) as Product[];
      } else if (rule.scope.applyToAll) {
        // If apply to all, get all products for the organization
        products = await this.productService.findAll({
          organizationId,
          limit: options?.limit || 1000,
        });
      } else {
        // Otherwise use the query we built
        products = await this.productService.findAll(productsQuery);
      }

      // Filter products by attribute filters if specified
      if (
        rule.scope.attributeFilters &&
        Object.keys(rule.scope.attributeFilters).length > 0
      ) {
        products = products.filter((product) => {
          if (!product.attributes) return false;

          // Check if all attribute filters match
          return Object.entries(rule.scope.attributeFilters).every(
            ([key, value]) => {
              return product.attributes[key] === value;
            },
          );
        });
      }

      // Calculate new prices
      const priceChanges = await Promise.all(
        products.map(async (product) => {
          try {
            // Calculate price using just this rule
            const calculationResult = await this.calculatePriceWithSingleRule(
              product,
              rule,
              {
                marketCode: rule.markets?.[0],
                channelCode: rule.channels?.[0],
                currencyCode: rule.currencyCode,
              },
            );

            // Only include products with price changes
            if (
              calculationResult.finalPrice !== calculationResult.originalPrice
            ) {
              const priceChange =
                calculationResult.finalPrice - calculationResult.originalPrice;
              const priceChangePercentage =
                (priceChange / calculationResult.originalPrice) * 100;

              return {
                productId: product.id,
                productName: product.name,
                originalPrice: calculationResult.originalPrice,
                newPrice: calculationResult.finalPrice,
                priceChange,
                priceChangePercentage,
              };
            }

            return null;
          } catch (error) {
            this.logger.warn(
              `Error calculating price for product ${product.id}: ${error.message}`,
            );
            return null;
          }
        }),
      );

      // Filter out null results and sort by price change percentage
      const validPriceChanges = priceChanges
        .filter((change) => change !== null)
        .sort(
          (a, b) =>
            Math.abs(b!.priceChangePercentage) -
            Math.abs(a!.priceChangePercentage),
        ) as Array<{
        productId: string;
        productName: string;
        originalPrice: number;
        newPrice: number;
        priceChange: number;
        priceChangePercentage: number;
      }>;

      // Update product prices if not a dry run
      if (!options?.dryRun && validPriceChanges.length > 0) {
        await Promise.all(
          validPriceChanges.map((change) =>
            this.productService.update(
              change.productId,
              { price: change.newPrice },
              organizationId,
            ),
          ),
        );
      }

      // Update execution record
      const endTime = new Date();
      const updatedExecution = {
        ...execution,
        endTime,
        status: PricingRuleExecutionStatus.COMPLETED,
        productsAffected: validPriceChanges.length,
      };

      // Record execution completion
      await this.pricingRuleRepository.addExecution(ruleId, updatedExecution);

      return {
        executionId,
        productsAffected: validPriceChanges.length,
        priceChanges: validPriceChanges,
        status: PricingRuleExecutionStatus.COMPLETED,
      };
    } catch (error) {
      this.logger.error(
        `Error executing pricing rule: ${error.message}`,
        error.stack,
      );

      // Record execution failure if we have the rule ID
      try {
        if (error.message.indexOf("Pricing rule not found") === -1) {
          const failedExecution = {
            id: uuidv4(),
            startTime: new Date(),
            endTime: new Date(),
            status: PricingRuleExecutionStatus.FAILED,
            productsAffected: 0,
            error: error.message,
            triggeredBy: options?.userId,
          };

          await this.pricingRuleRepository.addExecution(
            ruleId,
            failedExecution,
          );
        }
      } catch (recordError) {
        this.logger.error(
          `Error recording execution failure: ${recordError.message}`,
        );
      }

      throw error;
    }
  }

  /**
   * Schedule pricing rules for automated execution
   * @param options Schedule options
   */
  async schedulePricingRules(options?: {
    date?: Date;
    organizationId?: string;
  }): Promise<{
    scheduledRules: number;
    executedRules: number;
    failedRules: number;
    executionDetails: Array<{
      ruleId: string;
      ruleName: string;
      status: PricingRuleExecutionStatus;
      productsAffected: number;
      error?: string;
    }>;
  }> {
    try {
      this.logger.log("Scheduling pricing rules for execution");

      const now = options?.date || new Date();

      // Find rules due for execution
      const alwaysRules = await this.pricingRuleRepository.findRulesBySchedule(
        PricingRuleScheduleType.ALWAYS,
        now,
        now,
        options?.organizationId,
      );

      const onceRules = await this.pricingRuleRepository.findRulesBySchedule(
        PricingRuleScheduleType.ONCE,
        now,
        now,
        options?.organizationId,
      );

      const recurringRules =
        await this.pricingRuleRepository.findRulesBySchedule(
          PricingRuleScheduleType.RECURRING,
          now,
          now,
          options?.organizationId,
        );

      // Filter recurring rules by day of week and time
      const filteredRecurringRules = recurringRules.filter((rule) => {
        // Check day of week
        const dayOfWeek = now.getDay();
        if (
          rule.schedule.daysOfWeek &&
          !rule.schedule.daysOfWeek.includes(dayOfWeek)
        ) {
          return false;
        }

        // Check time of day
        if (rule.schedule.timeOfDay) {
          const hour = now.getHours();
          const minute = now.getMinutes();

          const ruleHour = rule.schedule.timeOfDay.hour;
          const ruleMinute = rule.schedule.timeOfDay.minute;

          // Allow a 5-minute window for execution
          if (hour !== ruleHour || Math.abs(minute - ruleMinute) > 5) {
            return false;
          }
        }

        // Check interval
        if (rule.schedule.intervalMinutes) {
          // Check if the last execution was within the interval
          const lastExecution = rule.executionStats?.lastExecutionTime;
          if (lastExecution) {
            const minutesSinceLastExecution = Math.floor(
              (now.getTime() - lastExecution.getTime()) / (1000 * 60),
            );

            if (minutesSinceLastExecution < rule.schedule.intervalMinutes) {
              return false;
            }
          }
        }

        return true;
      });

      // Combine all rules
      const allRules = [
        ...alwaysRules,
        ...onceRules,
        ...filteredRecurringRules,
      ];

      // Execute rules
      const executionDetails = await Promise.all(
        allRules.map(async (rule) => {
          try {
            const result = await this.executePricingRule(
              rule.id!,
              rule.organizationId,
              {
                userId: "system",
              },
            );

            return {
              ruleId: rule.id!,
              ruleName: rule.name,
              status: result.status,
              productsAffected: result.productsAffected,
            };
          } catch (error) {
            this.logger.error(
              `Error executing rule ${rule.id}: ${error.message}`,
            );

            return {
              ruleId: rule.id!,
              ruleName: rule.name,
              status: PricingRuleExecutionStatus.FAILED,
              productsAffected: 0,
              error: error.message,
            };
          }
        }),
      );

      // Count results
      const executedRules = executionDetails.filter(
        (d) => d.status === PricingRuleExecutionStatus.COMPLETED,
      ).length;

      const failedRules = executionDetails.filter(
        (d) => d.status === PricingRuleExecutionStatus.FAILED,
      ).length;

      return {
        scheduledRules: allRules.length,
        executedRules,
        failedRules,
        executionDetails,
      };
    } catch (error) {
      this.logger.error(
        `Error scheduling pricing rules: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find applicable pricing rules for a product
   * @param product Product
   * @param organizationId Organization ID
   * @param options Query options
   */
  private async findApplicableRules(
    product: Product,
    organizationId: string,
    options?: {
      marketCode?: string;
      channelCode?: string;
      currencyCode?: string;
      referenceDate?: Date;
    },
  ): Promise<PricingRule[]> {
    try {
      // Get all active rules for the organization
      const allRules =
        await this.pricingRuleRepository.findActiveRulesByOrganization(
          organizationId,
          { productId: product.id, categoryId: product.categoryId },
        );

      // Reference date
      const referenceDate = options?.referenceDate || new Date();

      // Filter rules by date range
      const dateFilteredRules = allRules.filter((rule) => {
        // Always type should always apply
        if (rule.schedule.type === PricingRuleScheduleType.ALWAYS) {
          return true;
        }

        // Check date range
        const startDate = rule.schedule.startDate || new Date(0);
        const endDate = rule.schedule.endDate || new Date(8640000000000000);

        return startDate <= referenceDate && endDate >= referenceDate;
      });

      // Filter by market, channel, and currency
      return dateFilteredRules.filter((rule) => {
        // Check market
        if (rule.markets && rule.markets.length > 0) {
          if (
            !options?.marketCode ||
            !rule.markets.includes(options.marketCode)
          ) {
            return false;
          }
        }

        // Check channel
        if (rule.channels && rule.channels.length > 0) {
          if (
            !options?.channelCode ||
            !rule.channels.includes(options.channelCode)
          ) {
            return false;
          }
        }

        // Check currency
        if (rule.currencyCode) {
          if (
            !options?.currencyCode ||
            rule.currencyCode !== options.currencyCode
          ) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      this.logger.error(
        `Error finding applicable rules: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculate price using all applicable rules
   * @param product Product
   * @param rules Applicable rules
   * @param options Calculation options
   */
  private async calculatePriceWithRules(
    product: Product,
    rules: PricingRule[],
    options?: {
      marketCode?: string;
      channelCode?: string;
      currencyCode?: string;
      referenceDate?: Date;
    },
  ): Promise<PriceCalculationResult> {
    try {
      // Get original price
      const originalPrice = this.getBasePrice(
        product,
        options?.marketCode,
        options?.currencyCode,
      );

      // Sort rules by priority
      const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

      // Initial result
      const result: PriceCalculationResult = {
        originalPrice,
        finalPrice: originalPrice,
        priceChange: 0,
        appliedRules: [],
        skippedRules: [],
        calculationDetails: {
          steps: [],
        },
      };

      // Process each rule in priority order
      let currentPrice = originalPrice;

      for (const rule of sortedRules) {
        try {
          // Apply rule to current price
          const ruleResult = await this.applyPricingRule(
            rule,
            product,
            currentPrice,
            options,
          );

          // Check if rule was applied
          if (ruleResult.applied) {
            currentPrice = ruleResult.price;

            // Add to applied rules
            result.appliedRules.push({
              ruleId: rule.id!,
              ruleName: rule.name,
              operation: rule.operation,
              value: rule.value,
              resultPrice: ruleResult.price,
              priceChange: ruleResult.price - result.finalPrice,
            });

            // Add to calculation steps
            result.calculationDetails.steps.push({
              ruleId: rule.id,
              ruleName: rule.name,
              operation: rule.operation,
              value: rule.value,
              inputPrice: result.finalPrice,
              outputPrice: ruleResult.price,
              priceChange: ruleResult.price - result.finalPrice,
            });

            // Update final price
            result.finalPrice = ruleResult.price;
          } else {
            // Add to skipped rules
            result.skippedRules.push({
              ruleId: rule.id!,
              ruleName: rule.name,
              reason: ruleResult.reason || "Unknown",
            });
          }
        } catch (error) {
          this.logger.warn(
            `Error applying rule ${rule.id} to product ${product.id}: ${error.message}`,
          );

          // Add to skipped rules
          result.skippedRules.push({
            ruleId: rule.id!,
            ruleName: rule.name,
            reason: `Error: ${error.message}`,
          });
        }
      }

      // Calculate total price change
      result.priceChange = result.finalPrice - originalPrice;

      return result;
    } catch (error) {
      this.logger.error(
        `Error calculating price with rules: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculate price using a single rule
   * @param product Product
   * @param rule Pricing rule
   * @param options Calculation options
   */
  private async calculatePriceWithSingleRule(
    product: Product,
    rule: PricingRule,
    options?: {
      marketCode?: string;
      channelCode?: string;
      currencyCode?: string;
    },
  ): Promise<PriceCalculationResult> {
    try {
      // Get original price
      const originalPrice = this.getBasePrice(
        product,
        options?.marketCode,
        options?.currencyCode,
      );

      // Apply rule
      const ruleResult = await this.applyPricingRule(
        rule,
        product,
        originalPrice,
        options,
      );

      // Create result
      const result: PriceCalculationResult = {
        originalPrice,
        finalPrice: ruleResult.applied ? ruleResult.price : originalPrice,
        priceChange: ruleResult.applied ? ruleResult.price - originalPrice : 0,
        appliedRules: [],
        skippedRules: [],
      };

      // Add rule to appropriate list
      if (ruleResult.applied) {
        result.appliedRules.push({
          ruleId: rule.id!,
          ruleName: rule.name,
          operation: rule.operation,
          value: rule.value,
          resultPrice: ruleResult.price,
          priceChange: ruleResult.price - originalPrice,
        });
      } else {
        result.skippedRules.push({
          ruleId: rule.id!,
          ruleName: rule.name,
          reason: ruleResult.reason || "Unknown",
        });
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Error calculating price with single rule: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Apply a pricing rule to a product
   * @param rule Pricing rule
   * @param product Product
   * @param currentPrice Current price
   * @param options Calculation options
   */
  private async applyPricingRule(
    rule: PricingRule,
    product: Product,
    currentPrice: number,
    options?: {
      marketCode?: string;
      channelCode?: string;
      currencyCode?: string;
    },
  ): Promise<{
    applied: boolean;
    price: number;
    reason?: string;
  }> {
    try {
      // Get product cost if available (for margin calculations)
      const cost = product.cost || 0;

      // Calculate new price based on operation
      let newPrice = currentPrice;

      switch (rule.operation) {
        case PricingRuleOperation.FIXED_PRICE: {
          // Simple fixed price
          newPrice =
            typeof rule.value === "number"
              ? rule.value
              : parseFloat(rule.value.toString());
          break;
        }

        case PricingRuleOperation.PERCENTAGE_DISCOUNT: {
          // Apply percentage discount
          const discountPercentage =
            typeof rule.value === "number"
              ? rule.value
              : parseFloat(rule.value.toString());
          const discountAmount = (currentPrice * discountPercentage) / 100;
          newPrice = currentPrice - discountAmount;
          break;
        }

        case PricingRuleOperation.AMOUNT_DISCOUNT: {
          // Apply fixed amount discount
          const discountAmount =
            typeof rule.value === "number"
              ? rule.value
              : parseFloat(rule.value.toString());
          newPrice = currentPrice - discountAmount;
          break;
        }

        case PricingRuleOperation.PERCENTAGE_MARKUP: {
          // Apply percentage markup
          const markupPercentage =
            typeof rule.value === "number"
              ? rule.value
              : parseFloat(rule.value.toString());
          const markupAmount = (currentPrice * markupPercentage) / 100;
          newPrice = currentPrice + markupAmount;
          break;
        }

        case PricingRuleOperation.AMOUNT_MARKUP: {
          // Apply fixed amount markup
          const markupAmount =
            typeof rule.value === "number"
              ? rule.value
              : parseFloat(rule.value.toString());
          newPrice = currentPrice + markupAmount;
          break;
        }

        case PricingRuleOperation.MATCH_COMPETITOR: {
          // Match competitor price (simplified)
          // In a real implementation, you would fetch the competitor price from an external source
          if (!rule.competitorReference) {
            return {
              applied: false,
              price: currentPrice,
              reason: "No competitor reference provided",
            };
          }

          const competitorPrice = await this.getCompetitorPrice(
            rule.competitorReference,
          );
          if (competitorPrice === null) {
            return {
              applied: false,
              price: currentPrice,
              reason: "Could not retrieve competitor price",
            };
          }

          newPrice = competitorPrice;
          break;
        }

        case PricingRuleOperation.BEAT_COMPETITOR_PERCENTAGE: {
          // Beat competitor price by percentage
          if (!rule.competitorReference) {
            return {
              applied: false,
              price: currentPrice,
              reason: "No competitor reference provided",
            };
          }

          const competitorPrice = await this.getCompetitorPrice(
            rule.competitorReference,
          );
          if (competitorPrice === null) {
            return {
              applied: false,
              price: currentPrice,
              reason: "Could not retrieve competitor price",
            };
          }

          const beatPercentage =
            typeof rule.value === "number"
              ? rule.value
              : parseFloat(rule.value.toString());
          const beatAmount = (competitorPrice * beatPercentage) / 100;
          newPrice = competitorPrice - beatAmount;
          break;
        }

        case PricingRuleOperation.BEAT_COMPETITOR_AMOUNT: {
          // Beat competitor price by fixed amount
          if (!rule.competitorReference) {
            return {
              applied: false,
              price: currentPrice,
              reason: "No competitor reference provided",
            };
          }

          const competitorPrice = await this.getCompetitorPrice(
            rule.competitorReference,
          );
          if (competitorPrice === null) {
            return {
              applied: false,
              price: currentPrice,
              reason: "Could not retrieve competitor price",
            };
          }

          const beatAmount =
            typeof rule.value === "number"
              ? rule.value
              : parseFloat(rule.value.toString());
          newPrice = competitorPrice - beatAmount;
          break;
        }

        case PricingRuleOperation.CUSTOM_FORMULA: {
          // Custom formula (simplified)
          // In a real implementation, you would execute a formula expression
          // For now, just apply a default calculation
          if (typeof rule.value !== "string") {
            return {
              applied: false,
              price: currentPrice,
              reason: "Invalid custom formula",
            };
          }

          const formula = rule.value.trim();

          // Example: process a simple formula like "cost * 1.5"
          if (formula.startsWith("cost *")) {
            const multiplier = parseFloat(formula.substring(6).trim());
            if (isNaN(multiplier)) {
              return {
                applied: false,
                price: currentPrice,
                reason: "Invalid multiplier in custom formula",
              };
            }

            newPrice = cost * multiplier;
          } else if (formula.startsWith("price *")) {
            const multiplier = parseFloat(formula.substring(7).trim());
            if (isNaN(multiplier)) {
              return {
                applied: false,
                price: currentPrice,
                reason: "Invalid multiplier in custom formula",
              };
            }

            newPrice = currentPrice * multiplier;
          } else {
            return {
              applied: false,
              price: currentPrice,
              reason: "Unsupported custom formula",
            };
          }
          break;
        }

        default:
          return {
            applied: false,
            price: currentPrice,
            reason: `Unsupported operation: ${rule.operation}`,
          };
      }

      // Apply constraints
      if (rule.constraints) {
        // Check min price
        if (
          rule.constraints.minPrice !== undefined &&
          newPrice < rule.constraints.minPrice
        ) {
          newPrice = rule.constraints.minPrice;
        }

        // Check max price
        if (
          rule.constraints.maxPrice !== undefined &&
          newPrice > rule.constraints.maxPrice
        ) {
          newPrice = rule.constraints.maxPrice;
        }

        // Check min margin percentage
        if (rule.constraints.minMarginPercentage !== undefined && cost > 0) {
          const margin = newPrice - cost;
          const marginPercentage = (margin / cost) * 100;

          if (marginPercentage < rule.constraints.minMarginPercentage) {
            const minMargin =
              (cost * rule.constraints.minMarginPercentage) / 100;
            const minPrice = cost + minMargin;

            if (newPrice < minPrice) {
              return {
                applied: false,
                price: currentPrice,
                reason: `Price would violate minimum margin percentage (${rule.constraints.minMarginPercentage}%)`,
              };
            }
          }
        }

        // Check min margin amount
        if (rule.constraints.minMarginAmount !== undefined && cost > 0) {
          const margin = newPrice - cost;

          if (margin < rule.constraints.minMarginAmount) {
            const minPrice = cost + rule.constraints.minMarginAmount;

            if (newPrice < minPrice) {
              return {
                applied: false,
                price: currentPrice,
                reason: `Price would violate minimum margin amount (${rule.constraints.minMarginAmount})`,
              };
            }
          }
        }

        // Check max discount percentage
        if (
          rule.constraints.maxDiscountPercentage !== undefined &&
          newPrice < currentPrice
        ) {
          const discountAmount = currentPrice - newPrice;
          const discountPercentage = (discountAmount / currentPrice) * 100;

          if (discountPercentage > rule.constraints.maxDiscountPercentage) {
            const maxDiscountAmount =
              (currentPrice * rule.constraints.maxDiscountPercentage) / 100;
            newPrice = currentPrice - maxDiscountAmount;
          }
        }

        // Check max discount amount
        if (
          rule.constraints.maxDiscountAmount !== undefined &&
          newPrice < currentPrice
        ) {
          const discountAmount = currentPrice - newPrice;

          if (discountAmount > rule.constraints.maxDiscountAmount) {
            newPrice = currentPrice - rule.constraints.maxDiscountAmount;
          }
        }
      }

      // Check if price actually changed
      if (Math.abs(newPrice - currentPrice) < 0.01) {
        return {
          applied: false,
          price: currentPrice,
          reason: "Price did not change significantly",
        };
      }

      // Ensure price is not negative
      newPrice = Math.max(0, newPrice);

      // Round to 2 decimal places for currency
      newPrice = Math.round(newPrice * 100) / 100;

      return {
        applied: true,
        price: newPrice,
      };
    } catch (error) {
      this.logger.error(
        `Error applying pricing rule: ${error.message}`,
        error.stack,
      );
      return {
        applied: false,
        price: currentPrice,
        reason: `Error: ${error.message}`,
      };
    }
  }

  /**
   * Get base price for a product
   * @param product Product
   * @param marketCode Market code
   * @param currencyCode Currency code
   */
  private getBasePrice(
    product: Product,
    marketCode?: string,
    currencyCode?: string,
  ): number {
    // If no market or currency specified, return main price
    if (!marketCode && !currencyCode) {
      return product.price;
    }

    // Check if there's a market-specific price
    if (
      marketCode &&
      product.regionalPrices &&
      product.regionalPrices[marketCode]
    ) {
      return product.regionalPrices[marketCode];
    }

    // For now, we don't handle currency conversion
    // In a real implementation, you would convert the price to the target currency

    // Return default price
    return product.price;
  }

  /**
   * Get competitor price (simplified)
   * In a real implementation, this would fetch from an external API or database
   * @param competitorReference Competitor reference
   */
  private async getCompetitorPrice(
    competitorReference: CompetitorReference,
  ): Promise<number | null> {
    try {
      // Simulate fetching competitor price
      // In a real implementation, this would call an external service or database

      // For now, just return a hardcoded value
      return 100.0;
    } catch (error) {
      this.logger.error(
        `Error getting competitor price: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Calculate simplified price during load shedding
   * @param product Product
   * @param organizationId Organization ID
   * @param options Calculation options
   */
  private async calculateSimplifiedPrice(
    product: Product,
    organizationId: string,
    options?: {
      marketCode?: string;
      channelCode?: string;
      currencyCode?: string;
    },
  ): Promise<PriceCalculationResult> {
    // Get original price
    const originalPrice = this.getBasePrice(
      product,
      options?.marketCode,
      options?.currencyCode,
    );

    // Create default result with no changes
    const result: PriceCalculationResult = {
      originalPrice,
      finalPrice: originalPrice,
      priceChange: 0,
      appliedRules: [],
      skippedRules: [],
      calculationDetails: {
        simplifiedCalculation: true,
        reason: "Load shedding optimization",
      },
    };

    return result;
  }

  /**
   * Record rule executions for a batch
   * @param batch Price update batch
   * @param userId User ID
   */
  private async recordRuleExecutions(
    batch: PriceUpdateBatch,
    userId: string,
  ): Promise<void> {
    try {
      // Record execution for each rule
      await Promise.all(
        batch.appliedRules.map(async (ruleId) => {
          try {
            // Get affected products for this rule
            const affectedProducts = Object.entries(batch.rulesByProduct)
              .filter(([_, rules]) => rules.includes(ruleId))
              .map(([productId, _]) => productId);

            // Create execution record
            const execution = {
              id: uuidv4(),
              startTime: batch.startTime,
              endTime: new Date(),
              status: PricingRuleExecutionStatus.COMPLETED,
              productsAffected: affectedProducts.length,
              triggeredBy: userId,
            };

            // Record execution
            await this.pricingRuleRepository.addExecution(ruleId, execution);
          } catch (error) {
            this.logger.error(
              `Error recording execution for rule ${ruleId}: ${error.message}`,
            );
            // Continue with other rules
          }
        }),
      );
    } catch (error) {
      this.logger.error(
        `Error recording rule executions: ${error.message}`,
        error.stack,
      );
      // Don't re-throw since this is a non-critical operation
    }
  }
}
