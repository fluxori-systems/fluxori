import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  BadRequestException
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { 
  MultiCurrencyService, 
  MultiCurrencyConfig,
  PriceConversionResult
} from '../services/multi-currency.service';
import { MarketContextService } from '../services/market-context.service';

/**
 * Controller for multi-currency pricing in the PIM module
 * With African market optimizations for Phase 2 expansion
 */
@Controller('pim/multi-currency')
@UseGuards(FirebaseAuthGuard)
export class MultiCurrencyController {
  private readonly logger = new Logger(MultiCurrencyController.name);

  constructor(
    private readonly multiCurrencyService: MultiCurrencyService,
    private readonly marketContextService: MarketContextService
  ) {}

  /**
   * Get the multi-currency configuration for the organization
   */
  @Get('config')
  async getConfig(@GetUser() user: any): Promise<any> {
    try {
      const config = await this.multiCurrencyService.getMultiCurrencyConfig(user.organizationId);
      
      return {
        success: true,
        config
      };
    } catch (error) {
      this.logger.error(`Error getting multi-currency config: ${error.message}`);
      throw new BadRequestException(`Failed to retrieve configuration: ${error.message}`);
    }
  }

  /**
   * Update the multi-currency configuration
   */
  @Put('config')
  async updateConfig(
    @Body() config: Partial<MultiCurrencyConfig>,
    @GetUser() user: any
  ): Promise<any> {
    try {
      const updatedConfig = await this.multiCurrencyService.setMultiCurrencyConfig(
        user.organizationId, 
        config
      );
      
      return {
        success: true,
        message: 'Multi-currency configuration updated successfully',
        config: updatedConfig
      };
    } catch (error) {
      this.logger.error(`Error updating multi-currency config: ${error.message}`);
      throw new BadRequestException(`Failed to update configuration: ${error.message}`);
    }
  }

  /**
   * Get all supported currencies
   */
  @Get('currencies')
  async getSupportedCurrencies(): Promise<any> {
    try {
      const currencies = await this.multiCurrencyService.getSupportedCurrencies();
      
      // Group currencies by region
      const groupedByRegion = currencies.reduce((groups, currency) => {
        if (currency.regions) {
          for (const region of currency.regions) {
            if (!groups[region]) {
              groups[region] = [];
            }
            
            // Avoid duplicate entries
            if (!groups[region].some(c => c.code === currency.code)) {
              groups[region].push(currency);
            }
          }
        }
        return groups;
      }, {} as Record<string, any[]>);
      
      return {
        success: true,
        total: currencies.length,
        currencies,
        regions: groupedByRegion
      };
    } catch (error) {
      this.logger.error(`Error getting supported currencies: ${error.message}`);
      throw new BadRequestException(`Failed to retrieve currencies: ${error.message}`);
    }
  }

  /**
   * Get enabled currencies for the organization
   */
  @Get('enabled-currencies')
  async getEnabledCurrencies(@GetUser() user: any): Promise<any> {
    try {
      const currencies = await this.multiCurrencyService.getEnabledCurrencies(user.organizationId);
      
      return {
        success: true,
        total: currencies.length,
        currencies
      };
    } catch (error) {
      this.logger.error(`Error getting enabled currencies: ${error.message}`);
      throw new BadRequestException(`Failed to retrieve enabled currencies: ${error.message}`);
    }
  }

  /**
   * Get exchange rate between two currencies
   */
  @Get('exchange-rate')
  async getExchangeRate(
    @Query('from') fromCurrency: string,
    @Query('to') toCurrency: string,
    @GetUser() user: any
  ): Promise<any> {
    if (!fromCurrency || !toCurrency) {
      throw new BadRequestException('Both from and to currency codes are required');
    }
    
    try {
      const rate = await this.multiCurrencyService.getExchangeRate(fromCurrency, toCurrency);
      
      return {
        success: true,
        from: rate.from,
        to: rate.to,
        rate: rate.rate,
        lastUpdated: rate.lastUpdated,
        source: rate.source
      };
    } catch (error) {
      this.logger.error(`Error getting exchange rate: ${error.message}`);
      throw new BadRequestException(`Failed to retrieve exchange rate: ${error.message}`);
    }
  }

  /**
   * Convert price between currencies
   */
  @Post('convert-price')
  async convertPrice(
    @Body() body: {
      price: number;
      fromCurrency: string;
      toCurrency: string;
      includesVat?: boolean;
      options?: {
        roundingMethod?: 'up' | 'down' | 'nearest';
        precision?: number;
        usePsychologicalPricing?: boolean;
        vat?: {
          sourceRate?: number;
          targetRate?: number;
        };
      };
    },
    @GetUser() user: any
  ): Promise<any> {
    if (!body.price || !body.fromCurrency || !body.toCurrency) {
      throw new BadRequestException('Price, fromCurrency, and toCurrency are required');
    }
    
    try {
      const result = await this.multiCurrencyService.convertPrice(
        body.price,
        body.fromCurrency,
        body.toCurrency,
        body.includesVat,
        body.options
      );
      
      // Format the prices for display
      const originalPriceFormatted = await this.multiCurrencyService.formatPrice(
        result.originalPrice,
        result.originalCurrency
      );
      
      const convertedPriceFormatted = await this.multiCurrencyService.formatPrice(
        result.convertedPrice,
        result.targetCurrency
      );
      
      return {
        success: true,
        conversion: {
          ...result,
          originalPriceFormatted,
          convertedPriceFormatted
        }
      };
    } catch (error) {
      this.logger.error(`Error converting price: ${error.message}`);
      throw new BadRequestException(`Failed to convert price: ${error.message}`);
    }
  }

