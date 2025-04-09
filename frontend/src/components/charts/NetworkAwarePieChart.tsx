'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { useNetworkAwareChart } from '../../hooks/useNetworkAwareChart';
import { NetworkAwarePieChartProps, ChartDataPoint } from '../../types/chart.types';
import { Text } from '../../lib/ui/components/Text';

// Register Chart.js components
Chart.register(...registerables);

/**
 * Network-aware pie chart component that adapts to connection quality
 * Implements the Agent-First Interface design philosophy with SA market optimization
 */
export function NetworkAwarePieChart<T extends ChartDataPoint>({
  data,
  nameKey,
  valueKey,
  colors,
  height = 300,
  width = '100%',
  responsive = true,
  margin = { top: 10, right: 30, left: 30, bottom: 10 },
  showLabels = true,
  donut = false,
  innerRadiusRatio = 0.6,
  showDataLabels = false,
  noDataText = 'No data available',
  textAlternative,
  forceConnectionQuality,
  hideOnPoorConnection = false,
  className
}: NetworkAwarePieChartProps<T>) {
  // Get network-aware chart configuration
  const {
    shouldSimplify,
    showTextAlternative,
    animation,
    profileConfig,
    getOptimizedData,
    getDesignSystemColors
  } = useNetworkAwareChart(forceConnectionQuality);

  // Reference to the canvas element
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  
  // Reference to the chart instance
  const chartInstance = useRef<Chart | null>(null);

  // Get colors from design system if not provided
  const chartColors = useMemo(() => {
    return colors || getDesignSystemColors(data?.length || 0);
  }, [colors, getDesignSystemColors, data?.length]);

  // Optimize data for current network conditions
  const optimizedData = useMemo(() => {
    return getOptimizedData(data);
  }, [data, getOptimizedData]);

  // Calculate total for percentages
  const total = useMemo(() => {
    if (!data) return 0;
    return data.reduce((sum, item) => sum + (Number((item as any)[valueKey]) || 0), 0);
  }, [data, valueKey]);

  // Create or update chart when data or configuration changes
  useEffect(() => {
    // If there's no canvas ref, or no data, don't create a chart
    if (!chartRef.current || !optimizedData || optimizedData.length === 0) {
      return;
    }

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // For simplified presentation, limit the number of data points
    const displayData = shouldSimplify && optimizedData.length > 5
      ? [
          ...optimizedData.slice(0, 4),
          {
            [nameKey]: 'Other',
            [valueKey]: optimizedData.slice(4).reduce(
              (sum, item) => sum + (Number((item as any)[valueKey]) || 0), 0
            )
          }
        ]
      : optimizedData;

    // Extract labels and datasets
    const labels = displayData.map(item => String(item[nameKey]));
    const values = displayData.map(item => Number(item[valueKey]));
    
    // Create chart instance
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: chartColors.slice(0, displayData.length),
            borderColor: 'var(--color-background-card)',
            borderWidth: 1,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: animation.enabled ? animation.duration : 0,
            easing: animation.easing,
          } as const,
          cutout: donut ? `${innerRadiusRatio * 100}%` : 0,
          plugins: {
            legend: {
              display: !shouldSimplify || !profileConfig.simplifiedLegend,
              position: 'bottom',
              labels: {
                color: 'var(--color-text-primary)',
                font: {
                  size: 12,
                },
                boxWidth: 10,
                usePointStyle: true,
              },
            },
            tooltip: {
              enabled: profileConfig.showTooltips,
              backgroundColor: 'var(--color-background-card)',
              borderColor: 'var(--color-border-default)',
              borderWidth: 1,
              cornerRadius: 4,
              bodyFont: {
                size: 12,
              },
              titleFont: {
                size: 12,
                weight: 'normal',
              },
              titleColor: 'var(--color-text-secondary)',
              bodyColor: 'var(--color-text-primary)',
              padding: 8,
              callbacks: {
                label: function(context) {
                  const value = context.raw as number;
                  const percentage = total ? ((value / total) * 100).toFixed(1) : '0';
                  return `${context.label}: ${value} (${percentage}%)`;
                }
              }
            },
          },
        },
      });
    }

    // Cleanup function to destroy chart on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [
    optimizedData, 
    nameKey, 
    valueKey,
    chartColors,
    donut,
    innerRadiusRatio,
    showLabels,
    shouldSimplify, 
    profileConfig, 
    animation,
    total
  ]);

  // If there's no data, show a message
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height,
          width: responsive ? '100%' : width,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-background-surface)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-md)'
        }}
        className={className}
      >
        <Text>{noDataText}</Text>
      </div>
    );
  }

  // If we should show text alternative or hide on poor connection
  if ((showTextAlternative && textAlternative) || 
      (hideOnPoorConnection && profileConfig.maxDataPoints <= 20)) {
    return (
      <div
        style={{
          height,
          width: responsive ? '100%' : width,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-background-surface)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-md)'
        }}
        className={className}
      >
        <Text size="sm" style={{ marginBottom: 'var(--spacing-sm)' }}>
          {textAlternative || 'Chart visualization simplified to save data.'}
        </Text>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-xs)'
          }}
        >
          {data.slice(0, 5).map((item, index) => {
            const name = String(item[nameKey]);
            const value = Number(item[valueKey]);
            const percentage = total ? ((value / total) * 100).toFixed(1) : '0';
            
            return (
              <div 
                key={`${name}-${index}`} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: 8 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: chartColors[index % chartColors.length],
                      borderRadius: 2
                    }}
                  />
                  <Text size="xs">{name}</Text>
                </div>
                <Text size="xs" fw="medium">{percentage}%</Text>
              </div>
            );
          })}
          
          {/* Show "Other" category if data is too large */}
          {data.length > 5 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: 8 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: 'var(--color-neutral-400)',
                    borderRadius: 2
                  }}
                />
                <Text size="xs">Other items ({data.length - 5})</Text>
              </div>
              <Text size="xs" fw="medium">...</Text>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Return the chart
  return (
    <div 
      style={{ 
        height, 
        width: responsive ? '100%' : width,
        position: 'relative',
        padding: `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`,
      }} 
      className={className}
    >
      <canvas ref={chartRef}></canvas>
    </div>
  );
}