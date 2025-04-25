import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Logger,
  ForbiddenException,
} from '@nestjs/common';

import { PriceAdjustment } from '../interfaces/types';
import { RepricingRule } from '../models/repricing-rule.schema';
import { RepricingEngineService } from '../services/repricing-engine.service';
import { RepricingSchedulerService } from '../services/repricing-scheduler.service';

/**
 * Controller for repricing endpoints
 */
@Controller('api/repricing')
export class RepricingController {
  private readonly logger = new Logger(RepricingController.name);

  constructor(
    private readonly repricingEngineService: RepricingEngineService,
    private readonly repricingSchedulerService: RepricingSchedulerService,
  ) {}

  /**
   * Create a new repricing rule
   * @param ruleData Rule data
   * @returns Created rule
   */
  @Post('rules')
  async createRule(@Body() ruleData: any): Promise<RepricingRule> {
    return this.repricingEngineService.createRule(ruleData);
  }

  /**
   * Get a repricing rule by ID
   * @param id Rule ID
   * @returns Repricing rule
   */
  @Get('rules/:id')
  async getRule(@Param('id') id: string): Promise<RepricingRule> {
    const rule = await this.repricingEngineService.getRuleById(id);

    if (!rule) {
      throw new ForbiddenException(`Repricing rule with ID ${id} not found`);
    }

    return rule;
  }

  /**
   * Get all repricing rules for an organization
   * @param organizationId Organization ID
   * @returns Array of repricing rules
   */
  @Get('rules/organization/:organizationId')
  async getRules(
    @Param('organizationId') organizationId: string,
  ): Promise<RepricingRule[]> {
    return this.repricingEngineService.getRules(organizationId);
  }

  /**
   * Get active repricing rules for an organization
   * @param organizationId Organization ID
   * @returns Array of active repricing rules
   */
  @Get('rules/organization/:organizationId/active')
  async getActiveRules(
    @Param('organizationId') organizationId: string,
  ): Promise<RepricingRule[]> {
    return this.repricingEngineService.getActiveRules(organizationId);
  }

  /**
   * Update a repricing rule
   * @param id Rule ID
   * @param ruleData Updated rule data
   * @returns Updated rule
   */
  @Put('rules/:id')
  async updateRule(
    @Param('id') id: string,
    @Body() ruleData: Partial<RepricingRule>,
  ): Promise<RepricingRule> {
    const rule = await this.repricingEngineService.updateRule(id, ruleData);

    if (!rule) {
      throw new ForbiddenException(`Repricing rule with ID ${id} not found`);
    }

    return rule;
  }

  /**
   * Delete a repricing rule
   * @param id Rule ID
   * @returns Success indicator
   */
  @Delete('rules/:id')
  async deleteRule(@Param('id') id: string): Promise<{ success: boolean }> {
    const result = await this.repricingEngineService.deleteRule(id);
    return { success: result };
  }

  /**
   * Apply repricing rules to a product
   * @param organizationId Organization ID
   * @param productId Product ID
   * @param marketplaceId Marketplace ID
   * @returns Price adjustments
   */
  @Post('apply/:organizationId/:productId/:marketplaceId')
  async applyRules(
    @Param('organizationId') organizationId: string,
    @Param('productId') productId: string,
    @Param('marketplaceId') marketplaceId: string,
  ): Promise<PriceAdjustment[]> {
    return this.repricingEngineService.applyRules(
      organizationId,
      productId,
      marketplaceId,
    );
  }

  /**
   * Run repricing for all products in an organization
   * @param organizationId Organization ID
   * @returns Count of processed products
   */
  @Post('run/:organizationId')
  async runRepricing(
    @Param('organizationId') organizationId: string,
  ): Promise<{ processedCount: number }> {
    const count =
      await this.repricingSchedulerService.runRepricingForOrganization(
        organizationId,
      );
    return { processedCount: count };
  }
}
