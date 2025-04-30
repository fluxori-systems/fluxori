/**
 * Takealot Connector Service
 *
 * This service provides specialized functionality for integrating with the Takealot
 * marketplace, focusing on South African e-commerce specific needs.
 */

import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';

import { LoadSheddingResilienceService } from './load-shedding-resilience.service';
import { MarketContextService } from './market-context.service';
import { NetworkAwareStorageService } from './network-aware-storage.service';
import { ProductVariantService } from './product-variant.service';
import { ProductService } from './product.service';
import { OperationResult } from '../interfaces/types';
import {
  ProductMarketplaceMapping,
  MarketplaceSyncResult,
} from '../models/marketplace-mapping.model';
import { ProductVariant } from '../models/product-variant.model';
import { Product } from '../models/product.model';
import { ProductMarketplaceMappingRepository } from '../repositories/product-marketplace-mapping.repository';

/**
 * Takealot category mapping
 */
export interface TakealotCategory {
  /**
   * Takealot category ID
   */
  id: string;

  /**
   * Category name
   */
  name: string;

  /**
   * Parent category ID
   */
  parentId?: string;

  /**
   * Takealot category path
   */
  path: string;

  /**
   * Required attributes for this category
   */
  requiredAttributes: string[];

  /**
   * Whether this is a leaf category
   */
  isLeaf: boolean;
}

/**
 * Takealot product data
 */
import { ProductAttribute } from '../interfaces/types';

export interface TakealotProduct {
  /**
   * Takealot offer ID
   */
  offerId?: string;

  /**
   * Seller SKU
   */
  sku: string;

  /**
   * Product title
   */
  title: string;

  /**
   * Product subtitle
   */
  subtitle?: string;

  /**
   * Short description
   */
  shortDescription: string;

  /**
   * Long description
   */
  longDescription: string;

  /**
   * Recommended retail price
   */
  rrp: number;

  /**
   * Selling price
   */
  sellingPrice: number;

  /**
   * Stock quantity
   */
  stockQuantity: number;

  /**
   * Barcode (EAN/UPC/ISBN)
   */
  barcode?: string;

  /**
   * Product images
   */
  images: string[];

  /**
   * Product attributes
   */
  attributes: ProductAttribute[];

  /**
   * Product status
   */
  status: 'active' | 'inactive';

  /**
   * Lead time in days
   */
  leadTimeDays: number;

  /**
   * Takealot category ID
   */
  categoryId: string;

  /**
   * Whether the product has variants
   */
  hasVariations: boolean;

  /**
   * Product variants
   */
  variations?: TakealotVariant[];

  /**
   * South African compliance information
   */
  compliance?: {
    /**
     * ICASA approval status
     */
    icasa?: boolean;

    /**
     * SABS approval status
     */
    sabs?: boolean;

    /**
     * NRCS approval status
     */
    nrcs?: boolean;
  };
}

/**
 * Takealot product variant
 */
export interface TakealotVariant {
  /**
   * Seller SKU
   */
  sku: string;

  /**
   * Variant title
   */
  title: string;

  /**
   * Barcode
   */
  barcode?: string;

  /**
   * Selling price
   */
  sellingPrice: number;

  /**
   * Recommended retail price
   */
  rrp?: number;

  /**
   * Stock quantity
   */
  stockQuantity: number;

  /**
   * Variant attributes
   */
  attributes: ProductAttribute[];
}

/**
 * Service for Takealot marketplace integration
 */
@Injectable()
export class TakealotConnectorService {
  private readonly logger = new Logger(TakealotConnectorService.name);

  constructor(
    private readonly productService: ProductService,
    private readonly variantService: ProductVariantService,
    private readonly mappingRepository: ProductMarketplaceMappingRepository,
    private readonly networkAwareStorage: NetworkAwareStorageService,
    private readonly loadSheddingService: LoadSheddingResilienceService,
    private readonly marketContextService: MarketContextService,
    @Inject('CONNECTOR_FACTORY') private readonly connectorFactory: any,
    @Inject('PIM_MODULE_OPTIONS') private readonly options: any,
  ) {}

