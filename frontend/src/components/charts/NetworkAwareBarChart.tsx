"use client";

import React, { useRef, useEffect, useMemo } from "react";

import { Chart, registerables } from "chart.js";

import { useNetworkAwareChart } from "../../hooks/useNetworkAwareChart";
import { Text } from "../../lib/ui/components/Text";
import {
  NetworkAwareBarChartProps,
  ChartDataPoint,
} from "../../types/chart.types";

// Register Chart.js components
Chart.register(...registerables);

/**
 * Network-aware bar chart component that adapts to connection quality
 * Implements the Agent-First Interface design philosophy with SA market optimization
 */
export function NetworkAwareBarChart<T extends ChartDataPoint>({
  data,
  xAxisDataKey,
  yAxisDataKey,
  colors,
  height = 300,
  width = "100%",
  responsive = true,
  margin = { top: 10, right: 30, left: 0, bottom: 30 },
  xAxisLabel,
  yAxisLabel,
  stacked = false,
  radius = 0,
  showDataLabels = false,
  noDataText = "No data available",
  textAlternative,
  forceConnectionQuality,
  hideOnPoorConnection = false,
  className,
}: NetworkAwareBarChartProps<T>) {
  // Get network-aware chart configuration
  const {
    shouldSimplify,
    showTextAlternative,
    animation,
    profileConfig,
    getOptimizedData,
    getDesignSystemColors,
  } = useNetworkAwareChart(forceConnectionQuality);

  // Reference to the canvas element
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  // Reference to the chart instance
  const chartInstance = useRef<Chart | null>(null);

  // Convert yAxisDataKey to array if it's a string
  const yKeys = useMemo(() => {
    return Array.isArray(yAxisDataKey) ? yAxisDataKey : [yAxisDataKey];
  }, [yAxisDataKey]);

  // Get colors from design system if not provided
  const chartColors = useMemo(() => {
    return colors || getDesignSystemColors(yKeys.length);
  }, [colors, getDesignSystemColors, yKeys.length]);

  // Optimize data for current network conditions
  const optimizedData = useMemo(() => {
    return getOptimizedData(data);
  }, [data, getOptimizedData]);

  // Create or update chart when data or configuration changes
  useEffect(() => {
    // If there's no canvas ref, or no data, don't create a chart
    if (!chartRef.current || !optimizedData || optimizedData.length === 0) {
      return;
    }

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Extract labels and datasets from optimizedData
    const labels = optimizedData.map((item) => String(item[xAxisDataKey]));

    // Create datasets for each y-axis key
    const datasets = yKeys.map((key, index) => ({
      label: String(key),
      data: optimizedData.map((item) => Number(item[key])),
      backgroundColor: chartColors[index % chartColors.length],
      borderColor: "var(--color-background-card)",
      borderWidth: 1,
      borderRadius: shouldSimplify ? 0 : radius,
      barPercentage: 0.8,
      categoryPercentage: stacked ? 0.9 : 0.8,
    }));

    // Create chart instance
    const ctx = chartRef.current.getContext("2d");
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: "bar",
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: animation.enabled ? animation.duration : 0,
            easing: animation.easing,
          } as const,
          interaction: {
            mode: "index",
            intersect: false,
          },
          scales: {
            x: {
              stacked: stacked,
              title: {
                display: Boolean(xAxisLabel),
                text: xAxisLabel || "",
                color: "var(--color-text-secondary)",
                font: {
                  size: 12,
                },
              },
              grid: {
                display: profileConfig.showGrid,
                color: "var(--color-border-light)",
                drawOnChartArea: true,
              },
              ticks: {
                maxRotation: shouldSimplify ? 0 : 45,
                autoSkip: true,
                maxTicksLimit: profileConfig.maxAxisLabels,
                color: "var(--color-text-secondary)",
                font: {
                  size: 12,
                },
              },
              border: {
                color: "var(--color-border-default)",
              },
            },
            y: {
              stacked: stacked,
              title: {
                display: Boolean(yAxisLabel),
                text: yAxisLabel || "",
                color: "var(--color-text-secondary)",
                font: {
                  size: 12,
                },
              },
              grid: {
                display: profileConfig.showGrid,
                color: "var(--color-border-light)",
                drawOnChartArea: true,
              },
              ticks: {
                autoSkip: true,
                maxTicksLimit: profileConfig.maxAxisLabels,
                color: "var(--color-text-secondary)",
                font: {
                  size: 12,
                },
              },
              border: {
                color: "var(--color-border-default)",
              },
            },
          },
          plugins: {
            legend: {
              display: !shouldSimplify || !profileConfig.simplifiedLegend,
              position: "bottom",
              labels: {
                color: "var(--color-text-primary)",
                font: {
                  size: 12,
                },
                boxWidth: 10,
                usePointStyle: true,
              },
            },
            tooltip: {
              enabled: profileConfig.showTooltips,
              backgroundColor: "var(--color-background-card)",
              borderColor: "var(--color-border-default)",
              borderWidth: 1,
              cornerRadius: 4,
              bodyFont: {
                size: 12,
              },
              titleFont: {
                size: 12,
                weight: "normal",
              },
              titleColor: "var(--color-text-secondary)",
              bodyColor: "var(--color-text-primary)",
              padding: 8,
            },
            // Data labels are implemented via a Chart.js plugin, in a real implementation
            // we would add a plugin for data labels when showDataLabels is true
          },
        },
      });
    }

    // Cleanup function to destroy chart on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [
    optimizedData,
    xAxisDataKey,
    yKeys,
    chartColors,
    xAxisLabel,
    yAxisLabel,
    radius,
    stacked,
    shouldSimplify,
    profileConfig,
    animation,
  ]);

  // If there's no data, show a message
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height,
          width: responsive ? "100%" : width,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--color-background-surface)",
          borderRadius: "var(--radius-md)",
          padding: "var(--spacing-md)",
        }}
        className={className}
      >
        <Text>{noDataText}</Text>
      </div>
    );
  }

  // If we should show text alternative or hide on poor connection
  if (
    (showTextAlternative && textAlternative) ||
    (hideOnPoorConnection && profileConfig.maxDataPoints <= 20)
  ) {
    return (
      <div
        style={{
          height,
          width: responsive ? "100%" : width,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--color-background-surface)",
          borderRadius: "var(--radius-md)",
          padding: "var(--spacing-md)",
        }}
        className={className}
      >
        <Text size="sm" style={{ marginBottom: "var(--spacing-sm)" }}>
          {textAlternative || "Chart visualization simplified to save data."}
        </Text>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--spacing-sm)",
          }}
        >
          {yKeys.map((key, index) => (
            <div
              key={key as string}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: chartColors[index],
                  borderRadius: 2,
                }}
              />
              <Text size="xs">{key as string}</Text>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Return the chart
  return (
    <div
      style={{
        height,
        width: responsive ? "100%" : width,
        position: "relative",
        padding: `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`,
      }}
      className={className}
    >
      <canvas ref={chartRef}></canvas>
    </div>
  );
}
