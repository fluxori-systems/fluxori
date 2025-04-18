import { Injectable, Logger, Inject } from "@nestjs/common";

import { MarketplaceAdapterFactory } from "./marketplace-adapter.factory";
import { IMarketplaceAdapter } from "../interfaces/marketplace-adapter.interface";
import { MarketplaceProduct } from "../interfaces/types";
import { MarketplaceCredentialsRepository } from "../repositories/marketplace-credentials.repository";
import { IProductService } from "../../../shared/interfaces/product.interface";
import { PRODUCT_SERVICE_TOKEN } from "../../../shared/tokens";

/**
 * Service for synchronizing data between inventory and marketplaces
 */
@Injectable()
export class MarketplaceSyncService {
  private readonly logger = new Logger(MarketplaceSyncService.name);

  constructor(
    private readonly adapterFactory: MarketplaceAdapterFactory,
    private readonly credentialsRepository: MarketplaceCredentialsRepository,
    @Inject(PRODUCT_SERVICE_TOKEN) private readonly productService: IProductService,
  ) {}

  /**
   * Sync product inventory to connected marketplaces
   * @param productId The product ID
   * @param organizationId The organization ID
   */
  async syncProductInventory(
    productId: string,
    organizationId: string,
  ): Promise<Record<string, any>> {
    this.logger.log(
      `Syncing inventory for product ${productId} to all marketplaces for organization ${organizationId}`,
    );

    try {
      // Get product details from product service interface
      const product = await this.productService.getProductById(productId);

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      // Get all active marketplace credentials for the organization
      const marketplaceCredentials =
        await this.credentialsRepository.findByOrganization(organizationId);

      if (marketplaceCredentials.length === 0) {
        this.logger.log(
          `No marketplace credentials found for organization ${organizationId}`,
        );
        return {
          success: true,
          message: "No marketplace credentials found",
          results: {},
        };
      }

      // Sync to each marketplace
      const results: Record<string, any> = {};

      for (const credential of marketplaceCredentials) {
        try {
          const adapter = await this.adapterFactory.getInitializedAdapter(
            credential.marketplaceId,
            organizationId,
          );

          // Update stock
          const stockUpdateResult = await adapter.updateStock([
            {
              sku: product.sku,
              stockLevel: product.stockQuantity || 0,
            },
          ]);

          results[credential.marketplaceId] = {
            success: stockUpdateResult.success,
            message: stockUpdateResult.success
              ? `Successfully updated stock for ${product.sku}`
              : stockUpdateResult.error?.message || "Failed to update stock",
            details: stockUpdateResult.data,
          };
        } catch (error) {
          results[credential.marketplaceId] = {
            success: false,
            message: `Error syncing to ${credential.marketplaceId}: ${error.message}`,
          };

          this.logger.error(
            `Error syncing product ${productId} to marketplace ${credential.marketplaceId}`,
            error.stack,
          );
        }
      }

      return {
        success: true,
        message: "Inventory sync completed",
        results,
      };
    } catch (error) {
      this.logger.error(
        `Error syncing product inventory: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        message: `Error syncing product inventory: ${error.message}`,
      };
    }
  }

  /**
   * Sync product price to connected marketplaces
   * @param productId The product ID
   * @param organizationId The organization ID
   */
  async syncProductPrice(
    productId: string,
    organizationId: string,
  ): Promise<Record<string, any>> {
    this.logger.log(
      `Syncing price for product ${productId} to all marketplaces for organization ${organizationId}`,
    );

    try {
      // Get product details from product service interface
      const product = await this.productService.getProductById(productId);

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      // Get all active marketplace credentials for the organization
      const marketplaceCredentials =
        await this.credentialsRepository.findByOrganization(organizationId);

      if (marketplaceCredentials.length === 0) {
        this.logger.log(
          `No marketplace credentials found for organization ${organizationId}`,
        );
        return {
          success: true,
          message: "No marketplace credentials found",
          results: {},
        };
      }

      // Sync to each marketplace
      const results: Record<string, any> = {};

      for (const credential of marketplaceCredentials) {
        try {
          const adapter = await this.adapterFactory.getInitializedAdapter(
            credential.marketplaceId,
            organizationId,
          );

          // Update price - check if pricing is available
          const priceUpdateResult = await adapter.updatePrices([
            {
              sku: product.sku,
              price: product.pricing?.basePrice || 0,
              compareAtPrice: product.pricing?.salePrice,
              currency: product.pricing?.currency || "ZAR", // Default to South African Rand
            },
          ]);

          results[credential.marketplaceId] = {
            success: priceUpdateResult.success,
            message: priceUpdateResult.success
              ? `Successfully updated price for ${product.sku}`
              : priceUpdateResult.error?.message || "Failed to update price",
            details: priceUpdateResult.data,
          };
        } catch (error) {
          results[credential.marketplaceId] = {
            success: false,
            message: `Error syncing to ${credential.marketplaceId}: ${error.message}`,
          };

          this.logger.error(
            `Error syncing product ${productId} price to marketplace ${credential.marketplaceId}`,
            error.stack,
          );
        }
      }

      return {
        success: true,
        message: "Price sync completed",
        results,
      };
    } catch (error) {
      this.logger.error(
        `Error syncing product price: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        message: `Error syncing product price: ${error.message}`,
      };
    }
  }

