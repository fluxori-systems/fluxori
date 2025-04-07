import { useRef, useEffect, useState } from 'react';
import { Chart, ChartType, ChartOptions } from 'chart.js';
import { applyAnimationOptions, applyTooltipOptions } from './helpers';
import { SafeAnimationOptions, SafeTooltipOptions } from './types';

/**
 * Hook for applying animations to charts
 */
export function useChartAnimation(
  chartRef: React.RefObject<Chart>,
  options: SafeAnimationOptions = {}
) {
  const animationAppliedRef = useRef(false);
  
  // Apply animation settings to the chart
  useEffect(() => {
    if (chartRef.current && !animationAppliedRef.current) {
      applyAnimationOptions(chartRef.current, options);
      animationAppliedRef.current = true;
    }
  }, [chartRef, options]);
  
  // Function to re-animate the chart
  const reanimateChart = () => {
    if (chartRef.current) {
      animationAppliedRef.current = false;
      
      // Store original data
      const originalData = chartRef.current.data.datasets.map(dataset => [...(dataset.data as any[])]);
      
      // Reset data to trigger animation
      chartRef.current.data.datasets.forEach(dataset => {
        dataset.data = dataset.data.map(() => 0);
      });
      
      // Update without animation
      chartRef.current.update('none');
      
      // Restore data with animation
      setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.data.datasets.forEach((dataset, i) => {
            dataset.data = originalData[i];
          });
          chartRef.current.update();
        }
      }, 50);
    }
  };
  
  return { reanimateChart };
}

/**
 * Hook for responsive chart configuration
 */
export function useResponsiveChart<TType extends ChartType>(
  chartRef: React.RefObject<Chart<TType>>,
  breakpoints: { small: number; medium: number } = { small: 576, medium: 992 }
) {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 992
  );
  
  // Update width on resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Get complexity level based on screen size
  const getComplexityLevel = () => {
    if (width <= breakpoints.small) return 'low';
    if (width <= breakpoints.medium) return 'medium';
    return 'high';
  };
  
  // Apply configuration based on complexity
  useEffect(() => {
    if (!chartRef.current) return;
    
    const complexity = getComplexityLevel();
    
    if (complexity === 'high') {
      // High complexity - full animations and details
      applyTooltipOptions(chartRef.current, {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        cornerRadius: 4,
        displayColors: true,
      });
      
      applyAnimationOptions(chartRef.current, {
        duration: 1000,
        easing: 'easeOutQuart',
      });
    } else if (complexity === 'medium') {
      // Medium complexity
      applyTooltipOptions(chartRef.current, {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        cornerRadius: 3,
        displayColors: true,
      });
      
      applyAnimationOptions(chartRef.current, {
        duration: 800,
        easing: 'easeOutCubic',
      });
    } else {
      // Low complexity - minimal animations and details
      applyTooltipOptions(chartRef.current, {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        cornerRadius: 2,
        displayColors: false,
      });
      
      applyAnimationOptions(chartRef.current, {
        duration: 500,
        easing: 'easeOutQuad',
      });
    }
    
    // Update the chart
    chartRef.current.update();
  }, [chartRef, width, breakpoints]);
  
  return {
    complexity: getComplexityLevel(),
  };
}