import { ChartType, ChartOptions } from 'chart.js';

/**
 * Safe animation options that can be applied to Chart.js
 */
export interface SafeAnimationOptions {
  duration?: number;
  easing?: 
    | 'linear'
    | 'easeInQuad'
    | 'easeOutQuad'
    | 'easeInOutQuad'
    | 'easeInCubic'
    | 'easeOutCubic'
    | 'easeInOutCubic'
    | 'easeInQuart'
    | 'easeOutQuart'
    | 'easeInOutQuart'
    | 'easeInQuint'
    | 'easeOutQuint'
    | 'easeInOutQuint'
    | 'easeInSine'
    | 'easeOutSine'
    | 'easeInOutSine'
    | 'easeInExpo'
    | 'easeOutExpo'
    | 'easeInOutExpo'
    | 'easeInCirc'
    | 'easeOutCirc'
    | 'easeInOutCirc'
    | 'easeInElastic'
    | 'easeOutElastic'
    | 'easeInOutElastic'
    | 'easeInBack'
    | 'easeOutBack'
    | 'easeInOutBack'
    | 'easeInBounce'
    | 'easeOutBounce'
    | 'easeInOutBounce';
  delay?: number;
  loop?: boolean;
  enabled?: boolean;
  from?: number | string;
  to?: number | string;
}

/**
 * Safe tooltip options that can be applied to Chart.js
 */
export interface SafeTooltipOptions {
  enabled?: boolean;
  position?: 'average' | 'nearest';
  backgroundColor?: string;
  titleColor?: string;
  titleFont?: {
    family?: string;
    size?: number;
    style?: 'normal' | 'italic' | 'oblique';
    weight?: 'normal' | 'bold' | 'bolder' | 'lighter' | number;
  };
  bodyColor?: string;
  bodyFont?: {
    family?: string;
    size?: number;
    style?: 'normal' | 'italic' | 'oblique';
    weight?: 'normal' | 'bold' | 'bolder' | 'lighter' | number;
  };
  borderColor?: string;
  borderWidth?: number;
  cornerRadius?: number;
  displayColors?: boolean;
}

/**
 * Type-safe chart configuration
 */
export type SafeChartConfig<TType extends ChartType = ChartType> = {
  type: TType;
  data: {
    labels?: unknown[];
    datasets: Array<{
      label?: string;
      data: unknown[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      [key: string]: unknown;
    }>;
  };
  options?: Partial<ChartOptions<TType>>;
};