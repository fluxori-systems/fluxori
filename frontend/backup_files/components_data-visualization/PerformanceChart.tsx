import React, { useRef } from 'react';
import { Card, Box, ActionIcon, useMantineTheme, SegmentedControl } from '@mantine/core'
import { Group, Text, Stack } from '@/components/ui';
import { IconDownload, IconRefresh, IconChartBar, IconChartLine } from '@tabler/icons-react';
import { AnimatedChart } from '../charts';
import { useChartAnimation } from '@/hooks/visualization';
import { Chart, ChartData, ChartOptions, ChartType } from 'chart.js';

export interface PerformanceChartProps {
  /** Title for the chart */
  title: string;
  /** Chart data */
  data: ChartData;
  /** Chart type ('bar' | 'line') */
  type?: ChartType;
  /** Chart height */
  height?: number;
  /** Whether to allow changing chart types */
  allowTypeChange?: boolean;
  /** Whether to show download button */
  showDownload?: boolean;
  /** Whether to show refresh button */
  showRefresh?: boolean;
  /** Function to call when refresh is clicked */
  onRefresh?: () => void;
  /** Function to call when download is clicked */
  onDownload?: () => void;
  /** Additional chart options */
  chartOptions?: ChartOptions;
  /** Whether the chart is loading */
  loading?: boolean;
}

/**
 * Advanced performance chart component with controls
 */
export function PerformanceChart({
  title,
  data,
  type: initialType = 'bar',
  height = 300,
  allowTypeChange = true,
  showDownload = true,
  showRefresh = true,
  onRefresh,
  onDownload,
  chartOptions = {},
  loading = false,
}: PerformanceChartProps) {
  const theme = useMantineTheme();
  const chartRef = useRef<Chart<ChartType>>(null);
  const { reanimateChart } = useChartAnimation(chartRef);
  const [chartType, setChartType] = React.useState<ChartType>(initialType);

  // Handle chart type change
  const handleTypeChange = (value: string) => {
    setChartType(value as ChartType);
    // Re-animate the chart after type change
    setTimeout(() => {
      reanimateChart();
    }, 50);
  };

  // Handle refresh click
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    reanimateChart();
  };

  // Base chart options
  const baseOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
        titleColor: theme.colorScheme === 'dark' ? theme.white : theme.black,
        bodyColor: theme.colorScheme === 'dark' ? theme.colors.gray[3] : theme.colors.gray[7],
        borderColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2],
        borderWidth: 1,
        padding: 10,
        cornerRadius: 4,
        displayColors: true,
        boxPadding: 3,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        grid: {
          color: theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[2],
          drawBorder: false,
          drawTicks: false,
        },
        ticks: {
          padding: 5,
          color: theme.colorScheme === 'dark' ? theme.colors.gray[3] : theme.colors.gray[7],
        },
      },
      y: {
        grid: {
          color: theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[2],
          drawBorder: false,
          drawTicks: false,
        },
        ticks: {
          padding: 5,
          color: theme.colorScheme === 'dark' ? theme.colors.gray[3] : theme.colors.gray[7],
        },
        beginAtZero: true,
      },
    },
  };

  // Merge options
  const mergedOptions = {
    ...baseOptions,
    ...chartOptions,
    plugins: {
      ...baseOptions.plugins,
      ...chartOptions.plugins,
    },
    scales: {
      ...baseOptions.scales,
      ...chartOptions.scales,
    },
  };

  // Loading state placeholder
  if (loading) {
    return (
      <Card shadow="sm" p="md" radius="md" withBorder>
        <Stack spacing="md">
          <Group position="apart">
            <div 
              style={{ 
                height: '1.5rem', 
                width: '40%', 
                backgroundColor: theme.colors.gray[1],
                borderRadius: theme.radius.sm,
              }} 
            />
            <div 
              style={{ 
                height: '1.5rem', 
                width: '30%', 
                backgroundColor: theme.colors.gray[1],
                borderRadius: theme.radius.sm,
              }} 
            />
          </Group>
          <div 
            style={{ 
              height: `${height}px`, 
              width: '100%', 
              backgroundColor: theme.colors.gray[1],
              borderRadius: theme.radius.sm,
            }} 
          />
        </Stack>
      </Card>
    );
  }

  return (
    <Card shadow="sm" p="md" radius="md" withBorder>
      <Group position="apart" mb="lg">
        <Text size="lg" weight={500}>
          {title}
        </Text>
        <Group spacing="xs">
          {allowTypeChange && (
            <SegmentedControl
              value={chartType}
              onChange={handleTypeChange}
              data={[
                {
                  value: 'bar',
                  label: (
                    <Group spacing={5}>
                      <IconChartBar size="1rem" />
                      <Box ml={5}>Bar</Box>
                    </Group>
                  ),
                },
                {
                  value: 'line',
                  label: (
                    <Group spacing={5}>
                      <IconChartLine size="1rem" />
                      <Box ml={5}>Line</Box>
                    </Group>
                  ),
                },
              ]}
              size="xs"
            />
          )}
          {showRefresh && (
            <ActionIcon 
              variant="light" 
              color="blue" 
              onClick={handleRefresh}
              title="Refresh data"
            >
              <IconRefresh size="1.125rem" />
            </ActionIcon>
          )}
          {showDownload && (
            <ActionIcon 
              variant="light" 
              color="blue" 
              onClick={onDownload}
              title="Download data"
            >
              <IconDownload size="1.125rem" />
            </ActionIcon>
          )}
        </Group>
      </Group>

      <Box h={height}>
        <AnimatedChart
          type={chartType}
          data={data}
          options={mergedOptions}
          animate={true}
        />
      </Box>
    </Card>
  );
}