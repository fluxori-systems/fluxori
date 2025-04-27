"use client";

import React, { useState, useEffect } from "react";

import {
  Box,
  Card,
  Tabs,
  Text,
  Title,
  Group,
  Badge,
  Button,
  Select,
  Checkbox,
  TextInput,
  Loader,
  Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";

import {
  IconSearch,
  IconChartBar,
  IconGrowth,
  IconCalendarTime,
  IconAlertTriangle,
} from "@tabler/icons-react";

import { KeywordAnalyticsData } from "../../../types/analytics.types";
import { NetworkAwareBarChart } from "../../charts/NetworkAwareBarChart";
import { NetworkAwareLineChart } from "../../charts/NetworkAwareLineChart";
import { NetworkAwarePieChart } from "../../charts/NetworkAwarePieChart";

// API client (mock implementation)
const api = {
  generateAnalytics: async (data: any): Promise<KeywordAnalyticsData> => {
    // Mock API call
    console.log("Generating analytics for:", data);
    return mockAnalyticsData;
  },
  getPopularKeywords: async (marketplace: string): Promise<string[]> => {
    console.log("Getting popular keywords for:", marketplace);
    return mockPopularKeywords;
  },
  getTrendingKeywords: async (marketplace: string): Promise<string[]> => {
    console.log("Getting trending keywords for:", marketplace);
    return mockTrendingKeywords;
  },
  getSeasonalKeywords: async (marketplace: string): Promise<string[]> => {
    console.log("Getting seasonal keywords for:", marketplace);
    return mockSeasonalKeywords;
  },
};

// Mock data
const mockAnalyticsData: KeywordAnalyticsData = {
  keyword: "smartphone",
  marketplace: "takealot",
  searchVolume: 12500,
  searchVolumeHistory: [
    { period: "Jan 2023", volume: 10000 },
    { period: "Feb 2023", volume: 11000 },
    { period: "Mar 2023", volume: 10500 },
    { period: "Apr 2023", volume: 12000 },
    { period: "May 2023", volume: 13000 },
    { period: "Jun 2023", volume: 11500 },
    { period: "Jul 2023", volume: 12500 },
    { period: "Aug 2023", volume: 13500 },
    { period: "Sep 2023", volume: 14000 },
    { period: "Oct 2023", volume: 15000 },
    { period: "Nov 2023", volume: 18000 },
    { period: "Dec 2023", volume: 16000 },
  ],
  seasonalityData: {
    quarterlyTrends: {
      Q1: 0.85,
      Q2: 0.93,
      Q3: 1.02,
      Q4: 1.2,
    },
    monthlyTrends: {
      Jan: 0.85,
      Feb: 0.9,
      Mar: 0.87,
      Apr: 0.92,
      May: 0.95,
      Jun: 0.9,
      Jul: 0.98,
      Aug: 1.05,
      Sep: 1.12,
      Oct: 1.15,
      Nov: 1.35,
      Dec: 1.2,
    },
    seasonalKeywords: [
      "smartphone deals",
      "smartphone black friday",
      "best smartphone",
    ],
    peakMonths: ["November", "December"],
    peakScore: 85,
  },
  marketShareData: {
    totalProductCount: 850,
    dominantBrands: [
      {
        brandName: "Samsung",
        productCount: 150,
        averageRanking: 4.2,
        marketSharePercent: 32.5,
      },
      {
        brandName: "Apple",
        productCount: 75,
        averageRanking: 4.5,
        marketSharePercent: 22.8,
      },
      {
        brandName: "Huawei",
        productCount: 60,
        averageRanking: 4.0,
        marketSharePercent: 15.3,
      },
      {
        brandName: "Xiaomi",
        productCount: 45,
        averageRanking: 3.8,
        marketSharePercent: 10.2,
      },
      {
        brandName: "Other",
        productCount: 520,
        averageRanking: 3.2,
        marketSharePercent: 19.2,
      },
    ],
    priceDistribution: {
      minPrice: 1200,
      maxPrice: 39999,
      averagePrice: 8500,
      medianPrice: 7200,
      priceRanges: [
        {
          range: "0-5000",
          count: 320,
          percentage: 37.6,
        },
        {
          range: "5001-10000",
          count: 280,
          percentage: 32.9,
        },
        {
          range: "10001-20000",
          count: 175,
          percentage: 20.6,
        },
        {
          range: "20001+",
          count: 75,
          percentage: 8.9,
        },
      ],
    },
  },
  competitionAnalysis: {
    difficulty: 75,
    topCompetitors: [
      {
        brandName: "Samsung",
        productCount: 150,
        averageRanking: 4.2,
        averagePrice: 9500,
        dominance: 72,
      },
      {
        brandName: "Apple",
        productCount: 75,
        averageRanking: 4.5,
        averagePrice: 18000,
        dominance: 68,
      },
      {
        brandName: "Huawei",
        productCount: 60,
        averageRanking: 4.0,
        averagePrice: 7500,
        dominance: 56,
      },
    ],
    saturationLevel: 82,
    entryBarrier: "high",
    opportunityScore: 45,
  },
  trendPrediction: {
    predictedVolume: [16500, 17000, 18000, 19000, 19500, 20000],
    predictedGrowth: 12.5,
    confidence: 75,
    nextThreeMonths: [
      {
        month: "Jan 2024",
        predictedVolume: 16500,
        predictedRankingDifficulty: 7.8,
      },
      {
        month: "Feb 2024",
        predictedVolume: 17000,
        predictedRankingDifficulty: 8.1,
      },
      {
        month: "Mar 2024",
        predictedVolume: 18000,
        predictedRankingDifficulty: 8.4,
      },
    ],
    trendDirection: "rising",
  },
  saMarketInsights: {
    relevantEvents: [
      { month: "November", event: "Black Friday - highest search volume" },
      { month: "January", event: "Back to School - high demand" },
      { month: "April", event: "Easter Weekend - search spike" },
    ],
    loadSheddingImpact: {
      searchVolume: "increases",
      relatedTerms: ["battery backup", "energy efficient", "load shedding"],
      peakHours: "Evening searches increase during load shedding periods",
    },
    localCompetitors: {
      advantage: "Local brands show 15% higher click-through rates",
      pricingImpact: "South African brands can command 5-10% price premium",
    },
  },
};

const mockPopularKeywords = [
  "smartphones",
  "samsung galaxy",
  "iphone 15",
  "xiaomi redmi",
  "smartphone deals",
  "cheap smartphones",
  "android phones",
  "high end smartphones",
  "budget smartphones",
  "phone accessories",
];

const mockTrendingKeywords = [
  "folding phones",
  "ai smartphones",
  "gaming phones",
  "long battery life phones",
  "camera phones",
  "best 5g phones",
  "dual sim phones",
  "south african smartphones",
  "load shedding friendly phones",
  "waterproof phones",
];

const mockSeasonalKeywords = [
  "black friday smartphone deals",
  "christmas phone gifts",
  "back to school phones",
  "winter smartphone deals",
  "smartphones cyber monday",
  "easter phone sale",
  "phones tax refund",
  "new year phone upgrade",
  "student phone deals",
  "holiday smartphones",
];

// Component interface
interface KeywordAnalyticsProps {
  onKeywordSelected?: (data: KeywordAnalyticsData) => void;
}

export function KeywordAnalytics({ onKeywordSelected }: KeywordAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<string | null>("search");
  const [activeSubTab, setActiveSubTab] = useState<string | null>("popular");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] =
    useState<KeywordAnalyticsData | null>(null);
  const [popularKeywords, setPopularKeywords] = useState<string[]>([]);
  const [trendingKeywords, setTrendingKeywords] = useState<string[]>([]);
  const [seasonalKeywords, setSeasonalKeywords] = useState<string[]>([]);

  const form = useForm({
    initialValues: {
      keyword: "",
      marketplace: "takealot",
      includeMarketShare: true,
      includeSeasonality: true,
      includeCompetitionAnalysis: true,
      includeTrendPrediction: true,
      includeGrowthOpportunities: true,
    },
    validate: {
      keyword: (value) => (value ? null : "Keyword is required"),
      marketplace: (value) => (value ? null : "Marketplace is required"),
    },
  });

  const handleKeywordSelect = (keyword: string) => {
    form.setFieldValue("keyword", keyword);
  };

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);

    try {
      // Make API call
      const data = await api.generateAnalytics(values);
      setAnalyticsData(data);

      // Call the callback if provided
      if (onKeywordSelected) {
        onKeywordSelected(data);
      }
    } catch (err) {
      console.error("Error generating analytics:", err);
      setError("Failed to generate analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadKeywords = async (
    marketplace: string,
    type: "popular" | "trending" | "seasonal",
  ) => {
    try {
      let keywords: string[] = [];

      switch (type) {
        case "popular":
          keywords = await api.getPopularKeywords(marketplace);
          setPopularKeywords(keywords);
          break;
        case "trending":
          keywords = await api.getTrendingKeywords(marketplace);
          setTrendingKeywords(keywords);
          break;
        case "seasonal":
          keywords = await api.getSeasonalKeywords(marketplace);
          setSeasonalKeywords(keywords);
          break;
      }
    } catch (err) {
      console.error(`Error loading ${type} keywords:`, err);
    }
  };

  // Load popular keywords when marketplace changes
  const handleMarketplaceChange = (value: string) => {
    form.setFieldValue("marketplace", value);
    loadKeywords(value, "popular");
    loadKeywords(value, "trending");
    loadKeywords(value, "seasonal");
  };

  // For loading initial keywords, we'd typically do this:
  // useEffect(() => {
  //   handleMarketplaceChange(form.values.marketplace);
  // }, []);

  // For the sake of this mockup, let's just set them directly:
  useEffect(() => {
    setPopularKeywords(mockPopularKeywords);
    setTrendingKeywords(mockTrendingKeywords);
    setSeasonalKeywords(mockSeasonalKeywords);
  }, []);

  return (
    <Box>
      <Card mb="md" withBorder>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="search" leftSection={<IconSearch size={16} />}>
              Keyword Search
            </Tabs.Tab>
            <Tabs.Tab
              value="suggestions"
              leftSection={<IconChartBar size={16} />}
            >
              Keyword Suggestions
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="search" pt="md">
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Group gap="md">
                <TextInput
                  label="Keyword"
                  placeholder="Enter keyword"
                  required
                  style={{ flex: 1 }}
                  {...form.getInputProps("keyword")}
                />

                <Select
                  label="Marketplace"
                  placeholder="Select marketplace"
                  required
                  data={[
                    { value: "takealot", label: "Takealot" },
                    { value: "makro", label: "Makro" },
                    { value: "loot", label: "Loot" },
                    { value: "game", label: "Game" },
                    { value: "incredible", label: "Incredible Connection" },
                  ]}
                  value={form.values.marketplace}
                  onChange={(value) =>
                    handleMarketplaceChange(value || "takealot")
                  }
                  style={{ flex: 1 }}
                />
              </Group>

              <Title order={6} mt="md" mb="xs">
                Analytics Options
              </Title>
              <Group>
                <Checkbox
                  label="Market Share"
                  {...form.getInputProps("includeMarketShare", {
                    type: "checkbox",
                  })}
                />
                <Checkbox
                  label="Seasonality"
                  {...form.getInputProps("includeSeasonality", {
                    type: "checkbox",
                  })}
                />
                <Checkbox
                  label="Competition Analysis"
                  {...form.getInputProps("includeCompetitionAnalysis", {
                    type: "checkbox",
                  })}
                />
                <Checkbox
                  label="Trend Prediction"
                  {...form.getInputProps("includeTrendPrediction", {
                    type: "checkbox",
                  })}
                />
                <Checkbox
                  label="Growth Opportunities"
                  {...form.getInputProps("includeGrowthOpportunities", {
                    type: "checkbox",
                  })}
                />
              </Group>

              <Group justify="flex-end" mt="md">
                <Badge>5 credits</Badge>
                <Button type="submit" loading={loading}>
                  Generate Analytics
                </Button>
              </Group>
            </form>

            {error && (
              <Alert
                icon={<IconAlertTriangle size={16} />}
                title="Error"
                c="red"
                mt="md"
              >
                {error}
              </Alert>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="suggestions" pt="md">
            <Tabs value={activeSubTab} onChange={setActiveSubTab}>
              <Tabs.List>
                <Tabs.Tab value="popular">Popular Keywords</Tabs.Tab>
                <Tabs.Tab value="trending">Trending Keywords</Tabs.Tab>
                <Tabs.Tab value="seasonal">Seasonal Keywords</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="popular" pt="md">
                <Group>
                  {popularKeywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      size="lg"
                      variant="light"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleKeywordSelect(keyword)}
                    >
                      {keyword}
                    </Badge>
                  ))}
                </Group>
              </Tabs.Panel>

              <Tabs.Panel value="trending" pt="md">
                <Group>
                  {trendingKeywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      size="lg"
                      variant="light"
                      c="teal"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleKeywordSelect(keyword)}
                      rightSection={<IconGrowth size={12} />}
                    >
                      {keyword}
                    </Badge>
                  ))}
                </Group>
              </Tabs.Panel>

              <Tabs.Panel value="seasonal" pt="md">
                <Group>
                  {seasonalKeywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      size="lg"
                      variant="light"
                      c="indigo"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleKeywordSelect(keyword)}
                      rightSection={<IconCalendarTime size={12} />}
                    >
                      {keyword}
                    </Badge>
                  ))}
                </Group>
              </Tabs.Panel>
            </Tabs>
          </Tabs.Panel>
        </Tabs>
      </Card>

      {loading && (
        <Card withBorder p="xl">
          <Group justify="center" p="xl">
            <Loader size="md" />
            <Text>Generating keyword analytics...</Text>
          </Group>
        </Card>
      )}

      {analyticsData && !loading && (
        <Card withBorder p="md">
          <Group justify="space-between" mb="md">
            <Title order={3}>Analytics for "{analyticsData.keyword}"</Title>
            <Badge size="lg">
              {analyticsData.searchVolume} monthly searches
            </Badge>
          </Group>

          <NetworkAwareLineChart
            data={analyticsData.searchVolumeHistory}
            xAxisDataKey="period"
            yAxisDataKey="volume"
            height={300}
            xAxisLabel="Month"
            yAxisLabel="Search Volume"
            showDots={true}
            fillArea={true}
            fillOpacity={0.2}
            textAlternative={`Search volume for "${analyticsData.keyword}" shows a ${analyticsData.trendPrediction.trendDirection} trend over the past year, with peak volumes in ${analyticsData.seasonalityData.peakMonths.join(" and ")}.`}
          />

          {analyticsData.marketShareData && (
            <Box mt="xl">
              <Title order={4} mb="md">
                Market Share Analysis
              </Title>

              <Group gap="xl" align="flex-start">
                <Box style={{ flex: 1 }}>
                  <Text size="sm" mb="md">
                    Brand Market Share
                  </Text>
                  <NetworkAwarePieChart
                    data={analyticsData.marketShareData.dominantBrands}
                    nameKey="brandName"
                    valueKey="marketSharePercent"
                    height={220}
                    donut={true}
                    innerRadiusRatio={0.6}
                    showLabels={true}
                    textAlternative={`${analyticsData.marketShareData.dominantBrands[0].brandName} holds the largest market share at ${analyticsData.marketShareData.dominantBrands[0].marketSharePercent}%, followed by ${analyticsData.marketShareData.dominantBrands[1].brandName} at ${analyticsData.marketShareData.dominantBrands[1].marketSharePercent}%.`}
                  />
                </Box>

                <Box style={{ flex: 1 }}>
                  <Text size="sm" mb="md">
                    Price Distribution
                  </Text>
                  <NetworkAwareBarChart
                    data={
                      analyticsData.marketShareData.priceDistribution
                        .priceRanges
                    }
                    xAxisDataKey="range"
                    yAxisDataKey="percentage"
                    height={220}
                    xAxisLabel="Price Range (ZAR)"
                    yAxisLabel="Percentage"
                    radius={4}
                    textAlternative={`Most products (${analyticsData.marketShareData.priceDistribution.priceRanges[0].percentage}%) are in the ${analyticsData.marketShareData.priceDistribution.priceRanges[0].range} ZAR price range.`}
                  />
                </Box>
              </Group>
            </Box>
          )}

          {analyticsData.seasonalityData && (
            <Box mt="xl">
              <Title order={4} mb="md">
                Seasonality Analysis
              </Title>

              <NetworkAwareBarChart
                data={Object.entries(
                  analyticsData.seasonalityData.monthlyTrends,
                ).map(([month, value]) => ({
                  month,
                  factor: value,
                }))}
                xAxisDataKey="month"
                yAxisDataKey="factor"
                height={250}
                xAxisLabel="Month"
                yAxisLabel="Seasonality Factor"
                textAlternative={`Seasonal peaks occur in ${analyticsData.seasonalityData.peakMonths.join(" and ")}, with seasonality factors of ${Math.max(...Object.values(analyticsData.seasonalityData.monthlyTrends))}.`}
              />
            </Box>
          )}

          {analyticsData.trendPrediction && (
            <Box mt="xl">
              <Title order={4} mb="md">
                Trend Prediction
                <Badge
                  ml="md"
                  color={
                    analyticsData.trendPrediction.trendDirection === "rising"
                      ? "green"
                      : "red"
                  }
                >
                  {analyticsData.trendPrediction.trendDirection}
                </Badge>
              </Title>

              <NetworkAwareLineChart
                data={analyticsData.trendPrediction.nextThreeMonths}
                xAxisDataKey="month"
                yAxisDataKey={["predictedVolume", "predictedRankingDifficulty"]}
                height={250}
                xAxisLabel="Month"
                yAxisLabel="Volume / Difficulty"
                showDots={true}
                textAlternative={`Predicted growth of ${analyticsData.trendPrediction.predictedGrowth}% over the next three months with ${analyticsData.trendPrediction.confidence}% confidence.`}
              />
            </Box>
          )}
        </Card>
      )}
    </Box>
  );
}
