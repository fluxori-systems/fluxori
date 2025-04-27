"use client";

/**
 * Device capability profiles specific to South African market
 * Based on research data on common devices and network conditions
 */

/**
 * Device type classification
 */
export type DeviceType =
  | "entry-level-mobile" // Low-end smartphones (e.g., Samsung A01, Huawei Y5)
  | "mid-range-mobile" // Mid-range smartphones (e.g., Samsung A51, Huawei P30 Lite)
  | "high-end-mobile" // High-end smartphones (e.g., Samsung S21, iPhone 13)
  | "tablet" // Tablets (e.g., iPad, Samsung Tab)
  | "desktop-low" // Low-end desktops/laptops
  | "desktop-mid" // Mid-range desktops/laptops
  | "desktop-high"; // High-end desktops/laptops

/**
 * Browser engine types
 */
export type BrowserEngine =
  | "Blink"
  | "WebKit"
  | "Gecko"
  | "EdgeHTML"
  | "unknown";

/**
 * Processor capability levels
 */
export type ProcessorTier = "entry" | "low" | "mid" | "high";

/**
 * South African network provider
 */
export type NetworkProvider =
  | "Vodacom"
  | "MTN"
  | "Cell C"
  | "Telkom"
  | "Rain"
  | "ISP" // Wired internet service providers
  | "unknown";

/**
 * Location type in South Africa affecting network quality
 */
export type LocationType =
  | "urban"
  | "suburban"
  | "township"
  | "rural"
  | "deep-rural"
  | "unknown";

/**
 * Device profile for optimization targeting
 */
export interface DeviceProfile {
  /** Device type */
  deviceType: DeviceType;

  /** Device name for identification */
  deviceName: string;

  /** Estimated market share in South Africa (%) */
  marketSharePercent: number;

  /** Processor capability */
  processorTier: ProcessorTier;

  /** RAM amount in GB */
  memory: number;

  /** Typical screen resolution */
  resolution: {
    width: number;
    height: number;
  };

  /** Device pixel ratio */
  pixelRatio: number;

  /** Whether the device has GPU acceleration */
  hasGPUAcceleration: boolean;

  /** Whether the device commonly experiences throttling */
  throttlingProne: boolean;

  /** Commonly used browsers on this device */
  browsers: BrowserEngine[];

  /** Animation optimization recommendations */
  optimizationRecommendations: {
    /** Maximum concurrent animations */
    maxConcurrentAnimations: number;

    /** Disable physics simulations */
    disablePhysics: boolean;

    /** Use simplified bezier curves */
    useSimpleBezier: boolean;

    /** Disable parallax effects */
    disableParallax: boolean;

    /** Use simplified shadows */
    useSimplifiedShadows: boolean;

    /** Disable backdrop filters */
    disableBackdropFilters: boolean;

    /** Use lower quality images */
    useLowerQualityImages: boolean;

    /** Maximum frames per second target */
    maxFPS: number;

    /** Duration multiplier for animations (1.0 is normal) */
    durationMultiplier: number;
  };
}

/**
 * Network profile for South African carriers and scenarios
 */
export interface NetworkProfile {
  /** Provider name */
  provider: NetworkProvider;

  /** Location type */
  locationType: LocationType;

  /** Network type */
  networkType: "2G" | "3G" | "4G" | "5G" | "DSL" | "Fiber" | "Fixed Wireless";

  /** Average download speed in Mbps */
  downloadSpeedMbps: number;

  /** Average upload speed in Mbps */
  uploadSpeedMbps: number;

  /** Average latency in ms */
  latencyMs: number;

  /** Typical packet loss percentage */
  packetLossPercent: number;

  /** Typical jitter in ms */
  jitterMs: number;

  /** Data cost per MB in ZAR */
  dataCostPerMBZAR: number;

