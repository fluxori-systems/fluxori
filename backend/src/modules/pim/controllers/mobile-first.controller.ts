/**
 * Mobile-First Controller
 * 
 * This controller provides mobile-optimized API endpoints for the PIM module,
 * specifically designed for mobile devices common in South African markets.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
  Res,
  HttpStatus,
  HttpException,
  Logger,
  Headers,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FirebaseAuthGuard } from '../../../common/guards/firebase-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { Product } from '../models/product.model';
import { Category } from '../models/category.model';
import { MarketContextService } from '../services/market-context.service';
import { MobileFirstDetectionService, DeviceProfile, MobileOptimizationOptions } from '../services/mobile-first-detection.service';
import { LoadSheddingService } from '../services/load-shedding.service';
import { NetworkAwareStorageService } from '../services/network-aware-storage.service';

/**
 * Mobile-optimized response content
 */
interface MobileResponse<T> {
  data: T;
  meta: {
    optimized: boolean;
    clientHints?: Record<string, any>;
    viewport?: Record<string, any>;
    loadShedding?: {
      active: boolean;
      stage?: number;
      nextScheduledChange?: Date;
    };
    networkQuality?: string;
    mobileOptimized?: boolean;
  };
}

/**
 * Controller for mobile-optimized PIM operations
 */
