"use client";

import React, { useState, useEffect } from "react";

import {
  Box,
  Button,
  Card,
  Checkbox,
  Group,
  MultiSelect,
  Select,
  Combobox,
  Stack,
  Text,
  TextInput,
  Title,
  Alert,
  Divider,
  Textarea,
  Loader,
  Badge,
  Accordion,
  Paper,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

import {
  IconAlertCircle,
  IconInfoCircle,
  IconShoppingCart,
  IconTargetArrow,
  IconBulb,
} from "@tabler/icons-react";

import { useAuth } from "../../../lib/firebase/useAuth";

/**
 * Strategy template from the backend
 */
export interface StrategyTemplate {
  id: string;
  name: string;
  marketplace: string;
  category?: string;
  description: string;
  creditCost: number;
}

/**
 * South African marketplace data
 */
export interface SAMarketplace {
  value: string;
  label: string;
  description: string;
}

/**
 * South African market options
 */
export interface SAMarketOptions {
  includeLoadSheddingAnalysis: boolean;
  includeRegionalPricing: boolean;
  includeLocalPaymentMethods: boolean;
}

/**
 * Credit cost estimation response
 */
export interface CreditEstimation {
  creditCost: number;
  hasCredits: boolean;
  availableCredits?: number;
}

/**
 * Strategy request form values
 */
export interface StrategyRequestFormValues {
  marketplace: string;
  productId: string;
  categoryId: string;
  keywords: string[];
  competitorUrls: string[];
  templateId: string | null;
  includeAiSummary: boolean;
  includeActionPlan: boolean;
  includeCompetitiveAnalysis: boolean;
  includeSouthAfricanInsights: boolean;
  saMarketOptions: SAMarketOptions;
}

/**
 * Strategy request form component props
 */
export interface StrategyRequestFormProps {
  onSuccess?: (result: any) => void;
}

// Extended ComboboxItem interface with description field
interface MarketplaceComboboxItem {
  value: string;
  label: string;
  description: string;
  group?: string;
}

/**
 * Component to create a new marketplace strategy request
 */
export function StrategyRequestForm({ onSuccess }: StrategyRequestFormProps) {
  const { user, refreshToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [creditCost, setCreditCost] = useState<number | null>(null);
  const [hasCredits, setHasCredits] = useState(true);
  const [templates, setTemplates] = useState<StrategyTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<
    StrategyTemplate[]
  >([]);
  const [showSAInsights, setShowSAInsights] = useState(false);

  // South African marketplace options
  const saMarketplaces: SAMarketplace[] = [
    {
      value: "takealot",
      label: "Takealot",
      description: "South Africa's largest online marketplace",
    },
    {
      value: "makro",
      label: "Makro",
      description: "Wholesaler with strong online presence",
    },
    {
      value: "loot",
      label: "Loot.co.za",
      description: "E-commerce platform with focus on books and electronics",
    },
    {
      value: "game",
      label: "Game",
      description: "Electronics and home appliance retailer",
    },
    {
      value: "bidorbuy",
      label: "Bidorbuy",
      description: "Marketplace with auction format",
    },
    {
      value: "superbalist",
      label: "Superbalist",
      description: "Fashion marketplace owned by Takealot group",
    },
  ];

  // Suggested keywords for South African market
  const suggestedKeywords = [
    "load shedding",
    "electricity backup",
    "affordable",
    "delivery",
    "takealot",
    "makro",
    "south africa",
    "free shipping",
    "cash on delivery",
    "local",
    "import",
    "voltage",
    "power outage",
    "durban",
    "johannesburg",
    "cape town",
    "pretoria",
    "black friday",
    "eskom",
    "voucher",
  ];

  const form = useForm<StrategyRequestFormValues>({
    initialValues: {
      marketplace: "",
      productId: "",
      categoryId: "",
      keywords: [],
      competitorUrls: [],
      templateId: null,
      includeAiSummary: true,
      includeActionPlan: true,
      includeCompetitiveAnalysis: true,
      includeSouthAfricanInsights: false,
      saMarketOptions: {
        includeLoadSheddingAnalysis: true,
        includeRegionalPricing: true,
        includeLocalPaymentMethods: true,
      },
    },
    validate: {
      marketplace: (value) => (!value ? "Marketplace is required" : null),
      keywords: (value) =>
        !value || value.length === 0
          ? "At least one keyword is required"
          : null,
    },
  });

  // Load templates when marketplace changes
  useEffect(() => {
    if (form.values.marketplace) {
      fetchTemplates(form.values.marketplace);
    }
  }, [form.values.marketplace]);

  // Toggle South African insights
  useEffect(() => {
    setShowSAInsights(form.values.includeSouthAfricanInsights);
  }, [form.values.includeSouthAfricanInsights]);

  const fetchTemplates = async (marketplace: string) => {
    try {
      setLoadingTemplates(true);

      const token = await refreshToken();
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await fetch(
        `/api/credit-system/marketplace-strategy/templates?marketplace=${marketplace}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();
      setTemplates(data);

      // Filter templates by marketplace
      const filtered = data.filter(
        (t: StrategyTemplate) => t.marketplace === marketplace,
      );
      setFilteredTemplates(filtered);
    } catch (error) {
      console.error("Error fetching templates:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load strategy templates",
        color: "red",
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleTemplateChange = (templateId: string | null) => {
    form.setFieldValue("templateId", templateId);

    if (templateId) {
      const selectedTemplate = templates.find((t) => t.id === templateId);

      if (selectedTemplate) {
        // Set appropriate options based on template
        if (selectedTemplate.category) {
          form.setFieldValue("categoryId", selectedTemplate.category);
        }

        // Estimate cost based on template
        setCreditCost(selectedTemplate.creditCost);
      }
    } else {
      setCreditCost(null);
    }
  };

  const handleSubmit = async (values: StrategyRequestFormValues) => {
    try {
      setLoading(true);

      const token = await refreshToken();
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      // Convert competitor URLs from textarea to array
      if (typeof values.competitorUrls === "string") {
        values.competitorUrls = (values.competitorUrls as unknown as string)
          .split("\n")
          .map((url) => url.trim())
          .filter((url) => url);
      }

      const response = await fetch(
        "/api/credit-system/marketplace-strategy/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(values),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create strategy request");
      }

      const result = await response.json();

      notifications.show({
        title: "Success",
        message: "Strategy request created successfully",
        color: "green",
      });

      if (onSuccess) {
        onSuccess(result);
      }

      // Reset form
      form.reset();
      setCreditCost(null);
    } catch (error) {
      console.error("Error creating strategy request:", error);
      notifications.show({
        title: "Error",
        message: "Failed to create strategy request",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateCost = async () => {
    try {
      setEstimating(true);

      const token = await refreshToken();
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await fetch(
        "/api/credit-system/marketplace-strategy/estimate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            marketplace: form.values.marketplace,
            templateId: form.values.templateId,
            options: {
              includeAiSummary: form.values.includeAiSummary,
              includeActionPlan: form.values.includeActionPlan,
              includeCompetitiveAnalysis:
                form.values.includeCompetitiveAnalysis,
              includeSouthAfricanInsights:
                form.values.includeSouthAfricanInsights,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to estimate cost");
      }

      const data = await response.json();
      setCreditCost(data.creditCost);
      setHasCredits(data.hasCredits);
    } catch (error) {
      console.error("Error estimating cost:", error);
      notifications.show({
        title: "Error",
        message: "Failed to estimate credit cost",
        color: "red",
      });
    } finally {
      setEstimating(false);
    }
  };

  const addSuggestedKeywords = () => {
    const currentKeywords = form.values.keywords;
    const randomKeywords = suggestedKeywords
      .filter((k) => !currentKeywords.includes(k))
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);

    form.setFieldValue("keywords", [...currentKeywords, ...randomKeywords]);
  };

  // Custom item component for Select displays
  const SelectItemComponent = React.forwardRef<
    HTMLDivElement,
    { label: string; description?: string }
  >(({ label, description }, ref) => (
    <Box ref={ref}>
      <Text size="sm">{label}</Text>
      {description && (
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      )}
    </Box>
  ));
  SelectItemComponent.displayName = "SelectItemComponent";

  // Handle keyword creation
  const handleKeywordCreate = (query: string): string => {
    const newKeyword = query;
    form.setFieldValue("keywords", [...form.values.keywords, newKeyword]);
    return newKeyword;
  };

  return (
    <Box>
      <Title order={2} mb="md">
        South African Marketplace Strategy
        <Badge ml="md" color="blue">
          Beta
        </Badge>
      </Title>

      <Text c="dimmed" mb="md">
        Create a tailored strategy to improve your product's performance on
        South African marketplaces with AI-powered competitive analysis and
        regional insights.
      </Text>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Card withBorder p="md" radius="md" shadow="sm">
          <Stack gap="md">
            <Group grow align="flex-start">
              <Select
                label="Target Marketplace"
                placeholder="Select South African marketplace"
                description="Choose the marketplace for your strategy"
                data={saMarketplaces.map((m) => ({
                  value: m.value,
                  label: m.label,
                }))}
                /* removed custom itemComponent to match supported props */
                searchable
                comboboxProps={{ withinPortal: true }}
                withAsterisk
                style={{ flex: 1 }}
                {...form.getInputProps("marketplace")}
              />

              <Select
                label="Strategy Template"
                placeholder="Select a template (optional)"
                description="Pre-defined strategies for specific markets"
                clearable
                searchable
                leftSection={
                  loadingTemplates ? (
                    <Loader size={16} />
                  ) : (
                    <IconTargetArrow size={16} />
                  )
                }
                data={filteredTemplates.map((t) => ({
                  value: t.id,
                  label: t.name,
                  group: t.marketplace,
                }))}
                value={form.values.templateId}
                onChange={handleTemplateChange}
                /* removed custom itemComponent to match supported props */
                comboboxProps={{ withinPortal: true }}
                style={{ flex: 1 }}
              />
            </Group>

            <Divider label="Target Details" labelPosition="center" />

            <Group grow>
              <TextInput
                label="Product ID"
                placeholder="Enter product ID for specific strategy"
                description="For product-specific recommendations"
                {...form.getInputProps("productId")}
              />

              <TextInput
                label="Category ID"
                placeholder="Enter category ID"
                description="For category-level strategy"
                {...form.getInputProps("categoryId")}
              />
            </Group>

            <Box>
              <Group justify="apart" mb="xs">
                <Text fw={500} size="sm">
                  Keywords
                </Text>
                <Button
                  variant="subtle"
                  size="compact-sm"
                  leftSection={<IconBulb size={16} />}
                  onClick={addSuggestedKeywords}
                >
                  Add SA Market Keywords
                </Button>
              </Group>

              <MultiSelect
                description="Enter relevant keywords for your product/category"
                placeholder="Add keywords for strategy analysis"
                data={form.values.keywords}
                searchable
                comboboxProps={{ withinPortal: true }}
                /* removed onCreate to match supported props */
                withAsterisk
                {...form.getInputProps("keywords")}
              />
            </Box>

            <Textarea
              label="Competitor URLs"
              description="Add competitor URLs, one per line (optional)"
              placeholder="https://www.example.com/product-1&#10;https://www.example.com/product-2"
              autosize
              minRows={2}
              maxRows={5}
              value={form.values.competitorUrls.join("\n")}
              onChange={(event) =>
                form.setFieldValue(
                  "competitorUrls",
                  event.currentTarget.value
                    .split("\n")
                    .map((url) => url.trim())
                    .filter((url) => url),
                )
              }
            />

            <Divider label="Analysis Options" labelPosition="center" />

            <Group>
              <Checkbox
                label="AI Summary"
                description="Include AI-generated analysis summary"
                checked={form.values.includeAiSummary}
                onChange={(event) =>
                  form.setFieldValue(
                    "includeAiSummary",
                    event.currentTarget.checked,
                  )
                }
              />

              <Checkbox
                label="Action Plan"
                description="Step-by-step recommended actions"
                checked={form.values.includeActionPlan}
                onChange={(event) =>
                  form.setFieldValue(
                    "includeActionPlan",
                    event.currentTarget.checked,
                  )
                }
              />

              <Checkbox
                label="Competitive Analysis"
                description="Detailed competitor comparison"
                checked={form.values.includeCompetitiveAnalysis}
                onChange={(event) =>
                  form.setFieldValue(
                    "includeCompetitiveAnalysis",
                    event.currentTarget.checked,
                  )
                }
              />

              <Checkbox
                label="South African Insights"
                description="Regional market insights"
                checked={form.values.includeSouthAfricanInsights}
                onChange={(event) =>
                  form.setFieldValue(
                    "includeSouthAfricanInsights",
                    event.currentTarget.checked,
                  )
                }
              />
            </Group>

            {showSAInsights && (
              <Paper withBorder p="sm" radius="md">
                <Text fw={500} mb="xs">
                  South African Market Options
                </Text>
                <Stack gap="xs">
                  <Checkbox
                    label="Load Shedding Analysis"
                    description="Analyze impact of power outages on pricing and demand"
                    checked={
                      form.values.saMarketOptions.includeLoadSheddingAnalysis
                    }
                    onChange={(event) =>
                      form.setFieldValue(
                        "saMarketOptions.includeLoadSheddingAnalysis",
                        event.currentTarget.checked,
                      )
                    }
                  />

                  <Checkbox
                    label="Regional Pricing Strategy"
                    description="Pricing recommendations for different regions of South Africa"
                    checked={form.values.saMarketOptions.includeRegionalPricing}
                    onChange={(event) =>
                      form.setFieldValue(
                        "saMarketOptions.includeRegionalPricing",
                        event.currentTarget.checked,
                      )
                    }
                  />

                  <Checkbox
                    label="Local Payment Methods"
                    description="Analysis of preferred payment methods by marketplace"
                    checked={
                      form.values.saMarketOptions.includeLocalPaymentMethods
                    }
                    onChange={(event) =>
                      form.setFieldValue(
                        "saMarketOptions.includeLocalPaymentMethods",
                        event.currentTarget.checked,
                      )
                    }
                  />
                </Stack>
              </Paper>
            )}

            {creditCost !== null && (
              <Alert
                color={hasCredits ? "blue" : "yellow"}
                icon={<IconAlertCircle size={16} />}
              >
                <Text>
                  Estimated cost: <b>{creditCost} credits</b>
                </Text>
                {!hasCredits && (
                  <Text size="sm" c="dimmed">
                    You need to purchase more credits to request this strategy.
                  </Text>
                )}
              </Alert>
            )}

            <Group justify="apart" mt="lg">
              <Button
                variant="outline"
                onClick={handleEstimateCost}
                loading={estimating}
                disabled={loading}
              >
                Estimate Credits
              </Button>

              <Button
                type="submit"
                loading={loading}
                disabled={estimating || (creditCost !== null && !hasCredits)}
              >
                Create Strategy Request
              </Button>
            </Group>
          </Stack>
        </Card>
      </form>
    </Box>
  );
}
