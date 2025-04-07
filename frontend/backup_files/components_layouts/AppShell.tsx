import { ReactNode } from 'react';
import { AppShell as MantineAppShell, Burger, NavLink, ScrollArea } from '@mantine/core'
import { Group } from '@/components/ui';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconDashboard, 
  IconPackage, 
  IconTruckDelivery, 
  IconBuildingStore, 
  IconReportAnalytics,
  IconSettings 
} from '@tabler/icons-react';

interface AppShellProps {
  children: ReactNode;
}

/**
 * Application shell component that provides the main layout structure 
 * including navigation and header
 */
export function AppShell({ children }: AppShellProps) {
  const [opened, { toggle }] = useDisclosure();

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group justify="space-between" style={{ flex: 1 }}>
            <h3>Fluxori</h3>
            <Group ml="xl" gap="xs">
              {/* User profile and notifications would go here */}
            </Group>
          </Group>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p="md">
        <ScrollArea>
          <NavLink
            label="Dashboard"
            leftSection={<IconDashboard size="1.2rem" />}
            href="/dashboard"
          />
          <NavLink
            label="Inventory"
            leftSection={<IconPackage size="1.2rem" />}
            href="/inventory"
          />
          <NavLink
            label="Orders"
            leftSection={<IconTruckDelivery size="1.2rem" />}
            href="/orders"
          />
          <NavLink
            label="Marketplaces"
            leftSection={<IconBuildingStore size="1.2rem" />}
            href="/marketplaces"
          />
          <NavLink
            label="Analytics"
            leftSection={<IconReportAnalytics size="1.2rem" />}
            href="/analytics"
          />
          <NavLink
            label="Settings"
            leftSection={<IconSettings size="1.2rem" />}
            href="/settings"
          />
        </ScrollArea>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        {children}
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}
