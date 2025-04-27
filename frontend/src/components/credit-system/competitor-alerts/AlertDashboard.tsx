"use client";

import React, { useState, useEffect } from "react";

import {
  Container,
  Title,
  Group,
  Select,
  TextInput,
  Tabs,
  Card,
  Button,
  Badge,
  Text,
  Paper,
  Loader,
  Center,
  Stack,
  Notification,
  ActionIcon,
} from "@mantine/core";

import { IconSearch, IconFilter, IconBell, IconX } from "@tabler/icons-react";

import { AlertConfigForm } from "./AlertConfigForm";
import { AlertListItem } from "./AlertListItem";

// Define Types
interface AlertAdditionalInfo {
  productUrl?: string;
  productTitle?: string;
  imageUrl?: string;
  position?: number;
}

interface AlertData {
  oldValue: number | null;
  newValue: number | null;
  changePercent?: number;
  changeAmount?: number;
  additionalInfo?: AlertAdditionalInfo;
}

interface NotificationStatus {
  sent: boolean;
  sentAt?: string;
  channels: string[];
}

export interface CompetitorAlert {
  id: string;
  alertType:
    | "price_change"
    | "ranking_change"
    | "new_competitor"
    | "stock_status_change"
    | "review_change"
    | "promotion_change"
    | "description_change";
  importance: "critical" | "high" | "medium" | "low";
  triggeredAt: string;
  status: "new" | "viewed" | "dismissed";
  keyword?: string;
  marketplace: string;
  competitorName?: string;
  data: AlertData;
  notificationStatus: NotificationStatus;
}

interface AlertsResponse {
  data: CompetitorAlert[];
  total: number;
}

interface AlertMarkResponse {
  success: boolean;
}

interface AlertApiParams {
  status?: string;
  marketplace?: string;
  importance?: string;
  search?: string;
}

interface NotificationState {
  message: string;
  type: "success" | "error";
}

// API client (to be replaced with actual API client)
const apiClient = {
  getAlerts: async (params: AlertApiParams): Promise<AlertsResponse> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate API response
    return {
      data: [
        {
          id: "1",
          alertType: "price_change",
          importance: "critical",
          triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          status: "new",
          keyword: "smartphone",
          marketplace: "takealot",
          competitorName: "Samsung",
          data: {
            oldValue: 9999,
            newValue: 7999,
            changePercent: -20,
            additionalInfo: {
              productUrl: "https://www.takealot.com/samsung-galaxy-a54",
              productTitle:
                "Samsung Galaxy A54 5G Dual Sim A546 - 128GB - Awesome Graphite",
              imageUrl:
                "https://media.takealot.com/covers/54850224/54850224-1-zoom.jpg",
            },
          },
          notificationStatus: {
            sent: true,
            sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            channels: ["email"],
          },
        },
        {
          id: "2",
          alertType: "ranking_change",
          importance: "high",
          triggeredAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
          status: "new",
          keyword: "laptop",
          marketplace: "makro",
          competitorName: "HP",
          data: {
            oldValue: 15,
            newValue: 3,
            changeAmount: 12,
            additionalInfo: {
              productUrl: "https://www.makro.co.za/hp-laptop",
              productTitle: 'HP 15.6" FHD Laptop - Intel Core i5',
              position: 3,
            },
          },
          notificationStatus: {
            sent: true,
            sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            channels: ["email", "in-app"],
          },
        },
        {
          id: "3",
          alertType: "new_competitor",
          importance: "medium",
          triggeredAt: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 1 day ago
          status: "viewed",
          keyword: "headphones",
          marketplace: "takealot",
          competitorName: "Sony",
          data: {
            oldValue: null,
            newValue: 2,
            additionalInfo: {
              productUrl: "https://www.takealot.com/sony-wh-1000xm4",
              productTitle:
                "Sony WH-1000XM4 Wireless Noise Cancelling Headphones",
              position: 2,
            },
          },
          notificationStatus: {
            sent: true,
            sentAt: new Date(
              Date.now() - 1 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            channels: ["email"],
          },
        },
      ],
      total: 3,
    };
  },

  markAlertAsViewed: async (id: string): Promise<AlertMarkResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true };
  },

  dismissAlert: async (id: string): Promise<AlertMarkResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true };
  },
};

