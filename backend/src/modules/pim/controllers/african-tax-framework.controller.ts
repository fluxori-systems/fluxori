/**
 * African Tax Framework Controller
 *
 * Controller providing API endpoints for the African Tax Framework service
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';

import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import {
  TaxRateRequest,
  TaxRateResult,
} from '../interfaces/tax-rate.interface';
import {
  AfricanTaxFrameworkService,
  AfricanTaxRule,
} from '../services/african-tax-framework.service';

/**
 * African Tax Framework Controller
 *
 * API endpoints for Africa-specific tax frameworks and rules
 */
@Controller('tax-rates/african')
@UseGuards(FirebaseAuthGuard)
export class AfricanTaxFrameworkController {
  private readonly logger = new Logger(AfricanTaxFrameworkController.name);

  /**
   * Constructor
   *
   * @param africanTaxFrameworkService African Tax Framework service
   */
  constructor(
    private readonly africanTaxFrameworkService: AfricanTaxFrameworkService,
  ) {}

  /**
   * Get all supported African countries
   *
   * @returns Array of country codes
   */
  @Get('supported-countries')
  async getSupportedCountries(): Promise<string[]> {
    try {
      return this.africanTaxFrameworkService.getSupportedCountries();
    } catch (error) {
      this.logger.error(
        `Error getting supported countries: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get supported countries: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get tax rules for a specific African country
   *
   * @param countryCode ISO country code
   * @returns Country tax rules or 404 if not supported
   */
  @Get('country-rules/:countryCode')
  async getCountryTaxRules(
    @Param('countryCode') countryCode: string,
  ): Promise<AfricanTaxRule> {
    try {
      const rules =
        this.africanTaxFrameworkService.getCountryTaxRules(countryCode);

      if (!rules) {
        throw new HttpException(
          `Country ${countryCode} is not supported by the African Tax Framework`,
          HttpStatus.NOT_FOUND,
        );
      }

      return rules;
    } catch (error) {
      this.logger.error(
        `Error getting country tax rules: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to get country tax rules: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Calculate tax for a specific African transaction
   *
   * @param request Tax calculation request
   * @returns Tax calculation result
   */
  @Post('calculate')
  async calculateAfricanTax(
    @Body() request: TaxRateRequest,
  ): Promise<TaxRateResult> {
    try {
      return await this.africanTaxFrameworkService.calculateAfricanTax(request);
    } catch (error) {
      this.logger.error(
        `Error calculating African tax: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to calculate African tax: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get special product tax categories for a country
   *
   * @param countryCode ISO country code
   * @returns Array of special product tax categories
   */
  @Get('special-categories/:countryCode')
  async getSpecialProductTaxCategories(
    @Param('countryCode') countryCode: string,
  ): Promise<
    Array<{
      productType: string;
      category: string;
      rate: number;
      description: string;
    }>
  > {
    try {
      return await this.africanTaxFrameworkService.getSpecialProductTaxCategories(
        countryCode,
      );
    } catch (error) {
      this.logger.error(
        `Error getting special product tax categories: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get special product tax categories: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check if a product is exempt from tax in an African country
   *
   * @param request Tax exemption check request
   * @returns Tax exemption result
   */
  @Post('is-exempt')
  async isProductTaxExempt(@Body() request: TaxRateRequest): Promise<{
    exempt: boolean;
    reason?: string;
    exemptionCategory?: string;
  }> {
    try {
      return await this.africanTaxFrameworkService.isProductTaxExempt(request);
    } catch (error) {
      this.logger.error(
        `Error checking product tax exemption: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to check product tax exemption: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get upcoming rate changes for a country
   *
   * @param countryCode ISO country code
   * @returns Array of upcoming rate changes
   */
  @Get('upcoming-changes/:countryCode')
  async getUpcomingRateChanges(
    @Param('countryCode') countryCode: string,
  ): Promise<
    Array<{
      effectiveDate: Date;
      oldRate: number;
      newRate: number;
      taxType: string;
      description: string;
      legalReference?: string;
    }>
  > {
    try {
      return await this.africanTaxFrameworkService.getUpcomingRateChanges(
        countryCode,
      );
    } catch (error) {
      this.logger.error(
        `Error getting upcoming rate changes: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get upcoming rate changes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check if a country is supported by the African Tax Framework
   *
   * @param countryCode ISO country code
   * @returns Boolean indicating support
   */
  @Get('is-supported/:countryCode')
  async isCountrySupported(
    @Param('countryCode') countryCode: string,
  ): Promise<{ supported: boolean }> {
    try {
      const supported =
        this.africanTaxFrameworkService.isCountrySupported(countryCode);
      return { supported };
    } catch (error) {
      this.logger.error(
        `Error checking country support: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to check country support: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