  /**
   * Transform a PIM product to Takealot format
   *
   * @param product - PIM product
   * @param variants - Product variants
   * @param mapping - Existing marketplace mapping (if any)
   * @returns Takealot product data
   */
  async transformToTakealotFormat(
    product: Product,
    variants: ProductVariant[] = [],
    mapping?: ProductMarketplaceMapping,
  ): Promise<TakealotProduct> {
    // Get marketplace-specific overrides from mapping if available
    const priceOverride = mapping?.priceAndInventory?.overridePrice
      ? mapping.priceAndInventory.price
      : undefined;

    const stockOverride = mapping?.priceAndInventory?.overrideInventory
      ? mapping.priceAndInventory.stockLevel
      : undefined;

    // Base Takealot product format
    const takealotProduct: TakealotProduct = {
      offerId: mapping?.southAfrica?.takealot?.offerId || '',
      sku: mapping?.southAfrica?.takealot?.shopSku || product.sku,
      title: product.name,
      subtitle: product.shortDescription || '',
      shortDescription:
        product.shortDescription || product.description.substring(0, 255),
      longDescription: product.description,
      rrp:
        mapping?.southAfrica?.takealot?.rrp ||
        product.pricing.rrp ||
        product.pricing.basePrice * 1.15,
      sellingPrice: priceOverride || product.pricing.basePrice,
      stockQuantity: stockOverride || product.stock?.quantity || 0,
      leadTimeDays: mapping?.southAfrica?.takealot?.leadTimeInDays || 1,
      barcode: this.extractSouthAfricanBarcode(product),
      status: this.mapProductStatus(product.status),
      categoryId: mapping?.categoryMapping?.marketplaceCategoryId || '',
      images: this.extractProductImages(product),
      attributes: this.extractTakealotAttributes(product, mapping),
      hasVariations: variants.length > 0,
    };

    // Handle variants if applicable
    if (variants.length > 0) {
      takealotProduct.variations = variants.map((variant) => ({
        sku: variant.sku,
        title: variant.name,
        barcode: this.extractSouthAfricanBarcode(variant),
        sellingPrice: variant.pricing?.basePrice || product.pricing.basePrice,
        rrp: variant.pricing?.compareAtPrice || product.pricing.rrp,
        stockQuantity: variant.stock?.quantity || 0,
        attributes: this.extractTakealotVariantAttributes(variant),
      }));
    }

    // Add compliance information if available
    if (product.compliance?.southAfrica) {
      takealotProduct.compliance = {
        icasa: product.compliance.southAfrica.icasa || false,
        sabs: product.compliance.southAfrica.sabs || false,
        nrcs: product.compliance.southAfrica.nrcs || false,
      };
    }

    // Process images with network-aware storage if needed
    const networkInfo = await this.networkAwareStorage.getNetworkQuality();

    if (
      networkInfo.connectionQuality !== 'high' &&
      takealotProduct.images.length > 0
    ) {
      // Optimize images based on network conditions
      takealotProduct.images = await Promise.all(
        takealotProduct.images.map((url) =>
          this.networkAwareStorage.optimizeImageUrl(url, networkInfo),
        ),
      );
    }

    return takealotProduct;
  }

