/**
 * Types for Recharts integration with Fluxori Design System
 * and South African market optimizations
 */

import { CurveType } from 'recharts/types/shape/Curve';

/**
 * Network-aware animation configuration
 */
export interface NetworkAwareAnimationConfig {
  /** Whether animations are enabled */
  enabled: boolean;
  /** Duration in milliseconds */
  duration: number;
  /** Easing function */
  easing: string;
  /** Stagger delay between elements in milliseconds */
  staggerDelay?: number;
}

/**
 * Connection quality levels for chart optimization
 */
export type ChartConnectionQuality = 'high' | 'medium' | 'low' | 'poor';

/**
 * Network profile to chart configuration mapping
 */
export interface NetworkProfileConfig {
  /** Number of data points to display (may be reduced for poor connections) */
  maxDataPoints: number;
  /** Whether to show the grid */
  showGrid: boolean;
  /** Whether to show tooltips */
  showTooltips: boolean;
  /** Whether to show animation */
  animate: boolean;
  /** Animation duration multiplier (1.0 = normal, 0.5 = half speed) */
  animationDurationMultiplier: number;
  /** Curve type for line charts */
  curveType: CurveType | 'linear';
  /** Whether to use simplified legends */
  simplifiedLegend: boolean;
  /** Line thickness in pixels */
  strokeWidth: number;
  /** Whether to show reference lines */
  showReferenceLines: boolean;
  /** Maximum number of labels to show on axes */
  maxAxisLabels: number;
}

/**
 * Chart optimization configuration based on network conditions
 */
export const CHART_NETWORK_PROFILES: Record<ChartConnectionQuality, NetworkProfileConfig> = {
  high: {
    maxDataPoints: Infinity,
    showGrid: true,
    showTooltips: true,
    animate: true,
    animationDurationMultiplier: 1.0,
    curveType: 'monotone',
    simplifiedLegend: false,
    strokeWidth: 2,
    showReferenceLines: true,
    maxAxisLabels: Infinity
  },
  medium: {
    maxDataPoints: 100,
    showGrid: true,
    showTooltips: true,
    animate: true,
    animationDurationMultiplier: 0.7,
    curveType: 'monotone',
    simplifiedLegend: false,
    strokeWidth: 2,
    showReferenceLines: true,
    maxAxisLabels: 10
  },
  low: {
    maxDataPoints: 50,
    showGrid: false,
    showTooltips: true,
    animate: true,
    animationDurationMultiplier: 0.5,
    curveType: 'linear',
    simplifiedLegend: true,
    strokeWidth: 1.5,
    showReferenceLines: false,
    maxAxisLabels: 5
  },
  poor: {
    maxDataPoints: 20,
    showGrid: false,
    showTooltips: false,
    animate: false,
    animationDurationMultiplier: 0,
    curveType: 'linear',
    simplifiedLegend: true,
    strokeWidth: 1,
    showReferenceLines: false,
    maxAxisLabels: 3
  }
};

/**
 * Base data point interface for chart data
 */
export interface ChartDataPoint {
  [key: string]: string | number | Date | null;
}

/**
 * Props for the base NetworkAwareChart component
 */
export interface NetworkAwareChartProps<T extends ChartDataPoint = ChartDataPoint> {
  /** Chart data */
  data: T[];
  /** Chart height */
  height?: number;
  /** Chart width */
  width?: string | number;
  /** Whether the chart should take up 100% of container width */
  responsive?: boolean;
  /** Margin around the chart area */
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  /** Text to show when there is no data */
  noDataText?: string;
  /** Text alternative for data-saving mode */
  textAlternative?: string;
  /** Force a specific connection quality (useful for testing) */
  forceConnectionQuality?: ChartConnectionQuality;
  /** Whether to hide the chart in poor connections and show text instead */
  hideOnPoorConnection?: boolean;
  /** Class name for the container */
  className?: string;
}

