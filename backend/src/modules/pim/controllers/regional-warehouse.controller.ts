import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Logger,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { 
  RegionalWarehouseService, 
  RegionalWarehouse, 
  AllocationStrategy 
} from '../services/regional-warehouse.service';
import { MarketContextService } from '../services/market-context.service';

/**
 * Controller for managing regional warehouses for the PIM module
 * With African market optimizations for Phase 2 expansion
 */
@Controller('pim/regional-warehouses')
@UseGuards(FirebaseAuthGuard)
export class RegionalWarehouseController {
  private readonly logger = new Logger(RegionalWarehouseController.name);

  constructor(
    private readonly regionalWarehouseService: RegionalWarehouseService,
    private readonly marketContextService: MarketContextService
  ) {}

  /**
   * Get all regional warehouses for the organization
   */
  @Get()
  async getWarehouses(@GetUser() user: any): Promise<any> {
    try {
      const warehouses = await this.regionalWarehouseService.getRegionalWarehouses(user.organizationId);
      
      // Group warehouses by region for better organization
      const groupedByRegion = warehouses.reduce((groups, warehouse) => {
        const region = warehouse.region;
        if (!groups[region]) {
          groups[region] = [];
        }
        groups[region].push(warehouse);
        return groups;
      }, {} as Record<string, RegionalWarehouse[]>);
      
      return {
        total: warehouses.length,
        regions: Object.keys(groupedByRegion).length,
        regionalWarehouses: groupedByRegion
      };
    } catch (error) {
      this.logger.error(`Error getting regional warehouses: ${error.message}`);
      if (error.message.includes('not enabled')) {
        throw new BadRequestException('Multi-warehouse support is not enabled for your organization');
      }
      throw new BadRequestException(`Failed to retrieve warehouses: ${error.message}`);
    }
  }

  /**
   * Get warehouses for a specific region
   */
  @Get('by-region/:region')
  async getWarehousesByRegion(
    @Param('region') region: string,
    @GetUser() user: any
  ): Promise<any> {
    try {
      const warehouses = await this.regionalWarehouseService.getWarehousesByRegion(
        user.organizationId, 
        region
      );
      
      return {
        region,
        totalWarehouses: warehouses.length,
        warehouses
      };
    } catch (error) {
      this.logger.error(`Error getting warehouses for region ${region}: ${error.message}`);
      throw new BadRequestException(`Failed to retrieve warehouses: ${error.message}`);
    }
  }

  /**
   * Get warehouses with filtering
   */
  @Get('search')
  async findWarehouses(
    @Query('region') region?: string,
    @Query('country') country?: string,
    @Query('supportsCrossBorderShipping') supportsCrossBorderShipping?: boolean,
    @Query('canShipToCountry') canShipToCountry?: string,
    @Query('activeOnly') activeOnly?: boolean,
    @Query('requiredCapabilities') requiredCapabilities?: string,
    @Query('maxUtilization') maxUtilization?: number,
    @GetUser() user: any
  ): Promise<any> {
    try {
      // Parse boolean values
      const parsedSupportsCrossBorder = supportsCrossBorderShipping === undefined 
        ? undefined 
        : supportsCrossBorderShipping === true || supportsCrossBorderShipping === 'true';
      
      const parsedActiveOnly = activeOnly === undefined 
        ? undefined 
        : activeOnly === true || activeOnly === 'true';
      
      // Parse array
      const parsedCapabilities = requiredCapabilities 
        ? requiredCapabilities.split(',') 
        : undefined;
      
      const warehouses = await this.regionalWarehouseService.findWarehouses({
        organizationId: user.organizationId,
        region,
        country,
        supportsCrossBorderShipping: parsedSupportsCrossBorder,
        canShipToCountry,
        activeOnly: parsedActiveOnly,
        requiredCapabilities: parsedCapabilities,
        maxUtilization
      });
      
      return {
        totalMatching: warehouses.length,
        warehouses
      };
    } catch (error) {
      this.logger.error(`Error searching warehouses: ${error.message}`);
      throw new BadRequestException(`Failed to search warehouses: ${error.message}`);
    }
  }

