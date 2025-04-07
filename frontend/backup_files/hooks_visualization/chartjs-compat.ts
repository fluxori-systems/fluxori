/**
 * Compatibility layer for chart.js TypeScript definitions
 * 
 * This file provides compatibility functions and types to make chart.js
 * work properly with TypeScript and avoid type errors.
 */
import { 
  ChartType, 
  ChartOptions, 
  ChartDataset,
  Chart,
  TooltipOptions
} from 'chart.js';

/**
 * Safe animation options that can be applied to chart.js
 * without TypeScript errors.
 */
export interface SafeAnimationOptions {
  duration?: number;
  easing?: string;
  delay?: number;
  loop?: boolean;
}

/**
 * Apply animation options to a chart in a type-safe way
 */
export function applyAnimationOptions(
  chart: Chart,
  options: SafeAnimationOptions
): void {
  // Use type assertion to bypass strict typing
  if (chart.options.animation) {
    Object.assign(chart.options.animation, options);
  } else {
    chart.options.animation = options as any;
  }
  
  // Update the chart
  chart.update('none');
}

/**
 * Apply tooltip options to a chart in a type-safe way
 */
export function applyTooltipOptions(
  chart: Chart,
  options: Partial<TooltipOptions<ChartType>>
): void {
  if (!chart.options.plugins) {
    chart.options.plugins = {};
  }
  
  if (!chart.options.plugins.tooltip) {
    chart.options.plugins.tooltip = options as any;
  } else {
    Object.assign(chart.options.plugins.tooltip, options);
  }
  
  // Update the chart
  chart.update('none');
}

/**
 * Creates a dataset with proper TypeScript types
 */
export function createDataset<TType extends ChartType>(
  type: TType, 
  data: any[]
): ChartDataset<TType, any[]> {
  return {
    data,
    type
  } as ChartDataset<TType, any[]>;
}

/**
 * Creates chart options with proper TypeScript types
 */
export function createChartOptions<TType extends ChartType>(
  options: Partial<ChartOptions<TType>>
): ChartOptions<TType> {
  return options as ChartOptions<TType>;
}