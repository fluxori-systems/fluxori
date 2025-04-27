"use client";

import React, { useState } from "react";

import {
  Box,
  Button,
  Card,
  Checkbox,
  Group,
  MultiSelect,
  Combobox,
  NumberInput,
  Radio,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Divider,
  Alert,
  Tabs,
  Badge,
  Paper,
  Switch,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

import {
  IconAlertCircle,
  IconClock,
  IconShoppingCart,
  IconBulb,
  IconInfoCircle,
  IconCurrencyDollar,
} from "@tabler/icons-react";

import { useAuth } from "../../../lib/firebase/useAuth";

/**
 * Marketplace option interface
 */
export interface MarketplaceOption {
  value: string;
  label: string;
  description?: string;
}

/**
 * Component props
 */
export interface CompetitorWatchFormProps {
  onSuccess?: () => void;
  marketplaceOptions?: MarketplaceOption[];
}

/**
 * Alert thresholds for different alert types
 */
export interface AlertThresholds {
  priceChangePercent: number;
  rankingChangePositions: number;
  reviewCountChange: number;
  ratingChangeAmount: number;
}

/**
 * South African market-specific options
 */
export interface SaMarketOptions {
  trackLoadSheddingImpact: boolean;
  monitorPriceIncreasesDuringEvents: boolean;
  focusOnLocalCompetitors: boolean;
}

/**
 * Form values for the competitor watch form
 */
export interface CompetitorWatchFormValues {
  watchType: "keyword" | "product";
  keyword: string;
  productId: string;
  competitorIds: string[];
  marketplaces: string[];
  alertTypes: string[];
  thresholds: AlertThresholds;
  frequency: "hourly" | "daily" | "weekly";
  notificationChannels: string[];
  saMarketOptions: SaMarketOptions;
}

/**
 * Credit cost estimation response
 */
export interface CreditCostEstimate {
  creditCost: number;
  hasCredits: boolean;
  availableCredits?: number;
}

// Combobox item interface with description field
interface CustomComboboxItem {
  value: string;
  label: string;
  description?: string;
  group?: string;
  disabled?: boolean;
}

/**
 * Component for creating competitor watch configurations
 */
export function CompetitorWatchForm({
  onSuccess,
  marketplaceOptions,
}: CompetitorWatchFormProps) {
  const { user, refreshToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [creditCost, setCreditCost] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([
    "smartphone",
    "laptop",
    "headphones",
    "tv",
    "tablet",
    "camera",
    "speaker",
    "power bank",
    "load shedding",
    "battery backup",
    "wifi router",
    "solar",
    "inverter",
  ]);

  // Default South African marketplace options
  const defaultMarketplaces: MarketplaceOption[] = [
    {
      value: "takealot",
      label: "Takealot",
      description: "South Africa's largest online retailer",
    },
    {
      value: "makro",
      label: "Makro",
      description: "Wholesale retailer with strong click & collect presence",
    },
    {
      value: "loot",
      label: "Loot",
      description: "Online marketplace with focus on books and electronics",
    },
    {
      value: "game",
      label: "Game",
      description: "Department store with competitive electronics pricing",
    },
    {
      value: "incredible",
      label: "Incredible Connection",
      description: "Tech and computer focused retailer",
    },
    {
      value: "hificorp",
      label: "HiFi Corp",
      description: "Home electronics and appliance specialist",
    },
  ];

  // Use provided options or defaults
  const saMarketplaces = marketplaceOptions || defaultMarketplaces;

  const form = useForm<CompetitorWatchFormValues>({
    initialValues: {
      watchType: "keyword",
      keyword: "",
      productId: "",
      competitorIds: [],
      marketplaces: [],
      alertTypes: [],
      thresholds: {
        priceChangePercent: 5,
        rankingChangePositions: 3,
        reviewCountChange: 10,
        ratingChangeAmount: 0.5,
      },
      frequency: "daily",
      notificationChannels: ["app"],
      saMarketOptions: {
        trackLoadSheddingImpact: true,
        monitorPriceIncreasesDuringEvents: true,
        focusOnLocalCompetitors: true,
      },
    },
    validate: {
      keyword: (value, values) =>
        values.watchType === "keyword" && !value ? "Keyword is required" : null,
      productId: (value, values) =>
        values.watchType === "product" && !value
          ? "Product ID is required"
          : null,
      marketplaces: (value) =>
        !value || value.length === 0
          ? "At least one marketplace is required"
          : null,
      alertTypes: (value) =>
        !value || value.length === 0
          ? "At least one alert type is required"
          : null,
    },
  });

  /**
   * Handles form submission
   */
  const handleSubmit = async (
    values: CompetitorWatchFormValues,
  ): Promise<void> => {
    try {
      setLoading(true);

      const token = await refreshToken();
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      // Create the watch request data
      const watchData = {
        ...values,
        // Only include the relevant field based on watchType
        keyword: values.watchType === "keyword" ? values.keyword : undefined,
        productId:
          values.watchType === "product" ? values.productId : undefined,
        // Include South African market options
        metadata: {
          saMarketOptions: values.saMarketOptions,
        },
      };

      const response = await fetch(
        "/api/credit-system/competitor-alerts/watches",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(watchData),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create competitor watch");
      }

      notifications.show({
        title: "Success",
        message:
          "Competitor watch has been created successfully for the South African market",
        color: "green",
      });

      form.reset();
      setCreditCost(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to create competitor watch",
        color: "red",
      });
      console.error("Error creating competitor watch:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Estimates the credit cost for the current configuration
   */
  const handleEstimateCost = async (): Promise<void> => {
    // Only estimate if required fields are filled
    const marketplacesError = form.validateField("marketplaces").hasError;
    const alertTypesError = form.validateField("alertTypes").hasError;

    if (marketplacesError || alertTypesError) {
      form.validate();
      return;
    }

    try {
      setEstimating(true);

      const token = await refreshToken();
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await fetch(
        "/api/credit-system/competitor-alerts/watches/estimate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            alertTypes: form.values.alertTypes,
            frequency: form.values.frequency,
            marketplaces: form.values.marketplaces,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to estimate credit cost");
      }

      const data = await response.json();
      setCreditCost(data.creditCost);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to estimate credit cost",
        color: "red",
      });
      console.error("Error estimating cost:", error);
    } finally {
      setEstimating(false);
    }
  };

  /**
   * Adds a suggested keyword to the form
   */
  const addSuggestedKeyword = (keyword: string): void => {
    if (form.values.watchType === "keyword") {
      form.setFieldValue("keyword", keyword);
    }
  };

  // Custom item component for MultiSelect displays
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

  // Handle competitor ID creation
  const handleCompetitorIdCreate = (query: string): string => {
    const updatedCompetitorIds = [...form.values.competitorIds, query];
    form.setFieldValue("competitorIds", updatedCompetitorIds);
    return query;
  };

  return (
    <Box>
      <Title order={2} mb="md">
        South African Competitor Watch
        <Badge ml="md" color="blue">
          Beta
        </Badge>
      </Title>
      <Text c="dimmed" mb="xl">
        Monitor your competition across South African marketplaces and receive
        real-time alerts about price changes, ranking shifts, and more.
      </Text>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Card withBorder p="md" radius="md" shadow="sm">
          <Tabs
            value={activeTab}
            onChange={(value) => setActiveTab(value || "basic")}
          >
            <Tabs.List>
              <Tabs.Tab value="basic">Watch Configuration</Tabs.Tab>
              <Tabs.Tab value="alerts">Alert Settings</Tabs.Tab>
              <Tabs.Tab value="saOptions">SA Market Options</Tabs.Tab>
              <Tabs.Tab value="notifications">Notifications</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="basic" pt="md">
              <Stack gap="md">
                <Radio.Group
                  label="Watch Type"
                  description="Select what you want to monitor"
                  withAsterisk
                  {...form.getInputProps("watchType")}
                >
                  <Group mt="xs">
                    <Radio value="keyword" label="Keyword" />
                    <Radio value="product" label="Product" />
                  </Group>
                </Radio.Group>

                {form.values.watchType === "keyword" ? (
                  <>
                    <TextInput
                      label="Keyword"
                      placeholder="Enter keyword to monitor"
                      withAsterisk
                      {...form.getInputProps("keyword")}
                    />

                    <Paper withBorder p="xs">
                      <Text size="sm" fw={500} mb="xs">
                        Popular South African Keywords
                      </Text>
                      <Group gap="xs">
                        {suggestedKeywords.map((keyword, index) => (
                          <Badge
                            key={index}
                            style={{ cursor: "pointer" }}
                            onClick={() => addSuggestedKeyword(keyword)}
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </Group>
                    </Paper>
                  </>
                ) : (
                  <TextInput
                    label="Product ID"
                    placeholder="Enter your product ID"
                    withAsterisk
                    {...form.getInputProps("productId")}
                  />
                )}

                <MultiSelect
                  label="Competitor IDs/URLs"
                  description="Optional: Enter specific competitors to watch"
                  placeholder="Enter competitor IDs or URLs"
                  data={form.values.competitorIds}
                  searchable
                  comboboxProps={{ withinPortal: true }}
                  /* onCreate removed to match supported props */
                  {...form.getInputProps("competitorIds")}
                />

                <MultiSelect
                  label="Marketplaces"
                  description="Select South African marketplaces to monitor"
                  placeholder="Select marketplaces"
                  data={saMarketplaces.map((m) => ({
                    value: m.value,
                    label: m.label,
                  }))}
                  searchable
                  comboboxProps={{ withinPortal: true }}
                  withAsterisk
                  {...form.getInputProps("marketplaces")}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="alerts" pt="md">
              <Stack gap="md">
                <MultiSelect
                  label="Alert Types"
                  description="Select what changes to monitor"
                  placeholder="Select alert types"
                  data={[
                    {
                      value: "price_change",
                      label: "Price Changes",
                      group: "Essential",
                    },
                    {
                      value: "ranking_change",
                      label: "Ranking Changes",
                      group: "Essential",
                    },
                    {
                      value: "new_competitor",
                      label: "New Competitors",
                      group: "Essential",
                    },
                    {
                      value: "stock_status_change",
                      label: "Stock Status Changes",
                      group: "Essential",
                    },
                    {
                      value: "review_change",
                      label: "Review Changes",
                      group: "Additional",
                    },
                    {
                      value: "promotion_change",
                      label: "Promotion Changes",
                      group: "Additional",
                    },
                    {
                      value: "description_change",
                      label: "Description Changes",
                      group: "Additional",
                    },
                  ]}
                  comboboxProps={{ withinPortal: true }}
                  withAsterisk
                  {...form.getInputProps("alertTypes")}
                />

                <Title order={5} mt="xs">
                  Alert Thresholds
                </Title>

                {Array.isArray(form.values.alertTypes) &&
                  form.values.alertTypes.includes("price_change") && (
                    <NumberInput
                      label="Price Change Threshold"
                      description="Minimum percentage change to trigger alert"
                      placeholder="5"
                      min={1}
                      max={50}
                      suffix="%"
                      leftSection={<IconCurrencyDollar size={16} />}
                      {...form.getInputProps("thresholds.priceChangePercent")}
                    />
                  )}

                {Array.isArray(form.values.alertTypes) &&
                  form.values.alertTypes.includes("ranking_change") && (
                    <NumberInput
                      label="Ranking Change Threshold"
                      description="Minimum position change to trigger alert"
                      placeholder="3"
                      min={1}
                      max={20}
                      suffix=" positions"
                      {...form.getInputProps(
                        "thresholds.rankingChangePositions",
                      )}
                    />
                  )}

                {Array.isArray(form.values.alertTypes) &&
                  form.values.alertTypes.includes("review_change") && (
                    <Group grow>
                      <NumberInput
                        label="Review Count Threshold"
                        description="Minimum new reviews to trigger alert"
                        placeholder="10"
                        min={1}
                        max={100}
                        {...form.getInputProps("thresholds.reviewCountChange")}
                      />
                      <NumberInput
                        label="Rating Change Threshold"
                        description="Minimum rating change to trigger alert"
                        placeholder="0.5"
                        min={0.1}
                        max={5}
                        step={0.1}
                        decimalScale={1}
                        {...form.getInputProps("thresholds.ratingChangeAmount")}
                      />
                    </Group>
                  )}

                <Select
                  label="Check Frequency"
                  description="How often to check for changes"
                  placeholder="Select frequency"
                  data={[
                    {
                      value: "hourly",
                      label: "Hourly (Higher cost, faster alerts)",
                    },
                    { value: "daily", label: "Daily (Recommended)" },
                    {
                      value: "weekly",
                      label: "Weekly (Lower cost, slower alerts)",
                    },
                  ]}
                  leftSection={<IconClock size={16} />}
                  comboboxProps={{ withinPortal: true }}
                  {...form.getInputProps("frequency")}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="saOptions" pt="md">
              <Stack gap="md">
                <Alert icon={<IconInfoCircle size={16} />} color="blue" mb="md">
                  <Text fw={500}>South African Market Specific Options</Text>
                  <Text size="sm">
                    These specialized features are designed for the South
                    African e-commerce landscape, helping you stay competitive
                    in our unique market conditions.
                  </Text>
                </Alert>

                <Switch
                  label="Track Load Shedding Impact"
                  description="Monitor price & stock changes during load shedding periods"
                  checked={form.values.saMarketOptions.trackLoadSheddingImpact}
                  onChange={(event) =>
                    form.setFieldValue(
                      "saMarketOptions.trackLoadSheddingImpact",
                      event.currentTarget.checked,
                    )
                  }
                  size="md"
                />

                <Switch
                  label="Monitor Price Increases During Events"
                  description="Get alerts for price increases during Black Friday, month-end, and holidays"
                  checked={
                    form.values.saMarketOptions
                      .monitorPriceIncreasesDuringEvents
                  }
                  onChange={(event) =>
                    form.setFieldValue(
                      "saMarketOptions.monitorPriceIncreasesDuringEvents",
                      event.currentTarget.checked,
                    )
                  }
                  size="md"
                />

                <Switch
                  label="Focus on Local Competitors"
                  description="Prioritize South African-based sellers in competitor analysis"
                  checked={form.values.saMarketOptions.focusOnLocalCompetitors}
                  onChange={(event) =>
                    form.setFieldValue(
                      "saMarketOptions.focusOnLocalCompetitors",
                      event.currentTarget.checked,
                    )
                  }
                  size="md"
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="notifications" pt="md">
              <Stack gap="md">
                <Title order={5}>Notification Settings</Title>

                <MultiSelect
                  label="Notification Channels"
                  description="How you'll receive alerts"
                  placeholder="Select notification channels"
                  data={[
                    {
                      value: "app",
                      label: "In-App Notification",
                      group: "Available",
                    },
                    { value: "email", label: "Email", group: "Available" },
                    {
                      value: "sms",
                      label: "SMS (Coming Soon)",
                      group: "Coming Soon",
                      disabled: true,
                    },
                    {
                      value: "whatsapp",
                      label: "WhatsApp (Coming Soon)",
                      group: "Coming Soon",
                      disabled: true,
                    },
                  ]}
                  defaultValue={["app"]}
                  comboboxProps={{ withinPortal: true }}
                  {...form.getInputProps("notificationChannels")}
                />

                <Checkbox
                  label="Send Critical Alerts Only"
                  description="Only send notifications for high-impact changes"
                />

                <Checkbox
                  label="Group Alerts by Marketplace"
                  description="Combine multiple alerts from the same marketplace"
                />
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Divider my="md" />

          {creditCost !== null && (
            <Alert icon={<IconClock size={16} />} color="blue" mb="md">
              <Text>
                Estimated credit cost: <b>{creditCost} credits</b> per month
              </Text>
              <Text size="sm" c="dimmed">
                Costs vary based on frequency and number of marketplaces
                monitored.
              </Text>
            </Alert>
          )}

          <Group justify="apart" mt="lg">
            <Button
              variant="outline"
              onClick={handleEstimateCost}
              loading={estimating}
              disabled={loading}
              leftSection={<IconCurrencyDollar size={16} />}
            >
              Estimate Credit Cost
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={estimating}
              leftSection={<IconAlertCircle size={16} />}
            >
              Create Competitor Watch
            </Button>
          </Group>
        </Card>
      </form>
    </Box>
  );
}
