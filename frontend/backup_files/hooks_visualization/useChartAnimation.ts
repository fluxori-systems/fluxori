import { useReducedMotion } from '@/components/motion';
import { RefObject, useEffect, useRef } from 'react';
import { Chart } from 'chart.js';
import { applyAnimationOptions } from './chartjs-compat';

interface ChartAnimationOptions {
  /** Duration of the animation in ms */
  duration?: number;
  /** Easing function to use */
  easing?: 'linear' | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad' | 
           'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic' | 
           'easeInQuart' | 'easeOutQuart' | 'easeInOutQuart' | 
           'easeInQuint' | 'easeOutQuint' | 'easeInOutQuint';
  /** Whether to enable animations */
  enabled?: boolean;
  /** Number between 0-1 for animation delay factor */
  delayBetweenPoints?: number;
  /** Custom animation configuration */
  animations?: Record<string, any>;
}

/**
 * Hook that provides animated chart configurations following motion design principles
 * and respecting reduced motion preferences
 */
export function useChartAnimation(
  chartRef: RefObject<Chart<'line' | 'bar' | 'pie' | 'doughnut', any, unknown>>,
  options: ChartAnimationOptions = {}
) {
  const { getDuration, prefersReducedMotion } = useReducedMotion();
  const animationAppliedRef = useRef(false);
  
  // Default options for different chart types
  const getDefaultAnimationOptions = () => {
    return {
      duration: getDuration(400), // Default duration
      easing: 'easeOutQuart',
      enabled: !prefersReducedMotion,
      delayBetweenPoints: 0.1,
      animations: {
        x: {
          type: 'number',
          easing: 'easeOutQuart',
        },
        y: {
          type: 'number',
          easing: 'easeOutQuart',
        },
        radius: {
          duration: getDuration(400),
          easing: 'easeOutCubic',
        },
      },
    };
  };

  // Apply animation settings to chart
  useEffect(() => {
    if (chartRef.current && !animationAppliedRef.current) {
      const chart = chartRef.current;
      const defaultOptions = getDefaultAnimationOptions();
      
      // Merge default options with provided options
      const finalOptions = {
        ...defaultOptions,
        ...options,
        animations: {
          ...defaultOptions.animations,
          ...options.animations,
        },
      };

      // Disable animations if reduced motion is preferred
      if (prefersReducedMotion) {
        finalOptions.enabled = false;
        finalOptions.duration = 0;
      }

      // Use the type-safe helper from chartjs-compat
      applyAnimationOptions(chart, finalOptions);

      chart.update('none'); // Update without animation
      animationAppliedRef.current = true;
    }
  }, [chartRef, options, prefersReducedMotion]);

  // Function to trigger re-animation of the chart
  const reanimateChart = () => {
    if (chartRef.current) {
      animationAppliedRef.current = false;
      chartRef.current.data.datasets.forEach(dataset => {
        if (dataset.data) {
          // Store original data
          const originalData = [...dataset.data];
          
          // Reset data to trigger animation
          dataset.data = dataset.data.map(() => 0);
          chartRef.current?.update('none');
          
          // Restore data to trigger animation
          setTimeout(() => {
            if (chartRef.current) {
              dataset.data = originalData;
              chartRef.current.update();
            }
          }, 50);
        }
      });
    }
  };

  return {
    reanimateChart,
    animationOptions: {
      ...getDefaultAnimationOptions(),
      ...options,
    },
  };
}