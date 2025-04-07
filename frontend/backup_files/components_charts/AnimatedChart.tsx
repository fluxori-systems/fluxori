import React, { useRef } from 'react';
import { 
  Chart as ChartJS,
  ChartType,
  ChartData,
  ChartOptions,
  DefaultDataPoint,
  registerables
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { Box, BoxProps } from '@mantine/core';
import { useChartAnimation, useResponsiveChart } from '@/hooks/visualization';
import { useReducedMotion } from '@/components/motion';
import { CustomAnimationOptions } from '@/types/chart.types';

// Register all Chart.js components
ChartJS.register(...registerables);

export interface AnimatedChartProps<
  TType extends ChartType = 'bar', 
  TData = DefaultDataPoint<TType>,
  TLabel = unknown
> extends BoxProps {
  /** Chart type (bar, line, pie, etc.) */
  type: TType;
  /** Chart data */
  data: ChartData<TType, TData, TLabel>;
  /** Chart options */
  options?: ChartOptions<TType>;
  /** Chart title */
  title?: string;
  /** Height of the chart */
  height?: number | string;
  /** Whether to animate the chart on mount */
  animate?: boolean;
  /** Custom animation options */
  animationOptions?: CustomAnimationOptions<TType>;
}

/**
 * Generic animated chart component that works with any Chart.js chart type
 * and follows Fluxori's motion design principles
 */
export function AnimatedChart<
  TType extends ChartType = 'bar',
  TData = DefaultDataPoint<TType>,
  TLabel = unknown
>({
  type,
  data,
  options = {},
  title,
  height = 300,
  animate = true,
  animationOptions: customAnimationOptions,
  ...props
}: AnimatedChartProps<TType, TData, TLabel>) {
  const chartRef = useRef<ChartJS<TType, TData, TLabel>>(null);
  const { getAnimationSettings } = useReducedMotion();
  const { animationOptions } = useChartAnimation(chartRef, {
    enabled: animate,
    ...customAnimationOptions
  });
  
  // Apply responsive settings based on screen size
  const { complexityLevel } = useResponsiveChart(chartRef);

  // Set default options that respect motion design principles
  const defaultOptions: ChartOptions<TType> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animationOptions as any, // Type assertion to bypass strict typing
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title || '',
      },
    },
  };

  // Combine user options with our defaults
  const mergedOptions: ChartOptions<TType> = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...(options.plugins || {}),
    },
  };

  return (
    <Box style={{ height }} {...props}>
      <Chart<TType, TData, TLabel>
        ref={chartRef}
        type={type}
        data={data}
        options={mergedOptions}
      />
    </Box>
  );
}