"use client";

import React, { useState, useEffect } from "react";

import {
  Container,
  Title,
  Group,
  Button,
  Tabs,
  Paper,
  Text,
  Select,
  Loader,
  Center,
  Stack,
  Grid,
  Card,
  Notification,
  Badge,
  Avatar,
  List,
  ThemeIcon,
  Accordion,
  Anchor,
  Divider,
} from "@mantine/core";

import {
  IconChartBar,
  IconPlus,
  IconX,
  IconBuildingStore,
  IconCheck,
  IconClock,
  IconArrowUp,
  IconArrowDown,
  IconEqual,
  IconStar,
  IconChartPie,
} from "@tabler/icons-react";

import { StrategyForm } from "./StrategyForm";
import { StrategyReport } from "./StrategyReport";

// Define TypeScript interfaces
interface MarketInsight {
  marketplace: string;
  logo: string;
  competitiveness: number;
  opportunity: number;
  pricePosition: string;
  dominantCategories: string[];
  trendingCategories: string[];
  keyFindings: string[];
}

interface Opportunity {
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  difficulty: "high" | "medium" | "low";
  timelineWeeks: number;
  potentialRevenueLift: string;
}

interface Recommendation {
  title: string;
  items: string[];
}

interface Report {
  summary: string;
  marketInsights: MarketInsight[];
  opportunities: Opportunity[];
  recommendations: Recommendation[];
}

interface Strategy {
  id: string;
  organizationId: string;
  userId: string;
  status: "completed" | "in_progress" | "pending" | "failed";
  createdAt: string;
  completedAt?: string;
  marketplaces: string[];
  analysisType: "basic" | "comprehensive" | "deep-dive";
  timeFrame: "7-days" | "30-days" | "90-days" | "custom";
  competitorAnalysis: boolean;
  includeRecommendations: boolean;
  priorityLevel: "high" | "medium" | "low";
  notes: string;
  report?: Report;
  progress?: number;
}

interface StrategyApiResponse {
  data: Strategy[];
  total: number;
}

interface StrategyFormData {
  marketplaces: string[];
  analysisType: string;
  timeFrame: string;
  competitorAnalysis: boolean;
  includeRecommendations: boolean;
  priorityLevel: string;
  notes: string;
}

interface StrategyCreateResponse {
  success: boolean;
  id: string;
}

interface NotificationState {
  message: string;
  type: "success" | "error";
}

interface MarketplaceFilterParams {
  marketplace?: string;
}

