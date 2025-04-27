"use client";

import React, { useState, useEffect } from "react";

import {
  Container,
  Title,
  Tabs,
  Group,
  Button,
  Paper,
  Text,
  TextInput,
  Loader,
  Center,
  Stack,
  Grid,
  Card,
  Notification,
} from "@mantine/core";

import {
  IconSearch,
  IconAdjustments,
  IconBrandProducthunt,
  IconPlus,
  IconX,
  IconRefresh,
  IconTag,
  IconFilterOff,
} from "@tabler/icons-react";

import {
  KeywordProductMappingForm,
  MappingOptions,
} from "./KeywordProductMappingForm";
import {
  MappingListItem,
  KeywordProductMapping as MappingListItemType,
  AttributeRecommendation,
} from "./MappingListItem";

// Types for the PIM Integration module
export interface Keyword {
  keyword: string;
  relevanceScore: number;
  searchVolume: number;
  ranking?: Array<{
    marketplace: string;
    position: number;
    date: string;
  }>;
}

export interface SuggestedKeyword {
  keyword: string;
  relevanceScore: number;
  searchVolume: number;
}

export interface KeywordProductMapping {
  id: string;
  organizationId: string;
  userId: string;
  productId: string;
  sku: string;
  keywords: Keyword[];
  autoKeywordEnabled: boolean;
  suggestedKeywords?: SuggestedKeyword[];
  blacklistedKeywords?: string[];
  attributeRecommendations?: AttributeRecommendation[];
  lastUpdated: string;
  metadata?: Record<string, any>;
}

export interface ApiResponse<T> {
  data: T;
  total: number;
}

export interface FilterParams {
  productId?: string;
  sku?: string;
}

export interface OptimizationRequest {
  productId: string;
  sku: string;
  keywords: string[];
  marketplaces: string[];
  [key: string]: any;
}

export interface NotificationState {
  message: string;
  type: "success" | "error";
}