  /**
   * Get the default warehouse for a region
   */
  @Get('default/:region')
  async getDefaultWarehouseForRegion(
    @Param('region') region: string,
    @GetUser() user: any
  ): Promise<any> {
    try {
      const warehouse = await this.regionalWarehouseService.getDefaultWarehouseForRegion(
        user.organizationId, 
        region
      );
      
      return warehouse;
    } catch (error) {
      this.logger.error(`Error getting default warehouse for region ${region}: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to get default warehouse: ${error.message}`);
    }
  }

  /**
   * Set a warehouse as the default for a region
   */
  @Put(':warehouseId/set-default/:region')
  async setDefaultWarehouseForRegion(
    @Param('warehouseId') warehouseId: string,
    @Param('region') region: string,
    @GetUser() user: any
  ): Promise<any> {
    try {
      const warehouse = await this.regionalWarehouseService.setDefaultWarehouseForRegion(
        user.organizationId, 
        warehouseId, 
        region
      );
      
      return {
        success: true,
        message: `Warehouse ${warehouse.name} set as default for region ${region}`,
        warehouse
      };
    } catch (error) {
      this.logger.error(`Error setting default warehouse: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to set default warehouse: ${error.message}`);
    }
  }

  /**
   * Get the optimal warehouse for fulfillment
   */
  @Get('optimal')
  async getOptimalWarehouse(
    @Query('productId') productId: string,
    @Query('destinationCountry') destinationCountry: string,
    @Query('strategy') strategy?: AllocationStrategy,
    @GetUser() user: any
  ): Promise<any> {
    if (!productId) {
      throw new BadRequestException('Product ID is required');
    }
    
    if (!destinationCountry) {
      throw new BadRequestException('Destination country is required');
    }
    
    try {
      const warehouse = await this.regionalWarehouseService.getOptimalWarehouse(
        user.organizationId,
        productId,
        destinationCountry,
        strategy
      );
      
      return {
        optimalWarehouse: warehouse,
        strategy: strategy || AllocationStrategy.SMART,
        destinationCountry
      };
    } catch (error) {
      this.logger.error(`Error finding optimal warehouse: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to find optimal warehouse: ${error.message}`);
    }
  }

  /**
   * Check if warehouse can fulfill a product
   */
  @Get(':warehouseId/can-fulfill/:productId')
  async canWarehouseFulfillProduct(
    @Param('warehouseId') warehouseId: string,
    @Param('productId') productId: string,
    @Query('destinationCountry') destinationCountry: string,
    @GetUser() user: any
  ): Promise<any> {
    if (!destinationCountry) {
      throw new BadRequestException('Destination country is required');
    }
    
    try {
      const result = await this.regionalWarehouseService.canWarehouseFulfillProduct(
        user.organizationId,
        warehouseId,
        productId,
        destinationCountry
      );
      
      return result;
    } catch (error) {
      this.logger.error(`Error checking fulfillment capability: ${error.message}`);
      throw new BadRequestException(`Failed to check fulfillment capability: ${error.message}`);
    }
  }

  /**
   * Get all countries that can be served
   */
  @Get('supported-countries')
  async getSupportedCountries(@GetUser() user: any): Promise<any> {
    try {
      const countries = await this.regionalWarehouseService.getSupportedCountries(user.organizationId);
      
      // Get country names from market context service
      const countryNames = await Promise.all(countries.map(async (country) => {
        try {
          // This is just a placeholder - in a real app you would have a function to get country names
          const context = await this.marketContextService.getMarketContextByRegion('africa', country);
          return {
            code: country,
            name: context.country || country // This would be the full name in a real implementation
          };
        } catch {
          return { code: country, name: country };
        }
      }));
      
      return {
        total: countries.length,
        countries: countryNames
      };
    } catch (error) {
      this.logger.error(`Error getting supported countries: ${error.message}`);
      throw new BadRequestException(`Failed to get supported countries: ${error.message}`);
    }
  }

