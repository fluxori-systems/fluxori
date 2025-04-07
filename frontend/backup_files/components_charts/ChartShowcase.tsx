import React, { useState } from 'react';
import { Title, Box, SegmentedControl } from '@mantine/core'
import { Stack, Text, Group, Button } from '@/components/ui';
import { AnimatedLineChart } from './AnimatedLineChart';

/**
 * Component that showcases the chart components with animation
 * Used for development and documentation purposes
 */
export function ChartShowcase() {
  const [chartType, setChartType] = useState('sales');
  const [animate, setAnimate] = useState(true);
  
  // Sample data for different chart types
  const salesData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Amazon',
        data: [65, 78, 80, 81, 95, 110, 136],
      },
      {
        label: 'Shopify',
        data: [40, 45, 55, 59, 60, 77, 92],
      },
    ],
  };
  
  const inventoryData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Warehouse A',
        data: [100, 95, 85, 75, 90, 88, 92, 96, 105, 115, 130, 120],
        borderColor: 'rgba(53, 162, 235, 1)',
      },
      {
        label: 'Warehouse B',
        data: [50, 55, 65, 70, 68, 75, 78, 80, 85, 95, 105, 100],
        borderColor: 'rgba(255, 99, 132, 1)',
      },
    ],
  };
  
  const analyticsData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Page Views',
        data: [1200, 1900, 3000, 5000, 2000, 3000, 7000],
        borderColor: 'rgba(75, 192, 192, 1)',
      },
      {
        label: 'Unique Visitors',
        data: [600, 800, 1500, 2200, 1000, 1500, 3500],
        borderColor: 'rgba(153, 102, 255, 1)',
      },
      {
        label: 'Conversions',
        data: [120, 190, 300, 500, 200, 300, 700],
        borderColor: 'rgba(255, 159, 64, 1)',
      },
    ],
  };

  // Get current chart data based on selection
  const getCurrentChartData = () => {
    switch (chartType) {
      case 'sales':
        return { data: salesData, title: 'Monthly Sales' };
      case 'inventory':
        return { data: inventoryData, title: 'Inventory Levels' };
      case 'analytics':
        return { data: analyticsData, title: 'Website Analytics' };
      default:
        return { data: salesData, title: 'Monthly Sales' };
    }
  };

  const { data, title } = getCurrentChartData();

  // Trigger reanimation by forcing a key change
  const [key, setKey] = useState(0);
  const reanimateChart = () => {
    setKey(prevKey => prevKey + 1);
  };

  return (
    <Stack spacing="xl">
      <Title order={2}>Chart.js Integration with Motion Design</Title>
      <Text>
        These charts follow Fluxori's motion design principles with purposeful
        animations that respect reduced motion preferences.
      </Text>

      <Group position="apart">
        <SegmentedControl
          value={chartType}
          onChange={setChartType}
          data={[
            { label: 'Sales', value: 'sales' },
            { label: 'Inventory', value: 'inventory' },
            { label: 'Analytics', value: 'analytics' },
          ]}
          mb="md"
        />
        
        <Group>
          <Button variant="light" onClick={reanimateChart}>
            Re-animate Chart
          </Button>
          <Button 
            variant={animate ? "filled" : "outline"}
            onClick={() => setAnimate(!animate)}
          >
            {animate ? 'Disable Animation' : 'Enable Animation'}
          </Button>
        </Group>
      </Group>

      <Box p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px' }}>
        <AnimatedLineChart
          key={key}
          data={data}
          title={title}
          height={400}
          animate={animate}
        />
      </Box>

      <Box p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px' }}>
        <Title order={3} mb="md">Motion Design Integration</Title>
        <Text>
          Our Chart.js integration follows these motion design principles:
        </Text>
        <ul>
          <li>
            <Text>
              <strong>Purposeful Intelligence:</strong> Animations guide attention to 
              data points and trends, making insights more accessible.
            </Text>
          </li>
          <li>
            <Text>
              <strong>Fluid Efficiency:</strong> Animations are optimized for performance
              and follow natural easing patterns.
            </Text>
          </li>
          <li>
            <Text>
              <strong>Precision & Accuracy:</strong> Animation durations are calibrated for
              the right balance between perception and responsiveness.
            </Text>
          </li>
          <li>
            <Text>
              <strong>Accessibility:</strong> All animations respect reduced motion preferences
              and maintain full functionality when animations are disabled.
            </Text>
          </li>
        </ul>
      </Box>
    </Stack>
  );
}