/**
 * Marketplace Sync Service
 *
 * This service coordinates the synchronization of product data between
 * the PIM module and external marketplaces like Takealot.
 */

import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';

import { LoadSheddingResilienceService } from './load-shedding-resilience.service';
import { MarketContextService } from './market-context.service';
import { NetworkAwareStorageService } from './network-aware-storage.service';
import {
  ProductMarketplaceMapping,
  MarketplaceSyncResult,
  CreateProductMarketplaceMappingDto,
} from '../models/marketplace-mapping.model';
import { ProductVariant } from '../models/product-variant.model';
import { Product } from '../models/product.model';
import { ProductMarketplaceMappingRepository } from '../repositories/product-marketplace-mapping.repository';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { ProductRepository } from '../repositories/product.repository';

/**
 * Service that provides marketplace synchronization for PIM products
 */
@Injectable()
export class MarketplaceSyncService {
  private readonly logger = new Logger(MarketplaceSyncService.name);

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly variantRepository: ProductVariantRepository,
    private readonly mappingRepository: ProductMarketplaceMappingRepository,
    private readonly loadSheddingService: LoadSheddingResilienceService,
    private readonly networkAwareStorage: NetworkAwareStorageService,
    private readonly marketContextService: MarketContextService,
    @Inject('CONNECTOR_FACTORY') private readonly connectorFactory: any,
    @Inject('PIM_MODULE_OPTIONS') private readonly options: any,
  ) {}

  /**
   * Sync a product to a marketplace
   *
   * @param productId - Product ID to sync
   * @param marketplaceId - Marketplace to sync to (e.g., 'takealot')
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns Sync result
   */
  async syncProductToMarketplace(
    productId: string,
    marketplaceId: string,
    tenantId: string,
  ): Promise<MarketplaceSyncResult> {
    try {
      // Use load shedding resilience for critical operations
      return await this.loadSheddingService.executeWithResilience(
        async () => this.performProductSync(productId, marketplaceId, tenantId),
        'marketplace-sync',
        { priority: 'high' },
      );
    } catch (error) {
      this.logger.error(
        `Error syncing product ${productId} to ${marketplaceId}: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        productId,
        marketplaceId,
        timestamp: new Date(),
        status: 'error',
        errorMessage: error.message,
      };
    }
  }

  /**
   * Internal method to perform the product sync
   */
  private async performProductSync(
    productId: string,
    marketplaceId: string,
    tenantId: string,
  ): Promise<MarketplaceSyncResult> {
    // 1. Get the product and its variants
    const product = await this.productRepository.findById(productId, tenantId);

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const variants = await this.variantRepository.findByParentId(
      productId,
      tenantId,
    );

    // 2. Get existing marketplace mapping if any
    const mapping = await this.mappingRepository.findByProductAndMarketplace(
      productId,
      marketplaceId,
      tenantId,
    );

    // 3. Get marketplace connector
    const connector = await this.getMarketplaceConnector(
      marketplaceId,
      tenantId,
    );

    // 4. Transform product to marketplace format
    const { marketplaceProduct, metadata } =
      this.transformProductToMarketplaceFormat(
        product,
        variants,
        marketplaceId,
        mapping,
      );

    // 5. Perform the sync based on whether the product exists in the marketplace
    let syncResult: MarketplaceSyncResult;

    if (mapping?.externalId) {
      // Update existing product
      syncResult = await this.updateExistingProduct(
        product,
        marketplaceProduct,
        connector,
        mapping,
        tenantId,
      );
    } else {
      // Create new product
      syncResult = await this.createNewProduct(
        product,
        marketplaceProduct,
        connector,
        marketplaceId,
        tenantId,
      );
    }

    // 6. Update sync metadata
    syncResult.metadata = {
      ...syncResult.metadata,
      ...metadata,
    };

    return syncResult;
  }

  /**
   * Transform a PIM product to marketplace format
   */
  private transformProductToMarketplaceFormat(
    product: Product,
    variants: ProductVariant[],
    marketplaceId: string,
    mapping?: ProductMarketplaceMapping,
  ): { marketplaceProduct: any; metadata: Record<string, any> } {
    let marketplaceProduct: any;
    const metadata: Record<string, any> = {};

    // Handle different marketplaces with specific transformations
    if (marketplaceId === 'takealot') {
      return this.transformProductForTakealot(product, variants, mapping);
    } else {
      // Generic transformation
      marketplaceProduct = {
        sku: product.sku,
        name: product.name,
        description: product.description,
        price: product.pricing.basePrice,
        compareAtPrice: product.pricing.rrp,
        currency: product.pricing.currency,
        stockLevel: product.stock?.quantity || 0,
        status: this.mapProductStatus(product.status),
        images: this.extractProductImages(product),
        attributes: this.extractProductAttributes(product),
      };

      // Add variants if available
      if (variants.length > 0) {
        marketplaceProduct.variants = variants.map((variant) => ({
          sku: variant.sku,
          name: variant.name,
          price: variant.pricing?.basePrice || product.pricing.basePrice,
          compareAtPrice:
            variant.pricing?.compareAtPrice || product.pricing.rrp,
          stockLevel: variant.stock?.quantity || 0,
          attributes: this.extractVariantAttributes(variant),
        }));
      }
    }

    return { marketplaceProduct, metadata };
  }

  /**
   * Transform product specifically for Takealot marketplace
   */
  private transformProductForTakealot(
    product: Product,
    variants: ProductVariant[],
    mapping?: ProductMarketplaceMapping,
  ): { marketplaceProduct: any; metadata: Record<string, any> } {
    const metadata: Record<string, any> = {
      transformationType: 'takealot',
    };

    // Get marketplace-specific overrides from mapping if available
    const priceOverride = mapping?.priceAndInventory?.overridePrice
      ? mapping.priceAndInventory.price
      : undefined;

    const stockOverride = mapping?.priceAndInventory?.overrideInventory
      ? mapping.priceAndInventory.stockLevel
      : undefined;

    // Base Takealot product format
    const takealotProduct = {
      // Takealot-specific fields
      offer_id: mapping?.southAfrica?.takealot?.offerId || '',
      shop_sku: mapping?.southAfrica?.takealot?.shopSku || product.sku,

      // Standard fields mapped to Takealot requirements
      title: product.name,
      subtitle: product.shortDescription || '',
      short_description:
        product.shortDescription || product.description.substring(0, 255),
      long_description: product.description,
      rrp:
        mapping?.southAfrica?.takealot?.rrp ||
        product.pricing.rrp ||
        product.pricing.basePrice * 1.15,
      selling_price: priceOverride || product.pricing.basePrice,
      currency: 'ZAR', // Takealot only supports ZAR
      stock_quantity: stockOverride || product.stock?.quantity || 0,
      lead_time_days: mapping?.southAfrica?.takealot?.leadTimeInDays || 1,

      // Category and attributes
      barcode: this.extractSouthAfricanBarcode(product),
      product_status: this.mapProductStatus(product.status),
      category_id: mapping?.categoryMapping?.marketplaceCategoryId || '',

      // Images
      images: this.extractProductImages(product),

      // Attributes
      attributes: this.extractTakealotAttributes(product, mapping),
    };

    // Handle variants if applicable
    if (variants.length > 0) {
      takealotProduct.has_variations = true;
      takealotProduct.variations = variants.map((variant) => ({
        shop_sku: variant.sku,
        barcode: this.extractSouthAfricanBarcode(variant),
        title: variant.name,
        selling_price: variant.pricing?.basePrice || product.pricing.basePrice,
        rrp: variant.pricing?.compareAtPrice || product.pricing.rrp,
        stock_quantity: variant.stock?.quantity || 0,
        attributes: this.extractTakealotVariantAttributes(variant),
      }));

      // Gather variant attributes for metadata
      metadata.variantAttributes = variants.map((v) => ({
        sku: v.sku,
        attributeCount: v.attributes.length,
      }));
    } else {
      takealotProduct.has_variations = false;
    }

    // Add compliance information if available
    if (product.compliance?.southAfrica) {
      takealotProduct.compliance = {
        icasa: product.compliance.southAfrica.icasa || false,
        sabs: product.compliance.southAfrica.sabs || false,
        nrcs: product.compliance.southAfrica.nrcs || false,
      };

      metadata.hasComplianceInfo = true;
    }

    return { marketplaceProduct: takealotProduct, metadata };
  }

  /**
   * Extract South African barcode from a product or variant
   */
  private extractSouthAfricanBarcode(
    productOrVariant: Product | ProductVariant,
  ): string {
    // Try to get SA-specific barcode first
    if (productOrVariant.regional?.southAfrica?.saBarcode) {
      return productOrVariant.regional.southAfrica.saBarcode;
    }

    // Look for barcode in attributes
    const barcodeAttribute = productOrVariant.attributes.find(
      (attr) =>
        attr.code === 'barcode' ||
        attr.code === 'sa_barcode' ||
        attr.code === 'ean',
    );

    if (barcodeAttribute) {
      return String(barcodeAttribute.value);
    }

    return '';
  }

  /**
   * Extract product images in the format needed for marketplaces
   */
  private extractProductImages(product: Product): string[] {
    const images: string[] = [];

    if (product.images?.main) {
      images.push(product.images.main);
    }

    if (product.images?.gallery && Array.isArray(product.images.gallery)) {
      images.push(...product.images.gallery);
    }

    return images;
  }

  /**
   * Extract product attributes in a format suitable for marketplaces
   */
  private extractProductAttributes(product: Product): Record<string, any> {
    const attributes: Record<string, any> = {};

    // Convert PIM attributes to simple key-value pairs
    product.attributes.forEach((attr) => {
      attributes[attr.code] = attr.value;
    });

    // Add dimensions as separate attributes if available
    if (product.dimensions && product.dimensions.length === 3) {
      attributes.length_cm = product.dimensions[0];
      attributes.width_cm = product.dimensions[1];
      attributes.height_cm = product.dimensions[2];
    }

    // Add weight as a separate attribute if available
    if (product.weight) {
      attributes.weight_kg = product.weight;
    }

    return attributes;
  }

  /**
   * Extract variant attributes in a format suitable for marketplaces
   */
  private extractVariantAttributes(
    variant: ProductVariant,
  ): Record<string, any> {
    const attributes: Record<string, any> = {};

    // Convert variant attributes to simple key-value pairs
    variant.attributes.forEach((attr) => {
      attributes[attr.code] = attr.value;
    });

    return attributes;
  }

  /**
   * Extract Takealot-specific attributes
   */
  private extractTakealotAttributes(
    product: Product,
    mapping?: ProductMarketplaceMapping,
  ): Record<string, any> {
    // Start with standard attributes
    const attributes = this.extractProductAttributes(product);

    // Add Takealot-specific fields from mapping overrides
    if (mapping?.attributeOverrides) {
      Object.assign(attributes, mapping.attributeOverrides);
    }

    // Add South African specific attributes
    if (product.regional?.southAfrica) {
      if (product.regional.southAfrica.icasaApproved) {
        attributes.icasa_approved = true;
      }

      if (product.regional.southAfrica.sabsApproved) {
        attributes.sabs_approved = true;
      }

      if (product.regional.southAfrica.nrcsApproved) {
        attributes.nrcs_approved = true;
      }
    }

    return attributes;
  }

  /**
   * Extract Takealot-specific variant attributes
   */
  private extractTakealotVariantAttributes(
    variant: ProductVariant,
  ): Record<string, any> {
    // Start with standard variant attributes
    const attributes = this.extractVariantAttributes(variant);

    // Add South African specific attributes
    if (variant.regional?.southAfrica) {
      if (variant.regional.southAfrica.saBarcode) {
        attributes.barcode = variant.regional.southAfrica.saBarcode;
      }
    }

    return attributes;
  }

  /**
   * Map product status to marketplace status
   */
  private mapProductStatus(status: string): string {
    switch (status) {
      case 'active':
        return 'active';
      case 'draft':
        return 'inactive';
      case 'archived':
        return 'inactive';
      default:
        return 'inactive';
    }
  }

  /**
   * Update an existing product in the marketplace
   */
  private async updateExistingProduct(
    product: Product,
    marketplaceProduct: any,
    connector: any,
    mapping: ProductMarketplaceMapping,
    tenantId: string,
  ): Promise<MarketplaceSyncResult> {
    try {
      // For Takealot, we use the connector's update methods
      // Update stock level
      const stockResult = await connector.updateStock([
        {
          sku: mapping.externalSku || product.sku,
          stockLevel: marketplaceProduct.stock_quantity || 0,
        },
      ]);

      // Update price
      const priceResult = await connector.updatePrices([
        {
          sku: mapping.externalSku || product.sku,
          price: marketplaceProduct.selling_price,
          compareAtPrice: marketplaceProduct.rrp,
        },
      ]);

      // Update product status if needed
      const statusResult = await connector.updateStatus([
        {
          sku: mapping.externalSku || product.sku,
          status:
            marketplaceProduct.product_status === 'active'
              ? 'active'
              : 'inactive',
        },
      ]);

      // Update the mapping
      await this.mappingRepository.updateSyncStatus(
        mapping.id,
        'active',
        tenantId,
      );

      return {
        success: true,
        productId: product.id,
        marketplaceId: mapping.marketplaceId,
        externalId: mapping.externalId,
        timestamp: new Date(),
        status: 'active',
        metadata: {
          stockUpdateSuccess: stockResult.success,
          priceUpdateSuccess: priceResult.success,
          statusUpdateSuccess: statusResult.success,
        },
      };
    } catch (error) {
      // Update mapping with error
      await this.mappingRepository.updateSyncStatus(
        mapping.id,
        'error',
        tenantId,
        error.message,
      );

      throw error;
    }
  }

  /**
   * Create a new product in the marketplace
   */
  private async createNewProduct(
    product: Product,
    marketplaceProduct: any,
    connector: any,
    marketplaceId: string,
    tenantId: string,
  ): Promise<MarketplaceSyncResult> {
    try {
      // For now, we'll just create a mapping (actual product creation would depend on marketplace API)
      const mappingDto: CreateProductMarketplaceMappingDto = {
        productId: product.id,
        marketplaceId,
        status: 'pending',
        lastSyncedAt: new Date(),
        tenantId,
      };

      // For Takealot, additional fields would be added
      if (marketplaceId === 'takealot') {
        mappingDto.southAfrica = {
          enabled: true,
          takealot: {
            shopSku: product.sku,
            leadTimeInDays: 1,
          },
        };

        mappingDto.priceAndInventory = {
          overridePrice: false,
          overrideInventory: false,
        };
      }

      // Create mapping
      const newMapping = await this.mappingRepository.create(
        mappingDto,
        tenantId,
      );

      // In a real implementation, we would make API calls to create the product
      // For now, we'll simulate a successful creation

      return {
        success: true,
        productId: product.id,
        marketplaceId,
        timestamp: new Date(),
        status: 'pending',
        metadata: {
          mappingCreated: true,
          mappingId: newMapping.id,
        },
      };
    } catch (error) {
      // Log error but don't rethrow
      this.logger.error(
        `Error creating new product in ${marketplaceId}: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        productId: product.id,
        marketplaceId,
        timestamp: new Date(),
        status: 'error',
        errorMessage: error.message,
      };
    }
  }

  /**
   * Get marketplace connector with proper initialization
   */
  private async getMarketplaceConnector(
    marketplaceId: string,
    tenantId: string,
  ): Promise<any> {
    try {
      // This would use dependency injection to get the connector
      const connector = await this.connectorFactory.getMarketplaceConnector(
        marketplaceId,
        tenantId,
      );

      return connector;
    } catch (error) {
      this.logger.error(
        `Error getting connector for ${marketplaceId}: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Could not initialize marketplace connector: ${error.message}`,
      );
    }
  }

  /**
   * Sync stock levels for a product to all connected marketplaces
   *
   * @param productId - Product ID
   * @param stockLevel - New stock level
   * @param tenantId - Tenant ID
   * @returns Sync results for each marketplace
   */
  async syncStockToAllMarketplaces(
    productId: string,
    stockLevel: number,
    tenantId: string,
  ): Promise<MarketplaceSyncResult[]> {
    try {
      // Find all mappings for this product
      const mappings = await this.mappingRepository.findByProductId(
        productId,
        tenantId,
      );

      // Skip if no mappings found
      if (mappings.length === 0) {
        return [];
      }

      // Sync to each marketplace
      const results = await Promise.all(
        mappings.map(async (mapping) => {
          try {
            const connector = await this.getMarketplaceConnector(
              mapping.marketplaceId,
              tenantId,
            );

            const stockUpdateResult = await connector.updateStock([
              {
                sku: mapping.externalSku || mapping.productId,
                stockLevel,
              },
            ]);

            // Update mapping status
            await this.mappingRepository.updateSyncStatus(
              mapping.id,
              stockUpdateResult.success ? 'active' : 'error',
              tenantId,
              stockUpdateResult.success ? undefined : 'Stock update failed',
            );

            return {
              success: stockUpdateResult.success,
              productId,
              marketplaceId: mapping.marketplaceId,
              externalId: mapping.externalId,
              timestamp: new Date(),
              status: stockUpdateResult.success ? 'active' : 'error',
              metadata: { stockOnly: true },
            };
          } catch (error) {
            // Update mapping with error
            await this.mappingRepository.updateSyncStatus(
              mapping.id,
              'error',
              tenantId,
              error.message,
            );

            return {
              success: false,
              productId,
              marketplaceId: mapping.marketplaceId,
              timestamp: new Date(),
              status: 'error',
              errorMessage: error.message,
              metadata: { stockOnly: true },
            };
          }
        }),
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Error syncing stock for product ${productId}: ${error.message}`,
        error.stack,
      );

      return [
        {
          success: false,
          productId,
          marketplaceId: 'all',
          timestamp: new Date(),
          status: 'error',
          errorMessage: error.message,
          metadata: { stockOnly: true },
        },
      ];
    }
  }

  /**
   * Sync price for a product to all connected marketplaces
   *
   * @param productId - Product ID
   * @param price - New price
   * @param tenantId - Tenant ID
   * @returns Sync results for each marketplace
   */
  async syncPriceToAllMarketplaces(
    productId: string,
    price: number,
    tenantId: string,
  ): Promise<MarketplaceSyncResult[]> {
    try {
      // Find all mappings for this product
      const mappings = await this.mappingRepository.findByProductId(
        productId,
        tenantId,
      );

      // Skip if no mappings found
      if (mappings.length === 0) {
        return [];
      }

      // Sync to each marketplace
      const results = await Promise.all(
        mappings.map(async (mapping) => {
          try {
            const connector = await this.getMarketplaceConnector(
              mapping.marketplaceId,
              tenantId,
            );

            const priceUpdateResult = await connector.updatePrices([
              {
                sku: mapping.externalSku || mapping.productId,
                price,
              },
            ]);

            // Update mapping status
            await this.mappingRepository.updateSyncStatus(
              mapping.id,
              priceUpdateResult.success ? 'active' : 'error',
              tenantId,
              priceUpdateResult.success ? undefined : 'Price update failed',
            );

            return {
              success: priceUpdateResult.success,
              productId,
              marketplaceId: mapping.marketplaceId,
              externalId: mapping.externalId,
              timestamp: new Date(),
              status: priceUpdateResult.success ? 'active' : 'error',
              metadata: { priceOnly: true },
            };
          } catch (error) {
            // Update mapping with error
            await this.mappingRepository.updateSyncStatus(
              mapping.id,
              'error',
              tenantId,
              error.message,
            );

            return {
              success: false,
              productId,
              marketplaceId: mapping.marketplaceId,
              timestamp: new Date(),
              status: 'error',
              errorMessage: error.message,
              metadata: { priceOnly: true },
            };
          }
        }),
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Error syncing price for product ${productId}: ${error.message}`,
        error.stack,
      );

      return [
        {
          success: false,
          productId,
          marketplaceId: 'all',
          timestamp: new Date(),
          status: 'error',
          errorMessage: error.message,
          metadata: { priceOnly: true },
        },
      ];
    }
  }

  /**
   * Find products that need to be synced to marketplaces
   *
   * @param thresholdHours - Hours threshold to consider a product as needing sync
   * @param marketplaceId - Optional marketplace ID to filter by
   * @param tenantId - Tenant ID
   * @param limit - Maximum number of products to return
   * @returns Product IDs that need sync
   */
  async findProductsNeedingSync(
    thresholdHours: number,
    marketplaceId: string | null,
    tenantId: string,
    limit = 100,
  ): Promise<string[]> {
    const mappings = await this.mappingRepository.findNeedingSync(
      thresholdHours,
      marketplaceId,
      tenantId,
      limit,
    );

    // Extract unique product IDs
    const productIds = [...new Set(mappings.map((m) => m.productId))];

    return productIds;
  }
}
