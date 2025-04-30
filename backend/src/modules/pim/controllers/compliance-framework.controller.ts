/**
 * Compliance Framework Controller
 *
 * Controller for managing the advanced compliance framework for products
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { FirebaseAuthGuard } from '../../auth';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import {
  ComplianceFrameworkService,
  ComplianceStatus,
  ComplianceCategory,
  ComplianceAuthority,
  ComplianceRule,
  ComplianceCheckResult,
} from '../services/compliance/compliance-framework.service';

/**
 * DTO for creating a compliance rule
 */
class CreateComplianceRuleDto {
  name!: string;
  description!: string;
  category!: ComplianceCategory;
  authority!: ComplianceAuthority;
  regionCodes!: string[];
  productTypes!: string[];
  requiredAttributes!: string[];
  validationRules!: any[];
  severity!: 'critical' | 'high' | 'medium' | 'low';
  exemptionCriteria?: string;
  references?: string[];
  effectiveDate!: Date;
  expirationDate?: Date;
  // Required metadata fields for FirestoreEntityWithMetadata
  isDeleted: boolean = false;
  version: number = 1;
  deletedAt?: Date | null = null;
}

/**
 * DTO for updating a compliance rule
 */
class UpdateComplianceRuleDto {
  name?: string;
  description?: string;
  category?: ComplianceCategory;
  authority?: ComplianceAuthority;
  regionCodes?: string[];
  productTypes?: string[];
  requiredAttributes?: string[];
  validationRules?: any[];
  severity?: 'critical' | 'high' | 'medium' | 'low';
  exemptionCriteria?: string;
  references?: string[];
  effectiveDate?: Date;
  expirationDate?: Date;
  // Required metadata fields for FirestoreEntityWithMetadata
  isDeleted?: boolean;
  version?: number;
  deletedAt?: Date | null;
}

/**
 * DTO for updating a compliance status
 */
class UpdateComplianceStatusDto {
  status!: ComplianceStatus;
  notes?: string;
}

/**
 * DTO for compliance check options
 */
class ComplianceCheckOptionsDto {
  region?: string;
  includeExempt?: boolean;
  includeExpired?: boolean;
  categories?: ComplianceCategory[];
  authorities?: ComplianceAuthority[];
  severities?: ('critical' | 'high' | 'medium' | 'low')[];
}

/**
 * Controller for compliance framework APIs
 */
@Controller('pim/compliance')
@UseGuards(FirebaseAuthGuard)
export class ComplianceFrameworkController {
  private readonly logger = new Logger(ComplianceFrameworkController.name);

  constructor(private readonly complianceService: ComplianceFrameworkService) {
    this.logger.log('Compliance Framework Controller initialized');
  }

  /**
   * Get all compliance rules
   */
  @Get('rules')
  async getAllRules(
    @GetUser() user: any,
    @Query('category') category?: ComplianceCategory,
    @Query('authority') authority?: ComplianceAuthority,
    @Query('region') region?: string,
    @Query('productType') productType?: string,
  ) {
    try {
      // If specific filters are provided, use them
      if (category || authority || region || productType) {
        const filters: Record<string, any> = {};

        if (category) {
          filters.category = category;
        }

        if (authority) {
          filters.authority = authority;
        }

        if (region) {
          filters.regionCodes = region;
        }

        if (productType) {
          filters.productTypes = productType;
        }

        return this.complianceService.getApplicableRules(
          productType || 'all',
          region || 'all',
          {},
          user.tenantId,
        );
      }

      // Otherwise get all rules
      return this.complianceService.getAllRules(user.tenantId);
    } catch (error) {
      this.logger.error(
        `Error fetching compliance rules: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to fetch compliance rules: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a specific compliance rule
   */
  @Get('rules/:id')
  async getRuleById(@Param('id') id: string, @GetUser() user: any) {
    try {
      return this.complianceService.getRuleById(id, user.tenantId);
    } catch (error) {
      this.logger.error(
        `Error fetching compliance rule: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to fetch compliance rule: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create a new compliance rule
   */
  @Post('rules')
  async createRule(
    @Body() createRuleDto: CreateComplianceRuleDto,
    @GetUser() user: any,
  ) {
    try {
      return this.complianceService.createRule(createRuleDto, user.tenantId);
    } catch (error) {
      this.logger.error(
        `Error creating compliance rule: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to create compliance rule: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update an existing compliance rule
   */
  @Put('rules/:id')
  async updateRule(
    @Param('id') id: string,
    @Body() updateRuleDto: UpdateComplianceRuleDto,
    @GetUser() user: any,
  ) {
    try {
      return this.complianceService.updateRule(
        id,
        updateRuleDto,
        user.tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Error updating compliance rule: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to update compliance rule: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete a compliance rule
   */
  @Delete('rules/:id')
  async deleteRule(@Param('id') id: string, @GetUser() user: any) {
    try {
      await this.complianceService.deleteRule(id, user.tenantId);
      return { success: true, message: 'Compliance rule deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Error deleting compliance rule: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to delete compliance rule: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check compliance for a product
   */
  @Post('products/:productId/check')
  async checkProductCompliance(
    @Param('productId') productId: string,
    @Body() options: ComplianceCheckOptionsDto,
    @GetUser() user: any,
  ) {
    try {
      return this.complianceService.checkProductCompliance(
        productId,
        user.tenantId,
        options,
      );
    } catch (error) {
      this.logger.error(
        `Error checking product compliance: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to check product compliance: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get compliance status for a product
   */
  @Get('products/:productId/status')
  async getProductComplianceStatus(
    @Param('productId') productId: string,
    @GetUser() user: any,
  ) {
    try {
      return this.complianceService.getProductComplianceStatus(
        productId,
        user.tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Error getting product compliance status: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get product compliance status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get compliance requirements for a product
   */
  @Get('products/:productId/requirements')
  async getProductRequirements(
    @Param('productId') productId: string,
    @GetUser() user: any,
  ) {
    try {
      return this.complianceService.getRequirementsByProduct(
        productId,
        user.tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Error getting product requirements: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get product requirements: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update compliance status for a product and rule
   */
  @Put('products/:productId/rules/:ruleId/status')
  async updateComplianceStatus(
    @Param('productId') productId: string,
    @Param('ruleId') ruleId: string,
    @Body() updateStatusDto: UpdateComplianceStatusDto,
    @GetUser() user: any,
  ) {
    try {
      await this.complianceService.updateComplianceStatus(
        productId,
        ruleId,
        updateStatusDto.status,
        user.id,
        updateStatusDto.notes,
        user.tenantId,
      );

      return {
        success: true,
        message: 'Compliance status updated successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error updating compliance status: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to update compliance status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get compliance history for a product and rule
   */
  @Get('products/:productId/rules/:ruleId/history')
  async getComplianceHistory(
    @Param('productId') productId: string,
    @Param('ruleId') ruleId: string,
    @GetUser() user: any,
  ) {
    try {
      return this.complianceService.getComplianceHistory(
        productId,
        ruleId,
        user.tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Error getting compliance history: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get compliance history: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get categories for compliance rules
   */
  @Get('categories')
  getComplianceCategories() {
    return Object.values(ComplianceCategory);
  }

  /**
   * Get authorities for compliance rules
   */
  @Get('authorities')
  getComplianceAuthorities() {
    return Object.values(ComplianceAuthority);
  }

  /**
   * Get possible compliance statuses
   */
  @Get('statuses')
  getComplianceStatuses() {
    return Object.values(ComplianceStatus);
  }
}
