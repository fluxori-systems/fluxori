"use client";

import React, { useState, useEffect } from "react";

import {
  TextInput,
  MultiSelect,
  Select,
  NumberInput,
  Switch,
  Button,
  Stack,
  Group,
  Title,
  Text,
  Paper,
  Divider,
  Box,
  Badge,
  Card,
  Alert,
  List,
} from "@mantine/core";
import { useForm } from "@mantine/form";

import { IconInfoCircle, IconAlertCircle } from "@tabler/icons-react";

import { AlertType } from "./AlertListItem";

export interface AlertThresholds {
  priceChangePercent: number;
  rankingChangePositions: number;
  reviewCountChange: number;
  ratingChangeAmount: number;
}

export interface CompetitorWatchConfig {
  keyword: string;
  marketplaces: string[];
  alertTypes: AlertType[];
  frequency: "hourly" | "daily" | "weekly";
  thresholds: AlertThresholds;
  notificationChannels: string[];
  isActive: boolean;
}

export interface CreditEstimate {
  creditCost: number;
  hasCredits: boolean;
  availableCredits: number;
}

export interface CompetitorWatchResponse extends CompetitorWatchConfig {
  id: string;
  organizationId: string;
  userId: string;
  createdAt: string;
}

export interface AlertConfigFormProps {
  onSuccess?: (watchData: CompetitorWatchResponse) => void;
  onCancel?: () => void;
  initialData?: CompetitorWatchConfig;
}

// Simulated API client
const apiClient = {
  createCompetitorWatch: async (
    data: CompetitorWatchConfig & { organizationId: string; userId: string },
  ): Promise<CompetitorWatchResponse> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate credit check
    const creditCost = calculateCreditCost(data);
    const estimatedCredits = 150; // Would come from the backend

    // Check if user has enough credits
    if (creditCost > estimatedCredits) {
      throw new Error("Insufficient credits");
    }

    return {
      id: "new-watch-" + Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
    };
  },

  getCreditEstimate: async (
    data: Partial<CompetitorWatchConfig>,
  ): Promise<CreditEstimate> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      creditCost: calculateCreditCost(data),
      hasCredits: true,
      availableCredits: 150,
    };
  },
};

// Calculate credit cost based on configuration
function calculateCreditCost(config: Partial<CompetitorWatchConfig>): number {
  let cost = 10; // Base cost

  // Add cost for each alert type
  cost += (config.alertTypes?.length || 0) * 2;

  // Add cost for each marketplace
  cost += (config.marketplaces?.length || 0) * 3;

  // Adjust cost based on frequency
  switch (config.frequency) {
    case "hourly":
      cost += 15;
      break;
    case "daily":
      cost += 5;
      break;
    case "weekly":
      cost = Math.max(cost - 2, 5); // Min cost 5 credits
      break;
  }

  return cost;
}

/**
 * Form component for configuring competitor alerts with credit cost estimates
 */
