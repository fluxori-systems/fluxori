"use client";

import React, { useState, useEffect } from "react";

import {
  Box,
  Title,
  Text,
  Button,
  Group,
  Card,
  Loader,
  Select,
  Grid,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

import { AlertType, AlertImportance, AlertStatus } from "./AlertListItem";
import {
  CompetitorAlertCard,
  CompetitorAlertCardItem,
} from "./CompetitorAlertCard";
import { useAuth } from "../../../lib/firebase/useAuth";

type FilterValue = string | null;

/**
 * A component that displays a filterable list of competitor alerts
 * with status and importance filtering capabilities.
 */
export function CompetitorAlertsList(): JSX.Element {
  const { user, refreshToken } = useAuth();
  const [alerts, setAlerts] = useState<CompetitorAlertCardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<FilterValue>("new");
  const [importanceFilter, setImportanceFilter] = useState<FilterValue>(null);

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, importanceFilter]);

  const fetchAlerts = async (): Promise<void> => {
    try {
      setLoading(true);

      // Get fresh token
      const token = await refreshToken();

      let url = "/api/credit-system/competitor-alerts/alerts";
      const params = new URLSearchParams();

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      if (importanceFilter) {
        params.append("importance", importanceFilter);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }

      const data = (await response.json()) as CompetitorAlertCardItem[];
      setAlerts(data);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load competitor alerts",
        color: "red",
      });
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

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

      // Update local state
      setAlerts(
        alerts.map((alert) =>
          alert.id === alertId
            ? { ...alert, status: "viewed" as AlertStatus }
            : alert,
        ),
      );

      notifications.show({
        title: "Success",
        message: "Alert marked as viewed",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update alert status",
        color: "red",
      });
      console.error("Error marking alert as viewed:", error);
    }
  };

  const handleDismissAlert = async (alertId: string): Promise<void> => {
    try {
      // Get fresh token
      const token = await refreshToken();

      const response = await fetch(
        `/api/credit-system/competitor-alerts/alerts/${alertId}/dismiss`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to dismiss alert");
      }

      // Update local state
      setAlerts(
        alerts.map((alert) =>
          alert.id === alertId
            ? { ...alert, status: "dismissed" as AlertStatus }
            : alert,
        ),
      );

      notifications.show({
        title: "Success",
        message: "Alert dismissed",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to dismiss alert",
        color: "red",
      });
      console.error("Error dismissing alert:", error);
    }
  };

  const handleRefresh = (): void => {
    fetchAlerts();
  };

  const handleStatusFilterChange = (value: FilterValue): void => {
    setStatusFilter(value);
  };

  const handleImportanceFilterChange = (value: FilterValue): void => {
    setImportanceFilter(value);
  };

  const statusFilterData = [
    { value: "all", label: "All" },
    { value: "new", label: "New" },
    { value: "viewed", label: "Viewed" },
    { value: "dismissed", label: "Dismissed" },
  ];

  const importanceFilterData = [
    { value: "all", label: "All" },
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  return (
    <Box>
      <Group mb="xl" justify="space-between">
        <Title order={2}>Competitor Alerts</Title>
        <Button onClick={handleRefresh} variant="outline">
          Refresh
        </Button>
      </Group>

      <Group mb="lg" gap="md">
        <Select
          label="Status"
          placeholder="Filter by status"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          data={statusFilterData}
          clearable
        />

        <Select
          label="Importance"
          placeholder="Filter by importance"
          value={importanceFilter}
          onChange={handleImportanceFilterChange}
          data={importanceFilterData}
          clearable
        />
      </Group>

      {loading ? (
        <Box py="xl" ta="center">
          <Loader size="md" />
          <Text mt="md">Loading alerts...</Text>
        </Box>
      ) : alerts.length === 0 ? (
        <Card p="xl" withBorder>
          <Box ta="center" py="xl">
            <Text size="lg" fw={500} mb="md">
              No alerts found
            </Text>
            <Text c="dimmed">
              {statusFilter === "new"
                ? "You don't have any new competitor alerts at the moment."
                : "No alerts match your current filters."}
            </Text>
          </Box>
        </Card>
      ) : (
        <Grid>
          {alerts.map((alert) => (
            <Grid.Col key={alert.id} span={{ base: 12, md: 6, lg: 4 }}>
              <CompetitorAlertCard
                alert={alert}
                onMarkAsViewed={handleMarkAsViewed}
                onDismiss={handleDismissAlert}
              />
            </Grid.Col>
          ))}
        </Grid>
      )}
    </Box>
  );
}
