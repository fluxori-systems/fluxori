import React, { useRef } from 'react';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ScriptableContext,
  LineController
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Box, BoxProps } from '@mantine/core';
import { useReducedMotion } from '../motion/useReducedMotion';
import { DURATION, EASING } from '../motion/constants';
import { ChartDataWithTypes, ChartTransitionOptions } from '@/types/chart.types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export interface AnimatedLineChartProps extends BoxProps {
  /** Chart data */
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      fill?: boolean;
      tension?: number;
      pointRadius?: number;
      pointHoverRadius?: number;
      borderWidth?: number;
      [key: string]: any; // Allow additional properties
    }>;
  };
  /** Chart title */
  title?: string;
  /** Height of the chart */
  height?: number | string;
  /** Whether to animate the chart on mount */
  animate?: boolean;
  /** Custom chart options */
  chartOptions?: ChartOptions<'line'>;
}

/**
 * Line chart with fluid, purposeful animations
 * that follow Fluxori's motion design principles
 */
export function AnimatedLineChart({
  data,
  title,
  height = 300,
  animate = true,
  chartOptions = {},
  ...props
}: AnimatedLineChartProps) {
  const chartRef = useRef<ChartJS>(null);
  const { getAnimationSettings } = useReducedMotion();
  const animation = getAnimationSettings('MEDIUM');

  // Get animation duration respecting reduced motion preferences
  const animationDuration = animation.enabled && animate ? animation.duration : 0;

  const defaultOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: animationDuration,
      easing: 'easeOutQuart', // Similar to our EASE_OUT but in Chart.js format
    },
    animations: {
      tension: {
        duration: animationDuration,
        easing: 'easeOutQuart',
        from: 0,
        to: 0.4,
        loop: false
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title || '',
      },
      tooltip: {
        animation: {
          duration: DURATION.FAST,
        } as any // Type assertion to bypass strict typing
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
      line: {
        tension: 0.4, // Slightly curved lines
      }
    },
    transitions: {
      active: {
        animation: {
          duration: DURATION.NORMAL,
        }
      }
    } as any // Type assertion for transitions
  };

  // Merge user options with defaults
  const options: ChartOptions<'line'> = {
    ...defaultOptions,
    ...chartOptions,
    plugins: {
      ...defaultOptions.plugins,
      ...(chartOptions.plugins || {})
    }
  };

  // Apply consistent colors if not provided
  const enhancedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => {
      // Default color palette based on index
      const colors = [
        'rgba(75, 192, 192, 1)',   // Teal
        'rgba(54, 162, 235, 1)',   // Blue
        'rgba(153, 102, 255, 1)',  // Purple
        'rgba(255, 159, 64, 1)',   // Orange
        'rgba(255, 99, 132, 1)',   // Red
      ];
      
      // Generate background with transparency
      const bgColor = dataset.backgroundColor || 
        (dataset.borderColor ? 
          dataset.borderColor.toString().replace('1)', '0.2)') : 
          colors[index % colors.length].replace('1)', '0.2)'));
      
      return {
        ...dataset,
        borderColor: dataset.borderColor || colors[index % colors.length],
        backgroundColor: bgColor,
      };
    })
  };

  return (
    <Box style={{ height }} {...props}>
      <Line 
        ref={chartRef}
        options={options} 
        data={enhancedData as any} // Type assertion for enhanced data
      />
    </Box>
  );
}