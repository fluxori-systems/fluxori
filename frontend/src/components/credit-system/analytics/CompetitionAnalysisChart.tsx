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
  RingProgress,
} from "@mantine/core";

import { useNetworkAwareChart } from "../../../hooks/useNetworkAwareChart";
import { formatCurrency } from "../../../lib/shared/utils/currency-formatter";

interface CompetitionAnalysisChartProps {
  data: {
    difficulty: number;
    topCompetitors: Array<{
      brandName: string;
      productCount: number;
      averageRanking: number;
      averagePrice: number;
      dominance: number;
    }>;
    saturationLevel: number;
    entryBarrier: "low" | "medium" | "high";
    opportunityScore: number;
  };
}

export function CompetitionAnalysisChart({
  data,
}: CompetitionAnalysisChartProps) {
  const {
    shouldSimplify,
    showTextAlternative,
    animation,
    profileConfig,
    getOptimizedData,
    getDesignSystemColors,
  } = useNetworkAwareChart();

  // Get optimized data and colors
  const competitors = getOptimizedData(data.topCompetitors);
  const colors = getDesignSystemColors(competitors.length);

  // Get color based on value
  const getProgressColor = (value: number, inverse: boolean = false) => {
    if (inverse) {
      return value < 40 ? "green" : value < 70 ? "yellow" : "red";
    }
    return value > 70 ? "green" : value > 40 ? "yellow" : "red";
  };

  // Get entry barrier color
  const getEntryBarrierColor = () => {
    if (data.entryBarrier === "low") return "green";
    if (data.entryBarrier === "medium") return "yellow";
    return "red";
  };

  // Handle text alternative display for poor connections
  if (showTextAlternative) {
    return (
      <Card withBorder p="md">
        <Text size="sm" fw={500} mb="xs">
          Competition Analysis
        </Text>
        <Text size="sm">
          Difficulty level: {data.difficulty.toFixed(1)}. Opportunity score:{" "}
          {data.opportunityScore.toFixed(1)}. Entry barrier:{" "}
          {data.entryBarrier.toUpperCase()}. Top competitor:{" "}
          {competitors[0].brandName} with {competitors[0].dominance.toFixed(1)}%
          dominance.
        </Text>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      <Text fw={500} size="lg">
        Competition Analysis
      </Text>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder p="md" h="100%">
            <Text size="sm" fw={500} mb="md">
              Competition Overview
            </Text>
            <Grid>
              <Grid.Col span={{ base: 6 }}>
                <Stack gap="xs" ta="center">
                  <Text size="sm" fw={500}>
                    Difficulty
                  </Text>
                  <RingProgress
                    size={shouldSimplify ? 120 : 150}
                    thickness={shouldSimplify ? 12 : 16}
                    sections={[
                      {
                        value: data.difficulty,
                        color: getProgressColor(data.difficulty, true),
                      },
                    ]}
                    label={
                      <Text size="lg" fw={700} ta="center">
                        {data.difficulty.toFixed(1)}
                      </Text>
                    }
                  />
                </Stack>
              </Grid.Col>

              <Grid.Col span={{ base: 6 }}>
                <Stack gap="xs" ta="center">
                  <Text size="sm" fw={500}>
                    Opportunity
                  </Text>
                  <RingProgress
                    size={shouldSimplify ? 120 : 150}
                    thickness={shouldSimplify ? 12 : 16}
                    sections={[
                      {
                        value: data.opportunityScore,
                        color: getProgressColor(data.opportunityScore),
                      },
                    ]}
                    label={
                      <Text size="lg" fw={700} ta="center">
                        {data.opportunityScore.toFixed(1)}
                      </Text>
                    }
                  />
                </Stack>
              </Grid.Col>
            </Grid>

            <Stack gap="md" mt="md">
              <Group justify="apart">
                <Text size="sm">Market Saturation:</Text>
                <Badge c={getProgressColor(data.saturationLevel, true)}>
                  {data.saturationLevel.toFixed(1)}%
                </Badge>
              </Group>

              <Group justify="apart">
                <Text size="sm">Entry Barrier:</Text>
                <Badge c={getEntryBarrierColor()}>
                  {data.entryBarrier.toUpperCase()}
                </Badge>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder p="md" h="100%">
            <Text size="sm" fw={500} mb="md">
              Competitor Dominance
            </Text>
            <Stack gap="md">
              {competitors.map((competitor, index) => (
                <Stack key={competitor.brandName} gap="xs">
                  <Group justify="apart">
                    <Group gap="xs">
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          backgroundColor: colors[index],
                          borderRadius: 2,
                        }}
                      />
                      <Text size="sm">{competitor.brandName}</Text>
                    </Group>
                    <Badge>{competitor.dominance.toFixed(1)}%</Badge>
                  </Group>
                  <Progress
                    value={competitor.dominance}
                    c={colors[index]}
                    size="sm"
                  />
                  <Group justify="apart" gap="xs">
                    <Text size="xs" color="dimmed">
                      Products: {competitor.productCount}
                    </Text>
                    <Text size="xs" color="dimmed">
                      Avg. Rank: {competitor.averageRanking.toFixed(1)}
                    </Text>
                    <Text size="xs" color="dimmed">
                      Avg. Price: {formatCurrency(competitor.averagePrice)}
                    </Text>
                  </Group>
                  {index < competitors.length - 1 && <Divider my="xs" />}
                </Stack>
              ))}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder p="md">
        <Text size="sm" fw={500} mb="md">
          Strategy Recommendations
        </Text>
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder p="sm">
              <Text size="sm" fw={500} mb="xs" ta="center">
                Price Strategy
              </Text>
              <Text size="sm" ta="center">
                {data.difficulty > 70
                  ? "Competitive pricing required. Consider loss-leader strategy."
                  : data.difficulty > 40
                    ? "Balanced pricing with focus on value proposition."
                    : "Premium pricing viable with enhanced features."}
              </Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder p="sm">
              <Text size="sm" fw={500} mb="xs" ta="center">
                Marketing Focus
              </Text>
              <Text size="sm" ta="center">
                {data.saturationLevel > 70
                  ? "Differentiation and niche targeting essential."
                  : data.saturationLevel > 40
                    ? "Balanced approach with unique value proposition."
                    : "Market share growth and visibility campaigns."}
              </Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder p="sm">
              <Text size="sm" fw={500} mb="xs" ta="center">
                Investment Level
              </Text>
              <Text size="sm" ta="center">
                {data.opportunityScore < 40
                  ? "Minimal investment recommended."
                  : data.opportunityScore < 70
                    ? "Moderate investment with careful monitoring."
                    : "High potential - significant investment justified."}
              </Text>
            </Card>
          </Grid.Col>
        </Grid>
      </Card>
    </Stack>
  );
}
