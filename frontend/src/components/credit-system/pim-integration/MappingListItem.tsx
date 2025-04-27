"use client";

import React, { useState } from "react";

import {
  Paper,
  Text,
  Group,
  Badge,
  Button,
  ActionIcon,
  Menu,
  Stack,
  Collapse,
  Divider,
  List,
  Card,
  ThemeIcon,
} from "@mantine/core";

import {
  IconChevronDown,
  IconChevronUp,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconCheckbox,
  IconAdjustments,
  IconBan,
  IconTag,
  IconListDetails,
  IconArrowUp,
  IconCheck,
} from "@tabler/icons-react";

export interface KeywordRanking {
  marketplace: string;
  position: number;
  date: string;
}

export interface KeywordData {
  keyword: string;
  relevanceScore?: number;
  searchVolume?: number;
  ranking?: KeywordRanking[];
}

export type ImpactLevel = "high" | "medium" | "low";

export interface AttributeRecommendation {
  attribute: string;
  currentValue: string;
  recommendedValue: string;
  confidenceScore: number;
  impact: ImpactLevel;
  reason: string;
}

export interface KeywordProductMapping {
  id: string;
  organizationId: string;
  userId: string;
  productId: string;
  sku: string;
  keywords: KeywordData[];
  autoKeywordEnabled: boolean;
  suggestedKeywords?: KeywordData[];
  blacklistedKeywords?: string[];
  attributeRecommendations?: AttributeRecommendation[];
  lastUpdated: string;
  metadata?: Record<string, any>;
}

export interface MappingListItemProps {
  mapping: KeywordProductMapping;
  onBlacklistKeyword: (mappingId: string, keyword: string) => void;
  onRemoveFromBlacklist: (mappingId: string, keyword: string) => void;
  onSetAutoKeywordEnabled: (mappingId: string, enabled: boolean) => void;
  onApplyRecommendation: (mappingId: string, recommendationId: string) => void;
}

