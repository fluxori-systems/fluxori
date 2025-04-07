import React from 'react';
import { 
  Container, 
  Title,
  Card,
  Text,
  Stack,
  Group,
  Button
} from '@/lib/ui';

/**
 * Settings page
 */
export default function SettingsPage() {
  return (
    <Container size="lg" py="xl">
      <Stack spacing="xl">
        <Title order={1}>Settings</Title>
        <Text color="dimmed">Manage your account settings and preferences.</Text>
        
        <Card shadow="sm" p="lg" withBorder>
          <Group position="apart" mb="md">
            <div>
              <Title order={3} size="h4">AI Credits</Title>
              <Text color="dimmed">Manage your AI credits and usage</Text>
            </div>
            <Button onClick={() => { window.location.href = '/dashboard/settings/ai-credits'; }}>
              Manage Credits
            </Button>
          </Group>
        </Card>
        
        <Card shadow="sm" p="lg" withBorder>
          <Group position="apart" mb="md">
            <div>
              <Title order={3} size="h4">User Profile</Title>
              <Text color="dimmed">Update your profile and personal information</Text>
            </div>
            <Button>Edit Profile</Button>
          </Group>
        </Card>
        
        <Card shadow="sm" p="lg" withBorder>
          <Group position="apart" mb="md">
            <div>
              <Title order={3} size="h4">Security</Title>
              <Text color="dimmed">Manage your password and security settings</Text>
            </div>
            <Button>Change Password</Button>
          </Group>
        </Card>
        
        <Card shadow="sm" p="lg" withBorder>
          <Group position="apart" mb="md">
            <div>
              <Title order={3} size="h4">Notifications</Title>
              <Text color="dimmed">Configure how you receive notifications</Text>
            </div>
            <Button>Configure</Button>
          </Group>
        </Card>
        
        <Card shadow="sm" p="lg" withBorder>
          <Group position="apart" mb="md">
            <div>
              <Title order={3} size="h4">API Keys</Title>
              <Text color="dimmed">Manage API keys for integrations</Text>
            </div>
            <Button>Manage Keys</Button>
          </Group>
        </Card>
      </Stack>
    </Container>
  );
}