"use client";

import React from "react";

import {
  Card,
  Group,
  Text,
  Badge,
  Button,
  Divider,
  Stack,
  Box,
  Flex,
} from "@mantine/core";

import { IconArrowUp, IconArrowDown, IconCalendar } from "@tabler/icons-react";

import { AlertType, AlertImportance, AlertStatus } from "./AlertListItem";

export interface CompetitorAlertData {
  oldValue: number | string | boolean | null;
  newValue: number | string | boolean | null;
  changePercent?: number;
  changeAmount?: number;
}

export interface CompetitorAlertCardItem {
  id: string;
  alertType: AlertType;
  marketplace: string;
  triggeredAt: string;
  status: AlertStatus;
  importance: AlertImportance;
  data: CompetitorAlertData;
  competitorName?: string;
  keyword?: string;
}

export interface CompetitorAlertCardProps {
  alert: CompetitorAlertCardItem;
  onMarkAsViewed: (id: string) => void;
  onDismiss: (id: string) => void;
}

/**
 * A card component for displaying detailed competitor alert information
 * with interactive actions for viewing and dismissing alerts.
 */
export function CompetitorAlertCard({
  alert,
  onMarkAsViewed,
  onDismiss,
}: CompetitorAlertCardProps): JSX.Element {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getAlertTypeLabel = (type: AlertType): string => {
    const alertTypeLabels: Record<AlertType, string> = {
      price_change: "Price Change",
      ranking_change: "Ranking Change",
      new_competitor: "New Competitor",
      stock_status_change: "Stock Status Change",
      review_change: "Review Change",
      promotion_change: "Promotion Change",
      description_change: "Description Change",
    };

    return alertTypeLabels[type];
  };

  const getImportanceColor = (importance: AlertImportance): string => {
    const importanceColors: Record<AlertImportance, string> = {
      critical: "red",
      high: "orange",
      medium: "yellow",
      low: "blue",
    };

    return importanceColors[importance];
  };

  const getAlertTitle = (): string => {
    const typeLabel = getAlertTypeLabel(alert.alertType);

    if (alert.keyword) {
      return `${typeLabel} for keyword "${alert.keyword}"`;
    }

    if (alert.competitorName) {
      return `${typeLabel} from ${alert.competitorName}`;
    }

    return typeLabel;
  };

  const handleMarkAsViewed = (): void => {
    onMarkAsViewed(alert.id);
  };

  const handleDismiss = (): void => {
    onDismiss(alert.id);
  };

  const renderPriceChange = (): JSX.Element => {
    const { oldValue, newValue, changePercent = 0 } = alert.data;
    const oldPrice = typeof oldValue === "number" ? oldValue : 0;
    const newPrice = typeof newValue === "number" ? newValue : 0;
    const isIncrease = changePercent >= 0;

    return (
      <Stack gap="xs">
        <Flex justify="space-between">
          <Text>Previous price:</Text>
          <Text fw={500}>R {oldPrice.toFixed(2)}</Text>
        </Flex>
        <Flex justify="space-between">
          <Text>New price:</Text>
          <Text fw={500}>R {newPrice.toFixed(2)}</Text>
        </Flex>
        <Flex justify="space-between">
          <Text>Change:</Text>
          <Group gap="xs">
            <Text fw={500} color={isIncrease ? "green" : "red"}>
              {isIncrease ? "+" : ""}
              {changePercent.toFixed(2)}%
            </Text>
            {isIncrease ? (
              <IconArrowUp size={16} color="green" />
            ) : (
              <IconArrowDown size={16} color="red" />
            )}
          </Group>
        </Flex>
      </Stack>
    );
  };

  const renderRankingChange = (): JSX.Element => {
    const { oldValue, newValue, changeAmount = 0 } = alert.data;
    const oldRank = typeof oldValue === "number" ? oldValue : 0;
    const newRank = typeof newValue === "number" ? newValue : 0;
    const isImproved = changeAmount <= 0;

    return (
      <Stack gap="xs">
        <Flex justify="space-between">
          <Text>Previous ranking:</Text>
          <Text fw={500}>#{oldRank}</Text>
        </Flex>
        <Flex justify="space-between">
          <Text>New ranking:</Text>
          <Text fw={500}>#{newRank}</Text>
        </Flex>
        <Flex justify="space-between">
          <Text>Change:</Text>
          <Group gap="xs">
            <Text fw={500} color={isImproved ? "green" : "red"}>
              {isImproved ? "+" : ""}
              {Math.abs(changeAmount)} positions
            </Text>
            {isImproved ? (
              <IconArrowUp size={16} color="green" />
            ) : (
              <IconArrowDown size={16} color="red" />
            )}
          </Group>
        </Flex>
      </Stack>
    );
  };

  const renderAlertContent = (): JSX.Element => {
    switch (alert.alertType) {
      case "price_change":
        return renderPriceChange();

      case "ranking_change":
        return renderRankingChange();

      default:
        return <Text>This competitor alert requires your attention.</Text>;
    }
  };

  return (
    <Card withBorder shadow="sm" radius="md" p="md">
      <Card.Section
        py="xs"
        px="md"
        style={{
          backgroundColor:
            alert.status === "new"
              ? "var(--mantine-color-blue-0)"
              : "var(--mantine-color-gray-0)",
        }}
      >
        <Group justify="space-between">
          <Text fw={600} size="lg">
            {getAlertTitle()}
          </Text>
          <Badge color={getImportanceColor(alert.importance)}>
            {alert.importance}
          </Badge>
        </Group>
      </Card.Section>

      <Box py="md">{renderAlertContent()}</Box>

      <Divider my="xs" />

      <Group justify="space-between" mt="md">
        <Flex gap="xs" align="center">
          <IconCalendar size={16} />
          <Text size="sm" c="dimmed">
            {formatDate(alert.triggeredAt)}
          </Text>
        </Flex>
        <Badge color="cyan">{alert.marketplace}</Badge>
      </Group>

      <Group justify="flex-end" mt="lg">
        {alert.status === "new" && (
          <Button variant="light" onClick={handleMarkAsViewed}>
            Mark as Viewed
          </Button>
        )}
        {alert.status !== "dismissed" && (
          <Button variant="subtle" color="gray" onClick={handleDismiss}>
            Dismiss
          </Button>
        )}
      </Group>
    </Card>
  );
}