  /** Bandwidth recommendations */
  bandwidthRecommendations: {
    /** Maximum initial page size in KB */
    maxInitialPageSizeKB: number;

    /** Maximum image size in KB */
    maxImageSizeKB: number;

    /** Maximum total animations data size in KB */
    maxAnimationsDataKB: number;

    /** Maximum concurrent requests */
    maxConcurrentRequests: number;

    /** Whether to use data compression */
    useCompression: boolean;

    /** Whether to use aggressive caching */
    useAggressiveCaching: boolean;

    /** Whether to preload critical resources */
    preloadCriticalResources: boolean;

    /** Whether to lazy load non-critical resources */
    lazyLoadNonCritical: boolean;
  };
}

/**
 * Common device profiles in South Africa
 * Based on market research and analytics data
 */
export const southAfricanDeviceProfiles: DeviceProfile[] = [
  {
    deviceType: "entry-level-mobile",
    deviceName: "Samsung Galaxy A01/A10",
    marketSharePercent: 14.5,
    processorTier: "entry",
    memory: 2,
    resolution: { width: 720, height: 1520 },
    pixelRatio: 1.5,
    hasGPUAcceleration: true,
    throttlingProne: true,
    browsers: ["Blink"],
    optimizationRecommendations: {
      maxConcurrentAnimations: 1,
      disablePhysics: true,
      useSimpleBezier: true,
      disableParallax: true,
      useSimplifiedShadows: true,
      disableBackdropFilters: true,
      useLowerQualityImages: true,
      maxFPS: 30,
      durationMultiplier: 0.7, // Faster animations to compensate for lower framerates
    },
  },
  {
    deviceType: "mid-range-mobile",
    deviceName: "Samsung Galaxy A51/A52",
    marketSharePercent: 11.2,
    processorTier: "mid",
    memory: 4,
    resolution: { width: 1080, height: 2400 },
    pixelRatio: 2,
    hasGPUAcceleration: true,
    throttlingProne: false,
    browsers: ["Blink", "WebKit"],
    optimizationRecommendations: {
      maxConcurrentAnimations: 3,
      disablePhysics: false,
      useSimpleBezier: false,
      disableParallax: false,
      useSimplifiedShadows: false,
      disableBackdropFilters: false,
      useLowerQualityImages: false,
      maxFPS: 60,
      durationMultiplier: 1.0,
    },
  },
  {
    deviceType: "high-end-mobile",
    deviceName: "Samsung Galaxy S21/iPhone 13",
    marketSharePercent: 5.8,
    processorTier: "high",
    memory: 8,
    resolution: { width: 1440, height: 3200 },
    pixelRatio: 3,
    hasGPUAcceleration: true,
    throttlingProne: false,
    browsers: ["Blink", "WebKit"],
    optimizationRecommendations: {
      maxConcurrentAnimations: 8,
      disablePhysics: false,
      useSimpleBezier: false,
      disableParallax: false,
      useSimplifiedShadows: false,
      disableBackdropFilters: false,
      useLowerQualityImages: false,
      maxFPS: 60,
      durationMultiplier: 1.0,
    },
  },
  {
    deviceType: "tablet",
    deviceName: "Samsung Tab A7/iPad",
    marketSharePercent: 3.2,
    processorTier: "mid",
    memory: 3,
    resolution: { width: 1200, height: 2000 },
    pixelRatio: 2,
    hasGPUAcceleration: true,
    throttlingProne: false,
    browsers: ["Blink", "WebKit"],
    optimizationRecommendations: {
      maxConcurrentAnimations: 4,
      disablePhysics: false,
      useSimpleBezier: false,
      disableParallax: false,
      useSimplifiedShadows: false,
      disableBackdropFilters: false,
      useLowerQualityImages: false,
      maxFPS: 60,
      durationMultiplier: 1.0,
    },
  },
  {
    deviceType: "desktop-low",
    deviceName: "Low-end PC/Laptop",
    marketSharePercent: 7.5,
    processorTier: "low",
    memory: 4,
    resolution: { width: 1366, height: 768 },
    pixelRatio: 1,
    hasGPUAcceleration: true,
    throttlingProne: true,
    browsers: ["Blink", "Gecko"],
    optimizationRecommendations: {
      maxConcurrentAnimations: 3,
      disablePhysics: false,
      useSimpleBezier: true,
      disableParallax: true,
      useSimplifiedShadows: true,
      disableBackdropFilters: false,
      useLowerQualityImages: false,
      maxFPS: 30,
      durationMultiplier: 0.8,
    },
  },
  {
    deviceType: "desktop-mid",
    deviceName: "Mid-range PC/Laptop",
    marketSharePercent: 6.2,
    processorTier: "mid",
    memory: 8,
    resolution: { width: 1920, height: 1080 },
    pixelRatio: 1,
    hasGPUAcceleration: true,
    throttlingProne: false,
    browsers: ["Blink", "Gecko", "WebKit"],
    optimizationRecommendations: {
      maxConcurrentAnimations: 6,
      disablePhysics: false,
      useSimpleBezier: false,
      disableParallax: false,
      useSimplifiedShadows: false,
      disableBackdropFilters: false,
      useLowerQualityImages: false,
      maxFPS: 60,
      durationMultiplier: 1.0,
    },
  },
  {
    deviceType: "desktop-high",
    deviceName: "High-end PC/Laptop",
    marketSharePercent: 2.8,
    processorTier: "high",
    memory: 16,
    resolution: { width: 2560, height: 1440 },
    pixelRatio: 2,
    hasGPUAcceleration: true,
    throttlingProne: false,
    browsers: ["Blink", "Gecko", "WebKit"],
    optimizationRecommendations: {
      maxConcurrentAnimations: 12,
      disablePhysics: false,
      useSimpleBezier: false,
      disableParallax: false,
      useSimplifiedShadows: false,
      disableBackdropFilters: false,
      useLowerQualityImages: false,
      maxFPS: 60,
      durationMultiplier: 1.0,
    },
  },
];

