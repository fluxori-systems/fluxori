"use client";

/**
 * South African Market Optimization Components
 *
 * This module provides specialized components and utilities for optimizing
 * animations and performance in the South African market, taking into account:
 *
 * - Device capabilities common in the South African market
 * - Network conditions across different regions (urban, township, rural)
 * - Data costs and affordability considerations
 * - Market share of different device types
 *
 * The components automatically adapt to provide the best performance and
 * user experience based on device capabilities and network conditions.
 */

// Export the device profiles data
export {
  southAfricanDeviceProfiles,
  southAfricanNetworkProfiles,
  getDeviceProfile,
  getNetworkProfile,
} from "../data/device-profiles";

// Export the performance analytics service
export { defaultPerformanceAnalyticsService } from "../services/performance/performance-analytics.service";

// Export types with 'export type'
export type {
  PerformanceInsight,
  PerformanceAnalyticsConfig,
} from "../services/performance/performance-analytics.service";

// Export the South African performance hook
export {
  useSouthAfricanPerformance,
  type SouthAfricanPerformanceData,
} from "../hooks/useSouthAfricanPerformance";

// Export the container component that auto-optimizes content
export { default as SouthAfricanOptimizedContainer } from "../components/SouthAfricanOptimizedContainer";

// Export the dashboard for monitoring and visualization
export { default as SouthAfricanPerformanceDashboard } from "../components/SouthAfricanPerformanceDashboard";

/**
 * Example usage:
 *
 * ```tsx
 * import { SouthAfricanOptimizedContainer } from '@/lib/motion/south-african-market';
 *
 * export default function MyPage() {
 *   return (
 *     <SouthAfricanOptimizedContainer showDataUsageWarnings={true}>
 *       <h1>My Content</h1>
 *       <p>This content will be automatically optimized for South African market conditions</p>
 *       <img src="/large-image.jpg" alt="Example" />
 *     </SouthAfricanOptimizedContainer>
 *   );
 * }
 * ```
 */