  /**
   * Bulk convert prices for multiple products
   */
  @Post('convert-multiple-prices')
  async convertMultiplePrices(
    @Body() body: {
      items: Array<{ id: string; price: number }>;
      fromCurrency: string;
      toCurrency: string;
      includesVat?: boolean;
      options?: {
        roundingMethod?: 'up' | 'down' | 'nearest';
        precision?: number;
        usePsychologicalPricing?: boolean;
        vat?: {
          sourceRate?: number;
          targetRate?: number;
        };
      };
    },
    @GetUser() user: any
  ): Promise<any> {
    if (!body.items || !body.fromCurrency || !body.toCurrency) {
      throw new BadRequestException('Items, fromCurrency, and toCurrency are required');
    }
    
    try {
      const results = await this.multiCurrencyService.convertMultiplePrices(
        body.items,
        body.fromCurrency,
        body.toCurrency,
        body.includesVat,
        body.options
      );
      
      // For each result, add formatted price strings
      const enhancedResults = await Promise.all(results.map(async item => {
        const result = item.result;
        
        // Format the prices for display
        const originalPriceFormatted = await this.multiCurrencyService.formatPrice(
          result.originalPrice,
          result.originalCurrency
        );
        
        const convertedPriceFormatted = await this.multiCurrencyService.formatPrice(
          result.convertedPrice,
          result.targetCurrency
        );
        
        return {
          ...item,
          result: {
            ...result,
            originalPriceFormatted,
            convertedPriceFormatted
          }
        };
      }));
      
      return {
        success: true,
        exchangeRate: results[0]?.result.exchangeRate,
        totalItems: results.length,
        conversions: enhancedResults
      };
    } catch (error) {
      this.logger.error(`Error converting multiple prices: ${error.message}`);
      throw new BadRequestException(`Failed to convert prices: ${error.message}`);
    }
  }

  /**
   * Get currencies for a specific region
   */
  @Get('region-currencies/:region')
  async getCurrenciesForRegion(
    @Param('region') region: string
  ): Promise<any> {
    try {
      const currencies = await this.multiCurrencyService.getCurrenciesForRegion(region);
      
      return {
        success: true,
        region,
        total: currencies.length,
        currencies
      };
    } catch (error) {
      this.logger.error(`Error getting currencies for region ${region}: ${error.message}`);
      throw new BadRequestException(`Failed to retrieve region currencies: ${error.message}`);
    }
  }

  /**
   * Get default currency for a region
   */
  @Get('default-currency/:region')
  async getDefaultCurrencyForRegion(
    @Param('region') region: string
  ): Promise<any> {
    try {
      const currency = await this.multiCurrencyService.getDefaultCurrencyForRegion(region);
      
      return {
        success: true,
        region,
        defaultCurrency: currency
      };
    } catch (error) {
      this.logger.error(`Error getting default currency for region ${region}: ${error.message}`);
      throw new BadRequestException(`Failed to retrieve default currency: ${error.message}`);
    }
  }

  /**
   * Format a price according to currency rules
   */
  @Get('format-price')
  async formatPrice(
    @Query('price') price: number,
    @Query('currency') currency: string,
    @Query('style') style?: 'currency' | 'decimal',
    @Query('showSymbol') showSymbol?: boolean,
    @Query('locale') locale?: string
  ): Promise<any> {
    if (!price || !currency) {
      throw new BadRequestException('Price and currency are required');
    }
    
    try {
      // Parse parameters
      const priceNum = Number(price);
      const showSymbolBool = showSymbol === undefined ? undefined : showSymbol === 'true';
      
      const formatted = await this.multiCurrencyService.formatPrice(
        priceNum,
        currency,
        {
          style: style as 'currency' | 'decimal',
          showSymbol: showSymbolBool,
          locale
        }
      );
      
      return {
        success: true,
        price: priceNum,
        currency,
        formatted
      };
    } catch (error) {
      this.logger.error(`Error formatting price: ${error.message}`);
      throw new BadRequestException(`Failed to format price: ${error.message}`);
    }
  }

  /**
   * Update all exchange rates
   */
  @Post('update-exchange-rates')
  async updateExchangeRates(
    @GetUser() user: any
  ): Promise<any> {
    try {
      const success = await this.multiCurrencyService.updateAllExchangeRates();
      
      return {
        success,
        message: 'Exchange rates updated successfully'
      };
    } catch (error) {
      this.logger.error(`Error updating exchange rates: ${error.message}`);
      throw new BadRequestException(`Failed to update exchange rates: ${error.message}`);
    }
  }
}