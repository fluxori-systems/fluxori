"use client";

import React from "react";

import {
  Card,
  Text,
  Group,
  Stack,
  Badge,
  List,
  ThemeIcon,
  Grid,
  Paper,
  Progress,
  Accordion,
  Divider,
  Title,
  Avatar,
  Table,
} from "@mantine/core";

import {
  IconCheck,
  IconArrowUp,
  IconArrowDown,
  IconEqual,
  IconStar,
  IconAlertCircle,
  IconCoin,
  IconClockHour8,
  IconListCheck,
} from "@tabler/icons-react";

import { AnalysisType, TimeFrame, PriorityLevel } from "./StrategyForm";

// Impact and difficulty levels
export type ImpactLevel = "high" | "medium" | "low";
export type DifficultyLevel = "high" | "medium" | "low";
export type PricePosition = "premium" | "competitive" | "budget" | "mixed";

// Marketplace insight data structure
export interface MarketplaceInsight {
  marketplace: string;
  logo?: string;
  pricePosition: PricePosition;
  competitiveness: number;
  opportunity: number;
  dominantCategories: string[];
  trendingCategories: string[];
  keyFindings: string[];
}

// Opportunity data structure
export interface MarketplaceOpportunity {
  title: string;
  description: string;
  impact: ImpactLevel;
  difficulty: DifficultyLevel;
  timelineWeeks: number;
  potentialRevenueLift: string;
}

// Recommendation data structure
export interface MarketplaceRecommendation {
  title: string;
  items: string[];
}

// Report data structure
export interface StrategyReportData {
  summary: string;
  marketInsights: MarketplaceInsight[];
  opportunities: MarketplaceOpportunity[];
  recommendations: MarketplaceRecommendation[];
}

// Strategy data structure
export interface MarketplaceStrategy {
  id: string;
  marketplaces: string[];
  analysisType: AnalysisType;
  timeFrame: TimeFrame;
  createdAt: string | Date;
  completedAt?: string | Date;
  notes?: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  priorityLevel: PriorityLevel;
  report?: StrategyReportData;
}

interface StrategyReportProps {
  strategy: MarketplaceStrategy;
}