@Controller('pim/mobile')
@UseGuards(FirebaseAuthGuard)
export class MobileFirstController {
  private readonly logger = new Logger(MobileFirstController.name);

  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly mobileDetectionService: MobileFirstDetectionService,
    private readonly marketContextService: MarketContextService,
    private readonly loadSheddingService: LoadSheddingService,
    private readonly storageService: NetworkAwareStorageService,
  ) {
    this.logger.log('Mobile-First Controller initialized');
  }

  /**
   * Get a list of products with mobile optimizations
   */
  @Get('products')
  async getProducts(
    @Query('page') page = '0',
    @Query('pageSize') pageSize = '20',
    @Query('category') categoryId?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
    @Query('fields') fields?: string,
    @GetUser() user: any,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    // Detect device profile
    const deviceProfile = this.mobileDetectionService.detectDeviceProfile(request);
    
    // Get optimization options based on profile
    const optimizationOptions = this.mobileDetectionService.getOptimizationOptions(deviceProfile);
    
    // Add client hints headers to response
    const clientHintsHeaders = this.mobileDetectionService.generateClientHintsHeaders();
    Object.entries(clientHintsHeaders).forEach(([key, value]) => {
      response.header(key, value);
    });
    
    // Apply field limitations if specified
    if (fields) {
      optimizationOptions.includeFields = fields.split(',');
    }
    
    // Apply page size limits based on device capabilities
    const limitedPageSize = Math.min(
      parseInt(pageSize, 10),
      optimizationOptions.maxPagingSize
    );
    
    try {
      // Fetch products
      const products = await this.productService.findAll({
        page: parseInt(page, 10),
        pageSize: limitedPageSize,
        categoryId,
        search,
        status,
        sort,
      }, user.tenantId);
      
      // Optimize the response
      const optimizedProducts = this.mobileDetectionService.optimizeProductListForMobile(
        products.data,
        optimizationOptions
      );
      
      // Check load shedding status
      const loadShedding = {
        active: this.loadSheddingService.isActive(),
        stage: this.loadSheddingService.getCurrentStage(),
        nextScheduledChange: this.loadSheddingService.getNextScheduledChange(),
      };
      
      // Generate mobile-optimized response
      const mobileResponse: MobileResponse<any> = {
        data: optimizedProducts,
        meta: {
          optimized: true,
          clientHints: this.mobileDetectionService.generateViewportHints(deviceProfile),
          loadShedding,
          networkQuality: deviceProfile.networkQuality,
          mobileOptimized: true,
        },
      };
      
      // Set cache headers based on device and network quality
      this.setCacheHeaders(response, deviceProfile);
      
      // If poor network quality, add specific metadata to help client side
      if (deviceProfile.networkQuality === 'poor' || deviceProfile.networkQuality === 'fair') {
        // Add total count for pagination calculations to avoid additional requests
        mobileResponse.meta['totalItems'] = products.total;
        mobileResponse.meta['totalPages'] = Math.ceil(products.total / limitedPageSize);
      }
      
      return response.status(HttpStatus.OK).json(mobileResponse);
    } catch (error) {
      this.logger.error(`Error fetching products for mobile: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch products: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get a product by ID with mobile optimizations
   */
  @Get('products/:id')
  async getProduct(
    @Param('id') id: string,
    @Query('fields') fields?: string,
    @GetUser() user: any,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    // Detect device profile
    const deviceProfile = this.mobileDetectionService.detectDeviceProfile(request);
    
    // Get optimization options based on profile
    const optimizationOptions = this.mobileDetectionService.getOptimizationOptions(deviceProfile);
    
    // Add client hints headers to response
    const clientHintsHeaders = this.mobileDetectionService.generateClientHintsHeaders();
    Object.entries(clientHintsHeaders).forEach(([key, value]) => {
      response.header(key, value);
    });
    
    // Apply field limitations if specified
    if (fields) {
      optimizationOptions.includeFields = fields.split(',');
    }
    
    try {
      // Fetch product
      const product = await this.productService.findById(id, user.tenantId);
      
      if (!product) {
        return response.status(HttpStatus.NOT_FOUND).json({
          message: 'Product not found',
          code: 'PRODUCT_NOT_FOUND',
        });
      }
      
      // Optimize the response
      const optimizedProduct = this.mobileDetectionService.optimizeResponse(
        product,
        optimizationOptions
      );
      
      // Check load shedding status
      const loadShedding = {
        active: this.loadSheddingService.isActive(),
        stage: this.loadSheddingService.getCurrentStage(),
        nextScheduledChange: this.loadSheddingService.getNextScheduledChange(),
      };
      
      // Generate mobile-optimized response
      const mobileResponse: MobileResponse<any> = {
        data: optimizedProduct,
        meta: {
          optimized: true,
          clientHints: this.mobileDetectionService.generateViewportHints(deviceProfile),
          loadShedding,
          networkQuality: deviceProfile.networkQuality,
          mobileOptimized: true,
        },
      };
      
      // Set cache headers based on device and network quality
      this.setCacheHeaders(response, deviceProfile);
      
      return response.status(HttpStatus.OK).json(mobileResponse);
    } catch (error) {
      this.logger.error(`Error fetching product for mobile: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch product: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get categories with mobile optimizations
   */
  @Get('categories')
  async getCategories(
    @Query('parent') parentId?: string,
    @Query('fields') fields?: string,
    @GetUser() user: any,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    // Detect device profile
    const deviceProfile = this.mobileDetectionService.detectDeviceProfile(request);
    
    // Get optimization options based on profile
    const optimizationOptions = this.mobileDetectionService.getOptimizationOptions(deviceProfile);
    
    // Add client hints headers to response
    const clientHintsHeaders = this.mobileDetectionService.generateClientHintsHeaders();
    Object.entries(clientHintsHeaders).forEach(([key, value]) => {
      response.header(key, value);
    });
    
    // Apply field limitations if specified
    if (fields) {
      optimizationOptions.includeFields = fields.split(',');
    }
    
    try {
      // Fetch categories
      const categories = await this.categoryService.findByParent(
        parentId,
        user.tenantId
      );
      
      // Optimize the response
      const optimizedCategories = this.mobileDetectionService.optimizeResponse(
        categories,
        optimizationOptions
      );
      
      // Check load shedding status
      const loadShedding = {
        active: this.loadSheddingService.isActive(),
        stage: this.loadSheddingService.getCurrentStage(),
        nextScheduledChange: this.loadSheddingService.getNextScheduledChange(),
      };
      
      // Generate mobile-optimized response
      const mobileResponse: MobileResponse<any> = {
        data: optimizedCategories,
        meta: {
          optimized: true,
          clientHints: this.mobileDetectionService.generateViewportHints(deviceProfile),
          loadShedding,
          networkQuality: deviceProfile.networkQuality,
          mobileOptimized: true,
        },
      };
      
      // Set cache headers based on device and network quality
      this.setCacheHeaders(response, deviceProfile);
      
      return response.status(HttpStatus.OK).json(mobileResponse);
    } catch (error) {
      this.logger.error(`Error fetching categories for mobile: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch categories: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get mobile optimized image URL
   */
  @Get('images/:imageId')
  async getOptimizedImage(
    @Param('imageId') imageId: string,
    @Query('width') width?: string,
    @Query('height') height?: string,
    @Query('quality') quality?: string,
    @Query('format') format?: string,
    @GetUser() user: any,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    // Detect device profile
    const deviceProfile = this.mobileDetectionService.detectDeviceProfile(request);
    
    // Get optimization options based on profile
    const optimizationOptions = this.mobileDetectionService.getOptimizationOptions(deviceProfile);
    
    // Override with query parameters if provided
    const imageWidth = width ? parseInt(width, 10) : optimizationOptions.imageTransform.maxWidth;
    const imageHeight = height ? parseInt(height, 10) : optimizationOptions.imageTransform.maxHeight;
    const imageQuality = quality ? parseInt(quality, 10) : optimizationOptions.imageTransform.quality;
    const imageFormat = format || optimizationOptions.imageTransform.format;
    
    try {
      // Get optimized image URL
      const imageUrl = await this.storageService.getOptimizedImageUrl(
        imageId,
        user.tenantId,
        {
          width: imageWidth,
          height: imageHeight,
          quality: imageQuality,
          format: imageFormat as any,
        }
      );
      
      // Set cache headers based on device and network quality
      this.setCacheHeaders(response, deviceProfile);
      
      // Redirect to the optimized image URL
      return response.redirect(HttpStatus.TEMPORARY_REDIRECT, imageUrl);
    } catch (error) {
      this.logger.error(`Error getting optimized image: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to get optimized image: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get device profile information - useful for debugging mobile apps
   */
  @Get('device-profile')
  async getDeviceProfile(
    @Req() request: Request,
    @Res() response: Response,
  ) {
    // Detect device profile
    const deviceProfile = this.mobileDetectionService.detectDeviceProfile(request);
    
    // Generate client hints
    const clientHints = this.mobileDetectionService.generateClientHintsHeaders();
    
    // Generate viewport hints
    const viewportHints = this.mobileDetectionService.generateViewportHints(deviceProfile);
    
    // Check load shedding status
    const loadShedding = {
      active: this.loadSheddingService.isActive(),
      stage: this.loadSheddingService.getCurrentStage(),
      nextScheduledChange: this.loadSheddingService.getNextScheduledChange(),
    };
    
    // Add client hints headers to response
    Object.entries(clientHints).forEach(([key, value]) => {
      response.header(key, value);
    });
    
    // Return device profile information
    return response.status(HttpStatus.OK).json({
      deviceProfile,
      clientHints,
      viewportHints,
      loadShedding,
      requestHeaders: {
        userAgent: request.headers['user-agent'],
        saveData: request.headers['save-data'],
        viewportWidth: request.headers['viewport-width'],
        viewportHeight: request.headers['viewport-height'],
        dpr: request.headers['dpr'],
        rtt: request.headers['rtt'],
        downlink: request.headers['downlink'],
        ect: request.headers['ect'],
      },
    });
  }

  /**
   * Enhance default market context with mobile-specific features
   */
  @Get('market-context')
  async getMarketContext(
    @GetUser() user: any,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    // Detect device profile
    const deviceProfile = this.mobileDetectionService.detectDeviceProfile(request);
    
    // Get basic market context
    const marketContext = await this.marketContextService.getMarketContext(user.tenantId);
    
    // Enhance with mobile-specific information
    const enhancedContext = {
      ...marketContext,
      mobile: {
        deviceType: deviceProfile.deviceType,
        networkQuality: deviceProfile.networkQuality,
        networkProvider: deviceProfile.networkProvider,
        isSavingData: deviceProfile.isSavingData,
        loadShedding: {
          active: this.loadSheddingService.isActive(),
          stage: this.loadSheddingService.getCurrentStage(),
          nextScheduledChange: this.loadSheddingService.getNextScheduledChange(),
        },
        recommendedSettings: {
          imagesPerPage: this.calculateImagesPerPage(deviceProfile),
          prefetchDepth: this.calculatePrefetchDepth(deviceProfile),
          offlineMode: deviceProfile.networkQuality === 'poor' || 
                       this.loadSheddingService.isActive(),
          compressionLevel: this.calculateCompressionLevel(deviceProfile),
        },
        ussdShortcodes: this.getSouthAfricanUssdCodes(deviceProfile),
      },
    };
    
    // Add client hints headers to response
    const clientHintsHeaders = this.mobileDetectionService.generateClientHintsHeaders();
    Object.entries(clientHintsHeaders).forEach(([key, value]) => {
      response.header(key, value);
    });
    
    // Set cache headers
    this.setCacheHeaders(response, deviceProfile);
    
    return response.status(HttpStatus.OK).json(enhancedContext);
  }

  /**
   * Set cache headers based on device profile
   */
  private setCacheHeaders(response: Response, deviceProfile: DeviceProfile): void {
    // Determine cache TTL based on device type and network quality
    let cacheTtl = 60; // 1 minute default
    
    if (deviceProfile.networkQuality === 'poor' || deviceProfile.isSavingData) {
      // Longer cache for poor connections to reduce data usage
      cacheTtl = 300; // 5 minutes
    } else if (deviceProfile.networkQuality === 'excellent') {
      // Shorter cache for excellent connections
      cacheTtl = 30; // 30 seconds
    }
    
    // Set cache headers
    response.header('Cache-Control', `public, max-age=${cacheTtl}`);
    response.header('Vary', 'User-Agent, Accept, Save-Data, Viewport-Width, DPR');
  }

  /**
   * Calculate recommended images per page based on profile
   */
  private calculateImagesPerPage(profile: DeviceProfile): number {
    if (profile.networkQuality === 'poor' || profile.isSavingData) {
      return 3;
    } else if (profile.deviceType === 'feature_phone') {
      return 2;
    } else if (profile.deviceType === 'mobile') {
      return 4;
    } else if (profile.deviceType === 'tablet') {
      return 6;
    }
    
    return 8; // desktop
  }

  /**
   * Calculate recommended prefetch depth based on profile
   */
  private calculatePrefetchDepth(profile: DeviceProfile): number {
    if (profile.networkQuality === 'poor' || profile.isSavingData) {
      return 0; // No prefetch
    } else if (profile.networkQuality === 'fair') {
      return 1; // Minimal prefetch
    } else if (profile.networkQuality === 'good') {
      return 2; // Standard prefetch
    }
    
    return 3; // Deep prefetch for excellent connections
  }

  /**
   * Calculate recommended compression level based on profile
   */
  private calculateCompressionLevel(profile: DeviceProfile): number {
    if (profile.networkQuality === 'poor' || profile.isSavingData) {
      return 3; // Maximum compression
    } else if (profile.networkQuality === 'fair') {
      return 2; // High compression
    } else if (profile.networkQuality === 'good') {
      return 1; // Standard compression
    }
    
    return 0; // No additional compression for excellent connections
  }

  /**
   * Get relevant USSD codes for South African mobile networks
   */
  private getSouthAfricanUssdCodes(profile: DeviceProfile): Record<string, string> {
    // Common codes
    const commonCodes = {
      checkBalance: '*136#',
      customerSupport: '*135#',
      loadShedding: '*120*791#', // Eskom nationwide
    };
    
    // Provider-specific codes
    if (profile.networkProvider === 'vodacom') {
      return {
        ...commonCodes,
        buyData: '*135*500#',
        buyAirtime: '*135*501#',
        dataBalance: '*136*01#',
      };
    } else if (profile.networkProvider === 'mtn') {
      return {
        ...commonCodes,
        buyData: '*136*2#',
        buyAirtime: '*136*1#',
        dataBalance: '*136#',
      };
    } else if (profile.networkProvider === 'cell_c') {
      return {
        ...commonCodes,
        buyData: '*147*1#',
        buyAirtime: '*147*2#',
        dataBalance: '*147#',
      };
    } else if (profile.networkProvider === 'telkom') {
      return {
        ...commonCodes,
        buyData: '*180*2#',
        buyAirtime: '*180*1#',
        dataBalance: '*188#',
      };
    }
    
    // Default codes if provider unknown
    return commonCodes;
  }
}