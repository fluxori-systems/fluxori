"use client";

import React, { forwardRef } from "react";

import { DashboardCard, BaseDashboardCardProps } from "./DashboardCard";
import { MetricCardProps } from "../../../design-system/types/dashboard";
import { useSouthAfricanMarketOptimizations } from "../../../shared/hooks/useSouthAfricanMarketOptimizations";
import { Text } from "../../components/Text";
import { useConnectionQuality } from "../../hooks/useConnection";

export interface DashboardMetricCardProps
  extends Omit<BaseDashboardCardProps, "type">,
    Omit<MetricCardProps, keyof BaseDashboardCardProps> {}

/**
 * MetricCard component for displaying KPIs (Key Performance Indicators)
 * with optional trend indicators, previous value comparisons, and sparklines.
 * Optimized for South African network conditions with simplified views for
 * poor connections.
 */
export const MetricCard = forwardRef<HTMLDivElement, DashboardMetricCardProps>(
  (
    {
      id,
      title,
      description,
      value,
      previousValue,
      percentChange,
      isPositiveWhenUp = true,
      format,
      icon,
      sparklineData,
      ...rest
    },
    ref,
  ) => {
    const { quality, isDataSaver } = useConnectionQuality();
    const { shouldReduceDataUsage } = useSouthAfricanMarketOptimizations();

    // Format the value
    const formatValue = (val: number | string): string => {
      if (typeof val === "string") return val;

      // If format is provided and we're not in a low resource mode, use it
      if (
        format &&
        !(shouldReduceDataUsage && (quality === "poor" || isDataSaver))
      ) {
        // Simple formatting logic (in a real app would use a library like numeral.js)
        if (format.includes("%")) {
          return `${val.toFixed(1)}%`;
        }
        if (format.includes("$")) {
          return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return val.toLocaleString("en-US");
      }

      // Basic formatting otherwise
      return val.toLocaleString("en-US");
    };

    // Determine trend direction
    const getTrendIndicator = () => {
      if (percentChange === undefined || percentChange === 0) return null;

      const isPositive = percentChange > 0;
      const isGood =
        (isPositive && isPositiveWhenUp) || (!isPositive && !isPositiveWhenUp);

      return {
        icon: isPositive ? "▲" : "▼",
        color: isGood ? "green" : "red",
        label: `${isPositive ? "+" : ""}${percentChange.toFixed(1)}%`,
      };
    };

    const trendIndicator = getTrendIndicator();

    // Simplified view for poor connections
    if (shouldReduceDataUsage && (quality === "poor" || isDataSaver)) {
      return (
        <DashboardCard
          ref={ref}
          id={id}
          title={title}
          description={description}
          type="metric"
          {...rest}
        >
          <div style={{ padding: "var(--spacing-xs)" }}>
            <Text size="xl" fw={700}>
              {formatValue(value)}
            </Text>

            {trendIndicator && (
              <Text size="sm" c={trendIndicator.color as any} mt="xs">
                {trendIndicator.icon} {trendIndicator.label}
              </Text>
            )}
          </div>
        </DashboardCard>
      );
    }

    // Full featured view
    return (
      <DashboardCard
        ref={ref}
        id={id}
        title={title}
        description={description}
        type="metric"
        {...rest}
      >
        <div
          style={{
            padding:
              rest.density === "compact"
                ? "var(--spacing-xs)"
                : "var(--spacing-sm)",
          }}
        >
          {/* Main metric value */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-sm)",
              marginBottom: "var(--spacing-xs)",
            }}
          >
            {icon && <div className="metric-icon">{icon}</div>}

            <Text size="2xl" fw={700} style={{ lineHeight: 1.1 }}>
              {formatValue(value)}
            </Text>
          </div>

          {/* Previous value comparison */}
          {(previousValue !== undefined || percentChange !== undefined) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-xs)",
                marginTop: "var(--spacing-xs)",
              }}
            >
              {previousValue !== undefined && (
                <Text size="sm" c="dimmed">
                  Previous: {formatValue(previousValue)}
                </Text>
              )}

              {trendIndicator && (
                <Text size="sm" c={trendIndicator.color as any} fw={500}>
                  {trendIndicator.icon} {trendIndicator.label}
                </Text>
              )}
            </div>
          )}

          {/* Sparkline chart - we'd use a real chart library here */}
          {sparklineData &&
            sparklineData.length > 0 &&
            !shouldReduceDataUsage && (
              <div
                className="metric-sparkline"
                style={{
                  height: 30,
                  marginTop: "var(--spacing-sm)",
                  background: "var(--color-background-surface)",
                  borderRadius: "var(--radius-sm)",
                  padding: "var(--spacing-xs)",
                }}
              >
                {/* Placeholder for actual chart component */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    fontSize: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Sparkline Chart
                </div>
              </div>
            )}
        </div>
      </DashboardCard>
    );
  },
);

MetricCard.displayName = "MetricCard";