  /**
   * Sync a product to Takealot marketplace
   *
   * @param productId - Product ID to sync
   * @param tenantId - Tenant ID
   * @returns Sync result
   */
  async syncProductToTakealot(
    productId: string,
    tenantId: string,
  ): Promise<MarketplaceSyncResult> {
    try {
      // Use load shedding resilience for critical operations
      return await this.loadSheddingService.executeWithResilience(
        async () => this.performTakealotSync(productId, tenantId),
        'takealot-sync',
        { priority: 'high' },
      );
    } catch (error) {
      this.logger.error(
        `Error syncing product ${productId} to Takealot: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        productId,
        marketplaceId: 'takealot',
        timestamp: new Date(),
        status: 'error',
        errorMessage: error.message,
      };
    }
  }

  /**
   * Internal method to perform the Takealot sync
   */
  private async performTakealotSync(
    productId: string,
    tenantId: string,
  ): Promise<MarketplaceSyncResult> {
    // 1. Get the product and its variants
    const product = await this.productService.findById(productId, tenantId);

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const variants = await this.variantService.findByParentId(
      productId,
      tenantId,
    );

    // 2. Get existing marketplace mapping if any
    const mapping = await this.mappingRepository.findByProductAndMarketplace(
      productId,
      'takealot',
      tenantId,
    );

    // 3. Get Takealot connector
    const connector = await this.getTakealotConnector(tenantId);

    // 4. Transform product to Takealot format
    const takealotProduct = await this.transformToTakealotFormat(
      product,
      variants,
      mapping,
    );

    // 5. Perform the sync based on whether the product exists in the marketplace
    let syncResult: MarketplaceSyncResult;

    if (mapping?.externalId) {
      // Update existing product
      syncResult = await this.updateExistingTakealotProduct(
        product,
        takealotProduct,
        connector,
        mapping,
        tenantId,
      );
    } else {
      // Create new product
      syncResult = await this.createNewTakealotProduct(
        product,
        takealotProduct,
        connector,
        tenantId,
      );
    }

    return syncResult;
  }

  /**
   * Update an existing product in Takealot
   */
  private async updateExistingTakealotProduct(
    product: Product,
    takealotProduct: TakealotProduct,
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
          stockLevel: takealotProduct.stockQuantity,
        },
      ]);

      // Update price
      const priceResult = await connector.updatePrices([
        {
          sku: mapping.externalSku || product.sku,
          price: takealotProduct.sellingPrice,
          compareAtPrice: takealotProduct.rrp,
        },
      ]);

      // Update product status if needed
      const statusResult = await connector.updateStatus([
        {
          sku: mapping.externalSku || product.sku,
          status: takealotProduct.status,
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
        marketplaceId: 'takealot',
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
   * Create a new product in Takealot
   */
  private async createNewTakealotProduct(
    product: Product,
    takealotProduct: TakealotProduct,
    connector: any,
    tenantId: string,
  ): Promise<MarketplaceSyncResult> {
    try {
      // Create a mapping for this new product
      const mappingDto = {
        productId: product.id,
        marketplaceId: 'takealot',
        status: 'pending' as const,
        lastSyncedAt: new Date(),
        tenantId,
        southAfrica: {
          enabled: true,
          takealot: {
            shopSku: product.sku,
            leadTimeInDays: 1,
          },
        },
        priceAndInventory: {
          overridePrice: false,
          overrideInventory: false,
        },
      };

      // Create mapping
      const newMapping = await this.mappingRepository.create(
        mappingDto,
        tenantId,
      );

      // In a real implementation, we would make API calls to create the product
      // For now, we'll simulate a successful creation with a pending status

      return {
        success: true,
        productId: product.id,
        marketplaceId: 'takealot',
        timestamp: new Date(),
        status: 'pending',
        metadata: {
          mappingCreated: true,
          mappingId: newMapping.id,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error creating new product in Takealot: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        productId: product.id,
        marketplaceId: 'takealot',
        timestamp: new Date(),
        status: 'error',
        errorMessage: error.message,
      };
    }
  }

  /**
   * Get Takealot categories
   *
   * @param tenantId - Tenant ID
   * @param parentId - Optional parent category ID
   * @returns Takealot categories
   */
  async getTakealotCategories(
    tenantId: string,
    parentId?: string,
  ): Promise<TakealotCategory[]> {
    try {
      const connector = await this.getTakealotConnector(tenantId);

      // Get categories from Takealot
      const categoriesResult = await connector.getCategories(parentId);

      if (!categoriesResult.success) {
        throw new Error(
          `Failed to get Takealot categories: ${categoriesResult.error?.message}`,
        );
      }

      // Transform to our TakealotCategory format
      return categoriesResult.data.map((cat) => ({
        id: cat.id,
        name: cat.name,
        parentId: cat.parentId,
        path: cat.breadcrumb || cat.name,
        requiredAttributes: cat.requiredAttributes || [],
        isLeaf: cat.isLeaf || false,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting Takealot categories: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get category attributes for a Takealot category
   *
   * @param tenantId - Tenant ID
   * @param categoryId - Takealot category ID
   * @returns Category attributes
   */
  async getCategoryAttributes(
    tenantId: string,
    categoryId: string,
  ): Promise<
    {
      id: string;
      name: string;
      required: boolean;
      type: string;
      values?: string[];
    }[]
  > {
    try {
      const connector = await this.getTakealotConnector(tenantId);

      // Get category attributes from Takealot
      const attributesResult =
        await connector.getCategoryAttributes(categoryId);

      if (!attributesResult.success) {
        throw new Error(
          `Failed to get category attributes: ${attributesResult.error?.message}`,
        );
      }

      return attributesResult.data;
    } catch (error) {
      this.logger.error(
        `Error getting category attributes: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update product stock on Takealot
   *
   * @param productId - Product ID
   * @param stockLevel - New stock level
   * @param tenantId - Tenant ID
   * @returns Operation result
   */
  async updateTakealotStock(
    productId: string,
    stockLevel: number,
    tenantId: string,
  ): Promise<OperationResult<{ productId: string; stockLevel: number }>> {
    try {
      // Check if product has Takealot mapping
      const mapping = await this.mappingRepository.findByProductAndMarketplace(
        productId,
        'takealot',
        tenantId,
      );

      if (!mapping) {
        return {
          success: false,
          error: {
            code: 'NO_MAPPING',
            message: 'Product is not mapped to Takealot',
          },
        };
      }

      // Get Takealot connector
      const connector = await this.getTakealotConnector(tenantId);

      // Update stock on Takealot
      const result = await connector.updateStock([
        {
          sku: mapping.externalSku || mapping.productId,
          stockLevel,
        },
      ]);

      // Update mapping status
      if (result.success) {
        await this.mappingRepository.updateSyncStatus(
          mapping.id,
          'active',
          tenantId,
        );
      } else {
        await this.mappingRepository.updateSyncStatus(
          mapping.id,
          'error',
          tenantId,
          result.error?.message,
        );
      }

      return {
        success: result.success,
        data: { productId, stockLevel },
        error: result.error,
      };
    } catch (error) {
      this.logger.error(
        `Error updating Takealot stock: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Update product price on Takealot
   *
   * @param productId - Product ID
   * @param price - New price
   * @param tenantId - Tenant ID
   * @returns Operation result
   */
  async updateTakealotPrice(
    productId: string,
    price: number,
    tenantId: string,
  ): Promise<OperationResult<{ productId: string; price: number }>> {
    try {
      // Check if product has Takealot mapping
      const mapping = await this.mappingRepository.findByProductAndMarketplace(
        productId,
        'takealot',
        tenantId,
      );

      if (!mapping) {
        return {
          success: false,
          error: {
            code: 'NO_MAPPING',
            message: 'Product is not mapped to Takealot',
          },
        };
      }

      // Get Takealot connector
      const connector = await this.getTakealotConnector(tenantId);

      // Get product to determine RRP
      const product = await this.productService.findById(productId, tenantId);

      if (!product) {
        return {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        };
      }

      // Calculate RRP (usually 15% higher than selling price for Takealot)
      const rrp =
        mapping?.southAfrica?.takealot?.rrp ||
        Math.round(price * 1.15 * 100) / 100;

      // Update price on Takealot
      const result = await connector.updatePrices([
        {
          sku: mapping.externalSku || mapping.productId,
          price,
          compareAtPrice: rrp,
        },
      ]);

      // Update mapping status
      if (result.success) {
        await this.mappingRepository.updateSyncStatus(
          mapping.id,
          'active',
          tenantId,
        );
      } else {
        await this.mappingRepository.updateSyncStatus(
          mapping.id,
          'error',
          tenantId,
          result.error?.message,
        );
      }

      return {
        success: result.success,
        data: { productId, price },
        error: result.error,
      };
    } catch (error) {
      this.logger.error(
        `Error updating Takealot price: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Get Takealot connector with proper initialization
   */
  private async getTakealotConnector(tenantId: string): Promise<any> {
    try {
      // This would use dependency injection to get the connector
      const connector = await this.connectorFactory.getMarketplaceConnector(
        'takealot',
        tenantId,
      );

      return connector;
    } catch (error) {
      this.logger.error(
        `Error getting Takealot connector: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Could not initialize Takealot connector: ${error.message}`,
      );
    }
  }

  /**
   * Helper method: Extract South African barcode
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
   * Helper method: Extract product images
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
   * Helper method: Extract Takealot attributes
   */
  private extractTakealotAttributes(
    product: Product,
    mapping?: ProductMarketplaceMapping,
  ): ProductAttribute[] {
    // Start with standard attributes
    const attributes: ProductAttribute[] = [...(product.attributes || [])];

    // Add dimensions as separate attributes if available
    if (product.dimensions && product.dimensions.length === 3) {
      attributes.push({ code: 'length_cm', label: 'Length (cm)', type: 'number', value: product.dimensions[0] });
      attributes.push({ code: 'width_cm', label: 'Width (cm)', type: 'number', value: product.dimensions[1] });
      attributes.push({ code: 'height_cm', label: 'Height (cm)', type: 'number', value: product.dimensions[2] });
    }

    // Add weight as a separate attribute if available
    if (product.weight) {
      attributes.push({ code: 'weight_kg', label: 'Weight (kg)', type: 'number', value: product.weight });
    }

    // Add Takealot-specific fields from mapping overrides
    if (mapping?.attributeOverrides) {
      for (const [code, value] of Object.entries(mapping.attributeOverrides)) {
        attributes.push({ code, label: code, type: typeof value, value });
      }
    }

    // Add South African specific attributes
    if (product.regional?.southAfrica) {
      if (product.regional.southAfrica.icasaApproved) {
        attributes.push({ code: 'icasa_approved', label: 'ICASA Approved', type: 'boolean', value: true });
      }
      if (product.regional.southAfrica.sabsApproved) {
        attributes.push({ code: 'sabs_approved', label: 'SABS Approved', type: 'boolean', value: true });
      }
      if (product.regional.southAfrica.nrcsApproved) {
        attributes.push({ code: 'nrcs_approved', label: 'NRCS Approved', type: 'boolean', value: true });
      }
    }

    return attributes;
  }

  /**
   * Helper method: Extract Takealot variant attributes
   */
  private extractTakealotVariantAttributes(
    variant: ProductVariant,
  ): ProductAttribute[] {
    // Start with standard variant attributes
    const attributes: ProductAttribute[] = [...(variant.attributes || [])];

    // Add South African specific attributes
    if (variant.regional?.southAfrica) {
      if (variant.regional.southAfrica.saBarcode) {
        attributes.push({ code: 'barcode', label: 'SA Barcode', type: 'string', value: variant.regional.southAfrica.saBarcode });
      }
    }

    return attributes;
  }

  /**
   * Helper method: Map product status to Takealot status
   */
  private mapProductStatus(status: string): 'active' | 'inactive' {
    switch (status) {
      case 'active':
        return 'active';
      case 'draft':
      case 'archived':
      default:
        return 'inactive';
    }
  }
}
