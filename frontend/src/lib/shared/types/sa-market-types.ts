'use client';

/**
 * South African Market Optimization Types
 * 
 * Shared types for South African market optimizations to ensure
 * consistent typing across the application.
 * Implements the Agent-First Interface design philosophy and South African Optimization principles.
 */

/**
 * South African device profiles based on market research
 * Reflects common device categories in the South African market
 */
export enum SADeviceProfile {
  HIGH_END = 'HIGH_END',
  MID_RANGE = 'MID_RANGE',
  ENTRY_LEVEL = 'ENTRY_LEVEL',
  BASIC = 'BASIC',
  FEATURE_PHONE = 'FEATURE_PHONE'
}

/**
 * South African network profiles based on market research
 * Reflects common network conditions in different regions of South Africa
 */
export enum SANetworkProfile {
  URBAN_FIBER = 'URBAN_FIBER',
  URBAN_LTE = 'URBAN_LTE',
  PERI_URBAN = 'PERI_URBAN',
  TOWNSHIP = 'TOWNSHIP',
  RURAL = 'RURAL',
  METERED_CONNECTION = 'METERED_CONNECTION'
}

/**
 * Agent Appropriateness Levels
 * Implements the Agent Appropriateness Framework from the design system
 */
export enum AgentAppropriateness {
  HIGH = 'HIGH',               // Agent interaction is highly appropriate
  MEDIUM = 'MEDIUM',           // Agent interaction is reasonably appropriate
  LOW = 'LOW',                 // Static UI likely better than agent
  CRITICAL_ONLY = 'CRITICAL_ONLY', // Only use agent for critical decision points
  DISABLED = 'DISABLED'        // Agent interactions should be disabled
}

/**
 * Connection quality levels
 */
export type ConnectionQuality = 'high' | 'medium' | 'low' | 'poor';

/**
 * Connection quality detection result
 */
export interface ConnectionQualityResult {
  /** Current connection quality assessment */
  quality: ConnectionQuality;
  
  /** Whether data saver mode is enabled */
  isDataSaver: boolean;
  
  /** Whether the connection is metered (pay-per-use) */
  isMetered: boolean;
  
  /** Whether saveData mode is enabled in the browser */
  saveData: boolean;
  
  /** Raw downlink speed in Mbps (if available) */
  downlinkSpeed?: number;
  
  /** Raw round-trip time in ms (if available) */
  rtt?: number;
  
  /** Raw effective connection type (if available) */
  effectiveType?: string;
  
  /** Connection type (if available) */
  type?: string;
}

/**
 * South African connection thresholds
 * These thresholds are calibrated for typical South African network conditions
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
 * South African regional cost constants
 * Used for Agent Appropriateness Framework decision-making
 */
export const SA_REGIONAL_CONSTANTS = {
  // Average mobile data cost in South Africa (R85/GB) converted to per MB
  AVERAGE_DATA_COST_PER_MB: 0.083, // R0.083 per MB
  
  // Value threshold for agent interactions (operations with > R1000 impact)
  AGENT_VALUE_THRESHOLD_RAND: 1000,
  
  // Representative data usage estimates by operation type (MB)
  AGENT_INTERACTION_DATA_USAGE: {
    SIMPLE_QUERY: 0.2,    // Simple question to agent (MB)
    BASIC_ANALYSIS: 0.5,  // Basic inventory or sales analysis (MB)
    FULL_ANALYSIS: 1.2,   // Detailed market or performance analysis (MB)
    DECISION_SUPPORT: 0.8 // Pricing or strategy recommendations (MB)
  },
  
  // Estimate how many MB of data would be saved by agent vs standard UI
  RELATIVE_DATA_EFFICIENCY: {
    SIMPLE_UI: 0.8,     // Agent uses more data than simple UI
    MODERATE_UI: 1.1,   // Agent slightly more efficient than moderate UI
    COMPLEX_UI: 1.5,    // Agent more efficient than complex dashboards
    DATA_VIZ: 2.0       // Agent much more efficient than data visualizations
  }
};

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
 * Enhanced with Agent Appropriateness Framework
 */
export interface SouthAfricanMarketOptimizations {
  // Device and network information
  deviceProfile: SADeviceProfile;
  networkProfile: SANetworkProfile;
  isSouthAfrican: boolean;
  isRural: boolean;
  isMetered: boolean;
  
  // Optimization recommendations
  recommendations: SAPerformanceRecommendation[];
  
  // Performance flags
  shouldReduceMotion: boolean;
  shouldReduceDataUsage: boolean;
  shouldReduceJavascript: boolean;
  shouldUseLowResImages: boolean;
  shouldDeferNonEssential: boolean;
  shouldUsePlaceholders: boolean;
  
  // Agent Appropriateness Framework properties
  agentAppropriateness: AgentAppropriateness;
  valueThresholdMet: boolean; // If operation value exceeds R1000 threshold
  requiresHumanInLoop: boolean; // If human verification needed for high-risk operations
  
  // Connectivity metrics
  additionalLatencyMs: number;
  estimatedDataCostPerMinute: number; // Cost in Rand per minute of usage
}

/**
 * South African performance thresholds interface
 */
export interface SAPerformanceThresholds {
  getAnimationDuration: (baseDuration: number) => number;
  getImageQuality: () => 'low' | 'medium' | 'high';
  prioritizeResource: (resource: string) => 'critical' | 'high' | 'medium' | 'low';
  connectionThresholds: typeof SA_CONNECTION_THRESHOLDS;
  
  // Agent Appropriateness helpers
  determineAgentAppropriateness: (taskComplexity: 'low' | 'medium' | 'high', valueImpact: number) => AgentAppropriateness;
  calculateDataCostForOperation: (operationType: keyof typeof SA_REGIONAL_CONSTANTS.AGENT_INTERACTION_DATA_USAGE) => number;
}