import React from 'react';
import { 
  Container, 
  Grid, 
  Card, 
  Text,
  Title,
  Stack
} from '@/lib/ui';

/**
 * Main dashboard page
 */
export default function DashboardPage() {
  return (
    <Container size="lg" py="xl">
      <Stack spacing="xl">
        <Title order={1}>Dashboard</Title>
        <Text>Welcome to your Fluxori dashboard.</Text>
        
        <Grid>
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Card shadow="sm" p="lg" withBorder>
              <Title order={3} size="h4" mb="md">Inventory</Title>
              <Text weight={700} size="xl">1,234</Text>
              <Text color="dimmed" size="sm">Items in stock</Text>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Card shadow="sm" p="lg" withBorder>
              <Title order={3} size="h4" mb="md">Orders</Title>
              <Text weight={700} size="xl">56</Text>
              <Text color="dimmed" size="sm">Pending fulfillment</Text>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Card shadow="sm" p="lg" withBorder>
              <Title order={3} size="h4" mb="md">Revenue</Title>
              <Text weight={700} size="xl">$12,345</Text>
              <Text color="dimmed" size="sm">Last 30 days</Text>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Card shadow="sm" p="lg" withBorder>
              <Title order={3} size="h4" mb="md">Marketplaces</Title>
              <Text weight={700} size="xl">3</Text>
              <Text color="dimmed" size="sm">Active channels</Text>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}