// API client mock (to be replaced with actual API client)
const apiClient = {
  getMappings: async (
    params: FilterParams,
  ): Promise<ApiResponse<KeywordProductMapping[]>> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate API response
    return {
      data: [
        {
          id: "1",
          organizationId: "org-123",
          userId: "user-456",
          productId: "prod-789",
          sku: "SMPH-001",
          keywords: [
            {
              keyword: "smartphone",
              relevanceScore: 0.95,
              searchVolume: 12500,
              ranking: [
                {
                  marketplace: "takealot",
                  position: 3,
                  date: new Date().toISOString(),
                },
              ],
            },
            {
              keyword: "android phone",
              relevanceScore: 0.85,
              searchVolume: 8200,
              ranking: [
                {
                  marketplace: "takealot",
                  position: 7,
                  date: new Date().toISOString(),
                },
              ],
            },
            {
              keyword: "mobile phone",
              relevanceScore: 0.75,
              searchVolume: 15000,
              ranking: [
                {
                  marketplace: "takealot",
                  position: 12,
                  date: new Date().toISOString(),
                },
              ],
            },
          ],
          autoKeywordEnabled: true,
          suggestedKeywords: [
            {
              keyword: "budget smartphone",
              relevanceScore: 0.82,
              searchVolume: 5400,
            },
            {
              keyword: "affordable mobile",
              relevanceScore: 0.78,
              searchVolume: 4300,
            },
          ],
          blacklistedKeywords: ["iphone", "apple"],
          attributeRecommendations: [
            {
              attribute: "title",
              currentValue: 'Android Smartphone 6.5" Display 128GB',
              recommendedValue:
                'Android Smartphone 6.5" Display 128GB - Budget Friendly Mobile Phone',
              confidenceScore: 0.92,
              impact: "high",
              reason:
                "Adding high-traffic keywords to title improves search visibility.",
            },
            {
              attribute: "features",
              currentValue: "Large display, High capacity battery",
              recommendedValue:
                'Large 6.5" display, High capacity 5000mAh battery, Dual SIM',
              confidenceScore: 0.88,
              impact: "medium",
              reason:
                "Specific detailed features increase relevance for targeted searches.",
            },
          ],
          lastUpdated: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          metadata: {
            descriptionUpdated: new Date(
              Date.now() - 5 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            titleUpdated: new Date(
              Date.now() - 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            keywordsUsed: ["smartphone", "android phone", "mobile phone"],
          },
        },
        {
          id: "2",
          organizationId: "org-123",
          userId: "user-456",
          productId: "prod-101",
          sku: "LPTOP-002",
          keywords: [
            {
              keyword: "laptop",
              relevanceScore: 0.92,
              searchVolume: 18000,
              ranking: [
                {
                  marketplace: "takealot",
                  position: 5,
                  date: new Date().toISOString(),
                },
              ],
            },
            {
              keyword: "notebook computer",
              relevanceScore: 0.82,
              searchVolume: 6500,
              ranking: [
                {
                  marketplace: "takealot",
                  position: 8,
                  date: new Date().toISOString(),
                },
              ],
            },
          ],
          autoKeywordEnabled: false,
          suggestedKeywords: [
            {
              keyword: "ultrabook",
              relevanceScore: 0.76,
              searchVolume: 3200,
            },
            {
              keyword: "gaming laptop",
              relevanceScore: 0.65,
              searchVolume: 7400,
            },
          ],
          attributeRecommendations: [
            {
              attribute: "category",
              currentValue: "Computers",
              recommendedValue: "Laptops & Notebooks",
              confidenceScore: 0.94,
              impact: "high",
              reason:
                "More specific category improves categorical search relevance.",
            },
          ],
          lastUpdated: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          metadata: {
            attributesUpdated: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            attributesApplied: ["title", "features"],
          },
        },
      ],
      total: 2,
    };
  },

  blacklistKeyword: async (
    mappingId: string,
    keyword: string,
  ): Promise<{ success: boolean }> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true };
  },

  removeFromBlacklist: async (
    mappingId: string,
    keyword: string,
  ): Promise<{ success: boolean }> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true };
  },

  setAutoKeywordEnabled: async (
    mappingId: string,
    enabled: boolean,
  ): Promise<{ success: boolean }> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true };
  },

  applyRecommendation: async (
    mappingId: string,
    recommendationId: string,
  ): Promise<{ success: boolean }> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true };
  },

  performKeywordResearch: async (
    data: OptimizationRequest,
  ): Promise<{ success: boolean }> => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return { success: true };
  },
};

