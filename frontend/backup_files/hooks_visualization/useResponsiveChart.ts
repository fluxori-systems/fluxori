import { useEffect, RefObject, useState } from 'react';
import { Chart } from 'chart.js';
import { useReducedMotion } from '@/components/motion';
import { ANIMATION_BREAKPOINTS } from '@/components/motion/constants';
import { applyTooltipOptions } from './chartjs-compat';

/**
 * Hook that handles responsive chart configuration based on screen size
 * and applies appropriate animation settings for different device capabilities
 */
export function useResponsiveChart(
  chartRef: RefObject<Chart<'line' | 'bar' | 'pie' | 'doughnut', any, unknown>>
) {
  const [width, setWidth] = useState(0);
  const { prefersReducedMotion } = useReducedMotion();

  // Determine complexity level based on screen width
  const getComplexityLevel = (screenWidth: number) => {
    if (screenWidth >= ANIMATION_BREAKPOINTS.HIGH_COMPLEXITY) {
      return 'high';
    } else if (screenWidth >= ANIMATION_BREAKPOINTS.MEDIUM_COMPLEXITY) {
      return 'medium';
    } else {
      return 'low';
    }
  };

  // Apply responsive settings based on complexity level
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setWidth(window.innerWidth);
      }
    };

    // Initial call
    handleResize();

    // Set up resize listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Apply settings to chart based on complexity level
  useEffect(() => {
    if (chartRef.current && width > 0) {
      const chart = chartRef.current;
      const complexityLevel = getComplexityLevel(width);

      // Apply settings based on complexity level
      if (complexityLevel === 'high' && !prefersReducedMotion) {
        // High complexity - full animations, more visual elements
        applyTooltipOptions(chart, {
          animation: {
            duration: 150,
          }
        });

        // More detailed elements
        chart.options.elements = {
          ...chart.options.elements,
          point: {
            ...chart.options.elements?.point,
            radius: 4,
            hoverRadius: 6,
          },
          line: {
            ...chart.options.elements?.line,
            tension: 0.4, // Smoother curves
          },
        };
      } else if (complexityLevel === 'medium' && !prefersReducedMotion) {
        // Medium complexity - moderate animations, balanced visuals
        applyTooltipOptions(chart, {
          animation: {
            duration: 100,
          }
        });

        // Balanced elements
        chart.options.elements = {
          ...chart.options.elements,
          point: {
            ...chart.options.elements?.point,
            radius: 3,
            hoverRadius: 5,
          },
          line: {
            ...chart.options.elements?.line,
            tension: 0.3, // Moderate curves
          },
        };
      } else {
        // Low complexity - minimal animations, simplified visuals
        // Or when reduced motion is preferred
        applyTooltipOptions(chart, {
          animation: {
            duration: prefersReducedMotion ? 0 : 50,
          }
        });

        // Simplified elements
        chart.options.elements = {
          ...chart.options.elements,
          point: {
            ...chart.options.elements?.point,
            radius: 2,
            hoverRadius: 4,
          },
          line: {
            ...chart.options.elements?.line,
            tension: 0.2, // Straighter lines
          },
        };
      }

      chart.update('none');
    }
  }, [chartRef, width, prefersReducedMotion]);

  return {
    width,
    complexityLevel: getComplexityLevel(width),
  };
}