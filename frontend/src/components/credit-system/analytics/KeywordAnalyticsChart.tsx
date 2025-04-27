"use client";

import React, { useState, useRef, useEffect } from "react";

import {
  Box,
  Card,
  Group,
  Text,
  Title,
  Stack,
  Tabs,
  Badge,
  Skeleton,
  Button,
  useMantineTheme,
} from "@mantine/core";

import { Chart, registerables } from "chart.js";

import { useNetworkAwareChart } from "../../../hooks/useNetworkAwareChart";
import { NetworkAwareBarChart } from "../../charts/NetworkAwareBarChart";
import { NetworkAwareLineChart } from "../../charts/NetworkAwareLineChart";

// Register Chart.js components
Chart.register(...registerables);

interface KeywordAnalyticsChartProps {
  keywordData?: {
    keyword: string;
    marketplace: string;
    searchVolume?: number;
    searchVolumeHistory?: { period: string; volume: number }[];
    seasonalityData?: {
      monthlyTrends: Record<string, number>;
      quarterlyTrends: Record<string, number>;
    };
    trendPrediction?: {
      predictedVolume: number[];
      predictedGrowth: number;
      confidence: number;
      nextThreeMonths: {
        month: string;
        predictedVolume: number;
      }[];
      trendDirection: "rising" | "falling" | "stable";
    };
  };
  isLoading?: boolean;
}

