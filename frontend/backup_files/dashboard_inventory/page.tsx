import { Metadata } from 'next';
import { Container, Title, Card, TextInput, ActionIcon, Badge, Table, Select, ScrollArea, Tooltip, Paper } from '@mantine/core'
import { Stack, Text, Group, Button, Menu, Grid, Tabs } from '@/components/ui';
import { 
  IconSearch, 
  IconAdjustments, 
  IconPlus, 
  IconFileExport, 
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconInfoCircle,
  IconBasket,
  IconBuildingWarehouse,
  IconPackage,
  IconPalette,
  IconDatabase,
  IconBuildingFactory2
} from '@tabler/icons-react';
import { MetricGroup, MetricData, PerformanceChart } from '@/components/data-visualization';
import { GSAPStagger, GSAPFadeIn } from '@/components/motion/gsap';

export const metadata: Metadata = {
  title: 'Inventory Management | Fluxori',
  description: 'Manage your inventory across multiple marketplaces',
};

/**
 * Inventory management page
 */
export default function InventoryPage() {
  // Sample inventory metrics
  const inventoryMetrics: MetricData[] = [
    {
      title: 'Total Products',
      value: '4,235',
      change: 2.1,
      icon: <IconPackage />,
      color: 'blue',
    },
    {
      title: 'Low Stock',
      value: '12',
      change: -5.2,
      icon: <IconInfoCircle />,
      color: 'orange',
    },
    {
      title: 'Out of Stock',
      value: '3',
      change: -15.3,
      icon: <IconBasket />,
      color: 'red',
    },
    {
      title: 'Warehouses',
      value: '3',
      change: 0,
      icon: <IconBuildingWarehouse />,
      color: 'teal',
    },
  ];

  // Sample inventory data
  const inventoryItems = [
    {
      id: 'P001',
      sku: 'APP-MAC-001',
      name: 'MacBook Pro 16"',
      category: 'Electronics',
      stock: 23,
      location: 'Warehouse A',
      price: 2399.99,
      status: 'In Stock',
      tags: ['Apple', 'Computer', 'Premium'],
      lastUpdated: '2025-04-05',
    },
    {
      id: 'P002',
      sku: 'SMG-GAL-002',
      name: 'Samsung Galaxy S25',
      category: 'Electronics',
      stock: 45,
      location: 'Warehouse B',
      price: 999.99,
      status: 'In Stock',
      tags: ['Samsung', 'Phone', 'Premium'],
      lastUpdated: '2025-04-04',
    },
    {
      id: 'P003',
      sku: 'NIK-AJ1-003',
      name: 'Nike Air Jordan 1',
      category: 'Footwear',
      stock: 8,
      location: 'Warehouse A',
      price: 199.99,
      status: 'Low Stock',
      tags: ['Nike', 'Shoes', 'Athletic'],
      lastUpdated: '2025-04-03',
    },
    {
      id: 'P004',
      sku: 'SON-PS5-004',
      name: 'PlayStation 5 Console',
      category: 'Electronics',
      stock: 12,
      location: 'Warehouse C',
      price: 499.99,
      status: 'In Stock',
      tags: ['Sony', 'Gaming', 'Console'],
      lastUpdated: '2025-04-05',
    },
    {
      id: 'P005',
      sku: 'APP-WCH-005',
      name: 'Apple Watch Series 9',
      category: 'Electronics',
      stock: 0,
      location: 'Warehouse A',
      price: 399.99,
      status: 'Out of Stock',
      tags: ['Apple', 'Wearable', 'Premium'],
      lastUpdated: '2025-04-02',
    },
    {
      id: 'P006',
      sku: 'DYS-VAC-006',
      name: 'Dyson V12 Vacuum',
      category: 'Home Appliances',
      stock: 5,
      location: 'Warehouse B',
      price: 599.99,
      status: 'Low Stock',
      tags: ['Dyson', 'Vacuum', 'Premium'],
      lastUpdated: '2025-04-01',
    },
    {
      id: 'P007',
      sku: 'LGO-BLK-007',
      name: 'LEGO Star Wars Set',
      category: 'Toys',
      stock: 32,
      location: 'Warehouse C',
      price: 159.99,
      status: 'In Stock',
      tags: ['LEGO', 'Star Wars', 'Toys'],
      lastUpdated: '2025-04-03',
    },
  ];

  // Chart data for inventory levels
  const inventoryChartData = {
    labels: ['Warehouse A', 'Warehouse B', 'Warehouse C'],
    datasets: [
      {
        label: 'Total Items',
        data: [1253, 1845, 1137],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Low Stock',
        data: [5, 4, 3],
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
      },
      {
        label: 'Out of Stock',
        data: [1, 1, 1],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const stockTrendChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Inventory Levels',
        data: [3200, 3450, 3800, 4100, 4235, 4250],
        borderColor: 'rgba(53, 162, 235, 1)',
        backgroundColor: 'rgba(53, 162, 235, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const renderStatus = (status: string) => {
    let color;
    switch (status) {
      case 'In Stock':
        color = 'green';
        break;
      case 'Low Stock':
        color = 'orange';
        break;
      case 'Out of Stock':
        color = 'red';
        break;
      default:
        color = 'gray';
    }
    
    return <Badge color={color}>{status}</Badge>;
  };

  const rows = inventoryItems.map((item) => (
    <tr key={item.id}>
      <td>{item.sku}</td>
      <td>
        <Text truncate size="sm" weight={500}>
          {item.name}
        </Text>
      </td>
      <td>{item.category}</td>
      <td>{item.stock}</td>
      <td>{item.location}</td>
      <td>${item.price.toFixed(2)}</td>
      <td>{renderStatus(item.status)}</td>
      <td>
        <Group spacing={0} position="right">
          <Menu withArrow position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon>
                <IconDotsVertical size="1rem" />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item icon={<IconEdit size="1rem" />}>Edit</Menu.Item>
              <Menu.Item icon={<IconInfoCircle size="1rem" />}>View Details</Menu.Item>
              <Menu.Item icon={<IconPackage size="1rem" />}>Manage Stock</Menu.Item>
              <Menu.Divider />
              <Menu.Item icon={<IconTrash size="1rem" />} color="red">Delete</Menu.Item>
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
          <Title>Inventory Management</Title>
          <Text color="dimmed">Manage your products across all warehouses and marketplaces</Text>
        </div>

        {/* Inventory metrics */}
        <MetricGroup
          metrics={inventoryMetrics}
          showTrends={false}
        />

        {/* Inventory charts */}
        <Grid>
          <Grid.Col md={6}>
            <GSAPFadeIn duration="NORMAL" delay={0.1}>
              <PerformanceChart
                title="Inventory by Warehouse"
                data={inventoryChartData}
                type="bar"
                height={260}
              />
            </GSAPFadeIn>
          </Grid.Col>
          <Grid.Col md={6}>
            <GSAPFadeIn duration="NORMAL" delay={0.2}>
              <PerformanceChart
                title="Inventory Level Trends"
                data={stockTrendChartData}
                type="line"
                height={260}
              />
            </GSAPFadeIn>
          </Grid.Col>
        </Grid>

        {/* Inventory management interface */}
        <Tabs defaultValue="products">
          <Tabs.List>
            <Tabs.Tab value="products" icon={<IconPackage size="0.8rem" />}>Products</Tabs.Tab>
            <Tabs.Tab value="warehouses" icon={<IconBuildingWarehouse size="0.8rem" />}>Warehouses</Tabs.Tab>
            <Tabs.Tab value="suppliers" icon={<IconBuildingFactory2 size="0.8rem" />}>Suppliers</Tabs.Tab>
            <Tabs.Tab value="categories" icon={<IconPalette size="0.8rem" />}>Categories</Tabs.Tab>
            <Tabs.Tab value="imports" icon={<IconDatabase size="0.8rem" />}>Import/Export</Tabs.Tab>
          </Tabs.List>

          <Paper shadow="xs" p="md" mt="md">
            <Tabs.Panel value="products" pt="xs">
              <Card shadow="sm" p="lg" radius="md" withBorder>
                <Group position="apart" mb="xs">
                  <Group>
                    <TextInput
                      placeholder="Search products..."
                      icon={<IconSearch size="1rem" />}
                      style={{ width: 300 }}
                    />
                    <Select
                      placeholder="All Categories"
                      data={[
                        { value: 'all', label: 'All Categories' },
                        { value: 'electronics', label: 'Electronics' },
                        { value: 'footwear', label: 'Footwear' },
                        { value: 'home-appliances', label: 'Home Appliances' },
                        { value: 'toys', label: 'Toys' },
                      ]}
                      style={{ width: 200 }}
                    />
                    <ActionIcon variant="light" color="gray">
                      <IconAdjustments size="1.1rem" />
                    </ActionIcon>
                  </Group>
                  <Group>
                    <Button leftIcon={<IconPlus size="1rem" />} size="sm">Add Product</Button>
                    <Button variant="outline" leftIcon={<IconFileExport size="1rem" />} size="sm">Export</Button>
                  </Group>
                </Group>

                <ScrollArea>
                  <Table striped highlightOnHover sx={{ minWidth: 800 }} verticalSpacing="xs">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Stock</th>
                        <th>Location</th>
                        <th>Price</th>
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

            <Tabs.Panel value="warehouses" pt="xs">
              <Text>Warehouse management functionality to be implemented</Text>
            </Tabs.Panel>

            <Tabs.Panel value="suppliers" pt="xs">
              <Text>Supplier management functionality to be implemented</Text>
            </Tabs.Panel>

            <Tabs.Panel value="categories" pt="xs">
              <Text>Category management functionality to be implemented</Text>
            </Tabs.Panel>

            <Tabs.Panel value="imports" pt="xs">
              <Text>Import/Export functionality to be implemented</Text>
            </Tabs.Panel>
          </Paper>
        </Tabs>
      </Stack>
    </Container>
  );
}