// API client mock (to be replaced with actual API client)
const apiClient = {
  getStrategies: async (
    params: MarketplaceFilterParams,
  ): Promise<StrategyApiResponse> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate API response
    return {
      data: [
        {
          id: "1",
          organizationId: "org-123",
          userId: "user-456",
          status: "completed",
          createdAt: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          completedAt: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          marketplaces: ["takealot", "makro"],
          analysisType: "comprehensive",
          timeFrame: "30-days",
          competitorAnalysis: true,
          includeRecommendations: true,
          priorityLevel: "medium",
          notes: "Focus on electronics category",
          report: {
            summary:
              "Based on our analysis of your products across South African marketplaces, we have identified several key opportunities for growth and optimization.",
            marketInsights: [
              {
                marketplace: "takealot",
                logo: "https://www.takealot.com/favicon.ico",
                competitiveness: 85,
                opportunity: 72,
                pricePosition: "mid-range",
                dominantCategories: ["Electronics", "Home & Kitchen"],
                trendingCategories: ["Smart Home", "Tech Accessories"],
                keyFindings: [
                  "Competitive pricing in Electronics (within 5% of market average)",
                  "Opportunity to improve product image quality (32% below top performers)",
                  "Keyword optimization would improve visibility by estimated 40%",
                ],
              },
              {
                marketplace: "makro",
                logo: "https://www.makro.co.za/favicon.ico",
                competitiveness: 68,
                opportunity: 85,
                pricePosition: "premium",
                dominantCategories: ["Electronics", "Appliances"],
                trendingCategories: ["Kitchen Appliances", "Smart TVs"],
                keyFindings: [
                  "Pricing is 12% above market average reducing competitiveness",
                  "Product descriptions are 25% shorter than top-performing listings",
                  "Category saturation is low with high opportunity potential",
                ],
              },
            ],
            opportunities: [
              {
                title: "Price Optimization",
                description:
                  "Adjust pricing strategy on Makro to be more competitive",
                impact: "high",
                difficulty: "medium",
                timelineWeeks: 2,
                potentialRevenueLift: "15-20%",
              },
              {
                title: "Listing Optimization",
                description:
                  "Enhance product descriptions and images across all platforms",
                impact: "high",
                difficulty: "low",
                timelineWeeks: 1,
                potentialRevenueLift: "10-15%",
              },
              {
                title: "Category Expansion",
                description:
                  "Expand into trending Smart Home category on Takealot",
                impact: "medium",
                difficulty: "high",
                timelineWeeks: 4,
                potentialRevenueLift: "25-30%",
              },
            ],
            recommendations: [
              {
                title: "Immediate Actions",
                items: [
                  "Review and adjust pricing on Makro platform to be within 5% of market average",
                  "Enhance product images with lifestyle photography and multiple angles",
                  "Expand product descriptions with feature-benefit statements and technical specifications",
                ],
              },
              {
                title: "Short-term Strategy (30 days)",
                items: [
                  "Optimize product titles and keywords based on marketplace-specific trends",
                  "Implement A/B testing on product feature highlights",
                  "Focus promotion on trending categories identified in analysis",
                ],
              },
              {
                title: "Long-term Strategy (90+ days)",
                items: [
                  "Develop Smart Home product line for Takealot marketplace",
                  "Establish dynamic pricing model responsive to competitor actions",
                  "Build multi-channel promotion strategy across marketplaces",
                ],
              },
            ],
          },
        },
        {
          id: "2",
          organizationId: "org-123",
          userId: "user-456",
          status: "in_progress",
          createdAt: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          marketplaces: ["loot", "buck_cheap"],
          analysisType: "deep-dive",
          timeFrame: "90-days",
          competitorAnalysis: true,
          includeRecommendations: true,
          priorityLevel: "high",
          notes: "Investigating potential entry into furniture category",
          progress: 65,
        },
      ],
      total: 2,
    };
  },

  createStrategy: async (
    data: StrategyFormData,
  ): Promise<StrategyCreateResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return { success: true, id: "3" };
  },
};