export function AlertConfigForm({
  onSuccess,
  onCancel,
  initialData,
}: AlertConfigFormProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [creditEstimate, setCreditEstimate] = useState<CreditEstimate>({
    creditCost: 0,
    hasCredits: true,
    availableCredits: 0,
  });
  const [estimateLoading, setEstimateLoading] = useState<boolean>(false);

  const form = useForm<CompetitorWatchConfig>({
    initialValues: initialData || {
      keyword: "",
      marketplaces: ["takealot"],
      alertTypes: ["price_change", "ranking_change"],
      frequency: "daily",
      thresholds: {
        priceChangePercent: 5,
        rankingChangePositions: 3,
        reviewCountChange: 10,
        ratingChangeAmount: 0.3,
      },
      notificationChannels: ["email"],
      isActive: true,
    },
    validate: {
      keyword: (value) => (!value ? "Keyword is required" : null),
      marketplaces: (value) =>
        !value || value.length === 0
          ? "At least one marketplace is required"
          : null,
      alertTypes: (value) =>
        !value || value.length === 0
          ? "At least one alert type is required"
          : null,
      frequency: (value) => (!value ? "Frequency is required" : null),
      notificationChannels: (value) =>
        !value || value.length === 0
          ? "At least one notification channel is required"
          : null,
    },
  });

  // Update credit estimate when form values change
  useEffect(() => {
    updateCreditEstimate();
  }, [form.values.marketplaces, form.values.alertTypes, form.values.frequency]);

  const updateCreditEstimate = async (): Promise<void> => {
    // Only update estimate if required fields are provided
    if (
      !form.values.marketplaces?.length ||
      !form.values.alertTypes?.length ||
      !form.values.frequency
    ) {
      return;
    }

    setEstimateLoading(true);
    try {
      const estimate = await apiClient.getCreditEstimate(form.values);
      setCreditEstimate(estimate);
    } catch (error) {
      console.error("Failed to get credit estimate:", error);
    } finally {
      setEstimateLoading(false);
    }
  };

  const handleSubmit = async (values: CompetitorWatchConfig): Promise<void> => {
    setLoading(true);
    try {
      const response = await apiClient.createCompetitorWatch({
        ...values,
        organizationId: "current-org-id", // Would come from context/auth
        userId: "current-user-id", // Would come from context/auth
      });

      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      console.error("Failed to create competitor watch:", error);
      form.setErrors({
        keyword:
          "Failed to create alert. Please check your credits and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (): void => {
    if (onCancel) onCancel();
  };

  const handleSwitchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    form.setFieldValue("isActive", event.currentTarget.checked);
  };

  const marketplaceOptions = [
    { value: "takealot", label: "Takealot" },
    { value: "makro", label: "Makro" },
    { value: "loot", label: "Loot" },
    { value: "amazon", label: "Amazon" },
  ];

  const alertTypeOptions = [
    { value: "price_change", label: "Price Changes" },
    { value: "ranking_change", label: "Ranking Changes" },
    { value: "new_competitor", label: "New Competitors" },
    { value: "stock_status_change", label: "Stock Status Changes" },
    { value: "review_change", label: "Review Changes" },
  ];

  const frequencyOptions = [
    { value: "hourly", label: "Hourly (25 credits)" },
    { value: "daily", label: "Daily (10 credits)" },
    { value: "weekly", label: "Weekly (5 credits)" },
  ];

  const notificationOptions = [
    { value: "email", label: "Email" },
    { value: "in-app", label: "In-App Notification" },
    { value: "sms", label: "SMS (Premium)" },
  ];

  return (
    <Paper p="md" withBorder>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Title order={3}>Configure Competitor Alert</Title>

          <TextInput
            label="Keyword"
            placeholder="Enter keyword to monitor"
            required
            {...form.getInputProps("keyword")}
          />

          <MultiSelect
            label="Marketplaces"
            placeholder="Select marketplaces to monitor"
            data={marketplaceOptions}
            required
            {...form.getInputProps("marketplaces")}
          />

          <MultiSelect
            label="Alert Types"
            placeholder="Select types of alerts to receive"
            data={alertTypeOptions}
            required
            {...form.getInputProps("alertTypes")}
          />

          <Select
            label="Monitoring Frequency"
            placeholder="Select how often to check for changes"
            data={frequencyOptions}
            required
            {...form.getInputProps("frequency")}
          />

          <Divider label="Alert Thresholds" labelPosition="center" />

          {form.values.alertTypes.includes("price_change") && (
            <NumberInput
              label="Price Change Threshold (%)"
              description="Alert when price changes by this percentage"
              min={1}
              max={50}
              {...form.getInputProps("thresholds.priceChangePercent")}
            />
          )}

          {form.values.alertTypes.includes("ranking_change") && (
            <NumberInput
              label="Ranking Change Threshold (positions)"
              description="Alert when ranking changes by this many positions"
              min={1}
              max={20}
              {...form.getInputProps("thresholds.rankingChangePositions")}
            />
          )}

          {form.values.alertTypes.includes("review_change") && (
            <Group grow>
              <NumberInput
                label="Review Count Change"
                description="Alert when review count changes by this amount"
                min={1}
                max={100}
                {...form.getInputProps("thresholds.reviewCountChange")}
              />

              <NumberInput
                label="Rating Change"
                description="Alert when rating changes by this amount"
                min={0.1}
                max={2}
                step={0.1}
                {...form.getInputProps("thresholds.ratingChangeAmount")}
              />
            </Group>
          )}

          <Divider label="Notification Settings" labelPosition="center" />

          <MultiSelect
            label="Notification Channels"
            placeholder="Select how to receive notifications"
            data={notificationOptions}
            required
            {...form.getInputProps("notificationChannels")}
          />

          <Switch
            label="Enable Alert"
            description="Turn alert monitoring on or off"
            checked={form.values.isActive}
            onChange={handleSwitchChange}
          />

          <Card withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={500}>Credit Cost</Text>
              {!estimateLoading && (
                <Badge
                  size="lg"
                  color={creditEstimate.hasCredits ? "green" : "red"}
                >
                  {creditEstimate.creditCost} credits
                </Badge>
              )}
            </Group>

            <Text size="sm" c="dimmed">
              Available Credits: {creditEstimate.availableCredits}
            </Text>

            {!creditEstimate.hasCredits && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" mt="sm">
                Insufficient credits for this alert configuration
              </Alert>
            )}

            <Box mt="md">
              <Text size="sm">
                <strong>Credit cost is based on:</strong>
              </Text>
              <List size="sm" spacing="xs">
                <List.Item>Number of marketplaces monitored</List.Item>
                <List.Item>Types of alerts configured</List.Item>
                <List.Item>Monitoring frequency</List.Item>
              </List>
            </Box>
          </Card>

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={!creditEstimate.hasCredits}
            >
              {initialData ? "Update Alert" : "Create Alert"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