export function StrategyReport({ strategy }: StrategyReportProps) {
  const { report } = strategy;

  if (!report) {
    return (
      <Card withBorder p="xl">
        <Stack ta="center" gap="md">
          <IconAlertCircle size={48} color="gray" opacity={0.5} />
          <Text size="lg" c="dimmed">
            Report not available
          </Text>
          <Text c="dimmed" ta="center">
            This strategy is still in progress or doesn't have a completed
            report.
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap="xl">
      <Paper withBorder p="md">
        <Text size="xl" fw={600} mb="md">
          Executive Summary
        </Text>
        <Text>{report.summary}</Text>
      </Paper>

      <Title order={3}>Marketplace Insights</Title>

      <Grid>
        {report.marketInsights.map((insight, index) => (
          <Grid.Col key={index} span={{ md: 6 }}>
            <Card withBorder>
              <Group justify="apart" mb="md">
                <Group>
                  <Avatar
                    src={insight.logo}
                    alt={insight.marketplace}
                    radius="xl"
                    size="md"
                  />
                  <Text fw={600} tt="capitalize">
                    {insight.marketplace}
                  </Text>
                </Group>
                <Badge variant="filled" size="lg">
                  {insight.pricePosition}
                </Badge>
              </Group>

              <Grid mb="md">
                <Grid.Col span={6}>
                  <Paper p="xs" withBorder>
                    <Text size="xs" c="dimmed">
                      Competitiveness
                    </Text>
                    <Group justify="apart" ta="center">
                      <Text size="xl" fw={600}>
                        {insight.competitiveness}%
                      </Text>
                      <ThemeIcon
                        size="md"
                        radius="xl"
                        color={
                          insight.competitiveness > 75
                            ? "green"
                            : insight.competitiveness > 50
                              ? "yellow"
                              : "red"
                        }
                      >
                        {insight.competitiveness > 75 ? (
                          <IconArrowUp size={14} />
                        ) : insight.competitiveness > 50 ? (
                          <IconEqual size={14} />
                        ) : (
                          <IconArrowDown size={14} />
                        )}
                      </ThemeIcon>
                    </Group>
                    <Progress
                      value={insight.competitiveness}
                      color={
                        insight.competitiveness > 75
                          ? "green"
                          : insight.competitiveness > 50
                            ? "yellow"
                            : "red"
                      }
                      size="sm"
                      mt="xs"
                    />
                  </Paper>
                </Grid.Col>

                <Grid.Col span={6}>
                  <Paper p="xs" withBorder>
                    <Text size="xs" c="dimmed">
                      Opportunity
                    </Text>
                    <Group justify="apart" ta="center">
                      <Text size="xl" fw={600}>
                        {insight.opportunity}%
                      </Text>
                      <ThemeIcon
                        size="md"
                        radius="xl"
                        color={
                          insight.opportunity > 75
                            ? "green"
                            : insight.opportunity > 50
                              ? "yellow"
                              : "red"
                        }
                      >
                        <IconStar size={14} />
                      </ThemeIcon>
                    </Group>
                    <Progress
                      value={insight.opportunity}
                      color={
                        insight.opportunity > 75
                          ? "green"
                          : insight.opportunity > 50
                            ? "yellow"
                            : "red"
                      }
                      size="sm"
                      mt="xs"
                    />
                  </Paper>
                </Grid.Col>
              </Grid>

              <Text size="sm" fw={500} mb="xs">
                Dominant Categories
              </Text>
              <Group mb="md">
                {insight.dominantCategories.map((category, catIndex) => (
                  <Badge key={catIndex} size="sm">
                    {category}
                  </Badge>
                ))}
              </Group>

              <Text size="sm" fw={500} mb="xs">
                Trending Categories
              </Text>
              <Group mb="md">
                {insight.trendingCategories.map((category, catIndex) => (
                  <Badge key={catIndex} size="sm" color="green" variant="light">
                    {category}
                  </Badge>
                ))}
              </Group>

              <Text size="sm" fw={500} mb="xs">
                Key Findings
              </Text>
              <List spacing="xs" size="sm">
                {insight.keyFindings.map((finding, findingIndex) => (
                  <List.Item
                    key={findingIndex}
                    icon={
                      <ThemeIcon color="blue" size="sm" radius="xl">
                        <IconCheck size={12} />
                      </ThemeIcon>
                    }
                  >
                    {finding}
                  </List.Item>
                ))}
              </List>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Title order={3}>Opportunities</Title>

      <Grid>
        {report.opportunities.map((opportunity, index) => (
          <Grid.Col key={index} span={{ md: 4 }}>
            <Card withBorder h="100%">
              <Group justify="apart" mb="sm">
                <Text fw={600}>{opportunity.title}</Text>
                <Badge
                  color={
                    opportunity.impact === "high"
                      ? "green"
                      : opportunity.impact === "medium"
                        ? "yellow"
                        : "blue"
                  }
                >
                  {opportunity.impact.toUpperCase()} IMPACT
                </Badge>
              </Group>

              <Text size="sm" mb="md">
                {opportunity.description}
              </Text>

              <Divider my="sm" />

              <Group justify="apart">
                <Group gap="xs">
                  <IconClockHour8 size={16} />
                  <Text size="sm">{opportunity.timelineWeeks} weeks</Text>
                </Group>

                <Group gap="xs">
                  <IconCoin size={16} />
                  <Text size="sm">{opportunity.potentialRevenueLift} lift</Text>
                </Group>

                <Badge
                  variant="outline"
                  color={
                    opportunity.difficulty === "low"
                      ? "green"
                      : opportunity.difficulty === "medium"
                        ? "yellow"
                        : "red"
                  }
                >
                  {opportunity.difficulty} difficulty
                </Badge>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Title order={3}>Recommendations</Title>

      <Accordion>
        {report.recommendations.map((recommendation, index) => (
          <Accordion.Item key={index} value={recommendation.title}>
            <Accordion.Control>
              <Group>
                <IconListCheck size={20} />
                <Text>{recommendation.title}</Text>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <List spacing="sm">
                {recommendation.items.map((item, itemIndex) => (
                  <List.Item
                    key={itemIndex}
                    icon={
                      <ThemeIcon color="blue" size="md" radius="xl">
                        <IconCheck size={14} />
                      </ThemeIcon>
                    }
                  >
                    <Text>{item}</Text>
                  </List.Item>
                ))}
              </List>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>

      <Paper withBorder p="md">
        <Text fw={500} mb="md">
          Request Details
        </Text>
        <Table>
          <tbody>
            <tr>
              <td>
                <Text fw={500}>Analysis Type</Text>
              </td>
              <td>
                <Text tt="capitalize">{strategy.analysisType}</Text>
              </td>
            </tr>
            <tr>
              <td>
                <Text fw={500}>Marketplaces</Text>
              </td>
              <td>
                <Group gap="xs">
                  {strategy.marketplaces.map((marketplace, index) => (
                    <Badge key={index}>{marketplace}</Badge>
                  ))}
                </Group>
              </td>
            </tr>
            <tr>
              <td>
                <Text fw={500}>Time Frame</Text>
              </td>
              <td>
                <Text>{strategy.timeFrame}</Text>
              </td>
            </tr>
            <tr>
              <td>
                <Text fw={500}>Created</Text>
              </td>
              <td>
                <Text>{new Date(strategy.createdAt).toLocaleDateString()}</Text>
              </td>
            </tr>
            {strategy.completedAt && (
              <tr>
                <td>
                  <Text fw={500}>Completed</Text>
                </td>
                <td>
                  <Text>
                    {new Date(strategy.completedAt).toLocaleDateString()}
                  </Text>
                </td>
              </tr>
            )}
            {strategy.notes && (
              <tr>
                <td>
                  <Text fw={500}>Notes</Text>
                </td>
                <td>
                  <Text>{strategy.notes}</Text>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Paper>
    </Stack>
  );
}
