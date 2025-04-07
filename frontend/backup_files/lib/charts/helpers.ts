import { Chart, ChartType, ChartOptions } from 'chart.js';
import { SafeAnimationOptions, SafeTooltipOptions } from './types';

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
  
  // Update the chart without animation
  chart.update('none');
}

/**
 * Apply tooltip options to a chart in a type-safe way
 */
export function applyTooltipOptions(
  chart: Chart,
  options: SafeTooltipOptions
): void {
  if (!chart.options.plugins) {
    chart.options.plugins = {};
  }
  
  if (!chart.options.plugins.tooltip) {
    chart.options.plugins.tooltip = options as any;
  } else {
    Object.assign(chart.options.plugins.tooltip, options);
  }
  
  // Update the chart without animation
  chart.update('none');
}

/**
 * Create type-safe chart options
 */
export function createChartOptions<TType extends ChartType>(
  options: Partial<ChartOptions<TType>>
): Partial<ChartOptions<TType>> {
  return options;
}

/**
 * Apply chart options in a type-safe way
 */
export function applyChartOptions<TType extends ChartType>(
  chart: Chart<TType>,
  options: Partial<ChartOptions<TType>>
): void {
  // Merge options
  chart.options = { ...chart.options, ...options };
  
  // Update the chart without animation
  chart.update('none');
}