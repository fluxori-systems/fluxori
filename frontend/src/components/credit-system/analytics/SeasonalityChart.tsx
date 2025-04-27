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
  Paper,
  List,
} from "@mantine/core";

import {
  IconSun,
  IconLeaf,
  IconSnowflake,
  IconFlower,
} from "@tabler/icons-react";

import { useNetworkAwareChart } from "../../../hooks/useNetworkAwareChart";

interface MonthlyTrend {
  month: string;
  value: number;
}

export interface SeasonalityData {
  quarterlyTrends: Record<string, number>;
  monthlyTrends: Record<string, number>;
  seasonalKeywords: string[];
  peakMonths: string[];
  peakScore: number;
}

export interface SeasonalityChartProps {
  data: SeasonalityData;
}

/**
 * A component for visualizing seasonal trends in e-commerce data
 * with optimizations for the South African market.
 */
export function SeasonalityChart({ data }: SeasonalityChartProps): JSX.Element {
  const { shouldSimplify, showTextAlternative, getDesignSystemColors } =
    useNetworkAwareChart();

  // Get colors
  const colors = getDesignSystemColors(4);

  // Convert monthly trends to array for visualization
  const monthlyTrendsArray = Object.entries(data.monthlyTrends).map(
    ([month, value]) => ({
      month,
      value,
    }),
  );

  // Handle text alternative display for poor connections
  if (showTextAlternative) {
    return (
      <Card withBorder p="md">
        <Text size="sm" fw={500} mb="xs">
          Seasonality Analysis
        </Text>
        <Text size="sm">
          Peak months are {data.peakMonths.join(", ")} with a seasonality score
          of {data.peakScore.toFixed(1)}. Top seasonal keywords:{" "}
          {data.seasonalKeywords.join(", ")}.
        </Text>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      <Text fw={500} size="lg">
        Seasonality Analysis
      </Text>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder p="md">
            <Text size="sm" fw={500} mb="md">
              Monthly Trends
            </Text>
            <div
              style={{
                height: 250,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
              }}
            >
              {/* Line chart for monthly trends would go here */}
              {/* For this implementation, we'll show a representation with bars */}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-around",
                  height: 200,
                }}
              >
                {monthlyTrendsArray.map((item: MonthlyTrend) => (
                  <div
                    key={item.month}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: shouldSimplify ? 20 : 30,
                        height: item.value * 100,
                        backgroundColor: getMonthColor(item.month, colors),
                        transition: "height 1s ease-out",
                        borderRadius: "4px 4px 0 0",
                      }}
                    />
                    <Text size="xs" style={{ marginTop: 4 }}>
                      {item.month}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder p="md" h="100%">
            <Text size="sm" fw={500} mb="md">
              Peak Seasons
            </Text>
            <Stack gap="md">
              <Group justify="apart">
                <Text size="sm">Peak Score:</Text>
                <Badge
                  size="lg"
                  color={
                    data.peakScore > 80
                      ? "green"
                      : data.peakScore > 50
                        ? "yellow"
                        : "red"
                  }
                >
                  {data.peakScore.toFixed(1)}
                </Badge>
              </Group>

              <Divider my="xs" />

              <Text size="sm">Peak Months:</Text>
              <Group justify="left" gap="xs">
                {data.peakMonths.map((month) => (
                  <Badge key={month} size="sm">
                    {month}
                  </Badge>
                ))}
              </Group>

              <Text size="sm">Quarterly Performance:</Text>
              <Grid>
                {Object.entries(data.quarterlyTrends).map(
                  ([quarter, value]) => (
                    <Grid.Col key={quarter} span={{ base: 3 }}>
                      <Paper
                        withBorder
                        p="xs"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          height: 80,
                        }}
                      >
                        <div style={{ marginBottom: 5 }}>
                          {quarter === "Q1" && (
                            <IconSnowflake size={20} color={colors[0]} />
                          )}
                          {quarter === "Q2" && (
                            <IconFlower size={20} color={colors[1]} />
                          )}
                          {quarter === "Q3" && (
                            <IconSun size={20} color={colors[2]} />
                          )}
                          {quarter === "Q4" && (
                            <IconLeaf size={20} color={colors[3]} />
                          )}
                        </div>
                        <Text size="xs" fw={500}>
                          {quarter}
                        </Text>
                        <Badge size="sm" style={{ marginTop: 5 }}>
                          {(value * 100).toFixed(0)}%
                        </Badge>
                      </Paper>
                    </Grid.Col>
                  ),
                )}
              </Grid>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder p="md">
        <Text size="sm" fw={500} mb="md">
          Seasonal Keywords
        </Text>
        <List spacing="xs">
          {data.seasonalKeywords.map((keyword) => (
            <List.Item key={keyword}>
              <Text size="sm">{keyword}</Text>
            </List.Item>
          ))}
        </List>
      </Card>
    </Stack>
  );
}

// Helper function to get color based on month
function getMonthColor(month: string, colors: string[]): string {
  const winterMonths = ["Jan", "Feb"];
  const springMonths = ["Mar", "Apr", "May"];
  const summerMonths = ["Jun", "Jul", "Aug"];
  const fallMonths = ["Sep", "Oct", "Nov", "Dec"];

  if (winterMonths.includes(month)) return colors[0];
  if (springMonths.includes(month)) return colors[1];
  if (summerMonths.includes(month)) return colors[2];
  return colors[3];
}
