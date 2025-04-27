"use client";

import React from "react";

import {
  Card,
  Text,
  Grid,
  Stack,
  Group,
  Badge,
  Divider,
  Progress,
} from "@mantine/core";

import {
  IconTrendingUp,
  IconTrendingDown,
  IconEqual,
  IconInfoCircle,
} from "@tabler/icons-react";

import { useNetworkAwareChart } from "../../../hooks/useNetworkAwareChart";

interface MonthForecast {
  month: string;
  predictedVolume: number;
  predictedRankingDifficulty: number;
}

export interface TrendPredictionData {
  predictedVolume: number[];
  predictedGrowth: number;
  confidence: number;
  nextThreeMonths: MonthForecast[];
  trendDirection: "rising" | "falling" | "stable";
}

export interface TrendPredictionChartProps {
  data: TrendPredictionData;
}

/**
 * A component for visualizing trend predictions for e-commerce data
 * with optimizations for the South African market.
 */
export function TrendPredictionChart({
  data,
}: TrendPredictionChartProps): JSX.Element {
  const {
    shouldSimplify,
    showTextAlternative,
    getOptimizedData,
    getDesignSystemColors,
  } = useNetworkAwareChart();

  // Get optimized data and colors
  const predictedVolume = getOptimizedData(data.predictedVolume);
  const colors = getDesignSystemColors(6);

  // Get trend icon and color
  const getTrendIcon = () => {
    if (data.trendDirection === "rising") {
      return <IconTrendingUp size={24} color={colors[0]} />;
    } else if (data.trendDirection === "falling") {
      return <IconTrendingDown size={24} color={colors[4]} />;
    } else {
      return <IconEqual size={24} color={colors[1]} />;
    }
  };

  const getTrendColor = () => {
    if (data.trendDirection === "rising") {
      return "green";
    } else if (data.trendDirection === "falling") {
      return "red";
    } else {
      return "blue";
    }
  };

  // Handle text alternative display for poor connections
  if (showTextAlternative) {
    return (
      <Card withBorder p="md">
        <Text size="sm" fw={500} mb="xs">
          Trend Prediction
        </Text>
        <Text size="sm">
          Trend is {data.trendDirection} with{" "}
          {data.predictedGrowth > 0 ? "+" : ""}
          {data.predictedGrowth.toFixed(1)}% expected growth. Confidence:{" "}
          {data.confidence.toFixed(1)}%.
        </Text>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      <Text fw={500} size="lg">
        Trend Prediction
      </Text>

      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card withBorder p="md">
            <Text size="sm" fw={500} mb="md">
              Volume Forecast (Next 6 Months)
            </Text>
            <div
              style={{
                height: 250,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Line chart for volume forecast would go here */}
              {/* For this implementation, we'll show a representation */}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-around",
                  height: 200,
                  position: "relative",
                }}
              >
                {/* Draw a line connecting the points */}
                <svg
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    top: 0,
                    left: 0,
                    zIndex: 1,
                  }}
                >
                  <polyline
                    points={predictedVolume
                      .map(
                        (value, index) =>
                          `${(index / (predictedVolume.length - 1)) * 100}% ${100 - (value / Math.max(...predictedVolume)) * 80}%`,
                      )
                      .join(" ")}
                    style={{
                      fill: "none",
                      stroke: colors[0],
                      strokeWidth: 2,
                    }}
                  />
                </svg>

                {/* Add points */}
                {predictedVolume.map((value, index) => (
                  <div
                    key={index}
                    style={{
                      position: "relative",
                      zIndex: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      height: "100%",
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: colors[0],
                        marginBottom: `${(value / Math.max(...predictedVolume)) * 80}%`,
                      }}
                    />
                    <Text size="xs" style={{ marginTop: 8 }}>
                      M{index + 1}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder p="md" h="100%">
            <Text size="sm" fw={500} mb="md">
              Trend Analysis
            </Text>
            <Stack gap="md">
              <Card withBorder p="sm">
                <Group justify="apart">
                  <Text size="sm">Trend Direction:</Text>
                  <Group gap="xs">
                    {getTrendIcon()}
                    <Badge color={getTrendColor()} size="lg">
                      {data.trendDirection.toUpperCase()}
                    </Badge>
                  </Group>
                </Group>
              </Card>

              <Card withBorder p="sm">
                <Group justify="apart" mb="xs">
                  <Text size="sm">Predicted Growth:</Text>
                  <Text
                    size="sm"
                    fw={500}
                    c={
                      data.predictedGrowth > 0
                        ? "green"
                        : data.predictedGrowth < 0
                          ? "red"
                          : "blue"
                    }
                  >
                    {data.predictedGrowth > 0 ? "+" : ""}
                    {data.predictedGrowth.toFixed(1)}%
                  </Text>
                </Group>
                <Progress
                  value={Math.abs(data.predictedGrowth)}
                  color={
                    data.predictedGrowth > 0
                      ? "green"
                      : data.predictedGrowth < 0
                        ? "red"
                        : "blue"
                  }
                  size="sm"
                />
              </Card>

              <Card withBorder p="sm">
                <Group justify="apart" mb="xs">
                  <Text size="sm">Prediction Confidence:</Text>
                  <Badge size="sm">{data.confidence.toFixed(1)}%</Badge>
                </Group>
                <Progress
                  value={data.confidence}
                  color={
                    data.confidence > 80
                      ? "green"
                      : data.confidence > 60
                        ? "yellow"
                        : "red"
                  }
                  size="sm"
                />
              </Card>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder p="md">
        <Text size="sm" fw={500} mb="md">
          Next Three Months Forecast
        </Text>
        <Grid>
          {data.nextThreeMonths.map((monthData, index) => (
            <Grid.Col key={monthData.month} span={{ base: 12, md: 4 }}>
              <Card withBorder p="md">
                <Text size="sm" fw={500} ta="center" mb="sm">
                  {monthData.month}
                </Text>
                <Stack gap="sm">
                  <Group justify="apart">
                    <Text size="xs">Volume:</Text>
                    <Text size="xs" fw={500}>
                      {monthData.predictedVolume.toLocaleString()}
                    </Text>
                  </Group>
                  <Group justify="apart">
                    <Text size="xs">Ranking Difficulty:</Text>
                    <Badge
                      size="sm"
                      color={
                        monthData.predictedRankingDifficulty < 5
                          ? "green"
                          : monthData.predictedRankingDifficulty < 8
                            ? "yellow"
                            : "red"
                      }
                    >
                      {monthData.predictedRankingDifficulty.toFixed(1)}
                    </Badge>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Card>
    </Stack>
  );
}
