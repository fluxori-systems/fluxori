"use client";

import React, { useState } from "react";

import {
  Box,
  Button,
  Card,
  Checkbox,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Alert,
  Divider,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

import {
  IconAlertCircle,
  IconInfoCircle,
  IconSearch,
} from "@tabler/icons-react";

import { useAuth } from "../../../lib/firebase/useAuth";

export interface AnalyticsOptions {
  includeMarketShare: boolean;
  includeSeasonality: boolean;
  includeCompetitionAnalysis: boolean;
  includeTrendPrediction: boolean;
  includeGrowthOpportunities: boolean;
}

export interface AnalyticsRequest {
  keyword: string;
  marketplace: string;
  options: AnalyticsOptions;
}

export interface AnalyticsResponse {
  id: string;
  keyword: string;
  marketplace: string;
  generatedAt: string;
  options: AnalyticsOptions;
  data: Record<string, any>;
  creditCost: number;
}

export interface AnalyticsRequestFormProps {
  onSuccess?: (result: AnalyticsResponse) => void;
}

/**
 * Form component for requesting keyword analytics with credit cost estimation
 */
export function AnalyticsRequestForm({
  onSuccess,
}: AnalyticsRequestFormProps): JSX.Element {
  const { user, refreshToken } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [estimating, setEstimating] = useState<boolean>(false);
  const [creditCost, setCreditCost] = useState<number | null>(null);

  const form = useForm<AnalyticsRequest>({
    initialValues: {
      keyword: "",
      marketplace: "",
      options: {
        includeMarketShare: true,
        includeSeasonality: true,
        includeCompetitionAnalysis: true,
        includeTrendPrediction: true,
        includeGrowthOpportunities: false,
      },
    },
    validate: {
      keyword: (value) => (value ? null : "Keyword is required"),
      marketplace: (value) => (value ? null : "Marketplace is required"),
    },
  });

  const handleSubmit = async (values: AnalyticsRequest): Promise<void> => {
    try {
      setLoading(true);

      // Generate a credit cost estimate first if one doesn't exist
      if (creditCost === null) {
        await estimateCreditCost();
      }

      // Get fresh token
      const token = await refreshToken();

      const response = await fetch("/api/credit-system/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to generate analytics");
      }

      const result = (await response.json()) as AnalyticsResponse;

      notifications.show({
        title: "Success",
        message: "Analytics generated successfully",
        color: "green",
      });

      // Call the success callback with the result
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate analytics",
        color: "red",
      });
      console.error("Error generating analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const estimateCreditCost = async (): Promise<void> => {
    // Only estimate if required fields are filled
    const keywordError = form.validateField("keyword").hasError;
    const marketplaceError = form.validateField("marketplace").hasError;

    if (keywordError || marketplaceError) {
      form.validate();
      return;
    }

    try {
      setEstimating(true);

      // Get fresh token
      const token = await refreshToken();

      // Construct the URL with query parameters
      const params = new URLSearchParams({
        keyword: form.values.keyword,
        marketplace: form.values.marketplace,
      });

      // Add option parameters
      for (const [key, value] of Object.entries(form.values.options)) {
        if (value) {
          params.append(key, "true");
        }
      }

      const response = await fetch(
        `/api/credit-system/analytics/estimate?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to estimate credit cost");
      }

      const data = (await response.json()) as {
        creditCost: number;
        hasCredits: boolean;
      };
      setCreditCost(data.creditCost);

      if (!data.hasCredits) {
        notifications.show({
          title: "Warning",
          message: `Insufficient credits. You need ${data.creditCost} credits for this analysis.`,
          color: "yellow",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to estimate credit cost",
        color: "red",
      });
      console.error("Error estimating cost:", error);
    } finally {
      setEstimating(false);
    }
  };

  const marketplaceOptions = [
    { value: "takealot", label: "Takealot" },
    { value: "makro", label: "Makro" },
    { value: "loot", label: "Loot" },
    { value: "game", label: "Game" },
    { value: "bob_shop", label: "Bob Shop" },
    { value: "buck_cheap", label: "Buck Cheap" },
  ];

  return (
    <Box>
      <Title order={2} mb="md">
        Generate Keyword Analytics
      </Title>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Card withBorder p="md" radius="md">
          <Stack gap="md">
            <TextInput
              label="Keyword"
              placeholder="Enter keyword to analyze"
              description="The keyword to generate advanced analytics for"
              withAsterisk
              leftSection={<IconSearch size={16} />}
              {...form.getInputProps("keyword")}
            />

            <Select
              label="Marketplace"
              placeholder="Select marketplace"
              description="The marketplace to analyze this keyword in"
              data={marketplaceOptions}
              withAsterisk
              {...form.getInputProps("marketplace")}
            />

            <Divider label="Analytics Options" labelPosition="center" />

            <Text size="sm" fw={500} mb={-5}>
              Select the analytics components to include:
            </Text>

            <Checkbox
              label="Market Share Analysis"
              description="Brand dominance, price distribution, and market positioning"
              {...form.getInputProps("options.includeMarketShare", {
                type: "checkbox",
              })}
            />

            <Checkbox
              label="Seasonality Analysis"
              description="Monthly and quarterly trends, peak seasons, holiday impacts"
              {...form.getInputProps("options.includeSeasonality", {
                type: "checkbox",
              })}
            />

            <Checkbox
              label="Competition Analysis"
              description="Competitive landscape, entry barriers, saturation levels"
              {...form.getInputProps("options.includeCompetitionAnalysis", {
                type: "checkbox",
              })}
            />

            <Checkbox
              label="Trend Prediction"
              description="3-month forecast, growth projection, confidence metrics"
              {...form.getInputProps("options.includeTrendPrediction", {
                type: "checkbox",
              })}
            />

            <Checkbox
              label="Growth Opportunities"
              description="White space analysis and expansion recommendations"
              {...form.getInputProps("options.includeGrowthOpportunities", {
                type: "checkbox",
              })}
            />

            {creditCost !== null && (
              <Alert icon={<IconInfoCircle size={16} />} color="blue">
                <Text>
                  Estimated credit cost: <b>{creditCost} credits</b>
                </Text>
                <Text size="sm" c="dimmed">
                  This analysis will be cached for 30 days, making future
                  requests free.
                </Text>
              </Alert>
            )}

            <Group justify="space-between" mt="lg">
              <Button
                variant="outline"
                onClick={estimateCreditCost}
                loading={estimating}
                disabled={loading}
              >
                Estimate Credit Cost
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={estimating}
                leftSection={<IconSearch size={16} />}
              >
                Generate Analytics
              </Button>
            </Group>
          </Stack>
        </Card>
      </form>
    </Box>
  );
}
