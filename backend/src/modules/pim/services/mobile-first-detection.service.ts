/**
 * Mobile-First Detection Service
 * 
 * This service provides detection and optimization capabilities for mobile devices,
 * with special attention to devices common in South African markets.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { MarketContextService } from './market-context.service';

/**
 * Device type categories
 */
export enum DeviceType {
  DESKTOP = 'desktop',
  TABLET = 'tablet',
  MOBILE = 'mobile',
  FEATURE_PHONE = 'feature_phone',
  UNKNOWN = 'unknown',
}

/**
 * Network quality categories
 */
export enum NetworkQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  UNKNOWN = 'unknown',
}

/**
 * South African mobile network providers
 */
export enum SouthAfricanNetworkProvider {
  VODACOM = 'vodacom',
  MTN = 'mtn',
  TELKOM = 'telkom',
  CELL_C = 'cell_c',
  RAIN = 'rain',
  UNKNOWN = 'unknown',
}

/**
 * Device capability profile
 */
export interface DeviceProfile {
  deviceType: DeviceType;
  isMobile: boolean;
  screenSize?: {
    width: number;
    height: number;
  };
  networkQuality: NetworkQuality;
  isSavingData: boolean;
  networkProvider?: SouthAfricanNetworkProvider;
  devicePixelRatio?: number;
  acceptsWebp: boolean;
  acceptsAvif: boolean;
  preferredImageQuality: number; // 0-100
  preferredResponseSize: 'minimal' | 'standard' | 'full';
  capabilities: {
    supportsServiceWorker: boolean;
    supportsWebPush: boolean;
    supportsOfflineMode: boolean;
    supportsProgressiveLoading: boolean;
  };
}

/**
 * Options for optimized responses
 */
export interface MobileOptimizationOptions {
  minifyJson: boolean;
  omitNullValues: boolean;
  omitEmptyArrays: boolean;
  excludeFields: string[];
  includeFields: string[];
  maxPagingSize: number;
  imageTransform: {
    maxWidth: number;
    maxHeight: number;
    quality: number;
    format: 'original' | 'webp' | 'avif' | 'jpeg';
  };
}

/**
 * Service for mobile device detection and optimization
 */
@Injectable()
export class MobileFirstDetectionService {
  private readonly logger = new Logger(MobileFirstDetectionService.name);

  // Common user agents for South African devices
  private readonly SOUTH_AFRICAN_DEVICE_PATTERNS = {
    VODACOM: /Vodacom/i,
    MTN: /MTN-SA|MTNSA/i,
    TELKOM: /Telkom/i,
    CELL_C: /Cell C/i,
    RAIN: /Rain/i,
    OPERA_MINI: /Opera Mini|OPiOS/i,
    NOKIA_FEATURE: /Nokia|NOKIA/i,
    SAMSUNG_ENTRY: /SM-A01|SM-A10|SM-A20/i,
    HUAWEI_ENTRY: /Huawei Y5|Huawei Y6|Huawei Y7/i,
    LOW_END_ANDROID: /Android 5\.|Android 6\.|Android 7\./i,
  };

  constructor(private readonly marketContextService: MarketContextService) {
    this.logger.log('Mobile-First Detection Service initialized');
  }

