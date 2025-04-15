import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  HttpStatus, 
  Param, 
  Post, 
  Put, 
  Query, 
  Req,
  UseGuards
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../../../common/auth/firebase-auth.guard';
import { DynamicPricingService } from '../services/dynamic-pricing.service';
import { 
  PricingRule, 
  PricingRuleOperation, 
  PricingRuleScheduleType,
  PricingRuleExecutionStatus
} from '../models/pricing-rule.model';

/**
 * Controller for dynamic pricing rule operations
 * This controller manages pricing rules and price calculations
 */
@ApiTags('pricing-rules')
@Controller('pim/pricing-rules')
@UseGuards(FirebaseAuthGuard)
export class PricingRuleController {
  constructor(private readonly dynamicPricingService: DynamicPricingService) {}

  /**
   * Create a new pricing rule
   * @param body Pricing rule data
   * @param req Request with user information
   */
  @Post()
  @ApiOperation({ summary: 'Create a new pricing rule' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'The pricing rule has been created' })
  async createPricingRule(
    @Body() body: Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt' | 'recentExecutions' | 'executionStats'>,
    @Req() req: any,
  ): Promise<PricingRule> {
    const userId = req.user.uid;
    const organizationId = req.user.organizationId;

    return this.dynamicPricingService.createPricingRule(body, organizationId, userId);
  }

  /**
   * Update an existing pricing rule
   * @param id Rule ID
   * @param body Rule update data
   * @param req Request with user information
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a pricing rule' })
  @ApiParam({ name: 'id', description: 'Pricing rule ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The pricing rule has been updated' })
  async updatePricingRule(
    @Param('id') id: string,
    @Body() body: Partial<Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt' | 'recentExecutions' | 'executionStats'>>,
    @Req() req: any,
  ): Promise<PricingRule> {
    const userId = req.user.uid;
    const organizationId = req.user.organizationId;

    return this.dynamicPricingService.updatePricingRule(id, body, organizationId, userId);
  }

  /**
   * Delete a pricing rule
   * @param id Rule ID
   * @param req Request with user information
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a pricing rule' })
  @ApiParam({ name: 'id', description: 'Pricing rule ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'The pricing rule has been deleted' })
  async deletePricingRule(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<void> {
    const organizationId = req.user.organizationId;

    await this.dynamicPricingService.deletePricingRule(id, organizationId);
  }

  /**
   * Get a pricing rule by ID
   * @param id Rule ID
   * @param req Request with user information
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a pricing rule by ID' })
  @ApiParam({ name: 'id', description: 'Pricing rule ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The pricing rule has been found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'The pricing rule was not found' })
  async getPricingRule(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<PricingRule> {
    const organizationId = req.user.organizationId;
    const rule = await this.dynamicPricingService.getPricingRule(id, organizationId);

    if (!rule) {
      throw new Error(`Pricing rule with ID ${id} not found`);
    }

    return rule;
  }

  /**
   * Get all pricing rules for the current organization
   * @param isActive Filter by active status
   * @param limit Max number of rules to return
   * @param offset Number of rules to skip
   * @param req Request with user information
   */
  @Get()
  @ApiOperation({ summary: 'Get all pricing rules' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter rules by active status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of rules to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of rules to skip' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of pricing rules' })
  async getAllPricingRules(
    @Query('isActive') isActive?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Req() req?: any,
  ): Promise<PricingRule[]> {
    const organizationId = req.user.organizationId;

    // Parse isActive string to boolean if provided
    const isActiveFilter = isActive !== undefined 
      ? isActive.toLowerCase() === 'true'
      : undefined;

    return this.dynamicPricingService.getAllPricingRules(
      organizationId,
      {
        isActive: isActiveFilter,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      },
    );
  }

