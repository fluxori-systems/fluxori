import React, { useRef } from 'react';
import { Card, useMantineTheme, Box } from '@mantine/core'
import { Group, Text, Stack } from '@/components/ui';
import { Line } from 'react-chartjs-2';
import { Chart, ChartData, ChartOptions } from 'chart.js';
import { useChartAnimation, useResponsiveChart } from '@/hooks/visualization';

export interface MetricTrendProps {
  /** Title of the metric trend */
  title: string;
  /** Current value of the metric */
  value: string | number;
  /** Data points for the trend */
  data: number[];
  /** Labels for the data points */
  labels?: string[];
  /** Color for the trend line */
  color?: string;
  /** Optional percentage change */
  change?: number;
  /** Whether the trend is in a loading state */
  loading?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * MetricTrend component for displaying a value with trend chart
 */
export function MetricTrend({
  title,
  value,
  data,
  labels,
  color,
  change,
  loading = false,
  className,
}: MetricTrendProps) {
  const theme = useMantineTheme();
  const chartRef = useRef<Chart<'line'>>(null);
  const { animationOptions } = useChartAnimation(chartRef);
  const { complexityLevel } = useResponsiveChart(chartRef);
  
  // Default color if not provided
  const lineColor = color || theme.colors.blue[6];
  const fillColor = color ? `${color}20` : theme.colors.blue[1];
  
  // Default labels if not provided
  const defaultLabels = labels || Array(data.length).fill('');
  
  // Get change label and color
  const changeLabel = change !== undefined ? `${change > 0 ? '+' : ''}${change}%` : '';
  const changeColor = !change ? 'gray' : change > 0 ? 'green' : 'red';

  // Chart data configuration
  const chartData: ChartData<'line'> = {
    labels: defaultLabels,
    datasets: [
      {
        data,
        borderColor: lineColor,
        backgroundColor: fillColor,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
      },
    ],
  };

  // Chart options configuration
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animationOptions,
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
        min: Math.min(...data) * 0.8,
        max: Math.max(...data) * 1.1,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: false,
        padding: 8,
        caretSize: 5,
        backgroundColor: theme.colors.dark[8],
        titleFont: {
          size: 12,
        },
        bodyFont: {
          size: 12,
        },
        displayColors: false,
      },
    },
    interaction: {
      intersect: false,
      mode: 'nearest',
    },
    elements: {
      line: {
        borderJoinStyle: 'round',
      },
    },
  };

  // Loading state placeholder
  if (loading) {
    return (
      <Card shadow="sm" p="md" radius="md" withBorder className={className}>
        <Stack spacing="xs">
          <div 
            style={{ 
              height: '1rem', 
              width: '60%', 
              backgroundColor: theme.colors.gray[1],
              borderRadius: theme.radius.sm,
            }} 
          />
          <div 
            style={{ 
              height: '2rem', 
              width: '30%', 
              backgroundColor: theme.colors.gray[1],
              borderRadius: theme.radius.sm,
              marginTop: theme.spacing.sm,
            }} 
          />
          <div 
            style={{ 
              height: '40px', 
              width: '100%', 
              backgroundColor: theme.colors.gray[1],
              borderRadius: theme.radius.sm,
              marginTop: theme.spacing.xs,
            }} 
          />
        </Stack>
      </Card>
    );
  }

  return (
    <Card shadow="sm" p="md" radius="md" withBorder className={className}>
      <Text size="sm" color="dimmed" weight={500} mb="xs">
        {title}
      </Text>
      
      <Group position="apart" mb="sm" align="flex-end">
        <Text size="xl" weight={700}>
          {value}
        </Text>
        {change !== undefined && (
          <Text size="sm" color={theme.colors[changeColor][6]} weight={500}>
            {changeLabel}
          </Text>
        )}
      </Group>
      
      <Box h={40}>
        <Line 
          ref={chartRef} 
          data={chartData} 
          options={chartOptions} 
          height="100%"
        />
      </Box>
    </Card>
  );
}