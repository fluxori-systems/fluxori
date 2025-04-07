import React from 'react';
import { 
  Container, 
  Grid, 
  Card, 
  Text,
  Title,
  Stack,
  Group
} from '@/lib/ui';

/**
 * Analytics dashboard page
 */
export default function AnalyticsPage() {
  // Sample data - in a real app, this would come from the API
  const dailyUsage = [
    { date: '2023-03-01', totalCredits: 120, totalRequests: 45 },
    { date: '2023-03-02', totalCredits: 135, totalRequests: 52 },
    { date: '2023-03-03', totalCredits: 128, totalRequests: 48 },
    { date: '2023-03-04', totalCredits: 142, totalRequests: 55 },
    { date: '2023-03-05', totalCredits: 156, totalRequests: 62 },
    { date: '2023-03-06', totalCredits: 149, totalRequests: 58 },
    { date: '2023-03-07', totalCredits: 165, totalRequests: 65 },
  ];

  const modelUsage = [
    { model: 'Claude 3 Opus', totalCredits: 420, totalRequests: 84, percentageOfTotal: 42 },
    { model: 'Claude 3 Sonnet', totalCredits: 350, totalRequests: 140, percentageOfTotal: 35 },
    { model: 'Claude 3 Haiku', totalCredits: 230, totalRequests: 230, percentageOfTotal: 23 },
  ];

  return (
    <Container size="lg" py="xl">
      <Stack spacing="xl">
        <Title order={1}>Analytics Dashboard</Title>
        <Text color="dimmed">View your AI usage and metrics.</Text>
        
        <Grid>
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Card shadow="sm" p="lg" withBorder>
              <Title order={3} size="h4" mb="md">Total Credits</Title>
              <Text weight={700} size="xl">995</Text>
              <Text color="dimmed" size="sm">Last 7 days</Text>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Card shadow="sm" p="lg" withBorder>
              <Title order={3} size="h4" mb="md">Total Requests</Title>
              <Text weight={700} size="xl">385</Text>
              <Text color="dimmed" size="sm">Last 7 days</Text>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Card shadow="sm" p="lg" withBorder>
              <Title order={3} size="h4" mb="md">Avg Cost per Request</Title>
              <Text weight={700} size="xl">2.58</Text>
              <Text color="dimmed" size="sm">Credits per request</Text>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Card shadow="sm" p="lg" withBorder>
              <Title order={3} size="h4" mb="md">Remaining Credits</Title>
              <Text weight={700} size="xl">4,005</Text>
              <Text color="dimmed" size="sm">Credits available</Text>
            </Card>
          </Grid.Col>
        </Grid>
        
        <Grid>
          <Grid.Col md={8}>
            <Card shadow="sm" p="lg" withBorder>
              <Title order={3} size="h4" mb="xl">Daily Usage</Title>
              
              <Stack spacing="sm">
                {dailyUsage.map((day) => (
                  <Group key={day.date} position="apart">
                    <Text>{new Date(day.date).toLocaleDateString()}</Text>
                    <Group spacing="xl">
                      <Text weight={500}>{day.totalCredits} credits</Text>
                      <Text color="dimmed">{day.totalRequests} requests</Text>
                    </Group>
                  </Group>
                ))}
              </Stack>
            </Card>
          </Grid.Col>
          
          <Grid.Col md={4}>
            <Card shadow="sm" p="lg" withBorder h="100%">
              <Title order={3} size="h4" mb="xl">Model Usage</Title>
              
              <Stack spacing="md">
                {modelUsage.map((model) => (
                  <div key={model.model}>
                    <Group position="apart" mb="xs">
                      <Text weight={500}>{model.model}</Text>
                      <Text size="sm">{model.percentageOfTotal}%</Text>
                    </Group>
                    <Text size="sm" color="dimmed" mb="md">
                      {model.totalCredits} credits ({model.totalRequests} requests)
                    </Text>
                  </div>
                ))}
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}