export function StrategyDashboard() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("recent");
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>("all");
  const [notification, setNotification] = useState<NotificationState | null>(
    null,
  );
  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(
    null,
  );

  // Load strategies on component mount
  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await apiClient.getStrategies({
        marketplace:
          marketplaceFilter !== "all" ? marketplaceFilter : undefined,
      });

      setStrategies(response.data);
    } catch (error) {
      showNotification("Error loading strategies", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForm = async (data: StrategyFormData): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiClient.createStrategy(data);

      showNotification("Strategy request submitted successfully", "success");
      setIsFormVisible(false);

      // Refetch strategies
      await fetchStrategies();
    } catch (error) {
      showNotification("Failed to submit strategy request", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewStrategy = (strategy: Strategy): void => {
    setSelectedStrategy(strategy);
  };

  const handleBackToList = (): void => {
    setSelectedStrategy(null);
  };

  const showNotification = (
    message: string,
    type: "success" | "error",
  ): void => {
    setNotification({ message, type });
    // Auto-hide notification after 3 seconds
    setTimeout(() => setNotification(null), 3000);
  };

  // If a strategy is selected, show the report view
  if (selectedStrategy) {
    return (
      <Container size="xl" py="xl">
        {notification && (
          <Notification
            color={notification.type === "success" ? "green" : "red"}
            title={notification.type === "success" ? "Success" : "Error"}
            withCloseButton
            onClose={() => setNotification(null)}
            mb="md"
          >
            {notification.message}
          </Notification>
        )}

        <Group justify="apart" mb="xl">
          <Group>
            <Button variant="outline" onClick={handleBackToList}>
              Back to List
            </Button>
            <Title order={2}>Marketplace Strategy Report</Title>
          </Group>
          <Button leftSection={<IconChartPie size={16} />} variant="light">
            Export Report
          </Button>
        </Group>

        <StrategyReport
          strategy={{
            ...selectedStrategy,
            analysisType: selectedStrategy.analysisType as
              | "basic"
              | "comprehensive"
              | "deep-dive",
            timeFrame: selectedStrategy.timeFrame as
              | "7-days"
              | "30-days"
              | "90-days"
              | "custom",
            report: selectedStrategy.report
              ? {
                  summary: selectedStrategy.report.summary,
                  marketInsights: selectedStrategy.report.marketInsights.map(
                    (insight) => ({
                      ...insight,
                      pricePosition: insight.pricePosition as
                        | "premium"
                        | "competitive"
                        | "budget"
                        | "mixed",
                    }),
                  ),
                  opportunities: selectedStrategy.report.opportunities,
                  recommendations: selectedStrategy.report.recommendations,
                }
              : undefined,
          }}
        />
      </Container>
    );
  }

  // Otherwise show the list view
  return (
    <Container size="xl" py="xl">
      {notification && (
        <Notification
          color={notification.type === "success" ? "green" : "red"}
          title={notification.type === "success" ? "Success" : "Error"}
          withCloseButton
          onClose={() => setNotification(null)}
          mb="md"
        >
          {notification.message}
        </Notification>
      )}

      <Group justify="apart" mb="xl">
        <Title order={2}>Marketplace Strategy</Title>
        <Button
          leftSection={
            isFormVisible ? <IconX size={16} /> : <IconPlus size={16} />
          }
          onClick={() => setIsFormVisible(!isFormVisible)}
        >
          {isFormVisible ? "Cancel" : "New Strategy Request"}
        </Button>
      </Group>

      <Tabs
        value={activeTab}
        onChange={(value) => setActiveTab(value || "recent")}
        mb="xl"
      >
        <Tabs.List>
          <Tabs.Tab value="recent" leftSection={<IconClock size={14} />}>
            Recent Strategies
          </Tabs.Tab>
          <Tabs.Tab value="completed" leftSection={<IconCheck size={14} />}>
            Completed
          </Tabs.Tab>
          <Tabs.Tab
            value="in_progress"
            leftSection={<IconChartBar size={14} />}
          >
            In Progress
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Grid>
        {isFormVisible && (
          <Grid.Col span={{ base: 12, md: 4 }}>
            <StrategyForm onSubmit={handleSubmitForm} />
          </Grid.Col>
        )}

        <Grid.Col span={{ base: 12, md: isFormVisible ? 8 : 12 }}>
          <Paper withBorder p="md" mb="xl">
            <Group justify="apart">
              <Select
                label="Marketplace"
                placeholder="Filter by marketplace"
                value={marketplaceFilter}
                onChange={(value) => setMarketplaceFilter(value || "all")}
                data={[
                  { value: "all", label: "All Marketplaces" },
                  { value: "takealot", label: "Takealot" },
                  { value: "makro", label: "Makro" },
                  { value: "loot", label: "Loot" },
                  { value: "buck_cheap", label: "Buck & Cheap" },
                  { value: "bob_shop", label: "Bob Shop" },
                ]}
                leftSection={<IconBuildingStore size={14} />}
                style={{ minWidth: 250 }}
              />

              <Button
                leftSection={<IconChartBar size={16} />}
                onClick={fetchStrategies}
              >
                Apply Filters
              </Button>
            </Group>
          </Paper>

          {loading ? (
            <Center my="xl">
              <Loader />
            </Center>
          ) : strategies.length === 0 ? (
            <Card withBorder p="xl">
              <Center>
                <Stack ta="center" gap="md">
                  <IconChartBar size={48} color="gray" opacity={0.5} />
                  <Text size="lg" color="dimmed">
                    No strategies found
                  </Text>
                  <Text color="dimmed" ta="center">
                    Create your first marketplace strategy to gain insights and
                    recommendations.
                  </Text>
                  <Button
                    variant="outline"
                    onClick={() => setIsFormVisible(true)}
                    leftSection={<IconPlus size={16} />}
                  >
                    New Strategy Request
                  </Button>
                </Stack>
              </Center>
            </Card>
          ) : (
            <Stack gap="md">
              {strategies
                .filter((strategy) => {
                  if (activeTab === "recent") return true;
                  return strategy.status === activeTab;
                })
                .map((strategy) => (
                  <Paper key={strategy.id} withBorder p="md" radius="md">
                    <Group justify="apart">
                      <div>
                        <Group gap="xs">
                          <Text fw={500}>
                            {strategy.analysisType.charAt(0).toUpperCase() +
                              strategy.analysisType.slice(1)}{" "}
                            Analysis
                          </Text>
                          <Badge
                            color={
                              strategy.status === "completed"
                                ? "green"
                                : strategy.status === "in_progress"
                                  ? "blue"
                                  : "yellow"
                            }
                          >
                            {strategy.status === "completed"
                              ? "Completed"
                              : strategy.status === "in_progress"
                                ? "In Progress"
                                : "Pending"}
                          </Badge>
                        </Group>

                        <Text size="xs" color="dimmed">
                          Created:{" "}
                          {new Date(strategy.createdAt).toLocaleDateString()}
                          {strategy.completedAt && (
                            <>
                              {" "}
                              • Completed:{" "}
                              {new Date(
                                strategy.completedAt,
                              ).toLocaleDateString()}
                            </>
                          )}
                        </Text>
                      </div>

                      <Group gap="xs">
                        {strategy.status === "completed" && (
                          <Button
                            size="xs"
                            onClick={() => handleViewStrategy(strategy)}
                          >
                            View Report
                          </Button>
                        )}
                        {strategy.status === "in_progress" &&
                          strategy.progress !== undefined && (
                            <Badge size="lg">
                              {strategy.progress}% Complete
                            </Badge>
                          )}
                      </Group>
                    </Group>

                    <Group mt="md" gap="lg">
                      <Group gap="xs">
                        <IconBuildingStore size={16} />
                        <Text size="sm">
                          Marketplaces:{" "}
                          {strategy.marketplaces
                            .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
                            .join(", ")}
                        </Text>
                      </Group>

                      <Badge variant="outline">
                        {strategy.timeFrame} analysis
                      </Badge>

                      <Badge
                        variant="outline"
                        color={
                          strategy.priorityLevel === "high"
                            ? "red"
                            : strategy.priorityLevel === "medium"
                              ? "yellow"
                              : "blue"
                        }
                      >
                        {strategy.priorityLevel} priority
                      </Badge>
                    </Group>

                    {strategy.status === "completed" && strategy.report && (
                      <Card mt="md" withBorder>
                        <Text size="sm">{strategy.report.summary}</Text>

                        {strategy.report.opportunities && (
                          <Group mt="md" justify="apart">
                            <Text size="xs" fw={500}>
                              Top Opportunities:
                            </Text>
                            <Group gap="md">
                              {strategy.report.opportunities
                                .slice(0, 2)
                                .map((opportunity, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    color={
                                      opportunity.impact === "high"
                                        ? "green"
                                        : opportunity.impact === "medium"
                                          ? "yellow"
                                          : "blue"
                                    }
                                  >
                                    {opportunity.title}
                                  </Badge>
                                ))}
                            </Group>
                          </Group>
                        )}
                      </Card>
                    )}
                  </Paper>
                ))}
            </Stack>
          )}
        </Grid.Col>
      </Grid>
    </Container>
  );
}