  /**
   * Detect device profile from request
   * 
   * @param request Express request object
   * @returns Device profile information
   */
  detectDeviceProfile(request: Request): DeviceProfile {
    const userAgent = request.headers['user-agent'] || '';
    const saveData = request.headers['save-data'] === 'on';
    const viewportWidth = parseInt(request.headers['viewport-width'] as string) || 0;
    const viewportHeight = parseInt(request.headers['viewport-height'] as string) || 0;
    const dpr = parseFloat(request.headers['dpr'] as string) || 1;
    const acceptHeader = request.headers.accept || '';
    
    // Network information - may be provided by client middleware
    const networkQualityHeader = request.headers['x-network-quality'] as string;
    const rttHeader = parseInt(request.headers['x-network-rtt'] as string) || 0;
    const downlinkHeader = parseFloat(request.headers['x-network-downlink'] as string) || 0;
    
    // Detect device type
    const deviceType = this.detectDeviceType(userAgent, viewportWidth);
    
    // Detect network quality
    const networkQuality = this.detectNetworkQuality(
      networkQualityHeader, 
      rttHeader, 
      downlinkHeader,
      userAgent
    );
    
    // Detect South African network provider
    const networkProvider = this.detectSouthAfricanNetworkProvider(userAgent);
    
    // Determine if client accepts WebP
    const acceptsWebp = acceptHeader.includes('image/webp');
    
    // Determine if client accepts AVIF
    const acceptsAvif = acceptHeader.includes('image/avif');
    
    // Calculate preferred image quality based on device and network
    const preferredImageQuality = this.calculatePreferredImageQuality(
      deviceType, 
      networkQuality, 
      saveData, 
      dpr
    );
    
    // Determine preferred response size based on device and network
    const preferredResponseSize = this.determinePreferredResponseSize(
      deviceType,
      networkQuality,
      saveData
    );
    
    // Determine device capabilities
    const capabilities = {
      supportsServiceWorker: !this.isFeaturePhone(userAgent),
      supportsWebPush: !this.isFeaturePhone(userAgent) && !this.isLowEndDevice(userAgent),
      supportsOfflineMode: !this.isFeaturePhone(userAgent),
      supportsProgressiveLoading: !this.isFeaturePhone(userAgent),
    };
    
    return {
      deviceType,
      isMobile: deviceType === DeviceType.MOBILE || deviceType === DeviceType.FEATURE_PHONE,
      screenSize: viewportWidth > 0 && viewportHeight > 0 
        ? { width: viewportWidth, height: viewportHeight } 
        : undefined,
      networkQuality,
      isSavingData: saveData,
      networkProvider,
      devicePixelRatio: dpr,
      acceptsWebp,
      acceptsAvif,
      preferredImageQuality,
      preferredResponseSize,
      capabilities,
    };
  }

  /**
   * Get optimization options based on device profile
   * 
   * @param profile Device profile
   * @returns Optimization options
   */
  getOptimizationOptions(profile: DeviceProfile): MobileOptimizationOptions {
    // Base configuration
    const options: MobileOptimizationOptions = {
      minifyJson: profile.networkQuality === NetworkQuality.POOR || profile.isSavingData,
      omitNullValues: profile.networkQuality !== NetworkQuality.EXCELLENT,
      omitEmptyArrays: profile.networkQuality === NetworkQuality.POOR || profile.isSavingData,
      excludeFields: [],
      includeFields: [],
      maxPagingSize: this.calculateMaxPageSize(profile),
      imageTransform: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: profile.preferredImageQuality,
        format: 'original',
      },
    };
    
    // Adjust image format based on device support
    if (profile.acceptsAvif) {
      options.imageTransform.format = 'avif';
    } else if (profile.acceptsWebp) {
      options.imageTransform.format = 'webp';
    } else {
      options.imageTransform.format = 'jpeg';
    }
    
    // Adjust image size based on device type
    if (profile.deviceType === DeviceType.MOBILE) {
      options.imageTransform.maxWidth = 640;
      options.imageTransform.maxHeight = 1280;
    } else if (profile.deviceType === DeviceType.TABLET) {
      options.imageTransform.maxWidth = 1080;
      options.imageTransform.maxHeight = 1440;
    } else if (profile.deviceType === DeviceType.FEATURE_PHONE) {
      options.imageTransform.maxWidth = 320;
      options.imageTransform.maxHeight = 480;
      options.imageTransform.format = 'jpeg'; // Feature phones often have limited format support
    }
    
    // Further optimization for data saving mode
    if (profile.isSavingData) {
      options.imageTransform.quality = Math.min(profile.preferredImageQuality, 60);
      options.excludeFields.push('description_full', 'meta_description', 'specifications');
    }
    
    // Apply organization-specific or regional settings
    if (profile.networkProvider === SouthAfricanNetworkProvider.MTN ||
        profile.networkProvider === SouthAfricanNetworkProvider.VODACOM) {
      // Major networks in SA have more reliable connections, but can still benefit
      // from optimizations for rural areas
      options.maxPagingSize = Math.min(options.maxPagingSize, 
        profile.networkQuality === NetworkQuality.POOR ? 10 : 20);
    }
    
