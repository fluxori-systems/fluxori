import { Metadata } from 'next';
import { Container, Title, Card, TextInput, ActionIcon, Badge, Table, Select, ScrollArea, Paper, Avatar } from '@mantine/core'
import { Stack, Text, Group, Button, Menu, Tabs, Grid } from '@/components/ui';
import { 
  IconSearch, 
  IconAdjustments,
  IconPackage,
  IconTruck,
  IconShoppingCart,
  IconAlertCircle,
  IconChecks,
  IconDotsVertical,
  IconEye,
  IconFileInvoice,
  IconPrinter,
  IconTrash,
  IconBrandAmazon,
  IconBrandShopee,
  IconBrandWalmart,
  IconBuildingStore,
  IconRefresh
} from '@tabler/icons-react';
import { MetricGroup, MetricData, PerformanceChart } from '@/components/data-visualization';
import { GSAPStagger, GSAPFadeIn } from '@/components/motion/gsap';

export const metadata: Metadata = {
  title: 'Order Management | Fluxori',
  description: 'Manage your orders across multiple marketplaces',
};

/**
 * Order management page
 */
export default function OrdersPage() {
  // Sample order metrics
  const orderMetrics: MetricData[] = [
    {
      title: 'Total Orders',
      value: '1,284',
      change: 8.2,
      icon: <IconShoppingCart />,
      color: 'blue',
      trendData: [320, 354, 342, 362, 385, 398, 410],
    },
    {
      title: 'To Ship',
      value: '32',
      change: -5.2,
      icon: <IconPackage />,
      color: 'orange',
    },
    {
      title: 'In Transit',
      value: '64',
      change: 12.3,
      icon: <IconTruck />,
      color: 'green',
    },
    {
      title: 'Issues',
      value: '7',
      change: -15.3,
      icon: <IconAlertCircle />,
      color: 'red',
    },
  ];

  // Chart data for order trends
  const orderTrendsChartData = {
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

  // Chart data for order channel distribution
  const orderChannelData = {
    labels: ['Amazon', 'Shopify', 'eBay', 'Walmart', 'Direct'],
    datasets: [
      {
        data: [45, 25, 15, 10, 5],
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

  // Sample orders
  const orders = [
    {
      id: 'ORD-1284',
      channel: 'Amazon',
      channelIcon: <IconBrandAmazon size="1.2rem" />,
      channelColor: 'blue',
      customer: 'John Smith',
      date: '2025-04-05',
      total: 234.56,
      items: 5,
      status: 'Processing',
      tags: ['Prime', 'International'],
    },
    {
      id: 'ORD-1283',
      channel: 'Shopify',
      channelIcon: <IconBuildingStore size="1.2rem" />,
      channelColor: 'green',
      customer: 'Jane Doe',
      date: '2025-04-05',
      total: 127.99,
      items: 2,
      status: 'Shipped',
      tags: ['Domestic', 'Express'],
    },
    {
      id: 'ORD-1282',
      channel: 'Walmart',
      channelIcon: <IconBrandWalmart size="1.2rem" />,
      channelColor: 'indigo',
      customer: 'Robert Johnson',
      date: '2025-04-04',
      total: 345.75,
      items: 3,
      status: 'Delivered',
      tags: ['Domestic'],
    },
    {
      id: 'ORD-1281',
      channel: 'Amazon',
      channelIcon: <IconBrandAmazon size="1.2rem" />,
      channelColor: 'blue',
      customer: 'Alice Williams',
      date: '2025-04-04',
      total: 49.99,
      items: 1,
      status: 'Processing',
      tags: ['Prime'],
    },
    {
      id: 'ORD-1280',
      channel: 'Shopify',
      channelIcon: <IconBuildingStore size="1.2rem" />,
      channelColor: 'green',
      customer: 'David Brown',
      date: '2025-04-03',
      total: 189.50,
      items: 4,
      status: 'Issue',
      tags: ['International', 'Express'],
    },
    {
      id: 'ORD-1279',
      channel: 'Walmart',
      channelIcon: <IconBrandWalmart size="1.2rem" />,
      channelColor: 'indigo',
      customer: 'Michael Davis',
      date: '2025-04-03',
      total: 78.25,
      items: 2,
      status: 'Shipped',
      tags: ['Domestic'],
    },
    {
      id: 'ORD-1278',
      channel: 'Amazon',
      channelIcon: <IconBrandAmazon size="1.2rem" />,
      channelColor: 'blue',
      customer: 'Sarah Miller',
      date: '2025-04-02',
      total: 312.99,
      items: 6,
      status: 'Delivered',
      tags: ['Prime', 'International'],
    },
  ];

  const renderStatus = (status: string) => {
    let color;
    switch (status) {
      case 'Processing':
        color = 'blue';
        break;
      case 'Shipped':
        color = 'orange';
        break;
      case 'Delivered':
        color = 'green';
        break;
      case 'Issue':
        color = 'red';
        break;
      default:
        color = 'gray';
    }
    
    return <Badge color={color}>{status}</Badge>;
  };

  const renderOrderChannel = (order: any) => (
    <Group spacing="xs">
      <Avatar size="sm" color={order.channelColor}>
        {order.channelIcon}
      </Avatar>
      <Text size="sm">{order.channel}</Text>
    </Group>
  );

  const rows = orders.map((order) => (
    <tr key={order.id}>
      <td>{order.id}</td>
      <td>{renderOrderChannel(order)}</td>
      <td>{order.customer}</td>
      <td>{order.date}</td>
      <td>${order.total.toFixed(2)}</td>
      <td>{order.items}</td>
      <td>{renderStatus(order.status)}</td>
      <td>
        <Group spacing={0} position="right">
          <Menu withArrow position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon>
                <IconDotsVertical size="1rem" />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item icon={<IconEye size="1rem" />}>View Details</Menu.Item>
              <Menu.Item icon={<IconFileInvoice size="1rem" />}>Generate Invoice</Menu.Item>
              <Menu.Item icon={<IconPrinter size="1rem" />}>Print Shipping Label</Menu.Item>
              <Menu.Divider />
              <Menu.Item icon={<IconRefresh size="1rem" />}>Sync with Channel</Menu.Item>
              <Menu.Item icon={<IconTrash size="1rem" />} color="red">Cancel Order</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </td>
    </tr>
  ));

  return (
    <Container size="xl" py="xl">
      <Stack spacing="xl">
        <div>
          <Title>Order Management</Title>
          <Text color="dimmed">Manage your customer orders across all sales channels</Text>
        </div>

        {/* Order metrics */}
        <MetricGroup
          metrics={orderMetrics}
        />

        {/* Order charts */}
        <Grid>
          <Grid.Col md={8}>
            <GSAPFadeIn duration="NORMAL" delay={0.1}>
              <PerformanceChart
                title="Order Trends"
                data={orderTrendsChartData}
                type="line"
                height={260}
              />
            </GSAPFadeIn>
          </Grid.Col>
          <Grid.Col md={4}>
            <GSAPFadeIn duration="NORMAL" delay={0.2}>
              <PerformanceChart
                title="Orders by Channel"
                data={orderChannelData}
                type="doughnut"
                height={260}
                allowTypeChange={false}
              />
            </GSAPFadeIn>
          </Grid.Col>
        </Grid>

        {/* Order management interface */}
        <Tabs defaultValue="all">
          <Tabs.List>
            <Tabs.Tab value="all" icon={<IconShoppingCart size="0.8rem" />}>All Orders</Tabs.Tab>
            <Tabs.Tab value="processing" icon={<IconPackage size="0.8rem" />}>Processing</Tabs.Tab>
            <Tabs.Tab value="shipping" icon={<IconTruck size="0.8rem" />}>Shipping</Tabs.Tab>
            <Tabs.Tab value="delivered" icon={<IconChecks size="0.8rem" />}>Delivered</Tabs.Tab>
            <Tabs.Tab value="issues" icon={<IconAlertCircle size="0.8rem" />}>Issues</Tabs.Tab>
          </Tabs.List>

          <Paper shadow="xs" p="md" mt="md">
            <Tabs.Panel value="all" pt="xs">
              <Card shadow="sm" p="lg" radius="md" withBorder>
                <Group position="apart" mb="xs">
                  <Group>
                    <TextInput
                      placeholder="Search orders..."
                      icon={<IconSearch size="1rem" />}
                      style={{ width: 300 }}
                    />
                    <Select
                      placeholder="All Channels"
                      data={[
                        { value: 'all', label: 'All Channels' },
                        { value: 'amazon', label: 'Amazon' },
                        { value: 'shopify', label: 'Shopify' },
                        { value: 'walmart', label: 'Walmart' },
                        { value: 'ebay', label: 'eBay' },
                      ]}
                      style={{ width: 200 }}
                    />
                    <ActionIcon variant="light" color="gray">
                      <IconAdjustments size="1.1rem" />
                    </ActionIcon>
                  </Group>
                  <Group>
                    <Button leftIcon={<IconRefresh size="1rem" />} size="sm">Sync All</Button>
                    <Button variant="outline" leftIcon={<IconFileInvoice size="1rem" />} size="sm">Batch Process</Button>
                  </Group>
                </Group>

                <ScrollArea>
                  <Table striped highlightOnHover sx={{ minWidth: 800 }} verticalSpacing="xs">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Channel</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Items</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <GSAPStagger
                        duration="NORMAL"
                        staggerDelay={0.03}
                        fromY={10}
                      >
                        {rows}
                      </GSAPStagger>
                    </tbody>
                  </Table>
                </ScrollArea>
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="processing" pt="xs">
              <Text>Processing orders will be displayed here</Text>
            </Tabs.Panel>

            <Tabs.Panel value="shipping" pt="xs">
              <Text>Shipping orders will be displayed here</Text>
            </Tabs.Panel>

            <Tabs.Panel value="delivered" pt="xs">
              <Text>Delivered orders will be displayed here</Text>
            </Tabs.Panel>

            <Tabs.Panel value="issues" pt="xs">
              <Text>Problem orders will be displayed here</Text>
            </Tabs.Panel>
          </Paper>
        </Tabs>
      </Stack>
    </Container>
  );
}