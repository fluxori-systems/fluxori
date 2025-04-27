"use client";

import React, { useState, useEffect } from "react";

import {
  Box,
  Table,
  Text,
  Group,
  Badge,
  ActionIcon,
  Button,
  Menu,
  TextInput,
  Loader,
  Stack,
  Card,
  Chip,
  Drawer,
  Divider,
  Switch,
  ScrollArea,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

import {
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconPlus,
  IconChevronDown,
  IconX,
  IconCheck,
  IconSettings,
} from "@tabler/icons-react";

import { KeywordRanking, ImpactLevel } from "./MappingListItem";
import { useAuth } from "../../../lib/firebase/useAuth";

export interface SuggestedKeyword {
  keyword: string;
  relevance: number;
  searchVolume: number;
  competition: number;
  opportunity: number;
}

export interface AttributeRecommendation {
  attribute: string;
  currentValue?: string;
  recommendedValue: string;
  confidence: number;
  impact: ImpactLevel;
  reason: string;
}

export interface KeywordData {
  keyword: string;
  relevanceScore: number;
  searchVolume: number;
  ranking: {
    marketplace: string;
    position: number;
    lastChecked: string;
  }[];
}

export interface KeywordMapping {
  id: string;
  productId: string;
  sku: string;
  keywords: KeywordData[];
  suggestedKeywords: SuggestedKeyword[];
  blacklistedKeywords: string[];
  autoKeywordEnabled: boolean;
  attributeRecommendations: AttributeRecommendation[];
  lastUpdated: string;
}

export interface KeywordProductMappingTableProps {
  onAddMapping?: () => void;
  onViewProductDetails?: (productId: string) => void;
}

export function KeywordProductMappingTable({
  onAddMapping,
  onViewProductDetails,
}: KeywordProductMappingTableProps): JSX.Element {
  const { refreshToken } = useAuth();
  const [mappings, setMappings] = useState<KeywordMapping[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedMapping, setSelectedMapping] = useState<KeywordMapping | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async (): Promise<void> => {
    try {
      setLoading(true);

      const token = await refreshToken();
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await fetch(
        "/api/credit-system/pim-integration/mappings",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch keyword-product mappings");
      }

      const data = await response.json();
      setMappings(data);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load keyword-product mappings",
        color: "red",
      });
      console.error("Error fetching mappings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoKeyword = async (
    id: string,
    enabled: boolean,
  ): Promise<void> => {
    try {
      const token = await refreshToken();
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await fetch(
        `/api/credit-system/pim-integration/mappings/${id}/auto-keyword`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ enabled }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update auto-keyword setting");
      }

      // Update local state
      setMappings(
        mappings.map((mapping) =>
          mapping.id === id
            ? { ...mapping, autoKeywordEnabled: enabled }
            : mapping,
        ),
      );

      // Update selected mapping if open in drawer
      if (selectedMapping && selectedMapping.id === id) {
        setSelectedMapping({ ...selectedMapping, autoKeywordEnabled: enabled });
      }

      notifications.show({
        title: "Success",
        message: `Auto-keyword optimization ${enabled ? "enabled" : "disabled"}`,
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update auto-keyword setting",
        color: "red",
      });
      console.error("Error updating auto-keyword setting:", error);
    }
  };

  const handleBlacklistKeyword = async (
    mappingId: string,
    keyword: string,
  ): Promise<void> => {
    try {
      const token = await refreshToken();
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await fetch(
        `/api/credit-system/pim-integration/mappings/${mappingId}/blacklist`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ keyword }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to blacklist keyword");
      }

      // Update local state - add to blacklist
      const updatedMappings = mappings.map((mapping) => {
        if (mapping.id === mappingId) {
          return {
            ...mapping,
            blacklistedKeywords: [...mapping.blacklistedKeywords, keyword],
          };
        }
        return mapping;
      });

      setMappings(updatedMappings);

      // Update selected mapping if open in drawer
      if (selectedMapping && selectedMapping.id === mappingId) {
        setSelectedMapping({
          ...selectedMapping,
          blacklistedKeywords: [
            ...selectedMapping.blacklistedKeywords,
            keyword,
          ],
        });
      }

      notifications.show({
        title: "Success",
        message: `Keyword "${keyword}" added to blacklist`,
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to blacklist keyword",
        color: "red",
      });
      console.error("Error blacklisting keyword:", error);
    }
  };

  const handleRemoveFromBlacklist = async (
    mappingId: string,
    keyword: string,
  ): Promise<void> => {
    try {
      const token = await refreshToken();
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await fetch(
        `/api/credit-system/pim-integration/mappings/${mappingId}/blacklist/${encodeURIComponent(keyword)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to remove keyword from blacklist");
      }

      // Update local state - remove from blacklist
      const updatedMappings = mappings.map((mapping) => {
        if (mapping.id === mappingId) {
          return {
            ...mapping,
            blacklistedKeywords: mapping.blacklistedKeywords.filter(
              (k) => k !== keyword,
            ),
          };
        }
        return mapping;
      });

      setMappings(updatedMappings);

      // Update selected mapping if open in drawer
      if (selectedMapping && selectedMapping.id === mappingId) {
        setSelectedMapping({
          ...selectedMapping,
          blacklistedKeywords: selectedMapping.blacklistedKeywords.filter(
            (k) => k !== keyword,
          ),
        });
      }

      notifications.show({
        title: "Success",
        message: `Keyword "${keyword}" removed from blacklist`,
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to remove keyword from blacklist",
        color: "red",
      });
      console.error("Error removing keyword from blacklist:", error);
    }
  };

  const handleViewDetails = (mapping: KeywordMapping): void => {
    setSelectedMapping(mapping);
    setDrawerOpen(true);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getImpactColor = (impact: ImpactLevel): string => {
    switch (impact) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "blue";
      default:
        return "gray";
    }
  };

  const filteredMappings = mappings.filter((mapping) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();

    // Search in product ID and SKU
    if (
      mapping.productId.toLowerCase().includes(searchLower) ||
      mapping.sku.toLowerCase().includes(searchLower)
    ) {
      return true;
    }

    // Search in keywords
    if (
      mapping.keywords.some((k) =>
        k.keyword.toLowerCase().includes(searchLower),
      )
    ) {
      return true;
    }

    // Search in suggested keywords
    if (
      mapping.suggestedKeywords.some((k) =>
        k.keyword.toLowerCase().includes(searchLower),
      )
    ) {
      return true;
    }

    return false;
  });

  const renderKeywordCell = (mapping: KeywordMapping): JSX.Element => {
    const allKeywords = [...mapping.keywords];
    const displayKeywords = allKeywords.slice(0, 3);
    const remainingCount = allKeywords.length - displayKeywords.length;

    return (
      <Box>
        <Group gap="xs">
          {displayKeywords.map((k, index) => (
            <Badge key={index} size="sm">
              {k.keyword}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge size="sm" variant="outline">
              +{remainingCount} more
            </Badge>
          )}
        </Group>
      </Box>
    );
  };

  const renderSuggestedKeywordCell = (mapping: KeywordMapping): JSX.Element => {
    if (!mapping.suggestedKeywords || mapping.suggestedKeywords.length === 0) {
      return (
        <Text c="dimmed" size="sm">
          None
        </Text>
      );
    }

    const displayKeywords = mapping.suggestedKeywords.slice(0, 2);
    const remainingCount =
      mapping.suggestedKeywords.length - displayKeywords.length;

    return (
      <Box>
        <Group gap="xs">
          {displayKeywords.map((k, index) => (
            <Badge key={index} size="sm" color="green">
              {k.keyword}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge size="sm" variant="outline">
              +{remainingCount} more
            </Badge>
          )}
        </Group>
      </Box>
    );
  };

  const renderAttributeRecommendations = (
    recommendations: AttributeRecommendation[],
  ): JSX.Element => {
    if (!recommendations || recommendations.length === 0) {
      return <Text c="dimmed">No recommendations</Text>;
    }

    return (
      <Stack gap="xs">
        {recommendations.map((rec, index) => (
          <Box key={index}>
            <Group justify="apart">
              <Text fw={500}>{rec.attribute}</Text>
              <Badge color={getImpactColor(rec.impact)}>{rec.impact}</Badge>
            </Group>
            <Group gap="xs" justify="apart">
              <Text size="sm">Current: {rec.currentValue || "N/A"}</Text>
              <IconChevronDown size={12} />
              <Text size="sm" fw={500}>
                Recommended: {rec.recommendedValue}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {rec.reason}
            </Text>
          </Box>
        ))}
      </Stack>
    );
  };

  // Chip wrapper with badge for keyword opportunity
  interface KeywordChipProps {
    keyword: string;
    opportunity?: number;
    color?: string;
    variant?: string;
    onRemove?: () => void;
  }

  const KeywordChip = ({
    keyword,
    opportunity,
    color = "blue",
    variant = "filled",
    onRemove,
  }: KeywordChipProps): JSX.Element => {
    const rightSectionContent = onRemove ? (
      <ActionIcon
        size="xs"
        color="red"
        variant="transparent"
        onClick={onRemove}
      >
        <IconX size={14} />
      </ActionIcon>
    ) : opportunity !== undefined ? (
      <Badge
        size="xs"
        color={
          opportunity > 0.7 ? "green" : opportunity > 0.4 ? "yellow" : "gray"
        }
      >
        {Math.round(opportunity * 100)}%
      </Badge>
    ) : null;

    return (
      <Chip checked={false} color={color} variant={variant} radius="sm">
        <Group justify="apart" wrap="nowrap" style={{ width: "100%" }}>
          <Text>{keyword}</Text>
          {rightSectionContent && <Box ml={5}>{rightSectionContent}</Box>}
        </Group>
      </Chip>
    );
  };

  return (
    <>
      <Card withBorder shadow="sm" p="md" radius="md">
        <Group justify="apart" mb="md">
          <Title order={3}>Product-Keyword Mappings</Title>
          <Group>
            <TextInput
              placeholder="Search by product ID or keyword"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftSection={<IconSearch size={14} />}
              style={{ minWidth: 250 }}
            />
            <Button leftSection={<IconPlus size={14} />} onClick={onAddMapping}>
              Add Mapping
            </Button>
          </Group>
        </Group>

        {loading ? (
          <Box py="xl" ta="center">
            <Loader size="md" />
            <Text mt="md">Loading mappings...</Text>
          </Box>
        ) : filteredMappings.length === 0 ? (
          <Box py="xl" ta="center">
            <Text size="lg" fw={500} mb="md">
              No mappings found
            </Text>
            <Text c="dimmed" mb="lg">
              {searchTerm
                ? "No mappings match your search criteria."
                : "There are no product-keyword mappings yet."}
            </Text>
            {!searchTerm && (
              <Button
                leftSection={<IconPlus size={14} />}
                onClick={onAddMapping}
              >
                Create Your First Mapping
              </Button>
            )}
          </Box>
        ) : (
          <ScrollArea>
            <Table>
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>SKU</th>
                  <th>Keywords</th>
                  <th>Suggested Keywords</th>
                  <th>Auto-Optimization</th>
                  <th>Last Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredMappings.map((mapping) => (
                  <tr key={mapping.id}>
                    <td>
                      <Text>
                        {mapping.productId.length > 15
                          ? `${mapping.productId.slice(0, 15)}...`
                          : mapping.productId}
                      </Text>
                    </td>
                    <td>{mapping.sku}</td>
                    <td>{renderKeywordCell(mapping)}</td>
                    <td>{renderSuggestedKeywordCell(mapping)}</td>
                    <td>
                      <Switch
                        checked={mapping.autoKeywordEnabled}
                        onChange={() =>
                          handleToggleAutoKeyword(
                            mapping.id,
                            !mapping.autoKeywordEnabled,
                          )
                        }
                        size="sm"
                      />
                    </td>
                    <td>{formatDate(mapping.lastUpdated)}</td>
                    <td>
                      <Group gap={0} justify="right">
                        <Button
                          variant="subtle"
                          size="xs"
                          onClick={() => handleViewDetails(mapping)}
                        >
                          Details
                        </Button>
                        <Menu position="bottom-end" withArrow>
                          <Menu.Target>
                            <ActionIcon>
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            {onViewProductDetails && (
                              <Menu.Item
                                leftSection={<IconSettings size={14} />}
                                onClick={() =>
                                  onViewProductDetails(mapping.productId)
                                }
                              >
                                View Product Details
                              </Menu.Item>
                            )}
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={() => handleViewDetails(mapping)}
                            >
                              Edit Mapping
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconTrash size={14} />}
                              color="red"
                            >
                              Delete Mapping
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </ScrollArea>
        )}
      </Card>

      {/* Mapping Details Drawer */}
      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={<Title order={3}>Keyword Mapping Details</Title>}
        padding="lg"
        size="lg"
        position="right"
      >
        {selectedMapping && (
          <Stack gap="md">
            <Group justify="apart">
              <Box>
                <Text fw={500} size="sm" c="dimmed">
                  Product ID
                </Text>
                <Text fw={700}>{selectedMapping.productId}</Text>
              </Box>
              <Box>
                <Text fw={500} size="sm" c="dimmed">
                  SKU
                </Text>
                <Text fw={700}>{selectedMapping.sku}</Text>
              </Box>
              <Box>
                <Text fw={500} size="sm" c="dimmed">
                  Last Updated
                </Text>
                <Text>{formatDate(selectedMapping.lastUpdated)}</Text>
              </Box>
            </Group>

            <Switch
              label="Auto Keyword Optimization"
              description="Automatically optimize product attributes based on keywords"
              checked={selectedMapping.autoKeywordEnabled}
              onChange={() =>
                handleToggleAutoKeyword(
                  selectedMapping.id,
                  !selectedMapping.autoKeywordEnabled,
                )
              }
              size="md"
            />

            <Divider label="Associated Keywords" labelPosition="center" />

            <ScrollArea h={120}>
              <Group gap="xs">
                {selectedMapping.keywords.map((k, index) => (
                  <KeywordChip key={index} keyword={k.keyword} />
                ))}
              </Group>
            </ScrollArea>

            <Divider label="Suggested Keywords" labelPosition="center" />

            <ScrollArea h={120}>
              <Group gap="xs">
                {selectedMapping.suggestedKeywords.length === 0 ? (
                  <Text c="dimmed">No suggested keywords available</Text>
                ) : (
                  selectedMapping.suggestedKeywords.map((k, index) => (
                    <KeywordChip
                      key={index}
                      keyword={k.keyword}
                      opportunity={k.opportunity}
                      color="green"
                      variant="outline"
                    />
                  ))
                )}
              </Group>
            </ScrollArea>

            <Divider label="Blacklisted Keywords" labelPosition="center" />

            <ScrollArea h={80}>
              <Group gap="xs">
                {selectedMapping.blacklistedKeywords.length === 0 ? (
                  <Text c="dimmed">No blacklisted keywords</Text>
                ) : (
                  selectedMapping.blacklistedKeywords.map((keyword, index) => (
                    <KeywordChip
                      key={index}
                      keyword={keyword}
                      color="red"
                      variant="filled"
                      onRemove={() =>
                        handleRemoveFromBlacklist(selectedMapping.id, keyword)
                      }
                    />
                  ))
                )}
              </Group>
            </ScrollArea>

            <Divider label="Attribute Recommendations" labelPosition="center" />

            <ScrollArea h={200}>
              {renderAttributeRecommendations(
                selectedMapping.attributeRecommendations,
              )}
            </ScrollArea>

            <Group justify="apart" mt="xl">
              <Button
                variant="subtle"
                color="gray"
                onClick={() => setDrawerOpen(false)}
              >
                Close
              </Button>
              {onViewProductDetails && (
                <Button
                  onClick={() => {
                    setDrawerOpen(false);
                    onViewProductDetails(selectedMapping.productId);
                  }}
                >
                  View Product Details
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </Drawer>
    </>
  );
}
