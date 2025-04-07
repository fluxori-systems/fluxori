import { Metadata } from 'next';
import { Container, Title, Card, ThemeIcon, useMantineTheme } from '@mantine/core'
import { Stack, Text, Grid, SimpleGrid, Group } from '@/components/ui';
import { 
  IconCreditCard, 
  IconShoppingCart, 
  IconUsers, 
  IconBuildingStore,
  IconPackage,
  IconTruck,
  IconBellRinging
} from '@tabler/icons-react';
import { MetricGroup, MetricData, PerformanceChart } from '@/components/data-visualization';
import { AIStatusBar } from '@/components/ai';
import { GSAPFadeIn, GSAPStagger } from '@/components/motion/gsap';

export const metadata: Metadata = {
  title: 'Dashboard | Fluxori',
  description: 'Fluxori inventory and marketplace management dashboard',
};

/**
 * Main dashboard page with overview metrics and charts
 */
export default function DashboardPage() {
  const theme = useMantineTheme();
  
  // Sample metrics for the dashboard
  const salesMetrics: MetricData[] = [
    {
      title: 'Total Revenue',
      value: '$86,452',
      change: 15.3,
      icon: <IconCreditCard />,
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
      title: 'Customers',
      value: '892',
      change: 12.5,
      icon: <IconUsers />,
      color: 'violet',
      trendData: [210, 230, 245, 260, 275, 290, 310],
    },
    {
      title: 'AOV',
      value: '$67.33',
      change: 6.5,
      icon: <IconBuildingStore />,
      color: 'teal',
      subtitle: 'Average Order Value',
      trendData: [60, 62, 58, 65, 66, 68, 67],
    },
  ];
  
  const inventoryMetrics: MetricData[] = [
    {
      title: 'Stock Items',
      value: '4,235',
      change: 2.1,
      icon: <IconPackage />,
      color: 'orange',
      subtitle: '12 low stock alerts',
    },
    {
      title: 'Shipments',
      value: '325',
      change: 5.4,
      icon: <IconTruck />,
      color: 'indigo',
      subtitle: 'Last 30 days',
    },
  ];
  
  // Chart data
  const salesChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Online Store',
        data: [18500, 21200, 19800, 22600, 26500, 28400],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Marketplaces',
        data: [12300, 15400, 14200, 16800, 19500, 22800],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Retail',
        data: [5200, 5800, 6100, 6500, 7200, 7800],
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
      },
    ],
  };
  
  const ordersChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Orders',
        data: [320, 354, 342, 362, 385, 398, 410],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  const channelDistribution = {
    labels: ['Amazon', 'Shopify', 'eBay', 'Walmart', 'Direct'],
    datasets: [
      {
        data: [38, 25, 15, 12, 10],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  // Sample AI insights messages
  const aiMessages = [
    'Sales have increased by 15.3% compared to last month',
    '12 products have low stock levels and need to be reordered',
    'There has been a 5% increase in abandoned carts this week',
    'Amazon sales have exceeded Shopify for the first time this quarter'
  ];

  return (
    <Container size="xl" py="xl">
      <Stack spacing="xl">
        <div>
          <Title>Dashboard</Title>
          <Text color="dimmed">Welcome back! Here's an overview of your business.</Text>
        </div>
        
        <GSAPFadeIn duration="NORMAL">
          <AIStatusBar 
            messages={aiMessages}
            confidence={0.95}
          />
        </GSAPFadeIn>
        
        {/* Main metrics */}
        <MetricGroup
          title="Sales Performance"
          description="Overview of key sales metrics for the last 30 days"
          metrics={salesMetrics}
        />
        
        {/* Charts and additional metrics */}
        <Grid>
          {/* Left column - Sales charts */}
          <Grid.Col md={8}>
            <Stack spacing="xl">
              <GSAPFadeIn duration="NORMAL" delay={0.1}>
                <PerformanceChart
                  title="Sales by Channel"
                  data={salesChartData}
                  type="bar"
                  height={300}
                />
              </GSAPFadeIn>
              
              <GSAPFadeIn duration="NORMAL" delay={0.2}>
                <PerformanceChart
                  title="Order Trends"
                  data={ordersChartData}
                  type="line"
                  height={260}
                />
              </GSAPFadeIn>
            </Stack>
          </Grid.Col>
          
          {/* Right column - Additional metrics and distribution */}
          <Grid.Col md={4}>
            <Stack spacing="xl">
              <GSAPFadeIn duration="NORMAL" delay={0.15}>
                <MetricGroup
                  title="Inventory Status"
                  metrics={inventoryMetrics}
                  direction="vertical"
                  showTrends={false}
                />
              </GSAPFadeIn>
              
              <GSAPFadeIn duration="NORMAL" delay={0.25}>
                <PerformanceChart
                  title="Sales Distribution by Channel"
                  data={channelDistribution}
                  type="doughnut"
                  height={260}
                  allowTypeChange={false}
                />
              </GSAPFadeIn>
            </Stack>
          </Grid.Col>
        </Grid>
        
        {/* Alerts and recent activity */}
        <Title order={2} mt="md">Recent Activity</Title>
        
        <GSAPStagger 
          duration="NORMAL"
          staggerDelay={0.05}
          fromY={20}
        >
          <SimpleGrid cols={3} breakpoints={[{ maxWidth: 'md', cols: 2 }, { maxWidth: 'xs', cols: 1 }]}>
            {[
              {
                title: 'New Order #1284',
                description: 'Amazon order for 5 items ($234.56)',
                time: '10 minutes ago',
                color: 'blue',
                icon: <IconShoppingCart size="1.2rem" />
              },
              {
                title: 'Low Stock Alert',
                description: 'Product X-001 has reached reorder point',
                time: '35 minutes ago',
                color: 'orange',
                icon: <IconBellRinging size="1.2rem" />
              },
              {
                title: 'Price Change',
                description: 'Competitor lowered price on 3 products',
                time: '2 hours ago',
                color: 'green',
                icon: <IconCreditCard size="1.2rem" />
              },
              {
                title: 'Shipment Status',
                description: 'Order #1273 has been delivered',
                time: '3 hours ago',
                color: 'teal',
                icon: <IconTruck size="1.2rem" />
              },
              {
                title: 'New Customer',
                description: 'Jane Smith made her first purchase',
                time: '5 hours ago',
                color: 'violet',
                icon: <IconUsers size="1.2rem" />
              },
              {
                title: 'Inventory Update',
                description: 'Received 100 units of Product Y-002',
                time: '1 day ago',
                color: 'indigo',
                icon: <IconPackage size="1.2rem" />
              },
            ].map((activity, index) => (
              <Card key={index} shadow="sm" p="md" radius="md" withBorder>
                <Group position="apart" mb="xs">
                  <Text weight={500}>{activity.title}</Text>
                  <ThemeIcon color={activity.color} variant="light" size="md">
                    {activity.icon}
                  </ThemeIcon>
                </Group>
                <Text size="sm" color="dimmed" mb="xs">
                  {activity.description}
                </Text>
                <Text size="xs" color="dimmed">
                  {activity.time}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </GSAPStagger>
      </Stack>
    </Container>
  );
}