import { MarketplaceOrder, Order } from './types';

/**
 * Interface for mapping marketplace orders to our internal format
 */
export interface IOrderMapper {
  /**
   * Map a marketplace order to the internal Fluxori order format
   *
   * @param marketplaceOrder - The raw order from the marketplace
   * @param organizationId - The organization ID
   * @returns The mapped order in Fluxori format
   */
  mapToFluxoriOrder(
    marketplaceOrder: MarketplaceOrder,
    organizationId: string,
  ): Order;

  /**
   * Map a Fluxori order to the marketplace format (for pushing updates)
   *
   * @param order - The internal Fluxori order
   * @returns The order in marketplace format
   */
  mapToMarketplaceOrder(order: Order): MarketplaceOrder;
}

/**
 * Interface for order mapper factory
 */
export interface IOrderMapperRegistry {
  /**
   * Register a mapper for a marketplace
   *
   * @param marketplaceId - The marketplace ID
   * @param mapper - The mapper instance
   */
  registerMapper(marketplaceId: string, mapper: IOrderMapper): void;

  /**
   * Get a mapper for a marketplace
   *
   * @param marketplaceId - The marketplace ID
   * @returns The mapper for the marketplace
   * @throws Error if no mapper is registered for the marketplace
   */
  getMapper(marketplaceId: string): IOrderMapper;

  /**
   * Check if a mapper is registered for a marketplace
   *
   * @param marketplaceId - The marketplace ID
   * @returns Whether a mapper exists for the marketplace
   */
  hasMapper(marketplaceId: string): boolean;
}
