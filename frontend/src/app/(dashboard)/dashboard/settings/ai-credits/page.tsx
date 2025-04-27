import React from "react";

import { Container, Title, Card, Text, Stack, Group, Button } from "@/lib/ui";

/**
 * AI Credits settings page
 */
export default function AICreditsPage() {
  // Sample credit data - in a real app, this would come from the API
  const credits = {
    available: 5000,
    used: 995,
    limit: 10000,
    resetDate: new Date("2023-04-01"),
  };

  const handlePurchaseCredits = () => {
    // This would integrate with the payment system in a real app
    alert("Credit purchase functionality would be implemented here");
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Title order={1}>AI Credits</Title>
        <Text c="dimmed">Manage your AI credit balance and usage.</Text>

        <Card shadow="sm" p="lg" withBorder>
          <Title order={3} size="h4" mb="xl">
            Current Credits
          </Title>

          <Stack gap="md">
            <Group justify="apart">
              <Text>Available Credits:</Text>
              <Text fw={700}>{credits.available}</Text>
            </Group>

            <Group justify="apart">
              <Text>Used This Month:</Text>
              <Text fw={700}>{credits.used}</Text>
            </Group>

            <Group justify="apart">
              <Text>Monthly Limit:</Text>
              <Text fw={700}>{credits.limit}</Text>
            </Group>

            <Group justify="apart">
              <Text>Reset Date:</Text>
              <Text fw={700}>{credits.resetDate.toLocaleDateString()}</Text>
            </Group>
          </Stack>
        </Card>

        <Card shadow="sm" p="lg" withBorder>
          <Title order={3} size="h4" mb="xl">
            Purchase Credits
          </Title>

          <Text mb="lg">
            Need more AI credits? Purchase additional credits to increase your
            monthly limit.
          </Text>

          <Group justify="apart">
            <div>
              <Text fw={700}>Standard Package</Text>
              <Text c="dimmed" size="sm">
                5,000 credits for $50
              </Text>
            </div>
            <Button onClick={handlePurchaseCredits}>Purchase</Button>
          </Group>

          <Group justify="apart" mt="xl">
            <div>
              <Text fw={700}>Premium Package</Text>
              <Text c="dimmed" size="sm">
                12,000 credits for $100
              </Text>
            </div>
            <Button onClick={handlePurchaseCredits}>Purchase</Button>
          </Group>

          <Group justify="apart" mt="xl">
            <div>
              <Text fw={700}>Enterprise Package</Text>
              <Text c="dimmed" size="sm">
                30,000 credits for $200
              </Text>
            </div>
            <Button onClick={handlePurchaseCredits}>Purchase</Button>
          </Group>
        </Card>
      </Stack>
    </Container>
  );
}
