/**
 * Tax Rate Controller
 *
 * Controller for the Centralized Tax Rate Service
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
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';

import { GetUser } from '../../auth/decorators/get-user.decorator';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import {
  TaxRateRequest,
  TaxRateSchedule,
  TaxJurisdiction,
  TaxType,
  TaxRateResult,
} from '../interfaces/tax-rate.interface';
import { TaxRateService } from '../services/tax-rate.service';

/**
 * Tax Rate Controller
 *
 * API endpoints for the Centralized Tax Rate Service
 */
@Controller('tax-rates')
@UseGuards(FirebaseAuthGuard)
export class TaxRateController {
  private readonly logger = new Logger(TaxRateController.name);

  /**
   * Constructor
   *
   * @param taxRateService Tax rate service
   */
  constructor(private readonly taxRateService: TaxRateService) {}

  /**
   * Get current tax rate
   *
   * @param request Tax rate request parameters
   * @returns Tax rate result
   */
  @Post('current')
  async getCurrentRate(
    @Body() request: TaxRateRequest,
  ): Promise<TaxRateResult> {
    try {
      return await this.taxRateService.getCurrentRate(request);
    } catch (error) {
      this.logger.error(
        `Error getting current tax rate: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get current tax rate: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get tax rate at a specific date
   *
   * @param request Tax rate request parameters
   * @returns Tax rate result
   */
  @Post('at-date')
  async getRateAtDate(@Body() request: TaxRateRequest): Promise<TaxRateResult> {
    if (!request.transactionDate) {
      throw new HttpException(
        'Transaction date is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Convert string date to Date if needed
    if (typeof request.transactionDate === 'string') {
      request.transactionDate = new Date(request.transactionDate);
    }

    try {
      return await this.taxRateService.getRateAtDate(request);
    } catch (error) {
      this.logger.error(
        `Error getting tax rate at date: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get tax rate at date: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all tax rates for a jurisdiction
   *
   * @param country Country code
   * @param region Optional region
   * @param city Optional city
   * @param includeHistory Whether to include historical rates
   * @returns Array of tax rate schedules
   */
  @Get('jurisdiction/:country')
  async getAllRatesForJurisdiction(
    @Param('country') country: string,
    @Query('region') region?: string,
    @Query('city') city?: string,
    @Query('includeHistory') includeHistory?: boolean,
  ): Promise<TaxRateSchedule[]> {
    const jurisdiction: TaxJurisdiction = {
      country,
      region,
      city,
      level: city ? 'city' : region ? 'province' : 'country',
    };

    try {
      return await this.taxRateService.getAllRatesForJurisdiction(
        jurisdiction,
        includeHistory,
      );
    } catch (error) {
      this.logger.error(
        `Error getting rates for jurisdiction: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get rates for jurisdiction: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get tax rate changes for a jurisdiction and tax type
   *
   * @param country Country code
   * @param taxType Tax type
   * @param region Optional region
   * @param city Optional city
   * @returns Array of tax rate schedules showing changes over time
   */
  @Get('changes/:country/:taxType')
  async getRateChanges(
    @Param('country') country: string,
    @Param('taxType') taxType: string,
    @Query('region') region?: string,
    @Query('city') city?: string,
  ): Promise<TaxRateSchedule[]> {
    const jurisdiction: TaxJurisdiction = {
      country,
      region,
      city,
      level: city ? 'city' : region ? 'province' : 'country',
    };

    try {
      return await this.taxRateService.getRateChanges(jurisdiction, taxType);
    } catch (error) {
      this.logger.error(
        `Error getting rate changes: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get rate changes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check if a product is tax exempt
   *
   * @param request Tax rate request parameters with product info
   * @returns Boolean indicating if the product is tax exempt
   */
  @Post('is-exempt')
  async isExempt(
    @Body() request: TaxRateRequest,
  ): Promise<{ exempt: boolean }> {
    try {
      const exempt = await this.taxRateService.isExempt(request);
      return { exempt };
    } catch (error) {
      this.logger.error(
        `Error checking tax exemption: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to check tax exemption: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get special rate product types for a jurisdiction
   *
   * @param country Country code
   * @param region Optional region
   * @param city Optional city
   * @returns Array of product types with special rates
   */
  @Get('special-rates/:country')
  async getSpecialRateProductTypes(
    @Param('country') country: string,
    @Query('region') region?: string,
    @Query('city') city?: string,
  ): Promise<Array<{ productType: string; rate: number; name: string }>> {
    const jurisdiction: TaxJurisdiction = {
      country,
      region,
      city,
      level: city ? 'city' : region ? 'province' : 'country',
    };

    try {
      return await this.taxRateService.getSpecialRateProductTypes(jurisdiction);
    } catch (error) {
      this.logger.error(
        `Error getting special rate product types: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get special rate product types: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create a new tax rate schedule
   *
   * @param schedule Tax rate schedule to create
   * @param user Authenticated user
   * @returns Created tax rate schedule
   */
  @Post()
  async createTaxRateSchedule(
    @Body() schedule: Omit<TaxRateSchedule, 'id' | 'createdAt' | 'updatedAt'>,
    @GetUser() user: any,
  ): Promise<TaxRateSchedule> {
    // Add audit information
    const scheduleWithAudit = {
      ...schedule,
      createdBy: user.uid,
    };

    try {
      return await this.taxRateService.createTaxRateSchedule(scheduleWithAudit);
    } catch (error) {
      this.logger.error(
        `Error creating tax rate schedule: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to create tax rate schedule: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update a tax rate schedule
   *
   * @param id Schedule ID to update
   * @param updates Updates to apply
   * @param user Authenticated user
   * @returns Updated tax rate schedule
   */
  @Put(':id')
  async updateTaxRateSchedule(
    @Param('id') id: string,
    @Body()
    updates: Partial<Omit<TaxRateSchedule, 'id' | 'createdAt' | 'updatedAt'>>,
    @GetUser() user: any,
  ): Promise<TaxRateSchedule> {
    // Add audit information
    const updatesWithAudit = {
      ...updates,
      updatedBy: user.uid,
    };

    try {
      return await this.taxRateService.updateTaxRateSchedule(
        id,
        updatesWithAudit,
      );
    } catch (error) {
      this.logger.error(
        `Error updating tax rate schedule: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to update tax rate schedule: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete a tax rate schedule
   *
   * @param id Schedule ID to delete
   * @returns Success indicator
   */
  @Delete(':id')
  async deleteTaxRateSchedule(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    try {
      const result = await this.taxRateService.deleteTaxRateSchedule(id);
      return { success: result };
    } catch (error) {
      this.logger.error(
        `Error deleting tax rate schedule: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to delete tax rate schedule: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
