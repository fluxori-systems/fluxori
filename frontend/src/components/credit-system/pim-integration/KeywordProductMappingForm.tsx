"use client";

import React, { useState } from "react";

import {
  Card,
  Text,
  TextInput,
  MultiSelect,
  Checkbox,
  Button,
  Stack,
  Group,
  Divider,
  Badge,
  Select,
  Box,
} from "@mantine/core";

import {
  IconSearch,
  IconBuildingStore,
  IconCreditCard,
  IconX,
} from "@tabler/icons-react";

export interface MappingOptions {
  generateProductDescriptions: boolean;
  optimizeAttributeValues: boolean;
  optimizeListingTitles: boolean;
  autoKeywordEnabled: boolean;
}

export interface KeywordProductMappingFormProps {
  onSubmit: (
    productId: string,
    sku: string,
    keywords: string[],
    marketplaces: string[],
    options: MappingOptions,
  ) => void;
  initialProductId?: string;
  initialSku?: string;
}

export interface MarketplaceOption {
  value: string;
  label: string;
}

const DEFAULT_MARKETPLACES: MarketplaceOption[] = [
  { value: "takealot", label: "Takealot" },
  { value: "makro", label: "Makro" },
  { value: "loot", label: "Loot" },
  { value: "buck_cheap", label: "Buck & Cheap" },
  { value: "bob_shop", label: "Bob Shop" },
];

export function KeywordProductMappingForm({
  onSubmit,
  initialProductId = "",
  initialSku = "",
}: KeywordProductMappingFormProps): JSX.Element {
  const [productId, setProductId] = useState<string>(initialProductId);
  const [sku, setSku] = useState<string>(initialSku);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [marketplaces, setMarketplaces] = useState<string[]>(["takealot"]);
  const [keywordInput, setKeywordInput] = useState<string>("");
  const [generateDescription, setGenerateDescription] = useState<boolean>(true);
  const [optimizeAttributes, setOptimizeAttributes] = useState<boolean>(true);
  const [optimizeTitles, setOptimizeTitles] = useState<boolean>(true);
  const [autoOptimize, setAutoOptimize] = useState<boolean>(false);

  // Calculate estimated credits
  const getEstimatedCredits = (): number => {
    let credits = 10; // Base cost

    if (generateDescription) credits += 5;
    if (optimizeAttributes) credits += 3;
    if (optimizeTitles) credits += 2;
    if (autoOptimize) credits += 5;

    // Additional credit for each marketplace
    credits += (marketplaces.length - 1) * 5;

    return credits;
  };

  const handleAddKeyword = (): void => {
    if (keywordInput && !keywords.includes(keywordInput)) {
      setKeywords([...keywords, keywordInput]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string): void => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    if (
      !productId ||
      !sku ||
      keywords.length === 0 ||
      marketplaces.length === 0
    )
      return;

    const options: MappingOptions = {
      generateProductDescriptions: generateDescription,
      optimizeAttributeValues: optimizeAttributes,
      optimizeListingTitles: optimizeTitles,
      autoKeywordEnabled: autoOptimize,
    };

    onSubmit(productId, sku, keywords, marketplaces, options);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  return (
    <Card withBorder p="md">
      <Text fw={500} size="lg" mb="md">
        Keyword-Product Mapping
      </Text>

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Product ID"
            placeholder="Enter product ID"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          />

          <TextInput
            label="Product SKU"
            placeholder="Enter product SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            required
          />

          <Group align="flex-end">
            <TextInput
              label="Keywords"
              placeholder="Enter keyword"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ flexGrow: 1 }}
            />
            <Button onClick={handleAddKeyword}>Add</Button>
          </Group>

          {keywords.length > 0 && (
            <Group gap="xs">
              {keywords.map((keyword) => (
                <Badge
                  key={keyword}
                  size="lg"
                  rightSection={
                    <Box
                      style={{ cursor: "pointer" }}
                      onClick={() => handleRemoveKeyword(keyword)}
                    >
                      <IconX size={14} />
                    </Box>
                  }
                >
                  {keyword}
                </Badge>
              ))}
            </Group>
          )}

          <MultiSelect
            label="Target Marketplaces"
            placeholder="Select marketplaces"
            value={marketplaces}
            onChange={setMarketplaces}
            data={DEFAULT_MARKETPLACES}
            leftSection={<IconBuildingStore size={16} />}
            required
          />

          <Divider
            my="xs"
            label="Optimization Options"
            labelPosition="center"
          />

          <Stack gap="xs">
            <Checkbox
              label="Generate SEO-optimized product description"
              checked={generateDescription}
              onChange={(e) => setGenerateDescription(e.currentTarget.checked)}
            />

            <Checkbox
              label="Optimize product attributes"
              checked={optimizeAttributes}
              onChange={(e) => setOptimizeAttributes(e.currentTarget.checked)}
            />

            <Checkbox
              label="Optimize listing titles"
              checked={optimizeTitles}
              onChange={(e) => setOptimizeTitles(e.currentTarget.checked)}
            />

            <Checkbox
              label="Enable automatic keyword optimization"
              checked={autoOptimize}
              onChange={(e) => setAutoOptimize(e.currentTarget.checked)}
            />
          </Stack>

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
            leftSection={<IconSearch size={16} />}
          >
            Optimize Product
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
