import { Metadata } from 'next';
import {
  Container,
  Title,
  Card,
  Paper,
  Select,
  SegmentedControl,
} from '@mantine/core';
import {
  IconChartBar,
  IconChartPie,
  IconChartLine,
  IconUsers,
  IconPackage,
  IconShoppingCart,
  IconChartAreaLine,
  IconChartDonut,
  IconWorldWww,
} from '@tabler/icons-react';

// Import our custom UI components with fixed typing
import { Stack, Text, Grid, SimpleGrid, Group, Tabs } from '@/components/ui';
import { MetricGroup, MetricData, PerformanceChart } from '@/components/data-visualization';
import { GSAPFadeIn } from '@/components/motion/gsap';

export const metadata: Metadata = {
  title: 'Analytics | Fluxori',
  description: 'Business analytics and insights for your inventory and marketplace data',
};

/**
 * Analytics dashboard with comprehensive business metrics and charts
 */
export default function AnalyticsPage() {
  // Sample metrics
  const salesPerformanceMetrics: MetricData[] = [
    {
      title: 'Revenue',
      value: '$86,452',
      change: 15.3,
      icon: <IconChartLine />,
      color: 'blue',
      trendData: [45, 52, 49, 60, 72, 80, 85],
    },
    {
      title: 'Orders',
      value: '1,284',
      change: 8.2,
      icon: <IconShoppingCart />,
      color: 'green',
      trendData: [320, 354, 342, 362, 385, 398, 410],
    },
    {
      title: 'Average Order Value',
      value: '$67.33',
      change: 6.5,
      icon: <IconChartDonut />,
      color: 'teal',
      trendData: [60, 62, 58, 65, 66, 68, 67],
    },
    {
      title: 'Conversion Rate',
      value: '3.2%',
      change: -0.5,
      icon: <IconUsers />,
      color: 'violet',
      trendData: [3.3, 3.4, 3.3, 3.1, 3.0, 3.2, 3.2],
    },
  ];

  const inventoryMetrics: MetricData[] = [
    {
      title: 'Total Products',
      value: '4,235',
      change: 2.1,
      icon: <IconPackage />,
      color: 'orange',
    },
    {
      title: 'Unique Visitors',
      value: '28,631',
      change: 12.3,
      icon: <IconWorldWww />,
      color: 'cyan',
    },
  ];

  // Chart data
  const revenueByChannelData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Amazon',
        data: [12500, 14200, 13800, 15600, 17500, 19400],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Shopify',
        data: [9300, 10400, 9200, 11800, 13500, 15800],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'eBay',
        data: [5200, 5800, 6100, 6500, 7200, 7800],
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
      },
      {
        label: 'Walmart',
        data: [4200, 4800, 5100, 5500, 6200, 6800],
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
      },
    ],
  };

  const customerAcquisitionData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New Customers',
        data: [120, 154, 142, 162, 185, 198],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Returning Customers',
        data: [210, 230, 245, 260, 275, 290],
        borderColor: 'rgba(53, 162, 235, 1)',
        backgroundColor: 'rgba(53, 162, 235, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const categoryDistributionData = {
    labels: ['Electronics', 'Clothing', 'Home', 'Toys', 'Beauty', 'Sports'],
    datasets: [
      {
        data: [35, 25, 15, 10, 8, 7],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const salesTrendsData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Sales',
        data: [18500, 21200, 19800, 22600, 26500, 28400],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <Container size="xl" py="xl">
      <Stack spacing="xl">
        <div>
          <Title>Analytics Dashboard</Title>
          <Text color="dimmed">Comprehensive view of your business performance</Text>
        </div>

        <Group position="apart">
          <SegmentedControl
            data={[
              { label: 'Last 7 Days', value: '7d' },
              { label: 'Last 30 Days', value: '30d' },
              { label: 'Last Quarter', value: 'quarter' },
              { label: 'Year to Date', value: 'ytd' },
              { label: 'Custom', value: 'custom' },
            ]}
            defaultValue="30d"
          />
          <Select
            placeholder="Select comparison"
            defaultValue="prev"
            data={[
              { value: 'prev', label: 'vs. Previous Period' },
              { value: 'year', label: 'vs. Same Period Last Year' },
              { value: 'plan', label: 'vs. Plan' },
            ]}
            style={{ width: 200 }}
          />
        </Group>

        <Tabs defaultValue="overview">
          <Tabs.List>
            <Tabs.Tab value="overview" icon={<IconChartBar size="0.8rem" />}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="sales" icon={<IconChartLine size="0.8rem" />}>
              Sales
            </Tabs.Tab>
            <Tabs.Tab value="products" icon={<IconPackage size="0.8rem" />}>
              Products
            </Tabs.Tab>
            <Tabs.Tab value="customers" icon={<IconUsers size="0.8rem" />}>
              Customers
            </Tabs.Tab>
          </Tabs.List>

          <Paper p="md" mt="md">
            <Tabs.Panel value="overview">
              <Stack spacing="xl">
                {/* Overview metrics */}
                <MetricGroup
                  title="Sales Performance"
                  description="Key metrics for the selected period"
                  metrics={salesPerformanceMetrics}
                />

                {/* Overview charts */}
                <Grid>
                  <Grid.Col md={8}>
                    <GSAPFadeIn duration="NORMAL" delay={0.1}>
                      <PerformanceChart
                        title="Revenue by Channel"
                        data={revenueByChannelData}
                        type="bar"
                        height={300}
                      />
                    </GSAPFadeIn>
                  </Grid.Col>
                  <Grid.Col md={4}>
                    <GSAPFadeIn duration="NORMAL" delay={0.2}>
                      <PerformanceChart
                        title="Category Distribution"
                        data={categoryDistributionData}
                        type="doughnut"
                        height={300}
                        allowTypeChange={false}
                      />
                    </GSAPFadeIn>
                  </Grid.Col>
                </Grid>

                {/* Additional overview metrics */}
                <Grid>
                  <Grid.Col md={8}>
                    <GSAPFadeIn duration="NORMAL" delay={0.25}>
                      <PerformanceChart
                        title="Customer Acquisition"
                        data={customerAcquisitionData}
                        type="line"
                        height={260}
                      />
                    </GSAPFadeIn>
                  </Grid.Col>
                  <Grid.Col md={4}>
                    <GSAPFadeIn duration="NORMAL" delay={0.15}>
                      <MetricGroup
                        title="Additional Metrics"
                        metrics={inventoryMetrics}
                        direction="vertical"
                        showTrends={false}
                      />
                    </GSAPFadeIn>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="sales">
              <Stack spacing="md">
                <Title order={3}>Sales Analytics</Title>
                <Text color="dimmed">Detailed sales performance analytics across all channels</Text>

                <Grid>
                  <Grid.Col md={12}>
                    <PerformanceChart
                      title="Sales Trends"
                      data={salesTrendsData}
                      type="line"
                      height={300}
                    />
                  </Grid.Col>
                </Grid>

                <SimpleGrid cols={2} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
                  <Card shadow="sm" p="lg" withBorder>
                    <Card.Section withBorder inheritPadding py="xs">
                      <Group position="apart">
                        <Text weight={500}>Top Selling Products</Text>
                      </Group>
                    </Card.Section>
                    <Text mt="md" color="dimmed" size="sm">
                      Detailed metrics for top selling products will be displayed here
                    </Text>
                  </Card>

                  <Card shadow="sm" p="lg" withBorder>
                    <Card.Section withBorder inheritPadding py="xs">
                      <Group position="apart">
                        <Text weight={500}>Sales by Geographic Region</Text>
                      </Group>
                    </Card.Section>
                    <Text mt="md" color="dimmed" size="sm">
                      Geographic distribution of sales will be displayed here
                    </Text>
                  </Card>
                </SimpleGrid>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="products">
              <Text>Detailed product analytics will be implemented here</Text>
            </Tabs.Panel>

            <Tabs.Panel value="customers">
              <Text>Detailed customer analytics will be implemented here</Text>
            </Tabs.Panel>
          </Paper>
        </Tabs>
      </Stack>
    </Container>
  );
}
