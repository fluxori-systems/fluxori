import { Metadata } from 'next';
import { Container, Title, Paper, TextInput, Select, Switch, Divider, Avatar, Box, Card, Badge, ActionIcon, PasswordInput } from '@mantine/core'
import { Stack, Text, Tabs, Button, Group, SimpleGrid } from '@/components/ui';
import { 
  IconUser, 
  IconBuildingStore, 
  IconBell, 
  IconKey, 
  IconWallet,
  IconUsers,
  IconUserPlus,
  IconTrash,
  IconPencil,
  IconBrandShopify,
  IconBrandAmazon,
  IconBrandWalmart,
  IconBrandEbay,
  IconSettings,
  IconPlus,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { GSAPFadeIn } from '@/components/motion/gsap';

export const metadata: Metadata = {
  title: 'Settings | Fluxori',
  description: 'Manage your Fluxori account settings',
};

/**
 * Settings page for managing account, organization, and integrations
 */
export default function SettingsPage() {
  // Sample team members data
  const teamMembers = [
    {
      id: 1,
      name: 'Tarquin Stapa',
      email: 'admin@fluxori.com',
      role: 'Admin',
      avatar: 'TS',
      lastActive: '10 minutes ago',
    },
    {
      id: 2,
      name: 'John Smith',
      email: 'john@example.com',
      role: 'Manager',
      avatar: 'JS',
      lastActive: '2 hours ago',
    },
    {
      id: 3,
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      role: 'User',
      avatar: 'SJ',
      lastActive: '1 day ago',
    },
  ];

  // Sample integration data
  const integrations = [
    {
      id: 'amazon',
      name: 'Amazon',
      icon: <IconBrandAmazon size="1.5rem" />,
      color: '#232F3E',
      status: 'Connected',
      apiKey: 'AMZN-API-*******',
      lastSync: '10 minutes ago',
    },
    {
      id: 'shopify',
      name: 'Shopify',
      icon: <IconBrandShopify size="1.5rem" />,
      color: '#96BF47',
      status: 'Connected',
      apiKey: 'SHOP-API-*******',
      lastSync: '10 minutes ago',
    },
    {
      id: 'ebay',
      name: 'eBay',
      icon: <IconBrandEbay size="1.5rem" />,
      color: '#E53238',
      status: 'Connected',
      apiKey: 'EBAY-API-*******',
      lastSync: '1 hour ago',
    },
    {
      id: 'walmart',
      name: 'Walmart',
      icon: <IconBrandWalmart size="1.5rem" />,
      color: '#0071DC',
      status: 'Connected',
      apiKey: 'WLMT-API-*******',
      lastSync: '10 minutes ago',
    },
  ];

  // Render team member card
  const renderTeamMember = (member: any) => (
    <Card shadow="sm" p="lg" radius="md" withBorder key={member.id}>
      <Group position="apart">
        <Group>
          <Avatar radius="xl" size="md" color="blue">{member.avatar}</Avatar>
          <div>
            <Text weight={500}>{member.name}</Text>
            <Text size="xs" color="dimmed">{member.email}</Text>
          </div>
        </Group>
        <Badge>{member.role}</Badge>
      </Group>
      
      <Group position="apart" mt="md">
        <Text size="xs" color="dimmed">Last active: {member.lastActive}</Text>
        <Group spacing="xs">
          <ActionIcon size="sm" color="blue" variant="light">
            <IconPencil size="1rem" />
          </ActionIcon>
          {member.id !== 1 && (
            <ActionIcon size="sm" color="red" variant="light">
              <IconTrash size="1rem" />
            </ActionIcon>
          )}
        </Group>
      </Group>
    </Card>
  );

  // Render integration card
  const renderIntegration = (integration: any) => (
    <Card shadow="sm" p="lg" radius="md" withBorder key={integration.id}>
      <Group position="apart">
        <Group>
          <Avatar radius="sm" size="md" color={integration.status === 'Connected' ? 'green' : 'gray'}>
            {integration.icon}
          </Avatar>
          <div>
            <Text weight={500}>{integration.name}</Text>
            <Text size="xs" color="dimmed">
              {integration.status === 'Connected' ? 'Connected' : 'Not Connected'}
            </Text>
          </div>
        </Group>
        {integration.status === 'Connected' ? (
          <ActionIcon color="green" variant="light">
            <IconCheck size="1.2rem" />
          </ActionIcon>
        ) : (
          <ActionIcon color="red" variant="light">
            <IconX size="1.2rem" />
          </ActionIcon>
        )}
      </Group>
      
      {integration.status === 'Connected' && (
        <>
          <Group position="apart" mt="md">
            <Text size="sm" weight={500}>API Key</Text>
            <Text size="sm">{integration.apiKey}</Text>
          </Group>
          
          <Group position="apart" mt="xs">
            <Text size="sm" weight={500}>Last Synced</Text>
            <Text size="sm">{integration.lastSync}</Text>
          </Group>
        </>
      )}
      
      <Divider my="md" />
      
      <Group position="right">
        <Button 
          variant={integration.status === 'Connected' ? 'outline' : 'filled'} 
          color={integration.status === 'Connected' ? 'red' : 'blue'}
          size="sm"
        >
          {integration.status === 'Connected' ? 'Disconnect' : 'Connect'}
        </Button>
        {integration.status === 'Connected' && (
          <Button variant="light" size="sm">
            Settings
          </Button>
        )}
      </Group>
    </Card>
  );

  return (
    <Container size="xl" py="xl">
      <Stack spacing="xl">
        <div>
          <Title>Settings</Title>
          <Text color="dimmed">Manage your account, organization, and integration settings</Text>
        </div>

        <Tabs defaultValue="profile">
          <Tabs.List>
            <Tabs.Tab value="profile" icon={<IconUser size="0.8rem" />}>
              Profile
            </Tabs.Tab>
            <Tabs.Tab value="organization" icon={<IconBuildingStore size="0.8rem" />}>
              Organization
            </Tabs.Tab>
            <Tabs.Tab value="team" icon={<IconUsers size="0.8rem" />}>
              Team Members
            </Tabs.Tab>
            <Tabs.Tab value="integrations" icon={<IconSettings size="0.8rem" />}>
              Integrations
            </Tabs.Tab>
            <Tabs.Tab value="notifications" icon={<IconBell size="0.8rem" />}>
              Notifications
            </Tabs.Tab>
            <Tabs.Tab value="security" icon={<IconKey size="0.8rem" />}>
              Security
            </Tabs.Tab>
            <Tabs.Tab value="billing" icon={<IconWallet size="0.8rem" />}>
              Billing
            </Tabs.Tab>
          </Tabs.List>

          <Paper p="md" mt="md">
            <GSAPFadeIn duration="NORMAL">
              <Tabs.Panel value="profile">
                <Stack spacing="lg">
                  <Title order={3}>Profile Settings</Title>
                  <Text color="dimmed">Update your personal information and preferences</Text>

                  <Paper p="md" withBorder>
                    <Group position="apart" mb="lg">
                      <div>
                        <Text weight={500} size="lg">Personal Information</Text>
                        <Text size="sm" color="dimmed">Update your basic profile details</Text>
                      </div>
                      <Avatar radius="xl" size="xl" color="blue">TS</Avatar>
                    </Group>

                    <Group grow mb="md">
                      <TextInput
                        label="First Name"
                        placeholder="Your first name"
                        defaultValue="Tarquin"
                      />
                      <TextInput
                        label="Last Name"
                        placeholder="Your last name"
                        defaultValue="Stapa"
                      />
                    </Group>

                    <TextInput
                      label="Email"
                      placeholder="Your email"
                      defaultValue="admin@fluxori.com"
                      mb="md"
                    />

                    <Group position="apart" mb="md">
                      <Select
                        label="Time Zone"
                        placeholder="Select your time zone"
                        defaultValue="utc"
                        data={[
                          { value: 'utc', label: 'UTC (GMT+0)' },
                          { value: 'est', label: 'Eastern Time (GMT-5)' },
                          { value: 'pst', label: 'Pacific Time (GMT-8)' },
                          { value: 'cet', label: 'Central European Time (GMT+1)' },
                        ]}
                        style={{ width: '48%' }}
                      />
                      <Select
                        label="Date Format"
                        placeholder="Select date format"
                        defaultValue="mdy"
                        data={[
                          { value: 'mdy', label: 'MM/DD/YYYY' },
                          { value: 'dmy', label: 'DD/MM/YYYY' },
                          { value: 'ymd', label: 'YYYY-MM-DD' },
                        ]}
                        style={{ width: '48%' }}
                      />
                    </Group>

                    <Button mt="lg">Save Changes</Button>
                  </Paper>

                  <Paper p="md" withBorder>
                    <Text weight={500} size="lg" mb="md">Preferences</Text>

                    <Stack spacing="md">
                      <Group position="apart">
                        <div>
                          <Text>Dark Mode</Text>
                          <Text size="xs" color="dimmed">Enable dark mode for the interface</Text>
                        </div>
                        <Switch defaultChecked />
                      </Group>

                      <Divider />

                      <Group position="apart">
                        <div>
                          <Text>Email Notifications</Text>
                          <Text size="xs" color="dimmed">Receive email notifications</Text>
                        </div>
                        <Switch defaultChecked />
                      </Group>
                    </Stack>
                  </Paper>
                </Stack>
              </Tabs.Panel>
            </GSAPFadeIn>

            <GSAPFadeIn duration="NORMAL">
              <Tabs.Panel value="organization">
                <Stack spacing="lg">
                  <Title order={3}>Organization Settings</Title>
                  <Text color="dimmed">Manage your organization details and preferences</Text>

                  <Paper p="md" withBorder>
                    <Text weight={500} size="lg" mb="md">Organization Information</Text>

                    <TextInput
                      label="Organization Name"
                      placeholder="Company name"
                      defaultValue="Fluxori Inc."
                      mb="md"
                    />

                    <Group grow mb="md">
                      <TextInput
                        label="Address"
                        placeholder="Street address"
                        defaultValue="123 Commerce St"
                      />
                      <TextInput
                        label="City"
                        placeholder="City"
                        defaultValue="San Francisco"
                      />
                    </Group>

                    <Group grow mb="md">
                      <TextInput
                        label="State/Province"
                        placeholder="State/Province"
                        defaultValue="California"
                      />
                      <TextInput
                        label="Postal Code"
                        placeholder="Postal Code"
                        defaultValue="94105"
                      />
                      <Select
                        label="Country"
                        placeholder="Select country"
                        defaultValue="us"
                        data={[
                          { value: 'us', label: 'United States' },
                          { value: 'ca', label: 'Canada' },
                          { value: 'uk', label: 'United Kingdom' },
                          { value: 'au', label: 'Australia' },
                        ]}
                      />
                    </Group>

                    <Group grow mb="md">
                      <TextInput
                        label="Phone"
                        placeholder="Phone number"
                        defaultValue="+1 (415) 555-1234"
                      />
                      <TextInput
                        label="Website"
                        placeholder="Website URL"
                        defaultValue="https://fluxori.com"
                      />
                    </Group>

                    <Button mt="lg">Save Changes</Button>
                  </Paper>

                  <Paper p="md" withBorder>
                    <Text weight={500} size="lg" mb="md">Business Information</Text>

                    <TextInput
                      label="Tax ID/VAT"
                      placeholder="Tax identification number"
                      defaultValue="US123456789"
                      mb="md"
                    />

                    <Group grow mb="md">
                      <Select
                        label="Business Type"
                        placeholder="Select business type"
                        defaultValue="corp"
                        data={[
                          { value: 'sole', label: 'Sole Proprietorship' },
                          { value: 'llc', label: 'LLC' },
                          { value: 'corp', label: 'Corporation' },
                          { value: 'partner', label: 'Partnership' },
                        ]}
                      />
                      <Select
                        label="Industry"
                        placeholder="Select industry"
                        defaultValue="ecommerce"
                        data={[
                          { value: 'ecommerce', label: 'E-commerce' },
                          { value: 'retail', label: 'Retail' },
                          { value: 'wholesale', label: 'Wholesale' },
                          { value: 'manufacturing', label: 'Manufacturing' },
                        ]}
                      />
                    </Group>

                    <Button mt="lg">Save Changes</Button>
                  </Paper>
                </Stack>
              </Tabs.Panel>
            </GSAPFadeIn>

            <GSAPFadeIn duration="NORMAL">
              <Tabs.Panel value="team">
                <Stack spacing="lg">
                  <Group position="apart">
                    <div>
                      <Title order={3}>Team Members</Title>
                      <Text color="dimmed">Manage access and permissions for your team</Text>
                    </div>
                    <Button leftIcon={<IconUserPlus size="1rem" />}>Invite Member</Button>
                  </Group>

                  <SimpleGrid cols={3} breakpoints={[{ maxWidth: 'md', cols: 2 }, { maxWidth: 'xs', cols: 1 }]}>
                    {teamMembers.map(member => renderTeamMember(member))}
                  </SimpleGrid>

                  <Paper p="md" withBorder mt="md">
                    <Title order={4} mb="md">Roles and Permissions</Title>

                    <Stack spacing="md">
                      <Group position="apart">
                        <div>
                          <Text weight={500}>Admin</Text>
                          <Text size="sm" color="dimmed">Full access to all features and settings</Text>
                        </div>
                        <Button variant="outline" size="xs">Edit Permissions</Button>
                      </Group>

                      <Divider />

                      <Group position="apart">
                        <div>
                          <Text weight={500}>Manager</Text>
                          <Text size="sm" color="dimmed">Access to most features but limited settings access</Text>
                        </div>
                        <Button variant="outline" size="xs">Edit Permissions</Button>
                      </Group>

                      <Divider />

                      <Group position="apart">
                        <div>
                          <Text weight={500}>User</Text>
                          <Text size="sm" color="dimmed">Limited access to features and settings</Text>
                        </div>
                        <Button variant="outline" size="xs">Edit Permissions</Button>
                      </Group>
                    </Stack>
                  </Paper>
                </Stack>
              </Tabs.Panel>
            </GSAPFadeIn>

            <GSAPFadeIn duration="NORMAL">
              <Tabs.Panel value="integrations">
                <Stack spacing="lg">
                  <Group position="apart">
                    <div>
                      <Title order={3}>Marketplace & Service Integrations</Title>
                      <Text color="dimmed">Manage connections with external platforms and services</Text>
                    </div>
                    <Button leftIcon={<IconPlus size="1rem" />}>Add Integration</Button>
                  </Group>

                  <SimpleGrid cols={2} breakpoints={[{ maxWidth: 'md', cols: 1 }]}>
                    {integrations.map(integration => renderIntegration(integration))}
                  </SimpleGrid>

                  <Paper p="md" withBorder mt="md">
                    <Title order={4} mb="md">Integration Settings</Title>

                    <Stack spacing="md">
                      <Group position="apart">
                        <div>
                          <Text weight={500}>Auto-Sync</Text>
                          <Text size="sm" color="dimmed">Automatically sync data with integrated platforms</Text>
                        </div>
                        <Switch defaultChecked />
                      </Group>

                      <Divider />

                      <Group position="apart">
                        <div>
                          <Text weight={500}>Sync Frequency</Text>
                          <Text size="sm" color="dimmed">How often to sync data with platforms</Text>
                        </div>
                        <Select
                          defaultValue="15"
                          data={[
                            { value: '5', label: 'Every 5 minutes' },
                            { value: '15', label: 'Every 15 minutes' },
                            { value: '30', label: 'Every 30 minutes' },
                            { value: '60', label: 'Every hour' },
                          ]}
                          style={{ width: 180 }}
                        />
                      </Group>
                    </Stack>
                  </Paper>
                </Stack>
              </Tabs.Panel>
            </GSAPFadeIn>

            <GSAPFadeIn duration="NORMAL">
              <Tabs.Panel value="notifications">
                <Stack spacing="lg">
                  <Title order={3}>Notification Settings</Title>
                  <Text color="dimmed">Manage how and when you receive notifications</Text>

                  <Paper p="md" withBorder>
                    <Title order={4} mb="md">Email Notifications</Title>

                    <Stack spacing="md">
                      <Group position="apart">
                        <div>
                          <Text weight={500}>Order Notifications</Text>
                          <Text size="sm" color="dimmed">Receive notifications for new and updated orders</Text>
                        </div>
                        <Switch defaultChecked />
                      </Group>

                      <Divider />

                      <Group position="apart">
                        <div>
                          <Text weight={500}>Inventory Alerts</Text>
                          <Text size="sm" color="dimmed">Receive alerts for low stock and inventory changes</Text>
                        </div>
                        <Switch defaultChecked />
                      </Group>

                      <Divider />

                      <Group position="apart">
                        <div>
                          <Text weight={500}>Price Change Alerts</Text>
                          <Text size="sm" color="dimmed">Receive alerts when competitors change prices</Text>
                        </div>
                        <Switch defaultChecked />
                      </Group>

                      <Divider />

                      <Group position="apart">
                        <div>
                          <Text weight={500}>System Notifications</Text>
                          <Text size="sm" color="dimmed">Receive notifications about system updates and maintenance</Text>
                        </div>
                        <Switch defaultChecked />
                      </Group>

                      <Divider />

                      <Group position="apart">
                        <div>
                          <Text weight={500}>Marketing and Newsletter</Text>
                          <Text size="sm" color="dimmed">Receive marketing updates and newsletters</Text>
                        </div>
                        <Switch />
                      </Group>
                    </Stack>

                    <Button mt="lg">Save Preferences</Button>
                  </Paper>
                </Stack>
              </Tabs.Panel>
            </GSAPFadeIn>

            <GSAPFadeIn duration="NORMAL">
              <Tabs.Panel value="security">
                <Stack spacing="lg">
                  <Title order={3}>Security Settings</Title>
                  <Text color="dimmed">Manage your account security and authentication options</Text>

                  <Paper p="md" withBorder>
                    <Title order={4} mb="md">Password</Title>

                    <Group grow mb="md">
                      <PasswordInput
                        label="Current Password"
                        placeholder="Enter current password"
                      />
                    </Group>

                    <Group grow mb="md">
                      <PasswordInput
                        label="New Password"
                        placeholder="Enter new password"
                      />
                      <PasswordInput
                        label="Confirm New Password"
                        placeholder="Confirm new password"
                      />
                    </Group>

                    <Button mt="md">Change Password</Button>
                  </Paper>

                  <Paper p="md" withBorder>
                    <Title order={4} mb="md">Two-Factor Authentication</Title>

                    <Group position="apart" mb="lg">
                      <div>
                        <Text weight={500}>Two-Factor Authentication</Text>
                        <Text size="sm" color="dimmed">Add an extra layer of security to your account</Text>
                      </div>
                      <Switch />
                    </Group>

                    <Button variant="outline" disabled>Set Up 2FA</Button>
                  </Paper>

                  <Paper p="md" withBorder>
                    <Title order={4} mb="md">Session Management</Title>

                    <Group position="apart" mb="lg">
                      <div>
                        <Text weight={500}>Current Session</Text>
                        <Text size="sm" color="dimmed">This device • Last active: Just now</Text>
                      </div>
                      <Badge color="green">Active</Badge>
                    </Group>

                    <Button color="red" variant="outline">Sign Out of All Devices</Button>
                  </Paper>
                </Stack>
              </Tabs.Panel>
            </GSAPFadeIn>

            <GSAPFadeIn duration="NORMAL">
              <Tabs.Panel value="billing">
                <Stack spacing="lg">
                  <Title order={3}>Billing & Subscription</Title>
                  <Text color="dimmed">Manage your subscription plan and payment methods</Text>

                  <Paper p="md" withBorder>
                    <Group position="apart" mb="lg">
                      <div>
                        <Title order={4}>Current Plan</Title>
                        <Text size="xl" weight={700} color="blue">Business Pro</Text>
                        <Badge color="green" mt="xs">Active</Badge>
                      </div>
                      <div>
                        <Text align="right" size="lg" weight={700}>$99.00 / month</Text>
                        <Text size="sm" color="dimmed" align="right">Next billing: May 15, 2025</Text>
                      </div>
                    </Group>

                    <Divider my="md" />

                    <Text weight={500} mb="xs">Plan Features:</Text>
                    <Box mb="lg">
                      <Text size="sm">• Unlimited products and listings</Text>
                      <Text size="sm">• 5 marketplace integrations</Text>
                      <Text size="sm">• Advanced analytics and reporting</Text>
                      <Text size="sm">• Priority support</Text>
                      <Text size="sm">• AI-powered repricing</Text>
                    </Box>

                    <Group>
                      <Button variant="outline">Change Plan</Button>
                      <Button color="red" variant="subtle">Cancel Subscription</Button>
                    </Group>
                  </Paper>

                  <Paper p="md" withBorder>
                    <Title order={4} mb="md">Payment Methods</Title>

                    <Group position="apart" mb="lg">
                      <Group>
                        <Box sx={{ width: 50, textAlign: 'center' }}>
                          <IconWallet size="2rem" />
                        </Box>
                        <div>
                          <Text weight={500}>Visa ending in 4242</Text>
                          <Text size="sm" color="dimmed">Expires 06/2026</Text>
                        </div>
                      </Group>
                      <Badge color="blue">Default</Badge>
                    </Group>

                    <Divider my="md" />

                    <Button leftIcon={<IconPlus size="1rem" />} variant="outline">
                      Add Payment Method
                    </Button>
                  </Paper>

                  <Paper p="md" withBorder>
                    <Title order={4} mb="md">Billing History</Title>

                    <Text color="dimmed" size="sm">Recent invoices will be displayed here</Text>
                  </Paper>
                </Stack>
              </Tabs.Panel>
            </GSAPFadeIn>
          </Paper>
        </Tabs>
      </Stack>
    </Container>
  );
}