export function PimIntegrationDashboard(): JSX.Element {
  const [mappings, setMappings] = useState<KeywordProductMapping[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string | null>("mappings");
  const [productIdFilter, setProductIdFilter] = useState<string>("");
  const [skuFilter, setSkuFilter] = useState<string>("");
  const [notification, setNotification] = useState<NotificationState | null>(
    null,
  );
  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);

  // Load mappings on component mount
  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await apiClient.getMappings({
        productId: productIdFilter || undefined,
        sku: skuFilter || undefined,
      });

      setMappings(response.data);
    } catch (error) {
      showNotification("Error loading mappings", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBlacklistKeyword = async (
    mappingId: string,
    keyword: string,
  ): Promise<void> => {
    try {
      await apiClient.blacklistKeyword(mappingId, keyword);

      // Update local state to reflect the change
      setMappings(
        mappings.map((mapping) => {
          if (mapping.id === mappingId) {
            const updatedMapping = { ...mapping };

            // Move from keywords or suggested to blacklisted
            if (!updatedMapping.blacklistedKeywords) {
              updatedMapping.blacklistedKeywords = [];
            }

            if (!updatedMapping.blacklistedKeywords.includes(keyword)) {
              updatedMapping.blacklistedKeywords = [
                ...updatedMapping.blacklistedKeywords,
                keyword,
              ];
            }

            // Remove from keywords if present
            updatedMapping.keywords = updatedMapping.keywords.filter(
              (k) => k.keyword !== keyword,
            );

            // Remove from suggested if present
            if (updatedMapping.suggestedKeywords) {
              updatedMapping.suggestedKeywords =
                updatedMapping.suggestedKeywords.filter(
                  (k) => k.keyword !== keyword,
                );
            }

            return updatedMapping;
          }
          return mapping;
        }),
      );

      showNotification(`Keyword "${keyword}" blacklisted`, "success");
    } catch (error) {
      showNotification("Failed to blacklist keyword", "error");
    }
  };

  const handleRemoveFromBlacklist = async (
    mappingId: string,
    keyword: string,
  ): Promise<void> => {
    try {
      await apiClient.removeFromBlacklist(mappingId, keyword);

      // Update local state to reflect the change
      setMappings(
        mappings.map((mapping) => {
          if (mapping.id === mappingId && mapping.blacklistedKeywords) {
            return {
              ...mapping,
              blacklistedKeywords: mapping.blacklistedKeywords.filter(
                (k) => k !== keyword,
              ),
            };
          }
          return mapping;
        }),
      );

      showNotification(
        `Keyword "${keyword}" removed from blacklist`,
        "success",
      );
    } catch (error) {
      showNotification("Failed to remove from blacklist", "error");
    }
  };

  const handleSetAutoKeywordEnabled = async (
    mappingId: string,
    enabled: boolean,
  ): Promise<void> => {
    try {
      await apiClient.setAutoKeywordEnabled(mappingId, enabled);

      // Update local state to reflect the change
      setMappings(
        mappings.map((mapping) => {
          if (mapping.id === mappingId) {
            return {
              ...mapping,
              autoKeywordEnabled: enabled,
            };
          }
          return mapping;
        }),
      );

      showNotification(
        `Auto-optimization ${enabled ? "enabled" : "disabled"}`,
        "success",
      );
    } catch (error) {
      showNotification("Failed to update auto-optimization setting", "error");
    }
  };

  const handleApplyRecommendation = async (
    mappingId: string,
    recommendationId: string,
  ): Promise<void> => {
    try {
      await apiClient.applyRecommendation(mappingId, recommendationId);

      // In a real app, we'd refetch the data or update the state more precisely
      // For this example, we'll just mark the recommendation as applied
      showNotification("Recommendation applied successfully", "success");
    } catch (error) {
      showNotification("Failed to apply recommendation", "error");
    }
  };

  const handleSubmitForm = async (
    productId: string,
    sku: string,
    keywords: string[],
    marketplaces: string[],
    options: MappingOptions,
  ): Promise<void> => {
    try {
      setLoading(true);
      await apiClient.performKeywordResearch({
        productId,
        sku,
        keywords,
        marketplaces,
        ...options,
      });

      showNotification("Product optimization request submitted", "success");
      setIsFormVisible(false);

      // Refetch the mappings to show the new one
      await fetchMappings();
    } catch (error) {
      showNotification("Failed to submit optimization request", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (): void => {
    fetchMappings();
  };

  const handleClearFilters = (): void => {
    setProductIdFilter("");
    setSkuFilter("");
    fetchMappings();
  };

  const showNotification = (
    message: string,
    type: "success" | "error",
  ): void => {
    setNotification({ message, type });
    // Auto-hide notification after 3 seconds
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTabChange = (value: string | null): void => {
    setActiveTab(value);
  };

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
        <Title order={2}>PIM Integration</Title>
        <Button
          leftSection={
            isFormVisible ? <IconX size={16} /> : <IconPlus size={16} />
          }
          onClick={() => setIsFormVisible(!isFormVisible)}
        >
          {isFormVisible ? "Cancel" : "Add Mapping"}
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={handleTabChange} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="mappings" leftSection={<IconTag size={14} />}>
            Keyword Mappings
          </Tabs.Tab>
          <Tabs.Tab
            value="products"
            leftSection={<IconBrandProducthunt size={14} />}
          >
            Product Optimization
          </Tabs.Tab>
          <Tabs.Tab value="auto" leftSection={<IconAdjustments size={14} />}>
            Auto-Optimization
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Grid>
        {isFormVisible && (
          <Grid.Col span={{ base: 12, md: 4 }}>
            <KeywordProductMappingForm onSubmit={handleSubmitForm} />
          </Grid.Col>
        )}

        <Grid.Col span={{ base: 12, md: isFormVisible ? 8 : 12 }}>
          {activeTab === "mappings" && (
            <>
              <Paper withBorder p="md" mb="xl">
                <Group justify="apart">
                  <Group>
                    <TextInput
                      label="Product ID"
                      placeholder="Filter by product ID"
                      value={productIdFilter}
                      onChange={(e) =>
                        setProductIdFilter(e.currentTarget.value)
                      }
                    />

                    <TextInput
                      label="SKU"
                      placeholder="Filter by SKU"
                      value={skuFilter}
                      onChange={(e) => setSkuFilter(e.currentTarget.value)}
                    />
                  </Group>

                  <Group>
                    <Button
                      variant="outline"
                      leftSection={<IconFilterOff size={16} />}
                      onClick={handleClearFilters}
                    >
                      Clear
                    </Button>

                    <Button
                      leftSection={<IconSearch size={16} />}
                      onClick={handleSearch}
                    >
                      Search
                    </Button>
                  </Group>
                </Group>
              </Paper>

              {loading ? (
                <Center my="xl">
                  <Loader />
                </Center>
              ) : mappings.length === 0 ? (
                <Card withBorder p="xl">
                  <Center>
                    <Stack align="center" gap="md">
                      <IconTag size={48} color="gray" opacity={0.5} />
                      <Text size="lg" c="dimmed">
                        No keyword mappings found
                      </Text>
                      <Text c="dimmed" ta="center">
                        Create your first keyword-product mapping to optimize
                        your product listings.
                      </Text>
                      <Button
                        variant="outline"
                        onClick={() => setIsFormVisible(true)}
                        leftSection={<IconPlus size={16} />}
                      >
                        Add Mapping
                      </Button>
                    </Stack>
                  </Center>
                </Card>
              ) : (
                <Stack gap="md">
                  {mappings.map((mapping) => (
                    <MappingListItem
                      key={mapping.id}
                      mapping={mapping as MappingListItemType}
                      onBlacklistKeyword={handleBlacklistKeyword}
                      onRemoveFromBlacklist={handleRemoveFromBlacklist}
                      onSetAutoKeywordEnabled={handleSetAutoKeywordEnabled}
                      onApplyRecommendation={handleApplyRecommendation}
                    />
                  ))}
                </Stack>
              )}
            </>
          )}

          {activeTab === "products" && (
            <Card withBorder p="xl">
              <Center>
                <Stack align="center" gap="md">
                  <IconBrandProducthunt size={48} color="gray" opacity={0.5} />
                  <Text size="lg" c="dimmed">
                    Product Optimization
                  </Text>
                  <Text c="dimmed" ta="center">
                    Select products from your PIM catalog to optimize with
                    keywords.
                  </Text>
                  <Button
                    variant="outline"
                    leftSection={<IconPlus size={16} />}
                  >
                    Select Products
                  </Button>
                </Stack>
              </Center>
            </Card>
          )}

          {activeTab === "auto" && (
            <Card withBorder p="xl">
              <Stack align="center" gap="lg">
                <IconAdjustments size={48} color="gray" opacity={0.5} />
                <Text size="lg" c="dimmed">
                  Auto-Optimization Settings
                </Text>
                <Text c="dimmed" ta="center" maw={500}>
                  Configure automatic keyword optimization for your products.
                  This will periodically analyze your products and update
                  listings with optimal keywords.
                </Text>
                <Group>
                  <Button
                    variant="outline"
                    leftSection={<IconAdjustments size={16} />}
                  >
                    Configure Settings
                  </Button>
                  <Button leftSection={<IconRefresh size={16} />}>
                    Run Auto-Optimization Now
                  </Button>
                </Group>
              </Stack>
            </Card>
          )}
        </Grid.Col>
      </Grid>
    </Container>
  );
}