/**
 * Network profiles for South African providers and scenarios
 * Data based on research from MyBroadband, SpeedTest, and ICASA reports
 */
export const southAfricanNetworkProfiles: NetworkProfile[] = [
  {
    provider: "Vodacom",
    locationType: "urban",
    networkType: "4G",
    downloadSpeedMbps: 35.2,
    uploadSpeedMbps: 8.5,
    latencyMs: 48,
    packetLossPercent: 1.2,
    jitterMs: 12,
    dataCostPerMBZAR: 0.03,
    bandwidthRecommendations: {
      maxInitialPageSizeKB: 1000,
      maxImageSizeKB: 300,
      maxAnimationsDataKB: 200,
      maxConcurrentRequests: 8,
      useCompression: true,
      useAggressiveCaching: true,
      preloadCriticalResources: true,
      lazyLoadNonCritical: true,
    },
  },
  {
    provider: "MTN",
    locationType: "urban",
    networkType: "4G",
    downloadSpeedMbps: 40.5,
    uploadSpeedMbps: 10.2,
    latencyMs: 45,
    packetLossPercent: 1.0,
    jitterMs: 10,
    dataCostPerMBZAR: 0.03,
    bandwidthRecommendations: {
      maxInitialPageSizeKB: 1200,
      maxImageSizeKB: 350,
      maxAnimationsDataKB: 250,
      maxConcurrentRequests: 10,
      useCompression: true,
      useAggressiveCaching: true,
      preloadCriticalResources: true,
      lazyLoadNonCritical: true,
    },
  },
  {
    provider: "Vodacom",
    locationType: "township",
    networkType: "3G",
    downloadSpeedMbps: 7.5,
    uploadSpeedMbps: 1.8,
    latencyMs: 120,
    packetLossPercent: 3.5,
    jitterMs: 25,
    dataCostPerMBZAR: 0.05,
    bandwidthRecommendations: {
      maxInitialPageSizeKB: 500,
      maxImageSizeKB: 150,
      maxAnimationsDataKB: 100,
      maxConcurrentRequests: 4,
      useCompression: true,
      useAggressiveCaching: true,
      preloadCriticalResources: true,
      lazyLoadNonCritical: true,
    },
  },
  {
    provider: "MTN",
    locationType: "township",
    networkType: "3G",
    downloadSpeedMbps: 6.8,
    uploadSpeedMbps: 1.5,
    latencyMs: 135,
    packetLossPercent: 4.2,
    jitterMs: 30,
    dataCostPerMBZAR: 0.05,
    bandwidthRecommendations: {
      maxInitialPageSizeKB: 450,
      maxImageSizeKB: 120,
      maxAnimationsDataKB: 80,
      maxConcurrentRequests: 4,
      useCompression: true,
      useAggressiveCaching: true,
      preloadCriticalResources: true,
      lazyLoadNonCritical: true,
    },
  },
  {
    provider: "Vodacom",
    locationType: "rural",
    networkType: "3G",
    downloadSpeedMbps: 3.2,
    uploadSpeedMbps: 0.9,
    latencyMs: 180,
    packetLossPercent: 6.5,
    jitterMs: 45,
    dataCostPerMBZAR: 0.06,
    bandwidthRecommendations: {
      maxInitialPageSizeKB: 300,
      maxImageSizeKB: 80,
      maxAnimationsDataKB: 40,
      maxConcurrentRequests: 2,
      useCompression: true,
      useAggressiveCaching: true,
      preloadCriticalResources: true,
      lazyLoadNonCritical: true,
    },
  },
  {
    provider: "MTN",
    locationType: "rural",
    networkType: "2G",
    downloadSpeedMbps: 0.4,
    uploadSpeedMbps: 0.12,
    latencyMs: 650,
    packetLossPercent: 12.0,
    jitterMs: 85,
    dataCostPerMBZAR: 0.07,
    bandwidthRecommendations: {
      maxInitialPageSizeKB: 150,
      maxImageSizeKB: 40,
      maxAnimationsDataKB: 0, // Disable animations
      maxConcurrentRequests: 1,
      useCompression: true,
      useAggressiveCaching: true,
      preloadCriticalResources: true,
      lazyLoadNonCritical: true,
    },
  },
  {
    provider: "Telkom",
    locationType: "urban",
    networkType: "Fiber",
    downloadSpeedMbps: 100,
    uploadSpeedMbps: 50,
    latencyMs: 15,
    packetLossPercent: 0.1,
    jitterMs: 3,
    dataCostPerMBZAR: 0.005,
    bandwidthRecommendations: {
      maxInitialPageSizeKB: 3000,
      maxImageSizeKB: 1000,
      maxAnimationsDataKB: 500,
      maxConcurrentRequests: 20,
      useCompression: false, // Less important for high-speed connections
      useAggressiveCaching: false,
      preloadCriticalResources: true,
      lazyLoadNonCritical: false, // Can load everything at once
    },
  },
  {
    provider: "ISP",
    locationType: "urban",
    networkType: "DSL",
    downloadSpeedMbps: 10,
    uploadSpeedMbps: 2,
    latencyMs: 35,
    packetLossPercent: 0.8,
    jitterMs: 8,
    dataCostPerMBZAR: 0.01,
    bandwidthRecommendations: {
      maxInitialPageSizeKB: 1500,
      maxImageSizeKB: 400,
      maxAnimationsDataKB: 200,
      maxConcurrentRequests: 6,
      useCompression: true,
      useAggressiveCaching: true,
      preloadCriticalResources: true,
      lazyLoadNonCritical: true,
    },
  },
  {
    provider: "Rain",
    locationType: "urban",
    networkType: "5G",
    downloadSpeedMbps: 150,
    uploadSpeedMbps: 30,
    latencyMs: 25,
    packetLossPercent: 0.5,
    jitterMs: 5,
    dataCostPerMBZAR: 0.003,
    bandwidthRecommendations: {
      maxInitialPageSizeKB: 3000,
      maxImageSizeKB: 1000,
      maxAnimationsDataKB: 500,
      maxConcurrentRequests: 15,
      useCompression: false,
      useAggressiveCaching: false,
      preloadCriticalResources: true,
      lazyLoadNonCritical: false,
    },
  },
];

