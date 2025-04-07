import { ReactNode } from 'react';
import Link from 'next/link';
import { AppShell, Navbar, Header, MediaQuery, Burger, useMantineTheme, ScrollArea, UnstyledButton, Avatar, Box, ThemeIcon, rem } from '@mantine/core'
import { Text, Group } from '@/components/ui';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconDashboard, 
  IconPackage, 
  IconShoppingCart, 
  IconBuildingStore, 
  IconChartBar, 
  IconSettings,
  IconLogout,
  IconChevronRight
} from '@tabler/icons-react';
import { GSAPFadeIn } from '@/components/motion/gsap';

// Navigation items definition
interface NavItemProps {
  icon: ReactNode;
  color: string;
  label: string;
  href: string;
}

function NavItem({ icon, color, label, href }: NavItemProps) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <UnstyledButton
        sx={(theme) => ({
          display: 'block',
          width: '100%',
          padding: theme.spacing.xs,
          borderRadius: theme.radius.sm,
          color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
          '&:hover': {
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
          },
        })}
      >
        <Group>
          <ThemeIcon color={color} variant="light" size="lg">
            {icon}
          </ThemeIcon>

          <Text size="sm">{label}</Text>
        </Group>
      </UnstyledButton>
    </Link>
  );
}

// Main navigation data
const mainNavItems: NavItemProps[] = [
  { icon: <IconDashboard size="1.2rem" />, color: 'blue', label: 'Dashboard', href: '/dashboard' },
  { icon: <IconPackage size="1.2rem" />, color: 'teal', label: 'Inventory', href: '/dashboard/inventory' },
  { icon: <IconShoppingCart size="1.2rem" />, color: 'violet', label: 'Orders', href: '/dashboard/orders' },
  { icon: <IconBuildingStore size="1.2rem" />, color: 'orange', label: 'Marketplace', href: '/dashboard/marketplace' },
  { icon: <IconChartBar size="1.2rem" />, color: 'pink', label: 'Analytics', href: '/dashboard/analytics' },
];

// Settings navigation data
const settingsNavItems: NavItemProps[] = [
  { icon: <IconSettings size="1.2rem" />, color: 'gray', label: 'Settings', href: '/dashboard/settings' },
];

// User component
function User() {
  return (
    <Box
      sx={(theme) => ({
        paddingTop: theme.spacing.sm,
        borderTop: `${rem(1)} solid ${theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[2]}`,
      })}
    >
      <UnstyledButton
        sx={(theme) => ({
          display: 'block',
          width: '100%',
          padding: theme.spacing.xs,
          borderRadius: theme.radius.sm,
          color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
          '&:hover': {
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
          },
        })}
      >
        <Group>
          <Avatar radius="xl" size="md">TS</Avatar>
          <Box sx={{ flex: 1 }}>
            <Text size="sm" weight={500}>
              Tarquin Stapa
            </Text>
            <Text color="dimmed" size="xs">
              admin@fluxori.com
            </Text>
          </Box>
          <IconChevronRight size="1rem" />
        </Group>
      </UnstyledButton>
    </Box>
  );
}

/**
 * Dashboard layout with navigation sidebar and responsive design
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const theme = useMantineTheme();
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <AppShell
      styles={{
        main: {
          background: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      }}
      navbarOffsetBreakpoint="sm"
      navbar={
        <Navbar p="md" hiddenBreakpoint="sm" hidden={!opened} width={{ sm: 200, lg: 250 }}>
          <Navbar.Section grow component={ScrollArea} mx="-xs" px="xs">
            <Text weight={500} size="sm" color="dimmed" mb="xs">MAIN</Text>
            <Box mb="lg">
              {mainNavItems.map((item, index) => (
                <GSAPFadeIn 
                  key={item.label} 
                  duration="NORMAL" 
                  delay={index * 0.1}
                  fromY={10}
                >
                  <NavItem {...item} />
                </GSAPFadeIn>
              ))}
            </Box>

            <Text weight={500} size="sm" color="dimmed" mb="xs">SETTINGS</Text>
            <Box mb="lg">
              {settingsNavItems.map((item, index) => (
                <GSAPFadeIn 
                  key={item.label} 
                  duration="NORMAL" 
                  delay={(mainNavItems.length + index) * 0.1}
                  fromY={10}
                >
                  <NavItem {...item} />
                </GSAPFadeIn>
              ))}
              <GSAPFadeIn 
                duration="NORMAL" 
                delay={(mainNavItems.length + settingsNavItems.length) * 0.1}
                fromY={10}
              >
                <NavItem 
                  icon={<IconLogout size="1.2rem" />} 
                  color="red" 
                  label="Logout" 
                  href="/" 
                />
              </GSAPFadeIn>
            </Box>
          </Navbar.Section>

          <Navbar.Section>
            <User />
          </Navbar.Section>
        </Navbar>
      }
      header={
        <Header height={{ base: 50, md: 60 }} p="md">
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
              <Burger
                opened={opened}
                onClick={toggle}
                size="sm"
                color={theme.colors.gray[6]}
                mr="xl"
              />
            </MediaQuery>

            <Text size="lg" weight={700}>Fluxori</Text>
          </div>
        </Header>
      }
    >
      {children}
    </AppShell>
  );
}
