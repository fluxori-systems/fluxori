"use client";

import React from "react";

import {
  Box,
  Card,
  Text,
  Badge,
  Group,
  Button,
  ActionIcon,
  Switch,
  Divider,
  Flex,
  Tooltip,
} from "@mantine/core";

import {
  IconTrash,
  IconEdit,
  IconClock,
  IconCalendar,
  IconEye,
} from "@tabler/icons-react";

import { AlertType } from "./AlertListItem";

export type WatchFrequency = "hourly" | "daily" | "weekly";
export type WatchType = "keyword" | "product";

export interface CompetitorWatch {
  id: string;
  watchType?: WatchType;
  keyword?: string;
  productId?: string;
  marketplaces: string[];
  alertTypes: AlertType[];
  frequency: WatchFrequency;
  isActive: boolean;
  lastCheckedAt: string;
  nextCheckAt: string;
  createdAt: string;
}

export interface CompetitorWatchCardProps {
  watch: CompetitorWatch;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
  onViewAlerts?: (id: string) => void;
}

/**
 * A card component for displaying competitor watch configurations
 * with controls for editing, deleting, and toggling active status.
 */
export function CompetitorWatchCard({
  watch,
  onEdit,
  onDelete,
  onToggleActive,
  onViewAlerts,
}: CompetitorWatchCardProps): JSX.Element {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getWatchTitle = (): string => {
    if (watch.keyword) {
      return `Keyword: "${watch.keyword}"`;
    }
    if (watch.productId) {
      return `Product: ${watch.productId}`;
    }
    return "Watch";
  };

  const getAlertTypeLabels = (types: AlertType[]): string[] => {
    const typeMap: Record<AlertType, string> = {
      price_change: "Price Changes",
      ranking_change: "Ranking Changes",
      new_competitor: "New Competitors",
      stock_status_change: "Stock Status",
      review_change: "Reviews",
      promotion_change: "Promotions",
      description_change: "Descriptions",
    };

    return types.map((type) => typeMap[type] || type);
  };

  const getFrequencyColor = (frequency: WatchFrequency): string => {
    switch (frequency) {
      case "hourly":
        return "blue";
      case "daily":
        return "green";
      case "weekly":
        return "yellow";
      default:
        return "gray";
    }
  };

  const handleToggleActive = (): void => {
    if (onToggleActive) {
      onToggleActive(watch.id, !watch.isActive);
    }
  };

  const handleEdit = (): void => {
    if (onEdit) {
      onEdit(watch.id);
    }
  };

  const handleDelete = (): void => {
    if (onDelete) {
      onDelete(watch.id);
    }
  };

  const handleViewAlerts = (): void => {
    if (onViewAlerts) {
      onViewAlerts(watch.id);
    }
  };

  return (
    <Card withBorder shadow="sm" radius="md" p="md">
      <Card.Section
        py="xs"
        px="md"
        style={{
          backgroundColor: watch.isActive
            ? "var(--mantine-color-blue-0)"
            : "var(--mantine-color-gray-1)",
        }}
      >
        <Group justify="space-between">
          <Text fw={600} size="lg">
            {getWatchTitle()}
          </Text>
          <Switch
            checked={watch.isActive}
            onChange={handleToggleActive}
            label={watch.isActive ? "Active" : "Paused"}
            size="md"
          />
        </Group>
      </Card.Section>

      <Box my="md">
        <Text size="sm" fw={500} mb="xs">
          Monitoring:
        </Text>
        <Group gap="xs">
          {getAlertTypeLabels(watch.alertTypes).map((label, index) => (
            <Badge key={index} size="sm">
              {label}
            </Badge>
          ))}
        </Group>

        <Text size="sm" fw={500} mt="md" mb="xs">
          Marketplaces:
        </Text>
        <Group gap="xs">
          {watch.marketplaces.map((marketplace, index) => (
            <Badge key={index} size="sm" color="cyan">
              {marketplace.charAt(0).toUpperCase() +
                marketplace.slice(1).replace("_", " ")}
            </Badge>
          ))}
        </Group>

        <Badge mt="md" color={getFrequencyColor(watch.frequency)}>
          Checks: {watch.frequency}
        </Badge>
      </Box>

      <Divider my="xs" />

      <Group justify="space-between" mt="md" mb="xs">
        <Flex align="center" gap="xs">
          <IconClock size={16} />
          <Tooltip label="Next check">
            <Text size="sm" c="dimmed">
              {formatDate(watch.nextCheckAt)}
            </Text>
          </Tooltip>
        </Flex>
        <Flex align="center" gap="xs">
          <IconCalendar size={16} />
          <Tooltip label="Created on">
            <Text size="sm" c="dimmed">
              {formatDate(watch.createdAt)}
            </Text>
          </Tooltip>
        </Flex>
      </Group>

      <Group justify="flex-end" mt="md">
        {onViewAlerts && (
          <Button
            leftSection={<IconEye size={16} />}
            variant="light"
            onClick={handleViewAlerts}
          >
            View Alerts
          </Button>
        )}
        {onEdit && (
          <ActionIcon color="blue" variant="subtle" onClick={handleEdit}>
            <IconEdit size={18} />
          </ActionIcon>
        )}
        {onDelete && (
          <ActionIcon color="red" variant="subtle" onClick={handleDelete}>
            <IconTrash size={18} />
          </ActionIcon>
        )}
      </Group>
    </Card>
  );
}
