import { Injectable, Logger } from '@nestjs/common';
import { RepricingRuleRepository } from '../repositories/repricing-rule.repository';
import { BuyBoxStatusRepository } from '../repositories/buybox-status.repository';
import { RepricingRule } from '../models/repricing-rule.schema';
import { BuyBoxStatus } from '../models/buybox-status.schema';
import { 
  PricingRuleOperation, 
  PricingRuleExecutionStatus, 
  PriceAdjustment 
} from '../interfaces/types';

/**
 * Service for repricing rule operations
 */
@Injectable()
export class RepricingEngineService {
  private readonly logger = new Logger(RepricingEngineService.name);
  
  constructor(
    private readonly repricingRuleRepository: RepricingRuleRepository,
    private readonly buyBoxStatusRepository: BuyBoxStatusRepository
  ) {}
  
  /**
   * Create a new repricing rule
   * @param ruleData Rule data
   * @returns Created rule
   */
  async createRule(ruleData: Omit<RepricingRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<RepricingRule> {
    this.logger.log(`Creating repricing rule: ${ruleData.name}`);
    
    // Set defaults
    const data = {
      ...ruleData,
      isActive: ruleData.isActive !== undefined ? ruleData.isActive : true,
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
    };
    
    return this.repricingRuleRepository.create(data);
  }
  
  /**
   * Get repricing rule by ID
   * @param id Rule ID
   * @returns Repricing rule
   */
  async getRuleById(id: string): Promise<RepricingRule | null> {
    return this.repricingRuleRepository.findById(id);
  }
  
  /**
   * Get all repricing rules for an organization
   * @param organizationId Organization ID
   * @returns Array of repricing rules
   */
  async getRules(organizationId: string): Promise<RepricingRule[]> {
    return this.repricingRuleRepository.findByOrganization(organizationId);
  }
  
  /**
   * Get active repricing rules for an organization
   * @param organizationId Organization ID
   * @returns Array of active repricing rules
   */
  async getActiveRules(organizationId: string): Promise<RepricingRule[]> {
    return this.repricingRuleRepository.findActiveRules(organizationId);
  }
  
  /**
   * Update a repricing rule
   * @param id Rule ID
   * @param ruleData Updated rule data
   * @returns Updated rule
   */
  async updateRule(id: string, ruleData: Partial<RepricingRule>): Promise<RepricingRule | null> {
    this.logger.log(`Updating repricing rule ${id}`);
    return this.repricingRuleRepository.update(id, ruleData);
  }
  
  /**
   * Delete a repricing rule
   * @param id Rule ID
   * @returns Success indicator
   */
  async deleteRule(id: string): Promise<boolean> {
    this.logger.log(`Deleting repricing rule ${id}`);
    return this.repricingRuleRepository.delete(id) as any as boolean;
  }
  
  /**
   * Apply repricing rules to a product
   * @param organizationId Organization ID
   * @param productId Product ID
   * @param marketplaceId Marketplace ID
   * @returns Price adjustments
   */
  async applyRules(
    organizationId: string,
    productId: string,
    marketplaceId: string
  ): Promise<PriceAdjustment[]> {
    this.logger.log(`Applying repricing rules to product ${productId} on marketplace ${marketplaceId}`);
    
    // Get BuyBox status
    const status = await this.buyBoxStatusRepository.findByProductAndMarketplace(
      productId, 
      marketplaceId
    );
    
    if (!status) {
      throw new Error(`No BuyBox status found for product ${productId} on marketplace ${marketplaceId}`);
    }
    
    // Get applicable rules
    const rules = await this.repricingRuleRepository.findRulesForProduct(
      organizationId,
      productId,
      marketplaceId
    );
    
    if (rules.length === 0) {
      this.logger.log(`No applicable rules found for product ${productId}`);
      return [];
    }
    
    // Calculate new price based on rules
    const adjustments = await this.calculatePriceAdjustments(status, rules);
    
    // Apply the best adjustment (if any)
    if (adjustments.length > 0) {
      // Sort by status (executed first) and then by price (highest)
      adjustments.sort((a, b) => {
        // First by status
        if (a.status === PricingRuleExecutionStatus.EXECUTED && b.status !== PricingRuleExecutionStatus.EXECUTED) {
          return -1;
        }
        if (a.status !== PricingRuleExecutionStatus.EXECUTED && b.status === PricingRuleExecutionStatus.EXECUTED) {
          return 1;
        }
        
        // Then by price (highest first)
        return b.newPrice - a.newPrice;
      });
      
      // Apply the first adjustment
      const bestAdjustment = adjustments[0];
      
      if (bestAdjustment.status === PricingRuleExecutionStatus.EXECUTED) {
        // Update the BuyBox status with the new price
        await this.buyBoxStatusRepository.update(status.id, {
          currentPrice: bestAdjustment.newPrice,
          currentShipping: bestAdjustment.newShipping || status.currentShipping,
          lastUpdated: new Date()
        });
      }
    }
    
    return adjustments;
  }
  
  /**
   * Calculate price adjustments based on rules
   * @param status BuyBox status
   * @param rules Applicable rules
   * @returns Price adjustments
   */
  private async calculatePriceAdjustments(
    status: BuyBoxStatus,
    rules: RepricingRule[]
  ): Promise<PriceAdjustment[]> {
    const adjustments: PriceAdjustment[] = [];
    
    for (const rule of rules) {
      try {
        const adjustment = await this.calculateRuleAdjustment(status, rule);
        adjustments.push(adjustment);
        
        // Update rule execution stats
        await this.repricingRuleRepository.updateExecutionStats(
          rule.id, 
          adjustment.status === PricingRuleExecutionStatus.EXECUTED
        );
      } catch (error) {
        this.logger.error(`Error applying rule ${rule.id}: ${error.message}`, error.stack);
        
        // Add failed adjustment
        adjustments.push({
          oldPrice: status.currentPrice,
          newPrice: status.currentPrice,
          oldShipping: status.currentShipping,
          newShipping: status.currentShipping,
          appliedRule: rule.id,
          appliedAt: new Date(),
          reason: `Error: ${error.message}`,
          marketplace: status.marketplaceId,
          status: PricingRuleExecutionStatus.FAILED,
          error: error.message
        });
        
        // Update rule stats
        await this.repricingRuleRepository.updateExecutionStats(rule.id, false);
      }
    }
    
    return adjustments;
  }
  
  /**
   * Calculate price adjustment for a single rule
   * @param status BuyBox status
   * @param rule Repricing rule
   * @returns Price adjustment
   */
  private async calculateRuleAdjustment(
    status: BuyBoxStatus,
    rule: RepricingRule
  ): Promise<PriceAdjustment> {
    // The price we're starting with
    const currentPrice = status.currentPrice;
    const currentShipping = status.currentShipping;
    
    // Default adjustment (no change)
    const baseAdjustment: PriceAdjustment = {
      oldPrice: currentPrice,
      newPrice: currentPrice,
      oldShipping: currentShipping,
      newShipping: currentShipping,
      appliedRule: rule.id,
      appliedAt: new Date(),
      reason: 'No change needed',
      marketplace: status.marketplaceId,
      status: PricingRuleExecutionStatus.SKIPPED
    };
    
    // If no competitors, some rules can't apply
    if (status.competitors.length === 0 && 
        (rule.operation === PricingRuleOperation.MATCH || 
         rule.operation === PricingRuleOperation.BEAT_BY || 
         rule.operation === PricingRuleOperation.MATCH_SHIPPING)) {
      return {
        ...baseAdjustment,
        reason: 'No competitors found',
        status: PricingRuleExecutionStatus.SKIPPED
      };
    }
    
    // Get target competitor price
    let targetPrice = currentPrice;
    let targetShipping = currentShipping;
    let competitorName = 'unknown';
    
    if (rule.operation !== PricingRuleOperation.FIXED_PRICE) {
      // Find the target competitor based on rule
      const targetCompetitor = this.getTargetCompetitor(status, rule);
      
      if (!targetCompetitor) {
        return {
          ...baseAdjustment,
          reason: 'No applicable competitor found',
          status: PricingRuleExecutionStatus.SKIPPED
        };
      }
      
      if (targetCompetitor) {
        targetPrice = targetCompetitor.price;
        targetShipping = targetCompetitor.shipping;
        competitorName = targetCompetitor.competitorName;
      }
    }
    
    // Calculate new price based on rule operation
    let newPrice = currentPrice;
    let newShipping = currentShipping;
    let reason = '';
    
    switch (rule.operation) {
      case PricingRuleOperation.MATCH:
        newPrice = targetPrice;
        reason = `Matched competitor ${competitorName} price of ${targetPrice}`;
        break;
      
      case PricingRuleOperation.BEAT_BY:
        newPrice = targetPrice - rule.value;
        reason = `Beat competitor ${competitorName} price by ${rule.value}`;
        break;
      
      case PricingRuleOperation.MATCH_SHIPPING:
        newShipping = targetShipping;
        reason = `Matched competitor ${competitorName} shipping of ${targetShipping}`;
        break;
      
      case PricingRuleOperation.FIXED_PRICE:
        newPrice = rule.value;
        reason = `Set fixed price to ${rule.value}`;
        break;
      
      case PricingRuleOperation.PERCENTAGE_MARGIN:
        // For simplicity, let's say price is original cost * (1 + margin%)
        // We don't have cost data in this example, so we'll use a placeholder
        const placeholderCost = currentPrice * 0.7; // Assuming 30% margin
        newPrice = placeholderCost * (1 + (rule.value / 100));
        reason = `Applied ${rule.value}% margin`;
        break;
      
      case PricingRuleOperation.PERCENTAGE_DISCOUNT:
        newPrice = currentPrice * (1 - (rule.value / 100));
        reason = `Applied ${rule.value}% discount`;
        break;
      
      case PricingRuleOperation.FLOOR_CEILING:
        // This is a special case where the rule.value is not used
        // Instead we use minPrice and maxPrice from the rule
        if (rule.minPrice !== undefined && currentPrice < rule.minPrice) {
          newPrice = rule.minPrice;
          reason = `Applied floor price of ${rule.minPrice}`;
        } else if (rule.maxPrice !== undefined && currentPrice > rule.maxPrice) {
          newPrice = rule.maxPrice;
          reason = `Applied ceiling price of ${rule.maxPrice}`;
        } else {
          reason = 'Price is already within floor/ceiling bounds';
        }
        break;
    }
    
    // Apply constraints
    if (rule.minPrice !== undefined && newPrice < rule.minPrice) {
      newPrice = rule.minPrice;
      reason += ` (limited by minimum price ${rule.minPrice})`;
    }
    
    if (rule.maxPrice !== undefined && newPrice > rule.maxPrice) {
      newPrice = rule.maxPrice;
      reason += ` (limited by maximum price ${rule.maxPrice})`;
    }
    
    // Round to 2 decimal places
    newPrice = Math.round(newPrice * 100) / 100;
    
    // Check if price has changed
    const priceChanged = newPrice !== currentPrice || newShipping !== currentShipping;
    
    // Build the adjustment
    return {
      oldPrice: currentPrice,
      newPrice,
      oldShipping: currentShipping,
      newShipping,
      appliedRule: rule.id,
      appliedAt: new Date(),
      reason,
      marketplace: status.marketplaceId,
      status: priceChanged ? PricingRuleExecutionStatus.EXECUTED : PricingRuleExecutionStatus.SKIPPED
    };
  }
  
  /**
   * Get the target competitor based on rule settings
   * @param status BuyBox status
   * @param rule Repricing rule
   * @returns Target competitor or null
   */
  private getTargetCompetitor(
    status: BuyBoxStatus,
    rule: RepricingRule
  ): any | null {
    if (status.competitors.length === 0) {
      return null;
    }
    
    const target = rule.targetCompetitor || 'lowest';
    
    switch (target) {
      case 'lowest':
        // Sort by total price (lowest first)
        return [...status.competitors].sort(
          (a, b) => (a.price + a.shipping) - (b.price + b.shipping)
        )[0];
      
      case 'highest':
        // Sort by total price (highest first)
        return [...status.competitors].sort(
          (a, b) => (b.price + b.shipping) - (a.price + a.shipping)
        )[0];
      
      case 'buybox_winner':
        // Find the buybox winner
        return status.competitors.find(c => c.isBuyBoxWinner) || null;
      
      case 'specific':
        // Find the specific competitor
        if (rule.specificCompetitorId) {
          return status.competitors.find(c => c.competitorId === rule.specificCompetitorId) || null;
        }
        return null;
      
      case 'all':
        // Calculate average price
        const totalPrices = status.competitors.reduce(
          (sum, c) => sum + c.price + c.shipping, 0
        );
        const avgPrice = totalPrices / status.competitors.length;
        return {
          competitorId: 'average',
          competitorName: 'Average competitor',
          price: avgPrice,
          shipping: 0, // All shipping is included in price
          isBuyBoxWinner: false
        };
      
      default:
        return null;
    }
  }
}