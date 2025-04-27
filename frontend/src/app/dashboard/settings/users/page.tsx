"use client";

import { useState } from "react";

import {
  Container,
  Title,
  Text,
  Card,
  Button,
  Group,
  Stack,
  Divider,
  Alert,
  Badge,
} from "@mantine/core";

import { IconAlertCircle } from "@tabler/icons-react";

/**
 * User Management Page
 * Simplified version to fix TypeScript errors
 */
export default function UsersPage() {
  const [loading, setLoading] = useState(false);

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2}>User Management</Title>
          <Text c="dimmed">
            Manage organization members, roles, and permissions
          </Text>
        </div>

        <Card withBorder shadow="xs" padding="lg">
          <Stack gap="md">
            <Alert c="blue" icon={<IconAlertCircle size={16} />}>
              <Text fw={500} mb="xs">
                Role Definitions
              </Text>
              <Text size="sm">
                <strong>Admin:</strong> Full access to all features and settings
                including user management.
              </Text>
              <Text size="sm">
                <strong>Manager:</strong> Can manage inventory, orders, and
                operational tasks, but cannot manage users or organization
                settings.
              </Text>
              <Text size="sm">
                <strong>User:</strong> Standard access to day-to-day operational
                features.
              </Text>
            </Alert>

            <Divider />

            <Title order={4}>Permission Matrix</Title>

            <Group>
              <Badge c="red">Admin</Badge>
              <Badge c="blue">Manager</Badge>
              <Badge c="green">User</Badge>
            </Group>

            <Button loading={loading} onClick={() => setLoading(!loading)}>
              Refresh User List
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
