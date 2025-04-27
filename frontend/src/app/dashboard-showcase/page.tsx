"use client";

import React, { useState } from "react";

import { ConnectionQualitySimulator } from "../../lib/motion/components/ConnectionQualitySimulator";
import { SouthAfricanOptimizedContainer } from "../../lib/motion/components/SouthAfricanOptimizedContainer";
import { Card, CardSection, Text, Button } from "../../lib/ui";
import {
  DashboardLayout,
  DashboardSection,
  DashboardGrid,
  MetricCard,
  ChartCard,
} from "../../lib/ui/components/dashboard";

export default function DashboardShowcasePage() {
  const [showConnectionControls, setShowConnectionControls] = useState(false);

  return (
    <SouthAfricanOptimizedContainer
      autoOptimize={true}
      showDataUsageWarnings={true}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
        <div style={{ marginBottom: "24px" }}>
          <Text ta="center" fz="2xl" fw={700} mb="md">
            Dashboard Layout System Showcase
          </Text>
          <Text ta="center" c="dimmed" mb="xl">
            Demonstrates the dashboard layout system with responsive grid,
            cards, and South African market optimizations
          </Text>

          <Button
            onClick={() => setShowConnectionControls(!showConnectionControls)}
            variant="light"
            style={{ marginLeft: "auto", marginBottom: 16, display: "block" }}
          >
            {showConnectionControls
              ? "Hide Connection Controls"
              : "Show Connection Controls"}
          </Button>

          {showConnectionControls && (
            <Card mb="xl" p="md">
              <Text mb="md" fw={600}>
                Connection Quality Simulator
              </Text>
              <ConnectionQualitySimulator />
            </Card>
          )}
        </div>

        <DashboardLayout
          showDensityControls={true}
          defaultDensity="comfortable"
          networkAware={true}
        >
          {/* KPI Section */}
          <DashboardSection
            id="kpi-section"
            title="Key Performance Indicators"
            description="Overview of critical metrics"
            collapsible={true}
          >
            <DashboardGrid columns={12} gap="md">
              <DashboardGrid.Col span={{ xs: 12, sm: 6, md: 3 }}>
                <MetricCard
                  id="revenue-metric"
                  title="Total Revenue"
                  value={1250976}
                  previousValue={1120500}
                  percentChange={11.6}
                  isPositiveWhenUp={true}
                  format="$0,0"
                  refreshInterval={30000}
                />
              </DashboardGrid.Col>

              <DashboardGrid.Col span={{ xs: 12, sm: 6, md: 3 }}>
                <MetricCard
                  id="orders-metric"
                  title="Orders"
                  value={8254}
                  previousValue={7844}
                  percentChange={5.2}
                  isPositiveWhenUp={true}
                  refreshInterval={30000}
                />
              </DashboardGrid.Col>

              <DashboardGrid.Col span={{ xs: 12, sm: 6, md: 3 }}>
                <MetricCard
                  id="conversion-metric"
                  title="Conversion Rate"
                  value={4.8}
                  previousValue={4.2}
                  percentChange={14.3}
                  format="0.0%"
                  isPositiveWhenUp={true}
                  refreshInterval={60000}
                />
              </DashboardGrid.Col>

              <DashboardGrid.Col span={{ xs: 12, sm: 6, md: 3 }}>
                <MetricCard
                  id="aov-metric"
                  title="Average Order Value"
                  value={152}
                  previousValue={145}
                  percentChange={4.8}
                  format="$0"
                  isPositiveWhenUp={true}
                  refreshInterval={60000}
                />
              </DashboardGrid.Col>
            </DashboardGrid>
          </DashboardSection>

          {/* Charts Section */}
          <DashboardSection
            id="charts-section"
            title="Performance Charts"
            description="Detailed data visualizations"
            collapsible={true}
          >
            <DashboardGrid columns={12} gap="md">
              <DashboardGrid.Col span={{ xs: 12, lg: 8 }}>
                <ChartCard
                  id="revenue-chart"
                  title="Revenue Trends"
                  description="Monthly revenue for the past 12 months"
                  chartType="line"
                  chartData={{
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                  }}
                  showLegend={true}
                  interactive={true}
                  canSimplify={true}
                  refreshInterval={300000}
                  textAlternative="Revenue has increased by 23% year-over-year with Q2 showing the strongest growth at 28% compared to the same period last year."
                />
              </DashboardGrid.Col>

              <DashboardGrid.Col span={{ xs: 12, sm: 6, lg: 4 }}>
                <ChartCard
                  id="category-chart"
                  title="Sales by Category"
                  chartType="pie"
                  chartData={{
                    labels: ["Electronics", "Clothing", "Home", "Food"],
                  }}
                  showLegend={true}
                  interactive={false}
                  canSimplify={true}
                  refreshInterval={600000}
                />
              </DashboardGrid.Col>

              <DashboardGrid.Col span={{ xs: 12, sm: 6, lg: 6 }}>
                <ChartCard
                  id="visitors-chart"
                  title="Website Visitors"
                  chartType="bar"
                  chartData={{
                    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                  }}
                  showLegend={false}
                  interactive={true}
                  canSimplify={true}
                  refreshInterval={600000}
                />
              </DashboardGrid.Col>

              <DashboardGrid.Col span={{ xs: 12, lg: 6 }}>
                <ChartCard
                  id="conversion-chart"
                  title="Conversion Funnel"
                  chartType="bar"
                  chartData={{
                    labels: [
                      "Visits",
                      "Product Views",
                      "Add to Cart",
                      "Checkout",
                      "Purchase",
                    ],
                  }}
                  showLegend={false}
                  showDataLabels={true}
                  interactive={true}
                  canSimplify={true}
                  refreshInterval={900000}
                />
              </DashboardGrid.Col>
            </DashboardGrid>
          </DashboardSection>

          {/* Placeholder Section for more components */}
          <DashboardSection
            id="additional-section"
            title="Additional Dashboard Cards"
            description="Examples of other dashboard component types"
            collapsible={true}
          >
            <DashboardGrid columns={12} gap="md">
              <DashboardGrid.Col span={{ xs: 12, md: 12 }}>
                <Card>
                  <CardSection withBorder p="md">
                    <Text fw={600}>Dashboard Component Types</Text>
                  </CardSection>
                  <div style={{ padding: 16 }}>
                    <Text mb="md">
                      The dashboard system includes the following card types
                      that weren't fully implemented in this showcase:
                    </Text>
                    <ul style={{ paddingLeft: 20 }}>
                      <li>
                        <Text mb="xs">
                          List Card - For displaying vertical lists of items
                        </Text>
                      </li>
                      <li>
                        <Text mb="xs">
                          Table Card - For structured tabular data with sorting
                          and pagination
                        </Text>
                      </li>
                      <li>
                        <Text mb="xs">
                          Text Card - For documentation, markdown content, or
                          explanations
                        </Text>
                      </li>
                      <li>
                        <Text mb="xs">
                          Action Card - For user input prompts and action
                          buttons
                        </Text>
                      </li>
                      <li>
                        <Text mb="xs">
                          AI Insight Card - For displaying ML-generated business
                          insights
                        </Text>
                      </li>
                    </ul>
                    <Text mt="md" c="dimmed" fz="sm">
                      All components support network-aware optimizations for the
                      South African market, responsive layouts, and information
                      density controls.
                    </Text>
                  </div>
                </Card>
              </DashboardGrid.Col>
            </DashboardGrid>
          </DashboardSection>
        </DashboardLayout>
      </div>
    </SouthAfricanOptimizedContainer>
  );
}
