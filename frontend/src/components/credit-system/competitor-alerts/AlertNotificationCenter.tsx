"use client";

import React, { useEffect, useState } from "react";

import {
  Indicator,
  Popover,
  ActionIcon,
  Stack,
  Text,
  Button,
  Box,
  Group,
  Divider,
  Badge,
  ScrollArea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

import { IconBell } from "@tabler/icons-react";

import { AlertType, AlertImportance } from "./AlertListItem";
import { useAuth } from "../../../lib/firebase/useAuth";

export interface NotificationAlert {
  id: string;
  alertType: AlertType;
  marketplace: string;
  triggeredAt: string;
  status: "new" | "viewed" | "dismissed";
  importance: AlertImportance;
  competitorName?: string;
  keyword?: string;
}

/**
 * A notification center component for competitor alerts
 * with real-time updates and user interaction
 */
export function AlertNotificationCenter(): JSX.Element {
  const { user, refreshToken } = useAuth();
  const [alerts, setAlerts] = useState<NotificationAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [opened, setOpened] = useState<boolean>(false);

  const fetchNewAlerts = async (): Promise<void> => {
    try {
      setLoading(true);

      // Get fresh token
      const token = await refreshToken();

      const response = await fetch(
        "/api/credit-system/competitor-alerts/alerts/new",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }

      const data = (await response.json()) as NotificationAlert[];
      setAlerts(data);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch alerts when component mounts
    fetchNewAlerts();

    // Set up polling every minute
    const intervalId = setInterval(fetchNewAlerts, 60000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleMarkAsViewed = async (alertId: string): Promise<void> => {
    try {
      // Get fresh token
      const token = await refreshToken();

      const response = await fetch(
        `/api/credit-system/competitor-alerts/alerts/${alertId}/view`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to mark alert as viewed");
      }

      // Remove the alert from the list
      setAlerts(alerts.filter((alert) => alert.id !== alertId));
    } catch (error) {
      console.error("Error marking alert as viewed:", error);
    }
  };

  const getAlertTypeLabel = (type: AlertType): string => {
    const alertTypeLabels: Record<AlertType, string> = {
      price_change: "Price Change",
      ranking_change: "Ranking Change",
      new_competitor: "New Competitor",
      stock_status_change: "Stock Status",
      review_change: "Review Change",
      promotion_change: "Promotion",
      description_change: "Description",
    };

    return alertTypeLabels[type] || type;
  };

  const getImportanceColor = (importance: AlertImportance): string => {
    const importanceColors: Record<AlertImportance, string> = {
      critical: "red",
      high: "orange",
      medium: "yellow",
      low: "blue",
    };

    return importanceColors[importance] || "gray";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const markAllAsViewed = async (): Promise<void> => {
    try {
      // Get fresh token
      const token = await refreshToken();

      // Mark each alert as viewed
      const promises = alerts.map((alert) =>
        fetch(`/api/credit-system/competitor-alerts/alerts/${alert.id}/view`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      await Promise.all(promises);

      // Clear the list
      setAlerts([]);
      setOpened(false);

      notifications.show({
        title: "Success",
        message: "All alerts marked as viewed",
        color: "green",
      });
    } catch (error) {
      console.error("Error marking all alerts as viewed:", error);
      notifications.show({
        title: "Error",
        message: "Failed to mark alerts as viewed",
        color: "red",
      });
    }
  };

  const handleTogglePopover = (): void => {
    setOpened((o) => !o);
  };

  return (
    <Popover
      width={350}
      position="bottom-end"
      shadow="md"
      opened={opened}
      onChange={setOpened}
    >
      <Popover.Target>
        <Indicator
          disabled={alerts.length === 0}
          label={alerts.length}
          size={16}
        >
          <ActionIcon
            size="lg"
            color="blue"
            variant="subtle"
            onClick={handleTogglePopover}
          >
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown>
        <Box>
          <Group justify="space-between" mb="xs">
            <Text fw={600}>Competitor Alerts</Text>
            {alerts.length > 0 && (
              <Button size="xs" variant="subtle" onClick={markAllAsViewed}>
                Mark all as read
              </Button>
            )}
          </Group>

          <Divider mb="sm" />

          <ScrollArea h={300} offsetScrollbars>
            {loading ? (
              <Box ta="center" py="lg">
                <Text size="sm" c="dimmed">
                  Loading alerts...
                </Text>
              </Box>
            ) : alerts.length === 0 ? (
              <Box ta="center" py="lg">
                <Text size="sm" c="dimmed">
                  No new alerts
                </Text>
              </Box>
            ) : (
              <Stack gap="xs">
                {alerts.map((alert) => (
                  <Box
                    key={alert.id}
                    p="xs"
                    style={{
                      borderRadius: "4px",
                      backgroundColor: "var(--mantine-color-gray-0)",
                      "&:hover": {
                        backgroundColor: "var(--mantine-color-gray-1)",
                      },
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Box>
                        <Group gap="xs">
                          <Text size="sm" lineClamp={1} fw={500}>
                            {getAlertTypeLabel(alert.alertType)}
                          </Text>
                          <Badge
                            size="xs"
                            color={getImportanceColor(alert.importance)}
                          >
                            {alert.importance}
                          </Badge>
                        </Group>

                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {alert.keyword
                            ? `Keyword: ${alert.keyword}`
                            : alert.competitorName
                              ? `Competitor: ${alert.competitorName}`
                              : alert.marketplace}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatDate(alert.triggeredAt)}
                        </Text>
                      </Box>

                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={() => handleMarkAsViewed(alert.id)}
                      >
                        Mark Read
                      </Button>
                    </Group>
                  </Box>
                ))}
              </Stack>
            )}
          </ScrollArea>

          <Divider my="sm" />

          <Button
            fullWidth
            variant="light"
            component="a"
            href="/dashboard/competitor-alerts"
            onClick={() => setOpened(false)}
          >
            View All Alerts
          </Button>
        </Box>
      </Popover.Dropdown>
    </Popover>
  );
}
