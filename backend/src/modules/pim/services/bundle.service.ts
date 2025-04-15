import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductService } from './product.service';
import { Product, ProductStatus } from '../models/product.model';
import { ProductType } from '../interfaces/types';
import { LoadSheddingResilienceService } from './load-shedding-resilience.service';
import { PricingStrategy, BundleComponent, Bundle } from '../models/bundle.model';
import { BundleRepository } from '../repositories/bundle.repository';

/**
 * Service for managing product bundles
 * Optimized for South African market with load shedding resilience
 */
@Injectable()
export class BundleService {
  private readonly logger = new Logger(BundleService.name);

  constructor(
    private readonly bundleRepository: BundleRepository,
    private readonly productService: ProductService,
    private readonly loadSheddingResilienceService: LoadSheddingResilienceService,
  ) {}

  /**
   * Create a new product bundle
   * @param bundleData Bundle data
   * @param organizationId Organization ID
   */
  async createBundle(
    bundleData: {
      name: string;
      description?: string;
      sku: string;
      components: Array<{
        productId: string;
        sku?: string;
        quantity: number;
        isRequired?: boolean;
      }>;
      pricingStrategy: 'FIXED_PRICE' | 'DISCOUNT_PERCENTAGE' | 'COMPONENT_SUM' | 'CUSTOM_FORMULA';
      pricingValue?: number | string;
      categoryId?: string;
      images?: string[];
      attributes?: Record<string, any>;
      isActive?: boolean;
    },
    organizationId: string,
  ): Promise<Bundle> {
    try {
      // Create bundle object
      const bundle: Bundle = {
        name: bundleData.name,
        description: bundleData.description || '',
        sku: bundleData.sku,
        components: bundleData.components.map(c => ({
          productId: c.productId,
          sku: c.sku || '',
          quantity: c.quantity,
          isRequired: c.isRequired !== undefined ? c.isRequired : true,
        })),
        pricingStrategy: bundleData.pricingStrategy as PricingStrategy,
        pricingValue: bundleData.pricingValue,
        categoryId: bundleData.categoryId,
        images: bundleData.images || [],
        attributes: bundleData.attributes || {},
        isActive: bundleData.isActive !== undefined ? bundleData.isActive : true,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Create product for the bundle
      const productData: Partial<Product> = {
        name: bundleData.name,
        description: bundleData.description,
        sku: bundleData.sku,
        type: ProductType.BUNDLE,
        status: ProductStatus.ACTIVE,
        categoryId: bundleData.categoryId,
        images: bundleData.images,
        attributes: bundleData.attributes,
        bundleComponents: bundleData.components.map(c => ({
          productId: c.productId,
          sku: c.sku || '',
          quantity: c.quantity,
          isRequired: c.isRequired !== undefined ? c.isRequired : true,
        })),
      };
      
      // Calculate initial bundle price
      const price = await this.calculateInitialBundlePrice(
        bundleData.components,
        bundleData.pricingStrategy as PricingStrategy,
        bundleData.pricingValue,
        organizationId,
      );
      
      // Set product price
      productData.price = price.final;
      
      // Save bundle with load shedding resilience
      return await this.loadSheddingResilienceService.executeWithResilience(
        async () => {
          // Create bundle first
          const savedBundle = await this.bundleRepository.create(bundle);
          
          // Create corresponding product
          productData.bundleId = savedBundle.id;
          await this.productService.create(productData as Product, organizationId);
          
          return savedBundle;
        },
        'create-bundle',
      );
    } catch (error) {
      this.logger.error(`Error creating bundle: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a bundle by ID
   * @param id Bundle ID
   * @param organizationId Organization ID
   */
  async getBundleById(id: string, organizationId: string): Promise<Bundle> {
    try {
      const bundle = await this.bundleRepository.findById(id);
      
      if (!bundle || bundle.organizationId !== organizationId) {
        return null;
      }
      
      return bundle;
    } catch (error) {
      this.logger.error(`Error getting bundle: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all bundles for an organization
   * @param organizationId Organization ID
   * @param options Query options
   */
  async getAllBundles(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      isActive?: boolean;
    },
  ): Promise<Bundle[]> {
    try {
      // Set default options
      const limit = options?.limit || 100;
      const offset = options?.offset || 0;
      const isActive = options?.isActive !== undefined ? options.isActive : true;
      
      // Query bundles
      const bundles = await this.bundleRepository.findByOrganization(
        organizationId,
        { limit, offset, isActive },
      );
      
      return bundles;
    } catch (error) {
      this.logger.error(`Error getting bundles: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update a bundle
   * @param id Bundle ID
   * @param updateData Update data
   * @param organizationId Organization ID
   */
  async updateBundle(
    id: string,
    updateData: {
      name?: string;
      description?: string;
      sku?: string;
      components?: Array<{
        productId: string;
        sku?: string;
        quantity: number;
        isRequired?: boolean;
      }>;
      pricingStrategy?: 'FIXED_PRICE' | 'DISCOUNT_PERCENTAGE' | 'COMPONENT_SUM' | 'CUSTOM_FORMULA';
      pricingValue?: number | string;
      categoryId?: string;
      images?: string[];
      attributes?: Record<string, any>;
      isActive?: boolean;
    },
    organizationId: string,
  ): Promise<Bundle> {
    try {
      // Get existing bundle
      const bundle = await this.getBundleById(id, organizationId);
      if (!bundle) {
        throw new NotFoundException(`Bundle not found with ID: ${id}`);
      }
      
      // Update bundle
      const updatedBundle: Bundle = {
        ...bundle,
        ...updateData,
        updatedAt: new Date(),
      };
      
      // Get the bundle's product
      const bundleProduct = await this.productService.findByBundleId(id, organizationId);
      if (!bundleProduct) {
        throw new NotFoundException(`Bundle product not found for bundle ID: ${id}`);
      }
      
      // Update product data
      const productUpdates: Partial<Product> = {};
      
      if (updateData.name) productUpdates.name = updateData.name;
      if (updateData.description) productUpdates.description = updateData.description;
      if (updateData.sku) productUpdates.sku = updateData.sku;
      if (updateData.categoryId) productUpdates.categoryId = updateData.categoryId;
      if (updateData.images) productUpdates.images = updateData.images;
      if (updateData.attributes) productUpdates.attributes = updateData.attributes;
      if (updateData.isActive !== undefined) {
        productUpdates.status = updateData.isActive ? ProductStatus.ACTIVE : ProductStatus.INACTIVE;
      }
      
      // Update bundle components if provided
      if (updateData.components) {
        productUpdates.bundleComponents = updateData.components.map(c => ({
          productId: c.productId,
          sku: c.sku || '',
          quantity: c.quantity,
          isRequired: c.isRequired !== undefined ? c.isRequired : true,
        }));
        
        // Update bundle's components
        updatedBundle.components = updateData.components.map(c => ({
          productId: c.productId,
          sku: c.sku || '',
          quantity: c.quantity,
          isRequired: c.isRequired !== undefined ? c.isRequired : true,
        }));
      }
      
      // If pricing strategy or components changed, recalculate price
      if (updateData.pricingStrategy || updateData.pricingValue || updateData.components) {
        const components = updateData.components || bundle.components;
        const pricingStrategy = updateData.pricingStrategy as PricingStrategy || bundle.pricingStrategy;
        const pricingValue = updateData.pricingValue !== undefined ? updateData.pricingValue : bundle.pricingValue;
        
        const price = await this.calculateInitialBundlePrice(
          components,
          pricingStrategy,
          pricingValue,
          organizationId,
        );
        
        productUpdates.price = price.final;
      }
      
      // Save changes with load shedding resilience
      return await this.loadSheddingResilienceService.executeWithResilience(
        async () => {
          // Update bundle
          const updated = await this.bundleRepository.update(id, updatedBundle);
          
          // Update product
          await this.productService.update(bundleProduct.id, productUpdates, organizationId);
          
          return updated;
        },
        'update-bundle',
      );
    } catch (error) {
      this.logger.error(`Error updating bundle: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a bundle
   * @param id Bundle ID
   * @param organizationId Organization ID
   */
  async deleteBundle(id: string, organizationId: string): Promise<void> {
    try {
      // Get bundle
      const bundle = await this.getBundleById(id, organizationId);
      if (!bundle) {
        throw new NotFoundException(`Bundle not found with ID: ${id}`);
      }
      
      // Get bundle product
      const bundleProduct = await this.productService.findByBundleId(id, organizationId);
      
      // Delete bundle with load shedding resilience
      await this.loadSheddingResilienceService.executeWithResilience(
        async () => {
          // Delete bundle
          await this.bundleRepository.delete(id);
          
          // Delete or update product if it exists
          if (bundleProduct) {
            await this.productService.delete(bundleProduct.id, organizationId);
          }
        },
        'delete-bundle',
      );
    } catch (error) {
      this.logger.error(`Error deleting bundle: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Add a component to a bundle
   * @param bundleId Bundle ID
   * @param componentData Component data
   * @param organizationId Organization ID
   */
  async addComponent(
    bundleId: string,
    componentData: {
      productId: string;
      sku?: string;
      quantity: number;
      isRequired?: boolean;
    },
    organizationId: string,
  ): Promise<Bundle> {
    try {
      // Get bundle
      const bundle = await this.getBundleById(bundleId, organizationId);
      if (!bundle) {
        throw new NotFoundException(`Bundle not found with ID: ${bundleId}`);
      }
      
      // Check if component already exists
      const existingComponentIndex = bundle.components.findIndex(
        c => c.productId === componentData.productId,
      );
      
      if (existingComponentIndex >= 0) {
        throw new BadRequestException(`Component with product ID ${componentData.productId} already exists in bundle`);
      }
      
      // Add component
      const newComponent: BundleComponent = {
        productId: componentData.productId,
        sku: componentData.sku || '',
        quantity: componentData.quantity,
        isRequired: componentData.isRequired !== undefined ? componentData.isRequired : true,
      };
      
      const updatedComponents = [...bundle.components, newComponent];
      
      // Get bundle product
      const bundleProduct = await this.productService.findByBundleId(bundleId, organizationId);
      if (!bundleProduct) {
        throw new NotFoundException(`Bundle product not found for bundle ID: ${bundleId}`);
      }
      
      // Calculate new price
      const price = await this.calculateInitialBundlePrice(
        updatedComponents,
        bundle.pricingStrategy,
        bundle.pricingValue,
        organizationId,
      );
      
      // Update bundle with load shedding resilience
      return await this.loadSheddingResilienceService.executeWithResilience(
        async () => {
          // Update bundle
          const updatedBundle = await this.bundleRepository.update(bundleId, {
            ...bundle,
            components: updatedComponents,
            updatedAt: new Date(),
          });
          
          // Update product
          await this.productService.update(
            bundleProduct.id,
            {
              bundleComponents: updatedComponents,
              price: price.final,
            },
            organizationId,
          );
          
          return updatedBundle;
        },
        'add-component',
      );
    } catch (error) {
      this.logger.error(`Error adding component: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update a bundle component
   * @param bundleId Bundle ID
   * @param productId Product ID of the component to update
   * @param updateData Update data
   * @param organizationId Organization ID
   */
  async updateComponent(
    bundleId: string,
    productId: string,
    updateData: {
      sku?: string;
      quantity?: number;
      isRequired?: boolean;
    },
    organizationId: string,
  ): Promise<Bundle> {
    try {
      // Get bundle
      const bundle = await this.getBundleById(bundleId, organizationId);
      if (!bundle) {
        throw new NotFoundException(`Bundle not found with ID: ${bundleId}`);
      }
      
      // Find component
      const componentIndex = bundle.components.findIndex(c => c.productId === productId);
      if (componentIndex < 0) {
        throw new NotFoundException(`Component with product ID ${productId} not found in bundle`);
      }
      
      // Update component
      const updatedComponents = [...bundle.components];
      updatedComponents[componentIndex] = {
        ...updatedComponents[componentIndex],
        ...updateData,
      };
      
      // Get bundle product
      const bundleProduct = await this.productService.findByBundleId(bundleId, organizationId);
      if (!bundleProduct) {
        throw new NotFoundException(`Bundle product not found for bundle ID: ${bundleId}`);
      }
      
      // Calculate new price
      const price = await this.calculateInitialBundlePrice(
        updatedComponents,
        bundle.pricingStrategy,
        bundle.pricingValue,
        organizationId,
      );
      
      // Update bundle with load shedding resilience
      return await this.loadSheddingResilienceService.executeWithResilience(
        async () => {
          // Update bundle
          const updatedBundle = await this.bundleRepository.update(bundleId, {
            ...bundle,
            components: updatedComponents,
            updatedAt: new Date(),
          });
          
          // Update product
          await this.productService.update(
            bundleProduct.id,
            {
              bundleComponents: updatedComponents,
              price: price.final,
            },
            organizationId,
          );
          
          return updatedBundle;
        },
        'update-component',
      );
    } catch (error) {
      this.logger.error(`Error updating component: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Remove a component from a bundle
   * @param bundleId Bundle ID
   * @param productId Product ID of the component to remove
   * @param organizationId Organization ID
   */
  async removeComponent(
    bundleId: string,
    productId: string,
    organizationId: string,
  ): Promise<Bundle> {
    try {
      // Get bundle
      const bundle = await this.getBundleById(bundleId, organizationId);
      if (!bundle) {
        throw new NotFoundException(`Bundle not found with ID: ${bundleId}`);
      }
      
      // Find component
      const componentIndex = bundle.components.findIndex(c => c.productId === productId);
      if (componentIndex < 0) {
        throw new NotFoundException(`Component with product ID ${productId} not found in bundle`);
      }
      
      // Remove component
      const updatedComponents = bundle.components.filter(c => c.productId !== productId);
      
      // Ensure at least one component remains
      if (updatedComponents.length === 0) {
        throw new BadRequestException('Cannot remove last component from bundle');
      }
      
      // Get bundle product
      const bundleProduct = await this.productService.findByBundleId(bundleId, organizationId);
      if (!bundleProduct) {
        throw new NotFoundException(`Bundle product not found for bundle ID: ${bundleId}`);
      }
      
      // Calculate new price
      const price = await this.calculateInitialBundlePrice(
        updatedComponents,
        bundle.pricingStrategy,
        bundle.pricingValue,
        organizationId,
      );
      
      // Update bundle with load shedding resilience
      return await this.loadSheddingResilienceService.executeWithResilience(
        async () => {
          // Update bundle
          const updatedBundle = await this.bundleRepository.update(bundleId, {
            ...bundle,
            components: updatedComponents,
            updatedAt: new Date(),
          });
          
          // Update product
          await this.productService.update(
            bundleProduct.id,
            {
              bundleComponents: updatedComponents,
              price: price.final,
            },
            organizationId,
          );
          
          return updatedBundle;
        },
        'remove-component',
      );
    } catch (error) {
      this.logger.error(`Error removing component: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculate bundle price
   * @param bundleId Bundle ID
   * @param organizationId Organization ID
   */
  async calculateBundlePrice(
    bundleId: string,
    organizationId: string,
  ): Promise<{
    componentTotal: number;
    discount: number;
    final: number;
    calculationDetails: Record<string, any>;
  }> {
    try {
      // Get bundle
      const bundle = await this.getBundleById(bundleId, organizationId);
      if (!bundle) {
        throw new NotFoundException(`Bundle not found with ID: ${bundleId}`);
      }
      
      // Calculate price based on current component prices
      const components = bundle.components || [];
      const pricingStrategy = bundle.pricingStrategy;
      const pricingValue = bundle.pricingValue;
      
      // Get component prices
      const componentPrices = await Promise.all(
        components.map(async component => {
          try {
            const product = await this.productService.findById(component.productId, organizationId);
            return {
              productId: component.productId,
              name: product?.name || 'Unknown',
              price: product?.price || 0,
              quantity: component.quantity,
              subtotal: (product?.price || 0) * component.quantity,
            };
          } catch (error) {
            this.logger.warn(`Error getting component price: ${error.message}`);
            return {
              productId: component.productId,
              name: 'Unknown',
              price: 0,
              quantity: component.quantity,
              subtotal: 0,
            };
          }
        }),
      );
      
      // Calculate total component price
      const componentTotal = componentPrices.reduce((total, item) => total + item.subtotal, 0);
      
      // Calculate final price based on pricing strategy
      let finalPrice = 0;
      let discount = 0;
      let calculationDetails: Record<string, any> = {
        components: componentPrices,
        componentTotal,
      };
      
      switch (pricingStrategy) {
        case PricingStrategy.FIXED_PRICE: {
          // Fixed price, ignore component prices
          finalPrice = typeof pricingValue === 'number' ? pricingValue : 0;
          discount = componentTotal - finalPrice;
          calculationDetails.strategy = 'Fixed Price';
          calculationDetails.fixedPrice = finalPrice;
          break;
        }
        
        case PricingStrategy.DISCOUNT_PERCENTAGE: {
          // Apply percentage discount to component total
          const discountPercentage = typeof pricingValue === 'number' ? pricingValue : 0;
          discount = (componentTotal * discountPercentage) / 100;
          finalPrice = componentTotal - discount;
          calculationDetails.strategy = 'Discount Percentage';
          calculationDetails.discountPercentage = discountPercentage;
          calculationDetails.discountAmount = discount;
          break;
        }
        
        case PricingStrategy.COMPONENT_SUM: {
          // Just sum up component prices
          finalPrice = componentTotal;
          discount = 0;
          calculationDetails.strategy = 'Component Sum';
          break;
        }
        
        case PricingStrategy.CUSTOM_FORMULA: {
          // Custom pricing formula (simplified implementation)
          // In a real implementation, this would evaluate a formula expression
          // For now, just apply a 10% discount as an example
          discount = componentTotal * 0.1;
          finalPrice = componentTotal - discount;
          calculationDetails.strategy = 'Custom Formula';
          calculationDetails.formula = pricingValue?.toString() || 'Default 10% discount';
          calculationDetails.discountAmount = discount;
          break;
        }
        
        default: {
          // Default to component sum
          finalPrice = componentTotal;
          discount = 0;
          calculationDetails.strategy = 'Default Component Sum';
          break;
        }
      }
      
      // Ensure price is not negative
      finalPrice = Math.max(0, finalPrice);
      
      return {
        componentTotal,
        discount,
        final: finalPrice,
        calculationDetails,
      };
    } catch (error) {
      this.logger.error(`Error calculating bundle price: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculate initial bundle price based on components
   * @param components Bundle components
   * @param pricingStrategy Pricing strategy
   * @param pricingValue Pricing value
   * @param organizationId Organization ID
   */
  private async calculateInitialBundlePrice(
    components: Array<{
      productId: string;
      sku?: string;
      quantity: number;
      isRequired?: boolean;
    }>,
    pricingStrategy: PricingStrategy,
    pricingValue: number | string,
    organizationId: string,
  ): Promise<{
    componentTotal: number;
    discount: number;
    final: number;
    calculationDetails?: Record<string, any>;
  }> {
    try {
      // Get component prices
      const componentPrices = await Promise.all(
        components.map(async component => {
          try {
            const product = await this.productService.findById(component.productId, organizationId);
            return {
              productId: component.productId,
              price: product?.price || 0,
              quantity: component.quantity,
              subtotal: (product?.price || 0) * component.quantity,
            };
          } catch (error) {
            this.logger.warn(`Error getting component price: ${error.message}`);
            return {
              productId: component.productId,
              price: 0,
              quantity: component.quantity,
              subtotal: 0,
            };
          }
        }),
      );
      
      // Calculate total component price
      const componentTotal = componentPrices.reduce((total, item) => total + item.subtotal, 0);
      
      // Calculate price based on pricing strategy
      let finalPrice = 0;
      let discount = 0;
      
      switch (pricingStrategy) {
        case PricingStrategy.FIXED_PRICE: {
          // Fixed price, ignore component prices
          finalPrice = typeof pricingValue === 'number' ? pricingValue : 0;
          discount = componentTotal - finalPrice;
          break;
        }
        
        case PricingStrategy.DISCOUNT_PERCENTAGE: {
          // Apply percentage discount to component total
          const discountPercentage = typeof pricingValue === 'number' ? pricingValue : 0;
          discount = (componentTotal * discountPercentage) / 100;
          finalPrice = componentTotal - discount;
          break;
        }
        
        case PricingStrategy.COMPONENT_SUM: {
          // Just sum up component prices
          finalPrice = componentTotal;
          discount = 0;
          break;
        }
        
        case PricingStrategy.CUSTOM_FORMULA: {
          // Custom pricing formula (simplified implementation)
          // In a real implementation, this would evaluate a formula expression
          // For now, just apply a 10% discount as an example
          discount = componentTotal * 0.1;
          finalPrice = componentTotal - discount;
          break;
        }
        
        default: {
          // Default to component sum
          finalPrice = componentTotal;
          discount = 0;
          break;
        }
      }
      
      // Ensure price is not negative
      finalPrice = Math.max(0, finalPrice);
      
      return {
        componentTotal,
        discount,
        final: finalPrice,
      };
    } catch (error) {
      this.logger.error(`Error calculating initial bundle price: ${error.message}`, error.stack);
      throw error;
    }
  }
}