export function MappingListItem({
  mapping,
  onBlacklistKeyword,
  onRemoveFromBlacklist,
  onSetAutoKeywordEnabled,
  onApplyRecommendation,
}: MappingListItemProps): JSX.Element {
  const [expanded, setExpanded] = useState<boolean>(false);

  const keywordCount = mapping.keywords.length;
  const suggestedCount = mapping.suggestedKeywords?.length || 0;
  const blacklistedCount = mapping.blacklistedKeywords?.length || 0;
  const recommendationCount = mapping.attributeRecommendations?.length || 0;

  const lastUpdatedDate = new Date(mapping.lastUpdated);
  const formattedDate = lastUpdatedDate.toLocaleDateString();

  const toggleExpanded = (): void => {
    setExpanded(!expanded);
  };

  // Helper for impact level color mapping
  const getImpactColor = (impact: ImpactLevel): string => {
    switch (impact) {
      case "high":
        return "green";
      case "medium":
        return "yellow";
      case "low":
      default:
        return "gray";
    }
  };

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="apart">
        <div>
          <Group gap="xs">
            <Text fw={500}>{mapping.sku}</Text>
            <Badge
              size="sm"
              color={mapping.autoKeywordEnabled ? "green" : "gray"}
            >
              {mapping.autoKeywordEnabled ? "Auto-Optimize" : "Manual"}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">
            ID: {mapping.productId}
          </Text>
        </div>

        <Group gap="xs">
          <Button
            variant="light"
            rightSection={
              expanded ? (
                <IconChevronUp size={16} />
              ) : (
                <IconChevronDown size={16} />
              )
            }
            onClick={toggleExpanded}
            size="xs"
          >
            {expanded ? "Collapse" : "View Details"}
          </Button>

          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon>
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={16} />}>
                Edit Mapping
              </Menu.Item>
              <Menu.Item
                leftSection={
                  mapping.autoKeywordEnabled ? (
                    <IconBan size={16} />
                  ) : (
                    <IconCheckbox size={16} />
                  )
                }
                onClick={() =>
                  onSetAutoKeywordEnabled(
                    mapping.id,
                    !mapping.autoKeywordEnabled,
                  )
                }
              >
                {mapping.autoKeywordEnabled
                  ? "Disable Auto-Optimize"
                  : "Enable Auto-Optimize"}
              </Menu.Item>
              <Menu.Item leftSection={<IconAdjustments size={16} />}>
                Run Optimization
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconTrash size={16} />} color="red">
                Delete Mapping
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Group mt="md" gap="lg">
        <Badge variant="outline">{keywordCount} Keywords</Badge>
        {suggestedCount > 0 && (
          <Badge variant="outline" color="blue">
            {suggestedCount} Suggested
          </Badge>
        )}
        {blacklistedCount > 0 && (
          <Badge variant="outline" color="red">
            {blacklistedCount} Blacklisted
          </Badge>
        )}
        {recommendationCount > 0 && (
          <Badge variant="outline" color="green">
            {recommendationCount} Recommendations
          </Badge>
        )}
        <Text size="xs" c="dimmed">
          Updated: {formattedDate}
        </Text>
      </Group>

      <Collapse in={expanded} mt="md">
        <Stack gap="md">
          <Divider label="Keywords" labelPosition="center" />

          <Group gap="xs">
            {mapping.keywords.map((keywordData, index) => (
              <Badge
                key={index}
                size="lg"
                rightSection={
                  <Menu position="bottom-end">
                    <Menu.Target>
                      <ActionIcon size="xs">
                        <IconDotsVertical size={12} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconBan size={16} />}
                        onClick={() =>
                          onBlacklistKeyword(mapping.id, keywordData.keyword)
                        }
                      >
                        Blacklist Keyword
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                }
              >
                {keywordData.keyword}
                {keywordData.relevanceScore !== undefined && (
                  <Text size="xs" component="span" ml={5} c="dimmed">
                    ({(keywordData.relevanceScore * 100).toFixed(0)}%)
                  </Text>
                )}
              </Badge>
            ))}
          </Group>

          {suggestedCount > 0 && (
            <>
              <Divider label="Suggested Keywords" labelPosition="center" />
              <Group gap="xs">
                {mapping.suggestedKeywords?.map((keywordData, index) => (
                  <Badge
                    key={index}
                    size="lg"
                    color="blue"
                    variant="outline"
                    rightSection={
                      <Menu position="bottom-end">
                        <Menu.Target>
                          <ActionIcon size="xs">
                            <IconDotsVertical size={12} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<IconTag size={16} />}>
                            Add to Keywords
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconBan size={16} />}
                            onClick={() =>
                              onBlacklistKeyword(
                                mapping.id,
                                keywordData.keyword,
                              )
                            }
                          >
                            Blacklist Keyword
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    }
                  >
                    {keywordData.keyword}
                    {keywordData.relevanceScore !== undefined && (
                      <Text size="xs" component="span" ml={5} c="dimmed">
                        ({(keywordData.relevanceScore * 100).toFixed(0)}%)
                      </Text>
                    )}
                  </Badge>
                ))}
              </Group>
            </>
          )}

          {blacklistedCount > 0 && (
            <>
              <Divider label="Blacklisted Keywords" labelPosition="center" />
              <Group gap="xs">
                {mapping.blacklistedKeywords?.map((keyword, index) => (
                  <Badge
                    key={index}
                    size="lg"
                    color="red"
                    variant="outline"
                    rightSection={
                      <div
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          onRemoveFromBlacklist(mapping.id, keyword)
                        }
                      >
                        ×
                      </div>
                    }
                  >
                    {keyword}
                  </Badge>
                ))}
              </Group>
            </>
          )}

          {recommendationCount > 0 && (
            <>
              <Divider
                label="Attribute Recommendations"
                labelPosition="center"
              />
              <List spacing="xs">
                {mapping.attributeRecommendations?.map(
                  (recommendation, index) => (
                    <List.Item
                      key={index}
                      icon={
                        <ThemeIcon
                          color={getImpactColor(recommendation.impact)}
                          size={24}
                          radius="xl"
                        >
                          <IconArrowUp size={16} />
                        </ThemeIcon>
                      }
                    >
                      <Card p="xs" withBorder>
                        <Group justify="apart">
                          <div>
                            <Text size="sm" fw={500}>
                              {recommendation.attribute
                                .charAt(0)
                                .toUpperCase() +
                                recommendation.attribute.slice(1)}
                            </Text>

                            <Text size="xs" c="dimmed">
                              Current:{" "}
                              {recommendation.currentValue || "<empty>"}
                            </Text>

                            <Text size="xs">
                              Recommended:{" "}
                              <strong>{recommendation.recommendedValue}</strong>
                            </Text>

                            <Text size="xs" c="dimmed" mt={5}>
                              {recommendation.reason}
                            </Text>
                          </div>

                          <Button
                            size="xs"
                            variant="subtle"
                            leftSection={<IconCheck size={14} />}
                            onClick={() =>
                              onApplyRecommendation(
                                mapping.id,
                                index.toString(),
                              )
                            }
                            color={getImpactColor(recommendation.impact)}
                          >
                            Apply
                          </Button>
                        </Group>
                      </Card>
                    </List.Item>
                  ),
                )}
              </List>
            </>
          )}

          <Divider label="History" labelPosition="center" />
          <List size="sm">
            {mapping.metadata?.descriptionUpdated && (
              <List.Item icon={<IconListDetails size={16} />}>
                Description updated on{" "}
                {new Date(
                  mapping.metadata.descriptionUpdated,
                ).toLocaleDateString()}
              </List.Item>
            )}
            {mapping.metadata?.titleUpdated && (
              <List.Item icon={<IconListDetails size={16} />}>
                Title updated on{" "}
                {new Date(mapping.metadata.titleUpdated).toLocaleDateString()}
              </List.Item>
            )}
            {mapping.metadata?.attributesUpdated && (
              <List.Item icon={<IconListDetails size={16} />}>
                Attributes updated on{" "}
                {new Date(
                  mapping.metadata.attributesUpdated,
                ).toLocaleDateString()}
              </List.Item>
            )}
          </List>
        </Stack>
      </Collapse>
    </Paper>
  );
}