  /**
   * Calculate price for a product
   * @param productId Product ID
   * @param marketCode Market code
   * @param channelCode Channel code
   * @param currencyCode Currency code
   * @param req Request with user information
   */
  @Get('/calculate/:productId')
  @ApiOperation({ summary: 'Calculate price for a product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({ name: 'marketCode', required: false, description: 'Market code' })
  @ApiQuery({ name: 'channelCode', required: false, description: 'Channel code' })
  @ApiQuery({ name: 'currencyCode', required: false, description: 'Currency code' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Price calculation result' })
  async calculatePrice(
    @Param('productId') productId: string,
    @Query('marketCode') marketCode?: string,
    @Query('channelCode') channelCode?: string,
    @Query('currencyCode') currencyCode?: string,
    @Req() req?: any,
  ): Promise<any> {
    const organizationId = req.user.organizationId;

    return this.dynamicPricingService.calculateProductPrice(
      productId,
      organizationId,
      {
        marketCode,
        channelCode,
        currencyCode,
      },
    );
  }

  /**
   * Calculate prices for multiple products
   * @param body Product IDs and calculation options
   * @param req Request with user information
   */
  @Post('/calculate-batch')
  @ApiOperation({ summary: 'Calculate prices for multiple products' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Batch price calculation results' })
  async calculateBatchPrices(
    @Body() body: {
      productIds: string[];
      updatePrices?: boolean;
      marketCode?: string;
      channelCode?: string;
      currencyCode?: string;
    },
    @Req() req: any,
  ): Promise<any> {
    const userId = req.user.uid;
    const organizationId = req.user.organizationId;

    return this.dynamicPricingService.calculateBatchPrices(
      body.productIds,
      organizationId,
      {
        marketCode: body.marketCode,
        channelCode: body.channelCode,
        currencyCode: body.currencyCode,
        updatePrices: body.updatePrices,
        userId,
      },
    );
  }

  /**
   * Execute a pricing rule
   * @param id Rule ID
   * @param dryRun Whether to simulate execution without updating prices
   * @param limit Maximum number of products to process
   * @param req Request with user information
   */
  @Post('/execute/:id')
  @ApiOperation({ summary: 'Execute a pricing rule' })
  @ApiParam({ name: 'id', description: 'Pricing rule ID' })
  @ApiQuery({ name: 'dryRun', required: false, description: 'Whether to simulate execution without updating prices' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of products to process' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rule execution results' })
  async executePricingRule(
    @Param('id') id: string,
    @Query('dryRun') dryRun?: string,
    @Query('limit') limit?: number,
    @Req() req?: any,
  ): Promise<any> {
    const userId = req.user.uid;
    const organizationId = req.user.organizationId;

    // Parse dryRun string to boolean
    const isDryRun = dryRun !== undefined ? dryRun.toLowerCase() === 'true' : false;

    return this.dynamicPricingService.executePricingRule(
      id,
      organizationId,
      {
        dryRun: isDryRun,
        userId,
        limit: limit ? Number(limit) : undefined,
      },
    );
  }

  /**
   * Get available pricing rule operations
   */
  @Get('/operations')
  @ApiOperation({ summary: 'Get available pricing rule operations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of available operations' })
  getPricingRuleOperations(): { operations: string[] } {
    return {
      operations: Object.values(PricingRuleOperation),
    };
  }

  /**
   * Get available pricing rule schedule types
   */
  @Get('/schedule-types')
  @ApiOperation({ summary: 'Get available pricing rule schedule types' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of available schedule types' })
  getPricingRuleScheduleTypes(): { scheduleTypes: string[] } {
    return {
      scheduleTypes: Object.values(PricingRuleScheduleType),
    };
  }

  /**
   * Schedule pricing rules for execution (admin only)
   */
  @Post('/schedule')
  @ApiOperation({ summary: 'Schedule pricing rules for execution' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Schedule results' })
  async schedulePricingRules(
    @Req() req: any,
  ): Promise<any> {
    const organizationId = req.user.organizationId;
    
    // For security, this operation might require additional permissions
    // which would be checked in a real implementation
    
    return this.dynamicPricingService.schedulePricingRules({
      organizationId,
    });
  }

  /**
   * Get rule execution statuses
   */
  @Get('/execution-statuses')
  @ApiOperation({ summary: 'Get rule execution statuses' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of execution statuses' })
  getRuleExecutionStatuses(): { statuses: string[] } {
    return {
      statuses: Object.values(PricingRuleExecutionStatus),
    };
  }
}