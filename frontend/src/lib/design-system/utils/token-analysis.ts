"use client";

/**
 * Token Analysis Utilities
 *
 * Tools for analyzing and tracking design system token usage
 * across components. This enables better consistency and
 * helps identify opportunities for optimization.
 */

import { useState, useEffect } from "react";

export interface TokenUsage {
  /** Token name */
  token: string;

  /** Count of usages */
  count: number;

  /** Components using this token */
  components: Set<string>;
}

interface TokenRegistry {
  /** All token usages, mapped by token name */
  tokens: Record<string, TokenUsage>;

  /** Register a token usage */
  registerUsage: (token: string, component: string) => void;

  /** Get all token usages */
  getAll: () => TokenUsage[];

  /** Get token usage by component */
  getByComponent: (component: string) => TokenUsage[];

  /** Get token usage metrics */
  getMetrics: () => TokenMetrics;

  /** Output token usage report */
  report: () => string;
}

interface TokenMetrics {
  /** Total unique tokens used */
  uniqueTokens: number;

  /** Total token usages */
  totalUsages: number;

  /** Top used tokens */
  topTokens: TokenUsage[];

  /** Unused tokens */
  unusedTokens: string[];

  /** Inconsistently used tokens */
  inconsistentTokens: string[];
}

/**
 * Global design token registry for tracking token usage
 */
let tokenRegistry: Record<string, TokenUsage> = {};

/**
 * Components that have registered tokens
 */
let registeredComponents: Set<string> = new Set();

/**
 * All available design tokens (populated at runtime)
 */
let availableTokens: Set<string> = new Set();

/**
 * Registry version for tracking changes
 */
let registryVersion = 0;

/**
 * Register a token usage
 *
 * @param token Token name
 * @param component Component name
 */
export function registerTokenUsage(token: string, component: string): void {
  // Create token entry if it doesn't exist
  if (!tokenRegistry[token]) {
    tokenRegistry[token] = {
      token,
      count: 0,
      components: new Set(),
    };
  }

  // Update token usage
  tokenRegistry[token].count++;
  tokenRegistry[token].components.add(component);

  // Register component
  registeredComponents.add(component);

  // Increment version
  registryVersion++;
}

/**
 * Get all token usages
 */
export function getAllTokenUsages(): TokenUsage[] {
  return Object.values(tokenRegistry);
}

/**
 * Get token usages by component
 *
 * @param component Component name
 */
export function getTokenUsagesByComponent(component: string): TokenUsage[] {
  return Object.values(tokenRegistry).filter((usage) =>
    usage.components.has(component),
  );
}

/**
 * Calculate token metrics
 */
export function getTokenMetrics(): TokenMetrics {
  const allTokens = getAllTokenUsages();
  const sortedByCount = [...allTokens].sort((a, b) => b.count - a.count);

  // Find unused tokens
  const unusedTokens = Array.from(availableTokens).filter(
    (token) => !tokenRegistry[token],
  );

  // Find inconsistently used tokens (used by some components but not others)
  const inconsistentTokens = Object.values(tokenRegistry)
    .filter((usage) => usage.components.size < registeredComponents.size / 2) // Used by less than half of components
    .map((usage) => usage.token);

  return {
    uniqueTokens: allTokens.length,
    totalUsages: allTokens.reduce((sum, usage) => sum + usage.count, 0),
    topTokens: sortedByCount.slice(0, 10),
    unusedTokens,
    inconsistentTokens,
  };
}

/**
 * Generate token usage report
 */
export function generateTokenReport(): string {
  const metrics = getTokenMetrics();
  const report = [
    "# Design Token Usage Report",
    "",
    `Total Unique Tokens: ${metrics.uniqueTokens}`,
    `Total Token Usages: ${metrics.totalUsages}`,
    "",
    "## Top 10 Tokens",
    ...metrics.topTokens.map(
      (usage) =>
        `- ${usage.token}: ${usage.count} usages in ${usage.components.size} components`,
    ),
    "",
    "## Unused Tokens",
    ...metrics.unusedTokens.map((token) => `- ${token}`),
    "",
    "## Inconsistently Used Tokens",
    ...metrics.inconsistentTokens.map((token) => {
      const usage = tokenRegistry[token];
      return `- ${token}: Used in ${usage.components.size} of ${registeredComponents.size} components`;
    }),
    "",
    "## Components Analyzed",
    ...Array.from(registeredComponents).sort(),
  ];

  return report.join("\n");
}

/**
 * Hook for tracking token usage in a component
 *
 * @param componentName Component name
 */
export function useTokenTracking(componentName: string): {
  trackToken: (token: string) => void;
  usages: TokenUsage[];
  registryVersion: number;
} {
  const [usages, setUsages] = useState<TokenUsage[]>([]);
  const [version, setVersion] = useState(registryVersion);

  // Track token usage
  const trackToken = (token: string) => {
    registerTokenUsage(token, componentName);
    setVersion(registryVersion);
  };

  // Update usages when registry changes
  useEffect(() => {
    setUsages(getTokenUsagesByComponent(componentName));
  }, [componentName, version]);

  return {
    trackToken,
    usages,
    registryVersion: version,
  };
}

/**
 * Set available tokens for analysis
 *
 * @param tokens Available tokens
 */
export function setAvailableTokens(tokens: string[]): void {
  availableTokens = new Set(tokens);
}

/**
 * Register default design system tokens
 */
export function registerDefaultTokens(): void {
  // Import and register all tokens
  import("../tokens")
    .then((tokens) => {
      const allTokens: string[] = [];

      // Add color tokens
      if (tokens.lightModeColors) {
        Object.keys(tokens.lightModeColors).forEach((colorKey) => {
          const colorGroup = (tokens.lightModeColors as any)[colorKey];

          if (typeof colorGroup === "object") {
            // Handle scale colors like primary-100, primary-200, etc.
            Object.keys(colorGroup).forEach((scale) => {
              allTokens.push(`--color-${colorKey}-${scale}`);
            });
          } else {
            // Handle flat colors
            allTokens.push(`--color-${colorKey}`);
          }
        });
      }

      // Add spacing tokens
      if (tokens.spacing) {
        Object.keys(tokens.spacing).forEach((size) => {
          allTokens.push(`--spacing-${size}`);
        });
      }

      // Add typography tokens
      if (tokens.typography?.fontSizes) {
        Object.keys(tokens.typography.fontSizes).forEach((size) => {
          allTokens.push(`--font-size-${size}`);
        });
      }

      if (tokens.typography?.fontWeights) {
        Object.keys(tokens.typography.fontWeights).forEach((weight) => {
          allTokens.push(`--font-weight-${weight}`);
        });
      }

      if (tokens.typography?.lineHeights) {
        Object.keys(tokens.typography.lineHeights).forEach((lineHeight) => {
          allTokens.push(`--line-height-${lineHeight}`);
        });
      }

      // Add radius tokens
      if (tokens.radii) {
        Object.keys(tokens.radii).forEach((size) => {
          allTokens.push(`--radius-${size}`);
        });
      }

      // Add shadow tokens
      if (tokens.lightShadows) {
        Object.keys(tokens.lightShadows).forEach((size) => {
          allTokens.push(`--shadow-${size}`);
        });
      }

      // Set available tokens
      setAvailableTokens(allTokens);
    })
    .catch((error) => {
      console.error("Failed to register default tokens:", error);
    });
}

// Auto-register tokens in browsers
if (typeof window !== "undefined") {
  registerDefaultTokens();
}
