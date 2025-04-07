import { Metadata } from 'next';
import { Container, Title, Card, Center, Badge, Divider, ActionIcon, Paper, Table, ScrollArea, Switch, TextInput } from '@mantine/core'
import { Stack, Text, Group, Grid, Button, SimpleGrid } from '@/components/ui';
import { 
  IconBrandAmazon, 
  IconBrandShopee, 
  IconBuildingStore, 
  IconBrandEbay, 
  IconBrandWalmart,
  IconPlus,
  IconRefresh,
  IconCheck,
  IconX,
  IconArrowRight,
  IconExternalLink,
  IconSettings,
  IconAlertCircle,
  IconArrowUp,
  IconArrowDown,
  IconSearch
} from '@tabler/icons-react';
import { MetricGroup, MetricData, PerformanceChart } from '@/components/data-visualization';
import { GSAPFadeIn, GSAPStagger } from '@/components/motion/gsap';

export const metadata: Metadata = {
  title: 'Marketplace Management | Fluxori',
  description: 'Manage your marketplace integrations and listings',
};

/**
 * Marketplace management page
 */
export default function MarketplacePage() {
  // Sample marketplace metrics
  const marketplaceMetrics: MetricData[] = [
    {
      title: 'Total Listings',
      value: '2,348',
      change: 4.2,
      icon: <IconBuildingStore />,
      color: 'blue',
    },
    {
      title: 'Connected Channels',
      value: '5',
      change: 25.0,
      icon: <IconPlus />,
      color: 'green',
      subtitle: '1 new this month',
    },
    {
      title: 'Sync Issues',
      value: '3',
      change: -40.0,
      icon: <IconAlertCircle />,
      color: 'red',
    },
    {
      title: 'Last Sync',
      value: '10m ago',
      change: 0,
      icon: <IconRefresh />,
      color: 'grape',
      subtitle: 'Auto-sync enabled',
    },
  ];

  // Chart data for marketplace performance
  const marketplacePerformanceData = {
    labels: ['Amazon', 'Shopify', 'eBay', 'Walmart', 'Direct'],
    datasets: [
      {
        label: 'Revenue',
        data: [45800, 25300, 15200, 10400, 5900],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  // Chart data for listing distribution
  const listingDistributionData = {
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

  // Marketplace channels
  const marketplaceChannels = [
    {
      name: 'Amazon',
      icon: <IconBrandAmazon size={50} />,
      color: '#232F3E',
      status: 'Connected',
      listings: 892,
      revenue: '$45,800',
      change: 15.3,
      lastSync: '10 min ago',
    },
    {
      name: 'Shopify',
      icon: <IconBuildingStore size={50} />,
      color: '#96BF47',
      status: 'Connected',
      listings: 587,
      revenue: '$25,300',
      change: 8.7,
      lastSync: '10 min ago',
    },
    {
      name: 'eBay',
      icon: <IconBrandEbay size={50} />,
      color: '#E53238',
      status: 'Connected',
      listings: 352,
      revenue: '$15,200',
      change: -2.4,
      lastSync: '1 hour ago',
    },
    {
      name: 'Walmart',
      icon: <IconBrandWalmart size={50} />,
      color: '#0071DC',
      status: 'Connected',
      listings: 282,
      revenue: '$10,400',
      change: 12.5,
      lastSync: '10 min ago',
    },
    {
      name: 'Custom Store',
      icon: <IconBuildingStore size={50} />,
      color: '#6941C6',
      status: 'Connected',
      listings: 235,
      revenue: '$5,900',
      change: 5.8,
      lastSync: '30 min ago',
    },
  ];

  // Sample price monitoring data
  const priceMonitoringItems = [
    {
      sku: 'APP-MAC-001',
      name: 'MacBook Pro 16"',
      yourPrice: 2399.99,
      competitorPrice: 2349.99,
      difference: -50.00,
      channel: 'Amazon',
      buyBoxStatus: 'Lost',
    },
    {
      sku: 'SMG-GAL-002',
      name: 'Samsung Galaxy S25',
      yourPrice: 999.99,
      competitorPrice: 1024.99,
      difference: 25.00,
      channel: 'Amazon',
      buyBoxStatus: 'Won',
    },
    {
      sku: 'SON-PS5-004',
      name: 'PlayStation 5 Console',
      yourPrice: 499.99,
      competitorPrice: 499.99,
      difference: 0,
      channel: 'Walmart',
      buyBoxStatus: 'Shared',
    },
    {
      sku: 'APP-WCH-005',
      name: 'Apple Watch Series 9',
      yourPrice: 399.99,
      competitorPrice: 379.99,
      difference: -20.00,
      channel: 'eBay',
      buyBoxStatus: 'Lost',
    },
    {
      sku: 'DYS-VAC-006',
      name: 'Dyson V12 Vacuum',
      yourPrice: 599.99,
      competitorPrice: 649.99,
      difference: 50.00,
      channel: 'Amazon',
      buyBoxStatus: 'Won',
    },
  ];

  // Render marketplace channel card
  const renderChannelCard = (channel: any) => (
    <Card shadow="sm" p="lg" radius="md" withBorder key={channel.name}>
      <Card.Section p="md" style={{ backgroundColor: channel.color, color: 'white' }}>
        <Group position="apart">
          <Group>
            {channel.icon}
            <div>
              <Title order={3} style={{ color: 'white' }}>{channel.name}</Title>
              <Badge color={channel.status === 'Connected' ? 'green' : 'red'}>
                {channel.status}
              </Badge>
            </div>
          </Group>
          <ActionIcon variant="transparent" color="white">
            <IconSettings size="1.5rem" />
          </ActionIcon>
        </Group>
      </Card.Section>

      <Group position="apart" mt="md" mb="xs">
        <Text weight={500}>Listings</Text>
        <Text>{channel.listings}</Text>
      </Group>

      <Group position="apart" mb="xs">
        <Text weight={500}>Revenue</Text>
        <Group spacing="xs">
          {channel.change > 0 ? (
            <IconArrowUp size="1rem" color="green" />
          ) : channel.change < 0 ? (
            <IconArrowDown size="1rem" color="red" />
          ) : null}
          <Text>{channel.revenue} <Text component="span" size="xs" color={channel.change > 0 ? "green" : channel.change < 0 ? "red" : "gray"}>
            {channel.change > 0 ? '+' : ''}{channel.change}%
          </Text></Text>
        </Group>
      </Group>

      <Group position="apart" mb="md">
        <Text weight={500}>Last Sync</Text>
        <Text>{channel.lastSync}</Text>
      </Group>

      <Divider my="sm" />

      <Group position="apart">
        <Button variant="light" compact leftIcon={<IconRefresh size="1rem" />}>
          Sync Now
        </Button>
        <Button variant="subtle" compact rightIcon={<IconArrowRight size="1rem" />}>
          View Details
        </Button>
      </Group>
    </Card>
  );

  // Render buy box status
  const renderBuyBoxStatus = (status: string) => {
    let color;
    let icon;
    switch (status) {
      case 'Won':
        color = 'green';
        icon = <IconCheck size="1rem" />;
        break;
      case 'Lost':
        color = 'red';
        icon = <IconX size="1rem" />;
        break;
      case 'Shared':
        color = 'orange';
        icon = null;
        break;
      default:
        color = 'gray';
        icon = null;
    }
    
    return (
      <Badge color={color} leftSection={icon}>
        {status}
      </Badge>
    );
  };

  // Render price monitoring rows
  const priceRows = priceMonitoringItems.map((item) => (
    <tr key={item.sku}>
      <td>{item.sku}</td>
      <td>
        <Group spacing="xs">
          <Text size="sm" weight={500}>{item.name}</Text>
          <ActionIcon size="xs" variant="transparent">
            <IconExternalLink size="0.8rem" />
          </ActionIcon>
        </Group>
      </td>
      <td>${item.yourPrice.toFixed(2)}</td>
      <td>${item.competitorPrice.toFixed(2)}</td>
      <td>
        <Text 
          color={item.difference > 0 ? 'green' : item.difference < 0 ? 'red' : 'gray'}
          weight={500}
        >
          {item.difference > 0 ? '+' : ''}{item.difference.toFixed(2)}
        </Text>
      </td>
      <td>{item.channel}</td>
      <td>{renderBuyBoxStatus(item.buyBoxStatus)}</td>
    </tr>
  ));

  return (
    <Container size="xl" py="xl">
      <Stack spacing="xl">
        <div>
          <Title>Marketplace Management</Title>
          <Text color="dimmed">Manage your sales channels and listings across all marketplaces</Text>
        </div>

        {/* Marketplace metrics */}
        <MetricGroup
          metrics={marketplaceMetrics}
          showTrends={false}
        />

        {/* Marketplace channels */}
        <Title order={2}>Connected Channels</Title>
        <GSAPStagger
          duration="NORMAL"
          staggerDelay={0.05}
          fromY={20}
        >
          <SimpleGrid cols={3} spacing="md" breakpoints={[{ maxWidth: 'md', cols: 2 }, { maxWidth: 'xs', cols: 1 }]}>
            {marketplaceChannels.map(channel => renderChannelCard(channel))}
            
            {/* Add new channel card */}
            <Card shadow="sm" p="lg" radius="md" withBorder sx={{ height: '100%' }}>
              <Center style={{ height: '100%' }}>
                <Stack align="center" spacing="md">
                  <ActionIcon size="xl" radius="xl" variant="light" color="blue">
                    <IconPlus size="1.5rem" />
                  </ActionIcon>
                  <Text weight={500}>Connect New Channel</Text>
                  <Text size="sm" color="dimmed" align="center">
                    Add a new marketplace or sales channel integration
                  </Text>
                  <Button leftIcon={<IconPlus size="1rem" />} mt="sm">
                    Add Channel
                  </Button>
                </Stack>
              </Center>
            </Card>
          </SimpleGrid>
        </GSAPStagger>

        {/* Analytics section */}
        <Grid mt="xl">
          <Grid.Col md={7}>
            <GSAPFadeIn duration="NORMAL" delay={0.1}>
              <PerformanceChart
                title="Marketplace Performance"
                data={marketplacePerformanceData}
                type="bar"
                height={300}
              />
            </GSAPFadeIn>
          </Grid.Col>
          <Grid.Col md={5}>
            <GSAPFadeIn duration="NORMAL" delay={0.2}>
              <PerformanceChart
                title="Listing Distribution by Channel"
                data={listingDistributionData}
                type="doughnut"
                height={300}
                allowTypeChange={false}
              />
            </GSAPFadeIn>
          </Grid.Col>
        </Grid>

        {/* Price monitoring */}
        <Title order={2} mt="xl">Price Monitoring</Title>
        <Paper shadow="xs" p="md" withBorder>
          <Group position="apart" mb="md">
            <Group>
              <TextInput
                placeholder="Search products..."
                icon={<IconSearch size="1rem" />}
                style={{ width: 250 }}
              />
              <Text color="dimmed" size="sm">
                Showing products with price discrepancies
              </Text>
            </Group>
            <Group>
              <Text size="sm">Auto-repricing</Text>
              <Switch size="md" />
            </Group>
          </Group>
          
          <ScrollArea>
            <Table striped highlightOnHover sx={{ minWidth: 800 }} verticalSpacing="xs">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Your Price</th>
                  <th>Competitor Price</th>
                  <th>Difference</th>
                  <th>Channel</th>
                  <th>Buy Box</th>
                </tr>
              </thead>
              <tbody>
                <GSAPStagger
                  duration="NORMAL"
                  staggerDelay={0.03}
                  fromY={10}
                >
                  {priceRows}
                </GSAPStagger>
              </tbody>
            </Table>
          </ScrollArea>

          <Group position="center" mt="lg">
            <Button variant="outline" leftIcon={<IconRefresh size="1rem" />}>
              Refresh Prices
            </Button>
            <Button color="blue">
              Apply Repricing Rules
            </Button>
          </Group>
        </Paper>
      </Stack>
    </Container>
  );
}