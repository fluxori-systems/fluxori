"use client";

import React, { useMemo } from "react";

import { Card, Text, Grid, Stack, Group, Badge, Divider } from "@mantine/core";

import {
  NetworkAwarePieChart,
  NetworkAwareBarChart,
} from "../../../components/charts";
import { useNetworkAwareChart } from "../../../hooks/useNetworkAwareChart";
import { formatCurrency } from "../../../lib/shared/utils/currency-formatter";
import { ChartDataPoint } from "../../../types/chart.types";

export interface Brand {
  brandName: string;
  productCount: number;
  averageRanking: number;
  marketSharePercent: number;
}

export interface PriceRange {
  range: string;
  count: number;
  percentage: number;
}

export interface PriceDistribution {
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
  medianPrice: number;
  priceRanges: PriceRange[];
}

export interface MarketShareData {
  totalProductCount: number;
  dominantBrands: Brand[];
  priceDistribution: PriceDistribution;
}

export interface MarketShareChartProps {
  data: MarketShareData;
}

/**
 * A network-aware chart component that displays market share analysis
 * including brand distribution and price distribution using Chart.js
 * with South African market optimizations for data saving.
 */
export function MarketShareChart({ data }: MarketShareChartProps): JSX.Element {
  const {
    shouldSimplify,
    showTextAlternative,
    getOptimizedData,
    getDesignSystemColors,
  } = useNetworkAwareChart();

  // Transform the data into the format needed for the bar chart
  const brandChartData = useMemo(() => {
    return data.dominantBrands.map((brand) => ({
      brand: brand.brandName,
      marketShare: brand.marketSharePercent,
      productCount: brand.productCount,
    }));
  }, [data.dominantBrands]);

  // Transform the data into the format needed for the pie chart
  const priceRangeChartData = useMemo(() => {
    return data.priceDistribution.priceRanges.map((range) => ({
      name: range.range,
      value: range.percentage,
    }));
  }, [data.priceDistribution.priceRanges]);

  // Get optimized data and colors
  const brands = getOptimizedData(data.dominantBrands);
  const colors = getDesignSystemColors(brands.length);

  // Handle text alternative display for poor connections
  if (showTextAlternative) {
    return (
      <Card withBorder p="md">
        <Text size="sm" fw={500} mb="xs">
          Market Share Analysis
        </Text>
        <Text size="sm">
          Total Products: {data.totalProductCount} across {brands.length} major
          brands. Dominant brand is {brands[0].brandName} with{" "}
          {brands[0].marketSharePercent.toFixed(1)}% market share. Average price
          range is {formatCurrency(data.priceDistribution.minPrice)} -{" "}
          {formatCurrency(data.priceDistribution.maxPrice)}.
        </Text>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      <Text fw={500} size="lg">
        Market Share Analysis
      </Text>

      <Grid>
        <Grid.Col span={{ md: 7 }}>
          <Card withBorder p="md">
            <Text size="sm" fw={500} mb="md">
              Brand Distribution
            </Text>
            <NetworkAwareBarChart
              data={brandChartData}
              xAxisDataKey="brand"
              yAxisDataKey="marketShare"
              colors={colors}
              height={250}
              stacked={false}
              radius={4}
              showDataLabels={!shouldSimplify}
              textAlternative="Brand market share data. Top brand has the highest share, followed by others."
              hideOnPoorConnection={false}
              xAxisLabel={shouldSimplify ? undefined : "Brands"}
              yAxisLabel={shouldSimplify ? undefined : "Market Share (%)"}
            />
          </Card>
        </Grid.Col>

        <Grid.Col span={{ md: 5 }}>
          <Card withBorder p="md" h="100%">
            <Text size="sm" fw={500} mb="md">
              Market Insights
            </Text>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">Total Products:</Text>
                <Text size="sm" fw={500}>
                  {data.totalProductCount.toLocaleString()}
                </Text>
              </Group>

              <Group justify="space-between">
                <Text size="sm">Price Range:</Text>
                <Text size="sm" fw={500}>
                  {formatCurrency(data.priceDistribution.minPrice)} -{" "}
                  {formatCurrency(data.priceDistribution.maxPrice)}
                </Text>
              </Group>

              <Group justify="space-between">
                <Text size="sm">Average Price:</Text>
                <Text size="sm" fw={500}>
                  {formatCurrency(data.priceDistribution.averagePrice)}
                </Text>
              </Group>

              <Divider my="xs" />

              <Text size="sm" fw={500}>
                Dominant Brands:
              </Text>
              <Stack gap="xs" mt="xs">
                {brands.slice(0, 3).map((brand, index) => (
                  <Group key={brand.brandName} justify="space-between">
                    <Group gap="xs">
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          backgroundColor: colors[index],
                          borderRadius: 2,
                        }}
                      />
                      <Text size="sm">{brand.brandName}</Text>
                    </Group>
                    <Badge>{brand.marketSharePercent.toFixed(1)}%</Badge>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder p="md">
        <Text size="sm" fw={500} mb="md">
          Price Distribution
        </Text>
        <Grid>
          <Grid.Col span={{ md: 5 }}>
            <NetworkAwarePieChart
              data={priceRangeChartData}
              nameKey="name"
              valueKey="value"
              height={180}
              showLabels={!shouldSimplify}
              donut={true}
              innerRadiusRatio={0.6}
              showDataLabels={!shouldSimplify}
              textAlternative="Price distribution across different ranges."
              hideOnPoorConnection={false}
            />
          </Grid.Col>
          <Grid.Col span={{ md: 7 }}>
            <Stack gap="xs">
              {data.priceDistribution.priceRanges.map((range, index) => (
                <Group key={range.range} justify="space-between">
                  <Group gap="xs">
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: colors[index % colors.length],
                        borderRadius: 2,
                      }}
                    />
                    <Text size="sm">{range.range}</Text>
                  </Group>
                  <Group gap="sm">
                    <Text size="sm">
                      {range.count.toLocaleString()} products
                    </Text>
                    <Badge>{range.percentage.toFixed(1)}%</Badge>
                  </Group>
                </Group>
              ))}
            </Stack>
          </Grid.Col>
        </Grid>
      </Card>
    </Stack>
  );
}