/**
 * Props for the NetworkAwareLineChart component
 */
export interface NetworkAwareLineChartProps<T extends ChartDataPoint = ChartDataPoint> 
  extends NetworkAwareChartProps<T> {
  /** X-axis data key */
  xAxisDataKey: string;
  /** Y-axis data key or keys (for multiple lines) */
  yAxisDataKey: string | string[];
  /** Colors for each line (follows design system) */
  colors?: string[];
  /** X-axis label */
  xAxisLabel?: string;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Whether to show data points */
  showDots?: boolean;
  /** Whether the area under the line should be filled */
  fillArea?: boolean;
  /** Opacity for filled areas (0-1) */
  fillOpacity?: number;
  /** Whether to stack multiple lines */
  stacked?: boolean;
}

/**
 * Props for the NetworkAwareBarChart component
 */
export interface NetworkAwareBarChartProps<T extends ChartDataPoint = ChartDataPoint> 
  extends NetworkAwareChartProps<T> {
  /** X-axis data key */
  xAxisDataKey: string;
  /** Y-axis data key or keys (for multiple bar series) */
  yAxisDataKey: string | string[];
  /** Colors for each bar series (follows design system) */
  colors?: string[];
  /** X-axis label */
  xAxisLabel?: string;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Whether bars should be stacked */
  stacked?: boolean;
  /** Bar corner radius */
  radius?: number;
  /** Whether to show data labels */
  showDataLabels?: boolean;
}

/**
 * Props for the NetworkAwarePieChart component
 */
export interface NetworkAwarePieChartProps<T extends ChartDataPoint = ChartDataPoint> 
  extends NetworkAwareChartProps<T> {
  /** Name data key */
  nameKey: string;
  /** Value data key */
  valueKey: string;
  /** Colors for each pie slice (follows design system) */
  colors?: string[];
  /** Whether to show labels */
  showLabels?: boolean;
  /** Whether to render as a donut chart */
  donut?: boolean;
  /** Inner radius ratio for donut charts (0-1) */
  innerRadiusRatio?: number;
  /** Whether to show data labels */
  showDataLabels?: boolean;
}

/**
 * Props for the NetworkAwareAreaChart component
 */
export interface NetworkAwareAreaChartProps<T extends ChartDataPoint = ChartDataPoint> 
  extends NetworkAwareLineChartProps<T> {
  /** Whether areas should be stacked */
  stacked?: boolean;
}

/**
 * Props for the NetworkAwareComposedChart component
 */
export interface NetworkAwareComposedChartProps<T extends ChartDataPoint = ChartDataPoint> 
  extends NetworkAwareChartProps<T> {
  /** X-axis data key */
  xAxisDataKey: string;
  /** Configuration for lines */
  lines?: {
    dataKey: string;
    name?: string;
    color?: string;
    showDots?: boolean;
  }[];
  /** Configuration for bars */
  bars?: {
    dataKey: string;
    name?: string;
    color?: string;
    radius?: number;
  }[];
  /** Configuration for areas */
  areas?: {
    dataKey: string;
    name?: string;
    color?: string;
    fillOpacity?: number;
  }[];
  /** X-axis label */
  xAxisLabel?: string;
  /** Y-axis label */
  yAxisLabel?: string;
}

/**
 * Hook return type for useNetworkAwareChart
 */
export interface UseNetworkAwareChartResult {
  /** Whether to show a simplified version of the chart */
  shouldSimplify: boolean;
  /** Whether to show text alternative instead of chart */
  showTextAlternative: boolean;
  /** Chart animation configuration */
  animation: NetworkAwareAnimationConfig;
  /** Network profile configuration */
  profileConfig: NetworkProfileConfig;
  /** Optimized data with appropriate number of points for network conditions */
  getOptimizedData: <T>(data: T[]) => T[];
  /** Color generator function that maps to design system tokens */
  getDesignSystemColors: (count: number) => string[];
}