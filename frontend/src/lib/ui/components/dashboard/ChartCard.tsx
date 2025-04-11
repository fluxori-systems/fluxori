'use client';

import React, { forwardRef, useMemo } from 'react';
import { Text } from '../../components/Text';
import { DashboardCard, BaseDashboardCardProps } from './DashboardCard';
import { useConnectionQuality } from '../../hooks/useConnection';
import { useSouthAfricanMarketOptimizations } from '../../../shared/hooks/useSouthAfricanMarketOptimizations';
import { ChartCardProps } from '../../../design-system/types/dashboard';

export interface DashboardChartCardProps extends Omit<BaseDashboardCardProps, 'type'>, 
  Omit<ChartCardProps, keyof BaseDashboardCardProps> {}

/**
 * ChartCard component for displaying interactive data visualizations with
 * optimizations for South African network conditions and data-saving.
 */
export const ChartCard = forwardRef<HTMLDivElement, DashboardChartCardProps>(
  ({ 
    id,
    title,
    description,
    chartType,
    chartData,
    chartOptions,
    showLegend = true,
    showDataLabels = false,
    interactive = true,
    canSimplify = true,
    textAlternative,
    ...rest
  }, ref) => {
    const { quality, isDataSaver } = useConnectionQuality();
    const { shouldReduceDataUsage, shouldUseLowResImages } = useSouthAfricanMarketOptimizations();
    
    // Determine if we should show simplified version
    const useSimplifiedChart = useMemo(() => {
      if (!canSimplify) return false;
      
      // Simplify on poor connections or data saver mode
      if (shouldReduceDataUsage && (quality === 'poor' || quality === 'low' || isDataSaver)) {
        return true;
      }
      
      return false;
    }, [canSimplify, shouldReduceDataUsage, quality, isDataSaver]);
    
    // Determine if we should disable interactivity
    const disableInteractivity = useMemo(() => {
      if (!interactive) return true;
      
      // Disable on very poor connections to save resources
      if (shouldReduceDataUsage && (quality === 'poor' || isDataSaver)) {
        return true;
      }
      
      return false;
    }, [interactive, shouldReduceDataUsage, quality, isDataSaver]);
    
    // For extremely poor connections, show text alternative if available
    if (shouldReduceDataUsage && quality === 'poor' && textAlternative) {
      return (
        <DashboardCard
          ref={ref}
          id={id}
          title={title}
          description={description}
          type="chart"
          {...rest}
        >
          <div style={{ 
            padding: rest.density === 'compact' ? 'var(--spacing-xs)' : 'var(--spacing-sm)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}>
            <Text size="sm" style={{ flex: 1 }}>
              {textAlternative}
            </Text>
            
            <Text size="xs" c="dimmed" mt="auto">
              Chart visualization not shown to save data. 
              <br />
              Chart type: {chartType.toUpperCase()}
            </Text>
          </div>
        </DashboardCard>
      );
    }
    
    // Render simplified chart
    if (useSimplifiedChart) {
      return (
        <DashboardCard
          ref={ref}
          id={id}
          title={title}
          description={description}
          type="chart"
          {...rest}
        >
          <div style={{ 
            padding: rest.density === 'compact' ? 'var(--spacing-xs)' : 'var(--spacing-sm)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}>
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: 150,
              background: 'var(--color-background-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              {/* In a real implementation, this would be a simplified chart renderer */}
              <Text>
                Simplified {chartType.toUpperCase()} Chart
              </Text>
            </div>
            
            {/* Simple legend for key data points */}
            {showLegend && chartData.labels && (
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-xs)',
                marginTop: 'auto'
              }}>
                <Text size="xs" fw={500}>Key data points:</Text>
                {/* Sample legend implementation - would use real data in production */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <Text size="xs" c="dimmed">Sample Item 1</Text>
                  <Text size="xs" c="dimmed">Sample Item 2</Text>
                </div>
              </div>
            )}
          </div>
        </DashboardCard>
      );
    }
    
    // Render full featured chart
    return (
      <DashboardCard
        ref={ref}
        id={id}
        title={title}
        description={description}
        type="chart"
        {...rest}
      >
        <div style={{ 
          padding: rest.density === 'compact' ? 'var(--spacing-xs)' : 'var(--spacing-sm)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: 200,
            background: 'var(--color-background-surface)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--spacing-sm)',
            marginBottom: showLegend ? 'var(--spacing-sm)' : 0
          }}>
            {/* This would be replaced with an actual chart library like Chart.js or Recharts */}
            <Text>
              {chartType.toUpperCase()} Chart 
              {disableInteractivity ? ' (Static)' : ' (Interactive)'}
            </Text>
          </div>
          
          {/* Chart legend */}
          {showLegend && (
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 'var(--spacing-xs)',
              marginTop: 'auto',
              padding: 'var(--spacing-xs) 0'
            }}>
              {/* Sample legend implementation - would use real data in production */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: 'var(--color-primary-500)' }}></div>
                  <Text size="xs">Series 1</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: 'var(--color-success-base)' }}></div>
                  <Text size="xs">Series 2</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: 'var(--color-warning-base)' }}></div>
                  <Text size="xs">Series 3</Text>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardCard>
    );
  }
);

ChartCard.displayName = 'ChartCard';