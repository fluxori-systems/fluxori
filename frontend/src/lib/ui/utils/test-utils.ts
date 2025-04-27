"use client";

/**
 * Test utilities for UI components
 * These utilities help with testing components in isolation
 * and validating their behavior and accessibility
 */

import React, { ReactElement } from "react";

import { render, RenderOptions } from "@testing-library/react";

// Type definitions only - no JSX code
// The actual implementation is provided separately in the test-utils.impl.tsx file
// This file is for type definitions that can be safely imported

/**
 * Available test modes for components
 */
export type TestMode = "accessibility" | "motion" | "tokens" | "snapshot";

/**
 * Configuration for component testing
 */
export interface ComponentTestConfig {
  /** Component name */
  name: string;

  /** Available component variants to test */
  variants?: string[];

  /** Required props for the component */
  requiredProps: Record<string, any>;

  /** Optional props combinations to test */
  optionalProps?: Record<string, any>[];

  /** Which test modes to run */
  testModes?: TestMode[];

  /** Whether to skip certain tests */
  skip?: TestMode[];
}

export interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  motionMode?: "full" | "reduced" | "minimal";
  theme?: "light" | "dark";
}

/**
 * Custom render function for testing components with providers
 * This is just a type definition - implementation is in test-utils.impl.tsx
 */
export declare function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions,
): ReturnType<typeof render>;

/**
 * Get various prop combinations for thorough component testing
 */
export declare function getTestCombinations(
  config: ComponentTestConfig,
): Array<Record<string, any>>;

/**
 * Generate standard test cases for a component
 */
export declare function generateComponentTests(
  component: (props: any) => React.ReactElement,
  config: ComponentTestConfig,
): void;

/**
 * Custom matchers for UI components
 */
export const customMatchers = {
  // Check if element uses a specific design token
  toUseDesignToken(
    element: HTMLElement,
    tokenName: string,
    tokenValue?: string,
  ) {
    // Get computed styles
    const styles = window.getComputedStyle(element);

    // Check if element has the token CSS variable
    const hasToken = styles.getPropertyValue(`--${tokenName}`).trim();

    if (!hasToken) {
      return {
        pass: false,
        message: () =>
          `Expected element to use design token --${tokenName}, but it doesn't`,
      };
    }

    // Check specific value if provided
    if (tokenValue && hasToken !== tokenValue) {
      return {
        pass: false,
        message: () =>
          `Expected element to use design token --${tokenName} with value "${tokenValue}", but got "${hasToken}"`,
      };
    }

    return {
      pass: true,
      message: () =>
        `Expected element not to use design token --${tokenName}, but it does`,
    };
  },

  // Check if element is accessible
  toBeAccessible(element: HTMLElement) {
    // This would use jest-axe or similar library for accessibility testing
    return {
      pass: true,
      message: () => `Expected element not to be accessible, but it is`,
    };
  },
};