  /**
   * Get all currencies used across warehouses
   */
  @Get('currencies')
  async getWarehouseCurrencies(@GetUser() user: any): Promise<any> {
    try {
      const currencies = await this.regionalWarehouseService.getWarehouseCurrencies(user.organizationId);
      
      // Get currency symbols/details (placeholder implementation)
      const currencyDetails = currencies.map(currency => ({
        code: currency,
        symbol: this.getCurrencySymbol(currency),
        name: this.getCurrencyName(currency)
      }));
      
      return {
        total: currencies.length,
        currencies: currencyDetails
      };
    } catch (error) {
      this.logger.error(`Error getting warehouse currencies: ${error.message}`);
      throw new BadRequestException(`Failed to get warehouse currencies: ${error.message}`);
    }
  }

  /**
   * Update warehouse regional settings
   */
  @Put(':warehouseId/regional-settings')
  async updateWarehouseRegionalSettings(
    @Param('warehouseId') warehouseId: string,
    @Body() updates: {
      supportsCrossBorderShipping?: boolean;
      shippingCountries?: string[];
      allocationPriority?: number;
      isActiveForRegion?: boolean;
      capabilities?: string[];
      estimatedLeadTimes?: {
        domestic: number;
        regional: number;
        international: number;
      };
      taxAndCompliance?: {
        vat?: {
          registrationNumber?: string;
          registeredCountry?: string;
          ratePercent: number;
        };
        customsInfo?: {
          brokerName?: string;
          supportsFulfilledByMarketplace: boolean;
          supportsImportDocuments: boolean;
        };
      };
    },
    @GetUser() user: any
  ): Promise<any> {
    try {
      const warehouse = await this.regionalWarehouseService.updateWarehouseRegionalSettings(
        user.organizationId,
        warehouseId,
        updates
      );
      
      return {
        success: true,
        message: 'Warehouse regional settings updated successfully',
        warehouse
      };
    } catch (error) {
      this.logger.error(`Error updating warehouse regional settings: ${error.message}`);
      throw new BadRequestException(`Failed to update warehouse regional settings: ${error.message}`);
    }
  }

  // Helper methods for currency formatting
  private getCurrencySymbol(currencyCode: string): string {
    const symbols: Record<string, string> = {
      'ZAR': 'R',
      'NAD': 'N$',
      'BWP': 'P',
      'LSL': 'L',
      'SZL': 'E',
      'KES': 'KSh',
      'UGX': 'USh',
      'TZS': 'TSh',
      'RWF': 'FRw',
      'NGN': '₦',
      'GHS': '₵',
      'XOF': 'CFA',
      'EGP': 'E£',
      'MAD': 'DH',
      'TND': 'DT',
      'USD': '$',
      'EUR': '€'
    };
    
    return symbols[currencyCode] || currencyCode;
  }
  
  private getCurrencyName(currencyCode: string): string {
    const names: Record<string, string> = {
      'ZAR': 'South African Rand',
      'NAD': 'Namibian Dollar',
      'BWP': 'Botswana Pula',
      'LSL': 'Lesotho Loti',
      'SZL': 'Swazi Lilangeni',
      'KES': 'Kenyan Shilling',
      'UGX': 'Ugandan Shilling',
      'TZS': 'Tanzanian Shilling',
      'RWF': 'Rwandan Franc',
      'NGN': 'Nigerian Naira',
      'GHS': 'Ghanaian Cedi',
      'XOF': 'West African CFA Franc',
      'EGP': 'Egyptian Pound',
      'MAD': 'Moroccan Dirham',
      'TND': 'Tunisian Dinar',
      'USD': 'United States Dollar',
      'EUR': 'Euro'
    };
    
    return names[currencyCode] || currencyCode;
  }
}