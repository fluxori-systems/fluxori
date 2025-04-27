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
      <Title order={2} mb="xl">
        Advanced Keyword Analytics
      </Title>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KeywordAnalytics onKeywordSelected={handleKeywordSelected} />

          {analyticsData && (
            <>
              <Card withBorder mt="md">
                <Title order={4} mb="md">
                  Analytics Summary
                </Title>

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
                    <Text fw={700}>
                      {analyticsData.searchVolume.toLocaleString()}
                    </Text>
                  </Group>
                </Stack>

                <Divider my="md" />

                <Title order={5} mb="xs">
                  Competition Analysis
                </Title>
                <Group>
                  <Text>Difficulty:</Text>
                  <Badge
                    c={
                      analyticsData.competitionAnalysis.difficulty > 70
                        ? "red"
                        : analyticsData.competitionAnalysis.difficulty > 40
                          ? "yellow"
                          : "green"
                    }
                  >
                    {analyticsData.competitionAnalysis.difficulty}/100
                  </Badge>
                </Group>
                <Group>
                  <Text>Saturation:</Text>
                  <Badge
                    c={
                      analyticsData.competitionAnalysis.saturationLevel > 70
                        ? "red"
                        : analyticsData.competitionAnalysis.saturationLevel > 40
                          ? "yellow"
                          : "green"
                    }
                  >
                    {analyticsData.competitionAnalysis.saturationLevel}/100
                  </Badge>
                </Group>
                <Group>
                  <Text>Opportunity:</Text>
                  <Badge
                    c={
                      analyticsData.competitionAnalysis.opportunityScore > 70
                        ? "green"
                        : analyticsData.competitionAnalysis.opportunityScore >
                            40
                          ? "yellow"
                          : "red"
                    }
                  >
                    {analyticsData.competitionAnalysis.opportunityScore}/100
                  </Badge>
                </Group>

                <Divider my="md" />

                <Title order={5} mb="xs">
                  Trend Prediction
                </Title>
                <Group>
                  <Text>Growth:</Text>
                  <Badge
                    c={
                      analyticsData.trendPrediction.predictedGrowth > 0
                        ? "green"
                        : "red"
                    }
                  >
                    {analyticsData.trendPrediction.predictedGrowth > 0
                      ? "+"
                      : ""}
                    {analyticsData.trendPrediction.predictedGrowth.toFixed(1)}%
                  </Badge>
                </Group>
                <Group>
                  <Text>Trend:</Text>
                  <Badge
                    c={
                      analyticsData.trendPrediction.trendDirection === "rising"
                        ? "green"
                        : analyticsData.trendPrediction.trendDirection ===
                            "stable"
                          ? "blue"
                          : "red"
                    }
                  >
                    {analyticsData.trendPrediction.trendDirection.toUpperCase()}
                  </Badge>
                </Group>
                <Group>
                  <Text>Confidence:</Text>
                  <Badge
                    c={
                      analyticsData.trendPrediction.confidence > 70
                        ? "green"
                        : analyticsData.trendPrediction.confidence > 40
                          ? "blue"
                          : "yellow"
                    }
                  >
                    {analyticsData.trendPrediction.confidence}%
                  </Badge>
                </Group>

                <Divider my="md" />

                <Title order={5} mb="xs">
                  South African Market
                </Title>
                <Group>
                  <Text>Load Shedding Impact:</Text>
                  <Badge
                    c={
                      analyticsData.saMarketInsights.loadSheddingImpact
                        .searchVolume === "increases"
                        ? "green"
                        : "red"
                    }
                  >
                    {analyticsData.saMarketInsights.loadSheddingImpact.searchVolume.toUpperCase()}
                  </Badge>
                </Group>
                <Group>
                  <Text>Next event:</Text>
                  <Badge>
                    {analyticsData.saMarketInsights.relevantEvents[0].event}
                  </Badge>
                </Group>
                <Group>
                  <Text>Local advantage:</Text>
                  <Badge c="blue">
                    {analyticsData.saMarketInsights.localCompetitors.advantage.includes(
                      "higher",
                    )
                      ? "POSITIVE"
                      : "NEUTRAL"}
                  </Badge>
                </Group>
              </Card>
            </>
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
            <>
              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                  <Tabs.Tab
                    value="market-share"
                    leftSection={<IconBuildingStore size={16} />}
                  >
                    Market Share
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="seasonality"
                    leftSection={<IconCalendarStats size={16} />}
                  >
                    Seasonality
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="competition"
                    leftSection={<IconChartBar size={16} />}
                  >
                    Competition
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="trends"
                    leftSection={<IconChartLine size={16} />}
                  >
                    Trends
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="sa-market"
                    leftSection={<IconBolt size={16} />}
                  >
                    South African Market
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="market-share" pt="md">
                  <Card withBorder p="md">
                    <Title order={3} mb="md">
                      Market Share Analysis
                    </Title>

                    <Grid>
                      <Grid.Col span={{ base: 6 }}>
                        <Title order={5} mb="xs">
                          Brand Distribution
                        </Title>
                        <Paper p="md" withBorder>
                          <MarketShareChart
                            data={analyticsData.marketShareData}
                          />
                        </Paper>
                      </Grid.Col>

                      <Grid.Col span={{ base: 6 }}>
                        <Title order={5} mb="xs">
                          Price Distribution
                        </Title>
                        <Paper p="md" withBorder>
                          <Stack gap="xs">
                            {analyticsData.marketShareData.priceDistribution.priceRanges.map(
                              (range, index) => (
                                <Group key={index} justify="apart">
                                  <Text>{range.range} ZAR</Text>
                                  <Group gap="xs">
                                    <Text>{range.count} products</Text>
                                    <Badge>{range.percentage}%</Badge>
                                  </Group>
                                </Group>
                              ),
                            )}
                          </Stack>
                        </Paper>
                      </Grid.Col>
                    </Grid>

                    <Divider my="md" />

                    <Accordion>
                      <Accordion.Item value="brands">
                        <Accordion.Control>
                          Top Brands by Market Share
                        </Accordion.Control>
                        <Accordion.Panel>
                          <Stack gap="md">
                            {analyticsData.marketShareData.dominantBrands.map(
                              (brand, index) => (
                                <Card key={index} withBorder p="sm">
                                  <Group justify="apart">
                                    <Group>
                                      <Badge
                                        size="lg"
                                        variant="filled"
                                        c={index < 3 ? "blue" : "gray"}
                                      >
                                        #{index + 1}
                                      </Badge>
                                      <Text fw={500}>{brand.brandName}</Text>
                                    </Group>
                                    <Badge size="lg">
                                      {brand.marketSharePercent.toFixed(1)}%
                                    </Badge>
                                  </Group>
                                  <Group mt="xs">
                                    <Text size="sm">
                                      {brand.productCount} products
                                    </Text>
                                    <Text size="sm">
                                      Avg. Rating:{" "}
                                      {brand.averageRanking.toFixed(1)}/5
                                    </Text>
                                  </Group>
                                </Card>
                              ),
                            )}
                          </Stack>
                        </Accordion.Panel>
                      </Accordion.Item>

                      <Accordion.Item value="pricing">
                        <Accordion.Control>Pricing Analysis</Accordion.Control>
                        <Accordion.Panel>
                          <Stack gap="md">
                            <Group>
                              <Card withBorder p="sm" style={{ flex: 1 }}>
                                <Text color="dimmed" size="sm">
                                  Min Price
                                </Text>
                                <Text size="xl" fw={700}>
                                  R
                                  {analyticsData.marketShareData.priceDistribution.minPrice.toLocaleString()}
                                </Text>
                              </Card>

                              <Card withBorder p="sm" style={{ flex: 1 }}>
                                <Text color="dimmed" size="sm">
                                  Max Price
                                </Text>
                                <Text size="xl" fw={700}>
                                  R
                                  {analyticsData.marketShareData.priceDistribution.maxPrice.toLocaleString()}
                                </Text>
                              </Card>

                              <Card withBorder p="sm" style={{ flex: 1 }}>
                                <Text color="dimmed" size="sm">
                                  Average Price
                                </Text>
                                <Text size="xl" fw={700}>
                                  R
                                  {analyticsData.marketShareData.priceDistribution.averagePrice.toLocaleString()}
                                </Text>
                              </Card>

                              <Card withBorder p="sm" style={{ flex: 1 }}>
                                <Text color="dimmed" size="sm">
                                  Median Price
                                </Text>
                                <Text size="xl" fw={700}>
                                  R
                                  {analyticsData.marketShareData.priceDistribution.medianPrice.toLocaleString()}
                                </Text>
                              </Card>
                            </Group>
                          </Stack>
                        </Accordion.Panel>
                      </Accordion.Item>
                    </Accordion>
                  </Card>
                </Tabs.Panel>

                <Tabs.Panel value="seasonality" pt="md">
                  <Card withBorder p="md">
                    <Title order={3} mb="md">
                      Seasonality Analysis
                    </Title>

                    <Grid>
                      <Grid.Col span={{ base: 12, md: 8 }}>
                        <Title order={5} mb="xs">
                          Monthly Search Volume Trends
                        </Title>
                        <Paper p="md" withBorder>
                          <SeasonalityChart
                            data={analyticsData.seasonalityData}
                          />
                        </Paper>
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 4 }}>
                        <Title order={5} mb="xs">
                          Peak Season
                        </Title>
                        <Paper p="md" withBorder>
                          <Stack gap="md">
                            <Group>
                              <Text>Peak Score:</Text>
                              <Badge
                                size="lg"
                                c={
                                  analyticsData.seasonalityData.peakScore > 70
                                    ? "green"
                                    : analyticsData.seasonalityData.peakScore >
                                        40
                                      ? "blue"
                                      : "gray"
                                }
                              >
                                {analyticsData.seasonalityData.peakScore}/100
                              </Badge>
                            </Group>

                            <Text fw={500}>Peak Months:</Text>
                            <Group>
                              {analyticsData.seasonalityData.peakMonths.map(
                                (month, index) => (
                                  <Badge key={index} size="lg" variant="filled">
                                    {month}
                                  </Badge>
                                ),
                              )}
                            </Group>

                            <Text fw={500}>Seasonal Keywords:</Text>
                            <Group>
                              {analyticsData.seasonalityData.seasonalKeywords.map(
                                (keyword, index) => (
                                  <Badge
                                    key={index}
                                    size="lg"
                                    variant="light"
                                    c="teal"
                                  >
                                    {keyword}
                                  </Badge>
                                ),
                              )}
                            </Group>
                          </Stack>
                        </Paper>
                      </Grid.Col>
                    </Grid>

                    <Divider my="md" />

                    <Accordion>
                      <Accordion.Item value="quarterly">
                        <Accordion.Control>Quarterly Trends</Accordion.Control>
                        <Accordion.Panel>
                          <Grid>
                            {Object.entries(
                              analyticsData.seasonalityData.quarterlyTrends,
                            ).map(([quarter, value], index) => (
                              <Grid.Col key={index} span={{ base: 3 }}>
                                <Card withBorder p="sm">
                                  <Text fw={700} ta="center" size="xl">
                                    {quarter}
                                  </Text>
                                  <Text color="dimmed" ta="center">
                                    Multiplier
                                  </Text>
                                  <Badge
                                    size="lg"
                                    fullWidth
                                    mt="sm"
                                    c={
                                      value > 1
                                        ? "green"
                                        : value > 0.8
                                          ? "blue"
                                          : "red"
                                    }
                                  >
                                    {value.toFixed(2)}x
                                  </Badge>
                                </Card>
                              </Grid.Col>
                            ))}
                          </Grid>
                        </Accordion.Panel>
                      </Accordion.Item>

                      <Accordion.Item value="monthly">
                        <Accordion.Control>Monthly Trends</Accordion.Control>
                        <Accordion.Panel>
                          <Grid>
                            {Object.entries(
                              analyticsData.seasonalityData.monthlyTrends,
                            ).map(([month, value], index) => (
                              <Grid.Col key={index} span={{ base: 2 }}>
                                <Card withBorder p="sm">
                                  <Text fw={700} ta="center">
                                    {month}
                                  </Text>
                                  <Badge
                                    size="md"
                                    fullWidth
                                    mt="xs"
                                    c={
                                      value > 1
                                        ? "green"
                                        : value > 0.8
                                          ? "blue"
                                          : "red"
                                    }
                                  >
                                    {value.toFixed(2)}x
                                  </Badge>
                                </Card>
                              </Grid.Col>
                            ))}
                          </Grid>
                        </Accordion.Panel>
                      </Accordion.Item>
                    </Accordion>
                  </Card>
                </Tabs.Panel>

                <Tabs.Panel value="competition" pt="md">
                  <Card withBorder p="md">
                    <Title order={3} mb="md">
                      Competition Analysis
                    </Title>

                    <Grid>
                      <Grid.Col span={{ base: 12, md: 7 }}>
                        <Title order={5} mb="xs">
                          Competitive Landscape
                        </Title>
                        <Paper p="md" withBorder>
                          <CompetitionAnalysisChart
                            data={analyticsData.competitionAnalysis}
                          />
                        </Paper>
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 5 }}>
                        <Title order={5} mb="xs">
                          Competition Metrics
                        </Title>
                        <Paper p="md" withBorder>
                          <Stack gap="md">
                            <Group justify="apart">
                              <Text>Difficulty Score:</Text>
                              <Badge
                                size="lg"
                                c={
                                  analyticsData.competitionAnalysis.difficulty >
                                  70
                                    ? "red"
                                    : analyticsData.competitionAnalysis
                                          .difficulty > 40
                                      ? "yellow"
                                      : "green"
                                }
                              >
                                {analyticsData.competitionAnalysis.difficulty}
                                /100
                              </Badge>
                            </Group>

                            <Group justify="apart">
                              <Text>Market Saturation:</Text>
                              <Badge
                                size="lg"
                                c={
                                  analyticsData.competitionAnalysis
                                    .saturationLevel > 70
                                    ? "red"
                                    : analyticsData.competitionAnalysis
                                          .saturationLevel > 40
                                      ? "yellow"
                                      : "green"
                                }
                              >
                                {
                                  analyticsData.competitionAnalysis
                                    .saturationLevel
                                }
                                /100
                              </Badge>
                            </Group>

                            <Group justify="apart">
                              <Text>Entry Barrier:</Text>
                              <Badge
                                size="lg"
                                c={
                                  analyticsData.competitionAnalysis
                                    .entryBarrier === "high"
                                    ? "red"
                                    : analyticsData.competitionAnalysis
                                          .entryBarrier === "medium"
                                      ? "yellow"
                                      : "green"
                                }
                              >
                                {analyticsData.competitionAnalysis.entryBarrier.toUpperCase()}
                              </Badge>
                            </Group>

                            <Group justify="apart">
                              <Text>Opportunity Score:</Text>
                              <Badge
                                size="lg"
                                c={
                                  analyticsData.competitionAnalysis
                                    .opportunityScore > 70
                                    ? "green"
                                    : analyticsData.competitionAnalysis
                                          .opportunityScore > 40
                                      ? "blue"
                                      : "red"
                                }
                              >
                                {
                                  analyticsData.competitionAnalysis
                                    .opportunityScore
                                }
                                /100
                              </Badge>
                            </Group>
                          </Stack>
                        </Paper>
                      </Grid.Col>
                    </Grid>

                    <Divider my="md" />

                    <Title order={5} mb="xs">
                      Top Competitors
                    </Title>
                    <Stack gap="md">
                      {analyticsData.competitionAnalysis.topCompetitors.map(
                        (competitor, index) => (
                          <Card key={index} withBorder p="sm">
                            <Group justify="apart">
                              <Group>
                                <Badge
                                  size="lg"
                                  variant="filled"
                                  c={
                                    index === 0
                                      ? "gold"
                                      : index === 1
                                        ? "silver"
                                        : "bronze"
                                  }
                                >
                                  #{index + 1}
                                </Badge>
                                <Text fw={700}>{competitor.brandName}</Text>
                              </Group>
                              <Badge size="lg">
                                Dominance: {competitor.dominance}/100
                              </Badge>
                            </Group>

                            <Grid mt="md">
                              <Grid.Col span={{ base: 3 }}>
                                <Text size="sm" color="dimmed">
                                  Products:
                                </Text>
                                <Text>{competitor.productCount}</Text>
                              </Grid.Col>
                              <Grid.Col span={{ base: 3 }}>
                                <Text size="sm" color="dimmed">
                                  Avg. Rating:
                                </Text>
                                <Text>
                                  {competitor.averageRanking.toFixed(1)}/5
                                </Text>
                              </Grid.Col>
                              <Grid.Col span={{ base: 3 }}>
                                <Text size="sm" color="dimmed">
                                  Avg. Price:
                                </Text>
                                <Text>
                                  R{competitor.averagePrice.toLocaleString()}
                                </Text>
                              </Grid.Col>
                            </Grid>
                          </Card>
                        ),
                      )}
                    </Stack>
                  </Card>
                </Tabs.Panel>

                <Tabs.Panel value="trends" pt="md">
                  <Card withBorder p="md">
                    <Title order={3} mb="md">
                      Trend Prediction
                    </Title>

                    <Grid>
                      <Grid.Col span={{ base: 12, md: 8 }}>
                        <Title order={5} mb="xs">
                          Search Volume Forecast
                        </Title>
                        <Paper p="md" withBorder>
                          <TrendPredictionChart
                            data={analyticsData.trendPrediction}
                          />
                        </Paper>
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 4 }}>
                        <Title order={5} mb="xs">
                          Forecast Metrics
                        </Title>
                        <Paper p="md" withBorder>
                          <Stack gap="md">
                            <Group justify="apart">
                              <Text>Trend Direction:</Text>
                              <Badge
                                size="lg"
                                c={
                                  analyticsData.trendPrediction
                                    .trendDirection === "rising"
                                    ? "green"
                                    : analyticsData.trendPrediction
                                          .trendDirection === "stable"
                                      ? "blue"
                                      : "red"
                                }
                              >
                                {analyticsData.trendPrediction.trendDirection.toUpperCase()}
                              </Badge>
                            </Group>

                            <Group justify="apart">
                              <Text>Predicted Growth:</Text>
                              <Badge
                                size="lg"
                                c={
                                  analyticsData.trendPrediction
                                    .predictedGrowth > 10
                                    ? "green"
                                    : analyticsData.trendPrediction
                                          .predictedGrowth > 0
                                      ? "blue"
                                      : "red"
                                }
                              >
                                {analyticsData.trendPrediction.predictedGrowth >
                                0
                                  ? "+"
                                  : ""}
                                {analyticsData.trendPrediction.predictedGrowth.toFixed(
                                  1,
                                )}
                                %
                              </Badge>
                            </Group>

                            <Group justify="apart">
                              <Text>Confidence Score:</Text>
                              <Badge
                                size="lg"
                                c={
                                  analyticsData.trendPrediction.confidence > 70
                                    ? "green"
                                    : analyticsData.trendPrediction.confidence >
                                        40
                                      ? "blue"
                                      : "yellow"
                                }
                              >
                                {analyticsData.trendPrediction.confidence}%
                              </Badge>
                            </Group>
                          </Stack>
                        </Paper>
                      </Grid.Col>
                    </Grid>

                    <Divider my="md" />

                    <Title order={5} mb="xs">
                      Next Three Months Forecast
                    </Title>
                    <Grid>
                      {analyticsData.trendPrediction.nextThreeMonths.map(
                        (forecast, index) => (
                          <Grid.Col key={index} span={{ base: 12, md: 4 }}>
                            <Card withBorder p="md">
                              <Text fw={700} ta="center">
                                {forecast.month}
                              </Text>
                              <Text size="xl" fw={700} ta="center" mt="xs">
                                {forecast.predictedVolume.toLocaleString()}
                              </Text>
                              <Text color="dimmed" size="sm" ta="center">
                                Estimated searches
                              </Text>

                              <Divider my="sm" />

                              <Group justify="apart">
                                <Text size="sm">Ranking Difficulty:</Text>
                                <Badge
                                  c={
                                    forecast.predictedRankingDifficulty > 8
                                      ? "red"
                                      : forecast.predictedRankingDifficulty > 5
                                        ? "yellow"
                                        : "green"
                                  }
                                >
                                  {forecast.predictedRankingDifficulty.toFixed(
                                    1,
                                  )}
                                  /10
                                </Badge>
                              </Group>
                            </Card>
                          </Grid.Col>
                        ),
                      )}
                    </Grid>
                  </Card>
                </Tabs.Panel>

                <Tabs.Panel value="sa-market" pt="md">
                  <Card withBorder p="md">
                    <Title order={3} mb="md">
                      South African Market Insights
                    </Title>

                    <Tabs value={saTabs} onChange={setSATabs}>
                      <Tabs.List>
                        <Tabs.Tab
                          value="load-shedding"
                          leftSection={<IconBolt size={16} />}
                        >
                          Load Shedding Impact
                        </Tabs.Tab>
                        <Tabs.Tab
                          value="local-events"
                          leftSection={<IconCalendarEvent size={16} />}
                        >
                          Local Events
                        </Tabs.Tab>
                        <Tabs.Tab
                          value="local-competition"
                          leftSection={<IconShoppingCart size={16} />}
                        >
                          Local Competition
                        </Tabs.Tab>
                      </Tabs.List>

                      <Tabs.Panel value="load-shedding" pt="md">
                        <Paper p="md" withBorder>
                          <Group justify="apart">
                            <Text fw={700}>
                              Load Shedding Impact on Search Volume:
                            </Text>
                            <Badge
                              size="lg"
                              c={
                                analyticsData.saMarketInsights
                                  .loadSheddingImpact.searchVolume ===
                                "increases"
                                  ? "green"
                                  : "red"
                              }
                            >
                              {analyticsData.saMarketInsights.loadSheddingImpact.searchVolume.toUpperCase()}
                            </Badge>
                          </Group>

                          <Text mt="md" fw={500}>
                            Related Terms:
                          </Text>
                          <Group mt="xs">
                            {analyticsData.saMarketInsights.loadSheddingImpact.relatedTerms.map(
                              (term, index) => (
                                <Badge key={index} size="lg">
                                  {term}
                                </Badge>
                              ),
                            )}
                          </Group>

                          <Text mt="md" fw={500}>
                            Peak Hours:
                          </Text>
                          <Text mt="xs">
                            {
                              analyticsData.saMarketInsights.loadSheddingImpact
                                .peakHours
                            }
                          </Text>
                        </Paper>
                      </Tabs.Panel>

                      <Tabs.Panel value="local-events" pt="md">
                        <Paper p="md" withBorder>
                          <Title order={5} mb="md">
                            Key South African Events
                          </Title>

                          <Stack gap="md">
                            {analyticsData.saMarketInsights.relevantEvents.map(
                              (event, index) => (
                                <Card key={index} withBorder p="sm">
                                  <Group justify="apart">
                                    <Badge size="lg">{event.month}</Badge>
                                    <Text fw={500}>{event.event}</Text>
                                  </Group>
                                </Card>
                              ),
                            )}
                          </Stack>
                        </Paper>
                      </Tabs.Panel>

                      <Tabs.Panel value="local-competition" pt="md">
                        <Paper p="md" withBorder>
                          <Title order={5} mb="md">
                            Local Competition Insights
                          </Title>

                          <Stack gap="md">
                            <Card withBorder p="md">
                              <Text fw={500}>Local Brand Advantage:</Text>
                              <Text mt="xs">
                                {
                                  analyticsData.saMarketInsights
                                    .localCompetitors.advantage
                                }
                              </Text>
                            </Card>

                            <Card withBorder p="md">
                              <Text fw={500}>Pricing Impact:</Text>
                              <Text mt="xs">
                                {
                                  analyticsData.saMarketInsights
                                    .localCompetitors.pricingImpact
                                }
                              </Text>
                            </Card>
                          </Stack>
                        </Paper>
                      </Tabs.Panel>
                    </Tabs>
                  </Card>
                </Tabs.Panel>
              </Tabs>
            </>
          )}
        </Grid.Col>
      </Grid>
    </Container>
  );
}
