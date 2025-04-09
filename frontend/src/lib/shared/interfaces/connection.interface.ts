/**
 * Connection quality interface for the Shared module
 * This file provides interfaces for connection quality that both 
 * UI and Motion modules can use without direct dependencies
 */

/**
 * Interface for connection quality result
 */
export interface ConnectionQualityResult {
  quality: 'high' | 'medium' | 'low' | 'poor';
  downlinkSpeed?: number;
  rtt?: number;
  effectiveType?: string;
  isMetered: boolean;
  isDataSaver: boolean;
  saveData: boolean;
  type?: string;
}

/**
 * South African market connection quality thresholds
 */
export const SA_CONNECTION_THRESHOLDS = {
  // South Africa has limited 5G and primarily relies on 4G/LTE
  HIGH_SPEED: 2.5, // 2.5 Mbps+ considered good in SA
  MEDIUM_SPEED: 1.0, // 1.0-2.5 Mbps common in urban areas
  LOW_SPEED: 0.5, // 0.5-1.0 Mbps common in many townships/peri-urban
  POOR_SPEED: 0.2, // Below 0.5 Mbps common in rural areas
  
  // Round-trip time thresholds (ms)
  GOOD_RTT: 150, // Good experience for most apps
  MEDIUM_RTT: 300, // Acceptable for most applications
  POOR_RTT: 450, // Challenging for interactive applications
  VERY_POOR_RTT: 600, // Very difficult for real-time applications
};

/**
 * Device profiles common in the South African market
 */
export enum SADeviceProfile {
  HIGH_END = 'high-end',
  MID_RANGE = 'mid-range',
  ENTRY_LEVEL = 'entry-level',
  BASIC = 'basic',
  FEATURE_PHONE = 'feature-phone'
}

/**
 * Network profiles common in the South African market
 */
export enum SANetworkProfile {
  URBAN_FIBER = 'urban-fiber',
  URBAN_LTE = 'urban-lte',
  PERI_URBAN = 'peri-urban',
  TOWNSHIP = 'township',
  RURAL = 'rural',
  METERED_CONNECTION = 'metered-connection'
}

/**
 * Performance recommendations for South African market
 */
export interface SAPerformanceRecommendation {
  type: 'critical' | 'important' | 'suggested';
  name: string;
  description: string;
  implemented: boolean;
}

/**
 * South African market optimizations result
 */
export interface SouthAfricanMarketOptimizations {
  deviceProfile: SADeviceProfile;
  networkProfile: SANetworkProfile;
  isSouthAfrican: boolean;
  isRural: boolean;
  isMetered: boolean;
  recommendations: SAPerformanceRecommendation[];
  shouldReduceMotion: boolean;
  shouldReduceDataUsage: boolean;
  shouldReduceJavascript: boolean;
  shouldUseLowResImages: boolean;
  shouldDeferNonEssential: boolean;
  shouldUsePlaceholders: boolean;
  additionalLatencyMs: number;
}

/**
 * South African performance thresholds interface
 */
export interface SAPerformanceThresholds {
  getAnimationDuration: (baseDuration: number) => number;
  getImageQuality: () => 'low' | 'medium' | 'high';
  prioritizeResource: (resource: string) => 'critical' | 'high' | 'medium' | 'low';
  connectionThresholds: typeof SA_CONNECTION_THRESHOLDS;
}