"use client";

import { useState, useEffect } from "react";

import { useTheme } from "../theme/ThemeContext";

/**
 * Custom hook for responsive media queries
 * @param query The media query to watch
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Initial check
    const media = window.matchMedia(query);
    setMatches(media.matches);

    // Function to update matches
    const updateMatches = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add listener for changes
    media.addEventListener("change", updateMatches);

    // Clean up
    return () => {
      media.removeEventListener("change", updateMatches);
    };
  }, [query]);

  return matches;
}

/**
 * Alias for common breakpoint media queries
 * @param breakpoint The breakpoint to check (sm, md, lg, xl, etc.)
 * @param direction 'up' (matches >= breakpoint) or 'down' (matches < breakpoint)
 * @returns Boolean indicating if the breakpoint criteria is met
 */
export function useBreakpoint(
  breakpoint: "xs" | "sm" | "md" | "lg" | "xl" | "2xl",
  direction: "up" | "down" = "up",
): boolean {
  const { tokens } = useTheme();
  const breakpointValue = parseInt(tokens.breakpoints[breakpoint], 10);

  const query =
    direction === "up"
      ? `(min-width: ${breakpointValue}px)`
      : `(max-width: ${breakpointValue - 1}px)`;

  return useMediaQuery(query);
}

/**
 * Hook to get a value based on the current breakpoint
 * @param values Object with breakpoint keys and corresponding values
 * @returns The value for the current breakpoint
 */
export function useResponsiveValue<T>(values: {
  base?: T;
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  "2xl"?: T;
}): T | undefined {
  const isMobile = useBreakpoint("xs", "up");
  const isSm = useBreakpoint("sm", "up");
  const isMd = useBreakpoint("md", "up");
  const isLg = useBreakpoint("lg", "up");
  const isXl = useBreakpoint("xl", "up");
  const is2Xl = useBreakpoint("2xl", "up");

  // Default to base
  let value = values.base;

  // Override with the largest matching breakpoint
  if (isMobile && values.xs !== undefined) value = values.xs;
  if (isSm && values.sm !== undefined) value = values.sm;
  if (isMd && values.md !== undefined) value = values.md;
  if (isLg && values.lg !== undefined) value = values.lg;
  if (isXl && values.xl !== undefined) value = values.xl;
  if (is2Xl && values["2xl"] !== undefined) value = values["2xl"];

  return value;
}
