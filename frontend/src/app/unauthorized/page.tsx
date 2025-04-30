"use client";

import { Suspense } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Center,
  Group,
  ThemeIcon,
  Box,
  List,
  Card,
  Divider,
  Badge,
  Alert,
  Loader,
} from "@mantine/core";

import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconLock,
  IconLogout,
  IconShield,
  IconUserShield,
} from "@tabler/icons-react";

import { useAuth } from "../../lib/firebase/useAuth";

/**
 * Unauthorized Page
 * Displayed when a user tries to access content they don't have permission to view
 */
function UnauthorizedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, hasPermission } = useAuth();

  // Get the required permission from query params if available
  const requiredPermission = searchParams.get("required");
  const requiredRole = searchParams.get("role");
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <Container size="md" py="xl">
      <Paper radius="md" p="xl" withBorder>
        <Center mb="xl">
          <ThemeIcon size={80} radius={100} color="red">
            <IconLock size={50} />
          </ThemeIcon>
        </Center>

        <Title order={2} ta="center" mb="md">
          Access Restricted
        </Title>

        <Text ta="center" size="lg" mb="xl">
          You don't have permission to access this page.
        </Text>

        <Card withBorder shadow="sm" p="lg" radius="md" mb="xl">
          <Group mb="md">
            <IconUserShield size={24} color="blue" />
            <Title order={4}>Your Account Information</Title>
          </Group>

          <List spacing="sm">
            <List.Item>
              <Group>
                <Text fw={500}>Current user:</Text>
                <Text>{user?.name || "Not logged in"}</Text>
              </Group>
            </List.Item>

            <List.Item>
              <Group>
                <Text fw={500}>Email:</Text>
                <Text>{user?.email || "N/A"}</Text>
              </Group>
            </List.Item>

            <List.Item>
              <Group>
                <Text fw={500}>Role:</Text>
                <Badge
                  c={
                    user?.role === "admin"
                      ? "red"
                      : user?.role === "manager"
                        ? "blue"
                        : user?.role === "user"
                          ? "green"
                          : "gray"
                  }
                >
                  {user?.role || "N/A"}
                </Badge>
              </Group>
            </List.Item>

            {requiredPermission && (
              <List.Item>
                <Alert
                  c="yellow"
                  icon={<IconAlertTriangle size={16} />}
                  mt="sm"
                >
                  <Text>
                    This page requires the <Badge>{requiredPermission}</Badge>{" "}
                    permission, which your account doesn't have.
                  </Text>
                </Alert>
              </List.Item>
            )}

            {requiredRole && (
              <List.Item>
                <Alert
                  c="yellow"
                  icon={<IconAlertTriangle size={16} />}
                  mt="sm"
                >
                  <Text>
                    This page requires the <Badge>{requiredRole}</Badge> role,
                    but your role is <Badge>{user?.role || "undefined"}</Badge>.
                  </Text>
                </Alert>
              </List.Item>
            )}
          </List>
        </Card>

        <Box ta="center" mb="xl">
          <IconShield size={32} color="gray" />
          <Text mt="md" c="dimmed">
            If you believe this is an error, please contact your organization
            administrator to request access to this feature.
          </Text>
        </Box>

        <Divider my="lg" />

        <Group justify="center">
          <Button
            variant="outline"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.back()}
          >
            Go Back
          </Button>

          <Button
            component={Link}
            href={returnUrl}
            rightSection={<IconArrowRight size={16} />}
          >
            Return to Dashboard
          </Button>

          <Button
            c="red"
            variant="outline"
            leftSection={<IconLogout size={16} />}
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </Group>
      </Paper>
    </Container>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <Container size="md" py="xl">
          <Paper radius="md" p="xl" withBorder>
            <Center>
              <Loader size="xl" />
            </Center>
            <Text ta="center" mt="md">
              Loading...
            </Text>
          </Paper>
        </Container>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}
