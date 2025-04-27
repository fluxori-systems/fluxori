"use client";

import React, { useState } from "react";

import {
  Card,
  Text,
  MultiSelect,
  Button,
  Stack,
  Group,
  Divider,
  Badge,
  Select,
  Textarea,
  Checkbox,
  Radio,
  TextInput,
} from "@mantine/core";

import {
  IconCreditCard,
  IconChartBar,
  IconBuildingStore,
} from "@tabler/icons-react";

export type AnalysisType = "basic" | "comprehensive" | "deep-dive";
export type TimeFrame = "7-days" | "30-days" | "90-days" | "custom";
export type PriorityLevel = "low" | "medium" | "high";

export interface MarketplaceData {
  value: string;
  label: string;
}

export interface StrategyFormData {
  marketplaces: string[];
  analysisType: AnalysisType;
  competitorAnalysis: boolean;
  includeRecommendations: boolean;
  timeFrame: TimeFrame;
  notes: string;
  priorityLevel: PriorityLevel;
}

interface StrategyFormProps {
  onSubmit: (data: StrategyFormData) => void;
}

export function StrategyForm({ onSubmit }: StrategyFormProps) {
  const [marketplaces, setMarketplaces] = useState<string[]>(["takealot"]);
  const [analysisType, setAnalysisType] =
    useState<AnalysisType>("comprehensive");
  const [competitorAnalysis, setCompetitorAnalysis] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("30-days");
  const [notes, setNotes] = useState("");
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>("medium");

  // Calculate estimated credits
  const getEstimatedCredits = (): number => {
    let credits = 15; // Base cost

    // Additional cost per marketplace
    credits += (marketplaces.length - 1) * 5;

    // Analysis type costs
    if (analysisType === "comprehensive") credits += 10;
    if (analysisType === "deep-dive") credits += 20;

    // Additional options
    if (competitorAnalysis) credits += 8;
    if (includeRecommendations) credits += 5;

    // Priority adjustment
    if (priorityLevel === "high") credits *= 1.5;

    return Math.round(credits);
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    if (!marketplaces.length || !analysisType) return;

    onSubmit({
      marketplaces,
      analysisType,
      competitorAnalysis,
      includeRecommendations,
      timeFrame,
      notes,
      priorityLevel,
    });
  };

  const handleAnalysisTypeChange = (value: string | null): void => {
    if (value) {
      setAnalysisType(value as AnalysisType);
    }
  };

  const handleTimeFrameChange = (value: string | null): void => {
    if (value) {
      setTimeFrame(value as TimeFrame);
    }
  };

  const handlePriorityChange = (value: string): void => {
    setPriorityLevel(value as PriorityLevel);
  };

  return (
    <Card withBorder p="md">
      <Text fw={500} size="lg" mb="md">
        Marketplace Strategy Request
      </Text>

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <MultiSelect
            label="Target Marketplaces"
            placeholder="Select marketplaces"
            value={marketplaces}
            onChange={setMarketplaces}
            data={[
              { value: "takealot", label: "Takealot" },
              { value: "makro", label: "Makro" },
              { value: "loot", label: "Loot" },
              { value: "buck_cheap", label: "Buck & Cheap" },
              { value: "bob_shop", label: "Bob Shop" },
            ]}
            leftSection={<IconBuildingStore size={16} />}
            required
          />

          <Select
            label="Analysis Type"
            placeholder="Select analysis type"
            value={analysisType}
            onChange={handleAnalysisTypeChange}
            data={[
              { value: "basic", label: "Basic Analysis" },
              { value: "comprehensive", label: "Comprehensive Analysis" },
              { value: "deep-dive", label: "Deep Dive Analysis" },
            ]}
            required
          />

          <Select
            label="Time Frame"
            placeholder="Select time frame"
            value={timeFrame}
            onChange={handleTimeFrameChange}
            data={[
              { value: "7-days", label: "Last 7 Days" },
              { value: "30-days", label: "Last 30 Days" },
              { value: "90-days", label: "Last 90 Days" },
              { value: "custom", label: "Custom Range" },
            ]}
          />

          <Divider my="xs" label="Options" labelPosition="center" />

          <Stack gap="xs">
            <Checkbox
              label="Include competitor analysis"
              checked={competitorAnalysis}
              onChange={(e) => setCompetitorAnalysis(e.currentTarget.checked)}
            />

            <Checkbox
              label="Include AI-powered recommendations"
              checked={includeRecommendations}
              onChange={(e) =>
                setIncludeRecommendations(e.currentTarget.checked)
              }
            />
          </Stack>

          <Radio.Group
            label="Priority Level"
            value={priorityLevel}
            onChange={handlePriorityChange}
          >
            <Group mt="xs">
              <Radio value="low" label="Low" />
              <Radio value="medium" label="Medium" />
              <Radio value="high" label="High (2x faster)" />
            </Group>
          </Radio.Group>

          <Textarea
            label="Additional Notes"
            placeholder="Enter any specific areas of interest or questions"
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
            minRows={3}
          />

          <Divider my="xs" />

          <Group justify="apart">
            <Group gap="xs">
              <IconCreditCard size={16} />
              <Text size="sm">Estimated Credits:</Text>
            </Group>
            <Badge size="lg" color="blue">
              {getEstimatedCredits()}
            </Badge>
          </Group>

          <Button
            type="submit"
            fullWidth
            leftSection={<IconChartBar size={16} />}
          >
            Generate Strategy
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
