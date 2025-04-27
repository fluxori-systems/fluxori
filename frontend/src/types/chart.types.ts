import { ChartType, ChartTypeRegistry, DefaultDataPoint } from "chart.js";

import { ChartConnectionQuality } from "../hooks/useNetworkAwareChart";

// Chart data point interface for all chart data
export interface ChartDataPoint {
  [key: string]: string | number | Date | null;
}

// Custom animation options compatible with chart.js types
export interface CustomAnimationOptions<TType extends ChartType = ChartType> {
  animations?: {
    x?: {
      type?: string;
      easing?: string;
      delay?: number;
      duration?: number;
      from?: number;
      to?: number;
    };
    y?: {
      type?: string;
      easing?: string;
      delay?: number;
      duration?: number;
      from?: number;
      to?: number;
    };
    radius?: { duration?: number; easing?: string; from?: number; to?: number };
    tension?: {
      type?: string;
      easing?: string;
      delay?: number;
      duration?: number;
      from?: number;
      to?: number;
    };
  };
  duration?: number;
  easing?: string;
  enabled?: boolean;
  delayBetweenPoints?: number;
  loop?: boolean;
  delay?: number;
}

// Custom tooltip options compatible with chart.js types
export interface CustomTooltipOptions<
  TType extends keyof ChartTypeRegistry = keyof ChartTypeRegistry,
> {
  animationDuration?: number;
  animation?: {
    duration: number;
    easing?: string;
  };
}

// Chart data with strongly typed datasets
export interface ChartDataWithTypes<
  TType extends ChartType = ChartType,
  TData = DefaultDataPoint<TType>,
  TLabel = string,
> {
  labels: TLabel[];
  datasets: Array<{
    label: string;
    data: TData[];
    borderColor?: string | string[];
    backgroundColor?: string | string[];
    borderWidth?: number;
    tension?: number;
    // Line chart specific
    fill?: boolean;
    pointRadius?: number;
    pointHoverRadius?: number;
    // Bar chart specific
    barPercentage?: number;
    categoryPercentage?: number;
    // Additional generic properties
    [key: string]: any;
  }>;
}

// Transitions options for chart animations
export interface ChartTransitionOptions {
  active?: {
    animation: {
      duration: number;
      easing?: string;
    };
  };
  resize?: {
    animation: {
      duration: number;
      easing?: string;
    };
  };
  show?: {
    animation: {
      duration: number;
      easing?: string;
    };
  };
  hide?: {
    animation: {
      duration: number;
      easing?: string;
    };
  };
}

// Base props for network-aware charts
export interface NetworkAwareChartProps<T = ChartDataPoint> {
  // Chart data
  data: T[];
  // Chart height
  height?: number;
  // Chart width
  width?: string | number;
  // Whether the chart should take up 100% of container width
  responsive?: boolean;
  // Margin around the chart area
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  // Text to show when there is no data
  noDataText?: string;
  // Text alternative for data-saving mode
  textAlternative?: string;
  // Force a specific connection quality (useful for testing)
  forceConnectionQuality?: ChartConnectionQuality;
  // Whether to hide the chart in poor connections and show text instead
  hideOnPoorConnection?: boolean;
  // Class name for the container
  className?: string;
}

// Props for the NetworkAwareLineChart component
export interface NetworkAwareLineChartProps<T = ChartDataPoint>
  extends NetworkAwareChartProps<T> {
  // X-axis data key
  xAxisDataKey: string;
  // Y-axis data key or keys (for multiple lines)
  yAxisDataKey: string | string[];
  // Colors for each line (follows design system)
  colors?: string[];
  // X-axis label
  xAxisLabel?: string;
  // Y-axis label
  yAxisLabel?: string;
  // Whether to show data points
  showDots?: boolean;
  // Whether the area under the line should be filled
  fillArea?: boolean;
  // Opacity for filled areas (0-1)
  fillOpacity?: number;
  // Whether to stack multiple lines
  stacked?: boolean;
}

// Props for the NetworkAwareBarChart component
export interface NetworkAwareBarChartProps<T = ChartDataPoint>
  extends NetworkAwareChartProps<T> {
  // X-axis data key
  xAxisDataKey: string;
  // Y-axis data key or keys (for multiple bar series)
  yAxisDataKey: string | string[];
  // Colors for each bar series (follows design system)
  colors?: string[];
  // X-axis label
  xAxisLabel?: string;
  // Y-axis label
  yAxisLabel?: string;
  // Whether bars should be stacked
  stacked?: boolean;
  // Bar corner radius
  radius?: number;
  // Whether to show data labels
  showDataLabels?: boolean;
}

// Props for the NetworkAwarePieChart component
export interface NetworkAwarePieChartProps<T = ChartDataPoint>
  extends NetworkAwareChartProps<T> {
  // Name data key
  nameKey: string;
  // Value data key
  valueKey: string;
  // Colors for each pie slice (follows design system)
  colors?: string[];
  // Whether to show labels
  showLabels?: boolean;
  // Whether to render as a donut chart
  donut?: boolean;
  // Inner radius ratio for donut charts (0-1)
  innerRadiusRatio?: number;
  // Whether to show data labels
  showDataLabels?: boolean;
}
