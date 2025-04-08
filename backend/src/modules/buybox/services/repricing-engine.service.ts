import { Injectable, Logger } from '@nestjs/common';
import { RepricingRuleRepository } from '../repositories/repricing-rule.repository';
import { RepricingRule } from '../models/repricing-rule.schema';
import { BuyBoxMonitoringService } from './buybox-monitoring.service';
import { 
  PriceAdjustment, 
  PricingRuleOperation, 
  PricingRuleExecutionStatus,
  CompetitorPrice
} from '../interfaces/types';

/**
 * Service for managing and applying repricing rules
 */
@Injectable()
export class RepricingEngineService {
  private readonly logger = new Logger(RepricingEngineService.name);
  
  constructor(
    private readonly repricingRuleRepository: RepricingRuleRepository,
    private readonly buyBoxMonitoringService: BuyBoxMonitoringService,
  ) {}
  
  /**
   * Create a new repricing rule
   * @param ruleData Rule data
   * @returns Created rule
   */
  async createRule(ruleData: Partial<RepricingRule>): Promise<RepricingRule> {
    this.logger.log(`Creating new repricing rule`);
    // Ensure organizationId is provided as it's required
    if (!ruleData.organizationId) {
      throw new Error('organizationId is required');
    }
    
    // Cast to required type with organizationId explicitly present
    const data = ruleData as Omit<RepricingRule, 'id' | 'createdAt' | 'updatedAt'>;
    return this.repricingRuleRepository.create(data);
  }
  
  /**
   * Get a repricing rule by ID
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
    // Since findActiveByOrganization doesn't exist, we'll use findByOrganization and filter active rules
    const rules = await this.repricingRuleRepository.findByOrganization(organizationId);
    return rules.filter(rule => rule.isActive);
  }
  
  /**
   * Update a repricing rule
   * @param id Rule ID
   * @param ruleData Updated rule data
   * @returns Updated rule
   */
  async updateRule(id: string, ruleData: Partial<RepricingRule>): Promise<RepricingRule | null> {
    const rule = await this.repricingRuleRepository.findById(id);
    
    if (!rule) {
      return null;
    }
    
    return this.repricingRuleRepository.update(id, ruleData);
  }
  
  /**
   * Delete a repricing rule
   * @param id Rule ID
   * @returns Success indicator
   */
  async deleteRule(id: string): Promise<boolean> {
    const rule = await this.repricingRuleRepository.findById(id);
    
    if (!rule) {
      return false;
    }
    
    return this.repricingRuleRepository.delete(id);
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
    this.logger.log(`Applying repricing rules for product ${productId} on marketplace ${marketplaceId}`);
    
    // Get active rules for the organization
    const rules = await this.getActiveRules(organizationId);
    
    if (rules.length === 0) {
      this.logger.log(`No active repricing rules found for organization ${organizationId}`);
      return [];
    }
    
    // Get BuyBox status for the product
    const buyBoxStatus = await this.buyBoxMonitoringService.getBuyBoxStatus(productId, marketplaceId);
    
    if (!buyBoxStatus) {
      this.logger.warn(`No BuyBox status found for product ${productId} on marketplace ${marketplaceId}`);
      return [];
    }
    
    const adjustments: PriceAdjustment[] = [];
    
    // Apply each rule
    for (const rule of rules) {
      try {
        // Check if rule applies to this product and marketplace
        if (
          (rule.productIds && !rule.productIds.includes(productId)) ||
          (rule.marketplaceIds && !rule.marketplaceIds.includes(marketplaceId))
        ) {
          continue;
        }
        
        // Apply the rule
        const currentPrice = buyBoxStatus.currentPrice || 0;
        let newPrice = currentPrice;
        
        // Calculate new price based on rule operation
        switch (rule.operation) {
          case PricingRuleOperation.MATCH:
            if (buyBoxStatus.competitors && buyBoxStatus.competitors.length > 0) {
              // Find the lowest competitor price
              const lowestCompetitorPrice = Math.min(
                ...buyBoxStatus.competitors.map((cp: CompetitorPrice) => cp.totalPrice)
              );
              newPrice = lowestCompetitorPrice;
            }
            break;
            
          case PricingRuleOperation.BEAT_BY:
            if (buyBoxStatus.competitors && buyBoxStatus.competitors.length > 0) {
              // Find the lowest competitor price and beat it by the specified amount
              const lowestCompetitorPrice = Math.min(
                ...buyBoxStatus.competitors.map((cp: CompetitorPrice) => cp.totalPrice)
              );
              newPrice = lowestCompetitorPrice - (rule.value || 0);
            }
            break;
            
          case PricingRuleOperation.FIXED_PRICE:
            newPrice = rule.value || currentPrice;
            break;
            
          case PricingRuleOperation.PERCENTAGE_DISCOUNT:
            newPrice = currentPrice * (1 - (rule.value || 0) / 100);
            break;
            
          case PricingRuleOperation.PERCENTAGE_MARGIN:
            // Implement margin-based pricing
            // Since costPrice doesn't exist on BuyBoxStatus, we'll use metadata if available
            const costPrice = buyBoxStatus.metadata?.costPrice as number | undefined;
            if (costPrice) {
              const margin = rule.value || 0;
              newPrice = costPrice / (1 - margin / 100);
            }
            break;
            
          case PricingRuleOperation.FLOOR_CEILING:
            // Apply floor and ceiling constraints
            if (rule.minPrice && newPrice < rule.minPrice) {
              newPrice = rule.minPrice;
            }
            if (rule.maxPrice && newPrice > rule.maxPrice) {
              newPrice = rule.maxPrice;
            }
            break;
            
          default:
            // No change to price
            break;
        }
        
        // Always respect min/max price constraints if set
        if (rule.minPrice && newPrice < rule.minPrice) {
          newPrice = rule.minPrice;
        }
        if (rule.maxPrice && newPrice > rule.maxPrice) {
          newPrice = rule.maxPrice;
        }
        
        // Only create an adjustment if price changed
        if (newPrice !== currentPrice) {
          adjustments.push({
            oldPrice: currentPrice,
            newPrice,
            appliedRule: rule.id || '',
            appliedAt: new Date(),
            reason: `Applied rule: ${rule.name}`,
            marketplace: marketplaceId,
            status: PricingRuleExecutionStatus.EXECUTED,
          });
        }
      } catch (error) {
        this.logger.error(`Error applying rule ${rule.id}: ${error.message}`, error.stack);
        
        adjustments.push({
          oldPrice: buyBoxStatus.currentPrice || 0,
          newPrice: buyBoxStatus.currentPrice || 0,
          appliedRule: rule.id || '',
          appliedAt: new Date(),
          reason: `Error: ${error.message}`,
          marketplace: marketplaceId,
          status: PricingRuleExecutionStatus.FAILED,
          error: error.message,
        });
      }
    }
    
    return adjustments;
  }
}