"use client";

import React, { forwardRef, useState, useEffect } from "react";

import {
  DashboardDensity,
  DashboardLayoutConfig,
} from "../../../design-system/types/dashboard";
import { useSouthAfricanMarketOptimizations } from "../../../shared/hooks/useSouthAfricanMarketOptimizations";
import { Button } from "../../components/Button";
import { useConnectionQuality } from "../../hooks/useConnection";

export interface DashboardLayoutProps {
  /** Dashboard children */
  children: React.ReactNode;

  /** Default data density */
  defaultDensity?: DashboardDensity;

  /** Whether to show density controls */
  showDensityControls?: boolean;

  /** Current layout config */
  layoutConfig?: DashboardLayoutConfig;

  /** Callback when layout config changes */
  onLayoutConfigChange?: (config: DashboardLayoutConfig) => void;

  /** Whether to enable network-aware optimizations */
  networkAware?: boolean;

  /** Additional class name */
  className?: string;

  /** Additional style object */
  style?: React.CSSProperties;
}

/**
 * DashboardLayout component provides the top-level container for a dashboard.
 * It manages density controls, layout persistence, and network-aware optimizations.
 */
export const DashboardLayout = forwardRef<HTMLDivElement, DashboardLayoutProps>(
  (
    {
      children,
      defaultDensity = "comfortable",
      showDensityControls = true,
      layoutConfig,
      onLayoutConfigChange,
      networkAware = true,
      className = "",
      style,
    },
    ref,
  ) => {
    const [density, setDensity] = useState<DashboardDensity>(
      layoutConfig?.density || defaultDensity,
    );
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>(
      layoutConfig?.collapsed || {},
    );
    const { quality, isDataSaver } = useConnectionQuality();
    const { shouldReduceMotion, shouldReduceDataUsage } =
      useSouthAfricanMarketOptimizations();

    // Initialize layout state from props
    useEffect(() => {
      if (layoutConfig) {
        setDensity(layoutConfig.density);
        setCollapsed(layoutConfig.collapsed);
      }
    }, [layoutConfig]);

    // For poor connections or data saver mode, force compact layout
    useEffect(() => {
      if (
        networkAware &&
        (quality === "poor" || isDataSaver) &&
        shouldReduceDataUsage
      ) {
        setDensity("compact");
      }
    }, [networkAware, quality, isDataSaver, shouldReduceDataUsage]);

    // Toggle density
    const toggleDensity = () => {
      const newDensity = density === "compact" ? "comfortable" : "compact";
      setDensity(newDensity);

      // Update layout config
      if (onLayoutConfigChange && layoutConfig) {
        onLayoutConfigChange({
          ...layoutConfig,
          density: newDensity,
        });
      }
    };

    // Handle section collapse
    const handleSectionToggle = (sectionId: string, isCollapsed: boolean) => {
      setCollapsed((prev) => ({
        ...prev,
        [sectionId]: isCollapsed,
      }));

      // Update layout config
      if (onLayoutConfigChange && layoutConfig) {
        onLayoutConfigChange({
          ...layoutConfig,
          collapsed: {
            ...layoutConfig.collapsed,
            [sectionId]: isCollapsed,
          },
        });
      }
    };

    // Inject props into children
    const childrenWithProps = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        // Check if it's a dashboard section
        if (
          child.type &&
          (child.type as any).displayName === "DashboardSection"
        ) {
          const sectionId = child.props.id;
          const isCollapsed = collapsed[sectionId] || false;

          // Create props for section
          const sectionProps: Partial<any> = {
            collapsed: isCollapsed,
            onToggleCollapse: handleSectionToggle,
            networkAware,
          };

          // Only pass density if component accepts it
          if ("density" in child.props || child.props.density !== undefined) {
            sectionProps.density = density;
          }

          return React.cloneElement(child, sectionProps);
        }

        // For other components, don't pass props
        return child;
      }
      return child;
    });

    return (
      <div
        ref={ref}
        className={`dashboard-layout density-${density} ${className}`}
        data-density={density}
        data-network-quality={quality}
        style={{
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
          ...style,
        }}
      >
        {/* Dashboard Controls */}
        {showDensityControls && (
          <div
            className="dashboard-controls"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "var(--spacing-md)",
              gap: "var(--spacing-sm)",
            }}
          >
            {/* Don't show density toggle on poor connections */}
            {!(
              networkAware &&
              (quality === "poor" || isDataSaver) &&
              shouldReduceDataUsage
            ) && (
              <Button
                variant="light"
                size="sm"
                onClick={toggleDensity}
                title={`Switch to ${density === "compact" ? "comfortable" : "compact"} view`}
                aria-label={`Switch to ${density === "compact" ? "comfortable" : "compact"} view`}
                disabled={
                  networkAware &&
                  (quality === "poor" || isDataSaver) &&
                  shouldReduceDataUsage
                }
              >
                {density === "compact" ? "Comfortable View" : "Compact View"}
              </Button>
            )}

            {/* Network quality indicator on poor connections */}
            {networkAware && (quality === "poor" || isDataSaver) && (
              <div
                className="network-quality-indicator"
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-warning-base)",
                  gap: "var(--spacing-xs)",
                  padding: "0 var(--spacing-xs)",
                }}
              >
                ⚠️ {isDataSaver ? "Data Saver Mode" : "Low Bandwidth Mode"}
              </div>
            )}
          </div>
        )}

        {/* Dashboard Content */}
        <div
          className="dashboard-content"
          style={{
            display: "flex",
            flexDirection: "column",
            gap:
              density === "compact" ? "var(--spacing-md)" : "var(--spacing-lg)",
          }}
        >
          {childrenWithProps}
        </div>
      </div>
    );
  },
);

DashboardLayout.displayName = "DashboardLayout";