/**
 * Utility function to identify the closest device profile based on device capabilities
 * @param capabilities Device capabilities
 * @returns Best matching device profile or undefined if no match
 */
export function getDeviceProfile(capabilities: {
  memory?: number;
  cpuCores?: number;
  pixelRatio?: number;
  screenWidth?: number;
  screenHeight?: number;
  isLowEndDevice?: boolean;
}): DeviceProfile | undefined {
  if (!capabilities) return undefined;

  // Simple scoring system to find best match
  let bestMatch: DeviceProfile | undefined;
  let bestScore = -1;

  for (const profile of southAfricanDeviceProfiles) {
    let score = 0;

    // Memory score
    if (capabilities.memory !== undefined) {
      const memoryDiff = Math.abs(capabilities.memory - profile.memory);
      score += 5 - Math.min(memoryDiff, 5);
    }

    // Processor score based on cores
    if (capabilities.cpuCores !== undefined) {
      let expectedCores = 1;
      if (profile.processorTier === "high") expectedCores = 8;
      else if (profile.processorTier === "mid") expectedCores = 4;
      else if (profile.processorTier === "low") expectedCores = 2;

      const coreDiff = Math.abs(capabilities.cpuCores - expectedCores);
      score += 5 - Math.min(coreDiff, 5);
    }

    // DPR score
    if (capabilities.pixelRatio !== undefined) {
      const dprDiff = Math.abs(capabilities.pixelRatio - profile.pixelRatio);
      score += 3 - Math.min(dprDiff * 2, 3);
    }

    // Resolution score
    if (
      capabilities.screenWidth !== undefined &&
      capabilities.screenHeight !== undefined
    ) {
      const profileResolution =
        profile.resolution.width * profile.resolution.height;
      const deviceResolution =
        capabilities.screenWidth * capabilities.screenHeight;

      const resDiffRatio = Math.abs(deviceResolution / profileResolution - 1);
      score += 5 - Math.min(resDiffRatio * 5, 5);
    }

    // Low-end device indicator
    if (
      capabilities.isLowEndDevice === true &&
      (profile.deviceType === "entry-level-mobile" ||
        profile.deviceType === "desktop-low")
    ) {
      score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = profile;
    }
  }

  return bestMatch;
}

