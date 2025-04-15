/**
 * Cross-Border Trade Controller
 * 
 * Controller for cross-border trade operations in African markets
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
  ValidationPipe
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { 
  CrossBorderTradeService,
  CrossBorderShippingMethod,
  CrossBorderDocumentType,
  ProductRestrictionLevel,
  RegionalTradeAgreement,
  DutyCalculationResult,
  CrossBorderShippingEstimate,
  CrossBorderShipmentDetails,
  ShippingEstimateRequest,
  ProductCustomsInfo
} from '../services/cross-border-trade.service';

/**
 * Cross-Border Trade Controller
 * 
 * API endpoints for the Cross-Border Trade service
 */
@Controller('cross-border-trade')
@UseGuards(FirebaseAuthGuard)
export class CrossBorderTradeController {
  private readonly logger = new Logger(CrossBorderTradeController.name);

  constructor(
    private readonly crossBorderTradeService: CrossBorderTradeService
  ) {}

  /**
   * Check if cross-border trade is enabled for the organization
   * 
   * @param organizationId Organization ID
   * @returns Boolean indicating if the feature is enabled
   */
  @Get('check-enabled/:organizationId')
  async isCrossBorderTradeEnabled(
    @Param('organizationId') organizationId: string
  ): Promise<{ enabled: boolean }> {
    try {
      const enabled = await this.crossBorderTradeService.isCrossBorderTradeEnabled(organizationId);
      return { enabled };
    } catch (error) {
      this.logger.error(`Error checking cross-border trade enabled: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to check cross-border trade enabled: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all regional trade agreements
   * 
   * @returns Array of regional trade agreements
   */
  @Get('trade-agreements')
  async getRegionalTradeAgreements(): Promise<RegionalTradeAgreement[]> {
    try {
      return await this.crossBorderTradeService.getRegionalTradeAgreements();
    } catch (error) {
      this.logger.error(`Error getting regional trade agreements: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to get regional trade agreements: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get trade agreement by code
   * 
   * @param code Trade agreement code
   * @returns Trade agreement or 404 if not found
   */
  @Get('trade-agreements/:code')
  async getTradeAgreementByCode(@Param('code') code: string): Promise<RegionalTradeAgreement> {
    try {
      const agreement = await this.crossBorderTradeService.getTradeAgreementByCode(code);
      
      if (!agreement) {
        throw new HttpException(
          `Trade agreement with code ${code} not found`,
          HttpStatus.NOT_FOUND
        );
      }
      
      return agreement;
    } catch (error) {
      this.logger.error(`Error getting trade agreement: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to get trade agreement: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get applicable trade agreements for a pair of countries
   * 
   * @param originCountry Origin country code
   * @param destinationCountry Destination country code
   * @returns Array of applicable trade agreements
   */
  @Get('applicable-agreements')
  async getApplicableTradeAgreements(
    @Query('originCountry') originCountry: string,
    @Query('destinationCountry') destinationCountry: string
  ): Promise<RegionalTradeAgreement[]> {
    if (!originCountry || !destinationCountry) {
      throw new HttpException(
        'Origin country and destination country are required',
        HttpStatus.BAD_REQUEST
      );
    }
    
    try {
      return await this.crossBorderTradeService.getApplicableTradeAgreements(
        originCountry,
        destinationCountry
      );
    } catch (error) {
      this.logger.error(`Error getting applicable trade agreements: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to get applicable trade agreements: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Calculate duties and taxes for a cross-border shipment
   * 
   * @param request Duty calculation request
   * @returns Duty calculation result
   */
  @Post('calculate-duties')
  async calculateDutiesAndTaxes(
    @Body(new ValidationPipe()) request: {
      organizationId: string;
      originCountry: string;
      destinationCountry: string;
      products: Array<{
        productId: string;
        hsCode: string;
        quantity: number;
        unitPrice: number;
        currency: string;
        weightKg: number;
      }>;
      shippingCost?: number;
      shippingCurrency?: string;
      insuranceAmount?: number;
      insuranceCurrency?: string;
    }
  ): Promise<DutyCalculationResult> {
    try {
      return await this.crossBorderTradeService.calculateDutiesAndTaxes(request);
    } catch (error) {
      this.logger.error(`Error calculating duties and taxes: ${error.message}`, error.stack);
      
      if (error.message.includes('not enabled')) {
        throw new HttpException(
          error.message,
          HttpStatus.FORBIDDEN
        );
      }
      
      throw new HttpException(
        `Failed to calculate duties and taxes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get shipping estimates for a cross-border shipment
   * 
   * @param request Shipping estimate request
   * @returns Array of shipping estimates
   */
  @Post('shipping-estimates')
  async getShippingEstimates(
    @Body(new ValidationPipe()) request: ShippingEstimateRequest
  ): Promise<CrossBorderShippingEstimate[]> {
    try {
      return await this.crossBorderTradeService.getShippingEstimates(request);
    } catch (error) {
      this.logger.error(`Error getting shipping estimates: ${error.message}`, error.stack);
      
      if (error.message.includes('not enabled')) {
        throw new HttpException(
          error.message,
          HttpStatus.FORBIDDEN
        );
      } else if (error.message.includes('No suitable warehouse')) {
        throw new HttpException(
          error.message,
          HttpStatus.BAD_REQUEST
        );
      }
      
      throw new HttpException(
        `Failed to get shipping estimates: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get customs information for a product
   * 
   * @param productId Product ID
   * @param organizationId Organization ID
   * @returns Product customs information
   */
  @Get('product-customs/:organizationId/:productId')
  async getProductCustomsInfo(
    @Param('productId') productId: string,
    @Param('organizationId') organizationId: string
  ): Promise<ProductCustomsInfo> {
    try {
      return await this.crossBorderTradeService.getProductCustomsInfo(productId, organizationId);
    } catch (error) {
      this.logger.error(`Error getting product customs info: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to get product customs info: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update customs information for a product
   * 
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param customsInfo Customs information
   * @returns Updated customs information
   */
  @Post('product-customs/:organizationId/:productId')
  async updateProductCustomsInfo(
    @Param('productId') productId: string,
    @Param('organizationId') organizationId: string,
    @Body() customsInfo: Partial<ProductCustomsInfo>
  ): Promise<ProductCustomsInfo> {
    try {
      return await this.crossBorderTradeService.updateProductCustomsInfo(
        productId,
        organizationId,
        customsInfo
      );
    } catch (error) {
      this.logger.error(`Error updating product customs info: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to update product customs info: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create a new cross-border shipment
   * 
   * @param organizationId Organization ID
   * @param shipmentDetails Shipment details
   * @param user Authenticated user
   * @returns Created shipment details
   */
  @Post('shipments/:organizationId')
  async createCrossBorderShipment(
    @Param('organizationId') organizationId: string,
    @Body() shipmentDetails: Omit<CrossBorderShipmentDetails, 'shipmentId' | 'documentStatus'>,
    @GetUser() user: any
  ): Promise<CrossBorderShipmentDetails> {
    try {
      // Add audit trail with user info
      const shipmentWithAudit = {
        ...shipmentDetails,
        additionalInfo: {
          ...shipmentDetails.additionalInfo,
          createdBy: user.uid,
          createdAt: new Date()
        }
      };
      
      return await this.crossBorderTradeService.createCrossBorderShipment(
        organizationId,
        shipmentWithAudit
      );
    } catch (error) {
      this.logger.error(`Error creating cross-border shipment: ${error.message}`, error.stack);
      
      if (error.message.includes('not enabled')) {
        throw new HttpException(
          error.message,
          HttpStatus.FORBIDDEN
        );
      }
      
      throw new HttpException(
        `Failed to create cross-border shipment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Check if a product can be shipped to a destination country
   * 
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param destinationCountry Destination country
   * @returns Shipping eligibility result
   */
  @Get('eligibility-check/:organizationId/:productId')
  async checkProductShippingEligibility(
    @Param('productId') productId: string,
    @Param('organizationId') organizationId: string,
    @Query('destinationCountry') destinationCountry: string
  ): Promise<{
    eligible: boolean;
    restrictionLevel: ProductRestrictionLevel;
    requiredDocuments: CrossBorderDocumentType[];
    reason?: string;
  }> {
    if (!destinationCountry) {
      throw new HttpException(
        'Destination country is required',
        HttpStatus.BAD_REQUEST
      );
    }
    
    try {
      return await this.crossBorderTradeService.checkProductShippingEligibility({
        productId,
        organizationId,
        destinationCountry
      });
    } catch (error) {
      this.logger.error(`Error checking product shipping eligibility: ${error.message}`, error.stack);
      
      if (error.message.includes('not enabled')) {
        throw new HttpException(
          error.message,
          HttpStatus.FORBIDDEN
        );
      }
      
      throw new HttpException(
        `Failed to check product shipping eligibility: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get country-specific restrictions for a product based on HS code
   * 
   * @param countryCode Destination country
   * @param hsCode HS code
   * @returns Country-specific restrictions
   */
  @Get('country-restrictions/:countryCode/:hsCode')
  async getCountryProductRestrictions(
    @Param('countryCode') countryCode: string,
    @Param('hsCode') hsCode: string
  ): Promise<{
    restrictionLevel: ProductRestrictionLevel;
    requiredDocuments: CrossBorderDocumentType[];
    reason?: string;
  }> {
    try {
      return await this.crossBorderTradeService.getCountryProductRestrictions(
        countryCode,
        hsCode
      );
    } catch (error) {
      this.logger.error(`Error getting country product restrictions: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to get country product restrictions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}