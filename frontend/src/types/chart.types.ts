import { ChartType, ChartTypeRegistry, DefaultDataPoint } from 'chart.js';

// Custom animation options compatible with chart.js types
export interface CustomAnimationOptions<TType extends ChartType = ChartType> {
  animations?: {
    x?: { type?: string; easing?: string; delay?: number; duration?: number; from?: number; to?: number };
    y?: { type?: string; easing?: string; delay?: number; duration?: number; from?: number; to?: number };
    radius?: { duration?: number; easing?: string; from?: number; to?: number };
    tension?: { type?: string; easing?: string; delay?: number; duration?: number; from?: number; to?: number };
  };
  duration?: number;
  easing?: string;
  enabled?: boolean;
  delayBetweenPoints?: number;
  loop?: boolean;
  delay?: number;
}

// Custom tooltip options compatible with chart.js types
export interface CustomTooltipOptions<TType extends keyof ChartTypeRegistry = keyof ChartTypeRegistry> {
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
  TLabel = string
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