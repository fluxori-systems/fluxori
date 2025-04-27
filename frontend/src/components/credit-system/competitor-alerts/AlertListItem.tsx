"use client";

import React from "react";

import {
  Badge,
  Card,
  Group,
  Text,
  Button,
  Stack,
  ActionIcon,
  Menu,
  Box,
} from "@mantine/core";

import {
  IconDotsVertical,
  IconEye,
  IconTrash,
  IconBell,
  IconBellOff,
} from "@tabler/icons-react";
import { formatDistance } from "date-fns";

export type AlertType =
  | "price_change"
  | "ranking_change"
  | "new_competitor"
  | "stock_status_change"
  | "review_change"
  | "promotion_change"
  | "description_change";

export type AlertImportance = "critical" | "high" | "medium" | "low";
export type AlertStatus = "new" | "viewed" | "dismissed";

export interface AlertData {
  oldValue: number | string | boolean | null;
  newValue: number | string | boolean | null;
  changePercent?: number;
  changeAmount?: number;
  additionalInfo?: {
    productUrl?: string;
    reviewCount?: number;
    [key: string]: any;
  };
}

export interface NotificationStatus {
  sent: boolean;
  sentAt?: string;
  channels: string[];
}

export interface CompetitorAlert {
  id: string;
  alertType: AlertType;
  importance: AlertImportance;
  triggeredAt: string;
  status: AlertStatus;
  keyword?: string;
  marketplace: string;
  competitorName?: string;
  data: AlertData;
  notificationStatus: NotificationStatus;
}

export interface AlertListItemProps {
  alert: CompetitorAlert;
  onMarkAsViewed: (id: string) => void;
  onDismiss: (id: string) => void;
}

// Alert importance colors
const importanceColors: Record<AlertImportance, string> = {
  critical: "red",
  high: "orange",
  medium: "yellow",
  low: "blue",
};

// Alert type labels
const alertTypeLabels: Record<AlertType, string> = {
  price_change: "Price Change",
  ranking_change: "Ranking Change",
  new_competitor: "New Competitor",
  stock_status_change: "Stock Status",
  review_change: "Review Change",
  promotion_change: "Promotion",
  description_change: "Description Change",
};

/**
 * A component for displaying competitor alerts with detailed information
 * and action options.
 */
export function AlertListItem({
  alert,
  onMarkAsViewed,
  onDismiss,
}: AlertListItemProps): JSX.Element {
  // Format time since alert was triggered
  const timeSince = formatDistance(new Date(alert.triggeredAt), new Date(), {
    addSuffix: true,
  });

  // Determine alert message based on type
  const getAlertMessage = (): string => {
    switch (alert.alertType) {
      case "price_change":
        const priceChangeText =
          alert.data.changePercent !== undefined
            ? `${alert.data.changePercent > 0 ? "increased" : "decreased"} by ${Math.abs(alert.data.changePercent).toFixed(1)}%`
            : "changed";
        return `Price ${priceChangeText} (${alert.data.oldValue} → ${alert.data.newValue})`;

      case "ranking_change": {
        // Safely handle potentially undefined changeAmount
        const changeAmount = alert.data.changeAmount ?? 0;
        const rankingChangeText =
          changeAmount !== 0
            ? `${changeAmount > 0 ? "improved" : "dropped"} by ${Math.abs(changeAmount)} positions`
            : "changed";
        return `Ranking ${rankingChangeText} (${alert.data.oldValue} → ${alert.data.newValue})`;
      }

      case "new_competitor":
        return `New competitor appeared at position ${alert.data.newValue}`;

      case "stock_status_change":
        return `Stock status changed to ${
          alert.data.newValue === true || alert.data.newValue === "true"
            ? "In Stock"
            : "Out of Stock"
        }`;

      case "review_change": {
        // Safely handle potentially undefined changeAmount
        const changeAmount = alert.data.changeAmount ?? 0;

        if (alert.data.additionalInfo?.reviewCount !== undefined) {
          return `Review count ${changeAmount > 0 ? "increased" : "decreased"} by ${Math.abs(changeAmount)}`;
        } else {
          return `Rating ${changeAmount > 0 ? "increased" : "decreased"} by ${Math.abs(changeAmount).toFixed(1)}`;
        }
      }

      default:
        return `${alertTypeLabels[alert.alertType] || "Unknown"} alert`;
    }
  };

  const handleMarkAsViewed = (): void => {
    onMarkAsViewed(alert.id);
  };

  const handleDismiss = (): void => {
    onDismiss(alert.id);
  };

  return (
    <Card withBorder shadow="sm" p="md" radius="md" mb="md">
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Group>
            <Badge color={importanceColors[alert.importance]} size="lg">
              {alert.importance.toUpperCase()}
            </Badge>
            <Badge variant="outline">
              {alertTypeLabels[alert.alertType] || "Unknown Type"}
            </Badge>
          </Group>

          <Menu withinPortal position="bottom-end">
            <Menu.Target>
              <ActionIcon>
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEye size={14} />}
                onClick={handleMarkAsViewed}
                disabled={alert.status !== "new"}
              >
                Mark as viewed
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                onClick={handleDismiss}
                color="red"
              >
                Dismiss
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={
                  alert.notificationStatus.sent ? (
                    <IconBellOff size={14} />
                  ) : (
                    <IconBell size={14} />
                  )
                }
              >
                {alert.notificationStatus.sent
                  ? "Disable notifications"
                  : "Enable notifications"}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Card.Section>

      <Stack gap="xs" mt="md">
        <Group justify="space-between">
          <Text fw={500} size="lg">
            {alert.competitorName || "Competitor"} - {alert.keyword}
          </Text>
          <Text size="xs" c="dimmed">
            {timeSince}
          </Text>
        </Group>

        <Text>{getAlertMessage()}</Text>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Marketplace: {alert.marketplace}
          </Text>

          {alert.status === "new" ? (
            <Button variant="light" size="xs" onClick={handleMarkAsViewed}>
              Mark as viewed
            </Button>
          ) : (
            <Badge variant="dot" color="gray">
              {alert.status}
            </Badge>
          )}
        </Group>

        {alert.data.additionalInfo?.productUrl && (
          <Box mt="xs">
            <Button
              component="a"
              href={alert.data.additionalInfo.productUrl}
              target="_blank"
              variant="outline"
              size="xs"
              fullWidth
            >
              View product
            </Button>
          </Box>
        )}
      </Stack>
    </Card>
  );
}