export function KeywordAnalyticsChart({
  keywordData,
  isLoading = false,
}: KeywordAnalyticsChartProps) {
  const theme = useMantineTheme();
  const { profileConfig } = useNetworkAwareChart();
  const [activeTab, setActiveTab] = useState<string | null>("history");

  // Format historical data for chart
  const formatHistoricalData = () => {
    if (!keywordData?.searchVolumeHistory) return [];
    return keywordData.searchVolumeHistory;
  };

  // Format prediction data for chart
  const formatPredictionData = () => {
    if (!keywordData?.trendPrediction?.nextThreeMonths) return [];

    // Combine historical with prediction data
    const historicalData = formatHistoricalData();
    const lastHistoricalIndex =
      historicalData.length > 0 ? historicalData.length - 1 : 0;

    return [
      // Last historical point
      ...(lastHistoricalIndex > 0 ? [historicalData[lastHistoricalIndex]] : []),
      // Prediction points
      ...keywordData.trendPrediction.nextThreeMonths.map((item) => ({
        period: item.month,
        volume: item.predictedVolume,
        isPrediction: true,
      })),
    ];
  };

  // Format monthly seasonality data for chart
  const formatMonthlyData = () => {
    if (!keywordData?.seasonalityData?.monthlyTrends) return [];

    // Convert monthlyTrends object to array
    return Object.entries(keywordData.seasonalityData.monthlyTrends).map(
      ([month, volume]) => ({
        month,
        volume,
      }),
    );
  };

  // Format quarterly seasonality data for chart
  const formatQuarterlyData = () => {
    if (!keywordData?.seasonalityData?.quarterlyTrends) return [];

    // Convert quarterlyTrends object to array
    return Object.entries(keywordData.seasonalityData.quarterlyTrends).map(
      ([quarter, volume]) => ({
        quarter,
        volume,
      }),
    );
  };

  const getTrendBadgeColor = () => {
    if (!keywordData?.trendPrediction?.trendDirection) return "gray";

    switch (keywordData.trendPrediction.trendDirection) {
      case "rising":
        return "green";
      case "falling":
        return "red";
      case "stable":
        return "blue";
      default:
        return "gray";
    }
  };

  const getTrendLabel = () => {
    if (!keywordData?.trendPrediction?.trendDirection) return "No trend data";

    const growth = keywordData.trendPrediction.predictedGrowth;
    const direction = keywordData.trendPrediction.trendDirection;

    return `${direction === "rising" ? "+" : direction === "falling" ? "-" : ""}${Math.abs(growth).toFixed(1)}% (${direction})`;
  };

  const renderChart = () => {
    if (isLoading) {
      return (
        <Box py="xl">
          <Skeleton height={300} radius="md" />
        </Box>
      );
    }

    if (!keywordData) {
      return (
        <Box py="xl" ta="center">
          <Text color="dimmed">No data available</Text>
          <Button mt="md" variant="outline" size="sm">
            Select a keyword
          </Button>
        </Box>
      );
    }

    switch (activeTab) {
      case "history":
        return (
          <NetworkAwareLineChart
            data={formatHistoricalData()}
            xAxisDataKey="period"
            yAxisDataKey="volume"
            height={300}
            xAxisLabel="Time Period"
            yAxisLabel="Search Volume"
            showDots={true}
            fillArea={false}
            colors={[theme.colors.blue[6]]}
          />
        );

      case "prediction":
        return (
          <Box>
            <Group justify="apart" mb="md">
              <Group gap="xs">
                <Text>Predicted growth:</Text>
                <Badge color={getTrendBadgeColor()}>{getTrendLabel()}</Badge>
              </Group>
              <Badge>
                {keywordData.trendPrediction?.confidence || 0}% confidence
              </Badge>
            </Group>

            <NetworkAwareLineChart
              data={formatPredictionData()}
              xAxisDataKey="period"
              yAxisDataKey="volume"
              height={300}
              xAxisLabel="Time Period"
              yAxisLabel="Predicted Volume"
              showDots={true}
              colors={[theme.colors.blue[6]]}
            />
          </Box>
        );

      case "seasonality":
        return (
          <Box>
            <Text fw={500} mb="md">
              Monthly Search Volume Trends
            </Text>
            <NetworkAwareBarChart
              data={formatMonthlyData()}
              xAxisDataKey="month"
              yAxisDataKey="volume"
              height={300}
              xAxisLabel="Month"
              yAxisLabel="Search Volume"
              colors={[theme.colors.green[6]]}
            />

            <Text fw={500} mt="xl" mb="md">
              Quarterly Search Volume Trends
            </Text>
            <NetworkAwareBarChart
              data={formatQuarterlyData()}
              xAxisDataKey="quarter"
              yAxisDataKey="volume"
              height={200}
              xAxisLabel="Quarter"
              yAxisLabel="Search Volume"
              colors={[theme.colors.blue[6]]}
            />
          </Box>
        );

      default:
        return (
          <Box py="xl" ta="center">
            <Text color="dimmed">Select a tab to view data</Text>
          </Box>
        );
    }
  };

  return (
    <Card withBorder shadow="sm" padding="lg" radius="md">
      <Group justify="apart" mb="md">
        <Stack gap={0}>
          <Title order={3}>{keywordData?.keyword || "Keyword Analytics"}</Title>
          {keywordData && (
            <Group gap="xs">
              <Text color="dimmed">Marketplace:</Text>
              <Badge>{keywordData.marketplace}</Badge>
              {keywordData.searchVolume && (
                <>
                  <Text color="dimmed">Volume:</Text>
                  <Text fw={500}>
                    {keywordData.searchVolume.toLocaleString()}
                  </Text>
                </>
              )}
            </Group>
          )}
        </Stack>
      </Group>

      <Tabs
        value={activeTab}
        onChange={(value) => setActiveTab(value || "history")}
      >
        <Tabs.List>
          <Tabs.Tab value="history">Historical Data</Tabs.Tab>
          <Tabs.Tab value="prediction">Trend Prediction</Tabs.Tab>
          <Tabs.Tab value="seasonality">Seasonality</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="history" pt="md">
          {renderChart()}
        </Tabs.Panel>

        <Tabs.Panel value="prediction" pt="md">
          {renderChart()}
        </Tabs.Panel>

        <Tabs.Panel value="seasonality" pt="md">
          {renderChart()}
        </Tabs.Panel>
      </Tabs>
    </Card>
  );
}
