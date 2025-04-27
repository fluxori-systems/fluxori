"use client";

import React, { useState, FormEvent, ChangeEvent } from "react";

import {
  Card,
  Text,
  TextInput,
  Select,
  Button,
  Stack,
  Group,
  Checkbox,
  Badge,
  Divider,
} from "@mantine/core";

import { IconSearch, IconCreditCard } from "@tabler/icons-react";

export interface KeywordAnalyticsOptions {
  includeCompetitors: boolean;
  includeSeasonality: boolean;
  includeTrendPrediction: boolean;
  includeMarketShare: boolean;
}

export interface KeywordAnalyticsFormProps {
  onSubmit: (
    keyword: string,
    marketplace: string,
    options: KeywordAnalyticsOptions,
  ) => void;
}

/**
 * Form component for requesting keyword analytics,
 * with credit system integration and marketplace selection
 */
export function KeywordAnalyticsForm({
  onSubmit,
}: KeywordAnalyticsFormProps): JSX.Element {
  const [keyword, setKeyword] = useState<string>("");
  const [marketplace, setMarketplace] = useState<string>("takealot");
  const [includeCompetitors, setIncludeCompetitors] = useState<boolean>(true);
  const [includeSeasonality, setIncludeSeasonality] = useState<boolean>(true);
  const [includeTrendPrediction, setIncludeTrendPrediction] =
    useState<boolean>(true);
  const [includeMarketShare, setIncludeMarketShare] = useState<boolean>(true);

  // Calculate estimated credits
  const getEstimatedCredits = (): number => {
    let credits = 5; // Base cost

    if (includeCompetitors) credits += 3;
    if (includeSeasonality) credits += 2;
    if (includeTrendPrediction) credits += 4;
    if (includeMarketShare) credits += 3;

    return credits;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    if (!keyword || !marketplace) return;

    onSubmit(keyword, marketplace, {
      includeCompetitors,
      includeSeasonality,
      includeTrendPrediction,
      includeMarketShare,
    });
  };

  const handleKeywordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setKeyword(e.target.value);
  };

  const handleMarketplaceChange = (value: string | null): void => {
    setMarketplace(value || "");
  };

  const handleCheckboxChange =
    (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
    (e: ChangeEvent<HTMLInputElement>): void => {
      setter(e.currentTarget.checked);
    };

  const marketplaceOptions = [
    { value: "takealot", label: "Takealot" },
    { value: "makro", label: "Makro" },
    { value: "loot", label: "Loot" },
    { value: "buck_cheap", label: "Buck & Cheap" },
    { value: "bob_shop", label: "Bob Shop" },
  ];

  return (
    <Card withBorder p="md">
      <Text fw={500} size="lg" mb="md">
        Keyword Analytics Request
      </Text>

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Keyword or Phrase"
            placeholder="e.g. smartphone, hiking boots"
            value={keyword}
            onChange={handleKeywordChange}
            required
            leftSection={<IconSearch size={16} />}
          />

          <Select
            label="Marketplace"
            placeholder="Select marketplace"
            value={marketplace}
            onChange={handleMarketplaceChange}
            required
            data={marketplaceOptions}
          />

          <Divider my="xs" label="Analysis Options" labelPosition="center" />

          <Stack gap="xs">
            <Checkbox
              label="Competitor Analysis"
              checked={includeCompetitors}
              onChange={handleCheckboxChange(setIncludeCompetitors)}
            />

            <Checkbox
              label="Seasonality Insights"
              checked={includeSeasonality}
              onChange={handleCheckboxChange(setIncludeSeasonality)}
            />

            <Checkbox
              label="Trend Prediction"
              checked={includeTrendPrediction}
              onChange={handleCheckboxChange(setIncludeTrendPrediction)}
            />

            <Checkbox
              label="Market Share Analysis"
              checked={includeMarketShare}
              onChange={handleCheckboxChange(setIncludeMarketShare)}
            />
          </Stack>

          <Divider my="xs" />

          <Group justify="space-between">
            <Group gap="xs">
              <IconCreditCard size={16} />
              <Text size="sm">Estimated Credits:</Text>
            </Group>
            <Badge size="lg">{getEstimatedCredits()}</Badge>
          </Group>

          <Button
            type="submit"
            fullWidth
            leftSection={<IconSearch size={16} />}
          >
            Generate Analytics
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