  /**
   * Import product from a marketplace
   * @param marketplaceId The marketplace ID
   * @param organizationId The organization ID
   * @param marketplaceProductId The marketplace product ID
   */
  async importProduct(
    marketplaceId: string,
    organizationId: string,
    marketplaceProductId: string,
  ): Promise<Record<string, any>> {
    this.logger.log(
      `Importing product ${marketplaceProductId} from marketplace ${marketplaceId}`,
    );

    try {
      // Get the marketplace adapter
      const adapter = await this.adapterFactory.getInitializedAdapter(
        marketplaceId,
        organizationId,
      );

      // Get the product from the marketplace
      const result = await adapter.getProductById(marketplaceProductId);

      if (!result.success || !result.data) {
        throw new Error(
          result.error?.message || "Failed to get product from marketplace",
        );
      }

      const marketplaceProduct = result.data;

      // Convert marketplace product to internal product format
      const product = this.convertMarketplaceProductToProduct(
        marketplaceProduct,
        organizationId,
      );

      // Create the product through the product service interface
      const createdProduct = await this.productService.createProduct(product);

      return {
        success: true,
        message: `Successfully imported product ${marketplaceProduct.name}`,
        productId: createdProduct.id,
      };
    } catch (error) {
      this.logger.error(
        `Error importing product: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        message: `Error importing product: ${error.message}`,
      };
    }
  }

  /**
   * Convert a marketplace product to the IProduct interface format
   * @param marketplaceProduct The marketplace product
   * @param organizationId The organization ID
   * @returns Product data compatible with IProduct interface
   * @private
   */
  private convertMarketplaceProductToProduct(
    marketplaceProduct: MarketplaceProduct,
    organizationId: string,
  ): Partial<import("../../../shared/interfaces/product.interface").IProduct> {
    // This is a simplified conversion - in a real system, you'd have more complex mapping
    return {
      organizationId,
      sku: marketplaceProduct.sku,
      name: marketplaceProduct.name,
      description: marketplaceProduct.description || "",
      pricing: {
        basePrice: marketplaceProduct.price,
        salePrice: marketplaceProduct.compareAtPrice,
        currency: marketplaceProduct.currency,
      },
      stockQuantity: marketplaceProduct.stockLevel,
      // These fields are only needed for the internal Product type
      // But we're converting to IProduct which doesn't require them
      status: marketplaceProduct.status === "active" ? "ACTIVE" : "INACTIVE",
      // Store the categories in metadata instead since they're not in IProduct
      metadata: {
        categories: marketplaceProduct.categories || [],
        attributes: marketplaceProduct.attributes || {},
        marketplace: {
          id: marketplaceProduct.id,
          url: marketplaceProduct.marketplaceUrl,
          platform: marketplaceProduct.marketplace || "unknown",
        },
      },
      externalIds: {
        [marketplaceProduct.id]: marketplaceProduct.id,
      },
      mainImageUrl: marketplaceProduct.images?.[0],
      additionalImageUrls: marketplaceProduct.images?.slice(1) || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