export function AlertDashboard(): JSX.Element {
  const [alerts, setAlerts] = useState<CompetitorAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [marketplace, setMarketplace] = useState<string>("all");
  const [importance, setImportance] = useState<string>("all");
  const [notification, setNotification] = useState<NotificationState | null>(
    null,
  );
  const [isConfigFormVisible, setIsConfigFormVisible] =
    useState<boolean>(false);

  // Load alerts on component mount and when filters change
  useEffect(() => {
    fetchAlerts();
  }, [filter, marketplace, importance]);

  const fetchAlerts = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await apiClient.getAlerts({
        status: filter !== "all" ? filter : undefined,
        marketplace: marketplace !== "all" ? marketplace : undefined,
        importance: importance !== "all" ? importance : undefined,
        search,
      });

      setAlerts(response.data);
    } catch (error) {
      showNotification("Error loading alerts", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (): void => {
    fetchAlerts();
  };

  const handleMarkAsViewed = async (id: string): Promise<void> => {
    try {
      await apiClient.markAlertAsViewed(id);
      // Update local state
      setAlerts(
        alerts.map((alert) =>
          alert.id === id ? { ...alert, status: "viewed" } : alert,
        ),
      );
      showNotification("Alert marked as viewed", "success");
    } catch (error) {
      showNotification("Failed to update alert", "error");
    }
  };

  const handleDismiss = async (id: string): Promise<void> => {
    try {
      await apiClient.dismissAlert(id);
      // Update local state
      setAlerts(
        alerts.map((alert) =>
          alert.id === id ? { ...alert, status: "dismissed" } : alert,
        ),
      );
      showNotification("Alert dismissed", "success");
    } catch (error) {
      showNotification("Failed to dismiss alert", "error");
    }
  };

  const handleConfigFormSuccess = (data: any): void => {
    showNotification("Alert configuration saved successfully", "success");
    setIsConfigFormVisible(false);
    fetchAlerts();
  };

  const showNotification = (
    message: string,
    type: "success" | "error",
  ): void => {
    setNotification({ message, type });
    // Auto-hide notification after 3 seconds
    setTimeout(() => setNotification(null), 3000);
  };

  // Render config form or main dashboard
  if (isConfigFormVisible) {
    return (
      <Container size="xl" py="xl">
        {notification && (
          <Notification
            color={notification.type === "success" ? "green" : "red"}
            title={notification.type === "success" ? "Success" : "Error"}
            withCloseButton
            onClose={() => setNotification(null)}
            mb="md"
          >
            {notification.message}
          </Notification>
        )}

        <Group justify="apart" mb="xl">
          <Title order={2}>Configure Competitor Alerts</Title>
          <Button
            leftSection={<IconX size={16} />}
            variant="outline"
            onClick={() => setIsConfigFormVisible(false)}
          >
            Cancel
          </Button>
        </Group>

        <AlertConfigForm
          onSuccess={handleConfigFormSuccess}
          onCancel={() => setIsConfigFormVisible(false)}
        />
      </Container>
    );
  }

  // Main dashboard view
  return (
    <Container size="xl" py="xl">
      {notification && (
        <Notification
          color={notification.type === "success" ? "green" : "red"}
          title={notification.type === "success" ? "Success" : "Error"}
          withCloseButton
          onClose={() => setNotification(null)}
          mb="md"
        >
          {notification.message}
        </Notification>
      )}

      <Group justify="apart" mb="xl">
        <Title order={2}>Competitor Alerts</Title>
        <Button
          leftSection={<IconBell size={16} />}
          variant="outline"
          onClick={() => setIsConfigFormVisible(true)}
        >
          Configure Alerts
        </Button>
      </Group>

      <Paper withBorder p="md" mb="xl">
        <Group justify="apart">
          <Group>
            <TextInput
              label="Search"
              placeholder="Search by keyword or competitor"
              leftSection={<IconSearch size={14} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />

            <Select
              label="Marketplace"
              placeholder="Select marketplace"
              value={marketplace}
              onChange={(value) => setMarketplace(value || "all")}
              data={[
                { value: "all", label: "All Marketplaces" },
                { value: "takealot", label: "Takealot" },
                { value: "makro", label: "Makro" },
                { value: "loot", label: "Loot" },
                { value: "amazon", label: "Amazon" },
              ]}
              leftSection={<IconFilter size={14} />}
            />

            <Select
              label="Importance"
              placeholder="Select importance"
              value={importance}
              onChange={(value) => setImportance(value || "all")}
              data={[
                { value: "all", label: "All Priorities" },
                { value: "critical", label: "Critical" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ]}
            />
          </Group>

          <Button onClick={handleSearch}>Search</Button>
        </Group>
      </Paper>

      <Tabs value={filter} onChange={(value) => setFilter(value || "all")}>
        <Tabs.List mb="md">
          <Tabs.Tab value="all">All Alerts</Tabs.Tab>
          <Tabs.Tab
            value="new"
            rightSection={
              <Badge size="xs" variant="filled" color="red">
                {alerts.filter((alert) => alert.status === "new").length}
              </Badge>
            }
          >
            New
          </Tabs.Tab>
          <Tabs.Tab value="viewed">Viewed</Tabs.Tab>
          <Tabs.Tab value="dismissed">Dismissed</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value={filter}>
          {loading ? (
            <Center my="xl">
              <Loader />
            </Center>
          ) : alerts.length === 0 ? (
            <Card withBorder p="xl" mt="md">
              <Center>
                <Stack ta="center" gap="md">
                  <IconBell size={48} color="gray" opacity={0.5} />
                  <Text size="lg" color="dimmed">
                    No alerts found
                  </Text>
                  <Text color="dimmed" ta="center">
                    {filter === "all"
                      ? "You don't have any competitor alerts yet."
                      : `You don't have any ${filter} alerts.`}
                  </Text>
                  <Button
                    variant="outline"
                    onClick={() => setIsConfigFormVisible(true)}
                  >
                    Configure Alert Settings
                  </Button>
                </Stack>
              </Center>
            </Card>
          ) : (
            <Stack gap="md">
              {alerts
                .filter((alert) => filter === "all" || alert.status === filter)
                .map((alert) => (
                  <AlertListItem
                    key={alert.id}
                    alert={alert}
                    onMarkAsViewed={handleMarkAsViewed}
                    onDismiss={handleDismiss}
                  />
                ))}
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
