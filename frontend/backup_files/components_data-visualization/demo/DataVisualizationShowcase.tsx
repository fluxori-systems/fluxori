import React, { useState } from 'react';
import { Title, Box, useMantineTheme } from '@mantine/core'
import { Stack, Text, Group, Button, Grid, SimpleGrid, Tabs } from '@/components/ui';
import { 
  IconUsers, IconCreditCard, IconTruck, IconPackage,
  IconShoppingCart, IconCoin, IconRefresh, IconEye,
  IconDeviceDesktop, IconDeviceMobile, IconDeviceTablet,
  IconBrandAmazon, IconBrandShopee
} from '@tabler/icons-react';
import { 
  DataCard, DataGrid, MetricTrend, MetricGroup, PerformanceChart 
} from '../';
import { MetricData } from '../MetricGroup';

/**
 * Component that showcases data visualization components with motion integration
 */
export function DataVisualizationShowcase() {
  const theme = useMantineTheme();
  const [isLoading, setIsLoading] = useState(false);
  
  // Simulate loading state
  const toggleLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  // Sample data for metrics
  const dashboardMetrics: MetricData[] = [
    {
      title: 'Total Sales',
      value: '$24,532',
      change: 12.5,
      icon: <IconCreditCard />,
      color: 'blue',
      trendData: [12, 19, 15, 18, 22, 27, 24],
    },
    {
      title: 'Orders',
      value: '345',
      change: 8.1,
      icon: <IconShoppingCart />,
      color: 'green',
      trendData: [45, 52, 38, 41, 55, 50, 48],
    },
    {
      title: 'Customers',
      value: '1,293',
      change: -2.3,
      icon: <IconUsers />,
      color: 'violet',
      trendData: [120, 118, 115, 110, 112, 115, 108],
    },
    {
      title: 'Inventory Items',
      value: '892',
      change: 0,
      icon: <IconPackage />,
      color: 'orange',
      trendData: [220, 220, 225, 215, 218, 220, 220],
    },
  ];

  // Sample data for performance charts
  const salesPerformance = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Amazon',
        data: [65, 78, 80, 81, 95, 110],
        backgroundColor: theme.colors.blue[5],
      },
      {
        label: 'Shopify',
        data: [40, 45, 55, 59, 60, 77],
        backgroundColor: theme.colors.green[5],
      },
    ],
  };

  // Sample data for device breakdown chart
  const deviceData = {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [
      {
        data: [55, 35, 10],
        backgroundColor: [
          theme.colors.blue[5],
          theme.colors.green[5],
          theme.colors.orange[5],
        ],
        borderWidth: 0,
      },
    ],
  };

  // Sample data for marketplace metrics
  const marketplaceMetrics: MetricData[] = [
    {
      title: 'Amazon',
      value: '$12,432',
      change: 8.5,
      subtitle: '230 orders',
      icon: <IconBrandAmazon />,
      color: 'blue',
    },
    {
      title: 'Shopify',
      value: '$8,532',
      change: 15.2,
      subtitle: '115 orders',
      icon: <IconBrandShopee />,
      color: 'green',
    },
  ];

  // Device metrics
  const deviceMetrics: MetricData[] = [
    {
      title: 'Desktop',
      value: '12,432',
      change: 5.2,
      subtitle: '55% of traffic',
      icon: <IconDeviceDesktop />,
      color: 'blue',
    },
    {
      title: 'Mobile',
      value: '8,145',
      change: 12.5,
      subtitle: '35% of traffic',
      icon: <IconDeviceMobile />,
      color: 'green',
    },
    {
      title: 'Tablet',
      value: '2,184',
      change: -3.1,
      subtitle: '10% of traffic',
      icon: <IconDeviceTablet />,
      color: 'orange',
    },
  ];

  return (
    <Stack spacing="xl">
      <Box>
        <Title order={2} mb="sm">Data Visualization with Motion Design</Title>
        <Text mb="lg">
          These components showcase animated data visualizations that follow
          Fluxori's motion design principles for fluid, intelligent display of information.
        </Text>

        <Group position="left" mb="xl">
          <Button 
            leftIcon={<IconRefresh size="1rem" />}
            onClick={toggleLoading}
          >
            Simulate Loading
          </Button>
        </Group>
      </Box>

      <Tabs defaultValue="metrics">
        <Tabs.List mb="md">
          <Tabs.Tab value="metrics" icon={<IconCoin size="0.8rem" />}>Metrics</Tabs.Tab>
          <Tabs.Tab value="charts" icon={<IconEye size="0.8rem" />}>Charts</Tabs.Tab>
          <Tabs.Tab value="combined" icon={<IconPackage size="0.8rem" />}>Combined Views</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="metrics">
          <Stack spacing="xl">
            <Title order={3} mb="md">Data Cards</Title>
            <SimpleGrid cols={4} breakpoints={[{ maxWidth: 'md', cols: 2 }, { maxWidth: 'xs', cols: 1 }]}>
              <DataCard 
                title="Total Sales" 
                value="$24,532" 
                change={12.5}
                icon={<IconCreditCard />}
                loading={isLoading}
              />
              <DataCard 
                title="Orders" 
                value="345" 
                change={8.1}
                icon={<IconShoppingCart />}
                iconColor="green"
                loading={isLoading}
              />
              <DataCard 
                title="Customers" 
                value="1,293" 
                change={-2.3}
                icon={<IconUsers />}
                iconColor="violet"
                loading={isLoading}
              />
              <DataCard 
                title="Shipments" 
                value="189" 
                subtitle="Last 30 days"
                icon={<IconTruck />}
                iconColor="orange"
                loading={isLoading}
              />
            </SimpleGrid>

            <Title order={3} mt="xl" mb="md">Data Grid</Title>
            <DataGrid 
              items={[
                { id: '1', title: 'Total Sales', value: '$24,532', change: 12.5, icon: <IconCreditCard /> },
                { id: '2', title: 'Orders', value: '345', change: 8.1, icon: <IconShoppingCart />, iconColor: 'green' },
                { id: '3', title: 'Customers', value: '1,293', change: -2.3, icon: <IconUsers />, iconColor: 'violet' },
                { id: '4', title: 'Shipments', value: '189', subtitle: 'Last 30 days', icon: <IconTruck />, iconColor: 'orange' },
              ]}
              loading={isLoading}
            />

            <Title order={3} mt="xl" mb="md">Metric Trends</Title>
            <SimpleGrid cols={2} breakpoints={[{ maxWidth: 'xs', cols: 1 }]}>
              <MetricTrend
                title="Weekly Sales"
                value="$12,354"
                data={[12, 19, 15, 18, 22, 27, 24]}
                change={8.5}
                loading={isLoading}
              />
              <MetricTrend
                title="Weekly Orders"
                value="243"
                data={[45, 52, 38, 41, 55, 50, 48]}
                change={12.3}
                color={theme.colors.green[6]}
                loading={isLoading}
              />
            </SimpleGrid>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="charts">
          <Stack spacing="xl">
            <Title order={3} mb="md">Performance Charts</Title>
            <PerformanceChart
              title="Sales by Channel"
              data={salesPerformance}
              type="bar"
              height={300}
              loading={isLoading}
              onRefresh={toggleLoading}
            />

            <SimpleGrid cols={2} breakpoints={[{ maxWidth: 'xs', cols: 1 }]} mt="xl">
              <PerformanceChart
                title="Device Breakdown"
                data={deviceData}
                type="pie"
                height={250}
                allowTypeChange={false}
                loading={isLoading}
              />
              <PerformanceChart
                title="Monthly Orders"
                data={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [{
                    label: 'Orders',
                    data: [120, 145, 132, 155, 170, 182],
                    borderColor: theme.colors.green[6],
                    backgroundColor: theme.colors.green[2],
                    tension: 0.4,
                    fill: true,
                  }]
                }}
                type="line"
                height={250}
                allowTypeChange={false}
                loading={isLoading}
              />
            </SimpleGrid>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="combined">
          <Stack spacing="xl">
            <Title order={3} mb="md">Dashboard Metrics</Title>
            <MetricGroup
              metrics={dashboardMetrics}
              showTrends={true}
              loading={isLoading}
            />

            <Grid mt="xl">
              <Grid.Col md={8}>
                <PerformanceChart
                  title="Sales Performance"
                  data={salesPerformance}
                  type="bar"
                  height={300}
                  loading={isLoading}
                />
              </Grid.Col>
              <Grid.Col md={4}>
                <MetricGroup
                  title="Marketplaces"
                  metrics={marketplaceMetrics}
                  direction="vertical"
                  showTrends={false}
                  loading={isLoading}
                />
              </Grid.Col>
            </Grid>

            <Title order={3} mt="xl" mb="md">Website Analytics</Title>
            <Grid>
              <Grid.Col md={5}>
                <PerformanceChart
                  title="Traffic Sources"
                  data={deviceData}
                  type="doughnut"
                  height={250}
                  allowTypeChange={false}
                  loading={isLoading}
                />
              </Grid.Col>
              <Grid.Col md={7}>
                <MetricGroup
                  metrics={deviceMetrics}
                  direction="vertical"
                  showTrends={false}
                  loading={isLoading}
                />
              </Grid.Col>
            </Grid>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Box p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px' }} mt="xl">
        <Title order={3} mb="md">Motion Design Integration</Title>
        <Text>
          These data visualization components integrate these motion design principles:
        </Text>
        <ul>
          <li>
            <Text>
              <strong>Purposeful Intelligence:</strong> Animations reveal insights by drawing attention to 
              important data changes and relationships.
            </Text>
          </li>
          <li>
            <Text>
              <strong>Fluid Efficiency:</strong> Chart animations follow natural motion curves, respecting
              physics principles while maintaining performance.
            </Text>
          </li>
          <li>
            <Text>
              <strong>Precision & Accuracy:</strong> Loading states and transitions are carefully timed 
              to provide feedback without introducing delays.
            </Text>
          </li>
          <li>
            <Text>
              <strong>Accessibility:</strong> All animations respect reduced motion preferences and
              charts remain fully functional without animations.
            </Text>
          </li>
        </ul>
      </Box>
    </Stack>
  );
}