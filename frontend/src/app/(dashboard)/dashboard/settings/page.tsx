import React from "react";

import { Container, Title, Card, Text, Stack, Group, Button } from "@/lib/ui";

/**
 * Settings page
 */
export default function SettingsPage() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Title order={1}>Settings</Title>
        <Text c="dimmed">Manage your account settings and preferences.</Text>

        <Card shadow="sm" p="lg" withBorder>
          <Group justify="apart" mb="md">
            <div>
              <Title order={3} size="h4">
                AI Credits
              </Title>
              <Text c="dimmed">Manage your AI credits and usage</Text>
            </div>
            <Button
              onClick={() => {
                window.location.href = "/dashboard/settings/ai-credits";
              }}
            >
              Manage Credits
            </Button>
          </Group>
        </Card>

        <Card shadow="sm" p="lg" withBorder>
          <Group justify="apart" mb="md">
            <div>
              <Title order={3} size="h4">
                User Profile
              </Title>
              <Text c="dimmed">
                Update your profile and personal information
              </Text>
            </div>
            <Button>Edit Profile</Button>
          </Group>
        </Card>

        <Card shadow="sm" p="lg" withBorder>
          <Group justify="apart" mb="md">
            <div>
              <Title order={3} size="h4">
                Security
              </Title>
              <Text c="dimmed">Manage your password and security settings</Text>
            </div>
            <Button>Change Password</Button>
          </Group>
        </Card>

        <Card shadow="sm" p="lg" withBorder>
          <Group justify="apart" mb="md">
            <div>
              <Title order={3} size="h4">
                Notifications
              </Title>
              <Text c="dimmed">Configure how you receive notifications</Text>
            </div>
            <Button>Configure</Button>
          </Group>
        </Card>

        <Card shadow="sm" p="lg" withBorder>
          <Group justify="apart" mb="md">
            <div>
              <Title order={3} size="h4">
                API Keys
              </Title>
              <Text c="dimmed">Manage API keys for integrations</Text>
            </div>
            <Button>Manage Keys</Button>
          </Group>
        </Card>
      </Stack>
    </Container>
  );
}