    return options;
  }
  
  /**
   * Apply mobile optimizations to a response payload
   * 
   * @param data Original response data
   * @param options Optimization options
   * @returns Optimized response data
   */
  optimizeResponse<T>(data: T, options: MobileOptimizationOptions): T {
    if (Array.isArray(data)) {
      return this.optimizeArray(data, options) as any;
    } else if (typeof data === 'object' && data !== null) {
      return this.optimizeObject(data, options) as any;
    }
    
    return data;
  }
  
  /**
   * Optimize a list of products for mobile response
   * 
   * @param products List of products
   * @param options Optimization options
   * @returns Optimized product list
   */
  optimizeProductListForMobile<T>(products: T[], options: MobileOptimizationOptions): T[] {
    return this.optimizeArray(products, options);
  }
  
  /**
   * Generate client hints for mobile optimization
   * 
   * @returns Object with headers to include in responses
   */
  generateClientHintsHeaders(): Record<string, string> {
    return {
      'Accept-CH': 'Viewport-Width, Viewport-Height, DPR, Save-Data, Device-Memory, RTT, Downlink, ECT',
      'Vary': 'Accept, User-Agent, Viewport-Width, DPR, Save-Data',
      'Critical-CH': 'Viewport-Width, DPR, Save-Data',
      'Permissions-Policy': 'ch-viewport-width=*, ch-viewport-height=*, ch-dpr=*, ch-device-memory=*, ch-save-data=*, ch-rtt=*, ch-downlink=*, ch-ect=*',
    };
  }

  /**
   * Calculate if a user is in a load-shedding affected area based on headers and location
   * 
   * @param request Express request object
   * @returns Whether the user is likely affected by load shedding
   */
  isInLoadSheddingArea(request: Request): boolean {
    const userAgent = request.headers['user-agent'] || '';
    const provider = this.detectSouthAfricanNetworkProvider(userAgent);
    
    // Load shedding indicators from client-side detection
    const loadSheddingHeader = request.headers['x-load-shedding'];
    if (loadSheddingHeader === 'active') {
      return true;
    }
    
    // Time-based heuristic for South Africa
    // Load shedding is more common during evening peak hours
    const now = new Date();
    const saTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' }));
    const hour = saTime.getHours();
    
    // Evening peak hours (higher probability of load shedding)
    const isPeakHour = hour >= 17 && hour <= 21;
    
    // Location in South Africa + peak hour + mobile network
    // is a reasonable heuristic for potential load shedding
    if (isPeakHour && provider !== SouthAfricanNetworkProvider.UNKNOWN) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate viewport hints for responsive images
   * 
   * @param profile Device profile
   * @returns Viewport hints for image sizing
   */
  generateViewportHints(profile: DeviceProfile): Record<string, any> {
    if (!profile.screenSize) {
      return {};
    }
    
    const { width, height } = profile.screenSize;
    const dpr = profile.devicePixelRatio || 1;
    
    return {
      viewport: {
        width,
        height,
        dpr,
        isPortrait: height > width,
        effectiveWidth: Math.floor(width * dpr),
      },
      imageSizes: {
        thumbnail: Math.min(80 * dpr, 160),
        small: Math.min(320 * dpr, 640),
        medium: Math.min(640 * dpr, 1280),
        large: Math.min(1080 * dpr, 1920),
      }
    };
  }

  // Private helper methods
  
  /**
   * Detect device type from User-Agent and viewport info
   */
  private detectDeviceType(userAgent: string, viewportWidth: number): DeviceType {
    // Feature phone detection
    if (
      this.SOUTH_AFRICAN_DEVICE_PATTERNS.OPERA_MINI.test(userAgent) ||
      this.SOUTH_AFRICAN_DEVICE_PATTERNS.NOKIA_FEATURE.test(userAgent)
    ) {
      return DeviceType.FEATURE_PHONE;
    }
    
    // Mobile detection
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(userAgent)
    ) {
      // Distinguish between tablets and phones based on UA and viewport width
      if (
        /iPad|Tablet|tablet/i.test(userAgent) || 
        (viewportWidth > 0 && viewportWidth >= 768)
      ) {
        return DeviceType.TABLET;
      }
      
      return DeviceType.MOBILE;
    }
    
    // Fallback to desktop for unknown patterns
    return DeviceType.DESKTOP;
  }
  
  /**
   * Detect network quality from headers and heuristics
   */
  private detectNetworkQuality(
    qualityHeader: string,
    rtt: number,
    downlink: number,
    userAgent: string,
  ): NetworkQuality {
    // If client provides quality assessment, use it
    if (qualityHeader) {
      if (qualityHeader === 'excellent') return NetworkQuality.EXCELLENT;
      if (qualityHeader === 'good') return NetworkQuality.GOOD;
      if (qualityHeader === 'fair') return NetworkQuality.FAIR;
      if (qualityHeader === 'poor') return NetworkQuality.POOR;
    }
    
    // Assess based on RTT and downlink
    if (rtt > 0 || downlink > 0) {
      // Both RTT and downlink available
      if (rtt > 0 && downlink > 0) {
        if (rtt < 50 && downlink > 10) return NetworkQuality.EXCELLENT;
        if (rtt < 100 && downlink > 5) return NetworkQuality.GOOD;
        if (rtt < 300 && downlink > 1) return NetworkQuality.FAIR;
        return NetworkQuality.POOR;
      }
      
      // Only RTT available
      if (rtt > 0) {
        if (rtt < 50) return NetworkQuality.EXCELLENT;
        if (rtt < 100) return NetworkQuality.GOOD;
        if (rtt < 300) return NetworkQuality.FAIR;
        return NetworkQuality.POOR;
      }
      
      // Only downlink available
      if (downlink > 10) return NetworkQuality.EXCELLENT;
      if (downlink > 5) return NetworkQuality.GOOD;
      if (downlink > 1) return NetworkQuality.FAIR;
      return NetworkQuality.POOR;
    }
    
    // Fallback heuristics based on device
    if (this.isFeaturePhone(userAgent)) {
      return NetworkQuality.POOR;
    }
    
    if (this.isLowEndDevice(userAgent)) {
      return NetworkQuality.FAIR;
    }
    
    // Default for desktop and unknown devices
    return NetworkQuality.GOOD;
  }
  
  /**
   * Detect South African network provider from User-Agent
   */
  private detectSouthAfricanNetworkProvider(userAgent: string): SouthAfricanNetworkProvider {
    if (this.SOUTH_AFRICAN_DEVICE_PATTERNS.VODACOM.test(userAgent)) {
      return SouthAfricanNetworkProvider.VODACOM;
    }
    
    if (this.SOUTH_AFRICAN_DEVICE_PATTERNS.MTN.test(userAgent)) {
      return SouthAfricanNetworkProvider.MTN;
    }
    
    if (this.SOUTH_AFRICAN_DEVICE_PATTERNS.TELKOM.test(userAgent)) {
      return SouthAfricanNetworkProvider.TELKOM;
    }
    
    if (this.SOUTH_AFRICAN_DEVICE_PATTERNS.CELL_C.test(userAgent)) {
      return SouthAfricanNetworkProvider.CELL_C;
    }
    
    if (this.SOUTH_AFRICAN_DEVICE_PATTERNS.RAIN.test(userAgent)) {
      return SouthAfricanNetworkProvider.RAIN;
    }
    
    return SouthAfricanNetworkProvider.UNKNOWN;
  }
  
  /**
   * Calculate preferred image quality based on device and network
   */
  private calculatePreferredImageQuality(
    deviceType: DeviceType,
    networkQuality: NetworkQuality,
    saveData: boolean,
    dpr: number,
  ): number {
    // Base quality for different device types
    let quality = 85; // Default quality
    
    if (deviceType === DeviceType.FEATURE_PHONE) {
      quality = 60;
    } else if (deviceType === DeviceType.MOBILE) {
      quality = 75;
    } else if (deviceType === DeviceType.TABLET) {
      quality = 80;
    }
    
    // Adjust for network quality
    if (networkQuality === NetworkQuality.POOR) {
      quality -= 15;
    } else if (networkQuality === NetworkQuality.FAIR) {
      quality -= 5;
    } else if (networkQuality === NetworkQuality.EXCELLENT) {
      quality += 5;
    }
    
    // Adjust for save-data mode
    if (saveData) {
      quality -= 15;
    }
    
    // Adjust for high-DPR screens which need higher quality
    if (dpr > 2) {
      quality += 5;
    }
    
    // Keep quality in valid range
    return Math.max(30, Math.min(100, quality));
  }
  
  /**
   * Determine preferred response size based on profile
   */
  private determinePreferredResponseSize(
    deviceType: DeviceType,
    networkQuality: NetworkQuality,
    saveData: boolean,
  ): 'minimal' | 'standard' | 'full' {
    if (saveData || networkQuality === NetworkQuality.POOR) {
      return 'minimal';
    }
    
    if (deviceType === DeviceType.FEATURE_PHONE) {
      return 'minimal';
    }
    
    if (deviceType === DeviceType.MOBILE && networkQuality !== NetworkQuality.EXCELLENT) {
      return 'standard';
    }
    
    return 'full';
  }
  
  /**
   * Calculate maximum page size based on profile
   */
  private calculateMaxPageSize(profile: DeviceProfile): number {
    // Base page size
    let pageSize = 25;
    
    // Adjust for device type
    if (profile.deviceType === DeviceType.FEATURE_PHONE) {
      pageSize = 10;
    } else if (profile.deviceType === DeviceType.MOBILE) {
      pageSize = 15;
    } else if (profile.deviceType === DeviceType.DESKTOP) {
      pageSize = 50;
    }
    
    // Adjust for network quality
    if (profile.networkQuality === NetworkQuality.POOR) {
      pageSize = Math.min(pageSize, 10);
    } else if (profile.networkQuality === NetworkQuality.FAIR) {
      pageSize = Math.min(pageSize, 20);
    } else if (profile.networkQuality === NetworkQuality.EXCELLENT) {
      pageSize += 10;
    }
    
    // Adjust for save-data mode
    if (profile.isSavingData) {
      pageSize = Math.min(pageSize, 10);
    }
    
    return pageSize;
  }
  
  /**
   * Check if a device is a feature phone
   */
  private isFeaturePhone(userAgent: string): boolean {
    return (
      this.SOUTH_AFRICAN_DEVICE_PATTERNS.OPERA_MINI.test(userAgent) ||
      this.SOUTH_AFRICAN_DEVICE_PATTERNS.NOKIA_FEATURE.test(userAgent)
    );
  }
  
  /**
   * Check if a device is low-end
   */
  private isLowEndDevice(userAgent: string): boolean {
    return (
      this.SOUTH_AFRICAN_DEVICE_PATTERNS.SAMSUNG_ENTRY.test(userAgent) ||
      this.SOUTH_AFRICAN_DEVICE_PATTERNS.HUAWEI_ENTRY.test(userAgent) ||
      this.SOUTH_AFRICAN_DEVICE_PATTERNS.LOW_END_ANDROID.test(userAgent)
    );
  }
  
  /**
   * Optimize an array of objects
   */
  private optimizeArray<T>(data: T[], options: MobileOptimizationOptions): T[] {
    return data.map(item => this.optimizeObject(item, options));
  }
  
  /**
   * Optimize an object by applying options
   */
  private optimizeObject<T>(data: T, options: MobileOptimizationOptions): T {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const result = { ...data };
    
    // Apply field filtering
    for (const key in result) {
      // Skip if key doesn't exist
      if (!Object.prototype.hasOwnProperty.call(result, key)) {
        continue;
      }
      
      // Handle excludeFields
      if (options.excludeFields.includes(key)) {
        delete result[key];
        continue;
      }
      
      // Handle includeFields (if specified, only keep those fields)
      if (options.includeFields.length > 0 && !options.includeFields.includes(key)) {
        delete result[key];
        continue;
      }
      
      // Handle null values
      if (options.omitNullValues && result[key] === null) {
        delete result[key];
        continue;
      }
      
      // Handle empty arrays
      if (
        options.omitEmptyArrays &&
        Array.isArray(result[key]) &&
        (result[key] as any).length === 0
      ) {
        delete result[key];
        continue;
      }
      
      // Recursively optimize nested objects and arrays
      if (typeof result[key] === 'object' && result[key] !== null) {
        if (Array.isArray(result[key])) {
          result[key] = this.optimizeArray(result[key] as any, options) as any;
        } else {
          result[key] = this.optimizeObject(result[key], options) as any;
        }
      }
    }
    
    return result;
  }
}