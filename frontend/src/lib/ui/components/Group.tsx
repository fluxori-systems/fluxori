"use client";

import React, { forwardRef, useRef, useEffect, useState } from "react";

import { Group as MantineGroup, useMantineTheme } from "@mantine/core";

import { SpacingScale } from "../../design-system/types/tokens";
import { getSpacingFromMantine } from "../../design-system/utils/mantine-theme-adapter";
import { useTokenTracking } from "../../design-system/utils/token-analysis";

// Import from shared modules to avoid circular dependencies
import { useCombinedRefs } from "../../shared/utils/ref-utils";
import { useComponentAnimation } from "../hooks/useComponentAnimation";
import { useConnectionQuality, useNetworkAware } from "../hooks/useConnection";
import {
  BaseComponentProps,
  Spacing,
  AnimatableComponentProps,
} from "../types";

// Define appropriate justify content values for TypeScript safety
type JustifyContent =
  | "flex-start"
  | "flex-end"
  | "center"
  | "space-between"
  | "space-around"
  | "space-evenly";

// Legacy position values
type Position = "left" | "center" | "right" | "apart";

export interface GroupProps
  extends BaseComponentProps,
    AnimatableComponentProps {
  /** Gap between elements (modern prop) */
  gap?: Spacing;

  /** Legacy spacing prop (mapped to gap) */
  spacing?: Spacing;

  /** Horizontal content alignment (modern prop) */
  justify?: JustifyContent;

  /** Legacy position prop (mapped to justify) */
  position?: Position;

  /** Vertical alignment */
  align?: "stretch" | "center" | "flex-start" | "flex-end";

  /** Wrap elements */
  wrap?: "wrap" | "nowrap" | "wrap-reverse";

  /** Force grow elements to the same width */
  grow?: boolean;

  /** Prevent elements from shrinking below their initial size */
  preventGrowOverflow?: boolean;

  /** Enable network-aware optimizations */
  networkAware?: boolean;
}

/**
 * Group component with proper TypeScript typing,
 * design token integration, and legacy prop support
 */
export const Group = forwardRef<HTMLDivElement, GroupProps>(
  (
    {
      children,
      spacing,
      gap: gapProp,
      position,
      justify: justifyProp,
      animated = false,
      animationType = "fade",
      animationDelay = 0,
      animationSpeed = 1.0,
      networkAware = true,
      ...props
    },
    ref,
  ) => {
    const groupRef = useRef<HTMLDivElement>(null);
    const tokenTracking = useTokenTracking("Group");
    const theme = useMantineTheme();
    const connectionQuality = useConnectionQuality();
    const [isVisible, setIsVisible] = useState(false);

    // Map legacy props to Mantine v7 props
    const inputGap = spacing !== undefined ? spacing : gapProp;
    const justify =
      position !== undefined ? mapPositionToJustify(position) : justifyProp;

    // Track token usage
    useEffect(() => {
      if (typeof inputGap === "string" && inputGap !== "auto") {
        tokenTracking.trackToken(`spacing-${inputGap}`);
      }
    }, [inputGap, tokenTracking]);

    // Convert string spacing to design tokens
    let gap = inputGap;
    if (typeof inputGap === "string" && inputGap !== "auto") {
      gap = getSpacingFromMantine(
        theme,
        inputGap as keyof SpacingScale,
        undefined,
      );
    }

    // Use network-aware animation speed
    const networkAnimationSpeed = useNetworkAware({
      highQuality: animationSpeed,
      mediumQuality: animationSpeed * 0.8,
      lowQuality: animationSpeed * 0.6,
      poorQuality: animationSpeed * 0.4,
      dataSaverMode: animationSpeed * 0.3,
    });

    // Apply gap optimization for slower connections
    if (
      networkAware &&
      (connectionQuality.isDataSaver || connectionQuality.quality === "poor")
    ) {
      // Simplify gap for better performance on slow devices
      if (typeof inputGap === "string") {
        switch (inputGap) {
          case "xl":
            gap = getSpacingFromMantine(theme, "lg", undefined);
            tokenTracking.trackToken("network-optimize-spacing");
            break;
          case "lg":
            gap = getSpacingFromMantine(theme, "md", undefined);
            tokenTracking.trackToken("network-optimize-spacing");
            break;
        }
      }
    }

    // Apply animation through shared animation service
    useEffect(() => {
      setIsVisible(true);
    }, []);

    useComponentAnimation({
      ref: groupRef,
      enabled: animated,
      mode: animationType as any,
      isActive: isVisible,
      networkAware,
      durationMultiplier: networkAware ? networkAnimationSpeed : animationSpeed,
      properties: {
        delay: animationDelay / 1000, // Convert ms to seconds
      },
    });

    return (
      <MantineGroup
        ref={useCombinedRefs(ref, groupRef)}
        gap={gap}
        justify={justify}
        {...props}
      >
        {children}
      </MantineGroup>
    );
  },
);

// Helper to map legacy position to justify
function mapPositionToJustify(position: Position): JustifyContent {
  switch (position) {
    case "left":
      return "flex-start";
    case "right":
      return "flex-end";
    case "apart":
      return "space-between";
    case "center":
      return "center";
    default:
      return "flex-start";
  }
}

Group.displayName = "Group";