/**
 * Utility function to identify the closest network profile based on network conditions
 * @param conditions Network conditions
 * @returns Best matching network profile or undefined if no match
 */
export function getNetworkProfile(conditions: {
  downlink?: number;
  rtt?: number;
  effectiveType?: string;
  saveData?: boolean;
}): NetworkProfile | undefined {
  if (!conditions) return undefined;

  // Simple scoring system to find best match
  let bestMatch: NetworkProfile | undefined;
  let bestScore = -1;

  for (const profile of southAfricanNetworkProfiles) {
    let score = 0;

    // Downlink score
    if (conditions.downlink !== undefined) {
      const speedDiff = Math.abs(
        conditions.downlink - profile.downloadSpeedMbps,
      );
      const speedRatio = speedDiff / Math.max(profile.downloadSpeedMbps, 1);
      score += 10 - Math.min(speedRatio * 10, 10);
    }

    // RTT (latency) score
    if (conditions.rtt !== undefined) {
      const rttDiff = Math.abs(conditions.rtt - profile.latencyMs);
      const rttRatio = rttDiff / Math.max(profile.latencyMs, 1);
      score += 10 - Math.min(rttRatio * 10, 10);
    }

    // Network type score
    if (conditions.effectiveType) {
      if (
        (conditions.effectiveType === "4g" && profile.networkType === "4G") ||
        (conditions.effectiveType === "3g" && profile.networkType === "3G") ||
        (conditions.effectiveType === "2g" && profile.networkType === "2G")
      ) {
        score += 5;
      }
    }

    // Data saver mode
    if (conditions.saveData === true && profile.dataCostPerMBZAR > 0.04) {
      score += 5; // Prefer profiles with higher data costs when in save data mode
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = profile;
    }
  }

  return bestMatch;
}
