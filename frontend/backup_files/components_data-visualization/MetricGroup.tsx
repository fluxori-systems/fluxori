import React from 'react';
import { Box, ThemeIcon, useMantineTheme } from '@mantine/core'
import { Group, Stack, Text } from '@/components/ui';
import { MetricTrend } from './MetricTrend';
import { DataCard } from './DataCard';
import { TransitionFade } from '../motion';

export interface MetricData {
  /** Title of the metric */
  title: string;
  /** Current value of the metric */
  value: string | number;
  /** Optional percentage change */
  change?: number;
  /** Optional subtitle */
  subtitle?: string;
  /** Icon component */
  icon?: React.ReactNode;
  /** Color for the icon/trend */
  color?: string;
  /** Historical data for trending (if available) */
  trendData?: number[];
  /** Labels for the trend data */
  trendLabels?: string[];
}

export interface MetricGroupProps {
  /** Title for the metric group */
  title?: string;
  /** Description for the metric group */
  description?: string;
  /** Array of metrics to display */
  metrics: MetricData[];
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Whether to show trend charts where data is available */
  showTrends?: boolean;
  /** Whether the component is in loading state */
  loading?: boolean;
}

/**
 * Displays a group of related metrics with optional trends
 */
export function MetricGroup({
  title,
  description,
  metrics,
  direction = 'horizontal',
  showTrends = true,
  loading = false,
}: MetricGroupProps) {
  const theme = useMantineTheme();
  const isHorizontal = direction === 'horizontal';

  return (
    <Box>
      <TransitionFade show={true} duration="FAST">
        {(title || description) && (
          <Box mb="md">
            {title && (
              <Text size="lg" weight={600}>
                {title}
              </Text>
            )}
            {description && (
              <Text size="sm" color="dimmed">
                {description}
              </Text>
            )}
          </Box>
        )}

        <Group position="apart" align="flex-start" spacing="md" grow={isHorizontal}>
          {metrics.map((metric, index) => {
            // Show trend chart if data is available and showTrends is true
            const hasTrendData = Array.isArray(metric.trendData) && 
                                metric.trendData.length > 1 && 
                                showTrends;
            
            return hasTrendData ? (
              <Box key={index} style={{ flex: isHorizontal ? 1 : 'unset', width: isHorizontal ? 'unset' : '100%' }}>
                <MetricTrend
                  title={metric.title}
                  value={metric.value}
                  data={metric.trendData!}
                  labels={metric.trendLabels}
                  change={metric.change}
                  color={metric.color}
                  loading={loading}
                />
              </Box>
            ) : (
              <Box key={index} style={{ flex: isHorizontal ? 1 : 'unset', width: isHorizontal ? 'unset' : '100%' }}>
                <DataCard
                  title={metric.title}
                  value={metric.value}
                  change={metric.change}
                  subtitle={metric.subtitle}
                  icon={metric.icon}
                  iconColor={metric.color}
                  loading={loading}
                />
              </Box>
            );
          })}
        </Group>
      </TransitionFade>
    </Box>
  );
}