import { Injectable, Logger } from '@nestjs/common';
import { IOrderMapper, IOrderMapperRegistry } from '../interfaces/order-mapper.interface';

@Injectable()
export class OrderMapperRegistry implements IOrderMapperRegistry {
  private readonly mappers = new Map<string, IOrderMapper>();
  private readonly logger = new Logger(OrderMapperRegistry.name);
  
  /**
   * Register a mapper for a marketplace
   * 
   * @param marketplaceId - The marketplace ID
   * @param mapper - The mapper instance
   */
  registerMapper(marketplaceId: string, mapper: IOrderMapper): void {
    this.logger.log(`Registering order mapper for marketplace: ${marketplaceId}`);
    
    if (this.mappers.has(marketplaceId)) {
      this.logger.warn(`Overriding existing order mapper for marketplace: ${marketplaceId}`);
    }
    
    this.mappers.set(marketplaceId, mapper);
  }
  
  /**
   * Get a mapper for a marketplace
   * 
   * @param marketplaceId - The marketplace ID
   * @returns The mapper for the marketplace
   * @throws Error if no mapper is registered for the marketplace
   */
  getMapper(marketplaceId: string): IOrderMapper {
    const mapper = this.mappers.get(marketplaceId);
    
    if (!mapper) {
      this.logger.error(`No order mapper registered for marketplace: ${marketplaceId}`);
      throw new Error(`No order mapper registered for marketplace: ${marketplaceId}`);
    }
    
    return mapper;
  }
  
  /**
   * Check if a mapper is registered for a marketplace
   * 
   * @param marketplaceId - The marketplace ID
   * @returns Whether a mapper exists for the marketplace
   */
  hasMapper(marketplaceId: string): boolean {
    return this.mappers.has(marketplaceId);
  }
}