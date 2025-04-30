"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AppShell,
  Text,
  Burger,
  Group,
  Button,
  Title,
  Stack,
} from "@mantine/core";

import { useFirebase } from "../../lib/firebase/firebase-context";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [opened, setOpened] = useState(false);
  const { user, logout } = useFirebase();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Simplified component to fix TypeScript errors
  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{
        width: { base: 250 },
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
    >
      <AppShell.Header p="md">
        <Group justify="space-between" h="100%">
          <Group>
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              size="sm"
              mr="xl"
            />
            <Title order={4}>Fluxori</Title>
          </Group>
          <Group>
            {user && <Button onClick={handleLogout}>Logout</Button>}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          <Button component={Link} href="/dashboard" variant="subtle">
            Dashboard
          </Button>
          <Button component={Link} href="/dashboard/products" variant="subtle">
            Products
          </Button>
          <Button component={Link} href="/dashboard/inventory" variant="subtle">
            Inventory
          </Button>
          <Button component={Link} href="/dashboard/settings" variant="subtle">
            Settings
          </Button>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Footer p="xs">
        <Text size="xs" ta="center">
          © {new Date().getFullYear()} Fluxori. All rights reserved.
        </Text>
      </AppShell.Footer>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
