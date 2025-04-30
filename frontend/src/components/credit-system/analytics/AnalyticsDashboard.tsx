"use client";

import React, { useState } from "react";

import {
  Container,
  Title,
  Group,
  Card,
  Text,
  Paper,
  Tabs,
  Select,
  Button,
  Loader,
  Stack,
  Badge,
  Grid,
  Center,
  Divider,
  Alert,
  Accordion,
  List,
} from "@mantine/core";

import {
  IconChartLine,
  IconBuildingStore,
  IconCalendarStats,
  IconChartBar,
  IconSearch,
  IconAlertTriangle,
  IconBolt,
  IconCreditCard,
  IconShoppingCart,
  IconCalendarEvent,
} from "@tabler/icons-react";

import { CompetitionAnalysisChart } from "./CompetitionAnalysisChart";
import { KeywordAnalytics } from "./KeywordAnalytics";
import { KeywordAnalyticsForm } from "./KeywordAnalyticsForm";
import { MarketShareChart } from "./MarketShareChart";
import { SeasonalityChart } from "./SeasonalityChart";
import { TrendPredictionChart } from "./TrendPredictionChart";
import { KeywordAnalyticsData } from "../../../types/analytics.types";

export function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] =
    useState<KeywordAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("market-share");
  const [saTabs, setSATabs] = useState<string | null>("load-shedding");

  // Simulate loading analytics data
  const handleAnalyticsRequest = async (
    keyword: string,
    marketplace: string,
    options: any,
  ) => {
    setLoading(true);
    try {
      // In a real application, we would make an API call here
      // For now, we'll simulate a delay and use mock data
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Since this is simulated, we'll just set analytics data to the result
      // from the KeywordAnalytics component
      // No action needed here as the KeywordAnalytics component will call the callback
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Callback for when a keyword is selected in the KeywordAnalytics component
  const handleKeywordSelected = (data: KeywordAnalyticsData) => {
    setAnalyticsData(data);
    // Auto-switch to first tab
    setActiveTab("market-share");
  };

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="xl">Advanced Keyword Analytics</Title>
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KeywordAnalytics onKeywordSelected={handleKeywordSelected} />
          {analyticsData && (
            <Card withBorder mt="md">
              <Title order={4} mb="md">Analytics Summary</Title>
              <Stack gap="xs">
                <Group justify="apart">
                  <Text>Keyword:</Text>
                  <Text fw={700}>{analyticsData.keyword}</Text>
                </Group>
                <Group justify="apart">
                  <Text>Marketplace:</Text>
                  <Text fw={700}>{analyticsData.marketplace}</Text>
                </Group>
                <Group justify="apart">
                  <Text>Search Volume:</Text>
                  <Text fw={700}>{analyticsData.searchVolume.toLocaleString()}</Text>
                </Group>
              </Stack>
              <Divider my="md" />
              <Title order={5} mb="xs">Competition Analysis</Title>
              <Group>
                <Text>Difficulty:</Text>
                <Badge c={analyticsData.competitionAnalysis?.difficulty !== undefined && analyticsData.competitionAnalysis?.difficulty > 70 ? "red" : analyticsData.competitionAnalysis?.difficulty !== undefined && analyticsData.competitionAnalysis?.difficulty > 40 ? "yellow" : "green"}>
                  {analyticsData.competitionAnalysis?.difficulty ?? "-"} / 100
                </Badge>
              </Group>
              <Group>
                <Text>Saturation:</Text>
                <Badge c={analyticsData.competitionAnalysis?.saturationLevel !== undefined && analyticsData.competitionAnalysis?.saturationLevel > 70 ? "red" : analyticsData.competitionAnalysis?.saturationLevel !== undefined && analyticsData.competitionAnalysis?.saturationLevel > 40 ? "yellow" : "green"}>
                  {analyticsData.competitionAnalysis?.saturationLevel ?? "-"} / 100
                </Badge>
              </Group>
              <Group>
                <Text>Opportunity:</Text>
                <Badge c={analyticsData.competitionAnalysis?.opportunityScore !== undefined && analyticsData.competitionAnalysis?.opportunityScore > 70 ? "green" : analyticsData.competitionAnalysis?.opportunityScore !== undefined && analyticsData.competitionAnalysis?.opportunityScore > 40 ? "yellow" : "red"}>
                  {analyticsData.competitionAnalysis?.opportunityScore ?? "-"} / 100
                </Badge>
              </Group>
              <Divider my="md" />
              <Title order={5} mb="xs">Trend Prediction</Title>
              <Group>
                <Text>Growth:</Text>
                <Badge c={analyticsData.trendPrediction?.predictedGrowth !== undefined && analyticsData.trendPrediction?.predictedGrowth > 0 ? "green" : "red"}>
                  {analyticsData.trendPrediction?.predictedGrowth !== undefined && analyticsData.trendPrediction?.predictedGrowth > 0 ? "+" : ""}
                  {analyticsData.trendPrediction?.predictedGrowth !== undefined ? analyticsData.trendPrediction.predictedGrowth.toFixed(1) : "-"}%
                </Badge>
              </Group>
              <Group>
                <Text>Trend:</Text>
                <Badge c={analyticsData.trendPrediction?.trendDirection === "rising" ? "green" : analyticsData.trendPrediction?.trendDirection === "stable" ? "blue" : "red"}>
                  {analyticsData.trendPrediction?.trendDirection?.toUpperCase() ?? "-"}
                </Badge>
              </Group>
              <Group>
                <Text>Confidence:</Text>
                <Badge c={analyticsData.trendPrediction?.confidence !== undefined && analyticsData.trendPrediction?.confidence > 70 ? "green" : analyticsData.trendPrediction?.confidence !== undefined && analyticsData.trendPrediction?.confidence > 40 ? "blue" : "yellow"}>
                  {analyticsData.trendPrediction?.confidence ?? "-"}%
                </Badge>
              </Group>
              <Divider my="md" />
              <Title order={5} mb="xs">South African Market</Title>
              <Group>
                <Text>Load Shedding Impact:</Text>
                <Badge c={analyticsData.saMarketInsights.loadSheddingImpact.searchVolume === "increases" ? "green" : "red"}>
                  {analyticsData.saMarketInsights.loadSheddingImpact.searchVolume.toUpperCase()}
                </Badge>
              </Group>
              <Group>
                <Text>Next event:</Text>
                <Badge>{analyticsData.saMarketInsights.relevantEvents[0].event}</Badge>
              </Group>
              <Group>
                <Text>Local advantage:</Text>
                <Badge c="blue">
                  {analyticsData.saMarketInsights.localCompetitors.advantage.includes("higher") ? "POSITIVE" : "NEUTRAL"}
                </Badge>
              </Group>
            </Card>
          )}
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          {loading && (
            <Card withBorder p="xl">
              <Center p="xl">
                <Stack gap="md" ta="center">
                  <Loader size="xl" />
                  <Text size="lg">Analyzing keyword data...</Text>
                  <Text color="dimmed">This may take a few moments</Text>
                </Stack>
              </Center>
            </Card>
          )}
          {analyticsData && !loading && (
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="market-share" leftSection={<IconBuildingStore size={16} />}>Market Share</Tabs.Tab>
                <Tabs.Tab value="seasonality" leftSection={<IconCalendarStats size={16} />}>Seasonality</Tabs.Tab>
                <Tabs.Tab value="competition" leftSection={<IconChartBar size={16} />}>Competition</Tabs.Tab>
                <Tabs.Tab value="trends" leftSection={<IconChartLine size={16} />}>Trends</Tabs.Tab>
                <Tabs.Tab value="sa-market" leftSection={<IconBolt size={16} />}>South African Market</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="market-share" pt="md">
                <Card withBorder p="md">
                  <Title order={3} mb="md">Market Share Analysis</Title>
                  <Grid>
                    <Grid.Col span={{ base: 6 }}>
                      <Title order={5} mb="xs">Brand Distribution</Title>
                      <Paper p="md" withBorder>
                        <MarketShareChart data={analyticsData.marketShareData} />
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={{ base: 6 }}>
                      <Title order={5} mb="xs">Price Distribution</Title>
                      <Paper p="md" withBorder>
                        <Stack gap="xs">
                          {analyticsData.marketShareData.priceDistribution.priceRanges.map((range: { range: string; count: number; percentage: number }, index: number) => (
                            <Group key={index} justify="apart">
                              <Text>{range.range} ZAR</Text>
                              <Group gap="xs">
                                <Text>{range.count} products</Text>
                                <Badge>{range.percentage}%</Badge>
                              </Group>
                            </Group>
                          ))}
                        </Stack>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={{ base: 6 }}>
                      <Title order={5} mb="xs">Top Brands by Market Share</Title>
                      <Stack gap="md">
                        {analyticsData.marketShareData.dominantBrands.map((brand: { brandName: string; marketSharePercent: number; productCount: number; averageRanking: number }, index: number) => (
                          <Card key={index} withBorder p="sm">
                            <Group justify="apart">
                              <Group>
                                <Badge size="lg" variant="filled" c={index < 3 ? "blue" : "gray"}>#{index + 1}</Badge>
                                <Text fw={500}>{brand.brandName}</Text>
                              </Group>
                              <Badge size="lg">{brand.marketSharePercent.toFixed(1)}%</Badge>
                            </Group>
                            <Group mt="xs">
                              <Text size="sm">{brand.productCount} products</Text>
                              <Text size="sm">Avg. Rating: {brand.averageRanking.toFixed(1)}/5</Text>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                      <Title order={5} mb="xs">Top Competitors</Title>
                      <Stack gap="md">
                        {analyticsData.competitionAnalysis?.topCompetitors?.map((competitor: { brandName: string; dominance: number; productCount: number; averageRanking: number; averagePrice: number }, index: number) => (
                          <Card key={index} withBorder p="sm">
                            <Group justify="apart">
                              <Group>
                                <Badge size="lg" variant="filled" c={index === 0 ? "gold" : index === 1 ? "silver" : "bronze"}>#{index + 1}</Badge>
                                <Text fw={700}>{competitor.brandName}</Text>
                              </Group>
                              <Badge size="lg">Dominance: {competitor.dominance}/100</Badge>
                            </Group>
                            <Grid mt="md">
                              <Grid.Col span={{ base: 3 }}>
                                <Text size="sm" color="dimmed">Products:</Text>
                                <Text>{competitor.productCount}</Text>
                              </Grid.Col>
                              <Grid.Col span={{ base: 3 }}>
                                <Text size="sm" color="dimmed">Avg. Rating:</Text>
                                <Text>{competitor.averageRanking.toFixed(1)}/5</Text>
                              </Grid.Col>
                              <Grid.Col span={{ base: 3 }}>
                                <Text size="sm" color="dimmed">Avg. Price:</Text>
                                <Text>R{competitor.averagePrice.toLocaleString()}</Text>
                              </Grid.Col>
                            </Grid>
                          </Card>
                        ))}
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Card>
              </Tabs.Panel>
              {/* Add other Tabs.Panel sections here, each closed properly */}
            </Tabs>
          )}
        </Grid.Col>
      </Grid>
    </Container>
  );
}
